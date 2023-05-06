import type {
  Range,
  Node,
} from '@typescript-eslint/types/dist/generated/ast-spec'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import { createEslintRule } from '~/utils/create-eslint-rule'

type MESSAGE_ID = 'unexpectedInterfacePropertiesOrder'

type Options = []

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
      unexpectedInterfacePropertiesOrder:
        'Expected "{{second}}" to come before "{{first}}"',
    },
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],
  create: context => ({
    TSInterfaceBody: node => {
      let values = node.body.map(typeElement => {
        let name = ''
        let size = 0

        let inc = (number: number) => {
          size += number
        }

        let rangeToDiff = (range: Range) => {
          let [from, to] = range
          return to - from
        }

        let useKey = (element: {
          key: {
            range: Range
          }
        }) => {
          inc(rangeToDiff(element.key.range))
        }

        let useIndexSignatureKey = (element: {
          parameters: { range: Range }[]
        }) => {
          let { length } = '[]'

          inc(
            element.parameters.reduce(
              (accumulator, { range }) => accumulator + rangeToDiff(range),
              length,
            ),
          )
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

        let setName = (interfaceNode: Node) => {
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
          name,
          size,
        }
      })

      for (let i = 1; i < values.length; i++) {
        let firstIndex = i - 1
        let secondIndex = i
        let first = values.at(firstIndex)!
        let second = values.at(secondIndex)!

        if (first.size < second.size) {
          let sourceCode = context.getSourceCode()
          let firstNode = node.body[firstIndex]
          let secondNode = node.body[secondIndex]

          context.report({
            messageId: 'unexpectedInterfacePropertiesOrder',
            data: {
              first: first.name,
              second: second.name,
            },
            node: secondNode,
            fix: fixer => {
              let getNodeRange = (nodeValue: Node): Range => [
                nodeValue.range.at(0)!,
                nodeValue.range.at(1)!,
              ]

              let fixes = [
                fixer.replaceTextRange(
                  getNodeRange(firstNode),
                  sourceCode.text.slice(...getNodeRange(secondNode)),
                ),
                fixer.replaceTextRange(
                  getNodeRange(secondNode),
                  sourceCode.text.slice(...getNodeRange(firstNode)),
                ),
              ]
              return fixes
            },
          })
        }
      }
    },
  }),
})
