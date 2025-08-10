/**
 * Joins an array of strings with a specified separator.
 *
 * @template T - The array of strings to join.
 * @template Separator - The separator to use between joined strings.
 */
export type Join<T extends string[], Separator extends string> = T extends [
  infer First extends string,
  ...infer Rest extends string[],
]
  ? Rest extends []
    ? `${First}`
    : `${WithSeparatorOrEmpty<First, Separator>}${Join<Rest, Separator>}`
  : never

/** Helper type to conditionally add a separator between strings. */
type WithSeparatorOrEmpty<T extends string, Separator extends string> =
  | `${T}${Separator}`
  | ''
