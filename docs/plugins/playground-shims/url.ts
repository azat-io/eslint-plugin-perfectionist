/**
 * Converts a `file:` URL to a POSIX path.
 *
 * @param url - URL with the `file://` protocol.
 * @returns Path without the protocol.
 */
export function fileURLToPath(url: string | URL): string {
  return String(url).replace(/^file:\/\//u, '')
}

/**
 * Converts a POSIX path to a `file:` URL.
 *
 * @param filePath - Absolute POSIX path to wrap.
 * @returns URL with the `file://` protocol.
 */
export function pathToFileURL(filePath: string): URL {
  return new URL(`file://${filePath}`)
}

export default { fileURLToPath, pathToFileURL }
