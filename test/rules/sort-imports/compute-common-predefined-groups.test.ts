import type { Mock } from 'vitest'
import type ts from 'typescript'

import { describe, expect, it, vi } from 'vitest'
import { builtinModules } from 'node:module'

import type { ReadClosestTsConfigByPathValue } from '../../../rules/sort-imports/read-closest-ts-config-by-path'

import { computeCommonPredefinedGroups } from '../../../rules/sort-imports/compute-common-predefined-groups'

let mockGetTypescriptImport: Mock<() => typeof ts> = vi.fn()

vi.mock('../../../rules/sort-imports/get-typescript-import', () => ({
  getTypescriptImport: () => mockGetTypescriptImport(),
}))

describe('compute-common-predefined-groups', () => {
  describe('`index` group', () => {
    it.each([
      './index.d.js',
      './index.d.ts',
      './index.js',
      './index.ts',
      './index',
      './',
      '.',
    ])("should match with '%s'", name => {
      expect(
        computeCommonPredefinedGroups(buildParameters({ name })),
      ).toContain('index')
    })
  })

  describe('`sibling` group', () => {
    it.each([
      './foo.js',
      './foo.ts',
      './foo',
      './foo/index.js',
      './foo/index.ts',
      './foo/index',
    ])("should match with '%s'", name => {
      expect(
        computeCommonPredefinedGroups(buildParameters({ name })),
      ).toContain('sibling')
    })
  })

  describe('`parent` group', () => {
    it.each([
      '../foo.js',
      '../foo.ts',
      '../foo',
      '../foo/index.js',
      '../foo/index.ts',
      '../foo/index',
    ])("should match with '%s'", name => {
      expect(
        computeCommonPredefinedGroups(buildParameters({ name })),
      ).toContain('parent')
    })
  })

  describe('`builtin` group', () => {
    describe('node builtin modules', () => {
      it.each([
        ...builtinModules,
        ...builtinModules.map(name => `node:${name}`),
        'node:sqlite',
        'node:test',
        'node:sea',
      ])("should match with '%s'", name => {
        expect(
          computeCommonPredefinedGroups(buildParameters({ name })),
        ).toContain('builtin')
      })
    })

    describe('bun environment', () => {
      it.each([
        'bun',
        'bun:ffi',
        'bun:jsc',
        'bun:sqlite',
        'bun:test',
        'bun:wrap',
        'detect-libc',
        'undici',
        'ws',
      ])("should match with '%s'", name => {
        expect(
          computeCommonPredefinedGroups(
            buildParameters({ environment: 'bun', name }),
          ),
        ).toContain('builtin')
      })
    })
  })

  describe('`internal` group', () => {
    it.each([
      { internalPattern: ['internal'], name: 'internal' },
      { internalPattern: ['foo', 'internal'], name: 'internalName' },
    ])(
      "should match through `internalPattern` with '%s'",
      ({ internalPattern, name }) => {
        expect(
          computeCommonPredefinedGroups(
            buildParameters({ internalPattern, name }),
          ),
        ).toContain('internal')
      },
    )

    it('should match with typescript if the import is resolved as internal', () => {
      mockGetTypescriptImportReturnValue({
        resolveModuleName: { isExternalLibraryImport: false },
        isExternalModuleNameRelative: false,
      })

      expect(
        computeCommonPredefinedGroups(
          buildParameters({ withTsConfigOutput: true, name: 'foo' }),
        ),
      ).toContain('internal')
    })
  })

  describe('`external` group', () => {
    it('should match without typescript if the import does not start with . nor /', () => {
      expect(
        computeCommonPredefinedGroups(
          buildParameters({ name: 'somethingExternal' }),
        ),
      ).toContain('external')
    })

    it('should match with typescript if no tsconfig is entered', () => {
      mockGetTypescriptImportReturnValue({
        isExternalModuleNameRelative: false,
      })

      expect(
        computeCommonPredefinedGroups(buildParameters({ name: 'foo' })),
      ).toContain('external')
    })

    it("should match with typescript if the import can't be resolved", () => {
      mockGetTypescriptImportReturnValue({
        isExternalModuleNameRelative: false,
      })

      expect(
        computeCommonPredefinedGroups(
          buildParameters({ withTsConfigOutput: true, name: 'foo' }),
        ),
      ).toContain('external')
    })

    it('should match with typescript if the import is resolved as external', () => {
      mockGetTypescriptImportReturnValue({
        resolveModuleName: { isExternalLibraryImport: true },
        isExternalModuleNameRelative: false,
      })

      expect(
        computeCommonPredefinedGroups(
          buildParameters({ withTsConfigOutput: true, name: 'foo' }),
        ),
      ).toContain('external')
    })
  })

  describe('no match', () => {
    it.each(['.foo', '/foo'])(
      "should not match anything without typescript with '%s'",
      name => {
        expect(
          computeCommonPredefinedGroups(buildParameters({ name })),
        ).toEqual([])
      },
    )

    it('should not match anything if the import is detected by typescript as a relative import', () => {
      mockGetTypescriptImportReturnValue({
        isExternalModuleNameRelative: true,
      })

      expect(
        computeCommonPredefinedGroups(buildParameters({ name: 'foo' })),
      ).toEqual([])
    })
  })

  let buildParameters = ({
    withTsConfigOutput,
    internalPattern,
    environment,
    name,
  }: {
    withTsConfigOutput?: boolean
    environment?: 'node' | 'bun'
    internalPattern?: string[]
    name: string
  }): Parameters<typeof computeCommonPredefinedGroups>[0] => ({
    tsConfigOutput: withTsConfigOutput
      ? ({ compilerOptions: {} } as ReadClosestTsConfigByPathValue)
      : null,
    options: {
      internalPattern: internalPattern ?? [],
      environment: environment ?? 'node',
    },
    filename: '',
    name,
  })

  let mockGetTypescriptImportReturnValue = ({
    isExternalModuleNameRelative,
    resolveModuleName,
  }: {
    resolveModuleName?: { isExternalLibraryImport: boolean }
    isExternalModuleNameRelative: boolean
  }): void => {
    mockGetTypescriptImport.mockReturnValueOnce({
      resolveModuleName: () => ({
        resolvedModule: {
          isExternalLibraryImport:
            resolveModuleName?.isExternalLibraryImport ?? null,
        },
      }),
      isExternalModuleNameRelative: () => isExternalModuleNameRelative,
    } as unknown as typeof ts)
  }
})
