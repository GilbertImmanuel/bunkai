import { get, set } from 'idb-keyval'
import type { FuriganaSettings, PanelState, Session, Theme, TranslationMode } from '../data/types'

export const STORAGE_KEYS = {
  theme: 'bunkai.theme',
  layout: 'bunkai.layout',
  translation: 'bunkai.translation',
  furigana: 'bunkai.furigana',
  lastSession: 'bunkai.lastSession',
  sessions: 'bunkai.sessions',
} as const

export interface LayoutPreference {
  history: PanelState
  note: PanelState
}

function hasLocalStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

function readString(key: string): string | null {
  if (!hasLocalStorage()) return null

  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeString(key: string, value: string): void {
  if (!hasLocalStorage()) return

  try {
    localStorage.setItem(key, value)
  } catch {
    // Preferences are best-effort; the app still works without them.
  }
}

function removeString(key: string): void {
  if (!hasLocalStorage()) return

  try {
    localStorage.removeItem(key)
  } catch {
    // Preferences are best-effort.
  }
}

function isPanelState(value: unknown): value is PanelState {
  return value === 'open' || value === 'collapsed'
}

export function readTheme(): Theme | null {
  const value = readString(STORAGE_KEYS.theme)
  return value === 'light' || value === 'dark' ? value : null
}

export function writeTheme(theme: Theme): void {
  writeString(STORAGE_KEYS.theme, theme)
}

export function readTranslationMode(): TranslationMode | null {
  const value = readString(STORAGE_KEYS.translation)
  return value === 'natural' || value === 'raw' ? value : null
}

export function writeTranslationMode(mode: TranslationMode): void {
  writeString(STORAGE_KEYS.translation, mode)
}

export function readFurigana(): FuriganaSettings | null {
  const value = readString(STORAGE_KEYS.furigana)
  if (!value) return null

  if (value === 'none') return { name: false, word: false }
  if (value === 'name') return { name: true, word: false }
  if (value === 'word') return { name: false, word: true }
  if (value === 'all') return { name: true, word: true }

  try {
    const parsed = JSON.parse(value) as Partial<FuriganaSettings>
    if (typeof parsed.name === 'boolean' && typeof parsed.word === 'boolean') {
      return { name: parsed.name, word: parsed.word }
    }
  } catch {
    // Invalid preference falls back to defaults.
  }

  return null
}

export function writeFurigana(settings: FuriganaSettings): void {
  writeString(STORAGE_KEYS.furigana, JSON.stringify(settings))
}

export function readLayout(): LayoutPreference | null {
  const value = readString(STORAGE_KEYS.layout)
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as Partial<LayoutPreference>
    if (isPanelState(parsed.history) && isPanelState(parsed.note)) {
      return { history: parsed.history, note: parsed.note }
    }
  } catch {
    // Invalid preference shape falls back to defaults.
  }

  return null
}

export function writeLayout(layout: LayoutPreference): void {
  writeString(STORAGE_KEYS.layout, JSON.stringify(layout))
}

export function readLastSessionId(): string | null {
  return readString(STORAGE_KEYS.lastSession)
}

export function writeLastSessionId(id: string): void {
  writeString(STORAGE_KEYS.lastSession, id)
}

export function clearLastSessionId(): void {
  removeString(STORAGE_KEYS.lastSession)
}

export async function readSessions(): Promise<Session[] | undefined> {
  return get<Session[]>(STORAGE_KEYS.sessions)
}

export async function writeSessions(sessions: Session[]): Promise<void> {
  await set(STORAGE_KEYS.sessions, sessions)
}
