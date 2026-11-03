import { describe, expect, it } from 'vitest'
import { sampleSession } from './sample'
import { buildSentenceMap } from './sentenceMap'
import type { Chunk, ChunkColor, Session } from './types'

function chunk(n: number, jp: string, role: string, color = n): Chunk {
  return {
    n,
    jp,
    kana: '',
    gloss: '',
    role,
    color: Math.min(6, Math.max(1, color)) as ChunkColor,
    note: '',
    construction: [],
    examples: [],
  }
}

function session(chunks: Chunk[]): Session {
  return {
    id: `map-${chunks.map((item) => item.n).join('-')}`,
    sentence: chunks.map((item) => item.jp).join(''),
    reading: '',
    natural: '',
    raw: '',
    chunks,
    sentenceNote: [],
    createdAt: '2026-11-03T12:00:00.000Z',
  }
}

describe('Cure Dolly sentence map', () => {
  it('puts a nested location under the reason clause it modifies', () => {
    const map = buildSentenceMap(
      session([
        chunk(1, '利男は', 'topic'),
        chunk(2, '一番大事なところで', 'location'),
        chunk(3, 'よく勉強しなかったから', 'reason clause'),
        chunk(4, '何も分からなくなってしまった。', 'main predicate'),
      ]),
    )

    expect(map.topic.jp).toBe('利男は')
    expect(map.subject.zero).toBe(true)
    expect(map.predicate.jp).toBe('何も分からなくなってしまった。')
    expect(map.modifiers).toEqual([
      {
        chunk: expect.objectContaining({ jp: 'よく勉強しなかったから' }),
        role: 'Reason clause',
        particle: 'から',
        depth: 0,
        targetLabel: 'B-engine',
      },
      {
        chunk: expect.objectContaining({ jp: '一番大事なところで' }),
        role: 'Location',
        particle: 'で',
        depth: 1,
        targetLabel: 'Reason clause',
      },
    ])
  })

  it('keeps object and means as sibling modifiers of the predicate', () => {
    const map = buildSentenceMap(
      session([
        chunk(1, '学校当局は', 'topic'),
        chunk(2, '諸経費の増加分を', 'object'),
        chunk(3, '授業料の値上げで', 'means'),
        chunk(4, 'カバーしようとしている。', 'predicate'),
      ]),
    )

    expect(map.topic.jp).toBe('学校当局は')
    expect(map.subject.zero).toBe(true)
    expect(map.predicate.jp).toBe('カバーしようとしている。')
    expect(map.modifiers.map((item) => [item.chunk.jp, item.depth, item.targetLabel])).toEqual([
      ['諸経費の増加分を', 0, 'B-engine'],
      ['授業料の値上げで', 0, 'B-engine'],
    ])
  })

  it('extracts a subject embedded in the predicate chunk', () => {
    const map = buildSentenceMap(
      session([
        chunk(1, '今度の会合は', 'topic'),
        chunk(2, '形式を重んずるあまり', 'cause clause'),
        chunk(3, '内容が乏しくなってしまった。', 'predicate'),
      ]),
    )

    expect(map.subject.zero).toBe(false)
    expect(map.subject.jp).toBe('内容が')
    expect(map.subject.particle).toBe('が')
    expect(map.predicate.jp).toBe('乏しくなってしまった。')
    expect(map.modifiers[0].role).toBe('Cause clause')
    expect(map.modifiers[0].targetLabel).toBe('B-engine')
  })

  it('uses an explicit A-car and attaches a degree clause to the predicate', () => {
    const map = buildSentenceMap(
      session([
        chunk(1, '日本の英語教育は', 'topic'),
        chunk(2, '文法が強調されるあまり', 'degree clause'),
        chunk(3, '会話力の養成が', 'subject'),
        chunk(4, '疎かになっているようだ', 'predicate'),
      ]),
    )

    expect(map.subject.jp).toBe('会話力の養成が')
    expect(map.subject.zero).toBe(false)
    expect(map.predicate.jp).toBe('疎かになっているようだ')
    expect(map.modifiers.map((item) => [item.role, item.particle, item.targetLabel])).toEqual([
      ['Degree clause', 'あまり', 'B-engine'],
    ])
  })

  it('restores zero topic and subject for the sample sentence', () => {
    const map = buildSentenceMap(sampleSession)

    expect(map.topic.zero).toBe(true)
    expect(map.topic.jp).toBe('(zeroは)')
    expect(map.subject.zero).toBe(true)
    expect(map.subject.jp).toBe('(zeroが)')
    expect(map.predicate.jp).toBe('共有したくなった')
    expect(map.modifiers.map((item) => [item.chunk.jp, item.role])).toEqual([
      ['ただ', 'Adverb'],
      ['心が動いたときに', 'Time clause'],
      ['それを', 'Object'],
      ['誰かと', 'Companion'],
      ['だけ', 'Limiter'],
    ])
  })
})
