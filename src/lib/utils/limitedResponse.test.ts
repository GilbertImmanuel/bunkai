import { describe, expect, it } from 'vitest'
import { ResponseLimitError, readLimitedText } from './limitedResponse'

describe('readLimitedText', () => {
  it('reads a body under the byte limit', async () => {
    const response = new Response('hello')

    await expect(readLimitedText(response, 100)).resolves.toBe('hello')
  })

  it('rejects a body over the byte limit', async () => {
    const response = new Response('x'.repeat(101))

    await expect(readLimitedText(response, 100)).rejects.toBeInstanceOf(ResponseLimitError)
  })

  it('aborts while the body is still streaming', async () => {
    const response = new Response(
      new ReadableStream({
        start() {
          // Keep the stream open until the signal cancels it.
        },
      }),
    )
    const controller = new AbortController()
    const pending = readLimitedText(response, 100, controller.signal)

    controller.abort()

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })
})
