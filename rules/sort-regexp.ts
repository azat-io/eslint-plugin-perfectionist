import type { TSESTree } from '@typescript-eslint/types'

import { parseRegExpLiteral, visitRegExpAST } from '@eslint-community/regexpp'

import type { SortingNode } from '../types/sorting-node'
import type { Options } from './sort-regexp/types'

import {
  buildCustomGroupsArrayJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
} from '../utils/common-json-schemas'
import { buildGetCustomGroupOverriddenOptionsFunction } from '../utils/get-custom-groups-compare-options'
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import { getCharacterClassElementSortKey } from './sort-regexp/get-character-class-element-sort-key'
import {
  singleCustomGroupJsonSchema,
  allModifiers,
  allSelectors,
} from './sort-regexp/types'
import { createCharacterClassSortingNode } from './sort-regexp/create-character-class-sorting-node'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { hasShadowingAlternatives } from './sort-regexp/has-shadowing-alternatives'
import { createFlagSortingNodes } from './sort-regexp/create-flag-sorting-nodes'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isCapturingContext } from './sort-regexp/is-capturing-context'
import { createSortingNode } from './sort-regexp/create-sorting-node'
import { createNodeIndexMap } from '../utils/create-node-index-map'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { ORDER_ERROR } from '../utils/report-errors'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { sortNodes } from '../utils/sort-nodes'
import { pairwise } from '../utils/pairwise'
import { complete } from '../utils/complete'
import { compare } from '../utils/compare'

type SortRegExpSortingNode = SortingNode<TSESTree.Literal>

type ResolvedOptions = Required<Options[0]>

type MessageId = 'unexpectedRegExpOrder'

let defaultOptions: ResolvedOptions = {
  fallbackSort: { type: 'unsorted' },
  specialCharacters: 'keep',
  type: 'alphabetical',
  ignoreAlias: false,
  ignoreCase: true,
  customGroups: [],
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MessageId>({
  create: context => {
    let settings = getSettings(context.settings)
    let options = complete<ResolvedOptions>(
      context.options.at(0),
      settings,
      defaultOptions,
    )

    validateCustomSortConfiguration(options)
    validateGeneratedGroupsConfiguration({
      selectors: allSelectors,
      modifiers: allModifiers,
      options,
    })

    let { sourceCode, id } = context

    function handleLiteral(literalNode: TSESTree.Literal): void {
      if (!('regex' in literalNode)) {
        return
      }

      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: id,
        sourceCode,
      })

      let ast = parseRegExpLiteral(literalNode.raw)

      if (literalNode.regex.flags) {
        let flagNodes = createFlagSortingNodes({
          flags: literalNode.regex.flags,
          eslintDisabledLines,
          literalNode,
        })

        let sortedFlagNodes = sortNodes({
          fallbackSortNodeValueGetter: null,
          ignoreEslintDisabledNodes: false,
          nodeValueGetter: null,
          nodes: flagNodes,
          options,
        })
        let originalFlags = flagNodes.map(node => node.name).join('')
        let sortedFlags = sortedFlagNodes.map(node => node.name).join('')

        if (originalFlags !== sortedFlags) {
          let nodeIndexMap = createNodeIndexMap(sortedFlagNodes)
          let misplacedPair: {
            right: SortRegExpSortingNode
            left: SortRegExpSortingNode
          } = {
            right: sortedFlagNodes.at(0)!,
            left: flagNodes.at(-1)!,
          }

          let isMisplacedPairFound = false

          pairwise(flagNodes, (left, right) => {
            if (isMisplacedPairFound || !left) {
              return
            }

            let leftIndex = nodeIndexMap.get(left)!
            let rightIndex = nodeIndexMap.get(right)!

            if (leftIndex > rightIndex) {
              misplacedPair = { right, left }
              isMisplacedPairFound = true
            }
          })

          let { right, left } = misplacedPair

          context.report({
            fix: fixer => {
              let flagsLength = literalNode.regex.flags.length
              let flagsStart = literalNode.range[1] - flagsLength
              return fixer.replaceTextRange(
                [flagsStart, literalNode.range[1]],
                sortedFlags,
              )
            },
            data: {
              right: right.name,
              left: left.name,
            },
            messageId: 'unexpectedRegExpOrder',
            node: literalNode,
          })
        }
      }

      visitRegExpAST(ast, {
        onAlternativeLeave(alternative) {
          if (
            !isCapturingContext(alternative.parent) ||
            !isSortable(alternative.parent.alternatives)
          ) {
            return
          }

          if (alternative !== alternative.parent.alternatives.at(-1)) {
            return
          }

          if (
            hasShadowingAlternatives({
              alternatives: alternative.parent.alternatives,
            })
          ) {
            return
          }

          let nodes = alternative.parent.alternatives.map(currentAlternative =>
            createSortingNode({
              alternative: currentAlternative,
              eslintDisabledLines,
              literalNode,
              sourceCode,
              options,
            }),
          )

          let getOptionsByGroupIndex =
            buildGetCustomGroupOverriddenOptionsFunction(options)

          function sortAlternatives(
            ignoreEslintDisabledNodes: boolean,
          ): SortRegExpSortingNode[] {
            return sortNodesByGroups({
              ignoreEslintDisabledNodes,
              getOptionsByGroupIndex,
              groups: options.groups,
              nodes,
            })
          }

          let sortedAlternatives = sortAlternatives(false)
          let isAlreadySorted = nodes.every(
            (sortingNode, index) =>
              sortingNode.node === sortedAlternatives.at(index)?.node,
          )

          if (isAlreadySorted) {
            return
          }

          reportAllErrors<MessageId, SortRegExpSortingNode>({
            availableMessageIds: {
              unexpectedGroupOrder: 'unexpectedRegExpOrder',
              unexpectedOrder: 'unexpectedRegExpOrder',
            },
            options: {
              customGroups: options.customGroups,
              newlinesBetween: 'ignore',
              groups: options.groups,
            },
            sortNodesExcludingEslintDisabled: sortAlternatives,
            sourceCode,
            context,
            nodes,
          })
        },
      })

      visitRegExpAST(ast, {
        onCharacterClassLeave(characterClass) {
          let { elements, negate, start, end } = characterClass
          if (!isSortable(elements)) {
            return
          }

          if (options.type === 'unsorted') {
            return
          }

          let sortedElements = [...elements].toSorted((a, b) => {
            let aKey = getCharacterClassElementSortKey(a)
            let bKey = getCharacterClassElementSortKey(b)

            if (
              options.type !== 'line-length' &&
              aKey.category !== bKey.category
            ) {
              let categoryDiff = aKey.category - bKey.category
              return options.order === 'asc' ? categoryDiff : -categoryDiff
            }

            let aNode = createCharacterClassSortingNode({
              literalNode,
              element: a,
            })
            let bNode = createCharacterClassSortingNode({
              literalNode,
              element: b,
            })

            let comparison = compare({
              fallbackSortNodeValueGetter: null,
              nodeValueGetter: null,
              a: aNode,
              b: bNode,
              options,
            })

            if (comparison !== 0) {
              return comparison
            }

            let rawComparison = aKey.raw.localeCompare(
              bKey.raw,
              options.locales,
              {
                sensitivity: options.ignoreCase ? 'base' : 'variant',
                numeric: options.type === 'natural',
              },
            )

            let rawOrderMultiplier = 1
            if (options.type !== 'line-length' && options.order !== 'asc') {
              rawOrderMultiplier = -1
            }

            return rawOrderMultiplier * rawComparison
          })

          let needsSort = elements.some(
            (element, i) => element !== sortedElements[i],
          )

          if (needsSort) {
            let originalRawElements = elements.map(element => element.raw)
            let sortedRawElements = sortedElements.map(element => element.raw)

            let mismatchIndex = originalRawElements.findIndex(
              (raw, index) => raw !== sortedRawElements[index],
            )

            let safeMismatchIndex = Math.max(mismatchIndex, 0)

            let left = originalRawElements[safeMismatchIndex]!
            let right = sortedRawElements[safeMismatchIndex]!

            context.report({
              fix: fixer => {
                let [literalStart] = literalNode.range
                let classStart = literalStart + start
                let classEnd = literalStart + end
                let replacement = negate
                  ? `[^${sortedRawElements.join('')}]`
                  : `[${sortedRawElements.join('')}]`

                return fixer.replaceTextRange(
                  [classStart, classEnd],
                  replacement,
                )
              },
              data: {
                right,
                left,
              },
              messageId: 'unexpectedRegExpOrder',
              node: literalNode,
            })
          }
        },
      })
    }

    return {
      Literal: handleLiteral,
    }
  },
  meta: {
    schema: {
      items: {
        properties: {
          ...commonJsonSchemas,
          ignoreAlias: {
            description: 'Controls whether to ignore alias names.',
            type: 'boolean',
          },
          customGroups: buildCustomGroupsArrayJsonSchema({
            singleCustomGroupJsonSchema,
          }),
          groups: groupsJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
      uniqueItems: true,
      type: 'array',
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-regexp',
      description: 'Enforce sorted regular expressions.',
      recommended: true,
    },
    messages: {
      unexpectedRegExpOrder: ORDER_ERROR,
    },
    defaultOptions: [defaultOptions],
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-regexp',
})
