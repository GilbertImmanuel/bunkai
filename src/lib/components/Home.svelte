<script lang="ts">
  import { aiErrorMessage } from '../ai/breakdown'
  import { sampleSession } from '../data/sample'
  import { createManualSession } from '../data/sessions'
  import { MAX_LONG_TEXT_LENGTH } from '../data/sessionValidation'
  import {
    activeAiMissingProxy,
    activeAiReady,
    activeModel,
    activeProvider,
    generateWithAi,
    openAiSettings,
  } from '../stores/ai.svelte'
  import { openSession } from '../stores/app.svelte'
  import { saveSession, undoLastSave } from '../stores/history.svelte'
  import { showToast } from '../stores/toast.svelte'

  let value = $state('')
  let submitting = $state(false)
  let aiError = $state('')

  const provider = $derived(activeProvider())
  const model = $derived(activeModel())
  const aiReady = $derived(activeAiReady())
  const missingProxy = $derived(activeAiMissingProxy())
  const canSend = $derived(
    value.trim().length > 0 && value.trim().length <= MAX_LONG_TEXT_LENGTH && !submitting,
  )

  function openSample(): void {
    if (submitting) return
    openSession(sampleSession, 5)
  }

  function openManualPlaceholder(): void {
    const sentence = value.trim()
    if (!sentence || sentence.length > MAX_LONG_TEXT_LENGTH) return

    openSession(createManualSession(sentence), 1)
    value = ''
    aiError = ''
  }

  async function submitSentence(event: SubmitEvent): Promise<void> {
    event.preventDefault()
    const sentence = value.trim()
    if (!sentence || sentence.length > MAX_LONG_TEXT_LENGTH || submitting) return

    submitting = true
    aiError = ''

    try {
      if (!aiReady) {
        await new Promise((resolve) => setTimeout(resolve, 320))
        openSession(createManualSession(sentence), 1)
        value = ''
        return
      }

      const session = await generateWithAi(sentence)
      const result = await saveSession(session)
      openSession(session, 1)
      value = ''

      if (result.added) {
        showToast(
          result.persisted
            ? 'AI breakdown saved to history'
            : 'AI breakdown saved for this tab only',
          'Undo',
          undoLastSave,
        )
      }
    } catch (error) {
      aiError = aiErrorMessage(error)
    } finally {
      submitting = false
    }
  }
</script>

<section class="home" aria-labelledby="home-title" data-testid="home-view">
  <div class="home-col">
    <h1 class="home-title" id="home-title">Read a sentence, see its pieces.</h1>
    <p class="home-sub">Paste a sentence or open the sample to read it in colored chunks.</p>

    <button
      class="sample-card"
      type="button"
      data-testid="sample-card"
      disabled={submitting}
      onclick={openSample}
    >
      <span class="sample-card-top">
        <span class="sample-label">Sample</span>
        <span class="sample-link">Open sample <span aria-hidden="true">→</span></span>
      </span>
      <span class="sample-sentence" lang="ja"
        >{#each sampleSession.chunks as chunk (chunk.n)}<span class="chunk is-static c{chunk.color}"
            >{chunk.jp}</span
          >{/each}</span
      >
    </button>

    <form class="combo-input" aria-busy={submitting} onsubmit={submitSentence}>
      <input
        class="combo-field"
        id="paste-input"
        type="text"
        maxlength={MAX_LONG_TEXT_LENGTH}
        placeholder="Paste a Japanese sentence…"
        aria-label="Japanese sentence"
        autocomplete="off"
        lang="ja"
        disabled={submitting}
        oninput={() => {
          if (aiError) aiError = ''
        }}
        bind:value
      />
      <button
        class="combo-send"
        class:is-loading={submitting}
        type="submit"
        aria-label={submitting ? 'Building breakdown' : 'Break down sentence'}
        disabled={!canSend}
      >
        {#if submitting}
          <span class="spinner" aria-hidden="true"></span>
        {:else}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        {/if}
      </button>
    </form>

    {#if aiError}
      <div class="ai-error" role="alert" data-testid="ai-error">
        <p class="ai-error-label">AI request failed</p>
        <p class="ai-error-message">{aiError}</p>
        <div class="ai-error-actions">
          <button class="text-link" type="button" onclick={openAiSettings}> AI settings </button>
          <button class="text-link" type="button" onclick={openManualPlaceholder}>
            Open manual placeholder
          </button>
        </div>
      </div>
    {:else if submitting}
      <p class="ai-meta" role="status" aria-live="polite" data-testid="ai-loading">
        {aiReady ? `Building breakdown with ${provider.label}…` : 'Preparing workspace…'}
      </p>
    {:else if aiReady}
      <p class="ai-meta" data-testid="ai-status">
        AI breakdown via {provider.label} · <span class="ai-model">{model}</span>
        <button class="text-link" type="button" onclick={openAiSettings}>Settings</button>
      </p>
    {:else if missingProxy}
      <p class="ai-meta" data-testid="ai-status">
        OpenCode proxy required for AI ·
        <button class="text-link" type="button" onclick={openAiSettings}>AI settings</button>
      </p>
    {:else}
      <p class="ai-meta" data-testid="ai-status">
        Sample mode ·
        <button class="text-link" type="button" onclick={openAiSettings}>Add an AI key</button>
      </p>
    {/if}
  </div>
</section>

<style>
  .home {
    display: flex;
    min-height: 0;
    flex: 1 1 auto;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 32px 24px;
  }

  .home-col {
    width: 100%;
    max-width: 720px;
  }

  .home-title {
    color: var(--ink);
    font-family: var(--font-ui);
    font-size: 22px;
    font-weight: 500;
    line-height: 1.3;
    text-wrap: balance;
  }

  .home-sub {
    margin-top: 10px;
    color: var(--muted);
    font-size: 14px;
    line-height: 1.5;
  }

  .sample-card {
    display: flex;
    width: 100%;
    flex-direction: column;
    gap: 14px;
    margin-top: 26px;
    padding: 18px 20px;
    border: 1px solid var(--line);
    border-radius: var(--r-sheet);
    background: var(--surface);
    text-align: left;
    transition:
      background 0.15s ease,
      border-color 0.15s ease;
  }

  .sample-card:hover {
    border-color: var(--accent);
  }

  .sample-card:disabled {
    cursor: default;
    opacity: 0.62;
  }

  .sample-card:disabled:hover {
    border-color: var(--line);
  }

  .sample-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .sample-label {
    color: var(--muted);
    font-size: var(--fs-label);
    letter-spacing: 0.06em;
    line-height: var(--lh-label);
    text-transform: uppercase;
  }

  .sample-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--accent);
    font-size: 13px;
    white-space: nowrap;
  }

  .sample-sentence {
    overflow-wrap: break-word;
    color: var(--ink);
    font-family: var(--font-jp);
    font-size: var(--fs-jp);
    line-height: 1.9;
    word-break: keep-all;
  }

  .combo-input {
    display: flex;
    height: 56px;
    align-items: center;
    gap: 10px;
    margin-top: 14px;
    padding: 0 8px 0 18px;
    border: 1px solid var(--line);
    border-radius: var(--r-note);
    background: var(--surface);
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .combo-input:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  .combo-field {
    min-width: 0;
    height: 100%;
    flex: 1 1 auto;
    border: 0;
    background: transparent;
    color: var(--ink);
    font-family: var(--font-jp);
    font-size: 16px;
  }

  .combo-field:focus {
    outline: none;
  }

  .combo-field:disabled {
    cursor: wait;
  }

  .combo-field::placeholder {
    color: var(--muted);
    font-family: var(--font-ui);
  }

  .combo-send {
    display: grid;
    width: 40px;
    height: 40px;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 999px;
    background: var(--accent);
    color: var(--accent-fg);
    transition:
      background 0.15s ease,
      opacity 0.15s ease;
  }

  .combo-send:disabled {
    cursor: default;
    opacity: 0.32;
  }

  .combo-send.is-loading {
    cursor: wait;
    opacity: 1;
  }

  .combo-send:not(:disabled):hover {
    background: color-mix(in srgb, var(--accent) 88%, var(--ink));
  }

  .combo-send svg {
    width: 18px;
    height: 18px;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid color-mix(in srgb, var(--accent-fg) 38%, transparent);
    border-top-color: var(--accent-fg);
    border-radius: 50%;
    animation: spin 700ms linear infinite;
  }

  .ai-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px;
    margin-top: 10px;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.5;
    text-wrap: pretty;
  }

  .ai-model {
    color: var(--muted);
    font-family: var(--font-data);
    font-size: 11px;
  }

  .text-link {
    padding: 0;
    color: var(--accent);
    font-size: 12px;
    text-align: left;
  }

  .text-link:hover {
    text-decoration: underline;
  }

  .ai-error {
    margin-top: 10px;
    padding: 10px 12px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-note);
    background: var(--surface);
  }

  .ai-error-label {
    color: var(--muted);
    font-size: var(--fs-data);
    font-weight: 500;
    letter-spacing: 0.05em;
    line-height: var(--lh-data);
    text-transform: uppercase;
  }

  .ai-error-message {
    margin-top: 4px;
    color: var(--ink);
    font-size: 13px;
    line-height: 1.5;
    text-wrap: pretty;
  }

  .ai-error-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 8px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
