import type { Session } from './types'

export const sampleSession = {
  id: 'sample',
  sentence: 'ただ 心が動いたときに それを誰かと共有したくなっただけ',
  reading: 'ただ・こころが・うごいたときに・それを・だれかと・きょうゆうしたくなっただけ',
  natural: 'I just felt like sharing it with someone when it moved me — that’s all.',
  naturalParts: [
    { text: 'I ' },
    { text: 'just ', chunk: 1 },
    { text: 'felt like sharing ', chunk: 5 },
    { text: 'it ', chunk: 3 },
    { text: 'with someone ', chunk: 4 },
    { text: 'when it moved me ', chunk: 2 },
    { text: '— that’s all.', chunk: 6 },
  ],
  raw: 'just | when (my) heart moved | it | with someone | came to want to share | only',
  sentenceNote: [
    'The topic is unspoken; the whole sentence pivots on one comment — the verb 共有したくなった.',
    '心が動いたときに is a time clause marking the moment the feeling arose; それを and 誰かと modify that verb.',
    'だけ caps the statement and ただ reinforces it — together they frame everything as “just … only, nothing more.”',
  ],
  createdAt: '2026-11-02T09:00:00.000Z',
  source: 'sample',
  chunks: [
    {
      n: 1,
      jp: 'ただ',
      kana: 'ただ',
      gloss: 'just',
      role: 'adverb',
      color: 1,
      note: 'ただ sets up “just / only” and pairs with だけ at the end of the sentence.',
      construction: [{ jp: 'ただ', en: 'adverb — just' }],
      examples: [
        {
          jp: 'ただそれを伝えたかっただけ。',
          en: 'I just wanted to tell you that — nothing more.',
        },
      ],
      lookup: 'ただ',
    },
    {
      n: 2,
      jp: '心が動いたときに',
      kana: 'こころが・うごいた・ときに',
      gloss: 'when (my) heart moved',
      role: 'time clause',
      color: 2,
      note: '〜ときに means “when”. The clause 心が動いた names the moment the wanting arose.',
      construction: [
        { jp: '心が + 動いた', en: 'heart moved' },
        { jp: '+ ときに', en: 'when …' },
      ],
      examples: [
        {
          jp: '音楽を聞いたときに泣きそうになった。',
          en: 'I almost cried when I heard the music.',
        },
      ],
      lookup: '動いた',
      furigana: [
        { text: '心', reading: 'こころ', kind: 'word' },
        { text: 'が' },
        { text: '動', reading: 'うご', kind: 'word' },
        { text: 'いたときに' },
      ],
    },
    {
      n: 3,
      jp: 'それを',
      kana: 'それを',
      gloss: 'it',
      role: 'object',
      color: 3,
      note: 'それ = “it / that”; を marks it as the direct object of 共有したい.',
      construction: [{ jp: 'それ + を', en: 'it (object)' }],
      examples: [
        {
          jp: 'それを聞いて安心した。',
          en: 'I was relieved to hear that.',
        },
      ],
      lookup: 'それ',
    },
    {
      n: 4,
      jp: '誰かと',
      kana: 'だれかと',
      gloss: 'with someone',
      role: 'accompaniment',
      color: 4,
      note: '誰か = “someone”; と = “with”. An unspecified companion.',
      construction: [{ jp: '誰か + と', en: 'with someone' }],
      examples: [
        {
          jp: '誰かと話したい気分だ。',
          en: 'I feel like talking with someone.',
        },
      ],
      lookup: '誰か',
      furigana: [{ text: '誰', reading: 'だれ', kind: 'word' }, { text: 'かと' }],
    },
    {
      n: 5,
      jp: '共有したくなった',
      kana: 'きょうゆうしたくなった',
      gloss: 'came to want to share',
      role: 'main verb',
      color: 5,
      note: '〜たくなった = “came to want to”. Desire presented as a change that arose at that moment.',
      construction: [
        { jp: '共有する', en: 'to share' },
        { jp: '共有し + たく', en: 'want to share' },
        { jp: '+ なる', en: 'come to' },
        { jp: '共有したくなった', en: 'came to want to share' },
      ],
      examples: [
        {
          jp: '急に甘いものが食べたくなった。',
          en: 'I suddenly wanted something sweet.',
        },
        {
          jp: '彼に会いたくなった。',
          en: 'I came to want to see him.',
        },
        {
          jp: 'もっと日本語を勉強したくなった。',
          en: 'I came to want to study Japanese more.',
        },
      ],
      lookup: '共有',
      furigana: [{ text: '共有', reading: 'きょうゆう', kind: 'word' }, { text: 'したくなった' }],
    },
    {
      n: 6,
      jp: 'だけ',
      kana: 'だけ',
      gloss: 'only',
      role: 'particle',
      color: 6,
      note: 'だけ caps the statement: “that’s all”. With ただ it frames the whole sentence as “just … only”.',
      construction: [{ jp: 'だけ', en: 'limiting particle — only' }],
      examples: [
        {
          jp: 'これだけあれば十分だ。',
          en: 'This much is enough.',
        },
      ],
      lookup: 'だけ',
    },
  ],
} satisfies Session
