<script lang="ts">
  import type { Example } from '../data/types'

  let { examples }: { examples: Example[] } = $props()
</script>

<div class="examples" data-testid="examples">
  {#each examples as example, index (index)}
    <div class="example">
      <span class="example-no">{String(index + 1).padStart(2, '0')}</span>
      <div>
        <p class="example-jp" lang="ja">{example.jp}</p>
        <p class="example-en">{example.en}</p>
      </div>
    </div>
  {/each}
</div>

<style>
  .examples {
    margin-top: 12px;
  }

  .example {
    display: grid;
    grid-template-columns: 26px minmax(0, 1fr);
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
  }

  .example:last-child {
    border-bottom: 0;
  }

  .example-no {
    padding-top: 3px;
    color: var(--muted);
    font-family: var(--font-data);
    font-size: var(--fs-data);
    line-height: var(--lh-data);
  }

  .example-jp {
    overflow-wrap: anywhere;
    color: var(--ink);
    font-family: var(--font-jp);
    font-size: 16px;
    line-height: 1.55;
  }

  .example-en {
    margin-top: 2px;
    color: var(--muted);
    font-family: var(--font-reading);
    font-size: 14px;
    line-height: 1.4;
  }
</style>
