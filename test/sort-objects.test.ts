import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-objects'

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

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts object with identifier and literal keys`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Obj = {
                a: 'aaaa',
                b: 'bbb',
                [c]: 'cc',
                d: 'd',
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              let Obj = {
                a: 'aaaa',
                [c]: 'cc',
                b: 'bbb',
                d: 'd',
              }
            `,
            output: dedent`
              let Obj = {
                a: 'aaaa',
                b: 'bbb',
                [c]: 'cc',
                d: 'd',
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorting does not break object`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Obj = {
                b: 'bb',
                c: 'c',
                ...rest,
                a: 'aaa',
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              let Obj = {
                c: 'c',
                b: 'bb',
                ...rest,
                a: 'aaa',
              }
            `,
            output: dedent`
              let Obj = {
                b: 'bb',
                c: 'c',
                ...rest,
                a: 'aaa',
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): sorts objects in objects`, rule, {
      valid: [
        {
          code: dedent`
            let Obj = {
              x: {
                a: 'aa',
                b: 'b',
              },
              y: {
                a: 'aa',
                b: 'b',
              },
            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            let Obj = {
              y: {
                b: 'b',
                a: 'aa',
              },
              x: {
                b: 'b',
                a: 'aa',
              },
            }
          `,
          output: dedent`
            let Obj = {
              x: {
                b: 'b',
                a: 'aa',
              },
              y: {
                b: 'b',
                a: 'aa',
              },
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectsOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
            {
              messageId: 'unexpectedObjectsOrder',
              data: {
                left: 'y',
                right: 'x',
              },
            },
            {
              messageId: 'unexpectedObjectsOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): sorts objects computed keys`, rule, {
      valid: [
        {
          code: dedent`
            let Obj = {
              'a': 'aaa',
              [b()]: 'bb',
              [c[1]]: 'c',
            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            let Obj = {
              [c[1]]: 'c',
              [b()]: 'bb',
              'a': 'aaa',
            }
          `,
          output: dedent`
            let Obj = {
              'a': 'aaa',
              [b()]: 'bb',
              [c[1]]: 'c',
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectsOrder',
              data: {
                left: 'c[1]',
                right: 'b()',
              },
            },
            {
              messageId: 'unexpectedObjectsOrder',
              data: {
                left: 'b()',
                right: 'a',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): allows to set priority keys`, rule, {
      valid: [
        {
          code: dedent`
            let Obj = {
              b: 'bb',
              c: 'ccc',
              a: 'aaaa',
              d: 'd',
            }
          `,
          options: [
            {
              ...options,
              customGroups: { top: ['c', 'b'] },
              groups: ['top', 'unknown'],
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            let Obj = {
              a: 'aaaa',
              b: 'bb',
              c: 'ccc',
              d: 'd',
            }
          `,
          output: dedent`
            let Obj = {
              b: 'bb',
              c: 'ccc',
              a: 'aaaa',
              d: 'd',
            }
          `,
          options: [
            {
              ...options,
              customGroups: { top: ['c', 'b'] },
              groups: ['top', 'unknown'],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedObjectsOrder',
              data: {
                left: 'a',
                right: 'b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts with comments on the same line`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Obj = {
                a: 'aaa', // Comment A
                b: 'bb', // Comment B
                c: 'c' // Comment C
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              let Obj = {
                a: 'aaa', // Comment A
                c: 'c', // Comment C
                b: 'bb', // Comment B
              }
            `,
            output: dedent`
              let Obj = {
                a: 'aaa', // Comment A
                b: 'bb', // Comment B
                c: 'c', // Comment C
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): do not sorts objects without a comma and with a comment in the last element`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              let Obj = {
                b: 'b', // Comment B
                a: 'aa' // Comment A
              }
            `,
            output: dedent`
              let Obj = {
                a: 'aa', // Comment A
                b: 'b' // Comment B
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
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

    ruleTester.run(`${RULE_NAME}(${type}): sorts destructured object`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            let Func = ({
              c,
              a = 'aa',
              b
            }) => {
              // ...
            }
          `,
          output: dedent`
            let Func = ({
              a = 'aa',
              b,
              c
            }) => {
              // ...
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectsOrder',
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
      `${RULE_NAME}(${type}): does not sort keys if the right value depends on the left value`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              let Func = ({
                c,
                b = c,
                a = 'a',
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a = 'a',
                c,
                b = c,
                d,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
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
      `${RULE_NAME}(${type}): works with complex dependencies`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              let Func = ({
                a,
                b = a + c + d,
                c,
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a,
                c,
                d,
                b = a + c + d,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'b',
                  right: 'c',
                },
              },
            ],
          },
          {
            code: dedent`
              let Func = ({
                a,
                b = () => a + c,
                c,
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a,
                c,
                b = () => a + c,
                d,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'b',
                  right: 'c',
                },
              },
            ],
          },
          {
            code: dedent`
              let Func = ({
                a,
                c = 1 === 1 ? 1 === 1 ? a : b : b,
                b,
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a,
                b,
                c = 1 === 1 ? 1 === 1 ? a : b : b,
                d,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
          {
            code: dedent`
              let Func = ({
                a,
                b = ['a', 'b', 'c'].includes(d, c, a),
                c,
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a,
                c,
                d,
                b = ['a', 'b', 'c'].includes(d, c, a),
              }) => {
                // ...
              }
            `,
            options: [
              {
                type: 'alphabetical',
                order: 'asc',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'b',
                  right: 'c',
                },
              },
            ],
          },
          {
            code: dedent`
              let Func = ({
                a,
                b = c || c,
                c,
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a,
                c,
                b = c || c,
                d,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'b',
                  right: 'c',
                },
              },
            ],
          },
          {
            code: dedent`
              let Func = ({
                a,
                b = 1 === 1 ? a : c,
                c,
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a,
                c,
                b = 1 === 1 ? a : c,
                d,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'b',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to use partition comments`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              let Obj = {
                // Part: 1
                e: 'ee',
                d: 'ddd',
                // Part: 2
                f: 'f',
                // Part: 3
                a: 'aaaaaa',
                c: 'cccc',
                // Not partition comment
                b: 'bbbbb',
              }
            `,
            output: dedent`
              let Obj = {
                // Part: 1
                d: 'ddd',
                e: 'ee',
                // Part: 2
                f: 'f',
                // Part: 3
                a: 'aaaaaa',
                // Not partition comment
                b: 'bbbbb',
                c: 'cccc',
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
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'e',
                  right: 'd',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to use all comments as parts`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Obj = {
                // Some comment
                b: 'b',
                // Other comment
                a: 'aa',
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
      `${RULE_NAME}(${type}): allows to use multiple partition comments`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              let Object = {
                /* Partition Comment */
                // Part: 1
                c: 'cc',
                // Part: 2
                b: 'bbb',
                a: 'aaaa',
                d: 'd',
                /* Part: 3 */
                e: 'e',
              }
            `,
            output: dedent`
              let Object = {
                /* Partition Comment */
                // Part: 1
                c: 'cc',
                // Part: 2
                a: 'aaaa',
                b: 'bbb',
                d: 'd',
                /* Part: 3 */
                e: 'e',
              }
            `,
            options: [
              {
                ...options,
                partitionByComment: ['Partition Comment', 'Part: *'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
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
      `${RULE_NAME}(${type}): allows to use new line as partition`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Obj = {
                d: 'dd',
                e: 'e',

                c: 'ccc',

                a: 'aaaaa',
                b: 'bbbb',
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
              let Obj = {
                e: 'e',
                d: 'dd',

                c: 'ccc',

                b: 'bbbb',
                a: 'aaaaa',
              }
            `,
            output: dedent`
              let Obj = {
                d: 'dd',
                e: 'e',

                c: 'ccc',

                a: 'aaaaa',
                b: 'bbbb',
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
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'e',
                  right: 'd',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
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
  })

  describe(`${RULE_NAME}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts object with identifier and literal keys`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Obj = {
                a: 'aaaa',
                b: 'bbb',
                [c]: 'cc',
                d: 'd',
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              let Obj = {
                a: 'aaaa',
                [c]: 'cc',
                b: 'bbb',
                d: 'd',
              }
            `,
            output: dedent`
              let Obj = {
                a: 'aaaa',
                b: 'bbb',
                [c]: 'cc',
                d: 'd',
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorting does not break object`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Obj = {
                b: 'bb',
                c: 'c',
                ...rest,
                a: 'aaa',
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              let Obj = {
                c: 'c',
                b: 'bb',
                ...rest,
                a: 'aaa',
              }
            `,
            output: dedent`
              let Obj = {
                b: 'bb',
                c: 'c',
                ...rest,
                a: 'aaa',
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): sorts objects in objects`, rule, {
      valid: [
        {
          code: dedent`
            let Obj = {
              x: {
                a: 'aa',
                b: 'b',
              },
              y: {
                a: 'aa',
                b: 'b',
              },
            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            let Obj = {
              y: {
                b: 'b',
                a: 'aa',
              },
              x: {
                b: 'b',
                a: 'aa',
              },
            }
          `,
          output: dedent`
            let Obj = {
              x: {
                b: 'b',
                a: 'aa',
              },
              y: {
                b: 'b',
                a: 'aa',
              },
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectsOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
            {
              messageId: 'unexpectedObjectsOrder',
              data: {
                left: 'y',
                right: 'x',
              },
            },
            {
              messageId: 'unexpectedObjectsOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): sorts objects computed keys`, rule, {
      valid: [
        {
          code: dedent`
            let Obj = {
              'a': 'aaa',
              [b()]: 'bb',
              [c[1]]: 'c',
            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            let Obj = {
              [c[1]]: 'c',
              [b()]: 'bb',
              'a': 'aaa',
            }
          `,
          output: dedent`
            let Obj = {
              'a': 'aaa',
              [b()]: 'bb',
              [c[1]]: 'c',
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectsOrder',
              data: {
                left: 'c[1]',
                right: 'b()',
              },
            },
            {
              messageId: 'unexpectedObjectsOrder',
              data: {
                left: 'b()',
                right: 'a',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): allows to set priority keys`, rule, {
      valid: [
        {
          code: dedent`
            let Obj = {
              b: 'bb',
              c: 'ccc',
              a: 'aaaa',
              d: 'd',
            }
          `,
          options: [
            {
              ...options,
              customGroups: { top: ['c', 'b'] },
              groups: ['top', 'unknown'],
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            let Obj = {
              a: 'aaaa',
              b: 'bb',
              c: 'ccc',
              d: 'd',
            }
          `,
          output: dedent`
            let Obj = {
              b: 'bb',
              c: 'ccc',
              a: 'aaaa',
              d: 'd',
            }
          `,
          options: [
            {
              ...options,
              customGroups: { top: ['c', 'b'] },
              groups: ['top', 'unknown'],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedObjectsOrder',
              data: {
                left: 'a',
                right: 'b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts with comments on the same line`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Obj = {
                a: 'aaa', // Comment A
                b: 'bb', // Comment B
                c: 'c', // Comment C
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              let Obj = {
                a: 'aaa', // Comment A
                c: 'c', // Comment C
                b: 'bb', // Comment B
              }
            `,
            output: dedent`
              let Obj = {
                a: 'aaa', // Comment A
                b: 'bb', // Comment B
                c: 'c', // Comment C
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): do not sorts objects without a comma and with a comment in the last element`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              let Obj = {
                b: 'b', // Comment B
                a: 'aa' // Comment A
              }
            `,
            output: dedent`
              let Obj = {
                a: 'aa', // Comment A
                b: 'b' // Comment B
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
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

    ruleTester.run(`${RULE_NAME}(${type}): sorts destructured object`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            let Func = ({
              c,
              a = 'aa',
              b
            }) => {
              // ...
            }
          `,
          output: dedent`
            let Func = ({
              a = 'aa',
              b,
              c
            }) => {
              // ...
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectsOrder',
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
      `${RULE_NAME}(${type}): does not sort keys if the right value depends on the left value`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              let Func = ({
                c,
                b = c,
                a = 'a',
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a = 'a',
                c,
                b = c,
                d,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
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
      `${RULE_NAME}(${type}): works with complex dependencies`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              let Func = ({
                a,
                b = a + c + d,
                c,
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a,
                c,
                d,
                b = a + c + d,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'b',
                  right: 'c',
                },
              },
            ],
          },
          {
            code: dedent`
              let Func = ({
                a,
                b = () => a + c,
                c,
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a,
                c,
                b = () => a + c,
                d,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'b',
                  right: 'c',
                },
              },
            ],
          },
          {
            code: dedent`
              let Func = ({
                a,
                c = 1 === 1 ? 1 === 1 ? a : b : b,
                b,
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a,
                b,
                c = 1 === 1 ? 1 === 1 ? a : b : b,
                d,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
          {
            code: dedent`
              let Func = ({
                a,
                b = ['a', 'b', 'c'].includes(d, c, a),
                c,
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a,
                c,
                d,
                b = ['a', 'b', 'c'].includes(d, c, a),
              }) => {
                // ...
              }
            `,
            options: [
              {
                type: 'alphabetical',
                order: 'asc',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'b',
                  right: 'c',
                },
              },
            ],
          },
          {
            code: dedent`
              let Func = ({
                a,
                b = c || c,
                c,
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a,
                c,
                b = c || c,
                d,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'b',
                  right: 'c',
                },
              },
            ],
          },
          {
            code: dedent`
              let Func = ({
                a,
                b = 1 === 1 ? a : c,
                c,
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a,
                c,
                b = 1 === 1 ? a : c,
                d,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'b',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to use partition comments`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              let Obj = {
                // Part: 1
                e: 'ee',
                d: 'ddd',
                // Part: 2
                f: 'f',
                // Part: 3
                a: 'aaaaaa',
                c: 'cccc',
                // Not partition comment
                b: 'bbbbb',
              }
            `,
            output: dedent`
              let Obj = {
                // Part: 1
                d: 'ddd',
                e: 'ee',
                // Part: 2
                f: 'f',
                // Part: 3
                a: 'aaaaaa',
                // Not partition comment
                b: 'bbbbb',
                c: 'cccc',
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
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'e',
                  right: 'd',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to use all comments as parts`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Obj = {
                // Some comment
                b: 'b',
                // Other comment
                a: 'aa',
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
      `${RULE_NAME}(${type}): allows to use multiple partition comments`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              let Object = {
                /* Partition Comment */
                // Part: 1
                c: 'cc',
                // Part: 2
                b: 'bbb',
                a: 'aaaa',
                d: 'd',
                /* Part: 3 */
                e: 'e',
              }
            `,
            output: dedent`
              let Object = {
                /* Partition Comment */
                // Part: 1
                c: 'cc',
                // Part: 2
                a: 'aaaa',
                b: 'bbb',
                d: 'd',
                /* Part: 3 */
                e: 'e',
              }
            `,
            options: [
              {
                ...options,
                partitionByComment: ['Partition Comment', 'Part: *'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
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
      `${RULE_NAME}(${type}): allows to use new line as partition`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Obj = {
                d: 'dd',
                e: 'e',

                c: 'ccc',

                a: 'aaaaa',
                b: 'bbbb',
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
              let Obj = {
                e: 'e',
                d: 'dd',

                c: 'ccc',

                b: 'bbbb',
                a: 'aaaaa',
              }
            `,
            output: dedent`
              let Obj = {
                d: 'dd',
                e: 'e',

                c: 'ccc',

                a: 'aaaaa',
                b: 'bbbb',
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
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'e',
                  right: 'd',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
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
  })

  describe(`${RULE_NAME}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts object with identifier and literal keys`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Obj = {
                a: 'aaaa',
                [c]: 'cc',
                b: 'bbb',
                d: 'd',
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              let Obj = {
                a: 'aaaa',
                b: 'bbb',
                d: 'd',
                [c]: 'cc',
              }
            `,
            output: dedent`
              let Obj = {
                a: 'aaaa',
                [c]: 'cc',
                b: 'bbb',
                d: 'd',
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'd',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorting does not break object`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Obj = {
                b: 'bb',
                c: 'c',
                ...rest,
                a: 'aaa',
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              let Obj = {
                c: 'c',
                b: 'bb',
                ...rest,
                a: 'aaa',
              }
            `,
            output: dedent`
              let Obj = {
                b: 'bb',
                c: 'c',
                ...rest,
                a: 'aaa',
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): sorts objects in objects`, rule, {
      valid: [
        {
          code: dedent`
            let Obj = {
              x: {
                a: 'aa',
                b: 'b',
              },
              y: {
                a: 'aa',
                b: 'b',
              },
            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            let Obj = {
              x: {
                b: 'b',
                a: 'aa',
              },
              y: {
                b: 'b',
                a: 'aa',
              },
            }
          `,
          output: dedent`
            let Obj = {
              x: {
                a: 'aa',
                b: 'b',
              },
              y: {
                a: 'aa',
                b: 'b',
              },
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectsOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
            {
              messageId: 'unexpectedObjectsOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): sorts objects computed keys`, rule, {
      valid: [
        {
          code: dedent`
            let Obj = {
              [b()]: 'bb',
              [c[1]]: 'c',
              'a': 'aaa',
            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            let Obj = {
              'a': 'aaa',
              [b()]: 'bb',
              [c[1]]: 'c',
            }
          `,
          output: dedent`
            let Obj = {
              [b()]: 'bb',
              [c[1]]: 'c',
              'a': 'aaa',
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectsOrder',
              data: {
                left: 'a',
                right: 'b()',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): allows to set priority keys`, rule, {
      valid: [
        {
          code: dedent`
            let Obj = {
              c: 'ccc',
              b: 'bb',
              a: 'aaaa',
              d: 'd',
            }
          `,
          options: [
            {
              ...options,
              customGroups: { top: ['c', 'b'] },
              groups: ['top', 'unknown'],
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            let Obj = {
              a: 'aaaa',
              b: 'bb',
              c: 'ccc',
              d: 'd',
            }
          `,
          output: dedent`
            let Obj = {
              c: 'ccc',
              b: 'bb',
              a: 'aaaa',
              d: 'd',
            }
          `,
          options: [
            {
              ...options,
              customGroups: { top: ['c', 'b'] },
              groups: ['top', 'unknown'],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedObjectsOrder',
              data: {
                left: 'a',
                right: 'b',
              },
            },
            {
              messageId: 'unexpectedObjectsOrder',
              data: {
                left: 'b',
                right: 'c',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts with comments on the same line`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Obj = {
                a: 'aaa', // Comment A
                b: 'bb', // Comment B
                c: 'c' // Comment C
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              let Obj = {
                a: 'aaa', // Comment A
                c: 'c', // Comment C
                b: 'bb', // Comment B
              }
            `,
            output: dedent`
              let Obj = {
                a: 'aaa', // Comment A
                b: 'bb', // Comment B
                c: 'c', // Comment C
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): do not sorts objects without a comma and with a comment in the last element`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              let Obj = {
                b: 'b', // Comment B
                a: 'aa' // Comment A
              }
            `,
            output: dedent`
              let Obj = {
                a: 'aa', // Comment A
                b: 'b' // Comment B
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
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

    ruleTester.run(`${RULE_NAME}(${type}): sorts destructured object`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            let Func = ({
              c,
              a = 'aa',
              b
            }) => {
              // ...
            }
          `,
          output: dedent`
            let Func = ({
              a = 'aa',
              c,
              b
            }) => {
              // ...
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectsOrder',
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
      `${RULE_NAME}(${type}): does not sort keys if the right value depends on the left value`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              let Func = ({
                c,
                b = c,
                a = 'a',
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a = 'a',
                c,
                b = c,
                d,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
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
      `${RULE_NAME}(${type}): works with complex dependencies`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              let Func = ({
                a,
                b = a + c + d,
                c,
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a,
                c,
                d,
                b = a + c + d,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'b',
                  right: 'c',
                },
              },
            ],
          },
          {
            code: dedent`
              let Func = ({
                a,
                b = () => a + c,
                c,
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a,
                c,
                b = () => a + c,
                d,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'b',
                  right: 'c',
                },
              },
            ],
          },
          {
            code: dedent`
              let Func = ({
                a,
                c = 1 === 1 ? 1 === 1 ? a : b : b,
                b,
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a,
                b,
                c = 1 === 1 ? 1 === 1 ? a : b : b,
                d,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
          {
            code: dedent`
              let Func = ({
                a,
                b = ['a', 'b', 'c'].includes(d, c, a),
                c,
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a,
                c,
                d,
                b = ['a', 'b', 'c'].includes(d, c, a),
              }) => {
                // ...
              }
            `,
            options: [
              {
                type: 'alphabetical',
                order: 'asc',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'b',
                  right: 'c',
                },
              },
            ],
          },
          {
            code: dedent`
              let Func = ({
                a,
                b = 1 === 1 ? a : c,
                c,
                d,
              }) => {
                // ...
              }
            `,
            output: dedent`
              let Func = ({
                a,
                c,
                b = 1 === 1 ? a : c,
                d,
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'b',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to use partition comments`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              let Obj = {
                // Part: 1
                e: 'ee',
                d: 'ddd',
                // Part: 2
                f: 'f',
                // Part: 3
                a: 'aaaaaa',
                c: 'cccc',
                // Not partition comment
                b: 'bbbbb',
              }
            `,
            output: dedent`
              let Obj = {
                // Part: 1
                d: 'ddd',
                e: 'ee',
                // Part: 2
                f: 'f',
                // Part: 3
                a: 'aaaaaa',
                // Not partition comment
                b: 'bbbbb',
                c: 'cccc',
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
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'e',
                  right: 'd',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to use all comments as parts`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Obj = {
                // Some comment
                b: 'b',
                // Other comment
                a: 'aa',
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
      `${RULE_NAME}(${type}): allows to use multiple partition comments`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              let Object = {
                /* Partition Comment */
                // Part: 1
                c: 'cc',
                // Part: 2
                b: 'bbb',
                a: 'aaaa',
                d: 'd',
                /* Part: 3 */
                e: 'e',
              }
            `,
            output: dedent`
              let Object = {
                /* Partition Comment */
                // Part: 1
                c: 'cc',
                // Part: 2
                a: 'aaaa',
                b: 'bbb',
                d: 'd',
                /* Part: 3 */
                e: 'e',
              }
            `,
            options: [
              {
                ...options,
                partitionByComment: ['Partition Comment', 'Part: *'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
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
      `${RULE_NAME}(${type}): not changes order if the same length`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              export const test = {
                a: 'a',
                b: 'b',
                c: 'c',
                d: 'd1',
                e: 'e12',
              }
            `,
            output: dedent`
              export const test = {
                e: 'e12',
                d: 'd1',
                a: 'a',
                b: 'b',
                c: 'c',
              }
            `,
            options: [
              {
                ...options,
                partitionByComment: [
                  'Public Safety Bureau',
                  'Crime Coefficient: *',
                  'Victims',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'c',
                  right: 'd',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'd',
                  right: 'e',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to use new line as partition`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Obj = {
                d: 'dd',
                e: 'e',

                c: 'ccc',

                a: 'aaaaa',
                b: 'bbbb',
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
              let Obj = {
                e: 'e',
                d: 'dd',

                c: 'ccc',

                b: 'bbbb',
                a: 'aaaaa',
              }
            `,
            output: dedent`
              let Obj = {
                d: 'dd',
                e: 'e',

                c: 'ccc',

                a: 'aaaaa',
                b: 'bbbb',
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
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'e',
                  right: 'd',
                },
              },
              {
                messageId: 'unexpectedObjectsOrder',
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
  })

  describe(`${RULE_NAME}: misc`, () => {
    ruleTester.run(
      `${RULE_NAME}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          dedent`
              let Obj = {
                a: 'a',
                b: 'b',
                c: 'c',
              }
            `,
          {
            code: dedent`
                const calculator = {
                  log: () => undefined,
                  log10: () => undefined,
                  log1p: () => undefined,
                  log2: () => undefined,
                }
              `,
            options: [{}],
          },
        ],
        invalid: [
          {
            code: dedent`
                let Obj = {
                  a: 'a',
                  c: 'c',
                  b: 'b',
                }
              `,
            output: dedent`
                let Obj = {
                  a: 'a',
                  b: 'b',
                  c: 'c',
                }
              `,
            errors: [
              {
                messageId: 'unexpectedObjectsOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}: allow to disable rule for styledComponents`,
      rule,
      {
        valid: [
          {
            code: dedent`
                const Box = styled.div({
                  background: "red",
                  width: "50px",
                  height: "50px",
                })
              `,
            options: [
              {
                styledComponents: false,
              },
            ],
          },
          {
            code: dedent`
                const PropsBox = styled.div((props) => ({
                  background: props.background,
                  height: "50px",
                  width: "50px",
                }))
              `,
            options: [
              {
                styledComponents: false,
              },
            ],
          },
          {
            code: dedent`
                export default styled('div')(() => ({
                  borderRadius: 0,
                  borderWidth: 0,
                  border: 0,
                  borderBottom: hasBorder && \`1px solid \${theme.palette.divider}\`,
                }))
              `,
            options: [
              {
                styledComponents: false,
              },
            ],
          },
          {
            code: dedent`
              const headerClass = css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '3',
                gridGap: '8',
              });
            `,
            options: [
              {
                styledComponents: false,
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(`${RULE_NAME}: allow to ignore pattern`, rule, {
      valid: [
        {
          code: dedent`
            const buttonStyles = {
              background: "red",
              display: 'flex',
              flexDirection: 'column',
              width: "50px",
              height: "50px",
            }
          `,
          options: [
            {
              ignorePattern: ['*Styles'],
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            export default {
              methods: {
                foo() {},
                bar() {},
                baz() {},
              },
              data() {
                return {
                  background: "red",
                  display: 'flex',
                  flexDirection: 'column',
                  width: "50px",
                  height: "50px",
                }
              },
            }
          `,
          output: dedent`
            export default {
              data() {
                return {
                  background: "red",
                  display: 'flex',
                  flexDirection: 'column',
                  width: "50px",
                  height: "50px",
                }
              },
              methods: {
                foo() {},
                bar() {},
                baz() {},
              },
            }
          `,
          options: [
            {
              ignorePattern: ['data', 'methods'],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedObjectsOrder',
              data: {
                left: 'methods',
                right: 'data',
              },
            },
          ],
        },
      ],
    })
  })
})
