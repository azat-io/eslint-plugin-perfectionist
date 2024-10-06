import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule from '../rules/sort-method-decorators'

let ruleName = 'sort-method-decorators'

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

    ruleTester.run(`${ruleName}(${type}): sorts method decorators`, rule, {
      valid: [
        {
          code: dedent`
            class Class {

              @A
              @B
              @C
              method() {}

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
              method() {}

            }
          `,
          output: dedent`
            class Class {

              @A
              @B()
              @C
              method() {}

            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedMethodDecoratorsOrder',
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
                method() {}

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
                method() {}

              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedMethodDecoratorsOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
              {
                messageId: 'unexpectedMethodDecoratorsOrder',
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
      `${ruleName}(${type}): sorts method decorators with comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class Class {

                @B // Comment B
                @A // Comment A
                method() {}

              }
            `,
            output: dedent`
              class Class {

                @A // Comment A
                @B // Comment B
                method() {}

              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedMethodDecoratorsOrder',
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
                method() {}

              }
            `,
            output: dedent`
              class Class {

                @Validated
                @AtLeastOneAttributeError
                @NoPublicAttributeError
                method() {}

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
                messageId: 'unexpectedMethodDecoratorsGroupOrder',
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
                method() {}

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
                method() {}

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
                method() {}

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
                messageId: 'unexpectedMethodDecoratorsOrder',
                data: {
                  left: 'D',
                  right: 'Bbb',
                },
              },
              {
                messageId: 'unexpectedMethodDecoratorsOrder',
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
                method() {}

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
                method() {}

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
                method() {}

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
                messageId: 'unexpectedMethodDecoratorsOrder',
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
                method() {}

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

    ruleTester.run(`${ruleName}(${type}): sorts method decorators`, rule, {
      valid: [
        {
          code: dedent`
            class Class {

              @A
              @B
              @C
              method() {}

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
              method() {}

            }
          `,
          output: dedent`
            class Class {

              @A
              @B()
              @C
              method() {}

            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedMethodDecoratorsOrder',
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
                method() {}

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
                method() {}

              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedMethodDecoratorsOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
              {
                messageId: 'unexpectedMethodDecoratorsOrder',
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
      `${ruleName}(${type}): sorts method decorators with comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class Class {

                @B // Comment B
                @A // Comment A
                method() {}

              }
            `,
            output: dedent`
              class Class {

                @A // Comment A
                @B // Comment B
                method() {}

              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedMethodDecoratorsOrder',
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
                method() {}

              }
            `,
            output: dedent`
              class Class {

                @Validated
                @AtLeastOneAttributeError
                @NoPublicAttributeError
                method() {}

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
                messageId: 'unexpectedMethodDecoratorsGroupOrder',
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
                method() {}

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
                method() {}

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
                method() {}

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
                messageId: 'unexpectedMethodDecoratorsOrder',
                data: {
                  left: 'D',
                  right: 'Bbb',
                },
              },
              {
                messageId: 'unexpectedMethodDecoratorsOrder',
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
                method() {}

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
                method() {}

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
                method() {}

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
                messageId: 'unexpectedMethodDecoratorsOrder',
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
                method() {}

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

    ruleTester.run(`${ruleName}(${type}): sorts method decorators`, rule, {
      valid: [
        {
          code: dedent`
            class Class {

              @A
              @B
              @C
              method() {}

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
              method() {}

            }
          `,
          output: dedent`
            class Class {

              @B()
              @A
              @C
              method() {}

            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedMethodDecoratorsOrder',
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
                method() {}

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
                method() {}

              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedMethodDecoratorsOrder',
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
      `${ruleName}(${type}): sorts method decorators with comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class Class {

                @A // Comment A
                @BB // Comment B
                method() {}

              }
            `,
            output: dedent`
              class Class {

                @BB // Comment B
                @A // Comment A
                method() {}

              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedMethodDecoratorsOrder',
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
                method() {}

              }
            `,
            output: dedent`
              class Class {

                @Validated
                @AtLeastOneAttributeError
                @NoPublicAttributeError
                method() {}

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
                messageId: 'unexpectedMethodDecoratorsGroupOrder',
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
                method() {}

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
                method() {}

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
                method() {}

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
                messageId: 'unexpectedMethodDecoratorsOrder',
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
                method() {}

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
                method() {}

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
                method() {}

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
                messageId: 'unexpectedMethodDecoratorsOrder',
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
                method() {}

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
              method() {}
            }
          `,
        ],
        invalid: [],
      },
    )
  })
})
