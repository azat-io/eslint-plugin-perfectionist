export class UnreachableCaseError extends Error {
  public constructor(value: never) {
    super(
      // eslint-disable-next-line typescript/restrict-template-expressions
      `Unexpected case: ${value}. Please report this issue: https://github.com/azat-io/eslint-plugin-perfectionist/issues`,
    )
    this.name = 'UnreachableCaseError'
  }
}
