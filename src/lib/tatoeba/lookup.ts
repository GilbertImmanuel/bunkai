import type { Chunk } from '../data/types'

export const LOOKUP_MAX_LENGTH = 6

const BARE_PARTICLES = new Set([
  'は',
  'が',
  'を',
  'に',
  'で',
  'と',
  'も',
  'の',
  'へ',
  'や',
  'か',
  'ね',
  'よ',
  'な',
  'さ',
  'から',
  'まで',
  'より',
  'だけ',
  'しか',
  'ばかり',
  'など',
  'って',
  'でも',
  'ても',
  'こそ',
  'さえ',
  'のみ',
  'ほど',
  'くらい',
  'ぐらい',
  'ながら',
])

const AUXILIARY_ONLY = new Set([
  'した',
  'して',
  'する',
  'します',
  'しました',
  'している',
  'しています',
  'していた',
  'ています',
  'だった',
  'でした',
  'です',
  'ます',
  'そう',
  'たい',
  'したい',
  'ない',
  'なかった',
  'こと',
  'もの',
  'ところ',
  'わけ',
  'はず',
  'つもり',
  'いい',
  'よい',
])

const SPLIT_PARTICLES = [
  'ときに',
  'ために',
  'ながら',
  'けれど',
  'けど',
  'ので',
  'のに',
  'たら',
  'なら',
  'から',
  'まで',
  'より',
  'だけ',
  'しか',
  'ばかり',
  'など',
  'って',
  'でも',
  'ても',
  'は',
  'が',
  'を',
  'に',
  'で',
  'と',
  'の',
  'へ',
  'や',
]

const AUXILIARY_ENDINGS = [
  'したくなかった',
  'したくなった',
  'したくない',
  'したかった',
  'している',
  'しています',
  'していた',
  'ていました',
  'てしまう',
  'てしまった',
  'くなかった',
  'くなった',
  'くない',
  'くなる',
  'になった',
  'になる',
  'でしょう',
  'だろう',
  'だった',
  'でした',
  'です',
  'ます',
  'そう',
  'すぎる',
  'たい',
  'ない',
  'なかった',
  'ている',
  'てる',
  'した',
  'して',
  'する',
  'します',
  'しました',
]

/**
 * Normalizes a chunk / lookup into a short query string suitable for Tatoeba.
 * Keeps Japanese script, the long vowel mark, iteration marks, and ASCII
 * alphanumerics; removes whitespace and ManticoreSearch punctuation.
 */
export function normalizeQuery(value: string): string {
  if (!value) return ''

  return value
    .normalize('NFKC')
    .replace(/\s+/gu, '')
    .replace(/[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々〆ヵヶA-Za-z0-9]/gu, '')
    .toLowerCase()
}

export function containsLookup(text: string, query: string): boolean {
  const needle = normalizeQuery(query)
  if (!needle) return false
  return normalizeQuery(text).includes(needle)
}

export function isBareParticle(value: string): boolean {
  return BARE_PARTICLES.has(normalizeQuery(value))
}

export function isAuxiliaryOnly(value: string): boolean {
  const normalized = normalizeQuery(value)
  return normalized.length === 0 || AUXILIARY_ONLY.has(normalized)
}

export function shouldSkipAutomaticLookup(value: string): boolean {
  const normalized = normalizeQuery(value)
  if (!normalized || normalized.length > LOOKUP_MAX_LENGTH) return true
  if (isBareParticle(normalized) || isAuxiliaryOnly(normalized)) return true
  // A single kana is too broad; a single kanji can be a valid content word.
  if (!/\p{Script=Han}/u.test(normalized) && normalized.length < 2) return true
  return false
}

function shouldSplitParticle(text: string, index: number, particle: string): boolean {
  const end = index + particle.length

  // Trailing particles are safe to trim, except for adverbs ending in っ + と
  // (きっと, ずっと, もっと, ちょっと).
  if (end >= text.length) {
    return !(particle === 'と' && text[index - 1] === 'っ')
  }

  const before = index > 0 ? text[index - 1] : ''
  const after = text[end] ?? ''
  const strong = /[\p{Script=Han}\p{Script=Katakana}]/u

  // Split only when the particle sits next to kanji/katakana, or when it is a
  // multi-character clause marker. This avoids splitting words like ものすごく.
  return strong.test(before) || strong.test(after) || particle.length > 1
}

function splitOnParticles(text: string): string[] {
  const parts: string[] = []
  let rest = text

  while (rest) {
    let bestIndex = -1
    let bestParticle = ''

    for (const particle of SPLIT_PARTICLES) {
      const index = rest.indexOf(particle)
      if (index <= 0) continue
      if (!shouldSplitParticle(rest, index, particle)) continue

      if (
        bestIndex === -1 ||
        index < bestIndex ||
        (index === bestIndex && particle.length > bestParticle.length)
      ) {
        bestIndex = index
        bestParticle = particle
      }
    }

    if (bestIndex === -1) {
      parts.push(rest)
      break
    }

    parts.push(rest.slice(0, bestIndex))
    rest = rest.slice(bestIndex + bestParticle.length)
  }

  return parts.filter(Boolean)
}

function stripAuxiliaryEndings(text: string): string {
  for (const ending of AUXILIARY_ENDINGS) {
    if (!text.endsWith(ending)) continue

    const stem = text.slice(0, -ending.length)
    if (stem.length >= 2 && /[\p{Script=Han}\p{Script=Katakana}]/u.test(stem)) {
      return stem
    }
  }

  return text
}

function scoreCandidate(value: string): number {
  const normalized = normalizeQuery(value)
  if (shouldSkipAutomaticLookup(normalized)) return -1

  const hasKanji = /\p{Script=Han}/u.test(normalized)
  return normalized.length + (hasKanji ? 2 : 0)
}

/**
 * Derives a short lookup term from a chunk. The algorithm is deliberately
 * conservative: it prefers the longest kanji-bearing content run and never
 * invents a string that is not present in the normalized chunk.
 */
export function deriveLookup(text: string): string {
  const normalized = normalizeQuery(text)
  if (!normalized) return ''

  const segments = splitOnParticles(normalized).flatMap((segment) => {
    const trimmed = stripAuxiliaryEndings(segment)
    return trimmed === segment ? [segment] : [trimmed]
  })

  let best = ''
  let bestScore = -1

  for (const segment of segments) {
    const score = scoreCandidate(segment)
    if (score > bestScore) {
      best = segment
      bestScore = score
    }
  }

  if (best) return best

  // Keep a bare particle / auxiliary as the search-link query, but the caller
  // will not fetch it automatically.
  return shouldSkipAutomaticLookup(normalized) && normalized.length <= LOOKUP_MAX_LENGTH
    ? normalized
    : ''
}

export type LookupSource = 'explicit' | 'derived' | 'none'

export interface ChunkLookup {
  query: string
  auto: boolean
  source: LookupSource
}

export function lookupForChunk(chunk: Chunk): ChunkLookup {
  if (chunk.role === 'sentence') {
    return { query: '', auto: false, source: 'none' }
  }

  const explicit = normalizeQuery(chunk.lookup ?? '')
  if (explicit && explicit.length <= LOOKUP_MAX_LENGTH && containsLookup(chunk.jp, explicit)) {
    return { query: explicit, auto: true, source: 'explicit' }
  }

  const derived = deriveLookup(chunk.jp)
  if (!derived) return { query: '', auto: false, source: 'none' }

  return {
    query: derived,
    auto: !shouldSkipAutomaticLookup(derived),
    source: 'derived',
  }
}
