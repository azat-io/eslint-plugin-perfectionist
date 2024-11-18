import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule from '../rules/sort-sets'

let ruleName = 'sort-sets'

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
                messageId: 'unexpectedSetsOrder',
              },
            ],
            output: dedent`
              new Set([
                'a',
                'b',
                'c',
                'd',
                'e',
                ...other,
              ])
            `,
            code: dedent`
              new Set([
                'a',
                'c',
                'b',
                'd',
                'e',
                ...other,
              ])
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              new Set([
                'a',
                'b',
                'c',
                'd',
                'e',
                ...other,
              ])
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
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              ...aaa,
              ...bbbb,
              ...ccc,
            ])
          `,
          code: dedent`
            new Set([
              ...aaa,
              ...ccc,
              ...bbbb,
            ])
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Set([
              ...aaa,
              ...bbbb,
              ...ccc,
            ])
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
                messageId: 'unexpectedSetsOrder',
              },
            ],
            output: dedent`
              new Set(['a', 'b', 'c',, 'd'])
            `,
            code: dedent`
              new Set(['b', 'a', 'c',, 'd'])
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              new Set(['a', 'b', 'c',, 'd'])
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
                messageId: 'unexpectedSetsOrder',
              },
            ],
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
            output: dedent`
              new Set(['a', 'b', 'c', ...other])
            `,
            code: dedent`
              new Set(['a', 'b', ...other, 'c'])
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
              new Set(['a', 'b', 'c', ...other])
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
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set(new Array(
              'a',
              'b',
              'c',
              'd',
            ))
          `,
          code: dedent`
            new Set(new Array(
              'a',
              'c',
              'b',
              'd',
            ))
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Set(new Array(
              'a',
              'b',
              'c',
              'd',
            ))
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
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set(new Array(
              ...d,
              'aaaa',
              'bbb',
              'cc',
            ))
          `,
          code: dedent`
            new Set(new Array(
              'aaaa',
              'bbb',
              ...d,
              'cc',
            ))
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
            new Set(new Array(
              ...d,
              'aaaa',
              'bbb',
              'cc',
            ))
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
                  messageId: 'unexpectedSetsOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'e',
                  },
                  messageId: 'unexpectedSetsOrder',
                },
              ],
              output: dedent`
              new Set([
                'a',
                'd',

                'c',

                'b',
                'e',
              ])
            `,
              code: dedent`
              new Set([
                'd',
                'a',

                'c',

                'e',
                'b',
              ])
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
                  messageId: 'unexpectedSetsOrder',
                },
                {
                  data: {
                    right: '...b',
                    left: 'a',
                  },
                  messageId: 'unexpectedSetsOrder',
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
                new Set([
                  ...d,
                  'c',

                  ...b,
                  'a',
                ])
              `,
              code: dedent`
                new Set([
                  'c',
                  ...d,

                  'a',
                  ...b,
                ])
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
                  messageId: 'unexpectedSetsOrder',
                },
                {
                  data: {
                    right: 'fff',
                    left: 'gg',
                  },
                  messageId: 'unexpectedSetsOrder',
                },
              ],
              output: dedent`
              new Set([
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
              ])
            `,
              code: dedent`
              new Set([
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
              ])
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
              new Set([
                // Comment
                'bb',
                // Other comment
                'a',
              ])
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
              new Set([
                /* Partition Comment */
                // Part: A
                'd',
                // Part: B
                'aaa',
                'bb',
                'c',
                /* Other */
                'e',
              ])
            `,
              code: dedent`
              new Set([
                /* Partition Comment */
                // Part: A
                'd',
                // Part: B
                'aaa',
                'c',
                'bb',
                /* Other */
                'e',
              ])
            `,
              errors: [
                {
                  data: {
                    right: 'bb',
                    left: 'c',
                  },
                  messageId: 'unexpectedSetsOrder',
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

      ruleTester.run(`${ruleName}(${type}): allows to use regex`, rule, {
        valid: [
          {
            code: dedent`
              new Set([
                'e',
                'f',
                // I am a partition comment because I don't have f o o
                'a',
                'b',
              ])
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
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`
              new Set([
                '$a',
                'b',
                '$c',
              ])
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
              new Set([
                'ab',
                'a$c',
              ])
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
              new Set([
                '你好',
                '世界',
                'a',
                'A',
                'b',
                'B',
              ])
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
                messageId: 'unexpectedSetsOrder',
              },
            ],
            output: dedent`
              new Set([
                a, b
              ])
            `,
            code: dedent`
              new Set([
                b, a
              ])
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
                messageId: 'unexpectedSetsOrder',
              },
            ],
            output: dedent`
              new Set([
                a, b,
              ])
            `,
            code: dedent`
              new Set([
                b, a,
              ])
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
                messageId: 'unexpectedSetsOrder',
              },
            ],
            output: dedent`
              new Set([
                'a',
                'b',
                'c',
                'd',
                'e',
                ...other,
              ])
            `,
            code: dedent`
              new Set([
                'a',
                'c',
                'b',
                'd',
                'e',
                ...other,
              ])
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              new Set([
                'a',
                'b',
                'c',
                'd',
                'e',
                ...other,
              ])
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
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              ...aaa,
              ...bbbb,
              ...ccc,
            ])
          `,
          code: dedent`
            new Set([
              ...aaa,
              ...ccc,
              ...bbbb,
            ])
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Set([
              ...aaa,
              ...bbbb,
              ...ccc,
            ])
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
                messageId: 'unexpectedSetsOrder',
              },
            ],
            output: dedent`
              new Set(['a', 'b', 'c',, 'd'])
            `,
            code: dedent`
              new Set(['b', 'a', 'c',, 'd'])
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              new Set(['a', 'b', 'c',, 'd'])
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
                messageId: 'unexpectedSetsOrder',
              },
            ],
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
            output: dedent`
              new Set(['a', 'b', 'c', ...other])
            `,
            code: dedent`
              new Set(['a', 'b', ...other, 'c'])
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
              new Set(['a', 'b', 'c', ...other])
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
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set(new Array(
              'a',
              'b',
              'c',
              'd',
            ))
          `,
          code: dedent`
            new Set(new Array(
              'a',
              'c',
              'b',
              'd',
            ))
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Set(new Array(
              'a',
              'b',
              'c',
              'd',
            ))
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
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set(new Array(
              ...d,
              'aaaa',
              'bbb',
              'cc',
            ))
          `,
          code: dedent`
            new Set(new Array(
              'aaaa',
              'bbb',
              ...d,
              'cc',
            ))
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
            new Set(new Array(
              ...d,
              'aaaa',
              'bbb',
              'cc',
            ))
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
                messageId: 'unexpectedSetsOrder',
              },
            ],
            output: dedent`
              new Set([
                'aaaaa',
                'bbbb',
                'ccc',
                'dd',
                'e',
                ...other,
              ])
            `,
            code: dedent`
              new Set([
                'aaaaa',
                'ccc',
                'bbbb',
                'dd',
                'e',
                ...other,
              ])
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              new Set([
                'aaaaa',
                'bbbb',
                'ccc',
                'dd',
                'e',
                ...other,
              ])
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
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              ...bbbb,
              ...aaa,
              ...ccc,
            ])
          `,
          code: dedent`
            new Set([
              ...aaa,
              ...bbbb,
              ...ccc,
            ])
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Set([
              ...bbbb,
              ...aaa,
              ...ccc,
            ])
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
              new Set(['a', 'b', 'c',, 'd'])
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
                messageId: 'unexpectedSetsOrder',
              },
            ],
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
            output: dedent`
              new Set(['a', 'b', 'c', ...other])
            `,
            code: dedent`
              new Set(['a', 'b', ...other, 'c'])
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
              new Set(['a', 'b', 'c', ...other])
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
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set(new Array(
              'aaaa',
              'bbb',
              'cc',
              'd',
            ))
          `,
          code: dedent`
            new Set(new Array(
              'aaaa',
              'cc',
              'bbb',
              'd',
            ))
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Set(new Array(
              'aaaa',
              'bbb',
              'cc',
              'd',
            ))
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
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set(new Array(
              'aaaa',
              'bbb',
              ...d,
              'cc',
            ))
          `,
          code: dedent`
            new Set(new Array(
              'aaaa',
              ...d,
              'bbb',
              'cc',
            ))
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
            new Set(new Array(
              'aaaa',
              'bbb',
              ...d,
              'cc',
            ))
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
                messageId: 'unexpectedSetsOrder',
              },
              {
                data: {
                  right: 'c',
                  left: 'd',
                },
                messageId: 'unexpectedSetsOrder',
              },
            ],
            output: dedent`
              new Set([
                'a',
                'b',
                'c',
                'd',
              ])
            `,
            code: dedent`
              new Set([
                'b',
                'a',
                'd',
                'c',
              ])
            `,
          },
        ],
        valid: [
          dedent`
            new Set([
              'a',
              'b',
              'c',
              'd',
            ])
          `,
          {
            code: dedent`
              new Set([
                'v1.png',
                'v10.png',
                'v12.png',
                'v2.png',
              ])
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
        valid: ['new Set([])', "new Set(['a'])"],
        invalid: [],
      },
    )

    ruleTester.run(`${ruleName}: ignores quotes of strings`, rule, {
      valid: [
        dedent`
          new Set(['a', "b", 'c'])
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
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              'b',
              'c',
              // eslint-disable-next-line
              'a',
            ])
          `,
          code: dedent`
            new Set([
              'c',
              'b',
              // eslint-disable-next-line
              'a',
            ])
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
              messageId: 'unexpectedSetsOrder',
            },
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              'b',
              'c',
              // eslint-disable-next-line
              'a',
              'd'
            ])
          `,
          code: dedent`
            new Set([
              'd',
              'c',
              // eslint-disable-next-line
              'a',
              'b'
            ])
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
              messageId: 'unexpectedSetsOrder',
            },
            {
              data: {
                right: '...anotherArray',
                left: 'a',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          code: dedent`
            new Set([
              'c',
              'b',
              // eslint-disable-next-line
              'a',
              ...anotherArray
            ])
          `,
          output: dedent`
          new Set([
            ...anotherArray,
            'b',
            // eslint-disable-next-line
            'a',
            'c'
          ])
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
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              'b',
              'c',
              'a', // eslint-disable-line
            ])
            `,
          code: dedent`
            new Set([
              'c',
              'b',
              'a', // eslint-disable-line
            ])
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
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              'b',
              'c',
              /* eslint-disable-next-line */
              'a',
            ])
            `,
          code: dedent`
          new Set([
            'c',
            'b',
            /* eslint-disable-next-line */
            'a',
          ])
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
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              'b',
              'c',
              'a', /* eslint-disable-line */
            ])
            `,
          code: dedent`
            new Set([
              'c',
              'b',
              'a', /* eslint-disable-line */
            ])
          `,
          options: [{}],
        },
        {
          output: dedent`
            new Set([
              'a',
              'd',
              /* eslint-disable */
              'c',
              'b',
              // Shouldn't move
              /* eslint-enable */
              'e',
            ])
          `,
          code: dedent`
            new Set([
              'd',
              'e',
              /* eslint-disable */
              'c',
              'b',
              // Shouldn't move
              /* eslint-enable */
              'a',
            ])
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            new Set([
              'b',
              'c',
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              'a',
            ])
            `,
          code: dedent`
            new Set([
              'c',
              'b',
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              'a',
            ])
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedSetsOrder',
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
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              'b',
              'c',
              'a', // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            ])
            `,
          code: dedent`
            new Set([
              'c',
              'b',
              'a', // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            ])
          `,
          options: [{}],
        },
        {
          output: dedent`
            new Set([
              'b',
              'c',
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              'a',
            ])
            `,
          code: dedent`
            new Set([
              'c',
              'b',
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              'a',
            ])
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            new Set([
              'b',
              'c',
              'a', /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            ])
            `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          code: dedent`
            new Set([
              'c',
              'b',
              'a', /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            ])
          `,
          options: [{}],
        },
        {
          output: dedent`
            new Set([
              'a',
              'd',
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              'c',
              'b',
              // Shouldn't move
              /* eslint-enable */
              'e',
            ])
          `,
          code: dedent`
            new Set([
              'd',
              'e',
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              'c',
              'b',
              // Shouldn't move
              /* eslint-enable */
              'a',
            ])
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          options: [{}],
        },
      ],
      valid: [],
    })
  })
})
