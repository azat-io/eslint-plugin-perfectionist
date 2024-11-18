import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule from '../rules/sort-array-includes'

let ruleName = 'sort-array-includes'

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

    ruleTester.run(
      `${ruleName}(${type}): does not break the property list`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedArrayIncludesOrder',
              },
            ],
            output: dedent`
              [
                'a',
                'b',
                'c',
                'd',
                'e',
                ...other,
              ].includes(value)
            `,
            code: dedent`
              [
                'a',
                'c',
                'b',
                'd',
                'e',
                ...other,
              ].includes(value)
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              [
                'a',
                'b',
                'c',
                'd',
                'e',
                ...other,
              ].includes(value)
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts spread elements`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '...bbbb',
                left: '...ccc',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          output: dedent`
            [
              ...aaa,
              ...bbbb,
              ...ccc,
            ].includes(value)
          `,
          code: dedent`
            [
              ...aaa,
              ...ccc,
              ...bbbb,
            ].includes(value)
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            [
              ...aaa,
              ...bbbb,
              ...ccc,
            ].includes(value)
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): ignores nullable array elements`,
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
                messageId: 'unexpectedArrayIncludesOrder',
              },
            ],
            output: dedent`
              ['a', 'b', 'c',, 'd'].includes(value)
            `,
            code: dedent`
              ['b', 'a', 'c',, 'd'].includes(value)
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              ['a', 'b', 'c',, 'd'].includes(value)
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allow to put spread elements to the end`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: '...other',
                  right: 'c',
                },
                messageId: 'unexpectedArrayIncludesOrder',
              },
            ],
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
            output: dedent`
              ['a', 'b', 'c', ...other].includes(value)
            `,
            code: dedent`
              ['a', 'b', ...other, 'c'].includes(value)
            `,
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
            code: dedent`
              ['a', 'b', 'c', ...other].includes(value)
            `,
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts array constructor`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          output: dedent`
            new Array(
              'a',
              'b',
              'c',
              'd',
            ).includes(value)
          `,
          code: dedent`
            new Array(
              'a',
              'c',
              'b',
              'd',
            ).includes(value)
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Array(
              'a',
              'b',
              'c',
              'd',
            ).includes(value)
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): allows mixed sorting`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '...d',
                left: 'bbb',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          output: dedent`
            new Array(
              ...d,
              'aaaa',
              'bbb',
              'cc',
            ).includes(value)
          `,
          code: dedent`
            new Array(
              'aaaa',
              'bbb',
              ...d,
              'cc',
            ).includes(value)
          `,
          options: [
            {
              ...options,
              groupKind: 'mixed',
            },
          ],
        },
      ],
      valid: [
        {
          code: dedent`
            new Array(
              ...d,
              'aaaa',
              'bbb',
              'cc',
            ).includes(value)
          `,
          options: [
            {
              ...options,
              groupKind: 'mixed',
            },
          ],
        },
      ],
    })

    describe(`${ruleName}(${type}): partition by new line`, () => {
      ruleTester.run(
        `${ruleName}(${type}): allows to use new line as partition`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'a',
                    left: 'd',
                  },
                  messageId: 'unexpectedArrayIncludesOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'e',
                  },
                  messageId: 'unexpectedArrayIncludesOrder',
                },
              ],
              output: dedent`
              [
                'a',
                'd',

                'c',

                'b',
                'e',
              ].includes(value)
            `,
              code: dedent`
              [
                'd',
                'a',

                'c',

                'e',
                'b',
              ].includes(value)
            `,
              options: [
                {
                  ...options,
                  partitionByNewLine: true,
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize partitions over group kind`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: '...d',
                    left: 'c',
                  },
                  messageId: 'unexpectedArrayIncludesOrder',
                },
                {
                  data: {
                    right: '...b',
                    left: 'a',
                  },
                  messageId: 'unexpectedArrayIncludesOrder',
                },
              ],
              options: [
                {
                  ...options,
                  groupKind: 'spreads-first',
                  partitionByNewLine: true,
                },
              ],
              output: dedent`
                [
                  ...d,
                  'c',

                  ...b,
                  'a',
                ].includes(value)
              `,
              code: dedent`
                [
                  'c',
                  ...d,

                  'a',
                  ...b,
                ].includes(value)
              `,
            },
          ],
          valid: [],
        },
      )
    })

    describe(`${ruleName}(${type}): partition comments`, () => {
      ruleTester.run(
        `${ruleName}(${type}): allows to use partition comments`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'bbb',
                    left: 'd',
                  },
                  messageId: 'unexpectedArrayIncludesOrder',
                },
                {
                  data: {
                    right: 'fff',
                    left: 'gg',
                  },
                  messageId: 'unexpectedArrayIncludesOrder',
                },
              ],
              output: dedent`
              [
                // Part: A
                // Not partition comment
                'bbb',
                'cc',
                'd',
                // Part: B
                'aaaa',
                'e',
                // Part: C
                // Not partition comment
                'fff',
                'gg',
              ].includes(value)
            `,
              code: dedent`
              [
                // Part: A
                'cc',
                'd',
                // Not partition comment
                'bbb',
                // Part: B
                'aaaa',
                'e',
                // Part: C
                'gg',
                // Not partition comment
                'fff',
              ].includes(value)
            `,
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
              [
                // Comment
                'bb',
                // Other comment
                'a',
              ].includes(value)
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
              [
                /* Partition Comment */
                // Part: A
                'd',
                // Part: B
                'aaa',
                'bb',
                'c',
                /* Other */
                'e',
              ].includes(value)
            `,
              code: dedent`
              [
                /* Partition Comment */
                // Part: A
                'd',
                // Part: B
                'aaa',
                'c',
                'bb',
                /* Other */
                'e',
              ].includes(value)
            `,
              errors: [
                {
                  data: {
                    right: 'bb',
                    left: 'c',
                  },
                  messageId: 'unexpectedArrayIncludesOrder',
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
        `${ruleName}(${type}): prioritize partitions over group kind`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: '...d',
                    left: 'c',
                  },
                  messageId: 'unexpectedArrayIncludesOrder',
                },
                {
                  data: {
                    right: '...b',
                    left: 'a',
                  },
                  messageId: 'unexpectedArrayIncludesOrder',
                },
              ],
              output: dedent`
                [
                  ...d,
                  'c',
                  // Part: 1
                  ...b,
                  'a',
                ].includes(value)
              `,
              code: dedent`
                [
                  'c',
                  ...d,
                  // Part: 1
                  'a',
                  ...b,
                ].includes(value)
              `,
              options: [
                {
                  ...options,
                  partitionByComment: '^Part: *',
                  groupKind: 'spreads-first',
                },
              ],
            },
          ],
          valid: [],
        },
      )
    })

    ruleTester.run(`${ruleName}(${type}): allows to use regex`, rule, {
      valid: [
        {
          code: dedent`
              [
                'e',
                'f',
                // I am a partition comment because I don't have f o o
                'a',
                'b',
              ].includes(value)
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
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`
              [
                '$a',
                'b',
                '$c',
              ].includes(value)
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
              [
                'ab',
                'a$c',
              ].includes(value)
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
            [
              '你好',
              '世界',
              'a',
              'A',
              'b',
              'B'
            ].includes(value)
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
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedArrayIncludesOrder',
              },
            ],
            output: dedent`
              [
                a, b
              ].includes(value)
            `,
            code: dedent`
              [
                b, a
              ].includes(value)
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedArrayIncludesOrder',
              },
            ],
            output: dedent`
              [
                a, b,
              ].includes(value)
            `,
            code: dedent`
              [
                b, a,
              ].includes(value)
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

    ruleTester.run(
      `${ruleName}(${type}): does not break the property list`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedArrayIncludesOrder',
              },
            ],
            output: dedent`
              [
                'a',
                'b',
                'c',
                'd',
                'e',
                ...other,
              ].includes(value)
            `,
            code: dedent`
              [
                'a',
                'c',
                'b',
                'd',
                'e',
                ...other,
              ].includes(value)
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              [
                'a',
                'b',
                'c',
                'd',
                'e',
                ...other,
              ].includes(value)
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts spread elements`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '...bbbb',
                left: '...ccc',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          output: dedent`
            [
              ...aaa,
              ...bbbb,
              ...ccc,
            ].includes(value)
          `,
          code: dedent`
            [
              ...aaa,
              ...ccc,
              ...bbbb,
            ].includes(value)
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            [
              ...aaa,
              ...bbbb,
              ...ccc,
            ].includes(value)
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): ignores nullable array elements`,
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
                messageId: 'unexpectedArrayIncludesOrder',
              },
            ],
            output: dedent`
              ['a', 'b', 'c',, 'd'].includes(value)
            `,
            code: dedent`
              ['b', 'a', 'c',, 'd'].includes(value)
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              ['a', 'b', 'c',, 'd'].includes(value)
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allow to put spread elements to the end`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: '...other',
                  right: 'c',
                },
                messageId: 'unexpectedArrayIncludesOrder',
              },
            ],
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
            output: dedent`
              ['a', 'b', 'c', ...other].includes(value)
            `,
            code: dedent`
              ['a', 'b', ...other, 'c'].includes(value)
            `,
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
            code: dedent`
              ['a', 'b', 'c', ...other].includes(value)
            `,
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts array constructor`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          output: dedent`
            new Array(
              'a',
              'b',
              'c',
              'd',
            ).includes(value)
          `,
          code: dedent`
            new Array(
              'a',
              'c',
              'b',
              'd',
            ).includes(value)
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Array(
              'a',
              'b',
              'c',
              'd',
            ).includes(value)
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): allows mixed sorting`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '...d',
                left: 'bbb',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          output: dedent`
            new Array(
              ...d,
              'aaaa',
              'bbb',
              'cc',
            ).includes(value)
          `,
          code: dedent`
            new Array(
              'aaaa',
              'bbb',
              ...d,
              'cc',
            ).includes(value)
          `,
          options: [
            {
              ...options,
              groupKind: 'mixed',
            },
          ],
        },
      ],
      valid: [
        {
          code: dedent`
            new Array(
              ...d,
              'aaaa',
              'bbb',
              'cc',
            ).includes(value)
          `,
          options: [
            {
              ...options,
              groupKind: 'mixed',
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

    ruleTester.run(
      `${ruleName}(${type}): does not break the property list`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'bbbb',
                  left: 'ccc',
                },
                messageId: 'unexpectedArrayIncludesOrder',
              },
            ],
            output: dedent`
              [
                'aaaaa',
                'bbbb',
                'ccc',
                'dd',
                'e',
                ...other,
              ].includes(value)
            `,
            code: dedent`
              [
                'aaaaa',
                'ccc',
                'bbbb',
                'dd',
                'e',
                ...other,
              ].includes(value)
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              [
                'aaaaa',
                'bbbb',
                'ccc',
                'dd',
                'e',
                ...other,
              ].includes(value)
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts spread elements`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '...bbbb',
                left: '...aaa',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          output: dedent`
            [
              ...bbbb,
              ...aaa,
              ...ccc,
            ].includes(value)
          `,
          code: dedent`
            [
              ...aaa,
              ...bbbb,
              ...ccc,
            ].includes(value)
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            [
              ...bbbb,
              ...aaa,
              ...ccc,
            ].includes(value)
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): ignores nullable array elements`,
      rule,
      {
        valid: [
          {
            code: dedent`
              ['a', 'b', 'c',, 'd'].includes(value)
            `,
            options: [options],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allow to put spread elements to the end`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: '...other',
                  right: 'c',
                },
                messageId: 'unexpectedArrayIncludesOrder',
              },
            ],
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
            output: dedent`
              ['a', 'b', 'c', ...other].includes(value)
            `,
            code: dedent`
              ['a', 'b', ...other, 'c'].includes(value)
            `,
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
            code: dedent`
              ['a', 'b', 'c', ...other].includes(value)
            `,
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts array constructor`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'bbb',
                left: 'cc',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          output: dedent`
            new Array(
              'aaaa',
              'bbb',
              'cc',
              'd',
            ).includes(value)
          `,
          code: dedent`
            new Array(
              'aaaa',
              'cc',
              'bbb',
              'd',
            ).includes(value)
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Array(
              'aaaa',
              'bbb',
              'cc',
              'd',
            ).includes(value)
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): allows mixed sorting`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                left: '...d',
                right: 'bbb',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          output: dedent`
            new Array(
              'aaaa',
              'bbb',
              ...d,
              'cc',
            ).includes(value)
          `,
          code: dedent`
            new Array(
              'aaaa',
              ...d,
              'bbb',
              'cc',
            ).includes(value)
          `,
          options: [
            {
              ...options,
              groupKind: 'mixed',
            },
          ],
        },
      ],
      valid: [
        {
          code: dedent`
            new Array(
              'aaaa',
              'bbb',
              ...d,
              'cc',
            ).includes(value)
          `,
          options: [
            {
              ...options,
              groupKind: 'mixed',
            },
          ],
        },
      ],
    })
  })

  describe(`${ruleName}: misc`, () => {
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
                messageId: 'unexpectedArrayIncludesOrder',
              },
              {
                data: {
                  right: 'c',
                  left: 'd',
                },
                messageId: 'unexpectedArrayIncludesOrder',
              },
            ],
            output: dedent`
              [
                'a',
                'b',
                'c',
                'd',
              ].includes(value)
            `,
            code: dedent`
              [
                'b',
                'a',
                'd',
                'c',
              ].includes(value)
            `,
          },
        ],
        valid: [
          dedent`
            [
              'a',
              'b',
              'c',
              'd',
            ].includes(value)
          `,
          {
            code: dedent`
              [
                'v1.png',
                'v10.png',
                'v12.png',
                'v2.png',
              ].includes(value)
            `,
            options: [
              {
                ignoreCase: false,
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}: works consistently with an empty array or an array with one element`,
      rule,
      {
        valid: ['[].includes(value)', "['a'].includes(value)"],
        invalid: [],
      },
    )

    ruleTester.run(`${ruleName}: ignores quotes of strings`, rule, {
      valid: [
        dedent`
          ['a', "b", 'c'].includes(value)
        `,
      ],
      invalid: [],
    })

    let eslintDisableRuleTesterName = `${ruleName}: supports 'eslint-disable' for individual nodes`
    ruleTester.run(eslintDisableRuleTesterName, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          output: dedent`
            [
              'b',
              'c',
              // eslint-disable-next-line
              'a',
            ].includes(value)
          `,
          code: dedent`
            [
              'c',
              'b',
              // eslint-disable-next-line
              'a',
            ].includes(value)
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'c',
                left: 'd',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          output: dedent`
            [
              'b',
              'c',
              // eslint-disable-next-line
              'a',
              'd'
            ].includes(value)
          `,
          code: dedent`
            [
              'd',
              'c',
              // eslint-disable-next-line
              'a',
              'b'
            ].includes(value)
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
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
            {
              data: {
                right: '...anotherArray',
                left: 'a',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          output: dedent`
            [
              ...anotherArray,
              'b',
              // eslint-disable-next-line
              'a',
              'c'
            ].includes(value)
          `,
          code: dedent`
            [
              'c',
              'b',
              // eslint-disable-next-line
              'a',
              ...anotherArray
            ].includes(value)
          `,
          options: [
            {
              groupKind: 'mixed',
            },
          ],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          output: dedent`
            [
              'b',
              'c',
              'a', // eslint-disable-line
            ].includes(value)
          `,
          code: dedent`
            [
              'c',
              'b',
              'a', // eslint-disable-line
            ].includes(value)
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          output: dedent`
            [
              'b',
              'c',
              /* eslint-disable-next-line */
              'a',
            ].includes(value)
          `,
          code: dedent`
            [
              'c',
              'b',
              /* eslint-disable-next-line */
              'a',
            ].includes(value)
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          output: dedent`
            [
              'b',
              'c',
              'a', /* eslint-disable-line */
            ].includes(value)
          `,
          code: dedent`
            [
              'c',
              'b',
              'a', /* eslint-disable-line */
            ].includes(value)
          `,
          options: [{}],
        },
        {
          output: dedent`
            [
              'a',
              'd',
              /* eslint-disable */
              'c',
              'b',
              // Shouldn't move
              /* eslint-enable */
              'e',
            ].includes(value)
          `,
          code: dedent`
            [
              'd',
              'e',
              /* eslint-disable */
              'c',
              'b',
              // Shouldn't move
              /* eslint-enable */
              'a',
            ].includes(value)
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            [
              'b',
              'c',
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              'a',
            ].includes(value)
          `,
          code: dedent`
            [
              'c',
              'b',
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              'a',
            ].includes(value)
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          output: dedent`
            [
              'b',
              'c',
              'a', // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            ].includes(value)
          `,
          code: dedent`
            [
              'c',
              'b',
              'a', // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            ].includes(value)
          `,
          options: [{}],
        },
        {
          output: dedent`
            [
              'b',
              'c',
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              'a',
            ].includes(value)
          `,
          code: dedent`
            [
              'c',
              'b',
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              'a',
            ].includes(value)
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          output: dedent`
            [
              'b',
              'c',
              'a', /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            ].includes(value)
          `,
          code: dedent`
            [
              'c',
              'b',
              'a', /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            ].includes(value)
          `,
          options: [{}],
        },
        {
          output: dedent`
            [
              'a',
              'd',
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              'c',
              'b',
              // Shouldn't move
              /* eslint-enable */
              'e',
            ].includes(value)
          `,
          code: dedent`
            [
              'd',
              'e',
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              'c',
              'b',
              // Shouldn't move
              /* eslint-enable */
              'a',
            ].includes(value)
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedArrayIncludesOrder',
            },
          ],
          options: [{}],
        },
      ],
      valid: [],
    })
  })
})
