import type {
  RuleTesterInitOptions,
  RuleTester,
} from 'eslint-vitest-rule-tester'
import type { RuleModule } from '@typescript-eslint/utils/ts-eslint'

import { createRuleTester } from 'eslint-vitest-rule-tester'

/**
 * Wrapper for `eslint-vitest-rule-tester` to type-check options.
 *
 * @param options - The typed options for the rule tester.
 * @returns A `RuleTester` instance that can be used to test the rule.
 */
export function createTypedRuleTester<
  MessageId extends string,
  Options extends readonly unknown[],
>(
  options: {
    rule: RuleModule<MessageId, Options>
  } & RuleTesterInitOptions,
): RuleTester<Options, MessageId> {
  return createRuleTester(options)
}
