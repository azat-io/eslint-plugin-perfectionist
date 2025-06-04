export class UnreachableCaseError extends Error {
  public constructor(value: never) {
    super(`Unreachable case: ${value as string}`)
    this.name = 'UnreachableCaseError'
  }
}
