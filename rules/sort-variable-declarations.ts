import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'
import type { Selector, Options } from './sort-variable-declarations/types'

import {
  buildCustomGroupsArrayJsonSchema,
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
} from '../utils/common-json-schemas'
import {
  DEPENDENCY_ORDER_ERROR,
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { buildGetCustomGroupOverriddenOptionsFunction } from '../utils/get-custom-groups-compare-options'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { singleCustomGroupJsonSchema } from './sort-variable-declarations/types'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
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

/**
 * Cache computed groups by modifiers and selectors for performance
 */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

type MESSAGE_ID =
  | 'missedSpacingBetweenVariableDeclarationsMembers'
  | 'extraSpacingBetweenVariableDeclarationsMembers'
  | 'unexpectedVariableDeclarationsDependencyOrder'
  | 'unexpectedVariableDeclarationsGroupOrder'
  | 'unexpectedVariableDeclarationsOrder'

let defaultOptions: Required<Options[0]> = {
  fallbackSort: { type: 'unsorted' },
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

export default createEslintRule<Options, MESSAGE_ID>({
  create: context => ({
    VariableDeclaration: node => {
      if (!isSortable(node.declarations)) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)

      validateCustomSortConfiguration(options)
      validateNewlinesAndPartitionConfiguration(options)

      let { sourceCode, id } = context
      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: id,
        sourceCode,
      })

      let formattedMembers = node.declarations.reduce(
        (accumulator: SortingNodeWithDependencies[][], declaration) => {
          let name

          if (
            declaration.id.type === 'ArrayPattern' ||
            declaration.id.type === 'ObjectPattern'
          ) {
            name = sourceCode.text.slice(...declaration.id.range)
          } else {
            ;({ name } = declaration.id)
          }

          let selector: Selector

          let dependencies: string[] = []
          if (declaration.init) {
            dependencies = extractDependencies(declaration.init)
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
          let sortingNode: SortingNodeWithDependencies = {
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

          accumulator.at(-1)?.push(sortingNode)

          return accumulator
        },
        [[]],
      )

      let sortNodesExcludingEslintDisabled = (
        ignoreEslintDisabledNodes: boolean,
      ): SortingNodeWithDependencies[] => {
        let nodesSortedByGroups = formattedMembers.flatMap(nodes =>
          sortNodesByGroups({
            getOptionsByGroupNumber:
              buildGetCustomGroupOverriddenOptionsFunction(options),
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

      reportAllErrors<MESSAGE_ID>({
        availableMessageIds: {
          missedSpacingBetweenMembers:
            'missedSpacingBetweenVariableDeclarationsMembers',
          extraSpacingBetweenMembers:
            'extraSpacingBetweenVariableDeclarationsMembers',
          unexpectedDependencyOrder:
            'unexpectedVariableDeclarationsDependencyOrder',
          unexpectedGroupOrder: 'unexpectedVariableDeclarationsGroupOrder',
          unexpectedOrder: 'unexpectedVariableDeclarationsOrder',
        },
        sortNodesExcludingEslintDisabled,
        sourceCode,
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
          ...commonJsonSchemas,
          customGroups: buildCustomGroupsArrayJsonSchema({
            singleCustomGroupJsonSchema,
          }),
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          groups: groupsJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    messages: {
      missedSpacingBetweenVariableDeclarationsMembers: MISSED_SPACING_ERROR,
      unexpectedVariableDeclarationsDependencyOrder: DEPENDENCY_ORDER_ERROR,
      extraSpacingBetweenVariableDeclarationsMembers: EXTRA_SPACING_ERROR,
      unexpectedVariableDeclarationsGroupOrder: GROUP_ORDER_ERROR,
      unexpectedVariableDeclarationsOrder: ORDER_ERROR,
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

let extractDependencies = (init: TSESTree.Expression): string[] => {
  let dependencies: string[] = []

  let checkNode = (nodeValue: TSESTree.Node): void => {
    /**
     * No need to check the body of functions and arrow functions
     */
    if (
      nodeValue.type === 'ArrowFunctionExpression' ||
      nodeValue.type === 'FunctionExpression'
    ) {
      return
    }

    if (nodeValue.type === 'Identifier') {
      dependencies.push(nodeValue.name)
    }

    if (nodeValue.type === 'Property') {
      traverseNode(nodeValue.key)
      traverseNode(nodeValue.value)
    }

    if (nodeValue.type === 'ConditionalExpression') {
      traverseNode(nodeValue.test)
      traverseNode(nodeValue.consequent)
      traverseNode(nodeValue.alternate)
    }

    if (
      'expression' in nodeValue &&
      typeof nodeValue.expression !== 'boolean'
    ) {
      traverseNode(nodeValue.expression)
    }

    if ('object' in nodeValue) {
      traverseNode(nodeValue.object)
    }

    if ('callee' in nodeValue) {
      traverseNode(nodeValue.callee)
    }

    if ('left' in nodeValue) {
      traverseNode(nodeValue.left)
    }

    if ('right' in nodeValue) {
      traverseNode(nodeValue.right as TSESTree.Node)
    }

    if ('elements' in nodeValue) {
      let elements = nodeValue.elements.filter(
        currentNode => currentNode !== null,
      )

      for (let element of elements) {
        traverseNode(element)
      }
    }

    if ('argument' in nodeValue && nodeValue.argument) {
      traverseNode(nodeValue.argument)
    }

    if ('arguments' in nodeValue) {
      for (let argument of nodeValue.arguments) {
        traverseNode(argument)
      }
    }

    if ('properties' in nodeValue) {
      for (let property of nodeValue.properties) {
        traverseNode(property)
      }
    }

    if ('expressions' in nodeValue) {
      for (let nodeExpression of nodeValue.expressions) {
        traverseNode(nodeExpression)
      }
    }
  }

  let traverseNode = (nodeValue: TSESTree.Node): void => {
    checkNode(nodeValue)
  }

  traverseNode(init)
  return dependencies
}
