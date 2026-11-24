<script lang="ts">
  import type { Chunk } from '../data/types'

  let { chunks }: { chunks: Chunk[] } = $props()
</script>

<section class="sheet-section" data-testid="literal-key">
  <h2 class="sec-label">Literal key</h2>

  <div class="key-list">
    {#each chunks as chunk (chunk.n)}
      <div class="key-row c{chunk.color}">
        <div class="key-meta">
          <span class="key-no">
            <span class="key-chip" aria-hidden="true"></span>
            <span>{String(chunk.n).padStart(2, '0')}</span>
          </span>
          <span class="key-role">{chunk.role}</span>
        </div>
        <span class="key-jp" lang="ja">{chunk.jp}</span>
        <span class="key-gloss">{chunk.gloss}</span>
      </div>
    {/each}
  </div>
</section>

<style>
  .key-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 32px;
  }

  .key-row {
    display: grid;
    grid-template-areas:
      'meta jp'
      'meta gloss';
    grid-template-columns: 96px minmax(0, 1fr);
    align-items: start;
    column-gap: 12px;
    row-gap: 3px;
    padding: 11px 0;
    border-bottom: 1px solid var(--line);
  }

  .key-meta {
    display: flex;
    min-width: 0;
    grid-area: meta;
    flex-direction: column;
    gap: 3px;
    padding-top: 1px;
  }

  .key-no {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--muted);
    font-family: var(--font-data);
    font-size: var(--fs-data);
    font-variant-numeric: tabular-nums;
    line-height: var(--lh-data);
  }

  .key-chip {
    width: 8px;
    height: 8px;
    flex: 0 0 auto;
    border-radius: 2px;
    background: var(--cc);
  }

  .key-jp {
    min-width: 0;
    grid-area: jp;
    color: var(--ink);
    font-family: var(--font-jp);
    font-size: 14px;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .key-gloss {
    min-width: 0;
    grid-area: gloss;
    color: var(--muted);
    font-family: var(--font-reading);
    font-size: 13px;
    font-style: italic;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .key-role {
    color: var(--muted);
    font-family: var(--font-data);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.05em;
    line-height: 1.2;
    text-transform: uppercase;
    white-space: nowrap;
  }

  @media (max-width: 900px) {
    .key-list {
      grid-template-columns: 1fr;
    }
  }
</style>
