/// Native right-click menu for surfaces without a self-drawn one (AI panel,
/// inputs, chrome). Renderer-drawn menus call preventDefault() on the DOM
/// contextmenu event, which suppresses this webContents event entirely
/// (verified on Electron 41), so the two never stack.
import type { App, ContextMenuParams, MenuItemConstructorOptions, WebContents } from 'electron'
import { saveImageFromUrl } from './save-image'

/** Native "View Image" hands the src to the renderer, which owns the viewer overlay */
export const VIEW_IMAGE_CHANNEL = 'genoffice:view-image'

export interface ContextMenuLabels {
  cut: string
  copy: string
  paste: string
  selectAll: string
  viewImage: string
  copyImage: string
  saveImageAs: string
}

const EN: ContextMenuLabels = {
  cut: 'Cut',
  copy: 'Copy',
  paste: 'Paste',
  selectAll: 'Select All',
  viewImage: 'View Image',
  copyImage: 'Copy Image',
  saveImageAs: 'Save Image As…',
}

// One shared table instead of 7 keys × 20 languages duplicated into every
// app's main-process dictionary; strings match the docs Edit menu.
const LABELS: Record<string, ContextMenuLabels> = {
  en: EN,
  vi: {
    cut: "Cắt",
    copy: "Sao chép",
    paste: "Dán",
    selectAll: "Chọn tất cả",
    viewImage: "Xem hình ảnh",
    copyImage: "Sao chép hình ảnh",
    saveImageAs: "Lưu hình ảnh dưới dạng…",
  },
}
export function contextMenuLabels(lang: string): ContextMenuLabels {
  return LABELS[lang] ?? EN
}

export type ContextMenuItem =
  | { type: 'separator' }
  | { action: 'replaceMisspelling'; label: string }
  | { action: 'cut' | 'copy' | 'paste' | 'selectAll'; label: string; enabled: boolean }
  | { action: 'viewImage' | 'copyImage' | 'saveImageAs'; label: string }

type BuildParams = Pick<
  ContextMenuParams,
  'isEditable' | 'selectionText' | 'misspelledWord' | 'dictionarySuggestions' | 'editFlags'
> &
  Partial<Pick<ContextMenuParams, 'mediaType' | 'srcURL'>>

/** Empty result means: don't show a menu. */
export function buildContextMenuItems(
  params: BuildParams,
  labels: ContextMenuLabels,
): ContextMenuItem[] {
  const rest = buildEditItems(params, labels)
  if (params.mediaType !== 'image' || !params.srcURL) return rest
  const image: ContextMenuItem[] = [
    { action: 'viewImage', label: labels.viewImage },
    { action: 'copyImage', label: labels.copyImage },
    { action: 'saveImageAs', label: labels.saveImageAs },
  ]
  return rest.length ? [...image, { type: 'separator' }, ...rest] : image
}

function buildEditItems(params: BuildParams, labels: ContextMenuLabels): ContextMenuItem[] {
  const flags = params.editFlags
  if (params.isEditable) {
    const items: ContextMenuItem[] = []
    if (params.misspelledWord && params.dictionarySuggestions.length) {
      for (const word of params.dictionarySuggestions)
        items.push({ action: 'replaceMisspelling', label: word })
      items.push({ type: 'separator' })
    }
    items.push(
      { action: 'cut', label: labels.cut, enabled: flags.canCut },
      { action: 'copy', label: labels.copy, enabled: flags.canCopy },
      { action: 'paste', label: labels.paste, enabled: flags.canPaste },
      { type: 'separator' },
      { action: 'selectAll', label: labels.selectAll, enabled: flags.canSelectAll },
    )
    return items
  }
  if (params.selectionText.trim()) {
    return [
      { action: 'copy', label: labels.copy, enabled: flags.canCopy },
      { action: 'selectAll', label: labels.selectAll, enabled: flags.canSelectAll },
    ]
  }
  return []
}

// Symbol.for: survives multiple bundled copies (see navigation-guard.ts).
const INSTALLED = Symbol.for('genoffice.context-menu-installed')
const INTERCEPTORS = Symbol.for('genoffice.context-menu-interceptors')

/** Resolves true when the renderer showed its own menu for this right-click. */
export type ContextMenuInterceptor = (
  contents: WebContents,
  params: ContextMenuParams,
) => Promise<boolean>

function interceptorMap(app: App): Map<number, ContextMenuInterceptor> {
  const holder = app as unknown as Record<symbol, Map<number, ContextMenuInterceptor> | undefined>
  return (holder[INTERCEPTORS] ??= new Map())
}

/** Let a renderer with its own DOM context menu claim right-clicks before the native menu pops. */
export function setContextMenuInterceptor(
  app: App,
  contents: WebContents,
  interceptor: ContextMenuInterceptor | null,
): void {
  const map = interceptorMap(app)
  if (interceptor) map.set(contents.id, interceptor)
  else map.delete(contents.id)
}

export function installContextMenu(app: App, getLabels: () => ContextMenuLabels): void {
  const holder = app as unknown as Record<symbol, boolean | undefined>
  if (holder[INSTALLED]) return
  holder[INSTALLED] = true
  app.on('web-contents-created', (_event, contents) => {
    contents.on('context-menu', async (_e, params) => {
      const intercept = interceptorMap(app).get(contents.id)
      if (intercept && (await intercept(contents, params))) return
      void popupMenu(contents, params, getLabels())
    })
  })
}

async function popupMenu(
  contents: WebContents,
  params: ContextMenuParams,
  labels: ContextMenuLabels,
): Promise<void> {
  const items = buildContextMenuItems(params, labels)
  if (!items.length) return
  // Dynamic import keeps this module loadable outside Electron (unit tests).
  const { Menu } = await import('electron')
  const template = items.map((item): MenuItemConstructorOptions => {
    if ('type' in item) return { type: 'separator' }
    if (item.action === 'replaceMisspelling')
      return { label: item.label, click: () => contents.replaceMisspelling(item.label) }
    if (!('enabled' in item)) {
      if (item.action === 'viewImage')
        return { label: item.label, click: () => contents.send(VIEW_IMAGE_CHANNEL, params.srcURL) }
      if (item.action === 'copyImage')
        return { label: item.label, click: () => contents.copyImageAt(params.x, params.y) }
      return {
        label: item.label,
        click: async () => {
          const { BrowserWindow } = await import('electron')
          await saveImageFromUrl(BrowserWindow.fromWebContents(contents), params.srcURL, {
            title: item.label.replace(/…$/, ''),
          })
        },
      }
    }
    const action = item.action
    return { label: item.label, enabled: item.enabled, click: () => contents[action]() }
  })
  Menu.buildFromTemplate(template).popup()
}
