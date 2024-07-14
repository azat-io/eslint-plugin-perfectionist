import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-exports'

describe(RULE_NAME, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester({
    parser: '@typescript-eslint/parser',
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    let options = {
      type: 'alphabetical',
      ignoreCase: false,
      order: 'asc',
    } as const

    ruleTester.run(`${RULE_NAME}(${type}): sorts exports`, rule, {
      valid: [
        {
          code: dedent`
            export { a1 } from 'a'
            export { b1, b2 } from 'b'
            export { c1, c2, c3 } from 'c'
            export { d1, d2 } from 'd'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export { b1, b2 } from 'b'
            export { a1 } from 'a'
            export { d1, d2 } from 'd'
            export { c1, c2, c3 } from 'c'
          `,
          output: dedent`
            export { a1 } from 'a'
            export { b1, b2 } from 'b'
            export { c1, c2, c3 } from 'c'
            export { d1, d2 } from 'd'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'd',
                right: 'c',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): sorts all-exports`, rule, {
      valid: [
        {
          code: dedent`
            export { a1 } from './a'
            export * as b from './b'
            export { c1, c2 } from './c'
            export { d } from './d'
            export * from 'e'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export * as b from './b'
            export { a1 } from './a'
            export { c1, c2 } from './c'
            export * from 'e'
            export { d } from './d'
          `,
          output: dedent`
            export { a1 } from './a'
            export * as b from './b'
            export { c1, c2 } from './c'
            export { d } from './d'
            export * from 'e'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './b',
                right: './a',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'e',
                right: './d',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): works with export aliases`, rule, {
      valid: [
        {
          code: dedent`
            export { a1 as aX } from './a'
            export { default as b } from './b'
            export { c1, c2 } from './c'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export { a1 as aX } from './a'
            export { c1, c2 } from './c'
            export { default as b } from './b'
          `,
          output: dedent`
            export { a1 as aX } from './a'
            export { default as b } from './b'
            export { c1, c2 } from './c'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './c',
                right: './b',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${RULE_NAME}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: false,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${RULE_NAME}(${type}): sorts exports`, rule, {
      valid: [
        {
          code: dedent`
            export { a1 } from 'a'
            export { b1, b2 } from 'b'
            export { c1, c2, c3 } from 'c'
            export { d1, d2 } from 'd'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export { b1, b2 } from 'b'
            export { a1 } from 'a'
            export { d1, d2 } from 'd'
            export { c1, c2, c3 } from 'c'
          `,
          output: dedent`
            export { a1 } from 'a'
            export { b1, b2 } from 'b'
            export { c1, c2, c3 } from 'c'
            export { d1, d2 } from 'd'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'd',
                right: 'c',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): sorts all-exports`, rule, {
      valid: [
        {
          code: dedent`
            export { a1 } from './a'
            export * as b from './b'
            export { c1, c2 } from './c'
            export { d } from './d'
            export * from 'e'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export * as b from './b'
            export { a1 } from './a'
            export { c1, c2 } from './c'
            export * from 'e'
            export { d } from './d'
          `,
          output: dedent`
            export { a1 } from './a'
            export * as b from './b'
            export { c1, c2 } from './c'
            export { d } from './d'
            export * from 'e'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './b',
                right: './a',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'e',
                right: './d',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): works with export aliases`, rule, {
      valid: [
        {
          code: dedent`
            export { a1 as aX } from './a'
            export { default as b } from './b'
            export { c1, c2 } from './c'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export { a1 as aX } from './a'
            export { c1, c2 } from './c'
            export { default as b } from './b'
          `,
          output: dedent`
            export { a1 as aX } from './a'
            export { default as b } from './b'
            export { c1, c2 } from './c'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './c',
                right: './b',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${RULE_NAME}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(`${RULE_NAME}(${type}): sorts exports`, rule, {
      valid: [
        {
          code: dedent`
            export { c1, c2, c3 } from 'c'
            export { b1, b2 } from 'b'
            export { d1, d2 } from 'd'
            export { a1 } from 'a'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export { b1, b2 } from 'b'
            export { a1 } from 'a'
            export { d1, d2 } from 'd'
            export { c1, c2, c3 } from 'c'
          `,
          output: dedent`
            export { c1, c2, c3 } from 'c'
            export { b1, b2 } from 'b'
            export { d1, d2 } from 'd'
            export { a1 } from 'a'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'a',
                right: 'd',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'd',
                right: 'c',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): sorts all-exports`, rule, {
      valid: [
        {
          code: dedent`
            export { c1, c2 } from './c'
            export { a1 } from './a'
            export * as b from './b'
            export { d } from './d'
            export * from 'e'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export * as b from './b'
            export { a1 } from './a'
            export { c1, c2 } from './c'
            export * from 'e'
            export { d } from './d'
          `,
          output: dedent`
            export { c1, c2 } from './c'
            export * as b from './b'
            export { a1 } from './a'
            export { d } from './d'
            export * from 'e'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './a',
                right: './c',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'e',
                right: './d',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): works with export aliases`, rule, {
      valid: [
        {
          code: dedent`
            export { default as b } from './b'
            export { a1 as aX } from './a'
            export { c1, c2 } from './c'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export { a1 as aX } from './a'
            export { c1, c2 } from './c'
            export { default as b } from './b'
          `,
          output: dedent`
            export { default as b } from './b'
            export { a1 as aX } from './a'
            export { c1, c2 } from './c'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './c',
                right: './b',
              },
            },
          ],
        },
      ],
    })
  })

  describe('misc', () => {
    ruleTester.run(
      `${RULE_NAME}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          dedent`
            export { a } from '~/a'
            export { b } from '~/b'
            export { c } from '~/c'
            export { d } from '~/d'
          `,
          {
            code: dedent`
              export { log } from './log'
              export { log10 } from './log10'
              export { log1p } from './log1p'
              export { log2 } from './log2'
            `,
            options: [{}],
          },
        ],
        invalid: [
          {
            code: dedent`
              export { a } from '~/a'
              export { c } from '~/c'
              export { b } from '~/b'
              export { d } from '~/d'
            `,
            output: dedent`
              export { a } from '~/a'
              export { b } from '~/b'
              export { c } from '~/c'
              export { d } from '~/d'
            `,
            errors: [
              {
                messageId: 'unexpectedExportsOrder',
                data: {
                  left: '~/c',
                  right: '~/b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}: ignores exported variables or functions`,
      rule,
      {
        valid: [
          dedent`
            export let a = () => {
              // ...
            }

            export let b = () => {
              // ...
            }

            export let c = ''
          `,
        ],
        invalid: [],
      },
    )
  })
})
