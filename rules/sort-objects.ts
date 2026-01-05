import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type {
  MessageId,
  Modifier,
  Selector,
  Options,
} from './sort-objects/types'
import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'

import {
  customGroupMatchOptionsJsonSchema,
  DEPENDENCY_ORDER_ERROR_ID,
  MISSED_SPACING_ERROR_ID,
  EXTRA_SPACING_ERROR_ID,
  GROUP_ORDER_ERROR_ID,
  ORDER_ERROR_ID,
  allModifiers,
  allSelectors,
} from './sort-objects/types'
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
import {
  buildUseConfigurationIfJsonSchema,
  buildCommonJsonSchemas,
} from '../utils/json-schemas/common-json-schemas'
import { computePropertyOrVariableDeclaratorName } from './sort-objects/compute-property-or-variable-declarator-name'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { buildDefaultOptionsByGroupIndexComputer } from '../utils/build-default-options-by-group-index-computer'
import { defaultComparatorByOptionsComputer } from '../utils/compare/default-comparator-by-options-computer'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { computeMatchedContextOptions } from './sort-objects/compute-matched-context-options'
import { scopedRegexJsonSchema } from '../utils/json-schemas/scoped-regex-json-schema'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { UnreachableCaseError } from '../utils/unreachable-case-error'
import { isNodeOnSingleLine } from '../utils/is-node-on-single-line'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { isStyleNode } from './sort-objects/is-style-node'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

/** Cache computed groups by modifiers and selectors for performance. */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

let defaultOptions: Required<Options[number]> = {
  fallbackSort: { type: 'unsorted' },
  newlinesInside: 'newlinesBetween',
  partitionByNewLine: false,
  partitionByComment: false,
  newlinesBetween: 'ignore',
  specialCharacters: 'keep',
  styledComponents: true,
  useConfigurationIf: {},
  type: 'alphabetical',
  ignoreCase: true,
  customGroups: [],
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MessageId>({
  create: context => {
    let settings = getSettings(context.settings)
    let { sourceCode, id } = context

    function sortObject(
      nodeObject: TSESTree.ObjectExpression | TSESTree.ObjectPattern,
    ): void {
      if (!isSortable(nodeObject.properties)) {
        return
      }

      let isDestructuredObject =
        nodeObject.type === AST_NODE_TYPES.ObjectPattern
      let matchedContextOptions = computeMatchedContextOptions({
        isDestructuredObject,
        nodeObject,
        sourceCode,
        context,
      })
      let options = complete(matchedContextOptions, settings, defaultOptions)
      validateCustomSortConfiguration(options)
      validateGroupsConfiguration({
        selectors: allSelectors,
        modifiers: allModifiers,
        options,
      })
      validateNewlinesAndPartitionConfiguration(options)

      let objectRoot =
        nodeObject.type === AST_NODE_TYPES.ObjectPattern
          ? null
          : getRootObject(nodeObject)
      if (
        objectRoot &&
        !options.styledComponents &&
        (isStyleNode(objectRoot.parent) ||
          (objectRoot.parent.type === AST_NODE_TYPES.ArrowFunctionExpression &&
            isStyleNode(objectRoot.parent.parent)))
      ) {
        return
      }

      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: id,
        sourceCode,
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
            traverseNode(nodeValue.key)
            traverseNode(nodeValue.value)
          }

          if (nodeValue.type === AST_NODE_TYPES.ConditionalExpression) {
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
            traverseNode(nodeValue.right)
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

        function traverseNode(nodeValue: TSESTree.Node): void {
          checkNode(nodeValue)
        }

        traverseNode(init)
        return dependencies
      }
      function formatProperties(
        props: (
          | TSESTree.ObjectLiteralElement
          | TSESTree.RestElement
          | TSESTree.Property
        )[],
      ): SortingNodeWithDependencies[][] {
        return props.reduce(
          (accumulator: SortingNodeWithDependencies[][], property) => {
            if (
              property.type === AST_NODE_TYPES.SpreadElement ||
              property.type === AST_NODE_TYPES.RestElement
            ) {
              accumulator.push([])
              return accumulator
            }

            let lastSortingNode = accumulator.at(-1)?.at(-1)

            let dependencies: string[] = []

            let selectors: Selector[] = []
            let modifiers: Modifier[] = []

            if (property.value.type === AST_NODE_TYPES.AssignmentPattern) {
              dependencies = extractDependencies(property.value.right)
            }

            if (
              property.value.type === AST_NODE_TYPES.ArrowFunctionExpression ||
              property.value.type === AST_NODE_TYPES.FunctionExpression
            ) {
              selectors.push('method')
            } else {
              selectors.push('property')
            }

            selectors.push('member')

            if (!isNodeOnSingleLine(property)) {
              modifiers.push('multiline')
            }

            let name = computePropertyOrVariableDeclaratorName({
              node: property,
              sourceCode,
            })
            let dependencyNames = [name]
            if (isDestructuredObject) {
              dependencyNames = [
                ...new Set(extractNamesFromPattern(property.value)),
              ]
            }
            let predefinedGroups = generatePredefinedGroups({
              cache: cachedGroupsByModifiersAndSelectors,
              selectors,
              modifiers,
            })
            let group = computeGroup({
              customGroupMatcher: customGroup =>
                doesCustomGroupMatch({
                  elementValue: getNodeValue({
                    sourceCode,
                    property,
                  }),
                  elementName: name,
                  customGroup,
                  selectors,
                  modifiers,
                }),
              predefinedGroups,
              options,
            })

            let sortingNode: Omit<SortingNodeWithDependencies, 'partitionId'> =
              {
                isEslintDisabled: isNodeEslintDisabled(
                  property,
                  eslintDisabledLines,
                ),
                size: rangeToDiff(property, sourceCode),
                dependencyNames,
                node: property,
                dependencies,
                group,
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

            accumulator.at(-1)!.push({
              ...sortingNode,
              partitionId: accumulator.length,
            })

            return accumulator
          },
          [[]],
        )
      }
      let formattedMembers = formatProperties(nodeObject.properties)

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
    }

    return {
      ObjectExpression: sortObject,
      ObjectPattern: sortObject,
    }
  },
  meta: {
    schema: {
      items: {
        properties: {
          ...buildCommonJsonSchemas(),
          ...buildCommonGroupsJsonSchemas({
            additionalCustomGroupMatchProperties:
              customGroupMatchOptionsJsonSchema,
          }),
          useConfigurationIf: buildUseConfigurationIfJsonSchema({
            additionalProperties: {
              objectType: {
                description:
                  'Specifies whether to only match destructured objects or regular objects.',
                enum: ['destructured', 'non-destructured'],
                type: 'string',
              },
              hasNumericKeysOnly: {
                description:
                  'Specifies whether to only match objects that have exclusively numeric keys.',
                type: 'boolean',
              },
              declarationCommentMatchesPattern: scopedRegexJsonSchema,
              callingFunctionNamePattern: scopedRegexJsonSchema,
              declarationMatchesPattern: scopedRegexJsonSchema,
            },
          }),
          styledComponents: {
            description: 'Controls whether to sort styled components.',
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
      [DEPENDENCY_ORDER_ERROR_ID]: DEPENDENCY_ORDER_ERROR,
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-objects',
      description: 'Enforce sorted objects.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-objects',
})

function extractNamesFromPattern(pattern: TSESTree.Node): string[] {
  switch (pattern.type) {
    case AST_NODE_TYPES.AssignmentPattern:
      return extractNamesFromPattern(pattern.left)
    case AST_NODE_TYPES.ObjectPattern:
      return pattern.properties.flatMap(extractNamesFromObjectPatternProperty)
    case AST_NODE_TYPES.ArrayPattern:
      return pattern.elements.flatMap(extractNamesFromArrayPatternElement)
    case AST_NODE_TYPES.Identifier:
      return [pattern.name]
    /* v8 ignore next 2 */
    default:
      return []
  }

  function extractNamesFromArrayPatternElement(
    element: TSESTree.DestructuringPattern | null,
  ): string[] {
    if (!element) {
      return []
    }

    if (element.type === AST_NODE_TYPES.RestElement) {
      return extractNamesFromPattern(element.argument)
    }

    return extractNamesFromPattern(element)
  }

  function extractNamesFromObjectPatternProperty(
    property: TSESTree.RestElement | TSESTree.Property,
  ): string[] {
    switch (property.type) {
      case AST_NODE_TYPES.RestElement:
        return extractNamesFromPattern(property.argument)
      case AST_NODE_TYPES.Property:
        return extractNamesFromPattern(property.value)
      /* v8 ignore next 2 -- @preserve Exhaustive guard. */
      default:
        throw new UnreachableCaseError(property)
    }
  }
}

function getNodeValue({
  sourceCode,
  property,
}: {
  sourceCode: TSESLint.SourceCode
  property: TSESTree.Property
}): string | null {
  switch (property.value.type) {
    case AST_NODE_TYPES.ArrowFunctionExpression:
    case AST_NODE_TYPES.FunctionExpression:
      return null
    default:
      return sourceCode.getText(property.value)
  }
}

function getRootObject(
  node: TSESTree.ObjectExpression,
): TSESTree.ObjectExpression {
  let objectRoot = node
  while (
    objectRoot.parent.type === AST_NODE_TYPES.Property &&
    objectRoot.parent.parent.type === AST_NODE_TYPES.ObjectExpression
  ) {
    objectRoot = objectRoot.parent.parent
  }
  return objectRoot
}
