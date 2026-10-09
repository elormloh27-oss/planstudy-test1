import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Guards the live outage of 2026-10-09: the proxy referenced a retired
// Gemini model, so every AI action 500d. This fails locally instead.
describe('api model guard', () => {
  it('references no retired Gemini model', () => {
    const src = readFileSync(resolve('api/generate.ts'), 'utf8')
    expect(src).not.toMatch(/gemini-2\.0-flash-lite/)
    expect(src).toContain('gemini-3.5-flash-lite')
  })
}) 
