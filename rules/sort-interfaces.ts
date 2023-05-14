import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import { createEslintRule } from '~/utils/create-eslint-rule'
import { rangeToDiff } from '~/utils/range-to-diff'
import { SortType, SortOrder } from '~/typings'
import { sortNodes } from '~/utils/sort-nodes'
import type { SortingNode } from '~/typings'
import { complete } from '~/utils/complete'
import { compare } from '~/utils/compare'

type MESSAGE_ID = 'unexpectedInterfacePropertiesOrder'

type Options = [
  Partial<{
    order: SortOrder
    type: SortType
  }>,
]

export const RULE_NAME = 'sort-interfaces'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted interface properties',
      recommended: false,
    },
    messages: {
      unexpectedInterfacePropertiesOrder: 'Expected "{{second}}" to come before "{{first}}"',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: {
            enum: [SortType.natural, SortType['line-length']],
          },
          order: {
            enum: [SortOrder.asc, SortOrder.desc],
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    {
      type: SortType.natural,
      order: SortOrder.asc,
    },
  ],
  create: context => ({
    TSInterfaceBody: node => {
      let options = complete(context.options.at(0), {
        type: SortType.natural,
        order: SortOrder.asc,
      })

      let values: SortingNode[] = node.body.map(typeElement => {
        let name = ''
        let size = 0

        let inc = (number: number) => {
          size += number
        }

        let useKey = (element: {
          key: {
            range: TSESTree.Range
          }
        }) => {
          inc(rangeToDiff(element.key.range))
        }

        let useIndexSignatureKey = (element: { parameters: { range: TSESTree.Range }[] }) => {
          let { length } = '[]'

          inc(element.parameters.reduce((accumulator, { range }) => accumulator + rangeToDiff(range), length))
        }

        let useOptional = (element: { optional?: boolean }) => {
          if (element.optional) {
            let { length } = '?'
            inc(length)
          }
        }

        let useTypeAnnotationRange = (element: {
          typeAnnotation?: {
            range: [number, number]
          }
        }) => {
          let typeAnnotationRange = element.typeAnnotation?.range

          if (typeAnnotationRange) {
            inc(rangeToDiff(typeAnnotationRange))
          }
        }

        let setName = (interfaceNode: TSESTree.Node) => {
          if (interfaceNode.type === AST_NODE_TYPES.Identifier) {
            ;({ name } = interfaceNode)
          } else if (interfaceNode.type === AST_NODE_TYPES.TSIndexSignature) {
            let parameter = interfaceNode.parameters.at(0)

            if (parameter) {
              setName(parameter)
            }
          }
        }

        if (typeElement.type === AST_NODE_TYPES.TSPropertySignature) {
          setName(typeElement.key)
          useKey(typeElement)
          useOptional(typeElement)
          useTypeAnnotationRange(typeElement)
        } else if (typeElement.type === AST_NODE_TYPES.TSIndexSignature) {
          setName(typeElement)
          useIndexSignatureKey(typeElement)
          useTypeAnnotationRange(typeElement)
        }

        return {
          node: typeElement,
          name,
          size,
        }
      })

      for (let i = 1; i < values.length; i++) {
        let firstIndex = i - 1
        let secondIndex = i
        let first = values.at(firstIndex)!
        let second = values.at(secondIndex)!

        if (compare(first, second, options)) {
          let secondNode = node.body[secondIndex]

          context.report({
            messageId: 'unexpectedInterfacePropertiesOrder',
            data: {
              first: first.name,
              second: second.name,
            },
            node: secondNode,
            fix: fixer => {
              let sourceCode = context.getSourceCode()
              let { text } = sourceCode
              return sortNodes(fixer, text, values, options)
            },
          })
        }
      }
    },
  }),
})
