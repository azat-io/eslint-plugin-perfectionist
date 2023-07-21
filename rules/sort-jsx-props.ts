import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'
import { minimatch } from 'minimatch'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { rangeToDiff } from '../utils/range-to-diff'
import { SortOrder, SortType } from '../typings'
import { makeFixes } from '../utils/make-fixes'
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

type SortingNodeWithGroup<T extends string[]> = SortingNode & {
  group: Group<T>
}

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

        let parts: SortingNodeWithGroup<string[]>[][] =
          node.openingElement.attributes.reduce(
            (
              accumulator: SortingNodeWithGroup<string[]>[][],
              attribute: TSESTree.JSXSpreadAttribute | TSESTree.JSXAttribute,
            ) => {
              if (attribute.type === AST_NODE_TYPES.JSXSpreadAttribute) {
                accumulator.push([])
                return accumulator
              }

              let name = attribute.name.type === AST_NODE_TYPES.JSXNamespacedName
              ? `${attribute.name.namespace.name}:${attribute.name.name.name}`
              : attribute.name.name

              let group: Group<string[]> | undefined

              let defineGroup = (nodeGroup: Group<string[]>) => {
                if (!group && options.groups.flat().includes(nodeGroup)) {
                  group = nodeGroup
                }
              }

              for (let [key, pattern] of Object.entries(options['custom-groups'])) {
                if (
                  Array.isArray(pattern) &&
                  pattern.some(patternValue => minimatch(name, patternValue))
                ) {
                  defineGroup(key)
                }

                if (typeof pattern === 'string' && minimatch(name, pattern)) {
                  defineGroup(key)
                }
              }

              if (attribute.value === null) {
                defineGroup('shorthand')
              }

              if (attribute.loc.start.line !== attribute.loc.end.line) {
                defineGroup('multiline')
              }

              let jsxNode = {
                size: rangeToDiff(attribute.range),
                group: group ?? 'unknown',
                node: attribute,
                name,
              }

              accumulator.at(-1)!.push(jsxNode)

              return accumulator
            },
            [[]],
          )

        let getGroupNumber = (nodeWithGroup: SortingNodeWithGroup<string[]>): number => {
          for (let i = 0, max = options.groups.length; i < max; i++) {
            let currentGroup = options.groups[i]

            if (
              nodeWithGroup.group === currentGroup ||
              (Array.isArray(currentGroup) && currentGroup.includes(nodeWithGroup.group))
            ) {
              return i
            }
          }
          return options.groups.length
        }

        for (let nodes of parts) {
          pairwise(nodes, (left, right) => {
            let leftNum = getGroupNumber(left)
            let rightNum = getGroupNumber(right)

            if ((leftNum > rightNum ||
                (leftNum === rightNum && compare(left, right, options)))) {
              context.report({
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: left.name,
                  right: right.name,
                },
                node: right.node,
                fix: fixer => {
                  let grouped: {
                    [key: string]: SortingNodeWithGroup<string[]>[]
                  } = {}

                  for (let currentNode of nodes) {
                    let groupNum = getGroupNumber(currentNode)

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

                  for(let group of Object.keys(grouped).sort()) {
                    sortedNodes.push(...sortNodes(grouped[group], options))
                  }

                  return makeFixes(fixer, nodes, sortedNodes, source)
                }
              })
            }
          })
        }
      }
    },
  }),
})
