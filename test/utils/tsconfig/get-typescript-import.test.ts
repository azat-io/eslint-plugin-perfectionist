import type { Mock } from 'vitest'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as ts from 'typescript'

import type { getTypescriptImport as testedFunction } from '../../../utils/tsconfig/get-typescript-import'

let mockCreateRequire: Mock<(moduleId: string) => typeof ts> = vi.fn()

/**
 * A bare mock function does not carry `Require`'s own members.
 */
let mockRequire: unknown = mockCreateRequire

vi.mock(import('node:module'), _ => ({
  createRequire: (_path: string | URL) => mockRequire as NodeJS.Require,
}))

describe('getTypescriptImport', () => {
  let getTypescriptImport: typeof testedFunction

  beforeEach(async () => {
    ;({ getTypescriptImport } =
      await import('../../../utils/tsconfig/get-typescript-import'))
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
    expect(mockCreateRequire).toHaveBeenCalledExactlyOnceWith('typescript')
  })

  it("doesn't load typescript if it exists but is missing at least one required key (Typescript 7)", () => {
    let incompleteTypescript: unknown = {
      isExternalModuleNameRelative: () => {},
      createModuleResolutionCache: () => {},
      parseJsonConfigFileContent: () => {},
      readConfigFile: () => {},
      sys: {},
    }

    mockCreateRequire.mockReturnValue(incompleteTypescript as typeof ts)

    let result = getTypescriptImport()

    expect(result).toBeNull()
  })

  it('loads typescript once if typescript exists and exposes all the necessary keys', () => {
    mockCreateRequire.mockReturnValue(ts)

    getTypescriptImport()
    let result = getTypescriptImport()

    expect(result).toEqual(ts)
    expect(mockCreateRequire).toHaveBeenCalledExactlyOnceWith('typescript')
  })
})
