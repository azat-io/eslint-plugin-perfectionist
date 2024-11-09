import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import {
  specialCharactersJsonSchema,
  customGroupsJsonSchema,
  ignoreCaseJsonSchema,
  localesJsonSchema,
  groupsJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { pairwise } from '../utils/pairwise'
import { complete } from '../utils/complete'
import { matches } from '../utils/matches'

type MESSAGE_ID = 'unexpectedJSXPropsGroupOrder' | 'unexpectedJSXPropsOrder'

type Group<T extends string[]> =
  | 'multiline'
  | 'shorthand'
  | 'unknown'
  | T[number]

type Options<T extends string[]> = [
  Partial<{
    customGroups: { [key in T[number]]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    groups: (Group<T>[] | Group<T>)[]
    ignorePattern: string[]
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

const defaultOptions: Required<Options<string[]>[0]> = {
  type: 'alphabetical',
  ignorePattern: [],
  ignoreCase: true,
  specialCharacters: 'keep',
  customGroups: {},
  order: 'asc',
  groups: [],
  locales: 'en-US',
}

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: 'sort-jsx-props',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted JSX props.',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: typeJsonSchema,
          order: orderJsonSchema,
          locales: localesJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          ignorePattern: {
            description:
              'Specifies names or patterns for nodes that should be ignored by rule.',
            items: {
              type: 'string',
            },
            type: 'array',
          },
          groups: groupsJsonSchema,
          customGroups: customGroupsJsonSchema,
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedJSXPropsGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedJSXPropsOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [defaultOptions],
  create: context => ({
    JSXElement: node => {
      if (node.openingElement.attributes.length <= 1) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)
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
      if (shouldIgnore || node.openingElement.attributes.length <= 1) {
        return
      }

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

          let { getGroup, defineGroup, setCustomGroups } = useGroups(options)

          setCustomGroups(options.customGroups, name)

          if (attribute.value === null) {
            defineGroup('shorthand')
          }

          if (attribute.loc.start.line !== attribute.loc.end.line) {
            defineGroup('multiline')
          }

          let jsxNode = {
            size: rangeToDiff(attribute, sourceCode),
            group: getGroup(),
            node: attribute,
            name,
            requiresEndingSemicolonOrCommaWhenInline: true,
          }

          accumulator.at(-1)!.push(jsxNode)

          return accumulator
        },
        [[]],
      )
      for (let nodes of parts) {
        let sortedNodes = sortNodesByGroups(nodes, options)
        pairwise(nodes, (left, right) => {
          let indexOfLeft = sortedNodes.indexOf(left)
          let indexOfRight = sortedNodes.indexOf(right)
          if (indexOfLeft <= indexOfRight) {
            return
          }

          let leftNum = getGroupNumber(options.groups, left)
          let rightNum = getGroupNumber(options.groups, right)
          context.report({
            messageId:
              leftNum !== rightNum
                ? 'unexpectedJSXPropsGroupOrder'
                : 'unexpectedJSXPropsOrder',
            data: {
              left: left.name,
              leftGroup: left.group,
              right: right.name,
              rightGroup: right.group,
            },
            node: right.node,
            fix: fixer => makeFixes(fixer, nodes, sortedNodes, sourceCode),
          })
        })
      }
    },
  }),
})
