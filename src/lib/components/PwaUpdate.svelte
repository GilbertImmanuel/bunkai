<script lang="ts">
  import { onMount } from 'svelte'
  import { registerSW } from 'virtual:pwa-register'
  import { showToast } from '../stores/toast.svelte'

  let needRefresh = $state(false)
  let updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null

  onMount(() => {
    updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        needRefresh = true
      },
      onOfflineReady() {
        showToast('Ready to work offline')
      },
    })
  })

  function reload(): void {
    needRefresh = false
    void updateSW?.(true)
  }

  function later(): void {
    needRefresh = false
  }
</script>

{#if needRefresh}
  <div class="pwa-update" role="status" aria-live="polite" data-testid="pwa-update">
    <span>A new version is available.</span>
    <button class="reload" type="button" onclick={reload}>Reload</button>
    <button class="later" type="button" onclick={later}>Later</button>
  </div>
{/if}

<style>
  .pwa-update {
    position: fixed;
    bottom: 76px;
    left: 50%;
    z-index: 49;
    display: flex;
    max-width: min(520px, calc(100vw - 32px));
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px 14px;
    padding: 10px 16px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-note);
    background: var(--surface-2);
    box-shadow: var(--shadow-panel);
    color: var(--ink);
    font-size: 13px;
    line-height: 1.45;
    transform: translateX(-50%);
  }

  .pwa-update button {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
  }

  .pwa-update .reload {
    color: var(--accent);
  }

  .pwa-update .later {
    color: var(--muted);
    font-weight: 400;
  }

  .pwa-update .later:hover {
    color: var(--ink);
  }
</style>
