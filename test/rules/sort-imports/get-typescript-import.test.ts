import type { Mock } from 'vitest'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as ts from 'typescript'

import type { getTypescriptImport as testedFunction } from '../../../rules/sort-imports/get-typescript-import'

let mockCreateRequire: Mock<() => typeof ts> = vi.fn()

vi.mock('node:module', _ => ({
  createRequire: () => () => mockCreateRequire(),
}))

describe('getTypescriptImport', () => {
  let getTypescriptImport: typeof testedFunction

  beforeEach(async () => {
    ;({ getTypescriptImport } = await import(
      '../../../rules/sort-imports/get-typescript-import'
    ))
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns null when typescript is not present', () => {
    mockCreateRequire.mockImplementation(() => {
      throw new Error('Cannot find module')
    })

    let result = getTypescriptImport()

    expect(result).toBeNull()
  })

  it('tries loading typescript once if typescript does not exist', () => {
    mockCreateRequire.mockImplementation(() => {
      throw new Error('Cannot find module')
    })

    getTypescriptImport()
    let result = getTypescriptImport()

    expect(result).toBeNull()
    expect(mockCreateRequire).toHaveBeenCalledOnce()
  })

  it('loads typescript once if typescript exists', () => {
    mockCreateRequire.mockReturnValue(ts)

    getTypescriptImport()
    let result = getTypescriptImport()

    expect(result).toEqual(ts)
    expect(mockCreateRequire).toHaveBeenCalledOnce()
  })
})
