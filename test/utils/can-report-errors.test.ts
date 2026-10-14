import { describe, expect, it } from 'vitest'

import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { CommonOptions, TypeOption } from '../../types/common-options'

import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import { canReportErrors } from '../../utils/can-report-errors'

describe('canReportErrors', () => {
  let availableMessageIds = {
    missedSpacingBetweenMembers: 'missedSpacing',
    unexpectedGroupOrder: 'unexpectedGroupOrder',
    extraSpacingBetweenMembers: 'extraSpacing',
    missedCommentAbove: 'missedCommentAbove',
    unexpectedOrder: 'unexpectedOrder',
  }
  type Options = CommonGroupsOptions<string, unknown, unknown> &
    CommonOptions<TypeOption>

  function buildOptions(overrides: Partial<Options> = {}): Options {
    return {
      fallbackSort: { type: 'unsorted' },
      newlinesInside: 'newlinesBetween',
      specialCharacters: 'keep',
      newlinesBetween: 'ignore',
      ignoreCase: true,
      customGroups: [],
      locales: 'en-US',
      type: 'unsorted',
      alphabet: '',
      order: 'asc',
      groups: [],
      ...overrides,
    }
  }

  it('returns false when nothing can be reported', () => {
    expect(
      canReportErrors({
        comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
        newlinesBetweenValueGetter: undefined,
        canHaveDependencies: false,
        options: buildOptions(),
        availableMessageIds,
      }),
    ).toBeFalsy()
  })

  it('returns true when elements are sorted', () => {
    expect(
      canReportErrors({
        comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
        options: buildOptions({ type: 'alphabetical' }),
        newlinesBetweenValueGetter: undefined,
        canHaveDependencies: false,
        availableMessageIds,
      }),
    ).toBeTruthy()
  })

  it('returns true when elements are grouped', () => {
    expect(
      canReportErrors({
        comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
        options: buildOptions({ groups: ['a'] }),
        newlinesBetweenValueGetter: undefined,
        canHaveDependencies: false,
        availableMessageIds,
      }),
    ).toBeTruthy()
  })

  it('returns true when newlines are enforced or overridden', () => {
    expect(
      canReportErrors({
        comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
        options: buildOptions({ newlinesInside: 1 }),
        newlinesBetweenValueGetter: undefined,
        canHaveDependencies: false,
        availableMessageIds,
      }),
    ).toBeTruthy()
    expect(
      canReportErrors({
        comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
        newlinesBetweenValueGetter: () => 1,
        canHaveDependencies: false,
        options: buildOptions(),
        availableMessageIds,
      }),
    ).toBeTruthy()
  })

  it('returns true when dependencies can be reported', () => {
    expect(
      canReportErrors({
        availableMessageIds: {
          ...availableMessageIds,
          unexpectedDependencyOrder: 'unexpectedDependencyOrder',
        },
        comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
        newlinesBetweenValueGetter: undefined,
        canHaveDependencies: true,
        options: buildOptions(),
      }),
    ).toBeTruthy()
  })

  it('ignores errors the rule does not report', () => {
    expect(
      canReportErrors({
        availableMessageIds: {
          unexpectedGroupOrder: 'unexpectedGroupOrder',
          unexpectedOrder: 'unexpectedOrder',
        },
        comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
        options: buildOptions({ newlinesInside: 1 }),
        newlinesBetweenValueGetter: undefined,
        canHaveDependencies: false,
      }),
    ).toBeFalsy()
  })
})
