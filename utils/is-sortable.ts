/**
 * Checks if a node is sortable (i.e., an array with more than one element).
 *
 * @param node - The node to check.
 * @returns True if the node is sortable, false otherwise.
 */
export function isSortable(node: unknown): node is unknown[] {
  return Array.isArray(node) && node.length > 1
}
