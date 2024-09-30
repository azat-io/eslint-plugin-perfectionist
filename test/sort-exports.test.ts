import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule from '../rules/sort-exports'

let ruleName = 'sort-exports'

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

    ruleTester.run(`${ruleName}(${type}): sorts exports`, rule, {
      valid: [
        {
          code: dedent`
            export { a1 } from 'a'
            export { b1, b2 } from 'b'
            export { c1, c2, c3 } from 'c'
            export { d1, d2 } from 'd'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export { b1, b2 } from 'b'
            export { a1 } from 'a'
            export { d1, d2 } from 'd'
            export { c1, c2, c3 } from 'c'
          `,
          output: dedent`
            export { a1 } from 'a'
            export { b1, b2 } from 'b'
            export { c1, c2, c3 } from 'c'
            export { d1, d2 } from 'd'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'd',
                right: 'c',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts all-exports`, rule, {
      valid: [
        {
          code: dedent`
            export { a1 } from './a'
            export * as b from './b'
            export { c1, c2 } from './c'
            export { d } from './d'
            export * from 'e'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export * as b from './b'
            export { a1 } from './a'
            export { c1, c2 } from './c'
            export * from 'e'
            export { d } from './d'
          `,
          output: dedent`
            export { a1 } from './a'
            export * as b from './b'
            export { c1, c2 } from './c'
            export { d } from './d'
            export * from 'e'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './b',
                right: './a',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'e',
                right: './d',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): works with export aliases`, rule, {
      valid: [
        {
          code: dedent`
            export { a1 as aX } from './a'
            export { default as b } from './b'
            export { c1, c2 } from './c'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export { a1 as aX } from './a'
            export { c1, c2 } from './c'
            export { default as b } from './b'
          `,
          output: dedent`
            export { a1 as aX } from './a'
            export { default as b } from './b'
            export { c1, c2 } from './c'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './c',
                right: './b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              export * from "./organisms";
              export * from "./atoms";
              export * from "./shared";

              export { AnotherNamed } from './second-folder';
              export { Named } from './folder';
            `,
            output: dedent`
              export * from "./atoms";
              export * from "./organisms";
              export * from "./shared";

              export { Named } from './folder';
              export { AnotherNamed } from './second-folder';
            `,
            options: [
              {
                ...options,
                partitionByNewLine: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedExportsOrder',
                data: {
                  left: './organisms',
                  right: './atoms',
                },
              },
              {
                messageId: 'unexpectedExportsOrder',
                data: {
                  left: './second-folder',
                  right: './folder',
                },
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
          valid: [],
          invalid: [
            {
              code: dedent`
                // Part: A
                export * from './cc';
                export * from './d';
                // Not partition comment
                export * from './bbb';
                // Part: B
                export * from './aaaa';
                export * from './e';
                // Part: C
                export * from './gg';
                // Not partition comment
                export * from './fff';
              `,
              output: dedent`
                // Part: A
                // Not partition comment
                export * from './bbb';
                export * from './cc';
                export * from './d';
                // Part: B
                export * from './aaaa';
                export * from './e';
                // Part: C
                // Not partition comment
                export * from './fff';
                export * from './gg';
              `,
              options: [
                {
                  ...options,
                  partitionByComment: 'Part**',
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedExportsOrder',
                  data: {
                    left: './d',
                    right: './bbb',
                  },
                },
                {
                  messageId: 'unexpectedExportsOrder',
                  data: {
                    left: './gg',
                    right: './fff',
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
                // Comment
                export * from './bb';
                // Other comment
                export * from './a';
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
                export * from './d'
                // Part: B
                export * from './aaa'
                export * from './c'
                export * from './bb'
                /* Other */
                export * from './e'
              `,
              output: dedent`
                /* Partition Comment */
                // Part: A
                export * from './d'
                // Part: B
                export * from './aaa'
                export * from './bb'
                export * from './c'
                /* Other */
                export * from './e'
              `,
              options: [
                {
                  ...options,
                  partitionByComment: ['Partition Comment', 'Part: *', 'Other'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedExportsOrder',
                  data: {
                    left: './c',
                    right: './bb',
                  },
                },
              ],
            },
          ],
        },
      )
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex matcher for partition comments`,
      rule,
      {
        valid: [
          {
            code: dedent`
              export * from './e'
              export * from './f'
              // I am a partition comment because I don't have f o o
              export * from './a'
              export * from './b'
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

    ruleTester.run(`${ruleName}(${type}): sorts by group kind`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            export type { F } from "./f";
            export type { D } from "./d";
            export type { E } from "./e";
            export { C } from "./c";
            export { A } from "./a";
            export { B } from "./b";
          `,
          output: dedent`
            export { A } from "./a";
            export { B } from "./b";
            export { C } from "./c";
            export type { D } from "./d";
            export type { E } from "./e";
            export type { F } from "./f";
          `,
          options: [
            {
              ...options,
              groupKind: 'values-first',
            },
          ],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './f',
                right: './d',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './e',
                right: './c',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './c',
                right: './a',
              },
            },
          ],
        },
        {
          code: dedent`
            export { C } from "./c";
            export { A } from "./a";
            export { B } from "./b";
            export type { F } from "./f";
            export type { D } from "./d";
            export type { E } from "./e";
          `,
          output: dedent`
            export type { D } from "./d";
            export type { E } from "./e";
            export type { F } from "./f";
            export { A } from "./a";
            export { B } from "./b";
            export { C } from "./c";
          `,
          options: [
            {
              ...options,
              groupKind: 'types-first',
            },
          ],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './c',
                right: './a',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './b',
                right: './f',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './f',
                right: './d',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${ruleName}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts exports`, rule, {
      valid: [
        {
          code: dedent`
            export { a1 } from 'a'
            export { b1, b2 } from 'b'
            export { c1, c2, c3 } from 'c'
            export { d1, d2 } from 'd'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export { b1, b2 } from 'b'
            export { a1 } from 'a'
            export { d1, d2 } from 'd'
            export { c1, c2, c3 } from 'c'
          `,
          output: dedent`
            export { a1 } from 'a'
            export { b1, b2 } from 'b'
            export { c1, c2, c3 } from 'c'
            export { d1, d2 } from 'd'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'd',
                right: 'c',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts all-exports`, rule, {
      valid: [
        {
          code: dedent`
            export { a1 } from './a'
            export * as b from './b'
            export { c1, c2 } from './c'
            export { d } from './d'
            export * from 'e'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export * as b from './b'
            export { a1 } from './a'
            export { c1, c2 } from './c'
            export * from 'e'
            export { d } from './d'
          `,
          output: dedent`
            export { a1 } from './a'
            export * as b from './b'
            export { c1, c2 } from './c'
            export { d } from './d'
            export * from 'e'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './b',
                right: './a',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'e',
                right: './d',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): works with export aliases`, rule, {
      valid: [
        {
          code: dedent`
            export { a1 as aX } from './a'
            export { default as b } from './b'
            export { c1, c2 } from './c'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export { a1 as aX } from './a'
            export { c1, c2 } from './c'
            export { default as b } from './b'
          `,
          output: dedent`
            export { a1 as aX } from './a'
            export { default as b } from './b'
            export { c1, c2 } from './c'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './c',
                right: './b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              export * from "./organisms";
              export * from "./atoms";
              export * from "./shared";

              export { AnotherNamed } from './second-folder';
              export { Named } from './folder';
            `,
            output: dedent`
              export * from "./atoms";
              export * from "./organisms";
              export * from "./shared";

              export { Named } from './folder';
              export { AnotherNamed } from './second-folder';
            `,
            options: [
              {
                ...options,
                partitionByNewLine: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedExportsOrder',
                data: {
                  left: './organisms',
                  right: './atoms',
                },
              },
              {
                messageId: 'unexpectedExportsOrder',
                data: {
                  left: './second-folder',
                  right: './folder',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts by group kind`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            export type { F } from "./f";
            export type { D } from "./d";
            export type { E } from "./e";
            export { C } from "./c";
            export { A } from "./a";
            export { B } from "./b";
          `,
          output: dedent`
            export { A } from "./a";
            export { B } from "./b";
            export { C } from "./c";
            export type { D } from "./d";
            export type { E } from "./e";
            export type { F } from "./f";
          `,
          options: [
            {
              ...options,
              groupKind: 'values-first',
            },
          ],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './f',
                right: './d',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './e',
                right: './c',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './c',
                right: './a',
              },
            },
          ],
        },
        {
          code: dedent`
            export { C } from "./c";
            export { A } from "./a";
            export { B } from "./b";
            export type { F } from "./f";
            export type { D } from "./d";
            export type { E } from "./e";
          `,
          output: dedent`
            export type { D } from "./d";
            export type { E } from "./e";
            export type { F } from "./f";
            export { A } from "./a";
            export { B } from "./b";
            export { C } from "./c";
          `,
          options: [
            {
              ...options,
              groupKind: 'types-first',
            },
          ],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './c',
                right: './a',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './b',
                right: './f',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './f',
                right: './d',
              },
            },
          ],
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

    ruleTester.run(`${ruleName}(${type}): sorts exports`, rule, {
      valid: [
        {
          code: dedent`
            export { c1, c2, c3 } from 'c'
            export { b1, b2 } from 'b'
            export { d1, d2 } from 'd'
            export { a1 } from 'a'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export { b1, b2 } from 'b'
            export { a1 } from 'a'
            export { d1, d2 } from 'd'
            export { c1, c2, c3 } from 'c'
          `,
          output: dedent`
            export { c1, c2, c3 } from 'c'
            export { b1, b2 } from 'b'
            export { d1, d2 } from 'd'
            export { a1 } from 'a'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'a',
                right: 'd',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'd',
                right: 'c',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts all-exports`, rule, {
      valid: [
        {
          code: dedent`
            export { c1, c2 } from './c'
            export { a1 } from './a'
            export * as b from './b'
            export { d } from './d'
            export * from 'e'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export * as b from './b'
            export { a1 } from './a'
            export { c1, c2 } from './c'
            export * from 'e'
            export { d } from './d'
          `,
          output: dedent`
            export { c1, c2 } from './c'
            export * as b from './b'
            export { a1 } from './a'
            export { d } from './d'
            export * from 'e'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './a',
                right: './c',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'e',
                right: './d',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): works with export aliases`, rule, {
      valid: [
        {
          code: dedent`
            export { default as b } from './b'
            export { a1 as aX } from './a'
            export { c1, c2 } from './c'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export { a1 as aX } from './a'
            export { c1, c2 } from './c'
            export { default as b } from './b'
          `,
          output: dedent`
            export { default as b } from './b'
            export { a1 as aX } from './a'
            export { c1, c2 } from './c'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './c',
                right: './b',
              },
            },
          ],
        },
      ],
    })
  })

  describe('misc', () => {
    ruleTester.run(
      `${ruleName}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          dedent`
            export { a } from '~/a'
            export { b } from '~/b'
            export { c } from '~/c'
            export { d } from '~/d'
          `,
          {
            code: dedent`
              export { log } from './log'
              export { log10 } from './log10'
              export { log1p } from './log1p'
              export { log2 } from './log2'
            `,
            options: [{}],
          },
        ],
        invalid: [
          {
            code: dedent`
              export { a } from '~/a'
              export { c } from '~/c'
              export { b } from '~/b'
              export { d } from '~/d'
            `,
            output: dedent`
              export { a } from '~/a'
              export { b } from '~/b'
              export { c } from '~/c'
              export { d } from '~/d'
            `,
            errors: [
              {
                messageId: 'unexpectedExportsOrder',
                data: {
                  left: '~/c',
                  right: '~/b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}: ignores exported variables or functions`,
      rule,
      {
        valid: [
          dedent`
            export let a = () => {
              // ...
            }

            export let b = () => {
              // ...
            }

            export let c = ''
          `,
        ],
        invalid: [],
      },
    )
  })
})
