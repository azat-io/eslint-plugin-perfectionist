import { createEslintRule } from '~/utils/create-eslint-rule'
import { rangeToDiff } from '~/utils/range-to-diff'
import { sortNodes } from '~/utils/sort-nodes'
import type { SortingNode } from '~/typings'

type MESSAGE_ID = 'unexpectedNamedImportsOrder'

type Options = []

export const RULE_NAME = 'sort-named-imports'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted interface properties',
      recommended: false,
    },
    messages: {
      unexpectedNamedImportsOrder:
        'Expected "{{second}}" to come before "{{first}}"',
    },
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],
  create: context => ({
    ImportDeclaration: node => {
      if (node.specifiers.length > 1) {
        let values: SortingNode[] = node.specifiers.map(specifier => {
          let {
            range,
            local: { name },
          } = specifier
          return {
            size: rangeToDiff(range),
            node: specifier,
            name,
          }
        })

        for (let i = 1; i < values.length; i++) {
          let firstIndex = i - 1
          let secondIndex = i
          let first = values.at(firstIndex)!
          let second = values.at(secondIndex)!

          if (first.size < second.size) {
            let secondNode = node.specifiers[secondIndex]

            context.report({
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                first: first.name,
                second: second.name,
              },
              node: secondNode,
              fix: fixer => {
                let sourceCode = context.getSourceCode()
                let { text } = sourceCode
                return sortNodes(fixer, text, values)
              },
            })
          }
        }
      }
    },
  }),
})
