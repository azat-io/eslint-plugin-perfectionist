import type { TestCaseError } from '@typescript-eslint/rule-tester'

import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule from '../rules/sort-decorators'

let ruleName = 'sort-decorators'

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

    ruleTester.run(`${ruleName}(${type}): sorts decorators`, rule, {
      valid: [
        {
          code: dedent`
            @A
            class Class {

              @A
              property

              @A
              accessor field

              @A
              method(
                @A
                parameter) {}

            }
          `,
          options: [options],
        },
        {
          code: dedent`
            @A
            @B()
            @C
            class Class {

              @A @B() C
              property

              @A @B() C
              accessor field

              @A @B() C
              method(
                @A @B() @C
                parameter) {}

            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            @A @C @B()
            class Class {

              @A @C @B()
              property

              @A @C @B()
              accessor field

              @A @C @B()
              method(
                @A
                @C
                @B()
                parameter) {}

            }
          `,
          output: dedent`
            @A @B() @C
            class Class {

              @A @B() @C
              property

              @A @B() @C
              accessor field

              @A @B() @C
              method(
                @A
                @B()
                @C
                parameter) {}

            }
          `,
          options: [options],
          errors: duplicate5Times([
            {
              messageId: 'unexpectedDecoratorsOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ]),
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): does not break decorator docs`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              /**
               * Comment B
               */
              @B
              /**
               * Comment A
               */
              @A
              // Comment D
              @D
              /* Comment C */
              @C
              class Class {

                /**
                 * Comment B
                 */
                @B
                /**
                 * Comment A
                 */
                @A
                // Comment D
                @D
                /* Comment C */
                @C
                property

                /**
                 * Comment B
                 */
                @B
                /**
                 * Comment A
                 */
                @A
                // Comment D
                @D
                /* Comment C */
                @C
                accessor field

                /**
                 * Comment B
                 */
                @B
                /**
                 * Comment A
                 */
                @A
                // Comment D
                @D
                /* Comment C */
                @C
                method(
                  /**
                   * Comment B
                   */
                  @B
                  /**
                   * Comment A
                   */
                  @A
                  // Comment D
                  @D
                  /* Comment C */
                  @C
                  parameter) {}

              }
            `,
            output: dedent`
              /**
               * Comment A
               */
              @A
              /**
               * Comment B
               */
              @B
              /* Comment C */
              @C
              // Comment D
              @D
              class Class {

                /**
                 * Comment A
                 */
                @A
                /**
                 * Comment B
                 */
                @B
                /* Comment C */
                @C
                // Comment D
                @D
                property

                /**
                 * Comment A
                 */
                @A
                /**
                 * Comment B
                 */
                @B
                /* Comment C */
                @C
                // Comment D
                @D
                accessor field

                /**
                 * Comment A
                 */
                @A
                /**
                 * Comment B
                 */
                @B
                /* Comment C */
                @C
                // Comment D
                @D
                method(
                  /**
                   * Comment A
                   */
                  @A
                  /**
                   * Comment B
                   */
                  @B
                  /* Comment C */
                  @C
                  // Comment D
                  @D
                  parameter) {}

              }
            `,
            options: [options],
            errors: duplicate5Times([
              {
                messageId: 'unexpectedDecoratorsOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
              {
                messageId: 'unexpectedDecoratorsOrder',
                data: {
                  left: 'D',
                  right: 'C',
                },
              },
            ]),
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts decorators with comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              @B // Comment B
              @A // Comment A
              class Class {

                @B // Comment B
                @A // Comment A
                property

                @B // Comment B
                @A // Comment A
                accessor field

                @B // Comment B
                @A // Comment A
                method(
                  @B // Comment B
                  @A // Comment A
                  parameter) {}

              }
            `,
            output: dedent`
              @A // Comment A
              @B // Comment B
              class Class {

                @A // Comment A
                @B // Comment B
                property

                @A // Comment A
                @B // Comment B
                accessor field

                @A // Comment A
                @B // Comment B
                method(
                  @A // Comment A
                  @B // Comment B
                  parameter) {}

              }
            `,
            options: [options],
            errors: duplicate5Times([
              {
                messageId: 'unexpectedDecoratorsOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
            ]),
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              @NoPublicAttributeError
              @Validated
              @AtLeastOneAttributeError
              class Class {

                @NoPublicAttributeError
                @Validated
                @AtLeastOneAttributeError
                property

                @NoPublicAttributeError
                @Validated
                @AtLeastOneAttributeError
                accessor field

                @NoPublicAttributeError
                @Validated
                @AtLeastOneAttributeError
                method(
                  @NoPublicAttributeError
                  @Validated
                  @AtLeastOneAttributeError
                  parameter) {}

              }
            `,
            output: dedent`
              @Validated
              @AtLeastOneAttributeError
              @NoPublicAttributeError
              class Class {

                @Validated
                @AtLeastOneAttributeError
                @NoPublicAttributeError
                property

                @Validated
                @AtLeastOneAttributeError
                @NoPublicAttributeError
                accessor field

                @Validated
                @AtLeastOneAttributeError
                @NoPublicAttributeError
                method(
                  @Validated
                  @AtLeastOneAttributeError
                  @NoPublicAttributeError
                  parameter) {}

              }
            `,
            options: [
              {
                ...options,
                groups: ['unknown', 'error'],
                customGroups: {
                  error: 'Error$',
                },
              },
            ],
            errors: duplicate5Times([
              {
                messageId: 'unexpectedDecoratorsGroupOrder',
                data: {
                  left: 'NoPublicAttributeError',
                  leftGroup: 'error',
                  right: 'Validated',
                  rightGroup: 'unknown',
                },
              },
            ]),
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
              @IHaveFooInMyName
              @MeTooIHaveFoo
              @A
              @B
              class Class {

                @IHaveFooInMyName
                @MeTooIHaveFoo
                @A
                @B
                property

                @IHaveFooInMyName
                @MeTooIHaveFoo
                @A
                @B
                accessor field

                @IHaveFooInMyName
                @MeTooIHaveFoo
                @A
                @B
                method(
                  @IHaveFooInMyName
                  @MeTooIHaveFoo
                  @A
                  @B
                  parameter) {}

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
      `${ruleName}(${type}): allows to use partition comments`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              // Part: A
              @Cc
              @D
              // Not partition comment
              @Bbb
              // Part: B
              @Aaaa
              @E
              // Part: C
              @Gg()
              // Not partition comment
              @Fff
              class Class {

                // Part: A
                @Cc
                @D
                // Not partition comment
                @Bbb
                // Part: B
                @Aaaa
                @E
                // Part: C
                @Gg()
                // Not partition comment
                @Fff
                property

                // Part: A
                @Cc
                @D
                // Not partition comment
                @Bbb
                // Part: B
                @Aaaa
                @E
                // Part: C
                @Gg()
                // Not partition comment
                @Fff
                accessor field

                // Part: A
                @Cc
                @D
                // Not partition comment
                @Bbb
                // Part: B
                @Aaaa
                @E
                // Part: C
                @Gg()
                // Not partition comment
                @Fff
                method(
                  // Part: A
                  @Cc
                  @D
                  // Not partition comment
                  @Bbb
                  // Part: B
                  @Aaaa
                  @E
                  // Part: C
                  @Gg()
                  // Not partition comment
                  @Fff
                  parameter) {}

              }
            `,
            output: dedent`
              // Part: A
              // Not partition comment
              @Bbb
              @Cc
              @D
              // Part: B
              @Aaaa
              @E
              // Part: C
              // Not partition comment
              @Fff
              @Gg()
              class Class {

                // Part: A
                // Not partition comment
                @Bbb
                @Cc
                @D
                // Part: B
                @Aaaa
                @E
                // Part: C
                // Not partition comment
                @Fff
                @Gg()
                property

                // Part: A
                // Not partition comment
                @Bbb
                @Cc
                @D
                // Part: B
                @Aaaa
                @E
                // Part: C
                // Not partition comment
                @Fff
                @Gg()
                accessor field

                // Part: A
                // Not partition comment
                @Bbb
                @Cc
                @D
                // Part: B
                @Aaaa
                @E
                // Part: C
                // Not partition comment
                @Fff
                @Gg()
                method(
                  // Part: A
                  // Not partition comment
                  @Bbb
                  @Cc
                  @D
                  // Part: B
                  @Aaaa
                  @E
                  // Part: C
                  // Not partition comment
                  @Fff
                  @Gg()
                  parameter) {}

              }
            `,
            options: [
              {
                ...options,
                partitionByComment: '^Part*',
              },
            ],
            errors: duplicate5Times([
              {
                messageId: 'unexpectedDecoratorsOrder',
                data: {
                  left: 'D',
                  right: 'Bbb',
                },
              },
              {
                messageId: 'unexpectedDecoratorsOrder',
                data: {
                  left: 'Gg',
                  right: 'Fff',
                },
              },
            ]),
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
              // Comment
              @bb
              // Other comment
              @a
              class Class {

                // Comment
                @bb
                // Other comment
                @a
                property

                // Comment
                @bb
                // Other comment
                @a
                accessor field

                // Comment
                @bb
                // Other comment
                @a
                method(
                  // Comment
                  @bb
                  // Other comment
                  @a
                  parameter) {}

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
        valid: [],
        invalid: [
          {
            code: dedent`
              /* Partition Comment */
              // Part: A
              @D
              // Part: B
              @Aaa
              @C
              @Bb
              /* Other */
              @E
              class Class {

                /* Partition Comment */
                // Part: A
                @D
                // Part: B
                @Aaa
                @C
                @Bb
                /* Other */
                @E
                property

                /* Partition Comment */
                // Part: A
                @D
                // Part: B
                @Aaa
                @C
                @Bb
                /* Other */
                @E
                accessor field

                /* Partition Comment */
                // Part: A
                @D
                // Part: B
                @Aaa
                @C
                @Bb
                /* Other */
                @E
                method(
                  /* Partition Comment */
                  // Part: A
                  @D
                  // Part: B
                  @Aaa
                  @C
                  @Bb
                  /* Other */
                  @E
                  parameter) {}

              }
            `,
            output: dedent`
              /* Partition Comment */
              // Part: A
              @D
              // Part: B
              @Aaa
              @Bb
              @C
              /* Other */
              @E
              class Class {

                /* Partition Comment */
                // Part: A
                @D
                // Part: B
                @Aaa
                @Bb
                @C
                /* Other */
                @E
                property

                /* Partition Comment */
                // Part: A
                @D
                // Part: B
                @Aaa
                @Bb
                @C
                /* Other */
                @E
                accessor field

                /* Partition Comment */
                // Part: A
                @D
                // Part: B
                @Aaa
                @Bb
                @C
                /* Other */
                @E
                method(
                  /* Partition Comment */
                  // Part: A
                  @D
                  // Part: B
                  @Aaa
                  @Bb
                  @C
                  /* Other */
                  @E
                  parameter) {}

              }
            `,
            options: [
              {
                ...options,
                partitionByComment: ['Partition Comment', 'Part: *', 'Other'],
              },
            ],
            errors: duplicate5Times([
              {
                messageId: 'unexpectedDecoratorsOrder',
                data: {
                  left: 'C',
                  right: 'Bb',
                },
              },
            ]),
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex for partition comments`,
      rule,
      {
        valid: [
          {
            code: dedent`
              @E
              @F
              // I am a partition comment because I don't have f o o
              @A
              @B
              class Class {

                @E
                @F
                // I am a partition comment because I don't have f o o
                @A
                @B
                property

                @E
                @F
                // I am a partition comment because I don't have f o o
                @A
                @B
                accessor field

                @E
                @F
                // I am a partition comment because I don't have f o o
                @A
                @B
                method(
                  @E
                  @F
                  // I am a partition comment because I don't have f o o
                  @A
                  @B
                  parameter) {}

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

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`

              @_A
              @B
              @_C
              class Class {

                @_A
                @B
                @_C
                property

                @_A
                @B
                @_C
                accessor field

                @_A
                @B
                @_C
                method(
                  @_A
                  @B
                  @_C
                  parameter) {}

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

              @AB
              @A_C
              class Class {

                @AB
                @A_C
                property

                @AB
                @A_C
                accessor field

                @AB
                @A_C
                method(
                  @AB
                  @A_C
                  parameter) {}

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

            @你好
            @世界
            @a
            @A
            @b
            @B
            class Class {

              @你好
              @世界
              @a
              @A
              @b
              @B
              property

              @你好
              @世界
              @a
              @A
              @b
              @B
              accessor field

              @你好
              @世界
              @a
              @A
              @b
              @B
              method(
                @你好
                @世界
                @a
                @A
                @b
                @B
                parameter) {}

            }
          `,
          options: [{ ...options, locales: 'zh-CN' }],
        },
      ],
      invalid: [],
    })
  })

  describe(`${ruleName}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      type: 'natural',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts decorators`, rule, {
      valid: [
        {
          code: dedent`
            @A
            class Class {

              @A
              property

              @A
              accessor field

              @A
              method(
                @A
                parameter) {}

            }
          `,
          options: [options],
        },
        {
          code: dedent`
            @A
            @B()
            @C
            class Class {

              @A @B() C
              property

              @A @B() C
              accessor field

              @A @B() C
              method(
                @A @B() @C
                parameter) {}

            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            @A @C @B()
            class Class {

              @A @C @B()
              property

              @A @C @B()
              accessor field

              @A @C @B()
              method(
                @A
                @C
                @B()
                parameter) {}

            }
          `,
          output: dedent`
            @A @B() @C
            class Class {

              @A @B() @C
              property

              @A @B() @C
              accessor field

              @A @B() @C
              method(
                @A
                @B()
                @C
                parameter) {}

            }
          `,
          options: [options],
          errors: duplicate5Times([
            {
              messageId: 'unexpectedDecoratorsOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ]),
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): does not break decorator docs`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              /**
               * Comment B
               */
              @B
              /**
               * Comment A
               */
              @A
              // Comment D
              @D
              /* Comment C */
              @C
              class Class {

                /**
                 * Comment B
                 */
                @B
                /**
                 * Comment A
                 */
                @A
                // Comment D
                @D
                /* Comment C */
                @C
                property

                /**
                 * Comment B
                 */
                @B
                /**
                 * Comment A
                 */
                @A
                // Comment D
                @D
                /* Comment C */
                @C
                accessor field

                /**
                 * Comment B
                 */
                @B
                /**
                 * Comment A
                 */
                @A
                // Comment D
                @D
                /* Comment C */
                @C
                method(
                  /**
                   * Comment B
                   */
                  @B
                  /**
                   * Comment A
                   */
                  @A
                  // Comment D
                  @D
                  /* Comment C */
                  @C
                  parameter) {}

              }
            `,
            output: dedent`
              /**
               * Comment A
               */
              @A
              /**
               * Comment B
               */
              @B
              /* Comment C */
              @C
              // Comment D
              @D
              class Class {

                /**
                 * Comment A
                 */
                @A
                /**
                 * Comment B
                 */
                @B
                /* Comment C */
                @C
                // Comment D
                @D
                property

                /**
                 * Comment A
                 */
                @A
                /**
                 * Comment B
                 */
                @B
                /* Comment C */
                @C
                // Comment D
                @D
                accessor field

                /**
                 * Comment A
                 */
                @A
                /**
                 * Comment B
                 */
                @B
                /* Comment C */
                @C
                // Comment D
                @D
                method(
                  /**
                   * Comment A
                   */
                  @A
                  /**
                   * Comment B
                   */
                  @B
                  /* Comment C */
                  @C
                  // Comment D
                  @D
                  parameter) {}

              }
            `,
            options: [options],
            errors: duplicate5Times([
              {
                messageId: 'unexpectedDecoratorsOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
              {
                messageId: 'unexpectedDecoratorsOrder',
                data: {
                  left: 'D',
                  right: 'C',
                },
              },
            ]),
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts decorators with comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              @B // Comment B
              @A // Comment A
              class Class {

                @B // Comment B
                @A // Comment A
                property

                @B // Comment B
                @A // Comment A
                accessor field

                @B // Comment B
                @A // Comment A
                method(
                  @B // Comment B
                  @A // Comment A
                  parameter) {}

              }
            `,
            output: dedent`
              @A // Comment A
              @B // Comment B
              class Class {

                @A // Comment A
                @B // Comment B
                property

                @A // Comment A
                @B // Comment B
                accessor field

                @A // Comment A
                @B // Comment B
                method(
                  @A // Comment A
                  @B // Comment B
                  parameter) {}

              }
            `,
            options: [options],
            errors: duplicate5Times([
              {
                messageId: 'unexpectedDecoratorsOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
            ]),
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              @NoPublicAttributeError
              @Validated
              @AtLeastOneAttributeError
              class Class {

                @NoPublicAttributeError
                @Validated
                @AtLeastOneAttributeError
                property

                @NoPublicAttributeError
                @Validated
                @AtLeastOneAttributeError
                accessor field

                @NoPublicAttributeError
                @Validated
                @AtLeastOneAttributeError
                method(
                  @NoPublicAttributeError
                  @Validated
                  @AtLeastOneAttributeError
                  parameter) {}

              }
            `,
            output: dedent`
              @Validated
              @AtLeastOneAttributeError
              @NoPublicAttributeError
              class Class {

                @Validated
                @AtLeastOneAttributeError
                @NoPublicAttributeError
                property

                @Validated
                @AtLeastOneAttributeError
                @NoPublicAttributeError
                accessor field

                @Validated
                @AtLeastOneAttributeError
                @NoPublicAttributeError
                method(
                  @Validated
                  @AtLeastOneAttributeError
                  @NoPublicAttributeError
                  parameter) {}

              }
            `,
            options: [
              {
                ...options,
                groups: ['unknown', 'error'],
                customGroups: {
                  error: 'Error$',
                },
              },
            ],
            errors: duplicate5Times([
              {
                messageId: 'unexpectedDecoratorsGroupOrder',
                data: {
                  left: 'NoPublicAttributeError',
                  leftGroup: 'error',
                  right: 'Validated',
                  rightGroup: 'unknown',
                },
              },
            ]),
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
              @IHaveFooInMyName
              @MeTooIHaveFoo
              @A
              @B
              class Class {

                @IHaveFooInMyName
                @MeTooIHaveFoo
                @A
                @B
                property

                @IHaveFooInMyName
                @MeTooIHaveFoo
                @A
                @B
                accessor field

                @IHaveFooInMyName
                @MeTooIHaveFoo
                @A
                @B
                method(
                  @IHaveFooInMyName
                  @MeTooIHaveFoo
                  @A
                  @B
                  parameter) {}

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
      `${ruleName}(${type}): allows to use partition comments`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              // Part: A
              @Cc
              @D
              // Not partition comment
              @Bbb
              // Part: B
              @Aaaa
              @E
              // Part: C
              @Gg()
              // Not partition comment
              @Fff
              class Class {

                // Part: A
                @Cc
                @D
                // Not partition comment
                @Bbb
                // Part: B
                @Aaaa
                @E
                // Part: C
                @Gg()
                // Not partition comment
                @Fff
                property

                // Part: A
                @Cc
                @D
                // Not partition comment
                @Bbb
                // Part: B
                @Aaaa
                @E
                // Part: C
                @Gg()
                // Not partition comment
                @Fff
                accessor field

                // Part: A
                @Cc
                @D
                // Not partition comment
                @Bbb
                // Part: B
                @Aaaa
                @E
                // Part: C
                @Gg()
                // Not partition comment
                @Fff
                method(
                  // Part: A
                  @Cc
                  @D
                  // Not partition comment
                  @Bbb
                  // Part: B
                  @Aaaa
                  @E
                  // Part: C
                  @Gg()
                  // Not partition comment
                  @Fff
                  parameter) {}

              }
            `,
            output: dedent`
              // Part: A
              // Not partition comment
              @Bbb
              @Cc
              @D
              // Part: B
              @Aaaa
              @E
              // Part: C
              // Not partition comment
              @Fff
              @Gg()
              class Class {

                // Part: A
                // Not partition comment
                @Bbb
                @Cc
                @D
                // Part: B
                @Aaaa
                @E
                // Part: C
                // Not partition comment
                @Fff
                @Gg()
                property

                // Part: A
                // Not partition comment
                @Bbb
                @Cc
                @D
                // Part: B
                @Aaaa
                @E
                // Part: C
                // Not partition comment
                @Fff
                @Gg()
                accessor field

                // Part: A
                // Not partition comment
                @Bbb
                @Cc
                @D
                // Part: B
                @Aaaa
                @E
                // Part: C
                // Not partition comment
                @Fff
                @Gg()
                method(
                  // Part: A
                  // Not partition comment
                  @Bbb
                  @Cc
                  @D
                  // Part: B
                  @Aaaa
                  @E
                  // Part: C
                  // Not partition comment
                  @Fff
                  @Gg()
                  parameter) {}

              }
            `,
            options: [
              {
                ...options,
                partitionByComment: '^Part*',
              },
            ],
            errors: duplicate5Times([
              {
                messageId: 'unexpectedDecoratorsOrder',
                data: {
                  left: 'D',
                  right: 'Bbb',
                },
              },
              {
                messageId: 'unexpectedDecoratorsOrder',
                data: {
                  left: 'Gg',
                  right: 'Fff',
                },
              },
            ]),
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
              // Comment
              @bb
              // Other comment
              @a
              class Class {

                // Comment
                @bb
                // Other comment
                @a
                property

                // Comment
                @bb
                // Other comment
                @a
                accessor field

                // Comment
                @bb
                // Other comment
                @a
                method(
                  // Comment
                  @bb
                  // Other comment
                  @a
                  parameter) {}

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
        valid: [],
        invalid: [
          {
            code: dedent`
              /* Partition Comment */
              // Part: A
              @D
              // Part: B
              @Aaa
              @C
              @Bb
              /* Other */
              @E
              class Class {

                /* Partition Comment */
                // Part: A
                @D
                // Part: B
                @Aaa
                @C
                @Bb
                /* Other */
                @E
                property

                /* Partition Comment */
                // Part: A
                @D
                // Part: B
                @Aaa
                @C
                @Bb
                /* Other */
                @E
                accessor field

                /* Partition Comment */
                // Part: A
                @D
                // Part: B
                @Aaa
                @C
                @Bb
                /* Other */
                @E
                method(
                  /* Partition Comment */
                  // Part: A
                  @D
                  // Part: B
                  @Aaa
                  @C
                  @Bb
                  /* Other */
                  @E
                  parameter) {}

              }
            `,
            output: dedent`
              /* Partition Comment */
              // Part: A
              @D
              // Part: B
              @Aaa
              @Bb
              @C
              /* Other */
              @E
              class Class {

                /* Partition Comment */
                // Part: A
                @D
                // Part: B
                @Aaa
                @Bb
                @C
                /* Other */
                @E
                property

                /* Partition Comment */
                // Part: A
                @D
                // Part: B
                @Aaa
                @Bb
                @C
                /* Other */
                @E
                accessor field

                /* Partition Comment */
                // Part: A
                @D
                // Part: B
                @Aaa
                @Bb
                @C
                /* Other */
                @E
                method(
                  /* Partition Comment */
                  // Part: A
                  @D
                  // Part: B
                  @Aaa
                  @Bb
                  @C
                  /* Other */
                  @E
                  parameter) {}

              }
            `,
            options: [
              {
                ...options,
                partitionByComment: ['Partition Comment', 'Part: *', 'Other'],
              },
            ],
            errors: duplicate5Times([
              {
                messageId: 'unexpectedDecoratorsOrder',
                data: {
                  left: 'C',
                  right: 'Bb',
                },
              },
            ]),
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex for partition comments`,
      rule,
      {
        valid: [
          {
            code: dedent`
              @E
              @F
              // I am a partition comment because I don't have f o o
              @A
              @B
              class Class {

                @E
                @F
                // I am a partition comment because I don't have f o o
                @A
                @B
                property

                @E
                @F
                // I am a partition comment because I don't have f o o
                @A
                @B
                accessor field

                @E
                @F
                // I am a partition comment because I don't have f o o
                @A
                @B
                method(
                  @E
                  @F
                  // I am a partition comment because I don't have f o o
                  @A
                  @B
                  parameter) {}

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

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`

              @_A
              @B
              @_C
              class Class {

                @_A
                @B
                @_C
                property

                @_A
                @B
                @_C
                accessor field

                @_A
                @B
                @_C
                method(
                  @_A
                  @B
                  @_C
                  parameter) {}

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

              @AB
              @A_C
              class Class {

                @AB
                @A_C
                property

                @AB
                @A_C
                accessor field

                @AB
                @A_C
                method(
                  @AB
                  @A_C
                  parameter) {}

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
    let type = 'line-length'

    let options = {
      type: 'line-length',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts decorators`, rule, {
      valid: [
        {
          code: dedent`
            @A
            class Class {

              @A
              property

              @A
              accessor field

              @A
              method(
                @A
                parameter) {}

            }
          `,
          options: [options],
        },
        {
          code: dedent`
            @A @C @B()
            class Class {

              @A @C @B()
              property

              @A @C @B()
              accessor field

              @A @C @B()
              method(
                @A @C @B()
                parameter) {}

            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            @A @B() @C
            class Class {

              @A @B() @C
              property

              @A @B() @C
              accessor field

              @A @B() @C
              method(
                @A @B() @C
                parameter) {}

            }
          `,
          output: dedent`
            @A @C @B()
            class Class {

              @A @C @B()
              property

              @A @C @B()
              accessor field

              @A @C @B()
              method(
                @A @C @B()
                parameter) {}

            }
          `,
          options: [options],
          errors: duplicate5Times([
            {
              messageId: 'unexpectedDecoratorsOrder',
              data: {
                left: 'B',
                right: 'C',
              },
            },
          ]),
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): does not break decorator docs`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              /**
               * Comment B
               */
              @BB
              /**
               * Comment A
               */
              @A
              // Comment D
              @DDDD
              /* Comment C */
              @CCC
              class Class {

                /**
                 * Comment B
                 */
                @BB
                /**
                 * Comment A
                 */
                @A
                // Comment D
                @DDDD
                /* Comment C */
                @CCC
                property

                /**
                 * Comment B
                 */
                @BB
                /**
                 * Comment A
                 */
                @A
                // Comment D
                @DDDD
                /* Comment C */
                @CCC
                accessor field

                /**
                 * Comment B
                 */
                @BB
                /**
                 * Comment A
                 */
                @A
                // Comment D
                @DDDD
                /* Comment C */
                @CCC
                method(
                  /**
                   * Comment B
                   */
                  @BB
                  /**
                   * Comment A
                   */
                  @A
                  // Comment D
                  @DDDD
                  /* Comment C */
                  @CCC
                  parameter) {}

              }
            `,
            output: dedent`
              /**
               * Comment A
               */
              @A
              /**
               * Comment B
               */
              @BB
              /* Comment C */
              @CCC
              // Comment D
              @DDDD
              class Class {

                /**
                 * Comment A
                 */
                @A
                /**
                 * Comment B
                 */
                @BB
                /* Comment C */
                @CCC
                // Comment D
                @DDDD
                property

                /**
                 * Comment A
                 */
                @A
                /**
                 * Comment B
                 */
                @BB
                /* Comment C */
                @CCC
                // Comment D
                @DDDD
                accessor field

                /**
                 * Comment A
                 */
                @A
                /**
                 * Comment B
                 */
                @BB
                /* Comment C */
                @CCC
                // Comment D
                @DDDD
                method(
                  /**
                   * Comment A
                   */
                  @A
                  /**
                   * Comment B
                   */
                  @BB
                  /* Comment C */
                  @CCC
                  // Comment D
                  @DDDD
                  parameter) {}

              }
            `,
            options: [options],
            errors: duplicate5Times([
              {
                messageId: 'unexpectedDecoratorsOrder',
                data: {
                  left: 'BB',
                  right: 'A',
                },
              },
              {
                messageId: 'unexpectedDecoratorsOrder',
                data: {
                  left: 'DDDD',
                  right: 'CCC',
                },
              },
            ]),
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts decorators with comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              @B() // Comment B
              @A // Comment A
              class Class {

                @B() // Comment B
                @A // Comment A
                property

                @B() // Comment B
                @A // Comment A
                accessor field

                @B() // Comment B
                @A // Comment A
                method(
                  @B() // Comment B
                  @A // Comment A
                  parameter) {}

              }
            `,
            output: dedent`
              @A // Comment A
              @B() // Comment B
              class Class {

                @A // Comment A
                @B() // Comment B
                property

                @A // Comment A
                @B() // Comment B
                accessor field

                @A // Comment A
                @B() // Comment B
                method(
                  @A // Comment A
                  @B() // Comment B
                  parameter) {}

              }
            `,
            options: [options],
            errors: duplicate5Times([
              {
                messageId: 'unexpectedDecoratorsOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
            ]),
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              @NoPublicAttributeError
              @Validated
              @AtLeastOneAttributeError
              class Class {

                @NoPublicAttributeError
                @Validated
                @AtLeastOneAttributeError
                property

                @NoPublicAttributeError
                @Validated
                @AtLeastOneAttributeError
                accessor field

                @NoPublicAttributeError
                @Validated
                @AtLeastOneAttributeError
                method(
                  @NoPublicAttributeError
                  @Validated
                  @AtLeastOneAttributeError
                  parameter) {}

              }
            `,
            output: dedent`
              @Validated
              @NoPublicAttributeError
              @AtLeastOneAttributeError
              class Class {

                @Validated
                @NoPublicAttributeError
                @AtLeastOneAttributeError
                property

                @Validated
                @NoPublicAttributeError
                @AtLeastOneAttributeError
                accessor field

                @Validated
                @NoPublicAttributeError
                @AtLeastOneAttributeError
                method(
                  @Validated
                  @NoPublicAttributeError
                  @AtLeastOneAttributeError
                  parameter) {}

              }
            `,
            options: [
              {
                ...options,
                groups: ['unknown', 'error'],
                customGroups: {
                  error: 'Error$',
                },
              },
            ],
            errors: duplicate5Times([
              {
                messageId: 'unexpectedDecoratorsGroupOrder',
                data: {
                  left: 'NoPublicAttributeError',
                  leftGroup: 'error',
                  right: 'Validated',
                  rightGroup: 'unknown',
                },
              },
            ]),
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
              @MeTooIHaveFoo
              @IHaveFooInMyName
              @A
              @B
              class Class {

                @MeTooIHaveFoo
                @IHaveFooInMyName
                @A
                @B
                property

                @MeTooIHaveFoo
                @IHaveFooInMyName
                @A
                @B
                accessor field

                @MeTooIHaveFoo
                @IHaveFooInMyName
                @A
                @B
                method(
                  @MeTooIHaveFoo
                  @IHaveFooInMyName
                  @A
                  @B
                  parameter) {}

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
      `${ruleName}(${type}): allows to use partition comments`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              // Part: A
              @Cc
              @D
              // Not partition comment
              @Bbb
              // Part: B
              @Aaaa
              @E
              // Part: C
              @Gg()
              // Not partition comment
              @Fff
              class Class {

                // Part: A
                @Cc
                @D
                // Not partition comment
                @Bbb
                // Part: B
                @Aaaa
                @E
                // Part: C
                @Gg()
                // Not partition comment
                @Fff
                property

                // Part: A
                @Cc
                @D
                // Not partition comment
                @Bbb
                // Part: B
                @Aaaa
                @E
                // Part: C
                @Gg()
                // Not partition comment
                @Fff
                accessor field

                // Part: A
                @Cc
                @D
                // Not partition comment
                @Bbb
                // Part: B
                @Aaaa
                @E
                // Part: C
                @Gg()
                // Not partition comment
                @Fff
                method(
                  // Part: A
                  @Cc
                  @D
                  // Not partition comment
                  @Bbb
                  // Part: B
                  @Aaaa
                  @E
                  // Part: C
                  @Gg()
                  // Not partition comment
                  @Fff
                  parameter) {}

              }
            `,
            output: dedent`
              // Part: A
              @D
              @Cc
              // Not partition comment
              @Bbb
              // Part: B
              @E
              @Aaaa
              // Part: C
              // Not partition comment
              @Fff
              @Gg()
              class Class {

                // Part: A
                @D
                @Cc
                // Not partition comment
                @Bbb
                // Part: B
                @E
                @Aaaa
                // Part: C
                // Not partition comment
                @Fff
                @Gg()
                property

                // Part: A
                @D
                @Cc
                // Not partition comment
                @Bbb
                // Part: B
                @E
                @Aaaa
                // Part: C
                // Not partition comment
                @Fff
                @Gg()
                accessor field

                // Part: A
                @D
                @Cc
                // Not partition comment
                @Bbb
                // Part: B
                @E
                @Aaaa
                // Part: C
                // Not partition comment
                @Fff
                @Gg()
                method(
                  // Part: A
                  @D
                  @Cc
                  // Not partition comment
                  @Bbb
                  // Part: B
                  @E
                  @Aaaa
                  // Part: C
                  // Not partition comment
                  @Fff
                  @Gg()
                  parameter) {}

              }
            `,
            options: [
              {
                ...options,
                partitionByComment: '^Part*',
              },
            ],
            errors: duplicate5Times([
              {
                messageId: 'unexpectedDecoratorsOrder',
                data: {
                  left: 'Cc',
                  right: 'D',
                },
              },
              {
                messageId: 'unexpectedDecoratorsOrder',
                data: {
                  left: 'Aaaa',
                  right: 'E',
                },
              },
              {
                messageId: 'unexpectedDecoratorsOrder',
                data: {
                  left: 'Gg',
                  right: 'Fff',
                },
              },
            ]),
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
              // Comment
              @bb
              // Other comment
              @a
              class Class {

                // Comment
                @bb
                // Other comment
                @a
                property

                // Comment
                @bb
                // Other comment
                @a
                accessor field

                // Comment
                @bb
                // Other comment
                @a
                method(
                  // Comment
                  @bb
                  // Other comment
                  @a
                  parameter) {}

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
        valid: [],
        invalid: [
          {
            code: dedent`
              /* Partition Comment */
              // Part: A
              @D
              // Part: B
              @Aaa
              @C
              @Bb
              /* Other */
              @E
              class Class {

                /* Partition Comment */
                // Part: A
                @D
                // Part: B
                @Aaa
                @C
                @Bb
                /* Other */
                @E
                property

                /* Partition Comment */
                // Part: A
                @D
                // Part: B
                @Aaa
                @C
                @Bb
                /* Other */
                @E
                accessor field

                /* Partition Comment */
                // Part: A
                @D
                // Part: B
                @Aaa
                @C
                @Bb
                /* Other */
                @E
                method(
                  /* Partition Comment */
                  // Part: A
                  @D
                  // Part: B
                  @Aaa
                  @C
                  @Bb
                  /* Other */
                  @E
                  parameter) {}

              }
            `,
            output: dedent`
              /* Partition Comment */
              // Part: A
              @D
              // Part: B
              @C
              @Bb
              @Aaa
              /* Other */
              @E
              class Class {

                /* Partition Comment */
                // Part: A
                @D
                // Part: B
                @C
                @Bb
                @Aaa
                /* Other */
                @E
                property

                /* Partition Comment */
                // Part: A
                @D
                // Part: B
                @C
                @Bb
                @Aaa
                /* Other */
                @E
                accessor field

                /* Partition Comment */
                // Part: A
                @D
                // Part: B
                @C
                @Bb
                @Aaa
                /* Other */
                @E
                method(
                  /* Partition Comment */
                  // Part: A
                  @D
                  // Part: B
                  @C
                  @Bb
                  @Aaa
                  /* Other */
                  @E
                  parameter) {}

              }
            `,
            options: [
              {
                ...options,
                partitionByComment: ['Partition Comment', 'Part: *', 'Other'],
              },
            ],
            errors: duplicate5Times([
              {
                messageId: 'unexpectedDecoratorsOrder',
                data: {
                  left: 'Aaa',
                  right: 'C',
                },
              },
            ]),
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex for partition comments`,
      rule,
      {
        valid: [
          {
            code: dedent`
              @E
              @F
              // I am a partition comment because I don't have f o o
              @A
              @B
              class Class {

                @E
                @F
                // I am a partition comment because I don't have f o o
                @A
                @B
                property

                @E
                @F
                // I am a partition comment because I don't have f o o
                @A
                @B
                accessor field

                @E
                @F
                // I am a partition comment because I don't have f o o
                @A
                @B
                method(
                  @E
                  @F
                  // I am a partition comment because I don't have f o o
                  @A
                  @B
                  parameter) {}

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

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`

              @B
              @_A
              @_C
              class Class {

                @B
                @_A
                @_C
                property

                @B
                @_A
                @_C
                accessor field

                @B
                @_A
                @_C
                method(
                  @B
                  @_A
                  @_C
                  parameter) {}

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

              @AB
              @A_C
              class Class {

                @AB
                @A_C
                property

                @AB
                @A_C
                accessor field

                @AB
                @A_C
                method(
                  @AB
                  @A_C
                  parameter) {}

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
            @AA
            @B
            @EEE
            @F
            class Class {
            }
          `,
        ],
        invalid: [],
      },
    )

    describe(`${ruleName}: disabling sorting`, () => {
      ruleTester.run(
        `${ruleName}: allows class decorators sorting to be disabled`,
        rule,
        {
          valid: [
            {
              code: dedent`
                @B
                @A
                class Class {}
              `,
              options: [
                {
                  sortOnClasses: false,
                },
              ],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}: allows accessor decorators sorting to be disabled`,
        rule,
        {
          valid: [
            {
              code: dedent`
                class Class {

                  @B
                  @A
                  accessor field

                }
              `,
              options: [
                {
                  sortOnAccessors: false,
                },
              ],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}: allows property decorators sorting to be disabled`,
        rule,
        {
          valid: [
            {
              code: dedent`
                class Class {

                  @B
                  @A
                  property

                }
              `,
              options: [
                {
                  sortOnProperties: false,
                },
              ],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}: allows method decorators sorting to be disabled`,
        rule,
        {
          valid: [
            {
              code: dedent`
                class Class {

                  @B
                  @A
                  method() {}

                }
              `,
              options: [
                {
                  sortOnMethods: false,
                },
              ],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}: allows method decorators sorting to be disabled`,
        rule,
        {
          valid: [
            {
              code: dedent`
              class Class {

                method(
                  @B
                  @A
                  parameter) {}

              }
            `,
              options: [
                {
                  sortOnParameters: false,
                },
              ],
            },
          ],
          invalid: [],
        },
      )
    })
  })
})

const duplicate5Times = (
  errors: TestCaseError<
    'unexpectedDecoratorsGroupOrder' | 'unexpectedDecoratorsOrder'
  >[],
) => Array.from({ length: 5 }, () => errors).flat()
