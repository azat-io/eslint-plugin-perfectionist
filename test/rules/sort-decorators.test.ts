import type { TestCaseError } from '@typescript-eslint/rule-tester'
import type { Rule } from 'eslint'

import { RuleTester } from '@typescript-eslint/rule-tester'
import { RuleTester as EslintRuleTester } from 'eslint'
import { afterAll, describe, it } from 'vitest'
import dedent from 'dedent'

import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-decorators'

let ruleName = 'sort-decorators'

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

    ruleTester.run(`${ruleName}(${type}): sorts decorators`, rule, {
      invalid: [
        {
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
          errors: duplicate5Times([
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedDecoratorsOrder',
            },
          ]),
          options: [options],
        },
      ],
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
    })

    ruleTester.run(
      `${ruleName}(${type}): does not break decorator docs`,
      rule,
      {
        invalid: [
          {
            output: dedent`
              /**
               * JSDoc comment that shouldn't move
               */
              /**
               * Comment A
               */
              @A
              @B
              /* Comment C */
              @C
              // Comment D
              @D
              class Class {

                /**
                 * JSDoc comment that shouldn't move
                 */
                /**
                 * Comment A
                 */
                @A
                @B
                /* Comment C */
                @C
                // Comment D
                @D
                property

                /**
                 * JSDoc comment that shouldn't move
                 */
                /**
                 * Comment A
                 */
                @A
                @B
                /* Comment C */
                @C
                // Comment D
                @D
                accessor field

                /**
                 * JSDoc comment that shouldn't move
                 */
                /**
                 * Comment A
                 */
                @A
                @B
                /* Comment C */
                @C
                // Comment D
                @D
                method(
                  /**
                   * JSDoc comment that shouldn't move
                   */
                  /**
                   * Comment A
                   */
                  @A
                  @B
                  /* Comment C */
                  @C
                  // Comment D
                  @D
                  parameter) {}

              }
            `,
            code: dedent`
              /**
               * JSDoc comment that shouldn't move
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
                 * JSDoc comment that shouldn't move
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
                 * JSDoc comment that shouldn't move
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
                 * JSDoc comment that shouldn't move
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
                   * JSDoc comment that shouldn't move
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
            errors: duplicate5Times([
              {
                data: {
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
              {
                data: {
                  right: 'C',
                  left: 'D',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
            ]),
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts decorators with comments on the same line`,
      rule,
      {
        invalid: [
          {
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
            errors: duplicate5Times([
              {
                data: {
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
            ]),
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): ignores first comment if it's a block`,
      rule,
      {
        invalid: [
          {
            output: dedent`
                class Class {
                  // Should not move
                  /**
                   * JSDoc comment
                   */
                  // A
                  @A()
                  @B()
                  foo: number;
              }
            `,
            code: dedent`
                class Class {
                  // Should not move
                  /**
                   * JSDoc comment
                   */
                  @B()
                  // A
                  @A()
                  foo: number;
              }
            `,
            errors: [
              {
                messageId: 'unexpectedDecoratorsOrder',
              },
            ],
            options: [options],
          },
          {
            output: dedent`
                class Class {
                  // Should not move
                  /**
                   * JSDoc comment
                   */
                  /**
                   * A
                   */
                  @A()
                  @B()
                  foo: number;
              }
            `,
            code: dedent`
                class Class {
                  // Should not move
                  /**
                   * JSDoc comment
                   */
                  @B()
                  /**
                   * A
                   */
                  @A()
                  foo: number;
              }
            `,
            errors: [
              {
                messageId: 'unexpectedDecoratorsOrder',
              },
            ],
            options: [options],
          },
          {
            output: dedent`
                class Class {
                  // Shouldn't move
                  /** JSDoc comment */
                  @A()
                  @B()
                  foo: number;
              }
            `,
            code: dedent`
                class Class {
                  // Shouldn't move
                  /** JSDoc comment */
                  @B()
                  @A()
                  foo: number;
              }
            `,
            errors: [
              {
                messageId: 'unexpectedDecoratorsOrder',
              },
            ],
            options: [options],
          },
          {
            output: dedent`
                class Class {
                  // Not aJSDoc comment
                  @A()
                  @B()
                  foo: number;
              }
            `,
            code: dedent`
                class Class {
                  @B()
                  // Not aJSDoc comment
                  @A()
                  foo: number;
              }
            `,
            errors: [
              {
                messageId: 'unexpectedDecoratorsOrder',
              },
            ],
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        invalid: [
          {
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
            errors: duplicate5Times([
              {
                data: {
                  left: 'NoPublicAttributeError',
                  rightGroup: 'unknown',
                  leftGroup: 'error',
                  right: 'Validated',
                },
                messageId: 'unexpectedDecoratorsGroupOrder',
              },
            ]),
            options: [
              {
                ...options,
                customGroups: {
                  error: 'Error$',
                },
                groups: ['unknown', 'error'],
              },
            ],
          },
          {
            output: dedent`
              @B.B()
              @A.A.A(() => A)
              class Class {

                @B.B()
                @A.A.A(() => A)
                property

                @B.B()
                @A.A.A(() => A)
                accessor field

                @B.B()
                @A.A.A(() => A)
                method(
                  @B.B()
                  @A.A.A(() => A)
                  parameter) {}

              }
            `,
            code: dedent`
              @A.A.A(() => A)
              @B.B()
              class Class {

                @A.A.A(() => A)
                @B.B()
                property

                @A.A.A(() => A)
                @B.B()
                accessor field

                @A.A.A(() => A)
                @B.B()
                method(
                  @A.A.A(() => A)
                  @B.B()
                  parameter) {}

              }
            `,
            errors: duplicate5Times([
              {
                data: {
                  rightGroup: 'B',
                  leftGroup: 'A',
                  left: 'A.A.A',
                  right: 'B.B',
                },
                messageId: 'unexpectedDecoratorsGroupOrder',
              },
            ]),
            options: [
              {
                customGroups: {
                  A: 'A',
                  B: 'B',
                },
                type: 'alphabetical',
                groups: ['B', 'A'],
                order: 'asc',
              },
            ],
          },
        ],
        valid: [],
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
                customGroups: {
                  elementsWithoutFoo: '^(?!.*Foo).*$',
                },
                groups: ['unknown', 'elementsWithoutFoo'],
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
        invalid: [
          {
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
            errors: duplicate5Times([
              {
                data: {
                  right: 'Bbb',
                  left: 'D',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
              {
                data: {
                  right: 'Fff',
                  left: 'Gg',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
            ]),
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
        invalid: [
          {
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
            errors: duplicate5Times([
              {
                data: {
                  right: 'Bb',
                  left: 'C',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
            ]),
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

    describe(`${ruleName}(${type}): allows to use "partitionByComment.line"`, () => {
      ruleTester.run(`${ruleName}(${type}): ignores block comments`, rule, {
        invalid: [
          {
            output: dedent`
              /* Comment */
              @A
              @B
              class Class {

                /* Comment */
                @A
                @B
                property

                /* Comment */
                @A
                @B
                accessor field

                /* Comment */
                @A
                @B
                method(
                  /* Comment */
                  @A
                  @B
                  parameter) {}
              }
            `,
            code: dedent`
              @B
              /* Comment */
              @A
              class Class {

                @B
                /* Comment */
                @A
                property

                @B
                /* Comment */
                @A
                accessor field

                @B
                /* Comment */
                @A
                method(
                  @B
                  /* Comment */
                  @A
                  parameter) {}
              }
            `,
            errors: duplicate5Times([
              {
                data: {
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
            ]),
            options: [
              {
                ...options,
                partitionByComment: {
                  line: true,
                },
              },
            ],
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
              code: dedent`
                @B
                // Comment
                @A
                class Class {

                  @B
                  // Comment
                  @A
                  property

                  @B
                  // Comment
                  @A
                  accessor field

                  @B
                  // Comment
                  @A
                  method(
                    @B
                    // Comment
                    @A
                    parameter) {}
                }
              `,
              options: [
                {
                  ...options,
                  partitionByComment: {
                    line: true,
                  },
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
          valid: [
            {
              code: dedent`
                @C
                // B
                @B
                // A
                @A
                class Class {

                  @C
                  // B
                  @B
                  // A
                  @A
                  property

                  @C
                  // B
                  @B
                  // A
                  @A
                  accessor field

                  @C
                  // B
                  @B
                  // A
                  @A
                  method(
                    @C
                    // B
                    @B
                    // A
                    @A
                    parameter) {}
                }
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
              code: dedent`
                @B
                // I am a partition comment because I don't have f o o
                @A
                class Class {

                  @B
                  // I am a partition comment because I don't have f o o
                  @A
                  property

                  @B
                  // I am a partition comment because I don't have f o o
                  @A
                  accessor field

                  @B
                  // I am a partition comment because I don't have f o o
                  @A
                  method(
                    @B
                    // I am a partition comment because I don't have f o o
                    @A
                    parameter) {}
                }
              `,
              options: [
                {
                  ...options,
                  partitionByComment: {
                    line: ['^(?!.*foo).*$'],
                  },
                },
              ],
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
            output: dedent`
              // Comment
              @A
              @B
              class Class {

                // Comment
                @A
                @B
                property

                // Comment
                @A
                @B
                accessor field

                // Comment
                @A
                @B
                method(
                  // Comment
                  @A
                  @B
                  parameter) {}
              }
            `,
            code: dedent`
              @B
              // Comment
              @A
              class Class {

                @B
                // Comment
                @A
                property

                @B
                // Comment
                @A
                accessor field

                @B
                // Comment
                @A
                method(
                  @B
                  // Comment
                  @A
                  parameter) {}
              }
            `,
            errors: duplicate5Times([
              {
                data: {
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
            ]),
            options: [
              {
                ...options,
                partitionByComment: {
                  block: true,
                },
              },
            ],
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
              code: dedent`
                @B
                /* Comment */
                @A
                class Class {

                  @B
                  /* Comment */
                  @A
                  property

                  @B
                  /* Comment */
                  @A
                  accessor field

                  @B
                  /* Comment */
                  @A
                  method(
                    @B
                    /* Comment */
                    @A
                    parameter) {}
                }
              `,
              options: [
                {
                  ...options,
                  partitionByComment: {
                    block: true,
                  },
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
          valid: [
            {
              code: dedent`
                @C
                /* B */
                @B
                /* A */
                @A
                class Class {

                  @C
                  /* B */
                  @B
                  /* A */
                  @A
                  property

                  @C
                  /* B */
                  @B
                  /* A */
                  @A
                  accessor field

                  @C
                  /* B */
                  @B
                  /* A */
                  @A
                  method(
                    @C
                    /* B */
                    @B
                    /* A */
                    @A
                    parameter) {}
                }
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
                @B
                /* I am a partition comment because I don't have f o o */
                @A
                class Class {

                  @B
                  /* I am a partition comment because I don't have f o o */
                  @A
                  property

                  @B
                  /* I am a partition comment because I don't have f o o */
                  @A
                  accessor field

                  @B
                  /* I am a partition comment because I don't have f o o */
                  @A
                  method(
                    @B
                    /* I am a partition comment because I don't have f o o */
                    @A
                    parameter) {}
                }
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
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts decorators`, rule, {
      invalid: [
        {
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
          errors: duplicate5Times([
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedDecoratorsOrder',
            },
          ]),
          options: [options],
        },
      ],
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
    })

    ruleTester.run(
      `${ruleName}(${type}): does not break decorator docs`,
      rule,
      {
        invalid: [
          {
            output: dedent`
              /**
               * JSDoc comment that shouldn't move
               */
              /**
               * Comment A
               */
              @A
              @B
              /* Comment C */
              @C
              // Comment D
              @D
              class Class {

                /**
                 * JSDoc comment that shouldn't move
                 */
                /**
                 * Comment A
                 */
                @A
                @B
                /* Comment C */
                @C
                // Comment D
                @D
                property

                /**
                 * JSDoc comment that shouldn't move
                 */
                /**
                 * Comment A
                 */
                @A
                @B
                /* Comment C */
                @C
                // Comment D
                @D
                accessor field

                /**
                 * JSDoc comment that shouldn't move
                 */
                /**
                 * Comment A
                 */
                @A
                @B
                /* Comment C */
                @C
                // Comment D
                @D
                method(
                  /**
                   * JSDoc comment that shouldn't move
                   */
                  /**
                   * Comment A
                   */
                  @A
                  @B
                  /* Comment C */
                  @C
                  // Comment D
                  @D
                  parameter) {}

              }
            `,
            code: dedent`
              /**
               * JSDoc comment that shouldn't move
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
                 * JSDoc comment that shouldn't move
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
                 * JSDoc comment that shouldn't move
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
                 * JSDoc comment that shouldn't move
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
                   * JSDoc comment that shouldn't move
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
            errors: duplicate5Times([
              {
                data: {
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
              {
                data: {
                  right: 'C',
                  left: 'D',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
            ]),
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts decorators with comments on the same line`,
      rule,
      {
        invalid: [
          {
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
            errors: duplicate5Times([
              {
                data: {
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
            ]),
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        invalid: [
          {
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
            errors: duplicate5Times([
              {
                data: {
                  left: 'NoPublicAttributeError',
                  rightGroup: 'unknown',
                  leftGroup: 'error',
                  right: 'Validated',
                },
                messageId: 'unexpectedDecoratorsGroupOrder',
              },
            ]),
            options: [
              {
                ...options,
                customGroups: {
                  error: 'Error$',
                },
                groups: ['unknown', 'error'],
              },
            ],
          },
        ],
        valid: [],
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
                customGroups: {
                  elementsWithoutFoo: '^(?!.*Foo).*$',
                },
                groups: ['unknown', 'elementsWithoutFoo'],
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
        invalid: [
          {
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
            errors: duplicate5Times([
              {
                data: {
                  right: 'Bbb',
                  left: 'D',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
              {
                data: {
                  right: 'Fff',
                  left: 'Gg',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
            ]),
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
        invalid: [
          {
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
            errors: duplicate5Times([
              {
                data: {
                  right: 'Bb',
                  left: 'C',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
            ]),
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

    ruleTester.run(`${ruleName}(${type}): sorts decorators`, rule, {
      invalid: [
        {
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
          errors: duplicate5Times([
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedDecoratorsOrder',
            },
          ]),
          options: [options],
        },
      ],
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
    })
  })

  describe(`${ruleName}: sorting by line length`, () => {
    let type = 'line-length'

    let options = {
      type: 'line-length',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts decorators`, rule, {
      invalid: [
        {
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
          errors: duplicate5Times([
            {
              data: {
                right: 'C',
                left: 'B',
              },
              messageId: 'unexpectedDecoratorsOrder',
            },
          ]),
          options: [options],
        },
      ],
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
    })

    ruleTester.run(
      `${ruleName}(${type}): does not break decorator docs`,
      rule,
      {
        invalid: [
          {
            output: dedent`
              /**
               * JSDoc comment that shouldn't move
               */
              /**
               * Comment A
               */
              @A
              @BB
              /* Comment C */
              @CCC
              // Comment D
              @DDDD
              class Class {

                /**
                 * JSDoc comment that shouldn't move
                 */
                /**
                 * Comment A
                 */
                @A
                @BB
                /* Comment C */
                @CCC
                // Comment D
                @DDDD
                property

                /**
                 * JSDoc comment that shouldn't move
                 */
                /**
                 * Comment A
                 */
                @A
                @BB
                /* Comment C */
                @CCC
                // Comment D
                @DDDD
                accessor field

                /**
                 * JSDoc comment that shouldn't move
                 */
                /**
                 * Comment A
                 */
                @A
                @BB
                /* Comment C */
                @CCC
                // Comment D
                @DDDD
                method(
                  /**
                   * JSDoc comment that shouldn't move
                   */
                  /**
                   * Comment A
                   */
                  @A
                  @BB
                  /* Comment C */
                  @CCC
                  // Comment D
                  @DDDD
                  parameter) {}

              }
            `,
            code: dedent`
              /**
               * JSDoc comment that shouldn't move
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
                 * JSDoc comment that shouldn't move
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
                 * JSDoc comment that shouldn't move
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
                 * JSDoc comment that shouldn't move
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
                   * JSDoc comment that shouldn't move
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
            errors: duplicate5Times([
              {
                data: {
                  left: 'BB',
                  right: 'A',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
              {
                data: {
                  left: 'DDDD',
                  right: 'CCC',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
            ]),
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts decorators with comments on the same line`,
      rule,
      {
        invalid: [
          {
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
            errors: duplicate5Times([
              {
                data: {
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
            ]),
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        invalid: [
          {
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
            errors: duplicate5Times([
              {
                data: {
                  left: 'NoPublicAttributeError',
                  rightGroup: 'unknown',
                  leftGroup: 'error',
                  right: 'Validated',
                },
                messageId: 'unexpectedDecoratorsGroupOrder',
              },
            ]),
            options: [
              {
                ...options,
                customGroups: {
                  error: 'Error$',
                },
                groups: ['unknown', 'error'],
              },
            ],
          },
        ],
        valid: [],
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
                customGroups: {
                  elementsWithoutFoo: '^(?!.*Foo).*$',
                },
                groups: ['unknown', 'elementsWithoutFoo'],
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
        invalid: [
          {
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
            errors: duplicate5Times([
              {
                data: {
                  left: 'Cc',
                  right: 'D',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
              {
                data: {
                  left: 'Aaaa',
                  right: 'E',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
              {
                data: {
                  right: 'Fff',
                  left: 'Gg',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
            ]),
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
        invalid: [
          {
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
            errors: duplicate5Times([
              {
                data: {
                  left: 'Aaa',
                  right: 'C',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
            ]),
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

    ruleTester.run(
      `${ruleName}(${type}): handles "fallbackSort" option`,
      rule,
      {
        invalid: [
          {
            output: dedent`
              @AA
              @C
              @B
              class Class {

                @AA
                @C
                @B
                property

                @AA
                @C
                @B
                accessor field

                @AA
                @C
                @B
                method(
                  @AA
                  @C
                  @B
                  parameter) {}
              }
            `,
            code: dedent`
              @AA
              @B
              @C
              class Class {

                @AA
                @B
                @C
                property

                @AA
                @B
                @C
                accessor field

                @AA
                @B
                @C
                method(
                  @AA
                  @B
                  @C
                  parameter) {}
              }
            `,
            options: [
              {
                ...options,
                fallbackSort: [
                  {
                    type: 'alphabetical',
                  },
                ],
                order: 'desc',
              },
            ],
            errors: duplicate5Times([
              {
                data: {
                  right: 'C',
                  left: 'B',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
            ]),
          },
          {
            output: dedent`
              @AA
              @B
              @C
              class Class {

                @AA
                @B
                @C
                property

                @AA
                @B
                @C
                accessor field

                @AA
                @B
                @C
                method(
                  @AA
                  @B
                  @C
                  parameter) {}
              }
            `,
            code: dedent`
              @AA
              @C
              @B
              class Class {

                @AA
                @C
                @B
                property

                @AA
                @C
                @B
                accessor field

                @AA
                @C
                @B
                method(
                  @AA
                  @C
                  @B
                  parameter) {}
              }
            `,
            options: [
              {
                ...options,
                fallbackSort: [
                  {
                    type: 'alphabetical',
                    order: 'asc',
                  },
                ],
                order: 'desc',
              },
            ],
            errors: duplicate5Times([
              {
                data: {
                  right: 'B',
                  left: 'C',
                },
                messageId: 'unexpectedDecoratorsOrder',
              },
            ]),
          },
        ],
        valid: [],
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
              options: [
                {
                  sortOnClasses: false,
                },
              ],
              code: dedent`
                @B
                @A
                class Class {}
              `,
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

    let eslintDisableRuleTesterName = `${ruleName}: supports 'eslint-disable' for individual nodes`
    ruleTester.run(eslintDisableRuleTesterName, rule, {
      invalid: [
        {
          output: dedent`
            @B
            @C
            @A // eslint-disable-line
            class Class {

              @B
              @C
              @A // eslint-disable-line
              property

              @B
              @C
              @A // eslint-disable-line
              accessor field

              @B
              @C
              @A // eslint-disable-line
              method(
                @B
                @C
                @A // eslint-disable-line
                parameter) {}
            }
          `,
          code: dedent`
            @C
            @B
            @A // eslint-disable-line
            class Class {

              @C
              @B
              @A // eslint-disable-line
              property

              @C
              @B
              @A // eslint-disable-line
              accessor field

              @C
              @B
              @A // eslint-disable-line
              method(
                @C
                @B
                @A // eslint-disable-line
                parameter) {}
            }
          `,
          errors: duplicate5Times([
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedDecoratorsOrder',
            },
          ]),
          options: [{}],
        },
        {
          output: dedent`
            @B
            @C
            @A // eslint-disable-line
            @D
            class Class {

              @B
              @C
              @A // eslint-disable-line
              @D
              property

              @B
              @C
              @A // eslint-disable-line
              @D
              accessor field

              @B
              @C
              @A // eslint-disable-line
              @D
              method(
                @B
                @C
                @A // eslint-disable-line
                @D
                parameter) {}
            }
          `,
          code: dedent`
            @D
            @C
            @A // eslint-disable-line
            @B
            class Class {

              @D
              @C
              @A // eslint-disable-line
              @B
              property

              @D
              @C
              @A // eslint-disable-line
              @B
              accessor field

              @D
              @C
              @A // eslint-disable-line
              @B
              method(
                @D
                @C
                @A // eslint-disable-line
                @B
                parameter) {}
            }
          `,
          errors: duplicate5Times([
            {
              data: {
                right: 'C',
                left: 'D',
              },
              messageId: 'unexpectedDecoratorsOrder',
            },
            {
              data: {
                right: 'B',
                left: 'A',
              },
              messageId: 'unexpectedDecoratorsOrder',
            },
          ]),
          options: [
            {
              partitionByComment: true,
            },
          ],
        },
        {
          output: dedent`
            @B
            @C
            /* eslint-disable-next-line */
            @A
            class Class {

              @B
              @C
              /* eslint-disable-next-line */
              @A
              property

              @B
              @C
              /* eslint-disable-next-line */
              @A
              accessor field

              @B
              @C
              /* eslint-disable-next-line */
              @A
              method(
                @B
                @C
                /* eslint-disable-next-line */
                @A
                parameter) {}
            }
          `,
          code: dedent`
            @C
            @B
            /* eslint-disable-next-line */
            @A
            class Class {

              @C
              @B
              /* eslint-disable-next-line */
              @A
              property

              @C
              @B
              /* eslint-disable-next-line */
              @A
              accessor field

              @C
              @B
              /* eslint-disable-next-line */
              @A
              method(
                @C
                @B
                /* eslint-disable-next-line */
                @A
                parameter) {}
            }
          `,
          errors: duplicate5Times([
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedDecoratorsOrder',
            },
          ]),
          options: [{}],
        },
        {
          output: dedent`
            @B
            @C
            @A /* eslint-disable-line */
            class Class {

              @B
              @C
              @A /* eslint-disable-line */
              property

              @B
              @C
              @A /* eslint-disable-line */
              accessor field

              @B
              @C
              @A /* eslint-disable-line */
              method(
                @B
                @C
                @A /* eslint-disable-line */
                parameter) {}
            }
          `,
          code: dedent`
            @C
            @B
            @A /* eslint-disable-line */
            class Class {

              @C
              @B
              @A /* eslint-disable-line */
              property

              @C
              @B
              @A /* eslint-disable-line */
              accessor field

              @C
              @B
              @A /* eslint-disable-line */
              method(
                @C
                @B
                @A /* eslint-disable-line */
                parameter) {}
            }
          `,
          errors: duplicate5Times([
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedDecoratorsOrder',
            },
          ]),
          options: [{}],
        },
        {
          output: dedent`
            @B
            @C
            // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
            @A
            class Class {

              @B
              @C
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              @A
              property

              @B
              @C
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              @A
              accessor field

              @B
              @C
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              @A
              method(
                @B
                @C
                // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
                @A
                parameter) {}
            }
          `,
          code: dedent`
            @C
            @B
            // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
            @A
            class Class {

              @C
              @B
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              @A
              property

              @C
              @B
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              @A
              accessor field

              @C
              @B
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              @A
              method(
                @C
                @B
                // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
                @A
                parameter) {}
            }
          `,
          errors: duplicate5Times([
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedDecoratorsOrder',
            },
          ]),
          options: [{}],
        },
        {
          output: dedent`
            @A
            @D
            /* eslint-disable */
            @C
            @B
            // Shouldn't move
            /* eslint-enable */
            @E
            class Class {

              @A
              @D
              /* eslint-disable */
              @C
              @B
              // Shouldn't move
              /* eslint-enable */
              @E
              property

              @A
              @D
              /* eslint-disable */
              @C
              @B
              // Shouldn't move
              /* eslint-enable */
              @E
              accessor field

              @A
              @D
              /* eslint-disable */
              @C
              @B
              // Shouldn't move
              /* eslint-enable */
              @E
              method(
                @A
                @D
                /* eslint-disable */
                @C
                @B
                // Shouldn't move
                /* eslint-enable */
                @E
                parameter) {}
            }
          `,
          code: dedent`
            @D
            @E
            /* eslint-disable */
            @C
            @B
            // Shouldn't move
            /* eslint-enable */
            @A
            class Class {

              @D
              @E
              /* eslint-disable */
              @C
              @B
              // Shouldn't move
              /* eslint-enable */
              @A
              property

              @D
              @E
              /* eslint-disable */
              @C
              @B
              // Shouldn't move
              /* eslint-enable */
              @A
              accessor field

              @D
              @E
              /* eslint-disable */
              @C
              @B
              // Shouldn't move
              /* eslint-enable */
              @A
              method(
                @D
                @E
                /* eslint-disable */
                @C
                @B
                // Shouldn't move
                /* eslint-enable */
                @A
                parameter) {}
            }
          `,
          errors: duplicate5Times([
            {
              data: {
                right: 'A',
                left: 'B',
              },
              messageId: 'unexpectedDecoratorsOrder',
            },
          ]),
          options: [{}],
        },
        {
          output: dedent`
            @B
            @C
            @A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            class Class {

              @B
              @C
              @A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
              property

              @B
              @C
              @A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
              accessor field

              @B
              @C
              @A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
              method(
                @B
                @C
                @A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
                parameter) {}
            }
          `,
          code: dedent`
            @C
            @B
            @A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            class Class {

              @C
              @B
              @A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
              property

              @C
              @B
              @A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
              accessor field

              @C
              @B
              @A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
              method(
                @C
                @B
                @A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
                parameter) {}
            }
          `,
          errors: duplicate5Times([
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedDecoratorsOrder',
            },
          ]),
          options: [{}],
        },
        {
          output: dedent`
            @B
            @C
            /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
            @A
            class Class {

              @B
              @C
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              @A
              property

              @B
              @C
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              @A
              accessor field

              @B
              @C
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              @A
              method(
                @B
                @C
                /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
                @A
                parameter) {}
            }
          `,
          code: dedent`
            @C
            @B
            /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
            @A
            class Class {

              @C
              @B
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              @A
              property

              @C
              @B
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              @A
              accessor field

              @C
              @B
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              @A
              method(
                @C
                @B
                /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
                @A
                parameter) {}
            }
          `,
          errors: duplicate5Times([
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedDecoratorsOrder',
            },
          ]),
          options: [{}],
        },
        {
          output: dedent`
            @B
            @C
            @A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            class Class {

              @B
              @C
              @A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
              property

              @B
              @C
              @A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
              accessor field

              @B
              @C
              @A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
              method(
                @B
                @C
                @A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
                parameter) {}
            }
          `,
          code: dedent`
            @C
            @B
            @A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            class Class {

              @C
              @B
              @A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
              property

              @C
              @B
              @A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
              accessor field

              @C
              @B
              @A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
              method(
                @C
                @B
                @A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
                parameter) {}
            }
          `,
          errors: duplicate5Times([
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedDecoratorsOrder',
            },
          ]),
          options: [{}],
        },
        {
          output: dedent`
            @A
            @D
            /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
            @C
            @B
            // Shouldn't move
            /* eslint-enable */
            @E
            class Class {

              @A
              @D
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              @C
              @B
              // Shouldn't move
              /* eslint-enable */
              @E
              property

              @A
              @D
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              @C
              @B
              // Shouldn't move
              /* eslint-enable */
              @E
              accessor field

              @A
              @D
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              @C
              @B
              // Shouldn't move
              /* eslint-enable */
              @E
              method(
                @A
                @D
                /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
                @C
                @B
                // Shouldn't move
                /* eslint-enable */
                @E
                parameter) {}
            }
          `,
          code: dedent`
            @D
            @E
            /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
            @C
            @B
            // Shouldn't move
            /* eslint-enable */
            @A
            class Class {

              @D
              @E
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              @C
              @B
              // Shouldn't move
              /* eslint-enable */
              @A
              property

              @D
              @E
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              @C
              @B
              // Shouldn't move
              /* eslint-enable */
              @A
              accessor field

              @D
              @E
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              @C
              @B
              // Shouldn't move
              /* eslint-enable */
              @A
              method(
                @D
                @E
                /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
                @C
                @B
                // Shouldn't move
                /* eslint-enable */
                @A
                parameter) {}
            }
          `,
          errors: duplicate5Times([
            {
              data: {
                right: 'A',
                left: 'B',
              },
              messageId: 'unexpectedDecoratorsOrder',
            },
          ]),
          options: [{}],
        },
      ],
      valid: [],
    })

    eslintRuleTester.run(
      `${ruleName}: handles non typescript-eslint parser`,
      rule as unknown as Rule.RuleModule,
      {
        valid: [
          {
            code: dedent`
              class A {

                property

                method() {}
              }
            `,
            options: [{}],
          },
        ],
        invalid: [],
      },
    )
  })
})

let duplicate5Times = (
  errors: TestCaseError<
    'unexpectedDecoratorsGroupOrder' | 'unexpectedDecoratorsOrder'
  >[],
): TestCaseError<
  'unexpectedDecoratorsGroupOrder' | 'unexpectedDecoratorsOrder'
>[] => Array.from({ length: 5 }, () => errors).flat()
