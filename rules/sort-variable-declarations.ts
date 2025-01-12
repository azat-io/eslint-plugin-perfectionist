import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  ignoreCaseJsonSchema,
  buildTypeJsonSchema,
  alphabetJsonSchema,
  localesJsonSchema,
  orderJsonSchema,
} from '../utils/common-json-schemas'
import {
  getFirstUnorderedNodeDependentOn,
  sortNodesByDependencies,
} from '../utils/sort-nodes-by-dependencies'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { hasPartitionComment } from '../utils/has-partition-comment'
import { createNodeIndexMap } from '../utils/create-node-index-map'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getSourceCode } from '../utils/get-source-code'
import { makeAllFixes } from '../utils/make-all-fixes'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { sortNodes } from '../utils/sort-nodes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

type Options = [
  Partial<{
    partitionByComment:
      | {
          block?: string[] | boolean | string
          line?: string[] | boolean | string
        }
      | string[]
      | boolean
      | string
    type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    partitionByNewLine: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
    alphabet: string
  }>,
]

type MESSAGE_ID =
  | 'unexpectedVariableDeclarationsDependencyOrder'
  | 'unexpectedVariableDeclarationsOrder'

let defaultOptions: Required<Options[0]> = {
  specialCharacters: 'keep',
  partitionByNewLine: false,
  partitionByComment: false,
  type: 'alphabetical',
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
}

export default createEslintRule<Options, MESSAGE_ID>({
  create: context => ({
    VariableDeclaration: node => {
      if (!isSortable(node.declarations)) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)
      validateCustomSortConfiguration(options)

      let sourceCode = getSourceCode(context)
      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: context.id,
        sourceCode,
      })

      let extractDependencies = (init: TSESTree.Expression): string[] => {
        let dependencies: string[] = []

        let checkNode = (nodeValue: TSESTree.Node): void => {
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
            let elements = nodeValue.elements.filter(
              currentNode => currentNode !== null,
            )

            for (let element of elements) {
              traverseNode(element)
            }
          }

          if ('argument' in nodeValue && nodeValue.argument) {
            traverseNode(nodeValue.argument)
          }

          if ('arguments' in nodeValue) {
            for (let argument of nodeValue.arguments) {
              traverseNode(argument)
            }
          }

          if ('properties' in nodeValue) {
            for (let property of nodeValue.properties) {
              traverseNode(property)
            }
          }

          if ('expressions' in nodeValue) {
            for (let nodeExpression of nodeValue.expressions) {
              traverseNode(nodeExpression)
            }
          }
        }

        let traverseNode = (nodeValue: TSESTree.Node): void => {
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
            isEslintDisabled: isNodeEslintDisabled(
              declaration,
              eslintDisabledLines,
            ),
            size: rangeToDiff(declaration, sourceCode),
            node: declaration,
            dependencies,
            name,
          }
          if (
            hasPartitionComment({
              comments: getCommentsBefore({
                node: declaration,
                sourceCode,
              }),
              partitionByComment: options.partitionByComment,
            }) ||
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

      let sortNodesIgnoringEslintDisabledNodes = (
        ignoreEslintDisabledNodes: boolean,
      ): SortingNodeWithDependencies[] =>
        sortNodesByDependencies(
          formattedMembers.flatMap(nodes =>
            sortNodes(nodes, options, {
              ignoreEslintDisabledNodes,
            }),
          ),
          {
            ignoreEslintDisabledNodes,
          },
        )
      let sortedNodes = sortNodesIgnoringEslintDisabledNodes(false)
      let sortedNodesExcludingEslintDisabled =
        sortNodesIgnoringEslintDisabledNodes(true)

      let nodes = formattedMembers.flat()

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

        let firstUnorderedNodeDependentOnRight =
          getFirstUnorderedNodeDependentOn(right, nodes)
        context.report({
          fix: fixer =>
            makeAllFixes({
              sortedNodes: sortedNodesExcludingEslintDisabled,
              sourceCode,
              options,
              fixer,
              nodes,
            }),
          data: {
            nodeDependentOnRight: firstUnorderedNodeDependentOnRight?.name,
            right: toSingleLine(right.name),
            left: toSingleLine(left.name),
          },
          messageId: firstUnorderedNodeDependentOnRight
            ? 'unexpectedVariableDeclarationsDependencyOrder'
            : 'unexpectedVariableDeclarationsOrder',
          node: right.node,
        })
      })
    },
  }),
  meta: {
    schema: [
      {
        properties: {
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the variable declarations into logical groups.',
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          alphabet: alphabetJsonSchema,
          type: buildTypeJsonSchema(),
          locales: localesJsonSchema,
          order: orderJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    messages: {
      unexpectedVariableDeclarationsDependencyOrder:
        'Expected dependency "{{right}}" to come before "{{nodeDependentOnRight}}".',
      unexpectedVariableDeclarationsOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-variable-declarations',
      description: 'Enforce sorted variable declarations.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  name: 'sort-variable-declarations',
  defaultOptions: [defaultOptions],
})
