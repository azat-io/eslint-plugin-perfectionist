import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import type { Options } from './sort-heritage-clauses/types'
import type { SortingNode } from '../types/sorting-node'

import {
  buildCustomGroupsArrayJsonSchema,
  deprecatedCustomGroupsJsonSchema,
  partitionByNewLineJsonSchema,
  partitionByCommentJsonSchema,
  newlinesBetweenJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
} from '../utils/common-json-schemas'
import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { buildGetCustomGroupOverriddenOptionsFunction } from '../utils/get-custom-groups-compare-options'
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { singleCustomGroupJsonSchema } from './sort-heritage-clauses/types'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

type MessageId =
  | 'unexpectedHeritageClausesGroupOrder'
  | 'missedSpacingBetweenHeritageClauses'
  | 'extraSpacingBetweenHeritageClauses'
  | 'unexpectedHeritageClausesOrder'

let defaultOptions: Required<Options[0]> = {
  fallbackSort: { type: 'unsorted' },
  specialCharacters: 'keep',
  newlinesBetween: 'ignore',
  partitionByNewLine: false,
  partitionByComment: false,
  type: 'alphabetical',
  ignoreCase: true,
  customGroups: [],
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MessageId>({
  meta: {
    schema: {
      items: {
        properties: {
          ...commonJsonSchemas,
          customGroups: {
            oneOf: [
              deprecatedCustomGroupsJsonSchema,
              buildCustomGroupsArrayJsonSchema({ singleCustomGroupJsonSchema }),
            ],
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
          partitionByComment: partitionByCommentJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          groups: groupsJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
      uniqueItems: true,
      type: 'array',
    },
    messages: {
      missedSpacingBetweenHeritageClauses: MISSED_SPACING_ERROR,
      extraSpacingBetweenHeritageClauses: EXTRA_SPACING_ERROR,
      unexpectedHeritageClausesGroupOrder: GROUP_ORDER_ERROR,
      unexpectedHeritageClausesOrder: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-heritage-clauses',
      description: 'Enforce sorted heritage clauses.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  create: context => {
    let settings = getSettings(context.settings)

    let options = complete(context.options.at(0), settings, defaultOptions)
    validateCustomSortConfiguration(options)
    validateGeneratedGroupsConfiguration({
      modifiers: [],
      selectors: [],
      options,
    })
    validateNewlinesAndPartitionConfiguration(options)

    return {
      TSInterfaceDeclaration: declaration =>
        sortHeritageClauses(context, options, declaration.extends),
      ClassDeclaration: declaration =>
        sortHeritageClauses(context, options, declaration.implements),
    }
  },
  defaultOptions: [defaultOptions],
  name: 'sort-heritage-clauses',
})

function sortHeritageClauses(
  context: Readonly<RuleContext<MessageId, Options>>,
  options: Required<Options[0]>,
  heritageClauses:
    | TSESTree.TSInterfaceHeritage[]
    | TSESTree.TSClassImplements[]
    | undefined,
): void {
  if (!isSortable(heritageClauses)) {
    return
  }
  let { sourceCode, id } = context
  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: id,
    sourceCode,
  })

  let formattedMembers: SortingNode[][] = [[]]
  for (let heritageClause of heritageClauses) {
    let name = getHeritageClauseExpressionName(heritageClause.expression)

    let group = computeGroup({
      customGroupMatcher: customGroup =>
        doesCustomGroupMatch({
          elementName: name,
          selectors: [],
          modifiers: [],
          customGroup,
        }),
      predefinedGroups: [],
      options,
      name,
    })

    let sortingNode: SortingNode = {
      isEslintDisabled: isNodeEslintDisabled(
        heritageClause,
        eslintDisabledLines,
      ),
      size: rangeToDiff(heritageClause, sourceCode),
      node: heritageClause,
      partitionId: 0,
      group,
      name,
    }

    let lastSortingNode = formattedMembers.at(-1)?.at(-1)
    if (
      shouldPartition({
        lastSortingNode,
        sortingNode,
        sourceCode,
        options,
      })
    ) {
      formattedMembers.push([])
    }

    formattedMembers.at(-1)!.push(sortingNode)
  }

  for (let nodes of formattedMembers) {
    function createSortNodesExcludingEslintDisabled(
      sortingNodes: SortingNode[],
    ) {
      return function (ignoreEslintDisabledNodes: boolean): SortingNode[] {
        return sortNodesByGroups({
          getOptionsByGroupIndex:
            buildGetCustomGroupOverriddenOptionsFunction(options),
          ignoreEslintDisabledNodes,
          groups: options.groups,
          nodes: sortingNodes,
        })
      }
    }

    reportAllErrors<MessageId>({
      availableMessageIds: {
        missedSpacingBetweenMembers: 'missedSpacingBetweenHeritageClauses',
        extraSpacingBetweenMembers: 'extraSpacingBetweenHeritageClauses',
        unexpectedGroupOrder: 'unexpectedHeritageClausesGroupOrder',
        unexpectedOrder: 'unexpectedHeritageClausesOrder',
      },
      sortNodesExcludingEslintDisabled:
        createSortNodesExcludingEslintDisabled(nodes),
      sourceCode,
      options,
      context,
      nodes,
    })
  }
}

function getHeritageClauseExpressionName(
  expression: TSESTree.PrivateIdentifier | TSESTree.Expression,
): string {
  if (expression.type === 'Identifier') {
    return expression.name
  }
  if ('property' in expression) {
    return getHeritageClauseExpressionName(expression.property)
    /* v8 ignore start - should never throw */
  }
  throw new Error(
    'Unexpected heritage clause expression. Please report this issue ' +
      'here: https://github.com/azat-io/eslint-plugin-perfectionist/issues',
  )
  /* v8 ignore end */
}
