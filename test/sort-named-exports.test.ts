import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule from '../rules/sort-named-exports'

let ruleName = 'sort-named-exports'

describe(ruleName, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester({
    parser: '@typescript-eslint/parser',
  })

  describe(`${ruleName}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    let options = {
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts named exports`, rule, {
      valid: [
        {
          code: 'export { aaa, bb, c }',
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export {
              aaa,
              c,
              bb
            }
          `,
          output: dedent`
            export {
              aaa,
              bb,
              c
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedExportsOrder',
              data: {
                left: 'c',
                right: 'bb',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}: sorts named exports grouping by their kind`,
      rule,
      {
        valid: [
          {
            code: dedent`
              export { AAA, type BB, BB, type C }
            `,
            options: [{ ...options, groupKind: 'mixed' }],
          },
          {
            code: dedent`
              export { AAA, BB, type BB, type C }
            `,
            options: [{ ...options, groupKind: 'values-first' }],
          },
          {
            code: dedent`
              export { type BB, type C, AAA, BB }
            `,
            options: [{ ...options, groupKind: 'types-first' }],
          },
        ],
        invalid: [
          {
            code: dedent`
              export { AAA, type C, type BB, BB }
            `,
            output: dedent`
              export { AAA, type BB, BB, type C }
            `,
            options: [{ ...options, groupKind: 'mixed' }],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'C',
                  right: 'BB',
                },
              },
            ],
          },
          {
            code: dedent`
              export { type BB, AAA, type C, BB }
            `,
            output: dedent`
              export { AAA, BB, type BB, type C }
            `,
            options: [{ ...options, groupKind: 'values-first' }],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'BB',
                  right: 'AAA',
                },
              },
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'C',
                  right: 'BB',
                },
              },
            ],
          },
          {
            code: dedent`
              export { type BB, AAA, type C, BB }
            `,
            output: dedent`
              export { type BB, type C, AAA, BB }
            `,
            options: [{ ...options, groupKind: 'types-first' }],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'AAA',
                  right: 'C',
                },
              },
            ],
          },
        ],
      },
    )
  })

  describe(`${ruleName}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts named exports`, rule, {
      valid: [
        {
          code: 'export { aaa, bb, c }',
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export {
              aaa,
              c,
              bb
            }
          `,
          output: dedent`
            export {
              aaa,
              bb,
              c
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedExportsOrder',
              data: {
                left: 'c',
                right: 'bb',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}: sorts named exports grouping by their kind`,
      rule,
      {
        valid: [
          {
            code: dedent`
              export { AAA, type BB, BB, type C }
            `,
            options: [{ ...options, groupKind: 'mixed' }],
          },
          {
            code: dedent`
              export { AAA, BB, type BB, type C }
            `,
            options: [{ ...options, groupKind: 'values-first' }],
          },
          {
            code: dedent`
              export { type BB, type C, AAA, BB }
            `,
            options: [{ ...options, groupKind: 'types-first' }],
          },
        ],
        invalid: [
          {
            code: dedent`
              export { AAA, type C, type BB, BB }
            `,
            output: dedent`
              export { AAA, type BB, BB, type C }
            `,
            options: [{ ...options, groupKind: 'mixed' }],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'C',
                  right: 'BB',
                },
              },
            ],
          },
          {
            code: dedent`
              export { type BB, AAA, type C, BB }
            `,
            output: dedent`
              export { AAA, BB, type BB, type C }
            `,
            options: [{ ...options, groupKind: 'values-first' }],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'BB',
                  right: 'AAA',
                },
              },
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'C',
                  right: 'BB',
                },
              },
            ],
          },
          {
            code: dedent`
              export { type BB, AAA, type C, BB }
            `,
            output: dedent`
              export { type BB, type C, AAA, BB }
            `,
            options: [{ ...options, groupKind: 'types-first' }],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'AAA',
                  right: 'C',
                },
              },
            ],
          },
        ],
      },
    )
  })

  describe(`${ruleName}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts named exports`, rule, {
      valid: [
        {
          code: 'export { aaa, bb, c }',
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export {
              aaa,
              c,
              bb
            }
          `,
          output: dedent`
            export {
              aaa,
              bb,
              c
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedExportsOrder',
              data: {
                left: 'c',
                right: 'bb',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}: sorts named exports grouping by their kind`,
      rule,
      {
        valid: [
          {
            code: dedent`
              export { type BB, type C, AAA, BB }
            `,
            options: [{ ...options, groupKind: 'mixed' }],
          },
          {
            code: dedent`
              export { AAA, BB, type BB, type C }
            `,
            options: [{ ...options, groupKind: 'values-first' }],
          },
          {
            code: dedent`
              export { type BB, type C, AAA, BB }
            `,
            options: [{ ...options, groupKind: 'types-first' }],
          },
        ],
        invalid: [
          {
            code: dedent`
              export { AAA, type C, type BB, BB }
            `,
            output: dedent`
              export { type BB, type C, AAA, BB }
            `,
            options: [{ ...options, groupKind: 'mixed' }],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'AAA',
                  right: 'C',
                },
              },
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'C',
                  right: 'BB',
                },
              },
            ],
          },
          {
            code: dedent`
              export { type BB, AAA, type C, BB }
            `,
            output: dedent`
              export { AAA, BB, type BB, type C }
            `,
            options: [{ ...options, groupKind: 'values-first' }],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'BB',
                  right: 'AAA',
                },
              },
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'C',
                  right: 'BB',
                },
              },
            ],
          },
          {
            code: dedent`
              export { type BB, AAA, type C, BB }
            `,
            output: dedent`
              export { type BB, type C, AAA, BB }
            `,
            options: [{ ...options, groupKind: 'types-first' }],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'AAA',
                  right: 'C',
                },
              },
            ],
          },
        ],
      },
    )
  })

  describe(`${ruleName}: misc`, () => {
    ruleTester.run(
      `${ruleName}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          'export { A, B }',
          {
            code: 'export { log, log10, log1p, log2 }',
            options: [{}],
          },
        ],
        invalid: [
          {
            code: dedent`
              export { B, A }
            `,
            output: dedent`
              export { A, B }
            `,
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
            ],
          },
        ],
      },
    )
  })
})
