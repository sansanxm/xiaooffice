import type { Lang } from '@genoffice/i18n'

/**
 * Font dropdown candidates grouped by script.
 * Shared by every app's font pickers so the suite offers one consistent list.
 */
const LATIN = [
  'Arial',
  'Times New Roman',
  'Calibri',
  'Roboto',
  'Segoe UI',
  'Georgia',
  'Verdana',
  'Tahoma',
  'Cambria',
  'Garamond',
  'Trebuchet MS',
  'Courier New',
  'Impact',
]

export const BUILTIN_FONT_FAMILIES: readonly string[] = [...LATIN]

export function fontFamiliesFor(_lang: Lang): readonly string[] {
  return BUILTIN_FONT_FAMILIES
}
