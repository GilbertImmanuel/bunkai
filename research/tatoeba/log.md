# Tatoeba log

All entries: **2026-11-17**. Environment: Windows, PowerShell, `curl.exe` and
`Invoke-RestMethod`. Times are wall-clock observations, not benchmarks.

| Time | Query / endpoint | Result | Why it mattered |
|---|---|---|---|
| 01:15 | `GET /v1/sentences?lang=jpn&q=心&sort=relevance&limit=3&trans:lang=eng&trans:is_unapproved=no&showtrans:lang=eng&include=audios` | 200; 3 results; CORS `*`; 2,467 total | Confirmed the core endpoint, CORS, filter names, and response shape |
| 01:15 | Same without `sort` | 400 | Confirmed `sort` is required |
| 01:15 | `q="心が動いた"` (quoted) | 200; `data: []`; 49-byte response | Confirmed phrase queries can return zero |
| 01:15 | `q=共有` | 200; 29 total; 8.1s | Cold latency; content word works |
| 01:15 | `q=教えた` | 200; 5.2s | Common verb timing |
| 01:15 | `q=誰か` | 200; 2,171 total; 3.1s | Short pronoun works |
| 01:16 | `q=天気` | 200; 526 total; 7.8s | No Japanese audio in first two results |
| 01:16 | `q=ありがとう` | 200; 2,919 total | Found sentence audio (id 74331, yomi, CC BY-NC 4.0) |
| 01:16 | `GET /v1/audio/74331/file` (from `download_url`) | **404** | API's `download_url` is broken |
| 01:16 | `GET /v1/audios/74331/file` | 200; `audio/mpeg`; 20,035 bytes | Correct plural endpoint works |
| 01:16 | `GET /v1/audios/1046383/file` (empty license) | **403** | Empty audio license is not reusable |
| 01:16 | `GET https://tatoeba.org/audio/download/1046383` | 200 | Site URL serves it, but we will not use empty-license audio |
| 01:18 | `q=動いた` | 200; 948 total; 10.5s | Good content verb results |
| 01:18 | `q=だけ` | 200; 12,133 total; 5.7s | One result did not contain `だけ` (stale index) |
| 01:19 | `q=心` again | 200; 7.7s warm | First call was 30.8s cold |
| 01:19 | `q=心&sort=words` | 200; 2.0s | `sort=words` was faster when warm, not chosen |
| 01:19 | `q=心が動いた` unquoted | 200; 13 total; 28.6s | Phrases are slow |
| 01:20 | `q=心` with a 200-character query | 200; 17.8s | Long queries are slow, not necessarily errors |
| 01:20 | `q=` empty | 200; empty data | Query must be non-empty |
| 01:21 | `q=心-` | 200; 6.2s | Punctuation did not error here, but sanitize anyway |
| 01:21 | `q=心"` | TLS handshake failure | Environment/network anomaly; sanitize punctuation |
| 01:22 | `q=たくなった` | 200; 10.0s; `冷たくなった`, `痛くなった`, ... | Grammar endings are ambiguous |
| 01:22 | `q=ときに` | 200; 2.0s; `その時に`, `時に人は...` | Pattern search is noisy |
| 01:23 | OpenAPI `GET /openapi.json` | 200; JSON | Confirmed parameter names and `/v1/audios/{id}/file` |
| 01:28 | Playwright Chrome `<audio>` check of `/v1/audios/137636/file` | `canplay`; 2.03s | API audio plays in the browser |
| 01:28 | Playwright Chrome `<audio>` check of `audio.tatoeba.org/sentences/jpn/2412133.mp3` | `canplay`; 2.03s | Direct audio path also works; API path chosen |
| 01:29 | `GET https://tatoeba.org/en/downloads` | 200 | Audio license rule: empty means no reuse outside Tatoeba |
| 01:29 | `GET https://en.wiki.tatoeba.org/articles/show/faq` | 200 | Text and audio attribution guidance |
| 08:58 | Live app check: sample chunk 05 `共有` at 1280×800 | 3 real examples, 0 audio, no console errors | End-to-end browser check with no route mocking; screenshot `app/test-results/tatoeba-live-1280x800.png` |

## Notes

- The 30.8s `心` request was the first Tatoeba call after a gap. Later calls for the same
  term were 7.7s. Treat latency as variable and use a timeout plus cache.
- The main `tatoeba.org` site occasionally failed TLS from the workstation while
  `api.tatoeba.org` worked. This is an environment/network observation, not an API change.
- No live Tatoeba calls will be part of the automated test suite.
