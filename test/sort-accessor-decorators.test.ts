import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule from '../rules/sort-accessor-decorators'

let ruleName = 'sort-accessor-decorators'

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

    ruleTester.run(`${ruleName}(${type}): sorts accessor decorators`, rule, {
      valid: [
        {
          code: dedent`
            class Class {

              @A @B() @C
              accessor property

            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            class Class {

              @A
              @C
              @B()
              accessor property

            }
          `,
          output: dedent`
            class Class {

              @A
              @B()
              @C
              accessor property

            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedAccessorDecoratorsOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
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
                accessor property

              }
            `,
            output: dedent`
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
                accessor property

              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedAccessorDecoratorsOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
              {
                messageId: 'unexpectedAccessorDecoratorsOrder',
                data: {
                  left: 'D',
                  right: 'C',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts accessor decorators with comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class Class {

                @B // Comment B
                @A // Comment A
                accessor property

              }
            `,
            output: dedent`
              class Class {

                @A // Comment A
                @B // Comment B
                accessor property

              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedAccessorDecoratorsOrder',
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

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class Class {

                @NoPublicAttributeError
                @Validated
                @AtLeastOneAttributeError
                accessor property

              }
            `,
            output: dedent`
              class Class {

                @Validated
                @AtLeastOneAttributeError
                @NoPublicAttributeError
                accessor property

              }
            `,
            options: [
              {
                ...options,
                groups: ['unknown', 'error'],
                customGroups: {
                  error: '*Error',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAccessorDecoratorsGroupOrder',
                data: {
                  left: 'NoPublicAttributeError',
                  leftGroup: 'error',
                  right: 'Validated',
                  rightGroup: 'unknown',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex matcher for custom groups`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {

                @IHaveFooInMyName
                @MeTooIHaveFoo
                @A
                @B
                accessor property

              }
            `,
            options: [
              {
                ...options,
                matcher: 'regex',
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
                accessor property

              }
            `,
            output: dedent`
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
                accessor property

              }
            `,
            options: [
              {
                ...options,
                partitionByComment: 'Part**',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAccessorDecoratorsOrder',
                data: {
                  left: 'D',
                  right: 'Bbb',
                },
              },
              {
                messageId: 'unexpectedAccessorDecoratorsOrder',
                data: {
                  left: 'Gg',
                  right: 'Fff',
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
              class Class {

                // Comment
                @bb
                // Other comment
                @a
                accessor property

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
                accessor property

              }
            `,
            output: dedent`
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
                accessor property

              }
            `,
            options: [
              {
                ...options,
                partitionByComment: ['Partition Comment', 'Part: *', 'Other'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAccessorDecoratorsOrder',
                data: {
                  left: 'C',
                  right: 'Bb',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex matcher for partition comments`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {

                @E
                @F
                // I am a partition comment because I don't have f o o
                @A
                @B
                accessor property

              }
            `,
            options: [
              {
                ...options,
                matcher: 'regex',
                partitionByComment: ['^(?!.*foo).*$'],
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

    ruleTester.run(`${ruleName}(${type}): sorts accessor decorators`, rule, {
      valid: [
        {
          code: dedent`
            class Class {

              @A @B() @C
              accessor property

            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            class Class {

              @A
              @C
              @B()
              accessor property

            }
          `,
          output: dedent`
            class Class {

              @A
              @B()
              @C
              accessor property

            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedAccessorDecoratorsOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
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
                accessor property

              }
            `,
            output: dedent`
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
                accessor property

              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedAccessorDecoratorsOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
              {
                messageId: 'unexpectedAccessorDecoratorsOrder',
                data: {
                  left: 'D',
                  right: 'C',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts accessor decorators with comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class Class {

                @B // Comment B
                @A // Comment A
                accessor property

              }
            `,
            output: dedent`
              class Class {

                @A // Comment A
                @B // Comment B
                accessor property

              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedAccessorDecoratorsOrder',
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

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class Class {

                @NoPublicAttributeError
                @Validated
                @AtLeastOneAttributeError
                accessor property

              }
            `,
            output: dedent`
              class Class {

                @Validated
                @AtLeastOneAttributeError
                @NoPublicAttributeError
                accessor property

              }
            `,
            options: [
              {
                ...options,
                groups: ['unknown', 'error'],
                customGroups: {
                  error: '*Error',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAccessorDecoratorsGroupOrder',
                data: {
                  left: 'NoPublicAttributeError',
                  leftGroup: 'error',
                  right: 'Validated',
                  rightGroup: 'unknown',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex matcher for custom groups`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {

                @IHaveFooInMyName
                @MeTooIHaveFoo
                @A
                @B
                accessor property

              }
            `,
            options: [
              {
                ...options,
                matcher: 'regex',
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
                accessor property

              }
            `,
            output: dedent`
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
                accessor property

              }
            `,
            options: [
              {
                ...options,
                partitionByComment: 'Part**',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAccessorDecoratorsOrder',
                data: {
                  left: 'D',
                  right: 'Bbb',
                },
              },
              {
                messageId: 'unexpectedAccessorDecoratorsOrder',
                data: {
                  left: 'Gg',
                  right: 'Fff',
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
              class Class {

                // Comment
                @bb
                // Other comment
                @a
                accessor property

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
                accessor property

              }
            `,
            output: dedent`
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
                accessor property

              }
            `,
            options: [
              {
                ...options,
                partitionByComment: ['Partition Comment', 'Part: *', 'Other'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAccessorDecoratorsOrder',
                data: {
                  left: 'C',
                  right: 'Bb',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex matcher for partition comments`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {

                @E
                @F
                // I am a partition comment because I don't have f o o
                @A
                @B
                accessor property

              }
            `,
            options: [
              {
                ...options,
                matcher: 'regex',
                partitionByComment: ['^(?!.*foo).*$'],
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
      order: 'desc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts accessor decorators`, rule, {
      valid: [
        {
          code: dedent`
            class Class {

              @B() @A @C
              accessor property

            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            class Class {

              @A
              @C
              @B()
              accessor property

            }
          `,
          output: dedent`
            class Class {

              @B()
              @A
              @C
              accessor property

            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedAccessorDecoratorsOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
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
                accessor property

              }
            `,
            output: dedent`
              class Class {

                // Comment D
                @DDDD
                /* Comment C */
                @CCC
                /**
                 * Comment B
                 */
                @BB
                /**
                 * Comment A
                 */
                @A
                accessor property

              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedAccessorDecoratorsOrder',
                data: {
                  left: 'A',
                  right: 'DDDD',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts accessor decorators with comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class Class {

                @A // Comment A
                @BB // Comment B
                accessor property

              }
            `,
            output: dedent`
              class Class {

                @BB // Comment B
                @A // Comment A
                accessor property

              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedAccessorDecoratorsOrder',
                data: {
                  left: 'A',
                  right: 'BB',
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
        valid: [],
        invalid: [
          {
            code: dedent`
              class Class {

                @NoPublicAttributeError
                @Validated
                @AtLeastOneAttributeError
                accessor property

              }
            `,
            output: dedent`
              class Class {

                @Validated
                @AtLeastOneAttributeError
                @NoPublicAttributeError
                accessor property

              }
            `,
            options: [
              {
                ...options,
                groups: ['unknown', 'error'],
                customGroups: {
                  error: '*Error',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAccessorDecoratorsGroupOrder',
                data: {
                  left: 'NoPublicAttributeError',
                  leftGroup: 'error',
                  right: 'Validated',
                  rightGroup: 'unknown',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex matcher for custom groups`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {

                @IHaveFooInMyName
                @MeTooIHaveFoo
                @A
                @B
                accessor property

              }
            `,
            options: [
              {
                ...options,
                matcher: 'regex',
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
                accessor property

              }
            `,
            output: dedent`
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
                @Gg()
                // Not partition comment
                @Fff
                accessor property

              }
            `,
            options: [
              {
                ...options,
                partitionByComment: 'Part**',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAccessorDecoratorsOrder',
                data: {
                  left: 'D',
                  right: 'Bbb',
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
              class Class {

                // Comment
                @bb
                // Other comment
                @a
                accessor property

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
                accessor property

              }
            `,
            output: dedent`
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
                accessor property

              }
            `,
            options: [
              {
                ...options,
                partitionByComment: ['Partition Comment', 'Part: *', 'Other'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAccessorDecoratorsOrder',
                data: {
                  left: 'C',
                  right: 'Bb',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex matcher for partition comments`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {

                @E
                @F
                // I am a partition comment because I don't have f o o
                @A
                @B
                accessor property

              }
            `,
            options: [
              {
                ...options,
                matcher: 'regex',
                partitionByComment: ['^(?!.*foo).*$'],
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
            class Class {

              @AA
              @B
              @EEE
              @F
              accessor property

            }
          `,
        ],
        invalid: [],
      },
    )
  })
})
