import { describe, expect, it } from 'vitest'
import type { Chunk } from '../data/types'
import {
  containsLookup,
  deriveLookup,
  lookupForChunk,
  normalizeQuery,
  shouldSkipAutomaticLookup,
} from './lookup'

function chunk(jp: string, lookup?: string, role = 'noun'): Chunk {
  return {
    n: 1,
    jp,
    kana: '',
    gloss: '',
    role,
    color: 1,
    note: '',
    construction: [],
    examples: [],
    ...(lookup ? { lookup } : {}),
  }
}

describe('query normalization', () => {
  it('removes whitespace and punctuation and normalizes width', () => {
    expect(normalizeQuery('　共有　')).toBe('共有')
    expect(normalizeQuery('心が動いた。')).toBe('心が動いた')
    expect(normalizeQuery('３番目・車両！')).toBe('3番目車両')
  })

  it('checks whether a lookup appears in a chunk', () => {
    expect(containsLookup('心が動いたときに', '動いた')).toBe(true)
    expect(containsLookup('共有したくなった', '共有')).toBe(true)
    expect(containsLookup('心が動いたときに', '猫')).toBe(false)
  })
})

describe('lookup derivation', () => {
  it('derives content words from the sample chunks', () => {
    expect(deriveLookup('ただ')).toBe('ただ')
    expect(deriveLookup('心が動いたときに')).toBe('動いた')
    expect(deriveLookup('それを')).toBe('それ')
    expect(deriveLookup('誰かと')).toBe('誰か')
    expect(deriveLookup('共有したくなった')).toBe('共有')
    expect(deriveLookup('だけ')).toBe('だけ')
  })

  it('derives content words from the seed sessions', () => {
    expect(deriveLookup('前から')).toBe('前')
    expect(deriveLookup('３番目の車両に')).toBe('3番目')
    expect(deriveLookup('乗ると')).toBe('乗る')
    expect(deriveLookup('一番')).toBe('一番')
    expect(deriveLookup('効率がいい')).toBe('効率')
    expect(deriveLookup('ものすごく')).toBe('ものすごく')
    expect(deriveLookup('居心地が')).toBe('居心地')
    expect(deriveLookup('悪そう')).toBe('悪そう')
  })

  it('keeps a bare particle as a search term while skipping automatic fetch', () => {
    expect(deriveLookup('だけ')).toBe('だけ')
    expect(deriveLookup('は')).toBe('は')
    expect(shouldSkipAutomaticLookup('だけ')).toBe(true)
    expect(shouldSkipAutomaticLookup('は')).toBe(true)
  })

  it('accepts short content words and rejects single kana', () => {
    expect(shouldSkipAutomaticLookup('動いた')).toBe(false)
    expect(shouldSkipAutomaticLookup('前')).toBe(false)
    expect(shouldSkipAutomaticLookup('こ')).toBe(true)
    expect(shouldSkipAutomaticLookup('')).toBe(true)
  })
})

describe('chunk lookup selection', () => {
  it('prefers a valid explicit lookup', () => {
    expect(lookupForChunk(chunk('心が動いたときに', '心'))).toEqual({
      query: '心',
      auto: true,
      source: 'explicit',
    })
  })

  it('falls back when the explicit lookup is not present in the chunk', () => {
    expect(lookupForChunk(chunk('心が動いたときに', '猫'))).toEqual({
      query: '動いた',
      auto: true,
      source: 'derived',
    })
  })

  it('rejects an explicit lookup that is too long', () => {
    expect(lookupForChunk(chunk('共有したくなった', '共有したくなった'))).toEqual({
      query: '共有',
      auto: true,
      source: 'derived',
    })
  })

  it('allows an explicit bare particle to be fetched', () => {
    expect(lookupForChunk(chunk('だけ', 'だけ'))).toEqual({
      query: 'だけ',
      auto: true,
      source: 'explicit',
    })
  })

  it('skips derived bare particles automatically', () => {
    expect(lookupForChunk(chunk('だけ'))).toEqual({
      query: 'だけ',
      auto: false,
      source: 'derived',
    })
  })

  it('does not search manual placeholder sentences', () => {
    expect(lookupForChunk(chunk('日本語を勉強しています。', undefined, 'sentence'))).toEqual({
      query: '',
      auto: false,
      source: 'none',
    })
  })
})
