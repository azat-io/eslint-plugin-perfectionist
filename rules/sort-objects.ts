import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import type { PartitionComment, SortingNode } from '../typings'

import { isPartitionComment } from '../utils/is-partition-comment'
import { getCommentBefore } from '../utils/get-comment-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { SortOrder, SortType } from '../typings'
import { makeFixes } from '../utils/make-fixes'
import { sortNodes } from '../utils/sort-nodes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { groupBy } from '../utils/group-by'
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
    'partition-by-comment': PartitionComment
    'always-on-top': string[]
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
          'partition-by-comment': {
            type: ['boolean', 'string', 'array'],
            default: false,
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
          'always-on-top': {
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
          'ignore-case': false,
          order: SortOrder.asc,
          'always-on-top': [],
        })

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

              if (prop.key.type === AST_NODE_TYPES.Identifier) {
                ;({ name } = prop.key)
              } else if (prop.key.type === AST_NODE_TYPES.Literal) {
                name = `${prop.key.value}`
              } else {
                name = source.text.slice(...prop.key.range)
              }

              if (
                prop.key.type === AST_NODE_TYPES.Identifier &&
                options['always-on-top'].includes(prop.key.name)
              ) {
                position = Position.exception
              }

              if (prop.value.type === AST_NODE_TYPES.AssignmentPattern) {
                let addDependencies = (
                  value: TSESTree.AssignmentPattern,
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
                      case AST_NODE_TYPES.ArrowFunctionExpression:
                        nodes.push(expression.body)
                        break

                      case AST_NODE_TYPES.ConditionalExpression:
                        nodes.push(expression.consequent, expression.alternate)
                        break

                      case AST_NODE_TYPES.LogicalExpression:
                      case AST_NODE_TYPES.BinaryExpression:
                        nodes.push(expression.left, expression.right)
                        break

                      case AST_NODE_TYPES.CallExpression:
                        nodes.push(...expression.arguments)
                        break

                      default:
                    }

                    nodes.forEach(nestedNode => {
                      if (nestedNode.type === AST_NODE_TYPES.Identifier) {
                        dependencies.push(nestedNode.name)
                      }

                      if (
                        nestedNode.type === AST_NODE_TYPES.BinaryExpression ||
                        nestedNode.type === AST_NODE_TYPES.ConditionalExpression
                      ) {
                        handleComplexExpression(nestedNode)
                      }
                    })
                  }

                  switch (value.right.type) {
                    case AST_NODE_TYPES.ArrowFunctionExpression:
                    case AST_NODE_TYPES.ConditionalExpression:
                    case AST_NODE_TYPES.LogicalExpression:
                    case AST_NODE_TYPES.BinaryExpression:
                    case AST_NODE_TYPES.CallExpression:
                      handleComplexExpression(value.right)
                      break

                    default:
                  }
                }

                addDependencies(prop.value, true)
              }

              let value = {
                size: rangeToDiff(prop.range),
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
            let comparison: boolean

            if (
              left.position === Position.exception &&
              right.position === Position.exception
            ) {
              comparison =
                options['always-on-top'].indexOf(left.name) >
                options['always-on-top'].indexOf(right.name)
            } else if (left.position === right.position) {
              comparison = compare(left, right, options)
            } else {
              let positionPower = {
                [Position.exception]: 1,
                [Position.ignore]: 0,
              }

              comparison =
                positionPower[left.position] < positionPower[right.position]
            }

            if (comparison) {
              let fix:
                | ((fixer: TSESLint.RuleFixer) => TSESLint.RuleFix[])
                | undefined = fixer => {
                let groups = groupBy(nodes, ({ position }) => position)

                let getGroup = (index: string) =>
                  index in groups ? groups[index] : []

                let sortedNodes = [
                  getGroup(Position.exception).sort(
                    (aNode, bNode) =>
                      options['always-on-top'].indexOf(aNode.name) -
                      options['always-on-top'].indexOf(bNode.name),
                  ),

                  sortNodes(getGroup(Position.ignore), options),
                ].flat()

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
