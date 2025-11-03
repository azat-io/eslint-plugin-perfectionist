import type { Alternative } from '@eslint-community/regexpp/ast'
import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../../types/sorting-node'
import type { Selector } from './types'
import type { Options } from './types'

import { doesCustomGroupMatch } from '../../utils/does-custom-group-match'
import { isNodeEslintDisabled } from '../../utils/is-node-eslint-disabled'
import { createPseudoLiteralNode } from './create-pseudo-literal-node'
import { getAlternativeAlias } from './get-alternative-alias'
import { computeGroup } from '../../utils/compute-group'

interface CreateSortingNodeParameters {
  sourceCode: TSESLint.SourceCode
  literalNode: TSESTree.Literal
  eslintDisabledLines: number[]
  alternative: Alternative
  options: ResolvedOptions
}

type ResolvedOptions = Required<Options[0]>

/**
 * Builds a sortable node representation for a regex alternative.
 *
 * @param parameters - Alternative context with rule settings.
 * @returns Sorting node ready for ordering logic.
 */
export function createSortingNode({
  eslintDisabledLines,
  literalNode,
  alternative,
  sourceCode,
  options,
}: CreateSortingNodeParameters): SortingNode<TSESTree.Literal> {
  let alternativeAlias = getAlternativeAlias(alternative)
  let selector: Selector = alternativeAlias ? 'alias' : 'pattern'
  let name =
    !options.ignoreAlias && alternativeAlias
      ? `${alternativeAlias}: ${alternative.raw}`
      : alternative.raw

  let group = computeGroup({
    customGroupMatcher: customGroup =>
      doesCustomGroupMatch({
        elementValue: alternative.raw,
        selectors: [selector],
        elementName: name,
        modifiers: [],
        customGroup,
      }),
    predefinedGroups: [selector],
    options,
  })

  let pseudoNode = createPseudoLiteralNode({
    literalNode,
    alternative,
    sourceCode,
  })

  return {
    isEslintDisabled: isNodeEslintDisabled(literalNode, eslintDisabledLines),
    size: pseudoNode.range[1] - pseudoNode.range[0],
    node: pseudoNode,
    partitionId: 0,
    group,
    name,
  }
}
