export type Join<T extends string[], Separator extends string> = T extends [
  infer First extends string,
  ...infer Rest extends string[],
]
  ? Rest extends []
    ? `${First}`
    : `${WithSeparatorOrEmpty<First, Separator>}${Join<Rest, Separator>}`
  : never

type WithSeparatorOrEmpty<T extends string, Separator extends string> =
  | `${T}${Separator}`
  | ''
