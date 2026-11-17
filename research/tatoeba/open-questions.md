# Tatoeba open questions

1. **Opt-out toggle.** The user chose automatic fetching per the brief. A future
   preference could add a “Tatoeba examples” switch. Not in Phase 7.5A/B.
2. **Translation author attribution.** Bunkai shows the Japanese sentence contributor and
   the sentence license, and links to the Tatoeba sentence page. The English translation
   author is visible on that page but is not shown inline. Is inline translation-author
   attribution needed? Tatoeba's FAQ asks for attribution of the text data; the linked
   page and the global license line may be sufficient.
3. **Audio prioritization.** Audio is shown when available but is not used to rank
   results. Should audio-bearing sentences be preferred over audio-less ones? Current
   recommendation: no; relevance and translation quality matter more.
4. **Showing both sources.** Bunkai shows Tatoeba examples when they exist and falls back
   to generated examples only when Tatoeba is empty/unavailable/skipped. Should the AI
   examples remain visible below Tatoeba examples as a secondary list? Current
   recommendation: no; it duplicates content and weakens the “real examples” signal.
5. **Cache invalidation.** A 30-day TTL and 500-entry cap are proposed. Tatoeba corrects
   sentences over time; 30 days is a reasonable balance. Revisit if users report stale
   examples.
6. **Phase 7.5C.** The Home “Find a sentence” picker is not approved. It would reuse the
   client/cache but adds a second search surface and `Session.origin` provenance.
7. **Empty-license audio.** It is omitted by design. If the user wants it, Tatoeba's terms
   would need a different interpretation; do not change without a licensing review.
8. **Main-site TLS anomaly.** `tatoeba.org` occasionally failed TLS from the workstation
   while `api.tatoeba.org` worked. This is likely a local network/edge issue. Source links
   are standard `https://tatoeba.org/...` URLs and should be checked in a browser during
   manual verification.
