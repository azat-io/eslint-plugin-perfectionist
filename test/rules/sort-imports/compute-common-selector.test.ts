import type { Mock } from 'vitest'
import type ts from 'typescript'

import { describe, expect, it, vi } from 'vitest'
import { builtinModules } from 'node:module'

import type { ReadClosestTsConfigByPathValue } from '../../../rules/sort-imports/read-closest-ts-config-by-path'

import { computeCommonSelectors } from '../../../rules/sort-imports/compute-common-selectors'

let mockGetTypescriptImport: Mock<() => typeof ts> = vi.fn()

vi.mock('../../../rules/sort-imports/get-typescript-import', () => ({
  getTypescriptImport: () => mockGetTypescriptImport(),
}))

describe('compute-common-selector', () => {
  describe('`index` selector', () => {
    it.each([
      './index.d.js',
      './index.d.ts',
      './index.js',
      './index.ts',
      './index',
      './',
      '.',
    ])("should match with '%s'", name => {
      expect(computeCommonSelectors(buildParameters({ name }))).toContain(
        'index',
      )
    })
  })

  describe('`sibling` selector', () => {
    it.each([
      './foo.js',
      './foo.ts',
      './foo',
      './foo/index.js',
      './foo/index.ts',
      './foo/index',
    ])("should match with '%s'", name => {
      expect(computeCommonSelectors(buildParameters({ name }))).toContain(
        'sibling',
      )
    })
  })

  describe('`parent` selector', () => {
    it.each([
      '../foo.js',
      '../foo.ts',
      '../foo',
      '../foo/index.js',
      '../foo/index.ts',
      '../foo/index',
    ])("should match with '%s'", name => {
      expect(computeCommonSelectors(buildParameters({ name }))).toContain(
        'parent',
      )
    })
  })

  describe('`subpath` selector', () => {
    it.each(['#', '#a', '#node:sqlite'])("should match with '%s'", name => {
      expect(computeCommonSelectors(buildParameters({ name }))).toContain(
        'subpath',
      )
    })
  })

  describe('`builtin` selector', () => {
    describe('node builtin modules', () => {
      it.each([
        ...builtinModules,
        ...builtinModules.map(name => `node:${name}`),
        'node:sqlite',
        'node:test',
        'node:sea',
      ])("should match with '%s'", name => {
        expect(computeCommonSelectors(buildParameters({ name }))).toContain(
          'builtin',
        )
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
          computeCommonSelectors(buildParameters({ environment: 'bun', name })),
        ).toContain('builtin')
      })
    })
  })

  describe('`internal` selector', () => {
    it.each([
      { internalPattern: ['internal'], name: 'internal' },
      { internalPattern: ['foo', 'internal'], name: 'internalName' },
    ])(
      "should match through `internalPattern` with '%s'",
      ({ internalPattern, name }) => {
        expect(
          computeCommonSelectors(buildParameters({ internalPattern, name })),
        ).toContain('internal')
      },
    )

    it('should match with typescript if the import is resolved as internal', () => {
      mockGetTypescriptImportReturnValue({
        resolveModuleName: { isExternalLibraryImport: false },
        isExternalModuleNameRelative: false,
      })

      expect(
        computeCommonSelectors(
          buildParameters({ withTsConfigOutput: true, name: 'foo' }),
        ),
      ).toContain('internal')
    })
  })

  describe('`external` selector', () => {
    it('should match without typescript if the import does not start with . nor /', () => {
      expect(
        computeCommonSelectors(buildParameters({ name: 'somethingExternal' })),
      ).toContain('external')
    })

    it('should match with typescript if no tsconfig is entered', () => {
      mockGetTypescriptImportReturnValue({
        isExternalModuleNameRelative: false,
      })

      expect(
        computeCommonSelectors(buildParameters({ name: 'foo' })),
      ).toContain('external')
    })

    it("should match with typescript if the import can't be resolved", () => {
      mockGetTypescriptImportReturnValue({
        isExternalModuleNameRelative: false,
      })

      expect(
        computeCommonSelectors(
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
        computeCommonSelectors(
          buildParameters({ withTsConfigOutput: true, name: 'foo' }),
        ),
      ).toContain('external')
    })
  })

  describe('no match', () => {
    it.each(['.foo', '/foo'])(
      "should not match anything without typescript with '%s'",
      name => {
        expect(computeCommonSelectors(buildParameters({ name }))).toEqual([])
      },
    )

    it('should not match anything if the import is detected by typescript as a relative import', () => {
      mockGetTypescriptImportReturnValue({
        isExternalModuleNameRelative: true,
      })

      expect(computeCommonSelectors(buildParameters({ name: 'foo' }))).toEqual(
        [],
      )
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
  }): Parameters<typeof computeCommonSelectors>[0] => ({
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
