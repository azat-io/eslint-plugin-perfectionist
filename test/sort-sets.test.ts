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
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSetsOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts spread elements`, rule, {
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
      invalid: [
        {
          code: dedent`
            new Set([
              ...aaa,
              ...ccc,
              ...bbbb,
            ])
          `,
          output: dedent`
            new Set([
              ...aaa,
              ...bbbb,
              ...ccc,
            ])
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedSetsOrder',
              data: {
                left: '...ccc',
                right: '...bbbb',
              },
            },
          ],
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
        invalid: [
          {
            code: dedent`
              new Set(['b', 'a', 'c',, 'd'])
            `,
            output: dedent`
              new Set(['a', 'b', 'c',, 'd'])
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSetsOrder',
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

    ruleTester.run(
      `${ruleName}(${type}): allow to put spread elements to the end`,
      rule,
      {
        valid: [
          {
            code: dedent`
              new Set(['a', 'b', 'c', ...other])
            `,
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              new Set(['a', 'b', ...other, 'c'])
            `,
            output: dedent`
              new Set(['a', 'b', 'c', ...other])
            `,
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedSetsOrder',
                data: {
                  left: '...other',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts array constructor`, rule, {
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
      invalid: [
        {
          code: dedent`
            new Set(new Array(
              'a',
              'c',
              'b',
              'd',
            ))
          `,
          output: dedent`
            new Set(new Array(
              'a',
              'b',
              'c',
              'd',
            ))
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedSetsOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): allows mixed sorting`, rule, {
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
      invalid: [
        {
          code: dedent`
            new Set(new Array(
              'aaaa',
              'bbb',
              ...d,
              'cc',
            ))
          `,
          output: dedent`
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
          errors: [
            {
              messageId: 'unexpectedSetsOrder',
              data: {
                left: 'bbb',
                right: '...d',
              },
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
          valid: [],
          invalid: [
            {
              code: dedent`
              new Set([
                'd',
                'a',

                'c',

                'e',
                'b',
              ])
            `,
              output: dedent`
              new Set([
                'a',
                'd',

                'c',

                'b',
                'e',
              ])
            `,
              options: [
                {
                  ...options,
                  partitionByNewLine: true,
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedSetsOrder',
                  data: {
                    left: 'd',
                    right: 'a',
                  },
                },
                {
                  messageId: 'unexpectedSetsOrder',
                  data: {
                    left: 'e',
                    right: 'b',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize partitions over group kind`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                new Set([
                  'c',
                  ...d,

                  'a',
                  ...b,
                ])
              `,
              output: dedent`
                new Set([
                  ...d,
                  'c',

                  ...b,
                  'a',
                ])
              `,
              options: [
                {
                  ...options,
                  partitionByNewLine: true,
                  groupKind: 'spreads-first',
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedSetsOrder',
                  data: {
                    left: 'c',
                    right: '...d',
                  },
                },
                {
                  messageId: 'unexpectedSetsOrder',
                  data: {
                    left: 'a',
                    right: '...b',
                  },
                },
              ],
            },
          ],
        },
      )
    })

    describe(`${ruleName}(${type}): partition comments`, () => {
      ruleTester.run(
        `${ruleName}(${type}): allows to use partition comments`,
        rule,
        {
          valid: [],
          invalid: [
            {
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
              options: [
                {
                  ...options,
                  partitionByComment: '^Part*',
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedSetsOrder',
                  data: {
                    left: 'd',
                    right: 'bbb',
                  },
                },
                {
                  messageId: 'unexpectedSetsOrder',
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
          valid: [],
          invalid: [
            {
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
              options: [
                {
                  ...options,
                  partitionByComment: ['Partition Comment', 'Part: *', 'Other'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedSetsOrder',
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
            code: dedent`
              new Set([
                'ab',
                'a$c',
              ])
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
        valid: [],
        invalid: [
          {
            code: dedent`
              new Set([
                b, a
              ])
            `,
            output: dedent`
              new Set([
                a, b
              ])
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSetsOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
          {
            code: dedent`
              new Set([
                b, a,
              ])
            `,
            output: dedent`
              new Set([
                a, b,
              ])
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSetsOrder',
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
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSetsOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts spread elements`, rule, {
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
      invalid: [
        {
          code: dedent`
            new Set([
              ...aaa,
              ...ccc,
              ...bbbb,
            ])
          `,
          output: dedent`
            new Set([
              ...aaa,
              ...bbbb,
              ...ccc,
            ])
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedSetsOrder',
              data: {
                left: '...ccc',
                right: '...bbbb',
              },
            },
          ],
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
        invalid: [
          {
            code: dedent`
              new Set(['b', 'a', 'c',, 'd'])
            `,
            output: dedent`
              new Set(['a', 'b', 'c',, 'd'])
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSetsOrder',
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

    ruleTester.run(
      `${ruleName}(${type}): allow to put spread elements to the end`,
      rule,
      {
        valid: [
          {
            code: dedent`
              new Set(['a', 'b', 'c', ...other])
            `,
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              new Set(['a', 'b', ...other, 'c'])
            `,
            output: dedent`
              new Set(['a', 'b', 'c', ...other])
            `,
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedSetsOrder',
                data: {
                  left: '...other',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts array constructor`, rule, {
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
      invalid: [
        {
          code: dedent`
            new Set(new Array(
              'a',
              'c',
              'b',
              'd',
            ))
          `,
          output: dedent`
            new Set(new Array(
              'a',
              'b',
              'c',
              'd',
            ))
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedSetsOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): allows mixed sorting`, rule, {
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
      invalid: [
        {
          code: dedent`
            new Set(new Array(
              'aaaa',
              'bbb',
              ...d,
              'cc',
            ))
          `,
          output: dedent`
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
          errors: [
            {
              messageId: 'unexpectedSetsOrder',
              data: {
                left: 'bbb',
                right: '...d',
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

    ruleTester.run(
      `${ruleName}(${type}): does not break the property list`,
      rule,
      {
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
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSetsOrder',
                data: {
                  left: 'ccc',
                  right: 'bbbb',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts spread elements`, rule, {
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
      invalid: [
        {
          code: dedent`
            new Set([
              ...aaa,
              ...bbbb,
              ...ccc,
            ])
          `,
          output: dedent`
            new Set([
              ...bbbb,
              ...aaa,
              ...ccc,
            ])
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedSetsOrder',
              data: {
                left: '...aaa',
                right: '...bbbb',
              },
            },
          ],
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
        valid: [
          {
            code: dedent`
              new Set(['a', 'b', 'c', ...other])
            `,
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              new Set(['a', 'b', ...other, 'c'])
            `,
            output: dedent`
              new Set(['a', 'b', 'c', ...other])
            `,
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedSetsOrder',
                data: {
                  left: '...other',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts array constructor`, rule, {
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
      invalid: [
        {
          code: dedent`
            new Set(new Array(
              'aaaa',
              'cc',
              'bbb',
              'd',
            ))
          `,
          output: dedent`
            new Set(new Array(
              'aaaa',
              'bbb',
              'cc',
              'd',
            ))
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedSetsOrder',
              data: {
                left: 'cc',
                right: 'bbb',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): allows mixed sorting`, rule, {
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
      invalid: [
        {
          code: dedent`
            new Set(new Array(
              'aaaa',
              ...d,
              'bbb',
              'cc',
            ))
          `,
          output: dedent`
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
          errors: [
            {
              messageId: 'unexpectedSetsOrder',
              data: {
                left: '...d',
                right: 'bbb',
              },
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
        invalid: [
          {
            code: dedent`
              new Set([
                'b',
                'a',
                'd',
                'c',
              ])
            `,
            output: dedent`
              new Set([
                'a',
                'b',
                'c',
                'd',
              ])
            `,
            errors: [
              {
                messageId: 'unexpectedSetsOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
              {
                messageId: 'unexpectedSetsOrder',
                data: {
                  left: 'd',
                  right: 'c',
                },
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
  })
})
