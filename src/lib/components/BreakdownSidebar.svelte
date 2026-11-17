<script lang="ts">
  import { onMount } from 'svelte'
  import { referencesForChunk } from '../data/references'
  import { appState, closeNote, openNote, selectChunk } from '../stores/app.svelte'
  import { lookupForChunk } from '../tatoeba/lookup'
  import { animateScrim, animateSidebarPanel, animateSidebarRail } from '../utils/motion'
  import ConstructionTrace from './ConstructionTrace.svelte'
  import GrammarNote from './GrammarNote.svelte'
  import TatoebaExamples from './TatoebaExamples.svelte'

  let isDrawer = $state(false)
  let panelEl: HTMLElement | undefined = $state()
  let bodyEl: HTMLElement | undefined = $state()

  const session = $derived(appState.currentSession)
  const selectedChunk = $derived(
    session.chunks.find((chunk) => chunk.n === appState.selectedChunk) ?? session.chunks[0],
  )
  const references = $derived(referencesForChunk(selectedChunk))
  const aiExamples = $derived(
    selectedChunk.examples.filter((example) => (example.source ?? 'ai') === 'ai'),
  )
  const tatoebaLookup = $derived(lookupForChunk(selectedChunk))
  const showExamples = $derived(aiExamples.length > 0 || Boolean(tatoebaLookup.query))
  const isFirst = $derived(selectedChunk.n === 1)
  const isLast = $derived(selectedChunk.n === session.chunks.length)

  onMount(() => {
    const query = window.matchMedia('(min-width: 900px) and (max-width: 1099px)')
    const sync = () => {
      isDrawer = query.matches
    }

    sync()
    query.addEventListener('change', sync)

    return () => query.removeEventListener('change', sync)
  })

  $effect(() => {
    const sessionId = appState.currentSession.id
    const selected = appState.selectedChunk
    if (sessionId && selected > 0 && bodyEl) bodyEl.scrollTop = 0
  })

  $effect(() => {
    if (!isDrawer || !appState.noteOpen) return

    const panel = panelEl
    if (!panel) return
    const root: HTMLElement = panel

    const focusFirst = () => getFocusable(root)[0]?.focus()
    focusFirst()

    function handleTab(event: KeyboardEvent): void {
      if (event.key !== 'Tab') return

      const items = getFocusable(root)
      if (items.length === 0) return

      const first = items[0]
      const last = items[items.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === first || !root.contains(document.activeElement)) {
          event.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last || !root.contains(document.activeElement)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  })

  function getFocusable(root: HTMLElement): HTMLElement[] {
    return Array.from(
      root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.getClientRects().length > 0)
  }

  function pad(n: number): string {
    return String(n).padStart(2, '0')
  }
</script>

<aside
  class="sidebar"
  data-testid="breakdown-sidebar"
  aria-label="Chunk breakdown"
  data-open={appState.noteOpen ? 'true' : 'false'}
>
  {#if isDrawer}
    <button
      class="drawer-scrim"
      type="button"
      tabindex="-1"
      aria-label="Close breakdown"
      aria-hidden={appState.noteOpen ? undefined : 'true'}
      inert={!appState.noteOpen}
      data-testid="drawer-scrim"
      use:animateScrim={appState.noteOpen}
      onclick={closeNote}
    ></button>
  {/if}

  <div
    class="sidebar-panel"
    data-testid="sidebar-panel"
    bind:this={panelEl}
    use:animateSidebarPanel={{ open: appState.noteOpen, drawer: isDrawer }}
    role={isDrawer && appState.noteOpen ? 'dialog' : undefined}
    aria-modal={isDrawer && appState.noteOpen ? 'true' : undefined}
    aria-hidden={appState.noteOpen ? undefined : 'true'}
    inert={!appState.noteOpen}
    aria-label="Chunk breakdown"
  >
    <header class="sidebar-head">
      <div class="kicker">
        <span class="swatch c{selectedChunk.color}" aria-hidden="true"></span>
        <span class="panel-label">Chunk {pad(selectedChunk.n)}</span>
        <button
          class="icon-btn close-btn"
          type="button"
          aria-label="Collapse note"
          title="Collapse note (Esc)"
          onclick={closeNote}
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
      </div>

      <p class="sidebar-jp" lang="ja">{selectedChunk.jp}</p>
      {#if selectedChunk.kana}
        <p class="sidebar-kana" lang="ja">{selectedChunk.kana}</p>
      {/if}
      {#if selectedChunk.gloss}
        <p class="sidebar-gloss">{selectedChunk.gloss}</p>
      {/if}
    </header>

    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="sidebar-body scroll-region"
      role="region"
      tabindex="0"
      aria-label="Breakdown details"
      data-testid="sidebar-body"
      bind:this={bodyEl}
    >
      <div class="field">
        <p class="field-label">Role</p>
        <p class="field-value">{selectedChunk.role || '—'}</p>
      </div>

      {#if selectedChunk.construction.length > 0}
        <section class="bd-section">
          <p class="sec-label">Construction</p>
          <ConstructionTrace steps={selectedChunk.construction} color={selectedChunk.color} />
        </section>
      {/if}

      {#if showExamples}
        <section class="bd-section">
          <p class="sec-label">Examples</p>
          <TatoebaExamples
            lookup={tatoebaLookup}
            fallbackExamples={aiExamples}
            sessionSentence={session.sentence}
            active={appState.noteOpen}
          />
        </section>
      {/if}

      {#if selectedChunk.note}
        <section class="bd-section">
          <p class="sec-label">Grammar note</p>
          <GrammarNote note={selectedChunk.note} />
        </section>
      {/if}

      {#if references.length > 0}
        <section class="bd-section" data-testid="chunk-references">
          <p class="sec-label">Guides</p>
          <ul class="ref-list">
            {#each references as reference (reference.source + reference.label)}
              <li class="ref-item">
                {#if reference.url}
                  <a class="ref-link" href={reference.url} target="_blank" rel="noreferrer">
                    {reference.source} · {reference.label}
                  </a>
                {:else}
                  <span class="ref-link">{reference.source} · {reference.label}</span>
                {/if}
                <span class="ref-detail">{reference.detail}</span>
              </li>
            {/each}
          </ul>
          {#if references.some((reference) => reference.source === 'Cure Dolly')}
            <p class="ref-archive">
              <a href="https://github.com/Kellenok/cure-script" target="_blank" rel="noreferrer">
                Cure Dolly transcript archive (GitHub)
              </a>
            </p>
          {/if}
        </section>
      {/if}
    </div>

    <footer class="sidebar-foot">
      <div class="pager">
        <button
          class="pager-btn"
          type="button"
          aria-label="Previous chunk"
          disabled={isFirst}
          onclick={() => selectChunk(selectedChunk.n - 1)}
        >
          ‹ Prev
        </button>
        <span class="pager-count" data-testid="sidebar-pager">
          {pad(selectedChunk.n)} / {pad(session.chunks.length)}
        </span>
        <button
          class="pager-btn"
          type="button"
          aria-label="Next chunk"
          disabled={isLast}
          onclick={() => selectChunk(selectedChunk.n + 1)}
        >
          Next ›
        </button>
      </div>
    </footer>
  </div>

  <div
    class="sidebar-rail"
    data-testid="sidebar-rail"
    use:animateSidebarRail={appState.noteOpen}
    aria-hidden={appState.noteOpen ? 'true' : undefined}
    inert={appState.noteOpen}
  >
    <span class="rail-chunk c{selectedChunk.color}">{pad(selectedChunk.n)}</span>
    <button
      class="icon-btn"
      type="button"
      aria-label="Expand breakdown"
      title="Expand breakdown"
      onclick={openNote}
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
</aside>

<style>
  .sidebar {
    min-width: 0;
    height: 100%;
  }

  .sidebar-panel {
    display: flex;
    height: 100%;
    min-height: 0;
    flex-direction: column;
    border-left: 1px solid var(--line);
    background: var(--surface-2);
    box-shadow: var(--shadow-panel);
  }

  .sidebar-head {
    flex: 0 0 auto;
    padding: 16px 18px 12px;
    border-bottom: 1px solid var(--line);
    background: var(--surface-2);
  }

  .kicker {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .swatch {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    background: var(--cc, var(--line));
  }

  .close-btn {
    width: 30px;
    height: 30px;
    margin-left: auto;
  }

  .sidebar-jp {
    overflow-wrap: anywhere;
    color: var(--ink);
    font-family: var(--font-jp);
    font-size: 18px;
    line-height: 1.5;
  }

  .sidebar-kana {
    overflow-wrap: anywhere;
    color: var(--kana-ink);
    font-family: var(--font-jp);
    font-size: var(--fs-kana);
    line-height: var(--lh-kana);
  }

  .sidebar-gloss {
    margin-top: 8px;
    color: var(--muted);
    font-family: var(--font-reading);
    font-size: 16px;
    font-style: italic;
    line-height: 1.4;
    text-wrap: pretty;
  }

  .sidebar-body {
    min-height: 0;
    flex: 1 1 auto;
    padding: 16px 18px;
  }

  .field-label {
    margin-bottom: 4px;
    color: var(--muted);
    font-size: var(--fs-label);
    letter-spacing: 0.06em;
    line-height: var(--lh-label);
    text-transform: uppercase;
  }

  .field-value {
    color: var(--ink);
    font-size: 14px;
    line-height: 1.5;
  }

  .bd-section {
    margin-top: 26px;
    padding-top: 22px;
    border-top: 1px solid var(--line);
  }

  .ref-list {
    display: flex;
    flex-direction: column;
    gap: 9px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ref-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-top: 9px;
    border-top: 1px dashed var(--line);
  }

  .ref-item:first-child {
    padding-top: 0;
    border-top: 0;
  }

  .ref-link {
    color: var(--accent);
    font-size: 12px;
    line-height: 1.4;
    overflow-wrap: anywhere;
    text-decoration: none;
  }

  a.ref-link:hover {
    text-decoration: underline;
  }

  .ref-detail {
    color: var(--muted);
    font-size: 11px;
    line-height: 1.35;
    text-wrap: pretty;
  }

  .ref-archive {
    margin-top: 10px;
    padding-top: 9px;
    border-top: 1px dashed var(--line);
    font-size: 11px;
    line-height: 1.4;
  }

  .ref-archive a {
    color: var(--accent);
    text-decoration: none;
  }

  .ref-archive a:hover {
    text-decoration: underline;
  }

  .sidebar-foot {
    flex: 0 0 auto;
    padding: 12px 18px;
    border-top: 1px solid var(--line);
    background: var(--surface-2);
  }

  .pager {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .pager-btn {
    display: inline-flex;
    min-height: 30px;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    border-radius: var(--r-btn);
    color: var(--muted);
    font-size: 12px;
  }

  .pager-btn:hover:not(:disabled) {
    background: var(--surface-2);
    color: var(--ink);
  }

  .pager-btn:disabled {
    background: transparent;
    color: var(--muted);
    cursor: default;
    opacity: 0.4;
  }

  .pager-count {
    color: var(--muted);
    font-family: var(--font-data);
    font-size: var(--fs-data);
    line-height: var(--lh-data);
  }

  .sidebar-rail {
    display: flex;
    height: 100%;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding-top: 14px;
    border-left: 1px solid var(--line);
    background: var(--surface-2);
    box-shadow: var(--shadow-panel);
  }

  .rail-chunk {
    display: grid;
    width: 26px;
    height: 26px;
    place-items: center;
    border: 1px solid var(--cc);
    border-radius: 999px;
    background: color-mix(in srgb, var(--cc) var(--tint-pct), transparent);
    color: var(--ink);
    font-family: var(--font-data);
    font-size: var(--fs-data);
  }

  .drawer-scrim {
    position: fixed;
    top: 52px;
    right: 0;
    bottom: 0;
    left: var(--history-w, 240px);
    z-index: 21;
    padding: 0;
    border: 0;
    background: color-mix(in srgb, var(--ink) 22%, transparent);
    cursor: pointer;
  }

  :global(:root[data-theme='dark']) .drawer-scrim {
    background: rgba(0, 0, 0, 0.52);
  }

  @media (min-width: 900px) and (max-width: 1099px) {
    .sidebar-panel {
      position: fixed;
      top: 52px;
      right: 0;
      bottom: 0;
      z-index: 22;
      width: min(340px, 90vw);
      height: auto;
      border-radius: var(--r-sheet) 0 0 var(--r-sheet);
      box-shadow: -8px 0 32px rgba(60, 45, 25, 0.18);
    }

    :global(:root[data-theme='dark']) .sidebar-panel {
      box-shadow: -8px 0 32px rgba(0, 0, 0, 0.32);
    }
  }

  @media (min-width: 1100px) {
    .sidebar {
      position: relative;
      overflow: hidden;
    }

    .sidebar-panel {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: 1;
      width: var(--sidebar-open-w, 300px);
      height: auto;
    }

    .sidebar-rail {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: 0;
      width: 44px;
      height: auto;
    }
  }
</style>
