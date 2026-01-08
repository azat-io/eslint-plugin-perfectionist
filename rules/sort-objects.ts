import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type {
  SortObjectsSortingNode,
  MessageId,
  Modifier,
  Selector,
  Options,
} from './sort-objects/types'

import {
  additionalCustomGroupMatchOptionsJsonSchema,
  additionalSortOptionsJsonSchema,
  DEPENDENCY_ORDER_ERROR_ID,
  MISSED_SPACING_ERROR_ID,
  EXTRA_SPACING_ERROR_ID,
  GROUP_ORDER_ERROR_ID,
  ORDER_ERROR_ID,
  allModifiers,
  allSelectors,
} from './sort-objects/types'
import {
  DEPENDENCY_ORDER_ERROR,
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
} from '../utils/json-schemas/common-partition-json-schemas'
import {
  buildUseConfigurationIfJsonSchema,
  buildCommonJsonSchemas,
} from '../utils/json-schemas/common-json-schemas'
import { computePropertyOrVariableDeclaratorName } from './sort-objects/compute-property-or-variable-declarator-name'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { buildOptionsByGroupIndexComputer } from '../utils/build-options-by-group-index-computer'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { computeMatchedContextOptions } from './sort-objects/compute-matched-context-options'
import { comparatorByOptionsComputer } from './sort-objects/comparator-by-options-computer'
import { scopedRegexJsonSchema } from '../utils/json-schemas/scoped-regex-json-schema'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { computeDependencies } from './sort-objects/compute-dependencies'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { UnreachableCaseError } from '../utils/unreachable-case-error'
import { isNodeOnSingleLine } from '../utils/is-node-on-single-line'
import { isStyleComponent } from './sort-objects/is-style-component'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

/** Cache computed groups by modifiers and selectors for performance. */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

let defaultOptions: Required<Options[number]> = {
  fallbackSort: { type: 'unsorted' },
  newlinesInside: 'newlinesBetween',
  partitionByNewLine: false,
  partitionByComment: false,
  newlinesBetween: 'ignore',
  specialCharacters: 'keep',
  styledComponents: true,
  useConfigurationIf: {},
  type: 'alphabetical',
  ignoreCase: true,
  customGroups: [],
  locales: 'en-US',
  sortBy: 'name',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MessageId>({
  create: context => {
    let settings = getSettings(context.settings)
    let { sourceCode, id } = context

    function sortObject(
      nodeObject: TSESTree.ObjectExpression | TSESTree.ObjectPattern,
    ): void {
      if (!isSortable(nodeObject.properties)) {
        return
      }

      let isDestructuredObject =
        nodeObject.type === AST_NODE_TYPES.ObjectPattern
      let matchedContextOptions = computeMatchedContextOptions({
        isDestructuredObject,
        nodeObject,
        sourceCode,
        context,
      })
      let options = complete(matchedContextOptions, settings, defaultOptions)
      validateCustomSortConfiguration(options)
      validateGroupsConfiguration({
        selectors: allSelectors,
        modifiers: allModifiers,
        options,
      })
      validateNewlinesAndPartitionConfiguration(options)

      if (!options.styledComponents && isStyleComponent(nodeObject)) {
        return
      }

      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: id,
        sourceCode,
      })
      let optionsByGroupIndexComputer =
        buildOptionsByGroupIndexComputer(options)

      let sortingNodeGroups: SortObjectsSortingNode[][] = [[]]
      for (let property of nodeObject.properties) {
        if (
          property.type === AST_NODE_TYPES.SpreadElement ||
          property.type === AST_NODE_TYPES.RestElement
        ) {
          sortingNodeGroups.push([])
          continue
        }

        let lastSortingNode = sortingNodeGroups.at(-1)?.at(-1)

        let selectors: Selector[] = []
        let modifiers: Modifier[] = []

        if (
          property.value.type === AST_NODE_TYPES.ArrowFunctionExpression ||
          property.value.type === AST_NODE_TYPES.FunctionExpression
        ) {
          selectors.push('method')
        } else {
          selectors.push('property')
        }

        selectors.push('member')

        if (!isNodeOnSingleLine(property)) {
          modifiers.push('multiline')
        }

        let name = computePropertyOrVariableDeclaratorName({
          node: property,
          sourceCode,
        })
        let dependencyNames = [name]
        if (isDestructuredObject) {
          dependencyNames = [
            ...new Set(extractNamesFromPattern(property.value)),
          ]
        }

        let value = computeNodeValue({
          isDestructuredObject,
          sourceCode,
          property,
        })

        let predefinedGroups = generatePredefinedGroups({
          cache: cachedGroupsByModifiersAndSelectors,
          selectors,
          modifiers,
        })
        let group = computeGroup({
          customGroupMatcher: customGroup =>
            doesCustomGroupMatch({
              elementValue: value,
              elementName: name,
              customGroup,
              selectors,
              modifiers,
            }),
          predefinedGroups,
          options,
        })

        let sortingNode: Omit<SortObjectsSortingNode, 'partitionId'> = {
          isEslintDisabled: isNodeEslintDisabled(property, eslintDisabledLines),
          dependencies: computeDependencies(property),
          size: rangeToDiff(property, sourceCode),
          value: value ?? '',
          dependencyNames,
          node: property,
          group,
          name,
        }

        if (
          shouldPartition({
            lastSortingNode,
            sortingNode,
            sourceCode,
            options,
          })
        ) {
          sortingNodeGroups.push([])
        }

        sortingNodeGroups.at(-1)!.push({
          ...sortingNode,
          partitionId: sortingNodeGroups.length,
        })
      }

      let sortingNodes = sortingNodeGroups.flat()

      reportAllErrors<MessageId>({
        availableMessageIds: {
          missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
          unexpectedDependencyOrder: DEPENDENCY_ORDER_ERROR_ID,
          extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
          unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
          unexpectedOrder: ORDER_ERROR_ID,
        },
        sortNodesExcludingEslintDisabled,
        nodes: sortingNodes,
        options,
        context,
      })

      function sortNodesExcludingEslintDisabled(
        ignoreEslintDisabledNodes: boolean,
      ): SortObjectsSortingNode[] {
        let nodesSortedByGroups = sortingNodeGroups.flatMap(nodes =>
          sortNodesByGroups({
            comparatorByOptionsComputer,
            optionsByGroupIndexComputer,
            ignoreEslintDisabledNodes,
            groups: options.groups,
            nodes,
          }),
        )

        return sortNodesByDependencies(nodesSortedByGroups, {
          ignoreEslintDisabledNodes,
        })
      }
    }

    return {
      ObjectExpression: sortObject,
      ObjectPattern: sortObject,
    }
  },
  meta: {
    schema: {
      items: {
        properties: {
          ...buildCommonJsonSchemas({
            additionalSortProperties: additionalSortOptionsJsonSchema,
          }),
          ...buildCommonGroupsJsonSchemas({
            additionalCustomGroupMatchProperties:
              additionalCustomGroupMatchOptionsJsonSchema,
            additionalSortProperties: additionalSortOptionsJsonSchema,
          }),
          useConfigurationIf: buildUseConfigurationIfJsonSchema({
            additionalProperties: {
              objectType: {
                description:
                  'Specifies whether to only match destructured objects or regular objects.',
                enum: ['destructured', 'non-destructured'],
                type: 'string',
              },
              hasNumericKeysOnly: {
                description:
                  'Specifies whether to only match objects that have exclusively numeric keys.',
                type: 'boolean',
              },
              declarationCommentMatchesPattern: scopedRegexJsonSchema,
              callingFunctionNamePattern: scopedRegexJsonSchema,
              declarationMatchesPattern: scopedRegexJsonSchema,
            },
          }),
          styledComponents: {
            description: 'Controls whether to sort styled components.',
            type: 'boolean',
          },
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
      uniqueItems: true,
      type: 'array',
    },
    messages: {
      [DEPENDENCY_ORDER_ERROR_ID]: DEPENDENCY_ORDER_ERROR,
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-objects',
      description: 'Enforce sorted objects.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-objects',
})

function extractNamesFromPattern(pattern: TSESTree.Node): string[] {
  switch (pattern.type) {
    case AST_NODE_TYPES.AssignmentPattern:
      return extractNamesFromPattern(pattern.left)
    case AST_NODE_TYPES.ObjectPattern:
      return pattern.properties.flatMap(extractNamesFromObjectPatternProperty)
    case AST_NODE_TYPES.ArrayPattern:
      return pattern.elements.flatMap(extractNamesFromArrayPatternElement)
    case AST_NODE_TYPES.Identifier:
      return [pattern.name]
    /* v8 ignore next 2 */
    default:
      return []
  }

  function extractNamesFromArrayPatternElement(
    element: TSESTree.DestructuringPattern | null,
  ): string[] {
    if (!element) {
      return []
    }

    if (element.type === AST_NODE_TYPES.RestElement) {
      return extractNamesFromPattern(element.argument)
    }

    return extractNamesFromPattern(element)
  }

  function extractNamesFromObjectPatternProperty(
    property: TSESTree.RestElement | TSESTree.Property,
  ): string[] {
    switch (property.type) {
      case AST_NODE_TYPES.RestElement:
        return extractNamesFromPattern(property.argument)
      case AST_NODE_TYPES.Property:
        return extractNamesFromPattern(property.value)
      /* v8 ignore next 2 -- @preserve Exhaustive guard. */
      default:
        throw new UnreachableCaseError(property)
    }
  }
}

function computeNodeValue({
  isDestructuredObject,
  sourceCode,
  property,
}: {
  sourceCode: TSESLint.SourceCode
  isDestructuredObject: boolean
  property: TSESTree.Property
}): string | null {
  switch (property.value.type) {
    case AST_NODE_TYPES.ArrowFunctionExpression:
    case AST_NODE_TYPES.FunctionExpression:
      return null
    case AST_NODE_TYPES.AssignmentPattern:
      return sourceCode.getText(property.value.right)
    default:
      return isDestructuredObject ? null : sourceCode.getText(property.value)
  }
}
