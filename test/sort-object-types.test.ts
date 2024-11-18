import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule from '../rules/sort-object-types'

let ruleName = 'sort-object-types'

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

    ruleTester.run(`${ruleName}(${type}): sorts type members`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          output: dedent`
            type Type = {
              a: 'aaa'
              b: 'bb'
              c: 'c'
            }
          `,
          code: dedent`
            type Type = {
              a: 'aaa'
              c: 'c'
              b: 'bb'
            }
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            type Type = {
              a: 'aaa'
              b: 'bb'
              c: 'c'
            }
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts type members in function args`,
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
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              let Func = (arguments: {
                a: 'aaa'
                b: 'bb'
                c: 'c'
              }) => {
                // ...
              }
            `,
            code: dedent`
              let Func = (arguments: {
                b: 'bb'
                a: 'aaa'
                c: 'c'
              }) => {
                // ...
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              let Func = (arguments: {
                a: 'aaa'
                b: 'bb'
                c: 'c'
              }) => {
                // ...
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts type members with computed keys`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: '[key: string]',
                  left: 'a',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  left: 'value',
                  right: 'c',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                [key: string]: string
                a?: 'aaa'
                b: 'bb'
                c: 'c'
                [value]: string
              }
            `,
            code: dedent`
              type Type = {
                a?: 'aaa'
                [key: string]: string
                b: 'bb'
                [value]: string
                c: 'c'
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              type Type = {
                [key: string]: string
                a?: 'aaa'
                b: 'bb'
                c: 'c'
                [value]: string
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts type members with any key types`,
      rule,
      {
        invalid: [
          {
            output: dedent`
              type Type = {
                [...values]
                [[data]]: string
                [name in v]?
                [8]: Value
                arrowFunc?: () => void
                func(): void
              }
            `,
            code: dedent`
              type Type = {
                [...values]
                [[data]]: string
                [name in v]?
                [8]: Value
                func(): void
                arrowFunc?: () => void
              }
            `,
            errors: [
              {
                data: {
                  left: 'func(): void',
                  right: 'arrowFunc',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              type Type = {
                [...values]
                [[data]]: string
                [name in v]?
                [8]: Value
                arrowFunc?: () => void
                func(): void
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts inline type members`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          output: dedent`
            func<{ a: 'aa'; b: 'b'; }>(/* ... */)
          `,
          code: dedent`
            func<{ b: 'b'; a: 'aa' }>(/* ... */)
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            func<{ a: 'aa'; b: 'b' }>(/* ... */)
          `,
          options: [options],
        },
      ],
    })

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
                  rightGroup: 'b',
                  right: 'b',
                  left: 'a',
                },
                messageId: 'unexpectedObjectTypesGroupOrder',
              },
              {
                data: {
                  right: 'e',
                  left: 'f',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: [
              dedent`
                type Type = {
                  b: 'bb'
                  a: 'aaa'
                  c: 'c'
                  d: {
                    e: 'ee'
                    f: 'f'
                  }
                }
              `,
            ],
            code: dedent`
              type Type = {
                a: 'aaa'
                b: 'bb'
                c: 'c'
                d: {
                  f: 'f'
                  e: 'ee'
                }
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  b: 'b',
                },
                groups: ['b', 'unknown', 'multiline'],
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
              type Type = {
                b: 'bb'
                a: 'aaa'
                c: 'c'
                d: {
                  e: 'ee'
                  f: 'f'
                }
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  b: 'b',
                },
                groups: ['b', 'unknown', 'multiline'],
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
              type T = {
                iHaveFooInMyName: string
                meTooIHaveFoo: string
                a: string
                b: string
              }
            `,
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use in class methods`,
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
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              class Class {
                async method (data: {
                  a: 'aaa'
                  b: 'bb'
                  c: 'c'
                }) {}
              }
            `,
            code: dedent`
              class Class {
                async method (data: {
                  b: 'bb'
                  a: 'aaa'
                  c: 'c'
                }) {}
              }
            `,
            options: [options],
          },
        ],
        valid: [],
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
                  right: 'd',
                  left: 'e',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                d: 'dd'
                e: 'e'

                c: 'ccc'

                a: 'aaaaa'
                b: 'bbbb'
              }
            `,
            code: dedent`
              type Type = {
                e: 'e'
                d: 'dd'

                c: 'ccc'

                b: 'bbbb'
                a: 'aaaaa'
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
        valid: [
          {
            code: dedent`
              type Type = {
                d: 'dd'
                e: 'e'

                c: 'ccc'

                a: 'aaaaa'
                b: 'bbbb'
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
                  messageId: 'unexpectedObjectTypesOrder',
                },
                {
                  data: {
                    right: 'fff',
                    left: 'gg',
                  },
                  messageId: 'unexpectedObjectTypesOrder',
                },
              ],
              output: dedent`
              type Type = {
                // Part: A
                // Not partition comment
                bbb: string
                cc: string
                d: string
                // Part: B
                aaaa: string
                e: string
                // Part: C
                // Not partition comment
                fff: string
                'gg': string
              }
            `,
              code: dedent`
              type Type = {
                // Part: A
                cc: string
                d: string
                // Not partition comment
                bbb: string
                // Part: B
                aaaa: string
                e: string
                // Part: C
                'gg': string
                // Not partition comment
                fff: string
              }
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
              type Type = {
                // Comment
                bb: string
                // Other comment
                a: string
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
              type Type = {
                /* Partition Comment */
                // Part: A
                d: string
                // Part: B
                aaa: string
                bb: string
                c: string
                /* Other */
                e: string
              }
            `,
              code: dedent`
              type Type = {
                /* Partition Comment */
                // Part: A
                d: string
                // Part: B
                aaa: string
                c: string
                bb: string
                /* Other */
                e: string
              }
            `,
              errors: [
                {
                  data: {
                    right: 'bb',
                    left: 'c',
                  },
                  messageId: 'unexpectedObjectTypesOrder',
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

      ruleTester.run(
        `${ruleName}(${type}): allows to use regex for partition comments`,
        rule,
        {
          valid: [
            {
              code: dedent`
              type Type = {
                e: string
                f: string
                // I am a partition comment because I don't have f o o
                a: string
                b: string
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
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to sort required values first`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'bbbb',
                  right: 'ccc',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  left: 'dd',
                  right: 'e',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                ccc: string
                e: string
                aaaaa?: string
                bbbb?: string
                dd?: string
              }
            `,
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                ccc: string
                dd?: string
                e: string
              }
            `,
            options: [
              {
                ...options,
                groupKind: 'required-first',
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
              type Type = {
                ccc: string
                e: string
                aaaaa?: string
                bbbb?: string
                dd?: string
              }
            `,
            options: [
              {
                ...options,
                groupKind: 'required-first',
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to sort optional values first`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'ccc',
                  right: 'dd',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                dd?: string
                ccc: string
                e: string
              }
            `,
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                ccc: string
                dd?: string
                e: string
              }
            `,
            options: [
              {
                ...options,
                groupKind: 'optional-first',
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                dd?: string
                ccc: string
                e: string
              }
            `,
            options: [
              {
                ...options,
                groupKind: 'optional-first',
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`
              type Type = {
                _a: string
                b: string
                _c: string
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
              type Type = {
                ab: string
                a_c: string
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
              type Type = {
                你好: string
                世界: string
                a: string
                A: string
                b: string
                B: string
              }
            `,
          options: [{ ...options, locales: 'zh-CN' }],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}(${type}): allows to use method group`, rule, {
      valid: [
        {
          code: dedent`
              type Type = {
                b(): void
                c: () => void
                a: string
                d: string
              }
            `,
          options: [
            {
              ...options,
              groups: ['method', 'unknown'],
            },
          ],
        },
      ],
      invalid: [],
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
                  messageId: 'extraSpacingBetweenObjectTypeMembers',
                },
                {
                  data: {
                    right: 'b',
                    left: 'z',
                  },
                  messageId: 'unexpectedObjectTypesOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'z',
                  },
                  messageId: 'extraSpacingBetweenObjectTypeMembers',
                },
              ],
              code: dedent`
                type Type = {
                  a: () => null,


                 y: "y",
                z: "z",

                    b: "b",
                }
              `,
              output: dedent`
                type Type = {
                  a: () => null,
                 b: "b",
                y: "y",
                    z: "z",
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['method', 'unknown'],
                  newlinesBetween: 'never',
                },
              ],
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
              errors: [
                {
                  data: {
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'extraSpacingBetweenObjectTypeMembers',
                },
                {
                  data: {
                    right: 'y',
                    left: 'z',
                  },
                  messageId: 'unexpectedObjectTypesOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'y',
                  },
                  messageId: 'missedSpacingBetweenObjectTypeMembers',
                },
              ],
              output: dedent`
                type Type = {
                  a: () => null,

                 y: "y",
                z: "z",

                    b: {
                      // Newline stuff
                    },
                }
                `,
              code: dedent`
                type Type = {
                  a: () => null,


                 z: "z",
                y: "y",
                    b: {
                      // Newline stuff
                    },
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['method', 'unknown', 'multiline'],
                  newlinesBetween: 'always',
                },
              ],
            },
          ],
          valid: [],
        },
      )
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
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                a: string; b: string,
              }
            `,
            code: dedent`
              type Type = {
                b: string, a: string
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
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                a: string; b: string,
              }
            `,
            code: dedent`
              type Type = {
                b: string, a: string;
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
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                a: string, b: string,
              }
            `,
            code: dedent`
              type Type = {
                b: string, a: string,
              }
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

    ruleTester.run(`${ruleName}(${type}): sorts type members`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          output: dedent`
            type Type = {
              a: 'aaa'
              b: 'bb'
              c: 'c'
            }
          `,
          code: dedent`
            type Type = {
              a: 'aaa'
              c: 'c'
              b: 'bb'
            }
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            type Type = {
              a: 'aaa'
              b: 'bb'
              c: 'c'
            }
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts type members in function args`,
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
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              let Func = (arguments: {
                a: 'aaa'
                b: 'bb'
                c: 'c'
              }) => {
                // ...
              }
            `,
            code: dedent`
              let Func = (arguments: {
                b: 'bb'
                a: 'aaa'
                c: 'c'
              }) => {
                // ...
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              let Func = (arguments: {
                a: 'aaa'
                b: 'bb'
                c: 'c'
              }) => {
                // ...
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts type members with computed keys`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: '[key: string]',
                  left: 'a',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  left: 'value',
                  right: 'c',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                [key: string]: string
                a?: 'aaa'
                b: 'bb'
                c: 'c'
                [value]: string
              }
            `,
            code: dedent`
              type Type = {
                a?: 'aaa'
                [key: string]: string
                b: 'bb'
                [value]: string
                c: 'c'
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              type Type = {
                [key: string]: string
                a?: 'aaa'
                b: 'bb'
                c: 'c'
                [value]: string
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts type members with any key types`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: '[name in v]?',
                  right: '8',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  left: 'func(): void',
                  right: 'arrowFunc',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                [8]: Value
                [...values]
                [[data]]: string
                [name in v]?
                arrowFunc?: () => void
                func(): void
              }
            `,
            code: dedent`
              type Type = {
                [...values]
                [[data]]: string
                [name in v]?
                [8]: Value
                func(): void
                arrowFunc?: () => void
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              type Type = {
                [8]: Value
                [...values]
                [[data]]: string
                [name in v]?
                arrowFunc?: () => void
                func(): void
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts inline type members`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          output: dedent`
            func<{ a: 'aa'; b: 'b'; }>(/* ... */)
          `,
          code: dedent`
            func<{ b: 'b'; a: 'aa' }>(/* ... */)
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            func<{ a: 'aa'; b: 'b' }>(/* ... */)
          `,
          options: [options],
        },
      ],
    })

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
                  rightGroup: 'b',
                  right: 'b',
                  left: 'a',
                },
                messageId: 'unexpectedObjectTypesGroupOrder',
              },
              {
                data: {
                  right: 'e',
                  left: 'f',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: [
              dedent`
                type Type = {
                  b: 'bb'
                  a: 'aaa'
                  c: 'c'
                  d: {
                    e: 'ee'
                    f: 'f'
                  }
                }
              `,
            ],
            code: dedent`
              type Type = {
                a: 'aaa'
                b: 'bb'
                c: 'c'
                d: {
                  f: 'f'
                  e: 'ee'
                }
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  b: 'b',
                },
                groups: ['b', 'unknown', 'multiline'],
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
              type Type = {
                b: 'bb'
                a: 'aaa'
                c: 'c'
                d: {
                  e: 'ee'
                  f: 'f'
                }
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  b: 'b',
                },
                groups: ['b', 'unknown', 'multiline'],
              },
            ],
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
                  right: 'd',
                  left: 'e',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                d: 'dd'
                e: 'e'

                c: 'ccc'

                a: 'aaaaa'
                b: 'bbbb'
              }
            `,
            code: dedent`
              type Type = {
                e: 'e'
                d: 'dd'

                c: 'ccc'

                b: 'bbbb'
                a: 'aaaaa'
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
        valid: [
          {
            code: dedent`
              type Type = {
                d: 'dd'
                e: 'e'

                c: 'ccc'

                a: 'aaaaa'
                b: 'bbbb'
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
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to sort required values first`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'bbbb',
                  right: 'ccc',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  left: 'dd',
                  right: 'e',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                ccc: string
                e: string
                aaaaa?: string
                bbbb?: string
                dd?: string
              }
            `,
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                ccc: string
                dd?: string
                e: string
              }
            `,
            options: [
              {
                ...options,
                groupKind: 'required-first',
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
              type Type = {
                ccc: string
                e: string
                aaaaa?: string
                bbbb?: string
                dd?: string
              }
            `,
            options: [
              {
                ...options,
                groupKind: 'required-first',
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to sort optional values first`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'ccc',
                  right: 'dd',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                dd?: string
                ccc: string
                e: string
              }
            `,
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                ccc: string
                dd?: string
                e: string
              }
            `,
            options: [
              {
                ...options,
                groupKind: 'optional-first',
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                dd?: string
                ccc: string
                e: string
              }
            `,
            options: [
              {
                ...options,
                groupKind: 'optional-first',
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use method group`, rule, {
      valid: [
        {
          code: dedent`
              type Type = {
                b(): void
                c: () => void
                a: string
                d: string
              }
            `,
          options: [
            {
              ...options,
              groups: ['method', 'unknown'],
            },
          ],
        },
      ],
      invalid: [],
    })
  })

  describe(`${ruleName}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts type members`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          output: dedent`
            type Type = {
              a: 'aaa'
              b: 'bb'
              c: 'c'
            }
          `,
          code: dedent`
            type Type = {
              a: 'aaa'
              c: 'c'
              b: 'bb'
            }
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            type Type = {
              a: 'aaa'
              b: 'bb'
              c: 'c'
            }
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts type members in function args`,
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
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              let Func = (arguments: {
                a: 'aaa'
                b: 'bb'
                c: 'c'
              }) => {
                // ...
              }
            `,
            code: dedent`
              let Func = (arguments: {
                b: 'bb'
                a: 'aaa'
                c: 'c'
              }) => {
                // ...
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              let Func = (arguments: {
                a: 'aaa'
                b: 'bb'
                c: 'c'
              }) => {
                // ...
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts type members with computed keys`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: '[key: string]',
                  left: 'a',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  right: 'value',
                  left: 'b',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                [key: string]: string
                [value]: string
                a?: 'aaa'
                b: 'bb'
                c: 'c'
              }
            `,
            code: dedent`
              type Type = {
                a?: 'aaa'
                [key: string]: string
                b: 'bb'
                [value]: string
                c: 'c'
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              type Type = {
                [key: string]: string
                [value]: string
                a?: 'aaa'
                b: 'bb'
                c: 'c'
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts type members with any key types`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: '[...values]',
                  right: '[[data]]',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  right: 'func(): void',
                  left: '8',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  left: 'func(): void',
                  right: 'arrowFunc',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                arrowFunc?: () => void
                [[data]]: string
                [name in v]?
                func(): void
                [...values]
                [8]: Value
              }
            `,
            code: dedent`
              type Type = {
                [...values]
                [[data]]: string
                [name in v]?
                [8]: Value
                func(): void
                arrowFunc?: () => void
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              type Type = {
                arrowFunc?: () => void
                [[data]]: string
                [name in v]?
                func(): void
                [...values]
                [8]: Value
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts inline type members`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          output: dedent`
            func<{ a: 'aa'; b: 'b'; }>(/* ... */)
          `,
          code: dedent`
            func<{ b: 'b'; a: 'aa' }>(/* ... */)
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            func<{ a: 'aa'; b: 'b' }>(/* ... */)
          `,
          options: [options],
        },
      ],
    })

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
                  rightGroup: 'b',
                  right: 'b',
                  left: 'a',
                },
                messageId: 'unexpectedObjectTypesGroupOrder',
              },
              {
                data: {
                  right: 'e',
                  left: 'f',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: [
              dedent`
                type Type = {
                  b: 'bb'
                  a: 'aaa'
                  c: 'c'
                  d: {
                    e: 'ee'
                    f: 'f'
                  }
                }
              `,
            ],
            code: dedent`
              type Type = {
                a: 'aaa'
                b: 'bb'
                c: 'c'
                d: {
                  f: 'f'
                  e: 'ee'
                }
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  b: 'b',
                },
                groups: ['b', 'unknown', 'multiline'],
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
              type Type = {
                b: 'bb'
                a: 'aaa'
                c: 'c'
                d: {
                  e: 'ee'
                  f: 'f'
                }
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  b: 'b',
                },
                groups: ['b', 'unknown', 'multiline'],
              },
            ],
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
                  right: 'd',
                  left: 'e',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                d: 'dd'
                e: 'e'

                c: 'ccc'

                a: 'aaaaa'
                b: 'bbbb'
              }
            `,
            code: dedent`
              type Type = {
                e: 'e'
                d: 'dd'

                c: 'ccc'

                b: 'bbbb'
                a: 'aaaaa'
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
        valid: [
          {
            code: dedent`
              type Type = {
                d: 'dd'
                e: 'e'

                c: 'ccc'

                a: 'aaaaa'
                b: 'bbbb'
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
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to sort required values first`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'bbbb',
                  right: 'ccc',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
              {
                data: {
                  left: 'dd',
                  right: 'e',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                ccc: string
                e: string
                aaaaa?: string
                bbbb?: string
                dd?: string
              }
            `,
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                ccc: string
                dd?: string
                e: string
              }
            `,
            options: [
              {
                ...options,
                groupKind: 'required-first',
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
              type Type = {
                ccc: string
                e: string
                aaaaa?: string
                bbbb?: string
                dd?: string
              }
            `,
            options: [
              {
                ...options,
                groupKind: 'required-first',
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to sort optional values first`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'ccc',
                  right: 'dd',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
            output: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                dd?: string
                ccc: string
                e: string
              }
            `,
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                ccc: string
                dd?: string
                e: string
              }
            `,
            options: [
              {
                ...options,
                groupKind: 'optional-first',
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                dd?: string
                ccc: string
                e: string
              }
            `,
            options: [
              {
                ...options,
                groupKind: 'optional-first',
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use method group`, rule, {
      valid: [
        {
          code: dedent`
              type Type = {
                c: () => void
                b(): void
                a: string
                d: string
              }
            `,
          options: [
            {
              ...options,
              groups: ['method', 'unknown'],
            },
          ],
        },
      ],
      invalid: [],
    })
  })

  describe(`${ruleName}: validating group configuration`, () => {
    ruleTester.run(
      `${ruleName}: allows predefined groups and defined custom groups`,
      rule,
      {
        valid: [
          {
            options: [
              {
                customGroups: {
                  myCustomGroup: 'x',
                },
                groups: ['multiline', 'method', 'unknown', 'myCustomGroup'],
              },
            ],
            code: dedent`
            type Type = {
              a: 'aaa'
              b: 'bb'
              c: 'c'
            }
          `,
          },
        ],
        invalid: [],
      },
    )
  })

  describe('misc', () => {
    ruleTester.run(`${ruleName}: ignores semi at the end of value`, rule, {
      valid: [
        dedent`
          type Type<T> = T extends {
            (...args: any[]): infer R;
            (...args: any[]): infer R;
            (...args: any[]): infer R;
            (...args: any[]): infer R;
          }
            ? R
            : T extends { (...args: any[]): infer R; (...args: any[]): infer R; (...args: any[]): infer R }
            ? R
            : T extends { (...args: any[]): infer R; (...args: any[]): infer R }
            ? R
            : T extends (...args: any[]) => infer R
            ? R
            : any;
        `,
      ],
      invalid: [],
    })

    ruleTester.run(
      `${ruleName}: sets alphabetical asc sorting as default`,
      rule,
      {
        invalid: [
          {
            output: dedent`
              type Calculator = {
                log: (x: number) => number,
                log10: (x: number) => number,
                log1p: (x: number) => number,
                log2: (x: number) => number,
              }
            `,
            code: dedent`
              type Calculator = {
                log: (x: number) => number,
                log1p: (x: number) => number,
                log2: (x: number) => number,
                log10: (x: number) => number,
              }
            `,
            errors: [
              {
                data: {
                  right: 'log10',
                  left: 'log2',
                },
                messageId: 'unexpectedObjectTypesOrder',
              },
            ],
          },
        ],
        valid: [
          dedent`
            type Calculator = {
              log: (x: number) => number,
              log10: (x: number) => number,
              log1p: (x: number) => number,
              log2: (x: number) => number,
            }
          `,
          {
            code: dedent`
              type Calculator = {
                log: (x: number) => number,
                log10: (x: number) => number,
                log1p: (x: number) => number,
                log2: (x: number) => number,
              }
            `,
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
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          output: dedent`
            type Type = {
              b: string
              c: string
              // eslint-disable-next-line
              a: string
            }
          `,
          code: dedent`
            type Type = {
              c: string
              b: string
              // eslint-disable-next-line
              a: string
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
              messageId: 'unexpectedObjectTypesOrder',
            },
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          output: dedent`
            type Type = {
              b: string
              c: string
              // eslint-disable-next-line
              a: string
              d: string
            }
          `,
          code: dedent`
            type Type = {
              d: string
              c: string
              // eslint-disable-next-line
              a: string
              b: string
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
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          output: dedent`
            type Type = {
              b: string
              c: string
              a: string // eslint-disable-line
            }
          `,
          code: dedent`
            type Type = {
              c: string
              b: string
              a: string // eslint-disable-line
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
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          output: dedent`
            type Type = {
              b: string
              c: string
              /* eslint-disable-next-line */
              a: string
            }
          `,
          code: dedent`
            type Type = {
              c: string
              b: string
              /* eslint-disable-next-line */
              a: string
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
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          output: dedent`
            type Type = {
              b: string
              c: string
              a: string /* eslint-disable-line */
            }
          `,
          code: dedent`
            type Type = {
              c: string
              b: string
              a: string /* eslint-disable-line */
            }
          `,
          options: [{}],
        },
        {
          output: dedent`
            type Type = {
              a: string
              d: string
              /* eslint-disable */
              c: string
              b: string
              // Shouldn't move
              /* eslint-enable */
              e: string
            }
          `,
          code: dedent`
            type Type = {
              d: string
              e: string
              /* eslint-disable */
              c: string
              b: string
              // Shouldn't move
              /* eslint-enable */
              a: string
            }
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            type Type = {
              b: string
              c: string
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              a: string
            }
          `,
          code: dedent`
            type Type = {
              c: string
              b: string
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              a: string
            }
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            type Type = {
              b: string
              c: string
              a: string // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            }
          `,
          code: dedent`
            type Type = {
              c: string
              b: string
              a: string // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            }
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            type Type = {
              b: string
              c: string
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              a: string
            }
          `,
          code: dedent`
            type Type = {
              c: string
              b: string
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              a: string
            }
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            type Type = {
              b: string
              c: string
              a: string /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            }
          `,
          code: dedent`
            type Type = {
              c: string
              b: string
              a: string /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            }
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            type Type = {
              a: string
              d: string
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              c: string
              b: string
              // Shouldn't move
              /* eslint-enable */
              e: string
            }
          `,
          code: dedent`
            type Type = {
              d: string
              e: string
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              c: string
              b: string
              // Shouldn't move
              /* eslint-enable */
              a: string
            }
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedObjectTypesOrder',
            },
          ],
          options: [{}],
        },
      ],
      valid: [],
    })
  })
})
