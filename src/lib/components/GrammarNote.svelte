<script lang="ts">
  let { note }: { note: string } = $props()
</script>

<p class="grammar-note" data-testid="grammar-note">{note}</p>

<style>
  .grammar-note {
    max-width: 60ch;
    color: var(--ink);
    font-size: var(--fs-note);
    line-height: var(--lh-note);
    text-wrap: pretty;
  }
</style>
