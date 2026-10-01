/**
 * Throws, as no file can be read in the browser.
 */
export function readFileSync(): never {
  throw new Error('File system is not available in the browser')
}

/**
 * Throws, as no file can be inspected in the browser.
 */
export function statSync(): never {
  throw new Error('File system is not available in the browser')
}

/**
 * Keeps the given path, as there are no symlinks to follow.
 *
 * @param filePath - Path to resolve.
 * @returns The same path.
 */
export function realpathSync(filePath: string): string {
  return filePath
}

/**
 * Reports every path as missing. The plugin reads a tsconfig and the TypeScript
 * parser looks for projects only when options ask for it.
 *
 * @returns Always `false`.
 */
export function existsSync(): boolean {
  return false
}

/**
 * Lists no entries.
 *
 * @returns An empty list.
 */
export function readdirSync(): string[] {
  return []
}

realpathSync.native = realpathSync

export let promises = {}

export default {
  realpathSync,
  readFileSync,
  readdirSync,
  existsSync,
  statSync,
  promises,
}
