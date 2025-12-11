import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type {
  ObjectTypeParentForDeclarationComment,
  ObjectTypeParentForDeclarationMatch,
  Options,
} from './types'

import { filterOptionsByDeclarationCommentMatches } from '../../utils/filter-options-by-declaration-comment-matches'
import { passesDeclarationMatchesPatternFilter } from './passes-declaration-matches-pattern-filter'
import { filterOptionsByAllNamesMatch } from '../../utils/filter-options-by-all-names-match'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { computeNodeName } from './compute-node-name'

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
  parentNodeForDeclarationComments,
  parentNodeForDeclarationMatches,
  sourceCode,
  elements,
  context,
}: {
  parentNodeForDeclarationComments: ObjectTypeParentForDeclarationComment | null
  parentNodeForDeclarationMatches: ObjectTypeParentForDeclarationMatch | null
  context: TSESLint.RuleContext<string, Options>
  elements: TSESTree.TypeElement[]
  sourceCode: TSESLint.SourceCode
}): Options[number] | undefined {
  let filteredContextOptions = filterOptionsByAllNamesMatch({
    nodeNames: elements.map(node => computeNodeName({ sourceCode, node })),
    contextOptions: context.options,
  })
  filteredContextOptions = filterOptionsByDeclarationCommentMatches({
    parentNode: parentNodeForDeclarationComments,
    contextOptions: filteredContextOptions,
    sourceCode,
  })

  return filteredContextOptions.find(options => {
    if (!options.useConfigurationIf) {
      return true
    }

    return (
      passesDeclarationMatchesPatternFilter({
        declarationMatchesPattern:
          options.useConfigurationIf.declarationMatchesPattern,
        parentNode: parentNodeForDeclarationMatches,
        sourceCode,
      }) &&
      passesHasNumericKeysOnlyFilter({
        hasNumericKeysOnlyFilter: options.useConfigurationIf.hasNumericKeysOnly,
        typeElements: elements,
      })
    )
  })
}

function passesHasNumericKeysOnlyFilter({
  hasNumericKeysOnlyFilter,
  typeElements,
}: {
  hasNumericKeysOnlyFilter: undefined | boolean
  typeElements: TSESTree.TypeElement[]
}): boolean {
  let hasOnlyNumericKeys = hasNumericKeysOnly()
  switch (hasNumericKeysOnlyFilter) {
    case undefined:
      return true
    case false:
      return !hasOnlyNumericKeys
    case true:
      return hasOnlyNumericKeys
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(hasNumericKeysOnlyFilter)
  }

  function hasNumericKeysOnly(): boolean {
    return typeElements.every(isNumericKey)

    function isNumericKey(typeElement: TSESTree.TypeElement): boolean {
      return (
        typeElement.type === AST_NODE_TYPES.TSPropertySignature &&
        typeElement.key.type === AST_NODE_TYPES.Literal &&
        typeof typeElement.key.value === 'number'
      )
    }
  }
}
