import type { Chunk, GrammarReference } from './types'

const CURE_DOLLY = {
  core: {
    source: 'Cure Dolly',
    label: 'Lesson 1 — The core sentence',
    detail: 'A-car, B-engine, three engines',
    url: 'https://www.youtube.com/watch?v=pSvH9vH60Ig',
  },
  topic: {
    source: 'Cure Dolly',
    label: 'Lesson 3 — The は particle',
    detail: 'Topic vs subject',
    url: 'https://www.youtube.com/watch?v=U9_T4eObNXg',
  },
  particles: {
    source: 'Cure Dolly',
    label: 'Lesson 47 — Breaking down sentences',
    detail: 'Particles point modifiers at their verb',
    url: 'https://www.youtube.com/watch?v=z9S2J8tlnUE',
  },
  clauses: {
    source: 'Cure Dolly',
    label: 'Lesson 34 — Understand any sentence',
    detail: 'Logical clause boundaries',
    url: 'https://www.youtube.com/watch?v=uot49Z85wNs',
  },
  wordOrder: {
    source: 'Cure Dolly',
    label: 'Lesson 46 — Word order matters',
    detail: 'Modifiers come before their head',
    url: 'https://www.youtube.com/watch?v=T5PD1lORiwk',
  },
  topicComment: {
    source: 'Cure Dolly',
    label: 'Lesson 60 — The other half',
    detail: 'Topic–comment and the invisible は',
    url: 'https://www.youtube.com/watch?v=_nXHpkTTfGs',
  },
  copula: {
    source: 'Cure Dolly',
    label: 'Lesson 79 — The copula',
    detail: 'だ / です and existence',
    url: 'https://www.youtube.com/watch?v=euHYPcMoao4',
  },
  zero: {
    source: 'Cure Dolly',
    label: 'Lesson 66 — Hidden subjects',
    detail: 'Zero pronouns and omitted subjects',
    url: 'https://www.youtube.com/watch?v=GN_tGX0W-LE',
  },
} satisfies Record<string, GrammarReference>

const TAE_KIM = {
  copula: {
    source: 'Tae Kim',
    label: '§3.2 — State-of-being: だ',
    detail: 'Basic Grammar, p. 29',
  },
  particles: {
    source: 'Tae Kim',
    label: '§3.3 — Particles: は, も, が',
    detail: 'Basic Grammar, p. 29',
  },
  adjectives: {
    source: 'Tae Kim',
    label: '§3.4 — Adjectives',
    detail: 'Basic Grammar, p. 29',
  },
  verbParticles: {
    source: 'Tae Kim',
    label: '§3.8 — Particles with verbs',
    detail: 'Basic Grammar, p. 29',
  },
  relativeClauses: {
    source: 'Tae Kim',
    label: '§3.10 — Relative clauses and sentence order',
    detail: 'Basic Grammar, p. 29',
  },
  nounParticles: {
    source: 'Tae Kim',
    label: '§3.11 — Noun-related particles',
    detail: 'Basic Grammar, p. 29',
  },
  compound: {
    source: 'Tae Kim',
    label: '§4.4 — Compound sentences',
    detail: 'Essential Grammar, p. 91',
  },
  teForm: {
    source: 'Tae Kim',
    label: '§4.5 — Other uses of the te-form',
    detail: 'Essential Grammar, p. 91',
  },
  potential: {
    source: 'Tae Kim',
    label: '§4.6 — Potential form',
    detail: 'Essential Grammar, p. 91',
  },
  naru: {
    source: 'Tae Kim',
    label: '§4.7 — なる and する',
    detail: 'Essential Grammar, p. 91',
  },
  conditionals: {
    source: 'Tae Kim',
    label: '§4.8 — Conditionals',
    detail: 'Essential Grammar, p. 91',
  },
  desire: {
    source: 'Tae Kim',
    label: '§4.10 — Desire and suggestions',
    detail: 'Essential Grammar, p. 91',
  },
  quotes: {
    source: 'Tae Kim',
    label: '§4.11 — Quotes',
    detail: 'Essential Grammar, p. 91',
  },
  attempt: {
    source: 'Tae Kim',
    label: '§4.13 — Try and attempt',
    detail: 'Essential Grammar, p. 91',
  },
  giving: {
    source: 'Tae Kim',
    label: '§4.14 — Giving and receiving',
    detail: 'Essential Grammar, p. 91',
  },
  passive: {
    source: 'Tae Kim',
    label: '§5.1 — Causative and passive verbs',
    detail: 'Special Expressions, p. 211',
  },
  shimau: {
    source: 'Tae Kim',
    label: '§5.3 — しまう',
    detail: 'Special Expressions, p. 211',
  },
  amounts: {
    source: 'Tae Kim',
    label: '§5.6 — Amounts',
    detail: 'Special Expressions, p. 211',
  },
  similarity: {
    source: 'Tae Kim',
    label: '§5.7 — Similarity and hearsay',
    detail: 'Special Expressions, p. 211',
  },
} satisfies Record<string, GrammarReference>

function addReferences(result: GrammarReference[], references: GrammarReference[]): void {
  for (const reference of references) {
    if (result.length >= 2) return
    if (result.some((item) => item.source === reference.source && item.label === reference.label)) {
      continue
    }
    result.push(reference)
  }
}

export function referencesForChunk(chunk: Chunk): GrammarReference[] {
  const jp = chunk.jp.trim()
  const role = chunk.role.trim().toLowerCase()

  const references: GrammarReference[] = []
  const isClause = /\b(clause|conditional|condition)\b/.test(role)
  const isPredicate = /\b(predicate|main verb|main predicate|verb|engine|copula)\b/.test(role)

  if (/\btopic\b/.test(role) || (/(は|も)$/.test(jp) && !isClause && !isPredicate)) {
    addReferences(references, [CURE_DOLLY.topic, TAE_KIM.particles])
  }

  if (role === 'subject' || role === 'a-car') {
    addReferences(references, [CURE_DOLLY.core, TAE_KIM.particles])
  }

  if (/(を)$/.test(jp) && !isClause) {
    addReferences(references, [CURE_DOLLY.particles, TAE_KIM.verbParticles])
  }

  if (/(に|で|へ)$/.test(jp) && !isClause && !isPredicate && !/\btopic\b/.test(role)) {
    addReferences(references, [CURE_DOLLY.particles, TAE_KIM.verbParticles])
  }

  if (!isClause && /(と)$/.test(jp)) {
    addReferences(references, [CURE_DOLLY.particles, TAE_KIM.nounParticles])
  }

  if (/\b(reason|cause)\b/.test(role) || (!isClause && /から$/.test(jp))) {
    addReferences(references, [CURE_DOLLY.clauses, TAE_KIM.compound])
  }

  if (/\b(conditional|condition)\b/.test(role)) {
    addReferences(references, [CURE_DOLLY.clauses, TAE_KIM.conditionals])
  }

  if (/\bquote|quotative\b/.test(role)) {
    addReferences(references, [TAE_KIM.quotes])
  }

  if (/\b(degree|cause|reason|clause)\b/.test(role) && /(あまり|ほど)/.test(jp)) {
    addReferences(references, [TAE_KIM.amounts, CURE_DOLLY.wordOrder])
  }

  if (/(てしま|でしま|ちゃっ|じゃっ)/.test(jp)) {
    addReferences(references, [TAE_KIM.shimau])
  }

  if (/(なる|なっ|なり)/.test(jp)) {
    addReferences(references, [TAE_KIM.naru])
  }

  if (/ようと(する|して|した)/.test(jp)) {
    addReferences(references, [TAE_KIM.attempt])
  }

  if (/(ようだ|ようです|そうだ|そうです|らしい)/.test(jp)) {
    addReferences(references, [TAE_KIM.similarity])
  }

  if (/(たい|たく|たかっ)/.test(jp)) {
    addReferences(references, [TAE_KIM.desire])
  }

  if (/(ている|でいる)/.test(jp)) {
    addReferences(references, [TAE_KIM.teForm])
  }

  if (/(だけ|しか|ばかり)/.test(jp)) {
    addReferences(references, [TAE_KIM.amounts])
  }

  if (/\b(passive|causative)\b/.test(`${role} ${chunk.note.toLowerCase()}`)) {
    addReferences(references, [TAE_KIM.passive])
  }

  if (/\b(potential)\b/.test(`${role} ${chunk.note.toLowerCase()}`)) {
    addReferences(references, [TAE_KIM.potential])
  }

  if (/て(あげ|くれ|もら)|で(あげ|くれ|もら)/.test(jp)) {
    addReferences(references, [TAE_KIM.giving])
  }

  if (/\b(relative|modifier)\b/.test(role) && /\bclause\b/.test(role)) {
    addReferences(references, [CURE_DOLLY.wordOrder, TAE_KIM.relativeClauses])
  }

  if (/(だ|です)$/.test(jp) && isPredicate) {
    addReferences(references, [TAE_KIM.copula, CURE_DOLLY.copula])
  }

  return references
}
