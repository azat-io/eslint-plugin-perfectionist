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

  let ruleTester = new RuleTester({
    parser: '@typescript-eslint/parser',
  })

  describe(`${ruleName}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    let options = {
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts type members`, rule, {
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
      invalid: [
        {
          code: dedent`
            type Type = {
              a: 'aaa'
              c: 'c'
              b: 'bb'
            }
          `,
          output: dedent`
            type Type = {
              a: 'aaa'
              b: 'bb'
              c: 'c'
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectTypesOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts type members in function args`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              let Func = (arguments: {
                b: 'bb'
                a: 'aaa'
                c: 'c'
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = (arguments: {
                a: 'aaa'
                b: 'bb'
                c: 'c'
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
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
      `${ruleName}(${type}): sorts type members with computed keys`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              type Type = {
                a?: 'aaa'
                [key: string]: string
                b: 'bb'
                [value]: string
                c: 'c'
              }
            `,
            output: dedent`
              type Type = {
                [key: string]: string
                a?: 'aaa'
                b: 'bb'
                c: 'c'
                [value]: string
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'a',
                  right: '[key: string]',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'value',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts type members with any key types`,
      rule,
      {
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
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'func(): void',
                  right: 'arrowFunc',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts inline type members`, rule, {
      valid: [
        {
          code: dedent`
            func<{ a: 'aa'; b: 'b' }>(/* ... */)
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            func<{ b: 'b'; a: 'aa' }>(/* ... */)
          `,
          output: dedent`
            func<{ a: 'aa'; b: 'b' }>(/* ... */)
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectTypesOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
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
                groups: ['b', 'unknown', 'multiline'],
                customGroups: {
                  b: 'b',
                },
              },
            ],
          },
        ],
        invalid: [
          {
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
            output: dedent`
              type Type = {
                b: 'bb'
                a: 'aaa'
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
                groups: ['b', 'unknown', 'multiline'],
                customGroups: {
                  b: 'b',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'a',
                  right: 'b',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'f',
                  right: 'e',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use in class methods`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class Class {
                async method (data: {
                  b: 'bb'
                  a: 'aaa'
                  c: 'c'
                }) {}
              }
            `,
            output: dedent`
              class Class {
                async method (data: {
                  a: 'aaa'
                  b: 'bb'
                  c: 'c'
                }) {}
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
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
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              type Type = {
                e: 'e'
                d: 'dd'

                c: 'ccc'

                b: 'bbbb'
                a: 'aaaaa'
              }
            `,
            output: dedent`
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
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'e',
                  right: 'd',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
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
      `${ruleName}(${type}): allows to sort required values first`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                ccc: string
                dd?: string
                e: string
              }
            `,
            output: dedent`
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
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'bbbb',
                  right: 'ccc',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'dd',
                  right: 'e',
                },
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
        invalid: [
          {
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                ccc: string
                dd?: string
                e: string
              }
            `,
            output: dedent`
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
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'ccc',
                  right: 'dd',
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

    ruleTester.run(`${ruleName}(${type}): sorts type members`, rule, {
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
      invalid: [
        {
          code: dedent`
            type Type = {
              a: 'aaa'
              c: 'c'
              b: 'bb'
            }
          `,
          output: dedent`
            type Type = {
              a: 'aaa'
              b: 'bb'
              c: 'c'
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectTypesOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts type members in function args`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              let Func = (arguments: {
                b: 'bb'
                a: 'aaa'
                c: 'c'
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = (arguments: {
                a: 'aaa'
                b: 'bb'
                c: 'c'
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
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
      `${ruleName}(${type}): sorts type members with computed keys`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              type Type = {
                a?: 'aaa'
                [key: string]: string
                b: 'bb'
                [value]: string
                c: 'c'
              }
            `,
            output: dedent`
              type Type = {
                [key: string]: string
                a?: 'aaa'
                b: 'bb'
                c: 'c'
                [value]: string
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'a',
                  right: '[key: string]',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'value',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts type members with any key types`,
      rule,
      {
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
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'func(): void',
                  right: 'arrowFunc',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts inline type members`, rule, {
      valid: [
        {
          code: dedent`
            func<{ a: 'aa'; b: 'b' }>(/* ... */)
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            func<{ b: 'b'; a: 'aa' }>(/* ... */)
          `,
          output: dedent`
            func<{ a: 'aa'; b: 'b' }>(/* ... */)
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectTypesOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
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
                groups: ['b', 'unknown', 'multiline'],
                customGroups: {
                  b: 'b',
                },
              },
            ],
          },
        ],
        invalid: [
          {
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
            output: dedent`
              type Type = {
                b: 'bb'
                a: 'aaa'
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
                groups: ['b', 'unknown', 'multiline'],
                customGroups: {
                  b: 'b',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'a',
                  right: 'b',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'f',
                  right: 'e',
                },
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
        invalid: [
          {
            code: dedent`
              type Type = {
                e: 'e'
                d: 'dd'

                c: 'ccc'

                b: 'bbbb'
                a: 'aaaaa'
              }
            `,
            output: dedent`
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
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'e',
                  right: 'd',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
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
      `${ruleName}(${type}): allows to sort required values first`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                ccc: string
                dd?: string
                e: string
              }
            `,
            output: dedent`
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
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'bbbb',
                  right: 'ccc',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'dd',
                  right: 'e',
                },
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
        invalid: [
          {
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                ccc: string
                dd?: string
                e: string
              }
            `,
            output: dedent`
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
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'ccc',
                  right: 'dd',
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

    ruleTester.run(`${ruleName}(${type}): sorts type members`, rule, {
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
      invalid: [
        {
          code: dedent`
            type Type = {
              a: 'aaa'
              c: 'c'
              b: 'bb'
            }
          `,
          output: dedent`
            type Type = {
              a: 'aaa'
              b: 'bb'
              c: 'c'
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectTypesOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts type members in function args`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              let Func = (arguments: {
                b: 'bb'
                a: 'aaa'
                c: 'c'
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = (arguments: {
                a: 'aaa'
                b: 'bb'
                c: 'c'
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
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
      `${ruleName}(${type}): sorts type members with computed keys`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              type Type = {
                a?: 'aaa'
                [key: string]: string
                b: 'bb'
                [value]: string
                c: 'c'
              }
            `,
            output: dedent`
              type Type = {
                [key: string]: string
                [value]: string
                a?: 'aaa'
                b: 'bb'
                c: 'c'
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'a',
                  right: '[key: string]',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'b',
                  right: 'value',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts type members with any key types`,
      rule,
      {
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
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: '[...values]',
                  right: '[[data]]',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: '8',
                  right: 'func(): void',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'func(): void',
                  right: 'arrowFunc',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts inline type members`, rule, {
      valid: [
        {
          code: dedent`
            func<{ a: 'aa'; b: 'b' }>(/* ... */)
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            func<{ b: 'b'; a: 'aa' }>(/* ... */)
          `,
          output: dedent`
            func<{ a: 'aa'; b: 'b' }>(/* ... */)
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectTypesOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
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
                groups: ['b', 'unknown', 'multiline'],
                customGroups: {
                  b: 'b',
                },
              },
            ],
          },
        ],
        invalid: [
          {
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
            output: dedent`
              type Type = {
                b: 'bb'
                a: 'aaa'
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
                groups: ['b', 'unknown', 'multiline'],
                customGroups: {
                  b: 'b',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'a',
                  right: 'b',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'f',
                  right: 'e',
                },
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
        invalid: [
          {
            code: dedent`
              type Type = {
                e: 'e'
                d: 'dd'

                c: 'ccc'

                b: 'bbbb'
                a: 'aaaaa'
              }
            `,
            output: dedent`
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
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'e',
                  right: 'd',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
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
      `${ruleName}(${type}): allows to sort required values first`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                ccc: string
                dd?: string
                e: string
              }
            `,
            output: dedent`
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
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'bbbb',
                  right: 'ccc',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'dd',
                  right: 'e',
                },
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
        invalid: [
          {
            code: dedent`
              type Type = {
                aaaaa?: string
                bbbb?: string
                ccc: string
                dd?: string
                e: string
              }
            `,
            output: dedent`
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
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'ccc',
                  right: 'dd',
                },
              },
            ],
          },
        ],
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
        invalid: [
          {
            code: dedent`
              type Calculator = {
                log: (x: number) => number,
                log1p: (x: number) => number,
                log2: (x: number) => number,
                log10: (x: number) => number,
              }
            `,
            output: dedent`
              type Calculator = {
                log: (x: number) => number,
                log10: (x: number) => number,
                log1p: (x: number) => number,
                log2: (x: number) => number,
              }
            `,
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'log2',
                  right: 'log10',
                },
              },
            ],
          },
        ],
      },
    )
  })
})
