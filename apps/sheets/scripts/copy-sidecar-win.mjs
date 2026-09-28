import { existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.platform === 'win32') {
  const here = dirname(fileURLToPath(import.meta.url))
  const targetDir = join(here, '../native/xlsx-engine/target')

  function findExe(dir) {
    if (!existsSync(dir)) return null
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        const sub = findExe(full)
        if (sub) return sub
      } else if (entry.name === 'xlsx-sidecar.exe') {
        return full
      }
    }
    return null
  }

  const found = findExe(targetDir)
  if (found) {
    const destinations = [
      join(targetDir, 'release/xlsx-sidecar.exe'),
      join(targetDir, 'x86_64-pc-windows-gnu/release/xlsx-sidecar.exe'),
      join(targetDir, 'x86_64-pc-windows-msvc/release/xlsx-sidecar.exe'),
    ]
    for (const dest of destinations) {
      if (found !== dest && !existsSync(dest)) {
        mkdirSync(dirname(dest), { recursive: true })
        copyFileSync(found, dest)
        console.log(`[copy-sidecar-win] copied ${found} -> ${dest}`)
      }
    }
  }
}
