# Tatoeba API — verified notes

**Last verified:** 2026-11-17. **Base:** `https://api.tatoeba.org`.

Legend: **Fact** = directly observed or stated by Tatoeba. **Inference** = a conclusion
from observations. **Hypothesis** = unconfirmed.

## Search endpoint

**Fact**

```
GET https://api.tatoeba.org/v1/sentences
  ?lang=jpn
  &q=<short Japanese term>
  &sort=relevance
  &limit=10
  &is_unapproved=no
  &trans:lang=eng
  &trans:is_unapproved=no
  &showtrans:lang=eng
  &showtrans:is_unapproved=no
  &include=audios
```

- The endpoint is public and requires no authentication.
- `sort` is **required**. Omitting it returns **HTTP 400**.
- `q` uses ManticoreSearch query syntax.
- `lang` is required.
- `trans:lang=eng` limits results to sentences that have an English translation.
- `trans:is_unapproved=no` excludes sentences whose translations are all unapproved.
- `showtrans:lang=eng` returns the English translations.
- `showtrans:is_unapproved=no` filters returned translations. This is a valid parameter
  in the OpenAPI document even though the original brief did not list it.
- `is_unapproved=no` excludes unapproved Japanese sentences.
- `include=audios` adds `audios[]` to both sentences and translations.
- `limit` controls the number of sentences returned. Bunkai requests 10 and picks up to 3.

**CORS (Fact)**

The search response includes:

```
Access-Control-Allow-Origin: *
```

A direct browser `fetch` from a different origin works. No backend or proxy is needed.

**Response shape (Fact)**

```json
{
  "data": [
    {
      "id": 1532832,
      "text": "ありがとう。",
      "lang": "jpn",
      "script": null,
      "license": "CC BY 2.0 FR",
      "owner": "bunbuku",
      "is_unapproved": false,
      "audios": [
        {
          "id": 74331,
          "created": null,
          "author": "yomi",
          "license": "CC BY-NC 4.0",
          "attribution_url": "https://tatoeba.org/user/profile/yomi",
          "download_url": "https://api.tatoeba.org/v1/audio/74331/file",
          "modified": null
        }
      ],
      "translations": [
        {
          "id": 374827,
          "text": "Thank you!",
          "lang": "eng",
          "license": "CC BY 2.0 FR",
          "owner": "sysko",
          "is_unapproved": false,
          "is_direct": true,
          "audios": []
        }
      ]
    }
  ],
  "paging": {
    "total": 2919,
    "has_next": true,
    "next": "https://api.tatoeba.org/v1/sentences?..."
  }
}
```

- `owner` may be `null` for orphan sentences.
- An empty result is `{"data":[],"paging":{"total":0,"has_next":false}}`.
- `translations` can contain direct and indirect links (`is_direct`).
- The translation objects can also contain `audios[]`; Bunkai ignores those and uses the
  Japanese sentence audio only.
- `license` is a per-sentence field. Observed values include `CC BY 2.0 FR`; Tatoeba also
  publishes some sentences under `CC0 1.0`.

## Audio

**Fact — the API's `download_url` is broken**

- The search response's `download_url` is
  `https://api.tatoeba.org/v1/audio/{audioId}/file` (singular `audio`).
- That URL returns **HTTP 404**:
  `{"message":"Not Found","url":"/v1/audio/74331/file","code":404}`.
- The working API path is **`https://api.tatoeba.org/v1/audios/{audioId}/file`** (plural
  `audios`), confirmed by the OpenAPI path `/v1/audios/{id}/file` and a 200 response.
- Bunkai constructs the URL from the audio `id` and does not trust `download_url`.

**Fact — empty audio licenses**

- Audio licenses vary: observed `CC BY-NC 4.0`, `CC BY-NC-ND 3.0`, `CC BY 4.0`, and `""`.
- Tatoeba's downloads page says: “If the license field is empty, you may not reuse the
  audio outside the Tatoeba project.”
- The API returns **HTTP 403** for an audio recording with an empty license
  (example: audio id `1046383`). The direct `audio.tatoeba.org` path also returned 403.
- Bunkai therefore only displays audio when `audio.license` is a non-empty string.

**Fact — playback**

- `<audio>` can play the API endpoint. A Playwright/Chrome check of
  `https://api.tatoeba.org/v1/audios/137636/file` reached `canplay` with a 2.03s duration.
- The endpoint sends `Content-Disposition: attachment`; this did not prevent media loading
  in Chrome, but Bunkai still handles playback failure gracefully.
- `https://tatoeba.org/audio/download/{audioId}` is the documented site URL and redirects
  to `/en/audio/download/{audioId}`. Bunkai uses the API path so the audio id is explicit.

## Licensing and attribution

**Fact**

- Text: Tatoeba's default license is **CC BY 2.0 FR**; some sentences are **CC0 1.0**.
- Attribution for text: state that sentences come from Tatoeba, link to
  https://tatoeba.org, and mention CC BY 2.0 FR.
- Audio: licenses are chosen per recording. Attribution should name the contributor and
  the license.
- Do not imply that Tatoeba endorses Bunkai.

Bunkai's UI:

- Per sentence: `Tatoeba #<id>` source link, contributor name when available, and the
  sentence license.
- Per audio: `Audio: <author> · <license>`.
- Section footer: “Sentences from Tatoeba · CC BY 2.0 FR”, with links to Tatoeba and the
  license.

## Rate limits, caching, and latency

**Fact**

- No rate limit is documented in the API wiki or OpenAPI description.
- The API is read-only and public. Tatoeba asks projects not to bulk-download the corpus;
  Bunkai uses search only.

**Observation (Fact) — latency is highly variable**

| Query | Observed time | Notes |
|---|---:|---|
| `共有` | 8.1s cold, 1.3s warm | 29 total results |
| `動いた` | 10.5s | 948 total results |
| `誰か` | 1.9s | 2,171 total results |
| `だけ` | 5.7s | 12,133 total results |
| `心` | 30.8s cold, 7.7s warm | 2,467 total results |
| `ありがとう` | not separately timed | audio examples |
| `たくなった` | 10.0s | ambiguous with `〜くなった` |
| `ときに` | 2.0s | mostly `その時に`/`時に` |

- The first query after a gap can take 30s; subsequent warm queries are faster.
- Bunkai uses a **12s timeout** and a graceful fallback rather than an 8–10s timeout.
- Responses are cached for 30 days; this is the main politeness mechanism.

## Query behavior

**Fact**

- Short single terms work well: `共有`, `動いた`, `誰か`, `だけ`, `ありがとう`.
- Quoted phrase `q="心が動いた"` returned zero results.
- Unquoted `q=心が動いた` returned 13 results but took 28.6s.
- A 200-character query returned HTTP 200 but took 17.8s. It is not a useful query shape.
- Omitting `sort` returns HTTP 400.
- An empty `q` returns HTTP 200 (not useful).

**Inference**

- Tatoeba's search is substring/token-based, not morphological. `心` also matches `安心`.
- A client-side containment check (normalized sentence includes normalized query) removes
  stale index matches such as a `だけ` result that no longer contains `だけ`.
- Distinctive content words are better than grammar endings. `たくなった` matches
  `冷たくなった`/`痛くなった` as well as the “want to” pattern.
- Duplicate or near-duplicate sentences occur (`俺だけ？`, `僕だけ？`, `私だけ？`), so
  dedupe by normalized English translation in addition to sentence id.
