import type { Session } from './types'
import { sampleSession } from './sample'

export const sessionA = {
  id: 's-a',
  sentence: '前から３番目の車両に乗ると一番効率がいい',
  reading: 'まえから・さんばんめの・しゃりょうに・のると・いちばん・こうりつがいい',
  natural: 'Riding in the third car from the front is the most efficient.',
  naturalParts: [
    { text: 'Riding ', chunk: 3 },
    { text: 'in the third car ', chunk: 2 },
    { text: 'from the front ', chunk: 1 },
    { text: 'is ' },
    { text: 'the most ', chunk: 4 },
    { text: 'efficient.', chunk: 5 },
  ],
  raw: 'from the front | in the third car | when you ride | the most | it’s efficient',
  sentenceNote: [
    'Core: Riding in the third car from the front is the most efficient.',
    'Structure: 前から３番目の車両に sets the location; 乗ると makes it a general condition; 一番 marks the superlative.',
    'Nuance: 効率がいい is a plain judgement of efficiency, not a comparison with another train.',
  ],
  createdAt: '2026-11-02T07:00:00.000Z',
  source: 'sample',
  chunks: [
    {
      n: 1,
      jp: '前から',
      kana: 'まえから',
      gloss: 'from the front',
      role: 'adverb',
      color: 1,
      note: '前 = “front”; から = “from”. Sets the starting point.',
      construction: [{ jp: '前 + から', en: 'from the front' }],
      examples: [
        {
          jp: '前から順に並んでください。',
          en: 'Please line up in order from the front.',
        },
      ],
      lookup: '前',
      furigana: [{ text: '前', reading: 'まえ', kind: 'word' }, { text: 'から' }],
    },
    {
      n: 2,
      jp: '３番目の車両に',
      kana: 'さんばんめの・しゃりょうに',
      gloss: 'in the third car',
      role: 'location',
      color: 2,
      note: '３番目 = “third”; 車両 = “car (of a train)”; に marks the location.',
      construction: [{ jp: '３番目 + の + 車両 + に', en: 'in the third car' }],
      examples: [
        {
          jp: '３番目の駅で降ります。',
          en: 'I’ll get off at the third station.',
        },
      ],
      lookup: '車両',
      furigana: [
        { text: '３番目', reading: 'さんばんめ', kind: 'word' },
        { text: 'の' },
        { text: '車両', reading: 'しゃりょう', kind: 'word' },
        { text: 'に' },
      ],
    },
    {
      n: 3,
      jp: '乗ると',
      kana: 'のると',
      gloss: 'when you ride',
      role: 'conditional',
      color: 3,
      note: '〜と = “whenever / if”. Describes a general result.',
      construction: [{ jp: '乗る + と', en: 'if/when you ride' }],
      examples: [
        {
          jp: 'この電車に乗ると、すぐ着く。',
          en: 'If you take this train, you’ll arrive quickly.',
        },
      ],
      lookup: '乗る',
      furigana: [{ text: '乗', reading: 'の', kind: 'word' }, { text: 'ると' }],
    },
    {
      n: 4,
      jp: '一番',
      kana: 'いちばん',
      gloss: 'the most',
      role: 'degree',
      color: 4,
      note: '一番 marks a superlative: “the most”.',
      construction: [{ jp: '一番', en: 'adverb — most' }],
      examples: [
        {
          jp: '一番好きな季節は秋だ。',
          en: 'My favorite season is autumn.',
        },
      ],
      lookup: '一番',
      furigana: [{ text: '一番', reading: 'いちばん', kind: 'word' }],
    },
    {
      n: 5,
      jp: '効率がいい',
      kana: 'こうりつがいい',
      gloss: 'it’s efficient',
      role: 'predicate',
      color: 5,
      note: '効率がいい = “efficient”; が marks the subject of the description.',
      construction: [{ jp: '効率 + が + いい', en: 'efficient' }],
      examples: [
        {
          jp: 'このやり方が一番効率がいい。',
          en: 'This way is the most efficient.',
        },
      ],
      lookup: '効率',
      furigana: [{ text: '効率', reading: 'こうりつ', kind: 'word' }, { text: 'がいい' }],
    },
  ],
} satisfies Session

export const sessionB = {
  id: 's-b',
  sentence: 'ものすごく居心地が悪そう',
  reading: 'ものすごく・いごこちが・わるそう',
  natural: 'It looks awfully uncomfortable.',
  naturalParts: [
    { text: 'It looks ', chunk: 3 },
    { text: 'awfully ', chunk: 1 },
    { text: 'uncomfortable.', chunk: 2 },
  ],
  raw: 'awfully | the comfort | seems bad',
  sentenceNote: [
    'Core: It looks awfully uncomfortable.',
    'Structure: ものすごく intensifies the judgement; 居心地が names what is being judged; 悪そう adds the appearance.',
    'Nuance: 〜そう makes this an impression rather than a direct statement.',
  ],
  createdAt: '2026-11-01T09:00:00.000Z',
  source: 'sample',
  chunks: [
    {
      n: 1,
      jp: 'ものすごく',
      kana: 'ものすごく',
      gloss: 'awfully',
      role: 'adverb',
      color: 4,
      note: 'ものすごく = colloquial “extremely / awfully”.',
      construction: [{ jp: 'ものすごく', en: 'adverb — awfully' }],
      examples: [
        {
          jp: 'ものすごく疲れた。',
          en: 'I’m exhausted.',
        },
      ],
      lookup: 'ものすごく',
    },
    {
      n: 2,
      jp: '居心地が',
      kana: 'いごこちが',
      gloss: 'the comfort',
      role: 'subject',
      color: 5,
      note: '居心地 = “how it feels to be somewhere”.',
      construction: [{ jp: '居心地 + が', en: 'the feel (subject)' }],
      examples: [
        {
          jp: 'この部屋は居心地がいい。',
          en: 'This room feels comfortable.',
        },
      ],
      lookup: '居心地',
      furigana: [{ text: '居心地', reading: 'いごこち', kind: 'word' }, { text: 'が' }],
    },
    {
      n: 3,
      jp: '悪そう',
      kana: 'わるそう',
      gloss: 'seems bad',
      role: 'predicate',
      color: 6,
      note: '悪い → 悪そう = “looks bad”; 〜そう = “seems”.',
      construction: [{ jp: '悪い + そう', en: 'seems bad' }],
      examples: [
        {
          jp: 'おいしそうなケーキ。',
          en: 'A cake that looks delicious.',
        },
      ],
      lookup: '悪そう',
      furigana: [{ text: '悪', reading: 'わる', kind: 'word' }, { text: 'そう' }],
    },
  ],
} satisfies Session

export const sampleSessions: Session[] = [sampleSession, sessionA, sessionB]

export function createManualSession(sentence: string): Session {
  const note = 'Full chunking for pasted sentences arrives in a later phase.'

  return {
    id: `manual-${Date.now()}`,
    sentence,
    reading: '',
    natural: '',
    raw: '',
    chunks: [
      {
        n: 1,
        jp: sentence,
        kana: '',
        gloss: 'awaiting full breakdown',
        role: 'sentence',
        color: 1,
        note,
        construction: [],
        examples: [],
      },
    ],
    sentenceNote: [note],
    createdAt: new Date().toISOString(),
    source: 'manual',
  }
}
