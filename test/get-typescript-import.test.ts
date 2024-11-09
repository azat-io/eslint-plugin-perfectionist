import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as ts from 'typescript'

import type { getTypescriptImport as testedFunction } from '../utils/get-typescript-import'

const mockCreateRequire = vi.fn()
vi.mock('node:module', _ => ({
  createRequire: () => () => mockCreateRequire(),
}))

describe('getTypescriptImport', () => {
  let getTypescriptImport: typeof testedFunction

  beforeEach(async () => {
    ;({ getTypescriptImport } = await import('../utils/get-typescript-import'))
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns null when typescript is not present', () => {
    mockCreateRequire.mockImplementation(() => {
      throw new Error()
    })

    let result = getTypescriptImport()

    expect(result).toBeNull()
  })

  it('tries loading typescript once if typescript does not exist', () => {
    mockCreateRequire.mockImplementation(() => {
      throw new Error()
    })

    getTypescriptImport()
    let result = getTypescriptImport()

    expect(result).toBeNull()
    expect(mockCreateRequire).toHaveBeenCalledTimes(1)
  })

  it('loads typescript once if typescript exists', () => {
    mockCreateRequire.mockReturnValue(ts)

    getTypescriptImport()
    let result = getTypescriptImport()

    expect(result).toEqual(ts)
    expect(mockCreateRequire).toHaveBeenCalledTimes(1)
  })
})
