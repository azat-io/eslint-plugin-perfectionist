export type Join<T extends string[]> = T extends [
  infer First extends string,
  ...infer Rest extends string[],
]
  ? Rest extends []
    ? `${First}`
    : `${WithDashSuffixOrEmpty<First>}${Join<Rest>}`
  : never

type WithDashSuffixOrEmpty<T extends string> = `${T}-` | ''
