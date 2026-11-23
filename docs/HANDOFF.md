# Bunkai — Handoff

**Status:** Living document. Update at the end of every phase.

**Rule:** A phase is not complete until this file is updated and the acceptance criteria in `PLAN.md` pass.

---

## Current status

| Field | Value |
|---|---|
| Current phase | **Phase 8 — PWA / sharing** |
| Phase status | **8A/8B complete**; 8C (optional share link) and deployment pending |
| Last updated | 2026-11-23 |
| App root | Repository root |
| Package manager | Bun 1.3.14 |
| Stack | Vite 8.3.5 + Svelte 5.57.3 + TypeScript 6.0.3 |
| Git | [GitHub](https://github.com/GilbertImmanuel/bunkai); private |
| Deploy | Not deployed |
| Next action | Review 8B; decide 8C and deployment |

**Summary:** Phase 8A makes the app installable and usable offline. A generated web
manifest, 文-mark icons, and a Workbox service worker precache the app shell, JS/CSS, and
`woff2` fonts. New versions prompt with a quiet “A new version is available” banner instead
of reloading silently. Phase 8B adds a versioned JSON backup in Settings → Data: export all
sessions, import with merge or replace, validate malformed files, and never include API
keys, preferences, or the Tatoeba cache. The app remains local-first and desktop-only; AI
and Tatoeba API responses are never runtime-cached. Phase 7.5A/B (Tatoeba examples) remains
complete and 7.5C is still unapproved.

---

## Phase log

> **Layout note (2026-11-23):** The app now lives at the repository root. Paths in phase
> entries written before this note use the old `app/` prefix. The current source layout is
> `src/`, `tests/`, `docs/`, and `research/tatoeba/` at the root.

### Phase 0 — Foundation

- **Status:** Complete
- **Goal:** Scaffold the app, install dependencies, add tokens/fonts/sample data, render a base shell.
- **Completed:**
  - Scaffolded `app/` with `bunx create-vite@latest app --template svelte-ts` and installed with Bun.
  - Added `idb-keyval`; all four Fontsource families; Vitest, Playwright, svelte-check, ESLint, Prettier, and Svelte plugins.
  - Added scripts: `dev`, `build`, `preview`, `check`, `lint`, `format`, `test`, `test:e2e`.
  - Added `vitest.config.ts` and `playwright.config.ts` (system Chrome via `channel: "chrome"`, dev server on `127.0.0.1:4173`).
  - Enabled TypeScript strict mode and typechecked app, Node configs, and e2e tests.
  - Added `tokens.css` with the exact light/dark DESIGN.md palette, chunk hues, type scale, radii, and gradients.
  - Added `base.css` (reset, background, scrollbar rules, focus ring, reduced motion) and `fonts.css` (Fontsource imports; no Google Fonts).
  - Added typed data contracts, the reference sample sentence/breakdown, and the app store (`view`, `theme`, `selectedChunk`, `noteOpen`, `historyOpen`, `translationMode`).
  - Built the base shell: topbar, collapsed/expanded history placeholder, reading sheet with six sample chunks, and breakdown sidebar placeholder.
  - Added the desktop guard below 900px and a custom Bunkai favicon.
  - Removed scaffold demo files (`Counter.svelte`, `app.css`, demo assets, Vite icons).
- **Decisions:**
  - The Phase 0 shell opens in `workspace` view with chunk 05 selected so the six chunks and the sidebar placeholder are visible. Phase 1 will make `home` the initial view.
  - Theme is applied as `data-theme` on `<html>`. Theme persistence is deferred to Phase 1.
  - The three scroll regions are keyboard-focusable (`tabindex="0"` with `role="region"` where appropriate); the Svelte noninteractive-tabindex warning is intentionally suppressed for these scroll containers.
  - Added `typescript-eslint`, `@eslint/js`, and `globals` beyond the Phase 0 list so ESLint can parse `.svelte.ts` rune stores and TypeScript. ESLint is 10.x and TypeScript is 6.0.3 (create-vite default at scaffold time); the confirmed stack requires TypeScript, not a specific major.
  - Playwright binds Vite to `127.0.0.1` and uses system Chrome; Playwright-bundled Chromium is not installed.
  - No Save button, note toggle, home screen, chunk interactions, or persistence were added in Phase 0.
- **Files touched:**
  - `app/package.json`, `app/bun.lock`, `app/index.html`, `app/README.md`
  - `app/vite.config.ts`, `app/vitest.config.ts`, `app/playwright.config.ts`, `app/svelte.config.js`
  - `app/tsconfig.json`, `app/tsconfig.app.json`, `app/tsconfig.node.json`, `app/tsconfig.e2e.json`
  - `app/eslint.config.js`, `app/.prettierrc`, `app/.prettierignore`, `app/.gitignore`
  - `app/public/favicon.svg`
  - `app/src/App.svelte`, `app/src/main.ts`
  - `app/src/lib/components/TopBar.svelte`, `HistoryPanel.svelte`, `BreakdownSidebar.svelte`, `DesktopGuard.svelte`
  - `app/src/lib/data/types.ts`, `sample.ts`, `sample.test.ts`
  - `app/src/lib/stores/app.svelte.ts`
  - `app/src/lib/styles/tokens.css`, `base.css`, `fonts.css`, `tokens.test.ts`
  - `app/tests/e2e/smoke.spec.ts`
  - `docs/HANDOFF.md`
- **Tests:**
  - `bun run check` — pass, 0 errors / 0 warnings.
  - `bun run lint` — pass.
  - `bun run test` — pass, 2 files / 4 tests (sample data + token values).
  - `bun run test:e2e` — pass, 1 Chrome test at 1280×800 (six chunks, fonts, no Google Fonts requests, theme toggle, guard below 900, console clean).
  - `bun run build` — pass.
  - `bun run dev` — starts and serves the shell.
- **Screenshots/checks:**
  - Phase 0 light/dark shell screenshots were generated; later test runs regenerate `app/test-results/` with the current phase's screenshots.
  - Fonts load from `node_modules` through Fontsource; no Google Fonts network request.
- **Blockers:** None.
- **Next:** Phase 1 — Home and shell, only after user approval.

### Phase 1 — Home and shell

- **Status:** Complete
- **Goal:** The first screen: topbar, history rail, sample card, combined input + send arrow, and Home → Workspace transition.
- **Completed:**
  - Built the home view with the reference title/subline, a single clickable sample card, and a combined paste input + circular send arrow.
  - Sample card renders the six sample chunks as non-interactive spans; clicking it opens the workspace with chunk 05 selected.
  - Input sends on Enter and via the arrow; the send button is disabled until the field has non-whitespace text. A pasted sentence opens a one-chunk placeholder workspace with a note that full chunking arrives later.
  - Added the full topbar: history toggle, clickable brand, workspace-only Save placeholder and note toggle, and theme toggle. No fullscreen button.
  - Rebuilt the history panel with search, `+ New breakdown`, Today/Yesterday groups, the three reference sessions, active-session styling, chunk counts, times, and color strips. New breakdown returns home and focuses the input.
  - Added Home → Workspace view switching. Home has no sidebar; workspace shows the sidebar when the note panel is open.
  - Made the theme toggle persist to `localStorage` under `bunkai.theme` and apply before mount to avoid a theme flash on reload.
  - Moved the shared chunk pill styles into `base.css` so the reading sheet and sample card use one highlight recipe.
- **Decisions:**
  - The three sample sessions are the reference sessions (`sample`, `s-a`, `s-b`). History groups are static fixtures for Phase 1; Phase 4 replaces them with real stored timestamps/sessions.
  - Save is present in the topbar as a disabled placeholder. Real save/undo and IndexedDB land in Phase 4.
  - The note toggle now shows/hides the sidebar in workspace. The 44px rail, drawer behavior, and in-sidebar collapse control remain Phase 3/5 work.
  - Manual paste sessions are in-memory only and are not added to the sample history yet.
  - Search is local to the history fixtures and matches the visible preview text.
- **Files touched:**
  - `app/src/App.svelte`
  - `app/src/lib/components/Home.svelte` (new)
  - `app/src/lib/components/TopBar.svelte`
  - `app/src/lib/components/HistoryPanel.svelte`
  - `app/src/lib/components/BreakdownSidebar.svelte`
  - `app/src/lib/data/sessions.ts` (new), `sessions.test.ts` (new)
  - `app/src/lib/stores/app.svelte.ts`
  - `app/src/main.ts`
  - `app/src/lib/styles/base.css`
  - `app/tests/e2e/smoke.spec.ts`
  - `docs/HANDOFF.md`
- **Tests:**
  - `bun run check` — pass, 0 errors / 0 warnings.
  - `bun run lint` — pass.
  - `bun run test` — pass, 3 files / 7 tests (sample, sessions/history, token values).
  - `bun run test:e2e` — pass, 4 Chrome tests: 1280×800 home screenshot, sample → six-chunk workspace, paste + Enter → placeholder workspace, and theme persistence after reload. Search, note toggle, history navigation, and guard are covered.
  - `bun run build` — pass.
- **Screenshots/checks:**
  - `app/test-results/home-1280x800.png` — home, light.
  - `app/test-results/home-1280x800-dark.png` — home, dark after theme toggle.
  - `app/test-results/workspace-1280x800.png` — sample workspace with sidebar open.
  - Fonts still load locally; no Google Fonts requests and no console errors in the e2e run.
- **Blockers:** None.
- **Next:** Phase 2 — Reading page, only after user approval.

### Phase 2 — Reading page

- **Status:** Complete
- **Goal:** The center reading page: sentence, kana, translation toggle, sentence map, literal key, sentence note. Flat highlight pills only.
- **Completed:**
  - Added `ReadingSheet.svelte` with the surface, 16px radius, border, shadow, 720px max width, left margin rule, and vertical READING label.
  - Added `Sentence.svelte`: six selectable chunk buttons, selected border, click selection, and `1–6` keyboard selection.
  - Added `Kana.svelte` with the 14px muted reading line (15px dark via tokens).
  - Added `TranslationToggle.svelte`: Natural / Raw segmented control with `aria-pressed`, Vollkorn italic Natural text, colored chunk-order Raw gloss, and natural wrapping.
  - Added `SentenceMap.svelte`: topic line, six color dots on a connector, head/engine emphasis, modifier relationship row, and limiter. Stacks at ≤900px.
  - Added `LiteralKey.svelte`: quiet two-column hairline table above 900px, one column at ≤900px.
  - Added `SentenceNote.svelte`: Vollkorn note paragraphs; the left accent rule was later removed in the post-7.5 visual cleanup.
  - Replaced the workspace placeholder sheet with the real reading page; center scroll remains the only page-level scroll.
  - Kept pasted/manual sessions on the honest placeholder reader.
  - Fixed map head detection so “adverb” is not mistaken for the verb engine.
- **Decisions:**
  - Clicking a chunk and pressing `1–6` select it and update the center meta/sidebar header. Opening the full sidebar on selection remains Phase 3.
  - Translation mode is held in the Svelte store for the session. Persisting it to `localStorage` remains Phase 4.
  - Sentence map labels are derived from chunk roles (`main verb` → Engine, `particle` → Limiter, `accompaniment` → Companion); `(zeroは)` is shown for the sample session.
  - Raw gloss spans reuse the six chunk hues but are non-interactive and have no underline.
  - No sidebar construction/examples/grammar content was moved into the center.
- **Files touched:**
  - `app/src/App.svelte`
  - `app/src/lib/components/ReadingSheet.svelte` (new)
  - `app/src/lib/components/Sentence.svelte` (new)
  - `app/src/lib/components/Kana.svelte` (new)
  - `app/src/lib/components/TranslationToggle.svelte` (new)
  - `app/src/lib/components/SentenceMap.svelte` (new)
  - `app/src/lib/components/LiteralKey.svelte` (new)
  - `app/src/lib/components/SentenceNote.svelte` (new)
  - `app/src/lib/styles/base.css`
  - `app/tests/e2e/smoke.spec.ts`
  - `docs/HANDOFF.md`
- **Tests:**
  - `bun run check` — pass, 0 errors / 0 warnings.
  - `bun run lint` — pass.
  - `bun run test` — pass, 3 files / 7 tests.
  - `bun run test:e2e` — pass, 6 Chrome tests. Reader coverage includes six colored chunks, no underlines, no labels below 11px, no horizontal overflow, sentence map/key/note content, Natural/Raw toggle, click selection, all `1–6` keys, sidebar selection sync, and translation mode persistence across selection.
  - `bun run build` — pass.
- **Screenshots/checks:**
  - `app/test-results/reader-1280x800.png` — reading sheet top.
  - `app/test-results/reader-details-1280x800.png` — literal key and sentence note.
  - `app/test-results/reader-raw-1280x800.png` — Raw translation mode.
- **Blockers:** None.
- **Next:** Phase 3 — Breakdown sidebar, only after user approval.

### Phase 3 — Breakdown sidebar

- **Status:** Complete
- **Goal:** The right sidebar is the full breakdown. No separate Breakdown page, no mode tabs.
- **Completed:**
  - Rebuilt `BreakdownSidebar.svelte` with fixed header, independently scrolling body, and fixed Prev/count/Next footer.
  - Header shows chunk number/swatch, Japanese, kana, gloss, and a collapse chevron.
  - Body shows Role, Construction, Examples, and Grammar note.
  - Added `ConstructionTrace.svelte`: numbered vertical steps, downward arrows, JP/EN pairs, and a chunk-tinted final step.
  - Added `Examples.svelte`: numbered JP/EN rows with hairline separators.
  - Added `GrammarNote.svelte`: Vollkorn-scale note prose capped at 60ch.
  - Clicking a chunk selects it and opens/updates the sidebar; reclicking the selected chunk collapses it.
  - `1–6` selects and opens; `Esc` collapses; `Enter` reopens when collapsed.
  - The topbar note toggle, sidebar chevron, and 44px rail expand button all drive the same open state.
  - Sidebar body resets to the top whenever the selected chunk changes.
  - At ≥1100px the sidebar is a 300px grid column (320px at ≥1440) with a 44px collapsed rail.
  - At 900–1099px the sidebar is a right drawer over the center with a scrim, dialog semantics, initial focus, Tab trap, Esc, and scrim close. The history panel is not covered.
  - Opening a session defaults the sidebar open at ≥1100px and collapsed to its rail below 1100px.
- **Decisions:**
  - Save remains a disabled placeholder until Phase 4.
  - Focus returns to the selected chunk after drawer close is deferred; the current requirement is trap/close behavior.
  - The full responsive history rail and final breakpoint polish remain Phase 5. The Phase 3 drawer specifically covers 900–1099.
  - Manual paste sessions render Role/Grammar note only; construction/examples stay absent because no fake breakdown content is generated.
- **Files touched:**
  - `app/src/App.svelte`
  - `app/src/lib/components/BreakdownSidebar.svelte`
  - `app/src/lib/components/ConstructionTrace.svelte` (new)
  - `app/src/lib/components/Examples.svelte` (new)
  - `app/src/lib/components/GrammarNote.svelte` (new)
  - `app/src/lib/components/ReadingSheet.svelte`
  - `app/src/lib/components/Sentence.svelte`
  - `app/src/lib/stores/app.svelte.ts`
  - `app/tests/e2e/smoke.spec.ts`
  - `docs/HANDOFF.md`
- **Tests:**
  - `bun run check` — pass, 0 errors / 0 warnings.
  - `bun run lint` — pass.
  - `bun run test` — pass, 3 files / 7 tests.
  - `bun run test:e2e` — pass, 10 Chrome tests. Sidebar coverage includes full content, no duplicate natural translation, independent body scrolling, click selection, reclick collapse, Esc, Enter reopen, chevron/rail controls, pager boundaries, 1024px drawer, scrim close, focus trap initial focus, and note toggle.
  - `bun run build` — pass.
- **Screenshots/checks:**
  - `app/test-results/sidebar-1280x800.png` — full sidebar at 1280.
  - `app/test-results/sidebar-collapsed-1280x800.png` — 44px rail.
  - `app/test-results/sidebar-drawer-1024x800.png` — drawer and scrim at 1024.
- **Blockers:** None.
- **Next:** Phase 4 — History and persistence, only after user approval.

### Phase 4 — History and persistence

- **Status:** Complete
- **Goal:** Local-first sessions, save/undo, search, grouping, and reload persistence. No backend or login.
- **Completed:**
  - Added `persistence.ts` for localStorage preferences and IndexedDB sessions through `idb-keyval`.
  - Added `history.svelte.ts`: loads/seeds sessions, saves and undoes, restores the last session, and tracks a non-blocking storage warning.
  - History now seeds the three reference sessions on first run with relative timestamps, then renders real Today / Yesterday / Earlier groups.
  - Replaced static history fixtures with session-backed entries: derived preview, relative time, count, and unique color strip.
  - Search filters sessions by their sentence text.
  - Clicking a history item loads the session, updates the active item, and resets the center and sidebar scroll positions.
  - Save is now functional for unsaved sessions: it writes to IndexedDB, sets the last session, flips the topbar button to “Saved”, and shows a toast with Undo.
  - Undo removes the newly saved session, restores the previous last-session preference, and returns Save to its enabled state.
  - Theme, translation mode, history/note layout, and last session persist in `localStorage`.
  - Reload restores the last saved session, theme, translation mode, and panel layout.
  - IndexedDB failure seeds in-memory sessions, shows a warning in the history panel, and allows in-tab saving with a “Saved for this tab only” toast.
  - Added `Toast.svelte` with accessible status semantics, Undo, and a 3.2s timeout.
  - Added persistence/history unit tests using `fake-indexeddb`.
- **Decisions:**
  - The three reference sessions are seeded into IndexedDB on first run, so opening the sample shows “Saved” rather than asking to save an already-present session. Pasted sessions are the primary save/undo path.
  - Session previews are derived from `sentence`; sessions store `createdAt` and are sorted newest first.
  - No delete UI was added. Undo applies only to the just-saved session.
  - Layout is restored from `bunkai.layout` after the last session is restored, so a reload keeps a collapsed rail/drawer decision.
  - A saved copy receives a fresh `createdAt` so it moves to the top of history.
- **Files touched:**
  - `app/src/App.svelte`
  - `app/src/lib/components/HistoryPanel.svelte`
  - `app/src/lib/components/TopBar.svelte`
  - `app/src/lib/components/Toast.svelte` (new)
  - `app/src/lib/components/BreakdownSidebar.svelte`
  - `app/src/lib/data/sessions.ts`, `sessions.test.ts`
  - `app/src/lib/stores/app.svelte.ts`
  - `app/src/lib/stores/history.svelte.ts` (new)
  - `app/src/lib/stores/toast.svelte.ts` (new)
  - `app/src/lib/utils/persistence.ts` (new), `persistence.test.ts` (new)
  - `app/src/lib/utils/history.ts` (new), `history.test.ts` (new)
  - `app/tests/e2e/smoke.spec.ts`
  - `app/package.json`, `app/bun.lock`
  - `docs/HANDOFF.md`
- **Tests:**
  - `bun run check` — pass, 0 errors / 0 warnings.
  - `bun run lint` — pass.
  - `bun run test` — pass, 5 files / 12 tests (preferences, IndexedDB round-trip, history grouping/formatting/filtering, sample/manual data, tokens).
  - `bun run test:e2e` — pass, 15 Chrome tests. Persistence coverage includes save → reload, Undo, history item load, scroll reset, theme/translation/layout/last-session restoration, search, and IndexedDB-unavailable fallback.
  - `bun run build` — pass.
- **Screenshots/checks:**
  - `app/test-results/home-1280x800.png` — seeded history and home.
  - `app/test-results/history-save-toast-1280x800.png` — saved session with Undo toast.
  - Existing reader/sidebar/drawer screenshots still regenerate with the suite.
- **Blockers:** None.
- **Next:** Phase 5 — Desktop responsiveness, only after user approval.

### Phase 5 — Desktop responsiveness

- **Status:** Complete
- **Goal:** The 900px–1920px desktop layout, exactly. No phone layout.
- **Completed:**
  - History defaults to a 240px column at ≥1280px and a 56px expandable rail at 900–1279px.
  - The history rail expands to 240px on demand below 1280 via the topbar toggle or rail chevron.
  - Sidebar column: 300px at 1100–1439px, 320px at ≥1440px, 44px rail when collapsed.
  - At 900–1099px the sidebar stays a 44px rail by default and opens as a right drawer with scrim, dialog semantics, focus trap, Esc, and scrim close; the drawer does not cover the history rail.
  - Resizing down across 1280px collapses history; crossing below 1100px closes the sidebar to its rail.
  - Below 900px the app is replaced by the existing desktop guard.
  - Key/map stack at exactly 900px and use two-column/horizontal layouts at 901px and up.
  - Added geometry assertions for history/sidebar/center widths, sheet fit, topbar/meta fit, and drawer separation.
- **Decisions:**
  - A stored layout preference can keep history expanded below 1280px; a fresh/default session at those widths starts as a rail.
  - Resize behavior collapses panels on the way down but does not force-open panels on the way back up. Fresh loads at ≥1280 open history and fresh workspace loads at ≥1100 open the sidebar.
  - The Phase 5 checks are widths 900, 1024, 1099, 1100, 1200, 1279, 1280, and 1440 at 800px height.
  - Dark-mode breakpoint screenshots remain Phase 6 work.
- **Files touched:**
  - `app/src/App.svelte`
  - `app/src/lib/stores/app.svelte.ts`
  - `app/tests/e2e/smoke.spec.ts`
  - `docs/HANDOFF.md`
- **Tests:**
  - `bun run check` — pass, 0 errors / 0 warnings.
  - `bun run lint` — pass.
  - `bun run test` — pass, 5 files / 12 tests.
  - `bun run test:e2e` — pass, 18 Chrome tests. Responsive coverage includes all eight widths, no page/center horizontal overflow, correct column widths, sheet fit, topbar/meta fit, stacked vs two-column key/map, no orphaned last chunk, history expansion, resize-down behavior, and drawer/history separation.
  - `bun run build` — pass.
- **Screenshots/checks:**
  - `app/test-results/responsive-900x800.png`
  - `app/test-results/responsive-1024x800.png`
  - `app/test-results/responsive-1099x800.png`
  - `app/test-results/responsive-1100x800.png`
  - `app/test-results/responsive-1200x800.png`
  - `app/test-results/responsive-1279x800.png`
  - `app/test-results/responsive-1280x800.png`
  - `app/test-results/responsive-1440x800.png`
  - `app/test-results/history-expanded-1200x800.png`
  - `app/test-results/responsive-resized-1024x800.png`
  - `app/test-results/sidebar-drawer-1024x800.png`
- **Blockers:** None.
- **Next:** Phase 6 — Dark mode, only after user approval.

### Phase 6 — Dark mode

- **Status:** Complete
- **Goal:** Warm charcoal dark mode, readable contrast, no olive/green cast.
- **Completed:**
  - Verified the exact dark palette and gradients from `DESIGN.md`: bg `#12100E`, sheet `#1D1A16`, panel `#26221D`, ink `#F4EEE3`, muted `#C8C0B2`, line `#5C554B`, line-strong `#7A7062`, and accent `#9CC5E8`.
  - Confirmed kana renders at 15px / `#D8D0C2`; labels remain 11–12px.
  - Kept the six dark chunk variants and 18% / 26% fill mix.
  - Strengthened dark panel and control boundaries to `--line-strong` for ≥3:1 contrast.
  - Fixed the drawer scrim for dark mode: black 52% instead of the light-ink mix.
  - Verified the toast uses dark surface-2, line-strong border, ink text, and accent Undo.
  - Added contrast tests: ink/sheet 15.0:1, ink/panel 13.7:1, muted/sheet 9.6:1, muted/panel 8.8:1, line-strong/sheet 3.6:1, line-strong/panel 3.25:1, accent/sheet 9.6:1.
  - Added dark screenshots for the reader/all six chunks, sidebar examples, toast, drawer, and home.
  - Re-ran the full light suite to confirm light mode is unchanged.
- **Decisions:**
  - `--line` remains the low-contrast divider token; critical panel and control boundaries use `--line-strong` in dark.
  - Dark drawer scrim is a neutral black overlay so it darkens content rather than washing it with light ink.
  - Chunk hues remain small accents; no large sage/teal or olive surfaces were introduced.
- **Files touched:**
  - `app/src/lib/styles/base.css`
  - `app/src/lib/components/BreakdownSidebar.svelte`
  - `app/src/lib/styles/tokens.test.ts`
  - `app/tests/e2e/smoke.spec.ts`
  - `docs/HANDOFF.md`
- **Tests:**
  - `bun run check` — pass, 0 errors / 0 warnings.
  - `bun run lint` — pass.
  - `bun run test` — pass, 5 files / 14 tests (token values, dark contrast, chunk mixes, kana size, persistence, history, sample data).
  - `bun run test:e2e` — pass, 20 Chrome tests. Dark coverage includes reader, all six chunks, sidebar examples, toast, 1024 drawer/scrim, theme reload, and full light-mode regression.
  - `bun run build` — pass.
- **Screenshots/checks:**
  - `app/test-results/home-1280x800-dark.png`
  - `app/test-results/dark-reader-1280x800.png`
  - `app/test-results/dark-sidebar-examples-1280x800.png`
  - `app/test-results/dark-toast-1280x800.png`
  - `app/test-results/dark-drawer-1024x800.png`
- **Blockers:** None.
- **Next:** Phase 7 — AI/API, only after approval and provider confirmation.

### Post-Phase 6 — Motion polish

- **Status:** Complete
- **Goal:** Add a collapsing sidebar-text animation and one restrained secondary animation using a Framer library, without changing the visual system.
- **Completed:**
  - Added `motion` 14.9.0, the framework-agnostic Framer Motion DOM package, for Svelte-compatible animation.
  - Sidebar panel and rail now stay mounted and crossfade/slide; the panel keeps its open width while the grid column clips it from 300/320px down to 44px, so text does not reflow or squish during collapse.
  - Added a 220ms grid-column transition and a 160–220ms panel fade/slide; the rail fades in/out with it.
  - The 900–1099 drawer now slides in with a fixed-width panel while the scrim fades; drawer opacity stays at 1 during the slide.
  - Natural/Raw translation content crossfades with a small 4px rise.
  - Inactive panel/rail/scrim are `aria-hidden` + `inert`; focus-trap behavior is unchanged.
  - Added reduced-motion support in both CSS and the JS motion utilities; with reduced motion, states change instantly.
- **Decisions:**
  - Used `motion` (Framer Motion's framework-agnostic `animate` API) rather than React-only `framer-motion` components, because the app is Svelte 5.
  - Grid width/column collapse uses CSS; Framer handles opacity/transform. This keeps layout transitions smooth while avoiding animated width on JS.
  - The sidebar panel remains in the DOM when collapsed so it can animate and be clipped cleanly; `inert`/`aria-hidden` keep it out of interaction and the accessibility tree.
  - Static screenshots remain visually unchanged; animations are interaction-only.
- **Files touched:**
  - `app/package.json`, `app/bun.lock`
  - `app/src/App.svelte`
  - `app/src/lib/components/BreakdownSidebar.svelte`
  - `app/src/lib/components/TranslationToggle.svelte`
  - `app/src/lib/utils/motion.ts` (new)
  - `app/src/lib/styles/tokens.css`
  - `app/tests/e2e/smoke.spec.ts`
  - `docs/HANDOFF.md`
- **Tests:**
  - `bun run check` — pass, 0 errors / 0 warnings.
  - `bun run lint` — pass.
  - `bun run test` — pass, 5 files / 14 tests.
  - `bun run test:e2e` — pass, 21 Chrome tests. Includes sidebar state/rail checks, drawer/scrim, translation switching, and a dedicated reduced-motion sidebar test.
  - `bun run build` — pass.
- **Screenshots/checks:**
  - Existing responsive, reader, sidebar, drawer, dark, and toast screenshots regenerate unchanged after the animation pass.
  - Motion is interaction-only; reduced motion is verified in Playwright.
- **Blockers:** None.
- **Next:** Phase 7 — AI/API, only after provider confirmation.

### Phase 7 — AI / API

- **Status:** Complete
- **Goal:** Optional BYO-key AI breakdowns, with sample/manual mode as the default.
- **Completed:**
  - Added an AI settings drawer opened from the topbar gear, with provider, model, API key, security warning, Test connection, Save, and Remove key.
  - Providers: OpenRouter, OpenCode, OpenAI, and Claude. OpenRouter and OpenCode are first in the provider order.
  - Added an adapter layer with direct browser requests for OpenRouter/OpenAI/Claude and a user-supplied OpenAI-compatible proxy endpoint for OpenCode.
  - Added loading, invalid-key, rate-limit, network, model, timeout, and malformed-output error states in plain language.
  - Home now shows the active AI provider/model or sample mode, and generates AI breakdowns when configured.
  - AI-generated sessions are saved to history automatically when generation succeeds, then opened as workspaces with full chunks, map, literal key, note, and sidebar data. The save toast offers Undo.
  - Manual pasted-sentence placeholders remain unsaved until the user presses Save.
  - Invalid AI requests keep the user on Home with an inline error, an AI settings link, and a manual-placeholder fallback.
  - Per-provider API keys, models, and the OpenCode proxy are stored only in `localStorage` under `bunkai.ai`.
  - API keys are never prefilled, displayed after save, placed in IndexedDB, or logged. The key input clears after save.
  - The security copy states that browser storage is not a vault and that requests go directly from the browser to the provider; there is no Bunkai server.
  - OpenCode direct browser calls were verified to be CORS-blocked; the app requires the user's proxy endpoint and the proxy can see the key.
  - The OpenCode proxy field accepts either a base URL such as `http://127.0.0.1:8787/v1/` or a full chat-completions URL. The request layer strips trailing slashes, appends `/chat/completions` when missing, and preserves a full endpoint unchanged.
  - The proxy must return `Access-Control-Allow-Origin` on actual POST responses, not only on the OPTIONS preflight; otherwise browsers report a network failure even though the proxy is reachable.
  - Translation defaults to Raw on a fresh install. Raw and Natural share the same reading font; Natural is no longer italic.
  - Natural translation is highlighted by semantic chunk color. `Session.naturalParts` stores text segments mapped to chunk numbers, so English phrases keep their Japanese chunk color even when the English order differs.
  - The AI prompt requires `naturalParts` that concatenate exactly to `natural`; the parser validates the join and falls back to a plain natural translation if the model omits or mismatches it.
  - Added per-chunk furigana segments with `name` and `word` kinds. The sentence renders ruby above kanji; kana-only text stays plain.
  - The AI prompt returns furigana that reconstructs each chunk exactly, keeps okurigana outside the ruby, and labels proper names separately from ordinary kanji vocabulary.
  - The topbar now has a furigana panel replacing the note toggle: independent **Name** and **Furigana** switches. The note panel still collapses and reopens from its own header and rail controls.
  - Both furigana switches default on and persist as `{ name, word }` in `bunkai.furigana`. Legacy `none` / `name` / `word` / `all` values migrate automatically.
  - When any furigana is visible, every chunk in that sentence reserves the same top padding. Chunks without readings therefore keep the same highlighter height as chunks with ruby.
  - Added `naturalParts` and furigana to the sample and seed sessions. Stored seed sessions from older IndexedDB data inherit both on load.
  - Sessions missing natural colors or furigana show a **Missing details → Add colors & readings** row in the reading sheet. It asks the active provider to add the natural-translation mapping and furigana without regenerating the breakdown, updates the current session, and persists it in history. If the session was never saved, it is added to history so the enrichment survives reload.
  - Added a trailing-punctuation normalization so generated chunks still render the user's sentence faithfully when the model omits final punctuation; the same punctuation is appended to the last furigana segment.
  - Rebuilt the sentence map around Cure Dolly's model: a topic frame, an A-car → B-engine spine, ghost `(zeroは)` / `(zeroが)` nodes, and refined modifier roles. The default is the horizontal **Row** view; a **Tree** toggle shows the nested modifier hierarchy for readers who want it.
  - Added curated guide references to the bottom of the chunk detail. Cure Dolly lessons link to the matching YouTube lesson and the Guides section also links to the Cure Dolly transcript archive on GitHub; Tae Kim references cite section and page. References appear only for grammar points covered by the guides, are capped at two per chunk, and are never forced onto plain chunks.
  - Added a visible loading state for manual submissions as well as AI requests. The send button becomes a spinner, manual mode shows “Preparing workspace…”, and AI mode shows the active provider.
- **Decisions:**
  - OpenRouter, OpenAI, and Claude are direct browser calls. OpenCode uses a user-supplied proxy because its API blocks browser CORS.
  - The OpenCode proxy is treated as a base URL by default, so `http://127.0.0.1:8787/v1/` posts to `http://127.0.0.1:8787/v1/chat/completions`. Full `/chat/completions` URLs still work.
  - AI settings use a per-provider `bunkai.ai` object rather than the single `bunkai.apiKey` listed in the older manifest; this supports multiple providers without discarding other keys.
  - Provider defaults are editable: OpenRouter `openrouter/auto`, OpenCode `deepseek-v4.1-flash`, OpenAI `gpt-5.2`, Claude `claude-sonnet-4-6`.
  - AI output is saved to history automatically when generation succeeds, so it survives navigation and reload; the toast offers Undo. Manual placeholder sessions still require an explicit Save. Sample/manual mode remains fully available with no key.
  - Raw is the default translation mode for a fresh install. A stored user preference still wins after the first toggle.
  - Natural highlighting is semantic, not positional: each English segment stores the chunk number whose meaning it carries, so the colors follow meaning when English word order changes. Segments with no matching chunk stay unhighlighted.
  - Furigana is controlled by two independent switches, Name and Furigana, both on by default. Name covers proper nouns; Furigana covers ordinary kanji vocabulary. Kana-only text never gets furigana. Legacy four-mode preferences migrate to the matching boolean pair.
  - The topbar note toggle was replaced by the furigana switches. The note panel remains reachable through its collapse button and rail, so no note functionality was lost.
  - Older AI sessions are enriched with an explicit **Add colors & readings** action rather than an automatic AI call. It uses the active provider/model, keeps the existing natural translation and chunks, and only adds the missing mappings and furigana.
  - The Cure Dolly map is derived locally from the chunk roles and particles, so it also works on existing saved sessions and does not depend on another AI schema. It restores the horizontal **Row** view as the default and keeps the nested **Tree** view behind a toggle; both mark zero topic/subject nodes and refined roles.
  - Guide references are a curated local table, not model-generated. This avoids invented lesson numbers and links; a chunk gets at most two references, and only when a matching grammar pattern is present. Cure Dolly citations include the YouTube lesson plus a link to the GitHub transcript archive.
  - Manual submissions keep the loading state visible for a short minimum so the send action always has feedback, even when no AI call is made.
  - Non-Japanese input validation is intentionally deferred until the user asks for it.
  - The settings drawer is a modal overlay, not a fourth app column.
- **Files touched:**
  - `app/src/lib/ai/providers.ts` (new)
  - `app/src/lib/ai/settings.ts` (new), `settings.test.ts` (new)
  - `app/src/lib/ai/breakdown.ts` (new), `breakdown.test.ts` (new)
  - `app/src/lib/stores/ai.svelte.ts` (new)
  - `app/src/lib/components/AiSettingsDrawer.svelte` (new)
  - `app/src/lib/components/Home.svelte`
  - `app/src/lib/components/TopBar.svelte`
  - `app/src/lib/components/ReadingSheet.svelte`
  - `app/src/lib/components/TranslationToggle.svelte`
  - `app/src/lib/components/Sentence.svelte`
  - `app/src/lib/components/SentenceMap.svelte`
  - `app/src/lib/components/BreakdownSidebar.svelte`
  - `app/src/lib/data/types.ts`
  - `app/src/lib/data/sample.ts`, `sample.test.ts`
  - `app/src/lib/data/sessions.ts`, `sessions.test.ts`
  - `app/src/lib/data/sentenceMap.ts`, `sentenceMap.test.ts` (new)
  - `app/src/lib/data/references.ts`, `references.test.ts` (new)
  - `app/src/lib/stores/app.svelte.ts`
  - `app/src/lib/stores/history.svelte.ts`
  - `app/src/lib/utils/persistence.ts`, `persistence.test.ts`
  - `app/src/App.svelte`
  - `app/tests/e2e/smoke.spec.ts`
  - `docs/HANDOFF.md`
- **Tests:**
  - `bun run check` — pass, 0 errors / 0 warnings.
  - `bun run lint` — pass.
  - `bun run test` — pass, 9 files / 47 tests (Cure Dolly map derivation, nested modifier targets, zero pronouns, curated guide references, AI request shapes, session enrichment requests, natural-part parsing and spacing repair, furigana parsing and punctuation repair, furigana preference migration, base-URL normalization, settings storage, error mapping, sample/seed mapping, plus prior suites).
  - `bun run test:e2e` — pass, 32 Chrome tests. AI coverage includes settings save/test/remove, no key in DOM, OpenRouter generation with loading and auto-save, history reopen after navigating home and reload, on-demand color and furigana enrichment for older sessions, OpenCode proxy generation, invalid-key fallback, rate-limit error, Escape isolation, and dark settings. Translation coverage includes Raw default, shared font, semantic natural highlights, and preference persistence. Furigana coverage includes independent Name/Furigana switches, AI name-vs-word readings, Escape behavior, and reload persistence. Map/reference coverage includes the default Row map, Tree toggle, A-car/B-engine roles, nested modifier targets, optional guide citations with the GitHub archive, and zero-reference chunks; loading coverage includes the manual send state.
  - `bun run build` — pass.
- **Screenshots/checks:**
  - `app/test-results/ai-settings-1280x800.png`
  - `app/test-results/ai-settings-1280x800-dark.png`
  - `app/test-results/ai-breakdown-1280x800.png`
  - `app/test-results/ai-old-session-1280x800.png`
  - `app/test-results/ai-enriched-1280x800.png`
  - `app/test-results/furigana-all-1280x800.png`
  - `app/test-results/furigana-menu-1280x800.png`
  - `app/test-results/workspace-1280x800.png`
  - `app/test-results/sentence-map-tree-1280x800.png`
  - `app/test-results/chunk-references-1280x800.png`
  - `app/test-results/reader-raw-1280x800.png`
  - `app/test-results/reader-natural-1280x800.png`
  - Existing home/reader/sidebar/responsive/dark screenshots still regenerate.
- **Blockers:** None. OpenCode direct CORS is resolved by the BYO proxy decision.
- **Next:** Phase 8 — PWA and sharing, only after user approval.

### Phase 7.5 — Tatoeba example layer

- **Status:** Complete for 7.5A (data layer) and 7.5B (sidebar UI). 7.5C not started.
- **Goal:** Add real, attributed Tatoeba example sentences under the selected chunk, cached
  locally, with generated examples as the fallback. No backend or paid service.
- **Completed:**
  - Added a short `lookup` field to chunks and requested it in the AI breakdown prompt; the
    parser stores it and old sessions derive a fallback on read.
  - Added Tatoeba types, query normalization, lookup derivation, URL builders, response
    mapper, fetch client, IndexedDB cache, and a Svelte store.
  - Added lookups to the six sample chunks and both seed sessions.
  - Added the “From Tatoeba” subsection under Examples: 2–3 JP/EN rows, source links,
    contributor/license attribution, licensed audio, Search Tatoeba link, and a section
    attribution line.
  - Added loading, error, empty, skipped, cached, and generated-fallback states.
  - Fetches only while the sidebar is open; debounces 250ms and aborts on chunk changes.
  - Added a Playwright fixture that mocks `api.tatoeba.org` for every e2e test; no automated
    test calls the live API.
  - Added 9 Tatoeba e2e tests and 45 net-new unit tests (47 → 92).
  - Updated the Source of Truth, plan, design, manifest, handoff, and created
    `research/tatoeba/` with verified API, licensing, findings, log, and decisions.
  - Manually verified the live API: sample chunk 05 (`共有`) returned three real examples,
    correct source links/attribution, no console errors.
- **Decisions:**
  - Automatic fetching is accepted (user choice); only the sanitized lookup term is sent.
    No opt-out toggle in this phase.
  - Use a 12s timeout (cold searches took 8–30s), request `limit=10`, display up to 3.
  - Do not trust the API's `download_url`: it uses the singular `/v1/audio/` path and 404s.
    Use `https://api.tatoeba.org/v1/audios/{id}/file`.
  - Only show audio with a non-empty license; display the audio author and license.
  - Require query containment, 5–40 Japanese characters, and dedupe by sentence id and
    normalized English. Exclude the current session sentence.
  - Show generated examples only when Tatoeba is empty/error/skipped, labelled “Generated
    examples”; hide them while Tatoeba is loading or has results.
  - Cache mapped examples (not raw responses) for 30 days, capped at 500; cache empty
    results, do not cache errors. Reuse `idb-keyval`; no new dependency.
  - Desktop-only. No new colors; the section uses existing tokens.
  - 7.5C remains gated on explicit approval.
- **Files touched:**
  - `app/src/lib/data/types.ts`, `sample.ts`, `sample.test.ts`, `sessions.ts`, `sessions.test.ts`
  - `app/src/lib/ai/breakdown.ts`, `breakdown.test.ts`
  - `app/src/lib/tatoeba/types.ts`, `lookup.ts`, `lookup.test.ts`, `client.ts`,
    `client.test.ts`, `cache.ts`, `cache.test.ts`
  - `app/src/lib/stores/tatoeba.svelte.ts`
  - `app/src/lib/components/TatoebaExamples.svelte`, `BreakdownSidebar.svelte`
  - `app/tests/e2e/fixtures.ts`, `tatoeba-fixtures.ts`, `tatoeba.spec.ts`, `smoke.spec.ts`
  - `docs/SOURCE_OF_TRUTH.md`, `PLAN.md`, `DESIGN.md`, `manifest.md`, `HANDOFF.md`
  - `research/tatoeba/` (new: README, api, log, findings, open-questions, decisions, raw JSON)
  - No `app/package.json` or `bun.lock` changes.
- **Tests:**
  - `bun run check` — pass, 0 errors / 0 warnings.
  - `bun run lint` — pass.
  - `bun run test` — pass, 12 files / 92 tests.
  - `bun run test:e2e` — pass, 41 Chrome tests (32 existing + 9 Tatoeba).
  - `bun run build` — pass.
  - Manual live check — pass; Tatoeba returned real `共有` examples and no console errors.
- **Screenshots/checks:**
  - `app/test-results/tatoeba-sidebar-1280x800.png` — light, mocked examples.
  - `app/test-results/tatoeba-sidebar-1280x800-dark.png` — dark, mocked examples.
  - `app/test-results/tatoeba-live-1280x800.png` — live API `共有` examples.
- **Blockers:** None.
- **Known risks:** Tatoeba latency can spike (observed up to 30s cold); the 12s timeout,
  cache, and generated fallback handle it. Empty-license audio is intentionally omitted.
  Substring search can be noisy; the containment filter and short content lookups reduce it.
- **Next:** Approve 7.5C, or proceed to Phase 8 — PWA and sharing.

### Post-Phase 7.5 — Visual cleanup

- **Status:** Complete
- **Goal:** Remove the colored left-border accent pattern from notes, error/warning boxes,
  active rows, and map boxes. It read as generic AI-generated UI.
- **Completed:**
  - Removed the accent rule from `SentenceNote.svelte`; the section hairline and typography
    now carry the note.
  - Removed the accent left border from the Home AI error box; it keeps its full border and
    surface.
  - Removed the accent left border and panel fill from the AI settings provider note; it is
    now quiet helper text.
  - Removed the accent left border from the active history row; the soft tint remains.
  - Removed the chunk-colored left borders from the sentence-map tree cards and modifiers;
    the colored dots and labels carry the chunk identity.
  - Kept structural panel edges and the neutral reading-sheet rule.
  - Updated `SOURCE_OF_TRUTH.md`, `DESIGN.md`, `PLAN.md`, and `HANDOFF.md`.
- **Decisions:**
  - No colored left-border accents on notes, cards, active rows, or diagram boxes.
  - Structure comes from tint, spacing, hairlines, dots, and type.
- **Files touched:**
  - `app/src/lib/components/SentenceNote.svelte`, `Home.svelte`, `AiSettingsDrawer.svelte`,
    `HistoryPanel.svelte`, `SentenceMap.svelte`
  - `docs/SOURCE_OF_TRUTH.md`, `DESIGN.md`, `PLAN.md`, `HANDOFF.md`
- **Tests:**
  - `bun run check` — pass.
  - `bun run lint` — pass.
  - `bun run test` — pass.
  - `bun run test:e2e` — pass.
  - `bun run build` — pass.
- **Screenshots/checks:**
  - `app/test-results/reader-details-1280x800.png` — sentence note without the accent rule.
  - `app/test-results/sidebar-1280x800.png` — active history row with tint only.
  - `app/test-results/sentence-map-tree-1280x800.png` — map tree without colored left borders.
  - `app/test-results/ai-settings-opencode-1280x800.png` — provider note as plain text.
  - No colored left-edge accents remain; only structural panel edges and neutral rules.
- **Blockers:** None.
- **Next:** Approve 7.5C, or proceed to Phase 8 — PWA and sharing.

### Post-Phase 7.5 — Repository restructure

- **Status:** Complete
- **Goal:** Turn the docs-plus-subfolder project into a single-app repository with a
  t3code-style root README, docs index, CI, and a clean private history.
- **Completed:**
  - Moved the app from `app/` to the repository root; commands now run from the root.
  - Removed `app/` and the generated `node_modules`/`dist`/`test-results` folders; reinstalled
    dependencies at the root.
  - Updated the current docs for the root layout. Historical phase entries keep their old
    `app/` paths with a layout note.
  - Added a root `.gitignore` excluding local-only design, play, archive, and third-party
    research material.
  - Added a root `README.md` with the 文 mark, a fresh workspace hero, feature summary,
    quick start, docs links, and Tatoeba/Fontsource credits.
  - Added `docs/README.md` as the docs index.
  - Added `.github/readme/hero.png` and a minimal `.github/workflows/ci.yml`.
  - Added the private GitHub remote at
    `https://github.com/GilbertImmanuel/bunkai` and pushed `main`.
  - No `LICENSE` yet; MIT is planned for the public release.
- **Decisions:**
  - The app lives at the repository root; `docs/` and `research/tatoeba/` are subfolders.
  - `design/`, `play/`, `archive/`, and the third-party research files are local-only.
  - The first seven commits are a retrospective reconstruction from the phase log and file
    timestamps; the README/setup commit is the first real current commit.
  - The README uses the existing favicon 文 mark instead of a generated icon asset.
- **Files touched:**
  - Root: `README.md`, `.gitignore`, `.github/readme/hero.png`,
    `.github/workflows/ci.yml`
  - `docs/README.md`, `SOURCE_OF_TRUTH.md`, `DESIGN.md`, `PLAN.md`, `manifest.md`,
    `HANDOFF.md`, `KICKOFF.md`
  - App files moved from `app/` to `src/`, `tests/`, `public/`, and root configs.
- **Tests:**
  - `bun run check` — pass.
  - `bun run lint` — pass.
  - `bun run test` — pass.
  - `bun run test:e2e` — pass.
  - `bun run build` — pass.
- **Screenshots/checks:**
  - `.github/readme/hero.png` — fresh 1280×800 workspace screenshot.
- **Blockers:** None.
- **Next:** Approve 7.5C, or proceed to Phase 8 — PWA and sharing.

### Phase 8 — PWA / sharing

- **Status:** 8A (PWA/offline) and 8B (export/import) complete. 8C (optional share link)
  and deployment are pending.
- **Goal:** Installable static app, offline shell, export/import, simple sharing.
- **Completed (8A):**
  - Added `vite-plugin-pwa` 2.0.0 and generated a web manifest with the 文-mark icon set:
    192, 512, maskable 512, and Apple touch.
  - Precache the app shell, hashed JS/CSS, `woff2` fonts, favicon, and icons. No AI or
    Tatoeba API responses are runtime-cached.
  - Added an SPA navigation fallback and `cleanupOutdatedCaches`.
  - Added a quiet update banner driven by `virtual:pwa-register`: Reload applies the waiting
    service worker; Later dismisses it until the next launch. No silent reload.
  - Show “Ready to work offline” through the existing toast on first install.
  - Updated the theme-color meta with light/dark mode and added the Apple touch icon link.
  - Added `bun run test:pwa` with a built-preview test that checks the manifest, service
    worker control, and offline reload/workspace.
  - Added the PWA icon generator config and `bun run icons`.
- **Completed (8B):**
  - Added `src/lib/data/backup.ts`: versioned `BackupFile` schema, 10 MB / 10,000-session
    limits, strict session/chunk validation, deep copying, and dated filenames.
  - Export writes session text only. API keys, preferences, and the Tatoeba cache are never
    included.
  - Import previews the session count and export date, then supports **Merge** (default,
    skips existing ids) or **Replace** (requires a confirmation checkbox).
  - The Settings drawer now has **AI** and **Data** tabs. The topbar gear and close labels
    are now general “Settings”.
  - Successful imports close Settings and show a toast; Replace also clears the saved
    last-session pointer and returns Home. Invalid files show an inline error and leave
    history unchanged.
  - Added backup unit tests and five e2e tests: export, merge, replace, invalid file, and
    duplicate-id merge.
- **Decisions:**
  - Prompt-based updates (`registerType: 'prompt'`, `skipWaiting: false`,
    `clientsClaim: false`) rather than auto-reload.
  - Precache `woff2` only; the `woff` fallback is not precached.
  - The service worker caches static app assets only, never provider or Tatoeba responses.
  - Icons are generated once from `public/favicon.svg`; the generator is a dev dependency.
  - Backups live in Settings → Data, not in the history panel; settings is the single
    configuration surface.
  - Backups contain sessions only. Preferences are excluded because applying them on import
    would be a surprising side effect.
  - Merge is the default; Replace is destructive and requires an explicit checkbox.
  - Replace clears the last-session pointer so a reload does not restore a removed session.
  - Backups are plain JSON. There is no encryption and no undo; the file is readable text.
  - No deployment target chosen yet; `dist/` remains a static build.
- **Files touched:**
  - `vite.config.ts`, `index.html`, `package.json`, `bun.lock`, `tsconfig.node.json`
  - `pwa-assets.config.ts`, `playwright.pwa.config.ts`, `tests/pwa/pwa.spec.ts`,
    `tests/e2e/backup.spec.ts`
  - `src/vite-env.d.ts`, `src/App.svelte`, `src/lib/components/PwaUpdate.svelte`
  - `src/lib/data/backup.ts`, `backup.test.ts`, `sessionValidation.ts`
  - `src/lib/components/DataPanel.svelte`, `AiSettingsDrawer.svelte`, `TopBar.svelte`
  - `src/lib/stores/history.svelte.ts`
  - `public/pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`,
    `apple-touch-icon-180x180.png`
  - `docs/SOURCE_OF_TRUTH.md`, `PLAN.md`, `DESIGN.md`, `manifest.md`, `HANDOFF.md`, `README.md`
- **Tests:**
  - `bun run check` — pass.
  - `bun run lint` — pass.
  - `bun run test` — pass, 104 tests.
  - `bun run test:e2e` — pass, 46 tests.
  - `bun run test:pwa` — pass, 1 test (manifest, service worker, offline reload).
  - `bun run build` — pass; `dist/manifest.webmanifest`, `dist/sw.js`, and Workbox runtime
    generated.
- **Screenshots/checks:**
  - PWA icons: `public/pwa-192x192.png`, `public/pwa-512x512.png`,
    `public/maskable-icon-512x512.png`, `public/apple-touch-icon-180x180.png`.
  - Precache: 19 entries, ~3.2 MB, no duplicate URLs.
  - Manual update prompt: forced a waiting service worker; the banner appeared, and Reload
    cleared it. Screenshot: `test-results/pwa-update-1280x800.png`.
  - Data settings: `test-results/data-settings-1280x800.png`.
  - Import preview: `test-results/data-import-1280x800.png`.
- **Blockers:** None.
- **Next:** Decide 8C (optional read-only share link) and the deployment target. The backup
  export/import layer is complete.

### Phase 9 — Polish and release

- **Status:** Pending
- **Completed:** —
- **Tests:** —
- **Next:** —

---

## Environment

| Tool | Version | Note |
|---|---|---|
| Node | 24.21.0 | Compatible with Vite 8 / Svelte 5 |
| Bun | 1.3.14 | Confirmed package manager |
| npm | 9.7.1 | Not used |
| Chrome | 156.0.8078.74 | Manual/Playwright channel |
| Edge | 156.0.4314.58 | Manual/Playwright channel |
| Playwright browsers | Not installed | Uses system Chrome via `channel: "chrome"` |
| Git | 2.44.0 | No repository initialized |

**Dependency status (after Phase 8B):**

- App scaffolded at the repository root with Vite 8.3.5, Svelte 5.57.3, TypeScript 6.0.3.
- `idb-keyval` 6.3.0 installed and wired to `bunkai.sessions`.
- `fake-indexeddb` 6.2.7 installed for Vitest persistence tests.
- `motion` 14.9.0 installed for Framer Motion DOM animations.
- No new runtime dependency for Tatoeba; `idb-keyval` 6.3.0 is reused for the cache.
- `vite-plugin-pwa` 2.0.0 and `@vite-pwa/assets-generator` 2.0.0 installed as dev
  dependencies for the PWA manifest, service worker, and icon generation.
- Fontsource Shippori Mincho, Vollkorn, iA Writer Quattro, and iA Writer Mono 5.3.0 installed and self-hosted.
- Vitest 5.0.5, Playwright 1.64.1, svelte-check 4.7.8, ESLint 10.14.0, Prettier 3.9.10 installed.
- `bun.lock` present.

---

## Decisions carried into implementation

- Desktop-only, 900px floor, guard below 900.
- Bun package manager.
- Vite 8 + Svelte 5 + TypeScript.
- Plain CSS + tokens; no Tailwind.
- Local-first; no backend/auth.
- localStorage + IndexedDB (`idb-keyval`).
- History = breakdown sessions, not chat threads.
- One workspace; right sidebar is the full breakdown; no separate Breakdown page.
- Flat highlight pills; no fake brushstroke.
- Warm neutral light/dark; no olive/green cast in dark mode.
- Fonts self-hosted via Fontsource.
- Only history, center, and sidebar scroll.
- No fullscreen/focus button.
- No marketing/landing page in this phase.
- AI/API is complete (Phase 7); PWA is Phase 8.
- Tatoeba is an optional, read-only example layer. Direct browser fetch, no backend, no
  key, local cache. Generated examples remain the fallback.
- Tatoeba text and audio are attributed; empty-license audio is not reused.
- 7.5C (Home sentence picker) is not approved.
- Phase 8A uses prompt-based PWA updates; the service worker caches only static app assets,
  never AI or Tatoeba API responses.
- Phase 8B exports sessions as plain JSON and imports with merge/replace; backups exclude
  API keys, preferences, and the Tatoeba cache.

---

## Open questions

- Approve Phase 7.5C (Home “Find a sentence” picker), or proceed to Phase 8C/deployment?
- Phase 8C (read-only share link) and the deployment target are still undecided.
- A Tatoeba opt-out preference is deferred. Automatic fetching is accepted; revisit only
  if the user wants an explicit toggle.
- Inline attribution of the English translation author is deferred; the source link opens
  the Tatoeba sentence page, which lists all contributors.

If a question changes scope, add it here and resolve it in `SOURCE_OF_TRUTH.md` before
coding around it.

---

## Handoff template (copy for each phase)

```markdown
### Phase N — Name

- **Status:** Complete / In progress / Blocked
- **Goal:**
- **Completed:**
- **Decisions:**
- **Files touched:**
  - `app/src/...`
- **Tests:**
  - `bun run check` — pass/fail
  - `bun run lint` — pass/fail
  - `bun run test` — pass/fail
  - `bun run test:e2e` — pass/fail
- **Screenshots/checks:**
  - `900` light/dark:
  - `1024` light/dark:
  - `1280` light/dark:
  - `1440` light/dark:
- **Blockers:**
- **Next:**
```

---

## Phase completion checklist

Before marking a phase complete:

- [ ] Acceptance criteria in `PLAN.md` pass.
- [ ] `bun run check` passes.
- [ ] `bun run lint` passes.
- [ ] Relevant tests pass.
- [ ] No horizontal scroll or clipping at supported widths.
- [ ] No new console errors.
- [ ] No scope creep (no phone layout, auth, backend, marketing, chat threads).
- [ ] `HANDOFF.md` updated with status, files, tests, decisions, blockers, next.
- [ ] If a decision changed, `SOURCE_OF_TRUTH.md` updated first.

---

## Known risks

| Risk | Mitigation |
|---|---|
| Prototype was a single HTML file; porting may copy its inline state | Componentize; use Svelte state/stores; do not copy the single file |
| Google Fonts CDN creates network dependency | Self-host Fontsource; verify no Google Fonts requests |
| Dark mode can drift olive/green | Use the tokens in `DESIGN.md`; screenshot at 1280/1024 |
| Responsive breakpoints can invert | Verify 1200/1279/1280; history must be a rail below 1280 |
| Sidebar drawer can cover history | Drawer starts at right; history rail remains visible; scrim + close |
| API key in browser is not secure | Phase 7 warning; no backend; never log; sample mode default |
| Tatoeba latency spikes | 12s timeout, 30-day cache, generated fallback, retry link |
| Tatoeba search noise | short content lookups, containment filter, duplicate removal |
| Tatoeba licensing/attribution mistakes | per-sentence and per-audio attribution; omit empty-license audio; source links |
| PWA cache serves stale assets | `cleanupOutdatedCaches`; prompt the user to reload a waiting service worker |
| PWA precache is large | Precache `woff2` only (19 entries, ~3.2 MB); no API responses |
| Silent reload loses unsaved state | Prompt-based updates; Reload is explicit |
| Backup file is readable plain text | Session text only; no keys or cache; treat backups as sensitive |
| Replace import is destructive | Explicit confirmation checkbox; clear last-session pointer; no automatic replace |
| Malformed backup breaks the reader | Strict session/chunk validation before import; inline error and no history change |
| Playwright browsers missing | Use system Chrome/Edge with `channel`, or install Chromium |
| Scope creep into phone/marketing/auth | Read `SOURCE_OF_TRUTH.md`; stop and ask |
