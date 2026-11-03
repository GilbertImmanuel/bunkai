import type { Chunk, Session } from '../data/types'

export interface MapSpan {
  jp: string
  chunk?: Chunk
  zero: boolean
  particle: string
}

export interface MapModifier {
  chunk: Chunk
  role: string
  particle: string
  depth: number
  targetLabel: string
}

export interface SentenceMapModel {
  topic: MapSpan
  subject: MapSpan
  predicate: MapSpan
  modifiers: MapModifier[]
}

interface ModifierNode {
  chunk: Chunk
  role: string
  particle: string
  target: 'predicate' | number
  children: ModifierNode[]
}

const PREDICATE_ROLES = new Set([
  'main verb',
  'main predicate',
  'predicate',
  'engine',
  'verb',
  'copula',
])

const SENTENCE_ADVERBS = new Set([
  'ただ',
  'きっと',
  'たぶん',
  'もちろん',
  'やはり',
  'やっぱり',
  'まだ',
  'もう',
  'ぜひ',
  'おそらく',
  'たしか',
])

const PARTICLES = [
  'から',
  'まで',
  'より',
  'だけ',
  'しか',
  'ばかり',
  'ほど',
  'あまり',
  'ので',
  'のに',
  'けど',
  'けれど',
  'たり',
  'ながら',
  'たら',
  'なら',
  'は',
  'も',
  'が',
  'を',
  'に',
  'で',
  'と',
  'へ',
  'や',
  'ば',
]

function normalized(role: string): string {
  return role.trim().toLowerCase()
}

function isPredicateRole(role: string): boolean {
  return PREDICATE_ROLES.has(normalized(role))
}

function isTopicRole(role: string): boolean {
  return /\btopic\b/.test(normalized(role))
}

function isSubjectRole(role: string): boolean {
  const value = normalized(role)
  return value === 'subject' || value === 'a-car'
}

function isClauseRole(role: string): boolean {
  return /\b(clause|conditional|condition|reason|cause|time|concession|purpose|degree|result)\b/.test(
    normalized(role),
  )
}

function roleLabel(role: string): string {
  const value = normalized(role)
  if (PREDICATE_ROLES.has(value)) return 'B-engine'
  if (value === 'particle') return 'Limiter'
  if (value === 'accompaniment') return 'Companion'
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function particleFor(jp: string): string {
  const value = jp.trim().replace(/[。．.!！?？、,，]+$/, '')
  return PARTICLES.find((particle) => value.endsWith(particle)) ?? ''
}

function splitPredicateSubject(jp: string): { subject: string; engine: string } | null {
  const match = /^(.{1,18}?が)(.+)$/u.exec(jp.trim())
  if (!match) return null

  const subject = match[1].trim()
  const engine = match[2].trim()
  return subject && engine ? { subject, engine } : null
}

function targetFor(
  chunks: Chunk[],
  index: number,
  chunk: Chunk,
  topicChunk: Chunk | undefined,
  subjectChunk: Chunk | undefined,
): 'predicate' | number {
  if (SENTENCE_ADVERBS.has(chunk.jp.trim())) return 'predicate'
  if (normalized(chunk.role) === 'particle') return 'predicate'

  for (let nextIndex = index + 1; nextIndex < chunks.length; nextIndex += 1) {
    const next = chunks[nextIndex]
    if (next.n === topicChunk?.n || next.n === subjectChunk?.n) continue
    if (isPredicateRole(next.role)) return 'predicate'
    if (isClauseRole(next.role)) return next.n
  }

  return 'predicate'
}

export function buildSentenceMap(session: Session): SentenceMapModel {
  const chunks = session.chunks
  const predicateChunk =
    [...chunks].reverse().find((chunk) => isPredicateRole(chunk.role)) ?? chunks[chunks.length - 1]

  const topicChunk =
    chunks.find((chunk) => isTopicRole(chunk.role)) ??
    chunks.find(
      (chunk) =>
        chunk.n !== predicateChunk?.n &&
        !isClauseRole(chunk.role) &&
        !isPredicateRole(chunk.role) &&
        /[はも]$/.test(chunk.jp.trim()),
    )

  const subjectChunk = chunks
    .filter((chunk) => isSubjectRole(chunk.role) && chunk.n !== topicChunk?.n)
    .at(-1)

  const split = subjectChunk ? null : splitPredicateSubject(predicateChunk?.jp ?? '')
  const subject: MapSpan = subjectChunk
    ? {
        jp: subjectChunk.jp,
        chunk: subjectChunk,
        zero: false,
        particle: 'が',
      }
    : split
      ? {
          jp: split.subject,
          chunk: predicateChunk,
          zero: false,
          particle: 'が',
        }
      : {
          jp: '(zeroが)',
          chunk: undefined,
          zero: true,
          particle: 'が',
        }

  const topic: MapSpan = topicChunk
    ? {
        jp: topicChunk.jp,
        chunk: topicChunk,
        zero: false,
        particle: particleFor(topicChunk.jp) || 'は',
      }
    : {
        jp: '(zeroは)',
        chunk: undefined,
        zero: true,
        particle: 'は',
      }

  const predicate: MapSpan = predicateChunk
    ? {
        jp: split?.engine ?? predicateChunk.jp,
        chunk: predicateChunk,
        zero: false,
        particle: particleFor(split?.engine ?? predicateChunk.jp),
      }
    : {
        jp: '—',
        chunk: undefined,
        zero: true,
        particle: '',
      }

  const coreIds = new Set(
    [topicChunk?.n, subjectChunk?.n, predicateChunk?.n].filter(
      (value): value is number => typeof value === 'number',
    ),
  )
  const nodes = new Map<number, ModifierNode>()

  chunks.forEach((chunk, index) => {
    if (coreIds.has(chunk.n)) return

    nodes.set(chunk.n, {
      chunk,
      role: roleLabel(chunk.role),
      particle: particleFor(chunk.jp),
      target: targetFor(chunks, index, chunk, topicChunk, subjectChunk),
      children: [],
    })
  })

  const roots: ModifierNode[] = []
  for (const node of nodes.values()) {
    const parent = typeof node.target === 'number' ? nodes.get(node.target) : undefined
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortNodes = (items: ModifierNode[]) => items.sort((a, b) => a.chunk.n - b.chunk.n)
  sortNodes(roots)

  const modifiers: MapModifier[] = []
  const visit = (node: ModifierNode, depth: number, targetLabel: string): void => {
    modifiers.push({
      chunk: node.chunk,
      role: node.role,
      particle: node.particle,
      depth,
      targetLabel,
    })
    sortNodes(node.children)
    for (const child of node.children) visit(child, depth + 1, node.role)
  }

  for (const root of roots) visit(root, 0, 'B-engine')

  return { topic, subject, predicate, modifiers }
}
