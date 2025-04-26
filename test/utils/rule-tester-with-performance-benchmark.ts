import type {
  InvalidTestCase,
  ValidTestCase,
  RunTests,
} from '@typescript-eslint/rule-tester'
import type { RuleTesterConfig } from '@typescript-eslint/rule-tester'
import type { RuleModule } from '@typescript-eslint/utils/ts-eslint'
import type { TSUtils } from '@typescript-eslint/utils'

import { RuleTester } from '@typescript-eslint/rule-tester'
import { expect } from 'vitest'

let DEFAULT_MAX_MS_DURATION = 250

export class RuleTesterWithPerformanceBenchmark extends RuleTester {
  private readonly _defaultMaxMsDuration: number

  public constructor(
    { defaultMaxMsDuration }: { defaultMaxMsDuration?: number } = {},
    testerConfig?: RuleTesterConfig,
  ) {
    super(testerConfig)
    this._defaultMaxMsDuration = defaultMaxMsDuration ?? DEFAULT_MAX_MS_DURATION
  }

  public run<MessageIds extends string, Options extends readonly unknown[]>(
    ruleName: string,
    rule: RuleModule<MessageIds, Options>,
    test: RunTests<TSUtils.NoInfer<MessageIds>, TSUtils.NoInfer<Options>>,
  ): void {
    return super.run(
      ruleName,
      rule,
      populateTestsWithPerformanceBenchmark({
        maxMsDuration: this._defaultMaxMsDuration,
        test,
      }),
    )
  }
}

let populateTestsWithPerformanceBenchmark = <
  MessageIds extends string,
  Options extends readonly unknown[],
>({
  maxMsDuration,
  test,
}: {
  test: RunTests<TSUtils.NoInfer<MessageIds>, TSUtils.NoInfer<Options>>
  maxMsDuration: number
}): RunTests<TSUtils.NoInfer<MessageIds>, TSUtils.NoInfer<Options>> => ({
  valid: test.valid.map(validTest =>
    typeof validTest === 'string'
      ? validTest
      : populateTestWithPerformanceBenchmark(validTest, maxMsDuration),
  ),
  invalid: test.invalid.map(invalidTest =>
    populateTestWithPerformanceBenchmark(invalidTest, maxMsDuration),
  ),
})

let populateTestWithPerformanceBenchmark = <
  MessageIds extends string,
  Options extends readonly unknown[],
  T extends InvalidTestCase<MessageIds, Options> | ValidTestCase<Options>,
>(
  test: T,
  maxMsDuration: number,
): T => {
  let start: number = 0
  return {
    ...test,
    after: () => {
      let end = Number(performance.now().toFixed(0))
      let duration = end - start
      if (test.after) {
        test.after()
      }
      expect(duration, 'Performance benchmark failed').toBeLessThan(
        maxMsDuration,
      )
      console.info(
        `Test ran in ${duration}ms (max allowed: ${maxMsDuration}ms)`,
      )
    },
    before: () => {
      if (test.before) {
        test.before()
      }
      start = Number(performance.now().toFixed(0))
    },
  }
}
