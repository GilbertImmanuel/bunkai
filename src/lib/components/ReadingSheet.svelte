<script lang="ts">
  import type { Session } from '../data/types'
  import { aiErrorMessage } from '../ai/breakdown'
  import { activeAiReady, aiState, enrichSession } from '../stores/ai.svelte'
  import {
    appState,
    chooseChunk,
    closeNote,
    openNote,
    setTranslationMode,
    updateCurrentSession,
  } from '../stores/app.svelte'
  import { historyState, saveSession, updateSession } from '../stores/history.svelte'
  import { showToast } from '../stores/toast.svelte'
  import Kana from './Kana.svelte'
  import LiteralKey from './LiteralKey.svelte'
  import Sentence from './Sentence.svelte'
  import SentenceMap from './SentenceMap.svelte'
  import SentenceNote from './SentenceNote.svelte'
  import TranslationToggle from './TranslationToggle.svelte'

  let { session }: { session: Session } = $props()

  let mapping = $state(false)
  let mapError = $state('')
  let enrichSessionId: string | null = null
  const canMap = $derived(activeAiReady())

  $effect(() => {
    if (enrichSessionId === null) {
      enrichSessionId = session.id
      return
    }

    if (session.id === enrichSessionId) return
    enrichSessionId = session.id
    mapError = ''
    mapping = false
  })
  const needsEnrichment = $derived(
    Boolean(session.natural) &&
      (!session.naturalParts?.length ||
        session.chunks.some(
          (chunk) => /\p{Script=Han}/u.test(chunk.jp) && !chunk.furigana?.length,
        )),
  )

  async function mapNaturalColors(): Promise<void> {
    if (mapping || !session.natural) return

    const targetId = session.id
    const wasSaved = historyState.sessions.some((item) => item.id === targetId)
    mapping = true
    mapError = ''

    try {
      const updated = await enrichSession(session)

      if (appState.currentSession.id !== targetId) {
        showToast('Session changed; readings were not applied')
        return
      }

      if (wasSaved && !historyState.sessions.some((item) => item.id === targetId)) {
        showToast('Session was removed; readings were not saved')
        return
      }

      updateCurrentSession(updated)

      if (wasSaved) {
        const persisted = await updateSession(updated)
        showToast(
          persisted ? 'Session colors and readings mapped' : 'Session updated for this tab only',
        )
        return
      }

      const result = await saveSession(updated)
      showToast(
        result.persisted ? 'Session colors and readings mapped' : 'Session saved for this tab only',
      )
    } catch (error) {
      mapError = aiErrorMessage(error)
    } finally {
      mapping = false
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (
      event.defaultPrevented ||
      aiState.settingsOpen ||
      document.querySelector('[data-testid="furigana-menu"]') ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey
    ) {
      return
    }

    const target = event.target as HTMLElement | null
    if (
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    ) {
      return
    }

    if (event.key === 'Escape') {
      if (appState.noteOpen) {
        event.preventDefault()
        closeNote()
      }
      return
    }

    if (event.key === 'Enter') {
      if (appState.noteOpen) return

      const chunkButton = target?.closest<HTMLElement>('[data-chunk]')
      const isSelectedChunk = chunkButton?.dataset.chunk === String(appState.selectedChunk)
      const isOutsideButton = !target?.closest('button')

      if (isOutsideButton || isSelectedChunk) {
        event.preventDefault()
        openNote()
      }
      return
    }

    const n = Number(event.key)
    if (!Number.isInteger(n) || n < 1 || n > 6) return

    const chunk = session.chunks.find((item) => item.n === n)
    if (!chunk) return

    event.preventDefault()
    chooseChunk(chunk.n, true)
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<article
  class="reading-sheet"
  data-testid="reading-sheet"
  aria-labelledby="reading-workspace-title"
>
  <h1 class="sr-only" id="reading-workspace-title">Reading workspace</h1>
  <span class="sheet-label" aria-hidden="true">Reading</span>

  <Sentence
    chunks={session.chunks}
    selectedChunk={appState.selectedChunk}
    onSelect={chooseChunk}
    furigana={appState.furigana}
  />

  <Kana reading={session.reading} />

  {#if needsEnrichment}
    <div class="enrich-row" data-testid="enrich-row">
      <span class="enrich-label">Missing details</span>
      {#if canMap}
        <button class="enrich-btn" type="button" disabled={mapping} onclick={mapNaturalColors}>
          {mapping ? 'Adding colors & readings…' : 'Add colors & readings'}
        </button>
      {:else}
        <span class="enrich-hint">Add an AI key to restore colors and furigana.</span>
      {/if}
      {#if mapError}
        <span class="enrich-error" role="alert">{mapError}</span>
      {/if}
    </div>
  {/if}

  {#if session.source === 'manual'}
    <div class="sheet-placeholder">
      <p class="placeholder-label">Placeholder workspace</p>
      <p class="placeholder-text">
        This pasted sentence is shown as one temporary chunk. Full chunking arrives in a later
        phase.
      </p>
    </div>
  {:else}
    {#if session.natural || session.raw}
      <TranslationToggle
        {session}
        mode={appState.translationMode}
        onModeChange={setTranslationMode}
      />
    {/if}

    <SentenceMap {session} />
    <LiteralKey chunks={session.chunks} />
    <SentenceNote notes={session.sentenceNote} />
  {/if}
</article>

<style>
  .reading-sheet {
    position: relative;
    display: flex;
    width: 100%;
    max-width: 1040px;
    min-height: calc(100dvh - 172px);
    flex-direction: column;
    margin: 0 auto;
    padding: 40px 32px 40px 40px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-sheet);
    background: var(--surface);
    box-shadow: var(--shadow-sheet);
  }

  .reading-sheet::before {
    position: absolute;
    top: 40px;
    bottom: 40px;
    left: 22px;
    width: 1px;
    background: var(--line-strong);
    content: '';
    opacity: 0.9;
  }

  .sheet-label {
    position: absolute;
    top: 42px;
    left: 9px;
    color: var(--muted);
    font-family: var(--font-data);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.16em;
    line-height: 1;
    text-orientation: mixed;
    text-transform: uppercase;
    writing-mode: vertical-rl;
  }

  @media (min-width: 1280px) {
    .reading-sheet {
      padding-left: 40px;
    }
  }

  @media (min-width: 1440px) {
    .reading-sheet {
      padding-right: 40px;
      padding-left: 56px;
    }
  }

  .sheet-placeholder {
    margin-top: auto;
    padding-top: 28px;
    border-top: 1px solid var(--line);
  }

  .enrich-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px 10px;
    margin-top: 10px;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: var(--r-note);
    background: var(--surface-2);
  }

  .enrich-label {
    color: var(--muted);
    font-size: var(--fs-data);
    font-weight: 500;
    letter-spacing: 0.06em;
    line-height: var(--lh-data);
    text-transform: uppercase;
  }

  .enrich-btn {
    color: var(--accent);
    font-size: 12px;
    font-weight: 500;
  }

  .enrich-btn:hover:not(:disabled) {
    text-decoration: underline;
  }

  .enrich-btn:disabled {
    cursor: wait;
    opacity: 0.65;
  }

  .enrich-hint,
  .enrich-error {
    font-size: 12px;
    line-height: 1.45;
    text-wrap: pretty;
  }

  .enrich-hint {
    color: var(--muted);
  }

  .enrich-error {
    color: var(--accent);
  }
</style>
