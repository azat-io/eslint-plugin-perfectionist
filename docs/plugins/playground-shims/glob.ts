/**
 * Keeps the path as is.
 *
 * @param filePath - Path used as a literal pattern.
 * @returns The same path.
 */
export function convertPathToPattern(filePath: string): string {
  return filePath
}

/**
 * Keeps the path as is.
 *
 * @param filePath - Path with no glob characters to escape.
 * @returns The same path.
 */
export function escapePath(filePath: string): string {
  return filePath
}

/**
 * Finds no files.
 *
 * @returns An empty list.
 */
export function glob(): Promise<string[]> {
  return Promise.resolve([])
}

/**
 * Treats every pattern as static.
 *
 * @returns Always `false`.
 */
export function isDynamicPattern(): boolean {
  return false
}

/**
 * Finds no files. The TypeScript parser globs only for project configs, which
 * the playground never passes.
 *
 * @returns An empty list of matches.
 */
export function globSync(): string[] {
  return []
}
