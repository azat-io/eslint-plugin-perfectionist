import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

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
  })

  describe(`${ruleName}: misc`, () => {
    ruleTester.run(`${ruleName}: compare enum values correctly`, rule, {
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
              type: 'natural',
              compareValues: true,
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
  })
})
