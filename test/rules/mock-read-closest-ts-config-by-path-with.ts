import { createModuleResolutionCache, type CompilerOptions } from 'typescript'
import { vi } from 'vitest'

import * as readClosestTsConfigUtilities from '../../utils/tsconfig/read-closest-ts-config-by-path'

export function mockReadClosestTsConfigByPathWith(
  compilerOptions: CompilerOptions,
): void {
  vi.spyOn(
    readClosestTsConfigUtilities,
    'readClosestTsConfigByPath',
  ).mockReturnValue({
    cache: createModuleResolutionCache(
      '.',
      filename => filename,
      compilerOptions,
    ),
    compilerOptions,
  })
}
