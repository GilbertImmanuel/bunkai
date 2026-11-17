# Tatoeba decisions

These are material changes or refinements to the Phase 7.5 brief. Each is reversible unless
marked otherwise. Evidence is in `api.md`, `findings.md`, and `log.md`.

## D-T01 — Automatic fetching, no toggle (user-approved)

**Decision:** Fetch Tatoeba examples automatically for the selected chunk when the sidebar
is open. Do not add a settings toggle in Phase 7.5A/B.

**Why:** The user explicitly chose automatic behavior per the brief.

**Privacy boundary:** Only the sanitized lookup term is sent. The full sentence, session,
history, and any API key stay local. There is no Bunkai server. The request is a direct
browser fetch to `api.tatoeba.org`.

**Revisit:** A `bunkai.tatoeba` preference can add an opt-out later without changing the
client.

## D-T02 — 12-second timeout

**Decision:** Use a 12s timeout, not the brief's suggested 8–10s.

**Why:** Cold searches took 8.1s (`共有`), 10.5s (`動いた`), and 30.8s (`心`). A 10s timeout
would fail on normal first requests. 12s plus cache/fallback is the practical balance.

**Revisit:** If Tatoeba becomes faster or a retry action is added, lower it.

## D-T03 — Request 10, display 3

**Decision:** Request `limit=10` and pick up to 3 after filtering.

**Why:** Length, containment, unapproved-translation, exclusion, and duplicate filters can
remove several results. Requesting only 3 would frequently display fewer than 3.

## D-T04 — Audio URL correction and licensing

**Decision:** Ignore the API's `download_url`. Construct
`https://api.tatoeba.org/v1/audios/{audioId}/file`. Display audio only when
`audio.license` is a non-empty string. Store `audioAuthor` in addition to `audioLicense`.

**Why:** `download_url` uses the singular `/v1/audio/` path and returns 404. The plural
`/v1/audios/{id}/file` path works. Tatoeba's downloads page says empty-license audio may
not be reused outside Tatoeba; the API returns 403 for it.

**Attribution:** Show `Audio: <author> · <license>` for every displayed recording.

## D-T05 — Containment and duplicate filters

**Decision:** Keep a result only when its normalized Japanese text contains the normalized
query. Dedupe by sentence id and normalized English translation.

**Why:** Tatoeba's substring index can return stale or semantically unrelated matches, and
near-duplicate sentences are common. Evidence: `心` matches `安心`; `だけ` returned
`夢を抱け。`; `俺だけ？`/`僕だけ？`/`私だけ？` share almost identical translations.

## D-T06 — AI examples are a fallback, not a second list

**Decision:** Show the existing examples only when Tatoeba is empty, unavailable, or the
chunk is skipped. Label them “Generated examples”.

**Why:** The brief calls them a fallback. Showing both lists would duplicate the section
and weaken the real-example signal. The AI examples remain available and honest.

## D-T07 — Fetch only when the sidebar is open

**Decision:** Load on selected chunk only when the breakdown sidebar is open. Debounce 250ms
and abort the previous request when the chunk changes or the sidebar closes.

**Why:** Avoid fetching for chunks the user is not reading, and avoid a request storm while
paging through chunks with Prev/Next or `1–6`.

## D-T08 — Cache policy

**Decision:** IndexedDB key `bunkai.tatoeba.cache`; key
`v1:{displayLimit}:{normalizedQuery}`; entries `{ examples, fetchedAt }`. TTL 30 days; cap
500 entries; evict oldest. Cache empty results; do not cache errors.

**Why:** Aligns with the existing `idb-keyval` persistence, avoids rewriting sessions, and
makes repeat selections instant. Empty results are worth caching to avoid hammering a
slow API; errors are not.

## D-T09 — No new runtime dependency

**Decision:** Reuse `idb-keyval`. No query library or HTTP client.

**Why:** The client/cache/store are small and the project already has the needed pieces.

## D-T10 — Phase 7.5C deferred

**Decision:** Do not start the Home sentence picker without explicit approval after A/B.

**Why:** It adds a second search surface and provenance metadata. The sidebar layer is the
higher-value, lower-risk integration.
