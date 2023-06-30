import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { toSingleLine } from '../utils/to-single-line'
import { getNodeRange } from '../utils/get-node-range'
import { rangeToDiff } from '../utils/range-to-diff'
import { SortOrder, SortType } from '../typings'
import { sortNodes } from '../utils/sort-nodes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedClassesOrder'

type Group =
  | 'private-property'
  | 'static-property'
  | 'private-method'
  | 'static-method'
  | 'constructor'
  | 'property'
  | 'unknown'
  | 'method'

type Options = [
  Partial<{
    groups: (Group[] | Group)[]
    'ignore-case': boolean
    order: SortOrder
    type: SortType
  }>,
]

type SortingNodeWithGroup = SortingNode & { group: Group }

export const RULE_NAME = 'sort-classes'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted classes',
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
          'ignore-case': {
            type: 'boolean',
            default: false,
          },
          order: {
            enum: [SortOrder.asc, SortOrder.desc],
            default: SortOrder.asc,
          },
          groups: {
            type: 'array',
            default: ['property', 'constructor', 'method', 'unknown'],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedClassesOrder: 'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: SortType.alphabetical,
      order: SortOrder.asc,
    },
  ],
  create: context => ({
    ClassBody: node => {
      if (node.body.length > 1) {
        let options = complete(context.options.at(0), {
          type: SortType.alphabetical,
          order: SortOrder.asc,
          'ignore-case': false,
          groups: ['property', 'constructor', 'method', 'unknown'],
        })

        let source = context.getSourceCode()

        let nodes: SortingNodeWithGroup[] = node.body.map(member => {
          let group: undefined | Group
          let name: string

          if (member.type === AST_NODE_TYPES.StaticBlock) {
            name = 'static'
          } else if (member.type === AST_NODE_TYPES.TSIndexSignature) {
            name = source.text.slice(
              member.range.at(0),
              member.typeAnnotation?.range.at(0) ?? member.range.at(1),
            )
          } else {
            if (member.key.type === AST_NODE_TYPES.Identifier) {
              ;({ name } = member.key)
            } else {
              name = source.text.slice(...member.key.range)
            }
          }

          let defineGroup = (nodeGroup: Group) => {
            if (!group && options.groups.flat().includes(nodeGroup)) {
              group = nodeGroup
            }
          }

          if (member.type === AST_NODE_TYPES.MethodDefinition) {
            if (member.kind === 'constructor') {
              defineGroup('constructor')
            }

            if (member.static) {
              defineGroup('static-method')
            }

            if (member.accessibility === 'private') {
              defineGroup('private-method')
            }

            defineGroup('method')
          } else if (member.type === AST_NODE_TYPES.PropertyDefinition) {
            if (member.static) {
              defineGroup('static-property')
            }

            if (member.accessibility === 'private') {
              defineGroup('private-property')
            }

            defineGroup('property')
          }

          return {
            size: rangeToDiff(member.range),
            group: group ?? 'unknown',
            node: member,
            name,
          }
        })

        let getGroupNumber = (sortingNode: SortingNodeWithGroup): number => {
          for (let i = 0, max = options.groups.length; i < max; i++) {
            let currentGroup = options.groups[i]

            if (
              sortingNode.group === currentGroup ||
              (Array.isArray(currentGroup) &&
                currentGroup.includes(sortingNode.group))
            ) {
              return i
            }
          }
          return options.groups.length
        }

        pairwise(nodes, (left, right) => {
          let leftNum = getGroupNumber(left)
          let rightNum = getGroupNumber(right)

          if (
            leftNum > rightNum ||
            (leftNum === rightNum && compare(left, right, options))
          ) {
            context.report({
              messageId: 'unexpectedClassesOrder',
              data: {
                left: toSingleLine(left.name),
                right: toSingleLine(right.name),
              },
              node: right.node,
              fix: (fixer: TSESLint.RuleFixer) => {
                let fixes: TSESLint.RuleFix[] = []

                let grouped = nodes.reduce(
                  (
                    accumulator: {
                      [key: string]: SortingNodeWithGroup[]
                    },
                    sortingNode,
                  ) => {
                    let groupNum = getGroupNumber(sortingNode)

                    if (!(groupNum in accumulator)) {
                      accumulator[groupNum] = [sortingNode]
                    } else {
                      accumulator[groupNum] = sortNodes(
                        [...accumulator[groupNum], sortingNode],
                        options,
                      )
                    }

                    return accumulator
                  },
                  {},
                )

                let formatted = Object.keys(grouped)
                  .sort()
                  .reduce(
                    (accumulator: SortingNodeWithGroup[], group: string) => [
                      ...accumulator,
                      ...grouped[group],
                    ],
                    [],
                  )

                for (let i = 0, max = formatted.length; i < max; i++) {
                  fixes.push(
                    fixer.replaceTextRange(
                      getNodeRange(nodes.at(i)!.node, source),
                      source.text.slice(
                        ...getNodeRange(formatted.at(i)!.node, source),
                      ),
                    ),
                  )
                }

                return fixes
              },
            })
          }
        })
      }
    },
  }),
})
