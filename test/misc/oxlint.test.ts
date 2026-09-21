import { describe, expect, it, vi } from 'vitest'

vi.mock(import('@typescript-eslint/utils'), () => {
  throw new Error('The root utility entrypoint requires ESLint')
})

describe('compatibility with Oxlint', () => {
  it('loads the plugin without importing the ESLint-dependent utility entrypoint', async () => {
    let { default: plugin } = await import('../../index')

    expect(plugin.rules?.['sort-objects']?.create).toBeTypeOf('function')
  })
})
