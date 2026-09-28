import type { Lang } from '@genoffice/i18n'

// Accessible name for the full-window picture viewer, so the modal is announced
// by name in the editor's own language. Same pattern as the AI panel side labels.
export const IMAGE_VIEWER_TITLES: Record<Lang, string> = {
  en: 'Image viewer',
  vi: 'Trình xem ảnh',
}
