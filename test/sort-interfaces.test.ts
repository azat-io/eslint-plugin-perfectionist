import { RuleTester } from '@typescript-eslint/utils/dist/ts-eslint/index.js'
import { describe, it } from 'vitest'

import rule, { RULE_NAME } from '~/rules/sort-interfaces'

describe(RULE_NAME, () => {
  let ruleTester = new RuleTester({
    parser: require.resolve('@typescript-eslint/parser'),
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
        `
          interface Interface {
            color: 'purple' | 'blue' | 'green'
            align: 'left' | 'center' | 'right'
          }
        `,
        `
          interface Interface {
            align: 'left' | 'center' | 'right'
            color: 'purple' | 'blue' | 'green'
          }
        `,
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
        `
          interface Interface {
            [key: string]: string
            elementsNum: number
          }
        `,
      ],
      invalid: [
        {
          code: `
            interface Interface {
              elementsNum: number
              [key: string]: number
            }
          `,
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
