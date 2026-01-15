import type { TSESTree } from '@typescript-eslint/utils'

import type { SortingNode } from '../../types/sorting-node'

export type SortingNodeWithOverloadSignatureImplementation<
  T extends TSESTree.Node,
> = OverloadSignatureImplementation<T> & SortingNode

export interface OverloadSignatureImplementation<T extends TSESTree.Node> {
  overloadSignatureImplementation: null | T
}

/** Represents a group of overload signatures along with their implementation. */
export class OverloadSignatureGroup<T extends TSESTree.Node> {
  public readonly implementation: T
  private readonly _overloadSignatures: Set<T>

  public constructor({
    overloadSignatures,
    implementation,
  }: {
    overloadSignatures: T[]
    implementation: T
  }) {
    this._overloadSignatures = new Set(overloadSignatures)
    this.implementation = implementation
  }

  public doesNodeBelongToGroup(node: TSESTree.Node): boolean {
    return (
      this._overloadSignatures.has(node as T) || this.implementation === node
    )
  }
}
