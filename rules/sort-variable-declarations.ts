import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'
import type { Selector, Options } from './sort-variable-declarations/types'

import {
  DEPENDENCY_ORDER_ERROR,
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
} from '../utils/json-schemas/common-partition-json-schemas'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { buildDefaultOptionsByGroupIndexComputer } from '../utils/build-default-options-by-group-index-computer'
import { defaultComparatorByOptionsComputer } from '../utils/compare/default-comparator-by-options-computer'
import {
  singleCustomGroupJsonSchema,
  allSelectors,
} from './sort-variable-declarations/types'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { buildCommonJsonSchemas } from '../utils/json-schemas/common-json-schemas'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

/** Cache computed groups by modifiers and selectors for performance. */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

const ORDER_ERROR_ID = 'unexpectedVariableDeclarationsOrder'
const GROUP_ORDER_ERROR_ID = 'unexpectedVariableDeclarationsGroupOrder'
const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenVariableDeclarationsMembers'
const MISSED_SPACING_ERROR_ID =
  'missedSpacingBetweenVariableDeclarationsMembers'
const DEPENDENCY_ORDER_ERROR_ID =
  'unexpectedVariableDeclarationsDependencyOrder'

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
  partitionByNewLine: false,
  partitionByComment: false,
  newlinesBetween: 'ignore',
  type: 'alphabetical',
  customGroups: [],
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MessageId>({
  create: context => ({
    VariableDeclaration: node => {
      if (!isSortable(node.declarations)) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)

      validateCustomSortConfiguration(options)
      validateNewlinesAndPartitionConfiguration(options)
      validateGroupsConfiguration({
        selectors: allSelectors,
        modifiers: [],
        options,
      })

      let { sourceCode, id } = context
      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: id,
        sourceCode,
      })

      let formattedMembers = node.declarations.reduce(
        (accumulator: SortingNodeWithDependencies[][], declaration) => {
          let name

          if (
            declaration.id.type === AST_NODE_TYPES.ArrayPattern ||
            declaration.id.type === AST_NODE_TYPES.ObjectPattern
          ) {
            name = sourceCode.text.slice(...declaration.id.range)
          } else {
            ;({ name } = declaration.id)
          }

          let selector: Selector

          let dependencies: string[] = extractDependencies(declaration.id)
          if (declaration.init) {
            dependencies.push(...extractDependencies(declaration.init))
            selector = 'initialized'
          } else {
            selector = 'uninitialized'
          }
          let predefinedGroups = generatePredefinedGroups({
            cache: cachedGroupsByModifiersAndSelectors,
            selectors: [selector],
            modifiers: [],
          })

          let lastSortingNode = accumulator.at(-1)?.at(-1)
          let sortingNode: Omit<SortingNodeWithDependencies, 'partitionId'> = {
            group: computeGroup({
              customGroupMatcher: customGroup =>
                doesCustomGroupMatch({
                  selectors: [selector],
                  elementName: name,
                  modifiers: [],
                  customGroup,
                }),
              predefinedGroups,
              options,
            }),
            isEslintDisabled: isNodeEslintDisabled(
              declaration,
              eslintDisabledLines,
            ),
            size: rangeToDiff(declaration, sourceCode),
            dependencyNames: [name],
            node: declaration,
            dependencies,
            name,
          }

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

          accumulator.at(-1)?.push({
            ...sortingNode,
            partitionId: accumulator.length,
          })

          return accumulator
        },
        [[]],
      )

      function sortNodesExcludingEslintDisabled(
        ignoreEslintDisabledNodes: boolean,
      ): SortingNodeWithDependencies[] {
        let nodesSortedByGroups = formattedMembers.flatMap(nodes =>
          sortNodesByGroups({
            optionsByGroupIndexComputer:
              buildDefaultOptionsByGroupIndexComputer(options),
            comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
            ignoreEslintDisabledNodes,
            groups: options.groups,
            nodes,
          }),
        )

        return sortNodesByDependencies(nodesSortedByGroups, {
          ignoreEslintDisabledNodes,
        })
      }

      let nodes = formattedMembers.flat()

      reportAllErrors<MessageId>({
        availableMessageIds: {
          missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
          unexpectedDependencyOrder: DEPENDENCY_ORDER_ERROR_ID,
          extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
          unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
          unexpectedOrder: ORDER_ERROR_ID,
        },
        sortNodesExcludingEslintDisabled,
        options,
        context,
        nodes,
      })
    },
  }),
  meta: {
    schema: [
      {
        properties: {
          ...buildCommonJsonSchemas(),
          ...buildCommonGroupsJsonSchemas({
            singleCustomGroupJsonSchema,
          }),
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    messages: {
      [DEPENDENCY_ORDER_ERROR_ID]: DEPENDENCY_ORDER_ERROR,
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-variable-declarations',
      description: 'Enforce sorted variable declarations.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  name: 'sort-variable-declarations',
  defaultOptions: [defaultOptions],
})

function extractDependencies(init: TSESTree.Expression): string[] {
  let dependencies: string[] = []

  function checkNode(nodeValue: TSESTree.Node): void {
    /** No need to check the body of functions and arrow functions. */
    if (
      nodeValue.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      nodeValue.type === AST_NODE_TYPES.FunctionExpression
    ) {
      return
    }

    if (nodeValue.type === AST_NODE_TYPES.Identifier) {
      dependencies.push(nodeValue.name)
    }

    if (nodeValue.type === AST_NODE_TYPES.Property) {
      checkNode(nodeValue.key)
      checkNode(nodeValue.value)
    }

    if (nodeValue.type === AST_NODE_TYPES.ConditionalExpression) {
      checkNode(nodeValue.test)
      checkNode(nodeValue.consequent)
      checkNode(nodeValue.alternate)
    }

    if (
      'expression' in nodeValue &&
      typeof nodeValue.expression !== 'boolean'
    ) {
      checkNode(nodeValue.expression)
    }

    if ('object' in nodeValue) {
      checkNode(nodeValue.object)
    }

    if ('callee' in nodeValue) {
      checkNode(nodeValue.callee)
    }

    if ('left' in nodeValue) {
      checkNode(nodeValue.left)
    }

    if ('right' in nodeValue) {
      checkNode(nodeValue.right as TSESTree.Node)
    }

    if ('elements' in nodeValue) {
      let elements = nodeValue.elements.filter(
        currentNode => currentNode !== null,
      )

      for (let element of elements) {
        checkNode(element)
      }
    }

    if ('argument' in nodeValue && nodeValue.argument) {
      checkNode(nodeValue.argument)
    }

    if ('arguments' in nodeValue) {
      for (let argument of nodeValue.arguments) {
        checkNode(argument)
      }
    }

    if ('properties' in nodeValue) {
      for (let property of nodeValue.properties) {
        checkNode(property)
      }
    }

    if ('expressions' in nodeValue) {
      for (let nodeExpression of nodeValue.expressions) {
        checkNode(nodeExpression)
      }
    }
  }

  checkNode(init)
  return dependencies
}
