import type { Session } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Lenient check for sessions already stored by the app. Older sessions may be
 * missing optional enrichment fields; they should still load.
 */
export function isSession(value: unknown): value is Session {
  if (!isRecord(value)) return false

  return (
    isString(value.id) &&
    isString(value.sentence) &&
    isString(value.createdAt) &&
    Array.isArray(value.chunks) &&
    value.chunks.length > 0
  )
}

function isConstructionStep(value: unknown): boolean {
  return isRecord(value) && isString(value.jp) && isString(value.en)
}

function isExample(value: unknown): boolean {
  return isRecord(value) && isString(value.jp) && isString(value.en)
}

function isFurigana(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value.text) &&
    (value.reading === undefined || isString(value.reading)) &&
    (value.kind === undefined || value.kind === 'name' || value.kind === 'word')
  )
}

function isChunk(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (!isString(value.jp) || !isString(value.kana) || !isString(value.gloss)) return false
  if (!isString(value.role) || !isString(value.note)) return false
  if (typeof value.n !== 'number') return false
  if (typeof value.color !== 'number' || value.color < 1 || value.color > 6) return false
  if (!Array.isArray(value.construction) || !value.construction.every(isConstructionStep)) {
    return false
  }
  if (!Array.isArray(value.examples) || !value.examples.every(isExample)) return false
  if (value.furigana !== undefined) {
    if (!Array.isArray(value.furigana) || !value.furigana.every(isFurigana)) return false
  }
  if (value.lookup !== undefined && !isString(value.lookup)) return false
  return true
}

/**
 * Strict check for imported backup sessions. A malformed backup should be
 * rejected before it can put an invalid chunk into the reader.
 */
export function isBackupSession(value: unknown): value is Session {
  if (!isSession(value)) return false
  if (!isRecord(value)) return false
  if (!isString(value.reading)) return false
  if (!isString(value.natural) || !isString(value.raw)) return false
  if (!Array.isArray(value.sentenceNote) || !value.sentenceNote.every(isString)) return false
  if (value.naturalParts !== undefined) {
    if (
      !Array.isArray(value.naturalParts) ||
      !value.naturalParts.every(
        (part) =>
          isRecord(part) &&
          isString(part.text) &&
          (part.chunk === undefined || typeof part.chunk === 'number'),
      )
    ) {
      return false
    }
  }
  return value.chunks.every(isChunk)
}
