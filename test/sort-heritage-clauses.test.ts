import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule from '../rules/sort-heritage-clauses'

let ruleName = 'sort-heritage-clauses'

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

    ruleTester.run(`${ruleName}(${type}): sorts heritage clauses`, rule, {
      valid: [
        {
          code: dedent`
            interface Interface extends
              a,
              b,
              c {
            }
          `,
          options: [options],
        },
        {
          code: dedent`
            interface Interface extends
              a {
            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            interface Interface extends
              a,
              c,
              b {
            }
          `,
          output: dedent`
            interface Interface extends
              a,
              b,
              c {
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
        {
          code: dedent`
            interface Interface extends
              A.a,
              C.c,
              B.b {
            }
          `,
          output: dedent`
            interface Interface extends
              A.a,
              B.b,
              C.c {
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): does not break docs`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
              interface Interface extends
                /**
                 * Comment B
                 */
                b,
                /**
                 * Comment A
                 */
                a,
                // Comment D
                d,
                /* Comment C */
                c {
              }
            `,
          output: dedent`
              interface Interface extends
                /**
                 * Comment A
                 */
                a,
                /**
                 * Comment B
                 */
                b,
                /* Comment C */
                c,
                // Comment D
                d {
              }
            `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'd',
                right: 'c',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts heritage clauses with comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              interface Interface extends
                b // Comment B
                , a // Comment A
                {
              }
            `,
            output: dedent`
              interface Interface extends
                a // Comment A
                , b // Comment B
                {
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedHeritageClausesOrder',
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
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface Interface extends
                g,
                a {
              }
            `,
            options: [
              {
                ...options,
                groups: ['g'],
                customGroups: {
                  g: 'g',
                },
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              interface Interface extends
                a,
                g {
              }
            `,
            output: dedent`
              interface Interface extends
                g,
                a {
              }
            `,
            options: [
              {
                ...options,
                groups: ['g'],
                customGroups: {
                  g: 'g',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedHeritageClausesGroupOrder',
                data: {
                  left: 'a',
                  leftGroup: 'unknown',
                  right: 'g',
                  rightGroup: 'g',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex for custom groups`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface Interface extends
                  iHaveFooInMyName,
                  meTooIHaveFoo,
                  a,
                  b {
              }
            `,
            options: [
              {
                ...options,
                groups: ['unknown', 'elementsWithoutFoo'],
                customGroups: {
                  elementsWithoutFoo: '^(?!.*Foo).*$',
                },
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface MyInterface extends
                _a,
                b,
                _c {
              }
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
              interface MyInterface extends
                ab,
                a_c {
              }
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
              interface MyInterface extends
                你好,
                世界,
                a,
                A,
                b,
                B {
              }
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
              interface Interface extends
                B, A
              {}
            `,
            output: dedent`
              interface Interface extends
                A, B
              {}
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedHeritageClausesOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
            ],
          },
          {
            code: dedent`
              class Class implements
                B, A
              {}
            `,
            output: dedent`
              class Class implements
                A, B
              {}
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedHeritageClausesOrder',
                data: {
                  left: 'B',
                  right: 'A',
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
      type: 'natural',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts heritage clauses`, rule, {
      valid: [
        {
          code: dedent`
            interface Interface extends
              a,
              b,
              c {
            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            interface Interface extends
              a,
              c,
              b {
            }
          `,
          output: dedent`
            interface Interface extends
              a,
              b,
              c {
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): does not break docs`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
              interface Interface extends
                /**
                 * Comment B
                 */
                b,
                /**
                 * Comment A
                 */
                a,
                // Comment D
                d,
                /* Comment C */
                c {
              }
            `,
          output: dedent`
              interface Interface extends
                /**
                 * Comment A
                 */
                a,
                /**
                 * Comment B
                 */
                b,
                /* Comment C */
                c,
                // Comment D
                d {
              }
            `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'd',
                right: 'c',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts heritage clauses with comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              interface Interface extends
                b // Comment B
                , a // Comment A
                {
              }
            `,
            output: dedent`
              interface Interface extends
                a // Comment A
                , b // Comment B
                {
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedHeritageClausesOrder',
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
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface Interface extends
                g,
                a {
              }
            `,
            options: [
              {
                ...options,
                groups: ['g'],
                customGroups: {
                  g: 'g',
                },
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              interface Interface extends
                a,
                g {
              }
            `,
            output: dedent`
              interface Interface extends
                g,
                a {
              }
            `,
            options: [
              {
                ...options,
                groups: ['g'],
                customGroups: {
                  g: 'g',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedHeritageClausesGroupOrder',
                data: {
                  left: 'a',
                  leftGroup: 'unknown',
                  right: 'g',
                  rightGroup: 'g',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex for custom groups`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface Interface extends
                  iHaveFooInMyName,
                  meTooIHaveFoo,
                  a,
                  b {
              }
            `,
            options: [
              {
                ...options,
                groups: ['unknown', 'elementsWithoutFoo'],
                customGroups: {
                  elementsWithoutFoo: '^(?!.*Foo).*$',
                },
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface MyInterface extends
                _a,
                b,
                _c {
              }
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
              interface MyInterface extends
                ab,
                a_c {
              }
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

  describe(`${ruleName}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      ignoreCase: true,
      order: 'desc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts heritage clauses`, rule, {
      valid: [
        {
          code: dedent`
            interface Interface extends
              aaa,
              bb,
              c {
            }
          `,
          options: [options],
        },
        {
          code: dedent`
            class Class implements
              aaa,
              bb,
              c {
            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            interface Interface extends
              aaa,
              c,
              bb {
            }
          `,
          output: dedent`
            interface Interface extends
              aaa,
              bb,
              c {
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'c',
                right: 'bb',
              },
            },
          ],
        },
        {
          code: dedent`
            class Class implements
              aaa,
              c,
              bb {
            }
          `,
          output: dedent`
            class Class implements
              aaa,
              bb,
              c {
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'c',
                right: 'bb',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): does not break docs`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
              interface Interface extends
                /**
                 * Comment B
                 */
                bbb,
                /**
                 * Comment A
                 */
                aaaa,
                // Comment D
                d,
                /* Comment C */
                cc {
              }
            `,
          output: dedent`
              interface Interface extends
                /**
                 * Comment A
                 */
                aaaa,
                /**
                 * Comment B
                 */
                bbb,
                /* Comment C */
                cc,
                // Comment D
                d {
              }
            `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'bbb',
                right: 'aaaa',
              },
            },
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'd',
                right: 'cc',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts heritage clauses with comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              interface Interface extends
                b // Comment B
                , aa // Comment A
                {
              }
            `,
            output: dedent`
              interface Interface extends
                aa // Comment A
                , b // Comment B
                {
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedHeritageClausesOrder',
                data: {
                  left: 'b',
                  right: 'aa',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface Interface extends
                g,
                aa {
              }
            `,
            options: [
              {
                ...options,
                groups: ['g'],
                customGroups: {
                  g: 'g',
                },
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              interface Interface extends
                aa,
                g {
              }
            `,
            output: dedent`
              interface Interface extends
                g,
                aa {
              }
            `,
            options: [
              {
                ...options,
                groups: ['g'],
                customGroups: {
                  g: 'g',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedHeritageClausesGroupOrder',
                data: {
                  left: 'aa',
                  leftGroup: 'unknown',
                  right: 'g',
                  rightGroup: 'g',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex for custom groups`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface Interface extends
                  iHaveFooInMyName,
                  meTooIHaveFoo,
                  a,
                  b {
              }
            `,
            options: [
              {
                ...options,
                groups: ['unknown', 'elementsWithoutFoo'],
                customGroups: {
                  elementsWithoutFoo: '^(?!.*Foo).*$',
                },
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface MyInterface extends
                _aaa,
                bb,
                _c {
              }
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
              interface MyInterface extends
                aaa,
                a_c {
              }
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

  describe(`${ruleName}: misc`, () => {
    ruleTester.run(
      `${ruleName}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          dedent`
            interface Interface extends
              a,
              b {
            }
          `,
        ],
        invalid: [
          {
            code: dedent`
              interface Interface extends
                b,
                a {
              }
            `,
            output: dedent`
              interface Interface extends
                a,
                b {
              }
            `,
            errors: [
              {
                messageId: 'unexpectedHeritageClausesOrder',
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

    let eslintDisableRuleTesterName = `${ruleName}: supports 'eslint-disable' for individual nodes`
    ruleTester.run(eslintDisableRuleTesterName, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            interface Interface extends
              C,
              B,
              // eslint-disable-next-line
              A
            {}
          `,
          output: dedent`
            interface Interface extends
              B,
              C,
              // eslint-disable-next-line
              A
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
        },
        {
          code: dedent`
            interface Interface extends
              D,
              C,
              // eslint-disable-next-line
              A,
              B
            {}
          `,
          output: dedent`
            interface Interface extends
              B,
              C,
              // eslint-disable-next-line
              A,
              D
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'D',
                right: 'C',
              },
            },
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'A',
                right: 'B',
              },
            },
          ],
        },
        {
          code: dedent`
            interface Interface extends
              C,
              B,
              A // eslint-disable-line
            {}
          `,
          output: dedent`
            interface Interface extends
              B,
              C,
              A // eslint-disable-line
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
        },
        {
          code: dedent`
            interface Interface extends
              C,
              B,
              /* eslint-disable-next-line */
              A
            {}
          `,
          output: dedent`
            interface Interface extends
              B,
              C,
              /* eslint-disable-next-line */
              A
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
        },
        {
          code: dedent`
            interface Interface extends
              C,
              B,
              A /* eslint-disable-line */
            {}
          `,
          output: dedent`
            interface Interface extends
              B,
              C,
              A /* eslint-disable-line */
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
        },
        {
          code: dedent`
            interface Interface extends
              D,
              E,
              /* eslint-disable */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              A
            {}
          `,
          output: dedent`
            interface Interface extends
              A,
              D,
              /* eslint-disable */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              E
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'B',
                right: 'A',
              },
            },
          ],
        },
        {
          code: dedent`
            interface Interface extends
              C,
              B,
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              A
            {}
          `,
          output: dedent`
            interface Interface extends
              B,
              C,
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              A
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
        },
        {
          code: dedent`
            interface Interface extends
              C,
              B,
              A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            {}
          `,
          output: dedent`
            interface Interface extends
              B,
              C,
              A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
        },
        {
          code: dedent`
            interface Interface extends
              C,
              B,
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              A
            {}
          `,
          output: dedent`
            interface Interface extends
              B,
              C,
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              A
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
        },
        {
          code: dedent`
            interface Interface extends
              C,
              B,
              A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            {}
          `,
          output: dedent`
            interface Interface extends
              B,
              C,
              A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
        },
        {
          code: dedent`
            interface Interface extends
              D,
              E,
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              A
            {}
          `,
          output: dedent`
            interface Interface extends
              A,
              D,
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              E
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'B',
                right: 'A',
              },
            },
          ],
        },
        {
          code: dedent`
            class Class implements
              C,
              B,
              // eslint-disable-next-line
              A
            {}
          `,
          output: dedent`
            class Class implements
              B,
              C,
              // eslint-disable-next-line
              A
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
        },
        {
          code: dedent`
            class Class implements
              C,
              B,
              A // eslint-disable-line
            {}
          `,
          output: dedent`
            class Class implements
              B,
              C,
              A // eslint-disable-line
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
        },
        {
          code: dedent`
            class Class implements
              C,
              B,
              /* eslint-disable-next-line */
              A
            {}
          `,
          output: dedent`
            class Class implements
              B,
              C,
              /* eslint-disable-next-line */
              A
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
        },
        {
          code: dedent`
            class Class implements
              C,
              B,
              A /* eslint-disable-line */
            {}
          `,
          output: dedent`
            class Class implements
              B,
              C,
              A /* eslint-disable-line */
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
        },
        {
          code: dedent`
            class Class implements
              D,
              E,
              /* eslint-disable */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              A
            {}
          `,
          output: dedent`
            class Class implements
              A,
              D,
              /* eslint-disable */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              E
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'B',
                right: 'A',
              },
            },
          ],
        },
        {
          code: dedent`
            class Class implements
              C,
              B,
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              A
            {}
          `,
          output: dedent`
            class Class implements
              B,
              C,
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              A
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
        },
        {
          code: dedent`
            class Class implements
              C,
              B,
              A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            {}
          `,
          output: dedent`
            class Class implements
              B,
              C,
              A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
        },
        {
          code: dedent`
            class Class implements
              C,
              B,
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              A
            {}
          `,
          output: dedent`
            class Class implements
              B,
              C,
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              A
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
        },
        {
          code: dedent`
            class Class implements
              C,
              B,
              A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            {}
          `,
          output: dedent`
            class Class implements
              B,
              C,
              A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
        },
        {
          code: dedent`
            class Class implements
              D,
              E,
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              A
            {}
          `,
          output: dedent`
            class Class implements
              A,
              D,
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              E
            {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: {
                left: 'B',
                right: 'A',
              },
            },
          ],
        },
      ],
    })
  })
})
