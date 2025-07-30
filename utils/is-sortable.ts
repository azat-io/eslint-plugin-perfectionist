export function isSortable(node: unknown): node is unknown[] {
  return Array.isArray(node) && node.length > 1
}
