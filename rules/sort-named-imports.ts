import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isPositive } from '../utils/is-positive'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedNamedImportsOrder'

type Options = [
  Partial<{
    groupKind: 'values-first' | 'types-first' | 'mixed'
    type: 'alphabetical' | 'line-length' | 'natural'
    order: 'desc' | 'asc'
    ignoreAlias: boolean
    ignoreCase: boolean
  }>,
]

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-named-imports',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted named imports.',
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
          ignoreAlias: {
            description: 'Controls whether to ignore alias names.',
            type: 'boolean',
          },
          groupKind: {
            description: 'Specifies top-level groups.',
            enum: ['mixed', 'values-first', 'types-first'],
            type: 'string',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedNamedImportsOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreAlias: false,
      ignoreCase: true,
      groupKind: 'mixed',
    },
  ],
  create: context => ({
    ImportDeclaration: node => {
      let specifiers = node.specifiers.filter(
        ({ type }) => type === 'ImportSpecifier',
      )

      if (specifiers.length > 1) {
        let settings = getSettings(context.settings)

        let options = complete(context.options.at(0), settings, {
          type: 'alphabetical',
          ignoreAlias: false,
          groupKind: 'mixed',
          ignoreCase: true,
          order: 'asc',
        } as const)

        let sourceCode = getSourceCode(context)

        let nodes: SortingNode[] = specifiers.map(specifier => {
          let group: undefined | 'value' | 'type'
          let { name } = specifier.local

          if (specifier.type === 'ImportSpecifier' && options.ignoreAlias) {
            ;({ name } = specifier.imported)
          }

          if (
            specifier.type === 'ImportSpecifier' &&
            specifier.importKind === 'type'
          ) {
            group = 'type'
          } else {
            group = 'value'
          }

          return {
            size: rangeToDiff(specifier.range),
            node: specifier,
            group,
            name,
          }
        })

        let shouldGroupByKind = options.groupKind !== 'mixed'
        let groupKindOrder =
          options.groupKind === 'values-first'
            ? ['value', 'type']
            : ['type', 'value']

        pairwise(nodes, (left, right) => {
          let leftNum = getGroupNumber(groupKindOrder, left)
          let rightNum = getGroupNumber(groupKindOrder, right)

          if (
            (shouldGroupByKind && leftNum > rightNum) ||
            ((!shouldGroupByKind || leftNum === rightNum) &&
              isPositive(compare(left, right, options)))
          ) {
            let sortedNodes = shouldGroupByKind
              ? groupKindOrder
                  .map(group => nodes.filter(n => n.group === group))
                  .map(groupedNodes => sortNodes(groupedNodes, options))
                  .flat()
              : sortNodes(nodes, options)

            context.report({
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: left.name,
                right: right.name,
              },
              node: right.node,
              fix: fixer => makeFixes(fixer, nodes, sortedNodes, sourceCode),
            })
          }
        })
      }
    },
  }),
})
