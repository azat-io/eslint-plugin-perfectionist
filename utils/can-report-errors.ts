import type { ComparatorByOptionsComputer } from './compare/default-comparator-by-options-computer'
import type { NewlinesBetweenValueGetter } from './get-newlines-between-errors'
import type { CommonGroupsOptions } from '../types/common-groups-options'
import type { ReportAllErrorsParameters } from './report-all-errors'
import type { CommonOptions } from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import { getNewlinesBetweenOption } from './get-newlines-between-option'
import { computeComparators } from './compare/compute-comparators'

/**
 * Checks, before sorting nodes are built, whether `reportAllErrors` could
 * report anything for elements using these options.
 *
 * @param params - Parameters.
 * @param params.comparatorByOptionsComputer - The rule's comparator computer.
 * @param params.newlinesBetweenValueGetter - The rule's newlines override, if
 *   any.
 * @param params.availableMessageIds - The message IDs the rule reports with.
 * @param params.canHaveDependencies - Whether elements may depend on each
 *   other.
 * @param params.options - The completed options.
 * @returns True if an error could be reported.
 */
export function canReportErrors<
  MessageIds extends string,
  T extends SortingNode,
  Options extends CommonGroupsOptions<string, unknown, unknown> &
    Pick<CommonOptions, 'fallbackSort'>,
>({
  comparatorByOptionsComputer,
  newlinesBetweenValueGetter,
  availableMessageIds,
  canHaveDependencies,
  options,
}: {
  availableMessageIds: ReportAllErrorsParameters<
    MessageIds,
    T
  >['availableMessageIds']
  newlinesBetweenValueGetter: NewlinesBetweenValueGetter<T> | undefined
  comparatorByOptionsComputer: ComparatorByOptionsComputer<Options, T>
  canHaveDependencies: boolean
  options: Options
}): boolean {
  let hasGroups = options.groups.length > 0

  /* Exhaustive: a new message ID must declare when it can be reported. */
  let canReportByMessageId: Record<
    keyof typeof availableMessageIds,
    () => boolean
  > = {
    unexpectedOrder: () =>
      hasGroups ||
      canHaveDependencies ||
      computeComparators(comparatorByOptionsComputer, options).length > 0,
    unexpectedDependencyOrder: () => canHaveDependencies,
    missedSpacingBetweenMembers: canReportSpacing,
    extraSpacingBetweenMembers: canReportSpacing,
    unexpectedGroupOrder: () => hasGroups,
    missedCommentAbove: () => hasGroups,
  }

  return Object.entries(canReportByMessageId).some(
    ([messageId, canReport]) =>
      availableMessageIds[messageId as keyof typeof availableMessageIds] !==
        undefined && canReport(),
  )

  function canReportSpacing(): boolean {
    return (
      hasGroups ||
      !!newlinesBetweenValueGetter ||
      getNewlinesBetweenOption({
        nextNodeGroupIndex: 0,
        nodeGroupIndex: 0,
        options,
      }) !== 'ignore'
    )
  }
}
