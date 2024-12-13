export type JoinWithDash<T extends string[]> = T extends [
  infer First extends string,
  ...infer Rest extends string[],
]
  ? Rest extends []
    ? `${First}`
    : `${WithDashSuffixOrEmpty<First>}${JoinWithDash<Rest>}`
  : never

type WithDashSuffixOrEmpty<T extends string> = `${T}-` | ''
