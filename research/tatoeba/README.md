# Tatoeba research

**Status:** Phase 7.5A/7.5B complete. Last updated: 2026-11-17.

This folder records the Tatoeba integration research for Bunkai. It is separate from the
Japanese grammar research files in `research/`.

## Index

| File | Purpose |
|---|---|
| `README.md` | Index, status, scope |
| `api.md` | Verified endpoints, parameters, response shapes, CORS, audio, licenses |
| `log.md` | Dated queries and observations |
| `findings.md` | What works, what does not, corpus quality notes |
| `open-questions.md` | Unresolved questions and decisions |
| `decisions.md` | Material changes to the brief, with evidence and rationale |
| `raw/` | Saved JSON samples from the live API |

## Scope

- Optional, read-only example layer in the breakdown sidebar.
- Real Japanese sentences with approved English translations and licensed audio.
- Direct browser requests to `api.tatoeba.org`; no backend, proxy, auth, or key.
- Local cache in IndexedDB; the app still works with no network.
- AI examples remain the fallback.

## Access

All live checks were made on **2026-11-17** from the project workstation using
`curl.exe` and PowerShell. Timings are observations from one workstation and one
network path, not a service guarantee.

## Sources

- Tatoeba API: https://api.tatoeba.org
- OpenAPI document: https://api.tatoeba.org/openapi.json
- API wiki: https://en.wiki.tatoeba.org/articles/show/api
- Using the corpus: https://en.wiki.tatoeba.org/articles/show/using-the-tatoeba-corpus
- FAQ and attribution: https://en.wiki.tatoeba.org/articles/show/faq
- Downloads and audio licenses: https://tatoeba.org/en/downloads
