import { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'

import {
  buildUseConfigurationIfJsonSchema,
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  newlinesBetweenJsonSchema,
  customGroupsJsonSchema,
  ignoreCaseJsonSchema,
  buildTypeJsonSchema,
  alphabetJsonSchema,
  localesJsonSchema,
  groupsJsonSchema,
  orderJsonSchema,
} from '../utils/common-json-schemas'
import {
  getFirstUnorderedNodeDependentOn,
  sortNodesByDependencies,
} from '../utils/sort-nodes-by-dependencies'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { getFirstNodeParentWithType } from './sort-objects/get-first-node-parent-with-type'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { getMatchingContextOptions } from '../utils/get-matching-context-options'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { hasPartitionComment } from '../utils/has-partition-comment'
import { createNodeIndexMap } from '../utils/create-node-index-map'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getCommentsBefore } from '../utils/get-comments-before'
import { makeNewlinesFixes } from '../utils/make-newlines-fixes'
import { getNewlinesErrors } from '../utils/get-newlines-errors'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { sortNodes } from '../utils/sort-nodes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { matches } from '../utils/matches'

type Options = Partial<{
  partitionByComment:
    | {
        block?: string[] | boolean | string
        line?: string[] | boolean | string
      }
    | string[]
    | boolean
    | string
  useConfigurationIf: {
    callingFunctionNamePattern?: string
    allNamesMatchPattern?: string
  }
  type: 'alphabetical' | 'line-length' | 'unsorted' | 'natural' | 'custom'
  destructuredObjects: { groups: boolean } | boolean
  customGroups: Record<string, string[] | string>
  newlinesBetween: 'ignore' | 'always' | 'never'
  specialCharacters: 'remove' | 'trim' | 'keep'
  locales: NonNullable<Intl.LocalesArgument>
  groups: (Group[] | Group)[]
  partitionByNewLine: boolean
  objectDeclarations: boolean
  styledComponents: boolean
  /**
   * @deprecated for {@link `destructuredObjects`} and {@link `objectDeclarations`}
   */
  destructureOnly: boolean
  ignorePattern: string[]
  order: 'desc' | 'asc'
  ignoreCase: boolean
  alphabet: string
}>[]

type MESSAGE_ID =
  | 'missedSpacingBetweenObjectMembers'
  | 'unexpectedObjectsDependencyOrder'
  | 'extraSpacingBetweenObjectMembers'
  | 'unexpectedObjectsGroupOrder'
  | 'unexpectedObjectsOrder'

type Group = 'multiline' | 'unknown' | 'method' | string

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
          .map(property => getNodeName({ sourceCode, property }))
          .filter(nodeName => nodeName !== null),
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
      validateGroupsConfiguration(
        options.groups,
        ['multiline', 'method', 'unknown'],
        Object.keys(options.customGroups),
      )
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

            let lastProperty = accumulator.at(-1)?.at(-1)

            let name: string
            let dependencies: string[] = []

            let { setCustomGroups, defineGroup, getGroup } = useGroups(options)

            if (property.key.type === 'Identifier') {
              ;({ name } = property.key)
            } else if (property.key.type === 'Literal') {
              name = `${property.key.value}`
            } else {
              name = sourceCode.getText(property.key)
            }

            if (property.value.type === 'AssignmentPattern') {
              dependencies = extractDependencies(property.value)
            }

            setCustomGroups(options.customGroups, name)

            if (
              property.value.type === 'ArrowFunctionExpression' ||
              property.value.type === 'FunctionExpression'
            ) {
              defineGroup('method')
            }

            if (property.loc.start.line !== property.loc.end.line) {
              defineGroup('multiline')
            }

            let propertySortingNode: SortingNodeWithDependencies = {
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
              (options.partitionByNewLine &&
                lastProperty &&
                getLinesBetween(
                  sourceCode,
                  lastProperty,
                  propertySortingNode,
                )) ||
              hasPartitionComment({
                comments: getCommentsBefore({
                  node: property,
                  sourceCode,
                }),
                partitionByComment: options.partitionByComment,
              })
            ) {
              accumulator.push([])
            }

            accumulator.at(-1)!.push(propertySortingNode)

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
      let sortNodesIgnoringEslintDisabledNodes = (
        ignoreEslintDisabledNodes: boolean,
      ): SortingNodeWithDependencies[] =>
        sortNodesByDependencies(
          formattedMembers.flatMap(nodes =>
            nodesSortingFunction(nodes, options, {
              ignoreEslintDisabledNodes,
            }),
          ),
          {
            ignoreEslintDisabledNodes,
          },
        )
      let sortedNodes = sortNodesIgnoringEslintDisabledNodes(false)
      let sortedNodesExcludingEslintDisabled =
        sortNodesIgnoringEslintDisabledNodes(true)

      let nodes = formattedMembers.flat()

      let nodeIndexMap = createNodeIndexMap(sortedNodes)

      pairwise(nodes, (left, right) => {
        let leftNumber = getGroupNumber(options.groups, left)
        let rightNumber = getGroupNumber(options.groups, right)

        let leftIndex = nodeIndexMap.get(left)!
        let rightIndex = nodeIndexMap.get(right)!

        let indexOfRightExcludingEslintDisabled =
          sortedNodesExcludingEslintDisabled.indexOf(right)

        let messageIds: MESSAGE_ID[] = []
        let firstUnorderedNodeDependentOnRight:
          | SortingNodeWithDependencies
          | undefined

        if (
          leftIndex > rightIndex ||
          leftIndex >= indexOfRightExcludingEslintDisabled
        ) {
          firstUnorderedNodeDependentOnRight = getFirstUnorderedNodeDependentOn(
            right,
            nodes,
          )
          if (firstUnorderedNodeDependentOnRight) {
            messageIds.push('unexpectedObjectsDependencyOrder')
          } else {
            messageIds.push(
              leftNumber === rightNumber
                ? 'unexpectedObjectsOrder'
                : 'unexpectedObjectsGroupOrder',
            )
          }
        }

        messageIds = [
          ...messageIds,
          ...getNewlinesErrors({
            missedSpacingError: 'missedSpacingBetweenObjectMembers',
            extraSpacingError: 'extraSpacingBetweenObjectMembers',
            rightNum: rightNumber,
            leftNum: leftNumber,
            sourceCode,
            options,
            right,
            left,
          }),
        ]

        for (let messageId of messageIds) {
          context.report({
            fix: fixer => [
              ...makeFixes({
                sortedNodes: sortedNodesExcludingEslintDisabled,
                sourceCode,
                options,
                fixer,
                nodes,
              }),
              ...makeNewlinesFixes({
                sortedNodes: sortedNodesExcludingEslintDisabled,
                sourceCode,
                options,
                fixer,
                nodes,
              }),
            ],
            data: {
              nodeDependentOnRight: firstUnorderedNodeDependentOnRight?.name,
              rightGroup: right.group,
              leftGroup: left.group,
              right: right.name,
              left: left.name,
            },
            node: right.node,
            messageId,
          })
        }
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
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the keys of objects into logical groups.',
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
          partitionByNewLine: partitionByNewLineJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          customGroups: customGroupsJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          alphabet: alphabetJsonSchema,
          locales: localesJsonSchema,
          groups: groupsJsonSchema,
          order: orderJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
      uniqueItems: true,
      type: 'array',
    },
    messages: {
      unexpectedObjectsGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedObjectsDependencyOrder:
        'Expected dependency "{{right}}" to come before "{{nodeDependentOnRight}}".',
      missedSpacingBetweenObjectMembers:
        'Missed spacing between "{{left}}" and "{{right}}" objects.',
      extraSpacingBetweenObjectMembers:
        'Extra spacing between "{{left}}" and "{{right}}" objects.',
      unexpectedObjectsOrder: 'Expected "{{right}}" to come before "{{left}}".',
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
  property:
    | TSESTree.ObjectLiteralElement
    | TSESTree.RestElement
    | TSESTree.Property
  sourceCode: ReturnType<typeof getSourceCode>
}): string | null => {
  if (property.type === 'SpreadElement' || property.type === 'RestElement') {
    return null
  }
  if (property.key.type === 'Identifier') {
    return property.key.name
  } else if (property.key.type === 'Literal') {
    return `${property.key.value}`
  }
  return sourceCode.getText(property.key)
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
