import { describe, expect, it } from 'vitest'
import {
  fontSizeLabel,
  fontSizeList,
  fontSizeOptions,
  namedFontSizes,
  parseFontSize,
  stepFontSize,
} from '../src/renderer/font-sizes'

describe('font size list per UI language', () => {
  it('lists Word en-US sizes for Latin and Vietnamese UIs', () => {
    expect(fontSizeList('en')).toEqual([
      8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72,
    ])
    expect(fontSizeList('vi')).toEqual(fontSizeList('en'))
    expect(namedFontSizes('en')).toEqual([])
    expect(namedFontSizes('vi')).toEqual([])
  })
  it('parses numbers and formats labels', () => {
    expect(fontSizeLabel(12, 'en')).toBe('12')
    expect(fontSizeLabel(12, 'vi')).toBe('12')
    expect(parseFontSize(' 13.3 ', 'en')).toBe(13.5)
    expect(parseFontSize('12pt', 'en')).toBe(12)
    expect(parseFontSize('0', 'en')).toBeNull()
    expect(parseFontSize('abc', 'en')).toBeNull()
    expect(parseFontSize('5000', 'en')).toBe(1638)
  })
})

describe('Increase / Decrease Font Size stepping', () => {
  it('walks the list inside it', () => {
    expect(stepFontSize(11, 1, 'en')).toBe(12)
    expect(stepFontSize(11.5, 1, 'en')).toBe(12)
    expect(stepFontSize(12, -1, 'en')).toBe(11)
    expect(stepFontSize(11.5, -1, 'en')).toBe(11)
    expect(stepFontSize(10, 1, 'en')).toBe(11)
  })
  it('goes by tens above the list up to 1638', () => {
    expect(stepFontSize(72, 1, 'en')).toBe(80)
    expect(stepFontSize(75, 1, 'en')).toBe(80)
    expect(stepFontSize(80, 1, 'en')).toBe(90)
    expect(stepFontSize(1630, 1, 'en')).toBe(1638)
    expect(stepFontSize(1638, 1, 'en')).toBe(1638)
    expect(stepFontSize(1638, -1, 'en')).toBe(1630)
    expect(stepFontSize(95, -1, 'en')).toBe(90)
    expect(stepFontSize(90, -1, 'en')).toBe(80)
    expect(stepFontSize(80, -1, 'en')).toBe(72)
  })
  it('moves one point at a time below the list down to 1', () => {
    expect(stepFontSize(8, -1, 'en')).toBe(7)
    expect(stepFontSize(7.5, -1, 'en')).toBe(7)
    expect(stepFontSize(1, -1, 'en')).toBe(1)
    expect(stepFontSize(6, 1, 'en')).toBe(7)
    expect(stepFontSize(7.5, 1, 'en')).toBe(8)
  })
})
