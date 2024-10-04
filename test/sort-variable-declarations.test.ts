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

    describe(`${ruleName}(${type}): detects dependencies`, () => {
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
            {
              code: dedent`
                let position = editor.state.selection.$anchor,
                depth = position.depth;
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
                  messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                  data: {
                    right: 'bb',
                    nodeDependentOnRight: 'aaa',
                  },
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
                  messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                  data: {
                    right: 'a',
                    nodeDependentOnRight: 'b',
                  },
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
                  messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                  data: {
                    right: 'x',
                    nodeDependentOnRight: 'y',
                  },
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
                  messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                  data: {
                    right: 'arr',
                    nodeDependentOnRight: 'sum',
                  },
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
                  messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                  data: {
                    right: 'getValue',
                    nodeDependentOnRight: 'value',
                  },
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
                  messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                  data: {
                    right: 'c',
                    nodeDependentOnRight: 'a',
                  },
                },
              ],
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
            code: dedent`
              let b = () => 1,
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
            code: dedent`
              let b = 1,
              a = {x: b};
            `,
            options: [
              {
                ...options,
              },
            ],
          },
          {
            code: dedent`
              let b = 1,
              a = {[b]: 0};
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
            code: dedent`
              let b = {x: 1},
              a = b?.x;
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
      `${ruleName}(${type}) detects non-null asserted dependencies`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let b = 1,
              a = b!;
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
            code: dedent`
              let b = {x: 1},
              a = {...b};
            `,
            options: [
              {
                ...options,
              },
            ],
          },
          {
            code: dedent`
              let b = [1]
              a = [...b];
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
      `${ruleName}(${type}) detects dependencies in conditional expressions`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let b = 0,
              a = b ? 1 : 0;
            `,
            options: [
              {
                ...options,
              },
            ],
          },
          {
            code: dedent`
              let b = 0,
              a = x ? b : 0;
            `,
            options: [
              {
                ...options,
              },
            ],
          },
          {
            code: dedent`
              let b = 0,
              a = x ? 0 : b;
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
      `${ruleName}(${type}) detects dependencies in 'as' expressions`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let b = a,
              a = b as any;
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
      `${ruleName}(${type}) detects dependencies in type assertion expressions`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let b = a,
              a = <any>b;
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
      `${ruleName}(${type}) detects dependencies in template literal expressions`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let b = a,
              a = \`\${b}\`
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
      `${ruleName}(${type}) ignores function body dependencies`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let a = () => b,
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
        valid: [],
        invalid: [
          {
            code: dedent`
              const
                d = 'D',
                a = 'A',

                c = 'C',

                e = 'E',
                b = 'B'
            `,
            output: dedent`
              const
                a = 'A',
                d = 'D',

                c = 'C',

                b = 'B',
                e = 'E'
            `,
            options: [
              {
                type: 'alphabetical',
                partitionByNewLine: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: {
                  left: 'd',
                  right: 'a',
                },
              },
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
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
              options: [
                {
                  ...options,
                  partitionByComment: 'Part**',
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedVariableDeclarationsOrder',
                  data: {
                    left: 'd',
                    right: 'bbb',
                  },
                },
                {
                  messageId: 'unexpectedVariableDeclarationsOrder',
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
          valid: [],
          invalid: [
            {
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
              options: [
                {
                  ...options,
                  partitionByComment: ['Partition Comment', 'Part: *', 'Other'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedVariableDeclarationsOrder',
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

      ruleTester.run(
        `${ruleName}(${type}): allows to use regex matcher`,
        rule,
        {
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
                  matcher: 'regex',
                  partitionByComment: ['^(?!.*foo).*$'],
                },
              ],
            },
          ],
          invalid: [],
        },
      )
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`
              const
                _a = 'a',
                b = 'b',
                _c = 'c'
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
              const
                ab = 'ab',
                a_c = 'ac'
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
                data: {
                  left: 'b',
                  right: 'a',
                },
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
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                data: {
                  right: 'bb',
                  nodeDependentOnRight: 'aaa',
                },
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
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                data: {
                  right: 'a',
                  nodeDependentOnRight: 'b',
                },
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
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                data: {
                  right: 'x',
                  nodeDependentOnRight: 'y',
                },
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
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                data: {
                  right: 'arr',
                  nodeDependentOnRight: 'sum',
                },
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
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                data: {
                  right: 'getValue',
                  nodeDependentOnRight: 'value',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): detects circular dependencies`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              const a,
                    b = f + 1,
                    c,
                    d = b + 1,
                    e,
                    f = d + 1
            `,
            output: dedent`
              const a,
                    d = b + 1,
                    f = d + 1,
                    b = f + 1,
                    c,
                    e
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: { left: 'c', right: 'd' },
              },
              {
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                data: {
                  right: 'f',
                  nodeDependentOnRight: 'b',
                },
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
