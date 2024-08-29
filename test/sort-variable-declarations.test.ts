import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule from '../rules/sort-variable-declarations'

let ruleName = 'sort-variable-declarations'

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

    ruleTester.run(`${ruleName}(${type}): sorts variables declarations`, rule, {
      valid: [
        {
          code: dedent`
              const aaa, bb, c
            `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
              const bb, aaa, c
            `,
          output: dedent`
              const aaa, bb, c
            `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedVariableDeclarationsOrder',
              data: { left: 'bb', right: 'aaa' },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): works with array and object declarations`,
      rule,
      {
        valid: [
          {
            code: dedent`
              const [c] = C, { bb } = B, aaa
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              const aaa, { bb } = B, [c] = C
            `,
            output: dedent`
              const [c] = C, { bb } = B, aaa
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: {
                  left: 'aaa',
                  right: '{ bb }',
                },
              },
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: {
                  left: '{ bb }',
                  right: '[c]',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not sort properties if the right value depends on the left value`,
      rule,
      {
        valid: [
          {
            code: dedent`
              const bb = 1,
                    aaa = bb + 2,
                    c = aaa + 3
            `,
            options: [options],
          },
          {
            code: dedent`
              let a = 1,
                  b = a + 2,
                  c = b + 3,
                  d = [a, b, c];
            `,
            options: [options],
          },
          {
            code: dedent`
              var x = 10,
                  y = x * 2,
                  z = y + 5 - x;
            `,
            options: [options],
          },
          {
            code: dedent`
              const arr = [1, 2, 3],
                    sum = arr.reduce((acc, val) => acc + val, 0),
                    avg = sum / arr.length;
            `,
            options: [options],
          },
          {
            code: dedent`
              const getValue = () => 1,
                    value = getValue(),
                    result = value + 2;
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              const b,
                    a,
                    c;
            `,
            output: dedent`
              const a,
                    b,
                    c;
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: { left: 'b', right: 'a' },
              },
            ],
          },
          {
            code: dedent`
              const aaa = bb + 2,
                    bb = 1,
                    c = aaa + 3;
            `,
            output: dedent`
              const bb = 1,
                    aaa = bb + 2,
                    c = aaa + 3;
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: { left: 'aaa', right: 'bb' },
              },
            ],
          },
          {
            code: dedent`
              let b = a + 2,
                  a = 1,
                  c = b + 3;
            `,
            output: dedent`
              let a = 1,
                  b = a + 2,
                  c = b + 3;
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: { left: 'b', right: 'a' },
              },
            ],
          },
          {
            code: dedent`
              var y = x * 2,
                  x = 10,
                  z = y + 5;
            `,
            output: dedent`
              var x = 10,
                  y = x * 2,
                  z = y + 5;
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: { left: 'y', right: 'x' },
              },
            ],
          },
          {
            code: dedent`
              const sum = arr.reduce((acc, val) => acc + val, 0),
                    arr = [1, 2, 3],
                    avg = sum / arr.length;
            `,
            output: dedent`
              const arr = [1, 2, 3],
                    sum = arr.reduce((acc, val) => acc + val, 0),
                    avg = sum / arr.length;
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: { left: 'sum', right: 'arr' },
              },
            ],
          },
          {
            code: dedent`
              const value = getValue(),
                    getValue = () => 1,
                    result = value + 2;
            `,
            output: dedent`
              const getValue = () => 1,
                    value = getValue(),
                    result = value + 2;
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: { left: 'value', right: 'getValue' },
              },
            ],
          },
          {
            code: dedent`
              const a = c,
                    b = 10,
                    c = 10;
            `,
            output: dedent`
              const c = 10,
                    a = c,
                    b = 10;
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: { left: 'b', right: 'c' },
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

    ruleTester.run(`${ruleName}(${type}): sorts variables declarations`, rule, {
      valid: [
        {
          code: dedent`
              const aaa, bb, c
            `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
              const bb, aaa, c
            `,
          output: dedent`
              const aaa, bb, c
            `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedVariableDeclarationsOrder',
              data: { left: 'bb', right: 'aaa' },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): works with array and object declarations`,
      rule,
      {
        valid: [
          {
            code: dedent`
              const [c] = C, { bb } = B, aaa
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              const aaa, { bb } = B, [c] = C
            `,
            output: dedent`
              const [c] = C, { bb } = B, aaa
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: {
                  left: 'aaa',
                  right: '{ bb }',
                },
              },
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: {
                  left: '{ bb }',
                  right: '[c]',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not sort properties if the right value depends on the left value`,
      rule,
      {
        valid: [
          {
            code: dedent`
              const bb = 1,
                    aaa = bb + 2,
                    c = aaa + 3
            `,
            options: [options],
          },
          {
            code: dedent`
              let a = 1,
                  b = a + 2,
                  c = b + 3,
                  d = [a, b, c];
            `,
            options: [options],
          },
          {
            code: dedent`
              var x = 10,
                  y = x * 2,
                  z = y + 5 - x;
            `,
            options: [options],
          },
          {
            code: dedent`
              const arr = [1, 2, 3],
                    sum = arr.reduce((acc, val) => acc + val, 0),
                    avg = sum / arr.length;
            `,
            options: [options],
          },
          {
            code: dedent`
              const getValue = () => 1,
                    value = getValue(),
                    result = value + 2;
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              const b,
                    a,
                    c;
            `,
            output: dedent`
              const a,
                    b,
                    c;
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: { left: 'b', right: 'a' },
              },
            ],
          },
          {
            code: dedent`
              const aaa = bb + 2,
                    bb = 1,
                    c = aaa + 3;
            `,
            output: dedent`
              const bb = 1,
                    aaa = bb + 2,
                    c = aaa + 3;
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: { left: 'aaa', right: 'bb' },
              },
            ],
          },
          {
            code: dedent`
              let b = a + 2,
                  a = 1,
                  c = b + 3;
            `,
            output: dedent`
              let a = 1,
                  b = a + 2,
                  c = b + 3;
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: { left: 'b', right: 'a' },
              },
            ],
          },
          {
            code: dedent`
              var y = x * 2,
                  x = 10,
                  z = y + 5;
            `,
            output: dedent`
              var x = 10,
                  y = x * 2,
                  z = y + 5;
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: { left: 'y', right: 'x' },
              },
            ],
          },
          {
            code: dedent`
              const sum = arr.reduce((acc, val) => acc + val, 0),
                    arr = [1, 2, 3],
                    avg = sum / arr.length;
            `,
            output: dedent`
              const arr = [1, 2, 3],
                    sum = arr.reduce((acc, val) => acc + val, 0),
                    avg = sum / arr.length;
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: { left: 'sum', right: 'arr' },
              },
            ],
          },
          {
            code: dedent`
              const value = getValue(),
                    getValue = () => 1,
                    result = value + 2;
            `,
            output: dedent`
              const getValue = () => 1,
                    value = getValue(),
                    result = value + 2;
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: { left: 'value', right: 'getValue' },
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

    ruleTester.run(`${ruleName}(${type}): sorts variables declarations`, rule, {
      valid: [
        {
          code: dedent`
              const aaa, bb, c
            `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
              const bb, aaa, c
            `,
          output: dedent`
              const aaa, bb, c
            `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedVariableDeclarationsOrder',
              data: { left: 'bb', right: 'aaa' },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): works with array and object declarations`,
      rule,
      {
        valid: [
          {
            code: dedent`
              const { bb } = B, [c] = C, aaa
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              const aaa, { bb } = B, [c] = C
            `,
            output: dedent`
              const { bb } = B, [c] = C, aaa
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: {
                  left: 'aaa',
                  right: '{ bb }',
                },
              },
            ],
          },
        ],
      },
    )
  })
})
