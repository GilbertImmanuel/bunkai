import type { Session } from './types'

export const MAX_CHUNKS_PER_SESSION = 200
export const MAX_EXAMPLES_PER_CHUNK = 20
export const MAX_CONSTRUCTION_STEPS = 20
export const MAX_FURIGANA_SEGMENTS = 500
export const MAX_SENTENCE_NOTE_ENTRIES = 20
export const MAX_NATURAL_PARTS = 200
export const MAX_TEXT_LENGTH = 2000
export const MAX_LONG_TEXT_LENGTH = 10_000
export const MAX_SHORT_TEXT_LENGTH = 500
export const MAX_CREDIT_LENGTH = 200
export const MAX_URL_LENGTH = 2048
export const MAX_ID_LENGTH = 200
export const MAX_LOOKUP_LENGTH = 100

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isBoundedString(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length <= max
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isSafeHttpsUrl(value: unknown): value is string {
  if (!isBoundedString(value, MAX_URL_LENGTH) || !value) return false

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }

  return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password
}

function isTatoebaUrl(value: unknown): value is string {
  if (!isSafeHttpsUrl(value)) return false
  const host = new URL(value).hostname.toLowerCase()
  return host === 'tatoeba.org' || host.endsWith('.tatoeba.org')
}

function isConstructionStep(value: unknown): boolean {
  return (
    isRecord(value) &&
    isBoundedString(value.jp, MAX_SHORT_TEXT_LENGTH) &&
    isBoundedString(value.en, MAX_SHORT_TEXT_LENGTH)
  )
}

function isExample(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (
    !isBoundedString(value.jp, MAX_SHORT_TEXT_LENGTH) ||
    !isBoundedString(value.en, MAX_SHORT_TEXT_LENGTH)
  ) {
    return false
  }

  if (value.source !== undefined && value.source !== 'ai' && value.source !== 'tatoeba') {
    return false
  }

  if (value.id !== undefined && !isPositiveInteger(value.id)) return false

  if (value.url !== undefined) {
    if (value.source === 'tatoeba' ? !isTatoebaUrl(value.url) : !isSafeHttpsUrl(value.url)) {
      return false
    }
  }

  if (value.audioUrl !== undefined) {
    if (
      value.source === 'tatoeba' ? !isTatoebaUrl(value.audioUrl) : !isSafeHttpsUrl(value.audioUrl)
    ) {
      return false
    }
  }

  for (const field of ['author', 'license', 'audioAuthor', 'audioLicense'] as const) {
    if (value[field] !== undefined && !isBoundedString(value[field], MAX_CREDIT_LENGTH)) {
      return false
    }
  }

  return true
}

function isFurigana(value: unknown): boolean {
  return (
    isRecord(value) &&
    isBoundedString(value.text, MAX_SHORT_TEXT_LENGTH) &&
    (value.reading === undefined || isBoundedString(value.reading, MAX_SHORT_TEXT_LENGTH)) &&
    (value.kind === undefined || value.kind === 'name' || value.kind === 'word')
  )
}

function isChunk(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (
    !isBoundedString(value.jp, MAX_LONG_TEXT_LENGTH) ||
    !isBoundedString(value.kana, MAX_TEXT_LENGTH) ||
    !isBoundedString(value.gloss, MAX_TEXT_LENGTH) ||
    !isBoundedString(value.role, MAX_SHORT_TEXT_LENGTH) ||
    !isBoundedString(value.note, MAX_TEXT_LENGTH)
  ) {
    return false
  }

  if (!isPositiveInteger(value.n)) return false
  if (
    typeof value.color !== 'number' ||
    !Number.isInteger(value.color) ||
    value.color < 1 ||
    value.color > 6
  ) {
    return false
  }

  if (
    !Array.isArray(value.construction) ||
    value.construction.length > MAX_CONSTRUCTION_STEPS ||
    !value.construction.every(isConstructionStep)
  ) {
    return false
  }

  if (
    !Array.isArray(value.examples) ||
    value.examples.length > MAX_EXAMPLES_PER_CHUNK ||
    !value.examples.every(isExample)
  ) {
    return false
  }

  if (value.furigana !== undefined) {
    if (
      !Array.isArray(value.furigana) ||
      value.furigana.length > MAX_FURIGANA_SEGMENTS ||
      !value.furigana.every(isFurigana)
    ) {
      return false
    }
  }

  if (value.lookup !== undefined && !isBoundedString(value.lookup, MAX_LOOKUP_LENGTH)) {
    return false
  }

  return true
}

function isNaturalParts(value: unknown): boolean {
  if (!Array.isArray(value) || value.length > MAX_NATURAL_PARTS) return false

  return value.every(
    (part) =>
      isRecord(part) &&
      isBoundedString(part.text, MAX_TEXT_LENGTH) &&
      (part.chunk === undefined ||
        (typeof part.chunk === 'number' && Number.isInteger(part.chunk) && part.chunk >= 0)),
  )
}

/**
 * Strict check for sessions loaded from storage or imported from a backup.
 * The session reader assumes every required field is present and bounded, so a
 * corrupted record must be rejected before it reaches the UI.
 */
export function isSession(value: unknown): value is Session {
  if (!isRecord(value)) return false

  if (
    !isBoundedString(value.id, MAX_ID_LENGTH) ||
    !value.id.trim() ||
    !isBoundedString(value.sentence, MAX_LONG_TEXT_LENGTH) ||
    !value.sentence.trim() ||
    !isBoundedString(value.createdAt, 100) ||
    Number.isNaN(Date.parse(value.createdAt))
  ) {
    return false
  }

  if (
    !isBoundedString(value.reading, MAX_LONG_TEXT_LENGTH) ||
    !isBoundedString(value.natural, MAX_LONG_TEXT_LENGTH) ||
    !isBoundedString(value.raw, MAX_LONG_TEXT_LENGTH)
  ) {
    return false
  }

  if (
    !Array.isArray(value.sentenceNote) ||
    value.sentenceNote.length > MAX_SENTENCE_NOTE_ENTRIES ||
    !value.sentenceNote.every((note) => isBoundedString(note, MAX_TEXT_LENGTH))
  ) {
    return false
  }

  if (
    !Array.isArray(value.chunks) ||
    value.chunks.length === 0 ||
    value.chunks.length > MAX_CHUNKS_PER_SESSION ||
    !value.chunks.every(isChunk)
  ) {
    return false
  }

  const seen = new Set<number>()
  for (const chunk of value.chunks) {
    if (seen.has(chunk.n)) return false
    seen.add(chunk.n)
  }

  if (
    value.source !== undefined &&
    value.source !== 'sample' &&
    value.source !== 'manual' &&
    value.source !== 'ai'
  ) {
    return false
  }

  if (value.naturalParts !== undefined && !isNaturalParts(value.naturalParts)) {
    return false
  }

  return true
}

/**
 * Backups use the same strict shape as stored sessions. Keeping the named
 * export makes the import boundary explicit.
 */
export function isBackupSession(value: unknown): value is Session {
  return isSession(value)
}
