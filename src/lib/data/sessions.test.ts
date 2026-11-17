import { describe, expect, it } from 'vitest'
import { containsLookup } from '../tatoeba/lookup'
import { createManualSession, sampleSessions } from './sessions'

describe('sample sessions', () => {
  it('provides the three reference sessions', () => {
    expect(sampleSessions.map((session) => session.id)).toEqual(['sample', 's-a', 's-b'])
    expect(sampleSessions.map((session) => session.chunks.length)).toEqual([6, 5, 3])
  })

  it('maps every natural translation part back to a real chunk', () => {
    for (const session of sampleSessions) {
      const parts = session.naturalParts ?? []
      expect(parts.map((part) => part.text).join('')).toBe(session.natural)

      for (const part of parts) {
        if (part.chunk) {
          expect(session.chunks.some((chunk) => chunk.n === part.chunk)).toBe(true)
        }
      }
    }
  })

  it('provides furigana that reconstructs each chunk', () => {
    for (const session of sampleSessions) {
      for (const chunk of session.chunks) {
        if (!chunk.furigana?.length) continue
        expect(chunk.furigana.map((part) => part.text).join('')).toBe(chunk.jp)
        for (const part of chunk.furigana) {
          if (part.reading) expect(part.kind === 'name' || part.kind === 'word').toBe(true)
        }
      }
    }
  })

  it('provides a Tatoeba lookup for every seed chunk', () => {
    for (const session of sampleSessions) {
      for (const chunk of session.chunks) {
        expect(chunk.lookup).toBeTruthy()
        expect(containsLookup(chunk.jp, chunk.lookup ?? '')).toBe(true)
      }
    }
  })
})

describe('manual sessions', () => {
  it('creates a one-chunk placeholder with an honest note', () => {
    const session = createManualSession('日本語を勉強しています。')

    expect(session.source).toBe('manual')
    expect(session.sentence).toBe('日本語を勉強しています。')
    expect(session.chunks).toHaveLength(1)
    expect(session.chunks[0].jp).toBe(session.sentence)
    expect(session.chunks[0].note).toContain('Full chunking')
    expect(session.sentenceNote[0]).toContain('Full chunking')
  })
})
