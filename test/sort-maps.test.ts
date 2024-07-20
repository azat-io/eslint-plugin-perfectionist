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
