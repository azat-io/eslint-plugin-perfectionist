import type { TSESTree } from '@typescript-eslint/types'
import type { AST } from 'astro-eslint-parser'

import path from 'node:path'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { isPositive } from '../utils/is-positive'
import { useGroups } from '../utils/use-groups'
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

type MESSAGE_ID = 'unexpectedAstroAttributesOrder'

type Options<T extends string[]> = [
  Partial<{
    customGroups: { [key in T[number]]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    groups: (Group<T>[] | Group<T>)[]
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export const RULE_NAME = 'sort-astro-attributes'

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted Astro attributes',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          customGroups: {
            type: 'object',
          },
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
          ignoreCase: {
            type: 'boolean',
            default: true,
          },
          groups: {
            type: 'array',
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
      type: 'alphabetical',
      order: 'asc',
    },
  ],
  // @ts-ignore
  create: context => {
    if (path.extname(context.filename) !== '.astro') {
      return {}
    }

    return {
      JSXElement: (node: AST.JSXElement) => {
        let { attributes } = node.openingElement

        if (attributes.length > 1) {
          let options = complete(context.options.at(0), {
            type: 'alphabetical',
            ignoreCase: true,
            customGroups: {},
            order: 'asc',
            groups: [],
          } as const)

          let sourceCode = getSourceCode(context)

          let parts: SortingNode[][] = attributes.reduce(
            (accumulator: SortingNode[][], attribute) => {
              if (attribute.type === 'JSXSpreadAttribute') {
                accumulator.push([])
                return accumulator
              }

              let name =
                typeof attribute.name.name === 'string'
                  ? attribute.name.name
                  : sourceCode.text.slice(...attribute.name.range)

              let { getGroup, defineGroup, setCustomGroups } = useGroups(
                options.groups,
              )

              setCustomGroups(options.customGroups, name)

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
                group: getGroup(),
                name,
              })

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
                (leftNum === rightNum &&
                  isPositive(compare(left, right, options)))
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

                    for (let group of Object.keys(grouped).sort(
                      (a, b) => Number(a) - Number(b),
                    )) {
                      sortedNodes.push(...sortNodes(grouped[group], options))
                    }

                    return makeFixes(fixer, nodes, sortedNodes, sourceCode)
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
