<script lang="ts">
  import type { Session, TranslationMode } from '../data/types'
  import { animateTranslationText } from '../utils/motion'

  let {
    session,
    mode,
    onModeChange,
  }: {
    session: Session
    mode: TranslationMode
    onModeChange: (mode: TranslationMode) => void
  } = $props()

  const glosses = $derived(session.raw ? session.raw.split('|').map((part) => part.trim()) : [])
  const rawParts = $derived(
    session.chunks.map((chunk, index) => ({
      n: chunk.n,
      color: chunk.color,
      gloss: glosses[index] || chunk.gloss,
    })),
  )
  const naturalParts = $derived(
    (session.naturalParts ?? []).map((part) => {
      const chunk = part.chunk ? session.chunks.find((item) => item.n === part.chunk) : undefined
      return { text: part.text, color: chunk?.color }
    }),
  )
</script>

<section class="translation sheet-section">
  <div class="toggle-row">
    <h2 class="sec-label">Translation</h2>
    <div class="seg-toggle" role="group" aria-label="Translation mode">
      <button
        class="seg-btn"
        class:is-on={mode === 'natural'}
        type="button"
        aria-pressed={mode === 'natural'}
        onclick={() => onModeChange('natural')}
      >
        Natural
      </button>
      <button
        class="seg-btn"
        class:is-on={mode === 'raw'}
        type="button"
        aria-pressed={mode === 'raw'}
        onclick={() => onModeChange('raw')}
      >
        Raw
      </button>
    </div>
  </div>

  <p
    class="translation-text"
    class:is-natural={mode === 'natural'}
    data-testid="translation-text"
    use:animateTranslationText={mode}
  >
    {#if mode === 'natural'}
      {#if naturalParts.length > 0}
        {#each naturalParts as part, index (index)}{#if part.color}<span
              class="chunk is-gloss c{part.color}">{part.text}</span
            >{:else}{part.text}{/if}{/each}
      {:else}
        {session.natural}
      {/if}
    {:else}
      {#each rawParts as part, index (part.n)}<span class="chunk is-gloss c{part.color}"
          >{part.gloss}</span
        >{index < rawParts.length - 1 ? ' ' : ''}{/each}
    {/if}
  </p>
</section>

<style>
  .toggle-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .toggle-row .sec-label {
    margin-bottom: 0;
  }

  .seg-toggle {
    display: inline-flex;
    padding: 2px;
    border: 1px solid var(--control-line);
    border-radius: var(--r-btn);
    background: var(--surface-2);
  }

  .seg-btn {
    min-height: 26px;
    padding: 0 12px;
    border-radius: calc(var(--r-btn) - 2px);
    color: var(--muted);
    font-size: 12px;
    font-weight: 500;
    transition:
      background 0.15s ease,
      color 0.15s ease;
  }

  .seg-btn.is-on {
    background: var(--surface);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
    color: var(--ink);
  }

  .translation-text {
    color: var(--ink);
    font-family: var(--font-reading);
    font-size: var(--fs-gloss);
    line-height: var(--lh-gloss);
    overflow-wrap: anywhere;
    text-wrap: pretty;
  }
</style>
