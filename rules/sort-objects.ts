import type { TSESTree } from '@typescript-eslint/types'

import { minimatch } from 'minimatch'

import type { PartitionComment } from '../typings'

import { isPartitionComment } from '../utils/is-partition-comment'
import { createSortingRule } from '../utils/create-sorting-rule'
import { getCommentBefore } from '../utils/get-comment-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { complete } from '../utils/complete'

type MESSAGE_ID = 'unexpectedObjectsOrder'

type Options = [
  Partial<{
    'custom-groups': { [key: string]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    'partition-by-comment': PartitionComment
    'partition-by-new-line': boolean
    groups: (string[] | string)[]
    'styled-components': boolean
    'ignore-pattern': string[]
    'ignore-case': boolean
    order: 'desc' | 'asc'
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
          'ignore-case': {
            type: 'boolean',
            default: false,
          },
          'ignore-pattern': {
            items: {
              type: 'string',
            },
            type: 'array',
          },
          groups: {
            type: 'array',
          },
          'custom-groups': {
            type: 'object',
          },
          'partition-by-comment': {
            type: ['boolean', 'string', 'array'],
            default: false,
          },
          'partition-by-new-line': {
            type: 'boolean',
            default: false,
          },
          'styled-components': {
            type: 'boolean',
            default: true,
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
        'partition-by-new-line': false,
        'partition-by-comment': false,
        'styled-components': true,
        type: 'alphabetical',
        'ignore-case': false,
        'ignore-pattern': [],
        'custom-groups': {},
        order: 'asc',
        groups: [],
      } as const)

      let variableIdentifier =
        node.parent.type === 'VariableDeclarator' &&
        node.parent.id.type === 'Identifier'
          ? node.parent.id.name
          : null

      let shouldIgnore =
        options['ignore-pattern'].length &&
        typeof variableIdentifier === 'string'
          ? options['ignore-pattern'].some(pattern =>
              minimatch(variableIdentifier!, pattern, {
                nocomment: true,
              }),
            )
          : false

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
          !options['styled-components'] &&
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
        ): TSESTree.Property[][] =>
          props.reduce(
            (accumulator: TSESTree.Property[][], prop) => {
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
                options['partition-by-comment'] &&
                comment &&
                isPartitionComment(
                  options['partition-by-comment'],
                  comment.value,
                )
              ) {
                accumulator.push([])
              }

              if (
                options['partition-by-new-line'] &&
                lastProp &&
                getLinesBetween(context.sourceCode, lastProp, prop)
              ) {
                accumulator.push([])
              }

              accumulator.at(-1)!.push(prop)

              return accumulator
            },
            [[]],
          )

        for (let nodes of formatProperties(node.properties)) {
          createSortingRule({
            getName: prop => {
              if (prop.key.type === 'Identifier') {
                return prop.key.name
              } else if (prop.key.type === 'Literal') {
                return `${prop.key.value}`
              }
              return context.sourceCode.text.slice(...prop.key.range)
            },
            getDependencies: (define, prop) => {
              if (prop.value.type === 'AssignmentPattern') {
                let handleComplexExpression = (
                  expression:
                    | TSESTree.ArrowFunctionExpression
                    | TSESTree.ConditionalExpression
                    | TSESTree.LogicalExpression
                    | TSESTree.BinaryExpression
                    | TSESTree.CallExpression,
                ) => {
                  let nodeList = []

                  switch (expression.type) {
                    case 'ArrowFunctionExpression':
                      nodeList.push(expression.body)
                      break

                    case 'ConditionalExpression':
                      nodeList.push(expression.consequent, expression.alternate)
                      break

                    case 'LogicalExpression':
                    case 'BinaryExpression':
                      nodeList.push(expression.left, expression.right)
                      break

                    case 'CallExpression':
                      nodeList.push(...expression.arguments)
                      break
                  }

                  nodeList.forEach(nestedNode => {
                    if (nestedNode.type === 'Identifier') {
                      define(nestedNode.name)
                    }

                    if (
                      nestedNode.type === 'BinaryExpression' ||
                      nestedNode.type === 'ConditionalExpression'
                    ) {
                      handleComplexExpression(nestedNode)
                    }
                  })
                }

                switch (prop.value.right.type) {
                  case 'ArrowFunctionExpression':
                  case 'ConditionalExpression':
                  case 'LogicalExpression':
                  case 'BinaryExpression':
                  case 'CallExpression':
                    handleComplexExpression(prop.value.right)
                    break

                  case 'Identifier':
                    define(prop.value.right.name)
                    break

                  default:
                    break
                }
              }
            },
            unexpectedOrderMessage: 'unexpectedObjectsOrder',
            context,
            options,
            nodes,
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
