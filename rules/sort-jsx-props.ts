import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { rangeToDiff } from '../utils/range-to-diff'
import { SortOrder, SortType } from '../typings'
import { makeFixes } from '../utils/make-fixes'
import { useGroups } from '../utils/use-groups'
import { sortNodes } from '../utils/sort-nodes'
import { pairwise } from '../utils/pairwise'
import { complete } from '../utils/complete'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedJSXPropsOrder'

type Group<T extends string[]> =
  | 'multiline'
  | 'shorthand'
  | 'unknown'
  | T[number]

type Options<T extends string[]> = [
  Partial<{
    'custom-groups': { [key in T[number]]: string[] | string }
    groups: (Group<T>[] | Group<T>)[]
    'ignore-case': boolean
    order: SortOrder
    type: SortType
  }>,
]

export const RULE_NAME = 'sort-jsx-props'

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
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
          'custom-groups': {
            type: 'object',
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
          groups: {
            type: 'array',
            default: [],
          },
          'ignore-case': {
            type: 'boolean',
            default: false,
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
          'ignore-case': false,
          order: SortOrder.asc,
          'custom-groups': {},
          groups: [],
        })

        let source = context.getSourceCode()

        let parts: SortingNode[][] = node.openingElement.attributes.reduce(
          (
            accumulator: SortingNode[][],
            attribute: TSESTree.JSXSpreadAttribute | TSESTree.JSXAttribute,
          ) => {
            if (attribute.type === 'JSXSpreadAttribute') {
              accumulator.push([])
              return accumulator
            }

            let name =
              attribute.name.type === 'JSXNamespacedName'
                ? `${attribute.name.namespace.name}:${attribute.name.name.name}`
                : attribute.name.name

            let { getGroup, defineGroup, setCustomGroups } = useGroups(
              options.groups,
            )

            setCustomGroups(options['custom-groups'], name)

            if (attribute.value === null) {
              defineGroup('shorthand')
            }

            if (attribute.loc.start.line !== attribute.loc.end.line) {
              defineGroup('multiline')
            }

            let jsxNode = {
              size: rangeToDiff(attribute.range),
              group: getGroup(),
              node: attribute,
              name,
            }

            accumulator.at(-1)!.push(jsxNode)

            return accumulator
          },
          [[]],
        )

        for (let nodes of parts) {
          pairwise(nodes, (left, right) => {
            let leftNum = getGroupNumber(options.groups, left)
            let rightNum = getGroupNumber(options.groups, right)

            if (
              leftNum > rightNum ||
              (leftNum === rightNum && compare(left, right, options))
            ) {
              context.report({
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: left.name,
                  right: right.name,
                },
                node: right.node,
                fix: fixer => {
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
