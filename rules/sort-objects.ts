import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import type { PartitionComment, SortingNode } from '../typings'

import { isPartitionComment } from '../utils/is-partition-comment'
import { getCommentBefore } from '../utils/get-comment-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { SortOrder, SortType } from '../typings'
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

type SortingNodeWithPosition = SortingNode & {
  position: Position
}

type Options = [
  Partial<{
    'custom-groups': { [key: string]: string[] | string }
    'partition-by-comment': PartitionComment
    groups: (string[] | string)[]
    'styled-components': boolean
    'ignore-case': boolean
    order: SortOrder
    type: SortType
  }>,
]

export const RULE_NAME = 'sort-objects'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted objects',
      recommended: false,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          'custom-groups': {
            type: 'object',
          },
          'partition-by-comment': {
            type: ['boolean', 'string', 'array'],
            default: false,
          },
          'styled-components': {
            type: 'boolean',
            default: true,
          },
          type: {
            enum: [
              SortType.alphabetical,
              SortType.natural,
              SortType['line-length'],
            ],
            default: SortType.alphabetical,
          },
          order: {
            enum: [SortOrder.asc, SortOrder.desc],
            default: SortOrder.asc,
          },
          'ignore-case': {
            type: 'boolean',
            default: false,
          },
          groups: {
            type: 'array',
            default: [],
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
      type: SortType.alphabetical,
      order: SortOrder.asc,
    },
  ],
  create: context => {
    let sortObject = (
      node: TSESTree.ObjectExpression | TSESTree.ObjectPattern,
    ) => {
      if (node.properties.length > 1) {
        let options = complete(context.options.at(0), {
          'partition-by-comment': false,
          type: SortType.alphabetical,
          'styled-components': true,
          'ignore-case': false,
          order: SortOrder.asc,
          'custom-groups': {},
          groups: [],
        })

        let isStyledComponents = (
          styledNode: TSESTree.Node | undefined,
        ): boolean =>
          styledNode !== undefined &&
          styledNode.type === 'CallExpression' &&
          ((styledNode.callee.type === 'MemberExpression' &&
            styledNode.callee.object.type === 'Identifier' &&
            styledNode.callee.object.name === 'styled') ||
            (styledNode.callee.type === 'CallExpression' &&
              styledNode.callee.callee.type === 'Identifier' &&
              styledNode.callee.callee.name === 'styled'))

        if (
          !options['styled-components'] &&
          (isStyledComponents(node.parent) ||
            (node.parent?.type === 'ArrowFunctionExpression' &&
              isStyledComponents(node.parent.parent)))
        ) {
          return
        }

        let source = context.getSourceCode()

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
                prop.type === AST_NODE_TYPES.SpreadElement ||
                prop.type === AST_NODE_TYPES.RestElement
              ) {
                accumulator.push([])
                return accumulator
              }

              let comment = getCommentBefore(prop, source)

              if (
                options['partition-by-comment'] &&
                comment &&
                isPartitionComment(
                  options['partition-by-comment'],
                  comment.value,
                )
              ) {
                accumulator.push([])
              }

              let name: string
              let position: Position = Position.ignore
              let dependencies: string[] = []

              let { getGroup, setCustomGroups } = useGroups(options.groups)

              if (prop.key.type === AST_NODE_TYPES.Identifier) {
                ;({ name } = prop.key)
              } else if (prop.key.type === AST_NODE_TYPES.Literal) {
                name = `${prop.key.value}`
              } else {
                name = source.text.slice(...prop.key.range)
              }

              if (prop.value.type === AST_NODE_TYPES.AssignmentPattern) {
                let addDependencies = (
                  value: TSESTree.AssignmentPattern | TSESTree.BinaryExpression,
                  initialStart: boolean,
                ) => {
                  if (value.right.type === AST_NODE_TYPES.Identifier) {
                    dependencies.push(value.right.name)
                  }

                  if (
                    !initialStart &&
                    value.left.type === AST_NODE_TYPES.Identifier
                  ) {
                    dependencies.push(value.left.name)
                  }

                  let handleBinaryExpression = (
                    expression: TSESTree.BinaryExpression,
                  ) => {
                    if (expression.right.type === AST_NODE_TYPES.Identifier) {
                      dependencies.push(expression.right.name)
                    }

                    if (
                      expression.left.type === AST_NODE_TYPES.BinaryExpression
                    ) {
                      addDependencies(expression.left, false)
                    }
                  }

                  if (value.right.type === AST_NODE_TYPES.BinaryExpression) {
                    handleBinaryExpression(value.right)
                  }
                }

                addDependencies(prop.value, true)
              }

              setCustomGroups(options['custom-groups'], name)

              let value = {
                size: rangeToDiff(prop.range),
                group: getGroup(),
                dependencies,
                node: prop,
                position,
                name,
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
              (leftNum === rightNum && compare(left, right, options))
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

                for (let group of Object.keys(grouped).sort()) {
                  sortedNodes.push(...sortNodes(grouped[group], options))
                }

                return makeFixes(fixer, nodes, sortedNodes, source, {
                  partitionComment: options['partition-by-comment'],
                })
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
