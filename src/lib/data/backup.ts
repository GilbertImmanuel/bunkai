import type {
  Chunk,
  ConstructionStep,
  Example,
  FuriganaSegment,
  Session,
  TranslationPart,
} from './types'
import { isBackupSession } from './sessionValidation'

export const BACKUP_VERSION = 1
export const BACKUP_APP = 'bunkai'
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024
export const MAX_BACKUP_SESSIONS = 10_000

export interface BackupFile {
  version: typeof BACKUP_VERSION
  app: typeof BACKUP_APP
  exportedAt: string
  sessions: Session[]
}

export type BackupErrorKind = 'format' | 'version' | 'empty' | 'too-large' | 'too-many'

export class BackupError extends Error {
  constructor(
    public readonly kind: BackupErrorKind,
    message: string,
  ) {
    super(message)
    this.name = 'BackupError'
  }
}

function copyConstructionStep(step: ConstructionStep): ConstructionStep {
  return { jp: step.jp, en: step.en }
}

function copyExample(example: Example): Example {
  return {
    jp: example.jp,
    en: example.en,
    ...(example.source ? { source: example.source } : {}),
    ...(example.id !== undefined ? { id: example.id } : {}),
    ...(example.url ? { url: example.url } : {}),
    ...(example.author ? { author: example.author } : {}),
    ...(example.license ? { license: example.license } : {}),
    ...(example.audioUrl ? { audioUrl: example.audioUrl } : {}),
    ...(example.audioAuthor ? { audioAuthor: example.audioAuthor } : {}),
    ...(example.audioLicense ? { audioLicense: example.audioLicense } : {}),
  }
}

function copyFurigana(segment: FuriganaSegment): FuriganaSegment {
  return {
    text: segment.text,
    ...(segment.reading ? { reading: segment.reading } : {}),
    ...(segment.kind ? { kind: segment.kind } : {}),
  }
}

function copyChunk(chunk: Chunk): Chunk {
  return {
    n: chunk.n,
    jp: chunk.jp,
    kana: chunk.kana,
    gloss: chunk.gloss,
    role: chunk.role,
    color: chunk.color,
    note: chunk.note,
    construction: chunk.construction.map(copyConstructionStep),
    examples: chunk.examples.map(copyExample),
    ...(chunk.furigana ? { furigana: chunk.furigana.map(copyFurigana) } : {}),
    ...(chunk.lookup ? { lookup: chunk.lookup } : {}),
  }
}

function copyTranslationPart(part: TranslationPart): TranslationPart {
  return {
    text: part.text,
    ...(part.chunk ? { chunk: part.chunk } : {}),
  }
}

function copySession(session: Session): Session {
  return {
    id: session.id,
    sentence: session.sentence,
    reading: session.reading,
    natural: session.natural,
    ...(session.naturalParts
      ? { naturalParts: session.naturalParts.map(copyTranslationPart) }
      : {}),
    raw: session.raw,
    chunks: session.chunks.map(copyChunk),
    sentenceNote: [...session.sentenceNote],
    createdAt: session.createdAt,
    ...(session.source ? { source: session.source } : {}),
  }
}

export function createBackup(sessions: Session[], now = new Date()): BackupFile {
  return {
    version: BACKUP_VERSION,
    app: BACKUP_APP,
    exportedAt: now.toISOString(),
    sessions: sessions.map(copySession),
  }
}

export function serializeBackup(file: BackupFile): string {
  return JSON.stringify(file, null, 2)
}

export function backupFilename(now = new Date()): string {
  return `bunkai-sessions-${now.toISOString().slice(0, 10)}.json`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

export function parseBackup(text: string): BackupFile {
  if (text.length > MAX_BACKUP_BYTES) {
    throw new BackupError('too-large', 'This backup is too large to import.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new BackupError('format', 'This file is not valid JSON.')
  }

  if (!isRecord(parsed)) {
    throw new BackupError('format', 'This file is not a Bunkai backup.')
  }

  if (parsed.version !== BACKUP_VERSION) {
    throw new BackupError(
      'version',
      'This backup was created by a different or newer version of the app.',
    )
  }

  if (parsed.app !== BACKUP_APP) {
    throw new BackupError('format', 'This file is not a Bunkai backup.')
  }

  if (typeof parsed.exportedAt !== 'string' || !Array.isArray(parsed.sessions)) {
    throw new BackupError('format', 'This backup is missing its session list.')
  }

  if (parsed.sessions.length === 0) {
    throw new BackupError('empty', 'This backup has no sessions.')
  }

  if (parsed.sessions.length > MAX_BACKUP_SESSIONS) {
    throw new BackupError('too-many', 'This backup has too many sessions.')
  }

  if (!parsed.sessions.every(isBackupSession)) {
    throw new BackupError('format', 'One or more sessions in this backup are incomplete.')
  }

  return {
    version: BACKUP_VERSION,
    app: BACKUP_APP,
    exportedAt: parsed.exportedAt,
    sessions: parsed.sessions,
  }
}

export interface MergeSessionsResult {
  sessions: Session[]
  added: number
  skipped: number
}

export function mergeSessions(existing: Session[], imported: Session[]): MergeSessionsResult {
  const seen = new Set(existing.map((session) => session.id))
  const additions: Session[] = []
  let skipped = 0

  for (const session of imported) {
    if (seen.has(session.id)) {
      skipped += 1
      continue
    }

    seen.add(session.id)
    additions.push(session)
  }

  return {
    sessions: [...existing, ...additions],
    added: additions.length,
    skipped,
  }
}

export interface ReplaceSessionsResult {
  sessions: Session[]
  imported: number
  skipped: number
}

export function replaceSessions(imported: Session[]): ReplaceSessionsResult {
  const seen = new Set<string>()
  const sessions: Session[] = []
  let skipped = 0

  for (const session of imported) {
    if (seen.has(session.id)) {
      skipped += 1
      continue
    }

    seen.add(session.id)
    sessions.push(session)
  }

  return { sessions, imported: sessions.length, skipped }
}
