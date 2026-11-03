import { describe, expect, it } from 'vitest'
import { sessionA, sessionB } from '../data/sessions'
import { sampleSession } from '../data/sample'
import {
  buildHistoryEntries,
  filterHistoryEntries,
  formatRelativeTime,
  groupForDate,
  groupHistoryEntries,
  historyColors,
  historyPreview,
} from './history'

const now = new Date(2026, 10, 3, 12, 0, 0)

const todaySession = {
  ...sampleSession,
  id: 'today',
  createdAt: new Date(2026, 10, 3, 10, 0, 0).toISOString(),
}

const yesterdaySession = {
  ...sessionA,
  id: 'yesterday',
  createdAt: new Date(2026, 10, 2, 12, 0, 0).toISOString(),
}

const earlierSession = {
  ...sessionB,
  id: 'earlier',
  createdAt: new Date(2026, 9, 30, 12, 0, 0).toISOString(),
}

const sessions = [yesterdaySession, earlierSession, todaySession]

describe('history helpers', () => {
  it('builds sorted entries with groups, times, counts, and strips', () => {
    const entries = buildHistoryEntries(sessions, now)

    expect(entries.map((entry) => entry.id)).toEqual(['today', 'yesterday', 'earlier'])
    expect(entries.map((entry) => entry.group)).toEqual(['Today', 'Yesterday', 'Earlier'])
    expect(entries.map((entry) => entry.time)).toEqual(['2h ago', 'Yesterday', 'Oct 30'])
    expect(entries.map((entry) => entry.count)).toEqual([6, 5, 3])
    expect(entries.map((entry) => entry.colors)).toEqual([
      [1, 2, 3],
      [1, 2, 3],
      [4, 5, 6],
    ])
  })

  it('groups and filters history entries', () => {
    const entries = buildHistoryEntries(sessions, now)
    const groups = groupHistoryEntries(entries)

    expect(groups.map((group) => group.group)).toEqual(['Today', 'Yesterday', 'Earlier'])
    expect(groups.map((group) => group.items.length)).toEqual([1, 1, 1])

    const filtered = filterHistoryEntries(entries, '居心地')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('earlier')
    expect(filterHistoryEntries(entries, '')).toHaveLength(3)
  })

  it('formats dates and previews consistently', () => {
    expect(formatRelativeTime(new Date(2026, 10, 3, 11, 59, 0).toISOString(), now)).toBe('1m ago')
    expect(groupForDate(new Date(2026, 10, 3, 0, 1, 0).toISOString(), now)).toBe('Today')
    expect(groupForDate(new Date(2026, 10, 2, 23, 59, 0).toISOString(), now)).toBe('Yesterday')
    expect(historyPreview('  a\n b  ')).toBe('a b')
    expect(historyColors(sessionB.chunks)).toEqual([4, 5, 6])
  })
})
