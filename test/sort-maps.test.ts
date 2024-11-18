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
        invalid: [
          {
            errors: [
              {
                data: {
                  right: "'a'",
                  left: "'b'",
                },
                messageId: 'unexpectedMapElementsOrder',
              },
            ],
            output: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['a', 'aa'],
                ['b', 'b'],
              ])
            `,
            code: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['b', 'b'],
                ['a', 'aa'],
              ])
            `,
            options: [options],
          },
        ],
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
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'aa',
                left: 'b',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
              new Map([
                [aa, aa],
                [b, b],
              ])
            `,
          code: dedent`
              new Map([
                [b, b],
                [aa, aa],
              ])
            `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}(${type}): works with numbers as keys`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '1',
                left: '2',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
              new Map([
                [1, 'one'],
                [2, 'two'],
                [3, 'three'],
              ])
            `,
          code: dedent`
              new Map([
                [2, 'two'],
                [1, 'one'],
                [3, 'three'],
              ])
            `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}(${type}): sorts variable identifiers`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'cc',
                left: 'd',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
            {
              data: {
                right: 'bbb',
                left: 'cc',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              aaaa,
              bbb,
              cc,
              d,
            ])
          `,
          code: dedent`
            new Map([
              aaaa,
              d,
              cc,
              bbb,
            ])
          `,
          options: [options],
        },
      ],
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
    })

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
                messageId: 'unexpectedMapElementsOrder',
              },
              {
                data: {
                  right: 'b',
                  left: 'e',
                },
                messageId: 'unexpectedMapElementsOrder',
              },
            ],
            output: dedent`
              new Map([
                [a, 'a'],
                [d, 'd'],

                [c, 'c'],

                [b, 'b'],
                [e, 'e'],
              ])
            `,
            code: dedent`
              new Map([
                [d, 'd'],
                [a, 'a'],

                [c, 'c'],

                [e, 'e'],
                [b, 'b'],
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

    describe(`${ruleName}(${type}): partition comments`, () => {
      ruleTester.run(
        `${ruleName}(${type}): allows to use partition comments`,
        rule,
        {
          invalid: [
            {
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
              errors: [
                {
                  data: {
                    right: 'bbb',
                    left: 'd',
                  },
                  messageId: 'unexpectedMapElementsOrder',
                },
                {
                  data: {
                    right: 'fff',
                    left: 'gg',
                  },
                  messageId: 'unexpectedMapElementsOrder',
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
          invalid: [
            {
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
              errors: [
                {
                  data: {
                    right: 'bb',
                    left: 'c',
                  },
                  messageId: 'unexpectedMapElementsOrder',
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
            options: [
              {
                ...options,
                specialCharacters: 'remove',
              },
            ],
            code: dedent`
              new Map([
                [ab, 'ab'],
                [a_c, 'ac'],
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
        invalid: [
          {
            errors: [
              {
                data: {
                  right: "'a'",
                  left: "'b'",
                },
                messageId: 'unexpectedMapElementsOrder',
              },
            ],
            output: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['a', 'aa'],
                ['b', 'b'],
              ])
            `,
            code: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['b', 'b'],
                ['a', 'aa'],
              ])
            `,
            options: [options],
          },
        ],
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
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'aa',
                left: 'b',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
              new Map([
                [aa, aa],
                [b, b],
              ])
            `,
          code: dedent`
              new Map([
                [b, b],
                [aa, aa],
              ])
            `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}(${type}): works with numbers as keys`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '1',
                left: '2',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              [1, 'one'],
              [2, 'two'],
              [3, 'three'],
            ])
          `,
          code: dedent`
            new Map([
              [2, 'two'],
              [1, 'one'],
              [3, 'three'],
            ])
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}(${type}): sorts variable identifiers`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'cc',
                left: 'd',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
            {
              data: {
                right: 'bbb',
                left: 'cc',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              aaaa,
              bbb,
              cc,
              d,
            ])
          `,
          code: dedent`
            new Map([
              aaaa,
              d,
              cc,
              bbb,
            ])
          `,
          options: [options],
        },
      ],
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
                  right: "'a'",
                  left: "'b'",
                },
                messageId: 'unexpectedMapElementsOrder',
              },
            ],
            output: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['a', 'aa'],
                ['b', 'b'],
              ])
            `,
            code: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['b', 'b'],
                ['a', 'aa'],
              ])
            `,
            options: [options],
          },
        ],
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
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): both key and value affect sorting by length`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: "'USD'",
                  left: "'EUR'",
                },
                messageId: 'unexpectedMapElementsOrder',
              },
            ],
            output: dedent`
              new Map([
                ['USD', 'United States dollar'],
                ['EUR', 'Euro'],
              ])
            `,
            code: dedent`
              new Map([
                ['EUR', 'Euro'],
                ['USD', 'United States dollar'],
              ])
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  right: "'United States'",
                  left: "'Europe'",
                },
                messageId: 'unexpectedMapElementsOrder',
              },
            ],
            output: dedent`
              new Map([
                ['United States', 'USD'],
                ['Europe', 'EUR'],
              ])
            `,
            code: dedent`
              new Map([
                ['Europe', 'EUR'],
                ['United States', 'USD'],
              ])
            `,
            options: [options],
          },
        ],
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
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'aa',
                left: 'b',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
              new Map([
                [aa, aa],
                [b, b],
              ])
            `,
          code: dedent`
              new Map([
                [b, b],
                [aa, aa],
              ])
            `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}(${type}): works with numbers as keys`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '3',
                left: '1',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              [3, 'three'],
              [2, 'two'],
              [1, 'one'],
            ])
          `,
          code: dedent`
            new Map([
              [2, 'two'],
              [1, 'one'],
              [3, 'three'],
            ])
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}(${type}): sorts variable identifiers`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'cc',
                left: 'd',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
            {
              data: {
                right: 'bbb',
                left: 'cc',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              aaaa,
              bbb,
              cc,
              d,
            ])
          `,
          code: dedent`
            new Map([
              aaaa,
              d,
              cc,
              bbb,
            ])
          `,
          options: [options],
        },
      ],
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
    })
  })

  describe(`${ruleName}: misc`, () => {
    ruleTester.run(
      `${ruleName}: sets alphabetical asc sorting as default`,
      rule,
      {
        invalid: [
          {
            output: dedent`
              new Map([
                ['CNY', 'Renminbi'],
                ['EUR', 'Euro'],
                ['GBP', 'Sterling'],
                ['RUB', 'Russian ruble'],
                ['USD', 'United States dollar'],
              ])
            `,
            code: dedent`
              new Map([
                ['CNY', 'Renminbi'],
                ['RUB', 'Russian ruble'],
                ['USD', 'United States dollar'],
                ['EUR', 'Euro'],
                ['GBP', 'Sterling'],
              ])
            `,
            errors: [
              {
                data: {
                  right: "'EUR'",
                  left: "'USD'",
                },
                messageId: 'unexpectedMapElementsOrder',
              },
            ],
          },
        ],
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
        invalid: [
          {
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
            errors: [
              {
                data: {
                  left: '1_000',
                  right: '100',
                },
                messageId: 'unexpectedMapElementsOrder',
              },
            ],
            options: [
              {
                type: 'natural',
                order: 'asc',
              },
            ],
          },
        ],
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
      },
    )

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
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              [b, 'b'],
              [c, 'c'],
              // eslint-disable-next-line
              [a, 'a']
            ])
          `,
          code: dedent`
            new Map([
              [c, 'c'],
              [b, 'b'],
              // eslint-disable-next-line
              [a, 'a']
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
              messageId: 'unexpectedMapElementsOrder',
            },
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              [b, 'b'],
              [c, 'c'],
              // eslint-disable-next-line
              [a, 'a'],
              [d, 'd']
            ])
          `,
          code: dedent`
            new Map([
              [d, 'd'],
              [c, 'c'],
              // eslint-disable-next-line
              [a, 'a'],
              [b, 'b']
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
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              [b, 'b'],
              [c, 'c'],
              [a, 'a'] // eslint-disable-line
            ])
          `,
          code: dedent`
            new Map([
              [c, 'c'],
              [b, 'b'],
              [a, 'a'] // eslint-disable-line
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
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              [b, 'b'],
              [c, 'c'],
              /* eslint-disable-next-line */
              [a, 'a']
            ])
          `,
          code: dedent`
            new Map([
              [c, 'c'],
              [b, 'b'],
              /* eslint-disable-next-line */
              [a, 'a']
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
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              [b, 'b'],
              [c, 'c'],
              [a, 'a'] /* eslint-disable-line */
            ])
          `,
          code: dedent`
            new Map([
              [c, 'c'],
              [b, 'b'],
              [a, 'a'] /* eslint-disable-line */
            ])
          `,
          options: [{}],
        },
        {
          output: dedent`
            new Map([
              [a, 'a'],
              [d, 'd'],
              /* eslint-disable */
              [c, 'c'],
              [b, 'b'],
              // Shouldn't move
              /* eslint-enable */
              [e, 'e'],
            ])
          `,
          code: dedent`
            new Map([
              [d, 'd'],
              [e, 'e'],
              /* eslint-disable */
              [c, 'c'],
              [b, 'b'],
              // Shouldn't move
              /* eslint-enable */
              [a, 'a'],
            ])
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            new Map([
              [b, 'b'],
              [c, 'c'],
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              [a, 'a']
            ])
          `,
          code: dedent`
            new Map([
              [c, 'c'],
              [b, 'b'],
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              [a, 'a']
            ])
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            new Map([
              [b, 'b'],
              [c, 'c'],
              [a, 'a'] // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            ])
          `,
          code: dedent`
            new Map([
              [c, 'c'],
              [b, 'b'],
              [a, 'a'] // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            ])
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            new Map([
              [b, 'b'],
              [c, 'c'],
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              [a, 'a']
            ])
          `,
          code: dedent`
            new Map([
              [c, 'c'],
              [b, 'b'],
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              [a, 'a']
            ])
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            new Map([
              [b, 'b'],
              [c, 'c'],
              [a, 'a'] /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            ])
          `,
          code: dedent`
            new Map([
              [c, 'c'],
              [b, 'b'],
              [a, 'a'] /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            ])
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            new Map([
              [a, 'a'],
              [d, 'd'],
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              [c, 'c'],
              [b, 'b'],
              // Shouldn't move
              /* eslint-enable */
              [e, 'e'],
            ])
          `,
          code: dedent`
            new Map([
              [d, 'd'],
              [e, 'e'],
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              [c, 'c'],
              [b, 'b'],
              // Shouldn't move
              /* eslint-enable */
              [a, 'a'],
            ])
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          options: [{}],
        },
      ],
      valid: [],
    })
  })
})
