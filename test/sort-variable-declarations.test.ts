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
      invalid: [
        {
          errors: [
            {
              messageId: 'unexpectedVariableDeclarationsOrder',
              data: { right: 'aaa', left: 'bb' },
            },
          ],
          output: dedent`
              const aaa, bb, c
            `,
          code: dedent`
              const bb, aaa, c
            `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
              const aaa, bb, c
            `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): works with array and object declarations`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: '{ bb }',
                  left: 'aaa',
                },
                messageId: 'unexpectedVariableDeclarationsOrder',
              },
              {
                data: {
                  left: '{ bb }',
                  right: '[c]',
                },
                messageId: 'unexpectedVariableDeclarationsOrder',
              },
            ],
            output: dedent`
              const [c] = C, { bb } = B, aaa
            `,
            code: dedent`
              const aaa, { bb } = B, [c] = C
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              const [c] = C, { bb } = B, aaa
            `,
            options: [options],
          },
        ],
      },
    )

    describe(`${ruleName}(${type}): detects dependencies`, () => {
      ruleTester.run(
        `${ruleName}(${type}): does not sort properties if the right value depends on the left value`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  messageId: 'unexpectedVariableDeclarationsOrder',
                  data: { right: 'a', left: 'b' },
                },
              ],
              output: dedent`
                const a,
                      b,
                      c;
              `,
              code: dedent`
                const b,
                      a,
                      c;
              `,
              options: [options],
            },
            {
              errors: [
                {
                  data: {
                    nodeDependentOnRight: 'aaa',
                    right: 'bb',
                  },
                  messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                },
              ],
              output: dedent`
                const bb = 1,
                      aaa = bb + 2,
                      c = aaa + 3;
              `,
              code: dedent`
                const aaa = bb + 2,
                      bb = 1,
                      c = aaa + 3;
              `,
              options: [options],
            },
            {
              errors: [
                {
                  data: {
                    nodeDependentOnRight: 'b',
                    right: 'a',
                  },
                  messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                },
              ],
              output: dedent`
                let a = 1,
                    b = a + 2,
                    c = b + 3;
              `,
              code: dedent`
                let b = a + 2,
                    a = 1,
                    c = b + 3;
              `,
              options: [options],
            },
            {
              errors: [
                {
                  data: {
                    nodeDependentOnRight: 'y',
                    right: 'x',
                  },
                  messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                },
              ],
              output: dedent`
                var x = 10,
                    y = x * 2,
                    z = y + 5;
              `,
              code: dedent`
                var y = x * 2,
                    x = 10,
                    z = y + 5;
              `,
              options: [options],
            },
            {
              errors: [
                {
                  data: {
                    nodeDependentOnRight: 'sum',
                    right: 'arr',
                  },
                  messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                },
              ],
              output: dedent`
                const arr = [1, 2, 3],
                      sum = arr.reduce((acc, val) => acc + val, 0),
                      avg = sum / arr.length;
              `,
              code: dedent`
                const sum = arr.reduce((acc, val) => acc + val, 0),
                      arr = [1, 2, 3],
                      avg = sum / arr.length;
              `,
              options: [options],
            },
            {
              errors: [
                {
                  data: {
                    nodeDependentOnRight: 'value',
                    right: 'getValue',
                  },
                  messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                },
              ],
              output: dedent`
                const getValue = () => 1,
                      value = getValue(),
                      result = value + 2;
              `,
              code: dedent`
                const value = getValue(),
                      getValue = () => 1,
                      result = value + 2;
              `,
              options: [options],
            },
            {
              errors: [
                {
                  data: {
                    nodeDependentOnRight: 'a',
                    right: 'c',
                  },
                  messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                },
              ],
              output: dedent`
                const c = 10,
                      a = c,
                      b = 10;
              `,
              code: dedent`
                const a = c,
                      b = 10,
                      c = 10;
              `,
              options: [options],
            },
          ],
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
            {
              code: dedent`
                let position = editor.state.selection.$anchor,
                depth = position.depth;
              `,
              options: [options],
            },
          ],
        },
      )
    })

    ruleTester.run(
      `${ruleName}(${type}) detects function expression dependencies`,
      rule,
      {
        valid: [
          {
            options: [
              {
                ...options,
              },
            ],
            code: dedent`
              let b = () => 1,
              a = b();
            `,
          },
          {
            code: dedent`
              let b = function() { return 1 },
              a = b();
            `,
            options: [
              {
                ...options,
              },
            ],
          },
          {
            code: dedent`
              let b = () => 1,
              a = a.map(b);
            `,
            options: [
              {
                ...options,
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}) detects dependencies in objects`,
      rule,
      {
        valid: [
          {
            options: [
              {
                ...options,
              },
            ],
            code: dedent`
              let b = 1,
              a = {x: b};
            `,
          },
          {
            options: [
              {
                ...options,
              },
            ],
            code: dedent`
              let b = 1,
              a = {[b]: 0};
            `,
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}) detects chained dependencies`, rule, {
      valid: [
        {
          code: dedent`
              let b = {x: 1},
              a = b.x;
            `,
          options: [
            {
              ...options,
            },
          ],
        },
        {
          code: dedent`
              let b = new Subject(),
              a = b.asObservable();
            `,
          options: [
            {
              ...options,
            },
          ],
        },
      ],
      invalid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}) detects optional chained dependencies`,
      rule,
      {
        valid: [
          {
            options: [
              {
                ...options,
              },
            ],
            code: dedent`
              let b = {x: 1},
              a = b?.x;
            `,
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}) detects non-null asserted dependencies`,
      rule,
      {
        valid: [
          {
            options: [
              {
                ...options,
              },
            ],
            code: dedent`
              let b = 1,
              a = b!;
            `,
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}) detects unary dependencies`, rule, {
      valid: [
        {
          code: dedent`
              let b = true,
              a = !b;
            `,
          options: [
            {
              ...options,
            },
          ],
        },
      ],
      invalid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}) detects spread elements dependencies`,
      rule,
      {
        valid: [
          {
            options: [
              {
                ...options,
              },
            ],
            code: dedent`
              let b = {x: 1},
              a = {...b};
            `,
          },
          {
            options: [
              {
                ...options,
              },
            ],
            code: dedent`
              let b = [1]
              a = [...b];
            `,
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}) detects dependencies in conditional expressions`,
      rule,
      {
        valid: [
          {
            options: [
              {
                ...options,
              },
            ],
            code: dedent`
              let b = 0,
              a = b ? 1 : 0;
            `,
          },
          {
            options: [
              {
                ...options,
              },
            ],
            code: dedent`
              let b = 0,
              a = x ? b : 0;
            `,
          },
          {
            options: [
              {
                ...options,
              },
            ],
            code: dedent`
              let b = 0,
              a = x ? 0 : b;
            `,
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}) detects dependencies in 'as' expressions`,
      rule,
      {
        valid: [
          {
            options: [
              {
                ...options,
              },
            ],
            code: dedent`
              let b = a,
              a = b as any;
            `,
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}) detects dependencies in type assertion expressions`,
      rule,
      {
        valid: [
          {
            options: [
              {
                ...options,
              },
            ],
            code: dedent`
              let b = a,
              a = <any>b;
            `,
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}) detects dependencies in template literal expressions`,
      rule,
      {
        valid: [
          {
            options: [
              {
                ...options,
              },
            ],
            code: dedent`
              let b = a,
              a = \`\${b}\`
            `,
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}) ignores function body dependencies`,
      rule,
      {
        valid: [
          {
            options: [
              {
                ...options,
              },
            ],
            code: dedent`
              let a = () => b,
              b = 1;
              `,
          },
          {
            code: dedent`
              let a = function() { return b },
              b = 1;
              `,
            options: [
              {
                ...options,
              },
            ],
          },
          {
            code: dedent`
              let a = () => {return b},
              b = 1;
              `,
            options: [
              {
                ...options,
              },
            ],
          },
        ],
        invalid: [],
      },
    )

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
                messageId: 'unexpectedVariableDeclarationsOrder',
              },
              {
                data: {
                  right: 'b',
                  left: 'e',
                },
                messageId: 'unexpectedVariableDeclarationsOrder',
              },
            ],
            output: dedent`
              const
                a = 'A',
                d = 'D',

                c = 'C',

                b = 'B',
                e = 'E'
            `,
            code: dedent`
              const
                d = 'D',
                a = 'A',

                c = 'C',

                e = 'E',
                b = 'B'
            `,
            options: [
              {
                partitionByNewLine: true,
                type: 'alphabetical',
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
              errors: [
                {
                  data: {
                    right: 'bbb',
                    left: 'd',
                  },
                  messageId: 'unexpectedVariableDeclarationsOrder',
                },
                {
                  data: {
                    right: 'fff',
                    left: 'gg',
                  },
                  messageId: 'unexpectedVariableDeclarationsOrder',
                },
              ],
              output: dedent`
                const
                  // Part: A
                  // Not partition comment
                  bbb = 'BBB',
                  cc = 'CC',
                  d = 'D',
                  // Part: B
                  aaa = 'AAA',
                  e = 'E',
                  // Part: C
                  // Not partition comment
                  fff = 'FFF',
                  gg = 'GG'
              `,
              code: dedent`
                const
                  // Part: A
                  cc = 'CC',
                  d = 'D',
                  // Not partition comment
                  bbb = 'BBB',
                  // Part: B
                  aaa = 'AAA',
                  e = 'E',
                  // Part: C
                  gg = 'GG',
                  // Not partition comment
                  fff = 'FFF'
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
                const
                  // Comment
                  bb = 'bb',
                  // Other comment
                  a = 'a'
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
                  const
                    /* Partition Comment */
                    // Part: A
                    d = 'D',
                    // Part: B
                    aaa = 'AAA',
                    bb = 'BB',
                    c = 'C',
                    /* Other */
                    e = 'E'
                `,
              code: dedent`
                  const
                    /* Partition Comment */
                    // Part: A
                    d = 'D',
                    // Part: B
                    aaa = 'AAA',
                    c = 'C',
                    bb = 'BB',
                    /* Other */
                    e = 'E'
                `,
              errors: [
                {
                  data: {
                    right: 'bb',
                    left: 'c',
                  },
                  messageId: 'unexpectedVariableDeclarationsOrder',
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
              const
                e = 'e',
                f = 'f',
                // I am a partition comment because I don't have f o o
                a = 'a',
                b = 'b'
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
            options: [
              {
                ...options,
                specialCharacters: 'trim',
              },
            ],
            code: dedent`
              const
                _a = 'a',
                b = 'b',
                _c = 'c'
            `,
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
              const
                ab = 'ab',
                a_c = 'ac'
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
              const
                你好 = '你好',
                世界 = '世界',
                a = 'a',
                A = 'A',
                b = 'b',
                B = 'B'
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
                messageId: 'unexpectedVariableDeclarationsOrder',
              },
            ],
            output: dedent`
              const
                a = 'a', b = 'b'
            `,
            code: dedent`
              const
                b = 'b', a = 'a'
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
                messageId: 'unexpectedVariableDeclarationsOrder',
              },
            ],
            output: dedent`
              const
                a = 'a', b = 'b',
            `,
            code: dedent`
              const
                b = 'b', a = 'a',
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

    ruleTester.run(`${ruleName}(${type}): sorts variables declarations`, rule, {
      invalid: [
        {
          errors: [
            {
              messageId: 'unexpectedVariableDeclarationsOrder',
              data: { right: 'aaa', left: 'bb' },
            },
          ],
          output: dedent`
              const aaa, bb, c
            `,
          code: dedent`
              const bb, aaa, c
            `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
              const aaa, bb, c
            `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): works with array and object declarations`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: '{ bb }',
                  right: '[c]',
                },
                messageId: 'unexpectedVariableDeclarationsOrder',
              },
            ],
            output: dedent`
              const [c] = C, aaa, { bb } = B
            `,
            code: dedent`
              const aaa, { bb } = B, [c] = C
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              const [c] = C, aaa, { bb } = B
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not sort properties if the right value depends on the left value`,
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
                messageId: 'unexpectedVariableDeclarationsOrder',
              },
            ],
            output: dedent`
              const a,
                    b,
                    c;
            `,
            code: dedent`
              const b,
                    a,
                    c;
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  nodeDependentOnRight: 'aaa',
                  right: 'bb',
                },
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
              },
            ],
            output: dedent`
              const bb = 1,
                    aaa = bb + 2,
                    c = aaa + 3;
            `,
            code: dedent`
              const aaa = bb + 2,
                    bb = 1,
                    c = aaa + 3;
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  nodeDependentOnRight: 'b',
                  right: 'a',
                },
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
              },
            ],
            output: dedent`
              let a = 1,
                  b = a + 2,
                  c = b + 3;
            `,
            code: dedent`
              let b = a + 2,
                  a = 1,
                  c = b + 3;
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  nodeDependentOnRight: 'y',
                  right: 'x',
                },
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
              },
            ],
            output: dedent`
              var x = 10,
                  y = x * 2,
                  z = y + 5;
            `,
            code: dedent`
              var y = x * 2,
                  x = 10,
                  z = y + 5;
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  nodeDependentOnRight: 'sum',
                  right: 'arr',
                },
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
              },
            ],
            output: dedent`
              const arr = [1, 2, 3],
                    sum = arr.reduce((acc, val) => acc + val, 0),
                    avg = sum / arr.length;
            `,
            code: dedent`
              const sum = arr.reduce((acc, val) => acc + val, 0),
                    arr = [1, 2, 3],
                    avg = sum / arr.length;
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  nodeDependentOnRight: 'value',
                  right: 'getValue',
                },
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
              },
            ],
            output: dedent`
              const getValue = () => 1,
                    value = getValue(),
                    result = value + 2;
            `,
            code: dedent`
              const value = getValue(),
                    getValue = () => 1,
                    result = value + 2;
            `,
            options: [options],
          },
        ],
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
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): detects circular dependencies`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: { right: 'd', left: 'c' },
              },
              {
                data: {
                  nodeDependentOnRight: 'b',
                  right: 'f',
                },
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
              },
            ],
            output: dedent`
              const a,
                    d = b + 1,
                    f = d + 1,
                    b = f + 1,
                    c,
                    e
            `,
            code: dedent`
              const a,
                    b = f + 1,
                    c,
                    d = b + 1,
                    e,
                    f = d + 1
            `,
            options: [options],
          },
        ],
        valid: [],
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
      invalid: [
        {
          errors: [
            {
              messageId: 'unexpectedVariableDeclarationsOrder',
              data: { right: 'aaa', left: 'bb' },
            },
          ],
          output: dedent`
              const aaa, bb, c
            `,
          code: dedent`
              const bb, aaa, c
            `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
              const aaa, bb, c
            `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): works with array and object declarations`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: '{ bb }',
                  left: 'aaa',
                },
                messageId: 'unexpectedVariableDeclarationsOrder',
              },
            ],
            output: dedent`
              const { bb } = B, [c] = C, aaa
            `,
            code: dedent`
              const aaa, { bb } = B, [c] = C
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              const { bb } = B, [c] = C, aaa
            `,
            options: [options],
          },
        ],
      },
    )
  })

  describe(`${ruleName}: misc`, () => {
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
              messageId: 'unexpectedVariableDeclarationsOrder',
            },
          ],
          output: dedent`
            let
              b,
              c,
              // eslint-disable-next-line
              a
          `,
          code: dedent`
            let
              c,
              b,
              // eslint-disable-next-line
              a
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
              messageId: 'unexpectedVariableDeclarationsOrder',
            },
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedVariableDeclarationsOrder',
            },
          ],
          output: dedent`
            let
              b,
              c,
              // eslint-disable-next-line
              a,
              d
          `,
          code: dedent`
            let
              d,
              c,
              // eslint-disable-next-line
              a,
              b
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
              messageId: 'unexpectedVariableDeclarationsOrder',
            },
          ],
          output: dedent`
            let
              b = a,
              c,
              // eslint-disable-next-line
              a
          `,
          code: dedent`
            let
              c,
              b = a,
              // eslint-disable-next-line
              a
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
              messageId: 'unexpectedVariableDeclarationsOrder',
            },
          ],
          output: dedent`
            let
              b,
              c,
              a // eslint-disable-line
          `,
          code: dedent`
            let
              c,
              b,
              a // eslint-disable-line
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
              messageId: 'unexpectedVariableDeclarationsOrder',
            },
          ],
          output: dedent`
            let
              b,
              c,
              /* eslint-disable-next-line */
              a
          `,
          code: dedent`
            let
              c,
              b,
              /* eslint-disable-next-line */
              a
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
              messageId: 'unexpectedVariableDeclarationsOrder',
            },
          ],
          output: dedent`
            let
              b,
              c,
              a /* eslint-disable-line */
          `,
          code: dedent`
            let
              c,
              b,
              a /* eslint-disable-line */
          `,
          options: [{}],
        },
        {
          output: dedent`
            let
              a,
              d,
              /* eslint-disable */
              c,
              b,
              // Shouldn't move
              /* eslint-enable */
              e
          `,
          code: dedent`
            let
              d,
              e,
              /* eslint-disable */
              c,
              b,
              // Shouldn't move
              /* eslint-enable */
              a
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedVariableDeclarationsOrder',
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
              messageId: 'unexpectedVariableDeclarationsOrder',
            },
          ],
          output: dedent`
            let
              b,
              c,
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              a
          `,
          code: dedent`
            let
              c,
              b,
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              a
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
              messageId: 'unexpectedVariableDeclarationsOrder',
            },
          ],
          output: dedent`
            let
              b,
              c,
              a // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
          `,
          code: dedent`
            let
              c,
              b,
              a // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
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
              messageId: 'unexpectedVariableDeclarationsOrder',
            },
          ],
          output: dedent`
            let
              b,
              c,
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              a
          `,
          code: dedent`
            let
              c,
              b,
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              a
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
              messageId: 'unexpectedVariableDeclarationsOrder',
            },
          ],
          output: dedent`
            let
              b,
              c,
              a /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
          `,
          code: dedent`
            let
              c,
              b,
              a /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
          `,
          options: [{}],
        },
        {
          output: dedent`
            let
              a,
              d,
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              c,
              b,
              // Shouldn't move
              /* eslint-enable */
              e
          `,
          code: dedent`
            let
              d,
              e,
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              c,
              b,
              // Shouldn't move
              /* eslint-enable */
              a
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedVariableDeclarationsOrder',
            },
          ],
          options: [{}],
        },
      ],
      valid: [],
    })
  })
})
