import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'

import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, expect, it } from 'vitest'
import { dedent } from 'ts-dedent'

import type { MESSAGE_ID, Options } from '../rules/sort-imports'

import rule from '../rules/sort-imports'

let ruleName = 'sort-imports'

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

    ruleTester.run(`${ruleName}(${type}): sorts imports`, rule, {
      valid: [
        {
          code: dedent`
            import { a1, a2 } from 'a'
            import { b1 } from 'b'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            import { b1 } from 'b'
            import { a1, a2 } from 'a'
          `,
          output: dedent`
            import { a1, a2 } from 'a'
            import { b1 } from 'b'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts imports by groups`, rule, {
      valid: [
        {
          code: dedent`
            import type { T } from 't'

            import { c1, c2, c3, c4 } from 'c'
            import { e1 } from 'e/a'
            import { e2 } from 'e/b'
            import fs from 'fs'
            import path from 'path'

            import type { I } from '~/i'

            import { b1, b2 } from '~/b'
            import { c1 } from '~/c'
            import { i1, i2, i3 } from '~/i'

            import type { A } from '.'
            import type { F } from '../f'
            import type { D } from './d'
            import type { H } from './index.d.ts'

            import a from '.'
            import h from '../../h'
            import { j } from '../j'
            import { K, L, M } from '../k'
            import './style.css'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'always',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            import { c1, c2, c3, c4 } from 'c'
            import { e2 } from 'e/b'
            import { e1 } from 'e/a'
            import path from 'path'

            import { b1, b2 } from '~/b'
            import type { I } from '~/i'
            import type { D } from './d'
            import fs from 'fs'
            import { c1 } from '~/c'
            import { i1, i2, i3 } from '~/i'

            import type { A } from '.'
            import type { F } from '../f'
            import h from '../../h'
            import type { H } from './index.d.ts'

            import a from '.'
            import type { T } from 't'
            import './style.css'
            import { j } from '../j'
            import { K, L, M } from '../k'
          `,
          output: dedent`
            import type { T } from 't'

            import { c1, c2, c3, c4 } from 'c'
            import { e1 } from 'e/a'
            import { e2 } from 'e/b'
            import fs from 'fs'
            import path from 'path'

            import type { I } from '~/i'

            import { b1, b2 } from '~/b'
            import { c1 } from '~/c'
            import { i1, i2, i3 } from '~/i'

            import type { A } from '.'
            import type { F } from '../f'
            import type { D } from './d'
            import type { H } from './index.d.ts'

            import a from '.'
            import h from '../../h'
            import './style.css'
            import { j } from '../j'
            import { K, L, M } from '../k'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'always',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: 'e/b',
                right: 'e/a',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: '~/b',
                leftGroup: 'internal',
                right: '~/i',
                rightGroup: 'internal-type',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: '~/i',
                right: './d',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: './d',
                leftGroup: 'sibling-type',
                right: 'fs',
                rightGroup: 'builtin',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: 'fs',
                right: '~/c',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: '../f',
                right: '../../h',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: '../../h',
                leftGroup: 'parent',
                right: './index.d.ts',
                rightGroup: 'index-type',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: '.',
                leftGroup: 'index',
                right: 't',
                rightGroup: 'type',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: 't',
                right: './style.css',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts imports with no spaces`, rule, {
      valid: [
        {
          code: dedent`
              import type { T } from 't'
              import { a1, a2, a3 } from 'a'
              import { b1, b2 } from '~/b'
              import { c1, c2, c3 } from '~/c'
              import d from '.'
              import { e1, e2, e3 } from '../../e'
            `,
          options: [
            {
              ...options,
              newlinesBetween: 'never',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
              import d from '.'
              import { a1, a2, a3 } from 'a'
              import { c1, c2, c3 } from '~/c'

              import type { T } from 't'
              import { e1, e2, e3 } from '../../e'

              import { b1, b2 } from '~/b'
            `,
          output: dedent`
              import type { T } from 't'
              import { a1, a2, a3 } from 'a'
              import { b1, b2 } from '~/b'
              import { c1, c2, c3 } from '~/c'
              import d from '.'
              import { e1, e2, e3 } from '../../e'
            `,
          options: [
            {
              ...options,
              newlinesBetween: 'never',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: '.',
                leftGroup: 'index',
                right: 'a',
                rightGroup: 'external',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: '~/c',
                leftGroup: 'internal',
                right: 't',
                rightGroup: 'type',
              },
            },
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: '~/c',
                right: 't',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: '../../e',
                leftGroup: 'parent',
                right: '~/b',
                rightGroup: 'internal',
              },
            },
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: '../../e',
                right: '~/b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): disallow extra spaces`, rule, {
      valid: [
        {
          code: dedent`
              import { A } from 'a'

              import b from '~/b'
              import c from '~/c'
              import d from '~/d'
            `,
          options: [
            {
              ...options,
              newlinesBetween: 'always',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            import { A } from 'a'


            import b from '~/b'
            import c from '~/c'

            import d from '~/d'
          `,
          output: dedent`
            import { A } from 'a'

            import b from '~/b'
            import c from '~/c'
            import d from '~/d'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'always',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: 'a',
                right: '~/b',
              },
            },
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: '~/c',
                right: '~/d',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): supports typescript object-imports`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type T = require("T")

              import { A } from 'a'

              import { B } from '../b'

              import c = require('c/c')
              import log = console.log
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import type T = require("T")

              import { A } from 'a'
              import { B } from '../b'

              import log = console.log
              import c = require('c/c')
            `,
            output: dedent`
              import type T = require("T")

              import { A } from 'a'

              import { B } from '../b'

              import c = require('c/c')
              import log = console.log
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'a',
                  right: '../b',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: 'console.log',
                  right: 'c/c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): use type if type of type is not defined`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { T } from '../t'
              import type { U } from '~/u'
              import type { V } from 'v'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal',
                  ['parent', 'sibling', 'index'],
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import type { T } from '../t'

              import type { U } from '~/u'

              import type { V } from 'v'
            `,
            output: dedent`
              import type { T } from '../t'
              import type { U } from '~/u'
              import type { V } from 'v'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal',
                  ['parent', 'sibling', 'index'],
                ],
              },
            ],
            errors: [
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: '../t',
                  right: '~/u',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: '~/u',
                  right: 'v',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): doesn't break user comments`, rule, {
      valid: [
        {
          code: dedent`
            import { b1, b2 } from 'b'

            /**
             * Comment
             */

            import { a } from 'a'
            import { c } from 'c'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'always',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}(${type}): ignores inline comments`, rule, {
      valid: [
        {
          code: dedent`
            import { a } from 'a'
            import { b1, b2 } from 'b' // Comment
            import { c } from 'c'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'always',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
        },
      ],
      invalid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}): ignores comments for counting lines between imports`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { T } from 't'

              // @ts-expect-error missing types
              import { t } from 't'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): breaks import sorting if there is other nodes between`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { V } from 'v'

              export type { U } from 'u'

              import type { T1, T2 } from 't'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): separates style imports from the rest`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import { a1, a2 } from 'a'

              import styles from '../s.css'
              import './t.css'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'style',
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): separates side effect imports from the rest`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import { A } from '../a'
              import { b } from './b'

              import '../c.js'
              import './d'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'side-effect',
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): separates builtin type from the rest types`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { Server } from 'http'

              import a from 'a'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: ['builtin-type', 'type'],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with imports ending with a semicolon`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              import a from 'a';
              import b from './index';
            `,
            output: dedent`
              import a from 'a';

              import b from './index';
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  ['object', 'unknown'],
                ],
              },
            ],
            errors: [
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'a',
                  right: './index',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): remove unnecessary spaces`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            import { a } from 'a'


            import { b } from './b'



            import { c } from 'c'
          `,
          output: dedent`
            import { a } from 'a'
            import { c } from 'c'

            import { b } from './b'
          `,
          options: [
            {
              ...options,
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: 'a',
                right: './b',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: './b',
                leftGroup: 'sibling',
                right: 'c',
                rightGroup: 'external',
              },
            },
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: './b',
                right: 'c',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to define custom groups`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              import type { T } from 't'

              import a1 from '@a/a1'
              import a2 from '@a/a2'
              import b1 from '@b/b1'
              import b2 from '@b/b2'
              import b3 from '@b/b3'
              import { c } from 'c'
            `,
            output: dedent`
              import a1 from '@a/a1'
              import a2 from '@a/a2'
              import type { T } from 't'

              import b1 from '@b/b1'
              import b2 from '@b/b2'
              import b3 from '@b/b3'

              import { c } from 'c'
            `,
            options: [
              {
                ...options,
                customGroups: {
                  type: {
                    primary: ['t', '@a/**'],
                  },
                  value: {
                    primary: ['t', '@a/**'],
                    secondary: '@b/**',
                  },
                },
                groups: [
                  'type',
                  'primary',
                  'secondary',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: 't',
                  right: '@a/a1',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: 't',
                  right: '@a/a1',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: '@a/a2',
                  right: '@b/b1',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: '@b/b3',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to define value only custom groups`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              import type { A } from 'a'
              import { a } from 'a'
            `,
            output: dedent`
              import type { A } from 'a'

              import { a } from 'a'
            `,
            options: [
              {
                ...options,
                customGroups: {
                  value: {
                    primary: ['a'],
                  },
                },
                groups: ['type', 'primary'],
              },
            ],
            errors: [
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'a',
                  right: 'a',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows hash symbol in internal pattern`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { T } from 'a'

              import { a } from 'a'

              import type { S } from '#b'

              import { b1, b2 } from '#b'
              import c from '#c'

              import { d } from '../d'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['#**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import type { T } from 'a'

              import { a } from 'a'

              import type { S } from '#b'
              import c from '#c'
              import { b1, b2 } from '#b'

              import { d } from '../d'
            `,
            output: dedent`
              import type { T } from 'a'

              import { a } from 'a'

              import type { S } from '#b'

              import { b1, b2 } from '#b'
              import c from '#c'

              import { d } from '../d'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['#**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: '#b',
                  right: '#c',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '#c',
                  right: '#b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use bun modules`, rule, {
      valid: [
        {
          code: dedent`
            import { expect } from 'bun:test'
            import { a } from 'a'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'never',
              groups: ['builtin', 'external', 'unknown'],
              environment: 'bun',
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            import { a } from 'a'
            import { expect } from 'bun:test'
          `,
          output: dedent`
            import { expect } from 'bun:test'
            import { a } from 'a'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'never',
              groups: ['builtin', 'external', 'unknown'],
              environment: 'bun',
            },
          ],
          errors: [
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: 'a',
                leftGroup: 'external',
                right: 'bun:test',
                rightGroup: 'builtin',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts require imports`, rule, {
      valid: [
        {
          code: dedent`
            const { a1, a2 } = require('a')
            const { b1 } = require('b')
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            const { b1 } = require('b')
            const { a1, a2 } = require('a')
          `,
          output: dedent`
            const { a1, a2 } = require('a')
            const { b1 } = require('b')
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts require imports by groups`,
      rule,
      {
        valid: [
          {
            code: dedent`
            const { c1, c2, c3, c4 } = require('c')
            const { e1 } = require('e/a')
            const { e2 } = require('e/b')
            const fs = require('fs')
            const path = require('path')

            const { b1, b2 } = require('~/b')
            const { c1 } = require('~/c')
            const { i1, i2, i3 } = require('~/i')

            const a = require('.')
            const h = require('../../h')
            const { j } = require('../j')
            const { K, L, M } = require('../k')
          `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              const { c1, c2, c3, c4 } = require('c')
              const { e2 } = require('e/b')
              const { e1 } = require('e/a')
              const path = require('path')

              const { b1, b2 } = require('~/b')
              const fs = require('fs')
              const { c1 } = require('~/c')
              const { i1, i2, i3 } = require('~/i')

              const h = require('../../h')

              const a = require('.')
              const { j } = require('../j')
              const { K, L, M } = require('../k')
            `,
            output: dedent`
              const { c1, c2, c3, c4 } = require('c')
              const { e1 } = require('e/a')
              const { e2 } = require('e/b')
              const fs = require('fs')
              const path = require('path')

              const { b1, b2 } = require('~/b')
              const { c1 } = require('~/c')
              const { i1, i2, i3 } = require('~/i')

              const a = require('.')
              const h = require('../../h')
              const { j } = require('../j')
              const { K, L, M } = require('../k')
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: 'e/b',
                  right: 'e/a',
                },
              },
              {
                messageId: 'unexpectedImportsGroupOrder',
                data: {
                  left: '~/b',
                  leftGroup: 'internal',
                  right: 'fs',
                  rightGroup: 'builtin',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'fs',
                  right: '~/c',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '../../h',
                  right: '.',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: '../../h',
                  right: '.',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): can enable or disable sorting side effect imports`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import a from 'aaaa'

              import 'bbb'
              import './cc'
              import '../d'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: ['external', 'side-effect', 'unknown'],
                sortSideEffects: false,
              },
            ],
          },
          {
            code: dedent`
              import 'c'
              import 'bb'
              import 'aaa'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: ['external', 'side-effect', 'unknown'],
                sortSideEffects: false,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import './cc'
              import 'bbb'
              import e from 'e'
              import a from 'aaaa'
              import '../d'
            `,
            output: dedent`
              import a from 'aaaa'
              import e from 'e'

              import './cc'
              import 'bbb'
              import '../d'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: ['external', 'side-effect', 'unknown'],
                sortSideEffects: false,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedImportsGroupOrder',
                data: {
                  left: 'bbb',
                  leftGroup: 'side-effect',
                  right: 'e',
                  rightGroup: 'external',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: 'e',
                  right: 'aaaa',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'aaaa',
                  right: '../d',
                },
              },
            ],
          },
          {
            code: dedent`
              import 'c'
              import 'bb'
              import 'aaa'
            `,
            output: dedent`
              import 'aaa'
              import 'bb'
              import 'c'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: ['external', 'side-effect', 'unknown'],
                sortSideEffects: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: 'c',
                  right: 'bb',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: 'bb',
                  right: 'aaa',
                },
              },
            ],
          },
        ],
      },
    )

    describe(`${ruleName}(${type}): disabling side-effect sorting`, () => {
      ruleTester.run(
        `${ruleName}(${type}): allows 'side-effect' and 'side-effect-style' groups to stay in place`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                import "./z-side-effect.scss";
                import b from "./b";
                import './b-side-effect'
                import "./g-side-effect.css";
                import './a-side-effect'
                import a from "./a";
              `,
              output: dedent`
                import "./z-side-effect.scss";
                import a from "./a";
                import './b-side-effect'
                import "./g-side-effect.css";
                import './a-side-effect'
                import b from "./b";
              `,
              options: [
                {
                  ...options,
                  newlinesBetween: 'always',
                  groups: ['unknown'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedImportsOrder',
                  data: {
                    left: './b',
                    right: './b-side-effect',
                  },
                },
                {
                  messageId: 'unexpectedImportsOrder',
                  data: {
                    left: './a-side-effect',
                    right: './a',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows 'side-effect' to be grouped together but not sorted`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                import "./z-side-effect.scss";
                import b from "./b";
                import './b-side-effect'
                import "./g-side-effect.css";
                import './a-side-effect'
                import a from "./a";
              `,
              output: dedent`
                import "./z-side-effect.scss";
                import './b-side-effect'
                import "./g-side-effect.css";
                import './a-side-effect'

                import a from "./a";
                import b from "./b";
              `,
              options: [
                {
                  ...options,
                  newlinesBetween: 'always',
                  groups: ['side-effect', 'unknown'],
                },
              ],
              errors: [
                {
                  messageId: 'missedSpacingBetweenImports',
                  data: {
                    left: './z-side-effect.scss',
                    right: './b',
                  },
                },
                {
                  messageId: 'unexpectedImportsGroupOrder',
                  data: {
                    left: './b',
                    leftGroup: 'unknown',
                    right: './b-side-effect',
                    rightGroup: 'side-effect',
                  },
                },
                {
                  messageId: 'missedSpacingBetweenImports',
                  data: {
                    left: './a-side-effect',
                    right: './a',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows 'side-effect' and 'side-effect-style' to be grouped together
         in the same group but not sorted`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                import "./z-side-effect.scss";
                import b from "./b";
                import './b-side-effect'
                import "./g-side-effect.css";
                import './a-side-effect'
                import a from "./a";
              `,
              output: dedent`
                import "./z-side-effect.scss";
                import './b-side-effect'
                import "./g-side-effect.css";
                import './a-side-effect'

                import a from "./a";
                import b from "./b";
              `,
              options: [
                {
                  ...options,
                  newlinesBetween: 'always',
                  groups: [['side-effect', 'side-effect-style'], 'unknown'],
                },
              ],
              errors: [
                {
                  messageId: 'missedSpacingBetweenImports',
                  data: {
                    left: './z-side-effect.scss',
                    right: './b',
                  },
                },
                {
                  messageId: 'unexpectedImportsGroupOrder',
                  data: {
                    left: './b',
                    leftGroup: 'unknown',
                    right: './b-side-effect',
                    rightGroup: 'side-effect',
                  },
                },
                {
                  messageId: 'missedSpacingBetweenImports',
                  data: {
                    left: './a-side-effect',
                    right: './a',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows 'side-effect' and 'side-effect-style' to be grouped together but not sorted`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                import "./z-side-effect.scss";
                import b from "./b";
                import './b-side-effect'
                import "./g-side-effect.css";
                import './a-side-effect'
                import a from "./a";
              `,
              output: dedent`
                import './b-side-effect'
                import './a-side-effect'

                import "./z-side-effect.scss";
                import "./g-side-effect.css";

                import a from "./a";
                import b from "./b";
              `,
              options: [
                {
                  ...options,
                  newlinesBetween: 'always',
                  groups: ['side-effect', 'side-effect-style', 'unknown'],
                },
              ],
              errors: [
                {
                  messageId: 'missedSpacingBetweenImports',
                  data: {
                    left: './z-side-effect.scss',
                    right: './b',
                  },
                },
                {
                  messageId: 'unexpectedImportsGroupOrder',
                  data: {
                    left: './b',
                    leftGroup: 'unknown',
                    right: './b-side-effect',
                    rightGroup: 'side-effect',
                  },
                },
                {
                  messageId: 'missedSpacingBetweenImports',
                  data: {
                    left: './b-side-effect',
                    right: './g-side-effect.css',
                  },
                },
                {
                  messageId: 'unexpectedImportsGroupOrder',
                  data: {
                    left: './g-side-effect.css',
                    leftGroup: 'side-effect-style',
                    right: './a-side-effect',
                    rightGroup: 'side-effect',
                  },
                },
                {
                  messageId: 'missedSpacingBetweenImports',
                  data: {
                    left: './a-side-effect',
                    right: './a',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows 'side-effect-style' to be grouped together but not sorted`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                import "./z-side-effect";
                import b from "./b";
                import './b-side-effect.scss'
                import "./g-side-effect";
                import './a-side-effect.css'
                import a from "./a";
              `,
              output: dedent`
                import "./z-side-effect";

                import './b-side-effect.scss'
                import './a-side-effect.css'

                import "./g-side-effect";
                import a from "./a";
                import b from "./b";
              `,
              options: [
                {
                  ...options,
                  newlinesBetween: 'always',
                  groups: ['side-effect-style', 'unknown'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedImportsGroupOrder',
                  data: {
                    left: './b',
                    leftGroup: 'unknown',
                    right: './b-side-effect.scss',
                    rightGroup: 'side-effect-style',
                  },
                },
                {
                  messageId: 'missedSpacingBetweenImports',
                  data: {
                    left: './b-side-effect.scss',
                    right: './g-side-effect',
                  },
                },
                {
                  messageId: 'unexpectedImportsGroupOrder',
                  data: {
                    left: './g-side-effect',
                    leftGroup: 'unknown',
                    right: './a-side-effect.css',
                    rightGroup: 'side-effect-style',
                  },
                },
                {
                  messageId: 'missedSpacingBetweenImports',
                  data: {
                    left: './a-side-effect.css',
                    right: './a',
                  },
                },
              ],
            },
          ],
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
              import '_a'
              import 'b'
              import '_c'
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
              import 'ab'
              import 'a_c'
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

    ruleTester.run(`${ruleName}(${type}): sorts imports`, rule, {
      valid: [
        {
          code: dedent`
            import { a1, a2 } from 'a'
            import { b1 } from 'b'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            import { b1 } from 'b'
            import { a1, a2 } from 'a'
          `,
          output: dedent`
            import { a1, a2 } from 'a'
            import { b1 } from 'b'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts imports by groups`, rule, {
      valid: [
        {
          code: dedent`
            import type { T } from 't'

            import { c1, c2, c3, c4 } from 'c'
            import { e1 } from 'e/a'
            import { e2 } from 'e/b'
            import fs from 'fs'
            import path from 'path'

            import type { I } from '~/i'

            import { b1, b2 } from '~/b'
            import { c1 } from '~/c'
            import { i1, i2, i3 } from '~/i'

            import type { A } from '.'
            import type { F } from '../f'
            import type { D } from './d'
            import type { H } from './index.d.ts'

            import a from '.'
            import h from '../../h'
            import { j } from '../j'
            import { K, L, M } from '../k'
            import './style.css'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'always',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            import { c1, c2, c3, c4 } from 'c'
            import { e2 } from 'e/b'
            import { e1 } from 'e/a'
            import path from 'path'

            import { b1, b2 } from '~/b'
            import type { I } from '~/i'
            import type { D } from './d'
            import fs from 'fs'
            import { c1 } from '~/c'
            import { i1, i2, i3 } from '~/i'

            import type { A } from '.'
            import type { F } from '../f'
            import h from '../../h'
            import type { H } from './index.d.ts'

            import a from '.'
            import type { T } from 't'
            import './style.css'
            import { j } from '../j'
            import { K, L, M } from '../k'
          `,
          output: dedent`
            import type { T } from 't'

            import { c1, c2, c3, c4 } from 'c'
            import { e1 } from 'e/a'
            import { e2 } from 'e/b'
            import fs from 'fs'
            import path from 'path'

            import type { I } from '~/i'

            import { b1, b2 } from '~/b'
            import { c1 } from '~/c'
            import { i1, i2, i3 } from '~/i'

            import type { A } from '.'
            import type { F } from '../f'
            import type { D } from './d'
            import type { H } from './index.d.ts'

            import a from '.'
            import h from '../../h'
            import './style.css'
            import { j } from '../j'
            import { K, L, M } from '../k'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'always',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: 'e/b',
                right: 'e/a',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: '~/b',
                leftGroup: 'internal',
                right: '~/i',
                rightGroup: 'internal-type',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: '~/i',
                right: './d',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: './d',
                leftGroup: 'sibling-type',
                right: 'fs',
                rightGroup: 'builtin',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: 'fs',
                right: '~/c',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: '../f',
                right: '../../h',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: '../../h',
                leftGroup: 'parent',
                right: './index.d.ts',
                rightGroup: 'index-type',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: '.',
                leftGroup: 'index',
                right: 't',
                rightGroup: 'type',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: 't',
                right: './style.css',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts imports with no spaces`, rule, {
      valid: [
        {
          code: dedent`
              import type { T } from 't'
              import { a1, a2, a3 } from 'a'
              import { b1, b2 } from '~/b'
              import { c1, c2, c3 } from '~/c'
              import d from '.'
              import { e1, e2, e3 } from '../../e'
            `,
          options: [
            {
              ...options,
              newlinesBetween: 'never',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
              import d from '.'
              import { a1, a2, a3 } from 'a'
              import { c1, c2, c3 } from '~/c'

              import type { T } from 't'
              import { e1, e2, e3 } from '../../e'

              import { b1, b2 } from '~/b'
            `,
          output: dedent`
              import type { T } from 't'
              import { a1, a2, a3 } from 'a'
              import { b1, b2 } from '~/b'
              import { c1, c2, c3 } from '~/c'
              import d from '.'
              import { e1, e2, e3 } from '../../e'
            `,
          options: [
            {
              ...options,
              newlinesBetween: 'never',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: '.',
                leftGroup: 'index',
                right: 'a',
                rightGroup: 'external',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: '~/c',
                leftGroup: 'internal',
                right: 't',
                rightGroup: 'type',
              },
            },
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: '~/c',
                right: 't',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: '../../e',
                leftGroup: 'parent',
                right: '~/b',
                rightGroup: 'internal',
              },
            },
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: '../../e',
                right: '~/b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): disallow extra spaces`, rule, {
      valid: [
        {
          code: dedent`
              import { A } from 'a'

              import b from '~/b'
              import c from '~/c'
              import d from '~/d'
            `,
          options: [
            {
              ...options,
              newlinesBetween: 'always',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            import { A } from 'a'


            import b from '~/b'
            import c from '~/c'

            import d from '~/d'
          `,
          output: dedent`
            import { A } from 'a'

            import b from '~/b'
            import c from '~/c'
            import d from '~/d'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'always',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: 'a',
                right: '~/b',
              },
            },
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: '~/c',
                right: '~/d',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): supports typescript object-imports`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type T = require("T")

              import { A } from 'a'

              import { B } from '../b'

              import c = require('c/c')
              import log = console.log
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import type T = require("T")

              import { A } from 'a'
              import { B } from '../b'

              import log = console.log
              import c = require('c/c')
            `,
            output: dedent`
              import type T = require("T")

              import { A } from 'a'

              import { B } from '../b'

              import c = require('c/c')
              import log = console.log
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'a',
                  right: '../b',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: 'console.log',
                  right: 'c/c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): use type if type of type is not defined`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { T } from '../t'
              import type { U } from '~/u'
              import type { V } from 'v'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal',
                  ['parent', 'sibling', 'index'],
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import type { T } from '../t'

              import type { U } from '~/u'

              import type { V } from 'v'
            `,
            output: dedent`
              import type { T } from '../t'
              import type { U } from '~/u'
              import type { V } from 'v'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal',
                  ['parent', 'sibling', 'index'],
                ],
              },
            ],
            errors: [
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: '../t',
                  right: '~/u',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: '~/u',
                  right: 'v',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): doesn't break user comments`, rule, {
      valid: [
        {
          code: dedent`
            import { b1, b2 } from 'b'

            /**
             * Comment
             */

            import { a } from 'a'
            import { c } from 'c'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'always',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}(${type}): ignores inline comments`, rule, {
      valid: [
        {
          code: dedent`
            import { a } from 'a'
            import { b1, b2 } from 'b' // Comment
            import { c } from 'c'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'always',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
        },
      ],
      invalid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}): ignores comments for counting lines between imports`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { T } from 't'

              // @ts-expect-error missing types
              import { t } from 't'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): breaks import sorting if there is other nodes between`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { V } from 'v'

              export type { U } from 'u'

              import type { T1, T2 } from 't'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): separates style imports from the rest`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import { a1, a2 } from 'a'

              import styles from '../s.css'
              import './t.css'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'style',
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): separates side effect imports from the rest`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import { A } from '../a'
              import { b } from './b'

              import '../c.js'
              import './d'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'side-effect',
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): separates builtin type from the rest types`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { Server } from 'http'

              import a from 'a'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: ['builtin-type', 'type'],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with imports ending with a semicolon`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              import a from 'a';
              import b from './index';
            `,
            output: dedent`
              import a from 'a';

              import b from './index';
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  ['object', 'unknown'],
                ],
              },
            ],
            errors: [
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'a',
                  right: './index',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): remove unnecessary spaces`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            import { a } from 'a'


            import { b } from './b'



            import { c } from 'c'
          `,
          output: dedent`
            import { a } from 'a'
            import { c } from 'c'

            import { b } from './b'
          `,
          options: [
            {
              ...options,
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: 'a',
                right: './b',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: './b',
                leftGroup: 'sibling',
                right: 'c',
                rightGroup: 'external',
              },
            },
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: './b',
                right: 'c',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to define custom groups`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              import type { T } from 't'

              import a1 from '@a/a1'
              import a2 from '@a/a2'
              import b1 from '@b/b1'
              import b2 from '@b/b2'
              import b3 from '@b/b3'
              import { c } from 'c'
            `,
            output: dedent`
              import a1 from '@a/a1'
              import a2 from '@a/a2'
              import type { T } from 't'

              import b1 from '@b/b1'
              import b2 from '@b/b2'
              import b3 from '@b/b3'

              import { c } from 'c'
            `,
            options: [
              {
                ...options,
                customGroups: {
                  type: {
                    primary: ['t', '@a/**'],
                  },
                  value: {
                    primary: ['t', '@a/**'],
                    secondary: '@b/**',
                  },
                },
                groups: [
                  'type',
                  'primary',
                  'secondary',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: 't',
                  right: '@a/a1',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: 't',
                  right: '@a/a1',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: '@a/a2',
                  right: '@b/b1',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: '@b/b3',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to define value only custom groups`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              import type { A } from 'a'
              import { a } from 'a'
            `,
            output: dedent`
              import type { A } from 'a'

              import { a } from 'a'
            `,
            options: [
              {
                ...options,
                customGroups: {
                  value: {
                    primary: ['a'],
                  },
                },
                groups: ['type', 'primary'],
              },
            ],
            errors: [
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'a',
                  right: 'a',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows hash symbol in internal pattern`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { T } from 'a'

              import { a } from 'a'

              import type { S } from '#b'

              import { b1, b2 } from '#b'
              import c from '#c'

              import { d } from '../d'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['#**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import type { T } from 'a'

              import { a } from 'a'

              import type { S } from '#b'
              import c from '#c'
              import { b1, b2 } from '#b'

              import { d } from '../d'
            `,
            output: dedent`
              import type { T } from 'a'

              import { a } from 'a'

              import type { S } from '#b'

              import { b1, b2 } from '#b'
              import c from '#c'

              import { d } from '../d'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['#**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: '#b',
                  right: '#c',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '#c',
                  right: '#b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use bun modules`, rule, {
      valid: [
        {
          code: dedent`
            import { expect } from 'bun:test'
            import { a } from 'a'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'never',
              groups: ['builtin', 'external', 'unknown'],
              environment: 'bun',
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            import { a } from 'a'
            import { expect } from 'bun:test'
          `,
          output: dedent`
            import { expect } from 'bun:test'
            import { a } from 'a'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'never',
              groups: ['builtin', 'external', 'unknown'],
              environment: 'bun',
            },
          ],
          errors: [
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: 'a',
                leftGroup: 'external',
                right: 'bun:test',
                rightGroup: 'builtin',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts require imports`, rule, {
      valid: [
        {
          code: dedent`
            const { a1, a2 } = require('a')
            const { b1 } = require('b')
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            const { b1 } = require('b')
            const { a1, a2 } = require('a')
          `,
          output: dedent`
            const { a1, a2 } = require('a')
            const { b1 } = require('b')
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts require imports by groups`,
      rule,
      {
        valid: [
          {
            code: dedent`
            const { c1, c2, c3, c4 } = require('c')
            const { e1 } = require('e/a')
            const { e2 } = require('e/b')
            const fs = require('fs')
            const path = require('path')

            const { b1, b2 } = require('~/b')
            const { c1 } = require('~/c')
            const { i1, i2, i3 } = require('~/i')

            const a = require('.')
            const h = require('../../h')
            const { j } = require('../j')
            const { K, L, M } = require('../k')
          `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              const { c1, c2, c3, c4 } = require('c')
              const { e2 } = require('e/b')
              const { e1 } = require('e/a')
              const path = require('path')

              const { b1, b2 } = require('~/b')
              const fs = require('fs')
              const { c1 } = require('~/c')
              const { i1, i2, i3 } = require('~/i')

              const h = require('../../h')

              const a = require('.')
              const { j } = require('../j')
              const { K, L, M } = require('../k')
            `,
            output: dedent`
              const { c1, c2, c3, c4 } = require('c')
              const { e1 } = require('e/a')
              const { e2 } = require('e/b')
              const fs = require('fs')
              const path = require('path')

              const { b1, b2 } = require('~/b')
              const { c1 } = require('~/c')
              const { i1, i2, i3 } = require('~/i')

              const a = require('.')
              const h = require('../../h')
              const { j } = require('../j')
              const { K, L, M } = require('../k')
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: 'e/b',
                  right: 'e/a',
                },
              },
              {
                messageId: 'unexpectedImportsGroupOrder',
                data: {
                  left: '~/b',
                  leftGroup: 'internal',
                  right: 'fs',
                  rightGroup: 'builtin',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'fs',
                  right: '~/c',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '../../h',
                  right: '.',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: '../../h',
                  right: '.',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): can enable or disable sorting side effect imports`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import a from 'aaaa'

              import 'bbb'
              import './cc'
              import '../d'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: ['external', 'side-effect', 'unknown'],
                sortSideEffects: false,
              },
            ],
          },
          {
            code: dedent`
              import 'c'
              import 'bb'
              import 'aaa'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: ['external', 'side-effect', 'unknown'],
                sortSideEffects: false,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import './cc'
              import 'bbb'
              import e from 'e'
              import a from 'aaaa'
              import '../d'
            `,
            output: dedent`
              import a from 'aaaa'
              import e from 'e'

              import './cc'
              import 'bbb'
              import '../d'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: ['external', 'side-effect', 'unknown'],
                sortSideEffects: false,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedImportsGroupOrder',
                data: {
                  left: 'bbb',
                  leftGroup: 'side-effect',
                  right: 'e',
                  rightGroup: 'external',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: 'e',
                  right: 'aaaa',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'aaaa',
                  right: '../d',
                },
              },
            ],
          },
          {
            code: dedent`
              import 'c'
              import 'bb'
              import 'aaa'
            `,
            output: dedent`
              import 'aaa'
              import 'bb'
              import 'c'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: ['external', 'side-effect', 'unknown'],
                sortSideEffects: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: 'c',
                  right: 'bb',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: 'bb',
                  right: 'aaa',
                },
              },
            ],
          },
        ],
      },
    )
  })

  describe(`${ruleName}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts imports`, rule, {
      valid: [
        {
          code: dedent`
            import { a1, a2 } from 'a'
            import { b1 } from 'b'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            import { b1 } from 'b'
            import { a1, a2 } from 'a'
          `,
          output: dedent`
            import { a1, a2 } from 'a'
            import { b1 } from 'b'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts imports by groups`, rule, {
      valid: [
        {
          code: dedent`
            import type { T } from 't'

            import { c1, c2, c3, c4 } from 'c'
            import { e1 } from 'e/a'
            import { e2 } from 'e/b'
            import path from 'path'
            import fs from 'fs'

            import type { I } from '~/i'

            import { i1, i2, i3 } from '~/i'
            import { b1, b2 } from '~/b'
            import { c1 } from '~/c'

            import type { H } from './index.d.ts'
            import type { F } from '../f'
            import type { D } from './d'
            import type { A } from '.'

            import { K, L, M } from '../k'
            import { j } from '../j'
            import h from '../../h'
            import './style.css'
            import a from '.'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'always',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            import { c1, c2, c3, c4 } from 'c'
            import { e2 } from 'e/b'
            import { e1 } from 'e/a'
            import path from 'path'

            import { b1, b2 } from '~/b'
            import type { I } from '~/i'
            import type { D } from './d'
            import fs from 'fs'
            import { c1 } from '~/c'
            import { i1, i2, i3 } from '~/i'

            import type { A } from '.'
            import type { F } from '../f'
            import h from '../../h'
            import type { H } from './index.d.ts'

            import a from '.'
            import type { T } from 't'
            import './style.css'
            import { j } from '../j'
            import { K, L, M } from '../k'
          `,
          output: dedent`
            import type { T } from 't'

            import { c1, c2, c3, c4 } from 'c'
            import { e2 } from 'e/b'
            import { e1 } from 'e/a'
            import path from 'path'
            import fs from 'fs'

            import type { I } from '~/i'

            import { i1, i2, i3 } from '~/i'
            import { b1, b2 } from '~/b'
            import { c1 } from '~/c'

            import type { H } from './index.d.ts'
            import type { F } from '../f'
            import type { D } from './d'
            import type { A } from '.'

            import { K, L, M } from '../k'
            import { j } from '../j'
            import './style.css'
            import h from '../../h'
            import a from '.'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'always',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: '~/b',
                leftGroup: 'internal',
                right: '~/i',
                rightGroup: 'internal-type',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: '~/i',
                right: './d',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: './d',
                leftGroup: 'sibling-type',
                right: 'fs',
                rightGroup: 'builtin',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: 'fs',
                right: '~/c',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '~/c',
                right: '~/i',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '.',
                right: '../f',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: '../f',
                right: '../../h',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: '../../h',
                leftGroup: 'parent',
                right: './index.d.ts',
                rightGroup: 'index-type',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: '.',
                leftGroup: 'index',
                right: 't',
                rightGroup: 'type',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: 't',
                right: './style.css',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: './style.css',
                right: '../j',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '../j',
                right: '../k',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts imports with no spaces`, rule, {
      valid: [
        {
          code: dedent`
              import type { T } from 't'
              import { a1, a2, a3 } from 'a'
              import { c1, c2, c3 } from '~/c'
              import { b1, b2 } from '~/b'
              import { e1, e2, e3 } from '../../e'
              import d from '.'
            `,
          options: [
            {
              ...options,
              newlinesBetween: 'never',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
              import d from '.'
              import { a1, a2, a3 } from 'a'
              import { c1, c2, c3 } from '~/c'

              import type { T } from 't'
              import { e1, e2, e3 } from '../../e'

              import { b1, b2 } from '~/b'
            `,
          output: dedent`
              import type { T } from 't'
              import { a1, a2, a3 } from 'a'
              import { c1, c2, c3 } from '~/c'
              import { b1, b2 } from '~/b'
              import { e1, e2, e3 } from '../../e'
              import d from '.'
            `,
          options: [
            {
              ...options,
              newlinesBetween: 'never',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: '.',
                leftGroup: 'index',
                right: 'a',
                rightGroup: 'external',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: '~/c',
                leftGroup: 'internal',
                right: 't',
                rightGroup: 'type',
              },
            },
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: '~/c',
                right: 't',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: '../../e',
                leftGroup: 'parent',
                right: '~/b',
                rightGroup: 'internal',
              },
            },
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: '../../e',
                right: '~/b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): disallow extra spaces`, rule, {
      valid: [
        {
          code: dedent`
              import { A } from 'a'

              import b from '~/b'
              import c from '~/c'
              import d from '~/d'
            `,
          options: [
            {
              ...options,
              newlinesBetween: 'always',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            import { A } from 'a'


            import b from '~/b'
            import c from '~/c'

            import d from '~/d'
          `,
          output: dedent`
            import { A } from 'a'

            import b from '~/b'
            import c from '~/c'
            import d from '~/d'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'always',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: 'a',
                right: '~/b',
              },
            },
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: '~/c',
                right: '~/d',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): supports typescript object-imports`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type T = require("T")

              import { A } from 'a'

              import { B } from '../b'

              import c = require('c/c')
              import log = console.log
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import type T = require("T")

              import { A } from 'a'
              import { B } from '../b'

              import log = console.log
              import c = require('c/c')
            `,
            output: dedent`
              import type T = require("T")

              import { A } from 'a'

              import { B } from '../b'

              import c = require('c/c')
              import log = console.log
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'a',
                  right: '../b',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: 'console.log',
                  right: 'c/c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): use type if type of type is not defined`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { T } from '../t'
              import type { U } from '~/u'
              import type { V } from 'v'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal',
                  ['parent', 'sibling', 'index'],
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import type { T } from '../t'

              import type { U } from '~/u'

              import type { V } from 'v'
            `,
            output: dedent`
              import type { T } from '../t'
              import type { U } from '~/u'
              import type { V } from 'v'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal',
                  ['parent', 'sibling', 'index'],
                ],
              },
            ],
            errors: [
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: '../t',
                  right: '~/u',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: '~/u',
                  right: 'v',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): doesn't break user comments`, rule, {
      valid: [
        {
          code: dedent`
            import { b1, b2 } from 'b'

            /**
             * Comment
             */

            import { a } from 'a'
            import { c } from 'c'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'always',
              internalPattern: ['~/**'],
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
        },
      ],
      invalid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}): ignores comments for counting lines between imports`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { T } from 't'

              // @ts-expect-error missing types
              import { t } from 't'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): breaks import sorting if there is other nodes between`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { V } from 'v'

              export type { U } from 'u'

              import type { T1, T2 } from 't'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): separates style imports from the rest`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import { a1, a2 } from 'a'

              import styles from '../s.css'
              import './t.css'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'style',
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): separates side effect imports from the rest`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import { A } from '../a'
              import { b } from './b'

              import '../c.js'
              import './d'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'side-effect',
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): separates builtin type from the rest types`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { Server } from 'http'

              import a from 'a'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: ['builtin-type', 'type'],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with imports ending with a semicolon`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              import a from 'a';
              import b from './index';
            `,
            output: dedent`
              import a from 'a';

              import b from './index';
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  ['object', 'unknown'],
                ],
              },
            ],
            errors: [
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'a',
                  right: './index',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): remove unnecessary spaces`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            import { a } from 'a'


            import { b } from './b'



            import { c } from 'c'
          `,
          output: dedent`
            import { a } from 'a'
            import { c } from 'c'

            import { b } from './b'
          `,
          options: [
            {
              ...options,
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: 'a',
                right: './b',
              },
            },
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: './b',
                leftGroup: 'sibling',
                right: 'c',
                rightGroup: 'external',
              },
            },
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: './b',
                right: 'c',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to define custom groups`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              import type { T } from 't'

              import a1 from '@a/a1'
              import a2 from '@a/a2'
              import b1 from '@b/b1'
              import b2 from '@b/b2'
              import b3 from '@b/b3'
              import { c } from 'c'
            `,
            output: dedent`
              import type { T } from 't'
              import a1 from '@a/a1'
              import a2 from '@a/a2'

              import b1 from '@b/b1'
              import b2 from '@b/b2'
              import b3 from '@b/b3'

              import { c } from 'c'
            `,
            options: [
              {
                ...options,
                customGroups: {
                  type: {
                    primary: ['t', '@a/**'],
                  },
                  value: {
                    primary: ['t', '@a/**'],
                    secondary: '@b/**',
                  },
                },
                groups: [
                  'type',
                  'primary',
                  'secondary',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: 't',
                  right: '@a/a1',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: '@a/a2',
                  right: '@b/b1',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: '@b/b3',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to define value only custom groups`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              import type { A } from 'a'
              import { a } from 'a'
            `,
            output: dedent`
              import type { A } from 'a'

              import { a } from 'a'
            `,
            options: [
              {
                ...options,
                customGroups: {
                  value: {
                    primary: ['a'],
                  },
                },
                groups: ['type', 'primary'],
              },
            ],
            errors: [
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'a',
                  right: 'a',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows hash symbol in internal pattern`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { T } from 'a'

              import { a } from 'a'

              import type { S } from '#b'

              import { b1, b2 } from '#b'
              import c from '#c'

              import { d } from '../d'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['#**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import type { T } from 'a'

              import { a } from 'a'

              import type { S } from '#b'
              import c from '#c'
              import { b1, b2 } from '#b'

              import { d } from '../d'
            `,
            output: dedent`
              import type { T } from 'a'

              import { a } from 'a'

              import type { S } from '#b'

              import { b1, b2 } from '#b'
              import c from '#c'

              import { d } from '../d'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['#**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: '#b',
                  right: '#c',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '#c',
                  right: '#b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): support`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
              import { ThisIsApprox, SeventyNine } from '~CharactersLongAndShouldNotBeSplit';
              import { EvenThoughThisIsLongItShouldNotGetSplitUpAsItThereIsOnlyOne } from 'IWillNotBeSplitUp';
              import Short from 'app/components/LongName';
              import {
                ICantBelieveHowLong,
                ICantHandleHowLong,
                KindaLong,
                Long,
                ThisIsTheLongestEver,
                WowSoLong,
              } from 'app/components/Short';
              import EvenThoughThisIsLongItShouldNotBePutOntoAnyNewLinesAsThereIsOnlyOne from 'IWillNotBePutOntoNewLines';
              import ThereIsTwoOfMe, {
                SoWeShouldSplitUpSinceWeAreInDifferentSections
              } from 'IWillDefinitelyBeSplitUp';
            `,
          output: dedent`
              import {
                ICantBelieveHowLong,
                ICantHandleHowLong,
                KindaLong,
                Long,
                ThisIsTheLongestEver,
                WowSoLong,
              } from 'app/components/Short';
              import ThereIsTwoOfMe, {
                SoWeShouldSplitUpSinceWeAreInDifferentSections
              } from 'IWillDefinitelyBeSplitUp';
              import Short from 'app/components/LongName';
              import { ThisIsApprox, SeventyNine } from '~CharactersLongAndShouldNotBeSplit';
              import { EvenThoughThisIsLongItShouldNotGetSplitUpAsItThereIsOnlyOne } from 'IWillNotBeSplitUp';
              import EvenThoughThisIsLongItShouldNotBePutOntoAnyNewLinesAsThereIsOnlyOne from 'IWillNotBePutOntoNewLines';
            `,
          options: [
            {
              ...options,
              maxLineLength: 80,
              order: 'asc',
              groups: [
                'type',
                ['builtin', 'external'],
                'internal-type',
                'internal',
                ['parent-type', 'sibling-type', 'index-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: 'IWillNotBeSplitUp',
                right: 'app/components/LongName',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: 'app/components/LongName',
                right: 'app/components/Short',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: 'IWillNotBePutOntoNewLines',
                right: 'IWillDefinitelyBeSplitUp',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): allows to use bun modules`, rule, {
      valid: [
        {
          code: dedent`
            import { expect } from 'bun:test'
            import { a } from 'a'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'never',
              groups: ['builtin', 'external', 'unknown'],
              environment: 'bun',
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            import { a } from 'a'
            import { expect } from 'bun:test'
          `,
          output: dedent`
            import { expect } from 'bun:test'
            import { a } from 'a'
          `,
          options: [
            {
              ...options,
              newlinesBetween: 'never',
              groups: ['builtin', 'external', 'unknown'],
              environment: 'bun',
            },
          ],
          errors: [
            {
              messageId: 'unexpectedImportsGroupOrder',
              data: {
                left: 'a',
                leftGroup: 'external',
                right: 'bun:test',
                rightGroup: 'builtin',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts require imports`, rule, {
      valid: [
        {
          code: dedent`
            const { a1, a2 } = require('a')
            const { b1 } = require('b')
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            const { b1 } = require('b')
            const { a1, a2 } = require('a')
          `,
          output: dedent`
            const { a1, a2 } = require('a')
            const { b1 } = require('b')
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts require imports by groups`,
      rule,
      {
        valid: [
          {
            code: dedent`
            const { c1, c2, c3, c4 } = require('c')
            const { e1 } = require('e/a')
            const { e2 } = require('e/b')
            const path = require('path')
            const fs = require('fs')

            const { i1, i2, i3 } = require('~/i')
            const { b1, b2 } = require('~/b')
            const { c1 } = require('~/c')

            const { K, L, M } = require('../k')
            const { j } = require('../j')
            const h = require('../../h')
            const a = require('.')
          `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              const { c1, c2, c3, c4 } = require('c')
              const { e2 } = require('e/b')
              const { e1 } = require('e/a')
              const path = require('path')

              const { b1, b2 } = require('~/b')
              const fs = require('fs')
              const { c1 } = require('~/c')
              const { i1, i2, i3 } = require('~/i')

              const h = require('../../h')

              const a = require('.')
              const { j } = require('../j')
              const { K, L, M } = require('../k')
            `,
            output: dedent`
              const { c1, c2, c3, c4 } = require('c')
              const { e2 } = require('e/b')
              const { e1 } = require('e/a')
              const path = require('path')
              const fs = require('fs')

              const { i1, i2, i3 } = require('~/i')
              const { b1, b2 } = require('~/b')
              const { c1 } = require('~/c')

              const { K, L, M } = require('../k')
              const { j } = require('../j')
              const h = require('../../h')
              const a = require('.')
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal-type',
                  'internal',
                  ['parent-type', 'sibling-type', 'index-type'],
                  ['parent', 'sibling', 'index'],
                  'object',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedImportsGroupOrder',
                data: {
                  left: '~/b',
                  leftGroup: 'internal',
                  right: 'fs',
                  rightGroup: 'builtin',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'fs',
                  right: '~/c',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '~/c',
                  right: '~/i',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: '../../h',
                  right: '.',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '.',
                  right: '../j',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '../j',
                  right: '../k',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): can enable or disable sorting side effect imports`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import a from 'aaaa'

              import 'bbb'
              import './cc'
              import '../d'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: ['external', 'side-effect', 'unknown'],
                sortSideEffects: false,
              },
            ],
          },
          {
            code: dedent`
              import 'c'
              import 'bb'
              import 'aaa'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: ['external', 'side-effect', 'unknown'],
                sortSideEffects: false,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import './cc'
              import 'bbb'
              import e from 'e'
              import a from 'aaaa'
              import '../d'
            `,
            output: dedent`
              import a from 'aaaa'
              import e from 'e'

              import './cc'
              import 'bbb'
              import '../d'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: ['external', 'side-effect', 'unknown'],
                sortSideEffects: false,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedImportsGroupOrder',
                data: {
                  left: 'bbb',
                  leftGroup: 'side-effect',
                  right: 'e',
                  rightGroup: 'external',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: 'e',
                  right: 'aaaa',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'aaaa',
                  right: '../d',
                },
              },
            ],
          },
          {
            code: dedent`
              import 'c'
              import 'bb'
              import 'aaa'
            `,
            output: dedent`
              import 'aaa'
              import 'bb'
              import 'c'
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
                groups: ['external', 'side-effect', 'unknown'],
                sortSideEffects: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: 'c',
                  right: 'bb',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: 'bb',
                  right: 'aaa',
                },
              },
            ],
          },
        ],
      },
    )
  })

  describe(`${ruleName}: validating group configuration`, () => {
    ruleTester.run(
      `${ruleName}: allows predefined groups and defined custom groups`,
      rule,
      {
        valid: [
          {
            code: dedent`
            import type { T } from 't'

            // @ts-expect-error missing types
            import { t } from 't'
          `,
            options: [
              {
                groups: [
                  'side-effect-style',
                  'external-type',
                  'internal-type',
                  'builtin-type',
                  'sibling-type',
                  'parent-type',
                  'side-effect',
                  'index-type',
                  'internal',
                  'external',
                  'sibling',
                  'unknown',
                  'builtin',
                  'parent',
                  'object',
                  'index',
                  'style',
                  'type',
                  'myCustomGroup1',
                ],
                customGroups: {
                  type: {
                    myCustomGroup1: 'x',
                  },
                },
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
            import a from '~/a'
            import b from '~/b'
            import c from '~/c'
            import d from '~/d'
          `,
          {
            code: dedent`
              import { log } from './log'
              import { log10 } from './log10'
              import { log1p } from './log1p'
              import { log2 } from './log2'
            `,
            options: [{}],
          },
        ],
        invalid: [
          {
            code: dedent`
              import a from '~/a'
              import c from '~/c'
              import b from '~/b'
              import d from '~/d'
            `,
            output: dedent`
              import a from '~/a'
              import b from '~/b'
              import c from '~/c'
              import d from '~/d'
            `,
            errors: [
              {
                messageId: 'unexpectedImportsOrder',
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
      `${ruleName}: doesn't sort imports with side effects`,
      rule,
      {
        valid: [
          dedent`
            import './index.css'
            import './animate.css'
            import './reset.css'
          `,
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}: defines prefix-only builtin modules as core node modules`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import { writeFile } from 'node:fs/promises'

              import { useEffect } from 'react'
            `,
            options: [
              {
                groups: ['builtin', 'external'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import { writeFile } from 'node:fs/promises'
              import { useEffect } from 'react'
            `,
            output: dedent`
              import { writeFile } from 'node:fs/promises'

              import { useEffect } from 'react'
            `,
            options: [
              {
                groups: ['builtin', 'external'],
              },
            ],
            errors: [
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'node:fs/promises',
                  right: 'react',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}: define side-effect import with internal pattern as side-effect import`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import { useClient } from '~/hooks/useClient'

              import '~/css/globals.css'

              import '~/data'
            `,
            options: [
              {
                groups: ['internal', 'side-effect-style', 'side-effect'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import { useClient } from '~/hooks/useClient'
              import '~/data'
              import '~/css/globals.css'
            `,
            output: dedent`
              import { useClient } from '~/hooks/useClient'

              import '~/css/globals.css'

              import '~/data'
            `,
            options: [
              {
                groups: ['internal', 'side-effect-style', 'side-effect'],
              },
            ],
            errors: [
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: '~/hooks/useClient',
                  right: '~/data',
                },
              },
              {
                messageId: 'unexpectedImportsGroupOrder',
                data: {
                  left: '~/data',
                  leftGroup: 'side-effect',
                  right: '~/css/globals.css',
                  rightGroup: 'side-effect-style',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}: works with big amount of custom groups`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import { useCartStore } from '~/stores/cartStore.ts'
              import { useUserStore } from '~/stores/userStore.ts'

              import { getCart } from '~/services/cartService.ts'

              import { connect } from '~/utils/ws.ts'
              import { formattingDate } from '~/utils/dateTime.ts'

              import { useFetch } from '~/composable/useFetch.ts'
              import { useDebounce } from '~/composable/useDebounce.ts'
              import { useMouseMove } from '~/composable/useMouseMove.ts'

              import ComponentA from '~/components/ComponentA.vue'
              import ComponentB from '~/components/ComponentB.vue'
              import ComponentC from '~/components/ComponentC.vue'

              import CartComponentA from './cart/CartComponentA.vue'
              import CartComponentB from './cart/CartComponentB.vue'
            `,
            options: [
              {
                type: 'line-length',
                groups: [
                  ['builtin', 'external'],
                  'internal',
                  'stores',
                  'services',
                  'validators',
                  'utils',
                  'logics',
                  'composable',
                  'ui',
                  'components',
                  'pages',
                  'widgets',
                  'assets',
                  'parent',
                  'sibling',
                  'side-effect',
                  'index',
                  'style',
                  'object',
                  'unknown',
                ],
                customGroups: {
                  value: {
                    stores: ['~/stores/**'],
                    services: ['~/services/**'],
                    validators: ['~/validators/**'],
                    utils: ['~/utils/**'],
                    logics: ['~/logics/**'],
                    composable: ['~/composable/**'],
                    ui: ['~/ui/**'],
                    components: ['~/components/**'],
                    pages: ['~/pages/**'],
                    widgets: ['~/widgets/**'],
                    assets: ['~/assets/**'],
                  },
                },
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import CartComponentA from './cart/CartComponentA.vue'
              import CartComponentB from './cart/CartComponentB.vue'

              import { connect } from '~/utils/ws.ts'
              import { getCart } from '~/services/cartService.ts'

              import { useUserStore } from '~/stores/userStore.ts'
              import { formattingDate } from '~/utils/dateTime.ts'

              import { useFetch } from '~/composable/useFetch.ts'
              import { useCartStore } from '~/stores/cartStore.ts'
              import { useDebounce } from '~/composable/useDebounce.ts'
              import { useMouseMove } from '~/composable/useMouseMove.ts'

              import ComponentA from '~/components/ComponentA.vue'
              import ComponentB from '~/components/ComponentB.vue'
              import ComponentC from '~/components/ComponentC.vue'
            `,
            output: dedent`
              import { useUserStore } from '~/stores/userStore.ts'
              import { useCartStore } from '~/stores/cartStore.ts'

              import { getCart } from '~/services/cartService.ts'

              import { connect } from '~/utils/ws.ts'
              import { formattingDate } from '~/utils/dateTime.ts'

              import { useFetch } from '~/composable/useFetch.ts'
              import { useDebounce } from '~/composable/useDebounce.ts'
              import { useMouseMove } from '~/composable/useMouseMove.ts'

              import ComponentA from '~/components/ComponentA.vue'
              import ComponentB from '~/components/ComponentB.vue'
              import ComponentC from '~/components/ComponentC.vue'

              import CartComponentA from './cart/CartComponentA.vue'
              import CartComponentB from './cart/CartComponentB.vue'
            `,
            options: [
              {
                type: 'line-length',
                groups: [
                  ['builtin', 'external'],
                  'internal',
                  'stores',
                  'services',
                  'validators',
                  'utils',
                  'logics',
                  'composable',
                  'ui',
                  'components',
                  'pages',
                  'widgets',
                  'assets',
                  'parent',
                  'sibling',
                  'side-effect',
                  'index',
                  'style',
                  'object',
                  'unknown',
                ],
                customGroups: {
                  value: {
                    stores: ['~/stores/**'],
                    services: ['~/services/**'],
                    validators: ['~/validators/**'],
                    utils: ['~/utils/**'],
                    logics: ['~/logics/**'],
                    composable: ['~/composable/**'],
                    ui: ['~/ui/**'],
                    components: ['~/components/**'],
                    pages: ['~/pages/**'],
                    widgets: ['~/widgets/**'],
                    assets: ['~/assets/**'],
                  },
                },
                newlinesBetween: 'always',
                internalPattern: ['~/**'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedImportsGroupOrder',
                data: {
                  left: './cart/CartComponentB.vue',
                  leftGroup: 'sibling',
                  right: '~/utils/ws.ts',
                  rightGroup: 'utils',
                },
              },
              {
                messageId: 'unexpectedImportsGroupOrder',
                data: {
                  left: '~/utils/ws.ts',
                  leftGroup: 'utils',
                  right: '~/services/cartService.ts',
                  rightGroup: 'services',
                },
              },
              {
                messageId: 'unexpectedImportsGroupOrder',
                data: {
                  left: '~/services/cartService.ts',
                  leftGroup: 'services',
                  right: '~/stores/userStore.ts',
                  rightGroup: 'stores',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: '~/stores/userStore.ts',
                  right: '~/utils/dateTime.ts',
                },
              },
              {
                messageId: 'unexpectedImportsGroupOrder',
                data: {
                  left: '~/composable/useFetch.ts',
                  leftGroup: 'composable',
                  right: '~/stores/cartStore.ts',
                  rightGroup: 'stores',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: '~/stores/cartStore.ts',
                  right: '~/composable/useDebounce.ts',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}: does not consider empty named imports to be side-effects`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import {} from 'node:os'
              import sqlite from 'node:sqlite'
              import { describe, test } from 'node:test'
              import { c } from 'c'
              import 'node:os'
            `,
            options: [
              {
                newlinesBetween: 'never',
                groups: ['builtin', 'external', 'side-effect'],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(`${ruleName}: ignores dynamic requires`, rule, {
      valid: [
        {
          code: dedent`
            const path = require(path);
            const myFileName = require('the-filename');
            const file = require(path.join(myDir, myFileName));
            const other = require('./other.js');
          `,
          options: [
            {
              newlinesBetween: 'never',
              groups: ['builtin', 'external', 'side-effect'],
            },
          ],
        },
      ],
      invalid: [],
    })

    describe(`${ruleName}: checks compatibility between 'sortSideEffects' and 'groups'`, () => {
      let createRule = (
        groups: Options<string[]>[0]['groups'],
        sortSideEffects: boolean = false,
      ) =>
        rule.create({
          options: [
            {
              groups,
              sortSideEffects,
            },
          ],
        } as Readonly<RuleContext<MESSAGE_ID, Options<string[]>>>)
      let expectedThrownError =
        "Side effect groups cannot be nested with non side effect groups when 'sortSideEffects' is 'false'."

      it(`${ruleName}: throws if 'sideEffects' is in a non side effects only nested group`, () => {
        expect(() =>
          createRule(['external', ['side-effect', 'internal']]),
        ).toThrow(expectedThrownError)
      })

      it(`${ruleName}: throws if 'sideEffectsStyle' is in a non side effects only nested group`, () => {
        expect(() =>
          createRule(['external', ['side-effect-style', 'internal']]),
        ).toThrow(expectedThrownError)
      })

      it(`${ruleName}: throws if 'sideEffectsStyle' and 'sideEffectsStyle' are in a non side effects only nested group`, () => {
        expect(() =>
          createRule([
            'external',
            ['side-effect-style', 'internal', 'side-effect'],
          ]),
        ).toThrow(expectedThrownError)
      })

      it(`${ruleName}: allows 'sideEffects' and 'sideEffectsStyle' in the same group`, () => {
        expect(() =>
          createRule(['external', ['side-effect-style', 'side-effect']]),
        ).not.toThrow(expectedThrownError)
      })

      it(`${ruleName}: allows 'sideEffects' and 'sideEffectsStyle' anywhere 'sortSideEffects' is true`, () => {
        expect(() =>
          createRule(
            ['external', ['side-effect-style', 'internal', 'side-effect']],
            true,
          ),
        ).not.toThrow(expectedThrownError)
      })
    })

    describe(`${ruleName}: allows to use regex matcher`, () => {
      let options = {
        type: 'alphabetical',
        ignoreCase: true,
        order: 'asc',
        matcher: 'regex',
      } as const

      ruleTester.run(
        `${ruleName}: uses default internalPattern for regex`,
        rule,
        {
          valid: [
            {
              code: dedent`
                import type { T } from 't'

                import { a1, a2, a3 } from 'a'

                import { b1, b2 } from '~/b'
                import { c1, c2, c3 } from '~/c'

                import { e1, e2, e3 } from '../../e'
              `,
              options: [
                {
                  ...options,
                  groups: ['type', 'external', 'internal', 'parent'],
                },
              ],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}: allows to use regex matcher for custom groups`,
        rule,
        {
          valid: [
            {
              code: dedent`
                import type { T } from 't'

                import { i18n } from "../../../../../Basics/Language";
                import { i18n } from "../../../Basics/Language";

                import { b1, b2 } from '~/b'
                import { c1, c2, c3 } from '~/c'
              `,
              options: [
                {
                  ...options,
                  customGroups: {
                    value: {
                      primary: '^(?:\\.\\.\\/)+Basics\\/Language$',
                    },
                  },
                  groups: ['type', 'primary', 'unknown'],
                },
              ],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}: allows hash symbol in internal pattern`,
        rule,
        {
          valid: [
            {
              code: dedent`
              import type { T } from 'a'

              import { a } from 'a'

              import type { S } from '#b'

              import { b1, b2 } from '#b'
              import c from '#c'

              import { d } from '../d'
            `,
              options: [
                {
                  ...options,
                  internalPattern: ['^#.*$'],
                  groups: [
                    'type',
                    ['builtin', 'external'],
                    'internal-type',
                    'internal',
                    ['parent-type', 'sibling-type', 'index-type'],
                    ['parent', 'sibling', 'index'],
                    'object',
                    'unknown',
                  ],
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
