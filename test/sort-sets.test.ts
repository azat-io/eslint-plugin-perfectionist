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
