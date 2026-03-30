import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type {
  SortDecoratorsSortingNode,
  AdditionalSortOptions,
  Selector,
  Modifier,
  Options,
} from './sort-decorators/types'

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
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { defaultComparatorByOptionsComputer } from '../utils/compare/default-comparator-by-options-computer'
import { buildOptionsByGroupIndexComputer } from '../utils/build-options-by-group-index-computer'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { buildCommonJsonSchemas } from '../utils/json-schemas/common-json-schemas'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { allModifiers, allSelectors } from './sort-decorators/types'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getNodeDecorators } from '../utils/get-node-decorators'
import { getDecoratorName } from '../utils/get-decorator-name'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { GroupMatcher } from '../utils/group-matcher'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

const ORDER_ERROR_ID = 'unexpectedDecoratorsOrder'
const GROUP_ORDER_ERROR_ID = 'unexpectedDecoratorsGroupOrder'
const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenDecorators'
const MISSED_SPACING_ERROR_ID = 'missedSpacingBetweenDecorators'

type MessageId =
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
  sortOnProperties: true,
  sortOnParameters: true,
  sortOnAccessors: true,
  type: 'alphabetical',
  sortOnClasses: true,
  sortOnMethods: true,
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
          ...buildCommonJsonSchemas(),
          ...buildCommonGroupsJsonSchemas(),
          sortOnParameters: {
            description:
              'Controls whether sorting should be enabled for method parameter decorators.',
            type: 'boolean',
          },
          sortOnProperties: {
            description:
              'Controls whether sorting should be enabled for class property decorators.',
            type: 'boolean',
          },
          sortOnAccessors: {
            description:
              'Controls whether sorting should be enabled for class accessor decorators.',
            type: 'boolean',
          },
          sortOnMethods: {
            description:
              'Controls whether sorting should be enabled for class method decorators.',
            type: 'boolean',
          },
          sortOnClasses: {
            description:
              'Controls whether sorting should be enabled for class decorators.',
            type: 'boolean',
          },
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
      uniqueItems: true,
      type: 'array',
    },
    messages: {
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-decorators',
      description: 'Enforce sorted decorators.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  create: context => {
    let settings = getSettings(context.settings)

    let options = complete(context.options.at(0), settings, defaultOptions)
    validateCustomSortConfiguration(options)
    validateGroupsConfiguration({
      modifiers: allModifiers,
      selectors: allSelectors,
      options,
    })
    validateNewlinesAndPartitionConfiguration(options)

    let groupMatcher = new GroupMatcher({
      allModifiers,
      allSelectors,
      options,
    })

    return {
      Decorator: decorator => {
        if (!options.sortOnParameters) {
          return
        }
        if (
          'decorators' in decorator.parent &&
          decorator.parent.type === AST_NODE_TYPES.Identifier &&
          decorator.parent.parent.type === AST_NODE_TYPES.FunctionExpression
        ) {
          let { decorators } = decorator.parent
          if (decorator !== decorators[0]) {
            return
          }
          sortDecorators({ groupMatcher, decorators, options, context })
        }
      },
      PropertyDefinition: propertyDefinition => {
        if (options.sortOnProperties) {
          sortDecorators({
            decorators: getNodeDecorators(propertyDefinition),
            groupMatcher,
            context,
            options,
          })
        }
      },
      AccessorProperty: accessorDefinition => {
        if (options.sortOnAccessors) {
          sortDecorators({
            decorators: getNodeDecorators(accessorDefinition),
            groupMatcher,
            context,
            options,
          })
        }
      },
      MethodDefinition: methodDefinition => {
        if (options.sortOnMethods) {
          sortDecorators({
            decorators: getNodeDecorators(methodDefinition),
            groupMatcher,
            context,
            options,
          })
        }
      },
      ClassDeclaration: declaration => {
        if (options.sortOnClasses) {
          sortDecorators({
            decorators: getNodeDecorators(declaration),
            groupMatcher,
            context,
            options,
          })
        }
      },
    }
  },
  defaultOptions: [defaultOptions],
  name: 'sort-decorators',
})

/**
 * Sorts decorators attached to a class, method, or property.
 *
 * Processes the decorators, groups them according to options, and reports any
 * ordering errors found. Handles partitioning by comments and newlines.
 *
 * @param params - Parameters object.
 * @param params.decorators - Array of decorator nodes to sort.
 * @param params.options - The sorting options for decorators.
 * @param params.context - The ESLint rule context.
 */
function sortDecorators({
  groupMatcher,
  decorators,
  options,
  context,
}: {
  groupMatcher: GroupMatcher<AdditionalSortOptions, Selector, Modifier>
  context: Readonly<RuleContext<MessageId, Options>>
  options: Required<Options[number]>
  decorators: TSESTree.Decorator[]
}): void {
  if (!isSortable(decorators)) {
    return
  }
  let { sourceCode, id } = context
  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: id,
    sourceCode,
  })
  let optionsByGroupIndexComputer = buildOptionsByGroupIndexComputer(options)

  let formattedMembers: SortDecoratorsSortingNode[][] = decorators.reduce(
    (accumulator: SortDecoratorsSortingNode[][], decorator) => {
      let name = getDecoratorName({
        sourceCode,
        decorator,
      })

      let group = groupMatcher.computeGroup({
        customGroupMatcher: customGroup =>
          doesCustomGroupMatch({
            elementName: name,
            modifiers: [],
            selectors: [],
            customGroup,
          }),
        selectors: [],
        modifiers: [],
      })

      let sortingNode: Omit<SortDecoratorsSortingNode, 'partitionId'> = {
        isEslintDisabled: isNodeEslintDisabled(decorator, eslintDisabledLines),
        size: rangeToDiff(decorator, sourceCode),
        node: decorator,
        group,
        name,
      }

      let lastSortingNode = accumulator.at(-1)?.at(-1)
      if (
        shouldPartition({
          lastSortingNode,
          sortingNode,
          sourceCode,
          options,
        })
      ) {
        accumulator.push([])
      }

      accumulator.at(-1)!.push({
        ...sortingNode,
        partitionId: accumulator.length,
      })

      return accumulator
    },
    [[]],
  )

  function sortNodesExcludingEslintDisabled(
    ignoreEslintDisabledNodes: boolean,
  ): SortDecoratorsSortingNode[] {
    return formattedMembers.flatMap(nodes =>
      sortNodesByGroups({
        comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
        optionsByGroupIndexComputer,
        ignoreEslintDisabledNodes,
        groups: options.groups,
        nodes,
      }),
    )
  }
  let nodes = formattedMembers.flat()

  reportAllErrors<MessageId>({
    availableMessageIds: {
      missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
      extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
      unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
      unexpectedOrder: ORDER_ERROR_ID,
    },
    ignoreFirstNodeHighestBlockComment: true,
    sortNodesExcludingEslintDisabled,
    options,
    context,
    nodes,
  })
}
