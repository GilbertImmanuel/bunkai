# Bunkai — Project Manifest

**Status:** Implementation inventory and contract. Last updated: 2026-11-23.

This is the **project manifest**, not the PWA manifest. The generated PWA
`manifest.webmanifest` is a separate build artifact.

**Companion docs:** `SOURCE_OF_TRUTH.md` (authority), `DESIGN.md` (design), `PLAN.md` (execution), `HANDOFF.md` (live state).

---

## 1. Identity

| Field           | Value                                                                      |
| --------------- | -------------------------------------------------------------------------- |
| Project         | Bunkai                                                                     |
| Product         | Desktop-first Japanese sentence breakdown app                              |
| Repo root       | `C:\Users\Gilbert\Documents\Projects\bunkai-sentence-expansion`            |
| App root        | Repository root                                                            |
| Package manager | **Bun 1.3.14**                                                             |
| Runtime         | Node 24.21.0                                                               |
| Framework       | **Vite 8 + Svelte 5 + TypeScript**                                         |
| Styling         | Plain CSS + design tokens                                                  |
| Persistence     | `localStorage` + IndexedDB via `idb-keyval`                                |
| Backend         | None                                                                       |
| Auth            | None                                                                       |
| Deployment      | Local-only: static `dist/` served on the user's device; no hosted instance |
| Supported width | **900–1920px**; guard below 900                                            |
| Reference       | Local-only `design/02-11-2026/bunkaiver2.html` (not committed)             |

---

## 2. Repo layout

```
bunkai-sentence-expansion/
├─ .github/
│  ├─ readme/
│  └─ workflows/
├─ docs/
│  ├─ README.md
│  ├─ SOURCE_OF_TRUTH.md
│  ├─ DESIGN.md
│  ├─ PLAN.md
│  ├─ manifest.md
│  ├─ HANDOFF.md
│  └─ KICKOFF.md
├─ research/
│  └─ tatoeba/              # committed integration research
├─ public/                  # favicon, PWA icons
├─ src/
│  ├─ lib/
│  │  ├─ ai/
│  │  ├─ components/        # includes PwaUpdate.svelte, DataPanel.svelte
│  │  ├─ data/              # types, sample, backup, validation
│  │  ├─ stores/
│  │  ├─ styles/
│  │  ├─ tatoeba/
│  │  └─ utils/
│  ├─ App.svelte
│  ├─ main.ts
│  └─ vite-env.d.ts
├─ tests/
│  ├─ e2e/
│  └─ pwa/
├─ index.html
├─ package.json
├─ bun.lock
├─ vite.config.ts
├─ vitest.config.ts
├─ playwright.config.ts
├─ playwright.pwa.config.ts
├─ pwa-assets.config.ts
├─ svelte.config.js
├─ tsconfig.json
├─ eslint.config.js
├─ .prettierrc
├─ .gitignore
└─ README.md
```

Local-only and not committed: `design/`, `play/`, `archive/`, and the third-party
grammar research files. They are ignored by `.gitignore`.

---

## 3. Commands

Run from the repository root:

| Command                            | Purpose                                                  |
| ---------------------------------- | -------------------------------------------------------- |
| `bun install`                      | Install dependencies                                     |
| `bun run dev`                      | Local dev server                                         |
| `bun run build`                    | Static production build → `dist/`                        |
| `bun run preview`                  | Preview the build                                        |
| `bun run check`                    | `svelte-check` + TypeScript                              |
| `bun run lint`                     | ESLint                                                   |
| `bun run format`                   | Prettier write                                           |
| `bun run test`                     | Vitest                                                   |
| `bun run test:e2e`                 | Playwright                                               |
| `bun run test:pwa`                 | Build + preview; manifest, service worker, offline shell |
| `bun run icons`                    | Regenerate PWA icons from `public/favicon.svg`           |
| `bunx playwright install chromium` | Optional; or use system Chrome/Edge via `channel`        |

Scaffold (Phase 0, already completed; the app is at the root):

```bash
bunx create-vite@latest . --template svelte-ts
bun install
bun add idb-keyval
bun add @fontsource/shippori-mincho @fontsource/vollkorn @fontsource/ia-writer-quattro @fontsource/ia-writer-mono
bun add -d vitest @playwright/test svelte-check eslint prettier eslint-plugin-svelte prettier-plugin-svelte
```

PWA build outputs: `dist/manifest.webmanifest`, `dist/sw.js`, `dist/workbox-*.js`, and a
precache of the app shell, JS/CSS, `woff2` fonts, and icons. AI and Tatoeba API responses
are not runtime-cached.

---

## 4. Package contract

Use `^` ranges and commit `bun.lock`. These are the known latest versions at docs creation:

| Package                         | Range             | Use                                   |
| ------------------------------- | ----------------- | ------------------------------------- |
| `svelte`                        | `^5.57.3`         | UI                                    |
| `vite`                          | `^8.3.5`          | Build/dev                             |
| `@sveltejs/vite-plugin-svelte`  | `^7.3.1`          | Svelte integration                    |
| `typescript`                    | `^5`              | Types                                 |
| `svelte-check`                  | latest compatible | Type checking                         |
| `vitest`                        | `^5.0.5`          | Unit tests                            |
| `@playwright/test`              | `^1.64.1`         | E2E/visual                            |
| `idb-keyval`                    | `^6.3.0`          | IndexedDB                             |
| `@fontsource/shippori-mincho`   | `^5.3.0`          | Japanese                              |
| `@fontsource/vollkorn`          | `^5.3.0`          | English reading                       |
| `@fontsource/ia-writer-quattro` | `^5.3.0`          | UI                                    |
| `@fontsource/ia-writer-mono`    | `^5.3.0`          | Data                                  |
| `eslint`                        | `^9`              | Lint                                  |
| `prettier`                      | `^3`              | Format                                |
| `eslint-plugin-svelte`          | latest compatible | Svelte lint                           |
| `prettier-plugin-svelte`        | latest compatible | Svelte format                         |
| `vite-plugin-pwa`               | `^2.0.0`          | PWA manifest, service worker, updates |
| `@vite-pwa/assets-generator`    | `^2.0.0`          | Dev-only PWA icon generation          |

Add `"packageManager": "bun@1.3.14"` and `"engines": { "node": ">=22" }` to `package.json`.

---

## 5. Source structure (target)

```
src/
├─ lib/
│  ├─ components/
│  │  ├─ TopBar.svelte
│  │  ├─ HistoryPanel.svelte
│  │  ├─ Home.svelte
│  │  ├─ ReadingSheet.svelte
│  │  ├─ Sentence.svelte
│  │  ├─ TranslationToggle.svelte
│  │  ├─ SentenceMap.svelte
│  │  ├─ LiteralKey.svelte
│  │  ├─ SentenceNote.svelte
│  │  ├─ BreakdownSidebar.svelte
│  │  ├─ ConstructionTrace.svelte
│  │  ├─ Examples.svelte
│  │  ├─ TatoebaExamples.svelte
│  │  ├─ GrammarNote.svelte
│  │  ├─ Toast.svelte
│  │  ├─ DesktopGuard.svelte
│  │  └─ SettingsDrawer.svelte        # Phase 7
│  ├─ data/
│  │  ├─ types.ts
│  │  └─ sample.ts
│  ├─ tatoeba/
│  │  ├─ types.ts
│  │  ├─ lookup.ts
│  │  ├─ client.ts
│  │  └─ cache.ts
│  ├─ stores/
│  │  ├─ app.svelte.ts
│  │  ├─ history.svelte.ts
│  │  └─ tatoeba.svelte.ts
│  ├─ styles/
│  │  ├─ tokens.css
│  │  ├─ base.css
│  │  └─ fonts.css
│  └─ utils/
│     ├─ persistence.ts
│     ├─ scrollbars.ts
│     └─ ids.ts
├─ App.svelte
└─ main.ts
```

---

## 6. Views and routes

| View        | Trigger                                  | Layout                       |
| ----------- | ---------------------------------------- | ---------------------------- |
| `home`      | Brand click / new breakdown              | History + center; no sidebar |
| `workspace` | Sample click / input send / history item | History + center + sidebar   |

No router. Use Svelte state. Optional URL hash later: `#session=<id>&chunk=<n>`.

---

## 7. Data contracts

```ts
export type ChunkColor = 1 | 2 | 3 | 4 | 5 | 6
export type TranslationMode = 'natural' | 'raw'
export type Theme = 'light' | 'dark'
export type View = 'home' | 'workspace'
export type PanelState = 'open' | 'collapsed'

export interface ConstructionStep {
  jp: string
  en: string
}

export interface Example {
  jp: string
  en: string
  source?: 'ai' | 'tatoeba'
  id?: number
  url?: string
  author?: string
  license?: string
  audioUrl?: string
  audioAuthor?: string // required to attribute Tatoeba audio
  audioLicense?: string
}

export interface Chunk {
  n: number
  jp: string
  kana: string
  gloss: string
  role: string
  color: ChunkColor
  note: string
  construction: ConstructionStep[]
  examples: Example[]
  furigana?: FuriganaSegment[]
  lookup?: string // short Tatoeba search term; derived on read when absent
}

export interface Session {
  id: string
  sentence: string
  reading: string
  natural: string
  raw: string // pipe-separated literal chunk order
  chunks: Chunk[]
  sentenceNote: string[] // 2–3 short paragraphs/bullets
  createdAt: string // ISO
  source?: 'sample' | 'manual' | 'ai'
}

export interface HistoryItem {
  id: string
  preview: string
  time: string
  count: number
  colors: ChunkColor[]
  sessionId: string
}

export interface BackupFile {
  version: 1
  app: 'bunkai'
  exportedAt: string
  sessions: Session[]
}

export type ImportMode = 'merge' | 'replace'
```

Backups contain `sessions` only. They never include `bunkai.ai`, API keys, app
preferences, or the Tatoeba cache. Import validates the file, then merges by session id or
replaces the history after an explicit confirmation.

---

## 8. Persistence contract

### localStorage

| Key                  | Value                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------- |
| `bunkai.theme`       | `"light" \| "dark"`                                                                   |
| `bunkai.layout`      | `{ history: PanelState; note: PanelState }`                                           |
| `bunkai.translation` | `"natural" \| "raw"` (default `"raw"`)                                                |
| `bunkai.furigana`    | `{ name: boolean; word: boolean }` (default both `true`; legacy string modes migrate) |
| `bunkai.lastSession` | session id                                                                            |
| `bunkai.ai`          | per-provider AI keys, models, and OpenCode proxy URLs; local only                     |

### IndexedDB (`idb-keyval`)

| Key                    | Value                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `bunkai.sessions`      | `Session[]`                                                                                                        |
| `bunkai.tatoeba.cache` | `Record<string, { examples: Example[]; fetchedAt: number }>`; mapped Tatoeba examples, 30-day TTL, max 500 entries |

Rules:

- No backend; no network for core data.
- Tatoeba requests are direct browser fetches to `api.tatoeba.org`; only the sanitized
  lookup term is sent. No sentence, session, history, or AI key is sent.
- Backups are local files. Export writes sessions only; import writes `bunkai.sessions`.
  There is no separate backup key and no server copy.
- If IndexedDB fails, fall back to in-memory state and show a non-blocking warning.
- Do not put the API key in IndexedDB; Phase 7 uses localStorage with a clear warning.
- Do not log the API key.

---

## 9. Typography and assets

| Asset             | Source                          |
| ----------------- | ------------------------------- |
| Shippori Mincho   | `@fontsource/shippori-mincho`   |
| Vollkorn          | `@fontsource/vollkorn`          |
| iA Writer Quattro | `@fontsource/ia-writer-quattro` |
| iA Writer Mono    | `@fontsource/ia-writer-mono`    |
| Icons             | Inline SVG in components        |
| PWA icons         | Phase 8, `public/icons/`        |

No Google Fonts CDN in production. No icon library.

---

## 10. Layout and breakpoints

| Width     | History    | Sidebar        | Center  | Key/map          |
| --------- | ---------- | -------------- | ------- | ---------------- |
| <900      | Guard      | Guard          | Guard   | Guard            |
| 900       | 56 rail    | 44 rail/drawer | 800     | stacked          |
| 901–1099  | 56 rail    | 44 rail/drawer | 801–999 | 2-col/horizontal |
| 1100–1279 | 56 rail    | 300 column     | 744–923 | 2-col/horizontal |
| 1280–1439 | 240 column | 300 column     | 740–899 | 2-col/horizontal |
| ≥1440     | 240 column | 320 column     | 880+    | 2-col/horizontal |

Only three scroll areas: history list, center, sidebar body. No page scroll. Auto-hide scrollbars.

---

## 11. Phase gates

| Phase        | Gate                                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| 0 Foundation | App scaffolded, tokens/fonts/sample data, shell renders                                                                          |
| 1 Home       | Sample card, input/send, history rail, no page scroll                                                                            |
| 2 Reader     | Sentence, kana, translation toggle, map, key, note                                                                               |
| 3 Sidebar    | Full breakdown, reclick collapse, no separate page                                                                               |
| 4 History    | IndexedDB sessions, save/undo, search, reload persistence                                                                        |
| 5 Responsive | 900/1024/1100/1200/1280/1440; guard <900                                                                                         |
| 6 Dark mode  | Warm charcoal, contrast, no olive cast                                                                                           |
| 7 AI/API     | BYO key optional; sample mode default; no backend                                                                                |
| 7.5 Tatoeba  | A/B complete: sample lookups, cached real examples, attribution, generated fallback; 7.5C not approved                           |
| 8 PWA        | 8A/8B + hardening complete: installable, offline shell, prompt updates, JSON export/import, meta CSP; local-only, 8C not planned |
| 9 Polish     | A11y, tests, docs, release                                                                                                       |

Every gate requires `HANDOFF.md` updated.

---

## 12. Verification contract

Run from the repository root:

```bash
bun run check
bun run lint
bun run test
bun run test:e2e
bun run test:pwa
bun run build
```

Manual checks:

- [ ] 900, 1024, 1099, 1100, 1200, 1279, 1280, 1440.
- [ ] Light/dark on each.
- [ ] Home, reader with sidebar open/collapsed, sidebar drawer, guard.
- [ ] No horizontal scroll or clipped topbar/meta.
- [ ] No 9px labels.
- [ ] Flat pills; no underlines/blend.
- [ ] Sentence not orphaned.
- [ ] Sidebar never covers history.
- [ ] Fonts load locally; no Google Fonts request.
- [ ] Save/reload persistence.
- [ ] Natural/Raw toggle.
- [ ] Furigana switches: Name and Furigana independently configurable; both on by default.
- [ ] Furigana settings persist after reload.
- [ ] Tatoeba examples render under Examples with source, contributor, and license.
- [ ] Audio buttons appear only for recordings with a license.
- [ ] Tatoeba loading, error, empty, skipped, cached, and generated-fallback states.
- [ ] Cached Tatoeba results do not trigger a second request.

Automated Tatoeba coverage uses a mocked `https://api.tatoeba.org/**` route. No live
Tatoeba call is part of `bun run test` or `bun run test:e2e`. Manual live checks are
allowed and should be recorded in `research/tatoeba/log.md`.

PWA checks:

- [ ] `bun run test:pwa` passes (manifest link, service worker, offline reload, CSP, backup
      export).
- [ ] Build output contains `dist/manifest.webmanifest`, `dist/sw.js`, and
      `dist/workbox-*.js`.
- [ ] The manifest icons resolve, including the maskable icon.
- [ ] AI and Tatoeba API responses are absent from the service-worker precache.
- [ ] `dist/index.html` contains the meta Content Security Policy.
- [ ] No CSP console errors on the sample flow.
- [ ] Manual: install from Chrome/Edge, reopen offline, and verify the app shell.

Backup checks:

- [ ] Export downloads `bunkai-sessions-YYYY-MM-DD.json`.
- [ ] The file contains `version: 1`, `app: "bunkai"`, and a `sessions` array.
- [ ] The file contains no API keys, preferences, or Tatoeba cache.
- [ ] Merge adds new ids and skips existing ids.
- [ ] Replace requires confirmation and restores the file exactly.
- [ ] Invalid or incomplete backups show an inline error and do not change history.
- [ ] Duplicate chunk numbers, unsafe URLs, and oversized sessions are rejected.

---

## 13. Environment

| Tool                | Version       | Note                                   |
| ------------------- | ------------- | -------------------------------------- |
| Node                | 24.21.0       | `>=22`                                 |
| Bun                 | 1.3.14        | Package manager                        |
| npm                 | 9.7.1         | Not used                               |
| Chrome              | 156.0.8078.74 | Manual/Playwright channel              |
| Edge                | 156.0.4314.58 | Manual/Playwright channel              |
| Playwright browsers | Not installed | Install Chromium or use channel        |
| Git                 | 2.44.0        | Repository initialized; private remote |

---

## 14. Security and privacy

- No backend, no accounts, no analytics, no hosted instance.
- Core data stays in the browser on the user's device.
- The API key is optional and stored locally; browser storage is not a vault. Removing it
  deletes the local copy but does not revoke it at the provider.
- Direct provider calls are allowed only if the provider supports browser CORS; OpenCode
  uses a user-supplied proxy restricted to HTTPS or loopback HTTP.
- Do not log keys or send them to any Bunkai server.
- The production build injects a meta CSP: `script-src 'self'`, restricted
  `connect-src`/`media-src`, `object-src 'none'`, `base-uri 'none'`.
- Imported sessions are strictly bounded and validated: chunk/example/note counts, string
  lengths, unique positive chunk ids, and HTTPS-only Tatoeba URLs.
- AI and Tatoeba response bodies are decoded-byte capped; request deadlines stay active
  through body reads.
- Export/import is local JSON.
- Tatoeba is a direct browser request to `api.tatoeba.org`; only the sanitized lookup
  term is sent. The app does not send the sentence, session, history, or any key.
- Tatoeba examples are cached locally in IndexedDB. Do not bulk-download the corpus.
- Tatoeba text and audio attribution is required. Empty-license audio is not reused.
- The PWA service worker caches only the app shell and static assets. It must not
  runtime-cache AI provider requests or Tatoeba API responses.
- Site data (sessions, preferences, Tatoeba cache, service worker) can be cleared from the
  browser; there is no server-side copy.
- Exported backups contain session sentences and breakdowns in plain JSON. They never
  include API keys, preferences, or the Tatoeba cache. Treat a backup as readable text.
- Replace import is destructive. It requires an explicit confirmation and clears the saved
  last-session pointer.

---

## 15. Naming conventions

- Components: `PascalCase.svelte`.
- Stores: `name.svelte.ts`.
- CSS: kebab-case classes; tokens `--kebab-case`.
- Data: camelCase fields; chunk colors `c1`–`c6`.
- Files: `SOURCE_OF_TRUTH.md`, `DESIGN.md`, `PLAN.md`, `manifest.md`, `HANDOFF.md`, `KICKOFF.md`.

---

## 16. Open decisions

- Phase 7.5C (Home “Find a sentence” picker) is not approved.
- Phase 8C (read-only share link) is not planned. Distribution is local-only; a
  `localhost` share URL would not work for another person.
- A native desktop wrapper (Tauri/Electron) is a possible later phase, not part of the
  current scope.
- A Tatoeba opt-out preference is deferred. Automatic fetching for the selected chunk is
  accepted; only the sanitized lookup term leaves the browser.
- Tatoeba audio with an empty license is intentionally omitted.
- Backup encryption is not included. Backups are readable plain JSON.
- Inline attribution of the English translation author is deferred; the source link opens
  the Tatoeba sentence page, which lists all contributors.
