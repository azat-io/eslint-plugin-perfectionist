import type { TSESTree } from '@typescript-eslint/types'
import type { SortingNode } from '../typings'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import { createEslintRule } from '../utils/create-eslint-rule'
import { rangeToDiff } from '../utils/range-to-diff'
import { SortType, SortOrder } from '../typings'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { groupBy } from '../utils/group-by'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedObjectsOrder'

export enum Position {
  'exception' = 'exception',
  'ignore' = 'ignore',
}

type SortingNodeWithPosition = SortingNode & { position: Position }

type Options = [
  Partial<{
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
      unexpectedObjectsOrder:
        'Expected "{{second}}" to come before "{{first}}"',
    },
  },
  defaultOptions: [
    {
      type: SortType.alphabetical,
      order: SortOrder.asc,
    },
  ],
  create: context => ({
    ObjectExpression: node => {
      if (node.properties.length > 1) {
        let options = complete(context.options.at(0), {
          type: SortType.alphabetical,
          'ignore-case': false,
          order: SortOrder.asc,
          'always-on-top': [],
        })

        let source = context.getSourceCode()

        let formatProperties = (
          props: TSESTree.ObjectLiteralElement[],
        ): SortingNodeWithPosition[][] =>
          props.reduce(
            (accumulator: SortingNodeWithPosition[][], prop) => {
              if (prop.type === AST_NODE_TYPES.SpreadElement) {
                accumulator.push([])
                return accumulator
              }

              let name: string
              let position: Position = Position.ignore

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

              let value = {
                size: rangeToDiff(prop.range),
                node: prop,
                position,
                name,
              }

              accumulator.at(-1)!.push(value)

              return accumulator
            },
            [[]],
          )

        formatProperties(node.properties).forEach(nodes => {
          pairwise(nodes, (first, second) => {
            let comparison: boolean

            if (
              first.position === Position.exception &&
              second.position === Position.exception
            ) {
              comparison =
                options['always-on-top'].indexOf(first.name) >
                options['always-on-top'].indexOf(second.name)
            } else if (first.position === second.position) {
              comparison = compare(first, second, options)
            } else {
              let positionPower = {
                [Position.exception]: 1,
                [Position.ignore]: 0,
              }

              comparison =
                positionPower[first.position] < positionPower[second.position]
            }

            if (comparison) {
              context.report({
                messageId: 'unexpectedObjectsOrder',
                data: {
                  first: first.name,
                  second: second.name,
                },
                node: second.node,
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
                    sortNodes(getGroup(Position.ignore), options),
                  ].flat()

                  return makeFixes(fixer, nodes, sortedNodes, source)
                },
              })
            }
          })
        })
      }
    },
  }),
})
