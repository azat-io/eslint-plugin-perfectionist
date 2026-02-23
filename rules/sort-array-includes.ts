import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Options } from './sort-array-includes/types'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
} from '../utils/json-schemas/common-partition-json-schemas'
import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import {
  buildUseConfigurationIfJsonSchema,
  buildCommonJsonSchemas,
} from '../utils/json-schemas/common-json-schemas'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { additionalCustomGroupMatchOptionsJsonSchema } from './sort-array-includes/types'
import { createEslintRule } from '../utils/create-eslint-rule'
import { sortArray } from './sort-array-includes/sort-array'

/**
 * Cache computed groups by modifiers and selectors for performance.
 */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

const ORDER_ERROR_ID = 'unexpectedArrayIncludesOrder'
const GROUP_ORDER_ERROR_ID = 'unexpectedArrayIncludesGroupOrder'
const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenArrayIncludesMembers'
const MISSED_SPACING_ERROR_ID = 'missedSpacingBetweenArrayIncludesMembers'

type MessageId =
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

export let defaultOptions: Required<Options[number]> = {
  fallbackSort: { type: 'unsorted' },
  newlinesInside: 'newlinesBetween',
  specialCharacters: 'keep',
  partitionByComment: false,
  partitionByNewLine: false,
  newlinesBetween: 'ignore',
  useConfigurationIf: {},
  type: 'alphabetical',
  groups: ['literal'],
  ignoreCase: true,
  locales: 'en-US',
  customGroups: [],
  alphabet: '',
  order: 'asc',
}

export let jsonSchema: JSONSchema4 = {
  items: {
    properties: {
      ...buildCommonJsonSchemas(),
      ...buildCommonGroupsJsonSchemas({
        additionalCustomGroupMatchProperties:
          additionalCustomGroupMatchOptionsJsonSchema,
      }),
      useConfigurationIf: buildUseConfigurationIfJsonSchema({
        additionalProperties: {
          matchesAstSelector: { type: 'string' },
        },
      }),
      partitionByComment: partitionByCommentJsonSchema,
      partitionByNewLine: partitionByNewLineJsonSchema,
    },
    additionalProperties: false,
    type: 'object',
  },
  uniqueItems: true,
  type: 'array',
}

export default createEslintRule<Options, MessageId>({
  create: context => {
    let alreadyParsedExpressions = new Set<TSESTree.Expression>()

    let allAstSelectors = context.options
      .map(option => option.useConfigurationIf?.matchesAstSelector)
      .filter(matchesAstSelector => matchesAstSelector !== undefined)
    let allAstSelectorMatchers = allAstSelectors.map(
      astSelector =>
        [
          astSelector,
          buildPotentialArraySorter({
            alreadyParsedExpressions,
            astSelector,
            context,
          }),
        ] as const,
    )

    return {
      ...Object.fromEntries(allAstSelectorMatchers),
      'MemberExpression:exit': buildFromMemberExpressionArraySorter({
        alreadyParsedExpressions,
        astSelector: null,
        context,
      }),
    }
  },
  meta: {
    messages: {
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    docs: {
      description: 'Enforce sorted arrays before include method.',
      url: 'https://perfectionist.dev/rules/sort-array-includes',
      recommended: true,
    },
    schema: jsonSchema,
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-array-includes',
})

function sortArrayFromMemberExpression({
  alreadyParsedExpressions,
  astSelector,
  context,
  node,
}: {
  alreadyParsedExpressions: Set<TSESTree.Expression>
  context: Readonly<RuleContext<MessageId, Options>>
  node: TSESTree.MemberExpression
  astSelector: string | null
}): void {
  let arrayExpression = extractArrayIncludesExpression()
  if (!arrayExpression) {
    return
  }

  sortArray<MessageId>({
    availableMessageIds: {
      missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
      extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
      unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
      unexpectedOrder: ORDER_ERROR_ID,
    },
    cachedGroupsByModifiersAndSelectors,
    expression: arrayExpression,
    alreadyParsedExpressions,
    astSelector,
    context,
  })

  function extractArrayIncludesExpression(): TSESTree.Expression | null {
    if (node.property.type !== AST_NODE_TYPES.Identifier) {
      return null
    }
    if (node.property.name !== 'includes') {
      return null
    }

    return node.object
  }
}

function buildPotentialArraySorter({
  alreadyParsedExpressions,
  astSelector,
  context,
}: {
  alreadyParsedExpressions: Set<TSESTree.Expression>
  context: Readonly<RuleContext<MessageId, Options>>
  astSelector: string
}): (node: TSESTree.Node) => void {
  return sortPotentialArray

  function sortPotentialArray(node: TSESTree.Node): void {
    if (node.type !== AST_NODE_TYPES.ArrayExpression) {
      return
    }
    if (node.parent.type !== AST_NODE_TYPES.MemberExpression) {
      return
    }

    sortArrayFromMemberExpression({
      alreadyParsedExpressions,
      node: node.parent,
      astSelector,
      context,
    })
  }
}

function buildFromMemberExpressionArraySorter({
  alreadyParsedExpressions,
  astSelector,
  context,
}: {
  alreadyParsedExpressions: Set<TSESTree.Expression>
  context: Readonly<RuleContext<MessageId, Options>>
  astSelector: string | null
}): (node: TSESTree.MemberExpression) => void {
  return sorter

  function sorter(node: TSESTree.MemberExpression): void {
    return sortArrayFromMemberExpression({
      alreadyParsedExpressions,
      astSelector,
      context,
      node,
    })
  }
}
