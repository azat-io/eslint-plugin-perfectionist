import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule from '../rules/sort-maps'

let ruleName = 'sort-maps'

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
              new Map([
                ['a', 'a'],
              ])
            `,
            options: [options],
          },
          {
            code: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['a', 'aa'],
                ['b', 'b'],
              ])
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['b', 'b'],
                ['a', 'aa'],
              ])
            `,
            output: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['a', 'aa'],
                ['b', 'b'],
              ])
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedMapElementsOrder',
                data: {
                  left: "'b'",
                  right: "'a'",
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): not sorts spread elements`, rule, {
      valid: [
        {
          code: dedent`
            new Map([
              ...aaa,
              ...bb,
            ])
          `,
          options: [options],
        },
        {
          code: dedent`
            new Map([
              ...bb,
              ...aaa,
            ])
          `,
          options: [options],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}(${type}): works with variables as keys`, rule, {
      valid: [
        {
          code: dedent`
              new Map([
                [aa, aa],
                [b, b],
              ])
            `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
              new Map([
                [b, b],
                [aa, aa],
              ])
            `,
          output: dedent`
              new Map([
                [aa, aa],
                [b, b],
              ])
            `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedMapElementsOrder',
              data: {
                left: 'b',
                right: 'aa',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): works with numbers as keys`, rule, {
      valid: [
        {
          code: dedent`
              new Map([
                [1, 'one'],
                [2, 'two'],
                [3, 'three'],
              ])
            `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
              new Map([
                [2, 'two'],
                [1, 'one'],
                [3, 'three'],
              ])
            `,
          output: dedent`
              new Map([
                [1, 'one'],
                [2, 'two'],
                [3, 'three'],
              ])
            `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedMapElementsOrder',
              data: {
                left: '2',
                right: '1',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts variable identifiers`, rule, {
      valid: [
        {
          code: dedent`
            new Map([
              aaaa,
              bbb,
              cc,
              d,
            ])
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            new Map([
              aaaa,
              d,
              cc,
              bbb,
            ])
          `,
          output: dedent`
            new Map([
              aaaa,
              bbb,
              cc,
              d,
            ])
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedMapElementsOrder',
              data: {
                left: 'd',
                right: 'cc',
              },
            },
            {
              messageId: 'unexpectedMapElementsOrder',
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
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              new Map([
                [d, 'd'],
                [a, 'a'],

                [c, 'c'],

                [e, 'e'],
                [b, 'b'],
              ])
            `,
            output: dedent`
              new Map([
                [a, 'a'],
                [d, 'd'],

                [c, 'c'],

                [b, 'b'],
                [e, 'e'],
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
                messageId: 'unexpectedMapElementsOrder',
                data: {
                  left: 'd',
                  right: 'a',
                },
              },
              {
                messageId: 'unexpectedMapElementsOrder',
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

    describe(`${ruleName}(${type}): partition comments`, () => {
      ruleTester.run(
        `${ruleName}(${type}): allows to use partition comments`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                new Map([
                  // Part: A
                  [cc, 'cc'],
                  [d, 'd'],
                  // Not partition comment
                  [bbb, 'bbb'],
                  // Part: B
                  [aaaa, 'aaaa'],
                  [e, 'e'],
                  // Part: C
                  [gg, 'gg'],
                  // Not partition comment
                  [fff, 'fff'],
                ])
              `,
              output: dedent`
                new Map([
                  // Part: A
                  // Not partition comment
                  [bbb, 'bbb'],
                  [cc, 'cc'],
                  [d, 'd'],
                  // Part: B
                  [aaaa, 'aaaa'],
                  [e, 'e'],
                  // Part: C
                  // Not partition comment
                  [fff, 'fff'],
                  [gg, 'gg'],
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
                  messageId: 'unexpectedMapElementsOrder',
                  data: {
                    left: 'd',
                    right: 'bbb',
                  },
                },
                {
                  messageId: 'unexpectedMapElementsOrder',
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
                new Map([
                  // Comment
                  [bb, 'bb'],
                  // Other comment
                  [a, 'a'],
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
                new Map([
                  /* Partition Comment */
                  // Part: A
                  [d, 'd'],
                  // Part: B
                  [aaa, 'aaa'],
                  [c, 'c'],
                  [bb, 'bb'],
                  /* Other */
                  [e, 'e'],
                ])
              `,
              output: dedent`
                new Map([
                  /* Partition Comment */
                  // Part: A
                  [d, 'd'],
                  // Part: B
                  [aaa, 'aaa'],
                  [bb, 'bb'],
                  [c, 'c'],
                  /* Other */
                  [e, 'e'],
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
                  messageId: 'unexpectedMapElementsOrder',
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
              new Map([
                ['e', 'e'],
                ['f', 'f'],
                // I am a partition comment because I don't have f o o
                ['a', 'a'],
                ['b', 'b'],
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
              new Map([
                [_a, 'a'],
                [b, 'b'],
                [_c, 'c'],
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
              new Map([
                [ab, 'ab'],
                [a_c, 'ac'],
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
              new Map([
                [你好, '你好'],
                [世界, '世界'],
                [a, 'a'],
                [A, 'A'],
                [b, 'b'],
                [B, 'B'],
              ])
            `,
          options: [{ ...options, locales: 'zh-CN' }],
        },
      ],
      invalid: [],
    })
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
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['a', 'aa'],
                ['b', 'b'],
              ])
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['b', 'b'],
                ['a', 'aa'],
              ])
            `,
            output: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['a', 'aa'],
                ['b', 'b'],
              ])
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedMapElementsOrder',
                data: {
                  left: "'b'",
                  right: "'a'",
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): not sorts spread elements`, rule, {
      valid: [
        {
          code: dedent`
            new Map([
              ...aaa,
              ...bb,
            ])
          `,
          options: [options],
        },
        {
          code: dedent`
            new Map([
              ...bb,
              ...aaa,
            ])
          `,
          options: [options],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}(${type}): works with variables as keys`, rule, {
      valid: [
        {
          code: dedent`
              new Map([
                [aa, aa],
                [b, b],
              ])
            `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
              new Map([
                [b, b],
                [aa, aa],
              ])
            `,
          output: dedent`
              new Map([
                [aa, aa],
                [b, b],
              ])
            `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedMapElementsOrder',
              data: {
                left: 'b',
                right: 'aa',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): works with numbers as keys`, rule, {
      valid: [
        {
          code: dedent`
            new Map([
              [1, 'one'],
              [2, 'two'],
              [3, 'three'],
            ])
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            new Map([
              [2, 'two'],
              [1, 'one'],
              [3, 'three'],
            ])
          `,
          output: dedent`
            new Map([
              [1, 'one'],
              [2, 'two'],
              [3, 'three'],
            ])
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedMapElementsOrder',
              data: {
                left: '2',
                right: '1',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts variable identifiers`, rule, {
      valid: [
        {
          code: dedent`
            new Map([
              aaaa,
              bbb,
              cc,
              d,
            ])
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            new Map([
              aaaa,
              d,
              cc,
              bbb,
            ])
          `,
          output: dedent`
            new Map([
              aaaa,
              bbb,
              cc,
              d,
            ])
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedMapElementsOrder',
              data: {
                left: 'd',
                right: 'cc',
              },
            },
            {
              messageId: 'unexpectedMapElementsOrder',
              data: {
                left: 'cc',
                right: 'bbb',
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
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['a', 'aa'],
                ['b', 'b'],
              ])
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['b', 'b'],
                ['a', 'aa'],
              ])
            `,
            output: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['a', 'aa'],
                ['b', 'b'],
              ])
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedMapElementsOrder',
                data: {
                  left: "'b'",
                  right: "'a'",
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): both key and value affect sorting by length`,
      rule,
      {
        valid: [
          {
            code: dedent`
              new Map([
                ['USD', 'United States dollar'],
                ['RUB', 'Russian ruble'],
                ['CNY', 'Renminbi'],
                ['GBP', 'Sterling'],
                ['EUR', 'Euro'],
              ])
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              new Map([
                ['EUR', 'Euro'],
                ['USD', 'United States dollar'],
              ])
            `,
            output: dedent`
              new Map([
                ['USD', 'United States dollar'],
                ['EUR', 'Euro'],
              ])
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedMapElementsOrder',
                data: {
                  left: "'EUR'",
                  right: "'USD'",
                },
              },
            ],
          },
          {
            code: dedent`
              new Map([
                ['Europe', 'EUR'],
                ['United States', 'USD'],
              ])
            `,
            output: dedent`
              new Map([
                ['United States', 'USD'],
                ['Europe', 'EUR'],
              ])
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedMapElementsOrder',
                data: {
                  left: "'Europe'",
                  right: "'United States'",
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): not sorts spread elements`, rule, {
      valid: [
        {
          code: dedent`
            new Map([
              ...aaa,
              ...bb,
            ])
          `,
          options: [options],
        },
        {
          code: dedent`
            new Map([
              ...bb,
              ...aaa,
            ])
          `,
          options: [options],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}(${type}): works with variables as keys`, rule, {
      valid: [
        {
          code: dedent`
              new Map([
                [aa, aa],
                [b, b],
              ])
            `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
              new Map([
                [b, b],
                [aa, aa],
              ])
            `,
          output: dedent`
              new Map([
                [aa, aa],
                [b, b],
              ])
            `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedMapElementsOrder',
              data: {
                left: 'b',
                right: 'aa',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): works with numbers as keys`, rule, {
      valid: [
        {
          code: dedent`
            new Map([
              [3, 'three'],
              [1, 'one'],
              [2, 'two'],
            ])
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            new Map([
              [2, 'two'],
              [1, 'one'],
              [3, 'three'],
            ])
          `,
          output: dedent`
            new Map([
              [3, 'three'],
              [2, 'two'],
              [1, 'one'],
            ])
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedMapElementsOrder',
              data: {
                left: '1',
                right: '3',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts variable identifiers`, rule, {
      valid: [
        {
          code: dedent`
            new Map([
              aaaa,
              bbb,
              cc,
              d,
            ])
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            new Map([
              aaaa,
              d,
              cc,
              bbb,
            ])
          `,
          output: dedent`
            new Map([
              aaaa,
              bbb,
              cc,
              d,
            ])
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedMapElementsOrder',
              data: {
                left: 'd',
                right: 'cc',
              },
            },
            {
              messageId: 'unexpectedMapElementsOrder',
              data: {
                left: 'cc',
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
            new Map([
              ['CNY', 'Renminbi'],
              ['EUR', 'Euro'],
              ['GBP', 'Sterling'],
              ['RUB', 'Russian ruble'],
              ['USD', 'United States dollar'],
            ])
          `,
          {
            code: dedent`
              new Map([
                ['img1.png', '/img1.png'],
                ['img10.png', '/img10.png'],
                ['img12.png', '/img12.png'],
                ['img2.png', '/img2.png']
              ])
            `,
            options: [{}],
          },
        ],
        invalid: [
          {
            code: dedent`
              new Map([
                ['CNY', 'Renminbi'],
                ['RUB', 'Russian ruble'],
                ['USD', 'United States dollar'],
                ['EUR', 'Euro'],
                ['GBP', 'Sterling'],
              ])
            `,
            output: dedent`
              new Map([
                ['CNY', 'Renminbi'],
                ['EUR', 'Euro'],
                ['GBP', 'Sterling'],
                ['RUB', 'Russian ruble'],
                ['USD', 'United States dollar'],
              ])
            `,
            errors: [
              {
                messageId: 'unexpectedMapElementsOrder',
                data: {
                  left: "'USD'",
                  right: "'EUR'",
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}: works with empty map`, rule, {
      valid: ['new Map([[], []])', 'new Map()'],
      invalid: [],
    })

    ruleTester.run(
      `${ruleName}: respect numeric separators with natural sorting`,
      rule,
      {
        valid: [
          {
            code: dedent`
               new Map([
                [1, "first"],
                [2, "second"],
                [3, "third"],
                [100, "hundredth"],
                [1_000, "thousandth"],
                [1_000_000, "millionth"]
              ])
            `,
            options: [
              {
                type: 'natural',
                order: 'asc',
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
               new Map([
                [1, "first"],
                [2, "second"],
                [3, "third"],
                [1_000, "thousandth"],
                [100, "hundredth"],
                [1_000_000, "millionth"]
              ])
            `,
            output: dedent`
               new Map([
                [1, "first"],
                [2, "second"],
                [3, "third"],
                [100, "hundredth"],
                [1_000, "thousandth"],
                [1_000_000, "millionth"]
              ])
            `,
            options: [
              {
                type: 'natural',
                order: 'asc',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedMapElementsOrder',
                data: {
                  left: '1_000',
                  right: '100',
                },
              },
            ],
          },
        ],
      },
    )
  })
})
