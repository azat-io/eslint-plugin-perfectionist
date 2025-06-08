import type { Rule } from 'eslint'

import { RuleTester } from '@typescript-eslint/rule-tester'
import { RuleTester as EslintRuleTester } from 'eslint'
import { afterAll, describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import rule from '../../rules/sort-named-imports'
import { Alphabet } from '../../utils/alphabet'

let ruleName = 'sort-named-imports'

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

    ruleTester.run(`${ruleName}(${type}): sorts named imports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'AAA',
                left: 'BB',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import { AAA, BB, C } from 'module'
          `,
          code: dedent`
            import { BB, AAA, C } from 'module'
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            import { AAA, BB, C } from 'module'
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}: sorts named multiline imports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'BBB',
                left: 'CC',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import {
              AAAA,
              BBB,
              CC,
              D,
            } from 'module'
          `,
          code: dedent`
            import {
              AAAA,
              CC,
              BBB,
              D,
            } from 'module'
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}: sorts named imports with aliases`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'X0',
                left: 'X1',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
            {
              data: {
                left: 'X0',
                right: 'C',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import {
              C,
              BB as X0,
              A as X1
            } from 'module'
          `,
          code: dedent`
            import {
              A as X1,
              BB as X0,
              C
            } from 'module'
          `,
          options: [options],
        },
      ],
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
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'A',
                left: 'B',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
            {
              data: {
                right: 'C',
                left: 'D',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import U, {
              aaa as A,
              B,
              cc as C,
              d as D,
            } from 'module'
          `,
          code: dedent`
            import U, {
              B,
              aaa as A,
              d as D,
              cc as C,
            } from 'module'
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}: allows to ignore import aliases`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'c',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import {
              x as a,
              y as b,
              c,
            } from 'module'
          `,
          code: dedent`
            import {
              c,
              x as a,
              y as b,
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
    })

    ruleTester.run(
      `${ruleName}: sorts named imports grouping by their kind`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'BB',
                  left: 'C',
                },
                messageId: 'unexpectedNamedImportsOrder',
              },
            ],
            output: dedent`
              import { AAA, type BB, BB, type C } from 'module'
            `,
            code: dedent`
              import { AAA, type BB, type C, BB } from 'module'
            `,
            options: [{ ...options, groupKind: 'mixed' }],
          },
          {
            errors: [
              {
                data: {
                  right: 'BB',
                  left: 'BB',
                },
                messageId: 'unexpectedNamedImportsOrder',
              },
            ],
            output: dedent`
              import { AAA, BB, type BB, type C } from 'module'
            `,
            code: dedent`
              import { AAA, type BB, BB, type C } from 'module'
            `,
            options: [{ ...options, groupKind: 'values-first' }],
          },
          {
            errors: [
              {
                data: {
                  left: 'AAA',
                  right: 'BB',
                },
                messageId: 'unexpectedNamedImportsOrder',
              },
              {
                data: {
                  left: 'BB',
                  right: 'C',
                },
                messageId: 'unexpectedNamedImportsOrder',
              },
            ],
            output: dedent`
              import { type BB, type C, AAA, BB } from 'module'
            `,
            code: dedent`
              import { AAA, type BB, BB, type C } from 'module'
            `,
            options: [{ ...options, groupKind: 'types-first' }],
          },
        ],
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
      },
    )

    ruleTester.run(`${ruleName}: allows to use original import names`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'A',
                left: 'B',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          options: [
            {
              ...options,
              ignoreAlias: true,
            },
          ],
          output: dedent`
            import { A as B, B as A } from 'module'
          `,
          code: dedent`
            import { B as A, A as B } from 'module'
          `,
        },
      ],
      valid: [
        {
          options: [
            {
              ...options,
              ignoreAlias: true,
            },
          ],
          code: dedent`
            import { A as B, B as A } from 'module'
          `,
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'A',
                  left: 'D',
                },
                messageId: 'unexpectedNamedImportsOrder',
              },
              {
                data: {
                  right: 'B',
                  left: 'E',
                },
                messageId: 'unexpectedNamedImportsOrder',
              },
            ],
            output: dedent`
              import {
                A,
                D,

                C,

                B,
                E,
              } from 'module'
            `,
            code: dedent`
              import {
                D,
                A,

                C,

                E,
                B,
              } from 'module'
            `,
            options: [
              {
                ...options,
                partitionByNewLine: true,
              },
            ],
          },
        ],
        valid: [],
      },
    )

    describe('partition comments', () => {
      ruleTester.run(
        `${ruleName}(${type}): allows to use partition comments`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    left: 'CC',
                    right: 'D',
                  },
                  messageId: 'unexpectedNamedImportsOrder',
                },
                {
                  data: {
                    right: 'FFF',
                    left: 'GG',
                  },
                  messageId: 'unexpectedNamedImportsOrder',
                },
              ],
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
              options: [
                {
                  ...options,
                  partitionByComment: '^Part',
                  groupKind: 'types-first',
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
          invalid: [
            {
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
              errors: [
                {
                  data: {
                    right: 'BB',
                    left: 'C',
                  },
                  messageId: 'unexpectedNamedImportsOrder',
                },
              ],
              options: [
                {
                  ...options,
                  partitionByComment: ['Partition Comment', 'Part:', 'Other'],
                },
              ],
            },
          ],
          valid: [],
        },
      )

      describe(`${ruleName}(${type}): allows to use "partitionByComment.line"`, () => {
        ruleTester.run(`${ruleName}(${type}): ignores block comments`, rule, {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'A',
                    left: 'B',
                  },
                  messageId: 'unexpectedNamedImportsOrder',
                },
              ],
              options: [
                {
                  ...options,
                  partitionByComment: {
                    line: true,
                  },
                },
              ],
              output: dedent`
                import {
                  /* Comment */
                  A,
                  B,
                } from 'module'
              `,
              code: dedent`
                import {
                  B,
                  /* Comment */
                  A,
                } from 'module'
              `,
            },
          ],
          valid: [],
        })

        ruleTester.run(
          `${ruleName}(${type}): allows to use all comments as parts`,
          rule,
          {
            valid: [
              {
                options: [
                  {
                    ...options,
                    partitionByComment: {
                      line: true,
                    },
                  },
                ],
                code: dedent`
                  import {
                    B,
                    // Comment
                    A,
                  } from 'module'
                `,
              },
            ],
            invalid: [],
          },
        )

        ruleTester.run(
          `${ruleName}(${type}): allows to use multiple partition comments`,
          rule,
          {
            valid: [
              {
                code: dedent`
                  import {
                    C,
                    // B
                    B,
                    // A
                    A,
                  } from 'module'
                `,
                options: [
                  {
                    ...options,
                    partitionByComment: {
                      line: ['A', 'B'],
                    },
                  },
                ],
              },
            ],
            invalid: [],
          },
        )

        ruleTester.run(
          `${ruleName}(${type}): allows to use regex for partition comments`,
          rule,
          {
            valid: [
              {
                options: [
                  {
                    ...options,
                    partitionByComment: {
                      line: ['^(?!.*foo).*$'],
                    },
                  },
                ],
                code: dedent`
                  import {
                    B,
                    // I am a partition comment because I don't have f o o
                    A,
                  } from 'module'
                `,
              },
            ],
            invalid: [],
          },
        )
      })

      describe(`${ruleName}(${type}): allows to use "partitionByComment.block"`, () => {
        ruleTester.run(`${ruleName}(${type}): ignores line comments`, rule, {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'A',
                    left: 'B',
                  },
                  messageId: 'unexpectedNamedImportsOrder',
                },
              ],
              options: [
                {
                  ...options,
                  partitionByComment: {
                    block: true,
                  },
                },
              ],
              output: dedent`
                import {
                  // Comment
                  A,
                  B,
                } from 'module'
              `,
              code: dedent`
                import {
                  B,
                  // Comment
                  A,
                } from 'module'
              `,
            },
          ],
          valid: [],
        })

        ruleTester.run(
          `${ruleName}(${type}): allows to use all comments as parts`,
          rule,
          {
            valid: [
              {
                options: [
                  {
                    ...options,
                    partitionByComment: {
                      block: true,
                    },
                  },
                ],
                code: dedent`
                  import {
                    B,
                    /* Comment */
                    A,
                  } from 'module'
                `,
              },
            ],
            invalid: [],
          },
        )

        ruleTester.run(
          `${ruleName}(${type}): allows to use multiple partition comments`,
          rule,
          {
            valid: [
              {
                code: dedent`
                  import {
                    C,
                    /* B */
                    B,
                    /* A */
                    A,
                  } from 'module'
                `,
                options: [
                  {
                    ...options,
                    partitionByComment: {
                      block: ['A', 'B'],
                    },
                  },
                ],
              },
            ],
            invalid: [],
          },
        )

        ruleTester.run(
          `${ruleName}(${type}): allows to use regex for partition comments`,
          rule,
          {
            valid: [
              {
                code: dedent`
                  import {
                    B,
                    /* I am a partition comment because I don't have f o o */
                    A,
                  } from 'module'
                `,
                options: [
                  {
                    ...options,
                    partitionByComment: {
                      block: ['^(?!.*foo).*$'],
                    },
                  },
                ],
              },
            ],
            invalid: [],
          },
        )
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
              import { _a, b, _c } from 'module'
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
              import { ab, a_c } from 'module'
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
            import { 你好, 世界, a, A, b, B } from 'module'
          `,
          options: [{ ...options, locales: 'zh-CN' }],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}(${type}): works with arbitrary names`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'A',
                left: 'B',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          options: [
            {
              ...options,
              ignoreAlias: true,
            },
          ],
          output: dedent`
            import { "A" as a, "B" as b } from 'module';
          `,
          code: dedent`
            import { "B" as b, "A" as a } from 'module';
          `,
        },
      ],
      valid: [
        {
          options: [
            {
              ...options,
              ignoreAlias: true,
            },
          ],
          code: dedent`
            import { "A" as a, "B" as b } from 'module';
          `,
        },
      ],
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
                messageId: 'unexpectedNamedImportsOrder',
              },
            ],
            output: dedent`
              import {
                a, b
              } from 'module'
            `,
            code: dedent`
              import {
                b, a
              } from 'module'
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
                messageId: 'unexpectedNamedImportsOrder',
              },
            ],
            output: dedent`
              import {
                a, b,
              } from 'module'
            `,
            code: dedent`
              import {
                b, a,
              } from 'module'
            `,
            options: [options],
          },
        ],
        valid: [],
      },
    )

    describe(`${ruleName}: custom groups`, () => {
      ruleTester.run(`${ruleName}: filters on modifier`, rule, {
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'typeElements',
                  leftGroup: 'unknown',
                  right: 'b',
                  left: 'a',
                },
                messageId: 'unexpectedNamedImportsGroupOrder',
              },
            ],
            options: [
              {
                customGroups: [
                  {
                    groupName: 'typeElements',
                    modifiers: ['type'],
                  },
                ],
                groups: ['typeElements', 'unknown'],
              },
            ],
            output: dedent`
              import {
                type b,
                a,
              } from 'module'
            `,
            code: dedent`
              import {
                a,
                type b,
              } from 'module'
            `,
          },
        ],
        valid: [],
      })

      for (let elementNamePattern of [
        'hello',
        ['noMatch', 'hello'],
        { pattern: 'HELLO', flags: 'i' },
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ]) {
        ruleTester.run(`${ruleName}: filters on elementNamePattern`, rule, {
          invalid: [
            {
              options: [
                {
                  customGroups: [
                    {
                      groupName: 'typesStartingWithHello',
                      modifiers: ['type'],
                      elementNamePattern,
                    },
                  ],
                  groups: ['typesStartingWithHello', 'unknown'],
                },
              ],
              errors: [
                {
                  data: {
                    rightGroup: 'typesStartingWithHello',
                    leftGroup: 'unknown',
                    right: 'helloType',
                    left: 'b',
                  },
                  messageId: 'unexpectedNamedImportsGroupOrder',
                },
              ],
              output: dedent`
                import {
                  type helloType,
                  a,
                  b,
                } from 'module'
              `,
              code: dedent`
                import {
                  a,
                  b,
                  type helloType,
                } from 'module'
              `,
            },
          ],
          valid: [],
        })
      }

      ruleTester.run(
        `${ruleName}: sort custom groups by overriding 'type' and 'order'`,
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
                  messageId: 'unexpectedNamedImportsOrder',
                },
                {
                  data: {
                    right: 'ccc',
                    left: 'bb',
                  },
                  messageId: 'unexpectedNamedImportsOrder',
                },
                {
                  data: {
                    right: 'dddd',
                    left: 'ccc',
                  },
                  messageId: 'unexpectedNamedImportsOrder',
                },
                {
                  data: {
                    rightGroup: 'reversedTypesByLineLength',
                    leftGroup: 'unknown',
                    right: 'eee',
                    left: 'm',
                  },
                  messageId: 'unexpectedNamedImportsGroupOrder',
                },
              ],
              options: [
                {
                  customGroups: [
                    {
                      groupName: 'reversedTypesByLineLength',
                      modifiers: ['type'],
                      type: 'line-length',
                      order: 'desc',
                    },
                  ],
                  groups: ['reversedTypesByLineLength', 'unknown'],
                  type: 'alphabetical',
                  order: 'asc',
                },
              ],
              output: dedent`
                import {
                  type dddd,
                  type ccc,
                  type eee,
                  type bb,
                  type ff,
                  type a,
                  type g,
                  m,
                  o,
                  p,
                } from 'module'
              `,
              code: dedent`
                import {
                  type a,
                  type bb,
                  type ccc,
                  type dddd,
                  m,
                  type eee,
                  type ff,
                  type g,
                  o,
                  p,
                } from 'module'
              `,
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}: sort custom groups by overriding 'fallbackSort'`,
        rule,
        {
          invalid: [
            {
              options: [
                {
                  customGroups: [
                    {
                      fallbackSort: {
                        type: 'alphabetical',
                        order: 'asc',
                      },
                      elementNamePattern: '^foo',
                      type: 'line-length',
                      groupName: 'foo',
                      order: 'desc',
                    },
                  ],
                  type: 'alphabetical',
                  groups: ['foo'],
                  order: 'asc',
                },
              ],
              errors: [
                {
                  data: {
                    right: 'fooBar',
                    left: 'fooZar',
                  },
                  messageId: 'unexpectedNamedImportsOrder',
                },
              ],
              output: dedent`
                import {
                  fooBar,
                  fooZar,
                } from 'module'
              `,
              code: dedent`
                import {
                  fooZar,
                  fooBar,
                } from 'module'
              `,
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}: does not sort custom groups with 'unsorted' type`,
        rule,
        {
          invalid: [
            {
              options: [
                {
                  customGroups: [
                    {
                      groupName: 'unsortedTypes',
                      modifiers: ['type'],
                      type: 'unsorted',
                    },
                  ],
                  groups: ['unsortedTypes', 'unknown'],
                },
              ],
              errors: [
                {
                  data: {
                    rightGroup: 'unsortedTypes',
                    leftGroup: 'unknown',
                    right: 'c',
                    left: 'm',
                  },
                  messageId: 'unexpectedNamedImportsGroupOrder',
                },
              ],
              output: dedent`
                import {
                  type b,
                  type a,
                  type d,
                  type e,
                  type c,
                  m,
                } from 'module'
              `,
              code: dedent`
                import {
                  type b,
                  type a,
                  type d,
                  type e,
                  m,
                  type c,
                } from 'module'
              `,
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(`${ruleName}: sort custom group blocks`, rule, {
        invalid: [
          {
            options: [
              {
                customGroups: [
                  {
                    anyOf: [
                      {
                        elementNamePattern: 'foo|Foo',
                        modifiers: ['type'],
                      },
                      {
                        elementNamePattern: 'foo|Foo',
                      },
                    ],
                    groupName: 'elementsIncludingFoo',
                  },
                ],
                groups: ['elementsIncludingFoo', 'unknown'],
              },
            ],
            errors: [
              {
                data: {
                  rightGroup: 'elementsIncludingFoo',
                  leftGroup: 'unknown',
                  right: 'cFoo',
                  left: 'a',
                },
                messageId: 'unexpectedNamedImportsGroupOrder',
              },
            ],
            output: dedent`
              import {
                type cFoo,
                foo,
                type a,
              } from 'module'
            `,
            code: dedent`
              import {
                type a,
                type cFoo,
                foo,
              } from 'module'
            `,
          },
        ],
        valid: [],
      })

      ruleTester.run(
        `${ruleName}: allows to use regex for element names in custom groups`,
        rule,
        {
          valid: [
            {
              options: [
                {
                  customGroups: [
                    {
                      elementNamePattern: '^(?!.*Foo).*$',
                      groupName: 'elementsWithoutFoo',
                    },
                  ],
                  groups: ['unknown', 'elementsWithoutFoo'],
                  type: 'alphabetical',
                },
              ],
              code: dedent`
                import {
                  iHaveFooInMyName,
                  meTooIHaveFoo,
                  a,
                  b,
                } from 'module'
              `,
            },
          ],
          invalid: [],
        },
      )
    })

    describe(`${ruleName}: newlinesBetween`, () => {
      ruleTester.run(
        `${ruleName}(${type}): removes newlines when never`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'y',
                    left: 'a',
                  },
                  messageId: 'extraSpacingBetweenNamedImports',
                },
                {
                  data: {
                    right: 'b',
                    left: 'z',
                  },
                  messageId: 'unexpectedNamedImportsOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'z',
                  },
                  messageId: 'extraSpacingBetweenNamedImports',
                },
              ],
              options: [
                {
                  ...options,
                  customGroups: [
                    {
                      elementNamePattern: 'a',
                      groupName: 'a',
                    },
                  ],
                  groups: ['a', 'unknown'],
                  newlinesBetween: 'never',
                },
              ],
              code: dedent`
                import {
                    a,


                   y,
                  z,

                      b,
                } from 'module'
              `,
              output: dedent`
                import {
                    a,
                   b,
                  y,
                      z,
                } from 'module'
              `,
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): keeps one newline when always`,
        rule,
        {
          invalid: [
            {
              options: [
                {
                  ...options,
                  customGroups: [
                    {
                      elementNamePattern: 'a',
                      groupName: 'a',
                    },
                    {
                      elementNamePattern: 'b',
                      groupName: 'b',
                    },
                  ],
                  newlinesBetween: 'always',
                  groups: ['a', 'b'],
                },
              ],
              errors: [
                {
                  data: {
                    right: 'b',
                    left: 'a',
                  },
                  messageId: 'missedSpacingBetweenNamedImports',
                },
              ],
              output: dedent`
                import {
                  a, 

                b
                } from 'module'
              `,
              code: dedent`
                import {
                  a, b
                } from 'module'
              `,
            },
            {
              errors: [
                {
                  data: {
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'extraSpacingBetweenNamedImports',
                },
                {
                  data: {
                    right: 'y',
                    left: 'z',
                  },
                  messageId: 'unexpectedNamedImportsOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'y',
                  },
                  messageId: 'missedSpacingBetweenNamedImports',
                },
              ],
              options: [
                {
                  ...options,
                  customGroups: [
                    {
                      elementNamePattern: 'a',
                      groupName: 'a',
                    },
                    {
                      elementNamePattern: 'b',
                      groupName: 'b',
                    },
                  ],
                  groups: ['a', 'unknown', 'b'],
                  newlinesBetween: 'always',
                },
              ],
              output: dedent`
                import {
                    a,

                   y,
                  z,

                      b,
                } from 'module'
              `,
              code: dedent`
                import {
                    a,


                   z,
                  y,
                      b,
                } from 'module'
              `,
            },
          ],
          valid: [],
        },
      )

      describe(`${ruleName}(${type}): "newlinesBetween" inside groups`, () => {
        ruleTester.run(
          `${ruleName}(${type}): handles "newlinesBetween" between consecutive groups`,
          rule,
          {
            invalid: [
              {
                options: [
                  {
                    ...options,
                    groups: [
                      'a',
                      { newlinesBetween: 'always' },
                      'b',
                      { newlinesBetween: 'always' },
                      'c',
                      { newlinesBetween: 'never' },
                      'd',
                      { newlinesBetween: 'ignore' },
                      'e',
                    ],
                    customGroups: [
                      { elementNamePattern: 'a', groupName: 'a' },
                      { elementNamePattern: 'b', groupName: 'b' },
                      { elementNamePattern: 'c', groupName: 'c' },
                      { elementNamePattern: 'd', groupName: 'd' },
                      { elementNamePattern: 'e', groupName: 'e' },
                    ],
                    newlinesBetween: 'always',
                  },
                ],
                errors: [
                  {
                    data: {
                      right: 'b',
                      left: 'a',
                    },
                    messageId: 'missedSpacingBetweenNamedImports',
                  },
                  {
                    data: {
                      right: 'c',
                      left: 'b',
                    },
                    messageId: 'extraSpacingBetweenNamedImports',
                  },
                  {
                    data: {
                      right: 'd',
                      left: 'c',
                    },
                    messageId: 'extraSpacingBetweenNamedImports',
                  },
                ],
                code: dedent`
                    import {
                    a,
                    b,


                    c,

                    d,


                    e,
                  } from 'module'
                `,
                output: dedent`
                  import {
                    a,

                    b,

                    c,
                    d,


                    e,
                  } from 'module'
                `,
              },
            ],
            valid: [],
          },
        )

        describe(`${ruleName}(${type}): "newlinesBetween" between non-consecutive groups`, () => {
          for (let [globalNewlinesBetween, groupNewlinesBetween] of [
            ['always', 'never'] as const,
            ['always', 'ignore'] as const,
            ['never', 'always'] as const,
            ['ignore', 'always'] as const,
          ]) {
            ruleTester.run(
              `${ruleName}(${type}): enforces a newline if the global option is "${globalNewlinesBetween}" and the group option is "${groupNewlinesBetween}"`,
              rule,
              {
                invalid: [
                  {
                    options: [
                      {
                        ...options,
                        customGroups: [
                          { elementNamePattern: 'a', groupName: 'a' },
                          { elementNamePattern: 'b', groupName: 'b' },
                          { groupName: 'unusedGroup', elementNamePattern: 'X' },
                        ],
                        groups: [
                          'a',
                          'unusedGroup',
                          { newlinesBetween: groupNewlinesBetween },
                          'b',
                        ],
                        newlinesBetween: globalNewlinesBetween,
                      },
                    ],
                    errors: [
                      {
                        data: {
                          right: 'b',
                          left: 'a',
                        },
                        messageId: 'missedSpacingBetweenNamedImports',
                      },
                    ],
                    output: dedent`
                      import {
                        a,

                        b,
                      } from 'module'
                    `,
                    code: dedent`
                      import {
                        a,
                        b,
                      } from 'module'
                    `,
                  },
                ],
                valid: [],
              },
            )
          }

          for (let globalNewlinesBetween of [
            'always',
            'ignore',
            'never',
          ] as const) {
            ruleTester.run(
              `${ruleName}(${type}): enforces no newline if the global option is "${globalNewlinesBetween}" and "newlinesBetween: never" exists between all groups`,
              rule,
              {
                invalid: [
                  {
                    options: [
                      {
                        ...options,
                        groups: [
                          'a',
                          { newlinesBetween: 'never' },
                          'unusedGroup',
                          { newlinesBetween: 'never' },
                          'b',
                          { newlinesBetween: 'always' },
                          'c',
                        ],
                        customGroups: [
                          { elementNamePattern: 'a', groupName: 'a' },
                          { elementNamePattern: 'b', groupName: 'b' },
                          { elementNamePattern: 'c', groupName: 'c' },
                          { groupName: 'unusedGroup', elementNamePattern: 'X' },
                        ],
                        newlinesBetween: globalNewlinesBetween,
                      },
                    ],
                    errors: [
                      {
                        data: {
                          right: 'b',
                          left: 'a',
                        },
                        messageId: 'extraSpacingBetweenNamedImports',
                      },
                    ],
                    output: dedent`
                      import {
                        a,
                        b,
                      } from 'module'
                    `,
                    code: dedent`
                      import {
                        a,

                        b,
                      } from 'module'
                    `,
                  },
                ],
                valid: [],
              },
            )
          }

          for (let [globalNewlinesBetween, groupNewlinesBetween] of [
            ['ignore', 'never'] as const,
            ['never', 'ignore'] as const,
          ]) {
            ruleTester.run(
              `${ruleName}(${type}): does not enforce a newline if the global option is "${globalNewlinesBetween}" and the group option is "${groupNewlinesBetween}"`,
              rule,
              {
                valid: [
                  {
                    options: [
                      {
                        ...options,
                        customGroups: [
                          { elementNamePattern: 'a', groupName: 'a' },
                          { elementNamePattern: 'b', groupName: 'b' },
                          { groupName: 'unusedGroup', elementNamePattern: 'X' },
                        ],
                        groups: [
                          'a',
                          'unusedGroup',
                          { newlinesBetween: groupNewlinesBetween },
                          'b',
                        ],
                        newlinesBetween: globalNewlinesBetween,
                      },
                    ],
                    code: dedent`
                      import {
                        a,

                        b,
                      } from 'module'
                    `,
                  },
                  {
                    options: [
                      {
                        ...options,
                        customGroups: [
                          { elementNamePattern: 'a', groupName: 'a' },
                          { elementNamePattern: 'b', groupName: 'b' },
                          { groupName: 'unusedGroup', elementNamePattern: 'X' },
                        ],
                        groups: [
                          'a',
                          'unusedGroup',
                          { newlinesBetween: groupNewlinesBetween },
                          'b',
                        ],
                        newlinesBetween: globalNewlinesBetween,
                      },
                    ],
                    code: dedent`
                      import {
                        a,
                        b,
                      } from 'module'
                    `,
                  },
                ],
                invalid: [],
              },
            )
          }
        })
      })

      ruleTester.run(
        `${ruleName}(${type}): handles newlines and comment after fixes`,
        rule,
        {
          invalid: [
            {
              output: [
                dedent`
                  import {
                    a, // Comment after
                    b,

                    c,
                  } from 'module'
                `,
                dedent`
                  import {
                    a, // Comment after

                    b,
                    c,
                  } from 'module'
                `,
              ],
              options: [
                {
                  customGroups: [
                    {
                      elementNamePattern: 'b|c',
                      groupName: 'b|c',
                    },
                  ],
                  groups: ['unknown', 'b|c'],
                  newlinesBetween: 'always',
                },
              ],
              errors: [
                {
                  data: {
                    rightGroup: 'unknown',
                    leftGroup: 'b|c',
                    right: 'a',
                    left: 'b',
                  },
                  messageId: 'unexpectedNamedImportsGroupOrder',
                },
              ],
              code: dedent`
                import {
                  b,
                  a, // Comment after

                  c,
                } from 'module'
              `,
            },
          ],
          valid: [],
        },
      )
    })
  })

  describe(`${ruleName}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts named imports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'AAA',
                left: 'BB',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import { AAA, BB, C } from 'module'
          `,
          code: dedent`
            import { BB, AAA, C } from 'module'
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            import { AAA, BB, C } from 'module'
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}: sorts named multiline imports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'BBB',
                left: 'CC',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import {
              AAAA,
              BBB,
              CC,
              D,
            } from 'module'
          `,
          code: dedent`
            import {
              AAAA,
              CC,
              BBB,
              D,
            } from 'module'
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}: sorts named imports with aliases`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'X0',
                left: 'X1',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
            {
              data: {
                left: 'X0',
                right: 'C',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import {
              C,
              BB as X0,
              A as X1
            } from 'module'
          `,
          code: dedent`
            import {
              A as X1,
              BB as X0,
              C
            } from 'module'
          `,
          options: [options],
        },
      ],
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
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'A',
                left: 'B',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
            {
              data: {
                right: 'C',
                left: 'D',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import U, {
              aaa as A,
              B,
              cc as C,
              d as D,
            } from 'module'
          `,
          code: dedent`
            import U, {
              B,
              aaa as A,
              d as D,
              cc as C,
            } from 'module'
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}: allows to ignore import aliases`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'c',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import {
              x as a,
              y as b,
              c,
            } from 'module'
          `,
          code: dedent`
            import {
              c,
              x as a,
              y as b,
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
    })

    ruleTester.run(
      `${ruleName}: sorts named imports grouping by their kind`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'BB',
                  left: 'C',
                },
                messageId: 'unexpectedNamedImportsOrder',
              },
            ],
            output: dedent`
              import { AAA, type BB, BB, type C } from 'module'
            `,
            code: dedent`
              import { AAA, type BB, type C, BB } from 'module'
            `,
            options: [{ ...options, groupKind: 'mixed' }],
          },
          {
            errors: [
              {
                data: {
                  right: 'BB',
                  left: 'BB',
                },
                messageId: 'unexpectedNamedImportsOrder',
              },
            ],
            output: dedent`
              import { AAA, BB, type BB, type C } from 'module'
            `,
            code: dedent`
              import { AAA, type BB, BB, type C } from 'module'
            `,
            options: [{ ...options, groupKind: 'values-first' }],
          },
          {
            errors: [
              {
                data: {
                  left: 'AAA',
                  right: 'BB',
                },
                messageId: 'unexpectedNamedImportsOrder',
              },
              {
                data: {
                  left: 'BB',
                  right: 'C',
                },
                messageId: 'unexpectedNamedImportsOrder',
              },
            ],
            output: dedent`
              import { type BB, type C, AAA, BB } from 'module'
            `,
            code: dedent`
              import { AAA, type BB, BB, type C } from 'module'
            `,
            options: [{ ...options, groupKind: 'types-first' }],
          },
        ],
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
      },
    )

    ruleTester.run(`${ruleName}: allows to use original import names`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'A',
                left: 'B',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          options: [
            {
              ...options,
              ignoreAlias: true,
            },
          ],
          output: dedent`
            import { A as B, B as A } from 'module'
          `,
          code: dedent`
            import { B as A, A as B } from 'module'
          `,
        },
      ],
      valid: [
        {
          options: [
            {
              ...options,
              ignoreAlias: true,
            },
          ],
          code: dedent`
            import { A as B, B as A } from 'module'
          `,
        },
      ],
    })
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

    ruleTester.run(`${ruleName}(${type}): sorts named imports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'AAA',
                left: 'BB',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import { AAA, BB, C } from 'module'
          `,
          code: dedent`
            import { BB, AAA, C } from 'module'
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            import { AAA, BB, C } from 'module'
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
      order: 'desc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts named imports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'AAA',
                left: 'BB',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import { AAA, BB, C } from 'module'
          `,
          code: dedent`
            import { BB, AAA, C } from 'module'
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            import { AAA, BB, C } from 'module'
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}: sorts named multiline imports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'BBB',
                left: 'CC',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import {
              AAAA,
              BBB,
              CC,
              D,
            } from 'module'
          `,
          code: dedent`
            import {
              AAAA,
              CC,
              BBB,
              D,
            } from 'module'
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}: sorts named imports with aliases`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'X0',
                left: 'X1',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import {
              BB as X0,
              A as X1,
              C
            } from 'module'
          `,
          code: dedent`
            import {
              A as X1,
              BB as X0,
              C
            } from 'module'
          `,
          options: [options],
        },
      ],
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
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'A',
                left: 'B',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
            {
              data: {
                right: 'C',
                left: 'D',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import U, {
              aaa as A,
              cc as C,
              d as D,
              B,
            } from 'module'
          `,
          code: dedent`
            import U, {
              B,
              aaa as A,
              d as D,
              cc as C,
            } from 'module'
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(
      `${ruleName}: sorts named imports grouping by their kind`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'AAA',
                  right: 'BB',
                },
                messageId: 'unexpectedNamedImportsOrder',
              },
            ],
            output: dedent`
              import { type BB, type C, AAA, BB } from 'module'
            `,
            code: dedent`
              import { AAA, type BB, type C, BB } from 'module'
            `,
            options: [{ ...options, groupKind: 'mixed' }],
          },
          {
            errors: [
              {
                data: {
                  right: 'BB',
                  left: 'BB',
                },
                messageId: 'unexpectedNamedImportsOrder',
              },
            ],
            output: dedent`
              import { AAA, BB, type BB, type C } from 'module'
            `,
            code: dedent`
              import { AAA, type BB, BB, type C } from 'module'
            `,
            options: [{ ...options, groupKind: 'values-first' }],
          },
          {
            errors: [
              {
                data: {
                  left: 'AAA',
                  right: 'BB',
                },
                messageId: 'unexpectedNamedImportsOrder',
              },
              {
                data: {
                  left: 'BB',
                  right: 'C',
                },
                messageId: 'unexpectedNamedImportsOrder',
              },
            ],
            output: dedent`
              import { type BB, type C, AAA, BB } from 'module'
            `,
            code: dedent`
              import { AAA, type BB, BB, type C } from 'module'
            `,
            options: [{ ...options, groupKind: 'types-first' }],
          },
        ],
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
                messageId: 'unexpectedNamedImportsOrder',
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
              import {
                bb,
                c,
                a,
              } from 'module'
            `,
            code: dedent`
              import {
                a,
                bb,
                c,
              } from 'module'
            `,
          },
          {
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedNamedImportsOrder',
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
              import {
                bb,
                a,
                c,
              } from 'module'
            `,
            code: dedent`
              import {
                c,
                bb,
                a,
              } from 'module'
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
            import {
              b,
              c,
              a,
            } from 'module'
          `,
          options: [options],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}(${type}): enforces newlines between`, rule, {
      invalid: [
        {
          options: [
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: 'a',
                  groupName: 'a',
                },
                {
                  elementNamePattern: 'b',
                  groupName: 'b',
                },
              ],
              newlinesBetween: 'always',
              groups: ['b', 'a'],
            },
          ],
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'missedSpacingBetweenNamedImports',
            },
          ],
          output: dedent`
            import {
                b,

                a,
            } from 'module'
          `,
          code: dedent`
            import {
                b,
                a,
            } from 'module'
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
                  right: 'A',
                  left: 'C',
                },
                messageId: 'unexpectedNamedImportsOrder',
              },
            ],
            output: dedent`
              import { A, B, C } from 'module'
            `,
            code: dedent`
              import { B, C, A } from 'module'
            `,
          },
        ],
        valid: [
          "import { A, B, C } from 'module'",
          {
            code: "import { log, log10, log1p, log2 } from 'module'",
            options: [{}],
          },
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
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import {
              b,
              c,
              // eslint-disable-next-line
              a
            } from 'module'
          `,
          code: dedent`
            import {
              c,
              b,
              // eslint-disable-next-line
              a
            } from 'module'
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
              messageId: 'unexpectedNamedImportsOrder',
            },
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import {
              b,
              c,
              // eslint-disable-next-line
              a,
              d
            } from 'module'
          `,
          code: dedent`
            import {
              d,
              c,
              // eslint-disable-next-line
              a,
              b
            } from 'module'
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
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import {
              b,
              c,
              a // eslint-disable-line
            } from 'module'
          `,
          code: dedent`
            import {
              c,
              b,
              a // eslint-disable-line
            } from 'module'
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
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import {
              b,
              c,
              /* eslint-disable-next-line */
              a
            } from 'module'
          `,
          code: dedent`
            import {
              c,
              b,
              /* eslint-disable-next-line */
              a
            } from 'module'
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
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import {
              b,
              c,
              a /* eslint-disable-line */
            } from 'module'
          `,
          code: dedent`
            import {
              c,
              b,
              a /* eslint-disable-line */
            } from 'module'
          `,
          options: [{}],
        },
        {
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
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            import {
              b,
              c,
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              a
            } from 'module'
          `,
          code: dedent`
            import {
              c,
              b,
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              a
            } from 'module'
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedNamedImportsOrder',
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
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import {
              b,
              c,
              a // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            } from 'module'
          `,
          code: dedent`
            import {
              c,
              b,
              a // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            } from 'module'
          `,
          options: [{}],
        },
        {
          output: dedent`
            import {
              b,
              c,
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              a
            } from 'module'
          `,
          code: dedent`
            import {
              c,
              b,
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              a
            } from 'module'
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedNamedImportsOrder',
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
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import {
              b,
              c,
              a /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            } from 'module'
          `,
          code: dedent`
            import {
              c,
              b,
              a /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            } from 'module'
          `,
          options: [{}],
        },
        {
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
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          options: [{}],
        },
      ],
      valid: [
        {
          code: dedent`
            import {
              b,
              c,
              // eslint-disable-next-line
              a
            } from 'module'
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
              import { a, b, c } from './module';
            `,
            options: [{}],
          },
        ],
        invalid: [],
      },
    )
  })
})
