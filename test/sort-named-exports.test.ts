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

  let ruleTester = new RuleTester()

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

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              export {
                D,
                A,

                C,

                E,
                B,
              }
            `,
            output: dedent`
              export {
                A,
                D,

                C,

                B,
                E,
              }
            `,
            options: [
              {
                ...options,
                partitionByNewLine: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'D',
                  right: 'A',
                },
              },
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'E',
                  right: 'B',
                },
              },
            ],
          },
        ],
      },
    )

    describe('partition comments', () => {
      ruleTester.run(
        `${ruleName}(${type}): allows to use partition comments`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                export {
                  // Part: A
                  CC,
                  type D,
                  // Not partition comment
                  BBB,
                  // Part: B
                  AAAA,
                  E,
                  // Part: C
                  GG,
                  // Not partition comment
                  FFF,
                }
              `,
              output: dedent`
                export {
                  // Part: A
                  type D,
                  // Not partition comment
                  BBB,
                  CC,
                  // Part: B
                  AAAA,
                  E,
                  // Part: C
                  // Not partition comment
                  FFF,
                  GG,
                }
              `,
              options: [
                {
                  ...options,
                  partitionByComment: 'Part**',
                  groupKind: 'types-first',
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedNamedExportsOrder',
                  data: {
                    left: 'CC',
                    right: 'D',
                  },
                },
                {
                  messageId: 'unexpectedNamedExportsOrder',
                  data: {
                    left: 'GG',
                    right: 'FFF',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows to use all comments as parts`,
        rule,
        {
          valid: [
            {
              code: dedent`
                export {
                  // Comment
                  BB,
                  // Other comment
                  A,
                }
              `,
              options: [
                {
                  ...options,
                  partitionByComment: true,
                },
              ],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows to use multiple partition comments`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                export {
                  /* Partition Comment */
                  // Part: A
                  D,
                  // Part: B
                  AAA,
                  C,
                  BB,
                  /* Other */
                  E,
                }
              `,
              output: dedent`
                export {
                  /* Partition Comment */
                  // Part: A
                  D,
                  // Part: B
                  AAA,
                  BB,
                  C,
                  /* Other */
                  E,
                }
              `,
              options: [
                {
                  ...options,
                  partitionByComment: ['Partition Comment', 'Part: *', 'Other'],
                },
              ],
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
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows to use regex matcher for partition comments`,
        rule,
        {
          valid: [
            {
              code: dedent`
              export {
                E,
                F,
                // I am a partition comment because I don't have f o o
                A,
                B,
              }
            `,
              options: [
                {
                  ...options,
                  matcher: 'regex',
                  partitionByComment: ['^(?!.*foo).*$'],
                },
              ],
            },
          ],
          invalid: [],
        },
      )
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`
              export { _a, b, _c }
            `,
            options: [
              {
                ...options,
                specialCharacters: 'trim',
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to remove special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`
              export { ab, a_c }
            `,
            options: [
              {
                ...options,
                specialCharacters: 'remove',
              },
            ],
          },
        ],
        invalid: [],
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
