export interface JapaneseCheck {
  ok: boolean
  message: string
}

const JAPANESE_CHAR = /[\u3005\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/u
const JAPANESE_GLOBAL = /[\u3005\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/gu
const LATIN_GLOBAL = /[A-Za-z]/g
const KANA_ONLY = /^[\u3000-\u303f\u3040-\u30ff\s]+$/u
const REPEATED_NOISE = /(.)\1{4,}/u

function countMatches(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length ?? 0
}

export function containsJapanese(value: string): boolean {
  return JAPANESE_CHAR.test(value)
}

export function isMostlyJapanese(value: string): boolean {
  const text = value.trim()
  if (!text || !containsJapanese(text)) return false

  return countMatches(text, LATIN_GLOBAL) <= countMatches(text, JAPANESE_GLOBAL)
}

export function isKanaText(value: string): boolean {
  const text = value.trim()
  return Boolean(text) && KANA_ONLY.test(text)
}

export function normalizeJapaneseText(value: string): string {
  return value.replace(/[\s\u3000。．.!！?？、,，・「」『』（）()[\]{}]/gu, '')
}

export function chunksRebuildSentence(chunks: string[], sentence: string): boolean {
  return normalizeJapaneseText(chunks.join('')) === normalizeJapaneseText(sentence)
}

export function validateJapaneseSentence(value: string): JapaneseCheck {
  const text = value.trim()
  if (!text) return { ok: false, message: 'Enter a Japanese sentence.' }

  const japanese = countMatches(text, JAPANESE_GLOBAL)
  const latin = countMatches(text, LATIN_GLOBAL)

  if (japanese === 0) {
    return {
      ok: false,
      message: 'That does not look like Japanese. Paste a Japanese sentence.',
    }
  }

  if (latin > japanese) {
    return {
      ok: false,
      message: 'This is mostly English. Paste a Japanese sentence.',
    }
  }

  if (REPEATED_NOISE.test(text)) {
    return {
      ok: false,
      message: 'That looks like repeated characters, not a Japanese sentence.',
    }
  }

  return { ok: true, message: '' }
}
