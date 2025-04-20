import { describe, expect, it } from 'vitest'

import type { ReadClosestTsConfigByPathValue } from '../../../rules/sort-imports/read-closest-ts-config-by-path'

import { matchesTsconfigPaths } from '../../../rules/sort-imports/matches-tsconfig-paths'

describe('matches-tsconfig-paths', () => {
  it.each([
    { paths: ['foo/*'], name: 'foo/a/b' },
    { paths: ['*/foo'], name: 'a/b/foo' },
    { name: 'a/b/foo/c/d', paths: ['*/foo/*'] },
    { paths: ['$foo/*'], name: '$foo/a/b' },
  ])('should match with (%s)', ({ paths, name }) => {
    expect(
      matchesTsconfigPaths({
        tsConfigOutput: createTsConfig(paths),
        name,
      }),
    ).toBeTruthy()
  })

  it.each([
    { paths: ['foo/*'], name: 'foo/' },
    { paths: ['a/foo'], name: '*/*/foo' },
    { paths: ['foo/a/b'], name: 'foo/*/*' },
  ])('should not match with (%s)', ({ paths, name }) => {
    expect(
      matchesTsconfigPaths({
        tsConfigOutput: createTsConfig(paths),
        name,
      }),
    ).toBeFalsy()
  })

  let createTsConfig = (paths: string[]): ReadClosestTsConfigByPathValue =>
    ({
      compilerOptions: {
        paths: Object.fromEntries(paths.map(path => [path, ['*']])),
      },
    }) as ReadClosestTsConfigByPathValue
})
