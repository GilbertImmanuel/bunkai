<script lang="ts">
  import { tick } from 'svelte'
  import { appState, goHome, openSession, toggleHistory } from '../stores/app.svelte'
  import { historyState } from '../stores/history.svelte'
  import {
    buildHistoryEntries,
    filterHistoryEntries,
    groupHistoryEntries,
    type HistoryEntry,
  } from '../utils/history'
  import { clearLastSessionId } from '../utils/persistence'

  let query = $state('')

  const entries = $derived(buildHistoryEntries(historyState.sessions))
  const filteredGroups = $derived(groupHistoryEntries(filterHistoryEntries(entries, query)))

  function openHistoryItem(entry: HistoryEntry): void {
    openSession(entry.session)
  }

  async function startNewBreakdown(): Promise<void> {
    query = ''
    clearLastSessionId()
    goHome()
    await tick()
    document.getElementById('paste-input')?.focus()
  }
</script>

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
              <button
                class="history-item"
                class:is-active={appState.view === 'workspace' &&
                  appState.currentSession.id === entry.sessionId}
                type="button"
                data-history-id={entry.id}
                onclick={() => openHistoryItem(entry)}
              >
                <span class="history-preview" lang="ja">{entry.preview}</span>
                <span class="history-meta">
                  <span class="history-time">{entry.time}</span>
                  <span class="history-count"
                    >{entry.count} {entry.count === 1 ? 'chunk' : 'chunks'}</span
                  >
                  <span class="history-strip" aria-hidden="true">
                    {#each entry.colors as color, index (index)}
                      <i class="c{color}"></i>
                    {/each}
                  </span>
                </span>
              </button>
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
    border: 1px solid var(--line);
    border-radius: var(--r-btn);
    background: var(--bg);
    color: var(--muted);
  }

  .search:focus-within {
    border-color: var(--accent);
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
    border: 1px dashed var(--line);
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
    display: flex;
    width: 100%;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 6px;
    padding: 10px 12px;
    border: 1px solid transparent;
    border-radius: var(--r-note);
    text-align: left;
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

  .history-strip {
    display: flex;
    gap: 2px;
    margin-left: auto;
  }

  .history-strip i {
    width: 6px;
    height: 6px;
    border-radius: 2px;
    background: var(--cc);
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
    border-radius: var(--r-btn);
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
