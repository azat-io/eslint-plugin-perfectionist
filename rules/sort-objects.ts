import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { minimatch } from 'minimatch'

import type { PartitionComment, SortingNode } from '../typings'

import { isPartitionComment } from '../utils/is-partition-comment'
import { getCommentBefore } from '../utils/get-comment-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { getNodeParent } from '../utils/get-node-parent'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { isPositive } from '../utils/is-positive'
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { sortNodes } from '../utils/sort-nodes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedObjectsOrder'

export enum Position {
  'exception' = 'exception',
  'ignore' = 'ignore',
}

type SortingNodeWithPosition = {
  position: Position
} & SortingNode

type Options = [
  Partial<{
    customGroups: { [key: string]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: PartitionComment
    groups: (string[] | string)[]
    partitionByNewLine: boolean
    styledComponents: boolean
    ignorePattern: string[]
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export const RULE_NAME = 'sort-objects'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted objects',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          customGroups: {
            type: 'object',
          },
          partitionByComment: {
            type: ['boolean', 'string', 'array'],
            default: false,
          },
          partitionByNewLine: {
            type: 'boolean',
            default: false,
          },
          styledComponents: {
            type: 'boolean',
            default: true,
          },
          type: {
            enum: ['alphabetical', 'natural', 'line-length'],
            default: 'alphabetical',
            type: 'string',
          },
          order: {
            enum: ['asc', 'desc'],
            default: 'asc',
            type: 'string',
          },
          ignoreCase: {
            type: 'boolean',
            default: false,
          },
          ignorePattern: {
            items: {
              type: 'string',
            },
            type: 'array',
          },
          groups: {
            type: 'array',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedObjectsOrder: 'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
    },
  ],
  create: context => {
    let sortObject = (
      node: TSESTree.ObjectExpression | TSESTree.ObjectPattern,
    ) => {
      let options = complete(context.options.at(0), {
        partitionByNewLine: false,
        partitionByComment: false,
        styledComponents: true,
        type: 'alphabetical',
        ignoreCase: false,
        ignorePattern: [],
        customGroups: {},
        order: 'asc',
        groups: [],
      } as const)

      let shouldIgnore = false
      if (options.ignorePattern.length) {
        let parent = getNodeParent(node, ['VariableDeclarator', 'Property'])
        let parentId =
          parent?.type === 'VariableDeclarator'
            ? parent.id
            : (parent as TSESTree.Property | null)?.key
        let variableIdentifier =
          parentId?.type === 'Identifier' ? parentId.name : null

        if (
          typeof variableIdentifier === 'string' &&
          options.ignorePattern.some(pattern =>
            minimatch(variableIdentifier, pattern, {
              nocomment: true,
            }),
          )
        ) {
          shouldIgnore = true
        }
      }

      if (!shouldIgnore && node.properties.length > 1) {
        let isStyledCallExpression = (identifier: TSESTree.Expression) =>
          identifier.type === 'Identifier' && identifier.name === 'styled'

        let isStyledComponents = (
          styledNode: TSESTree.Node | undefined,
        ): boolean =>
          styledNode !== undefined &&
          styledNode.type === 'CallExpression' &&
          ((styledNode.callee.type === 'MemberExpression' &&
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

              let comment = getCommentBefore(prop, context.sourceCode)
              let lastProp = accumulator.at(-1)?.at(-1)

              if (
                options.partitionByComment &&
                comment &&
                isPartitionComment(options.partitionByComment, comment.value)
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
                name = context.sourceCode.text.slice(...prop.key.range)
              }

              let propSortingNode = {
                size: rangeToDiff(prop.range),
                node: prop,
                name,
              }

              if (
                options.partitionByNewLine &&
                lastProp &&
                getLinesBetween(context.sourceCode, lastProp, propSortingNode)
              ) {
                accumulator.push([])
              }

              if (prop.value.type === 'AssignmentPattern') {
                let addDependencies = (value: TSESTree.AssignmentPattern) => {
                  if (value.right.type === 'Identifier') {
                    dependencies.push(value.right.name)
                  }

                  let handleComplexExpression = (
                    expression:
                      | TSESTree.ArrowFunctionExpression
                      | TSESTree.ConditionalExpression
                      | TSESTree.LogicalExpression
                      | TSESTree.BinaryExpression
                      | TSESTree.CallExpression,
                  ) => {
                    let nodes = []

                    switch (expression.type) {
                      case 'ArrowFunctionExpression':
                        nodes.push(expression.body)
                        break

                      case 'ConditionalExpression':
                        nodes.push(expression.consequent, expression.alternate)
                        break

                      case 'LogicalExpression':
                      case 'BinaryExpression':
                        nodes.push(expression.left, expression.right)
                        break

                      case 'CallExpression':
                        nodes.push(...expression.arguments)
                        break
                    }

                    nodes.forEach(nestedNode => {
                      if (nestedNode.type === 'Identifier') {
                        dependencies.push(nestedNode.name)
                      }

                      if (
                        nestedNode.type === 'BinaryExpression' ||
                        nestedNode.type === 'ConditionalExpression'
                      ) {
                        handleComplexExpression(nestedNode)
                      }
                    })
                  }

                  switch (value.right.type) {
                    case 'ArrowFunctionExpression':
                    case 'ConditionalExpression':
                    case 'LogicalExpression':
                    case 'BinaryExpression':
                    case 'CallExpression':
                      handleComplexExpression(value.right)
                      break

                    default:
                  }
                }

                addDependencies(prop.value)
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

        for (let nodes of formatProperties(node.properties)) {
          pairwise(nodes, (left, right) => {
            let leftNum = getGroupNumber(options.groups, left)
            let rightNum = getGroupNumber(options.groups, right)

            if (
              leftNum > rightNum ||
              (leftNum === rightNum &&
                isPositive(compare(left, right, options)))
            ) {
              let fix:
                | ((fixer: TSESLint.RuleFixer) => TSESLint.RuleFix[])
                | undefined = fixer => {
                let grouped: {
                  [key: string]: SortingNode[]
                } = {}

                for (let currentNode of nodes) {
                  let groupNum = getGroupNumber(options.groups, currentNode)

                  if (!(groupNum in grouped)) {
                    grouped[groupNum] = [currentNode]
                  } else {
                    grouped[groupNum] = sortNodes(
                      [...grouped[groupNum], currentNode],
                      options,
                    )
                  }
                }

                let sortedNodes: SortingNode[] = []

                for (let group of Object.keys(grouped).sort(
                  (a, b) => Number(a) - Number(b),
                )) {
                  sortedNodes.push(...sortNodes(grouped[group], options))
                }

                return makeFixes(
                  fixer,
                  nodes,
                  sortedNodes,
                  context.sourceCode,
                  {
                    partitionComment: options.partitionByComment,
                  },
                )
              }

              context.report({
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: toSingleLine(left.name),
                  right: toSingleLine(right.name),
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
