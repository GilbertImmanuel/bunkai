<script lang="ts">
  let { reading }: { reading: string } = $props()
</script>

{#if reading}
  <p class="kana" lang="ja" data-testid="kana">{reading}</p>
{/if}

<style>
  .kana {
    margin-top: 14px;
    overflow-wrap: break-word;
    color: var(--kana-ink);
    font-family: var(--font-jp);
    font-size: var(--fs-kana);
    letter-spacing: 0.02em;
    line-height: var(--lh-kana);
    word-break: keep-all;
  }
</style>
