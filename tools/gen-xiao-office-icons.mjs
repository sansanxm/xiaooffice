/**
 * Generates modern, flat, beautiful icons for Xiao Office without any black borders.
 * Renders SVG to PNG at all required macOS, Windows, and Linux sizes using Chrome.
 * Produces:
 *   - apps/shell/build/icon.png (1024x1024, transparent background)
 *   - apps/shell/build/icon-mac.png (1024x1024 with macOS 824px squircle content)
 *   - apps/shell/build/icon.icns (Apple ICNS container via iconutil)
 *   - apps/shell/build/icon.ico (Windows ICO container with embedded PNGs)
 *   - apps/shell/src/renderer/src/assets/app-icon.png
 *   - apps/docs/src/renderer/assets/app-icon.png
 *   - apps/sheets/src/renderer/assets/app-icon.png
 *   - apps/slides/src/renderer/assets/app-icon.png
 */

import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const shellBuildDir = join(root, 'apps/shell/build')

// Modern, Flat, High-End Xiao Office SVG Design
// Squircle is centered with smooth continuous curves.
// Outside the squircle is 100% transparent.
function createXiaoOfficeSvg(contentRatio = 1) {
  // Base dimensions: 1024x1024
  const size = 1024
  const pad = ((1 - contentRatio) * size) / 2
  const s = size * contentRatio
  const r = 224 * contentRatio // squircle radius

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Squircle Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="45%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>

    <radialGradient id="topGlow" cx="25%" cy="20%" r="70%">
      <stop offset="0%" stop-color="#60A5FA" stop-opacity="0.6"/>
      <stop offset="50%" stop-color="#3B82F6" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#1D4ED8" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="squircleBorder" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.45"/>
      <stop offset="50%" stop-color="#93C5FD" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#1E40AF" stop-opacity="0.3"/>
    </linearGradient>

    <!-- Document Sheets Gradients -->
    <linearGradient id="backSheetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#DBEAFE" stop-opacity="0.85"/>
    </linearGradient>

    <linearGradient id="frontSheetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F8FAFC"/>
    </linearGradient>

    <!-- Stylized 'X' Gradients -->
    <linearGradient id="xGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="50%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#4F46E5"/>
    </linearGradient>

    <linearGradient id="xGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="60%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#1E40AF"/>
    </linearGradient>

    <!-- Sparkle Stars Gradient -->
    <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#BAE6FD"/>
    </linearGradient>

    <!-- Soft Drop Shadows -->
    <filter id="shadowSquircle" x="-10%" y="-10%" width="120%" height="125%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#1E3A8A" flood-opacity="0.35"/>
    </filter>

    <filter id="shadowSheet" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#0F172A" flood-opacity="0.18"/>
    </filter>

    <filter id="shadowX" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#1E3A8A" flood-opacity="0.25"/>
    </filter>
  </defs>

  <g transform="translate(${pad}, ${pad})">
    <!-- Main App Squircle -->
    <rect x="0" y="0" width="${s}" height="${s}" rx="${r}" fill="url(#bgGrad)" filter="url(#shadowSquircle)"/>
    <rect x="0" y="0" width="${s}" height="${s}" rx="${r}" fill="url(#topGlow)"/>
    <!-- Subtle Inner Border -->
    <rect x="2" y="2" width="${s - 4}" height="${s - 4}" rx="${r - 2}" stroke="url(#squircleBorder)" stroke-width="4" fill="none"/>

    <!-- Scaled Inner Graphics (Internal coordinate box 1000x1000) -->
    <g transform="scale(${s / 1000})">
      <!-- Back Layered Document Sheet (rotated -8 deg) -->
      <g transform="rotate(-8 460 500)" filter="url(#shadowSheet)">
        <rect x="240" y="250" width="400" height="500" rx="44" fill="url(#backSheetGrad)"/>
        <!-- Sheet lines hint -->
        <rect x="300" y="340" width="220" height="24" rx="12" fill="#93C5FD" fill-opacity="0.45"/>
        <rect x="300" y="390" width="280" height="24" rx="12" fill="#93C5FD" fill-opacity="0.35"/>
        <rect x="300" y="440" width="250" height="24" rx="12" fill="#93C5FD" fill-opacity="0.35"/>
      </g>

      <!-- Front Document Sheet -->
      <g filter="url(#shadowSheet)">
        <rect x="340" y="230" width="420" height="530" rx="48" fill="url(#frontSheetGrad)"/>
        <!-- Folded Corner accent at top right -->
        <path d="M680 230L760 310H704C690.7 310 680 299.3 680 286V230Z" fill="#CBD5E1"/>
        <path d="M680 230L760 310H760V230H680Z" fill="#1E40AF" fill-opacity="0.08"/>
      </g>

      <!-- Modern Flat Stylized 'X' (Xiao Brand Mark) -->
      <g filter="url(#shadowX)">
        <!-- Arm 1: Top-Left to Bottom-Right -->
        <path d="M375 320C360 320 350 335 360 350L625 675C635 688 655 688 665 675L685 650C695 638 692 620 680 605L415 335C405 325 390 320 375 320Z" fill="url(#xGrad1)"/>
        <!-- Arm 2: Top-Right to Bottom-Left (Smooth Crossing) -->
        <path d="M635 320C650 320 660 335 650 350L385 675C375 688 355 688 345 675L325 650C315 638 318 620 330 605L595 335C605 325 620 320 635 320Z" fill="url(#xGrad2)"/>
        <!-- Center Intersect Accent Highlight -->
        <circle cx="505" cy="500" r="32" fill="#38BDF8" fill-opacity="0.25"/>
      </g>

      <!-- AI Sparkle Stars (Office Intelligence) -->
      <!-- Big Sparkle (top right of sheet) -->
      <g transform="translate(685, 230)">
        <path d="M0 -42C1.5 -15 15 -1.5 42 0C15 1.5 1.5 15 0 42C-1.5 15 -15 1.5 -42 0C-15 -1.5 -1.5 -15 0 -42Z" fill="url(#sparkleGrad)"/>
      </g>

      <!-- Medium Sparkle (bottom left of X) -->
      <g transform="translate(295, 680)">
        <path d="M0 -28C1 -10 10 -1 28 0C10 1 1 10 0 28C-1 10 -10 1 -28 0C-10 -1 -1 -10 0 -28Z" fill="url(#sparkleGrad)"/>
      </g>

      <!-- Small Sparkle (center-top accent) -->
      <g transform="translate(505, 175)">
        <path d="M0 -20C0.8 -7 7 -0.8 20 0C7 0.8 0.8 7 0 20C-0.8 7 -7 0.8 -20 0C-7 -0.8 -0.8 -7 0 -20Z" fill="#E0F2FE"/>
      </g>
    </g>
  </g>
</svg>`
}

/** ICO container with PNG-compressed entries (supported since Vista). */
function buildIco(entries) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(entries.length, 4)
  const dir = Buffer.alloc(16 * entries.length)
  let offset = header.length + dir.length
  entries.forEach(({ size, png }, i) => {
    const o = i * 16
    dir.writeUInt8(size >= 256 ? 0 : size, o) // 0 means 256
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1)
    dir.writeUInt8(0, o + 2) // palette
    dir.writeUInt8(0, o + 3) // reserved
    dir.writeUInt16LE(1, o + 4) // planes
    dir.writeUInt16LE(32, o + 6) // bpp
    dir.writeUInt32LE(png.length, o + 8)
    dir.writeUInt32LE(offset, o + 12)
    offset += png.length
  })
  return Buffer.concat([header, dir, ...entries.map((e) => e.png)])
}

async function renderPng(page, svgString, canvasSize) {
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`
  await page.setViewportSize({ width: canvasSize, height: canvasSize })
  await page.setContent(
    `<body style="margin:0;background:transparent;overflow:hidden">` +
      `<img src="${dataUrl}" style="width:${canvasSize}px;height:${canvasSize}px;display:block">` +
      `</body>`,
  )
  return page.screenshot({ omitBackground: true, type: 'png' })
}

const MAC_CANVAS_SIZES = [16, 32, 64, 128, 256, 512, 1024]
const ICONSET_ENTRIES = [
  ['icon_16x16.png', 16],
  ['icon_16x16@2x.png', 32],
  ['icon_32x32.png', 32],
  ['icon_32x32@2x.png', 64],
  ['icon_128x128.png', 128],
  ['icon_128x128@2x.png', 256],
  ['icon_256x256.png', 256],
  ['icon_256x256@2x.png', 512],
  ['icon_512x512.png', 512],
  ['icon_512x512@2x.png', 1024],
]
const WIN_SIZES = [16, 24, 32, 48, 64, 128, 256]

console.log('Launching Chrome to render icons...')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ deviceScaleFactor: 1 })
const tmp = mkdtempSync(join(tmpdir(), 'xiao-office-iconset-'))

try {
  // 1. Full-bleed 1024x1024 SVG for Linux / general app icon
  const fullSvg = createXiaoOfficeSvg(0.92)
  const fullPng1024 = await renderPng(page, fullSvg, 1024)

  // 2. macOS HIG 824/1024 content squircle SVG (so it sits at identical optical size with Apple apps in Dock/Finder)
  const macSvg = createXiaoOfficeSvg(824 / 1024)
  const macPng1024 = await renderPng(page, macSvg, 1024)

  // Save base PNGs in apps/shell/build/
  writeFileSync(join(shellBuildDir, 'icon.png'), fullPng1024)
  writeFileSync(join(shellBuildDir, 'icon-mac.png'), macPng1024)

  // Copy icon.png to all renderer asset locations
  const assetTargets = [
    join(root, 'apps/shell/src/renderer/src/assets/app-icon.png'),
    join(root, 'apps/docs/src/renderer/assets/app-icon.png'),
    join(root, 'apps/sheets/src/renderer/assets/app-icon.png'),
    join(root, 'apps/slides/src/renderer/assets/app-icon.png'),
  ]
  for (const target of assetTargets) {
    writeFileSync(target, fullPng1024)
    console.log(`Updated asset: ${target}`)
  }

  // 3. Build macOS .iconset -> .icns
  const iconsetDir = join(tmp, 'icon.iconset')
  mkdirSync(iconsetDir, { recursive: true })

  const macPngs = new Map()
  for (const size of MAC_CANVAS_SIZES) {
    macPngs.set(size, await renderPng(page, macSvg, size))
  }
  for (const [name, size] of ICONSET_ENTRIES) {
    writeFileSync(join(iconsetDir, name), macPngs.get(size))
  }
  execFileSync('iconutil', ['-c', 'icns', iconsetDir, '-o', join(shellBuildDir, 'icon.icns')])
  console.log(`Generated apps/shell/build/icon.icns`)

  // 4. Build Windows .ico
  const winEntries = []
  for (const size of WIN_SIZES) {
    winEntries.push({ size, png: await renderPng(page, fullSvg, size) })
  }
  writeFileSync(join(shellBuildDir, 'icon.ico'), buildIco(winEntries))
  console.log(`Generated apps/shell/build/icon.ico`)

  console.log('Successfully generated all Xiao Office icons!')
} finally {
  rmSync(tmp, { recursive: true, force: true })
  await browser.close()
}
