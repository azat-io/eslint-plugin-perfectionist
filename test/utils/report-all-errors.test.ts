import { describe, expect, it, vi } from 'vitest'
import { Linter } from 'eslint'

import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { CommonOptions, TypeOption } from '../../types/common-options'
import type * as MakeFixesModule from '../../utils/make-fixes'

import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import { canReportErrors } from '../../utils/report-all-errors'
import rule from '../../rules/sort-objects'

let makeFixesCalls = 0

vi.mock('../../utils/make-fixes', async importOriginal => {
  let original = await importOriginal<typeof MakeFixesModule>()
  return {
    ...original,
    makeFixes: (...parameters: Parameters<typeof original.makeFixes>) => {
      makeFixesCalls++
      return original.makeFixes(...parameters)
    },
  }
})

describe('report-all-errors', () => {
  it('builds the whole-list fix once per unsorted list, not once per report', () => {
    let keys = Array.from(
      { length: 200 },
      (_, index) => `k${String(200 - index).padStart(3, '0')}`,
    )
    let code = `let o = {\n${keys.map(key => `  ${key}: 1,`).join('\n')}\n}\n`
    let linter = new Linter({ configType: 'flat' })

    let messages = linter.verify(code, getConfig(), 'file.js')

    let fixTexts = new Set(messages.map(message => message.fix!.text))

    expect(messages).toHaveLength(199)
    expect(makeFixesCalls).toBe(1)
    expect(fixTexts.size).toBe(1)
  })

  function getConfig(): Linter.Config[] {
    let config: unknown = [
      {
        rules: {
          'perfectionist/sort-objects': [
            'error',
            { type: 'alphabetical', order: 'asc' },
          ],
        },
        plugins: { perfectionist: { rules: { 'sort-objects': rule } } },
        files: ['**/*.js'],
      },
    ]

    return config as Linter.Config[]
  }
})

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
        canHaveDependencies: false,
      }),
    ).toBeFalsy()
  })
})
