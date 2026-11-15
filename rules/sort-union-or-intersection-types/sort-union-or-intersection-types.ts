import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import type { Options } from '../sort-intersection-types/types'

import {
  type SortUnionOrIntersectionSortingNode,
  type Modifier,
  type Selector,
  allSelectors,
  allModifiers,
} from '../sort-union-types/types'
import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import { validateNewlinesAndPartitionConfig } from '../../utils/validate-newlines-and-partition-config'
import { buildOptionsByGroupIndexComputer } from '../../utils/build-options-by-group-index-computer'
import { validateCustomSortConfig } from '../../utils/validate-custom-sort-config'
import { computeMatchedContextOptions } from './compute-matched-context-options'
import { getEslintDisabledLines } from '../../utils/get-eslint-disabled-lines'
import { doesCustomGroupMatch } from '../../utils/does-custom-group-match'
import { isNodeEslintDisabled } from '../../utils/is-node-eslint-disabled'
import { validateGroupsConfig } from '../../utils/validate-groups-config'
import { typeContainsCallableType } from './type-contains-callable-type'
import { sortNodesByGroups } from '../../utils/sort-nodes-by-groups'
import { reportAllErrors } from '../../utils/report-all-errors'
import { canReportErrors } from '../../utils/can-report-errors'
import { shouldPartition } from '../../utils/should-partition'
import { GroupMatcher } from '../../utils/group-matcher'
import { rangeToDiff } from '../../utils/range-to-diff'
import { getSettings } from '../../utils/get-settings'
import { computeNodeName } from './compute-node-name'
import { complete } from '../../utils/complete'

/**
 * Sorts the members of a union or intersection type.
 *
 * @param params - Parameters.
 * @param params.tokenValueToIgnoreBefore - Separator token skipped before each
 *   member.
 * @param params.matchedAstSelectors - The AST selectors the node matched.
 * @param params.availableMessageIds - The message IDs to report with.
 * @param params.defaultOptions - The rule default options.
 * @param params.context - The rule context.
 * @param params.node - Union or intersection type to sort.
 */
export function sortUnionOrIntersectionTypes<MessageIds extends string>({
  tokenValueToIgnoreBefore,
  matchedAstSelectors,
  availableMessageIds,
  defaultOptions,
  context,
  node,
}: {
  availableMessageIds: {
    missedSpacingBetweenMembers: MessageIds
    extraSpacingBetweenMembers: MessageIds
    unexpectedGroupOrder: MessageIds
    unexpectedOrder: MessageIds
  }
  node: TSESTree.TSIntersectionType | TSESTree.TSUnionType
  context: Readonly<RuleContext<MessageIds, Options>>
  defaultOptions: Required<Options[number]>
  matchedAstSelectors: ReadonlySet<string>
  tokenValueToIgnoreBefore: string
}): void {
  let settings = getSettings(context.settings)

  let matchedContextOptions = computeMatchedContextOptions({
    members: node.types,
    matchedAstSelectors,
    context,
  })

  let options = complete({
    options: matchedContextOptions,
    defaults: defaultOptions,
    settings,
  })
  validateCustomSortConfig(options)
  validateGroupsConfig({
    selectors: allSelectors,
    modifiers: allModifiers,
    options,
  })
  validateNewlinesAndPartitionConfig(options)

  if (
    !canReportErrors({
      comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
      newlinesBetweenValueGetter: undefined,
      canHaveDependencies: false,
      availableMessageIds,
      options,
    })
  ) {
    return
  }

  if (
    options.ignoreCallableTypes &&
    node.types.some(typeContainsCallableType)
  ) {
    return
  }

  let { sourceCode, id } = context
  let groupMatcher = new GroupMatcher({
    allModifiers,
    allSelectors,
    options,
  })
  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: id,
    sourceCode,
  })
  let optionsByGroupIndexComputer = buildOptionsByGroupIndexComputer(options)

  let formattedMembers: SortUnionOrIntersectionSortingNode[][] =
    node.types.reduce(
      (accumulator: SortUnionOrIntersectionSortingNode[][], type) => {
        let selectors: Selector[] = []

        switch (type.type) {
          case AST_NODE_TYPES.TSTemplateLiteralType:
          case AST_NODE_TYPES.TSLiteralType:
            selectors.push('literal')
            break
          case AST_NODE_TYPES.TSIndexedAccessType:
          case AST_NODE_TYPES.TSTypeReference:
          case AST_NODE_TYPES.TSQualifiedName:
          case AST_NODE_TYPES.TSArrayType:
          case AST_NODE_TYPES.TSInferType:
            selectors.push('named')
            break
          case AST_NODE_TYPES.TSIntersectionType:
            selectors.push('intersection')
            break
          case AST_NODE_TYPES.TSUndefinedKeyword:
          case AST_NODE_TYPES.TSNullKeyword:
          case AST_NODE_TYPES.TSVoidKeyword:
            selectors.push('nullish')
            break
          case AST_NODE_TYPES.TSConditionalType:
            selectors.push('conditional')
            break
          case AST_NODE_TYPES.TSConstructorType:
          case AST_NODE_TYPES.TSFunctionType:
            selectors.push('function')
            break
          case AST_NODE_TYPES.TSBooleanKeyword:
          case AST_NODE_TYPES.TSUnknownKeyword:
          case AST_NODE_TYPES.TSBigIntKeyword:
          case AST_NODE_TYPES.TSNumberKeyword:
          case AST_NODE_TYPES.TSObjectKeyword:
          case AST_NODE_TYPES.TSStringKeyword:
          case AST_NODE_TYPES.TSSymbolKeyword:
          case AST_NODE_TYPES.TSNeverKeyword:
          case AST_NODE_TYPES.TSAnyKeyword:
          case AST_NODE_TYPES.TSThisType:
            selectors.push('keyword')
            break
          case AST_NODE_TYPES.TSTypeOperator:
          case AST_NODE_TYPES.TSTypeQuery:
            selectors.push('operator')
            break
          case AST_NODE_TYPES.TSTypeLiteral:
          case AST_NODE_TYPES.TSMappedType:
            selectors.push('object')
            break
          case AST_NODE_TYPES.TSImportType:
            selectors.push('import')
            break
          case AST_NODE_TYPES.TSTupleType:
            selectors.push('tuple')
            break
          case AST_NODE_TYPES.TSUnionType:
            selectors.push('union')
            break
        }

        let name = computeNodeName({
          sourceCode,
          type,
        })

        let modifiers: Modifier[] = []
        let group = groupMatcher.computeGroup({
          customGroupMatcher: customGroup =>
            doesCustomGroupMatch({
              elementName: name,
              customGroup,
              modifiers,
              selectors,
            }),
          selectors,
          modifiers,
        })

        let lastGroup = accumulator.at(-1)
        let lastSortingNode = lastGroup?.at(-1)
        let sortingNode: Omit<
          SortUnionOrIntersectionSortingNode,
          'partitionId'
        > = {
          isEslintDisabled: isNodeEslintDisabled(type, eslintDisabledLines),
          size: rangeToDiff(type, sourceCode),
          node: type,
          group,
          name,
        }

        if (
          shouldPartition({
            tokenValueToIgnoreBefore,
            lastSortingNode,
            sortingNode,
            sourceCode,
            options,
          })
        ) {
          lastGroup = []
          accumulator.push(lastGroup)
        }

        lastGroup?.push({
          ...sortingNode,
          partitionId: accumulator.length,
        })
        return accumulator
      },
      [[]],
    )

  for (let nodes of formattedMembers) {
    reportAllErrors<MessageIds>({
      sortNodesExcludingEslintDisabled:
        createSortNodesExcludingEslintDisabled(nodes),
      availableMessageIds,
      options,
      context,
      nodes,
    })
  }

  function createSortNodesExcludingEslintDisabled(
    sortingNodes: SortUnionOrIntersectionSortingNode[],
  ) {
    return function (
      ignoreEslintDisabledNodes: boolean,
    ): SortUnionOrIntersectionSortingNode[] {
      return sortNodesByGroups({
        comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
        optionsByGroupIndexComputer,
        ignoreEslintDisabledNodes,
        groups: options.groups,
        nodes: sortingNodes,
      })
    }
  }
}
