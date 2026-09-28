/// Localized replacements for Electron role menus, whose built-in labels are
/// English-only and (for role:'windowMenu' on Windows/Linux) follow macOS
/// conventions (Zoom, Ctrl+M minimize, Bring All to Front).
import type { MenuItemConstructorOptions, WebContents } from 'electron'
import { contextMenuLabels, type ContextMenuLabels } from './context-menu'

export interface AppMenuLabels extends ContextMenuLabels {
  window: string
  minimize: string
  closeWindow: string
  edit: string
  undo: string
  redo: string
  delete: string
  view: string
  reload: string
  forceReload: string
  toggleDevTools: string
  actualSize: string
  zoomIn: string
  zoomOut: string
  fullscreen: string
  help: string
  about: string
  checkUpdates: string
  version: string
}

type Labels = Omit<AppMenuLabels, keyof ContextMenuLabels>

const EN: Labels = {
  window: 'Window',
  minimize: 'Minimize',
  closeWindow: 'Close Window',
  edit: 'Edit',
  undo: 'Undo',
  redo: 'Redo',
  delete: 'Delete',
  view: 'View',
  reload: 'Reload',
  forceReload: 'Force Reload',
  toggleDevTools: 'Developer Tools',
  actualSize: 'Actual Size',
  zoomIn: 'Zoom In',
  zoomOut: 'Zoom Out',
  fullscreen: 'Full Screen',
  help: 'Help',
  about: 'About GenOffice',
  checkUpdates: 'Check for Updates…',
  version: 'Version',
}

// Shared table, same rationale as context-menu.ts: one copy instead of
// 15 keys × 20 languages per app dictionary.
const LABELS: Record<string, Labels> = {
  en: EN,
  vi: {
    window: "Cửa sổ",
    minimize: "Thu nhỏ",
    closeWindow: "Đóng cửa sổ",
    edit: "Chỉnh sửa",
    undo: "Hoàn tác",
    redo: "Làm lại",
    delete: "Xóa",
    view: "Xem",
    reload: "Tải lại",
    forceReload: "Tải lại bắt buộc",
    toggleDevTools: "Công cụ cho nhà phát triển",
    actualSize: "Kích thước thực tế",
    zoomIn: "Phóng to",
    zoomOut: "Thu nhỏ",
    fullscreen: "Toàn màn hình",
    help: "Trợ giúp",
    about: "Giới thiệu về GenOffice",
    checkUpdates: "Kiểm tra bản cập nhật…",
    version: "Phiên bản",
  },
}
export function appMenuLabels(lang: string): AppMenuLabels {
  return { ...contextMenuLabels(lang), ...(LABELS[lang] ?? EN) }
}

/** macOS keeps the native role (Minimize/Zoom/Front, window list); Windows/Linux
 * gets only conventional items — no Zoom/Front, and no Ctrl+M accelerator since
 * Windows has no menu shortcut for minimize. */
export function windowMenuTemplate(
  platform: NodeJS.Platform,
  labels: AppMenuLabels,
): MenuItemConstructorOptions {
  if (platform === 'darwin') return { role: 'windowMenu', label: labels.window }
  return {
    label: labels.window,
    submenu: [
      { label: labels.minimize, click: (_item, win) => win?.minimize() },
      { type: 'separator' },
      { label: labels.closeWindow, click: (_item, win) => win?.close() },
    ],
  }
}

/** macOS keeps role:'editMenu' (Speech/Substitutions submenus etc.); elsewhere
 * the same items Electron would generate, with localized labels. */
export function editMenuTemplate(
  platform: NodeJS.Platform,
  labels: AppMenuLabels,
): MenuItemConstructorOptions {
  if (platform === 'darwin') return { role: 'editMenu', label: labels.edit }
  return {
    label: labels.edit,
    submenu: [
      { role: 'undo', label: labels.undo },
      { role: 'redo', label: labels.redo },
      { type: 'separator' },
      { role: 'cut', label: labels.cut },
      { role: 'copy', label: labels.copy },
      { role: 'paste', label: labels.paste },
      { role: 'delete', label: labels.delete },
      { type: 'separator' },
      { role: 'selectAll', label: labels.selectAll },
    ],
  }
}

let lastDetachedDevToolsTarget: WebContents | undefined

/** role:'toggleDevTools' docks DevTools into the window, where the shell's
 * WebContentsView tabs are stacked above it and occlude it — open detached
 * instead, keeping the role's accelerator and toggle semantics. */
export function toggleDevToolsItem(labels: AppMenuLabels): MenuItemConstructorOptions {
  return {
    label: labels.toggleDevTools,
    accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
    click: async () => {
      const { webContents } = await import('electron')
      const focused = webContents.getFocusedWebContents()
      const previous =
        lastDetachedDevToolsTarget && !lastDetachedDevToolsTarget.isDestroyed()
          ? lastDetachedDevToolsTarget
          : undefined
      const wc = !focused || focused === previous?.devToolsWebContents ? previous : focused
      if (!wc) return
      if (wc.isDevToolsOpened()) {
        wc.closeDevTools()
        if (wc === lastDetachedDevToolsTarget) lastDetachedDevToolsTarget = undefined
      } else {
        wc.openDevTools({ mode: 'detach' })
        lastDetachedDevToolsTarget = wc
      }
    },
  }
}

/** role:'viewMenu' expands identically on every platform, so no branch. */
export function viewMenuTemplate(labels: AppMenuLabels): MenuItemConstructorOptions {
  return {
    label: labels.view,
    submenu: [
      { role: 'reload', label: labels.reload },
      { role: 'forceReload', label: labels.forceReload },
      toggleDevToolsItem(labels),
      { type: 'separator' },
      { role: 'resetZoom', label: labels.actualSize },
      { role: 'zoomIn', label: labels.zoomIn },
      { role: 'zoomOut', label: labels.zoomOut },
      { type: 'separator' },
      { role: 'togglefullscreen', label: labels.fullscreen },
    ],
  }
}

/** The manual update check lives in the shell (electron-updater and its
 * result dialogs), while the menus that expose it are built here — the shell
 * injects the check at startup. Read at click time, so registration order
 * relative to menu construction doesn't matter; until registered the menu
 * entry no-ops and the About dialog doesn't offer the button. */
let updateCheckInvoker: (() => void) | null = null

export function setUpdateCheckInvoker(invoke: (() => void) | null): void {
  updateCheckInvoker = invoke
}

/** Help > Check for Updates…: user-triggered update check (sits right above
 * About, like Word). The shell-injected check owns all feedback: the update
 * window when newer exists, "you're up to date (version x)" otherwise. */
export function checkUpdatesMenuItem(labels: AppMenuLabels): MenuItemConstructorOptions {
  return {
    label: labels.checkUpdates,
    click: () => updateCheckInvoker?.(),
  }
}

/** Help > About: a native dialog with the app version — every window's menu
 * gets one, so users can report the exact build they run. */
export function aboutMenuItem(labels: AppMenuLabels): MenuItemConstructorOptions {
  return {
    label: labels.about,
    click: async () => {
      const { app, dialog, clipboard } = await import('electron')
      const version = app.getVersion()
      const canCheck = updateCheckInvoker !== null
      const { response } = await dialog.showMessageBox({
        type: 'info',
        title: 'Xiao Office',
        message: 'Xiao Office',
        detail: `${labels.version} ${version}`,
        buttons: ['OK', labels.copy, ...(canCheck ? [labels.checkUpdates] : [])],
        defaultId: 0,
        cancelId: 0,
      })
      if (response === 1) clipboard.writeText(`Xiao Office ${version}`)
      if (response === 2) updateCheckInvoker?.()
    },
  }
}

/** Help menu with Check for Updates… + About; extra app-specific items go
 * before the separator. */
export function helpMenuTemplate(
  labels: AppMenuLabels,
  extraItems: MenuItemConstructorOptions[] = [],
): MenuItemConstructorOptions {
  return {
    role: 'help',
    label: labels.help,
    submenu: [
      ...extraItems,
      ...(extraItems.length > 0 ? [{ type: 'separator' } as const] : []),
      checkUpdatesMenuItem(labels),
      aboutMenuItem(labels),
    ],
  }
}
