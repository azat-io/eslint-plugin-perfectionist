import type { Rule } from 'eslint'

import { RuleTester } from '@typescript-eslint/rule-tester'
import { RuleTester as EslintRuleTester } from 'eslint'
import { afterAll, describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import rule from '../../rules/sort-named-exports'
import { Alphabet } from '../../utils/alphabet'

let ruleName = 'sort-named-exports'

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

    ruleTester.run(`${ruleName}(${type}): sorts named exports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'bb',
                left: 'c',
              },
              messageId: 'unexpectedNamedExportsOrder',
            },
          ],
          output: dedent`
            export {
              aaa,
              bb,
              c
            }
          `,
          code: dedent`
            export {
              aaa,
              c,
              bb
            }
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: 'export { a }',
          options: [options],
        },
        {
          code: 'export { aaa, bb, c }',
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}: sorts named exports grouping by their kind`,
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
                messageId: 'unexpectedNamedExportsOrder',
              },
            ],
            output: dedent`
              export { AAA, type BB, BB, type C }
            `,
            code: dedent`
              export { AAA, type C, type BB, BB }
            `,
            options: [{ ...options, groupKind: 'mixed' }],
          },
          {
            errors: [
              {
                data: {
                  right: 'AAA',
                  left: 'BB',
                },
                messageId: 'unexpectedNamedExportsOrder',
              },
              {
                data: {
                  right: 'BB',
                  left: 'C',
                },
                messageId: 'unexpectedNamedExportsOrder',
              },
            ],
            output: dedent`
              export { AAA, BB, type BB, type C }
            `,
            code: dedent`
              export { type BB, AAA, type C, BB }
            `,
            options: [{ ...options, groupKind: 'values-first' }],
          },
          {
            errors: [
              {
                data: {
                  left: 'AAA',
                  right: 'C',
                },
                messageId: 'unexpectedNamedExportsOrder',
              },
            ],
            output: dedent`
              export { type BB, type C, AAA, BB }
            `,
            code: dedent`
              export { type BB, AAA, type C, BB }
            `,
            options: [{ ...options, groupKind: 'types-first' }],
          },
        ],
        valid: [
          {
            code: dedent`
              export { AAA, type BB, BB, type C }
            `,
            options: [{ ...options, groupKind: 'mixed' }],
          },
          {
            code: dedent`
              export { AAA, BB, type BB, type C }
            `,
            options: [{ ...options, groupKind: 'values-first' }],
          },
          {
            code: dedent`
              export { type BB, type C, AAA, BB }
            `,
            options: [{ ...options, groupKind: 'types-first' }],
          },
        ],
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
                  right: 'A',
                  left: 'D',
                },
                messageId: 'unexpectedNamedExportsOrder',
              },
              {
                data: {
                  right: 'B',
                  left: 'E',
                },
                messageId: 'unexpectedNamedExportsOrder',
              },
            ],
            output: dedent`
              export {
                A,
                D,

                C,

                B,
                E,
              }
            `,
            code: dedent`
              export {
                D,
                A,

                C,

                E,
                B,
              }
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
                  messageId: 'unexpectedNamedExportsOrder',
                },
                {
                  data: {
                    right: 'FFF',
                    left: 'GG',
                  },
                  messageId: 'unexpectedNamedExportsOrder',
                },
              ],
              output: dedent`
                export {
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
                }
              `,
              code: dedent`
                export {
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
                }
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
                export {
                  // Comment
                  BB,
                  // Other comment
                  A,
                }
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
                export {
                  /* Partition Comment */
                  // Part: A
                  D,
                  // Part: B
                  AAA,
                  BB,
                  C,
                  /* Other */
                  E,
                }
              `,
              code: dedent`
                export {
                  /* Partition Comment */
                  // Part: A
                  D,
                  // Part: B
                  AAA,
                  C,
                  BB,
                  /* Other */
                  E,
                }
              `,
              errors: [
                {
                  data: {
                    right: 'BB',
                    left: 'C',
                  },
                  messageId: 'unexpectedNamedExportsOrder',
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

      ruleTester.run(
        `${ruleName}(${type}): allows to use regex for partition comments`,
        rule,
        {
          valid: [
            {
              code: dedent`
                export {
                  E,
                  F,
                  // I am a partition comment because I don't have f o o
                  A,
                  B,
                }
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
                  messageId: 'unexpectedNamedExportsOrder',
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
                export {
                  /* Comment */
                  A,
                  B,
                }
              `,
              code: dedent`
                export {
                  B,
                  /* Comment */
                  A,
                }
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
                  export {
                    B,
                    // Comment
                    A,
                  }
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
                options: [
                  {
                    ...options,
                    partitionByComment: {
                      line: ['A', 'B'],
                    },
                  },
                ],
                code: dedent`
                  export {
                    C,
                    // B
                    B,
                    // A
                    A,
                  }
                `,
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
                  export {
                    B,
                    // I am a partition comment because I don't have f o o
                    A,
                  }
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
                  messageId: 'unexpectedNamedExportsOrder',
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
                export {
                  // Comment
                  A,
                  B,
                }
              `,
              code: dedent`
                export {
                  B,
                  // Comment
                  A,
                }
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
                  export {
                    B,
                    /* Comment */
                    A,
                  }
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
                options: [
                  {
                    ...options,
                    partitionByComment: {
                      block: ['A', 'B'],
                    },
                  },
                ],
                code: dedent`
                  export {
                    C,
                    /* B */
                    B,
                    /* A */
                    A,
                  }
                `,
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
                      block: ['^(?!.*foo).*$'],
                    },
                  },
                ],
                code: dedent`
                  export {
                    B,
                    /* I am a partition comment because I don't have f o o */
                    A,
                  }
                `,
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
              export { _a, b, _c }
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
              export { ab, a_c }
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
            export { 你好, 世界, a, A, b, B }
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
              messageId: 'unexpectedNamedExportsOrder',
            },
          ],
          output: dedent`
            export { a as "A", b as "B" };
          `,
          code: dedent`
            export { b as "B", a as "A" };
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            export { a as "A", b as "B" };
          `,
          options: [options],
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
                messageId: 'unexpectedNamedExportsOrder',
              },
            ],
            output: dedent`
              export {
                a, b
              }
            `,
            code: dedent`
              export {
                b, a
              }
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
                messageId: 'unexpectedNamedExportsOrder',
              },
            ],
            output: dedent`
              export {
                a, b,
              }
            `,
            code: dedent`
              export {
                b, a,
              }
            `,
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): handles "ignoreAlias" option`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedNamedExportsOrder',
            },
          ],
          options: [
            {
              ...options,
              ignoreAlias: true,
            },
          ],
          output: dedent`
            export {
              a as b,
              b as a,
            }
          `,
          code: dedent`
            export {
              b as a,
              a as b,
            }
          `,
        },
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedNamedExportsOrder',
            },
          ],
          output: dedent`
            export {
              'a' as b,
              'b' as a,
            } from './module'
          `,
          code: dedent`
            export {
              'b' as a,
              'a' as b,
            } from './module'
          `,
          options: [
            {
              ...options,
              ignoreAlias: true,
            },
          ],
        },
      ],
      valid: [],
    })

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
                messageId: 'unexpectedNamedExportsGroupOrder',
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
              export {
                type b,
                a,
              }
            `,
            code: dedent`
              export {
                a,
                type b,
              }
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
                  messageId: 'unexpectedNamedExportsGroupOrder',
                },
              ],
              output: dedent`
                export {
                  type helloType,
                  a,
                  b,
                }
              `,
              code: dedent`
                export {
                  a,
                  b,
                  type helloType,
                }
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
                  messageId: 'unexpectedNamedExportsOrder',
                },
                {
                  data: {
                    right: 'ccc',
                    left: 'bb',
                  },
                  messageId: 'unexpectedNamedExportsOrder',
                },
                {
                  data: {
                    right: 'dddd',
                    left: 'ccc',
                  },
                  messageId: 'unexpectedNamedExportsOrder',
                },
                {
                  data: {
                    rightGroup: 'reversedTypesByLineLength',
                    leftGroup: 'unknown',
                    right: 'eee',
                    left: 'm',
                  },
                  messageId: 'unexpectedNamedExportsGroupOrder',
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
                export {
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
                }
              `,
              code: dedent`
                export {
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
                }
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
                  messageId: 'unexpectedNamedExportsOrder',
                },
              ],
              output: dedent`
                export {
                  fooBar,
                  fooZar,
                }
              `,
              code: dedent`
                export {
                  fooZar,
                  fooBar,
                }
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
                  messageId: 'unexpectedNamedExportsGroupOrder',
                },
              ],
              output: dedent`
                export {
                  type b,
                  type a,
                  type d,
                  type e,
                  type c,
                  m,
                }
              `,
              code: dedent`
                export {
                  type b,
                  type a,
                  type d,
                  type e,
                  m,
                  type c,
                }
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
                messageId: 'unexpectedNamedExportsGroupOrder',
              },
            ],
            output: dedent`
              export {
                type cFoo,
                foo,
                type a,
              }
            `,
            code: dedent`
              export {
                type a,
                type cFoo,
                foo,
              }
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
                export {
                  iHaveFooInMyName,
                  meTooIHaveFoo,
                  a,
                  b,
                }
              `,
            },
          ],
          invalid: [],
        },
      )
    })

    describe(`${ruleName}: newlinesBetween`, () => {
      for (let newlinesBetween of ['never', 0] as const) {
        ruleTester.run(
          `${ruleName}(${type}): removes newlines when "${newlinesBetween}"`,
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
                    messageId: 'extraSpacingBetweenNamedExports',
                  },
                  {
                    data: {
                      right: 'b',
                      left: 'z',
                    },
                    messageId: 'unexpectedNamedExportsOrder',
                  },
                  {
                    data: {
                      right: 'b',
                      left: 'z',
                    },
                    messageId: 'extraSpacingBetweenNamedExports',
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
                    newlinesBetween,
                  },
                ],
                code: dedent`
                  export {
                      a,


                     y,
                    z,

                        b,
                  }
                `,
                output: dedent`
                  export {
                      a,
                     b,
                    y,
                        z,
                  }
                `,
              },
            ],
            valid: [],
          },
        )
      }

      for (let newlinesBetween of ['always', 1] as const) {
        ruleTester.run(
          `${ruleName}(${type}): keeps one newline when "${newlinesBetween}"`,
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
                    groups: ['a', 'b'],
                    newlinesBetween,
                  },
                ],
                errors: [
                  {
                    data: {
                      right: 'b',
                      left: 'a',
                    },
                    messageId: 'missedSpacingBetweenNamedExports',
                  },
                ],
                output: dedent`
                  export {
                    a, 

                  b
                  } from 'module'
                `,
                code: dedent`
                  export {
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
                    messageId: 'extraSpacingBetweenNamedExports',
                  },
                  {
                    data: {
                      right: 'y',
                      left: 'z',
                    },
                    messageId: 'unexpectedNamedExportsOrder',
                  },
                  {
                    data: {
                      right: 'b',
                      left: 'y',
                    },
                    messageId: 'missedSpacingBetweenNamedExports',
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
                    newlinesBetween,
                  },
                ],
                output: dedent`
                  export {
                      a,

                     y,
                    z,

                        b,
                  }
                `,
                code: dedent`
                  export {
                      a,


                     z,
                    y,
                        b,
                  }
                `,
              },
            ],
            valid: [],
          },
        )
      }

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
                    messageId: 'missedSpacingBetweenNamedExports',
                  },
                  {
                    data: {
                      right: 'c',
                      left: 'b',
                    },
                    messageId: 'extraSpacingBetweenNamedExports',
                  },
                  {
                    data: {
                      right: 'd',
                      left: 'c',
                    },
                    messageId: 'extraSpacingBetweenNamedExports',
                  },
                ],
                code: dedent`
                    export {
                    a,
                    b,


                    c,

                    d,


                    e,
                  }
                `,
                output: dedent`
                  export {
                    a,

                    b,

                    c,
                    d,


                    e,
                  }
                `,
              },
            ],
            valid: [],
          },
        )

        describe(`${ruleName}(${type}): "newlinesBetween" between non-consecutive groups`, () => {
          for (let [globalNewlinesBetween, groupNewlinesBetween] of [
            [2, 'never'],
            [2, 0],
            [2, 'ignore'],
            ['never', 2],
            [0, 2],
            ['ignore', 2],
          ] as const) {
            ruleTester.run(
              `${ruleName}(${type}): enforces newlines if the global option is ${globalNewlinesBetween} and the group option is "${groupNewlinesBetween}"`,
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
                        messageId: 'missedSpacingBetweenNamedExports',
                      },
                    ],
                    output: dedent`
                      export {
                        a,


                        b,
                      }
                    `,
                    code: dedent`
                      export {
                        a,
                        b,
                      }
                    `,
                  },
                ],
                valid: [],
              },
            )
          }

          for (let globalNewlinesBetween of [
            'always',
            2,
            'ignore',
            'never',
            0,
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
                        messageId: 'extraSpacingBetweenNamedExports',
                      },
                    ],
                    output: dedent`
                      export {
                        a,
                        b,
                      }
                    `,
                    code: dedent`
                      export {
                        a,

                        b,
                      }
                    `,
                  },
                ],
                valid: [],
              },
            )
          }

          for (let [globalNewlinesBetween, groupNewlinesBetween] of [
            ['ignore', 'never'] as const,
            ['ignore', 0] as const,
            ['never', 'ignore'] as const,
            [0, 'ignore'] as const,
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
                      export {
                        a,

                        b,
                      }
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
                      export {
                        a,
                        b,
                      }
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
                  export {
                    a, // Comment after
                    b,

                    c,
                  }
                `,
                dedent`
                  export {
                    a, // Comment after

                    b,
                    c,
                  }
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
                  messageId: 'unexpectedNamedExportsGroupOrder',
                },
              ],
              code: dedent`
                export {
                  b,
                  a, // Comment after

                  c,
                }
              `,
            },
          ],
          valid: [],
        },
      )

      for (let newlinesBetween of ['never', 0] as const) {
        ruleTester.run(
          `${ruleName}(${type}): ignores newline fixes between different partitions (${newlinesBetween})`,
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
                    ],
                    groups: ['a', 'unknown'],
                    partitionByComment: true,
                    newlinesBetween,
                  },
                ],
                errors: [
                  {
                    data: {
                      right: 'b',
                      left: 'c',
                    },
                    messageId: 'unexpectedNamedExportsOrder',
                  },
                ],
                output: dedent`
                  export {
                    a,

                    // Partition comment

                    b,
                    c,
                  } from 'module'
                `,
                code: dedent`
                  export {
                    a,

                    // Partition comment

                    c,
                    b,
                  } from 'module'
                `,
              },
            ],
            valid: [],
          },
        )
      }
    })
  })

  describe(`${ruleName}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts named exports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'bb',
                left: 'c',
              },
              messageId: 'unexpectedNamedExportsOrder',
            },
          ],
          output: dedent`
            export {
              aaa,
              bb,
              c
            }
          `,
          code: dedent`
            export {
              aaa,
              c,
              bb
            }
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: 'export { aaa, bb, c }',
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}: sorts named exports grouping by their kind`,
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
                messageId: 'unexpectedNamedExportsOrder',
              },
            ],
            output: dedent`
              export { AAA, type BB, BB, type C }
            `,
            code: dedent`
              export { AAA, type C, type BB, BB }
            `,
            options: [{ ...options, groupKind: 'mixed' }],
          },
          {
            errors: [
              {
                data: {
                  right: 'AAA',
                  left: 'BB',
                },
                messageId: 'unexpectedNamedExportsOrder',
              },
              {
                data: {
                  right: 'BB',
                  left: 'C',
                },
                messageId: 'unexpectedNamedExportsOrder',
              },
            ],
            output: dedent`
              export { AAA, BB, type BB, type C }
            `,
            code: dedent`
              export { type BB, AAA, type C, BB }
            `,
            options: [{ ...options, groupKind: 'values-first' }],
          },
          {
            errors: [
              {
                data: {
                  left: 'AAA',
                  right: 'C',
                },
                messageId: 'unexpectedNamedExportsOrder',
              },
            ],
            output: dedent`
              export { type BB, type C, AAA, BB }
            `,
            code: dedent`
              export { type BB, AAA, type C, BB }
            `,
            options: [{ ...options, groupKind: 'types-first' }],
          },
        ],
        valid: [
          {
            code: dedent`
              export { AAA, type BB, BB, type C }
            `,
            options: [{ ...options, groupKind: 'mixed' }],
          },
          {
            code: dedent`
              export { AAA, BB, type BB, type C }
            `,
            options: [{ ...options, groupKind: 'values-first' }],
          },
          {
            code: dedent`
              export { type BB, type C, AAA, BB }
            `,
            options: [{ ...options, groupKind: 'types-first' }],
          },
        ],
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

    ruleTester.run(`${ruleName}(${type}): sorts named exports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'bb',
                left: 'c',
              },
              messageId: 'unexpectedNamedExportsOrder',
            },
          ],
          output: dedent`
            export {
              aaa,
              bb,
              c
            }
          `,
          code: dedent`
            export {
              aaa,
              c,
              bb
            }
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: 'export { a }',
          options: [options],
        },
        {
          code: 'export { aaa, bb, c }',
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

    ruleTester.run(`${ruleName}(${type}): sorts named exports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'bb',
                left: 'c',
              },
              messageId: 'unexpectedNamedExportsOrder',
            },
          ],
          output: dedent`
            export {
              aaa,
              bb,
              c
            }
          `,
          code: dedent`
            export {
              aaa,
              c,
              bb
            }
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: 'export { aaa, bb, c }',
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}: sorts named exports grouping by their kind`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'AAA',
                  right: 'C',
                },
                messageId: 'unexpectedNamedExportsOrder',
              },
              {
                data: {
                  right: 'BB',
                  left: 'C',
                },
                messageId: 'unexpectedNamedExportsOrder',
              },
            ],
            output: dedent`
              export { type BB, type C, AAA, BB }
            `,
            code: dedent`
              export { AAA, type C, type BB, BB }
            `,
            options: [{ ...options, groupKind: 'mixed' }],
          },
          {
            errors: [
              {
                data: {
                  right: 'AAA',
                  left: 'BB',
                },
                messageId: 'unexpectedNamedExportsOrder',
              },
              {
                data: {
                  right: 'BB',
                  left: 'C',
                },
                messageId: 'unexpectedNamedExportsOrder',
              },
            ],
            output: dedent`
              export { AAA, BB, type BB, type C }
            `,
            code: dedent`
              export { type BB, AAA, type C, BB }
            `,
            options: [{ ...options, groupKind: 'values-first' }],
          },
          {
            errors: [
              {
                data: {
                  left: 'AAA',
                  right: 'C',
                },
                messageId: 'unexpectedNamedExportsOrder',
              },
            ],
            output: dedent`
              export { type BB, type C, AAA, BB }
            `,
            code: dedent`
              export { type BB, AAA, type C, BB }
            `,
            options: [{ ...options, groupKind: 'types-first' }],
          },
        ],
        valid: [
          {
            code: dedent`
              export { type BB, type C, AAA, BB }
            `,
            options: [{ ...options, groupKind: 'mixed' }],
          },
          {
            code: dedent`
              export { AAA, BB, type BB, type C }
            `,
            options: [{ ...options, groupKind: 'values-first' }],
          },
          {
            code: dedent`
              export { type BB, type C, AAA, BB }
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
                messageId: 'unexpectedNamedExportsOrder',
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
              export {
                bb,
                c,
                a,
              }
            `,
            code: dedent`
              export {
                a,
                bb,
                c,
              }
            `,
          },
          {
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedNamedExportsOrder',
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
              export {
                bb,
                a,
                c,
              }
            `,
            code: dedent`
              export {
                c,
                bb,
                a,
              }
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
            export {
              b,
              c,
              a,
            }
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
              messageId: 'missedSpacingBetweenNamedExports',
            },
          ],
          output: dedent`
            export {
                b,

                a,
            }
          `,
          code: dedent`
            export {
                b,
                a,
            }
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
                  left: 'B',
                },
                messageId: 'unexpectedNamedExportsOrder',
              },
            ],
            output: dedent`
              export { A, B }
            `,
            code: dedent`
              export { B, A }
            `,
          },
        ],
        valid: [
          'export { A, B }',
          {
            code: 'export { log, log10, log1p, log2 }',
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
              messageId: 'unexpectedNamedExportsOrder',
            },
          ],
          output: dedent`
            export {
              b,
              c,
              // eslint-disable-next-line
              a
            }
          `,
          code: dedent`
            export {
              c,
              b,
              // eslint-disable-next-line
              a
            }
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
              messageId: 'unexpectedNamedExportsOrder',
            },
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedNamedExportsOrder',
            },
          ],
          output: dedent`
            export {
              b,
              c,
              // eslint-disable-next-line
              a,
              d
            }
          `,
          code: dedent`
            export {
              d,
              c,
              // eslint-disable-next-line
              a,
              b
            }
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
              messageId: 'unexpectedNamedExportsOrder',
            },
          ],
          output: dedent`
            export {
              b,
              c,
              a // eslint-disable-line
            }
          `,
          code: dedent`
            export {
              c,
              b,
              a // eslint-disable-line
            }
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
              messageId: 'unexpectedNamedExportsOrder',
            },
          ],
          output: dedent`
            export {
              b,
              c,
              /* eslint-disable-next-line */
              a
            }
          `,
          code: dedent`
            export {
              c,
              b,
              /* eslint-disable-next-line */
              a
            }
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
              messageId: 'unexpectedNamedExportsOrder',
            },
          ],
          output: dedent`
            export {
              b,
              c,
              a /* eslint-disable-line */
            }
          `,
          code: dedent`
            export {
              c,
              b,
              a /* eslint-disable-line */
            }
          `,
          options: [{}],
        },
        {
          output: dedent`
            export {
              a,
              d,
              /* eslint-disable */
              c,
              b,
              // Shouldn't move
              /* eslint-enable */
              e,
            }
          `,
          code: dedent`
            export {
              d,
              e,
              /* eslint-disable */
              c,
              b,
              // Shouldn't move
              /* eslint-enable */
              a,
            }
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedNamedExportsOrder',
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
              messageId: 'unexpectedNamedExportsOrder',
            },
          ],
          output: dedent`
            export {
              b,
              c,
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              a
            }
          `,
          code: dedent`
            export {
              c,
              b,
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              a
            }
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
              messageId: 'unexpectedNamedExportsOrder',
            },
          ],
          output: dedent`
            export {
              b,
              c,
              a // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            }
          `,
          code: dedent`
            export {
              c,
              b,
              a // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            }
          `,
          options: [{}],
        },
        {
          output: dedent`
            export {
              b,
              c,
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              a
            }
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedNamedExportsOrder',
            },
          ],
          code: dedent`
            export {
              c,
              b,
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              a
            }
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
              messageId: 'unexpectedNamedExportsOrder',
            },
          ],
          output: dedent`
            export {
              b,
              c,
              a /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            }
          `,
          code: dedent`
            export {
              c,
              b,
              a /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            }
          `,
          options: [{}],
        },
        {
          output: dedent`
            export {
              a,
              d,
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              c,
              b,
              // Shouldn't move
              /* eslint-enable */
              e,
            }
          `,
          code: dedent`
            export {
              d,
              e,
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              c,
              b,
              // Shouldn't move
              /* eslint-enable */
              a,
            }
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedNamedExportsOrder',
            },
          ],
          options: [{}],
        },
      ],
      valid: [
        {
          code: dedent`
            export {
              b,
              c,
              // eslint-disable-next-line
              a
            }
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
              export { a, b, c } from './module';
            `,
            options: [{}],
          },
        ],
        invalid: [],
      },
    )
  })
})
