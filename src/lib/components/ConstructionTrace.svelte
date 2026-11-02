<script lang="ts">
  import type { ChunkColor, ConstructionStep } from '../data/types'

  let { steps, color }: { steps: ConstructionStep[]; color: ChunkColor } = $props()
</script>

<div class="trace c{color}" data-testid="construction-trace">
  {#each steps as step, index (index)}
    <div class="trace-step" class:is-final={index === steps.length - 1}>
      <span class="trace-index">{String(index + 1).padStart(2, '0')}</span>
      <span class="trace-jp" lang="ja">{step.jp}</span>
      <span class="trace-en">{step.en}</span>
    </div>
  {/each}
</div>

<style>
  .trace {
    display: flex;
    flex-direction: column;
    margin-top: 12px;
  }

  .trace-step {
    position: relative;
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr);
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: var(--r-btn);
    background: var(--surface-2);
    column-gap: 12px;
    row-gap: 3px;
  }

  .trace-step + .trace-step {
    margin-top: 22px;
  }

  .trace-step:not(:last-child)::after {
    position: absolute;
    bottom: -17px;
    left: 25px;
    color: var(--muted);
    content: '↓';
    font-family: var(--font-data);
    font-size: 12px;
    line-height: 1;
    transform: translateX(-50%);
  }

  .trace-step.is-final {
    border-color: var(--cc);
    background: color-mix(in srgb, var(--cc) var(--tint-pct), var(--surface-2));
  }

  .trace-index {
    grid-row: 1 / span 2;
    grid-column: 1;
    padding-top: 2px;
    color: var(--muted);
    font-family: var(--font-data);
    font-size: var(--fs-data);
    line-height: var(--lh-data);
  }

  .trace-jp {
    grid-row: 1;
    grid-column: 2;
    overflow-wrap: anywhere;
    color: var(--ink);
    font-family: var(--font-jp);
    font-size: 15px;
    line-height: 1.4;
    white-space: normal;
  }

  .trace-en {
    grid-row: 2;
    grid-column: 2;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.35;
  }
</style>
