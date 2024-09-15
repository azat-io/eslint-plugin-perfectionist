import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { minimatch } from 'minimatch'

import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'

import {
  getFirstUnorderedNodeDependentOn,
  sortNodesByDependencies,
} from '../utils/sort-nodes-by-dependencies'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { getNodeParent } from '../utils/get-node-parent'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { sortNodes } from '../utils/sort-nodes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

type MESSAGE_ID =
  | 'unexpectedObjectsDependencyOrder'
  | 'unexpectedObjectsGroupOrder'
  | 'unexpectedObjectsOrder'

export enum Position {
  'exception' = 'exception',
  'ignore' = 'ignore',
}

type Group = 'unknown' | string
type SortingNodeWithPosition = SortingNodeWithDependencies & {
  position: Position
}

type Options = [
  Partial<{
    customGroups: { [key: string]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    groups: (Group[] | Group)[]
    partitionByNewLine: boolean
    styledComponents: boolean
    destructureOnly: boolean
    ignorePattern: string[]
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-objects',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted objects.',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: {
            description: 'Specifies the sorting method.',
            type: 'string',
            enum: ['alphabetical', 'natural', 'line-length'],
          },
          order: {
            description:
              'Determines whether the sorted items should be in ascending or descending order.',
            type: 'string',
            enum: ['asc', 'desc'],
          },
          ignoreCase: {
            description:
              'Controls whether sorting should be case-sensitive or not.',
            type: 'boolean',
          },
          partitionByComment: {
            description:
              'Allows you to use comments to separate the class members into logical groups.',
            anyOf: [
              {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              {
                type: 'boolean',
              },
              {
                type: 'string',
              },
            ],
          },
          partitionByNewLine: {
            description:
              'Allows to use spaces to separate the nodes into logical groups.',
            type: 'boolean',
          },
          styledComponents: {
            description: 'Controls whether to sort styled components.',
            type: 'boolean',
          },
          destructureOnly: {
            description: 'Controls whether to sort only destructured objects.',
            type: 'boolean',
          },
          ignorePattern: {
            description:
              'Specifies names or patterns for nodes that should be ignored by rule.',
            items: {
              type: 'string',
            },
            type: 'array',
          },
          groups: {
            description: 'Specifies the order of the groups.',
            type: 'array',
            items: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              ],
            },
          },
          customGroups: {
            description: 'Specifies custom groups.',
            type: 'object',
            additionalProperties: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              ],
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedObjectsGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedObjectsOrder: 'Expected "{{right}}" to come before "{{left}}".',
      unexpectedObjectsDependencyOrder:
        'Expected dependency "{{right}}" to come before "{{nodeDependentOnRight}}".',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
      partitionByComment: false,
      partitionByNewLine: false,
      styledComponents: true,
      destructureOnly: false,
      ignorePattern: [],
      groups: [],
      customGroups: {},
    },
  ],
  create: context => {
    let sortObject = (
      node: TSESTree.ObjectExpression | TSESTree.ObjectPattern,
    ) => {
      let settings = getSettings(context.settings)

      let options = complete(context.options.at(0), settings, {
        partitionByNewLine: false,
        partitionByComment: false,
        styledComponents: true,
        destructureOnly: false,
        type: 'alphabetical',
        ignorePattern: [],
        ignoreCase: true,
        customGroups: {},
        order: 'asc',
        groups: [],
      } as const)

      validateGroupsConfiguration(
        options.groups,
        ['unknown'],
        Object.keys(options.customGroups),
      )

      let shouldIgnore = false

      if (options.destructureOnly) {
        shouldIgnore = node.type !== 'ObjectPattern'
      }

      if (!shouldIgnore && options.ignorePattern.length) {
        let varParent = getNodeParent(node, ['VariableDeclarator', 'Property'])
        let parentId =
          varParent?.type === 'VariableDeclarator'
            ? varParent.id
            : (varParent as TSESTree.Property | null)?.key

        let varIdentifier =
          parentId?.type === 'Identifier' ? parentId.name : null

        let checkMatch = (identifier: string) =>
          options.ignorePattern.some(pattern =>
            minimatch(identifier, pattern, {
              nocomment: true,
            }),
          )

        if (typeof varIdentifier === 'string' && checkMatch(varIdentifier)) {
          shouldIgnore = true
        }

        let callParent = getNodeParent(node, ['CallExpression'])
        let callIdentifier =
          callParent?.type === 'CallExpression' &&
          callParent.callee.type === 'Identifier'
            ? callParent.callee.name
            : null

        if (callIdentifier && checkMatch(callIdentifier)) {
          shouldIgnore = true
        }
      }

      if (!shouldIgnore && node.properties.length > 1) {
        let isStyledCallExpression = (identifier: TSESTree.Expression) =>
          identifier.type === 'Identifier' && identifier.name === 'styled'

        let isCssCallExpression = (identifier: TSESTree.Expression) =>
          identifier.type === 'Identifier' && identifier.name === 'css'

        let isStyledComponents = (
          styledNode: TSESTree.Node | undefined,
        ): boolean =>
          styledNode !== undefined &&
          styledNode.type === 'CallExpression' &&
          (isCssCallExpression(styledNode.callee) ||
            (styledNode.callee.type === 'MemberExpression' &&
              isStyledCallExpression(styledNode.callee.object)) ||
            (styledNode.callee.type === 'CallExpression' &&
              isStyledCallExpression(styledNode.callee.callee)))
        if (
          !options.styledComponents &&
          (isStyledComponents(node.parent) ||
            (node.parent.type === 'ArrowFunctionExpression' &&
              isStyledComponents(node.parent.parent)))
        ) {
          return
        }

        let sourceCode = getSourceCode(context)

        let extractDependencies = (
          init: TSESTree.AssignmentPattern,
        ): string[] => {
          let dependencies: string[] = []

          let checkNode = (nodeValue: TSESTree.Node) => {
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
              nodeValue.elements
                .filter(currentNode => currentNode !== null)
                .forEach(traverseNode)
            }

            if ('argument' in nodeValue && nodeValue.argument) {
              traverseNode(nodeValue.argument)
            }

            if ('arguments' in nodeValue) {
              nodeValue.arguments.forEach(traverseNode)
            }

            if ('properties' in nodeValue) {
              nodeValue.properties.forEach(traverseNode)
            }

            if ('expressions' in nodeValue) {
              nodeValue.expressions.forEach(traverseNode)
            }
          }

          let traverseNode = (nodeValue: TSESTree.Node) => {
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
        ): SortingNodeWithPosition[][] =>
          props.reduce(
            (accumulator: SortingNodeWithPosition[][], prop) => {
              if (
                prop.type === 'SpreadElement' ||
                prop.type === 'RestElement'
              ) {
                accumulator.push([])
                return accumulator
              }

              let comments = getCommentsBefore(prop, sourceCode)
              let lastProp = accumulator.at(-1)?.at(-1)

              if (
                options.partitionByComment &&
                hasPartitionComment(options.partitionByComment, comments)
              ) {
                accumulator.push([])
              }

              let name: string
              let position: Position = Position.ignore
              let dependencies: string[] = []

              let { getGroup, setCustomGroups } = useGroups(options.groups)

              if (prop.key.type === 'Identifier') {
                ;({ name } = prop.key)
              } else if (prop.key.type === 'Literal') {
                name = `${prop.key.value}`
              } else {
                name = sourceCode.text.slice(...prop.key.range)
              }

              let propSortingNode = {
                size: rangeToDiff(prop.range),
                node: prop,
                name,
              }

              if (
                options.partitionByNewLine &&
                lastProp &&
                getLinesBetween(sourceCode, lastProp, propSortingNode)
              ) {
                accumulator.push([])
              }

              if (prop.value.type === 'AssignmentPattern') {
                dependencies = extractDependencies(prop.value)
              }

              setCustomGroups(options.customGroups, name)

              let value = {
                ...propSortingNode,
                group: getGroup(),
                dependencies,
                position,
              }

              accumulator.at(-1)!.push(value)

              return accumulator
            },
            [[]],
          )

        let sortedNodes: SortingNodeWithDependencies[] = []

        let formattedNodes = formatProperties(node.properties)
        for (let nodes of formattedNodes) {
          let grouped: {
            [key: string]: SortingNodeWithDependencies[]
          } = {}

          for (let currentNode of nodes) {
            let groupNum = getGroupNumber(options.groups, currentNode)

            if (!(groupNum in grouped)) {
              grouped[groupNum] = [currentNode]
            } else {
              grouped[groupNum].push(currentNode)
            }
          }

          for (let group of Object.keys(grouped).sort(
            (a, b) => Number(a) - Number(b),
          )) {
            sortedNodes.push(...sortNodes(grouped[group], options))
          }
        }

        sortedNodes = sortNodesByDependencies(sortedNodes)
        let nodes = formattedNodes.flat()

          pairwise(nodes, (left, right) => {
            let indexOfLeft = sortedNodes.indexOf(left)
            let indexOfRight = sortedNodes.indexOf(right)

            if (indexOfLeft > indexOfRight) {
              let firstUnorderedNodeDependentOnRight =
                getFirstUnorderedNodeDependentOn(right, nodes)
              let fix:
                | ((fixer: TSESLint.RuleFixer) => TSESLint.RuleFix[])
                | undefined = fixer =>
                makeFixes(fixer, nodes, sortedNodes, sourceCode, {
                  partitionComment: options.partitionByComment,
                })
              let leftNum = getGroupNumber(options.groups, left)
              let rightNum = getGroupNumber(options.groups, right)
              let messageId: MESSAGE_ID
              if (firstUnorderedNodeDependentOnRight) {
                messageId = 'unexpectedObjectsDependencyOrder'
              } else {
                messageId =
                  leftNum !== rightNum
                    ? 'unexpectedObjectsGroupOrder'
                    : 'unexpectedObjectsOrder'
              }
              context.report({
                messageId,
                data: {
                  left: toSingleLine(left.name),
                  leftGroup: left.group,
                  right: toSingleLine(right.name),
                  rightGroup: right.group,
                  nodeDependentOnRight:
                    firstUnorderedNodeDependentOnRight?.name,
                },
                node: right.node,
                fix,
              })
            }
          })
        }
      }
    }

    return {
      ObjectExpression: sortObject,
      ObjectPattern: sortObject,
    }
  },
})
