<script lang="ts">
  import { tick } from 'svelte'
  import {
    appState,
    goHome,
    toggleFurigana,
    toggleHistory,
    toggleTheme,
  } from '../stores/app.svelte'
  import { aiState, toggleAiSettings } from '../stores/ai.svelte'
  import { historyState, saveSession, undoLastSave } from '../stores/history.svelte'
  import { showToast } from '../stores/toast.svelte'

  let saving = $state(false)
  let furiOpen = $state(false)
  let furiWrap: HTMLElement | undefined = $state()
  let furiButton: HTMLButtonElement | undefined = $state()
  let furiMenu: HTMLElement | undefined = $state()

  const furiLabel = $derived(
    `Furigana: Name ${appState.furigana.name ? 'on' : 'off'}, Furigana ${
      appState.furigana.word ? 'on' : 'off'
    }`,
  )

  const isCurrentSaved = $derived(
    historyState.sessions.some((session) => session.id === appState.currentSession.id),
  )
  const saveDisabled = $derived(!historyState.loaded || isCurrentSaved || saving)

  $effect(() => {
    if (appState.view !== 'workspace') furiOpen = false
  })

  async function toggleFuriganaMenu(): Promise<void> {
    furiOpen = !furiOpen
    if (!furiOpen) return

    await tick()
    furiMenu?.querySelector<HTMLElement>('[role="switch"]')?.focus()
  }

  function handleWindowPointerDown(event: PointerEvent): void {
    if (!furiOpen || furiWrap?.contains(event.target as Node)) return
    furiOpen = false
  }

  function handleWindowKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !furiOpen) return
    event.preventDefault()
    furiOpen = false
    furiButton?.focus()
  }

  async function handleSave(): Promise<void> {
    if (saveDisabled) return
    saving = true

    try {
      const result = await saveSession(appState.currentSession)
      if (result.added) {
        showToast(
          result.persisted ? 'Saved to history' : 'Saved for this tab only',
          'Undo',
          undoLastSave,
        )
      }
    } catch {
      showToast('Could not save this session.')
    } finally {
      saving = false
    }
  }
</script>

<svelte:window onpointerdown={handleWindowPointerDown} onkeydown={handleWindowKeydown} />

<header class="topbar" data-testid="topbar">
  <div class="topbar-left">
    <button
      class="icon-btn"
      type="button"
      aria-label="Toggle history"
      aria-controls="history-panel"
      aria-expanded={appState.historyOpen}
      title="Toggle history"
      onclick={toggleHistory}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16" />
      </svg>
    </button>

    <button class="brand" type="button" aria-label="Bunkai home" onclick={goHome}>
      <span class="brand-mark" aria-hidden="true">文</span>
      <span class="brand-name">Bunkai</span>
    </button>
  </div>

  <div class="topbar-right">
    {#if appState.view === 'workspace'}
      <button class="btn btn-secondary" type="button" disabled={saveDisabled} onclick={handleSave}>
        {saving ? 'Saving…' : isCurrentSaved ? 'Saved' : 'Save'}
      </button>
      <div class="furi-wrap" bind:this={furiWrap}>
        <button
          class="icon-btn furi-btn"
          type="button"
          bind:this={furiButton}
          aria-label={furiLabel}
          aria-controls="furigana-menu"
          aria-expanded={furiOpen}
          title={furiLabel}
          onclick={toggleFuriganaMenu}
        >
          <span class="furi-glyph" aria-hidden="true">あ</span>
        </button>

        {#if furiOpen}
          <div
            class="furi-menu"
            id="furigana-menu"
            role="group"
            aria-label="Furigana settings"
            data-testid="furigana-menu"
            bind:this={furiMenu}
          >
            <p class="furi-menu-title">Furigana</p>

            <button
              class="furi-switch-row"
              type="button"
              role="switch"
              aria-checked={appState.furigana.name}
              onclick={() => toggleFurigana('name')}
            >
              <span class="furi-switch-label">Name</span>
              <span class="furi-track" aria-hidden="true">
                <span class="furi-thumb"></span>
              </span>
            </button>

            <button
              class="furi-switch-row"
              type="button"
              role="switch"
              aria-checked={appState.furigana.word}
              onclick={() => toggleFurigana('word')}
            >
              <span class="furi-switch-label">Furigana</span>
              <span class="furi-track" aria-hidden="true">
                <span class="furi-thumb"></span>
              </span>
            </button>

            <p class="furi-menu-hint">Name = proper nouns; Furigana = kanji words.</p>
          </div>
        {/if}
      </div>
    {/if}

    <button
      class="icon-btn"
      type="button"
      class:is-open={aiState.settingsOpen}
      aria-label="Settings"
      aria-haspopup="dialog"
      aria-expanded={aiState.settingsOpen}
      title="Settings"
      data-testid="settings-toggle"
      onclick={toggleAiSettings}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <path d="M4 7h16M4 12h16M4 17h16" />
        <circle cx="9" cy="7" r="2" />
        <circle cx="15" cy="12" r="2" />
        <circle cx="8" cy="17" r="2" />
      </svg>
    </button>

    <button
      class="icon-btn"
      type="button"
      aria-label={appState.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      aria-pressed={appState.theme === 'dark'}
      title="Toggle theme"
      onclick={toggleTheme}
    >
      <svg
        class="theme-icon-sun"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path
          d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        />
      </svg>
      <svg
        class="theme-icon-moon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
      </svg>
    </button>
  </div>
</header>

<style>
  .topbar {
    display: flex;
    flex: 0 0 52px;
    align-items: center;
    gap: 12px;
    height: 52px;
    padding: 0 14px;
    border-bottom: 1px solid var(--line);
    background: var(--surface);
  }

  .topbar-left {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 10px;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
  }

  .icon-btn.is-open {
    background: var(--accent-soft);
    color: var(--accent);
  }

  .brand-name {
    color: var(--ink);
    font-family: var(--font-reading);
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  .btn {
    display: inline-flex;
    min-height: 36px;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 16px;
    border: 1px solid transparent;
    border-radius: var(--r-btn);
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.01em;
    transition:
      background 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease;
  }

  .btn-secondary {
    border-color: var(--control-line);
    background: transparent;
    color: var(--ink);
  }

  .btn-secondary:hover:not(:disabled) {
    border-color: var(--muted);
    background: var(--surface-2);
  }

  .btn:disabled {
    cursor: default;
    opacity: 0.4;
  }

  .furi-wrap {
    position: relative;
  }

  .furi-glyph {
    font-family: var(--font-jp);
    font-size: 17px;
    font-weight: 500;
    line-height: 1;
  }

  .furi-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 60;
    width: 188px;
    padding: 6px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-note);
    background: var(--surface-2);
    box-shadow: 0 12px 30px rgba(60, 45, 25, 0.18);
  }

  :global(:root[data-theme='dark']) .furi-menu {
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
  }

  .furi-menu-title {
    padding: 4px 8px 6px;
    color: var(--muted);
    font-size: var(--fs-data);
    font-weight: 500;
    letter-spacing: 0.08em;
    line-height: var(--lh-data);
    text-transform: uppercase;
  }

  .furi-switch-row {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px;
    border-radius: calc(var(--r-note) - 6px);
    color: var(--ink);
    font-size: 13px;
    text-align: left;
  }

  .furi-switch-row:hover {
    background: var(--surface);
  }

  .furi-switch-row:focus-visible {
    background: var(--surface);
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  .furi-switch-label {
    font-weight: 500;
  }

  .furi-track {
    display: inline-flex;
    width: 30px;
    height: 16px;
    flex: 0 0 auto;
    align-items: center;
    padding: 2px;
    border-radius: 999px;
    background: var(--control-line);
    transition: background 0.15s ease;
  }

  .furi-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--surface);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    transition: transform 0.15s ease;
  }

  .furi-switch-row[aria-checked='true'] .furi-track {
    background: var(--accent);
  }

  .furi-switch-row[aria-checked='true'] .furi-thumb {
    transform: translateX(14px);
  }

  .furi-menu-hint {
    padding: 6px 8px 4px;
    color: var(--muted);
    font-size: 11px;
    line-height: 1.4;
    text-wrap: pretty;
  }
</style>
