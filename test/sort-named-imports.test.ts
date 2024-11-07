import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule from '../rules/sort-named-imports'

let ruleName = 'sort-named-imports'

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

    ruleTester.run(`${ruleName}(${type}): sorts named imports`, rule, {
      valid: [
        {
          code: dedent`
            import { AAA, BB, C } from 'module'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            import { BB, AAA, C } from 'module'
          `,
          output: dedent`
            import { AAA, BB, C } from 'module'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'BB',
                right: 'AAA',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: sorts named multiline imports`, rule, {
      valid: [
        {
          code: dedent`
            import {
              AAAA,
              BBB,
              CC,
              D,
            } from 'module'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            import {
              AAAA,
              CC,
              BBB,
              D,
            } from 'module'
          `,
          output: dedent`
            import {
              AAAA,
              BBB,
              CC,
              D,
            } from 'module'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'CC',
                right: 'BBB',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: sorts named imports with aliases`, rule, {
      valid: [
        {
          code: dedent`
            import {
              C,
              BB as X0,
              A as X1
            } from 'module'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            import {
              A as X1,
              BB as X0,
              C
            } from 'module'
          `,
          output: dedent`
            import {
              C,
              BB as X0,
              A as X1
            } from 'module'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'X1',
                right: 'X0',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'X0',
                right: 'C',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: not sorts default specifiers`, rule, {
      valid: [
        {
          code: dedent`
            import C, { b as A } from 'module'
          `,
          options: [options],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}: sorts with import aliases`, rule, {
      valid: [
        {
          code: dedent`
            import U, {
              aaa as A,
              B,
              cc as C,
              d as D,
            } from 'module'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            import U, {
              B,
              aaa as A,
              d as D,
              cc as C,
            } from 'module'
          `,
          output: dedent`
            import U, {
              aaa as A,
              B,
              cc as C,
              d as D,
            } from 'module'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'B',
                right: 'A',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'D',
                right: 'C',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: allows to ignore import aliases`, rule, {
      valid: [
        {
          code: dedent`
          import {
              x as a,
              y as b,
              c,
            } from 'module'
          `,
          options: [
            {
              ...options,
              ignoreAlias: false,
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            import {
              c,
              x as a,
              y as b,
            } from 'module'
          `,
          output: dedent`
            import {
              x as a,
              y as b,
              c,
            } from 'module'
          `,
          options: [
            {
              ...options,
              ignoreAlias: false,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'c',
                right: 'a',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}: sorts named imports grouping by their kind`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import { AAA, type BB, BB, type C } from 'module'
            `,
            options: [{ ...options, groupKind: 'mixed' }],
          },
          {
            code: dedent`
              import { AAA, BB, type BB, type C } from 'module'
            `,
            options: [{ ...options, groupKind: 'values-first' }],
          },
          {
            code: dedent`
              import { type BB, type C, AAA, BB } from 'module'
            `,
            options: [{ ...options, groupKind: 'types-first' }],
          },
        ],
        invalid: [
          {
            code: dedent`
              import { AAA, type BB, type C, BB } from 'module'
            `,
            output: dedent`
              import { AAA, type BB, BB, type C } from 'module'
            `,
            options: [{ ...options, groupKind: 'mixed' }],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  left: 'C',
                  right: 'BB',
                },
              },
            ],
          },
          {
            code: dedent`
              import { AAA, type BB, BB, type C } from 'module'
            `,
            output: dedent`
              import { AAA, BB, type BB, type C } from 'module'
            `,
            options: [{ ...options, groupKind: 'values-first' }],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  left: 'BB',
                  right: 'BB',
                },
              },
            ],
          },
          {
            code: dedent`
              import { AAA, type BB, BB, type C } from 'module'
            `,
            output: dedent`
              import { type BB, type C, AAA, BB } from 'module'
            `,
            options: [{ ...options, groupKind: 'types-first' }],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  left: 'AAA',
                  right: 'BB',
                },
              },
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  left: 'BB',
                  right: 'C',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}: allows to use original import names`, rule, {
      valid: [
        {
          code: dedent`
            import { A as B, B as A } from 'module'
          `,
          options: [
            {
              ...options,
              ignoreAlias: true,
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            import { B as A, A as B } from 'module'
          `,
          output: dedent`
            import { A as B, B as A } from 'module'
          `,
          options: [
            {
              ...options,
              ignoreAlias: true,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'B',
                right: 'A',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              import {
                D,
                A,

                C,

                E,
                B,
              } from 'module'
            `,
            output: dedent`
              import {
                A,
                D,

                C,

                B,
                E,
              } from 'module'
            `,
            options: [
              {
                ...options,
                partitionByNewLine: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  left: 'D',
                  right: 'A',
                },
              },
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  left: 'E',
                  right: 'B',
                },
              },
            ],
          },
        ],
      },
    )

    describe('partition comments', () => {
      ruleTester.run(
        `${ruleName}(${type}): allows to use partition comments`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                import {
                  // Part: A
                  CC,
                  type D,
                  // Not partition comment
                  BBB,
                  // Part: B
                  AAAA,
                  E,
                  // Part: C
                  GG,
                  // Not partition comment
                  FFF,
                } from 'module'
              `,
              output: dedent`
                import {
                  // Part: A
                  type D,
                  // Not partition comment
                  BBB,
                  CC,
                  // Part: B
                  AAAA,
                  E,
                  // Part: C
                  // Not partition comment
                  FFF,
                  GG,
                } from 'module'
              `,
              options: [
                {
                  ...options,
                  partitionByComment: '^Part*',
                  groupKind: 'types-first',
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedNamedImportsOrder',
                  data: {
                    left: 'CC',
                    right: 'D',
                  },
                },
                {
                  messageId: 'unexpectedNamedImportsOrder',
                  data: {
                    left: 'GG',
                    right: 'FFF',
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
                import {
                  // Comment
                  BB,
                  // Other comment
                  A,
                } from 'module'
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
                import {
                  /* Partition Comment */
                  // Part: A
                  D,
                  // Part: B
                  AAA,
                  C,
                  BB,
                  /* Other */
                  E,
                } from 'module'
              `,
              output: dedent`
                import {
                  /* Partition Comment */
                  // Part: A
                  D,
                  // Part: B
                  AAA,
                  BB,
                  C,
                  /* Other */
                  E,
                } from 'module'
            `,
              options: [
                {
                  ...options,
                  partitionByComment: ['Partition Comment', 'Part: *', 'Other'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedNamedImportsOrder',
                  data: {
                    left: 'C',
                    right: 'BB',
                  },
                },
              ],
            },
          ],
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
              import { _a, b, _c } from 'module'
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
              import { ab, a_c } from 'module'
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
              import { 你好, 世界, a, A, b, B } from 'module'
            `,
          options: [{ ...options, locales: 'zh-CN' }],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}(${type}): works with arbitrary names`, rule, {
      valid: [
        {
          code: dedent`
            import { "A" as a, "B" as b } from 'module';
          `,
          options: [
            {
              ...options,
              ignoreAlias: true,
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            import { "B" as b, "A" as a } from 'module';
          `,
          output: dedent`
            import { "A" as a, "B" as b } from 'module';
          `,
          options: [
            {
              ...options,
              ignoreAlias: true,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'B',
                right: 'A',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts inline elements correctly`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              import {
                b, a
              } from 'module'
            `,
            output: dedent`
              import {
                a, b
              } from 'module'
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
          {
            code: dedent`
              import {
                b, a,
              } from 'module'
            `,
            output: dedent`
              import {
                a, b,
              } from 'module'
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
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
  })

  describe(`${ruleName}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts named imports`, rule, {
      valid: [
        {
          code: dedent`
            import { AAA, BB, C } from 'module'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            import { BB, AAA, C } from 'module'
          `,
          output: dedent`
            import { AAA, BB, C } from 'module'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'BB',
                right: 'AAA',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: sorts named multiline imports`, rule, {
      valid: [
        {
          code: dedent`
            import {
              AAAA,
              BBB,
              CC,
              D,
            } from 'module'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            import {
              AAAA,
              CC,
              BBB,
              D,
            } from 'module'
          `,
          output: dedent`
            import {
              AAAA,
              BBB,
              CC,
              D,
            } from 'module'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'CC',
                right: 'BBB',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: sorts named imports with aliases`, rule, {
      valid: [
        {
          code: dedent`
            import {
              C,
              BB as X0,
              A as X1
            } from 'module'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            import {
              A as X1,
              BB as X0,
              C
            } from 'module'
          `,
          output: dedent`
            import {
              C,
              BB as X0,
              A as X1
            } from 'module'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'X1',
                right: 'X0',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'X0',
                right: 'C',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: not sorts default specifiers`, rule, {
      valid: [
        {
          code: dedent`
            import C, { b as A } from 'module'
          `,
          options: [options],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}: sorts with import aliases`, rule, {
      valid: [
        {
          code: dedent`
            import U, {
              aaa as A,
              B,
              cc as C,
              d as D,
            } from 'module'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            import U, {
              B,
              aaa as A,
              d as D,
              cc as C,
            } from 'module'
          `,
          output: dedent`
            import U, {
              aaa as A,
              B,
              cc as C,
              d as D,
            } from 'module'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'B',
                right: 'A',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'D',
                right: 'C',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: allows to ignore import aliases`, rule, {
      valid: [
        {
          code: dedent`
          import {
              x as a,
              y as b,
              c,
            } from 'module'
          `,
          options: [
            {
              ...options,
              ignoreAlias: false,
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            import {
              c,
              x as a,
              y as b,
            } from 'module'
          `,
          output: dedent`
            import {
              x as a,
              y as b,
              c,
            } from 'module'
          `,
          options: [
            {
              ...options,
              ignoreAlias: false,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'c',
                right: 'a',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}: sorts named imports grouping by their kind`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import { AAA, type BB, BB, type C } from 'module'
            `,
            options: [{ ...options, groupKind: 'mixed' }],
          },
          {
            code: dedent`
              import { AAA, BB, type BB, type C } from 'module'
            `,
            options: [{ ...options, groupKind: 'values-first' }],
          },
          {
            code: dedent`
              import { type BB, type C, AAA, BB } from 'module'
            `,
            options: [{ ...options, groupKind: 'types-first' }],
          },
        ],
        invalid: [
          {
            code: dedent`
              import { AAA, type BB, type C, BB } from 'module'
            `,
            output: dedent`
              import { AAA, type BB, BB, type C } from 'module'
            `,
            options: [{ ...options, groupKind: 'mixed' }],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  left: 'C',
                  right: 'BB',
                },
              },
            ],
          },
          {
            code: dedent`
              import { AAA, type BB, BB, type C } from 'module'
            `,
            output: dedent`
              import { AAA, BB, type BB, type C } from 'module'
            `,
            options: [{ ...options, groupKind: 'values-first' }],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  left: 'BB',
                  right: 'BB',
                },
              },
            ],
          },
          {
            code: dedent`
              import { AAA, type BB, BB, type C } from 'module'
            `,
            output: dedent`
              import { type BB, type C, AAA, BB } from 'module'
            `,
            options: [{ ...options, groupKind: 'types-first' }],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  left: 'AAA',
                  right: 'BB',
                },
              },
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  left: 'BB',
                  right: 'C',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}: allows to use original import names`, rule, {
      valid: [
        {
          code: dedent`
            import { A as B, B as A } from 'module'
          `,
          options: [
            {
              ...options,
              ignoreAlias: true,
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            import { B as A, A as B } from 'module'
          `,
          output: dedent`
            import { A as B, B as A } from 'module'
          `,
          options: [
            {
              ...options,
              ignoreAlias: true,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
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

  describe(`${ruleName}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts named imports`, rule, {
      valid: [
        {
          code: dedent`
            import { AAA, BB, C } from 'module'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            import { BB, AAA, C } from 'module'
          `,
          output: dedent`
            import { AAA, BB, C } from 'module'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'BB',
                right: 'AAA',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: sorts named multiline imports`, rule, {
      valid: [
        {
          code: dedent`
            import {
              AAAA,
              BBB,
              CC,
              D,
            } from 'module'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            import {
              AAAA,
              CC,
              BBB,
              D,
            } from 'module'
          `,
          output: dedent`
            import {
              AAAA,
              BBB,
              CC,
              D,
            } from 'module'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'CC',
                right: 'BBB',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: sorts named imports with aliases`, rule, {
      valid: [
        {
          code: dedent`
            import {
              BB as X0,
              A as X1,
              C
            } from 'module'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            import {
              A as X1,
              BB as X0,
              C
            } from 'module'
          `,
          output: dedent`
            import {
              BB as X0,
              A as X1,
              C
            } from 'module'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'X1',
                right: 'X0',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: not sorts default specifiers`, rule, {
      valid: [
        {
          code: dedent`
            import C, { b as A } from 'module'
          `,
          options: [options],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}: sorts with import aliases`, rule, {
      valid: [
        {
          code: dedent`
            import U, {
              aaa as A,
              cc as C,
              d as D,
              B,
            } from 'module'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            import U, {
              B,
              aaa as A,
              d as D,
              cc as C,
            } from 'module'
          `,
          output: dedent`
            import U, {
              aaa as A,
              cc as C,
              d as D,
              B,
            } from 'module'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'B',
                right: 'A',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'D',
                right: 'C',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}: sorts named imports grouping by their kind`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import { type BB, type C, AAA, BB } from 'module'
            `,
            options: [{ ...options, groupKind: 'mixed' }],
          },
          {
            code: dedent`
              import { AAA, BB, type BB, type C } from 'module'
            `,
            options: [{ ...options, groupKind: 'values-first' }],
          },
          {
            code: dedent`
              import { type BB, type C, AAA, BB } from 'module'
            `,
            options: [{ ...options, groupKind: 'types-first' }],
          },
        ],
        invalid: [
          {
            code: dedent`
              import { AAA, type BB, type C, BB } from 'module'
            `,
            output: dedent`
              import { type BB, type C, AAA, BB } from 'module'
            `,
            options: [{ ...options, groupKind: 'mixed' }],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  left: 'AAA',
                  right: 'BB',
                },
              },
            ],
          },
          {
            code: dedent`
              import { AAA, type BB, BB, type C } from 'module'
            `,
            output: dedent`
              import { AAA, BB, type BB, type C } from 'module'
            `,
            options: [{ ...options, groupKind: 'values-first' }],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  left: 'BB',
                  right: 'BB',
                },
              },
            ],
          },
          {
            code: dedent`
              import { AAA, type BB, BB, type C } from 'module'
            `,
            output: dedent`
              import { type BB, type C, AAA, BB } from 'module'
            `,
            options: [{ ...options, groupKind: 'types-first' }],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  left: 'AAA',
                  right: 'BB',
                },
              },
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  left: 'BB',
                  right: 'C',
                },
              },
            ],
          },
        ],
      },
    )
  })

  describe(`${ruleName}: misc`, () => {
    ruleTester.run(
      `${ruleName}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          "import { A, B, C } from 'module'",
          {
            code: "import { log, log10, log1p, log2 } from 'module'",
            options: [{}],
          },
        ],
        invalid: [
          {
            code: dedent`
              import { B, C, A } from 'module'
            `,
            output: dedent`
              import { A, B, C } from 'module'
            `,
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  left: 'C',
                  right: 'A',
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
            import {
              c,
              b,
              // eslint-disable-next-line
              a
            } from 'module'
          `,
          output: dedent`
            import {
              b,
              c,
              // eslint-disable-next-line
              a
            } from 'module'
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
        {
          code: dedent`
            import {
              d,
              c,
              // eslint-disable-next-line
              a,
              b
            } from 'module'
          `,
          output: dedent`
            import {
              b,
              c,
              // eslint-disable-next-line
              a,
              d
            } from 'module'
          `,
          options: [
            {
              partitionByComment: true,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'd',
                right: 'c',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'a',
                right: 'b',
              },
            },
          ],
        },
        {
          code: dedent`
            import {
              c,
              b,
              a // eslint-disable-line
            } from 'module'
          `,
          output: dedent`
            import {
              b,
              c,
              a // eslint-disable-line
            } from 'module'
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
        {
          code: dedent`
            import {
              c,
              b,
              /* eslint-disable-next-line */
              a
            } from 'module'
          `,
          output: dedent`
            import {
              b,
              c,
              /* eslint-disable-next-line */
              a
            } from 'module'
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
        {
          code: dedent`
            import {
              c,
              b,
              a /* eslint-disable-line */
            } from 'module'
          `,
          output: dedent`
            import {
              b,
              c,
              a /* eslint-disable-line */
            } from 'module'
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
        {
          code: dedent`
            import {
              d,
              e,
              /* eslint-disable */
              c,
              b,
              // Shouldn't move
              /* eslint-enable */
              a,
            } from 'module'
          `,
          output: dedent`
            import {
              a,
              d,
              /* eslint-disable */
              c,
              b,
              // Shouldn't move
              /* eslint-enable */
              e,
            } from 'module'
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
          ],
        },
        {
          code: dedent`
            import {
              c,
              b,
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              a
            } from 'module'
          `,
          output: dedent`
            import {
              b,
              c,
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              a
            } from 'module'
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
        {
          code: dedent`
            import {
              c,
              b,
              a // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            } from 'module'
          `,
          output: dedent`
            import {
              b,
              c,
              a // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            } from 'module'
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
        {
          code: dedent`
            import {
              c,
              b,
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              a
            } from 'module'
          `,
          output: dedent`
            import {
              b,
              c,
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              a
            } from 'module'
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
        {
          code: dedent`
            import {
              c,
              b,
              a /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            } from 'module'
          `,
          output: dedent`
            import {
              b,
              c,
              a /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            } from 'module'
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
        {
          code: dedent`
            import {
              d,
              e,
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              c,
              b,
              // Shouldn't move
              /* eslint-enable */
              a,
            } from 'module'
          `,
          output: dedent`
            import {
              a,
              d,
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              c,
              b,
              // Shouldn't move
              /* eslint-enable */
              e,
            } from 'module'
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
          ],
        },
      ],
    })
  })
})
