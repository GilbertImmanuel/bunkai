<script lang="ts">
  import { tick } from 'svelte'
  import { appState, goHome, openSession, toggleHistory } from '../stores/app.svelte'
  import { deleteSession, historyState, undoDeletedSession } from '../stores/history.svelte'
  import { showToast } from '../stores/toast.svelte'
  import {
    buildHistoryEntries,
    filterHistoryEntries,
    groupHistoryEntries,
    type HistoryEntry,
  } from '../utils/history'
  import { clearLastSessionId } from '../utils/persistence'

  let query = $state('')
  let menuSessionId = $state<string | null>(null)
  let menuButton: HTMLButtonElement | undefined = $state()
  let menuPanel: HTMLElement | undefined = $state()
  let menuPosition = $state({ top: 0, left: 0 })

  const entries = $derived(buildHistoryEntries(historyState.sessions))
  const filteredGroups = $derived(groupHistoryEntries(filterHistoryEntries(entries, query)))
  const activeSessionId = $derived(
    appState.view === 'workspace' ? appState.currentSession.id : null,
  )

  function openHistoryItem(entry: HistoryEntry): void {
    closeMenu()
    openSession(entry.session)
  }

  async function startNewBreakdown(): Promise<void> {
    closeMenu()
    query = ''
    clearLastSessionId()
    goHome()
    await tick()
    document.getElementById('paste-input')?.focus()
  }

  function closeMenu(focus = false): void {
    if (!menuSessionId) return
    menuSessionId = null

    if (focus) {
      void tick().then(() => menuButton?.focus())
    }
  }

  function positionMenu(): void {
    if (!menuButton) return

    const rect = menuButton.getBoundingClientRect()
    const menuWidth = menuPanel?.offsetWidth ?? 156
    const menuHeight = menuPanel?.offsetHeight ?? 38
    const margin = 8
    const gap = 6

    const left = Math.min(
      Math.max(margin, rect.right - menuWidth),
      window.innerWidth - menuWidth - margin,
    )
    let top = rect.bottom + gap
    if (top + menuHeight > window.innerHeight - margin) {
      top = rect.top - menuHeight - gap
    }

    menuPosition = { top, left }
  }

  async function toggleMenu(event: MouseEvent, entry: HistoryEntry): Promise<void> {
    if (menuSessionId === entry.id) {
      closeMenu(true)
      return
    }

    menuSessionId = entry.id
    menuButton = event.currentTarget as HTMLButtonElement
    await tick()
    positionMenu()
    menuPanel?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }

  async function deleteMenuSession(): Promise<void> {
    const sessionId = menuSessionId
    if (!sessionId) return

    menuSessionId = null
    menuButton = undefined
    const result = await deleteSession(sessionId)
    await tick()
    document.querySelector<HTMLElement>('[data-testid="history-list"]')?.focus()
    showToast(
      result.persisted ? 'Query deleted' : 'Query deleted for this tab only',
      'Undo',
      undoDeletedSession,
    )
  }

  function handleWindowPointerDown(event: PointerEvent): void {
    if (!menuSessionId) return
    const target = event.target as Node
    if (menuButton?.contains(target) || menuPanel?.contains(target)) return
    closeMenu()
  }

  function handleWindowKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !menuSessionId) return
    event.preventDefault()
    closeMenu(true)
  }

  $effect(() => {
    if (!appState.historyOpen && menuSessionId) menuSessionId = null
  })
</script>

<svelte:window
  onpointerdown={handleWindowPointerDown}
  onkeydown={handleWindowKeydown}
  onresize={() => closeMenu()}
/>

<aside class="history" id="history-panel" data-testid="history-panel" aria-label="History">
  {#if appState.historyOpen}
    <div class="history-inner">
      <header class="history-head">
        <div class="history-title-row">
          <span class="panel-label">History</span>
          <button
            class="icon-btn"
            type="button"
            aria-label="Collapse history"
            title="Collapse history"
            onclick={toggleHistory}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        </div>

        <div class="search">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" />
          </svg>
          <input
            type="text"
            placeholder="Search sessions…"
            aria-label="Search sessions"
            bind:value={query}
            oninput={() => closeMenu()}
          />
        </div>

        <button
          class="new-breakdown"
          type="button"
          aria-label="Start a new breakdown"
          onclick={startNewBreakdown}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          New breakdown
        </button>
      </header>

      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div
        class="history-scroll scroll-region"
        role="region"
        tabindex="0"
        aria-label="History sessions"
        data-testid="history-list"
        onscroll={() => closeMenu()}
      >
        {#if historyState.storageWarning}
          <p class="history-warning" role="status">{historyState.storageWarning}</p>
        {/if}

        {#if !historyState.loaded}
          <p class="history-empty">Loading sessions…</p>
        {:else if filteredGroups.length === 0}
          <p class="history-empty">
            {entries.length === 0 ? 'No saved sessions yet.' : 'No matching sessions.'}
          </p>
        {:else}
          {#each filteredGroups as group (group.group)}
            <p class="history-group">{group.group}</p>
            {#each group.items as entry (entry.id)}
              <div class="history-item" class:is-active={activeSessionId === entry.sessionId}>
                <button
                  class="history-open"
                  class:is-active={activeSessionId === entry.sessionId}
                  type="button"
                  aria-current={activeSessionId === entry.sessionId ? 'true' : undefined}
                  data-history-id={entry.id}
                  onclick={() => openHistoryItem(entry)}
                >
                  <span class="history-preview" lang="ja">{entry.preview}</span>
                  <span class="history-meta">
                    <span class="history-time">{entry.time}</span>
                    <span class="history-count"
                      >{entry.count} {entry.count === 1 ? 'chunk' : 'chunks'}</span
                    >
                  </span>
                </button>

                <button
                  class="history-menu-trigger"
                  type="button"
                  aria-label={`Query options for ${entry.preview}`}
                  aria-haspopup="menu"
                  aria-expanded={menuSessionId === entry.id}
                  title="Query options"
                  data-history-menu={entry.id}
                  onclick={(event) => void toggleMenu(event, entry)}
                >
                  <span class="history-strip" aria-hidden="true">
                    {#each entry.colors as color, index (index)}
                      <i class="c{color}"></i>
                    {/each}
                  </span>
                </button>
              </div>
            {/each}
          {/each}
        {/if}
      </div>
    </div>
  {:else}
    <div class="history-rail">
      <button
        class="icon-btn"
        type="button"
        aria-label="Expand history"
        title="Expand history"
        onclick={toggleHistory}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
      <span class="rail-label">History</span>
    </div>
  {/if}
</aside>

{#if appState.historyOpen && menuSessionId}
  <div
    class="history-menu"
    role="menu"
    aria-label="Query options"
    data-testid="history-menu"
    bind:this={menuPanel}
    style:top={`${menuPosition.top}px`}
    style:left={`${menuPosition.left}px`}
  >
    <button class="history-menu-item" type="button" role="menuitem" onclick={deleteMenuSession}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13M10 11v6M14 11v6" />
      </svg>
      Delete query
    </button>
  </div>
{/if}

<style>
  .history {
    display: flex;
    min-width: 0;
    flex-direction: column;
    overflow: hidden;
    border-right: 1px solid var(--line);
    background: var(--surface-2);
    box-shadow: var(--shadow-panel);
  }

  .history-inner {
    display: flex;
    min-height: 0;
    flex: 1 1 auto;
    flex-direction: column;
  }

  .history-head {
    flex: 0 0 auto;
    padding: 14px 14px 10px;
  }

  .history-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .search {
    display: flex;
    height: 32px;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    padding: 0 10px;
    border: 1px solid var(--control-line);
    border-radius: var(--r-btn);
    background: var(--bg);
    color: var(--muted);
  }

  .search:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  .search svg {
    width: 14px;
    height: 14px;
    flex: 0 0 auto;
  }

  .search input {
    width: 100%;
    min-width: 0;
    border: 0;
    background: transparent;
    color: var(--ink);
    font-family: var(--font-ui);
    font-size: 13px;
  }

  .search input:focus {
    outline: none;
  }

  .search input::placeholder {
    color: var(--muted);
  }

  .new-breakdown {
    display: flex;
    width: 100%;
    min-height: 32px;
    align-items: center;
    justify-content: center;
    gap: 7px;
    margin-top: 10px;
    border: 1px dashed var(--control-line);
    border-radius: var(--r-btn);
    background: transparent;
    color: var(--muted);
    font-size: 13px;
    font-weight: 500;
    transition:
      background 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease;
  }

  .new-breakdown:hover {
    border-color: var(--accent);
    background: var(--surface);
    color: var(--accent);
  }

  .new-breakdown svg {
    width: 14px;
    height: 14px;
  }

  .history-scroll {
    min-height: 0;
    flex: 1 1 auto;
    padding: 4px 10px 12px;
  }

  .history-group {
    padding: 12px 4px 6px;
    color: var(--muted);
    font-size: var(--fs-data);
    font-weight: 500;
    letter-spacing: 0.04em;
    line-height: var(--lh-data);
  }

  .history-item {
    position: relative;
    width: 100%;
    margin-bottom: 6px;
    border: 1px solid transparent;
    border-radius: var(--r-hl);
    transition: background 0.15s ease;
  }

  .history-item:hover {
    background: var(--surface-2);
  }

  :global([data-theme='dark']) .history-item:hover {
    background: color-mix(in srgb, var(--surface-2) 88%, var(--ink));
  }

  .history-item.is-active {
    background: var(--accent-soft);
  }

  .history-open {
    display: flex;
    width: 100%;
    flex-direction: column;
    gap: 8px;
    padding: 10px 42px 10px 12px;
    border: 0;
    background: transparent;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .history-open:focus-visible {
    border-radius: var(--r-hl);
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  .history-preview {
    display: -webkit-box;
    overflow: hidden;
    color: var(--ink);
    font-family: var(--font-jp);
    font-size: 14px;
    line-height: 1.55;
    overflow-wrap: anywhere;
    word-break: keep-all;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .history-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .history-time,
  .history-count {
    color: var(--muted);
    font-family: var(--font-data);
    font-size: var(--fs-data);
    line-height: var(--lh-data);
  }

  .history-menu-trigger {
    position: absolute;
    right: 8px;
    bottom: 8px;
    display: inline-flex;
    width: 30px;
    height: 24px;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--r-btn);
    background: transparent;
    cursor: pointer;
    transition:
      background 0.15s ease,
      border-color 0.15s ease;
  }

  .history-menu-trigger:hover {
    border-color: var(--line);
    background: var(--surface);
  }

  .history-menu-trigger[aria-expanded='true'] {
    border-color: var(--line-strong);
    background: var(--surface);
  }

  .history-menu-trigger:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  .history-strip {
    display: flex;
    gap: 2px;
  }

  .history-strip i {
    width: 6px;
    height: 6px;
    border-radius: 2px;
    background: var(--cc);
  }

  .history-menu {
    position: fixed;
    z-index: 80;
    width: 156px;
    padding: 4px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-note);
    background: var(--surface-2);
    box-shadow: 0 12px 30px rgba(60, 45, 25, 0.18);
  }

  :global(:root[data-theme='dark']) .history-menu {
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
  }

  .history-menu-item {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: var(--r-btn);
    color: var(--ink);
    font-size: 13px;
    text-align: left;
  }

  .history-menu-item:hover {
    background: var(--surface);
  }

  .history-menu-item:focus-visible {
    background: var(--surface);
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  .history-menu-item svg {
    width: 14px;
    height: 14px;
    flex: 0 0 auto;
    color: var(--muted);
  }

  .history-empty {
    padding: 12px 4px;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.4;
  }

  .history-warning {
    margin: 4px 4px 10px;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: var(--r-note);
    background: var(--surface);
    color: var(--muted);
    font-size: 12px;
    line-height: 1.4;
  }

  .history-rail {
    display: flex;
    height: 100%;
    flex: 1 1 auto;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding-top: 12px;
  }

  .rail-label {
    color: var(--muted);
    font-size: var(--fs-data);
    letter-spacing: 0.14em;
    text-orientation: mixed;
    text-transform: uppercase;
    writing-mode: vertical-rl;
  }
</style>
