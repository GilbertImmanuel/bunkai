<script lang="ts">
  import { buildModifierTree, buildSentenceMap, type ModifierBranch } from '../data/sentenceMap'
  import type { Chunk, Session } from '../data/types'

  let { session }: { session: Session } = $props()

  let mode = $state<'row' | 'tree'>('row')
  const map = $derived(buildSentenceMap(session))
  const modifierTree = $derived(buildModifierTree(map.modifiers))

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
      parts.push(`${roots.map((modifier) => modifier.role.toLowerCase()).join(', ')} → B-engine`)
    }

    for (const modifier of map.modifiers.filter((item) => item.depth > 0)) {
      parts.push(`${modifier.role.toLowerCase()} → ${modifier.targetLabel.toLowerCase()}`)
    }

    for (const modifier of map.modifiers.filter((item) => item.role === 'Limiter')) {
      parts.push(`${modifier.chunk.jp} limits`)
    }

    return parts.join('; ')
  })
</script>

{#snippet treeNode(node: ModifierBranch)}
  <li class="map-modifier tree-node c{node.modifier.chunk.color}">
    <span class="map-dot" aria-hidden="true"></span>
    <span class="tree-role">
      {node.modifier.role}
      {#if node.modifier.particle && node.modifier.particle !== node.modifier.chunk.jp.trim()}
        <em>{node.modifier.particle}</em>
      {/if}
    </span>
    <span class="map-jp" lang="ja">{node.modifier.chunk.jp}</span>
    {#if node.children.length > 0}
      <ul class="tree-children">
        {#each node.children as child (child.modifier.chunk.n)}
          {@render treeNode(child)}
        {/each}
      </ul>
    {/if}
  </li>
{/snippet}

<section class="sheet-section" data-testid="sentence-map">
  <div class="map-head">
    <h2 class="sec-label">Sentence map</h2>
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
          aria-hidden="true"
        ></span>
        <span class="map-tag">Topic</span>
        <span class="map-jp" lang="ja" class:is-zero={map.topic.zero}>{map.topic.jp}</span>
      </div>

      <div class="map-tree-core" data-testid="map-tree-core">
        <div class={`tree-car ${map.subject.chunk ? `c${map.subject.chunk.color}` : ''}`}>
          <div class="tree-node-head">
            <span
              class={`map-dot ${map.subject.chunk ? `c${map.subject.chunk.color}` : ''}`}
              class:is-zero={map.subject.zero}
              aria-hidden="true"
            ></span>
            <span class="map-tag">A-car</span>
          </div>
          <span class="map-jp" lang="ja" class:is-zero={map.subject.zero}>{map.subject.jp}</span>
        </div>

        <div class="tree-coupling" aria-hidden="true"><span>が</span></div>

        <div class={`tree-engine ${map.predicate.chunk ? `c${map.predicate.chunk.color}` : ''}`}>
          <div class="tree-node-head">
            <span
              class={`map-dot ${map.predicate.chunk ? `c${map.predicate.chunk.color}` : ''}`}
              class:is-zero={map.predicate.zero}
              aria-hidden="true"
            ></span>
            <span class="map-tag">B-engine</span>
          </div>
          <span class="map-jp" lang="ja">{map.predicate.jp}</span>
        </div>
      </div>

      {#if modifierTree.length > 0}
        <div class="tree-branches" data-testid="map-modifiers">
          <div class="tree-branch-head">
            <span class="tree-branch-mark" aria-hidden="true">↳</span>
            <span class="map-tag">Modifiers of B-engine</span>
          </div>
          <ul class="tree-list" aria-label="Modifiers of B-engine">
            {#each modifierTree as root (root.modifier.chunk.n)}
              {@render treeNode(root)}
            {/each}
          </ul>
        </div>
      {/if}

      <p class="tree-hint">
        A-car is the subject. B-engine is the predicate. Each branch modifies the node above it.
      </p>
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
    border: 1px solid var(--control-line);
    border-radius: var(--r-btn);
    background: var(--surface-2);
  }

  .map-toggle-btn {
    min-height: 24px;
    padding: 0 10px;
    border-radius: calc(var(--r-btn) - 2px);
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
    position: relative;
    z-index: 1;
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
  .map-sub {
    color: var(--muted);
    font-family: var(--font-data);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.04em;
    line-height: 1.25;
    text-transform: uppercase;
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
    grid-template-columns: minmax(0, 0.9fr) 34px minmax(0, 1.1fr);
    align-items: stretch;
    min-height: 64px;
  }

  .tree-car,
  .tree-engine {
    display: flex;
    min-width: 0;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    background: var(--surface-2);
  }

  .tree-car {
    border-right: 0;
    border-radius: var(--r-note) 0 0 var(--r-note);
  }

  .tree-engine {
    border-left: 0;
    border-radius: 0 var(--r-note) var(--r-note) 0;
    background: color-mix(in srgb, var(--cc, var(--surface-2)) 10%, var(--surface-2));
  }

  .tree-node-head {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .tree-car .map-jp {
    font-size: 14px;
  }

  .tree-engine .map-jp {
    font-size: 15px;
    font-weight: 600;
  }

  .tree-coupling {
    position: relative;
    display: grid;
    place-items: center;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }

  .tree-coupling::before {
    position: absolute;
    top: 50%;
    right: 0;
    left: 0;
    height: 1px;
    background: var(--line-strong);
    content: '';
  }

  .tree-coupling span {
    position: relative;
    z-index: 1;
    padding: 0 4px;
    background: var(--surface);
    color: var(--accent);
    font-family: var(--font-data);
    font-size: 11px;
    line-height: 1;
  }

  .tree-branches {
    padding-top: 12px;
    border-top: 1px dashed var(--line);
  }

  .tree-branch-head {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 10px;
  }

  .tree-branch-mark {
    color: var(--accent);
    font-family: var(--font-data);
    font-size: 14px;
    line-height: 1;
  }

  .tree-list,
  .tree-children {
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .tree-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-left: 4px;
    padding-left: 16px;
    border-left: 1px solid var(--line);
  }

  .tree-node {
    position: relative;
    display: grid;
    min-width: 0;
    grid-template-columns: 9px 156px minmax(0, 1fr);
    align-items: baseline;
    gap: 0 10px;
  }

  .tree-node .map-dot::before {
    position: absolute;
    top: 50%;
    right: 100%;
    width: 16px;
    height: 1px;
    background: var(--line);
    content: '';
  }

  .tree-role {
    color: var(--muted);
    font-family: var(--font-data);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.04em;
    line-height: 1.3;
    text-transform: uppercase;
  }

  .tree-role em {
    color: var(--accent);
    font-style: normal;
  }

  .tree-node .map-jp {
    font-size: 15px;
  }

  .tree-children {
    display: flex;
    grid-column: 1 / -1;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
    margin-left: 4px;
    padding-left: 16px;
    border-left: 1px solid var(--line);
  }

  .tree-hint {
    padding-top: 12px;
    border-top: 1px dashed var(--line);
    color: var(--muted);
    font-family: var(--font-data);
    font-size: 11px;
    line-height: 1.4;
    text-wrap: pretty;
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
  }
</style>
