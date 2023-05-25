import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '~/rules/sort-union-types'
import { SortType, SortOrder } from '~/typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser',
  })

  it(`${RULE_NAME}: sorts union types by length`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: [
        {
          code: dedent`
            type Color = 'purple' | 'green' | 'red'
          `,
          options: [
            {
              type: SortType['line-length'],
              order: SortOrder.desc,
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            type Color = 'green' | 'purple' | 'red'
          `,
          output: dedent`
            type Color = 'purple' | 'green' | 'red'
          `,
          options: [
            {
              type: SortType['line-length'],
              order: SortOrder.desc,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                first: "'green'",
                second: "'purple'",
              },
            },
          ],
        },
      ],
    })
  })

  it(`${RULE_NAME}: sorts keyword union types in natural order`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Value =
              | boolean
              | number
              | string
              | any
              | unknown
              | null
              | undefined
              | never
              | void
              | bigint
          `,
          output: dedent`
            type Value =
              | any
              | bigint
              | boolean
              | never
              | null
              | number
              | string
              | undefined
              | unknown
              | void
          `,
          options: [
            {
              type: SortType.natural,
              order: SortOrder.asc,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                first: 'string',
                second: 'any',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                first: 'unknown',
                second: 'null',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                first: 'undefined',
                second: 'never',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                first: 'void',
                second: 'bigint',
              },
            },
          ],
        },
      ],
    })
  })

  it(`${RULE_NAME}: works with generics`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: [],
      invalid: [
        {
          code: "Omit<Color, 'error' | 'warning'>",
          output: "Omit<Color, 'warning' | 'error'>",
          options: [
            {
              type: SortType['line-length'],
              order: SortOrder.desc,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                first: "'error'",
                second: "'warning'",
              },
            },
          ],
        },
      ],
    })
  })

  it(`${RULE_NAME}: works with type references`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: [],
      invalid: [
        {
          code: 'type Status = Error | Success | Warning',
          output: 'type Status = Warning | Success | Error',
          options: [
            {
              type: SortType['line-length'],
              order: SortOrder.desc,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                first: 'Error',
                second: 'Success',
              },
            },
          ],
        },
      ],
    })
  })

  it(`${RULE_NAME}: works with type references`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Response =
              | { code: 403, status: Error }
              | { code: 200, status: Error }
          `,
          output: dedent`
            type Response =
              | { code: 200, status: Error }
              | { code: 403, status: Error }
          `,
          options: [
            {
              type: SortType.natural,
              order: SortOrder.asc,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                first: '{ code: 403, status: Error }',
                second: '{ code: 200, status: Error }',
              },
            },
          ],
        },
      ],
    })
  })
})
