import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { NewlinesBetweenValue, RULE_NAME } from '../rules/sort-imports'

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

    ruleTester.run(`${RULE_NAME}(${type}): sorts imports`, rule, {
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

    ruleTester.run(`${RULE_NAME}(${type}): sorts imports by groups`, rule, {
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
              newlinesBetween: NewlinesBetweenValue.always,
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
            import { j } from '../j'
            import { K, L, M } from '../k'
            import './style.css'
          `,
          options: [
            {
              ...options,
              newlinesBetween: NewlinesBetweenValue.always,
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
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '~/b',
                right: '~/i',
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
              messageId: 'unexpectedImportsOrder',
              data: {
                left: './d',
                right: 'fs',
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
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '../../h',
                right: './index.d.ts',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '.',
                right: 't',
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
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts imports with no spaces`,
      rule,
      {
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
                newlinesBetween: NewlinesBetweenValue.never,
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
                newlinesBetween: NewlinesBetweenValue.never,
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
                  left: '.',
                  right: 'a',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '~/c',
                  right: 't',
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
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '../../e',
                  right: '~/b',
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
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): disallow extra spaces`, rule, {
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
              newlinesBetween: NewlinesBetweenValue.always,
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
              newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): supports typescript object-imports`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): use type if type of type is not defined`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
                newlinesBetween: NewlinesBetweenValue.always,
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

    ruleTester.run(`${RULE_NAME}(${type}): doesn't break user comments`, rule, {
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
              newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): ignores comments for counting lines between imports`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): breaks import sorting if there is other nodes between`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): separates style imports from the rest`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): separates side effect imports from the rest`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): separates builtin type from the rest types`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): works with imports ending with a semicolon`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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

    ruleTester.run(`${RULE_NAME}(${type}): remove unnecessary spaces`, rule, {
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
              messageId: 'unexpectedImportsOrder',
              data: {
                left: './b',
                right: 'c',
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
      `${RULE_NAME}(${type}): allows to define custom groups`,
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
      `${RULE_NAME}(${type}): allows to define value only custom groups`,
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
      `${RULE_NAME}(${type}): allows hash symbol in internal pattern`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
                newlinesBetween: NewlinesBetweenValue.always,
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

    ruleTester.run(`${RULE_NAME}(${type}): allows to use bun modules`, rule, {
      valid: [
        {
          code: dedent`
            import { expect } from 'bun:test'
            import { a } from 'a'
          `,
          options: [
            {
              ...options,
              newlinesBetween: NewlinesBetweenValue.never,
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
              newlinesBetween: NewlinesBetweenValue.never,
              groups: ['builtin', 'external', 'unknown'],
              environment: 'bun',
            },
          ],
          errors: [
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: 'a',
                right: 'bun:test',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${RULE_NAME}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${RULE_NAME}(${type}): sorts imports`, rule, {
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

    ruleTester.run(`${RULE_NAME}(${type}): sorts imports by groups`, rule, {
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
              newlinesBetween: NewlinesBetweenValue.always,
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
            import { j } from '../j'
            import { K, L, M } from '../k'
            import './style.css'
          `,
          options: [
            {
              ...options,
              newlinesBetween: NewlinesBetweenValue.always,
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
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '~/b',
                right: '~/i',
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
              messageId: 'unexpectedImportsOrder',
              data: {
                left: './d',
                right: 'fs',
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
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '../../h',
                right: './index.d.ts',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '.',
                right: 't',
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
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts imports with no spaces`,
      rule,
      {
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
                newlinesBetween: NewlinesBetweenValue.never,
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
                newlinesBetween: NewlinesBetweenValue.never,
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
                  left: '.',
                  right: 'a',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '~/c',
                  right: 't',
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
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '../../e',
                  right: '~/b',
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
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): disallow extra spaces`, rule, {
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
              newlinesBetween: NewlinesBetweenValue.always,
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
              newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): supports typescript object-imports`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): use type if type of type is not defined`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
                newlinesBetween: NewlinesBetweenValue.always,
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

    ruleTester.run(`${RULE_NAME}(${type}): doesn't break user comments`, rule, {
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
              newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): ignores comments for counting lines between imports`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): breaks import sorting if there is other nodes between`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): separates style imports from the rest`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): separates side effect imports from the rest`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): separates builtin type from the rest types`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): works with imports ending with a semicolon`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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

    ruleTester.run(`${RULE_NAME}(${type}): remove unnecessary spaces`, rule, {
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
              messageId: 'unexpectedImportsOrder',
              data: {
                left: './b',
                right: 'c',
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
      `${RULE_NAME}(${type}): allows to define custom groups`,
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
      `${RULE_NAME}(${type}): allows to define value only custom groups`,
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
      `${RULE_NAME}(${type}): allows hash symbol in internal pattern`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
                newlinesBetween: NewlinesBetweenValue.always,
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

    ruleTester.run(`${RULE_NAME}(${type}): allows to use bun modules`, rule, {
      valid: [
        {
          code: dedent`
            import { expect } from 'bun:test'
            import { a } from 'a'
          `,
          options: [
            {
              ...options,
              newlinesBetween: NewlinesBetweenValue.never,
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
              newlinesBetween: NewlinesBetweenValue.never,
              groups: ['builtin', 'external', 'unknown'],
              environment: 'bun',
            },
          ],
          errors: [
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: 'a',
                right: 'bun:test',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${RULE_NAME}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(`${RULE_NAME}(${type}): sorts imports`, rule, {
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

    ruleTester.run(`${RULE_NAME}(${type}): sorts imports by groups`, rule, {
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
              newlinesBetween: NewlinesBetweenValue.always,
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
            import h from '../../h'
            import './style.css'
            import a from '.'
          `,
          options: [
            {
              ...options,
              newlinesBetween: NewlinesBetweenValue.always,
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
                left: '~/b',
                right: '~/i',
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
              messageId: 'unexpectedImportsOrder',
              data: {
                left: './d',
                right: 'fs',
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
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '../../h',
                right: './index.d.ts',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '.',
                right: 't',
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

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts imports with no spaces`,
      rule,
      {
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
                newlinesBetween: NewlinesBetweenValue.never,
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
                newlinesBetween: NewlinesBetweenValue.never,
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
                  left: '.',
                  right: 'a',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '~/c',
                  right: 't',
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
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '../../e',
                  right: '~/b',
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
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): disallow extra spaces`, rule, {
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
              newlinesBetween: NewlinesBetweenValue.always,
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
              newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): supports typescript object-imports`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): use type if type of type is not defined`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
                newlinesBetween: NewlinesBetweenValue.always,
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

    ruleTester.run(`${RULE_NAME}(${type}): doesn't break user comments`, rule, {
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
              newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): ignores comments for counting lines between imports`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): breaks import sorting if there is other nodes between`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): separates style imports from the rest`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): separates side effect imports from the rest`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): separates builtin type from the rest types`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
      `${RULE_NAME}(${type}): works with imports ending with a semicolon`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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

    ruleTester.run(`${RULE_NAME}(${type}): remove unnecessary spaces`, rule, {
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
              messageId: 'unexpectedImportsOrder',
              data: {
                left: './b',
                right: 'c',
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
      `${RULE_NAME}(${type}): allows to define custom groups`,
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
      `${RULE_NAME}(${type}): allows to define value only custom groups`,
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
      `${RULE_NAME}(${type}): allows hash symbol in internal pattern`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
                newlinesBetween: NewlinesBetweenValue.always,
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

    ruleTester.run(`${RULE_NAME}(${type}): support`, rule, {
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

    ruleTester.run(`${RULE_NAME}(${type}): allows to use bun modules`, rule, {
      valid: [
        {
          code: dedent`
            import { expect } from 'bun:test'
            import { a } from 'a'
          `,
          options: [
            {
              ...options,
              newlinesBetween: NewlinesBetweenValue.never,
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
              newlinesBetween: NewlinesBetweenValue.never,
              groups: ['builtin', 'external', 'unknown'],
              environment: 'bun',
            },
          ],
          errors: [
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: 'a',
                right: 'bun:test',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${RULE_NAME}: misc`, () => {
    ruleTester.run(
      `${RULE_NAME}: sets alphabetical asc sorting as default`,
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
      `${RULE_NAME}: doesn't sort imports with side effects`,
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
      `${RULE_NAME}: defines prefix-only builtin modules as core node modules`,
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
      `${RULE_NAME}: define side-effect import with internal pattern as side-effect import`,
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
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}: works with big amount of custom groups`,
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
                newlinesBetween: NewlinesBetweenValue.always,
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
                newlinesBetween: NewlinesBetweenValue.always,
                internalPattern: ['~/**'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: './cart/CartComponentB.vue',
                  right: '~/utils/ws.ts',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '~/utils/ws.ts',
                  right: '~/services/cartService.ts',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '~/services/cartService.ts',
                  right: '~/stores/userStore.ts',
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
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '~/composable/useFetch.ts',
                  right: '~/stores/cartStore.ts',
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
      `${RULE_NAME}: does not consider empty named imports to be side-effects`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import {} from 'node:os'
              import { c } from 'c'
              import 'node:os'
            `,
            options: [
              {
                newlinesBetween: NewlinesBetweenValue.never,
                groups: ['builtin', 'external', 'side-effect'],
              },
            ],
          },
        ],
        invalid: [],
      },
    )
  })
})
