import { describe, expect, it } from 'vitest'
import type { Session } from './types'
import { sampleSession } from './sample'
import { sampleSessions } from './sessions'
import {
  BACKUP_APP,
  BACKUP_VERSION,
  BackupError,
  backupFilename,
  createBackup,
  mergeSessions,
  parseBackup,
  replaceSessions,
  serializeBackup,
} from './backup'

const now = new Date('2026-11-23T10:00:00.000Z')

describe('backup creation', () => {
  it('creates a versioned file with sessions only', () => {
    const file = createBackup(sampleSessions, now)

    expect(file.version).toBe(BACKUP_VERSION)
    expect(file.app).toBe(BACKUP_APP)
    expect(file.exportedAt).toBe(now.toISOString())
    expect(file.sessions).toHaveLength(3)
    expect(file.sessions[0].sentence).toBe(sampleSession.sentence)
  })

  it('does not copy unrelated session properties', () => {
    const sessionWithExtra = {
      ...sampleSession,
      apiKey: 'sk-should-not-export',
      preferences: { theme: 'dark' },
    } as unknown as Session

    const serialized = serializeBackup(createBackup([sessionWithExtra], now))

    expect(serialized).not.toContain('sk-should-not-export')
    expect(serialized).not.toContain('preferences')
  })

  it('builds a dated filename', () => {
    expect(backupFilename(now)).toBe('bunkai-sessions-2026-11-23.json')
  })
})

describe('backup parsing', () => {
  it('round-trips a created backup', () => {
    const original = createBackup(sampleSessions, now)
    const parsed = parseBackup(serializeBackup(original))

    expect(parsed).toEqual(original)
  })

  it('rejects invalid JSON', () => {
    expect(() => parseBackup('{')).toThrowError(BackupError)
  })

  it('rejects a different version', () => {
    const file = { ...createBackup([sampleSession], now), version: 2 }

    expect(() => parseBackup(JSON.stringify(file))).toThrowError(/different or newer version/)
  })

  it('rejects a different app', () => {
    const file = { ...createBackup([sampleSession], now), app: 'other' }

    expect(() => parseBackup(JSON.stringify(file))).toThrowError(/not a Bunkai backup/)
  })

  it('rejects an empty backup', () => {
    const file = { ...createBackup([], now), sessions: [] }

    expect(() => parseBackup(JSON.stringify(file))).toThrowError(/no sessions/)
  })

  it('rejects an incomplete session', () => {
    const file = createBackup([sampleSession], now)
    const broken = JSON.parse(JSON.stringify(file)) as {
      sessions: Array<{ chunks: Array<{ jp: unknown }> }>
    }
    broken.sessions[0].chunks[0].jp = 42

    expect(() => parseBackup(JSON.stringify(broken))).toThrowError(/incomplete/)
  })

  it('rejects malformed optional enrichment fields', () => {
    const file = createBackup([sampleSession], now)
    const broken = JSON.parse(JSON.stringify(file)) as {
      sessions: Array<{ chunks: Array<{ furigana: unknown }> }>
    }
    broken.sessions[0].chunks[1].furigana = 'not-a-list'

    expect(() => parseBackup(JSON.stringify(broken))).toThrowError(/incomplete/)
  })
})

describe('backup merge and replace', () => {
  it('merges new sessions and skips existing ids', () => {
    const duplicate = { ...sampleSession, id: 'sample' }
    const added = {
      ...sampleSession,
      id: 'imported',
      sentence: 'インポートした文です。',
    }

    const result = mergeSessions([sampleSession], [duplicate, added])

    expect(result.added).toBe(1)
    expect(result.skipped).toBe(1)
    expect(result.sessions.map((session) => session.id)).toEqual(['sample', 'imported'])
  })

  it('replaces the history and deduplicates the imported file', () => {
    const duplicate = { ...sampleSession, id: 'sample' }
    const added = {
      ...sampleSession,
      id: 'imported',
      sentence: 'インポートした文です。',
    }

    const result = replaceSessions([duplicate, added, { ...added }])

    expect(result.imported).toBe(2)
    expect(result.skipped).toBe(1)
    expect(result.sessions.map((session) => session.id)).toEqual(['sample', 'imported'])
  })
})
