import { describe, expect, it } from 'vitest'
import {
  createI18n,
  format,
  htmlLang,
  isLang,
  LANGS,
  macShortcutsToWin,
  normalizeLang,
} from '../src/index'

describe('normalizeLang', () => {
  it('maps vi variants to vi', () => {
    expect(normalizeLang('vi')).toBe('vi')
    expect(normalizeLang('vi-VN')).toBe('vi')
    expect(normalizeLang('vi_VN')).toBe('vi')
  })

  it('maps en variants to en', () => {
    expect(normalizeLang('en')).toBe('en')
    expect(normalizeLang('en-US')).toBe('en')
    expect(normalizeLang('en_US')).toBe('en')
    expect(normalizeLang('en-GB')).toBe('en')
  })

  it('maps unrecognised and empty to en', () => {
    expect(normalizeLang('fr')).toBe('en')
    expect(normalizeLang('de')).toBe('en')
    expect(normalizeLang('zh')).toBe('en')
    expect(normalizeLang('ja')).toBe('en')
    expect(normalizeLang('')).toBe('en')
    expect(normalizeLang(undefined)).toBe('en')
    expect(normalizeLang(null)).toBe('en')
  })
})

describe('isLang', () => {
  it('accepts only supported languages (en, vi)', () => {
    expect(isLang('en')).toBe(true)
    expect(isLang('vi')).toBe(true)
    expect(isLang('zh')).toBe(false)
    expect(isLang('ja')).toBe(false)
    expect(isLang('fr')).toBe(false)
    expect(isLang(42)).toBe(false)
  })
})

describe('htmlLang', () => {
  it('maps every supported language to a BCP-47 tag', () => {
    expect(htmlLang('en')).toBe('en-US')
    expect(htmlLang('vi')).toBe('vi-VN')
    for (const lang of LANGS) expect(htmlLang(lang)).toMatch(/^[a-z]{2}-[A-Z]{2}$/)
  })
})

describe('format', () => {
  it('fills placeholders and keeps unknown ones', () => {
    expect(format('Đã chọn {n} mục', { n: 3 })).toBe('Đã chọn 3 mục')
    expect(format('{a} and {b}', { a: 'x' })).toBe('x and {b}')
    expect(format('no params')).toBe('no params')
  })

  it('does not leak prototype properties into placeholders', () => {
    expect(format('{toString}', {})).toBe('{toString}')
    expect(format('{constructor} and {valueOf}', {})).toBe('{constructor} and {valueOf}')
    expect(format('{n}', { n: 1 })).toBe('1')
  })
})

describe('macShortcutsToWin', () => {
  it('rewrites single-modifier chords', () => {
    expect(macShortcutsToWin('Cắt (⌘X)')).toBe('Cắt (Ctrl+X)')
    expect(macShortcutsToWin('Save (⌘S).')).toBe('Save (Ctrl+S).')
    expect(macShortcutsToWin('⌘1')).toBe('Ctrl+1')
  })

  it('rewrites multi-modifier chords in Ctrl, Alt, Shift order', () => {
    expect(macShortcutsToWin('⇧⌘G')).toBe('Ctrl+Shift+G')
    expect(macShortcutsToWin('⌘⇧V')).toBe('Ctrl+Shift+V')
    expect(macShortcutsToWin('⌥⌘I')).toBe('Ctrl+Alt+I')
    expect(macShortcutsToWin('⌥⇧⌘Z')).toBe('Ctrl+Alt+Shift+Z')
  })

  it('dedupes command and control into one Ctrl', () => {
    expect(macShortcutsToWin('⌃⌘F')).toBe('Ctrl+F')
  })

  it('handles function keys, arrows and named keys', () => {
    expect(macShortcutsToWin('⇧F5')).toBe('Shift+F5')
    expect(macShortcutsToWin('⌘⇧↑')).toBe('Ctrl+Shift+↑')
    expect(macShortcutsToWin('⌘⇧⌫')).toBe('Ctrl+Shift+Backspace')
    expect(macShortcutsToWin('⌫')).toBe('Backspace')
    expect(macShortcutsToWin('⌦')).toBe('Delete')
    expect(macShortcutsToWin('⏎')).toBe('Enter')
    expect(macShortcutsToWin('↩')).toBe('Enter')
    expect(macShortcutsToWin('␣')).toBe('Space')
  })

  it('keeps the Ctrl side of dual-platform listings', () => {
    expect(macShortcutsToWin('⌘/Ctrl+Enter gửi')).toBe('Ctrl+Enter gửi')
  })

  it('rewrites modifier+word combos and bare modifiers', () => {
    expect(macShortcutsToWin('⌘+Click to follow')).toBe('Ctrl+Click to follow')
    expect(macShortcutsToWin('Nhấn giữ ⌘ và nhấp')).toBe('Nhấn giữ Ctrl và nhấp')
  })

  it('leaves strings without Mac symbols untouched', () => {
    const plain = 'Ctrl+S saves the file'
    expect(macShortcutsToWin(plain)).toBe(plain)
    expect(macShortcutsToWin('Tệp')).toBe('Tệp')
  })
})

describe('createI18n', () => {
  const t = createI18n({
    en: { hello: 'Hello {name}', plain: 'Files' },
    vi: { hello: 'Xin chào {name}', plain: 'Tệp' },
  })

  it('translates per language with interpolation', () => {
    expect(t('en', 'hello', { name: 'world' })).toBe('Hello world')
    expect(t('vi', 'hello', { name: 'thế giới' })).toBe('Xin chào thế giới')
    expect(t('vi', 'plain')).toBe('Tệp')
    expect(t('en', 'plain')).toBe('Files')
  })
})
