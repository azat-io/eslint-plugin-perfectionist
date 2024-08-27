import type { TSESTree } from '@typescript-eslint/types'
import type { AST } from 'svelte-eslint-parser'

import path from 'node:path'

import type { SortingNode } from '../typings'

import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isPositive } from '../utils/is-positive'
import { useGroups } from '../utils/use-groups'
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

type Options<T extends string[]> = [
  Partial<{
    customGroups: { [key in T[number]]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    groups: (Group<T>[] | Group<T>)[]
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: 'sort-svelte-attributes',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted Svelte attributes.',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: {
            description: 'Specifies the sorting method.',
            type: 'string',
            enum: ['alphabetical', 'natural', 'line-length'],
          },
          order: {
            description:
              'Determines whether the sorted items should be in ascending or descending order.',
            type: 'string',
            enum: ['asc', 'desc'],
          },
          ignoreCase: {
            description:
              'Controls whether sorting should be case-sensitive or not.',
            type: 'boolean',
          },
          groups: {
            description: 'Specifies the order of the groups.',
            type: 'array',
            items: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              ],
            },
          },
          customGroups: {
            description: 'Specifies custom groups.',
            type: 'object',
            additionalProperties: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              ],
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedSvelteAttributesOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
      groups: [],
      customGroups: {},
    },
  ],
  create: context => {
    if (path.extname(context.filename) !== '.svelte') {
      return {}
    }

    return {
      SvelteStartTag: (node: AST.SvelteStartTag) => {
        if (node.attributes.length > 1) {
          let settings = getSettings(context.settings)

          let options = complete(context.options.at(0), settings, {
            type: 'alphabetical',
            ignoreCase: true,
            customGroups: {},
            order: 'asc',
            groups: [],
          } as const)

          // Validate groups config
          validateGroupsConfiguration(
            options.groups,
            ['svelte-shorthand', 'multiline', 'shorthand', 'unknown'],
            Object.keys(options.customGroups),
          )

          let sourceCode = getSourceCode(context)

          let parts: SortingNode[][] = node.attributes.reduce(
            (accumulator: SortingNode[][], attribute) => {
              if (attribute.type === 'SvelteSpreadAttribute') {
                accumulator.push([])
                return accumulator
              }

              let name: string

              let { getGroup, defineGroup, setCustomGroups } = useGroups(
                options.groups,
              )

              if (attribute.key.type === 'SvelteSpecialDirectiveKey') {
                name = sourceCode.text.slice(...attribute.key.range)
              } else {
                if (typeof attribute.key.name === 'string') {
                  ;({ name } = attribute.key)
                } else {
                  name = sourceCode.text.slice(...attribute.key.range)
                }
              }

              setCustomGroups(options.customGroups, name)

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
                node: attribute as unknown as TSESTree.Node,
                size: rangeToDiff(attribute.range),
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
                  messageId: 'unexpectedSvelteAttributesOrder',
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
