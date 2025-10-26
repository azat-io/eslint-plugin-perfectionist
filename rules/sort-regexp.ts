import type {
  LookaroundAssertion,
  CapturingGroup,
  CharacterClass,
  Alternative,
  Pattern,
  Group,
} from '@eslint-community/regexpp/ast'
import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { parseRegExpLiteral, visitRegExpAST } from '@eslint-community/regexpp'
import { AST_NODE_TYPES } from '@typescript-eslint/types'

import type { Selector, Options } from './sort-regexp/types'
import type { SortingNode } from '../types/sorting-node'

import {
  buildCustomGroupsArrayJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
} from '../utils/common-json-schemas'
import { buildGetCustomGroupOverriddenOptionsFunction } from '../utils/get-custom-groups-compare-options'
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import {
  singleCustomGroupJsonSchema,
  allModifiers,
  allSelectors,
} from './sort-regexp/types'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { createNodeIndexMap } from '../utils/create-node-index-map'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { computeGroup } from '../utils/compute-group'
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

const DIGIT_CHARACTER_PATTERN = /^\p{Nd}$/u
const UPPERCASE_CHARACTER_PATTERN = /^\p{Lu}$/u
const LOWERCASE_CHARACTER_PATTERN = /^\p{Ll}$/u

interface CreateSortingNodeParameters {
  sourceCode: TSESLint.SourceCode
  literalNode: TSESTree.Literal
  eslintDisabledLines: number[]
  alternative: Alternative
  options: ResolvedOptions
}

interface SortingNodeNameParameters {
  alternativeAlias: string | null
  alternative: { raw: string }
  options: ResolvedOptions
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
            let originalRawElements = elements.map(element =>
              getCharacterClassElementRaw(element),
            )
            let sortedRawElements = sortedElements.map(element =>
              getCharacterClassElementRaw(element),
            )

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

interface CharacterClassElementSortKey {
  normalized: string
  category: number
  raw: string
}

function getCharacterClassElementCategory(
  element: CharacterClass['elements'][number],
): number {
  let category = 4

  switch (element.type) {
    case 'CharacterClassRange': {
      if (
        isDigitCharacter(element.min.value) &&
        isDigitCharacter(element.max.value)
      ) {
        category = 0
      } else if (
        isUppercaseCharacter(element.min.value) &&
        isUppercaseCharacter(element.max.value)
      ) {
        category = 1
      } else if (
        isLowercaseCharacter(element.min.value) &&
        isLowercaseCharacter(element.max.value)
      ) {
        category = 2
      } else {
        category = 3
      }

      break
    }
    case 'CharacterSet': {
      switch (element.kind) {
        case 'digit': {
          category = 0

          break
        }
        case 'space': {
          category = 3

          break
        }
        case 'word': {
          category = 2

          break
        }
        // No default
      }

      break
    }
    case 'Character': {
      if (isDigitCharacter(element.value)) {
        category = 0
      } else if (isUppercaseCharacter(element.value)) {
        category = 1
      } else if (isLowercaseCharacter(element.value)) {
        category = 2
      } else {
        category = 3
      }

      break
    }
    /* No default. */
  }

  return category
}

function createSortingNode({
  eslintDisabledLines,
  literalNode,
  alternative,
  sourceCode,
  options,
}: CreateSortingNodeParameters): SortRegExpSortingNode {
  let alternativeAlias = getAlternativeAlias(alternative)
  let selector = getSelector({ alternativeAlias })
  let name = getSortingNodeName({
    alternativeAlias,
    alternative,
    options,
  })

  let group = computeGroup({
    customGroupMatcher: customGroup =>
      doesCustomGroupMatch({
        elementValue: alternative.raw,
        selectors: [selector],
        elementName: name,
        modifiers: [],
        customGroup,
      }),
    predefinedGroups: [selector],
    options,
  })

  let pseudoNode = createPseudoLiteralNode({
    literalNode,
    alternative,
    sourceCode,
  })

  return {
    isEslintDisabled: isNodeEslintDisabled(literalNode, eslintDisabledLines),
    size: pseudoNode.range[1] - pseudoNode.range[0],
    node: pseudoNode,
    partitionId: 0,
    group,
    name,
  }
}

function createPseudoLiteralNode({
  literalNode,
  alternative,
  sourceCode,
}: {
  sourceCode: TSESLint.SourceCode
  literalNode: TSESTree.Literal
  alternative: Alternative
}): TSESTree.Literal {
  let [literalStart] = literalNode.range
  let offsetStart = literalStart + alternative.start
  let offsetEnd = literalStart + alternative.end
  let range: TSESTree.Range = [offsetStart, offsetEnd]
  let loc = {
    start: sourceCode.getLocFromIndex(range[0]),
    end: sourceCode.getLocFromIndex(range[1]),
  }

  return {
    type: AST_NODE_TYPES.Literal,
    value: alternative.raw,
    raw: alternative.raw,
    parent: literalNode,
    range,
    loc,
  } as TSESTree.Literal
}

function getCharacterClassElementValue(
  element: CharacterClass['elements'][number],
): string {
  let rawValue = element.raw

  switch (element.type) {
    case 'CharacterClassRange': {
      rawValue = `${String.fromCodePoint(element.min.value)}-${String.fromCodePoint(
        element.max.value,
      )}`

      break
    }
    case 'CharacterSet': {
      rawValue = `\\${element.kind}`

      break
    }
    case 'Character': {
      rawValue = String.fromCodePoint(element.value)

      break
    }
    /* No default. */
  }

  return rawValue
}

function hasShadowingAlternatives({
  alternatives,
}: {
  alternatives: Alternative[]
}): boolean {
  let rawAlternatives = alternatives.map(alternative => alternative.raw)

  for (let index = 0; index < rawAlternatives.length; index++) {
    let current = rawAlternatives[index]!

    for (let offset = index + 1; offset < rawAlternatives.length; offset++) {
      let other = rawAlternatives[offset]!

      if (doesAlternativeShadowOther(current, other)) {
        return true
      }
    }
  }

  return false
}

function createFlagSortingNodes({
  eslintDisabledLines,
  literalNode,
  flags,
}: {
  eslintDisabledLines: number[]
  literalNode: TSESTree.Literal
  flags: string
}): SortRegExpSortingNode[] {
  let isDisabled = isNodeEslintDisabled(literalNode, eslintDisabledLines)

  return [...flags].map(flag => ({
    isEslintDisabled: isDisabled,
    node: literalNode,
    partitionId: 0,
    group: 'flags',
    name: flag,
    size: 1,
  }))
}

function createCharacterClassSortingNode({
  literalNode,
  element,
}: {
  element: CharacterClass['elements'][number]
  literalNode: TSESTree.Literal
}): SortRegExpSortingNode {
  let key = getCharacterClassElementSortKey(element)

  return {
    group: 'character-class',
    isEslintDisabled: false,
    size: key.raw.length,
    name: key.normalized,
    node: literalNode,
    partitionId: 0,
  }
}

function getAlternativeAlias(alternative: Alternative): string | null {
  let [element] = alternative.elements
  if (element && element.type === 'CapturingGroup' && element.name) {
    return element.name
  }

  if (alternative.parent.type === 'CapturingGroup' && alternative.parent.name) {
    return alternative.parent.name
  }

  return null
}

function doesAlternativeShadowOther(first: string, second: string): boolean {
  if (first.length === 0 || second.length === 0) {
    return true
  }

  if (first.length === second.length) {
    return first === second
  }

  if (first.length < second.length) {
    return second.startsWith(first)
  }

  return first.startsWith(second)
}

function getCharacterClassElementSortKey(
  element: CharacterClass['elements'][number],
): CharacterClassElementSortKey {
  return {
    category: getCharacterClassElementCategory(element),
    normalized: getCharacterClassElementValue(element),
    raw: getCharacterClassElementRaw(element),
  }
}

function getSortingNodeName({
  alternativeAlias,
  alternative,
  options,
}: SortingNodeNameParameters): string {
  if (!options.ignoreAlias && alternativeAlias) {
    return `${alternativeAlias}: ${alternative.raw}`
  }
  return alternative.raw
}

function isCapturingContext(
  node: Alternative['parent'],
): node is LookaroundAssertion | CapturingGroup | Pattern | Group {
  return (
    node.type === 'CapturingGroup' ||
    node.type === 'Group' ||
    node.type === 'Pattern'
  )
}

function getSelector({
  alternativeAlias,
}: {
  alternativeAlias: string | null
}): Selector {
  return alternativeAlias ? 'alias' : 'pattern'
}

function isLowercaseCharacter(value: number): boolean {
  return LOWERCASE_CHARACTER_PATTERN.test(codePointToString(value))
}

function isUppercaseCharacter(value: number): boolean {
  return UPPERCASE_CHARACTER_PATTERN.test(codePointToString(value))
}

function getCharacterClassElementRaw(
  element: CharacterClass['elements'][number],
): string {
  return element.raw
}

function isDigitCharacter(value: number): boolean {
  return DIGIT_CHARACTER_PATTERN.test(codePointToString(value))
}

function codePointToString(value: number): string {
  return String.fromCodePoint(value)
}
