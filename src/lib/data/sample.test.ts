import { describe, expect, it } from 'vitest'
import { containsLookup } from '../tatoeba/lookup'
import { sampleSession } from './sample'

describe('sample session', () => {
  it('provides six typed chunks with distinct colors', () => {
    expect(sampleSession.chunks).toHaveLength(6)
    expect(sampleSession.chunks.map((chunk) => chunk.n)).toEqual([1, 2, 3, 4, 5, 6])
    expect(sampleSession.chunks.map((chunk) => chunk.color)).toEqual([1, 2, 3, 4, 5, 6])

    for (const chunk of sampleSession.chunks) {
      expect(chunk.jp.length).toBeGreaterThan(0)
      expect(chunk.kana.length).toBeGreaterThan(0)
      expect(chunk.gloss.length).toBeGreaterThan(0)
      expect(chunk.role.length).toBeGreaterThan(0)
      expect(chunk.note.length).toBeGreaterThan(0)
      expect(chunk.construction.length).toBeGreaterThan(0)
      expect(chunk.examples.length).toBeGreaterThan(0)
      expect(chunk.lookup).toBeTruthy()
      expect(containsLookup(chunk.jp, chunk.lookup ?? '')).toBe(true)
    }
  })

  it('carries the sample sentence-level content', () => {
    expect(sampleSession.sentence).toContain('共有したくなっただけ')
    expect(sampleSession.raw.split('|')).toHaveLength(sampleSession.chunks.length)
    expect(sampleSession.sentenceNote.length).toBeGreaterThanOrEqual(2)

    const parts = sampleSession.naturalParts ?? []
    expect(parts.map((part) => part.text).join('')).toBe(sampleSession.natural)
    expect(parts.map((part) => part.chunk).filter(Boolean)).toEqual([1, 5, 3, 4, 2, 6])
  })
})
