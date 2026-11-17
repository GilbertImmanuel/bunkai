<script lang="ts">
  let { notes }: { notes: string[] } = $props()
</script>

{#if notes.length > 0}
  <section class="sheet-section" data-testid="sentence-note">
    <p class="sec-label">Sentence note</p>

    <div class="sentence-note">
      {#each notes as note, index (index)}
        <p>{note}</p>
      {/each}
    </div>
  </section>
{/if}

<style>
  .sentence-note p {
    color: var(--ink);
    font-family: var(--font-reading);
    font-size: var(--fs-note);
    line-height: var(--lh-note);
    text-wrap: pretty;
  }

  .sentence-note p + p {
    margin-top: 12px;
  }
</style>
