export type ChunkColor = 1 | 2 | 3 | 4 | 5 | 6

export type TranslationMode = 'natural' | 'raw'

export type FuriganaKind = 'name' | 'word'

export interface FuriganaSettings {
  name: boolean
  word: boolean
}

export type Theme = 'light' | 'dark'

export type View = 'home' | 'workspace'

export type PanelState = 'open' | 'collapsed'

export interface ConstructionStep {
  jp: string
  en: string
}

export interface Example {
  jp: string
  en: string
  source?: 'ai' | 'tatoeba'
  id?: number
  url?: string
  author?: string
  license?: string
  audioUrl?: string
  audioAuthor?: string
  audioLicense?: string
}

export interface FuriganaSegment {
  text: string
  reading?: string
  kind?: FuriganaKind
}

export interface Chunk {
  n: number
  jp: string
  kana: string
  gloss: string
  role: string
  color: ChunkColor
  note: string
  construction: ConstructionStep[]
  examples: Example[]
  furigana?: FuriganaSegment[]
  lookup?: string
}

export type ReferenceSource = 'Cure Dolly' | 'Tae Kim'

export interface GrammarReference {
  source: ReferenceSource
  label: string
  detail: string
  url?: string
}

export interface TranslationPart {
  text: string
  chunk?: number
}

export interface Session {
  id: string
  sentence: string
  reading: string
  natural: string
  naturalParts?: TranslationPart[]
  raw: string
  chunks: Chunk[]
  sentenceNote: string[]
  createdAt: string
  source?: 'sample' | 'manual' | 'ai'
}

export interface HistoryItem {
  id: string
  preview: string
  time: string
  count: number
  colors: ChunkColor[]
  sessionId: string
}
