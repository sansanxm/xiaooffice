/**
 * Univer UI locale wiring. createUniver boots with en-US (the packs
 * are needed synchronously); once the runtime exists, the app language picks
 * the matching Univer language packs — every preset ships all 19 — and
 * switches LocaleService, which re-renders the whole Univer React tree
 * (rule-management panels, dialogs, menus). Languages Univer has no pack for
 * (th/nl/ms/he/hi/cs) stay English.
 */
import { LocaleService, LocaleType, mergeLocales, type ILocales } from '@univerjs/core'

import type { UniverRuntime } from './univer-state'

type LocalePack = Record<string, unknown>

const UNIVER_LOCALES: Record<
  string,
  { type: LocaleType; load(): Promise<{ default: LocalePack }[]> }
> = {
  vi: {
    type: LocaleType.VI_VN,
    load: () =>
      Promise.all([
        import('@univerjs/preset-sheets-core/locales/vi-VN'),
        import('@univerjs/preset-sheets-data-validation/locales/vi-VN'),
        import('@univerjs/preset-sheets-conditional-formatting/locales/vi-VN'),
        import('@univerjs/preset-sheets-drawing/locales/vi-VN'),
        import('@univerjs/preset-sheets-filter/locales/vi-VN'),
        import('@univerjs/preset-sheets-find-replace/locales/vi-VN'),
        import('@univerjs/preset-sheets-sort/locales/vi-VN'),
        import('@univerjs/preset-sheets-table/locales/vi-VN'),
      ]),
  },
}
const NUMBER_AS_TEXT_MESSAGE =
  'Giá trị trong ô này được lưu dưới dạng văn bản — giá trị này sẽ không được coi là số trong các công thức.'

/**
 * Both "number stored as text" alerts title themselves "Error" (and sheets-ui
 * 0.25.1 references info keys no pack ships). Title with the numfmt pack's
 * localized "Number stored as text"; spread the namespaces because mergeLocales
 * merges shallowly.
 */
export function numberAsTextAlertLocale(pack: LocalePack): LocalePack {
  const ns = (name: string) => (pack[name] ?? {}) as Record<string, unknown>
  const info = (name: string) => (ns(name).info ?? {}) as Record<string, string>
  const title = info('sheets-numfmt-ui').forceStringInfo ?? 'Số được lưu dưới dạng văn bản'
  const patched = (name: string) => ({
    ...ns(name),
    info: { ...info(name), error: title, forceStringInfo: NUMBER_AS_TEXT_MESSAGE },
  })
  return { 'sheets-ui': patched('sheets-ui'), 'sheets-numfmt-ui': patched('sheets-numfmt-ui') }
}

/**
 * Excel wording for the insert-rows context entries: the upstream en pack
 * pairs "Insert N rows above" with "Insert N rows AFTER" (feedback #302 —
 * "it should be below, not after"; the insert itself lands directly under
 * the selection, only the label misleads). Non-English packs already say
 * below (the zh pack reads "insert below"), so the guard keys the patch to
 * the English text.
 */
export function insertRowsBelowLocale(pack: LocalePack): LocalePack {
  const sheetsUi = (pack['sheets-ui'] ?? {}) as Record<string, unknown>
  const rightClick = (sheetsUi.rightClick ?? {}) as Record<string, string>
  if (rightClick.insertRowsAfterSuffix !== 'rows after') return { 'sheets-ui': sheetsUi }
  return {
    'sheets-ui': {
      ...sheetsUi,
      rightClick: { ...rightClick, insertRowsAfterSuffix: 'rows below' },
    },
  }
}

export function univerLocaleFor(lang: string): LocaleType | null {
  return UNIVER_LOCALES[lang]?.type ?? null
}

export async function applyUniverLocale(runtime: UniverRuntime, lang: string): Promise<void> {
  const entry = UNIVER_LOCALES[lang]
  if (!entry) return
  const packs = (await entry.load()).map((mod) => mod.default)
  const merged = mergeLocales(...packs) as LocalePack
  Object.assign(merged, numberAsTextAlertLocale(merged))
  Object.assign(merged, insertRowsBelowLocale(merged))
  const localeService = runtime.univer.__getInjector().get(LocaleService)
  localeService.load({ [entry.type]: merged } as unknown as ILocales)
  localeService.setLocale(entry.type)
}
