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
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
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
            [
              ...aaa,
              ...bbbb,
              ...ccc,
            ].includes(value)
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            [
              ...aaa,
              ...ccc,
              ...bbbb,
            ].includes(value)
          `,
          output: dedent`
            [
              ...aaa,
              ...bbbb,
              ...ccc,
            ].includes(value)
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedArrayIncludesOrder',
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
              ['a', 'b', 'c',, 'd'].includes(value)
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              ['b', 'a', 'c',, 'd'].includes(value)
            `,
            output: dedent`
              ['a', 'b', 'c',, 'd'].includes(value)
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
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
              ['a', 'b', 'c', ...other].includes(value)
            `,
            options: [
              {
                ...options,
                spreadLast: true,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              ['a', 'b', ...other, 'c'].includes(value)
            `,
            output: dedent`
              ['a', 'b', 'c', ...other].includes(value)
            `,
            options: [
              {
                ...options,
                spreadLast: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
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
      invalid: [
        {
          code: dedent`
            new Array(
              'a',
              'c',
              'b',
              'd',
            ).includes(value)
          `,
          output: dedent`
            new Array(
              'a',
              'b',
              'c',
              'd',
            ).includes(value)
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedArrayIncludesOrder',
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
              spreadLast: false,
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            new Array(
              'aaaa',
              'bbb',
              ...d,
              'cc',
            ).includes(value)
          `,
          output: dedent`
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
              spreadLast: false,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedArrayIncludesOrder',
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
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
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
            [
              ...aaa,
              ...bbbb,
              ...ccc,
            ].includes(value)
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            [
              ...aaa,
              ...ccc,
              ...bbbb,
            ].includes(value)
          `,
          output: dedent`
            [
              ...aaa,
              ...bbbb,
              ...ccc,
            ].includes(value)
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedArrayIncludesOrder',
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
              ['a', 'b', 'c',, 'd'].includes(value)
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              ['b', 'a', 'c',, 'd'].includes(value)
            `,
            output: dedent`
              ['a', 'b', 'c',, 'd'].includes(value)
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
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
              ['a', 'b', 'c', ...other].includes(value)
            `,
            options: [
              {
                ...options,
                spreadLast: true,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              ['a', 'b', ...other, 'c'].includes(value)
            `,
            output: dedent`
              ['a', 'b', 'c', ...other].includes(value)
            `,
            options: [
              {
                ...options,
                spreadLast: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
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
      invalid: [
        {
          code: dedent`
            new Array(
              'a',
              'c',
              'b',
              'd',
            ).includes(value)
          `,
          output: dedent`
            new Array(
              'a',
              'b',
              'c',
              'd',
            ).includes(value)
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedArrayIncludesOrder',
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
              spreadLast: false,
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            new Array(
              'aaaa',
              'bbb',
              ...d,
              'cc',
            ).includes(value)
          `,
          output: dedent`
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
              spreadLast: false,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedArrayIncludesOrder',
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
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
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
            [
              ...bbbb,
              ...aaa,
              ...ccc,
            ].includes(value)
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            [
              ...aaa,
              ...bbbb,
              ...ccc,
            ].includes(value)
          `,
          output: dedent`
            [
              ...bbbb,
              ...aaa,
              ...ccc,
            ].includes(value)
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedArrayIncludesOrder',
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
        valid: [
          {
            code: dedent`
              ['a', 'b', 'c', ...other].includes(value)
            `,
            options: [
              {
                ...options,
                spreadLast: true,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              ['a', 'b', ...other, 'c'].includes(value)
            `,
            output: dedent`
              ['a', 'b', 'c', ...other].includes(value)
            `,
            options: [
              {
                ...options,
                spreadLast: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
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
      invalid: [
        {
          code: dedent`
            new Array(
              'aaaa',
              'cc',
              'bbb',
              'd',
            ).includes(value)
          `,
          output: dedent`
            new Array(
              'aaaa',
              'bbb',
              'cc',
              'd',
            ).includes(value)
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedArrayIncludesOrder',
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
              spreadLast: false,
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            new Array(
              'aaaa',
              ...d,
              'bbb',
              'cc',
            ).includes(value)
          `,
          output: dedent`
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
              spreadLast: false,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedArrayIncludesOrder',
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
        invalid: [
          {
            code: dedent`
              [
                'b',
                'a',
                'd',
                'c',
              ].includes(value)
            `,
            output: dedent`
              [
                'a',
                'b',
                'c',
                'd',
              ].includes(value)
            `,
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
              {
                messageId: 'unexpectedArrayIncludesOrder',
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
  })
})
