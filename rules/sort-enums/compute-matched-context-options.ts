import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import type { Options } from './types'

import { filterOptionsByAllNamesMatch } from '../../utils/context-matching/filter-options-by-all-names-match'
import { passesAstSelectorFilter } from '../../utils/context-matching/passes-ast-selector-filter'
import { computeNodeName } from './compute-node-name'

/**
 * Computes the matched context options for a given enum node.
 *
 * @param params - Parameters.
 * @param params.enumMembers - The enum members of the enum declaration node.
 * @param params.astSelector - The AST selector string currently evaluated.
 * @param params.context - The rule context.
 * @returns The matched context options or undefined if none match.
 */
export function computeMatchedContextOptions<MessageIds extends string>({
  enumMembers,
  astSelector,
  context,
}: {
  context: Readonly<RuleContext<MessageIds, Options>>
  enumMembers: TSESTree.TSEnumMember[]
  astSelector: string | null
}): Options[number] | undefined {
  let nodeNames = enumMembers.map(enumMember =>
    computeNodeName({ sourceCode: context.sourceCode, node: enumMember }),
  )

  let matchedContextOptions = filterOptionsByAllNamesMatch({
    contextOptions: context.options,
    nodeNames,
  })

  return matchedContextOptions.find(isContextOptionMatching)

  function isContextOptionMatching(options: Options[number]): boolean {
    return passesAstSelectorFilter({
      matchesAstSelector: options.useConfigurationIf?.matchesAstSelector,
      astSelector,
    })
  }
}
