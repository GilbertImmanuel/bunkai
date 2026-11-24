import { describe, expect, it } from 'vitest'
import { parseNoteRows } from './note'

describe('parseNoteRows', () => {
  it('parses labeled note blocks in order', () => {
    expect(
      parseNoteRows([
        'Core: It was a tense situation.',
        'Structure: The clause modifies 緊迫した.',
        'Nuance: A riot was a real possibility.',
      ]),
    ).toEqual([
      { label: 'Core', text: 'It was a tense situation.' },
      { label: 'Structure', text: 'The clause modifies 緊迫した.' },
      { label: 'Nuance', text: 'A riot was a real possibility.' },
    ])
  })

  it('accepts legacy Topic labels, case differences, and bold markers', () => {
    expect(parseNoteRows(['topic: The topic is unspoken.', '**Core:** It was tense.'])).toEqual([
      { label: 'Topic', text: 'The topic is unspoken.' },
      { label: 'Core', text: 'It was tense.' },
    ])
  })

  it('preserves line breaks inside a block', () => {
    expect(parseNoteRows(['Structure: First line.\nSecond line.'])).toEqual([
      { label: 'Structure', text: 'First line.\nSecond line.' },
    ])
  })

  it('returns null for unlabeled or mixed prose', () => {
    expect(parseNoteRows(['The topic is unspoken.'])).toBeNull()
    expect(parseNoteRows(['Core: It was tense.', 'An unlabeled paragraph.'])).toBeNull()
  })

  it('returns null for empty notes', () => {
    expect(parseNoteRows([])).toBeNull()
    expect(parseNoteRows(['Core:   '])).toBeNull()
  })
})
