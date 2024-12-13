export type Join<T extends string[]> = T extends [
  infer First extends string,
  ...infer Rest extends string[],
]
  ? `${First}${Join<Rest>}`
  : ''
