<script lang="ts">
  import type { Chunk } from '../data/types'

  let { chunks }: { chunks: Chunk[] } = $props()
</script>

<section class="sheet-section" data-testid="literal-key">
  <h2 class="sec-label">Literal key</h2>

  <div class="key-list">
    {#each chunks as chunk (chunk.n)}
      <div class="key-row c{chunk.color}">
        <span class="key-swatch" aria-hidden="true"></span>
        <span class="key-no">{String(chunk.n).padStart(2, '0')}</span>
        <span class="key-jp" lang="ja">{chunk.jp}</span>
        <span class="key-gloss">{chunk.gloss}</span>
        <span class="key-role">{chunk.role}</span>
      </div>
    {/each}
  </div>
</section>

<style>
  .key-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 28px;
  }

  .key-row {
    display: grid;
    grid-template-areas:
      'sw no jp role'
      'sw no gloss role';
    grid-template-columns: 8px 22px minmax(0, 1fr) auto;
    align-items: baseline;
    column-gap: 9px;
    row-gap: 2px;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
  }

  .key-swatch {
    grid-area: sw;
    width: 8px;
    height: 8px;
    align-self: center;
    border-radius: 2px;
    background: var(--cc);
  }

  .key-no {
    grid-area: no;
    color: var(--muted);
    font-family: var(--font-data);
    font-size: var(--fs-data);
    line-height: var(--lh-data);
  }

  .key-jp {
    grid-area: jp;
    color: var(--ink);
    font-family: var(--font-jp);
    font-size: 14px;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .key-gloss {
    grid-area: gloss;
    color: var(--muted);
    font-family: var(--font-reading);
    font-size: 13px;
    font-style: italic;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .key-role {
    grid-area: role;
    align-self: center;
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
