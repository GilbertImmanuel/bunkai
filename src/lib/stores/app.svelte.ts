import type { FuriganaSettings, Session, Theme, TranslationMode, View } from '../data/types'
import { sampleSession } from '../data/sample'
import {
  type LayoutPreference,
  readFurigana,
  readLayout,
  readTheme,
  readTranslationMode,
  writeFurigana,
  writeLastSessionId,
  writeTheme,
  writeTranslationMode,
} from '../utils/persistence'

export interface AppState {
  view: View
  theme: Theme
  currentSession: Session
  selectedChunk: number
  noteOpen: boolean
  historyOpen: boolean
  translationMode: TranslationMode
  furigana: FuriganaSettings
}

const storedLayout = readLayout()
const defaultHistoryOpen = storedLayout
  ? storedLayout.history === 'open'
  : typeof window === 'undefined' || window.innerWidth >= 1280

export const appState = $state<AppState>({
  view: 'home',
  theme: readTheme() ?? 'light',
  currentSession: sampleSession,
  selectedChunk: 5,
  noteOpen: storedLayout ? storedLayout.note === 'open' : true,
  historyOpen: defaultHistoryOpen,
  translationMode: readTranslationMode() ?? 'raw',
  furigana: readFurigana() ?? { name: true, word: true },
})

export function setView(view: View): void {
  appState.view = view
}

export function goHome(): void {
  appState.view = 'home'
}

export function openSession(session: Session, chunk?: number): void {
  appState.currentSession = session
  appState.selectedChunk = chunk ?? Math.max(1, session.chunks.length - 1)
  appState.view = 'workspace'
  appState.noteOpen = typeof window === 'undefined' || window.innerWidth >= 1100
  writeLastSessionId(session.id)
}

export function updateCurrentSession(session: Session): void {
  appState.currentSession = session
}

export function toggleTheme(): void {
  appState.theme = appState.theme === 'light' ? 'dark' : 'light'
  writeTheme(appState.theme)
}

export function toggleHistory(): void {
  appState.historyOpen = !appState.historyOpen
}

export function openNote(): void {
  appState.noteOpen = true
}

export function closeNote(): void {
  appState.noteOpen = false
}

export function toggleNote(): void {
  appState.noteOpen = !appState.noteOpen
}

export function selectChunk(n: number): void {
  const count = appState.currentSession.chunks.length
  appState.selectedChunk = Math.max(1, Math.min(count, n))
}

export function chooseChunk(n: number, forceOpen = false): void {
  const count = appState.currentSession.chunks.length
  const next = Math.max(1, Math.min(count, n))

  if (next === appState.selectedChunk && !forceOpen) {
    appState.noteOpen = !appState.noteOpen
    return
  }

  appState.selectedChunk = next
  appState.noteOpen = true
}

export function setTranslationMode(mode: TranslationMode): void {
  appState.translationMode = mode
  writeTranslationMode(mode)
}

export function setFurigana(settings: FuriganaSettings): void {
  appState.furigana = settings
  writeFurigana(settings)
}

export function toggleFurigana(kind: 'name' | 'word'): void {
  setFurigana({
    ...appState.furigana,
    [kind]: !appState.furigana[kind],
  })
}

export function applyLayout(layout: LayoutPreference | null): void {
  if (!layout) return

  appState.historyOpen = layout.history === 'open'
  appState.noteOpen = layout.note === 'open'
}
