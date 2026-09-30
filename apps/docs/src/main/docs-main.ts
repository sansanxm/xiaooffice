import { createHash, randomUUID } from 'node:crypto'
import { handOffBytes } from './byte-handoff'
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, extname, isAbsolute, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  BrowserWindow,
  Menu,
  WebContentsView,
  app,
  clipboard,
  dialog,
  ipcMain,
  nativeImage,
  net,
  session,
  shell,
  webContents,
} from 'electron'
import {
  appMenuLabels,
  buildPrintableHtml,
  configuredDefaultSaveDir,
  contextMenuLabels,
  fetchRemoteImage,
  installContextMenu,
  setContextMenuInterceptor,
  installNavigationGuard,
  isHeadlessMode,
  printHtmlToPdf,
  safeExternalUrl,
  saveAsSuggestion,
  saveImageFromUrl,
  showOpenDialogWithMemory,
  showSaveDialogWithMemory,
  aboutMenuItem,
  checkUpdatesMenuItem,
  toggleDevToolsItem,
  windowMenuTemplate,
  type HeadlessExportFormat,
  type HeadlessExportTarget,
  installRendererProtocol,
  registerRendererScheme,
  rendererUrl,
  MAX_REMOTE_IMAGE_BYTES,
  readBodyCapped,
  writeJsonAtomic,
} from '@genoffice/electron-utils'
import { configureMetricsCache, familyVerticalMetrics } from '@genoffice/font-metrics'
import { createI18n, getUiLang, normalizeLang, setUiLang } from '@genoffice/i18n'
import { ProjectStore } from '@genoffice/project-store'
import type {
  IpcMainInvokeEvent,
  MenuItemConstructorOptions,
  OpenDialogOptions,
  SaveDialogOptions,
  WebContents,
} from 'electron'
import { parseFileToText } from '@genoffice/file-parse'
import { convertHtmlToDocx } from '../../../../packages/html2docx/src'
import { ElectronBrowserDriver } from '../../../../packages/html2docx/src/drivers/electron'
import {
  AiCreditsError,
  AiTimeoutError,
  isAiNetworkError,
  isAiOverloadedError,
  chatForProvider,
  defaultAiSettings,
  activeProvider,
  testMediaProvider,
  type AiMediaProviderConfig,
  type AiMediaProviderId,
  type AiSearchProviderId,
  resolveAiSettings,
  maxOutputTokensOf,
  setAiUserAgent,
  setRescueFetch,
  streamForProvider,
  type AiChatRequest,
  type AiSettings,
  type AiStreamChunk,
  type AiStreamRequest,
  type GenSparkAccountStatus,
  type LegacyAiSettings,
} from '@genoffice/ai-provider'
import { listCodexModels, shutdownCodexAppServers } from '@genoffice/ai-provider/codex-app-server'
import { listCustomModelsForIpc } from '@genoffice/ai-provider/custom-models'
import {
  ensureGenofficeLogin,
  gskApiKey,
  generateImageTool,
  testSearchProvider,
  gskLoginInfo,
  hasGskAuth,
  webSearchTool,
  imageSearchTool,
  analyzeMediaTool,
} from '@genoffice/ai-search'
import type {
  AiDocContent,
  AttachmentAddResult,
  AttachmentImageResult,
  AttachmentMeta,
  AttachmentReadResult,
  ContextMenuRequest,
  CreateDocumentRequest,
  CreateDocumentResult,
  DecryptOpenResult,
  DocsPrintOptions,
  DocsTabInfo,
  MenuCommand,
  OpenDocxResult,
  SpellLanguages,
} from '../shared/ipc'
import { ATTACHMENT_IMAGE_EXTS } from '../shared/ipc'
import { ClickClaims } from '../shared/context-menu-claims'
import { findDocxPath } from '../shared/open-file'
import { atomicWriteFile, looksLikeZip } from './atomic-write'
import {
  adoptLazyMediaHashes,
  forgetLazyMediaOwner,
  materializeLazyDocx,
  moveLazyMediaSource,
  openLazyDocx,
  pointLazyMediaAt,
  readLazyMedia,
  registerLazyMediaProtocol,
} from './lazy-media'
import { inlineLazyMediaInHtml } from './lazy-media-inline'
import {
  commitDocPasswordSave,
  currentDocPasswordIntentRevision,
  decryptDocx,
  decryptRecoveryCopy,
  discardDocPasswordIntents,
  DocxDecryptError,
  docPasswordFor,
  encryptDocx,
  forgetDocPasswords,
  isEncryptedDocx,
  markDiskEncrypted,
  prepareRecoveryDocx,
  rememberDocPassword,
  renameDocPassword,
  setDocPassword,
  snapshotDocPassword,
} from './docx-encryption'
import { isExternallyModified, type DiskFileState } from './external-change'
import { copyImageDisplaySize, validCopyImageDataUrl } from './copy-image-guard'
import { printScaleOption, validPrintDim, validPrintScale } from './print-args'
import { initDocsAutoUpdater } from './updater'
import { registerZoteroIpc, teardownZoteroIpc } from './zotero-ipc'

/**
 * Docs main-process logic as an embeddable module: no top-level side effects.
 * Standalone mode (apps/docs entry) calls startDocsStandalone(); the unified
 * shell (apps/shell) instead calls configureDocsRuntime() + registerDocsIpc()
 * + createDocsWindow() and owns the app lifecycle itself.
 */

const isDev = !!process.env.ELECTRON_RENDERER_URL

const tMain = createI18n({
  vi: {
    dlgOpenDoc: 'Mở tài liệu',
    filterWord: 'Tài liệu Word',
    dlgSaveAs: 'Lưu dưới dạng',
    closeUnsavedMsg: 'Tài liệu này có các thay đổi chưa lưu.',
    closeUnsavedDetail: 'Bạn có muốn lưu trước khi đóng không?',
    closeNoReplyMsg: 'Tài liệu không phản hồi, có thể có thay đổi chưa lưu.',
    closeNoReplyDetail: 'Bạn vẫn muốn đóng chứ? Các thay đổi chưa lưu sẽ bị mất.',
    btnCloseAnyway: 'Vẫn đóng',
    autosaveFoundTitle: 'Tìm thấy bản tự động phục hồi',
    autosaveFoundBody: 'Phiên làm việc trước có thay đổi chưa lưu. Bạn có muốn phục hồi bản tự động lưu không?',
    autosaveRestore: 'Phục hồi',
    autosaveDiscard: 'Hủy bỏ',
    btnDontSave: 'Không lưu',
    btnCancel: 'Hủy',
    extModifiedMsg: 'Tệp đã bị thay đổi bởi chương trình khác.',
    extModifiedDetail: 'Bạn vẫn muốn lưu và ghi đè các thay đổi trên đĩa chứ?',
    btnOverwrite: 'Ghi đè',
    dlgInsertImage: 'Chèn hình ảnh',
    filterImages: 'Hình ảnh',
    dlgAddAttachment: 'Thêm tệp đính kèm',
    filterSupported: 'Tệp được hỗ trợ',
    filterAll: 'Tất cả các tệp',
    dlgExportPdf: 'Xuất sang PDF',
    dlgExportHtml: 'Xuất sang HTML',
    dlgPickExportDir: 'Chọn thư mục xuất',
    errUnsupportedExt: 'Chưa hỗ trợ định dạng .{ext}',
    errNotFile: 'Không phải là tệp',
    errTooLarge: 'Vượt quá giới hạn {mb}MB',
    errImageTooLarge: 'Hình ảnh vượt quá giới hạn 5MB',
    errUnreadable: 'Không thể đọc tệp',
    errFileTooLarge: 'Tệp vượt quá kích thước cho phép',
    errParseFailed: 'Phân tích cú pháp tệp thất bại',
    errImageNoText: 'Tệp hình ảnh đính kèm không có văn bản, đã gửi dưới dạng ảnh kèm tin nhắn của bạn',
    errNotImage: 'Không phải loại hình ảnh được hỗ trợ',
    errGskNotLoggedIn: 'Chưa kết nối AI: vui lòng vào Cài đặt → Mô hình AI để nhập API Key',
    errNoApiKey: 'Chưa cấu hình API Key cho {provider}. Vui lòng vào Cài đặt → Mô hình AI để nhập API Key (lấy miễn phí tại Google AI Studio: aistudio.google.com).',
    errAiBusy: 'Dịch vụ AI đạt giới hạn tốc độ (Rate Limit / 429) hoặc đang bận, vui lòng thử lại sau',
    errNoModel: 'Chưa cấu hình tên mô hình',
    menuFile: 'Tệp',
    menuNewDoc: 'Tài liệu mới',
    menuNewWindow: 'Cửa sổ mới',
    menuOpen: 'Mở…',
    menuOpenRecent: 'Mở tài liệu gần đây',
    menuNoRecent: 'Không có tài liệu gần đây',
    menuClose: 'Đóng',
    menuSave: 'Lưu',
    menuSaveAs: 'Lưu dưới dạng…',
    menuPageSetup: 'Thiết lập trang…',
    menuExportPdf: 'Xuất sang PDF…',
    menuExportHtml: 'Xuất sang HTML…',
    menuExportImages: 'Xuất sang hình ảnh…',
    menuPrint: 'In…',
    menuEdit: 'Chỉnh sửa',
    menuUndo: 'Hoàn tác',
    menuRedo: 'Làm lại',
    menuCut: 'Cắt',
    menuCopy: 'Sao chép',
    menuPaste: 'Dán',
    menuPasteMatch: 'Dán và khớp định dạng',
    menuFindReplace: 'Tìm kiếm và Thay thế…',
    menuGoTo: 'Đi đến…',
    menuSelectAll: 'Chọn tất cả',
    menuView: 'Xem',
    menuZoom: 'Thu phóng',
    menuZoomIn: 'Phóng to',
    menuZoomOut: 'Thu nhỏ',
    menuZoom100: 'Kích thước thực (100%)',
    menuPageWidth: 'Độ rộng trang',
    menuWholePage: 'Toàn bộ trang',
    menuAiSidebar: 'Thanh bên AI',
    menuDarkMode: 'Giao diện tối',
    menuFullscreen: 'Toàn màn hình',
    menuInsert: 'Chèn',
    menuInsertTable: 'Bảng…',
    menuInsertImage: 'Hình ảnh…',
    menuInsertPageBreak: 'Ngắt trang',
    menuInsertLink: 'Siêu liên kết…',
    menuInsertEquation: 'Công thức toán…',
    menuComment: 'Nhận xét',
    menuFormat: 'Định dạng',
    menuBold: 'In đậm',
    menuItalic: 'In nghiêng',
    menuUnderline: 'Gạch chân',
    menuAlign: 'Căn lề',
    menuAlignLeft: 'Căn trái',
    menuAlignCenter: 'Căn giữa',
    menuAlignRight: 'Căn phải',
    menuAlignJustify: 'Căn đều hai bên',
    menuFont: 'Phông chữ…',
    menuParagraph: 'Đoạn văn…',
    menuTools: 'Công cụ',
    menuTable: 'Bảng',
    menuTableInsert: 'Chèn',
    menuTableInsertTable: 'Bảng…',
    menuTableColsLeft: 'Chèn cột bên trái',
    menuTableColsRight: 'Chèn cột bên phải',
    menuTableRowsAbove: 'Chèn hàng phía trên',
    menuTableRowsBelow: 'Chèn hàng phía dưới',
    menuTableCells: 'Ô…',
    menuTableDelete: 'Xóa',
    menuTableDeleteTable: 'Bảng',
    menuTableDeleteColumns: 'Cột',
    menuTableDeleteRows: 'Hàng',
    menuTableSelect: 'Chọn',
    menuTableSelectCell: 'Ô',
    menuTableSelectColumn: 'Cột',
    menuTableSelectRow: 'Hàng',
    menuTableSelectTable: 'Bảng',
    menuTableMergeCells: 'Trộn ô',
    menuTableSplitCells: 'Tách ô…',
    menuTableSplitTable: 'Tách bảng',
    menuTableAutoFit: 'Tự động điều chỉnh',
    menuTableAutoFitContents: 'Tự động khớp nội dung',
    menuTableAutoFitWindow: 'Tự động khớp cửa sổ',
    menuTableFixedWidth: 'Cố định độ rộng cột',
    menuTableDistributeRows: 'Phân bố đều các hàng',
    menuTableDistributeColumns: 'Phân bố đều các cột',
    menuTableRepeatHeader: 'Lặp lại hàng tiêu đề',
    menuTableGridlines: 'Xem đường lưới',
    menuTableProperties: 'Thuộc tính bảng…',
    menuWordCount: 'Đếm số từ…',
    menuAutoCorrect: 'Tùy chọn tự động sửa…',
    menuPreferences: 'Tùy chọn…',
    menuAiProofread: 'Hiệu đính AI',
    menuWindow: 'Cửa sổ',
    menuHelp: 'Trợ giúp',
    menuShortcuts: 'Phím tắt bàn phím',
    menuDocsHelp: 'Trợ giúp GenOffice Docs',
  },
  en: {
    dlgOpenDoc: 'Open Document',
    filterWord: 'Word Documents',
    dlgSaveAs: 'Save As',
    closeUnsavedMsg: 'This document has unsaved changes.',
    closeUnsavedDetail: 'Do you want to save them before closing?',
    closeNoReplyMsg: 'The document is not responding and may have unsaved changes.',
    closeNoReplyDetail: 'Close anyway? Unsaved changes will be lost.',
    btnCloseAnyway: 'Close Anyway',
    autosaveFoundTitle: 'Recovered version found',
    autosaveFoundBody:
      'There are unsaved changes from your last session. Restore the autosaved version?',
    autosaveRestore: 'Restore',
    autosaveDiscard: 'Discard',
    btnDontSave: "Don't Save",
    btnCancel: 'Cancel',
    extModifiedMsg: 'The file has been modified by another program.',
    extModifiedDetail: 'Save anyway and overwrite the changes on disk?',
    btnOverwrite: 'Overwrite',
    dlgInsertImage: 'Insert Image',
    filterImages: 'Images',
    dlgAddAttachment: 'Add Attachments',
    filterSupported: 'Supported Files',
    filterAll: 'All Files',
    dlgExportPdf: 'Export as PDF',
    dlgExportHtml: 'Export as HTML',
    dlgPickExportDir: 'Choose Export Folder',
    errUnsupportedExt: '.{ext} files are not supported',
    errNotFile: 'not a file',
    errTooLarge: 'exceeds the {mb}MB limit',
    errImageTooLarge: 'image exceeds the 5MB limit',
    errUnreadable: 'cannot be read',
    errFileTooLarge: 'File exceeds the size limit',
    errParseFailed: 'Failed to parse file',
    errImageNoText: 'Image attachments have no text; the image is sent along with the user message',
    errNotImage: 'not a supported image type',
    errGskNotLoggedIn:
      'Not signed in to Genspark: click “Sign in to Genspark” below, sign in, then retry',
    errNoApiKey: 'No API key configured for {provider}',
    errAiBusy: 'The AI service is busy right now — please try again in a moment',
    errNoModel: 'No model name configured',
    menuFile: 'File',
    menuNewDoc: 'New Document',
    menuNewWindow: 'New Window',
    menuOpen: 'Open…',
    menuOpenRecent: 'Open Recent',
    menuNoRecent: 'No Recent Documents',
    menuClose: 'Close',
    menuSave: 'Save',
    menuSaveAs: 'Save As…',
    menuPageSetup: 'Page Setup…',
    menuExportPdf: 'Export as PDF…',
    menuExportHtml: 'Export as HTML…',
    menuExportImages: 'Export as Images…',
    menuPrint: 'Print…',
    menuEdit: 'Edit',
    menuUndo: 'Undo',
    menuRedo: 'Redo',
    menuCut: 'Cut',
    menuCopy: 'Copy',
    menuPaste: 'Paste',
    menuPasteMatch: 'Paste and Match Style',
    menuFindReplace: 'Find and Replace…',
    menuGoTo: 'Go To…',
    menuSelectAll: 'Select All',
    menuView: 'View',
    menuZoom: 'Zoom',
    menuZoomIn: 'Zoom In',
    menuZoomOut: 'Zoom Out',
    menuZoom100: 'Actual Size (100%)',
    menuPageWidth: 'Page Width',
    menuWholePage: 'Whole Page',
    menuAiSidebar: 'AI Sidebar',
    menuDarkMode: 'Dark Mode',
    menuFullscreen: 'Enter Full Screen',
    menuInsert: 'Insert',
    menuInsertTable: 'Table…',
    menuInsertImage: 'Image…',
    menuInsertPageBreak: 'Page Break',
    menuInsertLink: 'Hyperlink…',
    menuInsertEquation: 'Equation…',
    menuComment: 'Comment',
    menuFormat: 'Format',
    menuBold: 'Bold',
    menuItalic: 'Italic',
    menuUnderline: 'Underline',
    menuAlign: 'Align',
    menuAlignLeft: 'Align Left',
    menuAlignCenter: 'Center',
    menuAlignRight: 'Align Right',
    menuAlignJustify: 'Justify',
    menuFont: 'Font…',
    menuParagraph: 'Paragraph…',
    menuTools: 'Tools',
    menuTable: 'Table',
    menuTableInsert: 'Insert',
    menuTableInsertTable: 'Table…',
    menuTableColsLeft: 'Columns to the Left',
    menuTableColsRight: 'Columns to the Right',
    menuTableRowsAbove: 'Rows Above',
    menuTableRowsBelow: 'Rows Below',
    menuTableCells: 'Cells…',
    menuTableDelete: 'Delete',
    menuTableDeleteTable: 'Table',
    menuTableDeleteColumns: 'Columns',
    menuTableDeleteRows: 'Rows',
    menuTableSelect: 'Select',
    menuTableSelectCell: 'Cell',
    menuTableSelectColumn: 'Column',
    menuTableSelectRow: 'Row',
    menuTableSelectTable: 'Table',
    menuTableMergeCells: 'Merge Cells',
    menuTableSplitCells: 'Split Cells…',
    menuTableSplitTable: 'Split Table',
    menuTableAutoFit: 'AutoFit and Distribute',
    menuTableAutoFitContents: 'AutoFit to Contents',
    menuTableAutoFitWindow: 'AutoFit to Window',
    menuTableFixedWidth: 'Fixed Column Width',
    menuTableDistributeRows: 'Distribute Rows Evenly',
    menuTableDistributeColumns: 'Distribute Columns Evenly',
    menuTableRepeatHeader: 'Repeat Header Rows',
    menuTableGridlines: 'View Gridlines',
    menuTableProperties: 'Table Properties…',
    menuWordCount: 'Word Count…',
    menuAutoCorrect: 'AutoCorrect Options…',
    menuPreferences: 'Preferences…',
    menuAiProofread: 'AI Proofread',
    menuWindow: 'Window',
    menuHelp: 'Help',
    menuShortcuts: 'Keyboard Shortcuts',
    menuDocsHelp: 'GenOffice Docs Help',
  },
})
const tm = (key: Parameters<typeof tMain>[1], params?: Parameters<typeof tMain>[2]) =>
  tMain(getUiLang(), key, params)

// ---- runtime configuration (paths differ when bundled into the shell) ----

interface DocsRuntimeConfig {
  /** absolute path to the docs preload bundle */
  preloadPath: string
  /** dev-server URL for the docs renderer (wins over rendererFile) */
  rendererUrl?: string | undefined
  /** absolute path to the built docs renderer index.html */
  rendererFile: string
}

let runtime: DocsRuntimeConfig = {
  preloadPath: join(__dirname, '../preload/index.js'),
  rendererUrl: process.env.ELECTRON_RENDERER_URL,
  rendererFile: join(__dirname, '../renderer/index.html'),
}

export function configureDocsRuntime(config: DocsRuntimeConfig): void {
  runtime = config
  // shell mode: the shell queues argv files itself (per-tab pendingWindowOpens);
  // the module-scope fallback would leak the double-clicked file into the next
  // blank tab's consume-pending-open
  pendingOpenPath = null
}

let mainWindow: BrowserWindow | null = null
let rendererReady = false
let pendingOpenPath = findDocxPath(process.argv)
/** documents queued for windows/tabs spawned via New Tab, keyed by webContents id */
const pendingWindowOpens = new Map<number, string>()
/** webContents ids that should open as a new blank doc instead of the start screen */
const pendingNewBlankIds = new Set<number>()

/** mark a docs webContents as "open blank on first consume" (called by the shell for home:new-doc) */
export function markDocsNewBlank(wcId: number): void {
  pendingNewBlankIds.add(wcId)
}

/** AI-authored content waiting for its create_document tab, keyed by webContents id */
const pendingAiDocContents = new Map<number, AiDocContent>()

/** queue AI content for a fresh blank docs tab (called by the shell right after creating the view) */
export function queueDocsAiContent(wcId: number, content: AiDocContent): void {
  pendingAiDocContents.set(wcId, content)
}

/** the single real BrowserWindow hosting the tab strip, used as dialog parent in tab mode */
let docsShellWindow: BrowserWindow | null = null
export function setDocsShellWindow(win: BrowserWindow | null): void {
  docsShellWindow = win
}

/** the window hosting a tab's WebContentsView when BrowserWindow.fromWebContents
 *  cannot tell (detached "Open in New Window" editors) */
let hostWindowHook: ((wc: WebContents) => BrowserWindow | undefined) | null = null
export function setDocsHostWindowHook(
  fn: ((wc: WebContents) => BrowserWindow | undefined) | null,
): void {
  hostWindowHook = fn
}

function hostWindowFor(wc: WebContents | null | undefined): BrowserWindow | undefined {
  const own = wc && (hostWindowHook?.(wc) ?? BrowserWindow.fromWebContents(wc))
  if (own && !own.isDestroyed()) return own
  return docsShellWindow && !docsShellWindow.isDestroyed() ? docsShellWindow : undefined
}

/** injected by the shell in tab mode: resolves the webContents of the currently active docs tab,
 * used for menu-command forwarding where there is no IpcMainInvokeEvent to key off of. */
let activeDocsResolver: (() => WebContents | null) | null = null
export function setActiveDocsResolver(fn: (() => WebContents | null) | null): void {
  activeDocsResolver = fn
}

function activeDocsWebContents(): WebContents | null {
  if (activeDocsResolver) return activeDocsResolver()
  return BrowserWindow.getFocusedWindow()?.webContents ?? mainWindow?.webContents ?? null
}

/** dialog parent for the calling tab: the sender's own window when it has one
 *  (standalone mode, detached "Open in New Window" editors), else the shell window */
function dialogParent(event: IpcMainInvokeEvent): BrowserWindow | undefined {
  return hostWindowFor(event.sender)
}

async function openDialog(event: IpcMainInvokeEvent, options: OpenDialogOptions) {
  return showOpenDialogWithMemory(dialog, dialogParent(event), options)
}

async function saveDialog(event: IpcMainInvokeEvent, options: SaveDialogOptions) {
  // before any pick is remembered, bare-name suggestions anchor in the
  // configurable default save folder instead of Electron's Downloads pin
  return showSaveDialogWithMemory(dialog, dialogParent(event), options, defaultSaveDir())
}

/** default folder where new files land on their first (silent) save; shared with the other editors via shell. User-configurable (app-settings.json), falls back to <Documents>/GenOffice. */
export function defaultSaveDir(): string {
  return configuredDefaultSaveDir(app)
}

/** first free path for fileName inside dir: name.ext, name-2.ext, name-3.ext… */
export function uniquePathIn(dir: string, fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  const base = dot > 0 ? fileName.slice(0, dot) : fileName
  const ext = dot > 0 ? fileName.slice(dot) : ''
  let candidate = join(dir, fileName)
  for (let i = 2; existsSync(candidate); i++) candidate = join(dir, `${base}-${i}${ext}`)
  return candidate
}

/**
 * An encrypted file the window holds no password for does not become a
 * document yet: loadDocx hands back a password marker with no side effects and
 * the renderer runs the replace guard once the password decrypted it
 * (submitDocPwd). Guarding here as well would prompt twice, and a Don't Save
 * answer would drop the recovery copy before anything replaced the document.
 */
async function opensAsPasswordPrompt(filePath: string, wcId: number): Promise<boolean> {
  if (docPasswordFor(wcId, filePath)) return false
  try {
    return isEncryptedDocx(await readFile(filePath))
  } catch {
    return false
  }
}

export function openExternalDocx(filePath: string | null): void {
  if (!filePath || !/\.docx$/i.test(filePath)) return
  const win = BrowserWindow.getFocusedWindow() ?? mainWindow
  if (!rendererReady || !win) {
    pendingOpenPath = filePath
    return
  }
  void (async () => {
    const wcId = win.webContents.id
    if (
      rendererReady &&
      !(await opensAsPasswordPrompt(filePath, wcId)) &&
      !(await requestDocsClose(win.webContents, win))
    ) {
      return
    }
    return loadDocx(filePath, wcId)
  })()
    .then((result) => {
      if (!result || win.isDestroyed()) return
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
      win.webContents.send('docs:opened', result)
    })
    .catch((err) => dialog.showErrorBox(tm('dlgOpenDoc'), String(err)))
}

function userDataPath(...parts: string[]): string {
  return join(app.getPath('userData'), ...parts)
}

function readJson<T>(path: string, fallback: T): T {
  try {
    if (existsSync(path)) return JSON.parse(readFileSync(path, 'utf-8')) as T
  } catch {
    /* corrupted state file: fall back to defaults */
  }
  return fallback
}

// ---- recent files ----

const RECENT_PATH = () => userDataPath('recent.json')

// the home screen lists all of these; the File menu shows only the first few
const RECENT_LIMIT = 100

function pushRecent(filePath: string): void {
  const recent = readJson<string[]>(RECENT_PATH(), [])
  // Every save lands here (autosave = every 30s): skip the write and the menu
  // rebuild when the file is already at the head of the list
  if (recent[0] === filePath) return
  const next = [filePath, ...recent.filter((p) => p !== filePath)].slice(0, RECENT_LIMIT)
  try {
    writeJsonAtomic(RECENT_PATH(), next)
  } catch (err) {
    // the document itself is already saved; a lost recents entry must not fail the save
    console.warn('[docs] recent.json write failed:', err)
  }
  buildDocsMenu() // keep File > Open Recent in sync
}

/** unified recents for the shell home screen (paths only; type = extension).
 *  No existence filter: a transiently unavailable path (disconnected drive,
 *  pending mount) must stay listed — the stat layer flags it instead (r158) */
export function readRecentFiles(): string[] {
  return readJson<string[]>(RECENT_PATH(), [])
}

export function recordRecentFile(filePath: string): void {
  pushRecent(filePath)
}

export function removeRecentFiles(filePaths: string[]): void {
  const drop = new Set(filePaths)
  const recent = readJson<string[]>(RECENT_PATH(), [])
  writeJsonAtomic(
    RECENT_PATH(),
    recent.filter((p) => !drop.has(p)),
  )
  buildDocsMenu()
}

/** shell notification: the file of an open view was renamed on disk (renamed in
 *  the Home list) — push to the matching renderer so it syncs its save path and
 *  title bar (docs keeps path state on the renderer side). */
export function docsFileRenamed(wc: WebContents, oldPath: string, newPath: string): void {
  // keep the save allowlist in sync so docs:save accepts the renamed path
  docWritablePaths.get(wc.id)?.delete(oldPath)
  allowDocWrite(wc.id, newPath)
  const states = docDiskStates.get(wc.id)
  const recorded = states?.get(oldPath)
  if (states && recorded) {
    states.delete(oldPath)
    states.set(newPath, recorded)
  }
  // an encrypted document's password must follow the path, or the next save
  // finds no password under the new name and silently writes plaintext
  renameDocPassword(wc.id, oldPath, newPath)
  moveLazyMediaSource(oldPath, newPath)
  wc.send('docs:renamed', { oldPath, newPath })
}

/** keep a renamed file at its old position in the recent/starred lists */
export function replaceRecentFile(oldPath: string, newPath: string): void {
  const recent = readJson<string[]>(RECENT_PATH(), [])
  writeJsonAtomic(
    RECENT_PATH(),
    recent.map((p) => (p === oldPath ? newPath : p)),
  )
  const starred = readJson<string[]>(STARRED_PATH(), [])
  if (starred.includes(oldPath)) {
    writeJsonAtomic(
      STARRED_PATH(),
      starred.map((p) => (p === oldPath ? newPath : p)),
    )
  }
  buildDocsMenu()
}

// ---- starred files (home screen favorites) ----

const STARRED_PATH = () => userDataPath('starred.json')

/** No existence filter, same rationale as readRecentFiles: a transiently
 *  unavailable starred file must keep its star and its Starred-view row —
 *  filtering here also desynced the star state shown on recents rows (r158) */
export function readStarredFiles(): string[] {
  return readJson<string[]>(STARRED_PATH(), [])
}

export function toggleStarredFile(filePath: string): void {
  const starred = readJson<string[]>(STARRED_PATH(), [])
  const next = starred.includes(filePath)
    ? starred.filter((p) => p !== filePath)
    : [...starred, filePath]
  writeJsonAtomic(STARRED_PATH(), next)
}

/** Bulk unstar (in-app delete, or removing an unavailable entry from the
 *  recents list): the star must not outlive the row it pointed at (r158) */
export function removeStarredFiles(filePaths: string[]): void {
  const drop = new Set(filePaths)
  if (drop.size === 0) return
  const starred = readJson<string[]>(STARRED_PATH(), [])
  const next = starred.filter((p) => !drop.has(p))
  if (next.length !== starred.length) writeJsonAtomic(STARRED_PATH(), next)
}

// ---- original archive (pass-through base: original file archived by content hash) ----

async function archiveOriginal(filePath: string, hash: string, size: number): Promise<void> {
  // a copy larger than the whole cap would only evict every other original
  if (size > ORIGINALS_MAX_BYTES) return
  const dir = userDataPath('originals')
  await mkdir(dir, { recursive: true })
  const target = join(dir, `${hash}.docx`)
  if (!existsSync(target)) await copyFile(filePath, target)
  void pruneOriginals(dir)
}

const ORIGINALS_MAX_BYTES = 500 * 1024 * 1024
let originalsPruneRunning = false

/** cap the archive's total size; oldest by mtime go first (never blocks the open path) */
async function pruneOriginals(dir: string): Promise<void> {
  if (originalsPruneRunning) return
  originalsPruneRunning = true
  try {
    const files: Array<{ path: string; size: number; mtimeMs: number }> = []
    for (const name of await readdir(dir)) {
      try {
        const s = await stat(join(dir, name))
        if (s.isFile()) files.push({ path: join(dir, name), size: s.size, mtimeMs: s.mtimeMs })
      } catch {
        /* removed concurrently */
      }
    }
    let total = files.reduce((sum, f) => sum + f.size, 0)
    files.sort((a, b) => a.mtimeMs - b.mtimeMs)
    for (const f of files) {
      if (total <= ORIGINALS_MAX_BYTES) break
      try {
        await unlink(f.path)
        total -= f.size
      } catch {
        /* already gone */
      }
    }
  } catch {
    /* directory unreadable: retry on the next archive */
  } finally {
    originalsPruneRunning = false
  }
}

/** per-renderer paths writable via docs:save — populated by open/save-as flows */
const docWritablePaths = new Map<number, Set<string>>()
/** per-renderer PDF export targets authorized via the export save dialog */
const pdfWritablePaths = new Map<number, Set<string>>()
const tornDownWcIds = new Set<number>()

function allowDocWrite(wcId: number, filePath: string): void {
  const set = docWritablePaths.get(wcId) ?? new Set<string>()
  set.add(filePath)
  docWritablePaths.set(wcId, set)
}

/** MCP save_session: the shell resolved this path for the tab, so docs:save-to may write it */
export function authorizeMcpDocWrite(wcId: number, filePath: string): void {
  allowDocWrite(wcId, filePath)
}

function canDocWrite(wcId: number, filePath: string): boolean {
  return docWritablePaths.get(wcId)?.has(filePath) === true
}

function allowPdfWrite(wcId: number, filePath: string): void {
  const set = pdfWritablePaths.get(wcId) ?? new Set<string>()
  set.add(filePath)
  pdfWritablePaths.set(wcId, set)
}

// Fidelity-harness escape hatch: headless runs have no save dialog to authorize
// paths, so an explicitly configured directory (set only by our test scripts)
// is treated as pre-authorized for PDF export.
const testExportDir = process.env.GENOFFICE_TEST_EXPORT_DIR || null

function canPdfWrite(wcId: number, filePath: string): boolean {
  if (testExportDir && filePath.startsWith(testExportDir + '/')) return true
  return pdfWritablePaths.get(wcId)?.has(filePath) === true
}

// Export as images runs the regular PDF export against a temp file: that file must
// not be revealed like a user export, and only the tab that asked may read it back
// (or write PNGs into the folder it picked).
const imageExportTemps = new Map<number, Set<string>>()
const imageExportDirs = new Map<number, Set<string>>()

function isImageExportTemp(wcId: number, filePath: string): boolean {
  return imageExportTemps.get(wcId)?.has(filePath) === true
}

// Word's Ignore All lasts for the document session. Chromium has no
// per-document skip list, so the word sits in the custom dictionary while a
// renderer holds it and leaves when the last holder goes; the journal pulls
// crash-orphaned words back out on the next start.
const SPELL_IGNORED_PATH = () => userDataPath('spell-ignored.json')
const spellIgnored = new Map<string, Set<number>>()
const journalIgnoredWords = () => writeJsonAtomic(SPELL_IGNORED_PATH(), [...spellIgnored.keys()])

function releaseSpellIgnores(wcId: number): void {
  let changed = false
  for (const [word, holders] of spellIgnored) {
    if (!holders.delete(wcId) || holders.size > 0) continue
    spellIgnored.delete(word)
    session.defaultSession.removeWordFromSpellCheckerDictionary(word)
    changed = true
  }
  if (changed) journalIgnoredWords()
}

function dropDocWriter(wcId: number): void {
  releaseSpellIgnores(wcId)
  docWritablePaths.delete(wcId)
  pdfWritablePaths.delete(wcId)
  for (const p of imageExportTemps.get(wcId) ?? []) void rm(p, { force: true })
  imageExportTemps.delete(wcId)
  imageExportDirs.delete(wcId)
  docDiskStates.delete(wcId)
  forgetLazyMediaOwner(wcId)
  // Destroyed renderers count as torn down too: window-close paths never run
  // teardownDocsRenderer, but an in-flight save handler resuming after the
  // destruction must still fail its re-check (wcIds are never reused, so the
  // set only accumulates a few integers per session).
  tornDownWcIds.add(wcId)
}

// ── External-modification detection: remember the disk state at every read/write
// so docs:save can refuse to clobber edits made by Word/another window ──
const docDiskStates = new Map<number, Map<string, DiskFileState>>()

const sha256Hex = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')

async function rememberDiskState(wcId: number, filePath: string, hash: string): Promise<void> {
  try {
    const s = await stat(filePath)
    const states = docDiskStates.get(wcId) ?? new Map<string, DiskFileState>()
    states.set(filePath, { mtimeMs: s.mtimeMs, size: s.size, hash })
    docDiskStates.set(wcId, states)
  } catch {
    /* unstatable target: skip tracking; the next save simply won't flag a conflict */
  }
}

async function diskChangedExternally(wcId: number, filePath: string): Promise<boolean> {
  let current: { mtimeMs: number; size: number } | null
  try {
    current = await stat(filePath)
  } catch {
    current = null
  }
  return isExternallyModified(docDiskStates.get(wcId)?.get(filePath), current, async () => {
    try {
      return sha256Hex(await readFile(filePath))
    } catch {
      return null
    }
  })
}

/** A closed docs tab detaches without destroying its webContents (shell freeze
 * workaround), so the orphan must lose write access and stop its timers — otherwise
 * its 30s recovery loop resurrects content the user already discarded. */
export function teardownDocsRenderer(contents: WebContents): void {
  teardownZoteroIpc(contents)
  tornDownWcIds.add(contents.id)
  releaseSpellIgnores(contents.id)
  forgetLazyMediaOwner(contents.id)
  // Sweep recovery copies for this renderer's documents: every non-crash close
  // either saved (docs:save already cleared it) or explicitly discarded, so a
  // copy still on disk here is a leftover from an in-flight recovery write.
  for (const p of docWritablePaths.get(contents.id) ?? []) clearRecoveryCopy(p)
  // reclaim every per-wcId grant, not just doc saves — the orphaned renderer
  // must also lose its dialog-authorized PDF targets and disk-state cache
  docWritablePaths.delete(contents.id)
  pdfWritablePaths.delete(contents.id)
  docDiskStates.delete(contents.id)
  forgetDocPasswords(contents.id)
  if (!contents.isDestroyed()) contents.send('docs:teardown')
}

// ── Crash recovery: dirty renderers push a copy every 30s
// (docs:write-recovery); a normal save cleans it up; open offers Restore/Discard ──
const recoveryDir = () => userDataPath('docs-autosave')
const recoveryPathFor = (filePath: string) =>
  join(recoveryDir(), `${createHash('sha1').update(filePath).digest('hex').slice(0, 16)}.docx`)

/** Bumped by every clear: an in-flight docs:write-recovery that started before
 * the bump must not recreate the file it is about to land (stale-recovery race). */
const recoveryClearEpochs = new Map<string, number>()

function clearRecoveryCopy(filePath: string): void {
  recoveryClearEpochs.set(filePath, (recoveryClearEpochs.get(filePath) ?? 0) + 1)
  try {
    unlinkSync(recoveryPathFor(filePath))
  } catch {
    /* nothing to clean */
  }
}

interface MaybeRecoveredDocBytes {
  bytes: Buffer
  recovered: boolean
}

/** On open, if a recovery copy newer than the original exists, ask whether to restore
 * (still points at the original path; only save persists it). */
async function maybeRecoverDocBytes(
  filePath: string,
  original: Buffer,
): Promise<MaybeRecoveredDocBytes> {
  const asPath = recoveryPathFor(filePath)
  try {
    if (!existsSync(asPath)) return { bytes: original, recovered: false }
    if (statSync(asPath).mtimeMs <= statSync(filePath).mtimeMs) {
      // a crashed partial write bumps mtime yet corrupts the file — keep the copy
      // then (an encrypted original is a CFB container, not a zip: intact too)
      if (looksLikeZip(original) || isEncryptedDocx(original)) {
        unlinkSync(asPath)
        return { bytes: original, recovered: false }
      }
    }
  } catch {
    return { bytes: original, recovered: false }
  }
  const options = {
    type: 'question' as const,
    buttons: [tm('autosaveRestore'), tm('autosaveDiscard')],
    defaultId: 0,
    cancelId: 1,
    message: tm('autosaveFoundTitle'),
    detail: tm('autosaveFoundBody'),
  }
  const parent = BrowserWindow.getFocusedWindow() ?? mainWindow
  const r =
    parent && !parent.isDestroyed()
      ? await dialog.showMessageBox(parent, options)
      : await dialog.showMessageBox(options)
  if (r.response === 0) {
    try {
      return { bytes: await readFile(asPath), recovered: true }
    } catch {
      return { bytes: original, recovered: false }
    }
  }
  clearRecoveryCopy(filePath)
  return { bytes: original, recovered: false }
}

// Word's own .docx ceiling
const MAX_OPEN_BYTES = 512 * 1024 * 1024

async function showOpenError(wcId: number, detail: string): Promise<void> {
  const parent = hostWindowFor(webContents.fromId(wcId)) ?? mainWindow
  const options = { type: 'error' as const, message: tm('dlgOpenDoc'), detail }
  if (parent && !parent.isDestroyed()) await dialog.showMessageBox(parent, options)
  else await dialog.showMessageBox(options)
}

async function loadDocx(
  filePath: string,
  wcId: number,
  password?: string,
): Promise<OpenDocxResult> {
  if (typeof filePath !== 'string' || !/\.docx$/i.test(filePath)) return null
  if (!existsSync(filePath)) return null
  const size = (await stat(filePath)).size
  const lazy = await openLazyDocx(filePath, wcId)
  if ((lazy?.bytes.length ?? size) > MAX_OPEN_BYTES) {
    const mb = MAX_OPEN_BYTES / 1024 / 1024
    await showOpenError(wcId, `${basename(filePath)}: ${tm('errTooLarge', { mb })}`)
    return null
  }
  const original = lazy?.bytes ?? (await readFile(filePath))
  // Password-protected docx (ECMA-376 CFB container): without a password, hand
  // back a marker — the renderer prompts and retries via docs:open-decrypt.
  // No side effects (recents/write grant) until the password checks out.
  let plainBytes: Buffer = original
  const encrypted = isEncryptedDocx(original)
  if (encrypted) {
    const pwd = password ?? docPasswordFor(wcId, filePath)
    if (!pwd) return { needsPassword: true, path: filePath, name: basename(filePath) }
    plainBytes = await decryptDocx(original, pwd) // throws DocxDecryptError
    rememberDocPassword(wcId, filePath, pwd)
  } else {
    rememberDocPassword(wcId, filePath, null)
  }
  // the archive keeps the on-disk original as-is (encrypted ones included: they
  // reopen with the user's password), so a bad save never loses the source file
  const hash = lazy?.hash ?? sha256Hex(original)
  await archiveOriginal(filePath, hash, size)
  const recovery = await maybeRecoverDocBytes(filePath, plainBytes)
  let bytes = recovery.bytes
  let recovered = recovery.recovered
  // recovery copies of a protected document are themselves encrypted (see
  // docs:write-recovery); an unreadable copy falls back to the original
  if (encrypted && isEncryptedDocx(bytes)) {
    try {
      bytes = await decryptRecoveryCopy(wcId, filePath, bytes)
    } catch {
      bytes = plainBytes
      recovered = false
    }
  }
  if (recovered) await adoptLazyMediaHashes(bytes, filePath, wcId)
  pushRecent(filePath)
  allowDocWrite(wcId, filePath)
  if (fileOpenedHook) fileOpenedHook(wcId, filePath)
  markDiskEncrypted(wcId, filePath, encrypted)
  // record the on-disk file, not the recovery copy: what matters is what save would overwrite
  await rememberDiskState(wcId, filePath, hash)
  return {
    path: filePath,
    name: basename(filePath),
    dataUrl: handOffBytes(bytes),
    hash,
    encrypted,
    recovered: recovered || undefined,
  }
}

// ---- IPC ----

const IMAGE_MIME: Record<string, 'image/png' | 'image/jpeg' | 'image/gif'> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
}

// ---- chat attachments: local files parsed for the agent ----

const ATTACHMENT_MAX_BYTES = 50 * 1024 * 1024
/** plain-text extensions read as UTF-8 */
const TEXT_EXTS = new Set([
  'txt',
  'md',
  'markdown',
  'csv',
  'tsv',
  'json',
  'yaml',
  'yml',
  'xml',
  'html',
  'htm',
  'log',
  'js',
  'ts',
  'tsx',
  'jsx',
  'py',
  'java',
  'c',
  'h',
  'cpp',
  'go',
  'rs',
  'rb',
  'sh',
  'sql',
  'css',
])
/** office/pdf formats get text extracted via @genoffice/file-parse; images skip extraction and go multimodal (files:read-image) */
const ATTACHMENT_EXTS = new Set([
  ...TEXT_EXTS,
  'doc',
  'docx',
  'pdf',
  'pptx',
  'ppt',
  'xlsx',
  'xlsm',
  'xls',
  ...ATTACHMENT_IMAGE_EXTS,
])

const ATTACHMENT_IMAGE_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
}
/** multimodal size cap per image attachment (keeps the context from blowing up) */
const ATTACHMENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024

/** extracted text cache keyed by path; invalidated by mtime+size */
const attachmentTextCache = new Map<string, { stamp: string; text: string }>()

function statAttachment(filePath: string): { meta?: AttachmentMeta; error?: string } {
  const name = basename(filePath)
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (!ATTACHMENT_EXTS.has(ext)) return { error: `${name}: ${tm('errUnsupportedExt', { ext })}` }
  try {
    const stat = statSync(filePath)
    if (!stat.isFile()) return { error: `${name}: ${tm('errNotFile')}` }
    if (stat.size > ATTACHMENT_MAX_BYTES) {
      return {
        error: `${name}: ${tm('errTooLarge', { mb: Math.round(ATTACHMENT_MAX_BYTES / 1024 / 1024) })}`,
      }
    }
    if (ATTACHMENT_IMAGE_EXTS.has(ext) && stat.size > ATTACHMENT_IMAGE_MAX_BYTES) {
      return { error: `${name}: ${tm('errImageTooLarge')}` }
    }
    return { meta: { path: filePath, name, ext, sizeBytes: stat.size } }
  } catch {
    return { error: `${name}: ${tm('errUnreadable')}` }
  }
}

function collectAttachments(paths: string[]): AttachmentAddResult {
  const accepted: AttachmentMeta[] = []
  const rejected: string[] = []
  for (const p of paths) {
    const { meta, error } = statAttachment(p)
    if (meta) accepted.push(meta)
    else if (error) rejected.push(error)
  }
  return { accepted, rejected }
}

/** save clipboard-pasted image bytes to a temp file (screenshots/bitmaps with no local path); returns null for non-images or empty data */
let pastedImageSeq = 0
let pastedDirPruned = false

/** drop pasted-image temp files older than 7 days (once per app run) */
function prunePastedImages(dir: string): void {
  if (pastedDirPruned) return
  pastedDirPruned = true
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  try {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      try {
        if (statSync(p).mtimeMs < cutoff) unlinkSync(p)
      } catch {
        // ignore: another tab may have removed it already
      }
    }
  } catch {
    // ignore: directory may not exist yet
  }
}
function savePastedImage(data: unknown, ext: unknown): string | null {
  const cleanExt = typeof ext === 'string' ? ext.toLowerCase() : ''
  if (!ATTACHMENT_IMAGE_EXTS.has(cleanExt)) return null
  const bytes =
    data instanceof ArrayBuffer
      ? Buffer.from(data)
      : ArrayBuffer.isView(data)
        ? Buffer.from(data.buffer, data.byteOffset, data.byteLength)
        : null
  if (!bytes || bytes.byteLength === 0) return null
  const dir = join(app.getPath('temp'), 'genoffice-pasted')
  mkdirSync(dir, { recursive: true })
  prunePastedImages(dir)
  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-')
  const filePath = join(dir, `pasted-${stamp}-${++pastedImageSeq}.${cleanExt}`)
  writeFileSync(filePath, bytes)
  return filePath
}

/** parse an attachment to text via @genoffice/file-parse (docx/pdf/pptx/xlsx/plain text) */
async function extractAttachmentText(filePath: string): Promise<string> {
  const stat = statSync(filePath)
  const stamp = `${stat.mtimeMs}:${stat.size}`
  const cached = attachmentTextCache.get(filePath)
  if (cached && cached.stamp === stamp) return cached.text
  if (stat.size > ATTACHMENT_MAX_BYTES) throw new Error(tm('errFileTooLarge'))
  const parsed = await parseFileToText(filePath)
  if (!parsed.ok || parsed.kind !== 'text' || parsed.text == null) {
    throw new Error(parsed.error ?? tm('errParseFailed'))
  }
  attachmentTextCache.set(filePath, { stamp, text: parsed.text })
  // keep the cache bounded (a handful of recent files is plenty)
  if (attachmentTextCache.size > 8) {
    const oldest = attachmentTextCache.keys().next().value
    if (oldest) attachmentTextCache.delete(oldest)
  }
  return parsed.text
}

// ---- print / export PDF ----

const TWIPS_PER_INCH = 1440

// ---- AI settings + chat proxy (main process avoids renderer CORS) ----
// provider metadata, settings defaults/migration, and per-provider streaming/chat
// implementations live in @genoffice/ai-provider, shared with apps/sheets.

const SETTINGS_PATH = () => userDataPath('ai-settings.json')

const activeAiStreams = new Map<string, AbortController>()

/**
 * AI settings + chat/stream proxy handlers. Split out so the shell can
 * register them exactly once for all window types (docs, sheets, home) —
 * sheets' standalone AI handlers use the same channel names.
 */
export function registerAiIpc(): void {
  app.once('before-quit', shutdownCodexAppServers)
  ipcMain.handle('ai:get-settings', async (): Promise<AiSettings> => {
    const stored = readJson<Partial<AiSettings> & LegacyAiSettings>(SETTINGS_PATH(), {})
    // pre-lock legacy file: genspark selected with cloud tools opted out. The
    // settings UI locks the tools switch on with genspark and apps read this
    // file live, so heal the stored flag once. Judged on the *stored* provider
    // — never the activeProvider fallback below, which must not leak into the
    // file and clobber a saved (half-configured) BYOK selection.
    if ((stored.provider ?? 'genspark') === 'genspark' && stored.gskToolsEnabled === false) {
      stored.gskToolsEnabled = true
      writeJsonAtomic(SETTINGS_PATH(), stored)
    }
    const settings = resolveAiSettings(stored, defaultAiSettings())
    // a stored BYOK provider is honored when usable; half-filled configs fall back to genspark
    settings.provider = activeProvider(settings)
    return settings
  })

  // Genspark account (gsk login state): auth source for AI features; the frontend uses it to prompt login when logged out
  ipcMain.handle(
    'ai:gsk-status',
    async (_event, withEmail?: boolean): Promise<GenSparkAccountStatus> => {
      if (!hasGskAuth()) return { loggedIn: false }
      if (!withEmail) return { loggedIn: true }
      const info = await gskLoginInfo()
      return info?.email ? { loggedIn: true, email: info.email } : { loggedIn: true }
    },
  )

  ipcMain.handle('ai:gsk-login', () => {
    ensureGenofficeLogin((url) => void shell.openExternal(url))
  })

  ipcMain.handle('ai:set-settings', (_event, settings: AiSettings) => {
    writeJsonAtomic(SETTINGS_PATH(), settings)
  })

  ipcMain.handle('ai:codex-models', async (_event, cliPath: unknown) => {
    return listCodexModels(typeof cliPath === 'string' ? cliPath : undefined)
  })

  ipcMain.handle('ai:custom-models', (_event, input: unknown) => listCustomModelsForIpc(input))

  ipcMain.handle('ai:stream', async (event, request: AiStreamRequest) => {
    const { requestId, settings, system, messages } = request
    const tools = request.tools ?? []
    const maxTokens = request.maxTokens ?? maxOutputTokensOf(settings)
    const provider = settings.provider
    let config = settings.providers?.[provider]
    // the genspark key never enters the settings file; requests take it from the gsk login state
    if (provider === 'genspark' && config && !config.apiKey) {
      config = { ...config, apiKey: gskApiKey() }
    }
    const send = (chunk: AiStreamChunk) => {
      if (!event.sender.isDestroyed()) event.sender.send('ai:stream-chunk', chunk)
    }
    if (!config || (provider !== 'codex' && !config.apiKey)) {
      send({
        requestId,
        type: 'error',
        error: provider === 'genspark' ? tm('errGskNotLoggedIn') : tm('errNoApiKey', { provider }),
      })
      return
    }
    if (provider !== 'codex' && !config.model) {
      send({ requestId, type: 'error', error: tm('errNoModel') })
      return
    }
    const controller = new AbortController()
    activeAiStreams.set(requestId, controller)
    // wire-activity keepalive: lets the renderer's silence watchdog tell a slow turn from a dead one
    let lastPing = 0
    const ping = () => {
      const now = Date.now()
      if (now - lastPing < 5_000) return
      lastPing = now
      send({ requestId, type: 'ping' })
    }
    try {
      let stopReason: string | undefined
      await streamForProvider(provider, config, system, messages, tools, maxTokens, {
        ...(request.sessionId ? { sessionId: request.sessionId } : {}),
        signal: controller.signal,
        onDelta: (text) => send({ requestId, type: 'delta', text }),
        onReasoningDelta: (text) => send({ requestId, type: 'reasoning', text }),
        onToolCall: (toolCall) => send({ requestId, type: 'tool-call', toolCall }),
        onActivity: ping,
        onStopReason: (reason) => {
          stopReason = reason
        },
      })
      send({ requestId, type: 'done', stopReason })
    } catch (err) {
      if (controller.signal.aborted) {
        send({ requestId, type: 'done' })
      } else {
        send({
          requestId,
          type: 'error',
          error: err instanceof Error ? err.message : String(err),
          ...(err instanceof AiTimeoutError
            ? { errorCode: 'timeout' as const }
            : err instanceof AiCreditsError
              ? { errorCode: 'credits' as const }
              : isAiNetworkError(err)
                ? { errorCode: 'network' as const }
                : isAiOverloadedError(err)
                  ? { errorCode: 'overloaded' as const }
                  : {}),
        })
      }
    } finally {
      activeAiStreams.delete(requestId)
    }
  })

  ipcMain.handle('ai:stream-cancel', (_event, requestId: string) => {
    activeAiStreams.get(requestId)?.abort()
  })

  // shared search tools (content + images): Serper with DuckDuckGo fallback (same source as slides/sheets)
  ipcMain.handle('ai:web-search', async (_event, query: string, maxResults?: number) => {
    try {
      return await webSearchTool(
        SETTINGS_PATH(),
        String(query),
        typeof maxResults === 'number' ? maxResults : 6,
      )
    } catch (err) {
      return { results: [], method: 'error', error: String(err) }
    }
  })
  ipcMain.handle('ai:image-search', async (_event, query: string, maxResults?: number) => {
    try {
      return await imageSearchTool(
        SETTINGS_PATH(),
        String(query),
        typeof maxResults === 'number' ? maxResults : 8,
      )
    } catch (err) {
      return { images: [], method: 'error', error: String(err) }
    }
  })

  // media understanding (pictures in the document, attachments, local files): BYOK media
  // provider when one is configured, otherwise the Genspark CLI behind its login gate.
  // docs-prefixed: slides registers its own ai:analyze-media in the same shell process.
  ipcMain.handle(
    'docs:analyze-media',
    async (_event, op: { mediaUrls: string[]; requirements: string }) => {
      const mediaUrls = (op.mediaUrls ?? []).map(String).filter(Boolean)
      // a picture opened lazily from a large docx is only addressable by its main-process
      // store; hand its bytes over as a data URL so the loader can read them like any other
      const resolved: string[] = []
      for (const url of mediaUrls) {
        const lazy = await readLazyMedia(url).catch(() => null)
        resolved.push(lazy ? `data:${lazy.mime};base64,${lazy.body.toString('base64')}` : url)
      }
      return analyzeMediaTool(SETTINGS_PATH(), {
        mediaUrls: resolved,
        requirements: String(op.requirements ?? ''),
      })
    },
  )

  // download image from URL → base64+mime (download in the main process avoids CORS; the renderer builds the image node and measures size itself)
  ipcMain.handle(
    'ai:fetch-image',
    async (_event, url: string): Promise<{ base64: string; mime: string } | null> => {
      try {
        // the URL originates from AI tool calls (prompt-injectable via web search
        // results), so refuse non-http schemes and private/link-local targets;
        // redirects are followed manually so every hop is validated too.
        // fetchRemoteImage adds CDN-friendly headers and transient-error retries.
        const resp = await fetchRemoteImage(String(url))
        if (!resp || !resp.ok) return null
        const buf = Buffer.from(await readBodyCapped(resp, MAX_REMOTE_IMAGE_BYTES))
        const ct = resp.headers.get('content-type') ?? ''
        const mime = ct.includes('png')
          ? 'image/png'
          : ct.includes('gif')
            ? 'image/gif'
            : 'image/jpeg'
        return { base64: buf.toString('base64'), mime }
      } catch {
        return null
      }
    },
  )

  // docs-owned (like pdf:generate-image): slides' ai:generate-image is only
  // registered once a slides view exists, so docs needs its own channel
  ipcMain.handle(
    'docs:ai-generate-image',
    (_event, op: { prompt?: unknown; aspectRatio?: unknown }) =>
      generateImageTool(SETTINGS_PATH(), {
        prompt: String(op?.prompt ?? ''),
        aspectRatio: op?.aspectRatio ? String(op.aspectRatio) : undefined,
      }),
  )

  ipcMain.handle('ai:search-test', (_event, input: unknown) => {
    const { provider, apiKey } = (input ?? {}) as { provider?: AiSearchProviderId; apiKey?: string }
    if (!provider || provider === 'genspark') {
      return hasGskAuth() ? { ok: true } : { ok: false, error: tm('errGskNotLoggedIn') }
    }
    return testSearchProvider(provider, String(apiKey ?? ''))
  })

  // settings-UI connection test for the media provider (genspark = the gsk login state)
  ipcMain.handle('ai:media-test', (_event, input: unknown) => {
    const { provider, config } = (input ?? {}) as {
      provider?: AiMediaProviderId
      config?: AiMediaProviderConfig
    }
    if (!provider || provider === 'genspark') {
      return hasGskAuth() ? { ok: true } : { ok: false, error: tm('errGskNotLoggedIn') }
    }
    if (!config) return { ok: false, error: 'No media provider configuration' }
    return testMediaProvider(provider, config)
  })

  ipcMain.handle('ai:chat', async (_event, request: AiChatRequest) => {
    const { settings, system, user } = request
    const provider = settings.provider
    let config = settings.providers?.[provider]
    if (provider === 'genspark' && config && !config.apiKey) {
      config = { ...config, apiKey: gskApiKey() }
    }
    if (!config || (provider !== 'codex' && !config.apiKey)) {
      return {
        ok: false,
        error: provider === 'genspark' ? tm('errGskNotLoggedIn') : tm('errNoApiKey', { provider }),
      }
    }
    if (provider !== 'codex' && !config.model) return { ok: false, error: tm('errNoModel') }
    try {
      const result = await chatForProvider(provider, config, system, user)
      // the one-shot path reports HTTP failures as ok:false with the raw body —
      // replace capacity/rate-limit dumps with the localized "busy" message
      if (!result.ok && isAiOverloadedError(result.error)) {
        return { ok: false, error: tm('errAiBusy') }
      }
      return result
    } catch (err) {
      return { ok: false, error: isAiOverloadedError(err) ? tm('errAiBusy') : String(err) }
    }
  })
}

// ── project-store IPC (shared across docs / slides / sheets) ──────────────

let projectStore: ProjectStore | null = null
let projectIpcRegistered = false

function getProjectStore(): ProjectStore {
  if (!projectStore) projectStore = new ProjectStore(app.getPath('userData'))
  return projectStore
}

/**
 * Fired when a save lands on a new path (save-as / first silent save). The shell
 * uses it to sync the tab title/path, record recents and apply a pending project —
 * same contract as the sheets/slides opened hooks. Never called standalone.
 * Returns the final path when the shell filed the new file into a Home folder.
 */
let fileSavedHook: ((wc: WebContents, filePath: string) => string | void) | null = null

export function setDocsFileSavedHook(
  hook: (wc: WebContents, filePath: string) => string | void,
): void {
  fileSavedHook = hook
}

function notifyFileSaved(wc: WebContents, filePath: string): string {
  const moved = fileSavedHook ? fileSavedHook(wc, filePath) : undefined
  return typeof moved === 'string' && moved ? moved : filePath
}

/**
 * Fired when a docx is opened INSIDE an existing tab (File > Open dialog or an
 * explicit path open). Sheets and slides have had this hook from the start;
 * docs only synced the tab on save-as/first-save, so a file opened into an
 * untitled tab kept the "Untitled Document" tab title until a save landed on a
 * NEW path — which a plain Ctrl+S to the original file never does (r115).
 */
let fileOpenedHook: ((wcId: number, filePath: string) => void) | null = null

export function setDocsFileOpenedHook(hook: (wcId: number, filePath: string) => void): void {
  fileOpenedHook = hook
}

/**
 * Reverse lookup from a sheets sessionId to its file path. In shell mode the
 * project:* handlers are registered by this file, but only sheets-main knows the
 * sessionId mapping; the shell injects it at startup (standalone docs doesn't need it).
 */
let sessionPathResolver: ((senderId: number, sessionId: string) => string | null) | null = null

export function setSessionPathResolver(
  fn: (senderId: number, sessionId: string) => string | null,
): void {
  sessionPathResolver = fn
}

/** After a file is renamed/moved on disk, sync project-store (fileMap/chatIdByPath re-key accordingly; history follows the file). */
export function projectFilePaths(): string[] {
  try {
    return getProjectStore().knownFilePaths()
  } catch {
    return []
  }
}

export function projectFileRenamed(oldPath: string, newPath: string): void {
  try {
    getProjectStore().fileRenamed(oldPath, newPath)
  } catch (err) {
    console.warn('[project-store] fileRenamed failed:', err)
  }
}

/**
 * Register the project:* IPC handlers (all three apps share the same channel names).
 * Idempotency guard: registered only once in shell mode.
 */
export function registerProjectIpc(): void {
  if (projectIpcRegistered) return
  projectIpcRegistered = true

  /** Resolve projectId + chatId from a file path (sheets without a path resolves via sessionId) */
  ipcMain.handle(
    'project:resolveChat',
    (event, args: { filePath: string | null; tempChatId?: string; sessionId?: string }) => {
      const store = getProjectStore()
      store.ensureDefaultProject()
      let resolvedPath = args.filePath
      if (!resolvedPath && args.sessionId && sessionPathResolver) {
        resolvedPath = sessionPathResolver(event.sender.id, args.sessionId)
      }
      if (!resolvedPath) {
        return {
          projectId: 'default',
          chatId: args.tempChatId ?? `unsaved-${Date.now()}`,
        }
      }
      return store.resolveChatForFile(resolvedPath)
    },
  )

  /** Append a message */
  ipcMain.handle(
    'project:appendChat',
    (
      _event,
      args: {
        projectId: string
        chatId: string
        role: 'user' | 'assistant'
        text: string
        tools?: Array<{
          name: string
          summary: string
          isError?: boolean
          input?: string
          output?: string
        }>
        attachments?: Array<{ name: string; path?: string; ext?: string; sizeBytes?: number }>
        scope?: { label: string; text?: string }
      },
    ) => {
      if (args.role !== 'user' && args.role !== 'assistant') {
        throw new Error(`Invalid chat role: ${String(args.role)}`)
      }
      if (typeof args.text !== 'string' || args.text.length > 200_000) {
        throw new Error('Invalid chat text: must be a string up to 200000 chars')
      }
      if (args.tools && !Array.isArray(args.tools)) throw new Error('Invalid chat tools')
      if (args.attachments && !Array.isArray(args.attachments)) {
        throw new Error('Invalid chat attachments')
      }
      const store = getProjectStore()
      const msg: Parameters<ProjectStore['appendChatMessage']>[2] = {
        role: args.role,
        text: args.text,
      }
      if (args.tools) msg.tools = args.tools
      if (args.attachments) msg.attachments = args.attachments
      if (args.scope) msg.scope = args.scope

      store.appendChatMessage(args.projectId, args.chatId, msg)
    },
  )

  /** Read history */
  ipcMain.handle(
    'project:loadChat',
    (
      _event,
      args: {
        projectId: string
        chatId: string
        limit?: number
      },
    ) => {
      const store = getProjectStore()
      return store.loadChat(args.projectId, args.chatId, args.limit ?? 200)
    },
  )

  /** rebind chat (called after a file first hits disk): newFilePath/sessionId take priority; the main process computes chatId and records fileMap */
  ipcMain.handle(
    'project:rebindChat',
    (
      event,
      args: {
        projectId: string
        tempChatId: string
        newChatId?: string
        newFilePath?: string
        sessionId?: string
      },
    ) => {
      const store = getProjectStore()
      let path = args.newFilePath ?? null
      if (!path && args.sessionId && sessionPathResolver) {
        path = sessionPathResolver(event.sender.id, args.sessionId)
      }
      if (path) {
        return store.rebindChatToFile(args.projectId, args.tempChatId, path)
      }
      if (args.newChatId) store.rebindChat(args.projectId, args.tempChatId, args.newChatId)
      return { projectId: args.projectId, chatId: args.newChatId ?? args.tempChatId }
    },
  )
}

/** A4 at 96dpi, as the HTML app exports */
const ALT_CHUNK_VIEWPORT = { width: 794, height: 1123, deviceScaleFactor: 2 }
const ALT_CHUNK_HTML_MAX_CHARS = 64 * 1024 * 1024

/** an encrypted save leaves no plain file to serve lazy pictures from: the
 *  renderer takes the materialized document back and leaves lazy mode */
const reissuedDoc = (
  encrypted: boolean,
  hashes: Set<string>,
  plain: Buffer,
): { dataUrl?: string } => (encrypted && hashes.size > 0 ? { dataUrl: handOffBytes(plain) } : {})

/** document/attachment/window IPC (everything except the AI proxy above) */
export function registerDocsIpc(): void {
  registerZoteroIpc()
  void app.whenReady().then(registerLazyMediaProtocol)
  // Node fetch (undici) direct connections get reset under VPN/tun setups; retry over Chromium's stack
  setRescueFetch((url, init) => net.fetch(url, init))
  setAiUserAgent(`GenOffice/${app.getVersion()}`)

  // shared with the other editor modules — last (identical) registration wins
  ipcMain.removeHandler('app:get-language')
  ipcMain.handle('app:get-language', () => getUiLang())
  ipcMain.handle('docs:confirm-document-replace', (event) =>
    requestDocsClose(event.sender, dialogParent(event)),
  )
  ipcMain.handle('docs:system-locale', () => app.getSystemLocale())

  configureMetricsCache(userDataPath('font-metrics'))
  ipcMain.handle('docs:font-metrics', (_event, family: string) =>
    typeof family === 'string' ? familyVerticalMetrics(family) : null,
  )

  ipcMain.handle('docs:open', async (event) => {
    const result = await openDialog(event, {
      title: tm('dlgOpenDoc'),
      filters: [{ name: tm('filterWord'), extensions: ['docx'] }],
      properties: ['openFile'],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return loadDocx(result.filePaths[0], event.sender.id)
  })

  ipcMain.handle('docs:open-path', (event, filePath: string) => loadDocx(filePath, event.sender.id))

  // w:altChunk HTML: the same html2docx chain as the HTML app's export, in a
  // hidden window; the renderer parses the result and shows its blocks
  ipcMain.handle('docs:altchunk-html-to-docx', async (_event, html: unknown) => {
    if (typeof html !== 'string' || !html.trim() || html.length > ALT_CHUNK_HTML_MAX_CHARS) {
      return null
    }
    const workDir = await mkdtemp(join(tmpdir(), 'genoffice-altchunk-'))
    let driver: ElectronBrowserDriver | null = null
    try {
      const htmlPath = join(workDir, 'chunk.html')
      // the BOM outranks a stale <meta charset> left in the decoded markup
      await writeFile(htmlPath, `\ufeff${html}`, 'utf8')
      driver = await ElectronBrowserDriver.create(ALT_CHUNK_VIEWPORT)
      const { docx } = await convertHtmlToDocx({ url: pathToFileURL(htmlPath).href }, driver, {
        naturalTableWidth: true,
      })
      return docx
    } catch (err) {
      console.warn('[docs] altChunk conversion failed:', err)
      return null
    } finally {
      await driver?.close()
      await rm(workDir, { recursive: true, force: true }).catch(() => {})
    }
  })

  // Review > Protect > Encrypt with Password: set/clear the open password.
  // Takes effect on the next save (docs:save / save-as / save-new all consult the store).
  ipcMain.handle(
    'docs:set-password',
    (event, filePath: string | null, password: string | null): { ok: boolean } => {
      if (tornDownWcIds.has(event.sender.id)) return { ok: false }
      if (filePath !== null && typeof filePath !== 'string') return { ok: false }
      if (password !== null && (typeof password !== 'string' || password.length === 0)) {
        return { ok: false }
      }
      // only the document this renderer legitimately has open (same grant as saving)
      if (filePath && !canDocWrite(event.sender.id, filePath)) return { ok: false }
      setDocPassword(event.sender.id, filePath, password)
      return { ok: true }
    },
  )

  ipcMain.handle('docs:password-intent-revision', (event): number => {
    if (tornDownWcIds.has(event.sender.id)) return -1
    return currentDocPasswordIntentRevision()
  })

  ipcMain.handle(
    'docs:discard-password-intents',
    (event, throughRevision: unknown): { ok: boolean } => {
      if (tornDownWcIds.has(event.sender.id)) return { ok: false }
      if (
        typeof throughRevision !== 'number' ||
        !Number.isSafeInteger(throughRevision) ||
        throughRevision < 0
      ) {
        return { ok: false }
      }
      discardDocPasswordIntents(event.sender.id, throughRevision)
      return { ok: true }
    },
  )

  // decrypt-and-open a password-protected docx; wrong-password keeps the renderer's prompt open
  ipcMain.handle(
    'docs:open-decrypt',
    async (event, filePath: string, password: string): Promise<DecryptOpenResult> => {
      if (typeof filePath !== 'string' || typeof password !== 'string' || password.length === 0) {
        return { ok: false, reason: 'error', error: 'invalid arguments' }
      }
      try {
        const result = await loadDocx(filePath, event.sender.id, password)
        if (!result) return { ok: false, reason: 'error', error: 'file not found' }
        // the file was swapped for a plain docx between prompt and submit — still an open
        if ('needsPassword' in result) return { ok: false, reason: 'error', error: 'not encrypted' }
        return { ok: true, result }
      } catch (err) {
        if (err instanceof DocxDecryptError) {
          return { ok: false, reason: err.reason, error: err.message }
        }
        return { ok: false, reason: 'error', error: String(err) }
      }
    },
  )

  ipcMain.handle('docs:consume-pending-open', (event) => {
    rendererReady = true
    // a tab spawned via New Tab loads the document queued for it specifically
    const queued = pendingWindowOpens.get(event.sender.id)
    if (queued) {
      pendingWindowOpens.delete(event.sender.id)
      return loadDocx(queued, event.sender.id)
    }
    const filePath = pendingOpenPath
    pendingOpenPath = null
    return filePath ? loadDocx(filePath, event.sender.id) : null
  })

  /** returns true when this tab was opened via "New Document" and should start blank */
  ipcMain.handle('docs:consume-new-blank', (event) => {
    rendererReady = true
    if (pendingNewBlankIds.has(event.sender.id)) {
      pendingNewBlankIds.delete(event.sender.id)
      return true
    }
    return false
  })

  /** one-shot AI content queued by create_document for this tab; null when none */
  ipcMain.handle('docs:consume-ai-doc-content', (event): AiDocContent | null => {
    const content = pendingAiDocContents.get(event.sender.id) ?? null
    pendingAiDocContents.delete(event.sender.id)
    return content
  })

  // ---- headless export mode (--headless-export) ----

  ipcMain.handle('docs:consume-headless-export', (event): HeadlessExportTarget | null => {
    const target = headlessExportTargets.get(event.sender.id) ?? null
    headlessExportTargets.delete(event.sender.id)
    return target
  })

  ipcMain.on('docs:headless-export-done', (event, result: unknown) => {
    const settle = headlessExportWaiters.get(event.sender.id)
    if (!settle) return
    headlessExportWaiters.delete(event.sender.id)
    const state = result as { ok?: unknown; error?: unknown } | null
    settle({
      ok: state?.ok === true,
      ...(typeof state?.error === 'string' ? { error: state.error } : {}),
    })
  })

  ipcMain.handle(
    'docs:save',
    async (event, filePath: string, data: ArrayBuffer, auto?: boolean) => {
      try {
        // only paths this renderer opened or chose via save-as may be overwritten
        if (typeof filePath !== 'string' || !canDocWrite(event.sender.id, filePath)) {
          return { ok: false, error: 'save target is not an opened document' }
        }
        if (await diskChangedExternally(event.sender.id, filePath)) {
          // autosave must never clobber another program's edits silently; the
          // renderer stays dirty and the next manual save raises the dialog
          if (auto === true) return { ok: false, reason: 'external-modified' }
          const options = {
            type: 'warning' as const,
            message: tm('extModifiedMsg'),
            detail: tm('extModifiedDetail'),
            buttons: [tm('btnOverwrite'), tm('btnCancel')],
            defaultId: 0,
            cancelId: 1,
            noLink: true,
          }
          const parent = dialogParent(event)
          const { response } =
            parent && !parent.isDestroyed()
              ? await dialog.showMessageBox(parent, options)
              : await dialog.showMessageBox(options)
          if (response !== 0) return { ok: false, reason: 'external-modified' }
        }
        // The tab may have been closed while the external-change check or the
        // overwrite prompt was pending: a Don't Save close revoked this tab's
        // grants, and landing the write now would persist discarded edits.
        if (tornDownWcIds.has(event.sender.id) || !canDocWrite(event.sender.id, filePath)) {
          return { ok: false, error: 'save target is not an opened document' }
        }
        // Snapshot desired state: the disk password remains unchanged until the
        // atomic write succeeds, and a newer ribbon intent survives this save.
        const passwordState = snapshotDocPassword(event.sender.id, filePath)
        const { bytes: plain, hashes } = await materializeLazyDocx(Buffer.from(data))
        const bytes = passwordState.password ? encryptDocx(plain, passwordState.password) : plain
        await atomicWriteFile(filePath, bytes)
        // Teardown may have cleared all in-memory secrets while the atomic
        // write was pending. Never resurrect state for an orphaned renderer.
        if (tornDownWcIds.has(event.sender.id)) {
          return { ok: false, error: 'save target is not an opened document' }
        }
        await rememberDiskState(event.sender.id, filePath, sha256Hex(bytes))
        if (tornDownWcIds.has(event.sender.id)) {
          return { ok: false, error: 'save target is not an opened document' }
        }
        pointLazyMediaAt(
          hashes,
          filePath,
          event.sender.id,
          passwordState.password ? plain : undefined,
        )
        // Commit immediately after the final await: intents received during
        // post-write bookkeeping are included, with no later async race.
        const passwordIntentPending = commitDocPasswordSave(
          event.sender.id,
          passwordState,
          filePath,
        )
        clearRecoveryCopy(filePath)
        pushRecent(filePath)
        return {
          ok: true,
          passwordIntentPending,
          ...reissuedDoc(!!passwordState.password, hashes, plain),
        }
      } catch (err) {
        return { ok: false, error: String(err) }
      }
    },
  )

  // crash-recovery copy from a dirty renderer; best-effort, never surfaces
  ipcMain.handle('docs:write-recovery', async (event, filePath: string, data: ArrayBuffer) => {
    try {
      if (tornDownWcIds.has(event.sender.id)) return { ok: false }
      if (typeof filePath !== 'string' || !canDocWrite(event.sender.id, filePath))
        return { ok: false }
      // snapshot before any await: a save or discard that clears the recovery
      // copy while this write is in flight bumps the epoch and invalidates it
      const epoch = recoveryClearEpochs.get(filePath) ?? 0
      await mkdir(recoveryDir(), { recursive: true })
      // Recovery follows the current disk state, never the desired next-save
      // password. Missing state for an encrypted disk file skips the tick so
      // plaintext can never be written as its recovery copy.
      const bytes = prepareRecoveryDocx(event.sender.id, filePath, Buffer.from(data))
      if (!bytes) return { ok: false }
      await atomicWriteFile(recoveryPathFor(filePath), bytes)
      // The tab may have been closed ("Don't Save" clears the copy, teardown
      // revokes access) or the document saved (docs:save clears the copy) while
      // the write was in flight. A write that lost either race would offer
      // discarded or already-saved content as recovery on the next open — undo it.
      if (
        tornDownWcIds.has(event.sender.id) ||
        !canDocWrite(event.sender.id, filePath) ||
        (recoveryClearEpochs.get(filePath) ?? 0) !== epoch
      ) {
        clearRecoveryCopy(filePath)
        return { ok: false }
      }
      return { ok: true }
    } catch {
      return { ok: false }
    }
  })

  // Blink only respells an editable as a consequence of real (trusted) typing
  // of a word-committing character inside it: attribute flips, focus cycles,
  // script selection moves, execCommand edits, fresh DOM nodes, synthetic
  // clicks/arrow keys — and even a typed zero-width space — all leave existing
  // typos unmarked (each verified pixel-by-pixel).
  // Type one trusted space; the RENDERER removes it again by script (a
  // trusted Backspace would work too, but its deletion re-suppresses the
  // caret paragraph and that line stays unmarked) with ProseMirror's DOM
  // observer paused, so the round trip never becomes a transaction.
  // spell-diag trace (intermittent squiggle loss, platform-bound
  // and unreproducible on demand) — a tiny always-on log support can ask for.
  // Size-capped: over 256KB the file restarts from its last half.
  ipcMain.on('docs:spell-diag', (_event, line: unknown) => {
    if (typeof line !== 'string' || line.length > 500) return
    try {
      const path = userDataPath('spell-diag.log')
      if (existsSync(path) && statSync(path).size > 256 * 1024) {
        const tail = readFileSync(path, 'utf-8').slice(-128 * 1024)
        writeFileSync(path, tail.slice(tail.indexOf('\n') + 1))
      }
      appendFileSync(path, `${new Date().toISOString()} ${line}\n`)
    } catch {
      // diagnostics must never break the app
    }
  })

  // The document body draws its own React context menu, but Chromium's
  // misspelling + suggestions for the clicked word only surface in the main
  // process `context-menu` event. The renderer claims each body right-click
  // synchronously from its DOM handler, i.e. before Blink requests the menu,
  // so claims and events arrive in the same order: a claimed click gets its
  // data forwarded and no native menu, anything else (header/footer surfaces,
  // inputs) pops the native menu as before.
  const ctxMenuClaims = new Map<number, ClickClaims>()
  ipcMain.on('docs:context-menu-claim', (event, seq: unknown) => {
    event.returnValue = true
    if (typeof seq !== 'number') return
    let claims = ctxMenuClaims.get(event.sender.id)
    if (!claims) {
      claims = new ClickClaims()
      ctxMenuClaims.set(event.sender.id, claims)
    }
    claims.claim(seq, Date.now())
  })
  ipcMain.on('docs:context-menu-arm', (event) => {
    const wc = event.sender
    setContextMenuInterceptor(app, wc, (contents, params) => {
      if (contents.isDestroyed() || tornDownWcIds.has(contents.id)) return Promise.resolve(false)
      const seq = ctxMenuClaims.get(contents.id)?.take(Date.now()) ?? null
      if (seq !== null) {
        const request: ContextMenuRequest = {
          seq,
          misspelledWord: params.misspelledWord,
          suggestions: params.dictionarySuggestions,
        }
        contents.send('docs:context-menu', request)
      }
      return Promise.resolve(seq !== null)
    })
    wc.once('destroyed', () => {
      setContextMenuInterceptor(app, wc, null)
      ctxMenuClaims.delete(wc.id)
    })
  })
  void app.whenReady().then(() => {
    const orphans = readJson<string[]>(SPELL_IGNORED_PATH(), [])
    for (const w of orphans) session.defaultSession.removeWordFromSpellCheckerDictionary(w)
    if (orphans.length) journalIgnoredWords()
  })
  ipcMain.handle('docs:spell-ignore-word', (event, word: unknown) => {
    if (typeof word !== 'string' || !word.trim()) return false
    const w = word.trim()
    let holders = spellIgnored.get(w)
    if (!holders) {
      holders = new Set()
      spellIgnored.set(w, holders)
      journalIgnoredWords()
    }
    holders.add(event.sender.id)
    return event.sender.session.addWordToSpellCheckerDictionary(w)
  })
  ipcMain.handle('docs:spell-add-word', (event, word: unknown) => {
    if (typeof word !== 'string' || !word.trim()) return false
    const w = word.trim()
    if (spellIgnored.delete(w)) journalIgnoredWords()
    return event.sender.session.addWordToSpellCheckerDictionary(w)
  })
  ipcMain.handle('docs:spell-replace', (event, word: unknown) => {
    if (typeof word === 'string' && word) event.sender.replaceMisspelling(word)
  })
  ipcMain.handle('docs:spell-languages', (event): SpellLanguages => {
    const session = event.sender.session
    return {
      active: session.getSpellCheckerLanguages(),
      available: session.availableSpellCheckerLanguages,
    }
  })
  ipcMain.handle('docs:spell-set-languages', (event, langs: unknown): SpellLanguages => {
    const session = event.sender.session
    const available = new Set(session.availableSpellCheckerLanguages)
    const next = Array.isArray(langs)
      ? langs.filter((l): l is string => typeof l === 'string' && available.has(l))
      : []
    if (next.length) session.setSpellCheckerLanguages(next)
    return { active: session.getSpellCheckerLanguages(), available: [...available] }
  })

  ipcMain.handle('docs:respell-kick', async (event) => {
    const wc = event.sender
    if (tornDownWcIds.has(wc.id) || wc.isDestroyed()) return
    wc.focus()
    // Blink only respells after a user activation, and only a keydown grants one
    wc.sendInputEvent({ type: 'keyDown', keyCode: 'Space' })
    wc.sendInputEvent({ type: 'char', keyCode: ' ' })
    wc.sendInputEvent({ type: 'keyUp', keyCode: 'Space' })
    // resolve only after the input pipeline has delivered the keystroke, so
    // the caller can scrub the space it produced
    await new Promise((r) => setTimeout(r, 120))
  })

  ipcMain.handle(
    'docs:save-as',
    async (event, defaultName: string, data: ArrayBuffer, sourcePath?: string | null) => {
      // an orphaned (closed-tab) renderer must not open dialogs or land new files
      if (tornDownWcIds.has(event.sender.id)) return { ok: false }
      const result = await saveDialog(event, {
        title: tm('dlgSaveAs'),
        defaultPath: saveAsSuggestion(
          typeof sourcePath === 'string' ? sourcePath : null,
          defaultName,
        ),
        filters: [{ name: tm('filterWord'), extensions: ['docx'] }],
      })
      if (result.canceled || !result.filePath) return { ok: false }
      // the tab may have been closed while the dialog was open; checked before the
      // write because Save As may overwrite an existing file (no safe rollback)
      if (tornDownWcIds.has(event.sender.id)) return { ok: false }
      try {
        const passwordState = snapshotDocPassword(
          event.sender.id,
          typeof sourcePath === 'string' && sourcePath ? sourcePath : null,
        )
        const { bytes: plain, hashes } = await materializeLazyDocx(Buffer.from(data))
        const bytes = passwordState.password ? encryptDocx(plain, passwordState.password) : plain
        await atomicWriteFile(result.filePath, bytes)
        if (tornDownWcIds.has(event.sender.id)) return { ok: false }
        allowDocWrite(event.sender.id, result.filePath)
        await rememberDiskState(event.sender.id, result.filePath, sha256Hex(bytes))
        pointLazyMediaAt(
          hashes,
          result.filePath,
          event.sender.id,
          passwordState.password ? plain : undefined,
        )
        if (tornDownWcIds.has(event.sender.id)) return { ok: false }
        const passwordIntentPending = commitDocPasswordSave(
          event.sender.id,
          passwordState,
          result.filePath,
        )
        pushRecent(result.filePath)
        // the renderer has no path yet to match a rename notification against,
        // so the reply must carry the path it may save to next
        const savedPath = notifyFileSaved(event.sender, result.filePath)
        return {
          ok: true,
          path: savedPath,
          passwordIntentPending,
          ...reissuedDoc(!!passwordState.password, hashes, plain),
        }
      } catch (err) {
        return { ok: false, error: String(err) }
      }
    },
  )

  ipcMain.handle('docs:save-new', async (event, defaultName: string, data: ArrayBuffer) => {
    try {
      // a discarded draft in an orphaned renderer must not silently persist
      // itself to the default folder after the user chose Don't Save
      if (tornDownWcIds.has(event.sender.id)) return { ok: false }
      const filePath = uniquePathIn(defaultSaveDir(), defaultName)
      const passwordState = snapshotDocPassword(event.sender.id, null)
      const { bytes: plain, hashes } = await materializeLazyDocx(Buffer.from(data))
      const bytes = passwordState.password ? encryptDocx(plain, passwordState.password) : plain
      await atomicWriteFile(filePath, bytes)
      // teardown may have happened while the write was in flight — the path is
      // freshly created, so rolling it back is safe (mirrors docs:write-recovery)
      if (tornDownWcIds.has(event.sender.id)) {
        await unlink(filePath).catch(() => {})
        return { ok: false }
      }
      allowDocWrite(event.sender.id, filePath)
      await rememberDiskState(event.sender.id, filePath, sha256Hex(bytes))
      pointLazyMediaAt(
        hashes,
        filePath,
        event.sender.id,
        passwordState.password ? plain : undefined,
      )
      if (tornDownWcIds.has(event.sender.id)) {
        await unlink(filePath).catch(() => {})
        return { ok: false }
      }
      const passwordIntentPending = commitDocPasswordSave(event.sender.id, passwordState, filePath)
      pushRecent(filePath)
      const savedPath = notifyFileSaved(event.sender, filePath)
      return {
        ok: true,
        path: savedPath,
        passwordIntentPending,
        ...reissuedDoc(!!passwordState.password, hashes, plain),
      }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  })

  ipcMain.handle(
    'docs:create-document',
    (_event, request: CreateDocumentRequest): Promise<CreateDocumentResult> =>
      createAiDocument(request),
  )

  // MCP-driven output: write the live document to an explicit absolute path with
  // no dialog. Mirrors docs:save-new's bookkeeping (write allowlist, disk state,
  // recents, tab-title sync) but targets a caller-chosen path and refuses to
  // clobber an existing file unless the caller asked for overwrite.
  ipcMain.handle(
    'docs:save-to',
    async (event, filePath: string, data: ArrayBuffer, overwrite: boolean) => {
      try {
        if (tornDownWcIds.has(event.sender.id)) return { ok: false }
        if (typeof filePath !== 'string' || !isAbsolute(filePath)) {
          return { ok: false, error: 'path must be absolute' }
        }
        if (extname(filePath).toLowerCase() !== '.docx') {
          return { ok: false, error: 'path must point to a .docx file' }
        }
        // only a target the MCP layer resolved for this tab may be written
        if (!canDocWrite(event.sender.id, filePath)) {
          return { ok: false, error: 'save target was not authorized' }
        }
        const existed = existsSync(filePath)
        if (!overwrite && existed) {
          return {
            ok: false,
            error: `file already exists: ${filePath} (pass overwrite:true to replace it)`,
          }
        }
        await mkdir(dirname(filePath), { recursive: true })
        const passwordState = snapshotDocPassword(event.sender.id, null)
        const { bytes: plain, hashes } = await materializeLazyDocx(Buffer.from(data))
        const bytes = passwordState.password ? encryptDocx(plain, passwordState.password) : plain
        await atomicWriteFile(filePath, bytes)
        // teardown may have happened while the write was in flight — only a file
        // this handler created is safe to roll back; an overwritten one stays
        const rollback = async (): Promise<{ ok: false }> => {
          if (!existed) await unlink(filePath).catch(() => {})
          return { ok: false }
        }
        if (tornDownWcIds.has(event.sender.id)) return rollback()
        await rememberDiskState(event.sender.id, filePath, sha256Hex(bytes))
        pointLazyMediaAt(
          hashes,
          filePath,
          event.sender.id,
          passwordState.password ? plain : undefined,
        )
        if (tornDownWcIds.has(event.sender.id)) return rollback()
        const passwordIntentPending = commitDocPasswordSave(
          event.sender.id,
          passwordState,
          filePath,
        )
        pushRecent(filePath)
        notifyFileSaved(event.sender, filePath)
        return {
          ok: true,
          path: filePath,
          passwordIntentPending,
          ...reissuedDoc(!!passwordState.password, hashes, plain),
        }
      } catch (err) {
        return { ok: false, error: String(err) }
      }
    },
  )

  ipcMain.handle('docs:recent', () =>
    readJson<string[]>(RECENT_PATH(), []).filter((p) => existsSync(p)),
  )

  ipcMain.handle('docs:pick-image', async (event) => {
    const result = await openDialog(event, {
      title: tm('dlgInsertImage'),
      filters: [{ name: tm('filterImages'), extensions: ['png', 'jpg', 'jpeg', 'gif'] }],
      properties: ['openFile'],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
    const mime = IMAGE_MIME[ext]
    if (!mime) return null
    return {
      base64: readFileSync(filePath).toString('base64'),
      mime,
      name: basename(filePath),
    }
  })

  ipcMain.handle('files:pick', async (event): Promise<AttachmentAddResult | null> => {
    const result = await openDialog(event, {
      title: tm('dlgAddAttachment'),
      filters: [
        { name: tm('filterSupported'), extensions: [...ATTACHMENT_EXTS] },
        { name: tm('filterAll'), extensions: ['*'] },
      ],
      properties: ['openFile', 'multiSelections'],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return collectAttachments(result.filePaths)
  })

  ipcMain.handle('files:add', (_event, paths: string[]) => collectAttachments(paths))

  ipcMain.handle(
    'files:read',
    async (
      _event,
      filePath: string,
      offset: number,
      maxChars: number,
    ): Promise<AttachmentReadResult> => {
      const name = basename(filePath)
      const ext = name.split('.').pop()?.toLowerCase() ?? ''
      if (!ATTACHMENT_EXTS.has(ext)) return { ok: false, error: tm('errUnsupportedExt', { ext }) }
      if (ATTACHMENT_IMAGE_EXTS.has(ext)) {
        return { ok: false, error: tm('errImageNoText') }
      }
      try {
        const text = await extractAttachmentText(filePath)
        const start = Math.max(0, Math.floor(offset) || 0)
        const size = Math.min(Math.max(1, Math.floor(maxChars) || 1), 48_000)
        return {
          ok: true,
          name,
          totalChars: text.length,
          offset: start,
          text: text.slice(start, start + size),
        }
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) }
      }
    },
  )

  // image attachments read raw bytes → base64; AiPanel puts them into the user message's images for multimodal
  ipcMain.handle('files:read-image', (_event, filePath: string): AttachmentImageResult => {
    const name = basename(filePath)
    const ext = name.split('.').pop()?.toLowerCase() ?? ''
    const mime = ATTACHMENT_IMAGE_MIME[ext]
    if (!mime) return { ok: false, error: `${name}: ${tm('errNotImage')}` }
    try {
      const stat = statSync(filePath)
      if (stat.size > ATTACHMENT_IMAGE_MAX_BYTES) {
        return { ok: false, error: `${name}: ${tm('errImageTooLarge')}` }
      }
      return { ok: true, base64: readFileSync(filePath).toString('base64'), mime }
    } catch {
      return { ok: false, error: `${name}: ${tm('errUnreadable')}` }
    }
  })

  // clipboard-pasted images (screenshots and other bitmaps with no local path): saved to a temp file then use the regular attachment path
  ipcMain.handle(
    'files:add-pasted-image',
    (_event, data: unknown, ext: unknown): AttachmentAddResult => {
      const filePath = savePastedImage(data, ext)
      return filePath
        ? collectAttachments([filePath])
        : { accepted: [], rejected: [tm('errNotImage')] }
    },
  )

  // r136: copying an embedded picture must yield a real bitmap for external
  // apps (Gmail pasted blank) plus plain <img> html for cross-document paste
  // (the protected wrapper round-tripped as a "protected content" shell).
  ipcMain.handle(
    'docs:copy-image-to-clipboard',
    async (_event, dataUrl: unknown, meta: unknown): Promise<boolean> => {
      // Renderer-supplied bitmap: validate before base64 decode + nativeImage
      // (a huge data URL would OOM the main process). Non-data URLs are
      // lazy-media ids resolved below.
      if (!validCopyImageDataUrl(dataUrl)) return false
      let bytes: Buffer
      let htmlSrc = dataUrl
      if (dataUrl.startsWith('data:image/')) {
        bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64')
      } else {
        const media = await readLazyMedia(dataUrl)
        if (!media) return false
        bytes = media.body
        // another document cannot resolve this document's lazy URL; inline the bytes
        htmlSrc = `data:${media.mime};base64,${bytes.toString('base64')}`
      }
      // createFromBuffer, not createFromDataURL — the latter returns an empty
      // image for valid PNGs in this Electron
      const image = nativeImage.createFromBuffer(bytes)
      if (image.isEmpty()) return false
      // the html flavor carries the DISPLAY size + layout meta so an in-app
      // paste keeps size/align/wrap instead of falling back to bitmap pixels
      let width = image.getSize().width
      let height = image.getSize().height
      let metaAttr = ''
      if (typeof meta === 'string' && meta.length <= 2048) {
        try {
          const parsed = copyImageDisplaySize(meta)
          if (parsed.width !== undefined) width = parsed.width
          if (parsed.height !== undefined) height = parsed.height
          const escaped = meta.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
          metaAttr = ` data-image-meta="${escaped}"`
        } catch {
          /* malformed payload: plain img */
        }
      }
      clipboard.write({
        image,
        html: `<img src="${htmlSrc}" width="${width}" height="${height}"${metaAttr}>`,
      })
      return true
    },
  )

  // renderer print scale (inverse of the preview's print zoom, see print-zoom.ts)
  // Infinity passes a `> 0` check, so require finiteness before handing it to Chromium.
  const pdfScale = (scale?: number) => printScaleOption(scale)
  const printScale = (scale?: number) =>
    typeof scale === 'number' && Number.isFinite(scale) && scale > 0 && scale !== 1
      ? { scaleFactor: Math.round(scale * 100) }
      : {}

  ipcMain.handle('docs:get-printers', async (event) => {
    try {
      return await event.sender.getPrintersAsync()
    } catch {
      return []
    }
  })

  ipcMain.handle('docs:print', async (event, scale?: number, options?: DocsPrintOptions) => {
    // print the calling tab's own content; zero margins — the docx page padding provides them.
    // Resolves when the system dialog is dismissed; the print dialog stays open on cancel
    // (ok=false without error) and surfaces real failures.
    return new Promise<{ ok: boolean; error?: string }>((resolve) => {
      const printOpts: Record<string, unknown> = {
        margins: { marginType: 'none' },
        ...printScale(scale),
      }
      if (options?.deviceName) {
        printOpts.deviceName = options.deviceName
      }
      if (typeof options?.silent === 'boolean') {
        printOpts.silent = options.silent
      }
      if (options?.copies && Number.isInteger(options.copies) && options.copies > 0) {
        printOpts.copies = options.copies
      }
      if (options?.duplexMode) {
        printOpts.duplexMode = options.duplexMode
      }
      if (typeof options?.collate === 'boolean') {
        printOpts.collate = options.collate
      }
      if (typeof options?.landscape === 'boolean') {
        printOpts.landscape = options.landscape
      }
      event.sender.print(
        printOpts,
        (success, failureReason) => {
          resolve({
            ok: success,
            ...(failureReason && !/cancel/i.test(failureReason) ? { error: failureReason } : {}),
          })
        },
      )
    })
  })

  ipcMain.handle(
    'docs:export-pdf',
    async (
      event,
      defaultName: string,
      pageWidthTwips: number,
      pageHeightTwips: number,
      outPath?: string,
      scale?: number,
    ) => {
      // renderer-supplied outPath is only honored when a save dialog authorized it before
      let filePath = outPath ?? null
      if (filePath && !canPdfWrite(event.sender.id, filePath)) {
        return { ok: false, error: 'export target is not an authorized path' }
      }
      if (!filePath) {
        const result = await saveDialog(event, {
          title: tm('dlgExportPdf'),
          defaultPath: defaultName.replace(/\.docx$/i, '') + '.pdf',
          filters: [{ name: 'PDF', extensions: ['pdf'] }],
        })
        if (result.canceled || !result.filePath) return { ok: false }
        filePath = result.filePath
        allowPdfWrite(event.sender.id, filePath)
      }
      try {
        const data = await event.sender.printToPDF({
          printBackground: true,
          // custom pageSize is in inches; the docx page padding provides the margins
          pageSize: {
            width: pageWidthTwips / TWIPS_PER_INCH,
            height: pageHeightTwips / TWIPS_PER_INCH,
          },
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          ...pdfScale(scale),
        })
        await atomicWriteFile(filePath, data)
        if (!isImageExportTemp(event.sender.id, filePath)) openGeneratedFile(filePath)
        return { ok: true, path: filePath }
      } catch (err) {
        // path is already authorized, so the renderer can retry chunked to the same target
        return { ok: false, error: String(err), path: filePath }
      }
    },
  )

  ipcMain.handle('docs:save-image-as', async (event, src: unknown) => {
    if (tornDownWcIds.has(event.sender.id) || typeof src !== 'string') return { ok: false }
    return saveImageFromUrl(dialogParent(event), src, {
      title: tm('dlgSaveAs'),
      fallbackDir: defaultSaveDir(),
    })
  })

  ipcMain.handle('docs:pick-export-images-target', async (event) => {
    let dir = testExportDir
    if (!dir) {
      const r = await openDialog(event, {
        title: tm('dlgPickExportDir'),
        properties: ['openDirectory', 'createDirectory'],
      })
      dir = r.canceled ? null : (r.filePaths[0] ?? null)
    }
    if (!dir) return null
    const wcId = event.sender.id
    const pdfPath = join(tmpdir(), `genoffice-docs-images-${randomUUID()}.pdf`)
    allowPdfWrite(wcId, pdfPath)
    imageExportTemps.set(wcId, (imageExportTemps.get(wcId) ?? new Set()).add(pdfPath))
    imageExportDirs.set(wcId, (imageExportDirs.get(wcId) ?? new Set()).add(dir))
    return { dir, pdfPath }
  })

  ipcMain.handle('docs:take-export-pdf', async (event, pdfPath: string) => {
    const temps = imageExportTemps.get(event.sender.id)
    if (typeof pdfPath !== 'string' || !temps?.has(pdfPath)) {
      return { ok: false, error: 'not an image-export temp file' }
    }
    temps.delete(pdfPath)
    try {
      const data = await readFile(pdfPath)
      return { ok: true, base64: data.toString('base64') }
    } catch (err) {
      return { ok: false, error: String(err) }
    } finally {
      await rm(pdfPath, { force: true })
    }
  })

  ipcMain.handle(
    'docs:write-export-image',
    async (event, dir: string, fileName: string, pngBase64: string) => {
      if (typeof dir !== 'string' || !imageExportDirs.get(event.sender.id)?.has(dir)) {
        return { ok: false, error: 'export target is not an authorized folder' }
      }
      if (
        typeof fileName !== 'string' ||
        fileName !== basename(fileName) ||
        !/^[^/\\]+\.png$/.test(fileName)
      ) {
        return { ok: false, error: 'invalid image file name' }
      }
      try {
        const filePath = join(dir, fileName)
        await atomicWriteFile(filePath, Buffer.from(String(pngBase64), 'base64'))
        return { ok: true, path: filePath }
      } catch (err) {
        return { ok: false, error: String(err) }
      }
    },
  )

  ipcMain.handle(
    'docs:export-html',
    async (event, defaultName: string, html: string, outPath?: string) => {
      if (typeof html !== 'string' || !html) return { ok: false, error: 'empty document' }
      let filePath = outPath ?? null
      if (filePath && !canPdfWrite(event.sender.id, filePath)) {
        return { ok: false, error: 'export target is not an authorized path' }
      }
      if (!filePath) {
        const result = await saveDialog(event, {
          title: tm('dlgExportHtml'),
          defaultPath: defaultName.replace(/\.docx$/i, '') + '.html',
          filters: [{ name: 'HTML', extensions: ['html'] }],
        })
        if (result.canceled || !result.filePath) return { ok: false }
        filePath = result.filePath
        allowPdfWrite(event.sender.id, filePath)
      }
      try {
        await atomicWriteFile(
          filePath,
          Buffer.from(await inlineLazyMediaInHtml(html, readLazyMedia), 'utf8'),
        )
        openGeneratedFile(filePath)
        return { ok: true, path: filePath }
      } catch (err) {
        return { ok: false, error: String(err), path: filePath }
      }
    },
  )

  // mixed paper-size export: the renderer prints group by group per size (other pages hidden via CSS); this produces one group's bytes
  ipcMain.handle(
    'docs:print-pdf-buffer',
    async (event, pageWidthTwips: number, pageHeightTwips: number, scale?: number) => {
      // Renderer-supplied page geometry reaches Chromium printToPDF verbatim:
      // reject non-finite/out-of-range sizes (0.5in..50in) and scales (0.1..5).
      if (
        !validPrintDim(pageWidthTwips) ||
        !validPrintDim(pageHeightTwips) ||
        !validPrintScale(scale)
      ) {
        return { ok: false, error: 'invalid page size or scale' }
      }
      try {
        const data = await event.sender.printToPDF({
          printBackground: true,
          pageSize: {
            width: pageWidthTwips / TWIPS_PER_INCH,
            height: pageHeightTwips / TWIPS_PER_INCH,
          },
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          ...pdfScale(scale),
        })
        return { ok: true, base64: data.toString('base64') }
      } catch (err) {
        return { ok: false, error: String(err) }
      }
    },
  )

  // merge grouped PDF fragments into one file in page order (pdf-lib)
  ipcMain.handle(
    'docs:save-merged-pdf',
    async (event, defaultName: string, base64Parts: string[], outPath?: string) => {
      let filePath = outPath ?? null
      if (filePath && !canPdfWrite(event.sender.id, filePath)) {
        return { ok: false, error: 'export target is not an authorized path' }
      }
      if (!filePath) {
        const result = await saveDialog(event, {
          title: tm('dlgExportPdf'),
          defaultPath: defaultName.replace(/\.docx$/i, '') + '.pdf',
          filters: [{ name: 'PDF', extensions: ['pdf'] }],
        })
        if (result.canceled || !result.filePath) return { ok: false }
        filePath = result.filePath
        allowPdfWrite(event.sender.id, filePath)
      }
      try {
        const { PDFDocument } = await import('pdf-lib')
        const merged = await PDFDocument.create()
        for (const b64 of base64Parts) {
          const part = await PDFDocument.load(Buffer.from(b64, 'base64'))
          const pages = await merged.copyPages(part, part.getPageIndices())
          for (const page of pages) merged.addPage(page)
        }
        await atomicWriteFile(filePath, Buffer.from(await merged.save()))
        if (!isImageExportTemp(event.sender.id, filePath)) openGeneratedFile(filePath)
        return { ok: true, path: filePath }
      } catch (err) {
        return { ok: false, error: String(err) }
      }
    },
  )

  ipcMain.handle('win:new', (_event, openPath: string | null) => {
    // A pathless new tab/window starts as a blank document, not the start screen
    const path = openPath ?? undefined
    if (shellHooks) shellHooks.openTab(path, path ? undefined : { newBlank: true })
    else {
      const win = createDocsWindow(path)
      if (!path) markDocsNewBlank(win.webContents.id)
    }
  })

  ipcMain.handle('win:list', (): DocsTabInfo[] => {
    if (shellHooks) return shellHooks.listTabs()
    return BrowserWindow.getAllWindows().map((w) => ({
      id: String(w.id),
      title: w.getTitle(),
      focused: w.isFocused(),
    }))
  })

  ipcMain.handle('win:focus', (_event, id: string) => {
    if (shellHooks) {
      shellHooks.focusTab(id)
      return
    }
    const win = BrowserWindow.fromId(Number(id))
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  })
}

/** hooks injected by the shell in tab mode; standalone mode leaves these unset
 * and falls back to real multi-BrowserWindow behavior. */
interface DocsShellHooks {
  openTab(openPath?: string, options?: { newBlank?: boolean }): void
  /** open a blank docs tab that consumes the queued AI content on boot (create_document) */
  openAiDocTab?(content: AiDocContent): void
  listTabs(): DocsTabInfo[]
  focusTab(id: string): void
  /** closes the calling tab instead of the whole shell window (Cmd+W / role:'close') */
  closeActiveTab(): void
  /** Shell router used to open exported PDFs in a new GenOffice tab. */
  openGeneratedPath?(path: string): boolean
}
let shellHooks: DocsShellHooks | null = null
export function setDocsShellHooks(hooks: DocsShellHooks | null): void {
  shellHooks = hooks
}

/** After writing an exported/AI-generated file: open it in the right tab
 * (shell) or reveal it in the folder (standalone). Tab-opening failure must
 * not report the write itself as failed — the file is already persisted. */
function openGeneratedFile(path: string): void {
  // Headless export has no tab strip and no user: revealing the file in Finder
  // would be the only visible effect of a run that must stay silent.
  if (isHeadlessMode()) return
  try {
    if (shellHooks?.openGeneratedPath?.(path)) return
  } catch (err) {
    console.warn('[docs] Failed to open generated file:', err)
  }
  shell.showItemInFolder(path)
}

/** Pick a safe file-name stem for an AI-created document. */
export function sanitizeAiDocFileBase(title: string): string {
  // Control characters are intentionally rejected from generated file names.
  const cleaned = String(title ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[/\\:*?"<>|\u0000-\u001f]/g, '_')
    .trim()
    .slice(0, 80)
    .trim()
  return cleaned && cleaned !== '.' && cleaned !== '..' ? cleaned : 'Untitled'
}

/**
 * AI create_document: build a new standalone file in the default folder and
 * open it in a new tab. docx routes through a fresh blank docs tab that
 * inserts the queued content on boot and saves itself (the full-fidelity
 * HTML → docx conversion lives in the docs renderer); pdf and md are written
 * directly here. Also called by other apps' mains via shell-wired hooks.
 */
export async function createAiDocument(
  request: CreateDocumentRequest,
): Promise<CreateDocumentResult> {
  const type = request?.type
  const title = sanitizeAiDocFileBase(request?.title)
  const content = String(request?.content ?? '')
  if (!content.trim()) return { ok: false, error: 'content must not be empty' }
  try {
    if (type === 'docx') {
      const payload: AiDocContent = { title, html: content }
      if (shellHooks?.openAiDocTab) shellHooks.openAiDocTab(payload)
      else {
        const win = createDocsWindow(undefined)
        markDocsNewBlank(win.webContents.id)
        queueDocsAiContent(win.webContents.id, payload)
      }
      return { ok: true }
    }
    if (type === 'pdf') {
      const bytes = await printHtmlToPdf(
        buildPrintableHtml(title, content),
        () =>
          new BrowserWindow({ show: false, webPreferences: { sandbox: true, javascript: false } }),
      )
      const filePath = uniquePathIn(defaultSaveDir(), `${title}.pdf`)
      await writeFile(filePath, bytes)
      openGeneratedFile(filePath)
      return { ok: true, path: filePath }
    }
    if (type === 'md' || type === 'html') {
      const filePath = uniquePathIn(defaultSaveDir(), `${title}.${type}`)
      await writeFile(filePath, content, 'utf8')
      openGeneratedFile(filePath)
      return { ok: true, path: filePath }
    }
    return { ok: false, error: `unsupported document type: ${String(type)}` }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ---- application menu ----

function sendCommand(command: MenuCommand, payload?: string): void {
  activeDocsWebContents()?.send('menu:command', command, payload)
}

/**
 * Per-tab View-menu toggle state (AI Sidebar / Dark Mode), reported by each
 * renderer whenever it changes. The template can't hardcode `checked` — the
 * state lives in the renderer and differs per tab — so builds read the active
 * tab's last report, and reports from the active tab patch the built menu in
 * place (buildDocsMenu also re-runs on every tab focus switch).
 * Defaults mirror the renderer's initial state: sidebar shown, light canvas.
 */
const viewMenuStateByWebContents = new Map<number, { aiSidebar: boolean; darkCanvas: boolean }>()

function activeViewMenuState(): { aiSidebar: boolean; darkCanvas: boolean } {
  const id = activeDocsWebContents()?.id
  return (
    (id !== undefined ? viewMenuStateByWebContents.get(id) : undefined) ?? {
      aiSidebar: true,
      darkCanvas: false,
    }
  )
}

/** shell-injected items appended to the File menu (e.g. Back to Home); persists
 * across the internal rebuilds pushRecent() triggers */
let extraFileMenuItems: MenuItemConstructorOptions[] = []

export function setDocsExtraFileMenuItems(items: MenuItemConstructorOptions[]): void {
  extraFileMenuItems = items
}

/** Shell-installed gate: inside the shell the docs menu may only take over the
 * application menu while a docs tab is active — internal rebuilds (pushRecent
 * after opening/saving any file) must not clobber another tab's menu.
 * The standalone docs app registers no gate and always installs. */
let docsMenuGate: (() => boolean) | null = null

export function setDocsMenuGate(gate: () => boolean): void {
  docsMenuGate = gate
}

export function buildDocsMenu(): void {
  if (docsMenuGate && !docsMenuGate()) return
  const isMac = process.platform === 'darwin'
  const recent = readJson<string[]>(RECENT_PATH(), [])
    .filter((p) => existsSync(p))
    .slice(0, 10)

  const recentSubmenu: MenuItemConstructorOptions[] =
    recent.length > 0
      ? recent.map((p) => ({
          label: basename(p),
          sublabel: isMac ? undefined : p,
          toolTip: p,
          click: () => sendCommand('open-path', p),
        }))
      : [{ label: tm('menuNoRecent'), enabled: false }]

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { label: tm('menuPreferences'), click: () => sendCommand('preferences') },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),
    {
      label: tm('menuFile'),
      submenu: [
        { label: tm('menuNewDoc'), accelerator: 'CmdOrCtrl+N', click: () => sendCommand('new') },
        {
          label: tm('menuNewWindow'),
          accelerator: 'Shift+CmdOrCtrl+N',
          click: () => {
            if (shellHooks) shellHooks.openTab(undefined, { newBlank: true })
            else markDocsNewBlank(createDocsWindow().webContents.id)
          },
        },
        { label: tm('menuOpen'), accelerator: 'CmdOrCtrl+O', click: () => sendCommand('open') },
        { label: tm('menuOpenRecent'), submenu: recentSubmenu },
        ...(extraFileMenuItems.length > 0
          ? [{ type: 'separator' as const }, ...extraFileMenuItems]
          : []),
        { type: 'separator' },
        shellHooks
          ? {
              label: tm('menuClose'),
              accelerator: 'CmdOrCtrl+W',
              click: () => shellHooks?.closeActiveTab(),
            }
          : { role: 'close' as const, label: tm('menuClose') },
        { label: tm('menuSave'), accelerator: 'CmdOrCtrl+S', click: () => sendCommand('save') },
        {
          label: tm('menuSaveAs'),
          accelerator: 'Shift+CmdOrCtrl+S',
          click: () => sendCommand('save-as'),
        },
        { type: 'separator' },
        { label: tm('menuPageSetup'), click: () => sendCommand('page-setup') },
        { label: tm('menuExportPdf'), click: () => sendCommand('export-pdf') },
        { label: tm('menuExportHtml'), click: () => sendCommand('export-html') },
        { label: tm('menuExportImages'), click: () => sendCommand('export-images') },
        {
          label: tm('menuPrint'),
          accelerator: 'CmdOrCtrl+P',
          // routed through the renderer: it opens the pagination preview first so each
          // printed sheet is exactly one editor page (WYSIWYG), then invokes docs:print
          click: () => sendCommand('print'),
        },
      ],
    },
    {
      label: tm('menuEdit'),
      submenu: [
        { label: tm('menuUndo'), accelerator: 'CmdOrCtrl+Z', click: () => sendCommand('undo') },
        {
          label: tm('menuRedo'),
          accelerator: 'Shift+CmdOrCtrl+Z',
          click: () => sendCommand('redo'),
        },
        { type: 'separator' },
        { role: 'cut', label: tm('menuCut') },
        { role: 'copy', label: tm('menuCopy') },
        { role: 'paste', label: tm('menuPaste') },
        { role: 'pasteAndMatchStyle', label: tm('menuPasteMatch') },
        { type: 'separator' },
        {
          label: tm('menuFindReplace'),
          accelerator: 'CmdOrCtrl+F',
          click: () => sendCommand('find'),
        },
        {
          label: tm('menuGoTo'),
          accelerator: isMac ? 'Alt+Cmd+G' : 'Ctrl+G',
          click: () => sendCommand('goto'),
        },
        { type: 'separator' },
        { role: 'selectAll', label: tm('menuSelectAll') },
      ],
    },
    {
      label: tm('menuView'),
      submenu: [
        {
          label: tm('menuZoomIn'),
          accelerator: 'CmdOrCtrl+=',
          click: () => sendCommand('zoom-in'),
        },
        {
          label: tm('menuZoomOut'),
          accelerator: 'CmdOrCtrl+-',
          click: () => sendCommand('zoom-out'),
        },
        {
          label: tm('menuZoom100'),
          accelerator: 'CmdOrCtrl+0',
          click: () => sendCommand('zoom-100'),
        },
        {
          label: tm('menuZoom'),
          submenu: [
            ...[500, 200, 150, 125, 100, 75, 50, 25, 10].map((pct) => ({
              label: `${pct}%`,
              click: () => sendCommand('zoom-set', String(pct)),
            })),
            { label: tm('menuPageWidth'), click: () => sendCommand('zoom-page-width') },
            { label: tm('menuWholePage'), click: () => sendCommand('zoom-whole-page') },
          ],
        },
        { type: 'separator' },
        {
          id: 'docs-menu-ai-sidebar',
          type: 'checkbox',
          checked: activeViewMenuState().aiSidebar,
          label: tm('menuAiSidebar'),
          click: () => sendCommand('toggle-ai'),
        },
        {
          id: 'docs-menu-dark-mode',
          type: 'checkbox',
          checked: activeViewMenuState().darkCanvas,
          label: tm('menuDarkMode'),
          click: () => sendCommand('toggle-dark'),
        },
        { type: 'separator' },
        { role: 'togglefullscreen', label: tm('menuFullscreen') },
        ...(isDev ? [toggleDevToolsItem(appMenuLabels(getUiLang()))] : []),
      ],
    },
    {
      label: tm('menuInsert'),
      submenu: [
        { label: tm('menuInsertTable'), click: () => sendCommand('insert-table') },
        { label: tm('menuInsertImage'), click: () => sendCommand('insert-image') },
        // no CmdOrCtrl+Enter accelerator: a menu accelerator would intercept
        // the key before renderer inputs (comments panel / prompt modal use
        // Cmd+Enter to submit); the editor keymap handles it instead
        { label: tm('menuInsertPageBreak'), click: () => sendCommand('insert-page-break') },
        {
          label: tm('menuInsertLink'),
          accelerator: 'CmdOrCtrl+K',
          click: () => sendCommand('insert-link'),
        },
        { label: tm('menuInsertEquation'), click: () => sendCommand('insert-equation') },
        { type: 'separator' },
        { label: tm('menuComment'), click: () => sendCommand('insert-comment') },
      ],
    },
    {
      label: tm('menuFormat'),
      submenu: [
        { label: tm('menuBold'), accelerator: 'CmdOrCtrl+B', click: () => sendCommand('bold') },
        { label: tm('menuItalic'), accelerator: 'CmdOrCtrl+I', click: () => sendCommand('italic') },
        {
          label: tm('menuUnderline'),
          accelerator: 'CmdOrCtrl+U',
          click: () => sendCommand('underline'),
        },
        { type: 'separator' },
        {
          label: tm('menuAlign'),
          submenu: [
            { label: tm('menuAlignLeft'), click: () => sendCommand('align-left') },
            { label: tm('menuAlignCenter'), click: () => sendCommand('align-center') },
            { label: tm('menuAlignRight'), click: () => sendCommand('align-right') },
            { label: tm('menuAlignJustify'), click: () => sendCommand('align-justify') },
          ],
        },
        { type: 'separator' },
        {
          label: tm('menuFont'),
          accelerator: 'CmdOrCtrl+D',
          click: () => sendCommand('font-dialog'),
        },
        {
          label: tm('menuParagraph'),
          accelerator: 'Alt+CmdOrCtrl+M',
          click: () => sendCommand('paragraph-dialog'),
        },
      ],
    },
    {
      // Word's Table menu; the renderer answers with a hint when the caret is outside a table
      label: tm('menuTable'),
      submenu: [
        {
          label: tm('menuTableInsert'),
          submenu: [
            { label: tm('menuTableInsertTable'), click: () => sendCommand('insert-table') },
            { label: tm('menuTableColsLeft'), click: () => sendCommand('table-insert-cols-left') },
            {
              label: tm('menuTableColsRight'),
              click: () => sendCommand('table-insert-cols-right'),
            },
            {
              label: tm('menuTableRowsAbove'),
              click: () => sendCommand('table-insert-rows-above'),
            },
            {
              label: tm('menuTableRowsBelow'),
              click: () => sendCommand('table-insert-rows-below'),
            },
            { label: tm('menuTableCells'), click: () => sendCommand('table-insert-cells') },
          ],
        },
        {
          label: tm('menuTableDelete'),
          submenu: [
            { label: tm('menuTableDeleteTable'), click: () => sendCommand('table-delete-table') },
            {
              label: tm('menuTableDeleteColumns'),
              click: () => sendCommand('table-delete-columns'),
            },
            { label: tm('menuTableDeleteRows'), click: () => sendCommand('table-delete-rows') },
            { label: tm('menuTableCells'), click: () => sendCommand('table-delete-cells') },
          ],
        },
        {
          label: tm('menuTableSelect'),
          submenu: [
            { label: tm('menuTableSelectTable'), click: () => sendCommand('table-select-table') },
            { label: tm('menuTableSelectColumn'), click: () => sendCommand('table-select-column') },
            { label: tm('menuTableSelectRow'), click: () => sendCommand('table-select-row') },
            { label: tm('menuTableSelectCell'), click: () => sendCommand('table-select-cell') },
          ],
        },
        { type: 'separator' },
        { label: tm('menuTableMergeCells'), click: () => sendCommand('table-merge-cells') },
        { label: tm('menuTableSplitCells'), click: () => sendCommand('table-split-cells') },
        { label: tm('menuTableSplitTable'), click: () => sendCommand('table-split-table') },
        { type: 'separator' },
        {
          label: tm('menuTableAutoFit'),
          submenu: [
            {
              label: tm('menuTableAutoFitContents'),
              click: () => sendCommand('table-autofit-contents'),
            },
            {
              label: tm('menuTableAutoFitWindow'),
              click: () => sendCommand('table-autofit-window'),
            },
            { label: tm('menuTableFixedWidth'), click: () => sendCommand('table-autofit-fixed') },
            { type: 'separator' },
            {
              label: tm('menuTableDistributeRows'),
              click: () => sendCommand('table-distribute-rows'),
            },
            {
              label: tm('menuTableDistributeColumns'),
              click: () => sendCommand('table-distribute-columns'),
            },
          ],
        },
        { label: tm('menuTableRepeatHeader'), click: () => sendCommand('table-repeat-header') },
        { type: 'separator' },
        { label: tm('menuTableGridlines'), click: () => sendCommand('table-gridlines') },
        { label: tm('menuTableProperties'), click: () => sendCommand('table-properties') },
      ],
    },
    {
      // Word for Mac keeps Word Count in the Tools menu, not on the ribbon
      label: tm('menuTools'),
      submenu: [
        { label: tm('menuWordCount'), click: () => sendCommand('word-count') },
        { label: tm('menuAutoCorrect'), click: () => sendCommand('autocorrect-options') },
        // Word for Mac keeps Preferences in the application menu
        ...(isMac
          ? []
          : [{ label: tm('menuPreferences'), click: () => sendCommand('preferences') }]),
        { type: 'separator' },
        // Runs the same AI proofread as Review > Editor (renderer shows the one-time ack)
        { label: tm('menuAiProofread'), click: () => sendCommand('ai-proofread') },
      ],
    },
    windowMenuTemplate(process.platform, appMenuLabels(getUiLang())),
    {
      label: tm('menuHelp'),
      role: 'help',
      submenu: [
        {
          label: tm('menuShortcuts'),
          accelerator: 'CmdOrCtrl+/',
          click: () => sendCommand('shortcuts'),
        },
        { type: 'separator' },
        { label: tm('menuDocsHelp'), enabled: false },
        { type: 'separator' },
        checkUpdatesMenuItem(appMenuLabels(getUiLang())),
        aboutMenuItem(appMenuLabels(getUiLang())),
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ---- headless export ----

/** hidden export windows: webContents id -> what the renderer must write */
const headlessExportTargets = new Map<number, HeadlessExportTarget>()
/** settled by 'docs:headless-export-done' (or by the renderer dying) */
const headlessExportWaiters = new Map<number, (result: HeadlessExportReport) => void>()

interface HeadlessExportReport {
  ok: boolean
  error?: string
}

/**
 * Render `input` to `outPath` (as PDF or standalone HTML) with no visible window.
 *
 * The window is wired exactly like createDocsWindow's (same preload, sandbox
 * and `backgroundThrottling: false`) and the document rides the normal
 * pending-open queue, so the renderer runs its usual load -> paginate ->
 * export pipeline; only the save dialog is skipped, by pre-authorizing
 * `outPath` the way a dialog would. Rejects with the renderer's reason when
 * the export fails or the deadline passes.
 */
export async function exportDocsHeadless(
  input: string,
  outPath: string,
  format: HeadlessExportFormat = 'pdf',
  timeoutMs = 300_000,
): Promise<void> {
  const win = new BrowserWindow({
    show: false,
    width: 1360,
    height: 900,
    webPreferences: {
      preload: runtime.preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  })
  const wcId = win.webContents.id
  pendingWindowOpens.set(wcId, input)
  headlessExportTargets.set(wcId, { outPath, format })
  allowPdfWrite(wcId, outPath)
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const report = await new Promise<HeadlessExportReport>((resolve) => {
      headlessExportWaiters.set(wcId, resolve)
      win.webContents.on('render-process-gone', (_event, details) =>
        resolve({ ok: false, error: `docs renderer stopped (${details.reason})` }),
      )
      timer = setTimeout(
        () => resolve({ ok: false, error: `docs export timed out after ${timeoutMs}ms` }),
        timeoutMs,
      )
      void win.webContents.loadURL(rendererUrl(runtime.rendererUrl, 'docs'))
    })
    if (!report.ok) throw new Error(report.error ?? 'docs export failed')
  } finally {
    if (timer) clearTimeout(timer)
    headlessExportWaiters.delete(wcId)
    headlessExportTargets.delete(wcId)
    pendingWindowOpens.delete(wcId)
    if (!win.isDestroyed()) win.destroy()
  }
}

// ---- window ----

export function createDocsWindow(openPath?: string): BrowserWindow {
  const win = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 720,
    minHeight: 550,
    title: 'Xiao Office Docs',
    // Word-like custom title bar (document name centered, quick-access buttons)
    ...(process.platform === 'darwin'
      ? { titleBarStyle: 'hiddenInset' as const }
      : {
          titleBarStyle: 'hidden' as const,
          titleBarOverlay: { color: '#ffffff', symbolColor: '#444444', height: 40 },
        }),
    // packaged builds embed the icon (build/icon.icns|ico); dev needs the file path
    ...(isDev && process.platform !== 'darwin'
      ? { icon: join(app.getAppPath(), 'build/icon.png') }
      : {}),
    webPreferences: {
      preload: runtime.preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  })

  if (process.platform === 'darwin') {
    win.setTitle('')
    win.on('page-title-updated', (event) => event.preventDefault())
  }

  if (!mainWindow) {
    mainWindow = win
    rendererReady = false
  }
  // captured up front: webContents is already destroyed inside the 'closed' handler
  const webContentsId = win.webContents.id
  if (openPath) pendingWindowOpens.set(webContentsId, openPath)

  win.webContents.setWindowOpenHandler(({ url }) => {
    const target = safeExternalUrl(url)
    if (target) void shell.openExternal(target)
    return { action: 'deny' }
  })

  void win.loadURL(rendererUrl(runtime.rendererUrl, 'docs'))
  // close guard for standalone-window mode (tab mode goes through the same flow via the shell's tab-manager/window-close path)
  let closeConfirmed = false
  win.on('close', (event) => {
    if (closeConfirmed) return
    event.preventDefault()
    void requestDocsClose(win.webContents, win).then((proceed) => {
      if (proceed && !win.isDestroyed()) {
        closeConfirmed = true
        win.close()
      }
    })
  })
  win.on('closed', () => {
    pendingWindowOpens.delete(webContentsId)
    dropDocWriter(webContentsId)
    // release any close-guard waiter still keyed on the gone webContents
    closeCheckWaiters.get(webContentsId)?.({ dirty: false, autoSave: false })
    closeCheckWaiters.delete(webContentsId)
    closeSaveWaiters.get(webContentsId)?.(false)
    closeSaveWaiters.delete(webContentsId)
    if (mainWindow === win) {
      mainWindow = BrowserWindow.getAllWindows().find((w) => w !== win) ?? null
      if (!mainWindow) rendererReady = false
    }
  })
  return win
}

/** tab-mode equivalent of createDocsWindow: same runtime/IPC wiring, no BrowserWindow of its own. */
// ── Close guard (aligned with sheets/pdf/slides): dirty documents prompt Save/Don't Save/Cancel before closing a tab/window ──
// docs' dirty state is a composite flag in the renderer; the main process doesn't mirror it and queries once at close time.
interface DocsCloseState {
  dirty: boolean
  autoSave: boolean
  /** Open file path (for recovery-copy cleanup on "Don't Save") */
  filePath?: string | null
  /** The renderer never replied to the close check (busy or wedged) */
  unresponsive?: boolean
}
const closeCheckWaiters = new Map<number, (state: DocsCloseState) => void>()
const closeSaveWaiters = new Map<number, (ok: boolean) => void>()

ipcMain.on('docs:view-menu-state', (event, state: unknown) => {
  const s = state as { aiSidebar?: unknown; darkCanvas?: unknown } | null
  const next = { aiSidebar: s?.aiSidebar === true, darkCanvas: s?.darkCanvas === true }
  if (!viewMenuStateByWebContents.has(event.sender.id)) {
    const id = event.sender.id
    event.sender.once('destroyed', () => viewMenuStateByWebContents.delete(id))
  }
  viewMenuStateByWebContents.set(event.sender.id, next)
  // patch the live menu only for the active tab; an inactive tab's state gets
  // picked up by the buildDocsMenu run its next focus triggers
  if (event.sender.id !== activeDocsWebContents()?.id) return
  const menu = Menu.getApplicationMenu()
  const ai = menu?.getMenuItemById('docs-menu-ai-sidebar')
  if (ai) ai.checked = next.aiSidebar
  const dark = menu?.getMenuItemById('docs-menu-dark-mode')
  if (dark) dark.checked = next.darkCanvas
})

ipcMain.on('docs:close-check-result', (event, state: unknown) => {
  const waiter = closeCheckWaiters.get(event.sender.id)
  if (!waiter) return
  closeCheckWaiters.delete(event.sender.id)
  const s = state as { dirty?: unknown; autoSave?: unknown; filePath?: unknown } | boolean
  waiter(
    typeof s === 'boolean'
      ? { dirty: s, autoSave: false }
      : {
          dirty: s?.dirty === true,
          autoSave: s?.autoSave === true,
          filePath: typeof s?.filePath === 'string' ? s.filePath : null,
        },
  )
})

ipcMain.on('docs:close-save-result', (event, ok: unknown) => {
  const waiter = closeSaveWaiters.get(event.sender.id)
  if (!waiter) return
  closeSaveWaiters.delete(event.sender.id)
  waiter(ok === true)
})

/** Ask the renderer for pre-close state (dirty flag + autosave switch); no reply within 2s
 * fails CLOSED — a busy or wedged renderer may well hold unsaved changes, so the caller
 * prompts instead of closing silently. Concurrent callers share one query: a second
 * request must not overwrite the pending waiter (that stranded the first until timeout). */
const closeStateQueries = new Map<number, Promise<DocsCloseState>>()

function queryCloseState(contents: WebContents): Promise<DocsCloseState> {
  if (contents.isDestroyed()) return Promise.resolve({ dirty: false, autoSave: false })
  const pending = closeStateQueries.get(contents.id)
  if (pending) return pending
  const query = new Promise<DocsCloseState>((resolve) => {
    const timer = setTimeout(() => {
      closeCheckWaiters.delete(contents.id)
      resolve({ dirty: true, autoSave: false, unresponsive: true })
    }, 2000)
    closeCheckWaiters.set(contents.id, (state) => {
      clearTimeout(timer)
      resolve(state)
    })
    contents.send('docs:close-check')
  }).finally(() => closeStateQueries.delete(contents.id))
  closeStateQueries.set(contents.id, query)
  return query
}

export async function docsQueryDirty(contents: WebContents): Promise<boolean> {
  return (await queryCloseState(contents)).dirty
}

/** Ask the renderer to run the full save flow and await the result (failure/timeout = false). */
function requestRendererSave(contents: WebContents): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => {
      closeSaveWaiters.delete(contents.id)
      resolve(false)
    }, 120_000)
    closeSaveWaiters.set(contents.id, (ok) => {
      clearTimeout(timer)
      resolve(ok)
    })
    contents.send('docs:close-save-request')
  })
}

/**
 * Close guard for the docs renderer: true means proceed with closing.
 * Clean → true; with changes → Save/Don't Save/Cancel. On Save, ask the renderer
 * to run the full save flow (new documents open Save As) and await the result;
 * failure/cancel/timeout keeps the document open.
 */
export function requestDocsClose(
  contents: WebContents,
  parent?: BrowserWindow | null,
): Promise<boolean> {
  // re-entry (close clicked again while the prompt is up) joins the same flow
  // instead of stacking dialogs / stranding the first waiter
  const pending = docsCloseRequests.get(contents.id)
  if (pending) return pending
  const request = performDocsClose(contents, parent).finally(() =>
    docsCloseRequests.delete(contents.id),
  )
  docsCloseRequests.set(contents.id, request)
  return request
}

const docsCloseRequests = new Map<number, Promise<boolean>>()

async function performDocsClose(
  contents: WebContents,
  parent?: BrowserWindow | null,
): Promise<boolean> {
  const state = await queryCloseState(contents)
  if (!state.dirty || contents.isDestroyed()) return true
  if (state.unresponsive) {
    // No reply: saving through the renderer won't work either — offer Close Anyway / Cancel
    const options = {
      type: 'warning' as const,
      message: tm('closeNoReplyMsg'),
      detail: tm('closeNoReplyDetail'),
      buttons: [tm('btnCloseAnyway'), tm('btnCancel')],
      defaultId: 1,
      cancelId: 1,
      noLink: true,
    }
    const { response } =
      parent && !parent.isDestroyed()
        ? await dialog.showMessageBox(parent, options)
        : await dialog.showMessageBox(options)
    return response === 0
  }
  // autosave on (and has a path, already checked when the renderer reported): save silently and proceed; only prompt on failure
  if (state.autoSave && (await requestRendererSave(contents))) return true
  const options = {
    type: 'warning' as const,
    message: tm('closeUnsavedMsg'),
    detail: tm('closeUnsavedDetail'),
    buttons: [tm('menuSave'), tm('btnDontSave'), tm('btnCancel')],
    defaultId: 0,
    cancelId: 2,
    noLink: true,
  }
  const { response } =
    parent && !parent.isDestroyed()
      ? await dialog.showMessageBox(parent, options)
      : await dialog.showMessageBox(options)
  if (response === 2) return false
  if (response === 1) {
    // Explicitly discarded: also drop the recovery copy so the next open doesn't offer it
    if (state.filePath) clearRecoveryCopy(state.filePath)
    return true
  }
  return requestRendererSave(contents)
}

export function createDocsView(openPath?: string): WebContentsView {
  const view = new WebContentsView({
    webPreferences: {
      preload: runtime.preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  })

  if (openPath) pendingWindowOpens.set(view.webContents.id, openPath)

  view.webContents.setWindowOpenHandler(({ url }) => {
    const target = safeExternalUrl(url)
    if (target) void shell.openExternal(target)
    return { action: 'deny' }
  })

  // mode=tab: the shell's tab strip owns the traffic lights / caption buttons,
  // so the ribbon must not reserve space for them
  void view.webContents.loadURL(rendererUrl(runtime.rendererUrl, 'docs', { mode: 'tab' }))
  // view.webContents becomes undefined after destroy, so grab the id beforehand
  const wcId = view.webContents.id
  view.webContents.once('destroyed', () => {
    pendingWindowOpens.delete(wcId)
    dropDocWriter(wcId)
    closeCheckWaiters.get(wcId)?.({ dirty: false, autoSave: false })
    closeCheckWaiters.delete(wcId)
    closeSaveWaiters.get(wcId)?.(false)
    closeSaveWaiters.delete(wcId)
  })
  return view
}

/** true when at least one docs window is open (shell menu switching) */
export function hasDocsWindow(): boolean {
  return mainWindow !== null
}

// ---- standalone lifecycle (apps/docs running on its own) ----

export function startDocsStandalone(): void {
  registerRendererScheme()
  installNavigationGuard(app)
  installContextMenu(app, () => contextMenuLabels(getUiLang()))
  // dev runs must not share the packaged app's userData (recent files, AI settings)
  // or its single-instance lock — otherwise `npm run dev` silently quits whenever
  // the installed GenOffice Docs is open and forwards its argv there instead.
  // AI_OFFICE_USER_DATA: E2E/screenshot runs isolate userData (and the
  // single-instance lock) so parallel automation sessions don't evict each other
  if (process.env.AI_OFFICE_USER_DATA) app.setPath('userData', process.env.AI_OFFICE_USER_DATA)
  else if (isDev) app.setPath('userData', join(app.getPath('appData'), 'GenOffice Docs Dev'))

  const hasSingleInstanceLock = app.requestSingleInstanceLock()
  if (!hasSingleInstanceLock) {
    app.quit()
    return
  }

  app.on('open-file', (event, filePath) => {
    event.preventDefault()
    openExternalDocx(filePath)
  })

  app.on('second-instance', (_event, argv) => {
    openExternalDocx(findDocxPath(argv))
    mainWindow?.show()
    mainWindow?.focus()
  })

  registerAiIpc()
  registerProjectIpc()
  registerDocsIpc()

  app.whenReady().then(() => {
    if (process.platform === 'darwin') {
      app.setAboutPanelOptions({
        applicationName: 'Xiao Office',
        applicationVersion: app.getVersion(),
        copyright: 'Copyright © 2026 Xiao Office',
        version: app.getVersion(),
        authors: ['Xiao Office'],
        website: 'https://github.com/sansanxm/xiaooffice',
      })
    }
    installRendererProtocol({ docs: join(__dirname, '../renderer') })
    setUiLang(normalizeLang(process.env.GENOFFICE_LANG ?? app.getLocale()))
    // packaged builds get the Dock icon from icon.icns; dev shows Electron's default
    if (isDev && process.platform === 'darwin') {
      app.dock?.setIcon(join(app.getAppPath(), 'build/icon.png'))
    }
    buildDocsMenu()
    createDocsWindow()
    initDocsAutoUpdater(() => mainWindow)
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createDocsWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
