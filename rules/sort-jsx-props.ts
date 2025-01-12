import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../types/sorting-node'

import {
  specialCharactersJsonSchema,
  customGroupsJsonSchema,
  ignoreCaseJsonSchema,
  buildTypeJsonSchema,
  alphabetJsonSchema,
  localesJsonSchema,
  groupsJsonSchema,
  orderJsonSchema,
} from '../utils/common-json-schemas'
import { makeOrderCommentsAfterAndNewlinesFixes } from '../utils/make-order-comments-after-and-newlines-fixes'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { createNodeIndexMap } from '../utils/create-node-index-map'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { useGroups } from '../utils/use-groups'
import { pairwise } from '../utils/pairwise'
import { complete } from '../utils/complete'
import { matches } from '../utils/matches'

type Options<T extends string[]> = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
    customGroups: Record<T[number], string[] | string>
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    groups: (Group<T>[] | Group<T>)[]
    ignorePattern: string[]
    order: 'desc' | 'asc'
    ignoreCase: boolean
    alphabet: string
  }>,
]

type Group<T extends string[]> =
  | 'multiline'
  | 'shorthand'
  | 'unknown'
  | T[number]

type MESSAGE_ID = 'unexpectedJSXPropsGroupOrder' | 'unexpectedJSXPropsOrder'

let defaultOptions: Required<Options<string[]>[0]> = {
  specialCharacters: 'keep',
  type: 'alphabetical',
  ignorePattern: [],
  ignoreCase: true,
  customGroups: {},
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  create: context => ({
    JSXElement: node => {
      if (!isSortable(node.openingElement.attributes)) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)
      validateCustomSortConfiguration(options)
      validateGroupsConfiguration(
        options.groups,
        ['multiline', 'shorthand', 'unknown'],
        Object.keys(options.customGroups),
      )

      let sourceCode = getSourceCode(context)

      let shouldIgnore = false
      if (options.ignorePattern.length) {
        let tagName = sourceCode.getText(node.openingElement.name)
        shouldIgnore = options.ignorePattern.some(pattern =>
          matches(tagName, pattern),
        )
      }
      if (shouldIgnore || !isSortable(node.openingElement.attributes)) {
        return
      }

      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: context.id,
        sourceCode,
      })

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

          let { setCustomGroups, defineGroup, getGroup } = useGroups(options)

          setCustomGroups(options.customGroups, name)

          if (attribute.value === null) {
            defineGroup('shorthand')
          } else if (attribute.loc.start.line !== attribute.loc.end.line) {
            defineGroup('multiline')
          }

          let jsxNode: SortingNode = {
            isEslintDisabled: isNodeEslintDisabled(
              attribute,
              eslintDisabledLines,
            ),
            size: rangeToDiff(attribute, sourceCode),
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
        let sortNodesExcludingEslintDisabled = (
          ignoreEslintDisabledNodes: boolean,
        ): SortingNode[] =>
          sortNodesByGroups(nodes, options, { ignoreEslintDisabledNodes })
        let sortedNodes = sortNodesExcludingEslintDisabled(false)
        let sortedNodesExcludingEslintDisabled =
          sortNodesExcludingEslintDisabled(true)

        let nodeIndexMap = createNodeIndexMap(sortedNodes)

        pairwise(nodes, (left, right) => {
          let leftIndex = nodeIndexMap.get(left)!
          let rightIndex = nodeIndexMap.get(right)!

          let indexOfRightExcludingEslintDisabled =
            sortedNodesExcludingEslintDisabled.indexOf(right)
          if (
            leftIndex < rightIndex &&
            leftIndex < indexOfRightExcludingEslintDisabled
          ) {
            return
          }

          let leftNumber = getGroupNumber(options.groups, left)
          let rightNumber = getGroupNumber(options.groups, right)
          context.report({
            fix: fixer =>
              makeOrderCommentsAfterAndNewlinesFixes({
                sortedNodes: sortedNodesExcludingEslintDisabled,
                sourceCode,
                fixer,
                nodes,
              }),
            data: {
              rightGroup: right.group,
              leftGroup: left.group,
              right: right.name,
              left: left.name,
            },
            messageId:
              leftNumber === rightNumber
                ? 'unexpectedJSXPropsOrder'
                : 'unexpectedJSXPropsGroupOrder',
            node: right.node,
          })
        })
      }
    },
  }),
  meta: {
    schema: [
      {
        properties: {
          ignorePattern: {
            description:
              'Specifies names or patterns for nodes that should be ignored by rule.',
            items: {
              type: 'string',
            },
            type: 'array',
          },
          specialCharacters: specialCharactersJsonSchema,
          customGroups: customGroupsJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          alphabet: alphabetJsonSchema,
          type: buildTypeJsonSchema(),
          locales: localesJsonSchema,
          groups: groupsJsonSchema,
          order: orderJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    messages: {
      unexpectedJSXPropsGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedJSXPropsOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-jsx-props',
      description: 'Enforce sorted JSX props.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-jsx-props',
})
