import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

function declarations(block: string): Record<string, string> {
  const values: Record<string, string> = {}

  for (const match of block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi)) {
    values[match[1]] = match[2].trim().toLowerCase()
  }

  return values
}

const darkStart = css.indexOf(":root[data-theme='dark']")
const lightTokens = declarations(css.slice(0, darkStart))
const darkTokens = declarations(css.slice(darkStart))

const sharedColors = {
  bg: '#e7dcc9',
  surface: '#fbf8f1',
  'surface-2': '#f3ebdd',
  ink: '#1e1c17',
  muted: '#756f63',
  line: '#d2c6b2',
  'line-strong': '#c4b69f',
  accent: '#2f5d8a',
  'accent-fg': '#faf7ef',
  'accent-soft': '#dce7f0',
  desk: '#22302a',
  c1: '#3e7cb1',
  c2: '#6e8b5e',
  c3: '#b8862e',
  c4: '#c15b4a',
  c5: '#8a6fae',
  c6: '#3c8c84',
}

const darkColors = {
  bg: '#12100e',
  surface: '#1d1a16',
  'surface-2': '#26221d',
  ink: '#f4eee3',
  muted: '#c8c0b2',
  line: '#5c554b',
  'line-strong': '#7a7062',
  accent: '#9cc5e8',
  'accent-fg': '#12100e',
  'accent-soft': '#26333d',
  desk: '#2c2a24',
  c1: '#8fb8e0',
  c2: '#b3c58f',
  c3: '#e3bc6e',
  c4: '#e58f7b',
  c5: '#c6a6de',
  c6: '#86c9c0',
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
  const linear = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('design tokens', () => {
  it('matches the light token values in DESIGN.md', () => {
    for (const [name, value] of Object.entries(sharedColors)) {
      expect(lightTokens[name], name).toBe(value)
    }
  })

  it('matches the dark token values in DESIGN.md', () => {
    for (const [name, value] of Object.entries(darkColors)) {
      expect(darkTokens[name], name).toBe(value)
    }
  })

  it('meets the dark contrast targets', () => {
    expect(contrastRatio(darkTokens.ink, darkTokens.surface)).toBeGreaterThanOrEqual(7)
    expect(contrastRatio(darkTokens.ink, darkTokens['surface-2'])).toBeGreaterThanOrEqual(7)
    expect(contrastRatio(darkTokens.muted, darkTokens.surface)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(darkTokens.muted, darkTokens['surface-2'])).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(darkTokens.accent, darkTokens.surface)).toBeGreaterThanOrEqual(3)
    expect(contrastRatio(darkTokens['line-strong'], darkTokens.surface)).toBeGreaterThanOrEqual(3)
    expect(
      contrastRatio(darkTokens['line-strong'], darkTokens['surface-2']),
    ).toBeGreaterThanOrEqual(3)
  })

  it('keeps the specified chunk mixes and dark kana size', () => {
    expect(lightTokens['tint-pct']).toBe('20%')
    expect(lightTokens['sel-pct']).toBe('34%')
    expect(darkTokens['tint-pct']).toBe('18%')
    expect(darkTokens['sel-pct']).toBe('26%')
    expect(darkTokens['fs-kana']).toBe('15px')
  })
})
