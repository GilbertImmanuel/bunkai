<script lang="ts">
  import { onMount } from 'svelte'
  import AiSettingsDrawer from './lib/components/AiSettingsDrawer.svelte'
  import BreakdownSidebar from './lib/components/BreakdownSidebar.svelte'
  import DesktopGuard from './lib/components/DesktopGuard.svelte'
  import HistoryPanel from './lib/components/HistoryPanel.svelte'
  import Home from './lib/components/Home.svelte'
  import PwaUpdate from './lib/components/PwaUpdate.svelte'
  import ReadingSheet from './lib/components/ReadingSheet.svelte'
  import Toast from './lib/components/Toast.svelte'
  import TopBar from './lib/components/TopBar.svelte'
  import { appState } from './lib/stores/app.svelte'
  import { aiState } from './lib/stores/ai.svelte'
  import { initializeHistory } from './lib/stores/history.svelte'
  import { writeLayout } from './lib/utils/persistence'

  let centerScrollEl: HTMLElement | undefined = $state()

  onMount(() => {
    void initializeHistory()

    let lastWidth = window.innerWidth
    const handleResize = () => {
      const width = window.innerWidth

      if (lastWidth >= 1280 && width < 1280) {
        appState.historyOpen = false
      }

      if (lastWidth >= 1100 && width < 1100) {
        appState.noteOpen = false
      }

      lastWidth = width
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  })

  $effect(() => {
    document.documentElement.dataset.theme = appState.theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', appState.theme === 'dark' ? '#12100e' : '#e7dcc9')
  })

  $effect(() => {
    const sessionId = appState.currentSession.id
    if (sessionId && appState.view === 'workspace' && centerScrollEl) {
      centerScrollEl.scrollTop = 0
    }
  })

  $effect(() => {
    writeLayout({
      history: appState.historyOpen ? 'open' : 'collapsed',
      note: appState.noteOpen ? 'open' : 'collapsed',
    })
  })
</script>

<div
  class="app"
  data-testid="app-shell"
  data-view={appState.view}
  data-history={appState.historyOpen ? 'open' : 'collapsed'}
>
  <a class="skip-link" href="#main-content">Skip to main content</a>

  <TopBar />

  <div class="shell" data-view={appState.view} data-note={appState.noteOpen ? 'open' : 'collapsed'}>
    <HistoryPanel />

    {#if appState.view === 'workspace'}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <main
        class="center"
        id="main-content"
        tabindex="-1"
        data-testid="workspace-view"
        aria-label="Reading workspace"
      >
        <header class="center-head">
          <span class="center-label">Reading</span>
          <span class="center-meta">
            {appState.currentSession.chunks.length}
            {appState.currentSession.chunks.length === 1 ? 'chunk' : 'chunks'} ·
            {String(appState.selectedChunk).padStart(2, '0')} selected
          </span>
        </header>

        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div
          class="center-scroll scroll-region"
          role="region"
          tabindex="0"
          aria-label="Reading page"
          bind:this={centerScrollEl}
        >
          <ReadingSheet session={appState.currentSession} />
        </div>
      </main>
    {:else}
      <main class="center home-center" id="main-content" tabindex="-1" aria-label="Home">
        <Home />
      </main>
    {/if}

    {#if appState.view === 'workspace'}
      <BreakdownSidebar />
    {/if}
  </div>

  <PwaUpdate />
</div>

<Toast />
{#if aiState.settingsOpen}
  <AiSettingsDrawer />
{/if}
<DesktopGuard />

<style>
  .skip-link {
    position: fixed;
    top: 8px;
    left: 8px;
    z-index: 100;
    padding: 8px 12px;
    border: 1px solid var(--control-line);
    border-radius: var(--r-btn);
    background: var(--surface);
    color: var(--ink);
    font-size: 13px;
    text-decoration: none;
    transform: translateY(calc(-100% - 16px));
    transition: transform 120ms var(--ease-out);
  }

  .skip-link:focus {
    transform: translateY(0);
  }

  .center:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  .app {
    display: flex;
    height: 100dvh;
    flex-direction: column;
    overflow: hidden;
    background-color: var(--bg);
    background-image: var(--bg-gradient);
  }

  .shell {
    --history-w: 240px;
    --sidebar-open-w: 300px;
    --sidebar-w: var(--sidebar-open-w);

    display: grid;
    min-height: 0;
    flex: 1 1 auto;
    grid-template-columns: var(--history-w) minmax(0, 1fr) var(--sidebar-w);
    grid-template-rows: minmax(0, 1fr);
  }

  .shell[data-view='workspace'] {
    transition: grid-template-columns 220ms var(--ease-out);
  }

  .app[data-history='collapsed'] .shell {
    --history-w: 56px;
  }

  .shell[data-view='home'] {
    grid-template-columns: var(--history-w) minmax(0, 1fr);
  }

  .shell[data-note='collapsed'] {
    --sidebar-w: 44px;
  }

  @media (min-width: 900px) and (max-width: 1099px) {
    .shell[data-view='workspace'] {
      --sidebar-w: 44px;
    }
  }

  .center {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;
    background: transparent;
  }

  .home-center {
    overflow: hidden;
  }

  .center-head {
    display: flex;
    min-height: 39px;
    flex: 0 0 auto;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 18px;
    border-bottom: 1px solid var(--line);
  }

  .center-label {
    color: var(--muted);
    font-size: var(--fs-label);
    letter-spacing: 0.08em;
    line-height: var(--lh-label);
    text-transform: uppercase;
  }

  .center-meta {
    color: var(--muted);
    font-family: var(--font-data);
    font-size: var(--fs-data);
    font-weight: 500;
    line-height: var(--lh-data);
    white-space: nowrap;
  }

  .center-scroll {
    min-height: 0;
    flex: 1 1 auto;
    padding: 32px 10px 44px;
  }

  @media (min-width: 1440px) {
    .shell {
      --sidebar-open-w: 320px;
    }
  }

  @media (max-width: 899px) {
    .app {
      display: none;
    }
  }
</style>
