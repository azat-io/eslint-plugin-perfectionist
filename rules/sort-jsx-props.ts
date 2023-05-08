import type {
  JSXSpreadAttribute,
  JSXAttribute,
} from '@typescript-eslint/types/dist/generated/ast-spec'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import { createEslintRule } from '~/utils/create-eslint-rule'
import { rangeToDiff } from '~/utils/range-to-diff'
import { sortNodes } from '~/utils/sort-nodes'
import type { SortingNode } from '~/typings'

type MESSAGE_ID = 'unexpectedJSXPropsOrder'

type Options = []

export const RULE_NAME = 'sort-jsx-props'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted interface properties',
      recommended: false,
    },
    messages: {
      unexpectedJSXPropsOrder: 'Expected "{{second}}" to come before "{{first}}"',
    },
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],
  create: context => ({
    JSXElement: node => {
      let parts: JSXAttribute[][] = node.openingElement.attributes.reduce(
        (accumulator: JSXAttribute[][], attribute: JSXSpreadAttribute | JSXAttribute) => {
          if (attribute.type === 'JSXAttribute') {
            accumulator.at(-1)!.push(attribute)
          } else {
            accumulator.push([])
          }
          return accumulator
        },
        [[]],
      )

      parts.forEach(part => {
        let values: SortingNode[] = part.map(attribute => ({
          name:
            attribute.name.type === AST_NODE_TYPES.JSXNamespacedName
              ? `${attribute.name.namespace.name}:${attribute.name.name.name}`
              : attribute.name.name,
          size: rangeToDiff(attribute.range),
          node: attribute,
        }))

        for (let i = 1; i < values.length; i++) {
          let firstIndex = i - 1
          let secondIndex = i
          let first = values.at(firstIndex)!
          let second = values.at(secondIndex)!

          if (first.size < second.size) {
            context.report({
              messageId: 'unexpectedJSXPropsOrder',
              data: {
                first: first.name,
                second: second.name,
              },
              node: second.node,
              fix: fixer => {
                let sourceCode = context.getSourceCode()
                let { text } = sourceCode
                return sortNodes(fixer, text, values)
              },
            })
          }
        }
      })
    },
  }),
})
