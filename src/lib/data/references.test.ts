import { describe, expect, it } from 'vitest'
import { referencesForChunk } from './references'
import type { Chunk, ChunkColor } from './types'

function chunk(jp: string, role: string, n = 1): Chunk {
  return {
    n,
    jp,
    kana: '',
    gloss: '',
    role,
    color: 1 as ChunkColor,
    note: '',
    construction: [],
    examples: [],
  }
}

describe('grammar references', () => {
  it('cites topic sources for a は-marked chunk', () => {
    const references = referencesForChunk(chunk('利男は', 'topic'))

    expect(references.map((reference) => `${reference.source} ${reference.label}`)).toEqual([
      'Cure Dolly Lesson 3 — The は particle',
      'Tae Kim §3.3 — Particles: は, も, が',
    ])
  })

  it('cites clause-boundary sources for a から clause', () => {
    const references = referencesForChunk(chunk('よく勉強しなかったから', 'reason clause'))

    expect(references.map((reference) => `${reference.source} ${reference.label}`)).toEqual([
      'Cure Dolly Lesson 34 — Understand any sentence',
      'Tae Kim §4.4 — Compound sentences',
    ])
  })

  it('cites しまう and なる for a changed-state predicate', () => {
    const references = referencesForChunk(chunk('何も分からなくなってしまった。', 'main predicate'))

    expect(references.map((reference) => reference.label)).toEqual([
      '§5.3 — しまう',
      '§4.7 — なる and する',
    ])
  })

  it('cites degree and modification sources for あまり', () => {
    const references = referencesForChunk(chunk('文法が強調されるあまり', 'degree clause'))

    expect(references.map((reference) => reference.label)).toEqual([
      '§5.6 — Amounts',
      'Lesson 46 — Word order matters',
    ])
  })

  it('does not force references onto plain adverbs', () => {
    expect(referencesForChunk(chunk('ただ', 'adverb'))).toEqual([])
  })

  it('caps a chunk at two references', () => {
    const references = referencesForChunk(chunk('カバーしようとしている', 'predicate'))

    expect(references).toHaveLength(2)
    expect(references.map((reference) => reference.label)).toEqual([
      '§4.13 — Try and attempt',
      '§4.5 — Other uses of the te-form',
    ])
  })
})
