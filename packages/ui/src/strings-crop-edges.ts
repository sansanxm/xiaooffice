import type { Lang } from '@genoffice/i18n'
import type { CropEdge } from './image-dialogs'

// Shared accessible names for the crop edge handles, so every edge is reachable
// by keyboard and still announced in the editor's own language.
export const CROP_EDGE_LABELS: Record<Lang, Record<CropEdge, string>> = {
  en: {
    nw: 'Top left edge',
    n: 'Top edge',
    ne: 'Top right edge',
    e: 'Right edge',
    se: 'Bottom right edge',
    s: 'Bottom edge',
    sw: 'Bottom left edge',
    w: 'Left edge',
  },
  vi: {
    nw: 'Cạnh trên bên trái',
    n: 'Cạnh trên',
    ne: 'Cạnh trên bên phải',
    e: 'Cạnh phải',
    se: 'Cạnh dưới bên phải',
    s: 'Cạnh dưới',
    sw: 'Cạnh dưới bên trái',
    w: 'Cạnh trái',
  },
}
