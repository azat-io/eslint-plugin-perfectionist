import type { TSESTree } from '@typescript-eslint/types'
import type { AST } from 'astro-eslint-parser'

import path from 'path'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { rangeToDiff } from '../utils/range-to-diff'
import { SortOrder, SortType } from '../typings'
import { makeFixes } from '../utils/make-fixes'
import { sortNodes } from '../utils/sort-nodes'
import { pairwise } from '../utils/pairwise'
import { complete } from '../utils/complete'
import { compare } from '../utils/compare'

type Group<T extends string[]> =
  | 'astro-shorthand'
  | 'multiline'
  | 'shorthand'
  | 'unknown'
  | T[number]

type SortingNodeWithGroup<T extends string[]> = SortingNode & {
  group: Group<T>
}

type MESSAGE_ID = 'unexpectedAstroAttributesOrder'

type Options<T extends string[]> = [
  Partial<{
    'custom-groups': { [key in T[number]]: string[] | string }
    groups: (Group<T>[] | Group<T>)[]
    'ignore-case': boolean
    order: SortOrder
    type: SortType
  }>,
]

export const RULE_NAME = 'sort-astro-attributes'

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted Astro attributes',
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
      unexpectedAstroAttributesOrder:
        'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: SortType.alphabetical,
      order: SortOrder.asc,
    },
  ],
  // @ts-ignore
  create: context => {
    if (path.extname(context.getFilename()) !== '.astro') {
      return {}
    }

    return {
      JSXElement: (node: AST.JSXElement) => {
        let { attributes } = node.openingElement

        if (attributes.length > 1) {
          let options = complete(context.options.at(0), {
            type: SortType.alphabetical,
            order: SortOrder.asc,
            'ignore-case': false,
            'custom-groups': {},
            groups: [],
          })

          let source = context.getSourceCode()

          let parts: SortingNodeWithGroup<string[]>[][] = attributes.reduce(
            (accumulator: SortingNodeWithGroup<string[]>[][], attribute) => {
              if (attribute.type === 'JSXSpreadAttribute') {
                accumulator.push([])
                return accumulator
              }

              let group: Group<string[]> | undefined

              let defineGroup = (nodeGroup: Group<string[]>) => {
                if (!group && options.groups.flat().includes(nodeGroup)) {
                  group = nodeGroup
                }
              }

              if (attribute.type === 'AstroShorthandAttribute') {
                defineGroup('astro-shorthand')
                defineGroup('shorthand')
              }

              if (attribute.value === null) {
                defineGroup('shorthand')
              }

              if (attribute.loc.start.line !== attribute.loc.end.line) {
                defineGroup('multiline')
              }

              accumulator.at(-1)!.push({
                size: rangeToDiff(attribute.range),
                node: attribute as unknown as TSESTree.Node,
                name:
                  typeof attribute.name.name === 'string'
                    ? attribute.name.name
                    : source.text.slice(...attribute.name.range),
                group: group ?? 'unknown',
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
                  messageId: 'unexpectedAstroAttributesOrder',
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
