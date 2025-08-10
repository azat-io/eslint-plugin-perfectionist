/**
 * Iterates through an array calling a callback for each adjacent pair.
 *
 * Processes elements in pairs where:
 *
 * - First call: left is null, right is the first element
 * - Subsequent calls: left and right are adjacent elements.
 *
 * This pattern is particularly useful for comparing adjacent elements in
 * sorting validation, where each element needs to be compared with its
 * predecessor to ensure correct ordering.
 *
 * @example
 *   // Common use case: checking sort order
 *   const numbers = [1, 3, 2, 4]
 *   const errors: string[] = []
 *
 *   pairwise(numbers, (left, right) => {
 *     if (left !== null && left > right) {
 *       errors.push(`${left} should come after ${right}`)
 *     }
 *   })
 *   // errors = ['3 should come after 2']
 *
 * @template T - Type of array elements.
 * @param nodes - Array to iterate through.
 * @param callback - Function called for each pair (including null for first).
 */
export function pairwise<T>(
  nodes: T[],
  callback: (left: null | T, right: T) => void,
): void {
  if (nodes.length === 0) {
    return
  }

  callback(null, nodes.at(0)!)
  for (let i = 1; i < nodes.length; i++) {
    let left = nodes.at(i - 1)
    let right = nodes.at(i)

    callback(left!, right!)
  }
}
