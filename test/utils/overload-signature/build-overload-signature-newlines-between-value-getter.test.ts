import type { TSESTree } from '@typescript-eslint/types'

import { describe, expect, it } from 'vitest'

import type { SortingNodeWithOverloadSignatureImplementation } from '../../../utils/overload-signature/overload-signature-group'

import { buildOverloadSignatureNewlinesBetweenValueGetter } from '../../../utils/overload-signature/build-overload-signature-newlines-between-value-getter'

describe('build-overload-signature-newlines-between-value-getter', () => {
  it('should return newlinesBetweenOverloadSignatures when left and right share the same overloadSignatureImplementation', () => {
    let newlinesBetweenOverloadSignatures = 42
    let commonImplementation = buildImplementation()
    let left =
      buildSortingNodeWithOverloadSignatureImplementation(commonImplementation)
    let right =
      buildSortingNodeWithOverloadSignatureImplementation(commonImplementation)
    let overloadSignatureNewlinesBetweenValueGetter =
      buildOverloadSignatureNewlinesBetweenValueGetter(
        newlinesBetweenOverloadSignatures,
      )

    let result = overloadSignatureNewlinesBetweenValueGetter({
      computedNewlinesBetween: 2,
      right,
      left,
    })

    expect(result).toBe(newlinesBetweenOverloadSignatures)
  })

  it.each([
    {
      right: buildSortingNodeWithOverloadSignatureImplementation(
        buildImplementation(),
      ),
      left: buildSortingNodeWithOverloadSignatureImplementation(null),
    },
    {
      right: buildSortingNodeWithOverloadSignatureImplementation(
        buildImplementation(),
      ),
      left: buildSortingNodeWithOverloadSignatureImplementation(
        buildImplementation(),
      ),
    },
  ])(
    'should return computedNewlinesBetween when left and right do not share the same overloadSignatureImplementation',
    ({ right, left }) => {
      let computedNewlinesBetween = 42
      let overloadSignatureNewlinesBetweenValueGetter =
        buildOverloadSignatureNewlinesBetweenValueGetter(2)

      let result = overloadSignatureNewlinesBetweenValueGetter({
        computedNewlinesBetween,
        right,
        left,
      })

      expect(result).toBe(computedNewlinesBetween)
    },
  )

  function buildSortingNodeWithOverloadSignatureImplementation(
    overloadSignatureImplementation: object | null,
  ): SortingNodeWithOverloadSignatureImplementation<TSESTree.Node> {
    return {
      overloadSignatureImplementation,
    } as unknown as SortingNodeWithOverloadSignatureImplementation<TSESTree.Node>
  }

  function buildImplementation(): Record<string, never> {
    return {}
  }
})
