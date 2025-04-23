import type { Rule } from 'eslint'

import { RuleTester } from '@typescript-eslint/rule-tester'
import { RuleTester as EslintRuleTester } from 'eslint'
import { afterAll, describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import rule from '../../rules/sort-heritage-clauses'
import { Alphabet } from '../../utils/alphabet'

let ruleName = 'sort-heritage-clauses'

describe(ruleName, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester()
  let eslintRuleTester = new EslintRuleTester()

  describe(`${ruleName}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    let options = {
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts heritage clauses`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            interface Interface extends
              a,
              b,
              c {
            }
          `,
          code: dedent`
            interface Interface extends
              a,
              c,
              b {
            }
          `,
          options: [options],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            interface Interface extends
              A.a,
              B.b,
              C.c {
            }
          `,
          code: dedent`
            interface Interface extends
              A.a,
              C.c,
              B.b {
            }
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}(${type}): does not break docs`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
            {
              data: {
                right: 'c',
                left: 'd',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
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
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts heritage clauses with comments on the same line`,
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
                messageId: 'unexpectedHeritageClausesOrder',
              },
            ],
            output: dedent`
              interface Interface extends
                a // Comment A
                , b // Comment B
                {
              }
            `,
            code: dedent`
              interface Interface extends
                b // Comment B
                , a // Comment A
                {
              }
            `,
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  leftGroup: 'unknown',
                  rightGroup: 'g',
                  right: 'g',
                  left: 'a',
                },
                messageId: 'unexpectedHeritageClausesGroupOrder',
              },
            ],
            options: [
              {
                ...options,
                customGroups: {
                  g: 'g',
                },
                groups: ['g'],
              },
            ],
            output: dedent`
              interface Interface extends
                g,
                a {
              }
            `,
            code: dedent`
              interface Interface extends
                a,
                g {
              }
            `,
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                customGroups: {
                  g: 'g',
                },
                groups: ['g'],
              },
            ],
            code: dedent`
              interface Interface extends
                g,
                a {
              }
            `,
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
            options: [
              {
                ...options,
                customGroups: {
                  elementsWithoutFoo: '^(?!.*Foo).*$',
                },
                groups: ['unknown', 'elementsWithoutFoo'],
              },
            ],
            code: dedent`
              interface Interface extends
                  iHaveFooInMyName,
                  meTooIHaveFoo,
                  a,
                  b {
              }
            `,
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
            options: [
              {
                ...options,
                specialCharacters: 'remove',
              },
            ],
            code: dedent`
              interface MyInterface extends
                ab,
                a_c {
              }
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
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedHeritageClausesOrder',
              },
            ],
            output: dedent`
              interface Interface extends
                A, B
              {}
            `,
            code: dedent`
              interface Interface extends
                B, A
              {}
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedHeritageClausesOrder',
              },
            ],
            output: dedent`
              class Class implements
                A, B
              {}
            `,
            code: dedent`
              class Class implements
                B, A
              {}
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

    ruleTester.run(`${ruleName}(${type}): sorts heritage clauses`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            interface Interface extends
              a,
              b,
              c {
            }
          `,
          code: dedent`
            interface Interface extends
              a,
              c,
              b {
            }
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}(${type}): does not break docs`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
            {
              data: {
                right: 'c',
                left: 'd',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
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
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts heritage clauses with comments on the same line`,
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
                messageId: 'unexpectedHeritageClausesOrder',
              },
            ],
            output: dedent`
              interface Interface extends
                a // Comment A
                , b // Comment B
                {
              }
            `,
            code: dedent`
              interface Interface extends
                b // Comment B
                , a // Comment A
                {
              }
            `,
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  leftGroup: 'unknown',
                  rightGroup: 'g',
                  right: 'g',
                  left: 'a',
                },
                messageId: 'unexpectedHeritageClausesGroupOrder',
              },
            ],
            options: [
              {
                ...options,
                customGroups: {
                  g: 'g',
                },
                groups: ['g'],
              },
            ],
            output: dedent`
              interface Interface extends
                g,
                a {
              }
            `,
            code: dedent`
              interface Interface extends
                a,
                g {
              }
            `,
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                customGroups: {
                  g: 'g',
                },
                groups: ['g'],
              },
            ],
            code: dedent`
              interface Interface extends
                g,
                a {
              }
            `,
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
            options: [
              {
                ...options,
                customGroups: {
                  elementsWithoutFoo: '^(?!.*Foo).*$',
                },
                groups: ['unknown', 'elementsWithoutFoo'],
              },
            ],
            code: dedent`
              interface Interface extends
                  iHaveFooInMyName,
                  meTooIHaveFoo,
                  a,
                  b {
              }
            `,
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
            options: [
              {
                ...options,
                specialCharacters: 'remove',
              },
            ],
            code: dedent`
              interface MyInterface extends
                ab,
                a_c {
              }
            `,
          },
        ],
        invalid: [],
      },
    )
  })

  describe(`${ruleName}: sorts by custom alphabet`, () => {
    let type = 'custom'

    let alphabet = Alphabet.generateRecommendedAlphabet()
      .sortByLocaleCompare('en-US')
      .getCharacters()
    let options = {
      type: 'custom',
      order: 'asc',
      alphabet,
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts heritage clauses`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            interface Interface extends
              a,
              b,
              c {
            }
          `,
          code: dedent`
            interface Interface extends
              a,
              c,
              b {
            }
          `,
          options: [options],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            interface Interface extends
              A.a,
              B.b,
              C.c {
            }
          `,
          code: dedent`
            interface Interface extends
              A.a,
              C.c,
              B.b {
            }
          `,
          options: [options],
        },
      ],
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
    })
  })

  describe(`${ruleName}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      ignoreCase: true,
      order: 'desc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts heritage clauses`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'bb',
                left: 'c',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            interface Interface extends
              aaa,
              bb,
              c {
            }
          `,
          code: dedent`
            interface Interface extends
              aaa,
              c,
              bb {
            }
          `,
          options: [options],
        },
        {
          errors: [
            {
              data: {
                right: 'bb',
                left: 'c',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            class Class implements
              aaa,
              bb,
              c {
            }
          `,
          code: dedent`
            class Class implements
              aaa,
              c,
              bb {
            }
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}(${type}): does not break docs`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'aaaa',
                left: 'bbb',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
            {
              data: {
                right: 'cc',
                left: 'd',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
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
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts heritage clauses with comments on the same line`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'aa',
                  left: 'b',
                },
                messageId: 'unexpectedHeritageClausesOrder',
              },
            ],
            output: dedent`
              interface Interface extends
                aa // Comment A
                , b // Comment B
                {
              }
            `,
            code: dedent`
              interface Interface extends
                b // Comment B
                , aa // Comment A
                {
              }
            `,
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  leftGroup: 'unknown',
                  rightGroup: 'g',
                  left: 'aa',
                  right: 'g',
                },
                messageId: 'unexpectedHeritageClausesGroupOrder',
              },
            ],
            options: [
              {
                ...options,
                customGroups: {
                  g: 'g',
                },
                groups: ['g'],
              },
            ],
            output: dedent`
              interface Interface extends
                g,
                aa {
              }
            `,
            code: dedent`
              interface Interface extends
                aa,
                g {
              }
            `,
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                customGroups: {
                  g: 'g',
                },
                groups: ['g'],
              },
            ],
            code: dedent`
              interface Interface extends
                g,
                aa {
              }
            `,
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
            options: [
              {
                ...options,
                customGroups: {
                  elementsWithoutFoo: '^(?!.*Foo).*$',
                },
                groups: ['unknown', 'elementsWithoutFoo'],
              },
            ],
            code: dedent`
              interface Interface extends
                  iHaveFooInMyName,
                  meTooIHaveFoo,
                  a,
                  b {
              }
            `,
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

    ruleTester.run(
      `${ruleName}(${type}): handles "fallbackSort" option`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'a',
                },
                messageId: 'unexpectedHeritageClausesOrder',
              },
            ],
            options: [
              {
                ...options,
                fallbackSort: {
                  type: 'alphabetical',
                },
              },
            ],
            output: dedent`
              interface Interface extends
                bb,
                c,
                a,
              {}
            `,
            code: dedent`
              interface Interface extends
                a,
                bb,
                c,
              {}
            `,
          },
          {
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedHeritageClausesOrder',
              },
            ],
            options: [
              {
                ...options,
                fallbackSort: {
                  type: 'alphabetical',
                  order: 'asc',
                },
              },
            ],
            output: dedent`
              interface Interface extends
                bb,
                a,
                c,
              {}
            `,
            code: dedent`
              interface Interface extends
                c,
                bb,
                a,
              {}
            `,
          },
        ],
        valid: [],
      },
    )
  })

  describe(`${ruleName}: unsorted type`, () => {
    let type = 'unsorted'

    let options = {
      type: 'unsorted',
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): does not enforce sorting`, rule, {
      valid: [
        {
          code: dedent`
            interface Interface extends
              b,
              c,
              a
            {}
          `,
          options: [options],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}(${type}): enforces grouping`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                rightGroup: 'b',
                leftGroup: 'a',
                right: 'ba',
                left: 'aa',
              },
              messageId: 'unexpectedHeritageClausesGroupOrder',
            },
          ],
          options: [
            {
              ...options,
              customGroups: {
                a: '^a',
                b: '^b',
              },
              groups: ['b', 'a'],
            },
          ],
          output: dedent`
            interface Interface extends
              ba,
              bb,
              ab,
              aa
            {}
          `,
          code: dedent`
            interface Interface extends
              ab,
              aa,
              ba,
              bb
            {}
          `,
        },
      ],
      valid: [],
    })
  })

  describe(`${ruleName}: misc`, () => {
    it('validates the JSON schema', async () => {
      await expect(
        validateRuleJsonSchema(rule.meta.schema),
      ).resolves.not.toThrow()
    })
    ruleTester.run(
      `${ruleName}: sets alphabetical asc sorting as default`,
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
                messageId: 'unexpectedHeritageClausesOrder',
              },
            ],
            output: dedent`
              interface Interface extends
                a,
                b {
              }
            `,
            code: dedent`
              interface Interface extends
                b,
                a {
              }
            `,
          },
        ],
        valid: [
          dedent`
            interface Interface extends
              a,
              b {
            }
          `,
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
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            interface Interface extends
              B,
              C,
              // eslint-disable-next-line
              A
            {}
          `,
          code: dedent`
            interface Interface extends
              C,
              B,
              // eslint-disable-next-line
              A
            {}
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'C',
                left: 'D',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
            {
              data: {
                right: 'B',
                left: 'A',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            interface Interface extends
              B,
              C,
              // eslint-disable-next-line
              A,
              D
            {}
          `,
          code: dedent`
            interface Interface extends
              D,
              C,
              // eslint-disable-next-line
              A,
              B
            {}
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            interface Interface extends
              B,
              C,
              A // eslint-disable-line
            {}
          `,
          code: dedent`
            interface Interface extends
              C,
              B,
              A // eslint-disable-line
            {}
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            interface Interface extends
              B,
              C,
              /* eslint-disable-next-line */
              A
            {}
          `,
          code: dedent`
            interface Interface extends
              C,
              B,
              /* eslint-disable-next-line */
              A
            {}
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            interface Interface extends
              B,
              C,
              A /* eslint-disable-line */
            {}
          `,
          code: dedent`
            interface Interface extends
              C,
              B,
              A /* eslint-disable-line */
            {}
          `,
          options: [{}],
        },
        {
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
          errors: [
            {
              data: {
                right: 'A',
                left: 'B',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            interface Interface extends
              B,
              C,
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              A
            {}
          `,
          code: dedent`
            interface Interface extends
              C,
              B,
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              A
            {}
          `,
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            interface Interface extends
              B,
              C,
              A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            {}
          `,
          code: dedent`
            interface Interface extends
              C,
              B,
              A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            {}
          `,
          options: [{}],
        },
        {
          output: dedent`
            interface Interface extends
              B,
              C,
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              A
            {}
          `,
          code: dedent`
            interface Interface extends
              C,
              B,
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              A
            {}
          `,
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            interface Interface extends
              B,
              C,
              A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            {}
          `,
          code: dedent`
            interface Interface extends
              C,
              B,
              A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            {}
          `,
          options: [{}],
        },
        {
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
          errors: [
            {
              data: {
                right: 'A',
                left: 'B',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            class Class implements
              B,
              C,
              // eslint-disable-next-line
              A
            {}
          `,
          code: dedent`
            class Class implements
              C,
              B,
              // eslint-disable-next-line
              A
            {}
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            class Class implements
              B,
              C,
              A // eslint-disable-line
            {}
          `,
          code: dedent`
            class Class implements
              C,
              B,
              A // eslint-disable-line
            {}
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            class Class implements
              B,
              C,
              /* eslint-disable-next-line */
              A
            {}
          `,
          code: dedent`
            class Class implements
              C,
              B,
              /* eslint-disable-next-line */
              A
            {}
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            class Class implements
              B,
              C,
              A /* eslint-disable-line */
            {}
          `,
          code: dedent`
            class Class implements
              C,
              B,
              A /* eslint-disable-line */
            {}
          `,
          options: [{}],
        },
        {
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
          errors: [
            {
              data: {
                right: 'A',
                left: 'B',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            class Class implements
              B,
              C,
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              A
            {}
          `,
          code: dedent`
            class Class implements
              C,
              B,
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              A
            {}
          `,
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            class Class implements
              B,
              C,
              A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            {}
          `,
          code: dedent`
            class Class implements
              C,
              B,
              A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            {}
          `,
          options: [{}],
        },
        {
          output: dedent`
            class Class implements
              B,
              C,
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              A
            {}
          `,
          code: dedent`
            class Class implements
              C,
              B,
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              A
            {}
          `,
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            class Class implements
              B,
              C,
              A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            {}
          `,
          code: dedent`
            class Class implements
              C,
              B,
              A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            {}
          `,
          options: [{}],
        },
        {
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
          errors: [
            {
              data: {
                right: 'A',
                left: 'B',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          options: [{}],
        },
      ],
      valid: [
        {
          code: dedent`
            class Class implements
              B,
              C,
              // eslint-disable-next-line
              A
            {}
          `,
        },
      ],
    })

    eslintRuleTester.run(
      `${ruleName}: handles non typescript-eslint parser`,
      rule as unknown as Rule.RuleModule,
      {
        valid: [
          {
            code: dedent`
              class Class extends A {}
            `,
            options: [{}],
          },
        ],
        invalid: [],
      },
    )
  })
})
