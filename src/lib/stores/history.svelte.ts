/* eslint-disable svelte/prefer-svelte-reactivity -- dates here are local clock values, not reactive state */
import type { Session } from '../data/types'
import { sampleSessions } from '../data/sessions'
import { applyLayout, openSession } from './app.svelte'
import {
  clearLastSessionId,
  readLastSessionId,
  readLayout,
  readSessions,
  writeLastSessionId,
  writeSessions,
} from '../utils/persistence'

export interface HistoryState {
  sessions: Session[]
  loaded: boolean
  storageWarning: string | null
}

export interface SaveSessionResult {
  persisted: boolean
  added: boolean
}

export const historyState = $state<HistoryState>({
  sessions: [],
  loaded: false,
  storageWarning: null,
})

let initialized = false
let undoSessionId: string | null = null
let previousLastSessionId: string | null = null

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== 'object') return false

  const session = value as Partial<Session>
  return (
    typeof session.id === 'string' &&
    typeof session.sentence === 'string' &&
    typeof session.createdAt === 'string' &&
    Array.isArray(session.chunks) &&
    session.chunks.length > 0
  )
}

function sortSessions(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

const seedById = new Map(sampleSessions.map((session) => [session.id, session]))

function withSeedEnhancements(session: Session): Session {
  const seed = seedById.get(session.id)
  if (!seed) return session

  const naturalParts = session.naturalParts?.length ? session.naturalParts : seed.naturalParts
  const furiganaByChunk = new Map(seed.chunks.map((chunk) => [chunk.n, chunk.furigana]))

  let changed = false
  const chunks = session.chunks.map((chunk) => {
    if (chunk.furigana?.length) return chunk

    const furigana = furiganaByChunk.get(chunk.n)
    if (!furigana?.length) return chunk

    changed = true
    return { ...chunk, furigana }
  })

  if (!changed && naturalParts === session.naturalParts) return session

  return {
    ...session,
    ...(naturalParts ? { naturalParts } : {}),
    chunks,
  }
}

function snapshotSessions(sessions: Session[]): Session[] {
  return $state.snapshot(sessions) as Session[]
}

export function createSeedSessions(now: Date = new Date()): Session[] {
  const [sample, sessionA, sessionB] = sampleSessions
  const twoHoursAgo = new Date(now.getTime() - 2 * 3_600_000)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  return [
    { ...sample, createdAt: now.toISOString() },
    { ...sessionA, createdAt: twoHoursAgo.toISOString() },
    { ...sessionB, createdAt: yesterday.toISOString() },
  ]
}

function restoreLastSession(): void {
  const lastSessionId = readLastSessionId()
  if (!lastSessionId) return

  const session = historyState.sessions.find((item) => item.id === lastSessionId)
  if (!session) return

  const layout = readLayout()
  openSession(session)
  applyLayout(layout)
}

export async function initializeHistory(): Promise<void> {
  if (initialized) return
  initialized = true

  try {
    const stored = await readSessions()

    if (stored === undefined) {
      const seeded = createSeedSessions()
      historyState.sessions = seeded
      await writeSessions(seeded)
    } else if (Array.isArray(stored)) {
      historyState.sessions = sortSessions(stored.filter(isSession).map(withSeedEnhancements))
    } else {
      const seeded = createSeedSessions()
      historyState.sessions = seeded
      await writeSessions(seeded)
    }

    historyState.storageWarning = null
  } catch {
    historyState.sessions = createSeedSessions()
    historyState.storageWarning =
      'History is available for this tab only. IndexedDB could not be opened.'
  } finally {
    historyState.loaded = true
  }

  restoreLastSession()
}

export async function saveSession(session: Session): Promise<SaveSessionResult> {
  if (historyState.sessions.some((item) => item.id === session.id)) {
    return { persisted: true, added: false }
  }

  const saved: Session = {
    ...($state.snapshot(session) as Session),
    createdAt: new Date().toISOString(),
  }
  const currentLastSessionId = readLastSessionId()
  previousLastSessionId = currentLastSessionId === saved.id ? null : currentLastSessionId
  undoSessionId = saved.id

  historyState.sessions = sortSessions([saved, ...historyState.sessions])
  writeLastSessionId(saved.id)

  let persisted = true
  try {
    await writeSessions(snapshotSessions(historyState.sessions))
    historyState.storageWarning = null
  } catch {
    persisted = false
    historyState.storageWarning =
      'History is available for this tab only. IndexedDB could not be written.'
  }

  return { persisted, added: true }
}

export async function updateSession(session: Session): Promise<boolean> {
  if (!historyState.sessions.some((item) => item.id === session.id)) return false

  historyState.sessions = historyState.sessions.map((item) =>
    item.id === session.id ? ($state.snapshot(session) as Session) : item,
  )

  try {
    await writeSessions(snapshotSessions(historyState.sessions))
    historyState.storageWarning = null
    return true
  } catch {
    historyState.storageWarning =
      'History is available for this tab only. IndexedDB could not be written.'
    return false
  }
}

export async function undoLastSave(): Promise<void> {
  if (!undoSessionId) return

  const removedId = undoSessionId
  undoSessionId = null

  historyState.sessions = historyState.sessions.filter((session) => session.id !== removedId)

  if (previousLastSessionId) {
    writeLastSessionId(previousLastSessionId)
  } else {
    clearLastSessionId()
  }
  previousLastSessionId = null

  try {
    await writeSessions(snapshotSessions(historyState.sessions))
  } catch {
    historyState.storageWarning =
      'History is available for this tab only. IndexedDB could not be written.'
  }
}
