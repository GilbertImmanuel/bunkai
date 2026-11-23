# Documentation

Bunkai's product, design, and engineering documents. Read the source of truth first; it
wins over every other document.

| Document | Purpose |
|---|---|
| [Source of Truth](./SOURCE_OF_TRUTH.md) | Canonical product scope, stack, decisions |
| [Design](./DESIGN.md) | Visual system, components, interaction rules |
| [Plan](./PLAN.md) | Phased execution order and acceptance criteria |
| [Manifest](./manifest.md) | Project inventory, commands, data contracts |
| [Handoff](./HANDOFF.md) | Living status log and current state |
| [Kickoff](./KICKOFF.md) | Prompt for a fresh chat to start the project |
| [Tatoeba research](../research/tatoeba/README.md) | Verified API, licensing, and integration notes |

## Current shape

- App source lives at the repository root: `src/`, `tests/`, `public/`.
- The app is desktop-first and local-first: no backend, login, or cloud sync.
- Sample and manual modes work without an API key.
- Phase 7.5A/B (Tatoeba examples) is complete; Phase 7.5C is not approved.
- Phase 8A (PWA/offline) is complete; Phase 8B (export/import) and 8C (optional share
  link) are pending.

## Local-only material

The original design reference, prototypes, and third-party grammar research are kept
locally and are ignored by Git. `DESIGN.md` is the implementation design authority.
