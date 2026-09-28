import { readFileSync } from 'node:fs'
import path from 'node:path'
import { app, dialog, shell } from 'electron'
import type { BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { UpdateInfo } from 'electron-updater'
import { createI18n, getUiLang, htmlLang } from '@genoffice/i18n'
import type {
  UpdateChannel,
  UpdatePhase,
  UpdateUiState,
  UpdateUiStrings,
} from '../shared/update-api'
import {
  closeUpdateWindow,
  isUpdateWindowOpen,
  pushUpdateState,
  showUpdateWindow,
} from './update-window'

/**
 * Full-package auto-update over the generic provider (Azure CDN).
 *
 * The release pipeline publishes `latest.yml` + the versioned installer to
 * the update channel prefix (production builds only). The packaged app reads
 * that URL from resources/app-update.yml, which electron-builder bakes in
 * from the `publish` config in apps/shell/electron-builder.cjs — the URL
 * itself is injected at build time via the GENOFFICE_UPDATE_URL env var and
 * is intentionally not committed to the repo.
 *
 * UX is the strong-guidance modal card (update-window.ts), not a native
 * dialog. Windows updates through the NSIS installer (latest.yml); macOS
 * through the zip target (latest-mac.yml); Linux through the AppImage
 * target (latest-linux.yml) — all published by the internal release
 * pipeline. On Linux only AppImage runs self-update (electron-updater
 * replaces the .AppImage file in place, no root needed); deb installs have
 * no updater — users upgrade via `apt install ./<new>.deb`.
 *
 * Dev preview: GENOFFICE_FAKE_UPDATE=<version> in an unpacked run opens the
 * window with a simulated download so the UI can be exercised end to end.
 */

const tUpd = createI18n({
  vi: {
      "updTitle": "Cập nhật phần mềm",
      "updHeadline": "Đã có phiên bản mới",
      "updDesc": "Bản cập nhật này bao gồm các cải tiến hiệu năng và sửa lỗi. Khuyến nghị cập nhật ngay.",
      "updDownload": "Cập nhật ngay",
      "updLater": "Nhắc tôi sau",
      "updInstall": "Khởi động lại & Cài đặt",
      "updDownloading": "Đang tải bản cập nhật…",
      "updFailed": "Tải bản cập nhật thất bại. Vui lòng kiểm tra mạng và thử lại.",
      "updRetry": "Thử lại",
      "updManual": "Cập nhật tự động thất bại. Vui lòng tải phiên bản mới nhất từ trang tải về và cài đặt thủ công.",
      "updUpToDate": "Bạn đang dùng phiên bản mới nhất ({version}).",
      "updCheckFailed": "Không thể kiểm tra cập nhật. Vui lòng kiểm tra mạng và thử lại.",
      "updOpenDownload": "Mở trang tải về"
  },
  en: {
      "updTitle": "Software Update",
      "updHeadline": "A new version is available",
      "updDesc": "This update includes performance improvements and bug fixes. We recommend updating now.",
      "updDownload": "Update Now",
      "updLater": "Remind me later",
      "updInstall": "Restart & Install",
      "updDownloading": "Downloading update…",
      "updFailed": "Update download failed. Check your network and try again.",
      "updRetry": "Retry",
      "updManual": "Automatic update failed. Please get the latest version from the download page and install it manually.",
      "updUpToDate": "You're up to date (version {version}).",
      "updCheckFailed": "Couldn't check for updates. Check your network and try again.",
      "updOpenDownload": "Open Download Page"
  }
})

const FIRST_CHECK_DELAY_MS = 15_000
const RECHECK_INTERVAL_MS = 4 * 60 * 60 * 1000

// After this many failed download/apply attempts for the same version the
// dialog stops offering "retry" and guides the user to a manual download
// instead. Covers permanently broken update paths — most importantly a
// code-signing identity (Apple Team ID) change, which Squirrel.Mac rejects
// on every retry while the error looks like a download failure to the user.
const MANUAL_FALLBACK_AFTER = 2
// Last-resort manual link only: the GitHub Latest release tracks one channel
// and signing track, so a stable/legacy-track user could land on the wrong
// build. Preferred is the CDN installer derived from the user's own update
// feed (see manualDownloadUrlFor), which matches channel, track, and arch.
const DOWNLOAD_PAGE_URL = 'https://github.com/genspark-ai/genoffice/releases/latest'

/// Trusted HTTPS base URL baked into resources/app-update.yml. Manual download
/// links are always rebuilt from this base rather than trusting URLs supplied
/// by remotely fetched update metadata.
function updateFeedBaseUrl(): string | null {
  try {
    const yml = readFileSync(path.join(process.resourcesPath, 'app-update.yml'), 'utf8')
    const value = /^url:\s*['"]?([^'"\s]+)/m.exec(yml)?.[1]
    if (!value) return null
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) return null
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/`
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

/// Picks the manual-install artifact for this platform/arch from the update
/// feed's file list: macOS wants the dmg matching process.arch (the zip is
/// Squirrel-only), Windows the NSIS exe matching process.arch (the arm64 one
/// carries an -arm64 suffix, the x64 one no arch), Linux the AppImage. Served feeds may
/// carry either feed-relative names or absolute CDN URLs (mac-release-upload
/// rewrites every url: entry to absolute), but only their basename is used.
/// The final URL is always rebuilt against the trusted baked feed base.
function manualDownloadUrlFor(info: UpdateInfo): string | null {
  const basenames = (info.files ?? []).flatMap((file) => {
    try {
      const pathname = new URL(file.url, 'https://metadata.invalid/').pathname
      const basename = pathname.slice(pathname.lastIndexOf('/') + 1)
      return basename ? [decodeURIComponent(basename)] : []
    } catch {
      return []
    }
  })
  const pick = (match: (basename: string) => boolean): string | null =>
    basenames.find(match) ?? null
  let chosen: string | null
  if (process.platform === 'darwin') {
    const arm =
      pick((name) => name.endsWith('-arm64.dmg')) ?? pick((name) => name.endsWith('-universal.dmg'))
    const x64 = pick((name) => name.endsWith('.dmg') && !/-(arm64|universal)\.dmg$/.test(name))
    chosen = process.arch === 'arm64' ? (arm ?? x64) : (x64 ?? arm)
  } else if (process.platform === 'win32') {
    const arm = pick((name) => name.endsWith('-arm64.exe'))
    const x64 = pick((name) => name.endsWith('.exe') && !name.endsWith('-arm64.exe'))
    chosen = process.arch === 'arm64' ? (arm ?? x64) : (x64 ?? arm)
  } else {
    chosen = pick((name) => name.endsWith('.AppImage'))
  }
  if (chosen === null) return null
  const base = updateFeedBaseUrl()
  return base === null ? null : new URL(encodeURIComponent(chosen), base).toString()
}

let started = false
// version the user declined this session — don't nag again until next launch
let dismissedVersion: string | null = null
// re-shows the GENOFFICE_FAKE_UPDATE window so the manual check is
// exercisable in dev runs too
let fakeShowAgain: (() => void) | null = null
let manualCheckInFlight = false

// electron-updater feed name per user-facing channel. The platform suffix is
// appended by electron-updater itself: 'beta' resolves to beta.yml on
// Windows, beta-mac.yml on macOS, beta-linux.yml on Linux x64.
const CHANNEL_FEED: Record<UpdateChannel, string> = { stable: 'latest', beta: 'beta' }

// true once the packaged-run updater is configured; channel switches before
// that (or in dev runs) must not touch electron-updater
let updaterActive = false

function log(...args: unknown[]): void {
  console.log('[updater]', ...args)
}

function uiStrings(): UpdateUiStrings {
  const lang = getUiLang()
  return {
    title: tUpd(lang, 'updTitle'),
    headline: tUpd(lang, 'updHeadline'),
    desc: tUpd(lang, 'updDesc'),
    download: tUpd(lang, 'updDownload'),
    later: tUpd(lang, 'updLater'),
    install: tUpd(lang, 'updInstall'),
    downloading: tUpd(lang, 'updDownloading'),
    failed: tUpd(lang, 'updFailed'),
    retry: tUpd(lang, 'updRetry'),
    manualDesc: tUpd(lang, 'updManual'),
    openDownload: tUpd(lang, 'updOpenDownload'),
  }
}

function initialState(version: string): UpdateUiState {
  return {
    phase: 'available',
    version,
    currentVersion: app.getVersion(),
    percent: 0,
    lang: htmlLang(getUiLang()),
    strings: uiStrings(),
  }
}

export function applyUpdateChannel(channel: UpdateChannel): void {
  if (!updaterActive) return
  autoUpdater.channel = CHANNEL_FEED[channel]
  // the channel setter unconditionally flips allowDowngrade to true; force it
  // back off since a beta user switching to stable must not downgrade
  autoUpdater.allowDowngrade = false
  log('channel switched:', channel)
  autoUpdater.checkForUpdates().catch((err) => log('check failed:', err?.message ?? err))
}

/** User-triggered check (Help > Check for Updates… / the About dialog button).
 * Unlike the silent launch/periodic checks, every outcome gets explicit
 * feedback: an available update opens the standard update window (even a
 * version dismissed with "later" this session — the user just asked for it),
 * up-to-date and failure each get a dialog, and installs with no self-update
 * mechanism (dev runs, Linux .deb) are pointed at the download page instead
 * of being told they're current. */
export async function checkForUpdatesNow(): Promise<void> {
  if (manualCheckInFlight) return
  manualCheckInFlight = true
  try {
    const lang = getUiLang()
    if (fakeShowAgain) {
      fakeShowAgain()
      return
    }
    if (!updaterActive) {
      const { response } = await dialog.showMessageBox({
        type: 'info',
        title: tUpd(lang, 'updTitle'),
        message: tUpd(lang, 'updManual'),
        buttons: ['OK', tUpd(lang, 'updOpenDownload')],
        defaultId: 0,
        cancelId: 0,
      })
      if (response === 1) void shell.openExternal(DOWNLOAD_PAGE_URL)
      return
    }
    dismissedVersion = null
    let result
    try {
      result = await autoUpdater.checkForUpdates()
      if (result === null) throw new Error('Update check was skipped')
    } catch (err) {
      log('manual check failed:', (err as Error)?.message ?? err)
      await dialog.showMessageBox({
        type: 'warning',
        title: tUpd(lang, 'updTitle'),
        message: tUpd(lang, 'updCheckFailed'),
        buttons: ['OK'],
        defaultId: 0,
        cancelId: 0,
      })
      return
    }
    // an available update already opened the update window via the
    // 'update-available' handler; only "nothing new" needs a dialog here
    if (result.isUpdateAvailable) return
    await dialog.showMessageBox({
      type: 'info',
      title: tUpd(lang, 'updTitle'),
      message: tUpd(lang, 'updUpToDate', { version: app.getVersion() }),
      buttons: ['OK'],
      defaultId: 0,
      cancelId: 0,
    })
  } finally {
    manualCheckInFlight = false
  }
}

export function initAutoUpdater(
  getWindow: () => BrowserWindow | null,
  initialChannel: UpdateChannel = 'stable',
): void {
  if (started) return
  started = true

  // dev preview of the update window with a simulated download
  if (!app.isPackaged && process.env.GENOFFICE_FAKE_UPDATE) {
    initFakeUpdate(getWindow, process.env.GENOFFICE_FAKE_UPDATE)
    return
  }
  // Unpacked runs have no app-update.yml and must not hit the CDN with a
  // dev version. Windows updates via NSIS (latest.yml), macOS via the zip
  // target + latest-mac.yml (Squirrel.Mac requires a signed, notarized app
  // — dmg is first-install only), Linux via the AppImage target +
  // latest-linux.yml. On Linux the updater only works for AppImage runs
  // (electron-updater's AppImageUpdater needs the APPIMAGE env var the
  // AppImage runtime sets); deb installs update manually via apt.
  if (!app.isPackaged) return
  const isLinuxAppImage = process.platform === 'linux' && Boolean(process.env.APPIMAGE)
  if (process.platform !== 'win32' && process.platform !== 'darwin' && !isLinuxAppImage) return

  updaterActive = true
  autoUpdater.channel = CHANNEL_FEED[initialChannel]
  // the channel setter unconditionally flips allowDowngrade to true; force it
  // back off since a beta user switching to stable must not downgrade
  autoUpdater.allowDowngrade = false
  autoUpdater.autoDownload = false
  // if the user picked "later" after download, install on normal quit
  autoUpdater.autoInstallOnAppQuit = true
  // full-package policy: never attempt blockmap differential downloads
  // (CI does not publish .blockmap files)
  autoUpdater.disableDifferentialDownload = true

  let latestSeenVersion: string | null = null
  // CDN installer link for latestSeenVersion (channel/track/arch-correct);
  // null falls back to the generic download page
  let manualDownloadUrl: string | null = null
  // consecutive failed attempts for latestSeenVersion; a download can fail
  // through the downloadUpdate() rejection OR only through the 'error' event
  // (macOS: Squirrel.Mac reports signature/apply failures natively), so both
  // paths funnel into failDownload() and the in-flight flag dedupes them
  let failedAttempts = 0
  let downloadInFlight = false
  // where latestSeenVersion got to, so re-opening the window for the same
  // version (a manual check after "later") resumes there instead of offering
  // "Update Now" over a download that is running or already finished
  let phase: UpdatePhase = 'available'
  let percent = 0

  const setPhase = (patch: { phase: UpdatePhase; percent?: number }): void => {
    phase = patch.phase
    if (patch.percent !== undefined) percent = patch.percent
    pushUpdateState(patch)
  }

  const failDownload = (): void => {
    if (!downloadInFlight) return
    downloadInFlight = false
    failedAttempts += 1
    setPhase({ phase: failedAttempts >= MANUAL_FALLBACK_AFTER ? 'manual' : 'error' })
  }

  const actions = {
    onDownload: () => {
      if (phase === 'downloading' || phase === 'downloaded') return
      downloadInFlight = true
      setPhase({ phase: 'downloading', percent: 0 })
      autoUpdater.downloadUpdate().catch((err) => {
        log('download failed:', err?.message ?? err)
        failDownload()
      })
    },
    onInstall: () => {
      closeUpdateWindow()
      // let the window fully close before tearing the app down
      setImmediate(() => autoUpdater.quitAndInstall(true, true))
    },
    onLater: () => {
      dismissedVersion = latestSeenVersion
      closeUpdateWindow()
    },
    onOpenDownload: () => {
      void shell.openExternal(manualDownloadUrl ?? DOWNLOAD_PAGE_URL)
    },
  }

  autoUpdater.on('error', (err) => {
    // network failures during background checks are expected; only surface
    // when the user is watching a download
    log('error:', err?.message ?? err)
    failDownload()
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    if (info.version === dismissedVersion) return
    const sameVersionRecheck = info.version === latestSeenVersion
    // progress/downloaded/error events carry no version, so a newer release
    // landing while the previous one is downloading or already downloaded
    // stays out until that flow ends (it installs on quit and the next launch
    // picks up the newer one); it must not hijack the open window
    if (!sameVersionRecheck && (downloadInFlight || phase === 'downloaded')) {
      log('update available:', info.version, 'ignored while', latestSeenVersion, 'is', phase)
      // an explicit check still owes feedback: bring back the flow in progress
      // (a background recheck stays quiet)
      if (manualCheckInFlight && !isUpdateWindowOpen()) {
        const version = latestSeenVersion ?? info.version
        showUpdateWindow(getWindow(), { ...initialState(version), phase, percent }, actions)
      }
      return
    }
    if (!sameVersionRecheck) {
      failedAttempts = 0
      phase = 'available'
      percent = 0
    }
    latestSeenVersion = info.version
    manualDownloadUrl = manualDownloadUrlFor(info)
    log('update available:', info.version)
    // a periodic recheck resolving to the version the open dialog already
    // shows must not reset its phase to 'available' — that would wipe an
    // in-progress download or a terminal 'manual' fallback back to the
    // "Update Now" offer
    if (sameVersionRecheck && isUpdateWindowOpen()) return
    showUpdateWindow(getWindow(), { ...initialState(info.version), phase, percent }, actions)
  })

  autoUpdater.on('download-progress', (progress) => {
    setPhase({ phase: 'downloading', percent: progress.percent })
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    log('downloaded:', info.version)
    downloadInFlight = false
    failedAttempts = 0
    setPhase({ phase: 'downloaded', percent: 100 })
  })

  const check = (): void => {
    autoUpdater.checkForUpdates().catch((err) => log('check failed:', err?.message ?? err))
  }
  setTimeout(check, FIRST_CHECK_DELAY_MS)
  setInterval(check, RECHECK_INTERVAL_MS)
}

/** unpacked-run simulation: real window + IPC, fake download that completes */
function initFakeUpdate(getWindow: () => BrowserWindow | null, version: string): void {
  let timer: NodeJS.Timeout | null = null
  const actions = {
    onDownload: () => {
      let pct = 0
      pushUpdateState({ phase: 'downloading', percent: 0 })
      timer = setInterval(() => {
        pct += 4
        if (pct >= 100) {
          if (timer) clearInterval(timer)
          pushUpdateState({ phase: 'downloaded', percent: 100 })
        } else {
          pushUpdateState({ phase: 'downloading', percent: pct })
        }
      }, 100)
    },
    onInstall: () => {
      log('[fake] install requested')
      closeUpdateWindow()
    },
    onLater: () => {
      if (timer) clearInterval(timer)
      closeUpdateWindow()
    },
    onOpenDownload: () => {
      log('[fake] open download page requested')
    },
  }
  fakeShowAgain = () => showUpdateWindow(getWindow(), initialState(version), actions)
  setTimeout(() => fakeShowAgain?.(), 1500)
}
