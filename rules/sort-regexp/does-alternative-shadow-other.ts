/**
 * Detects whether one alternative shadows (is a prefix of) another.
 *
 * @param first - First alternative text.
 * @param second - Second alternative text.
 * @returns True when either alternative makes the other unreachable.
 */
export function doesAlternativeShadowOther(
  first: string,
  second: string,
): boolean {
  if (first.length === 0 || second.length === 0) {
    return true
  }

  if (first.length === second.length) {
    return first === second
  }

  if (first.length < second.length) {
    return second.startsWith(first)
  }

  return first.startsWith(second)
}
