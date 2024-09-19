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
