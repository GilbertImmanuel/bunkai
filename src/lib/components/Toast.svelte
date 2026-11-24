<script lang="ts">
  import { runToastAction, toastState } from '../stores/toast.svelte'
</script>

{#if toastState.visible}
  <div class="toast" role="status" aria-live="polite" aria-atomic="true" data-testid="toast">
    <span>{toastState.message}</span>
    {#if toastState.actionLabel}
      <button type="button" onclick={runToastAction}>{toastState.actionLabel}</button>
    {/if}
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 16px;
    border-radius: var(--r-note);
    background: var(--ink);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
    color: var(--surface);
    font-size: 13px;
    transform: translateX(-50%);
    animation: toast-in 160ms ease-out;
  }

  .toast button {
    color: var(--accent-soft);
    font-size: 13px;
    font-weight: 600;
  }

  :global(:root[data-theme='dark']) .toast {
    border: 1px solid var(--line-strong);
    background: var(--surface-2);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
    color: var(--ink);
  }

  :global(:root[data-theme='dark']) .toast button {
    color: var(--accent);
  }

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translate(-50%, 12px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
</style>
