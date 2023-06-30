import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { rangeToDiff } from '../utils/range-to-diff'
import { SortOrder, SortType } from '../typings'
import { makeFixes } from '../utils/make-fixes'
import { sortNodes } from '../utils/sort-nodes'
import { pairwise } from '../utils/pairwise'
import { complete } from '../utils/complete'
import { groupBy } from '../utils/group-by'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedJSXPropsOrder'

export enum Position {
  'exception' = 'exception',
  'ignore' = 'ignore',
  'first' = 'first',
  'last' = 'last',
}

type SortingNodeWithPosition = SortingNode & { position: Position }

type Options = [
  Partial<{
    'always-on-top': string[]
    'ignore-case': boolean
    multiline: Position
    shorthand: Position
    callback: Position
    order: SortOrder
    type: SortType
  }>,
]

export const RULE_NAME = 'sort-jsx-props'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted JSX props',
      recommended: false,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: {
            enum: [
              SortType.alphabetical,
              SortType.natural,
              SortType['line-length'],
            ],
            default: SortType.natural,
          },
          order: {
            enum: [SortOrder.asc, SortOrder.desc],
            default: SortOrder.asc,
          },
          'always-on-top': {
            type: 'array',
            default: [],
          },
          'ignore-case': {
            type: 'boolean',
            default: false,
          },
          shorthand: {
            enum: [Position.first, Position.last, Position.ignore],
          },
          callback: {
            enum: [Position.first, Position.last, Position.ignore],
          },
          multiline: {
            enum: [Position.first, Position.last, Position.ignore],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedJSXPropsOrder: 'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: SortType.alphabetical,
      order: SortOrder.asc,
    },
  ],
  create: context => ({
    JSXElement: node => {
      if (node.openingElement.attributes.length > 1) {
        let options = complete(context.options.at(0), {
          type: SortType.alphabetical,
          shorthand: Position.ignore,
          multiline: Position.ignore,
          callback: Position.ignore,
          'always-on-top': [],
          'ignore-case': false,
          order: SortOrder.asc,
        })

        let source = context.getSourceCode()

        let parts: SortingNodeWithPosition[][] =
          node.openingElement.attributes.reduce(
            (
              accumulator: SortingNodeWithPosition[][],
              attribute: TSESTree.JSXSpreadAttribute | TSESTree.JSXAttribute,
            ) => {
              if (attribute.type === AST_NODE_TYPES.JSXSpreadAttribute) {
                accumulator.push([])
                return accumulator
              }

              let position: Position = Position.ignore

              if (
                attribute.name.type === AST_NODE_TYPES.JSXIdentifier &&
                options['always-on-top'].includes(attribute.name.name)
              ) {
                position = Position.exception
              } else {
                if (
                  options.shorthand !== Position.ignore &&
                  attribute.value === null
                ) {
                  position = options.shorthand
                }

                if (
                  options.callback !== Position.ignore &&
                  attribute.name.type === AST_NODE_TYPES.JSXIdentifier &&
                  attribute.name.name.indexOf('on') === 0 &&
                  attribute.value !== null
                ) {
                  position = options.callback
                } else if (
                  options.multiline !== Position.ignore &&
                  attribute.loc.start.line !== attribute.loc.end.line
                ) {
                  position = options.multiline
                }
              }

              let jsxNode = {
                name:
                  attribute.name.type === AST_NODE_TYPES.JSXNamespacedName
                    ? `${attribute.name.namespace.name}:${attribute.name.name.name}`
                    : attribute.name.name,
                size: rangeToDiff(attribute.range),
                node: attribute,
                position,
              }

              accumulator.at(-1)!.push(jsxNode)

              return accumulator
            },
            [[]],
          )

        for (let nodes of parts) {
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
                [Position.exception]: 2,
                [Position.first]: 1,
                [Position.ignore]: 0,
                [Position.last]: -1,
              }

              comparison =
                positionPower[left.position] < positionPower[right.position]
            }

            if (comparison) {
              context.report({
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: left.name,
                  right: right.name,
                },
                node: right.node,
                fix: fixer => {
                  let groups = groupBy(nodes, ({ position }) => position)

                  let getGroup = (index: string) =>
                    index in groups ? groups[index] : []

                  let sortedNodes = [
                    getGroup(Position.exception).sort(
                      (aNode, bNode) =>
                        options['always-on-top'].indexOf(aNode.name) -
                        options['always-on-top'].indexOf(bNode.name),
                    ),
                    sortNodes(getGroup(Position.first), options),
                    sortNodes(getGroup(Position.ignore), options),
                    sortNodes(getGroup(Position.last), options),
                  ].flat()

                  return makeFixes(fixer, nodes, sortedNodes, source)
                },
              })
            }
          })
        }
      }
    },
  }),
})
