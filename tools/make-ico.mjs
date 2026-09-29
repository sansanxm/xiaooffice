import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const iconPng = join(root, 'apps/shell/build/icon.png')
const iconsDir = join(root, 'apps/shell/build/icons')
const iconIco = join(root, 'apps/shell/build/icon.ico')

// 1. Generate all standard icon sizes using macOS built-in `sips`
const sizes = [16, 32, 48, 64, 128, 256, 512]
for (const s of sizes) {
  const out = join(iconsDir, `${s}x${s}.png`)
  execFileSync('sips', ['-z', String(s), String(s), iconPng, '--out', out], { stdio: 'pipe' })
  console.log(`Generated ${s}x${s}.png`)
}

// 2. Assemble 16, 32, 48, 64, 128, 256 into multi-resolution icon.ico
const icoSizes = [16, 32, 48, 64, 128, 256]
const images = icoSizes.map((s) => {
  const data = readFileSync(join(iconsDir, `${s}x${s}.png`))
  return { size: s, data }
})

const headerLength = 6
const entryLength = 16
const totalEntriesLength = images.length * entryLength
let offset = headerLength + totalEntriesLength

const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0) // Reserved
header.writeUInt16LE(1, 2) // Type: 1 = ICO
header.writeUInt16LE(images.length, 4) // Image count

const entries = []
const dataChunks = []

for (const img of images) {
  const entry = Buffer.alloc(16)
  entry.writeUInt8(img.size === 256 ? 0 : img.size, 0) // Width
  entry.writeUInt8(img.size === 256 ? 0 : img.size, 1) // Height
  entry.writeUInt8(0, 2) // Color palette count (0 = no palette)
  entry.writeUInt8(0, 3) // Reserved
  entry.writeUInt16LE(1, 4) // Color planes
  entry.writeUInt16LE(32, 6) // Bits per pixel
  entry.writeUInt32LE(img.data.length, 8) // Size of image data
  entry.writeUInt32LE(offset, 12) // Offset of image data
  entries.push(entry)
  dataChunks.push(img.data)
  offset += img.data.length
}

const icoBuffer = Buffer.concat([header, ...entries, ...dataChunks])
writeFileSync(iconIco, icoBuffer)
console.log(`Successfully generated ${iconIco} (${icoBuffer.length} bytes)`)
