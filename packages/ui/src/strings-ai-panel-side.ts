import type { Lang } from '@genoffice/i18n'
import type { AiPanelSide } from './ai-panel-prefs'

// Shared by every editor's AI header; each label names the destination side.
export const AI_PANEL_SIDE_LABELS: Record<Lang, Record<AiPanelSide, string>> = {
  en: { left: 'Move AI panel to the left', right: 'Move AI panel to the right' },
  vi: { left: 'Chuyển bảng AI sang trái', right: 'Chuyển bảng AI sang phải' },
}
