import type { ReadClosestTsConfigByPathValue } from './read-closest-ts-config-by-path'

let regexByTsconfigPathCache = new Map<string, RegExp>()

export let matchesTsconfigPaths = ({
  tsConfigOutput,
  name,
}: {
  tsConfigOutput: ReadClosestTsConfigByPathValue
  name: string
}): boolean => {
  if (!tsConfigOutput.compilerOptions.paths) {
    return false
  }

  return Object.keys(tsConfigOutput.compilerOptions.paths).some(key =>
    getRegexByTsconfigPath(key).test(name),
  )
}

let getRegexByTsconfigPath = (path: string): RegExp => {
  let existingRegex = regexByTsconfigPathCache.get(path)
  if (existingRegex) {
    return existingRegex
  }
  let regex = new RegExp(`^${escapeRegExp(path).replaceAll('*', '(.+)')}$`)
  regexByTsconfigPathCache.set(path, regex)
  return regex
}

let escapeRegExp = (value: string): string =>
  value.replaceAll(/[$+.?[\\\]]/gu, String.raw`\$&`)
