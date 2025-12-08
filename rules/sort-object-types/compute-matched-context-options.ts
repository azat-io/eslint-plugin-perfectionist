import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Options } from './types'

import { filterOptionsByDeclarationCommentMatches } from '../../utils/filter-options-by-declaration-comment-matches'
import { filterOptionsByAllNamesMatch } from '../../utils/filter-options-by-all-names-match'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { computeNodeName } from './compute-node-name'
import { matches } from '../../utils/matches'

/**
 * Computes the matched context options for the given nodes.
 *
 * @param params - The parameters.
 * @param params.sourceCode - The source code object.
 * @param params.parentNode - The parent node of the type elements.
 * @param params.elements - The type elements.
 * @param params.context - The rule context.
 * @returns The matched context options, or undefined if none match.
 */
export function computeMatchedContextOptions({
  sourceCode,
  parentNode,
  elements,
  context,
}: {
  parentNode:
    | TSESTree.TSTypeAliasDeclaration
    | TSESTree.TSInterfaceDeclaration
    | TSESTree.TSPropertySignature
    | null
  context: TSESLint.RuleContext<string, Options>
  elements: TSESTree.TypeElement[]
  sourceCode: TSESLint.SourceCode
}): Options[number] | undefined {
  let filteredContextOptions = filterOptionsByAllNamesMatch({
    nodeNames: elements.map(node => computeNodeName({ sourceCode, node })),
    contextOptions: context.options,
  })
  filteredContextOptions = filterOptionsByDeclarationCommentMatches({
    contextOptions: filteredContextOptions,
    parentNode,
    sourceCode,
  })

  return filteredContextOptions.find(options => {
    if (!options.useConfigurationIf) {
      return true
    }

    if (options.useConfigurationIf.declarationMatchesPattern) {
      if (!parentNode) {
        return false
      }

      let matchesPattern = matches(
        computeNodeParentName(parentNode, sourceCode),
        options.useConfigurationIf.declarationMatchesPattern,
      )
      if (!matchesPattern) {
        return false
      }
    }

    if (
      options.useConfigurationIf.hasNumericKeysOnly &&
      !hasNumericKeysOnly(elements)
    ) {
      return false
    }

    return true
  })
}

function computeNodeParentName(
  node:
    | TSESTree.TSTypeAliasDeclaration
    | TSESTree.TSInterfaceDeclaration
    | TSESTree.TSPropertySignature,
  sourceCode: TSESLint.SourceCode,
): string {
  switch (node.type) {
    case AST_NODE_TYPES.TSTypeAliasDeclaration:
    case AST_NODE_TYPES.TSInterfaceDeclaration:
      return node.id.name
    case AST_NODE_TYPES.TSPropertySignature:
      return computePropertySignatureName(node)
    default:
      throw new UnreachableCaseError(node)
  }

  function computePropertySignatureName(
    propertySignature: TSESTree.TSPropertySignature,
  ): string {
    switch (propertySignature.key.type) {
      case AST_NODE_TYPES.Identifier:
        return propertySignature.key.name
      case AST_NODE_TYPES.Literal:
        return String(propertySignature.key.value)
      default:
        return sourceCode.getText(propertySignature.key)
    }
  }
}

function hasNumericKeysOnly(typeElements: TSESTree.TypeElement[]): boolean {
  return typeElements.every(isNumericKey)

  function isNumericKey(typeElement: TSESTree.TypeElement): boolean {
    return (
      typeElement.type === AST_NODE_TYPES.TSPropertySignature &&
      typeElement.key.type === AST_NODE_TYPES.Literal &&
      typeof typeElement.key.value === 'number'
    )
  }
}
