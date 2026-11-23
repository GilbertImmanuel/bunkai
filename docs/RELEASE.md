# Release notes

## v0.1.0 — Local desktop release

**Released:** 2026-11-23

The first release-ready build. It is a local-only desktop web app: no hosted instance, no
account, no telemetry, and no server that receives keys or history.

### What works

- Paste a Japanese sentence and read it as colored chunks.
- Chunk breakdown sidebar with role, construction, literal gloss, grammar note, and guides.
- Natural and raw translations; name and vocabulary furigana; row/tree sentence map.
- Real, attributed Tatoeba examples with licensed audio where available; generated
  examples remain the fallback.
- Optional BYO-key AI breakdowns through OpenRouter, OpenAI, Claude, or an OpenCode proxy.
- Local history, save/undo, search, and IndexedDB persistence.
- Versioned JSON backup export and import with merge or replace.
- Installable PWA with an offline app shell and prompt-based updates.
- Light and dark themes; keyboard selection; reduced-motion handling.

### How to run

Requires Bun 1.3.14+ and Node 22+.

```bash
bun install --frozen-lockfile
bun run build
bun run preview
```

Open the printed URL, usually `http://localhost:4173`. Do not open `dist/index.html`
directly; the app must be served over HTTP. Keys and history are scoped to the exact origin
and port, so use the same URL each time.

See the [README](../README.md) for development commands, PWA installation, troubleshooting,
and the security model.

### Security and privacy

- No backend, login, cloud sync, analytics, or hosted key store.
- API keys stay in this origin's `localStorage` and go only to the selected provider or
  proxy. Removing a key deletes the local copy; revoke it at the provider if it may have
  been exposed.
- Backups contain sessions only, never keys, preferences, or the Tatoeba cache. They are
  plaintext JSON; treat them as sensitive.
- The production build carries a restrictive meta CSP and a no-referrer policy.
- MIT licensed. See [LICENSE](../LICENSE).

### Known limitations

- Desktop-only. Below 900px the app shows a guard instead of a mobile layout.
- No hosted deployment, public demo, or share link. Sharing is via backup JSON.
- No native installer yet. The installed PWA is the closest one-click experience.
- AI and Tatoeba features need network access. Sample and manual modes work offline.
- Backups are unencrypted. There is no multi-tab sync or history delete control.
- Full WCAG reflow at very high zoom is not supported because of the 900px minimum.

### Verification

- `bun run check` — pass
- `bun run lint` — pass
- `bun run test` — 117 tests
- `bun run test:e2e` — 49 tests
- `bun run test:pwa` — 2 tests
- `bun run build` — pass; CSP, no-referrer, manifest, service worker, and 19-entry precache

Run `test:e2e` and `test:pwa` sequentially; running both browser suites at once can cause
resource-contention timeouts.
