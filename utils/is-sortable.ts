export let isSortable = (node: unknown): node is unknown[] =>
  Array.isArray(node) && node.length > 1
