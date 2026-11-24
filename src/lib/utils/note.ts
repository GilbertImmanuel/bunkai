export interface NoteRow {
  label: string
  text: string
}

const NOTE_LABEL = /^\s*\*{0,2}(Core|Structure|Nuance|Topic)\*{0,2}\s*:\s*\*{0,2}([\s\S]+)$/i

/**
 * Parses the app's labeled sentence-note strings. Returns null when any note
 * is unlabeled so older sessions keep their plain-prose fallback.
 */
export function parseNoteRows(notes: string[]): NoteRow[] | null {
  if (notes.length === 0) return null

  const rows: NoteRow[] = []
  for (const note of notes) {
    const match = NOTE_LABEL.exec(note.trim())
    if (!match) return null

    const text = match[2].trim()
    if (!text) return null

    const label = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase()
    rows.push({ label, text })
  }

  return rows
}
