import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import type { Options } from '../rules/sort-enums'

import rule from '../rules/sort-enums'

let ruleName = 'sort-enums'

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

    ruleTester.run(`${ruleName}(${type}): sorts enum members`, rule, {
      valid: [
        {
          code: dedent`
            enum Enum {
              aaaa = 'a',
              bbb = 'b',
              cc = 'c',
              d = 'd',
            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            enum Enum {
              aaaa = 'a',
              cc = 'c',
              bbb = 'b',
              d = 'd',
            }
          `,
          output: dedent`
            enum Enum {
              aaaa = 'a',
              bbb = 'b',
              cc = 'c',
              d = 'd',
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'cc',
                right: 'bbb',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts enum members with number keys`,
      rule,
      {
        valid: [
          {
            code: dedent`
              enum Enum {
                1 = 'a',
                12 = 'b',
                2 = 'c',
                8 = 'c',
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              enum Enum {
                1 = 'a',
                2 = 'c',
                8 = 'c',
                12 = 'b',
              }
            `,
            output: dedent`
              enum Enum {
                1 = 'a',
                12 = 'b',
                2 = 'c',
                8 = 'c',
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: '8',
                  right: '12',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): doesn't sorts enum members without initializer`,
      rule,
      {
        valid: [
          {
            code: dedent`
              enum Enum {
                aaa,
                bb = 'bb',
                c,
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts enum members with boolean ids`,
      rule,
      {
        valid: [
          {
            code: dedent`
              enum Enum {
                false = 'b',
                true = 'a',
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              enum Enum {
                true = 'a',
                false = 'b',
              }
            `,
            output: dedent`
              enum Enum {
                false = 'b',
                true = 'a',
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'true',
                  right: 'false',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break interface docs`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              enum Enum {
                /**
                 * Comment B
                 */
                b = 'b',
                /**
                 * Comment A
                 */
                'aaa' = 'a',
              }
            `,
            output: dedent`
              enum Enum {
                /**
                 * Comment A
                 */
                'aaa' = 'a',
                /**
                 * Comment B
                 */
                b = 'b',
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'b',
                  right: 'aaa',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not sort enums with implicit values`,
      rule,
      {
        valid: [
          {
            code: dedent`
              export enum Enum {
                d, // implicit value: 0
                cc, // implicit value: 1
                bbb, // implicit value: 2
                aaaa, // implicit value: 3
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use partition comments`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              enum Enum {
                // Part: A
                cc = 'c',
                d = 'd',
                // Not partition comment
                bbb = 'b',
                // Part: B
                aaaa = 'a',
                e = 'e',
                // Part: C
                'gg' = 'g',
                // Not partition comment
                fff = 'f',
              }
            `,
            output: dedent`
              enum Enum {
                // Part: A
                // Not partition comment
                bbb = 'b',
                cc = 'c',
                d = 'd',
                // Part: B
                aaaa = 'a',
                e = 'e',
                // Part: C
                // Not partition comment
                fff = 'f',
                'gg' = 'g',
              }
            `,
            options: [
              {
                ...options,
                partitionByComment: 'Part**',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'd',
                  right: 'bbb',
                },
              },
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'gg',
                  right: 'fff',
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
              enum Enum {
                // Comment
                bb = 'b',
                // Other comment
                a = 'a',
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
              enum Enum {
                /* Partition Comment */
                // Part: A
                d = 'd',
                // Part: B
                aaa = 'a',
                c = 'c',
                bb = 'b',
                /* Other */
                e = 'e',
              }
            `,
            output: dedent`
              enum Enum {
                /* Partition Comment */
                // Part: A
                d = 'd',
                // Part: B
                aaa = 'a',
                bb = 'b',
                c = 'c',
                /* Other */
                e = 'e',
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
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'c',
                  right: 'bb',
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
              enum Enum {
                E = 'E',
                F = 'F',
                // I am a partition comment because I don't have f o o
                A = 'A',
                B = 'B',
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

    ruleTester.run(`${ruleName}: sort enum values correctly`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            enum Enum {
              'a' = 'i',
              'b' = 'h',
              'c' = 'g',
              'd' = 'f',
              'e' = 'e',
              'f' = 'd',
              'g' = 'c',
              'h' = 'b',
              'i' = 'a',
              'j' = null,
              'k' = undefined,
            }
          `,
          output: dedent`
            enum Enum {
              'j' = null,
              'k' = undefined,
              'i' = 'a',
              'h' = 'b',
              'g' = 'c',
              'f' = 'd',
              'e' = 'e',
              'd' = 'f',
              'c' = 'g',
              'b' = 'h',
              'a' = 'i',
            }
          `,
          options: [
            {
              ...options,
              sortByValue: true,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'a',
                right: 'b',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'b',
                right: 'c',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'c',
                right: 'd',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'd',
                right: 'e',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'e',
                right: 'f',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'f',
                right: 'g',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'g',
                right: 'h',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'h',
                right: 'i',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'i',
                right: 'j',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`
              enum Enum {
                _A = 'A',
                B = 'B',
                _C = 'C',
              }
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
              enum Enum {
                AB = 'AB',
                A_C = 'AC',
              }
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

    ruleTester.run(
      `${ruleName}(${type}): sorts inline elements correctly`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              enum Enum {
                B = "B", A = "A"
              }
            `,
            output: dedent`
              enum Enum {
                A = "A", B = "B"
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
            ],
          },
          {
            code: dedent`
              enum Enum {
                B = "B", A = "A",
              }
            `,
            output: dedent`
              enum Enum {
                A = "A", B = "B",
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
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

  describe(`${ruleName}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts enum members`, rule, {
      valid: [
        {
          code: dedent`
            enum Enum {
              aaaa = 'a',
              bbb = 'b',
              cc = 'c',
              d = 'd',
            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            enum Enum {
              aaaa = 'a',
              cc = 'c',
              bbb = 'b',
              d = 'd',
            }
          `,
          output: dedent`
            enum Enum {
              aaaa = 'a',
              bbb = 'b',
              cc = 'c',
              d = 'd',
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'cc',
                right: 'bbb',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts enum members with number keys`,
      rule,
      {
        valid: [
          {
            code: dedent`
              enum Enum {
                1 = 'a',
                2 = 'c',
                8 = 'c',
                12 = 'b',
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              enum Enum {
                1 = 'a',
                12 = 'b',
                2 = 'c',
                8 = 'c',
              }
            `,
            output: dedent`
              enum Enum {
                1 = 'a',
                2 = 'c',
                8 = 'c',
                12 = 'b',
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: '12',
                  right: '2',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): doesn't sorts enum members without initializer`,
      rule,
      {
        valid: [
          {
            code: dedent`
              enum Enum {
                aaa,
                bb = 'bb',
                c,
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts enum members with boolean ids`,
      rule,
      {
        valid: [
          {
            code: dedent`
              enum Enum {
                false = 'b',
                true = 'a',
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              enum Enum {
                true = 'a',
                false = 'b',
              }
            `,
            output: dedent`
              enum Enum {
                false = 'b',
                true = 'a',
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'true',
                  right: 'false',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break interface docs`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              enum Enum {
                /**
                 * Comment B
                 */
                b = 'b',
                /**
                 * Comment A
                 */
                'aaa' = 'a',
              }
            `,
            output: dedent`
              enum Enum {
                /**
                 * Comment A
                 */
                'aaa' = 'a',
                /**
                 * Comment B
                 */
                b = 'b',
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'b',
                  right: 'aaa',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not sort enums with implicit values`,
      rule,
      {
        valid: [
          {
            code: dedent`
              export enum Enum {
                d, // implicit value: 0
                cc, // implicit value: 1
                bbb, // implicit value: 2
                aaaa, // implicit value: 3
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use partition comments`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              enum Enum {
                // Part: A
                cc = 'c',
                d = 'd',
                // Not partition comment
                bbb = 'b',
                // Part: B
                aaaa = 'a',
                e = 'e',
                // Part: C
                'gg' = 'g',
                // Not partition comment
                fff = 'f',
              }
            `,
            output: dedent`
              enum Enum {
                // Part: A
                // Not partition comment
                bbb = 'b',
                cc = 'c',
                d = 'd',
                // Part: B
                aaaa = 'a',
                e = 'e',
                // Part: C
                // Not partition comment
                fff = 'f',
                'gg' = 'g',
              }
            `,
            options: [
              {
                ...options,
                partitionByComment: 'Part**',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'd',
                  right: 'bbb',
                },
              },
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'gg',
                  right: 'fff',
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
              enum Enum {
                // Comment
                bb = 'b',
                // Other comment
                a = 'a',
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
              enum Enum {
                /* Partition Comment */
                // Part: A
                d = 'd',
                // Part: B
                aaa = 'a',
                c = 'c',
                bb = 'b',
                /* Other */
                e = 'e',
              }
            `,
            output: dedent`
              enum Enum {
                /* Partition Comment */
                // Part: A
                d = 'd',
                // Part: B
                aaa = 'a',
                bb = 'b',
                c = 'c',
                /* Other */
                e = 'e',
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
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'c',
                  right: 'bb',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}: sort enum values correctly`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            enum Enum {
              'a' = 'ffffff',
              'b' = 4444,
              'c' = 6,
              'd' = 5,
              'e' = 4,
              'f' = '3',
              'g' = 2,
              'h' = 1,
              'i' = '',
              'j' = null,
              'k' = undefined,
            }
          `,
          output: dedent`
            enum Enum {
              'i' = '',
              'j' = null,
              'k' = undefined,
              'h' = 1,
              'g' = 2,
              'f' = '3',
              'e' = 4,
              'd' = 5,
              'c' = 6,
              'b' = 4444,
              'a' = 'ffffff',
            }
          `,
          options: [
            {
              ...options,
              sortByValue: true,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'a',
                right: 'b',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'b',
                right: 'c',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'c',
                right: 'd',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'd',
                right: 'e',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'e',
                right: 'f',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'f',
                right: 'g',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'g',
                right: 'h',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'h',
                right: 'i',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${ruleName}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts enum members`, rule, {
      valid: [
        {
          code: dedent`
            enum Enum {
              aaaa = 'a',
              bbb = 'b',
              cc = 'c',
              d = 'd',
            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            enum Enum {
              aaaa = 'a',
              cc = 'c',
              bbb = 'b',
              d = 'd',
            }
          `,
          output: dedent`
            enum Enum {
              aaaa = 'a',
              bbb = 'b',
              cc = 'c',
              d = 'd',
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'cc',
                right: 'bbb',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts enum members with number keys`,
      rule,
      {
        valid: [
          {
            code: dedent`
              enum Enum {
                12 = 'b',
                1 = 'a',
                2 = 'c',
                8 = 'c',
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              enum Enum {
                1 = 'a',
                12 = 'b',
                2 = 'c',
                8 = 'c',
              }
            `,
            output: dedent`
              enum Enum {
                12 = 'b',
                1 = 'a',
                2 = 'c',
                8 = 'c',
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: '1',
                  right: '12',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): doesn't sorts enum members without initializer`,
      rule,
      {
        valid: [
          {
            code: dedent`
              enum Enum {
                aaa,
                bb = 'bb',
                c,
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts enum members with boolean ids`,
      rule,
      {
        valid: [
          {
            code: dedent`
              enum Enum {
                false = 'b',
                true = 'a',
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              enum Enum {
                true = 'a',
                false = 'b',
              }
            `,
            output: dedent`
              enum Enum {
                false = 'b',
                true = 'a',
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'true',
                  right: 'false',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break interface docs`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              enum Enum {
                /**
                 * Comment B
                 */
                b = 'b',
                /**
                 * Comment A
                 */
                'aaa' = 'a',
              }
            `,
            output: dedent`
              enum Enum {
                /**
                 * Comment A
                 */
                'aaa' = 'a',
                /**
                 * Comment B
                 */
                b = 'b',
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'b',
                  right: 'aaa',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not sort enums with implicit values`,
      rule,
      {
        valid: [
          {
            code: dedent`
              export enum Enum {
                d, // implicit value: 0
                cc, // implicit value: 1
                bbb, // implicit value: 2
                aaaa, // implicit value: 3
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use partition comments`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              enum Enum {
                // Part: A
                cc = 'c',
                d = 'd',
                // Not partition comment
                bbb = 'b',
                // Part: B
                aaaa = 'a',
                e = 'e',
                // Part: C
                'gg' = 'g',
                // Not partition comment
                fff = 'f',
              }
            `,
            output: dedent`
              enum Enum {
                // Part: A
                // Not partition comment
                bbb = 'b',
                cc = 'c',
                d = 'd',
                // Part: B
                aaaa = 'a',
                e = 'e',
                // Part: C
                'gg' = 'g',
                // Not partition comment
                fff = 'f',
              }
            `,
            options: [
              {
                ...options,
                partitionByComment: 'Part**',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'd',
                  right: 'bbb',
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
              enum Enum {
                // Comment
                bb = 'b',
                // Other comment
                a = 'a',
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
              enum Enum {
                /* Partition Comment */
                // Part: A
                d = 'd',
                // Part: B
                aaa = 'a',
                c = 'c',
                bb = 'b',
                /* Other */
                e = 'e',
              }
            `,
            output: dedent`
              enum Enum {
                /* Partition Comment */
                // Part: A
                d = 'd',
                // Part: B
                aaa = 'a',
                bb = 'b',
                c = 'c',
                /* Other */
                e = 'e',
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
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'c',
                  right: 'bb',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}: sort enum values correctly`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            enum Enum {
              'a' = '',
              'b' = 'b',
              'c' = 'cc',
              'd' = 'ddd',
              'e' = 'eeee',
              'f' = 'fffff',
              'g' = 'gggggg',
              'h' = 'hhhhhhh',
              'i' = 'iiiiiiii',
              'j' = 'jj',
            }
          `,
          output: dedent`
            enum Enum {
              'i' = 'iiiiiiii',
              'h' = 'hhhhhhh',
              'g' = 'gggggg',
              'f' = 'fffff',
              'e' = 'eeee',
              'd' = 'ddd',
              'c' = 'cc',
              'j' = 'jj',
              'b' = 'b',
              'a' = '',
            }
          `,
          options: [
            {
              ...options,
              sortByValue: true,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'a',
                right: 'b',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'b',
                right: 'c',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'c',
                right: 'd',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'd',
                right: 'e',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'e',
                right: 'f',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'f',
                right: 'g',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'g',
                right: 'h',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'h',
                right: 'i',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${ruleName}: misc`, () => {
    ruleTester.run(`${ruleName}: detects numeric enums`, rule, {
      valid: [
        {
          code: dedent`
              enum Enum {
                'a' = '1',
                'b' = 2,
                'c' = 0,
              }
            `,
          options: [
            {
              forceNumericSort: true,
            },
          ],
        },
        {
          code: dedent`
            enum Enum {
                'a' = 1,
                'b' = 2,
                'c' = 0,
                d,
              }
            `,
          options: [
            {
              forceNumericSort: true,
            },
          ],
        },
        {
          code: dedent`
            enum Enum {
                'a' = 1,
                'b' = 2,
                'c' = 0,
                d = undefined,
              }
            `,
          options: [
            {
              forceNumericSort: true,
            },
          ],
        },
        {
          code: dedent`
            enum Enum {
                'a' = 1,
                'b' = 2,
                'c' = 0,
                d = null,
              }
            `,
          options: [
            {
              forceNumericSort: true,
            },
          ],
        },
        {
          code: dedent`
            enum Enum {
                'c' = 0,
                'a' = 1,
                'b' = 2,
              }
            `,
          options: [
            {
              forceNumericSort: true,
            },
          ],
        },
      ],
      invalid: [],
    })

    let sortTypes: Options[0]['type'][] = [
      'alphabetical',
      'line-length',
      'natural',
    ]
    for (let type of sortTypes) {
      ruleTester.run(
        `${ruleName}: sortByValue = true => sorts numerical enums numerically for type ${type}`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
              enum Enum {
                'b' = 2,
                'a' = 1,
                'c' = 0,
              }
            `,
              output: dedent`
              enum Enum {
                'c' = 0,
                'a' = 1,
                'b' = 2,
              }
              `,
              options: [
                {
                  type,
                  sortByValue: true,
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedEnumsOrder',
                  data: {
                    left: 'b',
                    right: 'a',
                  },
                },
                {
                  messageId: 'unexpectedEnumsOrder',
                  data: {
                    left: 'a',
                    right: 'c',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}: forceNumericSort = true => sorts numerical enums numerically regardless for type ${type}`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
              enum Enum {
                'b' = 2,
                'a' = 1,
                'c' = 0,
              }
            `,
              output: dedent`
              enum Enum {
                'c' = 0,
                'a' = 1,
                'b' = 2,
              }
              `,
              options: [
                {
                  type,
                  forceNumericSort: true,
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedEnumsOrder',
                  data: {
                    left: 'b',
                    right: 'a',
                  },
                },
                {
                  messageId: 'unexpectedEnumsOrder',
                  data: {
                    left: 'a',
                    right: 'c',
                  },
                },
              ],
            },
          ],
        },
      )
    }

    ruleTester.run(
      `${ruleName}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          dedent`
            enum Enum {
              'a' = 'a',
              'b' = 'b',
              'c' = 'c',
            }
          `,
          {
            code: dedent`
              enum NumberBase {
                BASE_10 = 10,
                BASE_16 = 16,
                BASE_2 = 2,
                BASE_8 = 8
              }
            `,
            options: [{}],
          },
        ],
        invalid: [
          {
            code: dedent`
              enum Enum {
                'b' = 'b',
                'a' = 'a',
                'c' = 'c',
              }
            `,
            output: dedent`
              enum Enum {
                'a' = 'a',
                'b' = 'b',
                'c' = 'c',
              }
            `,
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
        ],
      },
    )

    describe('detects dependencies', () => {
      ruleTester.run(`${ruleName}: works with dependencies`, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              enum Enum {
                C = 'C',
                B = 0,
                A = B,
              }
            `,
            output: dedent`
              enum Enum {
                B = 0,
                A = B,
                C = 'C',
              }
            `,
            options: [
              {
                type: 'alphabetical',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'C',
                  right: 'B',
                },
              },
            ],
          },
          {
            code: dedent`
              enum Enum {
                C = 'C',
                B = 0,
                A = Enum.B,
              }
            `,
            output: dedent`
              enum Enum {
                B = 0,
                A = Enum.B,
                C = 'C',
              }
            `,
            options: [
              {
                type: 'alphabetical',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'C',
                  right: 'B',
                },
              },
            ],
          },
          {
            code: dedent`
              enum Enum {
                C = 3,
                B = 0,
                A = 1 | 2 | B | Enum.B,
              }
            `,
            output: dedent`
              enum Enum {
                B = 0,
                A = 1 | 2 | B | Enum.B,
                C = 3,
              }
            `,
            options: [
              {
                type: 'alphabetical',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'C',
                  right: 'B',
                },
              },
            ],
          },
          {
            code: dedent`
              enum Enum {
                B = 'B',
                A = AnotherEnum.B,
                C = 'C',
              }
            `,
            output: dedent`
              enum Enum {
                A = AnotherEnum.B,
                B = 'B',
                C = 'C',
              }
            `,
            options: [
              {
                type: 'alphabetical',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
            ],
          },
          {
            code: dedent`
              enum Enum {
                A = Enum.C,
                B = 10,
                C = 10,
              }
            `,
            output: dedent`
              enum Enum {
                C = 10,
                A = Enum.C,
                B = 10,
              }
            `,
            options: [
              {
                type: 'alphabetical',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedEnumsDependencyOrder',
                data: {
                  right: 'C',
                  nodeDependentOnRight: 'A',
                },
              },
            ],
          },
        ],
      })

      ruleTester.run(
        `${ruleName} detects dependencies in template literal expressions`,
        rule,
        {
          valid: [
            {
              code: dedent`
                enum Enum {
                  A = \`\${AnotherEnum.D}\`,
                  D = 'D',
                  B = \`\${Enum.D}\`,
                  C = \`\${D}\`,
                }
            `,
              options: [
                {
                  type: 'alphabetical',
                },
              ],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(`${ruleName}: detects circular dependencies`, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              enum Enum {
                A = 'A',
                B = F,
                C = 'C',
                D = B,
                E = 'E',
                F = D
              }
            `,
            output: dedent`
              enum Enum {
                A = 'A',
                D = B,
                F = D,
                B = F,
                C = 'C',
                E = 'E'
              }
            `,
            options: [
              {
                type: 'alphabetical',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'C',
                  right: 'D',
                },
              },
              {
                messageId: 'unexpectedEnumsDependencyOrder',
                data: {
                  right: 'F',
                  nodeDependentOnRight: 'B',
                },
              },
            ],
          },
        ],
      })

      ruleTester.run(
        `${ruleName}: prioritizes dependencies over partitionByComment`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
              enum Enum {
                B = A,
                // Part: 1
                A = 'A',
              }
            `,
              output: dedent`
              enum Enum {
                A = 'A',
                // Part: 1
                B = A,
              }
            `,
              options: [
                {
                  type: 'alphabetical',
                  partitionByComment: 'Part**',
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedEnumsDependencyOrder',
                  data: {
                    right: 'A',
                    nodeDependentOnRight: 'B',
                  },
                },
              ],
            },
          ],
        },
      )
    })

    describe(`${ruleName}: handles complex comment cases`, () => {
      ruleTester.run(
        `${ruleName}: keeps comments associated to their node`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
              enum Enum {
                // Ignore this comment

                // B2
                /**
                  * B1
                  */
                B = 'B',

                // Ignore this comment

                // A3
                /**
                  * A2
                  */
                // A1
                A = 'A',
              }
            `,
              output: dedent`
              enum Enum {
                // Ignore this comment

                // A3
                /**
                  * A2
                  */
                // A1
                A = 'A',

                // Ignore this comment

                // B2
                /**
                  * B1
                  */
                B = 'B',
              }
            `,
              options: [
                {
                  type: 'alphabetical',
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedEnumsOrder',
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

      ruleTester.run(`${ruleName}: handles partition comments`, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              enum Enum {
                // Ignore this comment

                // C2
                // C1
                C = 'C',

                // B2
                /**
                  * B1
                  */
                B = 'B',

                // Above a partition comment ignore me
                // PartitionComment: 1
                /**
                  * D2
                  */
                // D1
                D = 'D',

                A = 'A',
              }
            `,
            output: dedent`
              enum Enum {
                // Ignore this comment

                // B2
                /**
                  * B1
                  */
                B = 'B',

                // C2
                // C1
                C = 'C',

                // Above a partition comment ignore me
                // PartitionComment: 1
                A = 'A',

                /**
                  * D2
                  */
                // D1
                D = 'D',
              }
            `,
            options: [
              {
                type: 'alphabetical',
                partitionByComment: 'PartitionComment:*',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'C',
                  right: 'B',
                },
              },
              {
                messageId: 'unexpectedEnumsOrder',
                data: {
                  left: 'D',
                  right: 'A',
                },
              },
            ],
          },
        ],
      })
    })

    ruleTester.run(`${ruleName}: allows to use new line as partition`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            enum Enum {
              D = 'D',
              C = 'C',

              B = 'B',

              E = 'E',
              A = 'A',
            }
          `,
          output: dedent`
            enum Enum {
              C = 'C',
              D = 'D',

              B = 'B',

              A = 'A',
              E = 'E',
            }
          `,
          options: [
            {
              type: 'alphabetical',
              partitionByNewLine: true,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'D',
                right: 'C',
              },
            },
            {
              messageId: 'unexpectedEnumsOrder',
              data: {
                left: 'E',
                right: 'A',
              },
            },
          ],
        },
      ],
    })
  })
})
