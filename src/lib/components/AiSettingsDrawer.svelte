<script lang="ts">
  import { onMount } from 'svelte'
  import { aiErrorMessage } from '../ai/breakdown'
  import { AI_PROVIDERS, getAiProvider, type AiProviderId } from '../ai/providers'
  import {
    aiState,
    closeAiSettings,
    hasStoredKey,
    providerReady,
    removeStoredKey,
    saveAiPreferences,
    storedModel,
    storedProxy,
    testAiConnection,
  } from '../stores/ai.svelte'

  type StatusKind = 'idle' | 'info' | 'success' | 'error'

  const initialProvider = aiState.settings.provider
  let providerId = $state<AiProviderId>(initialProvider)
  let model = $state(storedModel(initialProvider))
  let key = $state('')
  let proxy = $state(storedProxy(initialProvider))
  let testing = $state(false)
  let status = $state<{ kind: StatusKind; message: string }>({
    kind: 'idle',
    message: '',
  })
  let panelEl: HTMLElement | undefined = $state()
  let closeEl: HTMLButtonElement | undefined = $state()

  const provider = $derived(getAiProvider(providerId))
  const keySaved = $derived(hasStoredKey(providerId))
  const canTest = $derived(
    (key.trim().length > 0 || keySaved) &&
      (!provider.requiresProxy || proxy.trim().length > 0) &&
      !testing,
  )

  onMount(() => {
    closeEl?.focus()

    function onKeydown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        closeAiSettings()
        return
      }

      if (event.key !== 'Tab') return

      const panel = panelEl
      if (!panel) return

      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0)

      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === first || !panel.contains(document.activeElement)) {
          event.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last || !panel.contains(document.activeElement)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeydown)
    return () => document.removeEventListener('keydown', onKeydown)
  })

  function selectProvider(event: Event): void {
    const next = (event.currentTarget as HTMLSelectElement).value as AiProviderId
    providerId = next
    model = storedModel(next)
    proxy = storedProxy(next)
    key = ''
    status = { kind: 'idle', message: '' }
  }

  function handleSave(event: SubmitEvent): void {
    event.preventDefault()
    saveAiPreferences({ provider: providerId, model, key, proxy })
    key = ''

    if (providerReady(providerId)) {
      status = { kind: 'success', message: 'Saved in this browser. AI is ready.' }
    } else if (!hasStoredKey(providerId)) {
      status = {
        kind: 'success',
        message: 'Saved. Add an API key to use AI, or continue in sample mode.',
      }
    } else if (provider.requiresProxy && !proxy.trim()) {
      status = {
        kind: 'info',
        message: 'Saved. Add the OpenCode proxy endpoint to use AI.',
      }
    } else {
      status = { kind: 'success', message: 'Saved in this browser.' }
    }
  }

  async function handleTest(): Promise<void> {
    testing = true
    status = { kind: 'info', message: `Testing ${provider.label}…` }

    try {
      await testAiConnection({ provider: providerId, model, key, proxy })
      status = { kind: 'success', message: 'Connection works.' }
    } catch (error) {
      status = { kind: 'error', message: aiErrorMessage(error) }
    } finally {
      testing = false
    }
  }

  function handleRemove(): void {
    removeStoredKey(providerId)
    key = ''
    status = {
      kind: 'info',
      message: 'Key removed. Sample mode remains available.',
    }
  }
</script>

<div class="settings-layer">
  <button
    class="settings-scrim"
    type="button"
    tabindex="-1"
    aria-label="Close AI settings"
    onclick={closeAiSettings}
  ></button>

  <div
    class="settings-panel"
    bind:this={panelEl}
    role="dialog"
    aria-modal="true"
    aria-labelledby="ai-settings-title"
    data-testid="ai-settings"
  >
    <header class="settings-head">
      <div>
        <p class="panel-label">Settings</p>
        <h2 class="settings-title" id="ai-settings-title">AI breakdowns</h2>
      </div>
      <button
        class="icon-btn"
        type="button"
        bind:this={closeEl}
        aria-label="Close AI settings"
        title="Close AI settings"
        onclick={closeAiSettings}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </header>

    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="settings-body scroll-region"
      role="region"
      tabindex="0"
      aria-label="AI settings form"
    >
      <p class="settings-lede">
        Optional. Bunkai always works in sample and manual mode without a key.
      </p>

      <form class="settings-form" onsubmit={handleSave}>
        <label class="field">
          <span class="field-label">Provider</span>
          <select value={providerId} onchange={selectProvider}>
            {#each AI_PROVIDERS as option (option.id)}
              <option value={option.id}>{option.label}</option>
            {/each}
          </select>
        </label>

        {#if provider.note}
          <p class="provider-note">{provider.note}</p>
        {/if}

        {#if provider.requiresProxy}
          <label class="field">
            <span class="field-label">Proxy base URL</span>
            <input
              type="url"
              placeholder={provider.proxyPlaceholder}
              autocomplete="off"
              spellcheck="false"
              bind:value={proxy}
            />
          </label>
          <p class="field-help">
            Paste the proxy base URL or the full chat-completions URL. Bunkai adds /chat/completions
            when needed. The proxy must allow browser CORS and can see the API key.
          </p>
        {/if}

        <label class="field">
          <span class="field-label">Model</span>
          <input
            type="text"
            placeholder={provider.defaultModel}
            autocomplete="off"
            spellcheck="false"
            bind:value={model}
          />
        </label>
        <p class="field-help">Default: {provider.defaultModel}</p>

        <label class="field">
          <span class="field-label">API key</span>
          <input
            type="password"
            placeholder={keySaved
              ? 'Key saved — enter a new key to replace'
              : provider.keyPlaceholder}
            autocomplete="off"
            spellcheck="false"
            bind:value={key}
          />
        </label>
        <p class="field-help">
          {keySaved
            ? 'A key is saved for this provider. It is never shown again.'
            : 'Stored only in this browser.'}
        </p>

        <p class="security-note">
          Browser storage is not a vault. Use a scoped key and do not share this device. Requests go
          directly from this browser to {provider.label}; there is no Bunkai server. AI output can
          be wrong — verify it before saving.
        </p>

        <a class="key-link" href={provider.keyUrl} target="_blank" rel="noreferrer">
          Get a {provider.label} key ↗
        </a>

        <div class="actions">
          <button class="button button-primary" type="submit">Save</button>
          <button
            class="button button-secondary"
            type="button"
            disabled={!canTest}
            onclick={handleTest}
          >
            {testing ? 'Testing…' : 'Test connection'}
          </button>
          <button
            class="button button-ghost"
            type="button"
            disabled={!keySaved}
            onclick={handleRemove}
          >
            Remove key
          </button>
        </div>

        {#if status.message}
          <p
            class="status"
            class:is-error={status.kind === 'error'}
            class:is-success={status.kind === 'success'}
            role="status"
            aria-live="polite"
          >
            {status.message}
          </p>
        {/if}
      </form>
    </div>
  </div>
</div>

<style>
  .settings-layer {
    position: fixed;
    inset: 0;
    z-index: 40;
    pointer-events: none;
  }

  .settings-scrim {
    position: fixed;
    top: 52px;
    right: 0;
    bottom: 0;
    left: 0;
    padding: 0;
    border: 0;
    background: color-mix(in srgb, var(--ink) 28%, transparent);
    cursor: pointer;
    pointer-events: auto;
    animation: settings-scrim-in 160ms ease-out;
  }

  .settings-panel {
    position: fixed;
    top: 52px;
    right: 0;
    bottom: 0;
    display: flex;
    width: min(380px, 92vw);
    flex-direction: column;
    border-left: 1px solid var(--line-strong);
    background: var(--surface-2);
    box-shadow: -8px 0 32px rgba(60, 45, 25, 0.18);
    pointer-events: auto;
    animation: settings-panel-in 200ms var(--ease-out);
  }

  :global(:root[data-theme='dark']) .settings-panel {
    box-shadow: -8px 0 32px rgba(0, 0, 0, 0.32);
  }

  .settings-head {
    display: flex;
    flex: 0 0 auto;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 18px 14px;
    border-bottom: 1px solid var(--line);
  }

  .settings-title {
    margin-top: 4px;
    color: var(--ink);
    font-family: var(--font-reading);
    font-size: 22px;
    font-weight: 600;
    line-height: 1.2;
  }

  .settings-body {
    min-height: 0;
    flex: 1 1 auto;
    padding: 16px 18px 24px;
  }

  .settings-lede {
    max-width: 46ch;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.45;
    text-wrap: pretty;
  }

  .settings-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 16px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
  }

  .field-label {
    color: var(--muted);
    font-size: var(--fs-label);
    font-weight: 500;
    letter-spacing: 0.06em;
    line-height: var(--lh-label);
    text-transform: uppercase;
  }

  .field input,
  .field select {
    width: 100%;
    height: 38px;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: var(--r-btn);
    background: var(--surface);
    color: var(--ink);
    font-family: var(--font-ui);
    font-size: 14px;
  }

  .field select {
    cursor: pointer;
  }

  .field input:focus,
  .field select:focus {
    border-color: var(--accent);
    outline: none;
  }

  .field input::placeholder {
    color: var(--muted);
  }

  .field-help,
  .provider-note {
    color: var(--muted);
    font-size: 12px;
    line-height: 1.45;
    text-wrap: pretty;
  }

  .provider-note {
    margin-top: 2px;
  }

  .security-note {
    margin-top: 10px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--r-note);
    color: var(--muted);
    font-size: 12px;
    line-height: 1.5;
    text-wrap: pretty;
  }

  .key-link {
    align-self: flex-start;
    color: var(--accent);
    font-size: 12px;
    text-decoration: none;
  }

  .key-link:hover {
    text-decoration: underline;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }

  .button {
    display: inline-flex;
    min-height: 34px;
    align-items: center;
    justify-content: center;
    padding: 0 14px;
    border: 1px solid transparent;
    border-radius: var(--r-btn);
    font-size: 13px;
    font-weight: 500;
  }

  .button-primary {
    background: var(--accent);
    color: var(--accent-fg);
  }

  .button-primary:hover {
    background: color-mix(in srgb, var(--accent) 88%, var(--ink));
  }

  .button-secondary {
    border-color: var(--line);
    background: transparent;
    color: var(--ink);
  }

  .button-secondary:hover:not(:disabled) {
    border-color: var(--line-strong);
    background: var(--surface);
  }

  .button-ghost {
    color: var(--muted);
  }

  .button-ghost:hover:not(:disabled) {
    background: var(--surface);
    color: var(--ink);
  }

  .button:disabled {
    cursor: default;
    opacity: 0.42;
  }

  .status {
    margin-top: 12px;
    padding: 9px 11px;
    border: 1px solid var(--line);
    border-radius: var(--r-btn);
    background: var(--surface);
    color: var(--ink);
    font-size: 12px;
    line-height: 1.45;
    text-wrap: pretty;
  }

  .status.is-success {
    border-color: var(--line-strong);
  }

  .status.is-error {
    border-color: var(--accent);
  }

  :global(:root[data-theme='dark']) .settings-panel {
    border-color: var(--line-strong);
  }

  :global(:root[data-theme='dark']) .settings-scrim {
    background: rgba(0, 0, 0, 0.55);
  }

  :global(:root[data-theme='dark']) .field input,
  :global(:root[data-theme='dark']) .field select,
  :global(:root[data-theme='dark']) .button-secondary,
  :global(:root[data-theme='dark']) .status {
    border-color: var(--line-strong);
  }

  @keyframes settings-scrim-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes settings-panel-in {
    from {
      opacity: 0;
      transform: translateX(14px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @media (max-width: 899px) {
    .settings-layer {
      display: none;
    }
  }
</style>
