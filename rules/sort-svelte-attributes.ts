import type { TSESTree } from '@typescript-eslint/types'
import type { AST } from 'svelte-eslint-parser'

import path from 'path'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { rangeToDiff } from '../utils/range-to-diff'
import { SortOrder, SortType } from '../typings'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedSvelteAttributesOrder'

type Group<T extends string[]> =
  | 'svelte-shorthand'
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

export const RULE_NAME = 'sort-svelte-attributes'

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted union types',
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
      unexpectedSvelteAttributesOrder:
        'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: SortType.alphabetical,
      order: SortOrder.asc,
    },
  ],
  create: context => {
    if (path.extname(context.getFilename()) !== '.svelte') {
      return {}
    }

    return {
      SvelteStartTag: (node: AST.SvelteStartTag) => {
        if (node.attributes.length > 1) {
          let options = complete(context.options.at(0), {
            type: SortType.alphabetical,
            order: SortOrder.asc,
            'ignore-case': false,
            'custom-groups': {},
            groups: [],
          })

          let source = context.getSourceCode()

          let parts: SortingNodeWithGroup<string[]>[][] =
            node.attributes.reduce(
              (accumulator: SortingNodeWithGroup<string[]>[][], attribute) => {
                if (attribute.type === 'SvelteSpreadAttribute') {
                  accumulator.push([])
                  return accumulator
                }

                let name: string

                let group: Group<string[]> | undefined

                let defineGroup = (nodeGroup: Group<string[]>) => {
                  if (!group && options.groups.flat().includes(nodeGroup)) {
                    group = nodeGroup
                  }
                }

                if (attribute.key.type === 'SvelteSpecialDirectiveKey') {
                  name = source.text.slice(...attribute.key.range)
                } else {
                  if (typeof attribute.key.name === 'string') {
                    ;({ name } = attribute.key)
                  } else {
                    name = source.text.slice(...attribute.key.range!)
                  }
                }

                if (attribute.type === 'SvelteShorthandAttribute') {
                  defineGroup('svelte-shorthand')
                  defineGroup('shorthand')
                }

                if (
                  !('value' in attribute) ||
                  (Array.isArray(attribute.value) && !attribute.value.at(0))
                ) {
                  defineGroup('shorthand')
                }

                if (attribute.loc.start.line !== attribute.loc.end.line) {
                  defineGroup('multiline')
                }

                accumulator.at(-1)!.push({
                  size: rangeToDiff(attribute.range),
                  node: attribute as unknown as TSESTree.Node,
                  group: group ?? 'unknown',
                  name,
                })

                return accumulator
              },
              [[]],
            )

          let getGroupNumber = (
            nodeWithGroup: SortingNodeWithGroup<string[]>,
          ): number => {
            for (let i = 0, max = options.groups.length; i < max; i++) {
              let currentGroup = options.groups[i]

              if (
                nodeWithGroup.group === currentGroup ||
                (Array.isArray(currentGroup) &&
                  currentGroup.includes(nodeWithGroup.group))
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

              if (
                leftNum > rightNum ||
                (leftNum === rightNum && compare(left, right, options))
              ) {
                context.report({
                  messageId: 'unexpectedSvelteAttributesOrder',
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
    }
  },
})
