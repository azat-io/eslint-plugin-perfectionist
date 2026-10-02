import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Options } from './sort-constructor-parameters/types'

import {
  DEPENDENCY_ORDER_ERROR,
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import {
  matchesAstSelectorJsonSchema,
  buildUseConfigIfJsonSchema,
  buildCommonJsonSchemas,
} from '../utils/json-schemas/common-json-schemas'
import {
  partitionByCommentJsonSchema,
  partitionByNewlineJsonSchema,
} from '../utils/json-schemas/common-partition-json-schemas'
import { sortConstructorParameters } from './sort-constructor-parameters/sort-constructor-parameters'
import { additionalCustomGroupMatchOptionsJsonSchema } from './sort-constructor-parameters/types'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { buildAstListeners } from '../utils/build-ast-listeners'
import { createEslintRule } from '../utils/create-eslint-rule'

/**
 * Cache computed groups by modifiers and selectors for performance.
 */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

const ORDER_ERROR_ID = 'unexpectedConstructorParametersOrder'
const GROUP_ORDER_ERROR_ID = 'unexpectedConstructorParametersGroupOrder'
const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenConstructorParametersMembers'
const MISSED_SPACING_ERROR_ID =
  'missedSpacingBetweenConstructorParametersMembers'
const DEPENDENCY_ORDER_ERROR_ID =
  'unexpectedConstructorParametersDependencyOrder'

type MessageId =
  | typeof DEPENDENCY_ORDER_ERROR_ID
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

let defaultOptions: Required<Options[number]> = {
  fallbackSort: { type: 'unsorted' },
  newlinesInside: 'newlinesBetween',
  specialCharacters: 'keep',
  partitionByComment: false,
  partitionByNewLine: false,
  newlinesBetween: 'ignore',
  useConfigurationIf: {},
  groups: ['parameter'],
  type: 'alphabetical',
  ignoreCase: true,
  locales: 'en-US',
  customGroups: [],
  alphabet: '',
  order: 'asc',
}

let jsonSchema: JSONSchema4 = {
  items: {
    properties: {
      ...buildCommonJsonSchemas(),
      ...buildCommonGroupsJsonSchemas({
        additionalCustomGroupMatchProperties:
          additionalCustomGroupMatchOptionsJsonSchema,
      }),
      useConfigurationIf: buildUseConfigIfJsonSchema({
        additionalProperties: {
          matchesAstSelector: matchesAstSelectorJsonSchema,
        },
      }),
      partitionByComment: partitionByCommentJsonSchema,
      partitionByNewLine: partitionByNewlineJsonSchema,
    },
    required: ['useConfigurationIf'],
    additionalProperties: false,
    type: 'object',
  },
  uniqueItems: true,
  type: 'array',
  minItems: 1,
}

export default createEslintRule<Options, MessageId>({
  meta: {
    messages: {
      [DEPENDENCY_ORDER_ERROR_ID]: DEPENDENCY_ORDER_ERROR,
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-constructor-parameters',
      description: 'Enforce sorted constructor parameters.',
      recommended: false,
    },
    schema: jsonSchema,
    type: 'suggestion',
    fixable: 'code',
  },
  create: context =>
    buildAstListeners({
      nodeTypes: [AST_NODE_TYPES.MethodDefinition],
      context,
      sorter,
    }),
  name: 'sort-constructor-parameters',
  defaultOptions: [defaultOptions],
})

function sorter({
  matchedAstSelectors,
  context,
  node,
}: {
  context: Readonly<RuleContext<MessageId, Options>>
  matchedAstSelectors: ReadonlySet<string>
  node: TSESTree.MethodDefinition
}): void {
  if (node.kind !== 'constructor') {
    return
  }

  sortConstructorParameters<MessageId>({
    availableMessageIds: {
      missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
      unexpectedDependencyOrder: DEPENDENCY_ORDER_ERROR_ID,
      extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
      unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
      unexpectedOrder: ORDER_ERROR_ID,
    },
    cachedGroupsByModifiersAndSelectors,
    mustHaveMatchedContextOptions: true,
    matchedAstSelectors,
    defaultOptions,
    context,
    node,
  })
}
