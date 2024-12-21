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
})
