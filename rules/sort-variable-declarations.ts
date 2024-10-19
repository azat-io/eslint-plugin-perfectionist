import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'

import {
  specialCharactersJsonSchema,
  ignoreCaseJsonSchema,
  matcherJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import {
  getFirstUnorderedNodeDependentOn,
  sortNodesByDependencies,
} from '../utils/sort-nodes-by-dependencies'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

type MESSAGE_ID =
  | 'unexpectedVariableDeclarationsDependencyOrder'
  | 'unexpectedVariableDeclarationsOrder'

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    specialCharacters: 'remove' | 'trim' | 'keep'
    matcher: 'minimatch' | 'regex'
    partitionByNewLine: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

const defaultOptions: Required<Options[0]> = {
  type: 'alphabetical',
  ignoreCase: true,
  specialCharacters: 'keep',
  partitionByNewLine: false,
  matcher: 'minimatch',
  partitionByComment: false,
  order: 'asc',
}

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-variable-declarations',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted variable declarations.',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: typeJsonSchema,
          order: orderJsonSchema,
          matcher: matcherJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          partitionByComment: {
            description:
              'Allows you to use comments to separate the variable declarations into logical groups.',
            anyOf: [
              {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              {
                type: 'boolean',
              },
              {
                type: 'string',
              },
            ],
          },
          partitionByNewLine: {
            description:
              'Allows to use spaces to separate the nodes into logical groups.',
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedVariableDeclarationsOrder:
        'Expected "{{right}}" to come before "{{left}}".',
      unexpectedVariableDeclarationsDependencyOrder:
        'Expected dependency "{{right}}" to come before "{{nodeDependentOnRight}}".',
    },
  },
  defaultOptions: [defaultOptions],
  create: context => ({
    VariableDeclaration: node => {
      if (node.declarations.length > 1) {
        let settings = getSettings(context.settings)

        let options = complete(context.options.at(0), settings, {
          ...defaultOptions,
        })

        let sourceCode = getSourceCode(context)
        let partitionComment = options.partitionByComment

        let extractDependencies = (init: TSESTree.Expression): string[] => {
          let dependencies: string[] = []

          let checkNode = (nodeValue: TSESTree.Node) => {
            /**
             * No need to check the body of functions and arrow functions
             */
            if (
              nodeValue.type === 'ArrowFunctionExpression' ||
              nodeValue.type === 'FunctionExpression'
            ) {
              return
            }

            if (nodeValue.type === 'Identifier') {
              dependencies.push(nodeValue.name)
            }

            if (nodeValue.type === 'Property') {
              traverseNode(nodeValue.key)
              traverseNode(nodeValue.value)
            }

            if (nodeValue.type === 'ConditionalExpression') {
              traverseNode(nodeValue.test)
              traverseNode(nodeValue.consequent)
              traverseNode(nodeValue.alternate)
            }

            if (
              'expression' in nodeValue &&
              typeof nodeValue.expression !== 'boolean'
            ) {
              traverseNode(nodeValue.expression)
            }

            if ('object' in nodeValue) {
              traverseNode(nodeValue.object)
            }

            if ('callee' in nodeValue) {
              traverseNode(nodeValue.callee)
            }

            if ('left' in nodeValue) {
              traverseNode(nodeValue.left)
            }

            if ('right' in nodeValue) {
              traverseNode(nodeValue.right as TSESTree.Node)
            }

            if ('elements' in nodeValue) {
              nodeValue.elements
                .filter(currentNode => currentNode !== null)
                .forEach(traverseNode)
            }

            if ('argument' in nodeValue && nodeValue.argument) {
              traverseNode(nodeValue.argument)
            }

            if ('arguments' in nodeValue) {
              nodeValue.arguments.forEach(traverseNode)
            }

            if ('properties' in nodeValue) {
              nodeValue.properties.forEach(traverseNode)
            }

            if ('expressions' in nodeValue) {
              nodeValue.expressions.forEach(traverseNode)
            }
          }

          let traverseNode = (nodeValue: TSESTree.Node) => {
            checkNode(nodeValue)
          }

          traverseNode(init)
          return dependencies
        }

        let formattedMembers = node.declarations.reduce(
          (accumulator: SortingNodeWithDependencies[][], declaration) => {
            let name

            if (
              declaration.id.type === 'ArrayPattern' ||
              declaration.id.type === 'ObjectPattern'
            ) {
              name = sourceCode.text.slice(...declaration.id.range)
            } else {
              ;({ name } = declaration.id)
            }

            let dependencies: string[] = []
            if (declaration.init) {
              dependencies = extractDependencies(declaration.init)
            }

            let lastSortingNode = accumulator.at(-1)?.at(-1)
            let sortingNode: SortingNodeWithDependencies = {
              size: rangeToDiff(declaration.range),
              node: declaration,
              dependencies,
              name,
            }
            if (
              (partitionComment &&
                hasPartitionComment(
                  partitionComment,
                  getCommentsBefore(declaration, sourceCode),
                  options.matcher,
                )) ||
              (options.partitionByNewLine &&
                lastSortingNode &&
                getLinesBetween(sourceCode, lastSortingNode, sortingNode))
            ) {
              accumulator.push([])
            }

            accumulator.at(-1)?.push(sortingNode)

            return accumulator
          },
          [[]],
        )

        let sortedNodes = sortNodesByDependencies(
          formattedMembers.map(nodes => sortNodes(nodes, options)).flat(),
        )
        let nodes = formattedMembers.flat()
        pairwise(nodes, (left, right) => {
          let indexOfLeft = sortedNodes.indexOf(left)
          let indexOfRight = sortedNodes.indexOf(right)
          if (indexOfLeft > indexOfRight) {
            let firstUnorderedNodeDependentOnRight =
              getFirstUnorderedNodeDependentOn(right, nodes)
            context.report({
              messageId: firstUnorderedNodeDependentOnRight
                ? 'unexpectedVariableDeclarationsDependencyOrder'
                : 'unexpectedVariableDeclarationsOrder',
              data: {
                left: toSingleLine(left.name),
                right: toSingleLine(right.name),
                nodeDependentOnRight: firstUnorderedNodeDependentOnRight?.name,
              },
              node: right.node,
              fix: fixer =>
                makeFixes(fixer, nodes, sortedNodes, sourceCode, options),
            })
          }
        })
      }
    },
  }),
})
