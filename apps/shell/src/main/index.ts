import { execSync, spawn } from 'node:child_process'
import {
  copyFileSync,
  cpSync,
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, extname, join, resolve } from 'node:path'
import {
  BrowserWindow,
  Menu,
  app,
  dialog,
  ipcMain,
  nativeImage,
  nativeTheme,
  session,
  shell,
  webContents,
} from 'electron'
import type { MenuItemConstructorOptions, NativeImage, WebContents } from 'electron'
import { atomicWriteFile } from './atomic-write'
import { tabStripOverlay } from './title-bar-overlay'
import menuDocxIcon1x from './assets/menu-docx.png?asset'
import menuDocxIcon2x from './assets/menu-docx@2x.png?asset'
import menuXlsxIcon1x from './assets/menu-xlsx.png?asset'
import menuXlsxIcon2x from './assets/menu-xlsx@2x.png?asset'
import menuPptxIcon1x from './assets/menu-pptx.png?asset'
import menuPptxIcon2x from './assets/menu-pptx@2x.png?asset'
import menuPdfIcon1x from './assets/menu-pdf.png?asset'
import menuPdfIcon2x from './assets/menu-pdf@2x.png?asset'
import menuMdIcon1x from './assets/menu-md.png?asset'
import menuMdIcon2x from './assets/menu-md@2x.png?asset'
import menuHtmlIcon1x from './assets/menu-html.png?asset'
import menuHtmlIcon2x from './assets/menu-html@2x.png?asset'
import menuHomeIcon1x from './assets/menu-home.png?asset'
import menuHomeIcon2x from './assets/menu-home@2x.png?asset'
import { createI18n, isLang, normalizeLang, setUiLang, type Lang } from '@genoffice/i18n'
import {
  DEFAULT_SAVE_DIR_KEY,
  DROP_OPEN_CHANNEL,
  GITHUB_REPO_URL,
  appMenuLabels,
  contextMenuLabels,
  editMenuTemplate,
  installContextMenu,
  installNavigationGuard,
  isUsableSaveDir,
  HEADLESS_EXIT,
  formatHeadlessEnvelope,
  headlessExitCode,
  parseHeadlessExportArgv,
  setHeadlessMode,
  type HeadlessArgvParse,
  showOpenDialogWithMemory,
  showSaveDialogWithMemory,
  windowMenuTemplate,
  aboutMenuItem,
  checkUpdatesMenuItem,
  setUpdateCheckInvoker,
  installRendererProtocol,
} from '@genoffice/electron-utils'
import { readAppSettings, writeAppSetting, writeAppSettings } from './app-settings'
import { OPEN_DOCUMENTS_FILE, clearOpenDocuments, publishOpenDocuments } from './open-documents'
import { startControlServer, type ControlServer } from './control-server'
import { controlHandler } from './control-handlers'
import { installCliLinkBestEffort } from './cli-link'
import { createDefaultAppService, execFileRunner } from './default-app'
import { registerIntegrationsIpc } from './integrations-ipc'
import {
  ANALYTICS_ENABLED_KEY,
  analyticsEnabledFrom,
  createAnalytics,
  ensureAnalyticsClientState,
  extractPackagedAnalyticsKeys,
  markAnalyticsFirstLaunchSent,
} from './analytics'
import type { Analytics, AnalyticsKeys } from './analytics'
import {
  LAST_RUN_VERSION_KEY,
  STAR_PROMPT_KEY,
  asStarPromptState,
  isUpgradeLaunch,
  shouldShowStarPrompt,
  shouldShowUpgradeStarPrompt,
  withDocOpen,
  withFirstRun,
  withResolved,
  withShown,
} from './star-prompt'
import {
  clearCloudProjectsStore,
  cloudProjectExternalUrl,
  readCloudProjectsStore,
  syncCloudProjects,
} from './cloud-projects'
import { handleDroppedFiles } from './dropped-files'
import { collectLaunchPaths } from './launch-paths'
import {
  genofficeLogout,
  gskLoginInfo,
  loadGenofficeAuth,
  setGskProxyUrl,
  startGenofficeLogin,
  watchGskApiKey,
} from '@genoffice/ai-search'

import {
  buildDocsMenu,
  configureDocsRuntime,
  docsFileRenamed,
  docsQueryDirty,
  requestDocsClose,
  readRecentFiles,
  readStarredFiles,
  recordRecentFile,
  removeRecentFiles,
  removeStarredFiles,
  replaceRecentFile,
  registerAiIpc,
  registerProjectIpc,
  toggleStarredFile,
  registerDocsIpc,
  exportDocsHeadless,
  setDocsExtraFileMenuItems,
  setDocsMenuGate,
  setDocsShellHooks,
  createAiDocument,
  projectFilePaths,
  projectFileRenamed,
  setDocsHostWindowHook,
  setDocsShellWindow,
  setDocsFileSavedHook,
  setDocsFileOpenedHook,
  setSessionPathResolver,
  defaultSaveDir,
  uniquePathIn,
  authorizeMcpDocWrite,
} from '../../../docs/src/main/docs-main'
import { blankXlsxBuffer } from '@genoffice/xlsx-gateway/gateway/csv-import'
import { blankPdfBuffer } from '../../../pdf/src/main/blank-pdf'
import {
  applyMcpSettings,
  clearMcpLogs,
  configureMcpRuntime,
  getMcpRecentLogs,
  mcpLogFilePath,
  mcpStatus,
  revealMcpLogFile,
  startMcpFromSettings,
  stopMcpSync,
  type McpSettings,
} from './mcp/app-mcp'
import { createCliRunner } from './mcp/cli-runner'
import { DEFAULT_MCP_PORT } from './mcp/mcp-server'
import { createDocsControl, installDocsBridge } from './mcp/docs-bridge'
import { createSlidesControl } from './mcp/slides-bridge'
import { createSheetsControl, installSheetsBridge } from './mcp/sheets-bridge'
import { createOpenDocumentsControl, createOpenTargetResolver } from './mcp/open-documents-bridge'
import {
  configureSheetsRuntime,
  exportSheetsPdfHeadless,
  hasActiveQueuedWorkbook,
  installSheetsMenu,
  markSheetsShuttingDown,
  requestSheetsClose,
  resolveSheetsSessionPath,
  markSheetsUntitledPath,
  authorizeMcpSheetWrite,
  sendSheetsMenuAction,
  sheetsFileRenamed,
  setSheetsCloseTabHook,
  setSheetsExtraFileMenuItems,
  setSheetsHostWindowHook,
  setSheetsShellWindow,
  setSheetsWorkbookOpenedHook,
  startSheetsCaptureServer,
  stopSheetsSidecar,
} from '../../../sheets/src/main/sheets-main'
import {
  configureSlidesRuntime,
  discardSlidesRecovery,
  exportSlidesPdfHeadless,
  installSlidesMenu,
  readSlidesRecentFiles,
  replaceSlidesRecentFile,
  requestSlidesClose,
  setSlidesCloseTabHook,
  setSlidesExtraFileMenuItems,
  setSlidesOpenedHook,
  setSlidesShellWindow,
  setSlidesShowBleed,
  slidesFileRenamed,
} from '../../../slides/src/main/slides-main'
import {
  configurePdfRuntime,
  flushPdfSave,
  markPdfUntitledPath,
  pdfFileRenamed,
  pdfIsDirty,
  requestPdfClose,
  requestPdfSaveAs,
  sendPdfPrintRequest,
  setPdfRenamedHook,
  setPdfRedactionSavedHook,
  setPdfSaveAsInFlight,
} from '../../../pdf/src/main/pdf-main'
import { PDF_CHANNELS } from '../../../pdf/src/shared/ipc'
import { convertPdfFileToDocxLocalWithPrompt, PdfLoadError } from './pdf2docx-local'
import { convertPdfFileToPptxLocalWithPrompt } from './pdf2pptx-local'
import { convertPdfFileToXlsxLocalWithPrompt } from './pdf2xlsx-local'
import {
  DOC_LEGACY_RE,
  PAGES_RE,
  PPT_LEGACY_RE,
  KEYNOTE_RE,
  convertLegacyDocumentToDocx,
  convertPagesDocumentToDocx,
  convertLegacyPresentationToPptx,
  convertKeynoteToPptx,
} from './legacy-formats'
import { closePdfPasswordDialog, promptPdfPassword } from './pdf-password-dialog'
import {
  configureMarkdownRuntime,
  exportMarkdownPdfHeadless,
  markdownDiscardPendingAssets,
  markdownFileRenamed,
  markdownReadText,
  markdownSaveToPath,
  requestMarkdownClose,
  requestMarkdownSave,
  sendMarkdownExportRequest,
  sendMarkdownPrintRequest,
  setMarkdownDocxExportedHook,
  setMarkdownFileSavedHook,
} from '../../../markdown/src/main/markdown-main'
import {
  configureHtmlRuntime,
  exportHtmlHeadless,
  htmlDiscardPendingAssets,
  htmlFileRenamed,
  htmlReadText,
  htmlSaveToPath,
  registerPrivilegedSchemes,
  requestHtmlClose,
  requestHtmlSave,
  sendHtmlExportRequest,
  sendHtmlPrintRequest,
  setHtmlDocxExportPrepareHook,
  setHtmlDocxExportedHook,
  setHtmlFileSavedHook,
  setHtmlPresentHooks,
  setHtmlProvisionalTitleHook,
} from '../../../html/src/main/html-main'
import type {
  AccountLoginEvent,
  AutoSaveDefault,
  FolderListing,
  FolderRoot,
  MoveConflictPolicy,
  MoveResult,
  NewFileOpts,
  RecentEntry,
  RecentPage,
  RenameResult,
  StarPromptShow,
  UiTheme,
  FileSearchPage,
  FileSearchQuery,
  FileSearchRerank,
  FileSearchSettings,
} from '../shared/home-api'
import { HOME_CHANNELS } from '../shared/home-api'
import {
  normalizeAiPanelPrefs,
  sameAiPanelPrefs,
  type AiPanelPrefs,
} from '@genoffice/ui/ai-panel-prefs'
import type { TabKind } from '../shared/tabs-api'
import { TABS_CHANNELS } from '../shared/tabs-api'
import { showErrorDialog } from './error-dialog'
import {
  matchesExtFamily,
  normalizeRecentQuery,
  pageRecentPaths,
  statPathEntries,
} from './recent-files'
import { isSameFile, pdfSaveAsTarget, isValidRawRenameName } from './rename-validation'
import {
  FolderWatcher,
  createFolder,
  describeRoot,
  isInsideRoot,
  pathsUnder,
  listFolder,
  movePathsInto,
  rebasePath,
  renameFolder,
  uniqueNameIn,
  type FolderErrors,
} from './folder-tree'
import {
  FOLDER_ROOTS_KEY,
  describeExtraRoot,
  readExtraRoots,
  withExtraRoot,
  withoutExtraRoot,
} from './folder-roots'
import extractWorkerPath from './file-index/extract-worker?modulePath'
import { FileIndexer } from './file-index/indexer'
import { FileIndexStore } from './file-index/store'
import {
  jevEndpointOf,
  normalizeFileSearchSettings,
  probeJev,
  SearchReranker,
} from './file-index/rerank'
import { runHeadlessExport, type HeadlessExporters } from './headless-export'
import { TabManager } from './tab-manager'
import {
  activateDetached,
  closeDetachedWithoutPrompt,
  createDetachedEditorWindow,
  detachedFilePaths,
  detachedOpenDocuments,
  detachedRenameFile,
  detachedSetFileFor,
  detachedWebContentsFor,
  detachedWindowForWebContents,
  findDetachedTabByPath,
  focusDetachedByPath,
  focusedDetachedKind,
  isDetachedTabId,
  setDetachedChangedListener,
} from './detached-windows'
import { applyUpdateChannel, checkForUpdatesNow, initAutoUpdater } from './updater'
import { isUpdateChannel, type UpdateChannel } from '../shared/update-api'

/**
 * GenOffice unified shell: ONE Electron app, ONE BrowserWindow, hosting the
 * docs and sheets modules as WebContentsView tabs behind a WPS-style tab
 * strip. The shell owns the lifecycle — single-instance lock, file-
 * association routing by extension, and per-active-tab menu switching.
 * Renderers load from each module's build output (apps/docs/out,
 * apps/sheets/out), so build those before running the shell.
 */

// ANY unpacked run (`npm run shell`, `npm run dev`, `npx electron .`) must not
// share the installed app's userData or single-instance lock — otherwise a dev
// run silently quits and forwards its argv to the running installed GenOffice.
// GENOFFICE_USER_DATA: test drivers point this at a scratch dir so an
// automated instance can run alongside the dev instance (separate lock).
if (!app.isPackaged)
  app.setPath(
    'userData',
    process.env.GENOFFICE_USER_DATA ?? join(app.getPath('appData'), 'GenOffice Dev'),
  )

/**
 * `--headless-export <file> --to <format> --out <path> [--json]`: one document, no
 * window, one stdout line, then exit. Parsed at module scope so the dock icon
 * is gone before the app can bounce it and so every editor module sees the
 * headless flag before it registers anything.
 */
const headlessArgv = parseHeadlessExportArgv(process.argv)
if (headlessArgv.kind !== 'none') {
  setHeadlessMode(true)
  app.dock?.hide()
}

// The product rename from "AI Office" to GenOffice changed the userData path; migrate old user data once
if (app.isPackaged) {
  const oldDir = join(app.getPath('appData'), 'AI Office')
  const newDir = app.getPath('userData')
  const newEmpty = !existsSync(newDir) || readdirSync(newDir).length === 0
  if (newEmpty && existsSync(oldDir)) cpSync(oldDir, newDir, { recursive: true })
}

// module build outputs: packaged builds carry them as extraResources
// (resources/modules/*, resources/native/*); dev/unpacked resolves them
// relative to apps/shell in the monorepo layout.
const SIDECAR_EXE = process.platform === 'win32' ? 'xlsx-sidecar.exe' : 'xlsx-sidecar'
const APPS_ROOT = join(app.getAppPath(), '..')
const DOCS_OUT = app.isPackaged
  ? join(process.resourcesPath, 'modules', 'docs')
  : join(APPS_ROOT, 'docs', 'out')
const SHEETS_OUT = app.isPackaged
  ? join(process.resourcesPath, 'modules', 'sheets')
  : join(APPS_ROOT, 'sheets', 'out')
const SLIDES_OUT = app.isPackaged
  ? join(process.resourcesPath, 'modules', 'slides')
  : join(APPS_ROOT, 'slides', 'out')
const PDF_OUT = app.isPackaged
  ? join(process.resourcesPath, 'modules', 'pdf')
  : join(APPS_ROOT, 'pdf', 'out')
const MARKDOWN_OUT = app.isPackaged
  ? join(process.resourcesPath, 'modules', 'markdown')
  : join(APPS_ROOT, 'markdown', 'out')
const HTML_OUT = app.isPackaged
  ? join(process.resourcesPath, 'modules', 'html')
  : join(APPS_ROOT, 'html', 'out')
const SIDECAR_BIN = app.isPackaged
  ? join(process.resourcesPath, 'native', SIDECAR_EXE)
  : join(APPS_ROOT, 'sheets', 'native', 'xlsx-engine', 'target', 'release', SIDECAR_EXE)

configureDocsRuntime({
  preloadPath: join(DOCS_OUT, 'preload', 'index.js'),
  rendererUrl: process.env.DOCS_RENDERER_URL,
  rendererFile: join(DOCS_OUT, 'renderer', 'index.html'),
})
configureSheetsRuntime({
  preloadPath: join(SHEETS_OUT, 'preload', 'index.js'),
  rendererUrl: process.env.SHEETS_RENDERER_URL,
  rendererFile: join(SHEETS_OUT, 'renderer', 'index.html'),
  sidecarPath: SIDECAR_BIN,
  openGeneratedPath: (path) => openGeneratedDocument(path),
  // The sheets AI's create_document (docx/pdf/md) funnels into the docs-owned
  // creation flow, like the pdf app below.
  createDocument: createAiDocument,
})
configureSlidesRuntime({
  preloadPath: join(SLIDES_OUT, 'preload', 'index.js'),
  rendererDevUrl: process.env.SLIDES_RENDERER_URL,
  rendererFilePath: join(SLIDES_OUT, 'renderer', 'index.html'),
  openGeneratedPath: (path) => openGeneratedDocument(path),
})
configurePdfRuntime({
  preloadPath: join(PDF_OUT, 'preload', 'index.js'),
  rendererUrl: process.env.PDF_RENDERER_URL,
  rendererFile: join(PDF_OUT, 'renderer', 'index.html'),
  openGeneratedPath: (path) => openGeneratedDocument(path),
  createDocument: createAiDocument,
})
configureMarkdownRuntime({
  preloadPath: join(MARKDOWN_OUT, 'preload', 'index.js'),
  rendererUrl: process.env.MARKDOWN_RENDERER_URL,
  rendererFile: join(MARKDOWN_OUT, 'renderer', 'index.html'),
  openGeneratedPath: (path) => openGeneratedDocument(path),
})
configureHtmlRuntime({
  preloadPath: join(HTML_OUT, 'preload', 'index.js'),
  rendererUrl: process.env.HTML_RENDERER_URL,
  rendererFile: join(HTML_OUT, 'renderer', 'index.html'),
  openGeneratedPath: (path) => openGeneratedDocument(path),
})
// privileged-scheme registration is only legal before app ready
registerPrivilegedSchemes()

// ---- UI language ----
// Persisted in userData/app-settings.json so the editor modules can read the
// same file when they pick up i18n later. GENOFFICE_LANG overrides for tests.

const APP_SETTINGS_PATH = () => join(app.getPath('userData'), 'app-settings.json')
const OPEN_DOCUMENTS_PATH = () => join(app.getPath('userData'), OPEN_DOCUMENTS_FILE)
/** only the instance holding the single-instance lock may write or remove the registry */
let ownsOpenDocumentsRegistry = false
let stopAuthWatch: (() => void) | null = null
const publishOpenDocumentsIfOwner = (paths: readonly string[]) => {
  if (ownsOpenDocumentsRegistry) publishOpenDocuments(OPEN_DOCUMENTS_PATH(), paths)
}

/** every open file: the shell's tabs plus the detached editor windows */
function publishAllOpenDocuments(): void {
  publishOpenDocumentsIfOwner([...(tabManager?.openFilePaths() ?? []), ...detachedFilePaths()])
}
setDetachedChangedListener(publishAllOpenDocuments)

let uiLang: Lang | null = null

function currentLang(): Lang {
  if (uiLang) return uiLang
  if (process.env.GENOFFICE_LANG) {
    uiLang = normalizeLang(process.env.GENOFFICE_LANG)
    setUiLang(uiLang)
    return uiLang
  }
  const saved = readAppSettings(APP_SETTINGS_PATH()).language
  if (isLang(saved)) uiLang = saved
  uiLang ??= normalizeLang(app.getLocale())
  setUiLang(uiLang)
  return uiLang
}

function persistLang(lang: Lang): void {
  uiLang = lang
  setUiLang(lang)
  writeAppSetting(APP_SETTINGS_PATH(), 'language', lang)
}

let cachedUpdateChannel: UpdateChannel | null = null

function currentUpdateChannel(): UpdateChannel {
  if (cachedUpdateChannel) return cachedUpdateChannel
  const saved = readAppSettings(APP_SETTINGS_PATH()).updateChannel
  cachedUpdateChannel = isUpdateChannel(saved) ? saved : 'stable'
  return cachedUpdateChannel
}

let cachedTheme: UiTheme | null = null

function currentTheme(): UiTheme {
  if (cachedTheme) return cachedTheme
  const saved = readAppSettings(APP_SETTINGS_PATH()).theme
  cachedTheme = saved === 'light' || saved === 'dark' ? saved : 'system'
  return cachedTheme
}

let cachedAutoSaveDefault: AutoSaveDefault | null = null

function currentAutoSaveDefault(): AutoSaveDefault {
  if (cachedAutoSaveDefault) return cachedAutoSaveDefault
  const saved = readAppSettings(APP_SETTINGS_PATH())
  const updatedAt = saved.autoSaveDefaultUpdatedAt
  cachedAutoSaveDefault = {
    on: saved.autoSaveDefault === true,
    updatedAt: typeof updatedAt === 'number' && updatedAt > 0 ? updatedAt : 0,
  }
  return cachedAutoSaveDefault
}

/** MCP server settings (persisted in userData/app-settings.json; default off). */
function currentMcpSettings(): McpSettings {
  const saved = readAppSettings(APP_SETTINGS_PATH())
  const port = saved.mcpPort
  return {
    enabled: saved.mcpEnabled === true,
    port:
      typeof port === 'number' && Number.isInteger(port) && port > 0 && port < 65536
        ? port
        : DEFAULT_MCP_PORT,
    background: saved.mcpBackground === true,
    logging: saved.mcpLogging === true,
  }
}

let cachedAiPanelPrefs: AiPanelPrefs | null = null
function currentAiPanelPrefs(): AiPanelPrefs {
  if (cachedAiPanelPrefs) return cachedAiPanelPrefs
  const saved = readAppSettings(APP_SETTINGS_PATH())
  cachedAiPanelPrefs = normalizeAiPanelPrefs({
    side: saved.aiPanelSide,
    fontSize: saved.aiPanelFontSize,
    customFontSize: saved.aiPanelCustomFontSize,
    spellcheck: saved.aiPanelSpellcheck,
  })
  return cachedAiPanelPrefs
}

// ---- anonymous usage analytics (see src/main/analytics.ts) ----
// Stays a no-op until initAnalytics() runs at startup; keyless builds
// (source/forks) keep the no-op forever, so every track() call is safe.

let analytics: Analytics = { active: false, track: () => {} }

let cachedAnalyticsEnabled: boolean | null = null

function analyticsEnabled(): boolean {
  cachedAnalyticsEnabled ??= analyticsEnabledFrom(readAppSettings(APP_SETTINGS_PATH()))
  return cachedAnalyticsEnabled
}

function resolveAnalyticsKeys(): AnalyticsKeys | null {
  // Only packaged extraMetadata is authoritative. Source/dev runs never read
  // runtime credentials and therefore remain a strict no-op.
  if (!app.isPackaged) return null
  try {
    return extractPackagedAnalyticsKeys(
      JSON.parse(readFileSync(join(app.getAppPath(), 'package.json'), 'utf8')),
      app.isPackaged,
    )
  } catch {
    return null
  }
}

function persistAnalyticsPreference(enabled: boolean): boolean {
  const previous = cachedAnalyticsEnabled
  // Change the in-memory gate before touching disk. The synchronous atomic
  // write prevents another event from being handled in between.
  cachedAnalyticsEnabled = enabled
  try {
    writeAppSettings(APP_SETTINGS_PATH(), { [ANALYTICS_ENABLED_KEY]: enabled })
    return true
  } catch (error) {
    cachedAnalyticsEnabled = previous
    throw error
  }
}

function initAnalytics(): void {
  try {
    let clientState: ReturnType<typeof ensureAnalyticsClientState> | null = null
    const getClientState = () => (clientState ??= ensureAnalyticsClientState(APP_SETTINGS_PATH()))
    analytics = createAnalytics({
      keys: resolveAnalyticsKeys(),
      getClientId: () => getClientState().clientId,
      isEnabled: analyticsEnabled,
      shouldTrackFirstLaunch: () => getClientState().firstLaunchPending,
      onFirstLaunchSent: () => markAnalyticsFirstLaunchSent(APP_SETTINGS_PATH()),
      // Country-only approximation from OS regional settings. This avoids an
      // IP lookup while populating GA4's built-in Country dimension.
      getCountryCode: () => app.getLocaleCountryCode(),
      // evaluated per event: ui_lang follows live language switches
      baseParams: () => ({
        app_version: app.getVersion(),
        platform: process.platform,
        os_version: process.getSystemVersion(),
        ui_lang: currentLang(),
      }),
    })
  } catch {
    // analytics must never block startup
  }
}

// ---- first-run onboarding ----
// The GenTeam community page opened from the onboarding's second slide.
// Stable short link served by the genoffice.ai site; it 302s to the tokened
// invite link, which stays out of this repo and rotates server-side.
const GENTEAM_URL = 'https://genoffice.ai/join'

// Credit usage handler kept as no-op
const CREDIT_USAGE_URL = ''

// ---- "star us on GitHub" prompt (see star-prompt.ts for the rules) ----

const readStarPrompt = () =>
  asStarPromptState(readAppSettings(APP_SETTINGS_PATH())[STAR_PROMPT_KEY])
const writeStarPrompt = (state: ReturnType<typeof readStarPrompt>) =>
  writeAppSetting(APP_SETTINGS_PATH(), STAR_PROMPT_KEY, state)

/** set at startup when this is the first launch after an upgrade; consumed by
 * the first starPromptShouldShow query of the session */
let upgradeStarPromptPending = false

/** a granted show, cached for the session: repeated queries (React StrictMode
 * double-effects, AppFrame remounts) must return the same answer instead of
 * burning another lifetime show or flipping to a snoozed "false" */
let starPromptSessionGrant: StarPromptShow | null = null

/** every successful document open counts toward the prompt's value threshold */
function recordStarPromptDocOpen(): void {
  try {
    const state = readStarPrompt()
    const next = withDocOpen(state)
    if (next !== state) writeStarPrompt(next)
  } catch {
    // settings write failures must never break opening a document
  }
}

// Stargazer count for the settings About pane; fetched main-side (the
// renderer CSP has no api.github.com) and cached per session — the exact
// number is decoration, staleness is fine.
let cachedGithubStars: number | null = null

async function fetchGithubStars(): Promise<number | null> {
  if (cachedGithubStars !== null) return cachedGithubStars
  try {
    const response = await fetch('https://api.github.com/repos/sansanxm/xiaooffice', {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return null
    const body: unknown = await response.json()
    const count = (body as { stargazers_count?: unknown }).stargazers_count
    if (typeof count !== 'number' || !Number.isFinite(count)) return null
    cachedGithubStars = count
    return count
  } catch {
    return null
  }
}

const tMain = createI18n({
  vi: {
      "dlgAddFolderRoot": "Thêm thư mục vào Trang chủ",
      "errFolderRootUnusable": "Không thể đọc thư mục đã chọn",
      "menuFile": "Tệp",
      "menuSectionNew": "Mới",
      "menuOpenInNewWindow": "Mở trong cửa sổ mới",
      "menuNewDoc": "AI Docs",
      "menuNewSheet": "AI Sheets",
      "untitledSheet": "Bảng tính chưa có tiêu đề",
      "untitledDoc": "Tài liệu chưa có tiêu đề",
      "untitledDeck": "Bản trình bày chưa có tiêu đề",
      "untitledMarkdown": "Markdown chưa có tiêu đề",
      "untitledHtml": "HTML chưa có tiêu đề",
      "untitledPdf": "PDF chưa có tiêu đề",
      "menuNewSlide": "AI Slides",
      "menuNewMarkdown": "AI Markdown",
      "menuNewHtml": "AI HTML",
      "menuNewPdf": "AI PDF",
      "menuExportPdf": "Xuất dưới dạng PDF…",
      "menuExportImages": "Xuất dưới dạng hình ảnh…",
      "menuExportHtml": "Xuất thành tệp HTML đơn…",
      "menuOpenInDocs": "Chuyển đổi và mở trong Docs",
      "menuPrint": "In…",
      "menuOpen": "Mở…",
      "menuSave": "Lưu",
      "menuSaveAs": "Lưu dưới dạng…",
      "menuClose": "Đóng",
      "menuEdit": "Chỉnh sửa",
      "menuWindow": "Cửa sổ",
      "menuHome": "Trang chủ",
      "backToHome": "Quay lại Trang chủ",
      "dlgOpenTitle": "Mở tệp",
      "filterSupported": "Tệp được hỗ trợ",
      "filterWord": "Tài liệu Word",
      "filterExcel": "Sổ làm việc Excel",
      "filterPpt": "Bản trình bày PowerPoint",
      "filterMarkdown": "Tài liệu Markdown",
      "filterHtml": "Tài liệu HTML",
      "filterPdf": "Tài liệu PDF",
      "errBadArgs": "Tham số không hợp lệ",
      "errBadName": "Tên tệp không hợp lệ",
      "errMissing": "Không tìm thấy tệp",
      "errExists": "Tệp cùng tên đã tồn tại",
      "errRenameFailed": "Đổi tên thất bại",
      "errPdfSaveAsFailed": "Không thể lưu bản sao PDF",
      "errNewTabFailed": "Không thể tạo tài liệu mới",
      "errUnsupportedExt": "Tệp .{ext} không được hỗ trợ",
      "copySuffix": "bản sao",
      "menuHelp": "Trợ giúp",
      "thirdPartyNotices": "Thông báo bên thứ ba",
      "menuExportDocx": "Xuất dưới dạng Word…",
      "btnCancel": "Hủy",
      "pdfDocxFailedMsg": "Xuất dưới dạng Word thất bại",
      "pdfDocxBusyMsg": "Đang trong quá trình xuất tệp Word. Vui lòng chờ hoàn tất.",
      "menuExportPptx": "Xuất dưới dạng PowerPoint…",
      "pdfPptxFailedMsg": "Xuất dưới dạng PowerPoint thất bại",
      "pdfPptxBusyMsg": "Đang trong quá trình xuất tệp. Vui lòng chờ hoàn tất.",
      "pdfPptxLocalScannedDetail": "Mỗi trang đã được xuất dưới dạng hình ảnh nguyên trang; văn bản trên trang chiếu không thể chỉnh sửa.",
      "menuExportXlsx": "Xuất dưới dạng Excel…",
      "pdfXlsxFailedMsg": "Xuất dưới dạng Excel thất bại",
      "pdfXlsxBusyMsg": "Đang trong quá trình xuất tệp. Vui lòng chờ hoàn tất.",
      "pdfXlsxLocalScannedDetail": "Các trang quét không thể chuyển đổi thành các ô; trang tính tương ứng mang một dòng thông báo.",
      "pdfXlsxLocalSkippedMsg": "Một số trang không được chuyển đổi thành các ô",
      "pdfXlsxLocalSkippedDetail": "Trang {pages} không thể chuyển thành ô; trang tính tương ứng mang một dòng thông báo.",
      "pdfDocxLocalScannedMsg": "Đã phát hiện tài liệu quét",
      "pdfDocxLocalScannedDetail": "Các trang đã được xuất dưới dạng hình ảnh để bảo toàn hình thức; không nhận dạng được văn bản có thể chỉnh sửa.",
      "pdfDocxLocalDegradedMsg": "Một số trang đã được xuất dưới dạng hình ảnh",
      "pdfDocxLocalDegradedDetail": "Trang {pages} không thể tái tạo bố cục tin cậy và đã được xuất thành hình ảnh toàn trang.",
      "pdfDocxLocalOcrMsg": "Trang quét đã được chuyển đổi thành văn bản có thể chỉnh sửa",
      "pdfDocxLocalOcrDetail": "Trang {pages} là bản quét; văn bản đã được phục hồi bằng OCR trên thiết bị. Vui lòng kiểm tra lại kết quả.",
      "pdfDocxLocalEncryptedDetail": "Tệp PDF này đã được mã hóa và không thể mở nếu không có mật khẩu chính xác.",
      "pdfDocxLocalUnsupportedEncDetail": "Tệp PDF này sử dụng mã hóa dựa trên chứng chỉ hoặc phương thức mã hóa không được hỗ trợ và không thể chuyển đổi.",
      "pdfPwdTitle": "Nhập mật khẩu",
      "pdfPwdPrompt": "Tệp PDF này đã được mã hóa. Nhập mật khẩu để mở:",
      "pdfPwdRetryPrompt": "Mật khẩu không chính xác. Vui lòng thử lại.",
      "pdfPwdOk": "Xác nhận",
      "pdfPwdVerifying": "Đang xác minh mật khẩu…",
      "pdfPwdLabel": "Mật khẩu",
      "pdfPwdPlaceholder": "Nhập mật khẩu mở tệp",
      "pdfPwdShow": "Hiện mật khẩu",
      "pdfPwdHide": "Ẩn mật khẩu",
      "pdfDocxLocalCorruptDetail": "Tệp bị hỏng hoặc không phải là tệp PDF hợp lệ và không thể chuyển đổi.",
      "dlgPickSaveDir": "Chọn vị trí lưu mặc định",
      "errSaveDirUnusable": "Thư mục đã chọn không có quyền ghi và không thể dùng làm vị trí lưu mặc định"
  },
  en: {
      "dlgAddFolderRoot": "Add Folder to Home",
      "errFolderRootUnusable": "The selected folder cannot be read",
      "menuFile": "File",
      "menuSectionNew": "New",
      "menuOpenInNewWindow": "Open in New Window",
      "menuNewDoc": "AI Docs",
      "menuNewSheet": "AI Sheets",
      "untitledSheet": "Untitled Spreadsheet",
      "untitledDoc": "Untitled Document",
      "untitledDeck": "Untitled Presentation",
      "untitledMarkdown": "Untitled Markdown",
      "untitledHtml": "Untitled HTML",
      "untitledPdf": "Untitled PDF",
      "menuNewSlide": "AI Slides",
      "menuNewMarkdown": "AI Markdown",
      "menuNewHtml": "AI HTML",
      "menuNewPdf": "AI PDF",
      "menuExportPdf": "Export as PDF…",
      "menuExportImages": "Export as Images…",
      "menuExportHtml": "Export as Single-File HTML…",
      "menuOpenInDocs": "Convert and Open in Docs",
      "menuPrint": "Print…",
      "menuOpen": "Open…",
      "menuSave": "Save",
      "menuSaveAs": "Save As…",
      "menuClose": "Close",
      "menuEdit": "Edit",
      "menuWindow": "Window",
      "menuHome": "Home",
      "backToHome": "Back to Home",
      "dlgOpenTitle": "Open File",
      "filterSupported": "Supported Files",
      "filterWord": "Word Documents",
      "filterExcel": "Excel Workbooks",
      "filterPpt": "PowerPoint Presentations",
      "filterMarkdown": "Markdown Documents",
      "filterHtml": "HTML Documents",
      "filterPdf": "PDF Documents",
      "errBadArgs": "Invalid arguments",
      "errBadName": "Invalid file name",
      "errMissing": "File not found",
      "errExists": "A file with that name already exists",
      "errRenameFailed": "Rename failed",
      "errPdfSaveAsFailed": "Could not save the PDF copy",
      "errNewTabFailed": "Could not create the new document",
      "errUnsupportedExt": ".{ext} files are not supported",
      "copySuffix": "copy",
      "menuHelp": "Help",
      "thirdPartyNotices": "Third-Party Notices",
      "menuExportDocx": "Export as Word…",
      "btnCancel": "Cancel",
      "pdfDocxFailedMsg": "Export as Word failed",
      "pdfDocxBusyMsg": "A Word export is already in progress. Please wait for it to finish.",
      "menuExportPptx": "Export as PowerPoint…",
      "pdfPptxFailedMsg": "Export as PowerPoint failed",
      "pdfPptxBusyMsg": "An export is already in progress. Please wait for it to finish.",
      "pdfPptxLocalScannedDetail": "Each page was exported as a full-page image; the text on the slides is not editable.",
      "menuExportXlsx": "Export as Excel…",
      "pdfXlsxFailedMsg": "Export as Excel failed",
      "pdfXlsxBusyMsg": "An export is already in progress. Please wait for it to finish.",
      "pdfXlsxLocalScannedDetail": "Scanned pages cannot be converted to cells; each page's worksheet carries a notice row instead.",
      "pdfXlsxLocalSkippedMsg": "Some pages were not converted to cells",
      "pdfXlsxLocalSkippedDetail": "Pages {pages} could not be converted to cells; their worksheets carry a notice row instead.",
      "pdfDocxLocalScannedMsg": "Scanned document detected",
      "pdfDocxLocalScannedDetail": "The pages were exported as images to preserve their appearance; no editable text could be recognized.",
      "pdfDocxLocalDegradedMsg": "Some pages were exported as images",
      "pdfDocxLocalDegradedDetail": "Page(s) {pages} could not be reliably reconstructed and were exported as full-page images.",
      "pdfDocxLocalOcrMsg": "Scanned pages converted to editable text",
      "pdfDocxLocalOcrDetail": "Page(s) {pages} were scans; their text was recovered with on-device OCR. Please proofread the result.",
      "pdfDocxLocalEncryptedDetail": "This PDF is encrypted and could not be opened without the correct password.",
      "pdfDocxLocalUnsupportedEncDetail": "This PDF uses certificate-based or otherwise unsupported encryption and cannot be converted.",
      "pdfPwdTitle": "Enter Password",
      "pdfPwdPrompt": "This PDF is encrypted. Enter the password to open it:",
      "pdfPwdRetryPrompt": "Incorrect password. Please try again.",
      "pdfPwdOk": "OK",
      "pdfPwdVerifying": "Verifying password…",
      "pdfPwdLabel": "Password",
      "pdfPwdPlaceholder": "Enter the open password",
      "pdfPwdShow": "Show password",
      "pdfPwdHide": "Hide password",
      "pdfDocxLocalCorruptDetail": "The file is damaged or not a valid PDF and cannot be converted.",
      "dlgPickSaveDir": "Choose Default Save Location",
      "errSaveDirUnusable": "The selected folder is not writable and cannot be used as the default save location"
  }
})

const tm = (key: Parameters<typeof tMain>[1], params?: Parameters<typeof tMain>[2]) =>
  tMain(currentLang(), key, params)

// ---- the shell window + its tab manager (recreated if the user closes it on macOS) ----

let shellWindow: BrowserWindow | null = null
let tabManager: TabManager | null = null

/**
 * New file from a folder view: the click remembers the folder per kind, the
 * new-tab code consumes it right away. Sheets / PDF write their blank file
 * straight into that folder; the editors that save untitled files themselves
 * (docs, slides, markdown, html) get the folder bound to the tab that was just
 * created, and the tab's first save moves the fresh file there.
 * key: 'doc' | 'sheet' | 'slide' | 'markdown' | 'html' | 'pdf'
 */
/** folders the user added to the home tree beside the default save folder */
function extraFolderRoots(): string[] {
  return readExtraRoots(readAppSettings(APP_SETTINGS_PATH()), defaultSaveDir())
}

function folderRootPaths(): string[] {
  return [defaultSaveDir(), ...extraFolderRoots()]
}

function insideAnyRoot(path: string): boolean {
  return folderRootPaths().some((root) => isInsideRoot(root, path))
}

function isAnyRoot(path: string): boolean {
  const key = resolve(path)
  return folderRootPaths().some((root) => resolve(root) === key)
}

const pendingNewFileDir = new Map<string, { dir: string; setAt: number }>()
/** folder bound to a freshly created editor tab, keyed by its webContents id; consumed by the first save */
const pendingDirByWc = new Map<number, { dir: string; setAt: number }>()
/** a pending folder only applies to a file created within this window after the click */
const PENDING_DIR_TTL_MS = 30 * 60 * 1000

function rememberPendingDir(kind: string, opts?: NewFileOpts): void {
  const dir = opts?.dir
  if (!dir || resolve(dir) === resolve(defaultSaveDir()) || !insideAnyRoot(dir)) {
    pendingNewFileDir.delete(kind)
    return
  }
  pendingNewFileDir.set(kind, { dir, setAt: Date.now() })
}

/** the folder remembered for this kind, consumed; null when none, expired or gone */
function takePendingDir(kind: string): { dir: string; setAt: number } | null {
  const pending = pendingNewFileDir.get(kind)
  pendingNewFileDir.delete(kind)
  if (!pending) return null
  if (Date.now() - pending.setAt > PENDING_DIR_TTL_MS) return null
  return existsSync(pending.dir) ? pending : null
}

/** where a shell-created blank file (sheet, pdf) lands: the remembered folder, else the root */
function newFileDir(kind: string): string {
  return takePendingDir(kind)?.dir ?? defaultSaveDir()
}

/** hand the remembered folder to the tab that was just opened for it */
function bindPendingDir(kind: string, tabId: string | undefined): void {
  const pending = takePendingDir(kind)
  const wc = tabId ? tabManager?.webContentsForTab(tabId) : undefined
  if (pending && wc) pendingDirByWc.set(wc.id, pending)
}

/**
 * A tab's file first hit disk (silent first save, Save As, or an open): if a
 * folder is bound to that tab and the file is a fresh one in the root, move
 * it there. A pre-existing file opened in the tab never qualifies: its birth
 * time (or, where the filesystem reports none, its mtime) predates the click.
 */
function applyPendingDir(wcId: number, filePath: string): string {
  const pending = pendingDirByWc.get(wcId)
  if (!pending) return filePath
  if (Date.now() - pending.setAt > PENDING_DIR_TTL_MS) {
    pendingDirByWc.delete(wcId)
    return filePath
  }
  if (resolve(dirname(filePath)) !== resolve(defaultSaveDir())) return filePath
  try {
    const stat = statSync(filePath)
    const born = stat.birthtimeMs || stat.mtimeMs
    if (born < pending.setAt - 2000) return filePath
  } catch {
    return filePath
  }
  pendingDirByWc.delete(wcId)
  if (!existsSync(pending.dir)) return filePath
  // a clash with an existing name takes the "(2)" suffix rather than staying in the root
  const target = join(pending.dir, uniqueNameIn(pending.dir, basename(filePath)))
  try {
    renameSync(filePath, target)
  } catch (err) {
    console.warn('[shell] move new file into folder failed:', err)
    return filePath
  }
  afterFileMoved(filePath, target)
  return target
}

/**
 * Everything that keys on a file path follows a rename/move: recents, stars,
 * the AI chat history (project-store), the slides start-screen list and any
 * open tab (which re-grants the new path and refreshes its title).
 */
function afterFileMoved(oldPath: string, newPath: string): void {
  replaceRecentFile(oldPath, newPath)
  projectFileRenamed(oldPath, newPath)
  if (/\.pptx$/i.test(newPath)) void replaceSlidesRecentFile(oldPath, newPath)
  const affected = tabManager?.renameTabFile(oldPath, newPath) ?? []
  const detachedAffected = detachedRenameFile(oldPath, newPath)
  if (detachedAffected) affected.push(detachedAffected)
  for (const t of affected) {
    if (t.kind === 'slides') slidesFileRenamed(t.webContents, oldPath, newPath)
    else if (t.kind === 'docs') docsFileRenamed(t.webContents, oldPath, newPath)
    else if (t.kind === 'sheets') sheetsFileRenamed(t.webContents, oldPath, newPath)
    else if (t.kind === 'markdown') markdownFileRenamed(t.webContents, oldPath, newPath)
    else if (t.kind === 'html') htmlFileRenamed(t.webContents, oldPath, newPath)
    else if (t.kind === 'pdf') pdfFileRenamed(t.webContents, oldPath, newPath)
  }
}

function trackedFilesUnder(dir: string): string[] {
  return pathsUnder(dir, [
    ...readRecentFiles(),
    ...readStarredFiles(),
    ...projectFilePaths(),
    ...readSlidesRecentFiles(),
    ...(tabManager?.openFilePaths() ?? []),
    ...detachedFilePaths(),
  ])
}

/** a folder moved/renamed: re-key every tracked file that lived under it */
function afterFolderMoved(oldDir: string, newDir: string, filesBefore: readonly string[]): void {
  for (const file of filesBefore) afterFileMoved(file, rebasePath(file, oldDir, newDir))
}

const folderWatchers = new Map<string, FolderWatcher>()

let fileIndexStore: FileIndexStore | null = null
let fileIndexer: FileIndexer | null = null
let searchReranker: SearchReranker | null = null

function readFileSearchSettings(): FileSearchSettings {
  return normalizeFileSearchSettings(readAppSettings(APP_SETTINGS_PATH()).fileSearch)
}

/** the search index lives in userData and follows the save folder plus recents/starred */
function ensureFileIndexer(): FileIndexer | null {
  if (fileIndexer) return fileIndexer
  try {
    fileIndexStore = new FileIndexStore(join(app.getPath('userData'), 'file-index.db'))
  } catch (e) {
    console.warn('[file-index] unavailable:', e instanceof Error ? e.message : e)
    return null
  }
  fileIndexer = new FileIndexer(fileIndexStore, extractWorkerPath, {
    roots: () => folderRootPaths().filter((root) => existsSync(root)),
    extraPaths: () => [...readRecentFiles(), ...readStarredFiles()],
  })
  return fileIndexer
}

const SEARCH_EXT_FAMILY: Record<string, readonly string[]> = {
  docx: ['docx', 'doc'],
  xlsx: ['xlsx', 'xlsm', 'xls', 'csv', 'tsv'],
  pptx: ['pptx', 'ppt'],
  md: ['md', 'markdown'],
  html: ['html', 'htm'],
}

/** one recursive watcher per tree root; follows the save-folder setting and the added folders */
function ensureFolderWatchers(): void {
  const wanted = new Set(folderRootPaths().filter((root) => existsSync(root)))
  for (const [root, watcher] of folderWatchers) {
    if (wanted.has(root) && watcher.active) continue
    watcher.close()
    folderWatchers.delete(root)
  }
  for (const root of wanted) {
    if (folderWatchers.has(root)) continue
    const watcher = new FolderWatcher(root, (dirs) => {
      fileIndexer?.refresh()
      for (const wc of webContents.getAllWebContents()) {
        if (!wc.isDestroyed()) wc.send(HOME_CHANNELS.folderChanged, dirs)
      }
    })
    folderWatchers.set(root, watcher)
  }
}

function applyMenuFor(kind: TabKind): void {
  switch (kind) {
    case 'docs':
      buildDocsMenu()
      break
    case 'sheets':
      installSheetsMenu()
      break
    case 'slides':
      installSlidesMenu()
      break
    case 'pdf':
      buildPdfMenu()
      break
    case 'markdown':
      buildMarkdownMenu()
      break
    case 'html':
      buildHtmlMenu()
      break
    default:
      buildHomeMenu()
  }
}

function refreshTitleBarOverlay(): void {
  if (process.platform === 'darwin' || !shellWindow || shellWindow.isDestroyed()) return
  shellWindow.setTitleBarOverlay(tabStripOverlay(nativeTheme.shouldUseDarkColors))
}

function createShellWindow(): void {
  const win = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 720,
    minHeight: 550,
    title: 'Xiao Office',
    // vibrancy: editor modules punch translucent regions (e.g. the slides
    // thumbnail pane) through to the desktop
    ...(process.platform === 'darwin'
      ? { titleBarStyle: 'hiddenInset' as const, vibrancy: 'sidebar' as const }
      : {
          // the tab strip is the title bar, as on macOS; the application menu
          // stays registered for its accelerators and opens from the strip's
          // menu button (Alt still reveals the native bar where one exists)
          titleBarStyle: 'hidden' as const,
          titleBarOverlay: tabStripOverlay(nativeTheme.shouldUseDarkColors),
          autoHideMenuBar: true,
        }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  shellWindow = win
  if (process.platform === 'darwin') {
    win.setTitle('')
    win.on('page-title-updated', (e) => e.preventDefault())
  }
  nativeTheme.on('updated', refreshTitleBarOverlay)
  win.once('closed', () => nativeTheme.off('updated', refreshTitleBarOverlay))
  // dragging the window by the tab strip's blank (draggable) area produces no
  // DOM event anywhere — will-move is the only signal to dismiss popovers
  win.on('will-move', () => broadcastChromePressed())
  // A detached editor window claims the process-global menu/active-editor targets
  // while focused; take them back when the shell window regains focus. Keyboard
  // focus must land back on the active tab's view too — regaining window focus
  // gives it to the chrome webContents, leaving typing dead in the document.
  win.on('focus', () => {
    tabManager?.refreshActiveTargets()
    tabManager?.focusActiveView()
  })

  const manager = new TabManager(
    win,
    () => {
      win.webContents.send(TABS_CHANNELS.changed, manager.list())
      publishOpenDocumentsIfOwner([...manager.openFilePaths(), ...detachedFilePaths()])
    },
    applyMenuFor,
    // no extension: these tabs have no file on disk yet; the title becomes the
    // real filename (the localized untitled default + .docx etc.) once the first save lands
    (kind) =>
      kind === 'docs'
        ? tm('untitledDoc')
        : kind === 'slides'
          ? tm('untitledDeck')
          : kind === 'markdown'
            ? tm('untitledMarkdown')
            : kind === 'html'
              ? tm('untitledHtml')
              : tm('untitledSheet'),
  )
  tabManager = manager

  // pushRecent-triggered docs menu rebuilds must not clobber the active tab's
  // menu; a focused detached docs window owns the menu just like an active tab
  setDocsMenuGate(
    () =>
      focusedDetachedKind() === 'docs' || manager.list().some((t) => t.active && t.kind === 'docs'),
  )

  setDocsShellWindow(win)
  setSheetsShellWindow(win)
  setDocsHostWindowHook((wc) => detachedWindowForWebContents(wc.id))
  setSheetsHostWindowHook((wc) => detachedWindowForWebContents(wc.id))
  setSlidesShellWindow(win)
  setSlidesShowBleed((wc, on) => manager.setContentBleed(wc, on))
  setHtmlPresentHooks({
    setBleed: (wc, on) => manager.setContentBleed(wc, on),
    hostWindow: () => win,
    openTab: (owner, title) => {
      manager.openHtmlPresentTab(owner, title)
      return true
    },
    closeTab: (wc) => {
      const id = manager.tabIdForWebContents(wc.id)
      if (id) void manager.closeTab(id)
      return !!id
    },
  })
  // A detached docs/sheets window can outlive the shell window; its hooks must
  // then reach the live tab manager (recreating the shell), never this closure's.
  setDocsShellHooks({
    openTab: (openPath, options) => ensureTabManager().openDocsTab(openPath, options),
    openAiDocTab: (content) =>
      ensureTabManager().openDocsTab(undefined, { newBlank: true, aiContent: content }),
    listTabs: () =>
      (tabManager?.list() ?? [])
        .filter((t) => t.kind === 'docs')
        .map((t) => ({ id: t.id, title: t.title, focused: t.active })),
    focusTab: (id) => tabManager?.activateTab(id),
    // ⌘W in a detached docs window closes that window (its own close guard runs)
    closeActiveTab: () => {
      const focused = BrowserWindow.getFocusedWindow()
      if (focused && focused !== win) focused.close()
      else tabManager?.closeActiveTab()
    },
    openGeneratedPath: (path) => openGeneratedDocument(path),
  })
  setSheetsCloseTabHook(() => {
    const focused = BrowserWindow.getFocusedWindow()
    if (focused && focused !== win) focused.close()
    else tabManager?.closeActiveTab()
  })
  // ⌘W targets the focused window: in a detached slides editor window it closes
  // that window (running its own close guard), not the shell's active tab
  setSlidesCloseTabHook(() => {
    const focused = BrowserWindow.getFocusedWindow()
    if (focused && focused !== win) focused.close()
    else manager.closeActiveTab()
  })
  // When ⌘O opens a file inside a tab, sync the tab title/path (used for de-dup by path) and record it as recent.
  // The first save / save-as fires this too, so applyPendingDir also runs here.
  setSheetsWorkbookOpenedHook((wc, path) => {
    manager.setTabFileFor(wc.id, path)
    detachedSetFileFor(wc.id, path)
    recordRecentFile(path)
  })
  setSlidesOpenedHook((wc, path) => {
    manager.setTabFileFor(wc.id, path)
    recordRecentFile(path)
    applyPendingDir(wc.id, path)
  })
  // docs' save-as / silent first save lands on a new path → sync the tab title too
  setDocsFileSavedHook((wc, path) => {
    manager.setTabFileFor(wc.id, path)
    detachedSetFileFor(wc.id, path)
    recordRecentFile(path)
    return applyPendingDir(wc.id, path)
  })
  // ⌘O / open-path inside a docs tab: sync the tab title immediately, same
  // contract as the sheets/slides opened hooks (a plain save to the original
  // path never renames the tab, so the open must — r115)
  setDocsFileOpenedHook((wcId, path) => {
    manager.setTabFileFor(wcId, path)
    detachedSetFileFor(wcId, path)
    recordRecentFile(path)
    applyPendingDir(wcId, path)
  })
  // markdown untitled first save / Save As lands on a new path
  setMarkdownFileSavedHook((wc, path) => {
    manager.setTabFileFor(wc.id, path)
    recordRecentFile(path)
    applyPendingDir(wc.id, path)
  })
  setHtmlFileSavedHook((wc, path) => {
    manager.setTabFileFor(wc.id, path)
    recordRecentFile(path)
    applyPendingDir(wc.id, path)
  })
  setHtmlProvisionalTitleHook((wc, title) => manager.setTabTitleFor(wc.id, title))
  // A redacted copy becomes this tab's document; the source still exists.
  setPdfRedactionSavedHook((wc, path) => {
    manager.setTabFileFor(wc.id, path)
    recordRecentFile(path)
    applyPendingDir(wc.id, path)
  })
  // pdf content-derived auto-rename: the file moved on disk, follow it everywhere
  setPdfRenamedHook((wc, oldPath, newPath) => {
    manager.setTabFileFor(wc.id, newPath)
    replaceRecentFile(oldPath, newPath)
    projectFileRenamed(oldPath, newPath)
  })
  // markdown "convert & open in Docs" → route the fresh .docx to a docs tab
  setMarkdownDocxExportedHook((path) => {
    openDocumentPath(path)
  })
  // Word export to a path already open in a docs tab: close that tab before the file is
  // written (its unsaved-changes prompt applies, and a later save of the stale document
  // could otherwise overwrite the export); a cancelled close aborts the export.
  setHtmlDocxExportPrepareHook(async (path) => {
    const stale = manager.findDocsTabByPath(path)
    if (!stale) return true
    const active = manager.list().find((t) => t.active)?.id
    await manager.closeTab(stale)
    if (active && active !== stale) manager.activateTab(active)
    return !manager.findDocsTabByPath(path)
  })
  setHtmlDocxExportedHook((path) => {
    openDocumentPath(path)
  })

  // Closing the whole window walks every dirty sheets/pdf/slides/docs tab through
  // the same save/don't-save/cancel prompt; any cancel aborts the close.
  // docs dirtiness lives renderer-side, so any live docs tab forces the async path
  // and gets queried there (clean tabs pass through without activation).
  let closeConfirmed = false
  win.on('close', (event) => {
    if (closeConfirmed) return
    const dirtySheets = manager.dirtySheetsTabs()
    const dirtyPdf = manager.dirtyPdfTabs()
    const dirtyMarkdown = manager.dirtyMarkdownTabs()
    const dirtyHtml = manager.dirtyHtmlTabs()
    const dirtySlides = manager.dirtySlidesTabs()
    const docsTabs = manager.docsTabs()
    if (
      dirtySheets.length === 0 &&
      dirtyPdf.length === 0 &&
      dirtyMarkdown.length === 0 &&
      dirtyHtml.length === 0 &&
      dirtySlides.length === 0 &&
      docsTabs.length === 0
    )
      return
    event.preventDefault()
    void (async () => {
      for (const tab of dirtySheets) {
        manager.activateTab(tab.id)
        if (!(await requestSheetsClose(tab.webContents, win))) return
      }
      for (const tab of dirtyPdf) {
        manager.activateTab(tab.id)
        if (!(await requestPdfClose(tab.webContents, win))) return
      }
      for (const tab of dirtyMarkdown) {
        manager.activateTab(tab.id)
        if (!(await requestMarkdownClose(tab.webContents, win))) return
      }
      for (const tab of dirtyHtml) {
        manager.activateTab(tab.id)
        if (!(await requestHtmlClose(tab.webContents, win))) return
      }
      for (const tab of dirtySlides) {
        manager.activateTab(tab.id)
        if (!(await requestSlidesClose(tab.webContents, win))) return
      }
      for (const tab of docsTabs) {
        if (!(await docsQueryDirty(tab.webContents))) continue
        manager.activateTab(tab.id)
        if (!(await requestDocsClose(tab.webContents, win))) return
      }
      closeConfirmed = true
      if (!win.isDestroyed()) win.close()
    })()
  })

  win.on('closed', () => {
    if (shellWindow === win) shellWindow = null
    if (tabManager === manager) {
      tabManager = null
      publishAllOpenDocuments()
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const DOCX_RE = /\.docx$/i
const XLSX_RE = /\.(xlsx|xlsm|xls|xlsb|ods|csv|tsv)$/i
const PPTX_RE = /\.pptx$/i
const PDF_RE = /\.pdf$/i
const MD_RE = /\.(md|markdown)$/i
const HTML_RE = /\.html?$/i

/**
 * Single source of truth for the open-dialog filter. Includes
 * modern, legacy, and third-party office formats (.doc, .ppt, .odt, .pages, .key, etc.).
 */
const OPEN_DIALOG_EXTENSIONS = [
  'docx',
  'doc',
  'dot',
  'odt',
  'rtf',
  'pages',
  'xlsx',
  'xlsm',
  'xls',
  'xlsb',
  'ods',
  'csv',
  'tsv',
  'pptx',
  'ppt',
  'pot',
  'pps',
  'odp',
  'key',
  'pdf',
  'md',
  'markdown',
  'html',
  'htm',
]

function notifyUnsupportedFile(filePath: string): void {
  const ext = extname(filePath).slice(1).toLowerCase() || basename(filePath)
  showAppWarning(tm('errUnsupportedExt', { ext }))
}

/** shell-hosted warning box; focused when a shell window exists, standalone otherwise */
function showAppWarning(message: string): void {
  const options = { type: 'warning' as const, message }
  if (shellWindow) {
    shellWindow.show()
    shellWindow.focus()
    void dialog.showMessageBox(shellWindow, options)
  } else {
    void dialog.showMessageBox(options)
  }
}

/**
 * Files dropped from the OS into any renderer arrive via installDropOpenBridge
 * and route through the normal File > Open pipeline; detached editor windows
 * can host the drop target, so the shell must reveal itself after opening.
 */
const droppedFilesDeps = () => ({
  openDocumentPath,
  revealShellWindow,
  showWarning: showAppWarning,
  unsupportedMessage: (exts: string[]) => tm('errUnsupportedExt', { ext: exts.join(', ') }),
})

function registerDroppedFilesIpc(): void {
  ipcMain.on(DROP_OPEN_CHANNEL, (_event, raw: unknown) =>
    handleDroppedFiles(raw, droppedFilesDeps()),
  )
}

/** the single router: extension decides which module owns the file; false = nothing opened */
function openDocumentPath(filePath: string): boolean {
  const opened = routeDocumentPath(filePath)
  if (opened) {
    recordStarPromptDocOpen()
    // extension only — never the file name or path
    analytics.track('file_open', { ext: extname(filePath).slice(1).toLowerCase() })
  }
  return opened
}

/**
 * Open a just-written export. Unlike File > Open, an already-open PDF tab is
 * reloaded from disk so a re-export to the same path shows the new bytes
 * instead of the previous in-memory document (which may also hold unsaved
 * annotations). In-memory edits on that tab are discarded — Save would
 * overwrite the file we just exported.
 */
function openGeneratedDocument(filePath: string): boolean {
  if (tabManager && PDF_RE.test(filePath)) {
    const existing = tabManager.findPdfTabByPath(filePath)
    if (existing) {
      tabManager.reloadTab(existing)
      tabManager.activateTab(existing)
      return true
    }
  }
  return openDocumentPath(filePath)
}

function routeDocumentPath(filePath: string): boolean {
  if (!existsSync(filePath)) return false
  // a detached editor window already shows this file — focus it, never a second copy
  if (focusDetachedByPath(filePath)) return true
  if (!tabManager) return false
  if (DOCX_RE.test(filePath)) {
    recordRecentFile(filePath)
    const existing = tabManager.findDocsTabByPath(filePath)
    if (existing) tabManager.activateTab(existing)
    else tabManager.openDocsTab(filePath)
    return true
  }
  if (DOC_LEGACY_RE.test(filePath) || PAGES_RE.test(filePath)) {
    recordRecentFile(filePath)
    const isPages = PAGES_RE.test(filePath)
    const convertPromise = isPages
      ? convertPagesDocumentToDocx(filePath)
      : convertLegacyDocumentToDocx(filePath)
    void convertPromise
      .then((convertedPath) => {
        if (!tabManager) return
        tabManager.openDocsTab(convertedPath)
      })
      .catch((err) => {
        console.error('[shell] legacy doc open failed:', err)
        showErrorDialog(shellWindow, tm('errNewTabFailed'), err)
      })
    return true
  }
  if (XLSX_RE.test(filePath)) {
    recordRecentFile(filePath)
    const existing = tabManager.findSheetsTabByPath(filePath)
    if (existing) {
      tabManager.activateTab(existing)
    } else {
      tabManager.openSheetsTab(filePath)
      startQueuedWorkbookNudge()
    }
    return true
  }
  if (PPTX_RE.test(filePath)) {
    recordRecentFile(filePath)
    const existing = tabManager.findSlidesTabByPath(filePath)
    if (existing) {
      tabManager.activateTab(existing)
    } else {
      // For a new tab the path goes through the pending queue; the renderer consumes it after mounting
      tabManager.openSlidesTab(filePath)
    }
    return true
  }
  if (PPT_LEGACY_RE.test(filePath) || KEYNOTE_RE.test(filePath)) {
    recordRecentFile(filePath)
    const isKey = KEYNOTE_RE.test(filePath)
    const convertPromise = isKey
      ? convertKeynoteToPptx(filePath)
      : convertLegacyPresentationToPptx(filePath)
    void convertPromise
      .then((convertedPath) => {
        if (!tabManager) return
        tabManager.openSlidesTab(convertedPath)
      })
      .catch((err) => {
        console.error('[shell] legacy presentation open failed:', err)
        showErrorDialog(shellWindow, tm('errNewTabFailed'), err)
      })
    return true
  }
  if (PDF_RE.test(filePath)) {
    recordRecentFile(filePath)
    const existing = tabManager.findPdfTabByPath(filePath)
    if (existing) tabManager.activateTab(existing)
    else tabManager.openPdfTab(filePath)
    return true
  }
  if (MD_RE.test(filePath)) {
    recordRecentFile(filePath)
    const existing = tabManager.findMarkdownTabByPath(filePath)
    if (existing) tabManager.activateTab(existing)
    else tabManager.openMarkdownTab(filePath)
    return true
  }
  if (HTML_RE.test(filePath)) {
    recordRecentFile(filePath)
    const existing = tabManager.findHtmlTabByPath(filePath)
    if (existing) tabManager.activateTab(existing)
    else tabManager.openHtmlTab(filePath)
    return true
  }
  notifyUnsupportedFile(filePath)
  return false
}

/**
 * "New spreadsheet" creates the backing .xlsx in the default folder up front and
 * opens it as a regular file tab — the blank in-memory demo mode has no save
 * pipeline, so the file must exist before edits. Falls back to the old blank
 * tab if the write fails.
 */
async function newSheetTab(): Promise<void> {
  try {
    const filePath = uniquePathIn(newFileDir('sheet'), `${tm('untitledSheet')}.xlsx`)
    writeFileSync(filePath, await blankXlsxBuffer())
    // eligible for content-derived auto-rename after the first AI generation
    markSheetsUntitledPath(filePath)
    // route directly (not via openDocumentPath) so creating a sheet emits
    // only file_new — the file_open event is reserved for opening existing files
    if (routeDocumentPath(filePath)) recordStarPromptDocOpen()
    analytics.track('file_new', { kind: 'xlsx' })
  } catch (err) {
    console.warn('[shell] blank workbook create failed, opening in-memory blank tab:', err)
    try {
      tabManager?.openSheetsTab(undefined, { newBlank: true })
    } catch (fallbackErr) {
      surfaceNewTabError(fallbackErr)
    }
  }
}

/**
 * A throw anywhere in the create-tab path (view creation, sidecar resolution,
 * renderer load) used to be swallowed by `void`-ed promises and ipc-invoke
 * rejections, so the click looked like a pure no-op — the exact "AI Sheets /
 * AI Slides do nothing" alpha report. Surface the failure instead.
 */
function surfaceNewTabError(err: unknown): void {
  console.error('[shell] new tab failed:', err)
  showErrorDialog(shellWindow, tm('errNewTabFailed'), err)
}

function newDocTab(): void {
  try {
    bindPendingDir('doc', tabManager?.openDocsTab(undefined, { newBlank: true }))
    // creating a document is as much a value moment as opening one
    recordStarPromptDocOpen()
    analytics.track('file_new', { kind: 'docx' })
  } catch (err) {
    surfaceNewTabError(err)
  }
}

/** MCP: open a blank docs tab and return its webContents id, for the visible-editor bridge */
function openBlankDocsTabForMcp(): number {
  if (!tabManager) throw new Error('Xiao Office is not ready')
  const tabId = tabManager.openDocsTab(undefined, { newBlank: true })
  const view = tabManager.docsTabs().find((t) => t.id === tabId)
  if (!view) throw new Error('the new document tab could not be opened')
  recordStarPromptDocOpen()
  analytics.track('file_new', { kind: 'docx' })
  return view.webContents.id
}

/**
 * MCP: open a blank sheets tab and return its webContents id, for the
 * visible-grid bridge. Like the app's own "new spreadsheet", a real blank
 * .xlsx is created up front (the save pipeline needs an on-disk workbook;
 * the fallback in-memory demo grid cannot save) — but the AI auto-rename
 * marking is skipped, the file name is the agent's business.
 */
async function openBlankSheetsTabForMcp(): Promise<number> {
  if (!tabManager) throw new Error('Xiao Office is not ready')
  const filePath = uniquePathIn(defaultSaveDir(), `${tm('untitledSheet')}.xlsx`)
  writeFileSync(filePath, await blankXlsxBuffer())
  const tabId = tabManager.openSheetsTab(filePath)
  const view = tabManager.sheetsTabs().find((t) => t.id === tabId)
  if (!view) {
    // the tab never appeared, so nothing will ever consume this file
    try {
      rmSync(filePath)
    } catch (error) {
      console.warn('[mcp] could not remove the unused blank workbook:', error)
    }
    throw new Error('the new spreadsheet tab could not be opened')
  }
  const wcId = view.webContents.id
  mcpBlankSheetPaths.set(wcId, filePath)
  view.webContents.once('destroyed', () => mcpBlankSheetPaths.delete(wcId))
  // Same nudge the interactive path uses: the renderer subscribes to the open
  // action only after Univer mounts, so a single push can land in the void on a
  // cold start and leave the tab sitting on a blank in-memory workbook.
  startQueuedWorkbookNudge()
  recordStarPromptDocOpen()
  analytics.track('file_new', { kind: 'xlsx' })
  return view.webContents.id
}

/** backing files of blank sheets tabs created by the MCP session tools */
const mcpBlankSheetPaths = new Map<number, string>()

/**
 * MCP: drop a blank sheets tab whose session never became ready, and delete the
 * empty workbook created for it. Without this a failed `create_session` leaves
 * an orphan tab plus an .xlsx in the default save folder that the user never
 * asked for — and nothing in the MCP surface can clean either one up.
 */
function abandonBlankSheetsTabForMcp(wcId: number): void {
  const manager = tabManager
  const filePath = mcpBlankSheetPaths.get(wcId)
  mcpBlankSheetPaths.delete(wcId)
  if (!manager) return
  // the grid may already be usable while the MCP bridge is not: keep anything the user typed
  if (manager.dirtySheetsTabs().some((t) => t.webContents.id === wcId)) return
  if (!abandonBlankTabForMcp(manager.sheetsTabs(), wcId)) return
  if (!filePath) return
  try {
    if (existsSync(filePath)) rmSync(filePath)
  } catch (error) {
    console.warn('[mcp] could not remove the unused blank workbook:', error)
  }
}

/**
 * MCP: close a tab whose session never became ready. Returns false when the
 * tab could not be closed (it is already gone, or the close failed).
 */
function abandonBlankTabForMcp(
  tabs: Array<{ id: string; webContents: WebContents }>,
  wcId: number,
): boolean {
  const tab = tabs.find((t) => t.webContents.id === wcId)
  if (!tab || !tabManager) return false
  try {
    return tabManager.closeTabWithoutPrompt(tab.id)
  } catch (error) {
    console.warn('[mcp] could not close the unused tab:', error)
    return false
  }
}

/** MCP: open a blank slides tab and return its webContents id, for the visible-deck bridge */
function openBlankSlidesTabForMcp(): number {
  if (!tabManager) throw new Error('Xiao Office is not ready')
  const tabId = tabManager.openSlidesTab()
  const view = tabManager.slidesTabs().find((t) => t.id === tabId)
  if (!view) throw new Error('the new presentation tab could not be opened')
  recordStarPromptDocOpen()
  analytics.track('file_new', { kind: 'pptx' })
  return view.webContents.id
}

function newSlideTab(): void {
  try {
    bindPendingDir('slide', tabManager?.openSlidesTab())
    recordStarPromptDocOpen()
    analytics.track('file_new', { kind: 'pptx' })
  } catch (err) {
    surfaceNewTabError(err)
  }
}

function newMarkdownTab(): void {
  try {
    bindPendingDir('markdown', tabManager?.openMarkdownTab())
    recordStarPromptDocOpen()
    analytics.track('file_new', { kind: 'md' })
  } catch (err) {
    surfaceNewTabError(err)
  }
}

function newHtmlTab(): void {
  try {
    bindPendingDir('html', tabManager?.openHtmlTab())
    recordStarPromptDocOpen()
    analytics.track('file_new', { kind: 'html' })
  } catch (err) {
    surfaceNewTabError(err)
  }
}

/**
 * "New PDF" creates a blank single-page .pdf in the default folder up front and
 * opens it as a regular file tab — the PDF module has no in-memory blank mode
 * (openPdfTab requires a path), same pattern as the blank workbook above.
 */
async function newPdfTab(): Promise<void> {
  try {
    const filePath = uniquePathIn(newFileDir('pdf'), `${tm('untitledPdf')}.pdf`)
    writeFileSync(filePath, await blankPdfBuffer())
    // Opt the file into content-derived auto-naming on its first save
    markPdfUntitledPath(filePath)
    // route directly (not via openDocumentPath) so creating a pdf emits only
    // file_new and counts one doc-open — same as the blank workbook above
    if (routeDocumentPath(filePath)) recordStarPromptDocOpen()
    analytics.track('file_new', { kind: 'pdf' })
  } catch (err) {
    surfaceNewTabError(err)
  }
}

/**
 * The sheets renderer subscribes to menu actions only after Univer finishes
 * mounting (seconds on cold start), so a single 'open' can fire into the
 * void. Re-send until the queued workbook is consumed; consumption clears the
 * queue entry main-side (sheets-main), which stops the loop. The nudge only
 * reaches the active tab, so it gates on that tab's own queue entry —
 * background tabs from a multi-select Open pull their path themselves via the
 * renderer's has-queued-workbook poll.
 */
let workbookNudgeTimer: ReturnType<typeof setInterval> | null = null

function startQueuedWorkbookNudge(): void {
  if (workbookNudgeTimer) clearInterval(workbookNudgeTimer)
  const startedAt = Date.now()
  sendSheetsMenuAction('open')
  workbookNudgeTimer = setInterval(() => {
    if (
      !hasActiveQueuedWorkbook() ||
      Date.now() - startedAt > 30_000 ||
      !tabManager?.findSheetsTab()
    ) {
      if (workbookNudgeTimer) clearInterval(workbookNudgeTimer)
      workbookNudgeTimer = null
      return
    }
    sendSheetsMenuAction('open')
  }, 700)
}

// ---- home IPC ----

function statEntries(paths: string[]): RecentEntry[] {
  return statPathEntries(paths, new Set(readStarredFiles()))
}

function registerHomeIpc(): void {
  // signed-in means GenOffice's own device-code login; the shared gsk CLI key
  // is only a silent fallback, deliberately not shown here to nudge users onto our key
  ipcMain.handle(HOME_CHANNELS.accountStatus, async () => {
    if (!loadGenofficeAuth()) return { loggedIn: false }
    await proxyBootstrap
    const info = await gskLoginInfo()
    return info
      ? { loggedIn: true, email: info.email, creditBalance: info.creditBalance }
      : { loggedIn: true }
  })

  // login progress is streamed to the requesting renderer; the auth URL is
  // kept main-side so the "open manually" rescue never opens a renderer-supplied URL
  let pendingLoginUrl = ''
  ipcMain.handle(HOME_CHANNELS.accountLogin, async (event) => {
    analytics.track('login_click')
    const sender = event.sender
    pendingLoginUrl = ''
    await proxyBootstrap
    const send = (payload: AccountLoginEvent) => {
      if (!sender.isDestroyed()) sender.send(HOME_CHANNELS.accountLoginEvent, payload)
    }
    // open the browser on the first url event only; later events refresh the rescue URL
    let opened = false
    const launched = startGenofficeLogin((progress) => {
      if (progress.url) {
        pendingLoginUrl = progress.url
        if (!opened) {
          opened = true
          void shell.openExternal(progress.url)
        }
      }
      if (progress.phase === 'success') analytics.track('login_success')
      send(progress)
    })
    if (launched) send({ phase: 'launched' })
    return launched
  })

  ipcMain.handle(HOME_CHANNELS.accountLoginOpenUrl, () => {
    if (pendingLoginUrl) void shell.openExternal(pendingLoginUrl)
  })

  ipcMain.handle(HOME_CHANNELS.accountLogout, async () => {
    await genofficeLogout()
    // the cloud projects cache belongs to the account that just signed out
    clearCloudProjectsStore(cloudProjectsStorePath())
  })

  ipcMain.handle(HOME_CHANNELS.getAppVersion, (): string => app.getVersion())

  ipcMain.handle(HOME_CHANNELS.recents, (_event, query: unknown): RecentPage =>
    pageRecentPaths(readRecentFiles(), query, new Set(readStarredFiles())),
  )

  ipcMain.handle(HOME_CHANNELS.searchFiles, (_event, raw: unknown): FileSearchPage => {
    const query = (raw && typeof raw === 'object' ? raw : {}) as Partial<FileSearchQuery>
    const indexer = ensureFileIndexer()
    if (!indexer || !fileIndexStore) {
      return { hits: [], total: 0, index: { indexed: 0, pending: 0, scanning: false } }
    }
    // an open search box is the moment a stale index shows; rescan at most once a minute
    indexer.refreshIfStale(60_000)
    const q = typeof query.q === 'string' ? query.q.trim().slice(0, 200) : ''
    const filter = typeof query.ext === 'string' ? query.ext : ''
    const exts = filter && filter !== 'all' ? (SEARCH_EXT_FAMILY[filter] ?? [filter]) : undefined
    const offset = Number.isFinite(query.offset) ? Math.max(0, Math.floor(query.offset!)) : 0
    const limit = Number.isFinite(query.limit) ? Math.max(0, Math.floor(query.limit!)) : 50
    const starred = new Set(readStarredFiles())
    const result = q ? fileIndexStore.search(q, { exts, offset, limit }) : { hits: [], total: 0 }
    return {
      hits: result.hits.map((h) => ({ ...h, starred: starred.has(h.path) })),
      total: result.total,
      index: indexer.progress(),
    }
  })

  ipcMain.handle(
    HOME_CHANNELS.rerankSearch,
    async (_event, raw: unknown): Promise<FileSearchRerank | null> => {
      const settings = readFileSearchSettings()
      if (!settings.rerank) return null
      const query = (raw && typeof raw === 'object' ? raw : {}) as { q?: unknown; paths?: unknown }
      const q = typeof query.q === 'string' ? query.q.trim().slice(0, 200) : ''
      const paths = Array.isArray(query.paths)
        ? query.paths.filter((p): p is string => typeof p === 'string').slice(0, 20)
        : []
      if (!q || paths.length < 2 || !ensureFileIndexer() || !fileIndexStore) return null
      searchReranker ??= new SearchReranker(fileIndexStore)
      return searchReranker.rerank(q, paths, settings)
    },
  )

  ipcMain.handle(HOME_CHANNELS.getFileSearchSettings, (): FileSearchSettings =>
    readFileSearchSettings(),
  )

  ipcMain.handle(
    HOME_CHANNELS.setFileSearchSettings,
    (_event, patch: unknown): FileSearchSettings => {
      const current = readFileSearchSettings()
      const p = (patch && typeof patch === 'object' ? patch : {}) as Partial<FileSearchSettings>
      const next = normalizeFileSearchSettings({
        ...current,
        ...p,
        jevKeys: { ...current.jevKeys, ...(p.jevKeys ?? {}) },
      })
      writeAppSetting(APP_SETTINGS_PATH(), 'fileSearch', next)
      return next
    },
  )

  ipcMain.handle(HOME_CHANNELS.testFileSearchRerank, (_event, input: unknown) => {
    const { endpoint, apiKey } = (input && typeof input === 'object' ? input : {}) as {
      endpoint?: unknown
      apiKey?: unknown
    }
    return probeJev(jevEndpointOf(endpoint), typeof apiKey === 'string' ? apiKey : '')
  })

  // Starred files sort by mtime, which requires stat-ing them all first; they are hand-picked and few, so this is fine
  ipcMain.handle(HOME_CHANNELS.starred, (_event, query: unknown): RecentPage => {
    const { offset, limit, ext } = normalizeRecentQuery(query)
    const all = statEntries(readStarredFiles()).sort((a, b) => b.mtimeMs - a.mtimeMs)
    const filtered = ext ? all.filter((entry) => matchesExtFamily(entry.ext, ext)) : all
    return {
      entries: limit === 0 ? [] : filtered.slice(offset, offset + limit),
      total: filtered.length,
      totalAll: all.length,
    }
  })

  ipcMain.handle(HOME_CHANNELS.statPaths, (_event, paths: unknown): RecentEntry[] =>
    statEntries(stringPaths(paths)),
  )

  ipcMain.handle(HOME_CHANNELS.toggleStar, (_event, path: unknown) => {
    if (typeof path === 'string') toggleStarredFile(path)
  })

  ipcMain.handle(HOME_CHANNELS.openPath, (_event, path: unknown) => {
    if (typeof path !== 'string' || !path || path.length > 4096) return
    openDocumentPath(path)
    fileIndexer?.refresh()
  })

  ipcMain.handle(HOME_CHANNELS.browse, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? shellWindow
    if (!win) return
    const result = await showOpenDialogWithMemory(dialog, win, {
      title: tm('dlgOpenTitle'),
      filters: [
        { name: tm('filterSupported'), extensions: OPEN_DIALOG_EXTENSIONS },
        { name: tm('filterWord'), extensions: ['docx', 'doc'] },
        { name: tm('filterExcel'), extensions: ['xlsx', 'xlsm', 'xls', 'csv', 'tsv'] },
        { name: tm('filterPpt'), extensions: ['pptx', 'ppt'] },
        { name: tm('filterPdf'), extensions: ['pdf'] },
        { name: tm('filterMarkdown'), extensions: ['md', 'markdown'] },
        { name: tm('filterHtml'), extensions: ['html', 'htm'] },
      ],
      properties: ['openFile', 'multiSelections'],
    })
    if (!result.canceled) for (const path of result.filePaths) openDocumentPath(path)
  })

  ipcMain.handle(HOME_CHANNELS.newDoc, (_event, opts?: NewFileOpts) => {
    rememberPendingDir('doc', opts)
    newDocTab()
  })

  ipcMain.handle(HOME_CHANNELS.newSheet, (_event, opts?: NewFileOpts) => {
    rememberPendingDir('sheet', opts)
    void newSheetTab()
  })

  ipcMain.handle(HOME_CHANNELS.newSlide, (_event, opts?: NewFileOpts) => {
    rememberPendingDir('slide', opts)
    newSlideTab()
  })

  ipcMain.handle(HOME_CHANNELS.newMarkdown, (_event, opts?: NewFileOpts) => {
    rememberPendingDir('markdown', opts)
    newMarkdownTab()
  })

  ipcMain.handle(HOME_CHANNELS.newHtml, (_event, opts?: NewFileOpts) => {
    rememberPendingDir('html', opts)
    newHtmlTab()
  })

  ipcMain.handle(HOME_CHANNELS.newPdf, (_event, opts?: NewFileOpts) => {
    rememberPendingDir('pdf', opts)
    void newPdfTab()
  })

  ipcMain.handle(HOME_CHANNELS.removeRecent, (_event, paths: unknown) => {
    const list = stringPaths(paths)
    removeRecentFiles(list)
    // an unavailable entry's star must go with it, or the Starred view keeps
    // a dead dimmed row the recents list no longer shows
    removeStarredFiles(list.filter((p) => !existsSync(p)))
  })

  ipcMain.handle(HOME_CHANNELS.revealPath, (_event, path: unknown) => {
    if (typeof path === 'string' && existsSync(path)) shell.showItemInFolder(path)
  })

  ipcMain.handle(
    HOME_CHANNELS.renameFile,
    (_event, path: unknown, newName: unknown): RenameResult => {
      if (typeof path !== 'string' || typeof newName !== 'string')
        return { ok: false, error: tm('errBadArgs') }
      // Validate the raw name before trimming: trimming first would
      // silently turn "report " into "report" and make the
      // trailing-space gate in isValidRenameName unreachable. Reject
      // with the localized gate instead of renaming to a different
      // name than requested.
      if (!isValidRawRenameName(newName)) return { ok: false, error: tm('errBadName') }
      const name = newName.trim()
      if (!existsSync(path)) return { ok: false, error: tm('errMissing') }
      const target = join(dirname(path), name)
      if (target === path) return { ok: true, path }
      // A case-only rename (Report.pdf -> report.pdf) hits the source itself on
      // case-insensitive filesystems; only a genuinely different file blocks.
      if (existsSync(target) && !isSameFile(path, target)) {
        return { ok: false, error: tm('errExists') }
      }
      try {
        renameSync(path, target)
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : tm('errRenameFailed') }
      }
      afterFileMoved(path, target)
      return { ok: true, path: target }
    },
  )

  ipcMain.handle(HOME_CHANNELS.duplicateFile, (_event, path: unknown) => {
    if (typeof path !== 'string' || !existsSync(path)) return
    const ext = extname(path)
    const base = basename(path, ext)
    const dir = dirname(path)
    for (let i = 1; ; i++) {
      const target = join(dir, `${base} ${tm('copySuffix')}${i === 1 ? '' : ` ${i}`}${ext}`)
      if (existsSync(target)) continue
      copyFileSync(path, target)
      recordRecentFile(target)
      return
    }
  })

  ipcMain.handle(HOME_CHANNELS.deleteFiles, async (_event, paths: unknown) => {
    const list = stringPaths(paths)
    for (const p of list) {
      try {
        await shell.trashItem(p)
      } catch {
        // file already gone or trash unavailable; still drop it from the list
      }
    }
    removeRecentFiles(list)
    // the files were deliberately destroyed — stars must not survive as ghosts
    removeStarredFiles(list)
  })

  ipcMain.handle(HOME_CHANNELS.openTrash, () => {
    if (process.platform === 'darwin') {
      void shell.openPath(join(app.getPath('home'), '.Trash'))
    } else if (process.platform === 'win32') {
      spawn('explorer.exe', ['shell:RecycleBin'], { detached: true }).unref()
    } else {
      void shell.openPath(join(app.getPath('home'), '.local', 'share', 'Trash', 'files'))
    }
  })

  ipcMain.handle(HOME_CHANNELS.getLanguage, (): Lang => currentLang())

  ipcMain.handle(HOME_CHANNELS.setLanguage, (_event, lang: unknown) => {
    if (!isLang(lang) || lang === currentLang()) return
    persistLang(lang)
    // the switcher lives on the home page, so the home menu is the active one
    buildHomeMenu()
    installDockMenu()
    installBackToHomeItems()
    for (const wc of webContents.getAllWebContents()) wc.send('app:language-changed', lang)
  })

  ipcMain.handle(HOME_CHANNELS.getUpdateChannel, (): UpdateChannel => currentUpdateChannel())

  ipcMain.handle(HOME_CHANNELS.setUpdateChannel, (_event, channel: unknown) => {
    if (!isUpdateChannel(channel) || channel === currentUpdateChannel()) return
    cachedUpdateChannel = channel
    writeAppSetting(APP_SETTINGS_PATH(), 'updateChannel', channel)
    applyUpdateChannel(channel)
  })

  ipcMain.handle(
    HOME_CHANNELS.onboardingSeen,
    (): boolean => readAppSettings(APP_SETTINGS_PATH()).onboardingSeen === true,
  )

  ipcMain.handle(HOME_CHANNELS.setOnboardingSeen, (): boolean => {
    try {
      writeAppSetting(APP_SETTINGS_PATH(), 'onboardingSeen', true)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle(HOME_CHANNELS.getTheme, (): UiTheme => currentTheme())
  // editor tabs ask via the app-wide channel (symmetric with app:get-language)
  ipcMain.handle('app:get-theme', (): UiTheme => currentTheme())

  ipcMain.handle(HOME_CHANNELS.setTheme, (_event, theme: unknown) => {
    if (theme !== 'light' && theme !== 'dark' && theme !== 'system') return
    if (theme === currentTheme()) return
    cachedTheme = theme
    writeAppSetting(APP_SETTINGS_PATH(), 'theme', theme)
    nativeTheme.themeSource = theme
    refreshTitleBarOverlay()
    for (const wc of webContents.getAllWebContents()) wc.send('app:theme-changed', theme)
  })

  ipcMain.handle(HOME_CHANNELS.getAutoSaveDefault, (): AutoSaveDefault => currentAutoSaveDefault())
  ipcMain.handle('app:get-auto-save-default', (): AutoSaveDefault => currentAutoSaveDefault())

  ipcMain.handle(HOME_CHANNELS.setAutoSaveDefault, (_event, on: unknown) => {
    if (typeof on !== 'boolean') return
    if (on === currentAutoSaveDefault().on) return
    const next: AutoSaveDefault = { on, updatedAt: Date.now() }
    cachedAutoSaveDefault = next
    writeAppSettings(APP_SETTINGS_PATH(), {
      autoSaveDefault: next.on,
      autoSaveDefaultUpdatedAt: next.updatedAt,
    })
    for (const wc of webContents.getAllWebContents()) wc.send('app:auto-save-default-changed', next)
  })

  ipcMain.handle(HOME_CHANNELS.getMcpStatus, () => mcpStatus())

  ipcMain.handle(HOME_CHANNELS.setMcpSettings, async (_event, patch: unknown) => {
    if (!patch || typeof patch !== 'object') return mcpStatus()
    const request = patch as {
      enabled?: unknown
      port?: unknown
      background?: unknown
      logging?: unknown
    }
    const current = currentMcpSettings()
    const enabled = typeof request.enabled === 'boolean' ? request.enabled : current.enabled
    const port =
      typeof request.port === 'number' &&
      Number.isInteger(request.port) &&
      request.port > 0 &&
      request.port < 65536
        ? request.port
        : current.port
    const background =
      typeof request.background === 'boolean' ? request.background : current.background
    const logging = typeof request.logging === 'boolean' ? request.logging : current.logging
    writeAppSettings(APP_SETTINGS_PATH(), {
      mcpEnabled: enabled,
      mcpPort: port,
      mcpBackground: background,
      mcpLogging: logging,
    })
    try {
      return await applyMcpSettings({ enabled, port, background, logging })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { ...mcpStatus(), error: message }
    }
  })

  ipcMain.handle(HOME_CHANNELS.getMcpLogs, () => getMcpRecentLogs())

  ipcMain.handle(HOME_CHANNELS.clearMcpLogs, () => {
    clearMcpLogs()
  })

  ipcMain.handle(HOME_CHANNELS.openMcpLogFile, () => {
    revealMcpLogFile()
    const logPath = mcpLogFilePath()
    if (logPath) shell.showItemInFolder(logPath)
  })

  ipcMain.handle(HOME_CHANNELS.getAnalyticsEnabled, (): boolean => analyticsEnabled())

  ipcMain.handle(HOME_CHANNELS.setAnalyticsEnabled, (_event, enabled: unknown): boolean => {
    if (typeof enabled !== 'boolean') return false
    return persistAnalyticsPreference(enabled)
  })

  ipcMain.handle(HOME_CHANNELS.getAiPanelPrefs, (): AiPanelPrefs => currentAiPanelPrefs())
  ipcMain.handle('app:get-ai-panel-prefs', (): AiPanelPrefs => currentAiPanelPrefs())

  const setAiPanelPrefs = (patch: unknown): AiPanelPrefs => {
    const prev = currentAiPanelPrefs()
    const raw =
      patch !== null && typeof patch === 'object' ? (patch as Record<string, unknown>) : {}
    // unknown/malformed fields fall back to the previous value, not the default
    const next = normalizeAiPanelPrefs({
      side: raw.side === 'left' || raw.side === 'right' ? raw.side : prev.side,
      fontSize: 'fontSize' in raw ? raw.fontSize : prev.fontSize,
      customFontSize: 'customFontSize' in raw ? raw.customFontSize : prev.customFontSize,
      spellcheck: 'spellcheck' in raw ? raw.spellcheck : prev.spellcheck,
    })
    if (sameAiPanelPrefs(next, prev)) return prev
    cachedAiPanelPrefs = next
    writeAppSettings(APP_SETTINGS_PATH(), {
      aiPanelSide: next.side,
      aiPanelFontSize: next.fontSize,
      aiPanelCustomFontSize: next.customFontSize,
      aiPanelSpellcheck: next.spellcheck,
    })
    for (const wc of webContents.getAllWebContents()) wc.send('app:ai-panel-prefs-changed', next)
    return next
  }
  ipcMain.handle(HOME_CHANNELS.setAiPanelPrefs, (_event, patch) => setAiPanelPrefs(patch))
  ipcMain.handle('app:set-ai-panel-prefs', (_event, patch) => setAiPanelPrefs(patch))

  // effective folder where new/untitled files land; the editor mains resolve
  // the same setting themselves (configuredDefaultSaveDir via docs' defaultSaveDir)
  // ── folder tree over the default save folder ──
  const folderErrors = (): FolderErrors => ({
    badArgs: tm('errBadArgs'),
    badName: tm('errBadName'),
    missing: tm('errMissing'),
    exists: tm('errExists'),
    failed: tm('errRenameFailed'),
  })
  const insideRoot = (path: unknown): path is string =>
    typeof path === 'string' && insideAnyRoot(path)
  const isRoot = (path: string) => isAnyRoot(path)

  ipcMain.handle(HOME_CHANNELS.folderRoots, (): FolderRoot[] => {
    // describeRoot creates a missing save folder, so its watcher has something to attach to
    const roots = [describeRoot(defaultSaveDir()), ...extraFolderRoots().map(describeExtraRoot)]
    ensureFolderWatchers()
    return roots
  })

  // an added folder joins the tree where it is: nothing on disk is created, copied or moved
  const addFolderRoot = (path: string): FolderRoot | null => {
    const extras = withExtraRoot(extraFolderRoots(), defaultSaveDir(), path)
    if (!extras) return null
    writeAppSetting(APP_SETTINGS_PATH(), FOLDER_ROOTS_KEY, extras)
    ensureFolderWatchers()
    fileIndexer?.refresh()
    return describeExtraRoot(path)
  }

  ipcMain.handle(HOME_CHANNELS.addFolderRoot, async (): Promise<FolderRoot | null> => {
    const result = await showOpenDialogWithMemory(dialog, shellWindow, {
      title: tm('dlgAddFolderRoot'),
      properties: ['openDirectory'],
    })
    const picked = result.filePaths[0]
    if (result.canceled || !picked) return null
    if (!describeExtraRoot(picked).readable) {
      showErrorDialog(shellWindow, tm('errFolderRootUnusable'), picked)
      return null
    }
    return addFolderRoot(picked)
  })

  ipcMain.handle(HOME_CHANNELS.dropFolderRoots, (_event, paths: unknown): FolderRoot[] => {
    const added: FolderRoot[] = []
    const files: string[] = []
    for (const path of stringPaths(paths)) {
      if (!describeExtraRoot(path).readable) {
        files.push(path)
        continue
      }
      const root = addFolderRoot(path)
      if (root) added.push(root)
    }
    if (files.length > 0) handleDroppedFiles(files, droppedFilesDeps())
    return added
  })

  ipcMain.handle(HOME_CHANNELS.removeFolderRoot, (_event, path: unknown) => {
    if (typeof path !== 'string') return
    const extras = withoutExtraRoot(extraFolderRoots(), path)
    writeAppSetting(APP_SETTINGS_PATH(), FOLDER_ROOTS_KEY, extras)
    ensureFolderWatchers()
    fileIndexer?.refresh()
  })

  ipcMain.handle(HOME_CHANNELS.listFolder, (_event, dir: unknown): FolderListing => {
    if (!insideRoot(dir)) return { dir: String(dir), folders: [], files: [] }
    return listFolder(dir, new Set(readStarredFiles()))
  })

  ipcMain.handle(
    HOME_CHANNELS.createFolder,
    (_event, parent: unknown, name: unknown): RenameResult => {
      if (!insideRoot(parent) || typeof name !== 'string')
        return { ok: false, error: tm('errBadArgs') }
      return createFolder(parent, name, folderErrors())
    },
  )

  ipcMain.handle(
    HOME_CHANNELS.renameFolder,
    (_event, dir: unknown, newName: unknown): RenameResult => {
      if (!insideRoot(dir) || isRoot(dir) || typeof newName !== 'string')
        return { ok: false, error: tm('errBadArgs') }
      const filesBefore = trackedFilesUnder(dir)
      const result = renameFolder(dir, newName, folderErrors())
      if (result.ok && result.path && result.path !== dir) {
        afterFolderMoved(dir, result.path, filesBefore)
      }
      return result
    },
  )

  ipcMain.handle(
    HOME_CHANNELS.movePaths,
    async (_event, paths: unknown, targetDir: unknown, policy: unknown): Promise<MoveResult> => {
      const list = stringPaths(paths)
      if (!insideRoot(targetDir)) {
        const error = tm('errBadArgs')
        return { moved: [], conflicts: [], failed: list.map((path) => ({ path, error })) }
      }
      const conflictPolicy: MoveConflictPolicy =
        policy === 'replace' || policy === 'keepBoth' || policy === 'skip' ? policy : 'ask'
      const isDir = (p: string) => {
        try {
          return statSync(p).isDirectory()
        } catch {
          return false
        }
      }
      // files may come from anywhere (the Recent list); folders only from inside the tree, never a root itself
      const sources = list.filter((p) => !isDir(p) || (insideAnyRoot(p) && !isAnyRoot(p)))
      const dirFiles = new Map(sources.filter(isDir).map((p) => [p, trackedFilesUnder(p)]))
      // 'replace' must not destroy data: the displaced target goes to the trash,
      // and everything keyed on its path (recents, stars, chat history) leaves
      // with it so the incoming file does not inherit another document's record
      const displaced: string[] = []
      const result = movePathsInto(sources, targetDir, conflictPolicy, folderErrors(), {
        replaceExisting: (path) => {
          const parked = join(dirname(path), `.genoffice-replaced-${Date.now()}-${basename(path)}`)
          const files = isDir(path) ? trackedFilesUnder(path) : [path]
          renameSync(path, parked)
          return {
            commit: () => {
              displaced.push(parked)
              removeRecentFiles(files)
              removeStarredFiles(files)
              for (const file of files) projectFileRenamed(file, rebasePath(file, path, parked))
            },
            rollback: () => renameSync(parked, path),
          }
        },
      })
      for (const parked of displaced) {
        try {
          await shell.trashItem(parked)
        } catch {
          rmSync(parked, { recursive: true, force: true })
        }
      }
      for (const { from, to } of result.moved) {
        const files = dirFiles.get(from)
        if (files) afterFolderMoved(from, to, files)
        else afterFileMoved(from, to)
      }
      return result
    },
  )

  ipcMain.handle(HOME_CHANNELS.deleteFolder, async (_event, dir: unknown) => {
    if (!insideRoot(dir) || isRoot(dir)) return
    const files = trackedFilesUnder(dir)
    try {
      await shell.trashItem(dir)
    } catch {
      return
    }
    removeRecentFiles(files)
    removeStarredFiles(files)
  })

  ipcMain.handle(HOME_CHANNELS.getDefaultSaveDir, (): string => defaultSaveDir())

  const defaultApp = createDefaultAppService({
    platform: process.platform,
    packaged: app.isPackaged,
    exePath: app.getPath('exe'),
    run: execFileRunner,
    openExternal: (url) => shell.openExternal(url),
  })
  ipcMain.handle(HOME_CHANNELS.getDefaultAppStatus, () => defaultApp.status())
  ipcMain.handle(HOME_CHANNELS.setDefaultApp, () => defaultApp.set())

  ipcMain.handle(HOME_CHANNELS.pickDefaultSaveDir, async (): Promise<string | null> => {
    const result = await showOpenDialogWithMemory(dialog, shellWindow, {
      title: tm('dlgPickSaveDir'),
      defaultPath: defaultSaveDir(),
      properties: ['openDirectory', 'createDirectory'],
    })
    const picked = result.filePaths[0]
    if (result.canceled || !picked) return null
    if (!isUsableSaveDir(picked)) {
      showErrorDialog(shellWindow, tm('errSaveDirUnusable'), picked)
      return null
    }
    writeAppSetting(APP_SETTINGS_PATH(), DEFAULT_SAVE_DIR_KEY, picked)
    ensureFolderWatchers()
    return picked
  })

  ipcMain.handle(HOME_CHANNELS.openGenTeam, () => {
    shell.openExternal(GENTEAM_URL).catch(() => {
      // no browser handler available; nothing actionable for the user here
    })
  })

  ipcMain.handle(HOME_CHANNELS.openCreditUsage, () => {
    if (CREDIT_USAGE_URL) {
      shell.openExternal(CREDIT_USAGE_URL).catch(() => {})
    }
  })

  ipcMain.handle(HOME_CHANNELS.openGitHubRepo, () => {
    shell.openExternal(GITHUB_REPO_URL).catch(() => {
      // no browser handler available; nothing actionable for the user here
    })
  })

  ipcMain.handle(HOME_CHANNELS.githubStars, () => fetchGithubStars())

  // returning true also counts as "shown": the renderer displays it
  // unconditionally, so no separate mark-shown round-trip is needed
  ipcMain.handle(HOME_CHANNELS.starPromptShouldShow, (): StarPromptShow => {
    if (starPromptSessionGrant) return starPromptSessionGrant
    const now = Date.now()
    const state = readStarPrompt()
    const docOpens = state.docOpens ?? 0
    // dev preview of the card without waiting out the value thresholds
    // (same pattern as GENOFFICE_FAKE_UPDATE); nothing is recorded
    if (!app.isPackaged && process.env.GENOFFICE_FORCE_STAR_PROMPT) return { show: true, docOpens }
    const grant = (): StarPromptShow => {
      writeStarPrompt(withShown(state, now))
      starPromptSessionGrant = { show: true, docOpens }
      return starPromptSessionGrant
    }
    // first launch after an upgrade: skip the value gates once for a
    // never-prompted user (they are a proven repeat user already)
    if (upgradeStarPromptPending) {
      upgradeStarPromptPending = false
      if (shouldShowUpgradeStarPrompt(state)) return grant()
    }
    if (!shouldShowStarPrompt(state, now)) return { show: false, docOpens }
    return grant()
  })

  ipcMain.handle(HOME_CHANNELS.starPromptAction, (_event, action: unknown) => {
    if (action !== 'starred' && action !== 'later') return
    // the card was reacted to — drop the session grant so a later query (new
    // shell window on macOS) re-evaluates the real rules (snooze / resolved)
    starPromptSessionGrant = null
    // 'later' needs no write: the display was already counted by the query
    if (action === 'starred') writeStarPrompt(withResolved(readStarPrompt()))
  })

  const cloudProjectsStorePath = () => join(app.getPath('userData'), 'cloud-projects.json')

  ipcMain.handle(HOME_CHANNELS.cloudProjectsCached, () =>
    readCloudProjectsStore(cloudProjectsStorePath()),
  )

  ipcMain.handle(HOME_CHANNELS.cloudProjects, () => syncCloudProjects(cloudProjectsStorePath()))

  ipcMain.handle(HOME_CHANNELS.openCloudProject, (_event, projectUrl: unknown) => {
    const url = cloudProjectExternalUrl(projectUrl)
    if (url) void shell.openExternal(url)
  })
}

function stringPaths(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((p): p is string => typeof p === 'string') : []
}

// electron-vite emits ?asset files under hashed names, which breaks nativeImage's
// automatic `@2x` sibling lookup — attach the retina representation by hand
function loadMenuIcon(path1x: string, path2x: string): NativeImage {
  const icon = nativeImage.createFromPath(path1x)
  icon.addRepresentation({ scaleFactor: 2, buffer: readFileSync(path2x) })
  return icon
}

// loaded once, not on every menu open
interface MenuIconSet {
  docx: NativeImage
  xlsx: NativeImage
  pptx: NativeImage
  pdf: NativeImage
  md: NativeImage
  html: NativeImage
  home: NativeImage
}
let menuIconCache: MenuIconSet | null = null
function menuIcons(): MenuIconSet {
  menuIconCache ??= {
    docx: loadMenuIcon(menuDocxIcon1x, menuDocxIcon2x),
    xlsx: loadMenuIcon(menuXlsxIcon1x, menuXlsxIcon2x),
    pptx: loadMenuIcon(menuPptxIcon1x, menuPptxIcon2x),
    pdf: loadMenuIcon(menuPdfIcon1x, menuPdfIcon2x),
    md: loadMenuIcon(menuMdIcon1x, menuMdIcon2x),
    html: loadMenuIcon(menuHtmlIcon1x, menuHtmlIcon2x),
    home: loadMenuIcon(menuHomeIcon1x, menuHomeIcon2x),
  }
  return menuIconCache
}

const TAB_MENU_ICON: Record<TabKind, keyof MenuIconSet> = {
  home: 'home',
  docs: 'docx',
  sheets: 'xlsx',
  slides: 'pptx',
  pdf: 'pdf',
  markdown: 'md',
  html: 'html',
}

// tab views see neither DOM events nor a focus change when the user clicks the
// shell chrome — relay the press so open popovers in documents can dismiss.
// The pressed document must be excluded: it already dismissed (or is opening)
// its own popovers via its local pointerdown listeners, and the async IPC
// round-trip would otherwise close a popover that very press just opened
// (home row menus died this way: pointerdown → broadcast → menu unmounts
// before the click event ever reached the menu item).
function broadcastChromePressed(exclude?: WebContents): void {
  for (const wc of webContents.getAllWebContents()) {
    if (wc !== exclude) wc.send('app:chrome-pressed')
  }
}

/** the shell's tab manager, recreating the shell window when a detached editor outlived it */
function ensureTabManager(): TabManager {
  if (!tabManager) createShellWindow()
  if (!tabManager) throw new Error('the shell window could not be created')
  return tabManager
}

/** "Open in New Window": reparent the tab's live view into a detached editor
 *  window — the document moves as-is, unsaved edits included. */
function detachTabToWindow(id: string): void {
  if (!tabManager) return
  const record = tabManager.detachTab(id)
  if (!record) return
  const win = createDetachedEditorWindow({ ...record, applyMenuFor })
  win.focus()
}

function registerTabsIpc(): void {
  ipcMain.on(TABS_CHANNELS.chromePressed, (event) => broadcastChromePressed(event.sender))
  ipcMain.handle(TABS_CHANNELS.list, () => tabManager?.list() ?? [])
  ipcMain.handle(TABS_CHANNELS.activate, (_event, id: unknown) => {
    if (typeof id !== 'string' || !id) return
    tabManager?.activateTab(id)
  })
  ipcMain.handle(TABS_CHANNELS.close, (_event, id: unknown) => {
    if (typeof id !== 'string' || !id) return
    return tabManager?.closeTab(id)
  })
  ipcMain.handle(TABS_CHANNELS.reorder, (_event, id: string, toIndex: number) => {
    if (typeof id === 'string' && Number.isInteger(toIndex)) tabManager?.reorderTab(id, toIndex)
  })
  // "all tabs" overflow menu — native popup because the editors' WebContentsView
  // would cover any DOM dropdown the shell renderer draws below the tab strip
  ipcMain.handle(TABS_CHANNELS.showAppMenu, (_event, x: unknown, y: unknown) => {
    if (!shellWindow) return
    Menu.getApplicationMenu()?.popup({
      window: shellWindow,
      ...(typeof x === 'number' && typeof y === 'number'
        ? { x: Math.round(x), y: Math.round(y) }
        : {}),
    })
  })
  ipcMain.handle(TABS_CHANNELS.showMenu, (_event, x: unknown, y: unknown) => {
    if (!tabManager || !shellWindow) return
    const menu = Menu.buildFromTemplate(
      tabManager.list().map((tab) => ({
        label: tab.title,
        type: 'checkbox' as const,
        checked: tab.active,
        icon: menuIcons()[TAB_MENU_ICON[tab.kind]],
        click: () => tabManager?.activateTab(tab.id),
      })),
    )
    menu.popup({
      window: shellWindow,
      ...(typeof x === 'number' && typeof y === 'number'
        ? { x: Math.round(x), y: Math.round(y) }
        : {}),
    })
  })
  ipcMain.handle(TABS_CHANNELS.detach, (_event, id: unknown) => {
    if (typeof id !== 'string') return
    const tab = tabManager?.list().find((t) => t.id === id)
    if (tab && (tab.kind === 'docs' || tab.kind === 'sheets')) detachTabToWindow(id)
  })
  // per-tab context menu — native for the same reason as the tab list above
  ipcMain.handle(TABS_CHANNELS.showTabMenu, (_event, id: unknown, x: unknown, y: unknown) => {
    if (!tabManager || !shellWindow || typeof id !== 'string') return
    const tab = tabManager.list().find((t) => t.id === id)
    if (!tab || tab.kind === 'home') return
    const template: MenuItemConstructorOptions[] = []
    // MVP: docs + sheets; the other editors follow once their
    // detached-window quirks (slides fullscreen bleed, pdf) are covered
    if (tab.kind === 'docs' || tab.kind === 'sheets') {
      template.push({
        label: tm('menuOpenInNewWindow'),
        click: () => detachTabToWindow(id),
      })
      template.push({ type: 'separator' })
    }
    template.push({
      label: tm('menuClose'),
      enabled: tab.closable,
      click: () => void tabManager?.closeTab(id),
    })
    Menu.buildFromTemplate(template).popup({
      window: shellWindow,
      ...(typeof x === 'number' && typeof y === 'number'
        ? { x: Math.round(x), y: Math.round(y) }
        : {}),
    })
  })
  // "+" new-file menu — native for the same reason as the tab list above
  ipcMain.handle(TABS_CHANNELS.showNewMenu, (_event, x: unknown, y: unknown) => {
    if (!tabManager || !shellWindow) return
    const menu = Menu.buildFromTemplate([
      // enabled:false so pre-Sonoma macOS / Windows (no 'header' support) degrade
      // to an inert label instead of a clickable no-op item
      { label: tm('menuSectionNew'), type: 'header', enabled: false },
      {
        label: tm('menuNewDoc'),
        icon: menuIcons().docx,
        click: () => newDocTab(),
      },
      {
        label: tm('menuNewSheet'),
        icon: menuIcons().xlsx,
        click: () => void newSheetTab(),
      },
      {
        label: tm('menuNewSlide'),
        icon: menuIcons().pptx,
        click: () => newSlideTab(),
      },
      {
        label: tm('menuNewMarkdown'),
        icon: menuIcons().md,
        click: () => newMarkdownTab(),
      },
      {
        label: tm('menuNewHtml'),
        icon: menuIcons().html,
        click: () => newHtmlTab(),
      },
      {
        label: tm('menuNewPdf'),
        icon: menuIcons().pdf,
        click: () => void newPdfTab(),
      },
      { type: 'separator' },
      { label: tm('menuOpen'), click: () => void openFileViaDialog() },
    ])
    menu.popup({
      window: shellWindow,
      ...(typeof x === 'number' && typeof y === 'number'
        ? { x: Math.round(x), y: Math.round(y) }
        : {}),
    })
  })
}

// ---- home menu ----

async function openFileViaDialog(): Promise<void> {
  const win = shellWindow ?? BrowserWindow.getFocusedWindow()
  if (!win) return
  const result = await showOpenDialogWithMemory(dialog, win, {
    filters: [{ name: tm('filterSupported'), extensions: OPEN_DIALOG_EXTENSIONS }],
    properties: ['openFile', 'multiSelections'],
  })
  if (!result.canceled) for (const path of result.filePaths) openDocumentPath(path)
}

function buildHomeMenu(): void {
  const isMac = process.platform === 'darwin'
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    {
      label: tm('menuFile'),
      submenu: [
        { label: tm('menuSectionNew'), type: 'header', enabled: false },
        {
          label: tm('menuNewDoc'),
          accelerator: 'CmdOrCtrl+N',
          click: () => newDocTab(),
        },
        {
          label: tm('menuNewSheet'),
          click: () => void newSheetTab(),
        },
        { label: tm('menuNewSlide'), click: () => newSlideTab() },
        { label: tm('menuNewMarkdown'), click: () => newMarkdownTab() },
        { label: tm('menuNewHtml'), click: () => newHtmlTab() },
        { label: tm('menuNewPdf'), click: () => void newPdfTab() },
        { type: 'separator' },
        {
          label: tm('menuOpen'),
          accelerator: 'CmdOrCtrl+O',
          click: () => void openFileViaDialog(),
        },
        { type: 'separator' },
        { role: 'close', label: tm('menuClose') },
      ],
    },
    editMenuTemplate(process.platform, appMenuLabels(currentLang())),
    windowMenuTemplate(process.platform, appMenuLabels(currentLang())),
    {
      role: 'help',
      label: tm('menuHelp'),
      submenu: [
        { label: tm('thirdPartyNotices'), click: () => void openThirdPartyNotices() },
        { type: 'separator' },
        checkUpdatesMenuItem(appMenuLabels(currentLang())),
        aboutMenuItem(appMenuLabels(currentLang())),
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ---- pdf menu (pdf-main has no menu of its own; the shell owns pdf tabs, so it builds one) ----

function buildPdfMenu(): void {
  const isMac = process.platform === 'darwin'
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    {
      label: tm('menuFile'),
      submenu: [
        {
          label: tm('menuOpen'),
          accelerator: 'CmdOrCtrl+O',
          click: () => void openFileViaDialog(),
        },
        { type: 'separator' },
        {
          label: tm('backToHome'),
          accelerator: 'Shift+CmdOrCtrl+H',
          click: () => tabManager?.openHomeTab(),
        },
        { type: 'separator' },
        {
          label: tm('menuSave'),
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            const tab = tabManager?.activePdfTab()
            if (tab) void flushPdfSave(tab.webContents)
          },
        },
        {
          label: tm('menuSaveAs'),
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => void savePdfAs(),
        },
        { type: 'separator' },
        // local pdf2docx (P4): in-process PDFium wasm, no cloud counterpart
        {
          label: tm('menuExportDocx'),
          click: () => void exportPdfAsDocxLocal(),
        },
        // local pdf2pptx (P25): one slide per page, no cloud counterpart
        {
          label: tm('menuExportPptx'),
          click: () => void exportPdfAsPptxLocal(),
        },
        // local pdf2xlsx (P26): one worksheet per page, no cloud counterpart
        {
          label: tm('menuExportXlsx'),
          click: () => void exportPdfAsXlsxLocal(),
        },
        { type: 'separator' },
        {
          label: tm('menuPrint'),
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            const tab = tabManager?.activePdfTab()
            if (tab) sendPdfPrintRequest(tab.webContents)
          },
        },
        { type: 'separator' },
        {
          label: tm('menuClose'),
          accelerator: 'CmdOrCtrl+W',
          click: () => tabManager?.closeActiveTab(),
        },
      ],
    },
    editMenuTemplate(process.platform, appMenuLabels(currentLang())),
    windowMenuTemplate(process.platform, appMenuLabels(currentLang())),
    {
      role: 'help',
      label: tm('menuHelp'),
      submenu: [
        { label: tm('thirdPartyNotices'), click: () => void openThirdPartyNotices() },
        { type: 'separator' },
        checkUpdatesMenuItem(appMenuLabels(currentLang())),
        aboutMenuItem(appMenuLabels(currentLang())),
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ---- markdown menu (markdown-main has no menu of its own; the shell owns markdown tabs) ----

function buildMarkdownMenu(): void {
  const isMac = process.platform === 'darwin'
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    {
      label: tm('menuFile'),
      submenu: [
        {
          label: tm('menuOpen'),
          accelerator: 'CmdOrCtrl+O',
          click: () => void openFileViaDialog(),
        },
        { type: 'separator' },
        {
          label: tm('backToHome'),
          accelerator: 'Shift+CmdOrCtrl+H',
          click: () => tabManager?.openHomeTab(),
        },
        { type: 'separator' },
        {
          label: tm('menuSave'),
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            const tab = tabManager?.activeMarkdownTab()
            if (tab) void requestMarkdownSave(tab.webContents, 'save')
          },
        },
        {
          label: tm('menuSaveAs'),
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            const tab = tabManager?.activeMarkdownTab()
            if (tab) void requestMarkdownSave(tab.webContents, 'saveAs')
          },
        },
        { type: 'separator' },
        {
          label: tm('menuExportDocx'),
          click: () => {
            const tab = tabManager?.activeMarkdownTab()
            if (tab) sendMarkdownExportRequest(tab.webContents, 'docx')
          },
        },
        {
          label: tm('menuExportPdf'),
          click: () => {
            const tab = tabManager?.activeMarkdownTab()
            if (tab) sendMarkdownExportRequest(tab.webContents, 'pdf')
          },
        },
        {
          label: tm('menuExportImages'),
          click: () => {
            const tab = tabManager?.activeMarkdownTab()
            if (tab) sendMarkdownExportRequest(tab.webContents, 'png')
          },
        },
        {
          label: tm('menuOpenInDocs'),
          click: () => {
            const tab = tabManager?.activeMarkdownTab()
            if (tab) sendMarkdownExportRequest(tab.webContents, 'docs')
          },
        },
        { type: 'separator' },
        {
          label: tm('menuPrint'),
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            const tab = tabManager?.activeMarkdownTab()
            if (tab) sendMarkdownPrintRequest(tab.webContents)
          },
        },
        { type: 'separator' },
        {
          label: tm('menuClose'),
          accelerator: 'CmdOrCtrl+W',
          click: () => tabManager?.closeActiveTab(),
        },
      ],
    },
    editMenuTemplate(process.platform, appMenuLabels(currentLang())),
    windowMenuTemplate(process.platform, appMenuLabels(currentLang())),
    {
      role: 'help',
      label: tm('menuHelp'),
      submenu: [
        { label: tm('thirdPartyNotices'), click: () => void openThirdPartyNotices() },
        { type: 'separator' },
        checkUpdatesMenuItem(appMenuLabels(currentLang())),
        aboutMenuItem(appMenuLabels(currentLang())),
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ---- html menu (html-main has no menu of its own; the shell owns html tabs) ----

function buildHtmlMenu(): void {
  const isMac = process.platform === 'darwin'
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    {
      label: tm('menuFile'),
      submenu: [
        {
          label: tm('menuOpen'),
          accelerator: 'CmdOrCtrl+O',
          click: () => void openFileViaDialog(),
        },
        { type: 'separator' },
        {
          label: tm('backToHome'),
          accelerator: 'Shift+CmdOrCtrl+H',
          click: () => tabManager?.openHomeTab(),
        },
        { type: 'separator' },
        {
          label: tm('menuSave'),
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            const tab = tabManager?.activeHtmlTab()
            if (tab) void requestHtmlSave(tab.webContents, 'save')
          },
        },
        {
          label: tm('menuSaveAs'),
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            const tab = tabManager?.activeHtmlTab()
            if (tab) void requestHtmlSave(tab.webContents, 'saveAs')
          },
        },
        { type: 'separator' },
        {
          label: tm('menuExportDocx'),
          click: () => {
            const tab = tabManager?.activeHtmlTab()
            if (tab) sendHtmlExportRequest(tab.webContents, 'docx')
          },
        },
        {
          label: tm('menuExportPdf'),
          click: () => {
            const tab = tabManager?.activeHtmlTab()
            if (tab) sendHtmlExportRequest(tab.webContents, 'pdf')
          },
        },
        {
          label: tm('menuExportHtml'),
          click: () => {
            const tab = tabManager?.activeHtmlTab()
            if (tab) sendHtmlExportRequest(tab.webContents, 'html')
          },
        },
        { type: 'separator' },
        {
          label: tm('menuPrint'),
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            const tab = tabManager?.activeHtmlTab()
            if (tab) sendHtmlPrintRequest(tab.webContents)
          },
        },
        { type: 'separator' },
        {
          label: tm('menuClose'),
          accelerator: 'CmdOrCtrl+W',
          click: () => tabManager?.closeActiveTab(),
        },
      ],
    },
    editMenuTemplate(process.platform, appMenuLabels(currentLang())),
    windowMenuTemplate(process.platform, appMenuLabels(currentLang())),
    {
      role: 'help',
      label: tm('menuHelp'),
      submenu: [
        { label: tm('thirdPartyNotices'), click: () => void openThirdPartyNotices() },
        { type: 'separator' },
        checkUpdatesMenuItem(appMenuLabels(currentLang())),
        aboutMenuItem(appMenuLabels(currentLang())),
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

/**
 * Save As for pdf tabs: write pending edits to the picked path only, then open the copy.
 * Non-destructive: the original file is never written, and a cancelled dialog changes
 * nothing on disk (dialog first, no flush into the source).
 */
/** In-flight guard (same pattern as exportPdfAsDocxLocal): a re-trigger while the dialog
    or write is active must not start a second flow that overwrites the first one's
    waiter/target grant or clears its autosave pause early */
let savingPdfAs = false

async function savePdfAs(): Promise<void> {
  const tab = tabManager?.activePdfTab()
  if (!tab?.filePath || !shellWindow || savingPdfAs) return
  savingPdfAs = true
  // Pause renderer autosave for the whole flow: the dialog blurs the window, and a
  // blur-triggered autosave would write the pending edits into the original file
  setPdfSaveAsInFlight(tab.webContents, true)
  try {
    const picked = await showSaveDialogWithMemory(dialog, shellWindow, {
      defaultPath: tab.filePath,
      filters: [{ name: tm('filterPdf'), extensions: ['pdf'] }],
    })
    const target = pdfSaveAsTarget(picked, tab.filePath)
    if (!target) return
    if (pdfIsDirty(tab.webContents.id)) {
      // Renderer applies its pending edits onto the source bytes; the pdf main
      // process writes the result to the picked path only
      if (!(await requestPdfSaveAs(tab.webContents, target))) return
    } else {
      // No pending edits → a byte-identical copy
      copyFileSync(tab.filePath, target)
    }
    openDocumentPath(target)
  } catch (err) {
    console.error('[shell] pdf save as failed:', err)
    showErrorDialog(shellWindow, tm('errPdfSaveAsFailed'), err)
  } finally {
    savingPdfAs = false
    setPdfSaveAsInFlight(tab.webContents, false)
  }
}

/**
 * In-flight guard: covers the whole flow (dialogs included) so re-triggering
 * from the menu can never start a second conversion
 */
let exportingPdfDocx = false

/**
 * Export as Word for pdf tabs, fully local (pdf2docx P4): flush pending
 * edits, pick the destination, convert in-process via PDFium wasm, write the
 * file and open it in a Docs tab. No login, no credits.
 */
async function exportPdfAsDocxLocal(): Promise<void> {
  const tab = tabManager?.activePdfTab()
  if (!tab?.filePath || !shellWindow) return
  if (exportingPdfDocx) {
    void dialog.showMessageBox(shellWindow, {
      type: 'info',
      message: tm('pdfDocxBusyMsg'),
    })
    return
  }
  exportingPdfDocx = true
  try {
    if (!(await flushPdfSave(tab.webContents))) return
    const picked = await showSaveDialogWithMemory(dialog, shellWindow, {
      defaultPath: tab.filePath.replace(/\.pdf$/i, '.docx'),
      filters: [{ name: tm('filterWord'), extensions: ['docx'] }],
    })
    if (picked.canceled || !picked.filePath) return
    // If the destination is already open in a docs tab, close it first (its
    // normal unsaved-changes guard applies) so the converted file opens fresh
    // instead of leaving a stale tab whose next save would clobber the result.
    const staleTabId = tabManager?.findDocsTabByPath(picked.filePath)
    if (staleTabId) {
      await tabManager?.closeTab(staleTabId)
      tabManager?.activateTab(tab.id)
      if (tabManager?.findDocsTabByPath(picked.filePath)) return
    }
    shellWindow.setProgressBar(2)
    // encrypted PDFs prompt for the password (P23), looping on wrong entries;
    // null result = user cancelled the prompt → abort silently
    const pdfPath = tab.filePath
    const result = await convertPdfFileToDocxLocalWithPrompt(
      pdfPath,
      (retry) =>
        promptPdfPassword(shellWindow, {
          fileName: basename(pdfPath),
          retry,
          busy: false,
          lang: currentLang(),
          strings: {
            title: tm('pdfPwdTitle'),
            prompt: tm('pdfPwdPrompt'),
            retryPrompt: tm('pdfPwdRetryPrompt'),
            ok: tm('pdfPwdOk'),
            cancel: tm('btnCancel'),
            verifying: tm('pdfPwdVerifying'),
            label: tm('pdfPwdLabel'),
            placeholder: tm('pdfPwdPlaceholder'),
            show: tm('pdfPwdShow'),
            hide: tm('pdfPwdHide'),
          },
        }),
      (page, total) => {
        if (shellWindow && !shellWindow.isDestroyed() && total > 0) {
          shellWindow.setProgressBar(page / total)
        }
      },
    )
    if (result === null) return
    await atomicWriteFile(picked.filePath, result.docx)

    // degrade transparency (plan §7.6 dual-track split): whole scan → say so
    // once; individual image-fallback pages → name them;
    // OCR-recovered scans ('ocr') are SUCCESSES — announce the recovery (the
    // user should proofread machine-read text), never the image-export notice
    const ocrPages = result.pageResults.filter((r) => r.status === 'ocr').map((r) => r.page)
    const imagePages = result.pageResults
      .filter((r) => r.status !== 'ok' && r.status !== 'ocr')
      .map((r) => r.page)
    if (result.scannedDocument) {
      await dialog.showMessageBox(shellWindow, {
        type: 'info',
        message: tm('pdfDocxLocalScannedMsg'),
        detail: tm('pdfDocxLocalScannedDetail'),
      })
    } else if (imagePages.length > 0 && ocrPages.length > 0) {
      // mixed documents surface BOTH facts in one dialog: which pages shipped
      // as images and which carry machine-read text the user should proofread
      await dialog.showMessageBox(shellWindow, {
        type: 'info',
        message: tm('pdfDocxLocalDegradedMsg'),
        detail:
          tm('pdfDocxLocalDegradedDetail', { pages: imagePages.join(', ') }) +
          '\n\n' +
          tm('pdfDocxLocalOcrDetail', { pages: ocrPages.join(', ') }),
      })
    } else if (imagePages.length > 0) {
      await dialog.showMessageBox(shellWindow, {
        type: 'info',
        message: tm('pdfDocxLocalDegradedMsg'),
        detail: tm('pdfDocxLocalDegradedDetail', { pages: imagePages.join(', ') }),
      })
    } else if (ocrPages.length > 0) {
      await dialog.showMessageBox(shellWindow, {
        type: 'info',
        message: tm('pdfDocxLocalOcrMsg'),
        detail: tm('pdfDocxLocalOcrDetail', { pages: ocrPages.join(', ') }),
      })
    }
    openDocumentPath(picked.filePath)
  } catch (err) {
    if (shellWindow && !shellWindow.isDestroyed()) {
      // structured load failures (P22): password-protected / damaged PDFs get
      // a human-readable explanation instead of the raw PDFium error string
      const detail =
        err instanceof PdfLoadError
          ? err.code === 'password-required'
            ? tm('pdfDocxLocalEncryptedDetail')
            : err.code === 'unsupported'
              ? // certificate-based or otherwise unsupported security (FPDF
                // error 5): a hard PDFium boundary — no password can open it
                // locally, so the message must NOT suggest one (P24 C)
                tm('pdfDocxLocalUnsupportedEncDetail')
              : tm('pdfDocxLocalCorruptDetail')
          : err instanceof Error
            ? err.message
            : String(err)
      void dialog.showMessageBox(shellWindow, {
        type: 'error',
        message: tm('pdfDocxFailedMsg'),
        detail,
      })
    }
  } finally {
    // the prompt window may still be open when the loop exits through cancel
    // or a non-password error thrown mid-retry
    closePdfPasswordDialog()
    exportingPdfDocx = false
    if (shellWindow && !shellWindow.isDestroyed()) shellWindow.setProgressBar(-1)
  }
}

/**
 * Export as PowerPoint for pdf tabs, fully local (pdf2pptx P25): flush
 * pending edits, pick the destination, convert in-process via PDFium wasm,
 * write the file and open it in a Slides tab. No login, no credits. Shares
 * the in-flight guard with the Word exports so pdfium never runs two
 * conversions at once.
 */
async function exportPdfAsPptxLocal(): Promise<void> {
  const tab = tabManager?.activePdfTab()
  if (!tab?.filePath || !shellWindow) return
  if (exportingPdfDocx) {
    void dialog.showMessageBox(shellWindow, {
      type: 'info',
      message: tm('pdfPptxBusyMsg'),
    })
    return
  }
  exportingPdfDocx = true
  try {
    if (!(await flushPdfSave(tab.webContents))) return
    const picked = await showSaveDialogWithMemory(dialog, shellWindow, {
      defaultPath: tab.filePath.replace(/\.pdf$/i, '.pptx'),
      filters: [{ name: tm('filterPpt'), extensions: ['pptx'] }],
    })
    if (picked.canceled || !picked.filePath) return
    // same stale-tab handling as the Word export (see exportPdfAsDocxLocal),
    // against the slides tab that may already show the destination file
    const staleTabId = tabManager?.findSlidesTabByPath(picked.filePath)
    if (staleTabId) {
      await tabManager?.closeTab(staleTabId)
      tabManager?.activateTab(tab.id)
      if (tabManager?.findSlidesTabByPath(picked.filePath)) return
    }
    shellWindow.setProgressBar(2)
    // encrypted PDFs prompt for the password (P23), looping on wrong entries;
    // null result = user cancelled the prompt → abort silently
    const pdfPath = tab.filePath
    const result = await convertPdfFileToPptxLocalWithPrompt(
      pdfPath,
      (retry) =>
        promptPdfPassword(shellWindow, {
          fileName: basename(pdfPath),
          retry,
          busy: false,
          lang: currentLang(),
          strings: {
            title: tm('pdfPwdTitle'),
            prompt: tm('pdfPwdPrompt'),
            retryPrompt: tm('pdfPwdRetryPrompt'),
            ok: tm('pdfPwdOk'),
            cancel: tm('btnCancel'),
            verifying: tm('pdfPwdVerifying'),
            label: tm('pdfPwdLabel'),
            placeholder: tm('pdfPwdPlaceholder'),
            show: tm('pdfPwdShow'),
            hide: tm('pdfPwdHide'),
          },
        }),
      (page, total) => {
        if (shellWindow && !shellWindow.isDestroyed() && total > 0) {
          shellWindow.setProgressBar(page / total)
        }
      },
    )
    if (result === null) return
    await atomicWriteFile(picked.filePath, result.pptx)

    // degrade transparency (same split as the Word export): whole scan vs
    // individual image-fallback pages
    const imagePages = result.pageResults.filter((r) => r.status !== 'ok').map((r) => r.page)
    if (result.scannedDocument) {
      await dialog.showMessageBox(shellWindow, {
        type: 'info',
        message: tm('pdfDocxLocalScannedMsg'),
        detail: tm('pdfPptxLocalScannedDetail'),
      })
    } else if (imagePages.length > 0) {
      await dialog.showMessageBox(shellWindow, {
        type: 'info',
        message: tm('pdfDocxLocalDegradedMsg'),
        detail: tm('pdfDocxLocalDegradedDetail', { pages: imagePages.join(', ') }),
      })
    }
    openDocumentPath(picked.filePath)
  } catch (err) {
    if (shellWindow && !shellWindow.isDestroyed()) {
      // structured load failures (P22): same explanations as the Word export
      const detail =
        err instanceof PdfLoadError
          ? err.code === 'password-required'
            ? tm('pdfDocxLocalEncryptedDetail')
            : err.code === 'unsupported'
              ? tm('pdfDocxLocalUnsupportedEncDetail')
              : tm('pdfDocxLocalCorruptDetail')
          : err instanceof Error
            ? err.message
            : String(err)
      void dialog.showMessageBox(shellWindow, {
        type: 'error',
        message: tm('pdfPptxFailedMsg'),
        detail,
      })
    }
  } finally {
    closePdfPasswordDialog()
    exportingPdfDocx = false
    if (shellWindow && !shellWindow.isDestroyed()) shellWindow.setProgressBar(-1)
  }
}

/**
 * Export as Excel for pdf tabs, fully local (pdf2xlsx P26): flush pending
 * edits, pick the destination, convert in-process via PDFium wasm, write the
 * file and open it in a Sheets tab. No login, no credits. Shares the
 * in-flight guard with the Word/PowerPoint exports so pdfium never runs two
 * conversions at once.
 */
async function exportPdfAsXlsxLocal(): Promise<void> {
  const tab = tabManager?.activePdfTab()
  if (!tab?.filePath || !shellWindow) return
  if (exportingPdfDocx) {
    void dialog.showMessageBox(shellWindow, {
      type: 'info',
      message: tm('pdfXlsxBusyMsg'),
    })
    return
  }
  exportingPdfDocx = true
  try {
    if (!(await flushPdfSave(tab.webContents))) return
    const picked = await showSaveDialogWithMemory(dialog, shellWindow, {
      defaultPath: tab.filePath.replace(/\.pdf$/i, '.xlsx'),
      filters: [{ name: tm('filterExcel'), extensions: ['xlsx'] }],
    })
    if (picked.canceled || !picked.filePath) return
    // same stale-tab handling as the Word export (see exportPdfAsDocxLocal),
    // against the sheets tab that may already show the destination file
    const staleTabId = tabManager?.findSheetsTabByPath(picked.filePath)
    if (staleTabId) {
      await tabManager?.closeTab(staleTabId)
      tabManager?.activateTab(tab.id)
      if (tabManager?.findSheetsTabByPath(picked.filePath)) return
    }
    shellWindow.setProgressBar(2)
    // encrypted PDFs prompt for the password (P23), looping on wrong entries;
    // null result = user cancelled the prompt → abort silently
    const pdfPath = tab.filePath
    const result = await convertPdfFileToXlsxLocalWithPrompt(
      pdfPath,
      (retry) =>
        promptPdfPassword(shellWindow, {
          fileName: basename(pdfPath),
          retry,
          busy: false,
          lang: currentLang(),
          strings: {
            title: tm('pdfPwdTitle'),
            prompt: tm('pdfPwdPrompt'),
            retryPrompt: tm('pdfPwdRetryPrompt'),
            ok: tm('pdfPwdOk'),
            cancel: tm('btnCancel'),
            verifying: tm('pdfPwdVerifying'),
            label: tm('pdfPwdLabel'),
            placeholder: tm('pdfPwdPlaceholder'),
            show: tm('pdfPwdShow'),
            hide: tm('pdfPwdHide'),
          },
        }),
      (page, total) => {
        if (shellWindow && !shellWindow.isDestroyed() && total > 0) {
          shellWindow.setProgressBar(page / total)
        }
      },
    )
    if (result === null) return
    await atomicWriteFile(picked.filePath, result.xlsx)

    // degrade transparency: pages that could not become cells got a notice
    // row on their worksheet instead of an image (a spreadsheet has none)
    const noticePages = result.pageResults.filter((r) => r.status !== 'ok').map((r) => r.page)
    if (result.scannedDocument) {
      await dialog.showMessageBox(shellWindow, {
        type: 'info',
        message: tm('pdfDocxLocalScannedMsg'),
        detail: tm('pdfXlsxLocalScannedDetail'),
      })
    } else if (noticePages.length > 0) {
      await dialog.showMessageBox(shellWindow, {
        type: 'info',
        message: tm('pdfXlsxLocalSkippedMsg'),
        detail: tm('pdfXlsxLocalSkippedDetail', { pages: noticePages.join(', ') }),
      })
    }
    openDocumentPath(picked.filePath)
  } catch (err) {
    if (shellWindow && !shellWindow.isDestroyed()) {
      // structured load failures (P22): same explanations as the Word export
      const detail =
        err instanceof PdfLoadError
          ? err.code === 'password-required'
            ? tm('pdfDocxLocalEncryptedDetail')
            : err.code === 'unsupported'
              ? tm('pdfDocxLocalUnsupportedEncDetail')
              : tm('pdfDocxLocalCorruptDetail')
          : err instanceof Error
            ? err.message
            : String(err)
      void dialog.showMessageBox(shellWindow, {
        type: 'error',
        message: tm('pdfXlsxFailedMsg'),
        detail,
      })
    }
  } finally {
    closePdfPasswordDialog()
    exportingPdfDocx = false
    if (shellWindow && !shellWindow.isDestroyed()) shellWindow.setProgressBar(-1)
  }
}

// The pdf renderer's converter dropdown funnels into the same local conversion
// flows as the File menu items (dialogs, password prompt, in-flight guard included)
ipcMain.handle(PDF_CHANNELS.convertOffice, async (e, format: unknown) => {
  // only the active pdf tab may trigger a conversion (its file is the source)
  if (tabManager?.activePdfTab()?.webContents.id !== e.sender.id) return
  if (format === 'docx') await exportPdfAsDocxLocal()
  else if (format === 'xlsx') await exportPdfAsXlsxLocal()
  else if (format === 'pptx') await exportPdfAsPptxLocal()
})

function openThirdPartyNotices(): Promise<string> {
  const path = app.isPackaged
    ? join(process.resourcesPath, 'THIRD-PARTY-NOTICES.txt')
    : join(app.getAppPath(), 'build', 'THIRD-PARTY-NOTICES.txt')
  return shell.openPath(path)
}

/** every module's File menu gets a way back to the launcher */
function installBackToHomeItems(): void {
  const backToHomeItem: MenuItemConstructorOptions = {
    label: tm('backToHome'),
    accelerator: 'Shift+CmdOrCtrl+H',
    click: () => tabManager?.openHomeTab(),
  }
  setDocsExtraFileMenuItems([backToHomeItem])
  setSheetsExtraFileMenuItems([backToHomeItem])
  setSlidesExtraFileMenuItems([backToHomeItem])
}

function installDockMenu(): void {
  if (process.platform !== 'darwin') return
  app.dock?.setMenu(
    Menu.buildFromTemplate([
      { label: tm('menuHome'), click: () => tabManager?.openHomeTab() },
      {
        label: tm('menuNewDoc'),
        click: () => newDocTab(),
      },
      {
        label: tm('menuNewSheet'),
        click: () => void newSheetTab(),
      },
      { label: tm('menuNewSlide'), click: () => newSlideTab() },
      { label: tm('menuNewMarkdown'), click: () => newMarkdownTab() },
      { label: tm('menuNewPdf'), click: () => void newPdfTab() },
    ]),
  )
}

// On mainland-China networks the main process's Node fetch (undici) bypasses the system proxy,
// so direct calls to overseas LLM/image-search APIs time out or get region-blocked (403).
// Prefer proxy env vars (terminal launch); a packaged app launched from Finder inherits no shell
// env vars, so fall back to the system HTTP proxy. The renderer uses Chromium's system proxy and
// is unaffected. Same bootstrap as slides-main startSlidesStandalone.
// awaited by login IPC so the first status probe / login click cannot race the proxy resolution
let proxyBootstrap: Promise<void> = Promise.resolve()

async function installMainProcessProxy(): Promise<void> {
  let proxyUrl = [
    process.env.HTTPS_PROXY,
    process.env.https_proxy,
    process.env.HTTP_PROXY,
    process.env.http_proxy,
    process.env.ALL_PROXY,
    process.env.all_proxy,
  ].find((v) => v && /^https?:\/\//.test(v))
  if (!proxyUrl) {
    try {
      // PAC/rule proxies answer per-host: probe the host the login flow, the
      // Genspark LLM proxy and the gsk CLI actually target
      const resolved = await session.defaultSession.resolveProxy('https://www.genspark.ai/')
      const m = /PROXY\s+([^;\s]+)/.exec(resolved)
      if (m) proxyUrl = `http://${m[1]}`
    } catch {
      /* no system proxy */
    }
  }
  if (!proxyUrl) return
  // spawned gsk CLI children (login/search/…) do their own fetch and never see
  // the dispatcher below — forward the proxy to them via env
  setGskProxyUrl(proxyUrl)
  try {
    const { ProxyAgent, setGlobalDispatcher } = await import('undici')
    setGlobalDispatcher(new ProxyAgent(proxyUrl))
    // strip user:pass credentials before logging
    console.log('[proxy] main-process fetch via', proxyUrl.replace(/\/\/[^@/]*@/, '//***@'))
  } catch (e) {
    console.warn('[proxy] failed to set ProxyAgent:', e)
  }
}

// ---- lifecycle (the shell is the only owner) ----

let pendingLaunchPaths = collectLaunchPaths(process.argv)
let controlServer: ControlServer | null = null

// show() does not un-minimize, and on macOS ⌘W destroys the shell window while the
// app keeps running — either way a file opened from Finder would land out of sight.
function revealShellWindow(): void {
  if (!shellWindow) createShellWindow()
  if (shellWindow?.isMinimized()) shellWindow.restore()
  shellWindow?.show()
  shellWindow?.focus()
}

function openLaunchPaths(paths: readonly string[]): void {
  let opened = false
  for (const filePath of paths) opened = openDocumentPath(filePath) || opened
  if (!opened) tabManager?.openHomeTab()
}

// On macOS a file opened from Finder is not in argv; it arrives via the open-file event (before ready).
// If another instance already holds the lock, this process exits, and the path must ride along in
// the lock request's additionalData to the surviving instance — so the lock request is deferred
// until ready, after the path is known.
app.on('open-file', (event, filePath) => {
  event.preventDefault()
  if (!app.isReady()) {
    if (!pendingLaunchPaths.includes(filePath)) pendingLaunchPaths.push(filePath)
    return
  }
  revealShellWindow()
  openLaunchPaths([filePath])
})

app.on('second-instance', (_event, argv, _cwd, additionalData) => {
  const paths = collectLaunchPaths(argv, additionalData)
  revealShellWindow()
  openLaunchPaths(paths)
})

installNavigationGuard(app)
installContextMenu(app, () => contextMenuLabels(currentLang()))
registerAiIpc()
registerProjectIpc()
registerDocsIpc()
registerHomeIpc()
registerIntegrationsIpc({
  settingsPath: APP_SETTINGS_PATH,
  window: () => shellWindow,
  cliDir: app.isPackaged
    ? join(process.resourcesPath, 'cli')
    : join(APPS_ROOT, '..', 'packages', 'cli', 'bin'),
  skillPath: app.isPackaged
    ? join(process.resourcesPath, 'cli', 'skills', 'genoffice', 'SKILL.md')
    : join(APPS_ROOT, '..', 'skills', 'genoffice', 'SKILL.md'),
  cliPackageJson: app.isPackaged
    ? join(process.resourcesPath, 'cli', 'package.json')
    : join(APPS_ROOT, '..', 'packages', 'cli', 'package.json'),
})
registerTabsIpc()
registerDroppedFilesIpc()

// sheets' project:resolveChat goes through the handler registered by docs-main; the sessionId reverse lookup hooks in here
setSessionPathResolver(resolveSheetsSessionPath)

/** Dev-only pid marker for the takeover below; scoped to userData like the lock itself. */
const devPidFile = () => join(app.getPath('userData'), 'dev-instance.pid')

/** Hidden-window exporters, one per editor module (HEADLESS_TARGETS says which formats each takes). */
const headlessExporters: HeadlessExporters = {
  docs: exportDocsHeadless,
  sheets: (input, outPath) => exportSheetsPdfHeadless(input, outPath),
  slides: (input, outPath) => exportSlidesPdfHeadless(input, outPath),
  markdown: (input, outPath) => exportMarkdownPdfHeadless(input, outPath),
  html: exportHtmlHeadless,
}

/**
 * The whole `--headless-export` run: no shell window, no menus, no updater,
 * no single-instance lock (a GUI instance may well be running). Prints
 * exactly one line and exits with the genoffice convention (0/1/2/3).
 */
async function runHeadlessExportEntry(
  parsed: Exclude<HeadlessArgvParse, { kind: 'none' }>,
): Promise<void> {
  const outcome =
    parsed.kind === 'error'
      ? ({ ok: false, code: HEADLESS_EXIT.badArgs, message: parsed.message } as const)
      : await runHeadlessExport(parsed.request, headlessExporters)
  const json = parsed.kind === 'error' ? parsed.json : parsed.request.json
  stopSheetsSidecar()
  for (const win of BrowserWindow.getAllWindows()) if (!win.isDestroyed()) win.destroy()
  // Writing to a pipe can finish asynchronously, and app.exit() would cut the
  // envelope off mid-line; wait for the flush (but never longer than 2s).
  const line = formatHeadlessEnvelope(outcome, json) + '\n'
  await new Promise<void>((resolve) => {
    const bail = setTimeout(resolve, 2000)
    process.stdout.write(line, () => {
      clearTimeout(bail)
      resolve()
    })
  })
  // app.quit() always exits 0; the genoffice envelope needs the real code, and
  // every teardown this run owns has already happened.
  app.exit(headlessExitCode(outcome))
}

app.whenReady().then(async () => {
  // first scan waits for the windows to come up; later ones follow folder changes
  setTimeout(() => ensureFileIndexer()?.refresh(), 4000)
  installRendererProtocol({
    docs: join(DOCS_OUT, 'renderer'),
    sheets: join(SHEETS_OUT, 'renderer'),
    slides: join(SLIDES_OUT, 'renderer'),
    pdf: join(PDF_OUT, 'renderer'),
    markdown: join(MARKDOWN_OUT, 'renderer'),
    html: join(HTML_OUT, 'renderer'),
  })
  if (headlessArgv.kind !== 'none') {
    await runHeadlessExportEntry(headlessArgv)
    return
  }
  const lockData = () =>
    pendingLaunchPaths.length > 0
      ? { launchPath: pendingLaunchPaths[0], launchPaths: pendingLaunchPaths }
      : {}
  let hasLock = app.requestSingleInstanceLock(lockData())
  if (!hasLock && !app.isPackaged) {
    // Dev watch restart: electron-vite SIGTERMs the previous instance and spawns this
    // one immediately. Chromium turns that SIGTERM into a graceful quit (Node's
    // process.on('SIGTERM') never fires in the main process), and the quit can wedge
    // in the close-confirmation flow — the zombie then keeps the single-instance lock,
    // this instance quits, and electron-vite's on-close handler exits with it, killing
    // the renderer dev server (blank shell window until a manual dev restart).
    // The previous instance is doomed either way: kill it and take over the lock.
    try {
      const oldPid = Number(readFileSync(devPidFile(), 'utf-8').trim())
      if (Number.isFinite(oldPid) && oldPid > 0 && oldPid !== process.pid) {
        // pid-recycling guard: only kill if that pid is still an Electron process
        const cmd = execSync(`ps -o command= -p ${oldPid}`).toString()
        if (cmd.includes('Electron')) process.kill(oldPid, 'SIGKILL')
      }
    } catch {
      // no previous instance recorded / already gone (ps exits non-zero)
    }
    for (let i = 0; i < 20 && !hasLock; i++) {
      await new Promise((r) => setTimeout(r, 150))
      hasLock = app.requestSingleInstanceLock(lockData())
    }
  }
  if (!hasLock) {
    app.quit()
    return
  }
  // another GenOffice-family app re-logging in rotates the shared key; the
  // home page re-reads its account status. A logout that leaves only the
  // gsk CLI fallback key is not a login
  stopAuthWatch = watchGskApiKey(() => {
    if (!loadGenofficeAuth()) return
    for (const w of BrowserWindow.getAllWindows())
      w.webContents.send(HOME_CHANNELS.accountLoginEvent, { phase: 'success' })
  })
  // a registry left by a crashed instance must not block genoffice writes
  ownsOpenDocumentsRegistry = true
  publishOpenDocuments(OPEN_DOCUMENTS_PATH(), [])
  if (!app.isPackaged) {
    try {
      writeFileSync(devPidFile(), String(process.pid))
    } catch {
      // best-effort: without the marker the next restart just retries the lock
    }
  }

  proxyBootstrap = installMainProcessProxy()
  app.setAccessibilitySupportEnabled(true)
  // Settle the shared uiLang from saved settings BEFORE any tab renderer can
  // ask 'app:get-language': the editor handlers return the i18n module's
  // mutable lang, whose 'zh' default otherwise wins the race for whichever
  // tab loads first (e.g. sheets booting in Chinese while docs shows English).
  currentLang()
  // native menus/dialogs/scrollbars follow the persisted theme from first paint
  nativeTheme.themeSource = currentTheme()
  // stamp the star-prompt install-age clock on the first launch carrying the feature,
  // and detect upgrade launches (version changed since the previous run)
  try {
    const settings = readAppSettings(APP_SETTINGS_PATH())
    const starState = readStarPrompt()
    const stamped = withFirstRun(starState, Date.now())
    if (stamped !== starState) writeStarPrompt(stamped)

    const prevVersion =
      typeof settings[LAST_RUN_VERSION_KEY] === 'string'
        ? (settings[LAST_RUN_VERSION_KEY] as string)
        : null
    const currentVersion = app.getVersion()
    upgradeStarPromptPending = isUpgradeLaunch(
      prevVersion,
      currentVersion,
      settings.onboardingSeen === true,
    )
    if (prevVersion !== currentVersion)
      writeAppSetting(APP_SETTINGS_PATH(), LAST_RUN_VERSION_KEY, currentVersion)
  } catch {
    // settings write failures must never block startup
  }
  // off the startup path: a symlink / registry write nobody is waiting for
  setTimeout(() => installCliLinkBestEffort(APP_SETTINGS_PATH()), 3000)
  initAnalytics()
  analytics.track('app_launch')
  startSheetsCaptureServer()
  // Register the docs renderer bridge listeners before the MCP server can take
  // a visible-editing request.
  installDocsBridge()
  installSheetsBridge()
  // MCP server: localhost-only, docx generation for external agents. Deps are
  // injected so the mcp module never imports this file back.
  // family controls are referenced twice (their own tools + the open-documents
  // tool), so create them once here
  const mcpDocsControl = createDocsControl({
    openBlankTab: () => openBlankDocsTabForMcp(),
    authorizeSave: authorizeMcpDocWrite,
    abandonBlankTab: (wcId) => {
      if (tabManager) abandonBlankTabForMcp(tabManager.docsTabs(), wcId)
    },
  })
  const mcpSlidesControl = createSlidesControl({
    openBlankTab: () => openBlankSlidesTabForMcp(),
    abandonBlankTab: (wcId) => {
      if (tabManager) abandonBlankTabForMcp(tabManager.slidesTabs(), wcId)
    },
  })
  const mcpSheetsControl = createSheetsControl({
    openBlankTab: () => openBlankSheetsTabForMcp(),
    authorizeSave: authorizeMcpSheetWrite,
    abandonBlankTab: (wcId) => abandonBlankSheetsTabForMcp(wcId),
  })
  configureMcpRuntime({
    version: app.getVersion(),
    defaultSaveDir: () => defaultSaveDir(),
    openPath: (filePath) => routeDocumentPath(filePath),
    docsControl: mcpDocsControl,
    slidesControl: mcpSlidesControl,
    sheetsControl: mcpSheetsControl,
    // documents the user has open: the tab list plus each family's own bridge,
    // so an agent reaches a tab nobody but the user opened
    openDocumentsControl: createOpenDocumentsControl({
      list: async () => {
        const tabs = tabManager ? await tabManager.openDocuments() : []
        return [...tabs, ...(await detachedOpenDocuments())]
      },
      webContentsFor: (tabId) =>
        tabManager?.webContentsForTab(tabId) ?? detachedWebContentsFor(tabId),
      closeTab: (tabId) =>
        closeDetachedWithoutPrompt(tabId) || (tabManager?.closeTabWithoutPrompt(tabId) ?? false),
      defaultSaveDir: () => defaultSaveDir(),
      docs: mcpDocsControl,
      sheets: mcpSheetsControl,
      slides: mcpSlidesControl,
      slidesDiscard: discardSlidesRecovery,
      markdown: {
        read: markdownReadText,
        save: markdownSaveToPath,
        discard: markdownDiscardPendingAssets,
      },
      html: {
        read: htmlReadText,
        save: htmlSaveToPath,
        discard: htmlDiscardPendingAssets,
      },
    }),
    // the headless create_*/read_* tools delegate to the bundled genoffice CLI
    // (the same engines, no second implementation); it runs on the app's own
    // Node runtime via ELECTRON_RUN_AS_NODE
    cliRunner: createCliRunner({
      executable: process.execPath,
      entry: app.isPackaged
        ? join(process.resourcesPath, 'cli', 'genoffice.cjs')
        : join(APPS_ROOT, '..', 'packages', 'cli', 'dist', 'genoffice.cjs'),
    }),
    // lets the content tools take a `document` argument (tab id or path) and edit
    // a tab the *user* has open, with no create_session involved
    resolveTarget: createOpenTargetResolver({
      list: async () => {
        const tabs = tabManager ? await tabManager.openDocuments() : []
        return [...tabs, ...(await detachedOpenDocuments())]
      },
      webContentsFor: (tabId) =>
        tabManager?.webContentsForTab(tabId) ?? detachedWebContentsFor(tabId),
      // an agent editing a background tab would otherwise work where nobody can
      // see it: switch to that tab and bring its window forward first
      activate: (tabId) => {
        if (!activateDetached(tabId)) tabManager?.activateTab(tabId)
      },
      revealWindow: (tabId) => {
        if (!isDetachedTabId(tabId)) revealShellWindow()
      },
    }),
    logFilePath: join(app.getPath('userData'), 'mcp-log.txt'),
  })
  void startMcpFromSettings(currentMcpSettings()).catch((error) => {
    console.error('[mcp] failed to start on boot:', error)
  })
  createShellWindow()
  // deferred to ready: labels need currentLang(), which reads app.getLocale()
  installBackToHomeItems()
  installDockMenu()
  setUpdateCheckInvoker(() => void checkForUpdatesNow())
  initAutoUpdater(() => shellWindow, currentUpdateChannel())

  openLaunchPaths(pendingLaunchPaths)
  pendingLaunchPaths = []

  startControlServer(
    app.getPath('userData'),
    controlHandler({
      reveal: revealShellWindow,
      openDocument: openDocumentPath,
      activateTab: (id) => {
        if (!activateDetached(id)) tabManager?.activateTab(id)
      },
      findTab: (path) => tabManager?.findTabByPath(path) ?? findDetachedTabByPath(path),
    }),
  ).then(
    (server) => {
      controlServer = server
    },
    (err: unknown) => console.warn('[control] not listening:', err),
  )

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createShellWindow()
  })
})

app.on('window-all-closed', () => {
  // A headless export destroys its hidden window between documents; only
  // runHeadlessExportEntry decides when that run is over.
  if (headlessArgv.kind !== 'none') return
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  // No close prompt may fall through to "Save" during shutdown
  markSheetsShuttingDown()
  stopSheetsSidecar()
  // release the MCP port synchronously (macOS keeps the process alive after
  // the last window closes, so window-all-closed is not enough)
  stopMcpSync()
})

// after every window has closed, so the shell window's own 'closed' republish cannot revive the file
app.on('will-quit', () => {
  fileIndexer?.stop()
  fileIndexStore?.close()
  stopAuthWatch?.()
  for (const watcher of folderWatchers.values()) watcher.close()
  controlServer?.close()
  // a second instance that lost the lock quits too; it must not delete the running editor's list
  if (ownsOpenDocumentsRegistry) clearOpenDocuments(OPEN_DOCUMENTS_PATH())
})
