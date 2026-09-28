import { LocaleType } from '@univerjs/core'
import { describe, expect, it } from 'vitest'

import {
  insertRowsBelowLocale,
  numberAsTextAlertLocale,
  univerLocaleFor,
} from '../src/renderer/univer-locales'

describe('univerLocaleFor', () => {
  it('supports vi and falls back for en', () => {
    expect(univerLocaleFor('vi')).toBe(LocaleType.VI_VN)
    expect(univerLocaleFor('en')).toBeNull()
  })
})

describe('numberAsTextAlertLocale', () => {
  it('replaces the "Error" titles and keeps the rest of the namespaces', async () => {
    const core = (await import('@univerjs/preset-sheets-core/locales/en-US')).default as Record<
      string,
      Record<string, unknown>
    >
    const coreUi = core['sheets-ui'] as { info: Record<string, string> }
    const patched = numberAsTextAlertLocale(core)
    const numfmt = patched['sheets-numfmt-ui'] as { info: Record<string, string> }
    const ui = patched['sheets-ui'] as { info: Record<string, string> }
    expect(numfmt.info.error).toBe('Number stored as text')
    expect(ui.info.error).toBe('Number stored as text')
    expect(numfmt.info.forceStringInfo).toBeTruthy()
    expect(ui.info.forceStringInfo).toBe(numfmt.info.forceStringInfo)
    expect(Object.keys(numfmt).length).toBe(Object.keys(core['sheets-numfmt-ui'] ?? {}).length)
    expect(Object.keys(ui).length).toBe(Object.keys(coreUi).length)
    for (const key of Object.keys(coreUi.info)) {
      expect(ui.info).toHaveProperty(key)
    }
  })

  it('localizes the title from the numfmt pack', async () => {
    const core = (await import('@univerjs/preset-sheets-core/locales/zh-CN')).default as Record<
      string,
      Record<string, unknown>
    >
    const patched = numberAsTextAlertLocale(core)
    const coreNumfmt = core['sheets-numfmt-ui'] as { info: Record<string, string> }
    const title = (patched['sheets-numfmt-ui'] as { info: Record<string, string> }).info.error
    expect(title).not.toBe(coreNumfmt.info.error)
    expect(title).toBe(coreNumfmt.info.forceStringInfo)
    expect((patched['sheets-ui'] as { info: Record<string, string> }).info.error).toBe(title)
  })
})

describe('insertRowsBelowLocale', () => {
  it('rewords the English insert-rows-after entry to "rows below"', async () => {
    const core = (await import('@univerjs/preset-sheets-core/locales/en-US')).default as Record<
      string,
      Record<string, unknown>
    >
    const patched = insertRowsBelowLocale(core)
    const rightClick = (patched['sheets-ui'] as { rightClick: Record<string, string> }).rightClick
    const coreRightClick = (core['sheets-ui'] as { rightClick: Record<string, string> }).rightClick
    expect(rightClick.insertRowsAfterSuffix).toBe('rows below')
    expect(rightClick.insertRowsAboveSuffix).toBe(coreRightClick.insertRowsAboveSuffix)
    expect(Object.keys(rightClick).length).toBe(Object.keys(coreRightClick).length)
  })

  it('composes with the number-as-text patch (both survive the shallow merge)', async () => {
    const core = (await import('@univerjs/preset-sheets-core/locales/en-US')).default as Record<
      string,
      Record<string, unknown>
    >
    const patched = insertRowsBelowLocale(numberAsTextAlertLocale(core))
    const ui = patched['sheets-ui'] as {
      info: Record<string, string>
      rightClick: Record<string, string>
    }
    expect(ui.info.error).toBe('Number stored as text')
    expect(ui.rightClick.insertRowsAfterSuffix).toBe('rows below')
  })

  it('leaves translated packs untouched', async () => {
    const core = (await import('@univerjs/preset-sheets-core/locales/zh-CN')).default as Record<
      string,
      Record<string, unknown>
    >
    const patched = insertRowsBelowLocale(core)
    expect(patched['sheets-ui']).toBe(core['sheets-ui'])
  })
})
