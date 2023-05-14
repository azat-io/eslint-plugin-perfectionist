import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'

import rule, { RULE_NAME } from '~/rules/sort-interfaces'
import { SortType, SortOrder } from '~/typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser',
  })

  it(`${RULE_NAME}: sorts interface properties`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: [],
      invalid: [
        {
          code: `
            interface Interface {
              value: string
              onChange: () => void
            }
          `,
          output: `
            interface Interface {
              onChange: () => void
              value: string
            }
          `,
          errors: [
            {
              messageId: 'unexpectedInterfacePropertiesOrder',
              data: {
                first: 'value',
                second: 'onChange',
              },
            },
          ],
        },
      ],
    })
  })

  it(`${RULE_NAME}: takes into account the presence of an optional operator`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: [
        {
          code: `
            interface Interface {
              color: 'purple' | 'blue' | 'green'
              align: 'left' | 'center' | 'right'
            }
          `,
          options: [
            {
              type: SortType['line-length'],
              order: SortOrder.desc,
            },
          ],
        },
        {
          code: `
            interface Interface {
              align: 'left' | 'center' | 'right'
              color: 'purple' | 'blue' | 'green'
            }
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
          code: `
            interface Interface {
              color: 'purple' | 'blue' | 'green'
              align?: 'left' | 'center' | 'right'
            }
          `,
          output: `
            interface Interface {
              align?: 'left' | 'center' | 'right'
              color: 'purple' | 'blue' | 'green'
            }
          `,
          options: [
            {
              type: SortType['line-length'],
              order: SortOrder.desc,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedInterfacePropertiesOrder',
              data: {
                first: 'color',
                second: 'align',
              },
            },
          ],
        },
      ],
    })
  })

  it(`${RULE_NAME}: checks ts index signature`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: [
        {
          code: `
            interface Interface {
              [key: string]: string
              elementsNum: number
            }
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
          code: `
            interface Interface {
              elementsNum: number
              [key: string]: number
            }
          `,
          options: [
            {
              type: SortType['line-length'],
              order: SortOrder.desc,
            },
          ],
          output: `
            interface Interface {
              [key: string]: number
              elementsNum: number
            }
          `,
          errors: [
            {
              messageId: 'unexpectedInterfacePropertiesOrder',
              data: {
                first: 'elementsNum',
                second: 'key',
              },
            },
          ],
        },
      ],
    })
  })
})
