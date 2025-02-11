import type { Rule } from 'eslint'

import { RuleTester } from '@typescript-eslint/rule-tester'
import { RuleTester as EslintRuleTester } from 'eslint'
import { afterAll, describe, it } from 'vitest'
import dedent from 'dedent'

import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-maps'

let ruleName = 'sort-maps'

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

    ruleTester.run(
      `${ruleName}(${type}): does not break the property list`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: "'a'",
                  left: "'b'",
                },
                messageId: 'unexpectedMapElementsOrder',
              },
            ],
            output: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['a', 'aa'],
                ['b', 'b'],
              ])
            `,
            code: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['b', 'b'],
                ['a', 'aa'],
              ])
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              new Map([
                ['a', 'a'],
              ])
            `,
            options: [options],
          },
          {
            code: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['a', 'aa'],
                ['b', 'b'],
              ])
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): not sorts spread elements`, rule, {
      valid: [
        {
          code: dedent`
            new Map([
              ...aaa,
              ...bb,
            ])
          `,
          options: [options],
        },
        {
          code: dedent`
            new Map([
              ...bb,
              ...aaa,
            ])
          `,
          options: [options],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}(${type}): works with variables as keys`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'aa',
                left: 'b',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              [aa, aa],
              [b, b],
            ])
          `,
          code: dedent`
            new Map([
              [b, b],
              [aa, aa],
            ])
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Map([
              [aa, aa],
              [b, b],
            ])
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): works with numbers as keys`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '1',
                left: '2',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              [1, 'one'],
              [2, 'two'],
              [3, 'three'],
            ])
          `,
          code: dedent`
            new Map([
              [2, 'two'],
              [1, 'one'],
              [3, 'three'],
            ])
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Map([
              [1, 'one'],
              [2, 'two'],
              [3, 'three'],
            ])
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts variable identifiers`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'cc',
                left: 'd',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
            {
              data: {
                right: 'bbb',
                left: 'cc',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              aaaa,
              bbb,
              cc,
              d,
            ])
          `,
          code: dedent`
            new Map([
              aaaa,
              d,
              cc,
              bbb,
            ])
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Map([
              aaaa,
              bbb,
              cc,
              d,
            ])
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
                  right: 'a',
                  left: 'd',
                },
                messageId: 'unexpectedMapElementsOrder',
              },
              {
                data: {
                  right: 'b',
                  left: 'e',
                },
                messageId: 'unexpectedMapElementsOrder',
              },
            ],
            output: dedent`
              new Map([
                [a, 'a'],
                [d, 'd'],

                [c, 'c'],

                [b, 'b'],
                [e, 'e'],
              ])
            `,
            code: dedent`
              new Map([
                [d, 'd'],
                [a, 'a'],

                [c, 'c'],

                [e, 'e'],
                [b, 'b'],
              ])
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
                new Map([
                  // Part: A
                  // Not partition comment
                  [bbb, 'bbb'],
                  [cc, 'cc'],
                  [d, 'd'],
                  // Part: B
                  [aaaa, 'aaaa'],
                  [e, 'e'],
                  // Part: C
                  // Not partition comment
                  [fff, 'fff'],
                  [gg, 'gg'],
                ])
              `,
              code: dedent`
                new Map([
                  // Part: A
                  [cc, 'cc'],
                  [d, 'd'],
                  // Not partition comment
                  [bbb, 'bbb'],
                  // Part: B
                  [aaaa, 'aaaa'],
                  [e, 'e'],
                  // Part: C
                  [gg, 'gg'],
                  // Not partition comment
                  [fff, 'fff'],
                ])
              `,
              errors: [
                {
                  data: {
                    right: 'bbb',
                    left: 'd',
                  },
                  messageId: 'unexpectedMapElementsOrder',
                },
                {
                  data: {
                    right: 'fff',
                    left: 'gg',
                  },
                  messageId: 'unexpectedMapElementsOrder',
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
                new Map([
                  // Comment
                  [bb, 'bb'],
                  // Other comment
                  [a, 'a'],
                ])
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
                new Map([
                  /* Partition Comment */
                  // Part: A
                  [d, 'd'],
                  // Part: B
                  [aaa, 'aaa'],
                  [bb, 'bb'],
                  [c, 'c'],
                  /* Other */
                  [e, 'e'],
                ])
              `,
              code: dedent`
                new Map([
                  /* Partition Comment */
                  // Part: A
                  [d, 'd'],
                  // Part: B
                  [aaa, 'aaa'],
                  [c, 'c'],
                  [bb, 'bb'],
                  /* Other */
                  [e, 'e'],
                ])
              `,
              errors: [
                {
                  data: {
                    right: 'bb',
                    left: 'c',
                  },
                  messageId: 'unexpectedMapElementsOrder',
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

      ruleTester.run(`${ruleName}(${type}): allows to use regex`, rule, {
        valid: [
          {
            code: dedent`
              new Map([
                ['e', 'e'],
                ['f', 'f'],
                // I am a partition comment because I don't have f o o
                ['a', 'a'],
                ['b', 'b'],
              ])
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
      })

      describe(`${ruleName}(${type}): allows to use "partitionByComment.line"`, () => {
        ruleTester.run(`${ruleName}(${type}): ignores block comments`, rule, {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: "'a'",
                    left: "'b'",
                  },
                  messageId: 'unexpectedMapElementsOrder',
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
                new Map([
                  /* Comment */
                  ['a', 'a'],
                  ['b', 'b'],
                ])
              `,
              code: dedent`
                new Map([
                  ['b', 'b'],
                  /* Comment */
                  ['a', 'a'],
                ])
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
                  new Map([
                    ['b', 'b'],
                    // Comment
                    ['a', 'a'],
                  ])
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
                code: dedent`
                  new Map([
                    ['c', 'c'],
                    // b
                    ['b', 'b'],
                    // a
                    ['a', 'a'],
                  ])
                `,
                options: [
                  {
                    ...options,
                    partitionByComment: {
                      line: ['a', 'b'],
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
                  new Map([
                    ['b', 'b'],
                    // I am a partition comment because I don't have f o o
                    ['a', 'a'],
                  ])
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
              errors: [
                {
                  data: {
                    right: "'a'",
                    left: "'b'",
                  },
                  messageId: 'unexpectedMapElementsOrder',
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
                new Map([
                  // Comment
                  ['a', 'a'],
                  ['b', 'b'],
                ])
              `,
              code: dedent`
                new Map([
                  ['b', 'b'],
                  // Comment
                  ['a', 'a'],
                ])
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
                  new Map([
                    ['b', 'b'],
                    /* Comment */
                    ['a', 'a'],
                  ])
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
                code: dedent`
                  new Map([
                    ['c', 'c'],
                    /* b */
                    ['b', 'b'],
                    /* a */
                    ['a', 'a'],
                  ])
                `,
                options: [
                  {
                    ...options,
                    partitionByComment: {
                      block: ['a', 'b'],
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
                  new Map([
                    ['b', 'b'],
                    /* I am a partition comment because I don't have f o o */
                    ['a', 'a'],
                  ])
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
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`
              new Map([
                [_a, 'a'],
                [b, 'b'],
                [_c, 'c'],
              ])
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
              new Map([
                [ab, 'ab'],
                [a_c, 'ac'],
              ])
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
            new Map([
              [你好, '你好'],
              [世界, '世界'],
              [a, 'a'],
              [A, 'A'],
              [b, 'b'],
              [B, 'B'],
            ])
          `,
          options: [{ ...options, locales: 'zh-CN' }],
        },
      ],
      invalid: [],
    })

    describe(`${ruleName}: custom groups`, () => {
      ruleTester.run(`${ruleName}: filters on elementNamePattern`, rule, {
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'keysStartingWithHello',
                  leftGroup: 'unknown',
                  right: "'helloKey'",
                  left: "'b'",
                },
                messageId: 'unexpectedMapElementsGroupOrder',
              },
            ],
            options: [
              {
                customGroups: [
                  {
                    groupName: 'keysStartingWithHello',
                    elementNamePattern: 'hello',
                  },
                ],
                groups: ['keysStartingWithHello', 'unknown'],
              },
            ],
            output: dedent`
              new Map([
                ['helloKey', 3],
                ['a', 1],
                ['b', 2]
              ])
            `,
            code: dedent`
              new Map([
                ['a', 1],
                ['b', 2],
                ['helloKey', 3]
              ])
            `,
          },
        ],
        valid: [],
      })

      ruleTester.run(
        `${ruleName}: sort custom groups by overriding 'type' and 'order'`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: '_bb',
                    left: '_a',
                  },
                  messageId: 'unexpectedMapElementsOrder',
                },
                {
                  data: {
                    right: '_ccc',
                    left: '_bb',
                  },
                  messageId: 'unexpectedMapElementsOrder',
                },
                {
                  data: {
                    right: '_dddd',
                    left: '_ccc',
                  },
                  messageId: 'unexpectedMapElementsOrder',
                },
                {
                  data: {
                    rightGroup: 'reversedStartingWith_ByLineLength',
                    leftGroup: 'unknown',
                    right: '_eee',
                    left: 'm',
                  },
                  messageId: 'unexpectedMapElementsGroupOrder',
                },
              ],
              options: [
                {
                  customGroups: [
                    {
                      groupName: 'reversedStartingWith_ByLineLength',
                      elementNamePattern: '_',
                      type: 'line-length',
                      order: 'desc',
                    },
                  ],
                  groups: ['reversedStartingWith_ByLineLength', 'unknown'],
                  type: 'alphabetical',
                  order: 'asc',
                },
              ],
              output: dedent`
                new Map([
                  [_dddd, null],
                  [_ccc, null],
                  [_eee, null],
                  [_bb, null],
                  [_ff, null],
                  [_a, null],
                  [_g, null],
                  [m, null],
                  [o, null],
                  [p, null]
                ])
              `,
              code: dedent`
                new Map([
                  [_a, null],
                  [_bb, null],
                  [_ccc, null],
                  [_dddd, null],
                  [m, null],
                  [_eee, null],
                  [_ff, null],
                  [_g, null],
                  [o, null],
                  [p, null]
                ])
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
                      groupName: 'unsortedStartingWith_',
                      elementNamePattern: '_',
                      type: 'unsorted',
                    },
                  ],
                  groups: ['unsortedStartingWith_', 'unknown'],
                },
              ],
              errors: [
                {
                  data: {
                    rightGroup: 'unsortedStartingWith_',
                    leftGroup: 'unknown',
                    right: "'_c'",
                    left: "'m'",
                  },
                  messageId: 'unexpectedMapElementsGroupOrder',
                },
              ],
              output: dedent`
                new Map([
                  ['_b', null],
                  ['_a', null],
                  ['_d', null],
                  ['_e', null],
                  ['_c', null],
                  ['m', null]
                ])
              `,
              code: dedent`
                new Map([
                  ['_b', null],
                  ['_a', null],
                  ['_d', null],
                  ['_e', null],
                  ['m', null],
                  ['_c', null]
                ])
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
                        elementNamePattern: 'foo',
                      },
                      {
                        elementNamePattern: 'Foo',
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
                  right: "'...foo'",
                  left: "'a'",
                },
                messageId: 'unexpectedMapElementsGroupOrder',
              },
            ],
            output: dedent`
              new Map([
                ['...foo', null],
                ['cFoo', null],
                ['a', null]
              ])
            `,
            code: dedent`
              new Map([
                ['a', null],
                ['...foo', null],
                ['cFoo', null]
              ])
            `,
          },
        ],
        valid: [],
      })

      ruleTester.run(
        `${ruleName}: allows to use regex for element names in custom groups`,
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
                new Map([
                  ['iHaveFooInMyName', null],
                  ['meTooIHaveFoo', null],
                  ['a', null],
                  ['b', null]
                ])
              `,
            },
          ],
          invalid: [],
        },
      )
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
                  messageId: 'extraSpacingBetweenMapElementsMembers',
                },
                {
                  data: {
                    right: 'b',
                    left: 'z',
                  },
                  messageId: 'unexpectedMapElementsOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'z',
                  },
                  messageId: 'extraSpacingBetweenMapElementsMembers',
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
                new Map([
                  [a, null],


                 [y, null],
                [z, null],

                    [b, null]
                ])
              `,
              output: dedent`
                new Map([
                  [a, null],
                 [b, null],
                [y, null],
                    [z, null]
                ])
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
              errors: [
                {
                  data: {
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'extraSpacingBetweenMapElementsMembers',
                },
                {
                  data: {
                    right: 'y',
                    left: 'z',
                  },
                  messageId: 'unexpectedMapElementsOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'y',
                  },
                  messageId: 'missedSpacingBetweenMapElementsMembers',
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
                new Map([
                  [a, null],

                 [y, null],
                [z, null],

                    [b, null],
                ])
              `,
              code: dedent`
                new Map([
                  [a, null],


                 [z, null],
                [y, null],
                    [b, null],
                ])
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
                    messageId: 'missedSpacingBetweenMapElementsMembers',
                  },
                  {
                    data: {
                      right: 'c',
                      left: 'b',
                    },
                    messageId: 'extraSpacingBetweenMapElementsMembers',
                  },
                  {
                    data: {
                      right: 'd',
                      left: 'c',
                    },
                    messageId: 'extraSpacingBetweenMapElementsMembers',
                  },
                ],
                output: dedent`
                  new Map([
                    [a, null],

                    [b, null],

                    [c, null],
                    [d, null],


                    [e, null]
                  ])
                `,
                code: dedent`
                  new Map([
                    [a, null],
                    [b, null],


                    [c, null],

                    [d, null],


                    [e, null]
                  ])
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
                        messageId: 'missedSpacingBetweenMapElementsMembers',
                      },
                    ],
                    output: dedent`
                      new Map([
                        [a, 'a'],

                        [b, 'b'],
                      ])
                    `,
                    code: dedent`
                      new Map([
                        [a, 'a'],
                        [b, 'b'],
                      ])
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
                      new Map([
                        [a, 'a'],

                        [b, 'b'],
                      ])
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
                      new Map([
                        [a, 'a'],
                        [b, 'b'],
                      ])
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
                  new Map([
                    [a, null], // Comment after
                    [b, null],

                    [c, null]
                  ])
                `,
                dedent`
                  new Map([
                    [a, null], // Comment after

                    [b, null],
                    [c, null]
                  ])
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
                  messageId: 'unexpectedMapElementsGroupOrder',
                },
              ],
              code: dedent`
                new Map([
                  [b, null],
                  [a, null], // Comment after

                  [c, null]
                ])
              `,
            },
          ],
          valid: [],
        },
      )
    })

    describe(`${ruleName}(${type}): allows to use 'useConfigurationIf'`, () => {
      for (let allNamesMatchPattern of [
        'foo',
        ['noMatch', 'foo'],
        { pattern: 'FOO', flags: 'i' },
        ['noMatch', { pattern: 'FOO', flags: 'i' }],
      ]) {
        ruleTester.run(
          `${ruleName}(${type}): allows to use 'allNamesMatchPattern'`,
          rule,
          {
            invalid: [
              {
                options: [
                  {
                    ...options,
                    useConfigurationIf: {
                      allNamesMatchPattern,
                    },
                  },
                  {
                    ...options,
                    customGroups: [
                      {
                        elementNamePattern: '^r$',
                        groupName: 'r',
                      },
                      {
                        elementNamePattern: '^g$',
                        groupName: 'g',
                      },
                      {
                        elementNamePattern: '^b$',
                        groupName: 'b',
                      },
                    ],
                    useConfigurationIf: {
                      allNamesMatchPattern: '^r|g|b$',
                    },
                    groups: ['r', 'g', 'b'],
                  },
                ],
                errors: [
                  {
                    data: {
                      rightGroup: 'g',
                      leftGroup: 'b',
                      right: 'g',
                      left: 'b',
                    },
                    messageId: 'unexpectedMapElementsGroupOrder',
                  },
                  {
                    data: {
                      rightGroup: 'r',
                      leftGroup: 'g',
                      right: 'r',
                      left: 'g',
                    },
                    messageId: 'unexpectedMapElementsGroupOrder',
                  },
                ],
                output: dedent`
                  new Map([
                    [r, null],
                    [g, null],
                    [b, null]
                  ])
                `,
                code: dedent`
                  new Map([
                    [b, null],
                    [g, null],
                    [r, null]
                  ])
                `,
              },
            ],
            valid: [],
          },
        )
      }
    })
  })

  describe(`${ruleName}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(
      `${ruleName}(${type}): does not break the property list`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: "'a'",
                  left: "'b'",
                },
                messageId: 'unexpectedMapElementsOrder',
              },
            ],
            output: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['a', 'aa'],
                ['b', 'b'],
              ])
            `,
            code: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['b', 'b'],
                ['a', 'aa'],
              ])
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['a', 'aa'],
                ['b', 'b'],
              ])
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): not sorts spread elements`, rule, {
      valid: [
        {
          code: dedent`
            new Map([
              ...aaa,
              ...bb,
            ])
          `,
          options: [options],
        },
        {
          code: dedent`
            new Map([
              ...bb,
              ...aaa,
            ])
          `,
          options: [options],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}(${type}): works with variables as keys`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'aa',
                left: 'b',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              [aa, aa],
              [b, b],
            ])
          `,
          code: dedent`
            new Map([
              [b, b],
              [aa, aa],
            ])
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Map([
              [aa, aa],
              [b, b],
            ])
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): works with numbers as keys`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '1',
                left: '2',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              [1, 'one'],
              [2, 'two'],
              [3, 'three'],
            ])
          `,
          code: dedent`
            new Map([
              [2, 'two'],
              [1, 'one'],
              [3, 'three'],
            ])
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Map([
              [1, 'one'],
              [2, 'two'],
              [3, 'three'],
            ])
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts variable identifiers`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'cc',
                left: 'd',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
            {
              data: {
                right: 'bbb',
                left: 'cc',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              aaaa,
              bbb,
              cc,
              d,
            ])
          `,
          code: dedent`
            new Map([
              aaaa,
              d,
              cc,
              bbb,
            ])
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Map([
              aaaa,
              bbb,
              cc,
              d,
            ])
          `,
          options: [options],
        },
      ],
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

    ruleTester.run(`${ruleName}(${type}): works with variables as keys`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'aa',
                left: 'b',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              [aa, aa],
              [b, b],
            ])
          `,
          code: dedent`
            new Map([
              [b, b],
              [aa, aa],
            ])
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Map([
              [aa, aa],
              [b, b],
            ])
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

    ruleTester.run(
      `${ruleName}(${type}): does not break the property list`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: "'a'",
                  left: "'b'",
                },
                messageId: 'unexpectedMapElementsOrder',
              },
            ],
            output: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['a', 'aa'],
                ['b', 'b'],
              ])
            `,
            code: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['b', 'b'],
                ['a', 'aa'],
              ])
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              new Map([
                ['c', 'cc'],
                ['d', 'd'],
                ...rest,
                ['a', 'aa'],
                ['b', 'b'],
              ])
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): both key and value affect sorting by length`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: "'USD'",
                  left: "'EUR'",
                },
                messageId: 'unexpectedMapElementsOrder',
              },
            ],
            output: dedent`
              new Map([
                ['USD', 'United States dollar'],
                ['EUR', 'Euro'],
              ])
            `,
            code: dedent`
              new Map([
                ['EUR', 'Euro'],
                ['USD', 'United States dollar'],
              ])
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  right: "'United States'",
                  left: "'Europe'",
                },
                messageId: 'unexpectedMapElementsOrder',
              },
            ],
            output: dedent`
              new Map([
                ['United States', 'USD'],
                ['Europe', 'EUR'],
              ])
            `,
            code: dedent`
              new Map([
                ['Europe', 'EUR'],
                ['United States', 'USD'],
              ])
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              new Map([
                ['USD', 'United States dollar'],
                ['RUB', 'Russian ruble'],
                ['CNY', 'Renminbi'],
                ['GBP', 'Sterling'],
                ['EUR', 'Euro'],
              ])
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): not sorts spread elements`, rule, {
      valid: [
        {
          code: dedent`
            new Map([
              ...aaa,
              ...bb,
            ])
          `,
          options: [options],
        },
        {
          code: dedent`
            new Map([
              ...bb,
              ...aaa,
            ])
          `,
          options: [options],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}(${type}): works with variables as keys`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'aa',
                left: 'b',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              [aa, aa],
              [b, b],
            ])
          `,
          code: dedent`
            new Map([
              [b, b],
              [aa, aa],
            ])
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Map([
              [aa, aa],
              [b, b],
            ])
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): works with numbers as keys`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '3',
                left: '1',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              [3, 'three'],
              [2, 'two'],
              [1, 'one'],
            ])
          `,
          code: dedent`
            new Map([
              [2, 'two'],
              [1, 'one'],
              [3, 'three'],
            ])
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Map([
              [3, 'three'],
              [1, 'one'],
              [2, 'two'],
            ])
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts variable identifiers`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'cc',
                left: 'd',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
            {
              data: {
                right: 'bbb',
                left: 'cc',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              aaaa,
              bbb,
              cc,
              d,
            ])
          `,
          code: dedent`
            new Map([
              aaaa,
              d,
              cc,
              bbb,
            ])
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Map([
              aaaa,
              bbb,
              cc,
              d,
            ])
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
                messageId: 'unexpectedMapElementsOrder',
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
              new Map([
                [bb, bb],
                [c, c],
                [a, a],
              ])
            `,
            code: dedent`
              new Map([
                [a, a],
                [bb, bb],
                [c, c],
              ])
            `,
          },
          {
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedMapElementsOrder',
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
              new Map([
                [bb, bb],
                [a, a],
                [c, c],
              ])
            `,
            code: dedent`
              new Map([
                [c, c],
                [bb, bb],
                [a, a],
              ])
            `,
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
        invalid: [
          {
            output: dedent`
              new Map([
                ['CNY', 'Renminbi'],
                ['EUR', 'Euro'],
                ['GBP', 'Sterling'],
                ['RUB', 'Russian ruble'],
                ['USD', 'United States dollar'],
              ])
            `,
            code: dedent`
              new Map([
                ['CNY', 'Renminbi'],
                ['RUB', 'Russian ruble'],
                ['USD', 'United States dollar'],
                ['EUR', 'Euro'],
                ['GBP', 'Sterling'],
              ])
            `,
            errors: [
              {
                data: {
                  right: "'EUR'",
                  left: "'USD'",
                },
                messageId: 'unexpectedMapElementsOrder',
              },
            ],
          },
        ],
        valid: [
          dedent`
            new Map([
              ['CNY', 'Renminbi'],
              ['EUR', 'Euro'],
              ['GBP', 'Sterling'],
              ['RUB', 'Russian ruble'],
              ['USD', 'United States dollar'],
            ])
          `,
          {
            code: dedent`
              new Map([
                ['img1.png', '/img1.png'],
                ['img10.png', '/img10.png'],
                ['img12.png', '/img12.png'],
                ['img2.png', '/img2.png']
              ])
            `,
            options: [{}],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}: works with empty map`, rule, {
      valid: ['new Map([[], []])', 'new Map()'],
      invalid: [],
    })

    ruleTester.run(
      `${ruleName}: respect numeric separators with natural sorting`,
      rule,
      {
        invalid: [
          {
            output: dedent`
               new Map([
                [1, "first"],
                [2, "second"],
                [3, "third"],
                [100, "hundredth"],
                [1_000, "thousandth"],
                [1_000_000, "millionth"]
              ])
            `,
            code: dedent`
               new Map([
                [1, "first"],
                [2, "second"],
                [3, "third"],
                [1_000, "thousandth"],
                [100, "hundredth"],
                [1_000_000, "millionth"]
              ])
            `,
            errors: [
              {
                data: {
                  left: '1_000',
                  right: '100',
                },
                messageId: 'unexpectedMapElementsOrder',
              },
            ],
            options: [
              {
                type: 'natural',
                order: 'asc',
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
               new Map([
                [1, "first"],
                [2, "second"],
                [3, "third"],
                [100, "hundredth"],
                [1_000, "thousandth"],
                [1_000_000, "millionth"]
              ])
            `,
            options: [
              {
                type: 'natural',
                order: 'asc',
              },
            ],
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
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              [b, 'b'],
              [c, 'c'],
              // eslint-disable-next-line
              [a, 'a']
            ])
          `,
          code: dedent`
            new Map([
              [c, 'c'],
              [b, 'b'],
              // eslint-disable-next-line
              [a, 'a']
            ])
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
              messageId: 'unexpectedMapElementsOrder',
            },
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              [b, 'b'],
              [c, 'c'],
              // eslint-disable-next-line
              [a, 'a'],
              [d, 'd']
            ])
          `,
          code: dedent`
            new Map([
              [d, 'd'],
              [c, 'c'],
              // eslint-disable-next-line
              [a, 'a'],
              [b, 'b']
            ])
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
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              [b, 'b'],
              [c, 'c'],
              [a, 'a'] // eslint-disable-line
            ])
          `,
          code: dedent`
            new Map([
              [c, 'c'],
              [b, 'b'],
              [a, 'a'] // eslint-disable-line
            ])
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
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              [b, 'b'],
              [c, 'c'],
              /* eslint-disable-next-line */
              [a, 'a']
            ])
          `,
          code: dedent`
            new Map([
              [c, 'c'],
              [b, 'b'],
              /* eslint-disable-next-line */
              [a, 'a']
            ])
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
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          output: dedent`
            new Map([
              [b, 'b'],
              [c, 'c'],
              [a, 'a'] /* eslint-disable-line */
            ])
          `,
          code: dedent`
            new Map([
              [c, 'c'],
              [b, 'b'],
              [a, 'a'] /* eslint-disable-line */
            ])
          `,
          options: [{}],
        },
        {
          output: dedent`
            new Map([
              [a, 'a'],
              [d, 'd'],
              /* eslint-disable */
              [c, 'c'],
              [b, 'b'],
              // Shouldn't move
              /* eslint-enable */
              [e, 'e'],
            ])
          `,
          code: dedent`
            new Map([
              [d, 'd'],
              [e, 'e'],
              /* eslint-disable */
              [c, 'c'],
              [b, 'b'],
              // Shouldn't move
              /* eslint-enable */
              [a, 'a'],
            ])
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            new Map([
              [b, 'b'],
              [c, 'c'],
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              [a, 'a']
            ])
          `,
          code: dedent`
            new Map([
              [c, 'c'],
              [b, 'b'],
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              [a, 'a']
            ])
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            new Map([
              [b, 'b'],
              [c, 'c'],
              [a, 'a'] // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            ])
          `,
          code: dedent`
            new Map([
              [c, 'c'],
              [b, 'b'],
              [a, 'a'] // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            ])
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            new Map([
              [b, 'b'],
              [c, 'c'],
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              [a, 'a']
            ])
          `,
          code: dedent`
            new Map([
              [c, 'c'],
              [b, 'b'],
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              [a, 'a']
            ])
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            new Map([
              [b, 'b'],
              [c, 'c'],
              [a, 'a'] /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            ])
          `,
          code: dedent`
            new Map([
              [c, 'c'],
              [b, 'b'],
              [a, 'a'] /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            ])
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            new Map([
              [a, 'a'],
              [d, 'd'],
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              [c, 'c'],
              [b, 'b'],
              // Shouldn't move
              /* eslint-enable */
              [e, 'e'],
            ])
          `,
          code: dedent`
            new Map([
              [d, 'd'],
              [e, 'e'],
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              [c, 'c'],
              [b, 'b'],
              // Shouldn't move
              /* eslint-enable */
              [a, 'a'],
            ])
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedMapElementsOrder',
            },
          ],
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
              new Map([
                ['a', 'a'],
                ['b', 'b'],
                ['c', 'c'],
              ])
            `,
            options: [{}],
          },
        ],
        invalid: [],
      },
    )
  })
})
