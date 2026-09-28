import { describe, expect, it } from 'vitest'
import { strings } from '../src/renderer/src/strings'

/**
 * Home-screen locale tables (src/renderer/src/strings.ts): en defines the key
 * set; vi must cover exactly the same keys with real content.
 */

const locales = Object.keys(strings) as Array<keyof typeof strings>
const referenceKeys = Object.keys(strings.en).sort()

/** placeholders like {n}, {name}, {v} embedded in a template */
function placeholdersOf(template: string): string[] {
  return (template.match(/\{[a-zA-Z0-9]+\}/g) ?? []).sort()
}

describe('home-screen locale tables', () => {
  it('includes the expected UI languages', () => {
    expect(locales).toContain('en')
    expect(locales).toContain('vi')
    expect(locales.length).toBe(2)
  })

  it.each(locales)('locale %s has exactly the en key set', (locale) => {
    expect(Object.keys(strings[locale]).sort()).toEqual(referenceKeys)
  })

  it.each(locales)('locale %s has no empty or whitespace-only values', (locale) => {
    const empty = Object.entries(strings[locale])
      .filter(([, value]) => typeof value !== 'string' || value.trim().length === 0)
      .map(([key]) => key)
    expect(empty).toEqual([])
  })

  it.each(locales)('locale %s keeps the en placeholder set for each key', (locale) => {
    const table = strings[locale] as Record<string, string>
    const mismatched = referenceKeys.filter((key) => {
      const localePlaceholders = placeholdersOf(table[key])
      const enPlaceholders = placeholdersOf((strings.en as Record<string, string>)[key])
      if (key.endsWith('One')) {
        return localePlaceholders.some((p) => !enPlaceholders.includes(p))
      }
      return localePlaceholders.join(',') !== enPlaceholders.join(',')
    })
    expect(mismatched).toEqual([])
  })

  it('has no duplicate values that suggest an untranslated copy-paste between en and vi', () => {
    const en = strings.en as Record<string, string>
    const vi = strings.vi as Record<string, string>
    const identical = referenceKeys.filter((key) => en[key] === vi[key])
    // a few shared strings (brand names like "AI Docs", "PDF", "Markdown", "HTML") are fine
    expect(identical.length).toBeLessThan(referenceKeys.length / 4)
  })
})
