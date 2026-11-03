import type { ChunkColor, HistoryItem, Session } from '../data/types'

export type HistoryGroup = 'Today' | 'Yesterday' | 'Earlier'

export interface HistoryEntry extends HistoryItem {
  group: HistoryGroup
  session: Session
}

const GROUP_ORDER: HistoryGroup[] = ['Today', 'Yesterday', 'Earlier']

const DAY_MS = 86_400_000

function startOfDayTimestamp(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

export function groupForDate(iso: string, now: Date = new Date()): HistoryGroup {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Earlier'

  const dayDiff = Math.round((startOfDayTimestamp(now) - startOfDayTimestamp(date)) / DAY_MS)
  if (dayDiff <= 0) return 'Today'
  if (dayDiff === 1) return 'Yesterday'
  return 'Earlier'
}

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const diff = now.getTime() - date.getTime()
  if (diff < 60_000) return 'Now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`

  if (groupForDate(iso, now) === 'Today') {
    return `${Math.floor(diff / 3_600_000)}h ago`
  }

  if (groupForDate(iso, now) === 'Yesterday') return 'Yesterday'

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function historyPreview(sentence: string): string {
  return sentence.replace(/\s+/g, ' ').trim()
}

export function historyColors(chunks: Session['chunks']): ChunkColor[] {
  return [...new Set(chunks.map((chunk) => chunk.color))].slice(0, 3)
}

export function buildHistoryEntries(sessions: Session[], now: Date = new Date()): HistoryEntry[] {
  return [...sessions]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((session) => ({
      id: session.id,
      preview: historyPreview(session.sentence),
      time: formatRelativeTime(session.createdAt, now),
      count: session.chunks.length,
      colors: historyColors(session.chunks),
      sessionId: session.id,
      group: groupForDate(session.createdAt, now),
      session,
    }))
}

export function filterHistoryEntries(entries: HistoryEntry[], query: string): HistoryEntry[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return entries

  return entries.filter(
    (entry) =>
      entry.session.sentence.toLowerCase().includes(needle) ||
      entry.preview.toLowerCase().includes(needle),
  )
}

export function groupHistoryEntries(
  entries: HistoryEntry[],
): Array<{ group: HistoryGroup; items: HistoryEntry[] }> {
  return GROUP_ORDER.map((group) => ({
    group,
    items: entries.filter((entry) => entry.group === group),
  })).filter((group) => group.items.length > 0)
}
