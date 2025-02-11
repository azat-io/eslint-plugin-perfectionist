import type { Rule } from 'eslint'

import { RuleTester } from '@typescript-eslint/rule-tester'
import { RuleTester as EslintRuleTester } from 'eslint'
import { afterAll, describe, it } from 'vitest'
import dedent from 'dedent'

import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-sets'

let ruleName = 'sort-sets'

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
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedSetsOrder',
              },
            ],
            output: dedent`
              new Set([
                'a',
                'b',
                'c',
                'd',
                'e',
                ...other,
              ])
            `,
            code: dedent`
              new Set([
                'a',
                'c',
                'b',
                'd',
                'e',
                ...other,
              ])
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              new Set([
                'a',
                'b',
                'c',
                'd',
                'e',
                ...other,
              ])
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts spread elements`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '...bbbb',
                left: '...ccc',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              ...aaa,
              ...bbbb,
              ...ccc,
            ])
          `,
          code: dedent`
            new Set([
              ...aaa,
              ...ccc,
              ...bbbb,
            ])
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Set([
              ...aaa,
              ...bbbb,
              ...ccc,
            ])
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): ignores nullable array elements`,
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
                messageId: 'unexpectedSetsOrder',
              },
            ],
            output: dedent`
              new Set(['a', 'b', 'c',, 'd'])
            `,
            code: dedent`
              new Set(['b', 'a', 'c',, 'd'])
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              new Set(['a', 'b', 'c',, 'd'])
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allow to put spread elements to the end`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: '...other',
                  right: 'c',
                },
                messageId: 'unexpectedSetsOrder',
              },
            ],
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
            output: dedent`
              new Set(['a', 'b', 'c', ...other])
            `,
            code: dedent`
              new Set(['a', 'b', ...other, 'c'])
            `,
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
            code: dedent`
              new Set(['a', 'b', 'c', ...other])
            `,
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts array constructor`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set(new Array(
              'a',
              'b',
              'c',
              'd',
            ))
          `,
          code: dedent`
            new Set(new Array(
              'a',
              'c',
              'b',
              'd',
            ))
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Set(new Array(
              'a',
              'b',
              'c',
              'd',
            ))
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): allows mixed sorting`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '...d',
                left: 'bbb',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set(new Array(
              ...d,
              'aaaa',
              'bbb',
              'cc',
            ))
          `,
          code: dedent`
            new Set(new Array(
              'aaaa',
              'bbb',
              ...d,
              'cc',
            ))
          `,
          options: [
            {
              ...options,
              groupKind: 'mixed',
            },
          ],
        },
      ],
      valid: [
        {
          code: dedent`
            new Set(new Array(
              ...d,
              'aaaa',
              'bbb',
              'cc',
            ))
          `,
          options: [
            {
              ...options,
              groupKind: 'mixed',
            },
          ],
        },
      ],
    })

    describe(`${ruleName}(${type}): partition by new line`, () => {
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
                  messageId: 'unexpectedSetsOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'e',
                  },
                  messageId: 'unexpectedSetsOrder',
                },
              ],
              output: dedent`
                new Set([
                  'a',
                  'd',

                  'c',

                  'b',
                  'e',
                ])
              `,
              code: dedent`
                new Set([
                  'd',
                  'a',

                  'c',

                  'e',
                  'b',
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

      ruleTester.run(
        `${ruleName}(${type}): prioritize partitions over group kind`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: '...d',
                    left: 'c',
                  },
                  messageId: 'unexpectedSetsOrder',
                },
                {
                  data: {
                    right: '...b',
                    left: 'a',
                  },
                  messageId: 'unexpectedSetsOrder',
                },
              ],
              options: [
                {
                  ...options,
                  groupKind: 'spreads-first',
                  partitionByNewLine: true,
                },
              ],
              output: dedent`
                new Set([
                  ...d,
                  'c',

                  ...b,
                  'a',
                ])
              `,
              code: dedent`
                new Set([
                  'c',
                  ...d,

                  'a',
                  ...b,
                ])
              `,
            },
          ],
          valid: [],
        },
      )
    })

    describe(`${ruleName}(${type}): partition comments`, () => {
      ruleTester.run(
        `${ruleName}(${type}): allows to use partition comments`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'bbb',
                    left: 'd',
                  },
                  messageId: 'unexpectedSetsOrder',
                },
                {
                  data: {
                    right: 'fff',
                    left: 'gg',
                  },
                  messageId: 'unexpectedSetsOrder',
                },
              ],
              output: dedent`
                new Set([
                  // Part: A
                  // Not partition comment
                  'bbb',
                  'cc',
                  'd',
                  // Part: B
                  'aaaa',
                  'e',
                  // Part: C
                  // Not partition comment
                  'fff',
                  'gg',
                ])
              `,
              code: dedent`
                new Set([
                  // Part: A
                  'cc',
                  'd',
                  // Not partition comment
                  'bbb',
                  // Part: B
                  'aaaa',
                  'e',
                  // Part: C
                  'gg',
                  // Not partition comment
                  'fff',
                ])
              `,
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
                new Set([
                  // Comment
                  'bb',
                  // Other comment
                  'a',
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
                new Set([
                  /* Partition Comment */
                  // Part: A
                  'd',
                  // Part: B
                  'aaa',
                  'bb',
                  'c',
                  /* Other */
                  'e',
                ])
              `,
              code: dedent`
                new Set([
                  /* Partition Comment */
                  // Part: A
                  'd',
                  // Part: B
                  'aaa',
                  'c',
                  'bb',
                  /* Other */
                  'e',
                ])
              `,
              errors: [
                {
                  data: {
                    right: 'bb',
                    left: 'c',
                  },
                  messageId: 'unexpectedSetsOrder',
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
              new Set([
                'e',
                'f',
                // I am a partition comment because I don't have f o o
                'a',
                'b',
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
                    right: 'a',
                    left: 'b',
                  },
                  messageId: 'unexpectedSetsOrder',
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
                new Set([
                  /* Comment */
                  'a',
                  'b'
                ])
              `,
              code: dedent`
                new Set([
                  'b',
                  /* Comment */
                  'a'
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
                  new Set([
                    'b',
                    // Comment
                    'a'
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
                options: [
                  {
                    ...options,
                    partitionByComment: {
                      line: ['a', 'b'],
                    },
                  },
                ],
                code: dedent`
                  new Set([
                    'c',
                    // b
                    'b',
                    // a
                    'a'
                  ])
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
                  new Set([
                    'b',
                    // I am a partition comment because I don't have f o o
                    'a'
                  ])
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
                    right: 'a',
                    left: 'b',
                  },
                  messageId: 'unexpectedSetsOrder',
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
                new Set([
                  // Comment
                  'a',
                  'b'
                ])
              `,
              code: dedent`
                new Set([
                  'b',
                  // Comment
                  'a'
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
                  new Set([
                    'b',
                    /* Comment */
                    'a'
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
                  new Set([
                    'c',
                    /* b */
                    'b',
                    /* a */
                    'a'
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
                options: [
                  {
                    ...options,
                    partitionByComment: {
                      block: ['^(?!.*foo).*$'],
                    },
                  },
                ],
                code: dedent`
                  new Set([
                    'b',
                    /* I am a partition comment because I don't have f o o */
                    'a'
                  ])
                `,
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
              new Set([
                '$a',
                'b',
                '$c',
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
              new Set([
                'ab',
                'a$c',
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
            new Set([
              '你好',
              '世界',
              'a',
              'A',
              'b',
              'B',
            ])
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
                messageId: 'unexpectedSetsOrder',
              },
            ],
            output: dedent`
              new Set([
                a, b
              ])
            `,
            code: dedent`
              new Set([
                b, a
              ])
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
                messageId: 'unexpectedSetsOrder',
              },
            ],
            output: dedent`
              new Set([
                a, b,
              ])
            `,
            code: dedent`
              new Set([
                b, a,
              ])
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
                  rightGroup: 'spread',
                  leftGroup: 'literal',
                  right: '...b',
                  left: 'c',
                },
                messageId: 'unexpectedSetsGroupOrder',
              },
            ],
            options: [
              {
                ...options,
                groups: ['spread', 'literal'],
                groupKind: 'mixed',
              },
            ],
            output: dedent`
              new Set([
                ...b,
                'a',
                'c'
              ])
            `,
            code: dedent`
              new Set([
                'c',
                ...b,
                'a'
              ])
            `,
          },
        ],
        valid: [],
      },
    )

    describe(`${ruleName}: custom groups`, () => {
      ruleTester.run(`${ruleName}: filters on selector`, rule, {
        invalid: [
          {
            options: [
              {
                customGroups: [
                  {
                    groupName: 'literalElements',
                    selector: 'literal',
                  },
                ],
                groups: ['literalElements', 'unknown'],
                groupKind: 'mixed',
              },
            ],
            errors: [
              {
                data: {
                  rightGroup: 'literalElements',
                  leftGroup: 'unknown',
                  left: '...b',
                  right: 'a',
                },
                messageId: 'unexpectedSetsGroupOrder',
              },
            ],
            output: dedent`
              new Set([
                'a',
                ...b,
              ])
            `,
            code: dedent`
              new Set([
                ...b,
                'a',
              ])
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
                  customGroups: [
                    {
                      groupName: 'literalsStartingWithHello',
                      selector: 'literal',
                      elementNamePattern,
                    },
                  ],
                  groups: ['literalsStartingWithHello', 'unknown'],
                  groupKind: 'mixed',
                },
              ],
              errors: [
                {
                  data: {
                    rightGroup: 'literalsStartingWithHello',
                    right: 'helloLiteral',
                    leftGroup: 'unknown',
                    left: 'b',
                  },
                  messageId: 'unexpectedSetsGroupOrder',
                },
              ],
              output: dedent`
                new Set([
                  'helloLiteral',
                  'a',
                  'b',
                ])
              `,
              code: dedent`
                new Set([
                  'a',
                  'b',
                  'helloLiteral',
                ])
              `,
            },
          ],
          valid: [],
        })
      }

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
                  messageId: 'unexpectedSetsOrder',
                },
                {
                  data: {
                    right: 'ccc',
                    left: 'bb',
                  },
                  messageId: 'unexpectedSetsOrder',
                },
                {
                  data: {
                    right: 'dddd',
                    left: 'ccc',
                  },
                  messageId: 'unexpectedSetsOrder',
                },
                {
                  data: {
                    rightGroup: 'reversedLiteralsByLineLength',
                    leftGroup: 'unknown',
                    left: '...m',
                    right: 'eee',
                  },
                  messageId: 'unexpectedSetsGroupOrder',
                },
              ],
              options: [
                {
                  customGroups: [
                    {
                      groupName: 'reversedLiteralsByLineLength',
                      selector: 'literal',
                      type: 'line-length',
                      order: 'desc',
                    },
                  ],
                  groups: ['reversedLiteralsByLineLength', 'unknown'],
                  type: 'alphabetical',
                  groupKind: 'mixed',
                  order: 'asc',
                },
              ],
              output: dedent`
                new Set([
                  'dddd',
                  'ccc',
                  'eee',
                  'bb',
                  'ff',
                  'a',
                  'g',
                  ...m,
                  ...o,
                  ...p,
                ])
              `,
              code: dedent`
                new Set([
                  'a',
                  'bb',
                  'ccc',
                  'dddd',
                  ...m,
                  'eee',
                  'ff',
                  'g',
                  ...o,
                  ...p,
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
                      groupName: 'unsortedLiterals',
                      selector: 'literal',
                      type: 'unsorted',
                    },
                  ],
                  groups: ['unsortedLiterals', 'unknown'],
                  groupKind: 'mixed',
                },
              ],
              errors: [
                {
                  data: {
                    rightGroup: 'unsortedLiterals',
                    leftGroup: 'unknown',
                    left: '...m',
                    right: 'c',
                  },
                  messageId: 'unexpectedSetsGroupOrder',
                },
              ],
              output: dedent`
                new Set([
                  'b',
                  'a',
                  'd',
                  'e',
                  'c',
                  ...m,
                ])
              `,
              code: dedent`
                new Set([
                  'b',
                  'a',
                  'd',
                  'e',
                  ...m,
                  'c',
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
                        elementNamePattern: 'foo|Foo',
                        selector: 'literal',
                      },
                      {
                        elementNamePattern: 'foo|Foo',
                        selector: 'spread',
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
                  right: '...foo',
                  left: 'a',
                },
                messageId: 'unexpectedSetsGroupOrder',
              },
            ],
            output: dedent`
              new Set([
                '...foo',
                'cFoo',
                'a',
              ])
            `,
            code: dedent`
              new Set([
                'a',
                '...foo',
                'cFoo',
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
                new Set([
                  'iHaveFooInMyName',
                  'meTooIHaveFoo',
                  'a',
                  'b',
                ])
              `,
            },
          ],
          invalid: [],
        },
      )
    })

    describe(`${ruleName}(${type}): allows to use 'useConfigurationIf'`, () => {
      for (let allNamesMatchPattern of [
        'foo',
        ['noMatch', 'foo'],
        { pattern: 'FOO', flags: 'i' },
        ['noMatch', { pattern: 'foo', flags: 'i' }],
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
                    messageId: 'unexpectedSetsGroupOrder',
                  },
                  {
                    data: {
                      rightGroup: 'r',
                      leftGroup: 'g',
                      right: 'r',
                      left: 'g',
                    },
                    messageId: 'unexpectedSetsGroupOrder',
                  },
                ],
                output: dedent`
                  new Set([
                    'r',
                    'g',
                    'b',
                  ])
                `,
                code: dedent`
                  new Set([
                    'b',
                    'g',
                    'r',
                  ])
                `,
              },
            ],
            valid: [],
          },
        )
      }
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
                  messageId: 'extraSpacingBetweenSetsMembers',
                },
                {
                  data: {
                    right: 'b',
                    left: 'z',
                  },
                  messageId: 'unexpectedSetsOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'z',
                  },
                  messageId: 'extraSpacingBetweenSetsMembers',
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
                new Set([
                  'a',


                 'y',
                'z',

                    'b'
                ])
              `,
              output: dedent`
                new Set([
                  'a',
                 'b',
                'y',
                    'z'
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
                  messageId: 'extraSpacingBetweenSetsMembers',
                },
                {
                  data: {
                    right: 'y',
                    left: 'z',
                  },
                  messageId: 'unexpectedSetsOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'y',
                  },
                  messageId: 'missedSpacingBetweenSetsMembers',
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
                new Set([
                  'a',

                 'y',
                'z',

                    'b',
                ])
              `,
              code: dedent`
                new Set([
                  'a',


                 'z',
                'y',
                    'b',
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
                    messageId: 'missedSpacingBetweenSetsMembers',
                  },
                  {
                    data: {
                      right: 'c',
                      left: 'b',
                    },
                    messageId: 'extraSpacingBetweenSetsMembers',
                  },
                  {
                    data: {
                      right: 'd',
                      left: 'c',
                    },
                    messageId: 'extraSpacingBetweenSetsMembers',
                  },
                ],
                output: dedent`
                  new Set([
                    'a',

                    'b',

                    'c',
                    'd',


                    'e'
                  ])
                `,
                code: dedent`
                  new Set([
                    'a',
                    'b',


                    'c',

                    'd',


                    'e'
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
                        messageId: 'missedSpacingBetweenSetsMembers',
                      },
                    ],
                    output: dedent`
                      new Set([
                        a,

                        b,
                      ])
                    `,
                    code: dedent`
                      new Set([
                        a,
                        b,
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
                      new Set([
                        a,

                        b,
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
                      new Set([
                        a,
                        b,
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
                  new Set([
                    'a', // Comment after
                    'b',

                    'c'
                  ])
                `,
                dedent`
                  new Set([
                    'a', // Comment after

                    'b',
                    'c'
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
                  messageId: 'unexpectedSetsGroupOrder',
                },
              ],
              code: dedent`
                new Set([
                  'b',
                  'a', // Comment after

                  'c'
                ])
              `,
            },
          ],
          valid: [],
        },
      )
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
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedSetsOrder',
              },
            ],
            output: dedent`
              new Set([
                'a',
                'b',
                'c',
                'd',
                'e',
                ...other,
              ])
            `,
            code: dedent`
              new Set([
                'a',
                'c',
                'b',
                'd',
                'e',
                ...other,
              ])
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              new Set([
                'a',
                'b',
                'c',
                'd',
                'e',
                ...other,
              ])
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts spread elements`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '...bbbb',
                left: '...ccc',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              ...aaa,
              ...bbbb,
              ...ccc,
            ])
          `,
          code: dedent`
            new Set([
              ...aaa,
              ...ccc,
              ...bbbb,
            ])
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Set([
              ...aaa,
              ...bbbb,
              ...ccc,
            ])
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): ignores nullable array elements`,
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
                messageId: 'unexpectedSetsOrder',
              },
            ],
            output: dedent`
              new Set(['a', 'b', 'c',, 'd'])
            `,
            code: dedent`
              new Set(['b', 'a', 'c',, 'd'])
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              new Set(['a', 'b', 'c',, 'd'])
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allow to put spread elements to the end`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: '...other',
                  right: 'c',
                },
                messageId: 'unexpectedSetsOrder',
              },
            ],
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
            output: dedent`
              new Set(['a', 'b', 'c', ...other])
            `,
            code: dedent`
              new Set(['a', 'b', ...other, 'c'])
            `,
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
            code: dedent`
              new Set(['a', 'b', 'c', ...other])
            `,
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts array constructor`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set(new Array(
              'a',
              'b',
              'c',
              'd',
            ))
          `,
          code: dedent`
            new Set(new Array(
              'a',
              'c',
              'b',
              'd',
            ))
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Set(new Array(
              'a',
              'b',
              'c',
              'd',
            ))
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): allows mixed sorting`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '...d',
                left: 'bbb',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set(new Array(
              ...d,
              'aaaa',
              'bbb',
              'cc',
            ))
          `,
          code: dedent`
            new Set(new Array(
              'aaaa',
              'bbb',
              ...d,
              'cc',
            ))
          `,
          options: [
            {
              ...options,
              groupKind: 'mixed',
            },
          ],
        },
      ],
      valid: [
        {
          code: dedent`
            new Set(new Array(
              ...d,
              'aaaa',
              'bbb',
              'cc',
            ))
          `,
          options: [
            {
              ...options,
              groupKind: 'mixed',
            },
          ],
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

    ruleTester.run(`${ruleName}(${type}): sorts sets`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              'a',
              'b',
              'c',
              'd',
            ])
          `,
          code: dedent`
            new Set([
              'a',
              'c',
              'b',
              'd',
            ])
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Set(
              'a',
              'b',
              'c',
              'd',
            )
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
                  right: 'bbbb',
                  left: 'ccc',
                },
                messageId: 'unexpectedSetsOrder',
              },
            ],
            output: dedent`
              new Set([
                'aaaaa',
                'bbbb',
                'ccc',
                'dd',
                'e',
                ...other,
              ])
            `,
            code: dedent`
              new Set([
                'aaaaa',
                'ccc',
                'bbbb',
                'dd',
                'e',
                ...other,
              ])
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              new Set([
                'aaaaa',
                'bbbb',
                'ccc',
                'dd',
                'e',
                ...other,
              ])
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts spread elements`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '...bbbb',
                left: '...aaa',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              ...bbbb,
              ...aaa,
              ...ccc,
            ])
          `,
          code: dedent`
            new Set([
              ...aaa,
              ...bbbb,
              ...ccc,
            ])
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Set([
              ...bbbb,
              ...aaa,
              ...ccc,
            ])
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): ignores nullable array elements`,
      rule,
      {
        valid: [
          {
            code: dedent`
              new Set(['a', 'b', 'c',, 'd'])
            `,
            options: [options],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allow to put spread elements to the end`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: '...other',
                  right: 'c',
                },
                messageId: 'unexpectedSetsOrder',
              },
            ],
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
            output: dedent`
              new Set(['a', 'b', 'c', ...other])
            `,
            code: dedent`
              new Set(['a', 'b', ...other, 'c'])
            `,
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                groupKind: 'literals-first',
              },
            ],
            code: dedent`
              new Set(['a', 'b', 'c', ...other])
            `,
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts array constructor`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'bbb',
                left: 'cc',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set(new Array(
              'aaaa',
              'bbb',
              'cc',
              'd',
            ))
          `,
          code: dedent`
            new Set(new Array(
              'aaaa',
              'cc',
              'bbb',
              'd',
            ))
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            new Set(new Array(
              'aaaa',
              'bbb',
              'cc',
              'd',
            ))
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): allows mixed sorting`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                left: '...d',
                right: 'bbb',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set(new Array(
              'aaaa',
              'bbb',
              ...d,
              'cc',
            ))
          `,
          code: dedent`
            new Set(new Array(
              'aaaa',
              ...d,
              'bbb',
              'cc',
            ))
          `,
          options: [
            {
              ...options,
              groupKind: 'mixed',
            },
          ],
        },
      ],
      valid: [
        {
          code: dedent`
            new Set(new Array(
              'aaaa',
              'bbb',
              ...d,
              'cc',
            ))
          `,
          options: [
            {
              ...options,
              groupKind: 'mixed',
            },
          ],
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
                messageId: 'unexpectedSetsOrder',
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
              new Set([
                'bb',
                'c',
                'a',
              ])
            `,
            code: dedent`
              new Set([
                'a',
                'bb',
                'c',
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
                messageId: 'unexpectedSetsOrder',
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
              new Set([
                'bb',
                'a',
                'c',
              ])
            `,
            code: dedent`
              new Set([
                'c',
                'bb',
                'a',
              ])
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
            new Set([
              'b',
              'c',
              'a'
            ])
          `,
          options: [options],
        },
      ],
      invalid: [],
    })
  })

  describe(`${ruleName}: misc`, () => {
    ruleTester.run(
      `${ruleName}: sets alphabetical asc sorting as default`,
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
                messageId: 'unexpectedSetsOrder',
              },
              {
                data: {
                  right: 'c',
                  left: 'd',
                },
                messageId: 'unexpectedSetsOrder',
              },
            ],
            output: dedent`
              new Set([
                'a',
                'b',
                'c',
                'd',
              ])
            `,
            code: dedent`
              new Set([
                'b',
                'a',
                'd',
                'c',
              ])
            `,
          },
        ],
        valid: [
          dedent`
            new Set([
              'a',
              'b',
              'c',
              'd',
            ])
          `,
          {
            code: dedent`
              new Set([
                'v1.png',
                'v10.png',
                'v12.png',
                'v2.png',
              ])
            `,
            options: [
              {
                ignoreCase: false,
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}: works consistently with an empty array or an array with one element`,
      rule,
      {
        valid: ['new Set([])', "new Set(['a'])"],
        invalid: [],
      },
    )

    ruleTester.run(`${ruleName}: ignores quotes of strings`, rule, {
      valid: [
        dedent`
          new Set(['a', "b", 'c'])
        `,
      ],
      invalid: [],
    })

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
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              'b',
              'c',
              // eslint-disable-next-line
              'a',
            ])
          `,
          code: dedent`
            new Set([
              'c',
              'b',
              // eslint-disable-next-line
              'a',
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
              messageId: 'unexpectedSetsOrder',
            },
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              'b',
              'c',
              // eslint-disable-next-line
              'a',
              'd'
            ])
          `,
          code: dedent`
            new Set([
              'd',
              'c',
              // eslint-disable-next-line
              'a',
              'b'
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
              messageId: 'unexpectedSetsOrder',
            },
            {
              data: {
                right: '...anotherArray',
                left: 'a',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              ...anotherArray,
              'b',
              // eslint-disable-next-line
              'a',
              'c'
            ])
          `,
          code: dedent`
            new Set([
              'c',
              'b',
              // eslint-disable-next-line
              'a',
              ...anotherArray
            ])
          `,
          options: [
            {
              groupKind: 'mixed',
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
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              'b',
              'c',
              'a', // eslint-disable-line
            ])
          `,
          code: dedent`
            new Set([
              'c',
              'b',
              'a', // eslint-disable-line
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
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              'b',
              'c',
              /* eslint-disable-next-line */
              'a',
            ])
          `,
          code: dedent`
            new Set([
              'c',
              'b',
              /* eslint-disable-next-line */
              'a',
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
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              'b',
              'c',
              'a', /* eslint-disable-line */
            ])
          `,
          code: dedent`
            new Set([
              'c',
              'b',
              'a', /* eslint-disable-line */
            ])
          `,
          options: [{}],
        },
        {
          output: dedent`
            new Set([
              'a',
              'd',
              /* eslint-disable */
              'c',
              'b',
              // Shouldn't move
              /* eslint-enable */
              'e',
            ])
          `,
          code: dedent`
            new Set([
              'd',
              'e',
              /* eslint-disable */
              'c',
              'b',
              // Shouldn't move
              /* eslint-enable */
              'a',
            ])
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            new Set([
              'b',
              'c',
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              'a',
            ])
          `,
          code: dedent`
            new Set([
              'c',
              'b',
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              'a',
            ])
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              'b',
              'c',
              'a', // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            ])
          `,
          code: dedent`
            new Set([
              'c',
              'b',
              'a', // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            ])
          `,
          options: [{}],
        },
        {
          output: dedent`
            new Set([
              'b',
              'c',
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              'a',
            ])
          `,
          code: dedent`
            new Set([
              'c',
              'b',
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              'a',
            ])
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              'b',
              'c',
              'a', /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            ])
          `,
          code: dedent`
            new Set([
              'c',
              'b',
              'a', /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            ])
          `,
          options: [{}],
        },
        {
          output: dedent`
            new Set([
              'a',
              'd',
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              'c',
              'b',
              // Shouldn't move
              /* eslint-enable */
              'e',
            ])
          `,
          code: dedent`
            new Set([
              'd',
              'e',
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              'c',
              'b',
              // Shouldn't move
              /* eslint-enable */
              'a',
            ])
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedSetsOrder',
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
              new Set([
                'a',
                'b',
                'c',
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
