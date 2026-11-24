<script lang="ts">
  import { parseNoteRows } from '../utils/note'

  let { notes }: { notes: string[] } = $props()

  const rows = $derived(parseNoteRows(notes))
</script>

{#if notes.length > 0}
  <section class="sheet-section" data-testid="sentence-note">
    <h2 class="sec-label">Sentence note</h2>

    {#if rows}
      <div class="note-rows">
        {#each rows as row, index (index)}
          <div class="note-row">
            <p class="note-label">{row.label}</p>
            <p class="note-text">{row.text}</p>
          </div>
        {/each}
      </div>
    {:else}
      <div class="sentence-note">
        {#each notes as note, index (index)}
          <p>{note}</p>
        {/each}
      </div>
    {/if}
  </section>
{/if}

<style>
  .note-rows {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .note-row {
    display: grid;
    grid-template-columns: 128px minmax(0, 1fr);
    align-items: start;
    column-gap: 24px;
  }

  .note-label {
    padding-top: 2px;
    color: var(--muted);
    font-family: var(--font-data);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.06em;
    line-height: 1.4;
    text-transform: uppercase;
  }

  .note-text {
    color: var(--ink);
    font-family: var(--font-reading);
    font-size: var(--fs-note);
    line-height: var(--lh-note);
    text-wrap: pretty;
    white-space: pre-line;
  }

  .sentence-note p {
    color: var(--ink);
    font-family: var(--font-reading);
    font-size: var(--fs-note);
    line-height: var(--lh-note);
    text-wrap: pretty;
  }

  .sentence-note p + p {
    margin-top: 14px;
  }
</style>
