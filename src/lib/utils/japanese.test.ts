import { describe, expect, it } from 'vitest'
import {
  chunksRebuildSentence,
  isKanaText,
  isMostlyJapanese,
  normalizeJapaneseText,
  validateJapaneseSentence,
} from './japanese'

describe('Japanese text checks', () => {
  it('accepts Japanese sentences with short Latin terms', () => {
    expect(validateJapaneseSentence('猫が好きです。')).toEqual({ ok: true, message: '' })
    expect(validateJapaneseSentence('これはAIです。')).toEqual({ ok: true, message: '' })
    expect(validateJapaneseSentence('Pythonでコードを書く。')).toEqual({ ok: true, message: '' })
  })

  it('rejects empty or non-Japanese input', () => {
    expect(validateJapaneseSentence('   ').ok).toBe(false)
    expect(validateJapaneseSentence('Hello world.').ok).toBe(false)
    expect(validateJapaneseSentence('12345').ok).toBe(false)
    expect(validateJapaneseSentence('。、！？').ok).toBe(false)
  })

  it('rejects mostly-English and noisy input', () => {
    expect(validateJapaneseSentence('Hello これは').ok).toBe(false)
    expect(validateJapaneseSentence('あああああ').ok).toBe(false)
  })

  it('recognizes mostly-Japanese chunks', () => {
    expect(isMostlyJapanese('猫が')).toBe(true)
    expect(isMostlyJapanese('好きです。')).toBe(true)
    expect(isMostlyJapanese('cats')).toBe(false)
    expect(isMostlyJapanese('(zeroが)')).toBe(false)
  })

  it('checks kana-only readings', () => {
    expect(isKanaText('ねこが・すきです')).toBe(true)
    expect(isKanaText('たなかさんは')).toBe(true)
    expect(isKanaText('猫が')).toBe(false)
    expect(isKanaText('kana')).toBe(false)
  })

  it('normalizes punctuation and whitespace for reconstruction', () => {
    expect(normalizeJapaneseText('猫が 好きです。')).toBe('猫が好きです')
    expect(chunksRebuildSentence(['猫が', '好きです。'], '猫が好きです。')).toBe(true)
    expect(chunksRebuildSentence(['猫が', '好き'], '猫が好きです。')).toBe(false)
  })
})
