import type { Rule } from 'eslint'

import { RuleTester } from '@typescript-eslint/rule-tester'
import { RuleTester as EslintRuleTester } from 'eslint'
import { afterAll, describe, it } from 'vitest'
import dedent from 'dedent'

import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-exports'

let ruleName = 'sort-exports'

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

    ruleTester.run(`${ruleName}(${type}): sorts exports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedExportsOrder',
            },
            {
              data: {
                right: 'c',
                left: 'd',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { a1 } from 'a'
            export { b1, b2 } from 'b'
            export { c1, c2, c3 } from 'c'
            export { d1, d2 } from 'd'
          `,
          code: dedent`
            export { b1, b2 } from 'b'
            export { a1 } from 'a'
            export { d1, d2 } from 'd'
            export { c1, c2, c3 } from 'c'
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}(${type}): sorts all-exports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: './a',
                left: './b',
              },
              messageId: 'unexpectedExportsOrder',
            },
            {
              data: {
                right: './d',
                left: 'e',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { a1 } from './a'
            export * as b from './b'
            export { c1, c2 } from './c'
            export { d } from './d'
            export * from 'e'
          `,
          code: dedent`
            export * as b from './b'
            export { a1 } from './a'
            export { c1, c2 } from './c'
            export * from 'e'
            export { d } from './d'
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}(${type}): works with export aliases`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: './b',
                left: './c',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { a1 as aX } from './a'
            export { default as b } from './b'
            export { c1, c2 } from './c'
          `,
          code: dedent`
            export { a1 as aX } from './a'
            export { c1, c2 } from './c'
            export { default as b } from './b'
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: './organisms',
                  right: './atoms',
                },
                messageId: 'unexpectedExportsOrder',
              },
              {
                data: {
                  left: './second-folder',
                  right: './folder',
                },
                messageId: 'unexpectedExportsOrder',
              },
            ],
            output: dedent`
              export * from "./atoms";
              export * from "./organisms";
              export * from "./shared";

              export { Named } from './folder';
              export { AnotherNamed } from './second-folder';
            `,
            code: dedent`
              export * from "./organisms";
              export * from "./atoms";
              export * from "./shared";

              export { AnotherNamed } from './second-folder';
              export { Named } from './folder';
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

    describe(`${ruleName}(${type}): partition comments`, () => {
      ruleTester.run(
        `${ruleName}(${type}): allows to use partition comments`,
        rule,
        {
          invalid: [
            {
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
              errors: [
                {
                  data: {
                    right: './bbb',
                    left: './d',
                  },
                  messageId: 'unexpectedExportsOrder',
                },
                {
                  data: {
                    right: './fff',
                    left: './gg',
                  },
                  messageId: 'unexpectedExportsOrder',
                },
              ],
              options: [
                {
                  ...options,
                  partitionByComment: '^Part',
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
          invalid: [
            {
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
              errors: [
                {
                  data: {
                    right: './bb',
                    left: './c',
                  },
                  messageId: 'unexpectedExportsOrder',
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
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex for partition comments`,
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
                  right: './a',
                  left: './b',
                },
                messageId: 'unexpectedExportsOrder',
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
              /* Comment */
              export * from './a'
              export * from './b'
            `,
            code: dedent`
              export * from './b'
              /* Comment */
              export * from './a'
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
                export * from './b'
                // Comment
                export * from './a'
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
                    line: ['a', 'b'],
                  },
                },
              ],
              code: dedent`
                export * from './c'
                // b
                export * from './b'
                // a
                export * from './a'
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
                export * from './b'
                // I am a partition comment because I don't have f o o
                export * from './a'
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
                  right: './a',
                  left: './b',
                },
                messageId: 'unexpectedExportsOrder',
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
              // Comment
              export * from './a'
              export * from './b'
            `,
            code: dedent`
              export * from './b'
              // Comment
              export * from './a'
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
                export * from './b'
                /* Comment */
                export * from './a'
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
                    block: ['a', 'b'],
                  },
                },
              ],
              code: dedent`
                export * from './c'
                /* b */
                export * from './b'
                /* a */
                export * from './a'
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
                export * from './b'
                /* I am a partition comment because I don't have f o o */
                export * from './a'
              `,
            },
          ],
          invalid: [],
        },
      )
    })

    ruleTester.run(`${ruleName}(${type}): sorts by group kind`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: './d',
                left: './f',
              },
              messageId: 'unexpectedExportsOrder',
            },
            {
              data: {
                right: './c',
                left: './e',
              },
              messageId: 'unexpectedExportsOrder',
            },
            {
              data: {
                right: './a',
                left: './c',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { A } from "./a";
            export { B } from "./b";
            export { C } from "./c";
            export type { D } from "./d";
            export type { E } from "./e";
            export type { F } from "./f";
          `,
          code: dedent`
            export type { F } from "./f";
            export type { D } from "./d";
            export type { E } from "./e";
            export { C } from "./c";
            export { A } from "./a";
            export { B } from "./b";
          `,
          options: [
            {
              ...options,
              groupKind: 'values-first',
            },
          ],
        },
        {
          errors: [
            {
              data: {
                right: './a',
                left: './c',
              },
              messageId: 'unexpectedExportsOrder',
            },
            {
              data: {
                right: './f',
                left: './b',
              },
              messageId: 'unexpectedExportsOrder',
            },
            {
              data: {
                right: './d',
                left: './f',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export type { D } from "./d";
            export type { E } from "./e";
            export type { F } from "./f";
            export { A } from "./a";
            export { B } from "./b";
            export { C } from "./c";
          `,
          code: dedent`
            export { C } from "./c";
            export { A } from "./a";
            export { B } from "./b";
            export type { F } from "./f";
            export type { D } from "./d";
            export type { E } from "./e";
          `,
          options: [
            {
              ...options,
              groupKind: 'types-first',
            },
          ],
        },
      ],
      valid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`
              export { a } from '_a'
              export { b } from 'b'
              export { c } from '_c'
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
              export { ab } from 'ab'
              export { ac } from 'a_c'
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
            export { 你好 } from '你好'
            export { 世界 } from '世界'
            export { a } from 'a'
            export { A } from 'A'
            export { b } from 'b'
            export { B } from 'B'
          `,
          options: [{ ...options, locales: 'zh-CN' }],
        },
      ],
      invalid: [],
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
                messageId: 'unexpectedExportsOrder',
              },
            ],
            output: dedent`
              export { a } from "a"; export { b } from "b";
            `,
            code: dedent`
              export { b } from "b"; export { a } from "a"
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
                messageId: 'unexpectedExportsOrder',
              },
            ],
            output: dedent`
              export { a } from "a"; export { b } from "b";
            `,
            code: dedent`
              export { b } from "b"; export { a } from "a";
            `,
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use predefined groups`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'value-export',
                  leftGroup: 'type-export',
                  right: 'b',
                  left: 'a',
                },
                messageId: 'unexpectedExportsGroupOrder',
              },
            ],
            options: [
              {
                ...options,
                groups: ['value-export', 'type-export'],
              },
            ],
            output: dedent`
              export { b } from 'b';
              export type { a } from 'a';
            `,
            code: dedent`
              export type { a } from 'a';
              export { b } from 'b';
            `,
          },
        ],
        valid: [],
      },
    )

    describe(`${ruleName}: custom groups`, () => {
      ruleTester.run(`${ruleName}: filters on modifier`, rule, {
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'valueExports',
                  leftGroup: 'unknown',
                  right: 'b',
                  left: 'a',
                },
                messageId: 'unexpectedExportsGroupOrder',
              },
            ],
            options: [
              {
                customGroups: [
                  {
                    groupName: 'valueExports',
                    modifiers: ['value'],
                  },
                ],
                groups: ['valueExports', 'unknown'],
              },
            ],
            output: dedent`
              export { b } from 'b';
              export type { a } from 'a';
            `,
            code: dedent`
              export type { a } from 'a';
              export { b } from 'b';
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
                  ...options,
                  customGroups: [
                    {
                      groupName: 'valuesStartingWithHello',
                      modifiers: ['value'],
                      elementNamePattern,
                    },
                  ],
                  groups: ['valuesStartingWithHello', 'unknown'],
                },
              ],
              errors: [
                {
                  data: {
                    rightGroup: 'valuesStartingWithHello',
                    right: 'helloExport',
                    leftGroup: 'unknown',
                    left: 'b',
                  },
                  messageId: 'unexpectedExportsGroupOrder',
                },
              ],
              output: dedent`
                export { helloExport } from 'helloExport';
                export { a } from 'a';
                export { b } from 'b';
              `,
              code: dedent`
                export { a } from 'a';
                export { b } from 'b';
                export { helloExport } from 'helloExport';
              `,
            },
          ],
          valid: [],
        })
      }

      ruleTester.run(
        `${ruleName}: handles complex regex in elementNamePattern`,
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
                export { iHaveFooInMyName } from 'iHaveFooInMyName';
                export { meTooIHaveFoo } from 'meTooIHaveFoo';
                export { a } from 'a';
                export { b } from 'b';
              `,
            },
          ],
          invalid: [],
        },
      )

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
                  messageId: 'unexpectedExportsOrder',
                },
                {
                  data: {
                    right: 'ccc',
                    left: 'bb',
                  },
                  messageId: 'unexpectedExportsOrder',
                },
                {
                  data: {
                    right: 'dddd',
                    left: 'ccc',
                  },
                  messageId: 'unexpectedExportsOrder',
                },
                {
                  data: {
                    rightGroup: 'reversedValuesByLineLength',
                    leftGroup: 'unknown',
                    right: 'eee',
                    left: 'm',
                  },
                  messageId: 'unexpectedExportsGroupOrder',
                },
              ],
              options: [
                {
                  customGroups: [
                    {
                      groupName: 'reversedValuesByLineLength',
                      modifiers: ['value'],
                      type: 'line-length',
                      order: 'desc',
                    },
                  ],
                  groups: ['reversedValuesByLineLength', 'unknown'],
                  type: 'alphabetical',
                  groupKind: 'mixed',
                  order: 'asc',
                },
              ],
              output: dedent`
                export { dddd } from 'dddd';
                export { ccc } from 'ccc';
                export { eee } from 'eee';
                export { bb } from 'bb';
                export { ff } from 'ff';
                export { a } from 'a';
                export { g } from 'g';
                export type { m } from 'm';
                export type { o } from 'o';
                export type { p } from 'p';
              `,
              code: dedent`
                export { a } from 'a';
                export { bb } from 'bb';
                export { ccc } from 'ccc';
                export { dddd } from 'dddd';
                export type { m } from 'm';
                export { eee } from 'eee';
                export { ff } from 'ff';
                export { g } from 'g';
                export type { o } from 'o';
                export type { p } from 'p';
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
                  messageId: 'unexpectedExportsOrder',
                },
              ],
              output: dedent`
                export { fooBar } from 'fooBar';
                export { fooZar } from 'fooZar';
              `,
              code: dedent`
                export { fooZar } from 'fooZar';
                export { fooBar } from 'fooBar';
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
                      groupName: 'unsortedValues',
                      modifiers: ['value'],
                      type: 'unsorted',
                    },
                  ],
                  groups: ['unsortedValues', 'unknown'],
                  groupKind: 'mixed',
                },
              ],
              errors: [
                {
                  data: {
                    rightGroup: 'unsortedValues',
                    leftGroup: 'unknown',
                    right: 'c',
                    left: 'm',
                  },
                  messageId: 'unexpectedExportsGroupOrder',
                },
              ],
              output: dedent`
                export { b } from 'b';
                export { a } from 'a';
                export { d } from 'd';
                export { e } from 'e';
                export { c } from 'c';
                export type { m } from 'm';
              `,
              code: dedent`
                export { b } from 'b';
                export { a } from 'a';
                export { d } from 'd';
                export { e } from 'e';
                export type { m } from 'm';
                export { c } from 'c';
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
                        modifiers: ['value'],
                      },
                      {
                        elementNamePattern: 'foo|Foo',
                        modifiers: ['type'],
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
                messageId: 'unexpectedExportsGroupOrder',
              },
            ],
            output: dedent`
              export { cFoo } from 'cFoo';
              export type { foo } from 'foo';
              export { a } from 'a';
            `,
            code: dedent`
              export { a } from 'a';
              export { cFoo } from 'cFoo';
              export type { foo } from 'foo';
            `,
          },
        ],
        valid: [],
      })
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
                  messageId: 'extraSpacingBetweenExports',
                },
                {
                  data: {
                    right: 'b',
                    left: 'z',
                  },
                  messageId: 'unexpectedExportsOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'z',
                  },
                  messageId: 'extraSpacingBetweenExports',
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
                  newlinesBetween: 'never',
                },
              ],
              code: dedent`
                  export { a } from 'a'


                 export { y } from 'y'
                export { z } from 'z'

                    export { b } from 'b'
              `,
              output: dedent`
                  export { a } from 'a'
                 export { b } from 'b'
                export { y } from 'y'
                    export { z } from 'z'
              `,
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
                  groups: ['a', 'b'],
                },
              ],
              errors: [
                {
                  data: {
                    right: 'b',
                    left: 'a',
                  },
                  messageId: 'missedSpacingBetweenExports',
                },
              ],
              output: dedent`
                export { a } from 'a'; 

                export { b } from 'b';
              `,
              code: dedent`
                export { a } from 'a'; export { b } from 'b';
              `,
            },
            {
              errors: [
                {
                  data: {
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'extraSpacingBetweenExports',
                },
                {
                  data: {
                    right: 'y',
                    left: 'z',
                  },
                  messageId: 'unexpectedExportsOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'y',
                  },
                  messageId: 'missedSpacingBetweenExports',
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
                  newlinesBetween: 'always',
                },
              ],
              output: dedent`
                  export { a } from 'a'

                 export { y } from 'y'
                export { z } from 'z'

                    export { b } from 'b'
              `,
              code: dedent`
                  export { a } from 'a'


                 export { z } from 'z'
                export { y } from 'y'
                    export { b } from 'b'
              `,
            },
          ],
          valid: [],
        },
      )

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
                    messageId: 'missedSpacingBetweenExports',
                  },
                  {
                    data: {
                      right: 'c',
                      left: 'b',
                    },
                    messageId: 'extraSpacingBetweenExports',
                  },
                  {
                    data: {
                      right: 'd',
                      left: 'c',
                    },
                    messageId: 'extraSpacingBetweenExports',
                  },
                ],
                output: dedent`
                  export { a } from 'a'

                  export { b } from 'b'

                  export { c } from 'c'
                  export { d } from 'd'


                  export { e } from 'e'
                `,
                code: dedent`
                  export { a } from 'a'
                  export { b } from 'b'


                  export { c } from 'c'

                  export { d } from 'd'


                  export { e } from 'e'
                `,
              },
            ],
            valid: [],
          },
        )

        describe(`${ruleName}(${type}): "newlinesBetween" between non-consecutive groups`, () => {
          for (let [globalNewlinesBetween, groupNewlinesBetween] of [
            ['always', 'never'] as const,
            ['always', 'ignore'] as const,
            ['never', 'always'] as const,
            ['ignore', 'always'] as const,
          ]) {
            ruleTester.run(
              `${ruleName}(${type}): enforces a newline if the global option is "${globalNewlinesBetween}" and the group option is "${groupNewlinesBetween}"`,
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
                        messageId: 'missedSpacingBetweenExports',
                      },
                    ],
                    output: dedent`
                      export { a } from 'a'

                      export { b } from 'b'
                    `,
                    code: dedent`
                      export { a } from 'a'
                      export { b } from 'b'
                    `,
                  },
                ],
                valid: [],
              },
            )
          }

          for (let globalNewlinesBetween of [
            'always',
            'ignore',
            'never',
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
                        messageId: 'extraSpacingBetweenExports',
                      },
                    ],
                    output: dedent`
                      export { a } from 'a'
                      export { b } from 'b'
                    `,
                    code: dedent`
                      export { a } from 'a'

                      export { b } from 'b'
                    `,
                  },
                ],
                valid: [],
              },
            )
          }

          for (let [globalNewlinesBetween, groupNewlinesBetween] of [
            ['ignore', 'never'] as const,
            ['never', 'ignore'] as const,
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
                      export { a } from 'a'

                      export { b } from 'b'
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
                      export { a } from 'a'
                      export { b } from 'b'
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
                  export { a } from 'a' // Comment after
                  export { b } from 'b'

                  export { c } from 'c'
                `,
                dedent`
                  export { a } from 'a' // Comment after

                  export { b } from 'b'
                  export { c } from 'c'
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
                  messageId: 'unexpectedExportsGroupOrder',
                },
              ],
              code: dedent`
                export { b } from 'b'
                export { a } from 'a' // Comment after

                export { c } from 'c'
              `,
            },
          ],
          valid: [],
        },
      )
    })

    describe(`${ruleName}(${type}): "commentAbove" inside groups`, () => {
      ruleTester.run(`${ruleName}(${type}): reports missing comments`, rule, {
        invalid: [
          {
            errors: [
              {
                data: {
                  missedCommentAbove: 'Type exports',
                  right: './a',
                },
                messageId: 'missedCommentAboveExport',
              },
              {
                data: {
                  missedCommentAbove: 'Other exports',
                  right: './b',
                },
                messageId: 'missedCommentAboveExport',
              },
            ],
            options: [
              {
                ...options,
                groups: [
                  { commentAbove: 'Type exports' },
                  'type-export',
                  { commentAbove: 'Other exports' },
                  'unknown',
                ],
              },
            ],
            output: dedent`
              // Type exports
              export type { a } from "./a";

              // Other exports
              export { b } from "./b";
            `,
            code: dedent`
              export type { a } from "./a";

              export { b } from "./b";
            `,
          },
        ],
        valid: [],
      })

      ruleTester.run(
        `${ruleName}(${type}): reports missing comments for single nodes`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    missedCommentAbove: 'Comment above',
                    right: 'a',
                  },
                  messageId: 'missedCommentAboveExport',
                },
              ],
              options: [
                {
                  ...options,
                  groups: [{ commentAbove: 'Comment above' }, 'unknown'],
                },
              ],
              output: dedent`
                // Comment above
                export { a } from "a";
              `,
              code: dedent`
                export { a } from "a";
              `,
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): ignores shebangs and comments at the top of the file`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    missedCommentAbove: 'Comment above',
                    right: './b',
                  },
                  messageId: 'missedCommentAboveExport',
                },
                {
                  data: {
                    right: './a',
                    left: './b',
                  },
                  messageId: 'unexpectedExportsOrder',
                },
              ],
              output: [
                dedent`
                  #!/usr/bin/node
                  // Some disclaimer

                  export { a } from "./a";
                  export { b } from "./b";
                `,
                dedent`
                  #!/usr/bin/node
                  // Some disclaimer

                  // Comment above
                  export { a } from "./a";
                  export { b } from "./b";
                `,
              ],
              code: dedent`
                #!/usr/bin/node
                // Some disclaimer

                export { b } from "./b";
                export { a } from "./a";
              `,
              options: [
                {
                  ...options,
                  groups: [{ commentAbove: 'Comment above' }, 'unknown'],
                },
              ],
            },
          ],
          valid: [],
        },
      )

      describe('comment detection', () => {
        for (let comment of [
          '//   Comment above  ',
          '//   comment above  ',
          `/**
            * Comment above
            */`,
          `/**
            * Something before
            * CoMmEnT ABoVe
            * Something after
            */`,
        ]) {
          ruleTester.run(
            `${ruleName}(${type}): detects existing comments correctly`,
            rule,
            {
              valid: [
                {
                  options: [
                    {
                      ...options,
                      groups: [
                        'value-export',
                        { commentAbove: 'Comment above' },
                        'unknown',
                      ],
                    },
                  ],
                  code: dedent`
                    export { a } from "a";

                    ${comment}
                    export type { b } from "./b";
                  `,
                },
              ],
              invalid: [],
            },
          )
        }

        ruleTester.run(
          `${ruleName}(${type}): deletes invalid auto-added comments`,
          rule,
          {
            invalid: [
              {
                errors: [
                  {
                    data: {
                      missedCommentAbove: 'Type exports',
                      right: './c',
                    },
                    messageId: 'missedCommentAboveExport',
                  },
                  {
                    data: {
                      right: './b',
                      left: './c',
                    },
                    messageId: 'unexpectedExportsOrder',
                  },
                  {
                    data: {
                      rightGroup: 'value-export',
                      leftGroup: 'type-export',
                      right: './a',
                      left: './b',
                    },
                    messageId: 'unexpectedExportsGroupOrder',
                  },
                ],
                output: [
                  dedent`
                    // Type exports
                    export { a } from './a';
                    // Value exports
                    export type { b } from './b';
                    export type { c } from './c';
                  `,
                  dedent`
                    // Value exports
                    export { a } from './a';
                    // Type exports
                    export type { b } from './b';
                    export type { c } from './c';
                  `,
                ],
                options: [
                  {
                    ...options,
                    groups: [
                      { commentAbove: 'Value exports' },
                      'value-export',
                      { commentAbove: 'Type exports' },
                      'type-export',
                    ],
                  },
                ],
                code: dedent`
                  export type { c } from './c';
                  // Value exports
                  export type { b } from './b';
                  // Type exports
                  export { a } from './a';
                `,
              },
            ],
            valid: [],
          },
        )
      })

      ruleTester.run(`${ruleName}(${type}): works with other errors`, rule, {
        invalid: [
          {
            output: [
              dedent`
                #!/usr/bin/node
                // Some disclaimer

                // Comment above a
                // Type exports
                export { a } from "./a"; // Comment after a
                // Comment above b
                // Value exports
                export type { b } from './b'; // Comment after b
              `,
              dedent`
                #!/usr/bin/node
                // Some disclaimer

                // Comment above a
                // Type exports
                export { a } from "./a"; // Comment after a

                // Comment above b
                // Value exports
                export type { b } from './b'; // Comment after b
              `,
              dedent`
                #!/usr/bin/node
                // Some disclaimer

                // Comment above a
                // Value exports
                export { a } from "./a"; // Comment after a

                // Type exports
                // Comment above b
                export type { b } from './b'; // Comment after b
              `,
            ],
            errors: [
              {
                data: {
                  missedCommentAbove: 'Type exports',
                  right: './b',
                },
                messageId: 'missedCommentAboveExport',
              },
              {
                data: {
                  rightGroup: 'value-export',
                  leftGroup: 'type-export',
                  right: './a',
                  left: './b',
                },
                messageId: 'unexpectedExportsGroupOrder',
              },
            ],
            options: [
              {
                ...options,
                groups: [
                  { commentAbove: 'Value exports' },
                  'value-export',
                  {
                    commentAbove: 'Type exports',
                    newlinesBetween: 'always',
                  },
                  ['type-export'],
                ],
                newlinesBetween: 'never',
              },
            ],
            code: dedent`
              #!/usr/bin/node
              // Some disclaimer

              // Comment above b
              // Value exports
              export type { b } from './b'; // Comment after b
              // Comment above a
              // Type exports
              export { a } from "./a"; // Comment after a
            `,
          },
        ],
        valid: [],
      })
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
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedExportsOrder',
            },
            {
              data: {
                right: 'c',
                left: 'd',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { a1 } from 'a'
            export { b1, b2 } from 'b'
            export { c1, c2, c3 } from 'c'
            export { d1, d2 } from 'd'
          `,
          code: dedent`
            export { b1, b2 } from 'b'
            export { a1 } from 'a'
            export { d1, d2 } from 'd'
            export { c1, c2, c3 } from 'c'
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}(${type}): sorts all-exports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: './a',
                left: './b',
              },
              messageId: 'unexpectedExportsOrder',
            },
            {
              data: {
                right: './d',
                left: 'e',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { a1 } from './a'
            export * as b from './b'
            export { c1, c2 } from './c'
            export { d } from './d'
            export * from 'e'
          `,
          code: dedent`
            export * as b from './b'
            export { a1 } from './a'
            export { c1, c2 } from './c'
            export * from 'e'
            export { d } from './d'
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}(${type}): works with export aliases`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: './b',
                left: './c',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { a1 as aX } from './a'
            export { default as b } from './b'
            export { c1, c2 } from './c'
          `,
          code: dedent`
            export { a1 as aX } from './a'
            export { c1, c2 } from './c'
            export { default as b } from './b'
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: './organisms',
                  right: './atoms',
                },
                messageId: 'unexpectedExportsOrder',
              },
              {
                data: {
                  left: './second-folder',
                  right: './folder',
                },
                messageId: 'unexpectedExportsOrder',
              },
            ],
            output: dedent`
              export * from "./atoms";
              export * from "./organisms";
              export * from "./shared";

              export { Named } from './folder';
              export { AnotherNamed } from './second-folder';
            `,
            code: dedent`
              export * from "./organisms";
              export * from "./atoms";
              export * from "./shared";

              export { AnotherNamed } from './second-folder';
              export { Named } from './folder';
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

    ruleTester.run(`${ruleName}(${type}): sorts by group kind`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: './d',
                left: './f',
              },
              messageId: 'unexpectedExportsOrder',
            },
            {
              data: {
                right: './c',
                left: './e',
              },
              messageId: 'unexpectedExportsOrder',
            },
            {
              data: {
                right: './a',
                left: './c',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { A } from "./a";
            export { B } from "./b";
            export { C } from "./c";
            export type { D } from "./d";
            export type { E } from "./e";
            export type { F } from "./f";
          `,
          code: dedent`
            export type { F } from "./f";
            export type { D } from "./d";
            export type { E } from "./e";
            export { C } from "./c";
            export { A } from "./a";
            export { B } from "./b";
          `,
          options: [
            {
              ...options,
              groupKind: 'values-first',
            },
          ],
        },
        {
          errors: [
            {
              data: {
                right: './a',
                left: './c',
              },
              messageId: 'unexpectedExportsOrder',
            },
            {
              data: {
                right: './f',
                left: './b',
              },
              messageId: 'unexpectedExportsOrder',
            },
            {
              data: {
                right: './d',
                left: './f',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export type { D } from "./d";
            export type { E } from "./e";
            export type { F } from "./f";
            export { A } from "./a";
            export { B } from "./b";
            export { C } from "./c";
          `,
          code: dedent`
            export { C } from "./c";
            export { A } from "./a";
            export { B } from "./b";
            export type { F } from "./f";
            export type { D } from "./d";
            export type { E } from "./e";
          `,
          options: [
            {
              ...options,
              groupKind: 'types-first',
            },
          ],
        },
      ],
      valid: [],
    })
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

    ruleTester.run(`${ruleName}(${type}): sorts exports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedExportsOrder',
            },
            {
              data: {
                right: 'c',
                left: 'd',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { a1 } from 'a'
            export { b1, b2 } from 'b'
            export { c1, c2, c3 } from 'c'
            export { d1, d2 } from 'd'
          `,
          code: dedent`
            export { b1, b2 } from 'b'
            export { a1 } from 'a'
            export { d1, d2 } from 'd'
            export { c1, c2, c3 } from 'c'
          `,
          options: [options],
        },
      ],
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
    })
  })

  describe(`${ruleName}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts exports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'd',
                left: 'a',
              },
              messageId: 'unexpectedExportsOrder',
            },
            {
              data: {
                right: 'c',
                left: 'd',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { c1, c2, c3 } from 'c'
            export { b1, b2 } from 'b'
            export { d1, d2 } from 'd'
            export { a1 } from 'a'
          `,
          code: dedent`
            export { b1, b2 } from 'b'
            export { a1 } from 'a'
            export { d1, d2 } from 'd'
            export { c1, c2, c3 } from 'c'
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}(${type}): sorts all-exports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: './c',
                left: './a',
              },
              messageId: 'unexpectedExportsOrder',
            },
            {
              data: {
                right: './d',
                left: 'e',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { c1, c2 } from './c'
            export * as b from './b'
            export { a1 } from './a'
            export { d } from './d'
            export * from 'e'
          `,
          code: dedent`
            export * as b from './b'
            export { a1 } from './a'
            export { c1, c2 } from './c'
            export * from 'e'
            export { d } from './d'
          `,
          options: [options],
        },
      ],
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
    })

    ruleTester.run(`${ruleName}(${type}): works with export aliases`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: './b',
                left: './c',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { default as b } from './b'
            export { a1 as aX } from './a'
            export { c1, c2 } from './c'
          `,
          code: dedent`
            export { a1 as aX } from './a'
            export { c1, c2 } from './c'
            export { default as b } from './b'
          `,
          options: [options],
        },
      ],
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
    })

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
                messageId: 'unexpectedExportsOrder',
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
              export * from 'bb'
              export * from 'c'
              export * from 'a'
            `,
            code: dedent`
              export * from 'a'
              export * from 'bb'
              export * from 'c'
            `,
          },
          {
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedExportsOrder',
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
              export * from 'bb'
              export * from 'a'
              export * from 'c'
            `,
            code: dedent`
              export * from 'c'
              export * from 'bb'
              export * from 'a'
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
            export * from 'b'
            export * from 'c'
            export * from 'a'
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
              messageId: 'missedSpacingBetweenExports',
            },
          ],
          output: dedent`
            export { b } from 'b'

            export { a } from 'a'
          `,
          code: dedent`
            export { b } from 'b'
            export { a } from 'a'
          `,
        },
      ],
      valid: [],
    })
  })

  describe('misc', () => {
    ruleTester.run(
      `${ruleName}: sets alphabetical asc sorting as default`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: '~/b',
                  left: '~/c',
                },
                messageId: 'unexpectedExportsOrder',
              },
            ],
            output: dedent`
              export { a } from '~/a'
              export { b } from '~/b'
              export { c } from '~/c'
              export { d } from '~/d'
            `,
            code: dedent`
              export { a } from '~/a'
              export { c } from '~/c'
              export { b } from '~/b'
              export { d } from '~/d'
            `,
          },
        ],
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

    let eslintDisableRuleTesterName = `${ruleName}: supports 'eslint-disable' for individual nodes`
    ruleTester.run(eslintDisableRuleTesterName, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: './b',
                left: './c',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { b } from './b'
            export { c } from './c'
            // eslint-disable-next-line
            export { a } from './a'
          `,
          code: dedent`
            export { c } from './c'
            export { b } from './b'
            // eslint-disable-next-line
            export { a } from './a'
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: './c',
                left: './d',
              },
              messageId: 'unexpectedExportsOrder',
            },
            {
              data: {
                right: './b',
                left: './a',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { b } from './b'
            export { c } from './c'
            // eslint-disable-next-line
            export { a } from './a'
            export { d } from './d'
          `,
          code: dedent`
            export { d } from './d'
            export { c } from './c'
            // eslint-disable-next-line
            export { a } from './a'
            export { b } from './b'
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
                right: './b',
                left: './c',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { b } from './b'
            export { c } from './c'
            export { a } from './a' // eslint-disable-line
          `,
          code: dedent`
            export { c } from './c'
            export { b } from './b'
            export { a } from './a' // eslint-disable-line
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: './b',
                left: './c',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { b } from './b'
            export { c } from './c'
            /* eslint-disable-next-line */
            export { a } from './a'
          `,
          code: dedent`
            export { c } from './c'
            export { b } from './b'
            /* eslint-disable-next-line */
            export { a } from './a'
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: './b',
                left: './c',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { b } from './b'
            export { c } from './c'
            export { a } from './a' /* eslint-disable-line */
          `,
          code: dedent`
            export { c } from './c'
            export { b } from './b'
            export { a } from './a' /* eslint-disable-line */
          `,
          options: [{}],
        },
        {
          output: dedent`
            export { a } from './a'
            export { d } from './d'
            /* eslint-disable */
            export { c } from './c'
            export { b } from './b'
            // Shouldn't move
            /* eslint-enable */
            export { e } from './e'
          `,
          code: dedent`
            export { d } from './d'
            export { e } from './e'
            /* eslint-disable */
            export { c } from './c'
            export { b } from './b'
            // Shouldn't move
            /* eslint-enable */
            export { a } from './a'
          `,
          errors: [
            {
              data: {
                right: './a',
                left: './b',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            export { b } from './b'
            export { c } from './c'
            // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
            export { a } from './a'
          `,
          code: dedent`
            export { c } from './c'
            export { b } from './b'
            // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
            export { a } from './a'
          `,
          errors: [
            {
              data: {
                right: './b',
                left: './c',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            export { b } from './b'
            export { c } from './c'
            export { a } from './a' // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
          `,
          code: dedent`
            export { c } from './c'
            export { b } from './b'
            export { a } from './a' // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
          `,
          errors: [
            {
              data: {
                right: './b',
                left: './c',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            export { b } from './b'
            export { c } from './c'
            /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
            export { a } from './a'
          `,
          code: dedent`
            export { c } from './c'
            export { b } from './b'
            /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
            export { a } from './a'
          `,
          errors: [
            {
              data: {
                right: './b',
                left: './c',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            export { b } from './b'
            export { c } from './c'
            export { a } from './a' /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
          `,
          code: dedent`
            export { c } from './c'
            export { b } from './b'
            export { a } from './a' /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
          `,
          errors: [
            {
              data: {
                right: './b',
                left: './c',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            export { a } from './a'
            export { d } from './d'
            /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
            export { c } from './c'
            export { b } from './b'
            // Shouldn't move
            /* eslint-enable */
            export { e } from './e'
          `,
          code: dedent`
            export { d } from './d'
            export { e } from './e'
            /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
            export { c } from './c'
            export { b } from './b'
            // Shouldn't move
            /* eslint-enable */
            export { a } from './a'
          `,
          errors: [
            {
              data: {
                right: './a',
                left: './b',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          options: [{}],
        },
      ],
      valid: [
        {
          code: dedent`
            export { b } from "./b"
            export { c } from "./c"
            // eslint-disable-next-line
            export { a } from "./a"
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
              export { a } from 'a'
              export * from 'b'
              export { c } from 'c'
            `,
            options: [{}],
          },
        ],
        invalid: [],
      },
    )
  })
})
