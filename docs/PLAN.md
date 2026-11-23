# Bunkai — Implementation Plan

**Status:** Execution plan. Last updated: 2026-11-23.

**Companion:** Read `SOURCE_OF_TRUTH.md` and `DESIGN.md` before starting any part. `HANDOFF.md` is the live state.

**How to use this plan**

1. Read all docs in `docs/` first.
2. Execute **one part at a time**, in order.
3. Do not start the next part until the current part's acceptance criteria pass.
4. At the end of every part, update `HANDOFF.md` with status, files, tests, decisions, blockers, and next action.
5. If a decision changes, update `SOURCE_OF_TRUTH.md` first, then this plan.
6. Do not add phone layouts, auth, a backend, a marketing site, or a separate breakdown page.

**App root:** repository root. `docs/` and `research/tatoeba/` are subfolders; local-only design references, prototypes, and third-party research are not committed.

**Package manager:** Bun 1.3.14.

**Supported width:** 900px–1920px. Below 900px: desktop guard.

---

# Part 0 — Foundation

**Goal:** A clean Vite + Svelte 5 + TypeScript app with the design tokens, fonts, typed sample data, and a base shell. No feature work yet.

### Tasks

- [ ] Scaffold the app at the repository root:
  ```bash
  bunx create-vite@latest . --template svelte-ts
  bun install
  ```
  (The current app is already at the root; this is the original Phase 0 shape.)
- [ ] Add dependencies:
  ```bash
  bun add idb-keyval
  bun add @fontsource/shippori-mincho @fontsource/vollkorn @fontsource/ia-writer-quattro @fontsource/ia-writer-mono
  bun add -d vitest @playwright/test svelte-check eslint prettier eslint-plugin-svelte prettier-plugin-svelte
  ```
- [ ] Add scripts: `dev`, `build`, `preview`, `check`, `lint`, `format`, `test`, `test:e2e`.
- [ ] Add `vitest.config.ts` and `playwright.config.ts`. Use system Chrome (`channel: "chrome"`) for local visual checks; install Chromium later if needed.
- [ ] Add one smoke test: the home shell renders at 1280×800.
- [ ] Enable TypeScript strict mode.
- [ ] Add `src/lib/styles/tokens.css` with the light/dark tokens from `DESIGN.md`.
- [ ] Add `src/lib/styles/base.css` (reset, app background, scrollbar rules, focus ring, reduced motion).
- [ ] Add `src/lib/styles/fonts.css` importing the Fontsource families; remove Google Fonts links.
- [ ] Add `src/lib/data/types.ts` with `Session`, `Chunk`, `ConstructionStep`, `Example`, `HistoryItem`, `TranslationMode`, `Theme`.
- [ ] Add `src/lib/data/sample.ts` with the sample sentence and breakdown from the reference.
- [ ] Add `src/lib/stores/app.svelte.ts` for `view`, `theme`, `selectedChunk`, `noteOpen`, `historyOpen`, `translationMode`.
- [ ] Build the base shell: topbar, history column, center, sidebar placeholders.
- [ ] Add a `DesktopGuard` placeholder (no visual polish yet).
- [ ] Verify `bun run dev` and `bun run check` with no errors.

### Acceptance criteria

- `bun run dev` starts and renders the shell at 1280×800.
- The four fonts load from local packages; no Google Fonts network request.
- Light and dark token values match `DESIGN.md`.
- The sample data is typed and can render the sentence as six chunks.
- No feature pages or fake data beyond the sample.
- Existing `docs/`, committed research, and the local-only prototype folders are untouched.

### Tests

- `bun run check` passes.
- `bun run test` smoke test passes.
- Manual: 1280×800 light/dark shell screenshot.
- No console errors.

### Handoff checkpoint

Update `HANDOFF.md`: Phase 0 status, scaffold path, dependency versions, commands, files, checks, blockers.

---

# Part 1 — Home and shell

**Goal:** The first screen: topbar, history rail, sample card, combined input + send arrow, and Home → Workspace transition.

### Tasks

- [ ] Topbar: history toggle, brand mark + "Bunkai", Save (hidden on home), note toggle (hidden on home), theme toggle. No fullscreen button.
- [ ] History panel: title, `+` new breakdown, search, grouped items. Use the three sample sessions.
- [ ] Home: title/subline, sample card, combined input + circular send arrow.
- [ ] Sample card: single button/card; preview chunks are **spans**, not buttons; clicking opens the sample workspace with chunk 5 selected.
- [ ] Input: Enter sends; send disabled until text. For now, a pasted sentence creates a placeholder session with one chunk and a note that full chunking arrives later.
- [ ] View state: `home` / `workspace`; home hides the sidebar.
- [ ] No page scroll; only the history list may scroll on home.
- [ ] Theme persists in localStorage.

### Acceptance criteria

- Home feels like a tool, not a landing page.
- Sample card contains the sentence fully; no overflow.
- Input + send arrow are one control.
- Sample click opens the workspace; input + Enter opens a placeholder workspace.
- History rail is visible at ≥1280; no sidebar on home.
- No marketing hero, login, or onboarding.

### Tests

- Playwright: 1280×800 home screenshot.
- Playwright: click sample → workspace; Enter in input → workspace.
- Manual: theme toggle persists after reload.

### Handoff checkpoint

Update `HANDOFF.md`: Home status, components, tests, known placeholder behavior for pasted text.

---

# Part 2 — Reading page

**Goal:** The center reading page: sentence, kana, translation toggle, sentence map, literal key, sentence note. Flat highlight pills only.

### Tasks

- [ ] `ReadingSheet.svelte`: surface, 16px radius, border, shadow, max 720px, margin rule + "READING" label.
- [ ] `Sentence.svelte`: Shippori Mincho 22/1.8; chunk pills; selected state; `1–6` selection; click selection.
- [ ] `Kana.svelte`: 14/1.6 muted (15px dark).
- [ ] `TranslationToggle.svelte`: Natural / Raw segmented control; Natural in Vollkorn italic; Raw chunk-order gloss; must wrap naturally; `aria-pressed`.
- [ ] `SentenceMap.svelte`: topic + core line + modifiers + engine + limiter; six chunk colors as dots/underlines; stack at ≤900.
- [ ] `LiteralKey.svelte`: 2-column quiet list >900; 1 column ≤900; hairline rows; color swatch, number, Japanese, gloss, role.
- [ ] `SentenceNote.svelte`: 2–3 short paragraphs/bullets; no left accent rule; Vollkorn 15/1.65.
- [ ] The center scrolls; topbar/headers fixed; no page scroll.
- [ ] No underlines, no fake brush highlights, no `mix-blend-mode`.

### Acceptance criteria

- All six sample chunks render with correct colors and no underline.
- The sentence is the hero; the sidebar (next part) is not needed yet.
- Natural/Raw toggle works and persists for the session.
- Sentence map is a diagram, not a chip row.
- Literal key is a quiet reference table, not a card grid.
- At 1280×800 the reading sheet fits and the page scrolls only if content requires.

### Tests

- Playwright: reader at 1280×800; Natural/Raw toggle; chunk selection.
- Visual check: no 9px labels; no horizontal overflow.
- Manual: keyboard `1–6`, Enter.

### Handoff checkpoint

Update `HANDOFF.md`: reading-page status, component files, test results, any content issues.

---

# Part 3 — Breakdown sidebar

**Goal:** The right sidebar is the full breakdown. No separate Breakdown page, no mode tabs.

### Tasks

- [ ] `BreakdownSidebar.svelte`: header (chunk number/swatch, Japanese, kana, gloss, collapse chevron), body (Role, Construction, Examples, Grammar note), footer (Prev / count / Next).
- [ ] `ConstructionTrace.svelte`: vertical steps, index, JP, EN, arrow, final step tinted/bordered.
- [ ] `Examples.svelte`: numbered rows, JP/EN, hairline separators.
- [ ] `GrammarNote.svelte`: 15/1.65, max 60ch.
- [ ] Click chunk: select + open sidebar + scroll sidebar to top.
- [ ] Reclick selected chunk: collapse sidebar; keep chunk selected.
- [ ] `Esc`: collapse sidebar.
- [ ] `Enter`: open sidebar if collapsed.
- [ ] Note toggle and sidebar collapse chevron.
- [ ] No natural translation duplicate in the sidebar.
- [ ] No separate page or `Reader/Breakdown` tabs.

### Acceptance criteria

- Clicking a chunk opens/updates the sidebar.
- Reclicking the selected chunk collapses it.
- Sidebar is a grid column at ≥1100; a drawer at 900–1099.
- The center never changes pages.
- The sidebar scrolls independently; header/footer fixed.
- No duplicate grammar/examples in the center.

### Tests

- Playwright: click chunk 02 → sidebar content; reclick → collapsed; click chunk 05 → content.
- Keyboard: `2`, Enter, Esc.
- Manual: sidebar pager.

### Handoff checkpoint

Update `HANDOFF.md`: sidebar behavior, files, tests, any layout issues.

---

# Part 4 — History and persistence

**Goal:** Local-first sessions, save/undo, search, grouping, and reload persistence. No backend or login.

### Tasks

- [ ] `HistoryPanel.svelte` fully wired: groups, search, active item, new breakdown.
- [ ] IndexedDB via `idb-keyval` for sessions.
- [ ] localStorage for theme, layout, last session, translation mode.
- [ ] Save action: store session; show inline toast with Undo.
- [ ] Load history item: set session, reset center/sidebar scroll.
- [ ] Delete/undo if included; otherwise leave deletion for later.
- [ ] Search filters by sentence text.
- [ ] Session model includes timestamps and a preview.
- [ ] Reload restores the last session and theme.
- [ ] No network calls.

### Acceptance criteria

- Saving a session and reloading preserves it.
- History groups and search work.
- Save toast Undo works.
- No backend/auth/analytics.
- IndexedDB failure falls back gracefully to in-memory state.

### Tests

- Vitest: persistence helpers.
- Playwright: save → reload → session exists; search; history load.
- Manual: Incognito/clear storage behavior.

### Handoff checkpoint

Update `HANDOFF.md`: persistence keys, DB shape, tests, limitations.

---

# Part 5 — Desktop responsiveness

**Goal:** The 900px–1920px desktop layout, exactly. No phone layout.

### Tasks

- [ ] Breakpoints:
  - ≥1280: history 240, sidebar 300; ≥1440 sidebar 320.
  - 1100–1279: history 56 rail, sidebar 300.
  - 900–1099: history 56 rail, sidebar 44 rail; sidebar opens as right drawer.
  - <900: hide app; show desktop guard.
- [ ] History rail expands to 240 on demand at 900–1279; at ≥1280 it is a column.
- [ ] Sidebar drawer at 900–1099: fixed right, top 52, width min(340px, 90vw), scrim, close, Esc, focus trap.
- [ ] Guard below 900: centered message, same palette/type.
- [ ] Key/map stack at ≤900; two-column/horizontal at 901+.
- [ ] No horizontal scroll; no clipped topbar/meta; no orphaned だけ.
- [ ] Only three scroll areas.

### Acceptance criteria

- 900, 1024, 1099, 1100, 1200, 1279, 1280, 1440 all render without horizontal clipping.
- At 1024 the sidebar is a rail by default; center is comfortable.
- At 1200 history is still a rail; center is not squeezed.
- At 1280 history is a column and the sheet fits.
- Below 900 the guard replaces the app.
- Sidebar drawer never covers the history rail.

### Tests

- Playwright screenshots at all widths.
- Manual: resize while the sidebar is open; open/close drawer; Esc; scrim.
- Check no sentence orphan and no horizontal scroll.

### Handoff checkpoint

Update `HANDOFF.md`: breakpoint table, screenshots, issues.

---

# Part 6 — Dark mode

**Goal:** Warm charcoal dark mode, readable contrast, no olive/green cast.

### Tasks

- [ ] Apply dark tokens from `DESIGN.md`.
- [ ] Background gradient `#171411 → #100E0C`.
- [ ] Surface hierarchy: sheet `#1D1A16`, panels `#26221D`, bg `#12100E`.
- [ ] Borders: `--line #5C554B`, `--line-strong #7A7062`.
- [ ] Kana 15px `#D8D0C2`; labels 11–12px.
- [ ] Chunk dark variants (c1–c6) and fills 18% / selected 26%; text ink.
- [ ] No green/olive large surfaces.
- [ ] Verify contrast: ink/sheet ≥7:1; muted ≥4.5:1; borders ≥3:1.
- [ ] Light mode unchanged.

### Acceptance criteria

- Dark mode reads as warm charcoal, not olive.
- Kana, labels, examples, and role text are readable.
- Chunk colors are distinguishable; text remains crisp.
- Light mode is unchanged.
- Theme toggle persists.

### Tests

- Playwright: 1280/1024 dark screenshots.
- Manual: all six chunks; selected chunk; sidebar examples; toast.

### Handoff checkpoint

Update `HANDOFF.md`: dark token table, contrast notes, screenshots.

---

# Part 7 — AI / API (later)

**Goal:** Optional BYO-key AI breakdowns, with sample/manual mode as the default.

### Tasks

- [ ] Settings drawer: API key field, “Stored only in this browser”, Test connection, Remove key.
- [ ] Sample mode works with no key.
- [ ] Adapter interface for generating a breakdown; provider chosen/confirmed before implementation.
- [ ] Loading, error, invalid-key, and rate-limit states.
- [ ] Never send the key to a Bunkai server; there is no server.
- [ ] Clear security warning: browser storage is not a vault.
- [ ] No auth/login.

### Acceptance criteria

- App works fully with sample/manual data and no key.
- Key is optional; invalid/missing key falls back to sample mode.
- Errors are inline and plain-language.
- No key appears in logs or UI after save.

### Tests

- Mock adapter; Playwright settings open/save/remove; error path.
- Manual: test connection with a real key only if the user opts in.

### Handoff checkpoint

Update `HANDOFF.md`: provider, key handling, security notes, test status.

---

# Part 7.5 — Tatoeba example layer (optional)

**Goal:** Add real, attributed Japanese example sentences from Tatoeba under the selected
chunk's Examples section, cached locally, with the existing generated examples as the
fallback. No backend, no auth, no paid service.

**Status:** 7.5A and 7.5B are complete (2026-11-17). 7.5C is not started and requires
explicit approval.

**Verified API correction:** Tatoeba's `download_url` uses the singular `/v1/audio/`
path and returns 404. Use `https://api.tatoeba.org/v1/audios/{audioId}/file` instead.
Only show audio when its license is non-empty; Tatoeba's terms prohibit reusing
empty-license audio outside Tatoeba.

## 7.5A — Data layer

- [x] Add `lookup?: string` to `Chunk`.
- [x] Extend `Example` with `source`, `id`, `url`, `author`, `license`, `audioUrl`,
      `audioAuthor`, and `audioLicense`.
- [x] Add `lookup` to the AI breakdown prompt and parser.
- [x] Add a fallback lookup derivation for old sessions; skip bare particles/auxiliaries.
- [x] Add Tatoeba types, URL builder, response mapper, fetch client, and IndexedDB cache.
- [x] Add a Tatoeba store with loading/ready/empty/error states, aborting, and in-flight
      deduplication.
- [x] Add lookups to the six sample chunks and the two seed sessions.
- [x] Add unit tests for URLs, mapping, filtering, lookup derivation, cache keys/TTL, and
      errors.

## 7.5B — Sidebar UI

- [x] Add “From Tatoeba” under Examples with 2–3 examples.
- [x] Show Japanese, English, source link, contributor, license, and optional audio.
- [x] Show loading, error, empty, skipped, and cached states.
- [x] Keep generated examples as the fallback, labelled “Generated examples”.
- [x] Add a “Search Tatoeba” link for the current lookup.
- [x] Fetch only when the sidebar is open; debounce and abort on chunk changes.
- [x] Add Playwright coverage with a mocked Tatoeba route; no live API calls.
- [x] Verify light and dark mode at 1280×800.
- [x] Manually verify the live API and save a screenshot.

## 7.5C — Home sentence picker (requires explicit approval)

Do not start without approval.

- [ ] Add a “Find a sentence” search near the Home input.
- [ ] Show 5–8 Japanese sentences with approved English translations and audio.
- [ ] Send a selected sentence through the existing AI/manual flow.
- [ ] Add optional `Session.origin` provenance if history shows it.

### Acceptance criteria — 7.5A/B

- With no AI key, sample mode still works and can show Tatoeba examples for sample chunks.
- Selecting a sample chunk fetches and displays real examples.
- AI examples remain available as a fallback.
- No backend, auth, or proxy is added.
- No console errors and no horizontal overflow.
- `bun run check`, `bun run lint`, `bun run test`, `bun run test:e2e`, and `bun run build`
  pass.
- Docs are updated.

### Tests — 7.5A/B

- Unit: URL building/normalization, response mapping, unapproved filtering, audio license
  filtering, length/containment/duplicate filtering, lookup derivation, cache keys/TTL,
  empty/error responses.
- E2E: examples render, audio button only with licensed audio, source/attribution,
  loading/error/empty states, cached results avoid a second request, light/dark screenshots,
  manual placeholder does not search.
- Manual: live API check for the sample chunk; not part of the automated suite.

### Handoff checkpoint

Update `HANDOFF.md`: 7.5A/B status, files, tests, screenshots, API corrections, decisions,
blockers, and whether 7.5C is approved.

---

# Part 8 — PWA / local distribution

**Goal:** Installable static app, offline shell, export/import, and a source-only local
install. No hosted deployment.

**Status:** 8A (PWA/offline), 8B (export/import), and the security hardening pass are
complete. Distribution is local-only. 8C (share URL) is not planned.

### 8A — PWA / offline

- [x] `vite-plugin-pwa` 2.0.0; `manifest.webmanifest`; 文-mark icons; theme colors.
- [x] Offline app shell and self-hosted `woff2` fonts.
- [x] Prompt-based update banner; no silent reload.
- [x] Do not runtime-cache AI or Tatoeba API responses.
- [x] `bun run test:pwa` verifies the manifest, service worker, and offline reload.

### 8B — Export / import

- [x] Export sessions as versioned JSON.
- [x] Import with merge and replace; validate malformed files.
- [x] Exclude AI keys, preferences, and the Tatoeba cache from backups.
- [x] Settings → Data UI.

### 8C — Share URL

- **Not planned.** A local-only app cannot share a `localhost` link with another person.
- Backups are the sharing mechanism: export JSON and send the file.

### Delivery

- [x] Static build (`dist/`) runs from a local server (`bun run preview`).
- [x] No hosted deployment, no public origin, no share link.
- [x] No accounts.
- [x] MIT license and a README security model.
- [ ] Optional native desktop wrapper (Tauri/Electron) is a separate future phase.

### Acceptance criteria

- `bun run build` produces a static `dist`.
- Installable and loads offline from the local preview.
- Updates prompt instead of reloading silently.
- Export/import round-trips sessions (8B).
- No backend and no hosted service.
- The README explains origin-scoped keys/history and the same-URL rule.
- The production build carries a restrictive meta CSP.

### Tests

- `bun run build` + preview; PWA install; offline reload.
- `bun run test:pwa` — manifest, service worker, offline shell, CSP, backup export.
- `bun run test` — backup schema, merge/replace, strict import validation, proxy rules,
  response limits.
- `bun run test:e2e` — export download, merge, replace, invalid backup, duplicate ids.

### Handoff checkpoint

Update `HANDOFF.md`: local distribution model, PWA status, export/import notes, hardening
summary.

---

# Part 9 — Polish and release

**Goal:** Final quality pass, accessibility, tests, docs, and a clean handoff.

### Tasks

- [ ] Accessibility: focus rings, keyboard flow, ARIA, contrast, reduced motion.
- [ ] Visual QA: 900, 1024, 1100, 1200, 1280, 1440; light/dark.
- [ ] Tests: `bun run check`, `bun run test`, `bun run test:e2e`.
- [ ] Remove unused prototype CSS/assets.
- [ ] Update `DESIGN.md`, `manifest.md`, `HANDOFF.md`.
- [ ] Final build and local install check.
- [ ] Write a short release note.

### Acceptance criteria

- All tests pass; no console errors.
- No horizontal scroll/clipping at supported widths.
- Light/dark readable; no 9px labels.
- Sample mode works without a key.
- Docs match the shipped app.
- `HANDOFF.md` is final and accurate.

### Handoff checkpoint

Update `HANDOFF.md`: release status, local install, test summary, known issues, next ideas.

---

## Global test matrix

| Width | Light | Dark |
| ----- | ----- | ---- |
| 900   | ✓     | ✓    |
| 1024  | ✓     | ✓    |
| 1099  | ✓     | ✓    |
| 1100  | ✓     | ✓    |
| 1200  | ✓     | ✓    |
| 1279  | ✓     | ✓    |
| 1280  | ✓     | ✓    |
| 1440  | ✓     | ✓    |

Test states:

- Home
- Reader with sidebar open
- Reader with sidebar collapsed
- Sidebar scrolled to examples
- Sidebar with Tatoeba examples
- Sidebar with generated fallback (Tatoeba empty/error)
- Sidebar drawer (900–1099)
- PWA offline shell
- Settings → Data
- Guard at 899

## Global definition of done

- The sentence is the hero.
- The sidebar is the breakdown; no separate page.
- Reclicking the selected chunk collapses the sidebar.
- Only history, center, and sidebar scroll.
- No marketing, login, backend, phone layout, or chat threads.
- Bun + Vite + Svelte 5 + TypeScript.
- Fonts self-hosted.
- Dark mode is warm charcoal, not olive.
- Tatoeba examples are optional, attributed, locally cached, and never required for the
  app to work. No live Tatoeba calls in automated tests.
- The static build is installable, reloads offline, and prompts before applying an update.
- Backups are local, versioned JSON; they exclude API keys, preferences, and the Tatoeba
  cache. Import supports merge and confirmed replace.
- `HANDOFF.md` updated after every part.
