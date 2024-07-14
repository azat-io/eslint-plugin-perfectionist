import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-named-imports'

describe(RULE_NAME, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester({
    parser: '@typescript-eslint/parser',
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    let options = {
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(`${RULE_NAME}(${type}): sorts named imports`, rule, {
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

    ruleTester.run(`${RULE_NAME}: sorts named multiline imports`, rule, {
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

    ruleTester.run(`${RULE_NAME}: sorts named imports with aliases`, rule, {
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

    ruleTester.run(`${RULE_NAME}: not sorts default specifiers`, rule, {
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

    ruleTester.run(`${RULE_NAME}: sorts with import aliases`, rule, {
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

    ruleTester.run(`${RULE_NAME}: allows to ignore import aliases`, rule, {
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
      `${RULE_NAME}: sorts named imports grouping by their kind`,
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
  })

  describe(`${RULE_NAME}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${RULE_NAME}(${type}): sorts named imports`, rule, {
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

    ruleTester.run(`${RULE_NAME}: sorts named multiline imports`, rule, {
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

    ruleTester.run(`${RULE_NAME}: sorts named imports with aliases`, rule, {
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

    ruleTester.run(`${RULE_NAME}: not sorts default specifiers`, rule, {
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

    ruleTester.run(`${RULE_NAME}: sorts with import aliases`, rule, {
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

    ruleTester.run(`${RULE_NAME}: allows to ignore import aliases`, rule, {
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
      `${RULE_NAME}: sorts named imports grouping by their kind`,
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
  })

  describe(`${RULE_NAME}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(`${RULE_NAME}(${type}): sorts named imports`, rule, {
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

    ruleTester.run(`${RULE_NAME}: sorts named multiline imports`, rule, {
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

    ruleTester.run(`${RULE_NAME}: sorts named imports with aliases`, rule, {
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

    ruleTester.run(`${RULE_NAME}: not sorts default specifiers`, rule, {
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

    ruleTester.run(`${RULE_NAME}: sorts with import aliases`, rule, {
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
      `${RULE_NAME}: sorts named imports grouping by their kind`,
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

  describe(`${RULE_NAME}: misc`, () => {
    ruleTester.run(
      `${RULE_NAME}: sets alphabetical asc sorting as default`,
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
  })
})
