# Bunkai — Source of Truth

**Status:** Canonical. Last updated: 2026-11-24.

**Rule:** If any document, prototype, comment, or task conflicts with this file, this file wins. Update this file first, then update the dependent docs.

---

## 1. What Bunkai is

Bunkai is a **desktop-first web app for reading Japanese sentences in pieces**.

- **User:** an intermediate Japanese learner reading native Japanese.
- **Job:** open or paste a sentence → see it chunked → inspect a chunk → read the literal gloss, construction, examples, and grammar note → save the breakdown.
- **Value:** the sentence's structure, not just a translation.
- **One line:** a reading desk for Japanese sentences — see the chunks, understand the structure, keep the sentence.

It is **not** a dictionary, a chatbot, a flashcard app, or a marketing site.

---

## 2. MVP scope

The first usable version includes:

1. **Home** — sample sentence card, combined paste input + send arrow, history rail.
2. **Reader** — the sentence, colored chunk highlights, kana reading, Natural/Raw translation toggle, sentence map, literal key, and sentence note.
3. **Breakdown sidebar** — the selected chunk's role, construction, examples, and grammar note. It is a sidebar, not a separate page.
4. **History** — local breakdown sessions, save/undo, search, grouped by date.
5. **Light and dark mode** — warm neutral light mode and warm charcoal dark mode.
6. **Desktop responsiveness** — supported from 900px wide; a guard below 900px.
7. **Sample/manual content** — the app works with sample sentences and does not require an API key.
8. **Static, local-first** — no backend, no login, no cloud sync; users serve the static
   build on their own device.
9. **Optional Tatoeba examples** — real Japanese example sentences with approved English
   translations and licensed audio, fetched directly from `api.tatoeba.org` and cached
   locally. Tatoeba is a read-only content layer; the app works without it.

## 3. Non-goals (for now)

- Phone/mobile layout. The app is desktop-only; below 900px it shows a guard.
- A marketing site. Marketing is a later, separate concern.
- Accounts, login, cloud sync, or a database.
- Chat threads or chat bubbles. History is a list of **breakdown sessions**.
- A separate Reader/Breakdown page switch. The sidebar is the breakdown.
- AI/API integration before Phase 7.
- PWA/installability before Phase 8.
- A hosted deployment, public demo, or share link. Distribution is local-only.
- Fake highlighter brushstrokes. Flat tinted highlights are the chosen style.
- Paper textures, grain, glassmorphism, color blobs, or multiple background colors.
- Fake editorial metadata ("FIELDWORK 04", "ENTRY 06").

---

## 4. Core flow

1. **Home:** the user sees a sample sentence card and a paste input. The sample opens a workspace; the input accepts a sentence.
2. **Workspace:** the sentence is the hero. Chunks are highlight blocks. The reading page shows kana, translation, sentence map, literal key, and sentence note.
3. **Select a chunk:** clicking a chunk (or pressing `1–6`) opens/updates the right sidebar with that chunk's breakdown.
4. **Reclick the selected chunk:** collapses the sidebar. `Esc` also collapses it. The chunk stays selected.
5. **Translation:** the Natural/Raw toggle switches between the adapted English and the literal chunk-order gloss.
6. **History:** the left panel lists sessions. Clicking one loads it. Save shows an inline toast with undo.
7. **Persistence:** theme, layout, and the last session are remembered locally. Sessions live in IndexedDB.

---

## 5. Confirmed tech stack

| Layer           | Decision                                                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| Runtime         | Node 24.21.0                                                                                          |
| Package manager | **Bun 1.3.14**                                                                                        |
| Build           | **Vite 8 + Svelte 5 + TypeScript**                                                                    |
| Styling         | **Plain CSS + design tokens** (no Tailwind)                                                           |
| State           | Svelte 5 runes/stores                                                                                 |
| Persistence     | `localStorage` for preferences; **IndexedDB via `idb-keyval`** for sessions                           |
| Routing         | No router; view state (`home` / `workspace`); optional URL hash later                                 |
| Fonts           | **Fontsource, self-hosted**: Shippori Mincho, Vollkorn, iA Writer Quattro, iA Writer Mono             |
| Icons           | Inline SVG components                                                                                 |
| Tests           | Vitest + Playwright                                                                                   |
| Lint/format     | ESLint + Prettier, TypeScript strict                                                                  |
| Deployment      | **Local-only**: static `dist/`, served on the user's device (`bun run preview`); no hosted instance   |
| PWA             | Phase 8A complete: `vite-plugin-pwa` 2.0.0, installable from localhost, offline shell, prompt updates |
| AI/API          | Phase 7 complete: BYO key, sample mode default, no backend                                            |
| Example corpus  | Tatoeba API v1: optional, read-only, direct browser fetch, no backend                                 |

**App root:** the repository root. `docs/` and `research/tatoeba/` are subfolders. Local-only design references, prototypes, and third-party research are ignored and are not part of the repository.

---

## 6. Visual reference

- **Original reference:** `design/02-11-2026/bunkaiver2.html` is kept locally only; it is
  not committed.
- It is a **single-file HTML/CSS/JS prototype**, not production code.
- It defined the visual target: warm paper, flat highlight blocks, the reading sheet, the
  right breakdown sidebar, the history rail, light/dark mode, and the desktop breakpoints.
- The implementation componentizes it and replaces its prototype shortcuts:
  - Google Fonts CDN → self-hosted Fontsource.
  - Inline sample data → typed data modules.
  - Inline/local JS state → Svelte state + persistence.
  - Theme-only localStorage → preferences + IndexedDB sessions.
- `docs/DESIGN.md` is the **implementation design authority**. If the local reference and
  `DESIGN.md` conflict, `DESIGN.md` and `SOURCE_OF_TRUTH.md` win.

---

## 7. Documentation map and precedence

| Document                            | Role                                                              | Precedence                       |
| ----------------------------------- | ----------------------------------------------------------------- | -------------------------------- |
| `docs/SOURCE_OF_TRUTH.md`           | Canonical product, scope, stack, decisions                        | **1 — wins all**                 |
| `docs/DESIGN.md`                    | Design system and interaction rules                               | 2                                |
| `docs/PLAN.md`                      | Phased execution order and acceptance criteria                    | 3                                |
| `docs/manifest.md`                  | Project inventory, commands, data contracts                       | 4                                |
| `docs/HANDOFF.md`                   | Living status log, updated after each phase                       | 5 — current state, not authority |
| `docs/KICKOFF.md`                   | Prompt for a fresh chat to start Phase 0                          | —                                |
| `design/02-11-2026/bunkaiver2.html` | Visual reference prototype (local-only; not committed)            | —                                |
| `research/`                         | Japanese grammar/content research                                 | —                                |
| `research/tatoeba/`                 | Verified Tatoeba API, corpus, licensing, and integration research | —                                |

If a phase discovers a conflict, stop and update `SOURCE_OF_TRUTH.md` first. Then update `DESIGN.md`, `PLAN.md`, and `HANDOFF.md` as needed.

---

## 8. Canonical decisions

| ID   | Decision                                                                                                                                                                                                                                                                                  | Status   |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| D001 | Desktop-only. Supported floor: **900px**; guard below 900. No phone layout.                                                                                                                                                                                                               | Accepted |
| D002 | Package manager: **Bun**.                                                                                                                                                                                                                                                                 | Accepted |
| D003 | Build: **Vite + Svelte 5 + TypeScript**.                                                                                                                                                                                                                                                  | Accepted |
| D004 | Styling: **plain CSS + tokens**. No Tailwind.                                                                                                                                                                                                                                             | Accepted |
| D005 | Local-first: no backend, no auth, no cloud sync.                                                                                                                                                                                                                                          | Accepted |
| D006 | Persistence: `localStorage` for preferences; `idb-keyval`/IndexedDB for sessions.                                                                                                                                                                                                         | Accepted |
| D007 | History is a list of **breakdown sessions**, not chat threads.                                                                                                                                                                                                                            | Accepted |
| D008 | One workspace. The right sidebar is the breakdown. No separate Breakdown page and no mode tabs.                                                                                                                                                                                           | Accepted |
| D009 | Flat tinted highlight blocks. No fake brushstroke, no overlap/blend effect.                                                                                                                                                                                                               | Accepted |
| D010 | Warm neutral light/dark. Dark mode must not have an olive/green cast. Tokens are in `DESIGN.md`.                                                                                                                                                                                          | Accepted |
| D011 | The visual reference is the local-only `design/02-11-2026/bunkaiver2.html` (not committed); no marketing site in this phase. `DESIGN.md` is the implementation authority.                                                                                                                 | Accepted |
| D012 | Sample/manual content first. API key is a later enhancement, BYO key, no backend.                                                                                                                                                                                                         | Accepted |
| D013 | PWA/share is Phase 8, not MVP.                                                                                                                                                                                                                                                            | Accepted |
| D014 | Fonts are self-hosted via Fontsource. No Google Fonts CDN in production.                                                                                                                                                                                                                  | Accepted |
| D015 | Only three scroll regions: history list, center reading page, note/sidebar body. Topbar and headers are fixed; no page scroll.                                                                                                                                                            | Accepted |
| D016 | No fullscreen/focus button.                                                                                                                                                                                                                                                               | Accepted |
| D017 | The sidebar is the full breakdown; do not duplicate its content in the center. The center keeps the sentence-level overview.                                                                                                                                                              | Accepted |
| D018 | No 8–9px labels. Minimum 11px for data/labels; 12px preferred.                                                                                                                                                                                                                            | Accepted |
| D019 | Chunk colors are six fixed hues; dark mode uses lighter variants and lower fills.                                                                                                                                                                                                         | Accepted |
| D020 | No paper texture, grain, glass, blobs, or multiple background colors. Depth comes from layered warm neutrals and soft shadows.                                                                                                                                                            | Accepted |
| D021 | App root is the repository root; `docs/` and `research/tatoeba/` stay in subfolders. Local-only design references, prototypes, and third-party research are not committed.                                                                                                                | Accepted |
| D022 | Tatoeba is an optional, read-only example layer. Direct browser fetches, no backend or key, 2–3 examples per selected chunk, local IndexedDB cache. Text attribution is CC BY 2.0 FR; audio is shown only when licensed and is attributed per recording. AI examples remain the fallback. | Accepted |
| D023 | No colored left-border accents on notes, cards, active rows, or diagram boxes. Structure comes from tint, spacing, hairlines, dots, and type; panel edges and the neutral reading rule remain.                                                                                            | Accepted |
| D024 | Phase 8A PWA: installable standalone app, offline app shell and fonts, prompt-based updates. The service worker caches only the app shell, never AI or Tatoeba API responses.                                                                                                             | Accepted |
| D025 | Phase 8B backup: versioned local JSON export/import of sessions. Merge or replace; backups never include AI keys, app preferences, or the Tatoeba cache.                                                                                                                                  | Accepted |
| D026 | Distribution is **local-only**. No hosted deployment, public demo, or share URL. Users run the static build on their own device; keys and history stay origin-scoped. 8C is not planned.                                                                                                  | Accepted |
| D027 | The project is **MIT licensed**, copyright 2026 Gilbert Immanuel Hasiholan. The repository stays private until the owner chooses to publish it.                                                                                                                                           | Accepted |
| D028 | Local security posture: production build injects a restrictive meta CSP; imports are strictly bounded and validated; AI/Tatoeba responses are byte- and field-capped; API keys remain in browser storage and are sent only to the selected provider/proxy.                                | Accepted |
| D029 | v0.1.0 is the first local desktop release. It is source-only; no installer, hosted deployment, or share link. Phase 9 accessibility and visual QA are complete.                                                                                                                           | Accepted |
| D030 | Shape language is a printed study sheet: 3px marks, 4px controls, 6px cards, 8px sheets. No capsule controls; 4px square icon/action buttons; active History row 3px; switch track 3px with a 1px thumb. Full-round is reserved for sentence-map dots and the spinner.                    | Accepted |

---

## 9. Current state

- **Docs:** complete (`SOURCE_OF_TRUTH.md`, `PLAN.md`, `DESIGN.md`, `manifest.md`, `HANDOFF.md`, `KICKOFF.md`).
- **App:** scaffolded at the repository root with Vite 8, Svelte 5, and TypeScript.
- **Phase:** Phase 7 complete (AI/API). Phase 7.5 (Tatoeba examples) A/B complete:
  real examples in the breakdown sidebar, local cache, attribution, generated fallback.
  7.5C (Home sentence picker) is not approved. Phase 8A (PWA/offline), 8B
  (export/import), and the security hardening pass are complete. Phase 9 (polish and
  release) is complete; v0.1.0 is the first local desktop release. Distribution is
  local-only; 8C (share URL) is not planned and there is no hosted deployment.
- **Repository:** app at the root; `docs/` and `research/tatoeba/` are subfolders. Local
  design references, prototypes, and third-party research are ignored. Private GitHub
  remote; MIT license in the repository. Current release: v0.1.0.
- **Visual cleanup:** colored left-border accents were removed from the sentence note, AI
  warning/error blocks, active history rows, and sentence-map tree boxes. Neutral panel
  edges and the reading-sheet rule remain. The shape language is now 3px marks, 4px
  controls, 6px cards, and 8px sheets; the active History row is 3px, icon/action buttons
  are 4px squares, and only map dots and the spinner stay full-round.
- **Reference:** the local-only `design/02-11-2026/bunkaiver2.html` exists and is the visual
  target; it is not committed.
- **Environment:** Node 24.21.0, Bun 1.3.14, npm 9.7.1 (not used), Chrome 156, Edge 156.

For the live state, read `docs/HANDOFF.md`.

---

## 10. Content sources

These are content references, not implementation requirements. The third-party research
files are kept locally and are not committed; `research/tatoeba/` is committed.

- `research/agent_instructions.md` — the breakdown output format and parsing protocol (written for a chat agent; adapt, don't treat as app spec).
- `research/cure_dolly_sentence_structure.md` — the sentence-structure model (A-car/B-engine, modification, topic/comment).
- `research/tae_kim_grammar_guide.md` — grammar forms and section references.
- `research/japanese_breakdowns.md` — example breakdowns and tone.
- `research/grammar_guide.pdf` — Tae Kim's original guide.
- `research/tatoeba/` — verified Tatoeba API notes, corpus findings, licensing, and
  integration decisions.
- Tatoeba corpus: https://tatoeba.org — real example sentences and approved translations;
  text is generally CC BY 2.0 FR, with some CC0 1.0. Audio licenses vary per recording.
  Tatoeba does not endorse Bunkai.

The app's sample content may reuse the sample sentence and breakdown data from the reference and the research log. Do not invent Japanese examples without checking them.

---

## 11. Change protocol

1. Change the decision in this file first.
2. Update `DESIGN.md` if the change affects visuals, components, or interaction.
3. Update `PLAN.md` if the change affects phases or acceptance criteria.
4. Update `manifest.md` if the change affects stack, commands, structure, or data.
5. Update `HANDOFF.md` at the end of the phase.
6. Never silently change the scope in code.

---

## 12. Glossary

- **Session:** one saved sentence and its breakdown.
- **Chunk:** one colored unit of the sentence, with Japanese, kana, gloss, role, and breakdown.
- **Reader:** the center page showing the sentence and sentence-level overview.
- **Sidebar / note:** the right panel showing the selected chunk's full breakdown.
- **History:** the left panel listing saved sessions.
- **Sentence map:** the compact diagram of topic, A-car, modifiers, and engine.
- **Literal key:** the table/list of all chunks with gloss and role.
- **Sentence note:** the short prose explanation of how the sentence holds together.
- **Natural translation:** the adapted English translation.
- **Raw translation:** the literal chunk-order gloss.
- **Lookup term:** a short Japanese word or pattern attached to a chunk and used to search
  Tatoeba. It appears verbatim in the chunk. Derived on read for sessions that lack it.
- **Tatoeba examples:** real, attributed example sentences shown under Examples in the
  breakdown sidebar. They are read-only and cached locally; generated examples remain the
  fallback.
- **Backup:** a versioned local JSON file of saved sessions. It contains session text and
  breakdowns only; never AI keys, preferences, or the Tatoeba cache.
- **Merge / Replace:** import modes. Merge adds sessions with new ids; Replace restores the
  file exactly after confirmation.
- **Guard:** the "designed for desktop" message shown below 900px.
