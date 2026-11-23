<p align="center">
  <img src="./public/favicon.svg" width="72" height="72" alt="文" />
</p>

<h1 align="center">Bunkai</h1>

<p align="center">Read a Japanese sentence, see its pieces.</p>

<p align="center">
  <a href="./docs/README.md">Docs</a> ·
  <a href="./docs/DESIGN.md">Design</a> ·
  <a href="./docs/PLAN.md">Roadmap</a> ·
  <a href="./docs/HANDOFF.md">Status</a>
</p>

<p align="center">
  <a href="https://github.com/GilbertImmanuel/bunkai/actions/workflows/ci.yml">
    <img src="https://github.com/GilbertImmanuel/bunkai/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
  <img src="https://img.shields.io/badge/desktop-900px%2B-2F5D8A" alt="Desktop 900px+" />
</p>

<p align="center">
  <img src="./.github/readme/hero.png" width="100%"
       alt="Bunkai reading workspace with a chunked Japanese sentence and a breakdown sidebar" />
</p>

Bunkai is a desktop-first, local-first Japanese sentence breakdown app. Paste a sentence,
see it chunked, and select a chunk to read its role, construction, literal gloss, real
example sentences, and grammar note.

The app and your local data run entirely on your device. There is no hosted instance, no
account, and no Bunkai server; optional AI and Tatoeba calls go directly from your browser
to those services. It is a reading desk, not a dictionary, chatbot, flashcard app, or
course.

**Release:** v0.1.0 local desktop release. See [release notes](./docs/RELEASE.md).

## What you get

- **Chunked reading.** The sentence is the hero. Every chunk has a colour, a role, kana,
  a literal gloss, and a grammar note.
- **A real breakdown sidebar.** Construction steps, examples, and a concise grammar note
  for the selected chunk. Reclick the chunk or press `Esc` to collapse it.
- **Natural and raw translations.** Read the adapted English or the literal chunk-order
  gloss. Natural highlights follow meaning, not English word order.
- **Furigana and sentence maps.** Name and vocabulary readings are independent switches;
  the Cure Dolly-style map shows topic, A-car, B-engine, modifiers, and limiters.
- **Real examples from Tatoeba.** 2–3 attributed corpus sentences with approved English
  translations, source links, and licensed audio where available. Cached locally.
- **Local history.** Sessions live in IndexedDB. Search, reopen, save, and undo without an
  account or a server.
- **Bring your own AI key (optional).** OpenRouter, OpenCode via your proxy, OpenAI, or
  Claude. With no key, the sample and manual modes work fully.
- **Local-first.** No hosted instance, backend, login, cloud sync, or analytics. AI keys
  and sessions stay in your browser on your machine.
- **Installable and offline.** Install from desktop Chrome/Edge; the app shell and fonts
  load offline. Updates prompt instead of reloading silently. AI and Tatoeba API responses
  are never cached by the service worker.
- **Backup and restore.** Export all sessions to a JSON file from Settings → Data, then
  import on another machine or profile. Merge new sessions or replace the history. Backups
  never include API keys, preferences, or the Tatoeba cache.

## Quick start

**Prerequisites:** Bun 1.3.14+ and Node 22+. Install Bun from
[bun.sh](https://bun.sh/docs/installation) if needed.

### 1. Get the code

Clone the repository:

```bash
git clone https://github.com/GilbertImmanuel/bunkai.git
cd bunkai
```

Or use **Code → Download ZIP** on GitHub, unzip the archive, and open a terminal in
that folder.

### 2. Run it

All commands run from the repository root (the folder containing `package.json`).

```bash
bun install --frozen-lockfile
bun run build
bun run preview
```

Open the URL printed in the terminal — usually `http://localhost:4173` — and click the
sample, or paste a Japanese sentence. Keep the terminal open while you use the app.

> **Do not open `dist/index.html` directly.** The built app must be served over HTTP;
> module scripts and the service worker do not work from `file://`.

**Use the same URL every time.** Keys, history, and PWA state are scoped to the exact
origin and port. `localhost:4173`, `127.0.0.1:4173`, and `localhost:5173` are three
different stores. `bun run preview` is the normal way to use the app; `bun run dev` is
for development and uses a separate origin.

### Development

```bash
bun run dev         # development server at http://localhost:5173
bun run check       # svelte-check + TypeScript
bun run lint        # ESLint
bun run test        # Vitest
bun run test:e2e    # Playwright (system Chrome by default)
bun run test:pwa    # build + preview; manifest, service worker, offline shell, CSP
bun run icons       # regenerate PWA icons from public/favicon.svg
bun run build       # static build in dist/
bun run preview     # serve the production build
```

The app is desktop-only. Below 900px it shows a guard instead of a broken layout.

## Install and offline

PWA assets are generated for production. The dev server does not register the production
service worker. Use the production preview:

```bash
bun run build
bun run preview
```

Open the preview URL in Chrome or Edge and use the install icon in the address bar. The
first visit caches the app shell and fonts; later loads work offline. After installation,
the app can open offline; the preview server is only needed for the first install and for
updates. AI and Tatoeba requests still need a network connection and degrade to their
normal fallbacks.

You can close the preview terminal after the app has installed and cached once. If you
clear site data, reinstall from the preview URL.

## Troubleshooting

- **Keys or history disappeared.** You are on a different host or port. Use the same URL
  as before (`localhost` vs `127.0.0.1` matters), or import a backup.
- **The PWA install icon is missing.** Open the production preview, not `bun run dev`, and
  do not use `file://`. Chrome or Edge is required.
- **AI calls fail.** Check the key, the model name, and the provider's browser/CORS policy.
  OpenCode requires the local proxy endpoint. The app always falls back to sample/manual
  mode without a key.
- **Tatoeba examples are missing.** The API may be unavailable or blocked on your network;
  generated examples remain available.
- **Offline mode does not work.** Load the app online once from the preview URL so the
  service worker can cache the shell.

## Project structure

```
├─ src/
│  ├─ lib/
│  │  ├─ ai/          # optional BYO-key providers and breakdown parsing
│  │  ├─ components/  # reading sheet, sidebar, history, settings, examples
│  │  ├─ data/        # types, sample sessions, sentence map, references
│  │  ├─ stores/      # app, history, AI, Tatoeba, toast
│  │  ├─ styles/      # tokens, base, self-hosted fonts
│  │  ├─ tatoeba/     # client, lookup, cache
│  │  └─ utils/       # persistence, history helpers, motion
│  ├─ App.svelte
│  └─ main.ts
├─ tests/e2e/         # Playwright coverage with mocked AI/Tatoeba routes
├─ tests/pwa/         # manifest, service worker, offline shell, CSP
├─ docs/              # product, design, plan, manifest, handoff, docs index
├─ research/tatoeba/  # verified API and licensing research
├─ public/            # favicon and PWA icons
├─ LICENSE            # MIT
└─ pwa-assets.config.ts
```

## Local-first notes

- Sessions are stored in **IndexedDB** (`bunkai.sessions`); preferences in `localStorage`.
- AI keys are stored locally under `bunkai.ai` and go directly from your browser to the
  provider you choose. Browser storage is not a vault; use a scoped, revocable key.
- Removing a key in Settings deletes the local copy. It does **not** revoke the key at the
  provider; revoke it in the provider dashboard if it may have been exposed.
- Tatoeba examples are fetched directly from `api.tatoeba.org` and cached locally. Only
  the short lookup term is sent. No Bunkai server is involved.
- Backups are local JSON files containing session text only. They exclude API keys,
  preferences, and the Tatoeba cache. A backup is readable text; treat it as sensitive.
- The sample and manual modes work without any API key.

## Security model

- **No hosted service.** Nobody operates a Bunkai server that receives your keys,
  sentences, or history.
- **Keys stay local.** The key is read from this origin's `localStorage` and sent only to
  the provider you selected (or the OpenCode proxy you configured).
- **The production build adds a Content Security Policy.** It restricts scripts to the app
  bundle and network requests to the provider, Tatoeba, and loopback proxy origins. This is
  defense in depth; it does not make a compromised device safe. Because it is a meta tag,
  `frame-ancestors` is unavailable; clickjacking is an accepted low risk for this local app.
- **Use a limited key.** Prefer a key with a spending limit that you can revoke. Do not use
  a shared or production key.
- **Backups are plain JSON.** They contain sentences and breakdowns, not keys. Store or
  share them accordingly.
- **Local data is origin-scoped.** Changing the host or port creates a separate store. Use
  the same URL and export a backup before moving to another machine.
- **No warranty.** This is a personal project shared as-is. See `LICENSE`.

What this cannot protect against: a compromised device, a malicious browser extension, a
modified fork, or a compromised dependency. Keep the dependency tree small and review
updates before installing them.

## Credits

- Example sentences from [Tatoeba](https://tatoeba.org), generally
  [CC BY 2.0 FR](https://creativecommons.org/licenses/by/2.0/fr/). Audio licenses vary per
  recording and are credited in the app. Tatoeba does not endorse Bunkai.
- Fonts self-hosted via [Fontsource](https://fontsource.org): Shippori Mincho, Vollkorn,
  iA Writer Quattro, and iA Writer Mono.
- Built with [Svelte](https://svelte.dev), [Vite](https://vite.dev), and
  [idb-keyval](https://github.com/jakearchibald/idb-keyval).

## Documentation

- [Documentation index](./docs/README.md)
- [Source of truth](./docs/SOURCE_OF_TRUTH.md)
- [Design system](./docs/DESIGN.md)
- [Implementation plan](./docs/PLAN.md)
- [Project manifest](./docs/manifest.md)
- [Living handoff](./docs/HANDOFF.md)
- [Release notes](./docs/RELEASE.md)
- [Tatoeba research](./research/tatoeba/README.md)

## License

MIT © 2026 Gilbert Immanuel Hasiholan. See [LICENSE](./LICENSE).
