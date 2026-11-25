# Documentation

Bunkai's product, design, and engineering documents. Read the source of truth first; it
wins over every other document.

| Document                                          | Purpose                                        |
| ------------------------------------------------- | ---------------------------------------------- |
| [Source of Truth](./SOURCE_OF_TRUTH.md)           | Canonical product scope, stack, decisions      |
| [Design](./DESIGN.md)                             | Visual system, components, interaction rules   |
| [Plan](./PLAN.md)                                 | Phased execution order and acceptance criteria |
| [Manifest](./manifest.md)                         | Project inventory, commands, data contracts    |
| [Handoff](./HANDOFF.md)                           | Living status log and current state            |
| [Release notes](./RELEASE.md)                     | v0.1.0 local desktop release notes             |
| [Kickoff](./KICKOFF.md)                           | Prompt for a fresh chat to start the project   |
| [Tatoeba research](../research/tatoeba/README.md) | Verified API, licensing, and integration notes |

## Current shape

- App source lives at the repository root: `src/`, `tests/`, `public/`.
- The app is desktop-first and local-first: no backend, login, or cloud sync.
- Sample and manual modes work without an API key.
- Phase 7.5A/B (Tatoeba examples) is complete; Phase 7.5C is not approved.
- Phase 8A (PWA/offline), 8B (export/import), and the security hardening pass are complete.
- Phase 9 (polish and release) is complete. v0.1.0 is the first local desktop release.
- Distribution is local-only: no hosted deployment and no 8C share link. Users run the
  static build on their own device.
- MIT licensed. The repository is public.

## Local-only material

The original design reference, prototypes, and third-party grammar research are kept
locally and are ignored by Git. `DESIGN.md` is the implementation design authority.
