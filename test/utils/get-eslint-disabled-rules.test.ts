import { describe, expect, it } from 'vitest'

import { getEslintDisabledRules } from '../../utils/get-eslint-disabled-rules'

let eslintDisableDirectives = [
  'eslint-disable',
  'eslint-enable',
  'eslint-disable-line',
  'eslint-disable-next-line',
] as const

describe('getEslintDisabledRules', () => {
  it.each(eslintDisableDirectives)('detects `%s` for all rules', directive => {
    expect(getEslintDisabledRules(` \n ${directive} \n `)).toStrictEqual({
      eslintDisableDirective: directive,
      rules: 'all',
    })
  })

  it.each(eslintDisableDirectives)(
    'detects `%s` for multiple rules',
    directive => {
      expect(
        getEslintDisabledRules(` \n ${directive} \n rule1 , \n   rule2  `),
      ).toStrictEqual({
        eslintDisableDirective: directive,
        rules: ['rule1', 'rule2'],
      })
    },
  )

  it.each(eslintDisableDirectives)(
    'detects when no rule is entered (`%s`)',
    directive => {
      expect(getEslintDisabledRules(`${directive}1`)).toBeNull()
    },
  )

  it.each(eslintDisableDirectives)(
    'ignores the `--` description suffix (`%s`)',
    directive => {
      expect(
        getEslintDisabledRules(` ${directive} rule1, rule2 -- Keep this. `),
      ).toStrictEqual({
        eslintDisableDirective: directive,
        rules: ['rule1', 'rule2'],
      })
    },
  )

  it.each(eslintDisableDirectives)(
    'detects a bare directive carrying a description (`%s`)',
    directive => {
      expect(
        getEslintDisabledRules(` ${directive} -- Keep this. `),
      ).toStrictEqual({
        eslintDisableDirective: directive,
        rules: 'all',
      })
    },
  )

  it.each(eslintDisableDirectives)(
    'ignores a description introduced by more than two dashes (`%s`)',
    directive => {
      expect(
        getEslintDisabledRules(` ${directive} rule1 ---- Keep this. `),
      ).toStrictEqual({
        eslintDisableDirective: directive,
        rules: ['rule1'],
      })
    },
  )

  it.each(eslintDisableDirectives)(
    'does not read rule names out of a description (`%s`)',
    directive => {
      expect(
        getEslintDisabledRules(` ${directive} rule1 -- Not rule2, rule3. `),
      ).toStrictEqual({
        eslintDisableDirective: directive,
        rules: ['rule1'],
      })
    },
  )

  it.each(eslintDisableDirectives)(
    'ignores a description spread over several lines (`%s`)',
    directive => {
      expect(
        getEslintDisabledRules(` ${directive} rule1 --\n   Keep this. `),
      ).toStrictEqual({
        eslintDisableDirective: directive,
        rules: ['rule1'],
      })
    },
  )

  it.each(eslintDisableDirectives)(
    'ignores an empty description before trimming (`%s`)',
    directive => {
      expect(getEslintDisabledRules(` ${directive} rule1 -- `)).toStrictEqual({
        eslintDisableDirective: directive,
        rules: ['rule1'],
      })
    },
  )

  it.each(eslintDisableDirectives)(
    'keeps dashes that are not followed by whitespace (`%s`)',
    directive => {
      expect(getEslintDisabledRules(` ${directive} rule1 --`)).toStrictEqual({
        eslintDisableDirective: directive,
        rules: ['rule1 --'],
      })

      expect(getEslintDisabledRules(` ${directive} rule1 --x`)).toStrictEqual({
        eslintDisableDirective: directive,
        rules: ['rule1 --x'],
      })
    },
  )

  it.each(eslintDisableDirectives)(
    'keeps dashes that are not preceded by whitespace (`%s`)',
    directive => {
      expect(
        getEslintDisabledRules(` ${directive} rule1-- Keep this. `),
      ).toStrictEqual({
        eslintDisableDirective: directive,
        rules: ['rule1-- Keep this.'],
      })
    },
  )

  it.each(eslintDisableDirectives)(
    'detects a description separated by a line break (`%s`)',
    directive => {
      expect(
        getEslintDisabledRules(`${directive}\n-- Keep this.`),
      ).toStrictEqual({
        eslintDisableDirective: directive,
        rules: 'all',
      })
    },
  )

  it('ignores a comment made of dashes', () => {
    expect(getEslintDisabledRules(' ---- Section ---- ')).toBeNull()
  })
})
