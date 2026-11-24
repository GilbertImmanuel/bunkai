<script lang="ts">
  import type { Example } from '../data/types'
  import { cancelTatoebaLoad, loadTatoebaExamples, tatoebaState } from '../stores/tatoeba.svelte'
  import { buildTatoebaSearchPageUrl, TATOEBA_LICENSE_URL } from '../tatoeba/client'
  import type { ChunkLookup } from '../tatoeba/lookup'
  import Examples from './Examples.svelte'

  let {
    lookup,
    fallbackExamples,
    sessionSentence,
    active,
  }: {
    lookup: ChunkLookup
    fallbackExamples: Example[]
    sessionSentence: string
    active: boolean
  } = $props()

  let audio: HTMLAudioElement | null = null
  let playingId = $state<number | null>(null)
  let failedAudioId = $state<number | null>(null)

  const searchUrl = $derived(lookup.query ? buildTatoebaSearchPageUrl(lookup.query) : '')
  const isCurrent = $derived(tatoebaState.query === lookup.query)
  const status = $derived(
    !lookup.query || !lookup.auto || !active
      ? 'idle'
      : !isCurrent
        ? 'loading'
        : tatoebaState.status,
  )
  const showFallback = $derived(
    fallbackExamples.length > 0 &&
      (status === 'empty' || status === 'error' || (status === 'idle' && !lookup.auto)),
  )

  $effect(() => {
    const query = lookup.query
    const auto = lookup.auto
    const open = active
    const exclude = sessionSentence

    if (!open || !query || !auto) {
      cancelTatoebaLoad()
      return
    }

    const timer = setTimeout(() => {
      void loadTatoebaExamples({ query, exclude })
    }, 250)

    return () => clearTimeout(timer)
  })

  $effect(() => {
    const query = lookup.query
    const sentence = sessionSentence

    return () => {
      if (!query && !sentence) return
      audio?.pause()
      audio = null
      playingId = null
    }
  })

  function toggleAudio(example: Example): void {
    if (!example.audioUrl || failedAudioId === example.id) return

    if (audio && playingId === example.id) {
      audio.pause()
      playingId = null
      return
    }

    audio?.pause()

    const next = new Audio(example.audioUrl)
    audio = next
    playingId = example.id === undefined ? null : example.id
    failedAudioId = null

    next.addEventListener(
      'ended',
      () => {
        if (audio !== next) return
        audio = null
        playingId = null
      },
      { once: true },
    )

    next.addEventListener(
      'error',
      () => {
        if (audio !== next) return
        audio = null
        playingId = null
        failedAudioId = example.id ?? null
      },
      { once: true },
    )

    void next.play().catch(() => {
      if (audio !== next) return
      audio = null
      playingId = null
      failedAudioId = example.id ?? null
    })
  }

  function retry(): void {
    if (!lookup.query) return
    void loadTatoebaExamples({
      query: lookup.query,
      exclude: sessionSentence,
      force: true,
    })
  }
</script>

<section
  class="tatoeba"
  data-testid="tatoeba-section"
  data-query={lookup.query}
  data-from-cache={tatoebaState.fromCache && isCurrent ? 'true' : undefined}
>
  {#if lookup.query}
    <div class="tatoeba-head">
      <h4 class="tatoeba-label">From Tatoeba</h4>
      <a
        class="tatoeba-search"
        data-testid="tatoeba-search-link"
        href={searchUrl}
        target="_blank"
        rel="noreferrer"
      >
        Search Tatoeba <span aria-hidden="true">↗</span>
      </a>
    </div>

    {#if !lookup.auto}
      <p class="tatoeba-status" data-testid="tatoeba-skipped">
        No automatic lookup for this chunk.
      </p>
    {:else if status === 'loading' || status === 'idle'}
      <p class="tatoeba-status" data-testid="tatoeba-loading" role="status">Searching Tatoeba…</p>
    {:else if status === 'error'}
      <p class="tatoeba-status" data-testid="tatoeba-error" role="status">
        {tatoebaState.error || 'Tatoeba is unavailable right now.'}
      </p>
      <button class="tatoeba-retry" type="button" data-testid="tatoeba-retry" onclick={retry}>
        Try again
      </button>
    {:else if status === 'empty'}
      <p class="tatoeba-status" data-testid="tatoeba-empty" role="status">
        No Tatoeba examples found for
        <span class="tatoeba-query" lang="ja">「{lookup.query}」</span>.
      </p>
    {:else}
      <ol class="tatoeba-list">
        {#each tatoebaState.examples as example, index (example.id ?? index)}
          <li class="tatoeba-example" data-testid="tatoeba-example">
            <span class="tatoeba-no" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <div class="tatoeba-body">
              <p class="tatoeba-jp" lang="ja">{example.jp}</p>
              <p class="tatoeba-en">{example.en}</p>
              <div class="tatoeba-meta">
                {#if example.audioUrl}
                  <button
                    class="tatoeba-audio"
                    type="button"
                    data-testid="tatoeba-audio"
                    aria-pressed={playingId === example.id}
                    aria-label={failedAudioId === example.id
                      ? `Audio unavailable for Tatoeba sentence ${example.id}`
                      : playingId === example.id
                        ? `Pause audio for Tatoeba sentence ${example.id}`
                        : `Play audio for Tatoeba sentence ${example.id}`}
                    title={failedAudioId === example.id ? 'Audio unavailable' : 'Play audio'}
                    disabled={failedAudioId === example.id}
                    onclick={() => toggleAudio(example)}
                  >
                    {#if playingId === example.id}
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        aria-hidden="true"
                      >
                        <path d="M9 5v14M15 5v14" />
                      </svg>
                    {:else}
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M8 5l11 7-11 7z" />
                      </svg>
                    {/if}
                  </button>
                {/if}

                {#if example.url}
                  <a
                    class="tatoeba-source"
                    data-testid="tatoeba-source"
                    href={example.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Tatoeba #{example.id} <span aria-hidden="true">↗</span>
                  </a>
                {/if}

                <span class="tatoeba-credit-inline">
                  {example.author ?? 'Tatoeba'}, {example.license ?? 'license not stated'}
                </span>

                {#if example.audioUrl}
                  <span class="tatoeba-audio-credit">
                    Audio: {example.audioAuthor ?? 'unknown'}, {example.audioLicense ??
                      'license not stated'}
                  </span>
                {/if}
              </div>
            </div>
          </li>
        {/each}
      </ol>
    {/if}

    <p class="tatoeba-attribution" data-testid="tatoeba-attribution">
      {#if tatoebaState.fromCache && isCurrent && (status === 'ready' || status === 'empty')}
        <span class="tatoeba-cached" data-testid="tatoeba-cached">Cached</span>.
      {/if}
      Sentences from
      <a href="https://tatoeba.org" target="_blank" rel="noreferrer">Tatoeba</a>.
      <a href={TATOEBA_LICENSE_URL} target="_blank" rel="noreferrer">CC BY 2.0 FR</a>. Audio is
      credited per recording.
    </p>
  {/if}

  {#if showFallback}
    <div class="generated" data-testid="generated-examples">
      <h4 class="tatoeba-label">Generated examples</h4>
      <Examples examples={fallbackExamples} />
    </div>
  {/if}
</section>

<style>
  .tatoeba {
    margin-top: 12px;
  }

  .tatoeba-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 4px 10px;
  }

  .tatoeba-label {
    color: var(--muted);
    font-size: var(--fs-data);
    font-weight: 500;
    letter-spacing: 0.06em;
    line-height: var(--lh-data);
    text-transform: uppercase;
  }

  .tatoeba-search {
    color: var(--accent);
    font-size: 11px;
    line-height: 1.4;
    text-decoration: none;
    white-space: nowrap;
  }

  .tatoeba-search:hover {
    text-decoration: underline;
  }

  .tatoeba-list {
    display: flex;
    flex-direction: column;
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
  }

  .tatoeba-example {
    display: grid;
    grid-template-columns: 26px minmax(0, 1fr);
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
  }

  .tatoeba-example:last-child {
    border-bottom: 0;
  }

  .tatoeba-no {
    padding-top: 3px;
    color: var(--muted);
    font-family: var(--font-data);
    font-size: var(--fs-data);
    line-height: var(--lh-data);
  }

  .tatoeba-body {
    min-width: 0;
  }

  .tatoeba-jp {
    overflow-wrap: anywhere;
    color: var(--ink);
    font-family: var(--font-jp);
    font-size: 16px;
    line-height: 1.55;
  }

  .tatoeba-en {
    margin-top: 2px;
    overflow-wrap: anywhere;
    color: var(--muted);
    font-family: var(--font-reading);
    font-size: 14px;
    line-height: 1.4;
  }

  .tatoeba-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    margin-top: 6px;
    color: var(--muted);
    font-size: var(--fs-data);
    line-height: 1.4;
  }

  .tatoeba-source {
    overflow-wrap: anywhere;
    color: var(--accent);
    text-decoration: none;
  }

  .tatoeba-source:hover {
    text-decoration: underline;
  }

  .tatoeba-credit-inline,
  .tatoeba-audio-credit {
    overflow-wrap: anywhere;
  }

  .tatoeba-audio {
    display: inline-grid;
    width: 26px;
    height: 26px;
    flex: 0 0 auto;
    place-items: center;
    border: 1px solid var(--control-line);
    border-radius: var(--r-btn);
    color: var(--muted);
    transition:
      color 0.15s ease,
      border-color 0.15s ease;
  }

  .tatoeba-audio:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--ink);
  }

  .tatoeba-audio:disabled {
    cursor: default;
    opacity: 0.45;
  }

  .tatoeba-audio svg {
    width: 13px;
    height: 13px;
  }

  .tatoeba-status {
    margin-top: 8px;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .tatoeba-query {
    white-space: nowrap;
  }

  .tatoeba-retry {
    margin-top: 2px;
    padding: 0;
    color: var(--accent);
    font-size: 11px;
    line-height: 1.4;
  }

  .tatoeba-retry:hover {
    text-decoration: underline;
  }

  .tatoeba-attribution {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px dashed var(--line);
    color: var(--muted);
    font-size: var(--fs-data);
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .tatoeba-attribution a {
    color: var(--accent);
    text-decoration: none;
  }

  .tatoeba-attribution a:hover {
    text-decoration: underline;
  }

  .tatoeba-cached {
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .generated {
    margin-top: 14px;
    padding-top: 10px;
    border-top: 1px dashed var(--line);
  }

  .generated :global(.examples) {
    margin-top: 8px;
  }
</style>
