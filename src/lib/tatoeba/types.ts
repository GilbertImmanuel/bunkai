export interface TatoebaAudio {
  id: number
  author?: string | null
  license?: string | null
  download_url?: string
  attribution_url?: string
}

export interface TatoebaTranslation {
  id: number
  text: string
  lang: string
  license?: string | null
  owner?: string | null
  is_unapproved?: boolean
  is_direct?: boolean
}

export interface TatoebaSentence {
  id: number
  text: string
  lang: string
  license?: string | null
  owner?: string | null
  is_unapproved?: boolean
  audios?: TatoebaAudio[]
  translations?: TatoebaTranslation[]
}

export interface TatoebaResponse {
  data: TatoebaSentence[]
  paging?: {
    total: number
    has_next: boolean
    next?: string | null
  }
}

export type TatoebaErrorKind = 'network' | 'timeout' | 'http' | 'format' | 'aborted'

export class TatoebaError extends Error {
  constructor(
    public readonly kind: TatoebaErrorKind,
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'TatoebaError'
  }
}
