import type { TSESTree } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { OverloadSignatureGroup } from '../../utils/overload-signature/overload-signature-group'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { isSortable } from '../../utils/is-sortable'

type Method = TSESTree.TSAbstractMethodDefinition | TSESTree.MethodDefinition

/**
 * Returns a list of groups of overload signatures.
 *
 * @param classElements - The class elements to process.
 * @returns A list of overload signature groups.
 */
export function computeOverloadSignatureGroups(
  classElements: TSESTree.ClassElement[],
): OverloadSignatureGroup<Method>[] {
  let methods = classElements
    .filter(
      classElement =>
        classElement.type === AST_NODE_TYPES.MethodDefinition ||
        classElement.type === AST_NODE_TYPES.TSAbstractMethodDefinition,
    )
    .filter(classElement => classElement.kind === 'method')

  let staticOverloadSignaturesByName = new Map<string, Method[]>()
  let overloadSignaturesByName = new Map<string, Method[]>()

  for (let method of methods) {
    if (method.key.type !== AST_NODE_TYPES.Identifier) {
      continue
    }

    let { name } = method.key
    let mapToUse = method.static
      ? staticOverloadSignaturesByName
      : overloadSignaturesByName
    let overloadSignaturesArray = mapToUse.get(name)

    if (!overloadSignaturesArray) {
      overloadSignaturesArray = []
      mapToUse.set(name, overloadSignaturesArray)
    }
    overloadSignaturesArray.push(method)
  }

  /* Ignore groups that only have one method. */
  return [
    ...overloadSignaturesByName.values(),
    ...staticOverloadSignaturesByName.values(),
  ]
    .filter(isSortable)
    .map(buildOverloadSignatureGroup)
}

function buildOverloadSignatureGroup(
  methods: Method[],
): OverloadSignatureGroup<Method> {
  let implementation = methods.find(isMethodImplementation) ?? methods.at(-1)!

  let overloadSignatures = methods.filter(
    method => !isMethodImplementation(method),
  )

  return new OverloadSignatureGroup({
    overloadSignatures,
    implementation,
  })

  function isMethodImplementation(method: Method): boolean {
    switch (method.value.type) {
      case AST_NODE_TYPES.TSEmptyBodyFunctionExpression:
        return false
      case AST_NODE_TYPES.FunctionExpression:
        return true
      /* v8 ignore next 2 -- @preserve Exhaustive guard. */
      default:
        throw new UnreachableCaseError(method.value)
    }
  }
}
