import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import {
  type SortObjectTypesSortingNode,
  type ObjectTypeParent,
  type Modifier,
  type Selector,
  allModifiers,
  allSelectors,
  type Options,
} from './types'
import { validateNewlinesAndPartitionConfiguration } from '../../utils/validate-newlines-and-partition-configuration'
import { buildOptionsByGroupIndexComputer } from '../../utils/build-options-by-group-index-computer'
import { validateCustomSortConfiguration } from '../../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../../utils/validate-groups-configuration'
import { generatePredefinedGroups } from '../../utils/generate-predefined-groups'
import { computeMatchedContextOptions } from './compute-matched-context-options'
import { getEslintDisabledLines } from '../../utils/get-eslint-disabled-lines'
import { comparatorByOptionsComputer } from './comparator-by-options-computer'
import { doesCustomGroupMatch } from '../../utils/does-custom-group-match'
import { isNodeEslintDisabled } from '../../utils/is-node-eslint-disabled'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { isNodeOnSingleLine } from '../../utils/is-node-on-single-line'
import { sortNodesByGroups } from '../../utils/sort-nodes-by-groups'
import { reportAllErrors } from '../../utils/report-all-errors'
import { shouldPartition } from '../../utils/should-partition'
import { isNodeFunctionType } from './is-node-function-type'
import { computeGroup } from '../../utils/compute-group'
import { isMemberOptional } from './is-member-optional'
import { rangeToDiff } from '../../utils/range-to-diff'
import { getSettings } from '../../utils/get-settings'
import { computeNodeName } from './compute-node-name'
import { defaultOptions } from '../sort-object-types'
import { isSortable } from '../../utils/is-sortable'
import { complete } from '../../utils/complete'

/**
 * Cache computed groups by modifiers and selectors for performance.
 */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

export function sortObjectTypeElements<MessageIds extends string>({
  availableMessageIds,
  matchedAstSelectors,
  parentNodes,
  elements,
  context,
}: {
  availableMessageIds: {
    missedSpacingBetweenMembers: MessageIds
    extraSpacingBetweenMembers: MessageIds
    unexpectedGroupOrder: MessageIds
    unexpectedOrder: MessageIds
  }
  context: RuleContext<MessageIds, Options>
  matchedAstSelectors: ReadonlySet<string>
  elements: TSESTree.TypeElement[]
  parentNodes: ObjectTypeParent[]
}): void {
  if (!isSortable(elements)) {
    return
  }

  let settings = getSettings(context.settings)
  let { sourceCode, id } = context

  let matchedContextOptions = computeMatchedContextOptions({
    matchedAstSelectors,
    parentNodes,
    sourceCode,
    elements,
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

  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: id,
    sourceCode,
  })
  let optionsByGroupIndexComputer = buildOptionsByGroupIndexComputer(options)

  let formattedMembers: SortObjectTypesSortingNode[][] = [[]]
  for (let typeElement of elements) {
    if (
      typeElement.type === AST_NODE_TYPES.TSCallSignatureDeclaration ||
      typeElement.type === AST_NODE_TYPES.TSConstructSignatureDeclaration
    ) {
      formattedMembers.push([])
      continue
    }

    let lastGroup = formattedMembers.at(-1)
    let lastSortingNode = lastGroup?.at(-1)

    let selectors: Selector[] = []
    let modifiers: Modifier[] = []

    if (typeElement.type === AST_NODE_TYPES.TSIndexSignature) {
      selectors.push('index-signature')
    }

    if (isNodeFunctionType(typeElement)) {
      selectors.push('method')
    }

    if (!isNodeOnSingleLine(typeElement)) {
      modifiers.push('multiline')
    }

    if (
      !(['index-signature', 'method'] as const).some(selector =>
        selectors.includes(selector),
      )
    ) {
      selectors.push('property')
    }

    selectors.push('member')

    if (isMemberOptional(typeElement)) {
      modifiers.push('optional')
    } else {
      modifiers.push('required')
    }

    let name = computeNodeName({ node: typeElement, sourceCode })
    let value: string | null = null
    if (
      typeElement.type === AST_NODE_TYPES.TSPropertySignature &&
      typeElement.typeAnnotation
    ) {
      value = sourceCode.getText(typeElement.typeAnnotation.typeAnnotation)
    }

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

    let sortingNode: Omit<SortObjectTypesSortingNode, 'partitionId'> = {
      isEslintDisabled: isNodeEslintDisabled(typeElement, eslintDisabledLines),
      size: rangeToDiff(typeElement, sourceCode),
      addSafetySemicolonWhenInline: true,
      value: value ?? '',
      node: typeElement,
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
      lastGroup = []
      formattedMembers.push(lastGroup)
    }

    lastGroup?.push({
      ...sortingNode,
      partitionId: formattedMembers.length,
    })
  }

  let nodes = formattedMembers.flat()
  reportAllErrors<MessageIds>({
    sortNodesExcludingEslintDisabled,
    availableMessageIds,
    options,
    context,
    nodes,
  })

  function sortNodesExcludingEslintDisabled(
    ignoreEslintDisabledNodes: boolean,
  ): SortObjectTypesSortingNode[] {
    return formattedMembers.flatMap(groupedNodes =>
      sortNodesByGroups({
        isNodeIgnoredForGroup: ({ groupOptions, node }) => {
          switch (groupOptions.sortBy) {
            case 'value':
              return !node.value
            case 'name':
              return false
            /* v8 ignore next 2 -- @preserve Exhaustive guard. */
            default:
              throw new UnreachableCaseError(groupOptions.sortBy)
          }
        },
        optionsByGroupIndexComputer,
        comparatorByOptionsComputer,
        ignoreEslintDisabledNodes,
        groups: options.groups,
        nodes: groupedNodes,
      }),
    )
  }
}
