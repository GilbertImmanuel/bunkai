# Tatoeba findings

## What works

- Short, distinctive Japanese content words: `共有`, `動いた`, `誰か`, `ありがとう`,
  `天気`. They return relevant sentences with approved English translations.
- The proposed API filter set works: Japanese + approved English translations + audio
  included.
- Direct browser fetches work because CORS is `*`.
- Japanese sentence audio exists for some sentences and plays in Chrome.
- A local cache is effective because the API can be slow on the first request for a term.

## What does not work well

- **Phrase queries.** Quoted phrases can return zero; unquoted phrases are slow.
  `心が動いた` took 28.6s.
- **Grammar endings are ambiguous.** `たくなった` also matches `冷たくなった`,
  `痛くなった`, etc. Prefer content words or a pattern that is not a substring of a
  common different pattern.
- **Substring matching is noisy.** `心` matches `安心`; `ときに` matches `その時に`.
  That is acceptable for a reading aid but not for grammar-specific teaching.
- **Stale index entries.** One `だけ` result (`夢を抱け。`) did not contain `だけ`.
  A containment check is required.
- **Near-duplicates.** `俺だけ？`, `僕だけ？`, `私だけ？` are distinct sentences with
  nearly identical translations. Dedupe by normalized English.
- **Audio license gaps.** Some audio has an empty license and returns 403. Tatoeba's terms
  say it may not be reused outside Tatoeba. Do not display a play button for it.
- **Latency spikes.** The first request for a common term can take 30s. Timeout and
  fallback are required; a longer cache TTL is worthwhile.

## Query strategy

1. Use `chunk.lookup` when the AI or sample data provides one.
2. Validate that the explicit lookup appears verbatim in the chunk.
3. Otherwise derive a short content run from the chunk:
   - strip punctuation and whitespace;
   - split on case particles and common clause markers;
   - strip common auxiliary endings;
   - choose the longest candidate with kanji, excluding bare particles/auxiliaries.
4. Skip automatic search for bare particles and auxiliary-only chunks; show the
   “Search Tatoeba” link instead.
5. Request `limit=10`, filter, then show up to 3.
6. Filter results by:
   - approved Japanese sentence (`is_unapproved=no`);
   - approved English translation, preferring direct links;
   - normalized query containment;
   - 5–40 Japanese characters;
   - current session sentence exclusion;
   - unique sentence id and unique normalized English.
7. Cache the mapped examples by normalized query and display limit.

## Quality notes

- Tatoeba is a community corpus. Approved translations are not a guarantee of natural
  English; the source link lets the reader inspect the sentence page.
- Bunkai should not rewrite Tatoeba translations. Show them as-is.
- Audio attribution must name the contributor and license. Text attribution should name
  the sentence contributor when available and always link to Tatoeba.
- Empty-license audio is deliberately omitted, even if the API object exists.

## Hypothesis to test during implementation

- Filtering to 5–40 characters plus containment will remove most low-quality results
  while leaving 2–3 useful examples for the sample chunks. Manual verification will
  confirm.
- A 12s timeout plus a 30-day cache will make the sidebar feel reliable in normal use,
  provided the first request for a term is allowed to complete.
