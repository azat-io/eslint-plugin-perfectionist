import type { Options as SortUnionTypesOptions } from '../sort-union-types/types'

export type Options = (Partial<{
  /**
   * When true, skips sorting intersection members that contain callable types
   * (function types, constructor types, or objects with call/method signatures)
   * to preserve TypeScript's overload resolution order.
   */
  ignoreCallableTypes: boolean
}> &
  SortUnionTypesOptions[number])[]
