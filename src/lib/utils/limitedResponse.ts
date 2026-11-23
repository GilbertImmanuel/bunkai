/**
 * Reads a response body while enforcing a decoded-byte limit. Content-Length
 * is not enough because fetch decompresses the body before handing it to the
 * application.
 */
export class ResponseLimitError extends Error {
  constructor() {
    super('The response body exceeded the size limit.')
    this.name = 'ResponseLimitError'
  }
}

const encoder = new TextEncoder()

export async function readLimitedText(
  response: Response,
  maxBytes: number,
  signal?: AbortSignal,
): Promise<string> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

  if (!response.body) {
    const text = await response.text()
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    if (encoder.encode(text).byteLength > maxBytes) throw new ResponseLimitError()
    return text
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let bytes = 0
  let text = ''

  const onAbort = () => {
    void reader.cancel().catch(() => {})
  }
  signal?.addEventListener('abort', onAbort, { once: true })

  try {
    while (true) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue

      bytes += value.byteLength
      if (bytes > maxBytes) {
        await reader.cancel().catch(() => {})
        throw new ResponseLimitError()
      }

      text += decoder.decode(value, { stream: true })
    }

    text += decoder.decode()
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    return text
  } finally {
    signal?.removeEventListener('abort', onAbort)
    reader.releaseLock()
  }
}
