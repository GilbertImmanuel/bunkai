# Bunkai — Kickoff

**Purpose:** Start Phase 0 in a fresh chat with enough context to work without this conversation.

---

## Copy-paste prompt

```text
You are the implementation agent for Bunkai, a desktop-first Japanese sentence breakdown app. Work in the repository root (the folder containing `package.json`).

Read these files, in order, before writing code:
1. docs/SOURCE_OF_TRUTH.md
2. docs/PLAN.md
3. docs/DESIGN.md
4. docs/manifest.md
5. docs/HANDOFF.md

The visual reference is:
design/02-11-2026/bunkaiver2.html
Open it for the look and behavior. Do not copy its single-file architecture or prototype shortcuts.

CONFIRMED STACK
- Package manager: Bun 1.3.14
- Build: Vite 8 + Svelte 5 + TypeScript
- Styling: plain CSS + design tokens
- Persistence: localStorage + IndexedDB via idb-keyval
- Fonts: Fontsource, self-hosted
- Tests: Vitest + Playwright
- App root: repository root
- Desktop-only: supported 900–1920px; guard below 900
- No backend, no auth, no phone layout, no marketing site, no chat threads

YOUR TASK
Start at Phase 0 only. Do not skip ahead. Do not start Phase 1.

Phase 0 — Foundation:
1. Scaffold the app at the repository root:
   bunx create-vite@latest . --template svelte-ts
   bun install
2. Add dependencies:
   bun add idb-keyval
   bun add @fontsource/shippori-mincho @fontsource/vollkorn @fontsource/ia-writer-quattro @fontsource/ia-writer-mono
   bun add -d vitest @playwright/test svelte-check eslint prettier eslint-plugin-svelte prettier-plugin-svelte
3. Add scripts: dev, build, preview, check, lint, format, test, test:e2e.
4. Add vitest.config.ts and playwright.config.ts. Use system Chrome (channel: "chrome") for local visual checks; install Chromium later if needed.
5. Add one smoke test: the home shell renders at 1280×800.
6. Enable TypeScript strict mode.
7. Add src/lib/styles/tokens.css with the exact light/dark tokens from docs/DESIGN.md.
8. Add src/lib/styles/base.css: reset, app background, scrollbar rules, focus ring, reduced motion.
9. Add src/lib/styles/fonts.css using Fontsource; remove Google Fonts links.
10. Add src/lib/data/types.ts with Session, Chunk, ConstructionStep, Example, HistoryItem, TranslationMode, Theme.
11. Add src/lib/data/sample.ts with the sample sentence and breakdown from the reference.
12. Add src/lib/stores/app.svelte.ts for view, theme, selectedChunk, noteOpen, historyOpen, translationMode.
13. Build the base shell: topbar, history column, center, sidebar placeholders.
14. Add a DesktopGuard placeholder.
15. Verify with bun run dev and bun run check.

ACCEPTANCE FOR PHASE 0
- bun run dev renders the shell at 1280×800.
- Fonts load locally; no Google Fonts network request.
- Light/dark token values match docs/DESIGN.md.
- Sample data is typed and renders six chunks.
- No feature pages or fake data beyond the sample.
- docs/ and research/tatoeba/ are untouched; local-only design references,
  prototypes, and third-party research are not committed.
- bun run check passes.
- bun run test smoke test passes.
- No console errors.

AT THE END
- Run: bun run check and bun run test
- Update docs/HANDOFF.md with Phase 0 status, files, commands, tests, decisions, blockers, and next action.
- Report what you changed and the exact command to continue.
- Stop. Ask before starting Phase 1.

CONSTRAINTS
- If a doc conflicts, docs/SOURCE_OF_TRUTH.md wins. Stop and ask if the conflict is real.
- Do not build phone layouts, auth, a backend, a marketing site, a separate Breakdown page, or chat threads.
- Do not copy the reference's inline JS or Google Fonts CDN.
- Do not add a fullscreen/focus button.
- Do not use fake highlighter brushstrokes, underlines, 8–9px labels, paper texture, glass, or color blobs.
- Preserve docs/, research/tatoeba/, and the app at the repository root. Local-only
  design, play, archive, and third-party research material are not committed.
- Use Bun, not npm.
```

---

## Short version

```text
Read docs/SOURCE_OF_TRUTH.md, docs/PLAN.md, docs/DESIGN.md, docs/manifest.md, and docs/HANDOFF.md. Use the local-only design/02-11-2026/bunkaiver2.html as the visual reference only.

Start Phase 0 only: scaffold the app at the repository root with Bun + Vite + Svelte 5 + TypeScript, install the dependencies, add the tokens/fonts/sample data, and render the base shell. Run bun run check, update docs/HANDOFF.md, and stop. Ask before Phase 1.

Desktop-only, 900px floor, no backend/auth/phone/marketing/chat. If docs conflict, SOURCE_OF_TRUTH wins.
```

---

## What the fresh agent should not do

- Do not start Phase 1 or build features.
- Do not install or use npm; use Bun.
- Do not scaffold in a subfolder. The app lives at the repository root.
- Do not edit `design/`, `play/`, `archive/`, or the local third-party research; they are
  local-only and are not committed.
- Do not change the design system to Tailwind or a component library.
- Do not add a database, auth, analytics, or a server.
- Do not build a phone layout.
- Do not add a marketing page.
- Do not mark Phase 0 complete without updating `HANDOFF.md`.
