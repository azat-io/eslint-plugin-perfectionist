interface ParsedPath {
  root: string
  base: string
  name: string
  dir: string
  ext: string
}

export let delimiter = ':'

let separator = '/'

/**
 * Resolves segments into an absolute path, with `/` as the working directory.
 *
 * @param segments - Path segments, applied from right to left.
 * @returns Absolute path without a trailing slash.
 */
export function resolve(...segments: string[]): string {
  let resolved = ''
  for (
    let index = segments.length - 1;
    index >= 0 && !isAbsolute(resolved);
    index--
  ) {
    let segment = segments[index]
    if (segment) {
      resolved = resolved ? `${segment}${separator}${resolved}` : segment
    }
  }
  let normalized = normalize(
    isAbsolute(resolved) ? resolved : separator + resolved,
  )
  return normalized.length > 1 && normalized.endsWith(separator) ?
      normalized.slice(0, -1)
    : normalized
}

/**
 * Returns the relative path from one location to another.
 *
 * @param from - Start path.
 * @param to - Target path.
 * @returns Relative path.
 */
export function relative(from: string, to: string): string {
  let fromParts = resolve(from).split(separator).filter(Boolean)
  let toParts = resolve(to).split(separator).filter(Boolean)
  let common = 0
  while (
    common < fromParts.length &&
    common < toParts.length &&
    fromParts[common] === toParts[common]
  ) {
    common++
  }
  return [
    ...Array.from({ length: fromParts.length - common }, () => '..'),
    ...toParts.slice(common),
  ].join(separator)
}

/**
 * Normalizes a POSIX path: collapses separators and resolves `.` and `..`.
 *
 * @param filePath - Path to normalize.
 * @returns Normalized path.
 */
export function normalize(filePath: string): string {
  let absolute = isAbsolute(filePath)
  let trailingSlash = filePath.endsWith(separator)
  let normalized = normalizeSegments(filePath.split(separator), !absolute).join(
    separator,
  )
  if (!normalized && !absolute) {
    normalized = '.'
  }
  if (normalized && trailingSlash) {
    normalized += separator
  }
  return (absolute ? separator : '') + normalized
}

/**
 * Splits a path into root, directory, base name, name and extension.
 *
 * @param filePath - Path to parse.
 * @returns Path parts.
 */
export function parse(filePath: string): ParsedPath {
  let base = basename(filePath)
  let extension = extname(filePath)
  return {
    name: base.slice(0, base.length - extension.length),
    root: isAbsolute(filePath) ? separator : '',
    dir: dirname(filePath),
    ext: extension,
    base,
  }
}

/**
 * Returns the last segment, optionally without an extension.
 *
 * @param filePath - Path whose last segment is returned.
 * @param extension - Extension to strip.
 * @returns Base name.
 */
export function basename(filePath: string, extension?: string): string {
  let trimmed = filePath.replace(/\/+$/u, '')
  let base = trimmed.slice(trimmed.lastIndexOf(separator) + 1)
  return extension && base.endsWith(extension) ?
      base.slice(0, -extension.length)
    : base
}

/**
 * Returns the directory part of a path.
 *
 * @param filePath - Path whose last segment is dropped.
 * @returns Directory, `/` for root entries or `.` for bare names.
 */
export function dirname(filePath: string): string {
  let trimmed = filePath.replace(/\/+$/u, '')
  let index = trimmed.lastIndexOf(separator)
  if (index === -1) {
    return '.'
  }
  return index === 0 ? separator : trimmed.slice(0, index)
}

/**
 * Returns the extension of the last segment, including the dot.
 *
 * @param filePath - Path whose file name is inspected.
 * @returns Extension or an empty string.
 */
export function extname(filePath: string): string {
  let base = basename(filePath)
  let index = base.lastIndexOf('.')
  return index <= 0 ? '' : base.slice(index)
}

/**
 * Joins segments with `/` and normalizes the result.
 *
 * @param segments - Segments to join; empty ones are skipped.
 * @returns Joined path.
 */
export function join(...segments: string[]): string {
  let joined = segments.filter(Boolean).join(separator)
  return joined ? normalize(joined) : '.'
}

/**
 * Checks whether a path starts at the root.
 *
 * @param filePath - Path to check for a leading slash.
 * @returns Whether the path is absolute.
 */
export function isAbsolute(filePath: string): boolean {
  return filePath.startsWith(separator)
}

/**
 * Keeps the path as is. Namespaced paths exist only on Windows.
 *
 * @param filePath - POSIX path, returned unchanged.
 * @returns The same path.
 */
export function toNamespacedPath(filePath: string): string {
  return filePath
}

function normalizeSegments(
  segments: string[],
  allowAboveRoot: boolean,
): string[] {
  let result: string[] = []
  for (let segment of segments) {
    if (!segment || segment === '.') {
      continue
    }
    if (segment === '..') {
      if (result.length > 0 && result.at(-1) !== '..') {
        result.pop()
      } else if (allowAboveRoot) {
        result.push('..')
      }
      continue
    }
    result.push(segment)
  }
  return result
}

let path = {
  toNamespacedPath,
  sep: separator,
  isAbsolute,
  delimiter,
  normalize,
  basename,
  relative,
  dirname,
  extname,
  resolve,
  parse,
  join,
}

export { separator as sep }

export let posix = path

export default { ...path, posix }
