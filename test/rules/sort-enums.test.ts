import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import type { Options } from '../../rules/sort-enums'

import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-enums'

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
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'bbb',
                left: 'cc',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          output: dedent`
            enum Enum {
              aaaa = 'a',
              bbb = 'b',
              cc = 'c',
              d = 'd',
            }
          `,
          code: dedent`
            enum Enum {
              aaaa = 'a',
              cc = 'c',
              bbb = 'b',
              d = 'd',
            }
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts enum members with number keys`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: '12',
                  left: '8',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            output: dedent`
              enum Enum {
                1 = 'a',
                12 = 'b',
                2 = 'c',
                8 = 'c',
              }
            `,
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
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'false',
                  left: 'true',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            output: dedent`
              enum Enum {
                false = 'b',
                true = 'a',
              }
            `,
            code: dedent`
              enum Enum {
                true = 'a',
                false = 'b',
              }
            `,
            options: [options],
          },
        ],
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
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break interface docs`,
      rule,
      {
        invalid: [
          {
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
            errors: [
              {
                data: {
                  right: 'aaa',
                  left: 'b',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            options: [options],
          },
        ],
        valid: [],
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
        invalid: [
          {
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
            errors: [
              {
                data: {
                  right: 'bbb',
                  left: 'd',
                },
                messageId: 'unexpectedEnumsOrder',
              },
              {
                data: {
                  right: 'fff',
                  left: 'gg',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            options: [
              {
                ...options,
                partitionByComment: '^Part*',
              },
            ],
          },
        ],
        valid: [],
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
        invalid: [
          {
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
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            options: [
              {
                ...options,
                partitionByComment: ['Partition Comment', 'Part: *', 'Other'],
              },
            ],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex for partition comments`,
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
                partitionByComment: ['^(?!.*foo).*$'],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    describe(`${ruleName}(${type}): allows to use "partitionByComment.line"`, () => {
      ruleTester.run(`${ruleName}(${type}): ignores block comments`, rule, {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            options: [
              {
                ...options,
                partitionByComment: {
                  line: true,
                },
              },
            ],
            output: dedent`
              enum Enum {
                /* Comment */
                A = "A",
                B = "B",
              }
            `,
            code: dedent`
              enum Enum {
                B = "B",
                /* Comment */
                A = "A",
              }
            `,
          },
        ],
        valid: [],
      })

      ruleTester.run(
        `${ruleName}(${type}): allows to use all comments as parts`,
        rule,
        {
          valid: [
            {
              options: [
                {
                  ...options,
                  partitionByComment: {
                    line: true,
                  },
                },
              ],
              code: dedent`
                enum Enum {
                  B = "B",
                  // Comment
                  A = "A",
                }
              `,
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows to use multiple partition comments`,
        rule,
        {
          valid: [
            {
              code: dedent`
               enum Enum {
                  C = "C",
                  // B
                  B = "B",
                  // A
                  A = "A",
                }
              `,
              options: [
                {
                  ...options,
                  partitionByComment: {
                    line: ['A', 'B'],
                  },
                },
              ],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows to use regex for partition comments`,
        rule,
        {
          valid: [
            {
              options: [
                {
                  ...options,
                  partitionByComment: {
                    line: ['^(?!.*foo).*$'],
                  },
                },
              ],
              code: dedent`
              enum Enum {
                B = 'B',
                // I am a partition comment because I don't have f o o
                A = 'A',
              }
            `,
            },
          ],
          invalid: [],
        },
      )
    })

    describe(`${ruleName}(${type}): allows to use "partitionByComment.block"`, () => {
      ruleTester.run(`${ruleName}(${type}): ignores line comments`, rule, {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            options: [
              {
                ...options,
                partitionByComment: {
                  block: true,
                },
              },
            ],
            output: dedent`
              enum Enum {
                // Comment
                A = "A",
                B = "B",
              }
            `,
            code: dedent`
              enum Enum {
                B = "B",
                // Comment
                A = "A",
              }
            `,
          },
        ],
        valid: [],
      })

      ruleTester.run(
        `${ruleName}(${type}): allows to use all comments as parts`,
        rule,
        {
          valid: [
            {
              options: [
                {
                  ...options,
                  partitionByComment: {
                    block: true,
                  },
                },
              ],
              code: dedent`
                enum Enum {
                  B = "B",
                  /* Comment */
                  A = "A",
                }
              `,
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows to use multiple partition comments`,
        rule,
        {
          valid: [
            {
              code: dedent`
               enum Enum {
                  C = "C",
                  /* B */
                  B = "B",
                  /* A */
                  A = "A",
                }
              `,
              options: [
                {
                  ...options,
                  partitionByComment: {
                    block: ['A', 'B'],
                  },
                },
              ],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows to use regex for partition comments`,
        rule,
        {
          valid: [
            {
              code: dedent`
                enum Enum {
                  B = 'B',
                  /* I am a partition comment because I don't have f o o */
                  A = 'A',
                }
              `,
              options: [
                {
                  ...options,
                  partitionByComment: {
                    block: ['^(?!.*foo).*$'],
                  },
                },
              ],
            },
          ],
          invalid: [],
        },
      )
    })

    ruleTester.run(`${ruleName}: sort enum values correctly`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'c',
                left: 'b',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'd',
                left: 'c',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'e',
                left: 'd',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'f',
                left: 'e',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'g',
                left: 'f',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'h',
                left: 'g',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'i',
                left: 'h',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'j',
                left: 'i',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
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
          options: [
            {
              ...options,
              sortByValue: true,
            },
          ],
        },
      ],
      valid: [],
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
            options: [
              {
                ...options,
                specialCharacters: 'remove',
              },
            ],
            code: dedent`
              enum Enum {
                AB = 'AB',
                A_C = 'AC',
              }
            `,
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use locale`, rule, {
      valid: [
        {
          code: dedent`
              enum Enum {
                你好 = '你好',
                世界 = '世界',
                a = 'a',
                A = 'A',
                b = 'b',
                B = 'B',
              }
            `,
          options: [{ ...options, locales: 'zh-CN' }],
        },
      ],
      invalid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts inline elements correctly`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            output: dedent`
              enum Enum {
                A = "A", B = "B"
              }
            `,
            code: dedent`
              enum Enum {
                B = "B", A = "A"
              }
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            output: dedent`
              enum Enum {
                A = "A", B = "B",
              }
            `,
            code: dedent`
              enum Enum {
                B = "B", A = "A",
              }
            `,
            options: [options],
          },
        ],
        valid: [],
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
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'bbb',
                left: 'cc',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          output: dedent`
            enum Enum {
              aaaa = 'a',
              bbb = 'b',
              cc = 'c',
              d = 'd',
            }
          `,
          code: dedent`
            enum Enum {
              aaaa = 'a',
              cc = 'c',
              bbb = 'b',
              d = 'd',
            }
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts enum members with number keys`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: '12',
                  right: '2',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            output: dedent`
              enum Enum {
                1 = 'a',
                2 = 'c',
                8 = 'c',
                12 = 'b',
              }
            `,
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
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'false',
                  left: 'true',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            output: dedent`
              enum Enum {
                false = 'b',
                true = 'a',
              }
            `,
            code: dedent`
              enum Enum {
                true = 'a',
                false = 'b',
              }
            `,
            options: [options],
          },
        ],
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
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break interface docs`,
      rule,
      {
        invalid: [
          {
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
            errors: [
              {
                data: {
                  right: 'aaa',
                  left: 'b',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            options: [options],
          },
        ],
        valid: [],
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
        invalid: [
          {
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
            errors: [
              {
                data: {
                  right: 'bbb',
                  left: 'd',
                },
                messageId: 'unexpectedEnumsOrder',
              },
              {
                data: {
                  right: 'fff',
                  left: 'gg',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            options: [
              {
                ...options,
                partitionByComment: '^Part*',
              },
            ],
          },
        ],
        valid: [],
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
        invalid: [
          {
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
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            options: [
              {
                ...options,
                partitionByComment: ['Partition Comment', 'Part: *', 'Other'],
              },
            ],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(`${ruleName}: sort enum values correctly`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'c',
                left: 'b',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'd',
                left: 'c',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'e',
                left: 'd',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'f',
                left: 'e',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'g',
                left: 'f',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'h',
                left: 'g',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'i',
                left: 'h',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
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
          options: [
            {
              ...options,
              sortByValue: true,
            },
          ],
        },
      ],
      valid: [],
    })
  })

  describe(`${ruleName}: sorts by custom alphabet`, () => {
    let type = 'custom'

    let alphabet = Alphabet.generateRecommendedAlphabet()
      .sortByLocaleCompare('en-US')
      .getCharacters()
    let options = {
      type: 'custom',
      order: 'asc',
      alphabet,
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts enum members`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'bbb',
                left: 'cc',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          output: dedent`
            enum Enum {
              aaaa = 'a',
              bbb = 'b',
              cc = 'c',
              d = 'd',
            }
          `,
          code: dedent`
            enum Enum {
              aaaa = 'a',
              cc = 'c',
              bbb = 'b',
              d = 'd',
            }
          `,
          options: [options],
        },
      ],
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
    })
  })

  describe(`${ruleName}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts enum members`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'bbb',
                left: 'cc',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          output: dedent`
            enum Enum {
              aaaa = 'a',
              bbb = 'b',
              cc = 'c',
              d = 'd',
            }
          `,
          code: dedent`
            enum Enum {
              aaaa = 'a',
              cc = 'c',
              bbb = 'b',
              d = 'd',
            }
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts enum members with number keys`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: '12',
                  left: '1',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            output: dedent`
              enum Enum {
                12 = 'b',
                1 = 'a',
                2 = 'c',
                8 = 'c',
              }
            `,
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
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'false',
                  left: 'true',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            output: dedent`
              enum Enum {
                false = 'b',
                true = 'a',
              }
            `,
            code: dedent`
              enum Enum {
                true = 'a',
                false = 'b',
              }
            `,
            options: [options],
          },
        ],
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
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break interface docs`,
      rule,
      {
        invalid: [
          {
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
            errors: [
              {
                data: {
                  right: 'aaa',
                  left: 'b',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            options: [options],
          },
        ],
        valid: [],
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
        invalid: [
          {
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
            errors: [
              {
                data: {
                  right: 'bbb',
                  left: 'd',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            options: [
              {
                ...options,
                partitionByComment: '^Part*',
              },
            ],
          },
        ],
        valid: [],
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
        invalid: [
          {
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
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            options: [
              {
                ...options,
                partitionByComment: ['Partition Comment', 'Part: *', 'Other'],
              },
            ],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(`${ruleName}: sort enum values correctly`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'c',
                left: 'b',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'd',
                left: 'c',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'e',
                left: 'd',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'f',
                left: 'e',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'g',
                left: 'f',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'h',
                left: 'g',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'i',
                left: 'h',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
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
          options: [
            {
              ...options,
              sortByValue: true,
            },
          ],
        },
      ],
      valid: [],
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
                'i' = ~2, // -3
                'k' = -1,
                'j' = - 0.1,
                'e' = - (((1 + 1) * 2) ** 2) / 4 % 2, // 0
                'f' = 0,
                'h' = +1,
                'g' = 3 - 1, // 2
                'b' = 5^6, // 3
                'l' = 1 + 3, // 4
                'm' = 2.1 ** 2, // 4.41
                'a' = 20 >> 2, // 5
                'm' = 7 & 6, // 6
                'c' = 5 | 6, // 7
                'd' = 2 << 2, // 8
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
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'a',
                    left: 'b',
                  },
                  messageId: 'unexpectedEnumsOrder',
                },
                {
                  data: {
                    right: 'c',
                    left: 'a',
                  },
                  messageId: 'unexpectedEnumsOrder',
                },
              ],
              output: dedent`
              enum Enum {
                'c' = 0,
                'a' = 1,
                'b' = 2,
              }
              `,
              code: dedent`
              enum Enum {
                'b' = 2,
                'a' = 1,
                'c' = 0,
              }
            `,
              options: [
                {
                  sortByValue: true,
                  type,
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}: forceNumericSort = true => sorts numerical enums numerically regardless for type ${type}`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'a',
                    left: 'b',
                  },
                  messageId: 'unexpectedEnumsOrder',
                },
                {
                  data: {
                    right: 'c',
                    left: 'a',
                  },
                  messageId: 'unexpectedEnumsOrder',
                },
              ],
              output: dedent`
              enum Enum {
                'c' = 0,
                'a' = 1,
                'b' = 2,
              }
              `,
              code: dedent`
              enum Enum {
                'b' = 2,
                'a' = 1,
                'c' = 0,
              }
            `,
              options: [
                {
                  forceNumericSort: true,
                  type,
                },
              ],
            },
          ],
          valid: [],
        },
      )
    }

    ruleTester.run(
      `${ruleName}: sets alphabetical asc sorting as default`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            output: dedent`
              enum Enum {
                'a' = 'a',
                'b' = 'b',
                'c' = 'c',
              }
            `,
            code: dedent`
              enum Enum {
                'b' = 'b',
                'a' = 'a',
                'c' = 'c',
              }
            `,
          },
        ],
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
      },
    )

    describe('detects dependencies', () => {
      ruleTester.run(`${ruleName}: works with dependencies`, rule, {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'B',
                  left: 'C',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            output: dedent`
              enum Enum {
                B = 0,
                A = B,
                C = 'C',
              }
            `,
            code: dedent`
              enum Enum {
                C = 'C',
                B = 0,
                A = B,
              }
            `,
            options: [
              {
                type: 'alphabetical',
              },
            ],
          },
          {
            errors: [
              {
                data: {
                  right: 'B',
                  left: 'C',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            output: dedent`
              enum Enum {
                B = 0,
                A = Enum.B,
                C = 'C',
              }
            `,
            code: dedent`
              enum Enum {
                C = 'C',
                B = 0,
                A = Enum.B,
              }
            `,
            options: [
              {
                type: 'alphabetical',
              },
            ],
          },
          {
            errors: [
              {
                data: {
                  right: 'B',
                  left: 'C',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            output: dedent`
              enum Enum {
                B = 0,
                A = 1 | 2 | B | Enum.B,
                C = 3,
              }
            `,
            code: dedent`
              enum Enum {
                C = 3,
                B = 0,
                A = 1 | 2 | B | Enum.B,
              }
            `,
            options: [
              {
                type: 'alphabetical',
              },
            ],
          },
          {
            errors: [
              {
                data: {
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            output: dedent`
              enum Enum {
                A = AnotherEnum.B,
                B = 'B',
                C = 'C',
              }
            `,
            code: dedent`
              enum Enum {
                B = 'B',
                A = AnotherEnum.B,
                C = 'C',
              }
            `,
            options: [
              {
                type: 'alphabetical',
              },
            ],
          },
          {
            errors: [
              {
                data: {
                  nodeDependentOnRight: 'A',
                  right: 'C',
                },
                messageId: 'unexpectedEnumsDependencyOrder',
              },
            ],
            output: dedent`
              enum Enum {
                C = 10,
                A = Enum.C,
                B = 10,
              }
            `,
            code: dedent`
              enum Enum {
                A = Enum.C,
                B = 10,
                C = 10,
              }
            `,
            options: [
              {
                type: 'alphabetical',
              },
            ],
          },
        ],
        valid: [],
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
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'D',
                  left: 'C',
                },
                messageId: 'unexpectedEnumsOrder',
              },
              {
                data: {
                  nodeDependentOnRight: 'B',
                  right: 'F',
                },
                messageId: 'unexpectedEnumsDependencyOrder',
              },
            ],
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
            options: [
              {
                type: 'alphabetical',
              },
            ],
          },
        ],
        valid: [],
      })

      ruleTester.run(
        `${ruleName}: prioritizes dependencies over partitionByComment`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    nodeDependentOnRight: 'B',
                    right: 'A',
                  },
                  messageId: 'unexpectedEnumsDependencyOrder',
                },
              ],
              options: [
                {
                  partitionByComment: '^Part*',
                  type: 'alphabetical',
                },
              ],
              output: dedent`
              enum Enum {
                A = 'A',
                // Part: 1
                B = A,
              }
            `,
              code: dedent`
              enum Enum {
                B = A,
                // Part: 1
                A = 'A',
              }
            `,
            },
          ],
          valid: [],
        },
      )
    })

    describe(`${ruleName}: handles complex comment cases`, () => {
      ruleTester.run(
        `${ruleName}: keeps comments associated to their node`,
        rule,
        {
          invalid: [
            {
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
              errors: [
                {
                  data: {
                    right: 'A',
                    left: 'B',
                  },
                  messageId: 'unexpectedEnumsOrder',
                },
              ],
              options: [
                {
                  type: 'alphabetical',
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(`${ruleName}: handles partition comments`, rule, {
        invalid: [
          {
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
            errors: [
              {
                data: {
                  right: 'B',
                  left: 'C',
                },
                messageId: 'unexpectedEnumsOrder',
              },
              {
                data: {
                  right: 'A',
                  left: 'D',
                },
                messageId: 'unexpectedEnumsOrder',
              },
            ],
            options: [
              {
                partitionByComment: 'PartitionComment:*',
                type: 'alphabetical',
              },
            ],
          },
        ],
        valid: [],
      })
    })

    ruleTester.run(`${ruleName}: allows to use new line as partition`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'C',
                left: 'D',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'A',
                left: 'E',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          output: dedent`
            enum Enum {
              C = 'C',
              D = 'D',

              B = 'B',

              A = 'A',
              E = 'E',
            }
          `,
          code: dedent`
            enum Enum {
              D = 'D',
              C = 'C',

              B = 'B',

              E = 'E',
              A = 'A',
            }
          `,
          options: [
            {
              partitionByNewLine: true,
              type: 'alphabetical',
            },
          ],
        },
      ],
      valid: [],
    })

    let eslintDisableRuleTesterName = `${ruleName}: supports 'eslint-disable' for individual nodes`
    ruleTester.run(eslintDisableRuleTesterName, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          output: dedent`
            enum Enum {
              B = 'B',
              C = 'C',
              // eslint-disable-next-line
              A = 'A'
            }
          `,
          code: dedent`
            enum Enum {
              C = 'C',
              B = 'B',
              // eslint-disable-next-line
              A = 'A'
            }
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'C',
                left: 'D',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'B',
                left: 'A',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          output: dedent`
            enum Enum {
              B = 'B',
              C = 'C',
              // eslint-disable-next-line
              A = 'A',
              D = 'D'
            }
          `,
          code: dedent`
            enum Enum {
              D = 'D',
              C = 'C',
              // eslint-disable-next-line
              A = 'A',
              B = 'B'
            }
          `,
          options: [
            {
              partitionByComment: true,
            },
          ],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          output: dedent`
            enum Enum {
              B = A,
              C = 'C',
              // eslint-disable-next-line
              A = 'A'
            }
          `,
          code: dedent`
            enum Enum {
              C = 'C',
              B = A,
              // eslint-disable-next-line
              A = 'A'
            }
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          output: dedent`
            enum Enum {
              B = 'B',
              C = 'C',
              A = 'A' // eslint-disable-line
            }
          `,
          code: dedent`
            enum Enum {
              C = 'C',
              B = 'B',
              A = 'A' // eslint-disable-line
            }
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          output: dedent`
            enum Enum {
              B = 'B',
              C = 'C',
              /* eslint-disable-next-line */
              A = 'A'
            }
          `,
          code: dedent`
            enum Enum {
              C = 'C',
              B = 'B',
              /* eslint-disable-next-line */
              A = 'A'
            }
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          output: dedent`
            enum Enum {
              B = 'B',
              C = 'C',
              A = 'A' /* eslint-disable-line */
            }
          `,
          code: dedent`
            enum Enum {
              C = 'C',
              B = 'B',
              A = 'A' /* eslint-disable-line */
            }
          `,
          options: [{}],
        },
        {
          output: dedent`
            enum Enum {
              A = 'A',
              D = 'D',
              /* eslint-disable */
              C = 'C',
              B = 'B',
              // Shouldn't move
              /* eslint-enable */
              E = 'E'
            }
          `,
          code: dedent`
            enum Enum {
              D = 'D',
              E = 'E',
              /* eslint-disable */
              C = 'C',
              B = 'B',
              // Shouldn't move
              /* eslint-enable */
              A = 'A'
            }
          `,
          errors: [
            {
              data: {
                right: 'A',
                left: 'B',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            enum Enum {
              B = 'B',
              C = 'C',
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              A = 'A'
            }
          `,
          code: dedent`
            enum Enum {
              C = 'C',
              B = 'B',
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              A = 'A'
            }
          `,
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            enum Enum {
              B = 'B',
              C = 'C',
              A = 'A' // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            }
          `,
          code: dedent`
            enum Enum {
              C = 'C',
              B = 'B',
              A = 'A' // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            }
          `,
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            enum Enum {
              B = 'B',
              C = 'C',
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              A = 'A'
            }
          `,
          code: dedent`
            enum Enum {
              C = 'C',
              B = 'B',
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              A = 'A'
            }
          `,
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            enum Enum {
              B = 'B',
              C = 'C',
              A = 'A' /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            }
          `,
          code: dedent`
            enum Enum {
              C = 'C',
              B = 'B',
              A = 'A' /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            }
          `,
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            enum Enum {
              A = 'A',
              D = 'D',
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              C = 'C',
              B = 'B',
              // Shouldn't move
              /* eslint-enable */
              E = 'E'
            }
          `,
          code: dedent`
            enum Enum {
              D = 'D',
              E = 'E',
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              C = 'C',
              B = 'B',
              // Shouldn't move
              /* eslint-enable */
              A = 'A'
            }
          `,
          errors: [
            {
              data: {
                right: 'A',
                left: 'B',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          options: [{}],
        },
      ],
      valid: [],
    })
  })
})
