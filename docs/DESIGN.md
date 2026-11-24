# Bunkai — Design System

**Status:** Authoritative design document. Last updated: 2026-11-17.

**Companion:** `SOURCE_OF_TRUTH.md` wins on scope and stack. This file wins on visual/interaction questions.

**Visual reference:** `design/02-11-2026/bunkaiver2.html` (local-only; not committed). Open it in a browser. It is a single-file prototype; use it for the look and behavior, not its code architecture. `docs/DESIGN.md` is the implementation design authority.

**Target:** Desktop web app, supported from **900px** wide. Below 900px: a centered desktop guard. No phone layout.

---

## 1. Intent

Bunkai should feel like a **well-made reading desk**: warm, quiet, precise, and a little tactile. Not a SaaS dashboard, not a scrapbook, not a paper simulation.

The sentence is the hero. The app's job is to make the sentence's structure visible without turning the page into a form.

**The five rules:**

1. The sentence is the largest, calmest thing on the screen.
2. Structure is shown with color, spacing, and hairlines — not decoration.
3. One accent color. Six chunk colors. Everything else is a warm neutral.
4. Depth comes from layered surfaces and soft shadows, never from texture, grain, glass, or blobs.
5. If a visual effect cannot be done convincingly, use the honest flat version.

---

## 2. Reference and scope

- Reference: `design/02-11-2026/bunkaiver2.html` (local-only; not committed)
- The reference includes Home, Reader, the right breakdown sidebar, the history rail, light/dark mode, and the desktop breakpoints.
- It is a prototype: Google Fonts CDN, inline data, inline JS state, theme-only localStorage.
- The production app componentizes it with Fontsource, typed data, Svelte state, and IndexedDB.
- Do not copy its single-file architecture. Do not copy its prototype shortcuts.

---

## 3. Typography

### Families

| Role            | Family                | Fallback                                                         |
| --------------- | --------------------- | ---------------------------------------------------------------- |
| Japanese        | **Shippori Mincho**   | Yu Mincho, Hiragino Mincho ProN, Noto Serif JP, MS Mincho, serif |
| English reading | **Vollkorn**          | Iowan Old Style, Charter, Georgia, serif                         |
| UI/labels       | **iA Writer Quattro** | Avenir Next, Segoe UI, system-ui, sans-serif                     |
| Numbers/data    | **iA Writer Mono**    | ui-monospace, SF Mono, JetBrains Mono, Menlo, monospace          |

Self-host via Fontsource:

```bash
bun add @fontsource/shippori-mincho @fontsource/vollkorn @fontsource/ia-writer-quattro @fontsource/ia-writer-mono
```

No Google Fonts CDN in production.

### Scale

| Token        | Size / line height        | Use                                    |
| ------------ | ------------------------- | -------------------------------------- |
| `--fs-jp`    | 22px / 1.8                | The Japanese sentence                  |
| `--fs-kana`  | 14px / 1.6 (15px in dark) | Kana reading                           |
| `--fs-gloss` | 16px / 1.5                | English gloss, natural/raw translation |
| `--fs-note`  | 15px / 1.65               | Grammar note, sentence note            |
| `--fs-label` | 12px / 1.2                | Section labels, small UI labels        |
| `--fs-data`  | 11px / 1.2                | Numbers, roles, metadata               |

Rules:

- **No 8–9px labels.** 11px is the absolute floor; 12px is preferred.
- Japanese sentence line length: **30–45 characters**.
- English reading line length: **60–75 characters**.
- Use `word-break: keep-all` and `overflow-wrap: break-word` for Japanese; `overflow-wrap: anywhere` for long tokens.
- Labels are sentence case or uppercase with modest tracking (`0.04–0.08em`), never tiny mono at 9px.
- Do not use a handwriting/script font for content.

---

## 4. Color

### Light theme

| Token            | Value     | Use                                          |
| ---------------- | --------- | -------------------------------------------- |
| `--bg`           | `#E7DCC9` | Warm desk / page background                  |
| `--surface`      | `#FBF8F1` | Reading sheet                                |
| `--surface-2`    | `#F3EBDD` | History, sidebar, raised panels              |
| `--ink`          | `#1E1C17` | Primary text                                 |
| `--muted`        | `#686155` | Secondary text, labels                       |
| `--line`         | `#D2C6B2` | Decorative dividers                          |
| `--line-strong`  | `#C4B69F` | Decorative panel and sheet borders           |
| `--control-line` | `#897B62` | Input, button, and toggle boundaries (≥ 3:1) |
| `--accent`       | `#2F5D8A` | Primary action, links, selected states       |
| `--accent-fg`    | `#FAF7EF` | Text on accent                               |
| `--accent-soft`  | `#DCE7F0` | Soft accent fill                             |
| `--desk`         | `#22302A` | Brand mark; small dark accent only           |

Background gradient: `linear-gradient(180deg, #F4EDE0 0%, #E5D8C4 100%)`.

### Dark theme

Warm charcoal, **not olive/green**:

| Token            | Value     | Use                                          |
| ---------------- | --------- | -------------------------------------------- |
| `--bg`           | `#12100E` | Warm near-black                              |
| `--surface`      | `#1D1A16` | Reading sheet                                |
| `--surface-2`    | `#26221D` | History, sidebar, raised panels              |
| `--ink`          | `#F4EEE3` | Primary text                                 |
| `--muted`        | `#C8C0B2` | Secondary text, labels                       |
| `--line`         | `#5C554B` | Decorative dividers                          |
| `--line-strong`  | `#7A7062` | Decorative panel and sheet borders           |
| `--control-line` | `#7A7062` | Input, button, and toggle boundaries (≥ 3:1) |
| `--accent`       | `#9CC5E8` | Primary action, links                        |
| `--accent-fg`    | `#12100E` | Text on accent                               |
| `--accent-soft`  | `#26333D` | Soft accent fill                             |
| `--desk`         | `#2C2A24` | Neutral dark; brand mark uses accent in dark |

Background gradient: `linear-gradient(180deg, #171411 0%, #100E0C 100%)`.

Contrast targets:

- Ink on sheet: **≥ 7:1**
- Muted text: **≥ 4.5:1** on `--surface`, `--surface-2`, and `--bg`
- Interactive control boundaries and focus: **≥ 3:1** via `--control-line`
- Decorative hairlines (`--line`, `--line-strong`) may stay quieter; they must not be the
  only way to identify a control.
- No color-only meaning; pair color with number, label, or border.

### Chunk palette

Six fixed hues. Light mode uses saturated ink colors; dark mode uses lighter variants.

| #   | Light     | Dark      | Name  |
| --- | --------- | --------- | ----- |
| 1   | `#3E7CB1` | `#8FB8E0` | blue  |
| 2   | `#6E8B5E` | `#B3C58F` | sage  |
| 3   | `#B8862E` | `#E3BC6E` | amber |
| 4   | `#C15B4A` | `#E58F7B` | coral |
| 5   | `#8A6FAE` | `#C6A6DE` | mauve |
| 6   | `#3C8C84` | `#86C9C0` | teal  |

Highlight recipe:

- Light: `background: color-mix(in srgb, var(--cc) 20%, transparent)`, selected `34%`, selected `1px solid var(--cc)`.
- Dark: `background: color-mix(in srgb, var(--cc) 18%, var(--surface))`, selected `26%`, border `1px solid color-mix(in srgb, var(--cc) 45%, transparent)`.
- 3px radius, `box-decoration-break: clone`.
- No underlines. No `::before` brush edges. No `mix-blend-mode`. No overlap/negative margins.
- The same hue appears in the sentence, literal key chip, map dot, sidebar swatch, and
  history strip.

Dark mode must not use green/olive for large surfaces. The two green-ish chunk hues are accents, not a wash.

---

## 5. Shape and elevation

### Radius

| Token       | Value | Use                                                              |
| ----------- | ----- | ---------------------------------------------------------------- |
| `--r-hl`    | 3px   | Inline chunk highlights, active History row                      |
| `--r-btn`   | 4px   | Buttons, inputs, segments, icon buttons, send/audio/rail numbers |
| `--r-note`  | 6px   | Sidebar cards, menus, examples, settings notes                   |
| `--r-sheet` | 8px   | Reading sheet, sample card, drawer edge                          |
| full        | 50%   | Sentence-map dots and spinner only                               |

Nested rounding rule: an inset rounded child should use the outer radius minus its padding,
e.g. a 2px segment inside a 4px control group with 2px padding. Use `calc()` with the radius
token (`calc(var(--r-btn) - 2px)`) so the curves stay parallel.

No capsule-shaped controls. Full-round is reserved for data dots and the spinner. The furigana
switch is a 3px track with a 1px thumb. Do not round every element.

### Surfaces

- Reading sheet: `--surface`, `1px solid var(--line-strong)`, `--r-sheet`, soft warm shadow.
- History/sidebar: `--surface-2`, `1px solid var(--line)`, slightly flatter than the sheet.
- Topbar: `--surface` or `--surface-2`, 1px bottom border.
- Interactive controls use `--control-line`, not the decorative `--line` tokens. Borders over
  tinted surfaces may use `color-mix()` or alpha; solid hairlines remain for paper structure.
- Light shadow: `0 1px 2px rgba(60,45,25,.06), 0 12px 32px rgba(60,45,25,.08), inset 0 1px 0 rgba(255,255,255,.5)`.
- Dark: use borders + tonal separation; no heavy black shadows.

No paper texture, grain, noise, glass, blobs, or multiple background colors.

---

## 6. Layout

### App shell

```
┌──────────────────────────────────────────────────────────────┐
│ Top bar 52px — fixed                                         │
├──────────────┬───────────────────────────────┬───────────────┤
│ History      │ Reading page                  │ Breakdown     │
│ 240 / 56px   │ max 1040px sheet               │ 300 / 320 / 44│
│ scroll       │ scroll                        │ scroll        │
└──────────────┴───────────────────────────────┴───────────────┘
```

- `height: 100dvh`, no page scroll.
- Topbar: 52px.
- History: 240px column; 56px rail.
- Center: `minmax(0, 1fr)`; reading sheet and Home column max 1040px.
- Sidebar: 300px column; 320px at ≥1440; 44px rail when collapsed.
- Gaps/padding: 20–24px.
- The center is the only place the sentence lives. The sidebar is the chunk breakdown.

### Home

- Center only; no note column.
- Title + subline, sample card, combined input + send arrow.
- History rail on the left.
- No marketing hero, no login, no onboarding, no footer.
- The home state does not scroll.

### Reading page order

1. Sentence with chunk highlights and optional furigana
2. Kana reading
3. Older-session enrichment row (conditional)
4. Translation toggle + text (Natural/Raw)
5. Sentence map
6. Literal key
7. Sentence note

The sentence is the hero. The sidebar is the selected chunk's full breakdown.

---

## 7. Scroll model

Only three regions scroll:

1. **History list**
2. **Center reading page**
3. **Sidebar body**

Everything else is fixed: topbar, history header/search, sidebar header, sidebar footer, reading-page section headers inside the scroll flow.

- `html, body { overflow: hidden; }`
- App shell `100dvh`; grid children `min-height: 0`.
- Each scroll region: `overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable`.
- Scrollbars are transparent when idle; the thumb appears while scrolling and fades after ~700–800ms.
- No page scroll; no nested horizontal scroll.
- At 900–1099, the sidebar opens as a right drawer over the center, not the history. Scrim + close.

---

## 8. Components

### Top bar

- Left: history toggle, brand mark + "Bunkai".
- Right: Save, furigana switches, Settings, theme toggle.
- The note panel toggle lives in the sidebar header and rail, not the topbar.
- No fullscreen/focus button.
- Height 52px, 1px bottom border, surface background.

### History panel

- Width 240px; 56px rail when collapsed.
- Header: "History", `+` new breakdown, search.
- Groups: Today / Yesterday / Earlier.
- Item: two-line Japanese preview, time, chunk count, 3-color strip.
- Active: warm/soft tint, 3px radius, no left accent rule.
- Rail: expand chevron + vertical "HISTORY" label.
- No login/account UI.

### Home

- Title: "Read a sentence, see its pieces." (or the reference's current copy).
- Subline: one sentence.
- Sample card: clickable, shows the sample sentence with non-interactive highlight spans.
- Combo input: one rounded field with input + square send button; focus ring; Enter sends; send disabled until text.
- On send, the arrow becomes a spinner. Manual mode shows “Preparing workspace…”; AI mode shows the active provider while the request runs.
- No separate "Break down" text button.

### Reading sheet

- `--surface`, 8px radius, 1px `--line-strong`, soft shadow.
- Max 1040px. Padding is 40px top/bottom; left/right is 40/32 below 1440 and 56/40 at
  ≥1440. The extra left inset keeps content off the reading rule at wide sizes.
- Left margin rule at 22px, 1px `--line-strong`; vertical "READING" label.
- At ≤600px: hide the vertical label/rule, reduce padding. (Phone is not supported; this is a fallback only if the guard is bypassed.)

### Sentence and chunks

- Shippori Mincho 22px / 1.8.
- Inline highlights, 3px radius, tight padding, no underline.
- Hover: tint +9%; selected: stronger tint + 1px border.
- `1–6` selects; click selects; Enter opens the sidebar if collapsed.

### Kana

- Shippori Mincho 14px / 1.6 (15px dark), `--muted` / `#D8D0C2` in dark.
- No romaji unless added later as an explicit option.

### Furigana

- Ruby appears above kanji; kana-only text stays plain. Okurigana stays outside the ruby.
- Two independent switches in the topbar panel: **Name** for proper nouns and **Furigana** for ordinary kanji vocabulary.
- Both switches default on. Any combination is valid: both off, Name only, Furigana only, or both on.
- The settings persist as `{ name, word }` in `bunkai.furigana`; legacy four-mode values migrate automatically.
- When any furigana is visible, every chunk in the sentence reserves the same top padding. Highlights stay the same height even when some chunks have no reading.
- Sessions missing colors or readings show a **Missing details → Add colors & readings** row in the reading sheet. It asks the active provider to add the missing mappings and furigana without regenerating the breakdown.

### Translation toggle

- Small segmented control: Natural / Raw. Raw is the default on a fresh install.
- Natural: Vollkorn roman, adapted English. Phrases carry the color of the chunk whose meaning they express, even when English word order differs; unmapped words stay unhighlighted.
- Raw: Vollkorn roman with the literal chunk-order gloss; colored spans are allowed on desktop but must wrap naturally. No horizontal overflow.
- Natural and Raw use the same font family, size, and style. Neither is italic.
- `aria-pressed` on both buttons; keyboard accessible.
- The sidebar's chunk gloss remains raw.

### Sentence map

- Cure Dolly structure, with a **Row / Tree** toggle in the section header. **Row** is the default.
- Row view: topic frame for a zero topic, then all chunks in sentence order as a horizontal grid. Each chunk shows its refined role, particle relationship, and a colored dot; the B-engine is emphasized. A relation line below summarizes the A-car and modifier targets.
- Tree view: topic frame, A-car → B-engine spine, then a nested modifier hierarchy with target arrows.
- Both views mark explicit or ghost `(zeroは)` / `(zeroが)` and use Cure Dolly roles such as A-car, B-engine, reason clause, and limiter.
- Use the six chunk hues for dots and labels, not full chips or colored left borders.
- Dots sit in front of the connecting line with a 2px surface ring.
- Stack the row vertically at ≤900px.
- A subject embedded in a predicate chunk (`内容が乏しくなった`) is split in the map without changing the underlying chunk.

### Chunk references

- A **Guides** section can appear at the bottom of the chunk detail.
- Cure Dolly references link to the matching YouTube lesson; the section also links to the Cure Dolly transcript archive on GitHub.
- Tae Kim references cite section and page.
- Only grammar points covered by the guides are cited. A chunk gets at most two references, and plain chunks get none.

### Literal key

- Quiet 2-column list at >900px; 1 column at ≤900px.
- Row: a 96px meta column with a small color chip inline with the number, the role below,
  then Japanese and gloss in the content column.
- The chip is 8px, 2px radius, and sits on the number line; it is never centered across the
  row.
- Hairline bottom borders; no card background/border.
- 11–12px role labels, not 9px.

### Sentence note

- 2–3 labeled blocks: **Core** (meaning), **Structure** (how the chunks, particles, and
  clause fit), **Nuance** (tone or usage).
- Two-column rows: a 128px label column, 24px gap, then a fluid prose column that runs to
  the same right edge as the literal key. No prose max-width.
- Labels: 11px uppercase data type, muted. Prose: Vollkorn 15px / 1.65. Row gap 18px.
- No left accent rule or card; the section hairline and typography carry it.
- Unlabeled older notes fall back to full-width prose with 14px paragraph spacing.

### Breakdown sidebar

- Full selected-chunk breakdown; no separate page.
- Header: chunk number/swatch, Japanese, kana, gloss, collapse chevron.
- Body: Role, Construction, Examples (Tatoeba + generated fallback), Grammar note.
- Construction: vertical steps; index, Japanese, English; arrows; final step tinted/bordered.
- Examples: numbered rows; Japanese + English; hairline separators. The first subsection is
  real Tatoeba examples; generated examples appear only as a fallback.
- Grammar note: 15px / 1.65, max 60ch.
- Footer: Prev / count / Next.
- No natural translation duplicate; the center has the sentence-level natural.
- Scrolls independently; header/footer fixed.

### Tatoeba examples

- Sits under the Examples label, between Construction and Grammar note.
- Heading: “From Tatoeba” with a “Search Tatoeba” link to the public search page.
- Shows 2–3 real sentences. Each row: number, Japanese (16px Shippori), English (14px
  Vollkorn, muted), source link, contributor, sentence license, and optional audio.
- Audio: 26px square icon button using a `--line-strong` border and a `--muted` icon;
  hover uses `--accent` / `--ink`. Label it “Play audio for Tatoeba sentence <id>”.
  Render audio only when the recording has a non-empty license.
- Attribution: `Audio: <author> · <license>` per recording; footer line
  “Sentences from Tatoeba · CC BY 2.0 FR” with links to Tatoeba and the license.
  Never imply Tatoeba endorsement.
- States:
  - loading: “Searching Tatoeba…” inline, no card, no layout jump;
  - error: “Tatoeba is unavailable right now.” plus Try again and Search Tatoeba;
  - empty: “No Tatoeba examples found for 「query」.”;
  - skipped: “No automatic lookup for this chunk.”;
  - cached: a quiet “Cached” marker in the attribution line.
- Generated examples fallback: shown only when Tatoeba is empty, unavailable, or skipped.
  Label “Generated examples”; never show both lists at once.
- No new colors. Use `--ink`, `--muted`, `--line`, `--line-strong`, and `--accent`.
- The section lives in the sidebar body and scrolls with it. Desktop only.

### Toast

- Bottom center; dark surface; text + Undo; 3s; accessible live region.

### PWA update banner

- Fixed bottom center, 76px above the toast; only visible when a new service worker is
  waiting.
- 13px UI text; `--surface-2` background; 1px `--line-strong` border; `--r-btn` radius;
  `--shadow-panel`. No colored left accent.
- Copy: “A new version is available.” plus Reload (accent) and Later (muted).
- No auto-dismiss; Later hides it until the next launch. Reload activates the waiting
  service worker and reloads. No layout shift.
- The offline-ready event uses the existing Toast: “Ready to work offline”.

### PWA / offline

- Manifest icons use the same 文 mark as the favicon. The app is standalone, with
  `theme_color` and `background_color` `#e7dcc9`; the theme-color meta follows light/dark.
- Precache the app shell, hashed JS/CSS, `woff2` fonts, favicon, and icons.
- Do not runtime-cache AI or Tatoeba API responses. Sessions and preferences already live
  in IndexedDB/localStorage, so they work offline. AI/Tatoeba degrade to their existing
  errors and fallbacks.
- Desktop-only; the PWA does not add a phone layout.

### Guard

- Shown below 900px.
- Centered warm-paper panel: “Bunkai is designed for desktop. Resize to at least 900px.”
- Same type/palette; no app shell; no broken layout.

### Settings drawer

- Right drawer, 380px; header kicker “Settings”; title changes with the active tab:
  “AI breakdowns” or “Local data”.
- Segmented **AI / Data** tabs directly under the header. The active tab uses a quiet
  full border and surface; no colored underline or left accent.
- AI tab: provider, model, API key, security note, Save / Test connection / Remove key.
- Data tab:
  - **Export**: saved-session count, short explanation, and “Export sessions”. Downloads a
    JSON file containing session text only.
  - **Import**: choose a backup file, preview its session count and export date, then
    choose **Merge** (default) or **Replace**. Replace requires a confirmation checkbox.
    The import button is full-width and primary.
  - Backups never include AI keys, app preferences, or the Tatoeba cache.
- Close by chevron, Esc, or scrim. No new colors; use the existing surfaces, lines, and
  accent.

---

## 9. Interactions

| Action                        | Result                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| Click chunk                   | Select; open/update sidebar; scroll sidebar to top                                       |
| Click selected chunk again    | Collapse sidebar; keep chunk selected                                                    |
| `1–6`                         | Select chunk; open sidebar                                                               |
| `Enter`                       | Open sidebar if collapsed                                                                |
| `Esc`                         | Collapse sidebar / close drawer                                                          |
| Note toggle                   | Open/collapse sidebar                                                                    |
| History toggle / `Cmd/Ctrl+B` | Open/collapse history                                                                    |
| Theme toggle                  | Light/dark; persist                                                                      |
| Save                          | Inline toast with Undo                                                                   |
| Translation Natural/Raw       | Swap translation text; persist preference                                                |
| History item                  | Load session; reset center/sidebar scroll to top                                         |
| `+` / New breakdown           | Return home with input focused                                                           |
| Sidebar Prev/Next             | Move selected chunk; keep sidebar open                                                   |
| Drawer scrim click            | Close drawer                                                                             |
| Tatoeba audio                 | Play/pause the recording; no layout change                                               |
| Search Tatoeba                | Open the public Tatoeba search page for the current lookup                               |
| PWA update prompt             | Reload applies the waiting service worker and reloads; Later dismisses until next launch |
| Settings gear                 | Open Settings on the AI tab                                                              |
| Settings → Data               | Export or import sessions                                                                |

At 900–1099, the sidebar is a drawer: selecting a chunk opens it over the center; the history rail remains visible.

---

## 10. Responsive rules (desktop only)

| Width         | History    | Sidebar                  | Center    | Key/map          |
| ------------- | ---------- | ------------------------ | --------- | ---------------- |
| **< 900**     | Guard      | Guard                    | Guard     | Guard            |
| **900**       | 56 rail    | 44 rail; opens as drawer | 800px     | Stacked (≤900)   |
| **901–1099**  | 56 rail    | 44 rail; opens as drawer | 801–999px | 2-col/horizontal |
| **1100–1279** | 56 rail    | 300 column               | 744–923px | 2-col/horizontal |
| **1280–1439** | 240 column | 300 column               | 740–899px | 2-col/horizontal |
| **≥1440**     | 240 column | 320 column               | 1040px+   | 2-col/horizontal |

Rules:

- History expands to 240px only at ≥1280px. Below 1280, it is a 56px rail.
- Sidebar collapses to 44px at ≤1099px. At 900–1099 it opens as a right drawer; at ≥1100 it is a column.
- Key/map stack at ≤900px. At 901+ they use the two-column/horizontal layout.
- Below 900px, the app is replaced by the guard.
- No phone layout. Do not add bottom navigation, bottom sheets, or mobile drawers.

---

## 11. Accessibility

- Contrast: ink/sheet ≥ 7:1; muted ≥ 4.5:1 on all three light surfaces; interactive
  boundaries, focus rings, and the accent ≥ 3:1. `tokens.test.ts` checks light/dark.
- Every interactive element has a visible `:focus-visible` ring (2px accent).
- A “Skip to main content” link is the first focusable element. Each view has one `h1`;
  reading sections use `h2`, and sidebar/data sections use `h3`.
- Chunks are buttons; keyboard `1–6`, Enter, Esc. Scroll regions are focusable with
  `tabindex="0"` and labeled.
- Settings uses a `tablist` with roving `tabindex` and Left/Right/Home/End keys; the Data
  import mode is a `radiogroup` with arrow-key selection.
- Dialogs and the 900–1099 sidebar drawer trap focus, close with Esc, and return focus to
  the element that opened them. The rail button returns focus after a scrim close.
- `aria-pressed` for toggles; `aria-current` for the active history item; `aria-expanded`
  for the settings and popover triggers; `aria-label` for icon buttons.
- Color is never the only signal: chunk numbers, role labels, selected border.
- Respect `prefers-reduced-motion`; no reading-surface animation. Drawers and scrims snap
  or cross-fade when reduced motion is requested.
- Dark-mode depth comes from progressively lighter surfaces (`bg → surface → surface-2`),
  not shadows. `tokens.test.ts` checks this ordering.
- All viewport-height calculations use `100dvh`, never `100vh`.
- UI icon strokes stay at 1.7 so they sit consistently beside 500/600-weight text; do not
  mix thin and heavy icons in one toolbar.
- No 8–9px labels.
- Tatoeba audio buttons have descriptive `aria-label`s and `aria-pressed`; Tatoeba status
  messages use `role="status"`; source and search links open in a new tab with
  `rel="noreferrer"`.
- **Desktop-only limitation:** below 900px the guard replaces the app, so full WCAG reflow
  at 200%/400% zoom is intentionally unsupported. Japanese text remains readable at 200%
  within supported desktop widths; fixed-height text containers are not used.

---

## 12. Content rules

- Use real Japanese content from the sample/research; no lorem ipsum.
- Sentence data:
  - `jp` / `sentence`
  - `kana` / `reading`
  - `natural`
  - `raw` (literal chunk-order gloss)
  - `chunks[1..6]`
  - `sentenceNote`
- Each chunk:
  - `n`, `jp`, `kana`, `gloss`, `role`, `color` 1–6
  - `note`
  - `construction[]` (`jp`, `en`)
  - `examples[]` (`jp`, `en`)
- Raw translation is literal, chunk-order, and unpolished. Natural is adapted English.
- Grammar notes are concise and concrete; no textbook filler.
- Verify Japanese examples; do not auto-generate unchecked text.
- Tatoeba examples are real corpus sentences; do not rewrite them. Show the source,
  contributor when available, sentence license, and audio contributor/license.
- Only display Tatoeba audio when its license is non-empty. Do not reuse empty-license
  audio outside Tatoeba.
- Generated examples are a fallback and must be labelled “Generated examples”. Do not show
  them alongside Tatoeba examples.
- No fake metadata ("Entry 06", "Fieldwork 04"). Use real session data.

---

## 13. Do / Don't

**Do**

- Keep the sentence largest and calmest.
- Use warm neutral layers, hairlines, and soft shadows.
- Use flat tinted highlights for chunks.
- Keep the sidebar as the full breakdown.
- Use real content and real states.
- Use the six hues consistently.
- Make the first screen a tool, not a pitch.
- Show real Tatoeba sentences with a source link and attribution.
- Use `--control-line` for interactive boundaries and `calc()` for inset radii.
- Keep dark-mode elevation progressive (`bg → surface → surface-2`).
- Use `100dvh` for full-height surfaces.

**Don't**

- Don't add paper texture, grain, noise, glass, blobs, or multiple background colors.
- Don't fake a highlighter brushstroke; the flat highlight is the honest choice.
- Don't underline chunks.
- Don't add Reader/Breakdown tabs or a separate breakdown page.
- Don't add chat bubbles or a chat thread.
- Don't add a fullscreen/focus button.
- Don't add a marketing hero, feature cards, footer, login, or onboarding.
- Don't build a phone layout.
- Don't use 8–9px labels.
- Don't make the dark mode olive/green.
- Don't duplicate the sidebar's construction/examples/grammar in the center.
- Don't use fake metadata or decorative issue numbers.
- Don't imply that Tatoeba endorses Bunkai.
- Don't hide Tatoeba licenses or show empty-license audio.
- Don't show Tatoeba and generated examples as two competing lists.
- Don't use colored left-border accents on notes, error boxes, active rows, or diagram
  boxes. Use tint, spacing, hairlines, dots, and type instead.
- Don't use a decorative hairline as the only boundary of a control.
- Don't add carousel edge masks, blur icon swaps, or multiply-blended product images; none
  of those patterns fit the current content.

---

## 14. Reference gaps to fix in implementation

The local reference is a visual prototype. The implementation should:

- Replace Google Fonts with Fontsource.
- Replace inline sample data with typed fixtures.
- Replace inline JS/local state with Svelte state.
- Add IndexedDB persistence for sessions.
- Add scrim/focus trap to the 900–1099 sidebar drawer.
- Add the desktop guard below 900.
- Keep the 1280/1100/900 breakpoint logic; do not regress to the old 1200/899 behavior.
- Keep the flat highlight blocks; do not reintroduce the failed brushstroke.
- Keep the warm neutral dark mode; do not reintroduce olive surfaces.
- Add tests for 900, 1024, 1100, 1200, 1280, 1440.
