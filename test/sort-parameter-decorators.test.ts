import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule from '../rules/sort-parameter-decorators'

let ruleName = 'sort-parameter-decorators'

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

    ruleTester.run(`${ruleName}(${type}): sorts parameter decorators`, rule, {
      valid: [
        {
          code: dedent`
            class Class {

              method(
                @A
                @B
                @C
                property) {}

            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            class Class {

              method(
                @A @C @B() property) {}

            }
          `,
          output: dedent`
            class Class {

              method(
                @A @B() @C property) {}

            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedParameterDecoratorsOrder',
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
                property) {}

              }
            `,
            output: dedent`
              class Class {

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
                property) {}

              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedParameterDecoratorsOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
              {
                messageId: 'unexpectedParameterDecoratorsOrder',
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
      `${ruleName}(${type}): sorts parameter decorators with comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class Class {

              method(
                @B // Comment B
                @A // Comment A
                property) {}

              }
            `,
            output: dedent`
              class Class {

              method(
                @A // Comment A
                @B // Comment B
                property) {}

              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedParameterDecoratorsOrder',
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

              method(
                @NoPublicAttributeError
                @Validated
                @AtLeastOneAttributeError
                property) {}

              }
            `,
            output: dedent`
              class Class {

              method(
                @Validated
                @AtLeastOneAttributeError
                @NoPublicAttributeError
                property) {}

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
                messageId: 'unexpectedParameterDecoratorsGroupOrder',
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

              method(
                @IHaveFooInMyName
                @MeTooIHaveFoo
                @A
                @B
                property) {}

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
                property) {}

              }
            `,
            output: dedent`
              class Class {

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
                property) {}

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
                messageId: 'unexpectedParameterDecoratorsOrder',
                data: {
                  left: 'D',
                  right: 'Bbb',
                },
              },
              {
                messageId: 'unexpectedParameterDecoratorsOrder',
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

              method(
                // Comment
                @bb
                // Other comment
                @a
                property) {}

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
                property) {}

              }
            `,
            output: dedent`
              class Class {

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
                property) {}

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
                messageId: 'unexpectedParameterDecoratorsOrder',
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

              method(
                @E
                @F
                // I am a partition comment because I don't have f o o
                @A
                @B
                property) {}

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

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {

                method(
                  @_A
                  @B
                  @_C
                  property) {}
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
              class Class {

                method(
                  @AB
                  @A_C
                  property) {}
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

  describe(`${ruleName}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts parameter decorators`, rule, {
      valid: [
        {
          code: dedent`
            class Class {

              method(
                @A
                @B
                @C
                property) {}

            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            class Class {

              method(
                @A @C @B() property) {}

            }
          `,
          output: dedent`
            class Class {

              method(
                @A @B() @C property) {}

            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedParameterDecoratorsOrder',
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
                property) {}

              }
            `,
            output: dedent`
              class Class {

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
                property) {}

              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedParameterDecoratorsOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
              {
                messageId: 'unexpectedParameterDecoratorsOrder',
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
      `${ruleName}(${type}): sorts parameter decorators with comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class Class {

              method(
                @B // Comment B
                @A // Comment A
                property) {}

              }
            `,
            output: dedent`
              class Class {

              method(
                @A // Comment A
                @B // Comment B
                property) {}

              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedParameterDecoratorsOrder',
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

              method(
                @NoPublicAttributeError
                @Validated
                @AtLeastOneAttributeError
                property) {}

              }
            `,
            output: dedent`
              class Class {

              method(
                @Validated
                @AtLeastOneAttributeError
                @NoPublicAttributeError
                property) {}

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
                messageId: 'unexpectedParameterDecoratorsGroupOrder',
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

              method(
                @IHaveFooInMyName
                @MeTooIHaveFoo
                @A
                @B
                property) {}

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
                property) {}

              }
            `,
            output: dedent`
              class Class {

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
                property) {}

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
                messageId: 'unexpectedParameterDecoratorsOrder',
                data: {
                  left: 'D',
                  right: 'Bbb',
                },
              },
              {
                messageId: 'unexpectedParameterDecoratorsOrder',
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

              method(
                // Comment
                @bb
                // Other comment
                @a
                property) {}

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
                property) {}

              }
            `,
            output: dedent`
              class Class {

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
                property) {}

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
                messageId: 'unexpectedParameterDecoratorsOrder',
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

              method(
                @E
                @F
                // I am a partition comment because I don't have f o o
                @A
                @B
                property) {}

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

    ruleTester.run(`${ruleName}(${type}): sorts parameter decorators`, rule, {
      valid: [
        {
          code: dedent`
            class Class {

              method(
                @A
                @B
                @C
                property) {}

            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            class Class {

              method(
                @A @C @B() property) {}

            }
          `,
          output: dedent`
            class Class {

              method(
                @B() @A @C property) {}

            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedParameterDecoratorsOrder',
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
                property) {}

              }
            `,
            output: dedent`
              class Class {

              method(
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
                property) {}

              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedParameterDecoratorsOrder',
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
      `${ruleName}(${type}): sorts parameter decorators with comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class Class {

              method(
                @A // Comment A
                @BB // Comment B
                property) {}

              }
            `,
            output: dedent`
              class Class {

              method(
                @BB // Comment B
                @A // Comment A
                property) {}

              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedParameterDecoratorsOrder',
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

              method(
                @NoPublicAttributeError
                @Validated
                @AtLeastOneAttributeError
                property) {}

              }
            `,
            output: dedent`
              class Class {

              method(
                @Validated
                @AtLeastOneAttributeError
                @NoPublicAttributeError
                property) {}

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
                messageId: 'unexpectedParameterDecoratorsGroupOrder',
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

              method(
                @IHaveFooInMyName
                @MeTooIHaveFoo
                @A
                @B
                property) {}

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
                property) {}

              }
            `,
            output: dedent`
              class Class {

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
                @Gg()
                // Not partition comment
                @Fff
                property) {}

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
                messageId: 'unexpectedParameterDecoratorsOrder',
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

              method(
                // Comment
                @bb
                // Other comment
                @a
                property) {}

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
                property) {}

              }
            `,
            output: dedent`
              class Class {

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
                property) {}

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
                messageId: 'unexpectedParameterDecoratorsOrder',
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

              method(
                @E
                @F
                // I am a partition comment because I don't have f o o
                @A
                @B
                property) {}

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

              method(
                @AA
                @B
                @EEE
                @F
              property) {}

            }
          `,
        ],
        invalid: [],
      },
    )
  })
})
