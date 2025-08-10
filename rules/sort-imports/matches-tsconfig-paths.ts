import type { ReadClosestTsConfigByPathValue } from './read-closest-ts-config-by-path'

/**
 * Cache for compiled regex patterns from tsconfig paths. Avoids recompiling the
 * same path patterns repeatedly.
 */
let regexByTsconfigPathCache = new Map<string, RegExp>()

/**
 * Checks if an import matches any of the path mappings in tsconfig.json.
 *
 * Path mappings allow custom module resolution (e.g., '@/_' → './src/_'). This
 * function determines if an import uses such a mapped path.
 *
 * @param options - Configuration options.
 * @param options.tsConfigOutput - Parsed TypeScript configuration with path
 *   mappings.
 * @param options.name - Import module specifier to check.
 * @returns True if the import matches a tsconfig path mapping.
 */
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

/**
 * Converts a tsconfig path pattern into a regular expression.
 *
 * Handles wildcard patterns (e.g., '@/*' becomes regex that matches
 * '@/anything'). Results are cached to avoid recompiling the same patterns.
 *
 * @param path - TSConfig path pattern with wildcards.
 * @returns Compiled regex for matching imports.
 */
function getRegexByTsconfigPath(path: string): RegExp {
  let existingRegex = regexByTsconfigPathCache.get(path)
  if (existingRegex) {
    return existingRegex
  }
  let regex = new RegExp(`^${escapeRegExp(path).replaceAll('*', '(.+)')}$`)
  regexByTsconfigPathCache.set(path, regex)
  return regex
}

/**
 * Escapes special regex characters in a string.
 *
 * @param value - String to escape for use in regex.
 * @returns Escaped string safe for regex construction.
 */
function escapeRegExp(value: string): string {
  return value.replaceAll(/[$+.?[\\\]]/gu, String.raw`\$&`)
}
