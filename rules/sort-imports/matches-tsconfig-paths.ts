import type { ReadClosestTsConfigByPathValue } from './read-closest-ts-config-by-path'

let regexByTsconfigPathCache = new Map<string, RegExp>()

export function matchesTsconfigPaths({
  tsConfigOutput,
  name,
}: {
  tsConfigOutput: ReadClosestTsConfigByPathValue
  name: string
}): boolean {
  if (!tsConfigOutput.compilerOptions.paths) {
    return false
  }

  return Object.keys(tsConfigOutput.compilerOptions.paths).some(key =>
    getRegexByTsconfigPath(key).test(name),
  )
}

function getRegexByTsconfigPath(path: string): RegExp {
  let existingRegex = regexByTsconfigPathCache.get(path)
  if (existingRegex) {
    return existingRegex
  }
  let regex = new RegExp(`^${escapeRegExp(path).replaceAll('*', '(.+)')}$`)
  regexByTsconfigPathCache.set(path, regex)
  return regex
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[$+.?[\\\]]/gu, String.raw`\$&`)
}
