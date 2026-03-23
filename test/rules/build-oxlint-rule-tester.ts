import type { RuleModule } from 'eslint-vitest-rule-tester'

import { RuleTester } from 'oxlint/plugins-dev'
import { it } from 'vitest'

type Language = 'jsx' | 'ts'

/**
 * Builds a rule tester using the OXLint RuleTester.
 *
 * @param rule - The rule module to test.
 * @param lang - The language to use for the tests (default is 'ts').
 * @returns An object with a `run` method to execute the tests.
 */
export function buildOxlintRuleTester(
  rule: RuleModule,
  { lang }: { lang?: Language } = { lang: 'ts' },
): {
  run(name: string, tests: RuleTester.TestCases): void
} {
  RuleTester.it = it

  return {
    run: (name: string, tests: RuleTester.TestCases) => {
      new RuleTester({
        languageOptions: {
          parserOptions: {
            lang,
          },
        },
      }).run(name, rule as Parameters<RuleTester['run']>[1], tests)
    },
  }
}
