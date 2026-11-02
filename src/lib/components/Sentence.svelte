<script lang="ts">
  import type { Chunk, FuriganaKind, FuriganaSegment, FuriganaSettings } from '../data/types'

  let {
    chunks,
    selectedChunk,
    onSelect,
    furigana,
  }: {
    chunks: Chunk[]
    selectedChunk: number
    onSelect: (n: number) => void
    furigana: FuriganaSettings
  } = $props()

  function segments(chunk: Chunk): FuriganaSegment[] {
    return chunk.furigana?.length ? chunk.furigana : [{ text: chunk.jp }]
  }

  function showsReading(kind: FuriganaKind | undefined): boolean {
    return furigana[kind ?? 'word']
  }

  const hasVisibleFurigana = $derived(
    chunks.some((chunk) =>
      segments(chunk).some((segment) => segment.reading && showsReading(segment.kind)),
    ),
  )
</script>

<p class="sentence" class:has-furigana={hasVisibleFurigana} lang="ja">
  {#each chunks as chunk (chunk.n)}<button
      type="button"
      class="chunk c{chunk.color}"
      class:is-selected={chunk.n === selectedChunk}
      aria-label={chunk.jp}
      aria-pressed={chunk.n === selectedChunk}
      data-chunk={chunk.n}
      onclick={() => onSelect(chunk.n)}
      >{#each segments(chunk) as segment, index (index)}{#if segment.reading && showsReading(segment.kind)}<ruby
            >{segment.text}<rt class:is-name={segment.kind === 'name'}>{segment.reading}</rt></ruby
          >{:else}{segment.text}{/if}{/each}</button
    >{/each}
</p>

<style>
  .sentence {
    overflow-wrap: break-word;
    color: var(--ink);
    font-family: var(--font-jp);
    font-size: var(--fs-jp);
    letter-spacing: 0.01em;
    line-height: var(--lh-jp);
    word-break: keep-all;
  }

  .sentence ruby {
    ruby-position: over;
  }

  .sentence.has-furigana .chunk {
    padding-top: 0.32em;
  }

  .sentence rt {
    color: var(--muted);
    font-family: var(--font-jp);
    font-size: 0.5em;
    font-weight: 400;
    letter-spacing: 0;
    line-height: 1;
  }
</style>
