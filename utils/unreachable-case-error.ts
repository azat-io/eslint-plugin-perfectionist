/**
 * Error class for exhaustive type checking in switch statements and
 * conditionals.
 *
 * Ensures at compile-time that all possible cases of a union type are handled.
 * When TypeScript's type system proves all cases are covered, the variable in
 * the default case has type `never`, making this error theoretically
 * unreachable in correctly typed code.
 *
 * This pattern is crucial for maintaining type safety when adding new options
 * to existing types - TypeScript will error if a new case isn't handled.
 *
 * @example
 *
 * ```ts
 * // Exhaustive handling of sorting types
 * function getSortingAlgorithm(
 *   type: 'alphabetical' | 'natural' | 'custom',
 * ) {
 *   switch (type) {
 *     case 'alphabetical':
 *       return alphabeticalSort
 *     case 'natural':
 *       return naturalSort
 *     case 'custom':
 *       return customSort
 *     default:
 *       throw new UnreachableCaseError(type)
 *     // TypeScript ensures 'type' is 'never' here
 *   }
 * }
 * ```
 */
export class UnreachableCaseError extends Error {
  /**
   * Creates an error indicating that an supposedly unreachable case was
   * reached.
   *
   * @param value - The value that should have type `never` if all cases are
   *   handled. In practice, this will contain the unhandled case value.
   */
  public constructor(value: never) {
    super(`Unreachable case: ${value as string}`)
    this.name = 'UnreachableCaseError'
  }
}
