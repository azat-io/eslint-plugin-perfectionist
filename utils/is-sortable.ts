export let isSortable = (node: unknown): boolean =>
  Array.isArray(node) && node.length > 1
