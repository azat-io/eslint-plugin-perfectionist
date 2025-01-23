import { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'
import type { Modifier, Selector } from './sort-objects/types'
import type { Options } from './sort-objects/types'

import {
  buildUseConfigurationIfJsonSchema,
  buildCustomGroupsArrayJsonSchema,
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  customGroupsJsonSchema,
  buildTypeJsonSchema,
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
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { getFirstNodeParentWithType } from './sort-objects/get-first-node-parent-with-type'
import { getCustomGroupsCompareOptions } from '../utils/get-custom-groups-compare-options'
import { getMatchingContextOptions } from '../utils/get-matching-context-options'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { doesCustomGroupMatch } from './sort-objects/does-custom-group-match'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { singleCustomGroupJsonSchema } from './sort-objects/types'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { allModifiers, allSelectors } from './sort-objects/types'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { useGroups } from '../utils/use-groups'
import { sortNodes } from '../utils/sort-nodes'
import { complete } from '../utils/complete'
import { matches } from '../utils/matches'

/**
 * Cache computed groups by modifiers and selectors for performance
 */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

type MESSAGE_ID =
  | 'missedSpacingBetweenObjectMembers'
  | 'unexpectedObjectsDependencyOrder'
  | 'extraSpacingBetweenObjectMembers'
  | 'unexpectedObjectsGroupOrder'
  | 'unexpectedObjectsOrder'

let defaultOptions: Required<Options[0]> = {
  partitionByNewLine: false,
  partitionByComment: false,
  newlinesBetween: 'ignore',
  specialCharacters: 'keep',
  destructuredObjects: true,
  objectDeclarations: true,
  styledComponents: true,
  destructureOnly: false,
  useConfigurationIf: {},
  type: 'alphabetical',
  ignorePattern: [],
  ignoreCase: true,
  customGroups: {},
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MESSAGE_ID>({
  create: context => {
    let settings = getSettings(context.settings)
    let sourceCode = getSourceCode(context)

    let sortObject = (
      nodeObject: TSESTree.ObjectExpression | TSESTree.ObjectPattern,
    ): void => {
      if (!isSortable(nodeObject.properties)) {
        return
      }

      let objectParent = getObjectParent({
        onlyFirstParent: true,
        node: nodeObject,
      })
      let matchedContextOptions = getMatchingContextOptions({
        nodeNames: nodeObject.properties
          .filter(
            property =>
              property.type !== 'SpreadElement' &&
              property.type !== 'RestElement',
          )
          .map(property => getNodeName({ sourceCode, property })),
        contextOptions: context.options,
      }).find(options => {
        if (!options.useConfigurationIf?.callingFunctionNamePattern) {
          return true
        }
        if (
          objectParent?.type === 'VariableDeclarator' ||
          !objectParent?.name
        ) {
          return false
        }
        return matches(
          objectParent.name,
          options.useConfigurationIf.callingFunctionNamePattern,
        )
      })

      let completeOptions = complete(
        matchedContextOptions,
        settings,
        defaultOptions,
      )
      let { type } = completeOptions
      if (type === 'unsorted') {
        return
      }
      let options = {
        ...completeOptions,
        type,
      }
      validateCustomSortConfiguration(options)
      validateGeneratedGroupsConfiguration({
        customGroups: options.customGroups,
        selectors: allSelectors,
        modifiers: allModifiers,
        groups: options.groups,
      })
      validateNewlinesAndPartitionConfiguration(options)

      let isDestructuredObject = nodeObject.type === 'ObjectPattern'
      if (isDestructuredObject) {
        if (!options.destructuredObjects) {
          return
        }
      } else if (options.destructureOnly || !options.objectDeclarations) {
        return
      }

      let objectParentForIgnorePattern = getObjectParent({
        onlyFirstParent: false,
        node: nodeObject,
      })
      if (
        objectParentForIgnorePattern?.name &&
        options.ignorePattern.some(pattern =>
          matches(objectParentForIgnorePattern.name, pattern),
        )
      ) {
        return
      }

      let isStyledCallExpression = (identifier: TSESTree.Expression): boolean =>
        identifier.type === 'Identifier' && identifier.name === 'styled'
      let isCssCallExpression = (identifier: TSESTree.Expression): boolean =>
        identifier.type === 'Identifier' && identifier.name === 'css'
      let isStyledComponents = (
        styledNode: TSESTree.Node | undefined,
      ): boolean =>
        !!styledNode &&
        ((styledNode.type === 'CallExpression' &&
          (isCssCallExpression(styledNode.callee) ||
            (styledNode.callee.type === 'MemberExpression' &&
              isStyledCallExpression(styledNode.callee.object)) ||
            (styledNode.callee.type === 'CallExpression' &&
              isStyledCallExpression(styledNode.callee.callee)))) ||
          (styledNode.type === 'JSXExpressionContainer' &&
            styledNode.parent.type === 'JSXAttribute' &&
            styledNode.parent.name.name === 'style'))
      if (
        !options.styledComponents &&
        (isStyledComponents(nodeObject.parent) ||
          (nodeObject.parent.type === 'ArrowFunctionExpression' &&
            isStyledComponents(nodeObject.parent.parent)))
      ) {
        return
      }

      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: context.id,
        sourceCode,
      })

      let extractDependencies = (
        init: TSESTree.AssignmentPattern,
      ): string[] => {
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
      let formatProperties = (
        props: (
          | TSESTree.ObjectLiteralElement
          | TSESTree.RestElement
          | TSESTree.Property
        )[],
      ): SortingNodeWithDependencies[][] =>
        props.reduce(
          (accumulator: SortingNodeWithDependencies[][], property) => {
            if (
              property.type === 'SpreadElement' ||
              property.type === 'RestElement'
            ) {
              accumulator.push([])
              return accumulator
            }

            let lastSortingNode = accumulator.at(-1)?.at(-1)

            let dependencies: string[] = []

            let { setCustomGroups, defineGroup, getGroup } = useGroups(options)

            let selectors: Selector[] = []
            let modifiers: Modifier[] = []

            if (property.value.type === 'AssignmentPattern') {
              dependencies = extractDependencies(property.value)
            }

            if (
              property.value.type === 'ArrowFunctionExpression' ||
              property.value.type === 'FunctionExpression'
            ) {
              selectors.push('method')
            } else {
              selectors.push('property')
            }

            selectors.push('member')

            if (property.loc.start.line !== property.loc.end.line) {
              modifiers.push('multiline')
              selectors.push('multiline')
            }

            let predefinedGroups = generatePredefinedGroups({
              cache: cachedGroupsByModifiersAndSelectors,
              selectors,
              modifiers,
            })

            for (let predefinedGroup of predefinedGroups) {
              defineGroup(predefinedGroup)
            }

            let name = getNodeName({ sourceCode, property })
            if (Array.isArray(options.customGroups)) {
              for (let customGroup of options.customGroups) {
                if (
                  doesCustomGroupMatch({
                    elementValue: getNodeValue({
                      sourceCode,
                      property,
                    }),
                    elementName: name,
                    customGroup,
                    selectors,
                    modifiers,
                  })
                ) {
                  defineGroup(customGroup.groupName, true)
                  /**
                   * If the custom group is not referenced in the `groups` option, it
                   * will be ignored
                   */
                  if (getGroup() === customGroup.groupName) {
                    break
                  }
                }
              }
            } else {
              setCustomGroups(options.customGroups, name, {
                override: true,
              })
            }

            let sortingNode: SortingNodeWithDependencies = {
              isEslintDisabled: isNodeEslintDisabled(
                property,
                eslintDisabledLines,
              ),
              size: rangeToDiff(property, sourceCode),
              group: getGroup(),
              node: property,
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

            accumulator.at(-1)!.push(sortingNode)

            return accumulator
          },
          [[]],
        )
      let formattedMembers = formatProperties(nodeObject.properties)

      let nodesSortingFunction =
        isDestructuredObject &&
        typeof options.destructuredObjects === 'object' &&
        !options.destructuredObjects.groups
          ? sortNodes
          : sortNodesByGroups
      let sortNodesExcludingEslintDisabled = (
        ignoreEslintDisabledNodes: boolean,
      ): SortingNodeWithDependencies[] =>
        sortNodesByDependencies(
          formattedMembers.flatMap(nodes =>
            nodesSortingFunction(nodes, options, {
              getGroupCompareOptions: groupNumber =>
                getCustomGroupsCompareOptions(options, groupNumber),
              ignoreEslintDisabledNodes,
            }),
          ),
          {
            ignoreEslintDisabledNodes,
          },
        )
      let nodes = formattedMembers.flat()

      reportAllErrors<MESSAGE_ID>({
        availableMessageIds: {
          missedSpacingBetweenMembers: 'missedSpacingBetweenObjectMembers',
          extraSpacingBetweenMembers: 'extraSpacingBetweenObjectMembers',
          unexpectedDependencyOrder: 'unexpectedObjectsDependencyOrder',
          unexpectedGroupOrder: 'unexpectedObjectsGroupOrder',
          unexpectedOrder: 'unexpectedObjectsOrder',
        },
        sortNodesExcludingEslintDisabled,
        sourceCode,
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
          ...commonJsonSchemas,
          destructuredObjects: {
            oneOf: [
              {
                type: 'boolean',
              },
              {
                properties: {
                  groups: {
                    description:
                      'Controls whether to use groups to sort destructured objects.',
                    type: 'boolean',
                  },
                },
                additionalProperties: false,
                type: 'object',
              },
            ],
            description: 'Controls whether to sort destructured objects.',
          },
          ignorePattern: {
            description:
              'Specifies names or patterns for nodes that should be ignored by rule.',
            items: {
              type: 'string',
            },
            type: 'array',
          },
          useConfigurationIf: buildUseConfigurationIfJsonSchema({
            additionalProperties: {
              callingFunctionNamePattern: {
                type: 'string',
              },
            },
          }),
          customGroups: {
            oneOf: [
              customGroupsJsonSchema,
              buildCustomGroupsArrayJsonSchema({ singleCustomGroupJsonSchema }),
            ],
          },
          destructureOnly: {
            description: 'Controls whether to sort only destructured objects.',
            type: 'boolean',
          },
          objectDeclarations: {
            description: 'Controls whether to sort object declarations.',
            type: 'boolean',
          },
          styledComponents: {
            description: 'Controls whether to sort styled components.',
            type: 'boolean',
          },
          type: buildTypeJsonSchema({ withUnsorted: true }),
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
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
      unexpectedObjectsDependencyOrder: DEPENDENCY_ORDER_ERROR,
      missedSpacingBetweenObjectMembers: MISSED_SPACING_ERROR,
      extraSpacingBetweenObjectMembers: EXTRA_SPACING_ERROR,
      unexpectedObjectsGroupOrder: GROUP_ORDER_ERROR,
      unexpectedObjectsOrder: ORDER_ERROR,
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

let getNodeName = ({
  sourceCode,
  property,
}: {
  sourceCode: ReturnType<typeof getSourceCode>
  property: TSESTree.Property
}): string => {
  if (property.key.type === 'Identifier') {
    return property.key.name
  } else if (property.key.type === 'Literal') {
    return `${property.key.value}`
  }
  return sourceCode.getText(property.key)
}

let getNodeValue = ({
  sourceCode,
  property,
}: {
  sourceCode: ReturnType<typeof getSourceCode>
  property: TSESTree.Property
}): string | null => {
  if (
    property.value.type === 'ArrowFunctionExpression' ||
    property.value.type === 'FunctionExpression'
  ) {
    return null
  }
  return sourceCode.getText(property.value)
}

let getObjectParent = ({
  onlyFirstParent,
  node,
}: {
  node: TSESTree.ObjectExpression | TSESTree.ObjectPattern
  onlyFirstParent: boolean
}): {
  type: 'VariableDeclarator' | 'CallExpression'
  name: string
} | null => {
  let variableParentName = getVariableParentName({ onlyFirstParent, node })
  if (variableParentName) {
    return {
      type: 'VariableDeclarator',
      name: variableParentName,
    }
  }
  let callParentName = getCallExpressionParentName({
    onlyFirstParent,
    node,
  })
  if (callParentName) {
    return {
      type: 'CallExpression',
      name: callParentName,
    }
  }
  return null
}

let getVariableParentName = ({
  onlyFirstParent,
  node,
}: {
  node: TSESTree.ObjectExpression | TSESTree.ObjectPattern
  onlyFirstParent: boolean
}): string | null => {
  let variableParent = getFirstNodeParentWithType({
    allowedTypes: [
      TSESTree.AST_NODE_TYPES.VariableDeclarator,
      TSESTree.AST_NODE_TYPES.Property,
    ],
    onlyFirstParent,
    node,
  })
  if (!variableParent) {
    return null
  }
  let parentId
  if (variableParent.type === 'VariableDeclarator') {
    parentId = variableParent.id
  } else if ('key' in variableParent) {
    parentId = variableParent.key
    /* v8 ignore next 3 - Unsure if we can reach it */
  } else {
    return null
  }

  return parentId.type === 'Identifier' ? parentId.name : null
}

let getCallExpressionParentName = ({
  onlyFirstParent,
  node,
}: {
  node: TSESTree.ObjectExpression | TSESTree.ObjectPattern
  onlyFirstParent: boolean
}): string | null => {
  let callParent = getFirstNodeParentWithType({
    allowedTypes: [TSESTree.AST_NODE_TYPES.CallExpression],
    onlyFirstParent,
    node,
  })
  if (!callParent) {
    return null
  }

  return callParent.callee.type === 'Identifier' ? callParent.callee.name : null
}
