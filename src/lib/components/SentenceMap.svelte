<script lang="ts">
  import { buildSentenceMap } from '../data/sentenceMap'
  import type { Chunk, Session } from '../data/types'

  let { session }: { session: Session } = $props()

  let mode = $state<'row' | 'tree'>('row')
  const map = $derived(buildSentenceMap(session))

  function fallbackRole(role: string): string {
    const value = role.trim().toLowerCase()
    if (value === 'particle') return 'Limiter'
    if (value === 'accompaniment') return 'Companion'
    if (['main verb', 'main predicate', 'predicate', 'engine', 'verb', 'copula'].includes(value)) {
      return 'B-engine'
    }
    if (value === 'subject') return 'A-car'
    if (value === 'topic') return 'Topic'
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  interface RowNode {
    chunk: Chunk
    role: string
    isHead: boolean
    isLimiter: boolean
    sub?: string
  }

  const rowNodes = $derived.by((): RowNode[] => {
    const modifierById = new Map(map.modifiers.map((modifier) => [modifier.chunk.n, modifier]))

    return session.chunks.map((chunk) => {
      const modifier = modifierById.get(chunk.n)
      let role = modifier?.role ?? fallbackRole(chunk.role)

      if (map.topic.chunk?.n === chunk.n) role = 'Topic'
      if (map.subject.chunk?.n === chunk.n) role = 'A-car'
      if (map.predicate.chunk?.n === chunk.n) role = 'B-engine'

      const sub =
        map.predicate.chunk?.n === chunk.n && !map.subject.zero && map.subject.chunk?.n === chunk.n
          ? `A-car: ${map.subject.jp}`
          : undefined

      return {
        chunk,
        role,
        isHead: map.predicate.chunk?.n === chunk.n,
        isLimiter: modifier?.role === 'Limiter',
        sub,
      }
    })
  })

  const relation = $derived.by(() => {
    const parts = [`${map.subject.zero ? '(zeroが)' : map.subject.jp} → B-engine`]
    const roots = map.modifiers.filter(
      (modifier) => modifier.depth === 0 && modifier.role !== 'Limiter',
    )

    if (roots.length > 0) {
      parts.push(`${roots.map((modifier) => modifier.role.toLowerCase()).join(' · ')} → B-engine`)
    }

    for (const modifier of map.modifiers.filter((item) => item.depth > 0)) {
      parts.push(`${modifier.role.toLowerCase()} → ${modifier.targetLabel.toLowerCase()}`)
    }

    for (const modifier of map.modifiers.filter((item) => item.role === 'Limiter')) {
      parts.push(`${modifier.chunk.jp} limits`)
    }

    return parts.join(' · ')
  })
</script>

<section class="sheet-section" data-testid="sentence-map">
  <div class="map-head">
    <p class="sec-label">Sentence map</p>
    <div class="map-toggle" role="group" aria-label="Sentence map style">
      <button
        class="map-toggle-btn"
        class:is-on={mode === 'row'}
        type="button"
        aria-pressed={mode === 'row'}
        onclick={() => (mode = 'row')}
      >
        Row
      </button>
      <button
        class="map-toggle-btn"
        class:is-on={mode === 'tree'}
        type="button"
        aria-pressed={mode === 'tree'}
        onclick={() => (mode = 'tree')}
      >
        Tree
      </button>
    </div>
  </div>

  <div class="map">
    {#if mode === 'row'}
      {#if map.topic.zero}
        <div class="map-topic" data-testid="map-topic">
          <span class="map-dot is-zero"></span>
          <span class="map-tag">Topic</span>
          <span class="map-jp is-zero" lang="ja">{map.topic.jp}</span>
        </div>
      {/if}

      <div class="map-core" data-testid="map-core" style="--n:{session.chunks.length}">
        {#each rowNodes as node (node.chunk.n)}
          <div
            class="map-node c{node.chunk.color}"
            class:is-head={node.isHead}
            class:is-lim={node.isLimiter}
          >
            <span class="map-dot"></span>
            <span class="map-jp" lang="ja">[{node.chunk.jp}]</span>
            <span class="map-role">{node.role}</span>
            {#if node.sub}
              <span class="map-sub">{node.sub}</span>
            {/if}
          </div>
        {/each}
      </div>

      {#if relation}
        <div class="map-rel" data-testid="map-rel">{relation}</div>
      {/if}
    {:else}
      <div class="map-topic" data-testid="map-topic">
        <span
          class={`map-dot ${map.topic.chunk ? `c${map.topic.chunk.color}` : ''}`}
          class:is-zero={map.topic.zero}
        ></span>
        <span class="map-tag">Topic</span>
        <span class="map-jp" lang="ja" class:is-zero={map.topic.zero}>{map.topic.jp}</span>
        {#if !map.topic.zero && map.topic.particle}
          <span class="map-particle">{map.topic.particle}</span>
        {/if}
      </div>

      <div class="map-tree-core" data-testid="map-tree-core">
        <div class={`map-car ${map.subject.chunk ? `c${map.subject.chunk.color}` : ''}`}>
          <span
            class={`map-dot ${map.subject.chunk ? `c${map.subject.chunk.color}` : ''}`}
            class:is-zero={map.subject.zero}
          ></span>
          <span class="map-tag">A-car</span>
          <span class="map-jp" lang="ja" class:is-zero={map.subject.zero}>{map.subject.jp}</span>
          {#if !map.subject.zero && map.subject.particle}
            <span class="map-particle">{map.subject.particle}</span>
          {/if}
        </div>

        <span class="map-coupling" aria-hidden="true">→</span>

        <div class={`map-engine ${map.predicate.chunk ? `c${map.predicate.chunk.color}` : ''}`}>
          <span class={`map-dot ${map.predicate.chunk ? `c${map.predicate.chunk.color}` : ''}`}
          ></span>
          <span class="map-tag">B-engine</span>
          <span class="map-jp" lang="ja">{map.predicate.jp}</span>
        </div>
      </div>

      {#if map.modifiers.length > 0}
        <div class="map-modifiers" data-testid="map-modifiers">
          {#each map.modifiers as modifier (modifier.chunk.n)}
            <div
              class="map-modifier c{modifier.chunk.color}"
              data-depth={modifier.depth}
              style="--depth:{modifier.depth}"
            >
              <span class="map-dot" aria-hidden="true"></span>
              <div class="map-mod-body">
                <div class="map-mod-head">
                  <span class="map-mod-role">{modifier.role}</span>
                  {#if modifier.particle && modifier.particle !== modifier.chunk.jp.trim()}
                    <span class="map-particle">{modifier.particle}</span>
                  {/if}
                </div>
                <span class="map-jp" lang="ja">{modifier.chunk.jp}</span>
                <span class="map-target">→ {modifier.targetLabel}</span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</section>

<style>
  .map-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .map-head .sec-label {
    margin-bottom: 0;
  }

  .map-toggle {
    display: inline-flex;
    padding: 2px;
    border: 1px solid var(--line);
    border-radius: var(--r-btn);
    background: var(--surface-2);
  }

  .map-toggle-btn {
    min-height: 24px;
    padding: 0 10px;
    border-radius: 6px;
    color: var(--muted);
    font-size: 11px;
    font-weight: 500;
  }

  .map-toggle-btn.is-on {
    background: var(--surface);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
    color: var(--ink);
  }

  .map {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .map-topic {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding-bottom: 10px;
    border-bottom: 1px dashed var(--line);
  }

  .map-dot {
    width: 9px;
    height: 9px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: var(--cc, var(--line));
    box-shadow: 0 0 0 2px var(--surface);
  }

  .map-dot.is-zero {
    background: transparent;
    border: 1px dashed var(--muted);
    box-shadow: none;
  }

  .map-tag,
  .map-role,
  .map-mod-role,
  .map-particle,
  .map-target,
  .map-sub {
    color: var(--muted);
    font-family: var(--font-data);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.04em;
    line-height: 1.25;
    text-transform: uppercase;
  }

  .map-particle {
    color: var(--accent);
  }

  .map-jp {
    color: var(--ink);
    font-family: var(--font-jp);
    font-size: 13px;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .map-jp.is-zero {
    color: var(--muted);
    font-style: italic;
  }

  .map-core {
    position: relative;
    display: grid;
    grid-template-columns: repeat(var(--n, 6), minmax(0, 1fr));
    column-gap: 2px;
    padding-top: 1px;
  }

  .map-core::before {
    position: absolute;
    top: 4px;
    right: 4px;
    left: 4px;
    height: 1px;
    background: var(--line-strong);
    content: '';
  }

  .map-node {
    display: flex;
    min-width: 0;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    text-align: center;
  }

  .map-node.is-head .map-dot {
    width: 11px;
    height: 11px;
  }

  .map-node.is-head .map-jp {
    font-weight: 600;
  }

  .map-node.is-lim .map-role {
    color: var(--accent);
  }

  .map-sub {
    color: var(--muted);
    font-size: 10px;
    letter-spacing: 0.02em;
    text-transform: none;
  }

  .map-rel {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px;
    padding-top: 12px;
    border-top: 1px dashed var(--line);
    color: var(--muted);
    font-family: var(--font-data);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.03em;
  }

  .map-tree-core {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1.2fr);
    align-items: center;
    gap: 10px;
  }

  .map-car,
  .map-engine {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: var(--r-note);
    background: var(--surface-2);
  }

  .map-coupling {
    color: var(--accent);
    font-family: var(--font-data);
    font-size: 16px;
  }

  .map-modifiers {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px dashed var(--line);
  }

  .map-modifier {
    display: flex;
    gap: 8px;
    margin-left: calc(var(--depth) * 18px);
  }

  .map-mod-body {
    display: grid;
    min-width: 0;
    flex: 1 1 auto;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 2px 10px;
  }

  .map-mod-head {
    display: flex;
    align-items: baseline;
    gap: 5px;
  }

  .map-mod-body .map-jp {
    grid-column: 1;
  }

  .map-target {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
    text-align: right;
    white-space: nowrap;
  }

  @media (max-width: 900px) {
    .map-core {
      grid-template-columns: 1fr;
      row-gap: 12px;
    }

    .map-core::before {
      display: none;
    }

    .map-node {
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      gap: 10px;
      text-align: left;
    }

    .map-node .map-dot {
      box-shadow: none;
    }

    .map-tree-core {
      grid-template-columns: 1fr;
      gap: 6px;
    }

    .map-coupling {
      justify-self: start;
      transform: rotate(90deg);
    }

    .map-target {
      grid-column: 1;
      grid-row: auto;
      justify-self: start;
      text-align: left;
      white-space: normal;
    }
  }
</style>
