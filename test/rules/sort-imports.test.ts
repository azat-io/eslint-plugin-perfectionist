import type {
  RuleListener,
  RuleContext,
} from '@typescript-eslint/utils/ts-eslint'
import type { CompilerOptions } from 'typescript'
import type { Rule } from 'eslint'

import { afterAll, describe, expect, it, vi } from 'vitest'
import { RuleTester } from '@typescript-eslint/rule-tester'
import { createModuleResolutionCache } from 'typescript'
import { RuleTester as EslintRuleTester } from 'eslint'
import dedent from 'dedent'

import type { MESSAGE_ID, Options } from '../../rules/sort-imports'

import * as readClosestTsConfigUtils from '../../rules/sort-imports/read-closest-ts-config-by-path'
import * as getTypescriptImportUtils from '../../rules/sort-imports/get-typescript-import'
import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-imports'

let ruleName = 'sort-imports'

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

    ruleTester.run(`${ruleName}(${type}): sorts imports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedImportsOrder',
            },
          ],
          output: dedent`
            import { a1, a2 } from 'a'
            import { b1 } from 'b'
          `,
          code: dedent`
            import { b1 } from 'b'
            import { a1, a2 } from 'a'
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            import { a1, a2 } from 'a'
            import { b1 } from 'b'
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts imports by groups`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'e/a',
                left: 'e/b',
              },
              messageId: 'unexpectedImportsOrder',
            },
            {
              data: {
                rightGroup: 'internal-type',
                leftGroup: 'internal',
                right: '~/i',
                left: '~/b',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
            {
              data: {
                right: './d',
                left: '~/i',
              },
              messageId: 'missedSpacingBetweenImports',
            },
            {
              data: {
                leftGroup: 'sibling-type',
                rightGroup: 'builtin',
                left: './d',
                right: 'fs',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
            {
              data: {
                right: '~/c',
                left: 'fs',
              },
              messageId: 'missedSpacingBetweenImports',
            },
            {
              data: {
                right: '../../h',
                left: '../f',
              },
              messageId: 'missedSpacingBetweenImports',
            },
            {
              data: {
                rightGroup: 'index-type',
                right: './index.d.ts',
                leftGroup: 'parent',
                left: '../../h',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
            {
              data: {
                leftGroup: 'index',
                rightGroup: 'type',
                right: 't',
                left: '.',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
            {
              data: {
                right: './style.css',
                left: 't',
              },
              messageId: 'missedSpacingBetweenImports',
            },
          ],
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'always',
            },
          ],
        },
      ],
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'always',
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts imports with no spaces`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                rightGroup: 'external',
                leftGroup: 'index',
                right: 'a',
                left: '.',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
            {
              data: {
                leftGroup: 'internal',
                rightGroup: 'type',
                left: '~/c',
                right: 't',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
            {
              data: {
                rightGroup: 'internal',
                leftGroup: 'parent',
                left: '../../e',
                right: '~/b',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
          ],
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'never',
            },
          ],
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
        },
      ],
      valid: [
        {
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'never',
            },
          ],
          code: dedent`
            import type { T } from 't'
            import { a1, a2, a3 } from 'a'
            import { b1, b2 } from '~/b'
            import { c1, c2, c3 } from '~/c'
            import d from '.'
            import { e1, e2, e3 } from '../../e'
          `,
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): disallow extra spaces`, rule, {
      invalid: [
        {
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'always',
            },
          ],
          errors: [
            {
              data: {
                right: '~/b',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenImports',
            },
            {
              data: {
                right: '~/d',
                left: '~/c',
              },
              messageId: 'extraSpacingBetweenImports',
            },
          ],
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
        },
      ],
      valid: [
        {
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'always',
            },
          ],
          code: dedent`
            import { A } from 'a'

            import b from '~/b'
            import c from '~/c'
            import d from '~/d'
          `,
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): supports typescript object-imports`,
      rule,
      {
        invalid: [
          {
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
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            errors: [
              {
                data: {
                  right: '../b',
                  left: 'a',
                },
                messageId: 'missedSpacingBetweenImports',
              },
              {
                data: {
                  left: 'console.log',
                  right: 'c/c',
                },
                messageId: 'unexpectedImportsOrder',
              },
            ],
            output: dedent`
              import type T = require("T")

              import { A } from 'a'

              import { B } from '../b'

              import c = require('c/c')
              import log = console.log
            `,
            code: dedent`
              import type T = require("T")

              import { A } from 'a'
              import { B } from '../b'

              import log = console.log
              import c = require('c/c')
            `,
          },
        ],
        valid: [
          {
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
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import type T = require("T")

              import { A } from 'a'

              import { B } from '../b'

              import c = require('c/c')
              import log = console.log
            `,
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): use type if type of type is not defined`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: '../t',
                  right: '~/u',
                },
                messageId: 'extraSpacingBetweenImports',
              },
              {
                data: {
                  left: '~/u',
                  right: 'v',
                },
                messageId: 'extraSpacingBetweenImports',
              },
            ],
            options: [
              {
                ...options,
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal',
                  ['parent', 'sibling', 'index'],
                ],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
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
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal',
                  ['parent', 'sibling', 'index'],
                ],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import type { T } from '../t'
              import type { U } from '~/u'
              import type { V } from 'v'
            `,
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): ignores inline comments`, rule, {
      valid: [
        {
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'always',
            },
          ],
          code: dedent`
            import { a } from 'a'
            import { b1, b2 } from 'b' // Comment
            import { c } from 'c'
          `,
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
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import type { T } from 't'

              // @ts-expect-error missing types
              import { t } from 't'
            `,
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
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import type { V } from 'v'

              export type { U } from 'u'

              import type { T1, T2 } from 't'
            `,
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
                  'style',
                  'object',
                  'unknown',
                ],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import { a1, a2 } from 'a'

              import styles from '../s.css'
              import './t.css'
            `,
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
                  'side-effect',
                  'object',
                  'unknown',
                ],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import { A } from '../a'
              import { b } from './b'

              import '../c.js'
              import './d'
            `,
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
            options: [
              {
                ...options,
                groups: ['builtin-type', 'type'],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import type { Server } from 'http'

              import a from 'a'
            `,
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with imports ending with a semicolon`,
      rule,
      {
        invalid: [
          {
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
                  ['object', 'unknown'],
                ],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            errors: [
              {
                data: {
                  right: './index',
                  left: 'a',
                },
                messageId: 'missedSpacingBetweenImports',
              },
            ],
            output: dedent`
              import a from 'a';

              import b from './index';
            `,
            code: dedent`
              import a from 'a';
              import b from './index';
            `,
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): remove unnecessary spaces`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: './b',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenImports',
            },
            {
              data: {
                rightGroup: 'external',
                leftGroup: 'sibling',
                left: './b',
                right: 'c',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
          ],
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
        },
      ],
      valid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to define custom groups`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: '@a/a1',
                  left: 't',
                },
                messageId: 'unexpectedImportsOrder',
              },
              {
                data: {
                  right: '@a/a1',
                  left: 't',
                },
                messageId: 'extraSpacingBetweenImports',
              },
              {
                data: {
                  right: '@b/b1',
                  left: '@a/a2',
                },
                messageId: 'missedSpacingBetweenImports',
              },
              {
                data: {
                  left: '@b/b3',
                  right: 'c',
                },
                messageId: 'missedSpacingBetweenImports',
              },
            ],
            options: [
              {
                ...options,
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
                customGroups: {
                  value: {
                    primary: ['t', '@a/.+'],
                    secondary: '@b/.+',
                  },
                  type: {
                    primary: ['t', '@a/.+'],
                  },
                },
              },
            ],
            output: dedent`
              import a1 from '@a/a1'
              import a2 from '@a/a2'
              import type { T } from 't'

              import b1 from '@b/b1'
              import b2 from '@b/b2'
              import b3 from '@b/b3'

              import { c } from 'c'
            `,
            code: dedent`
              import type { T } from 't'

              import a1 from '@a/a1'
              import a2 from '@a/a2'
              import b1 from '@b/b1'
              import b2 from '@b/b2'
              import b3 from '@b/b3'
              import { c } from 'c'
            `,
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to define value only custom groups`,
      rule,
      {
        invalid: [
          {
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
                data: {
                  right: 'a',
                  left: 'a',
                },
                messageId: 'missedSpacingBetweenImports',
              },
            ],
            output: dedent`
              import type { A } from 'a'

              import { a } from 'a'
            `,
            code: dedent`
              import type { A } from 'a'
              import { a } from 'a'
            `,
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows hash symbol in internal pattern`,
      rule,
      {
        invalid: [
          {
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
                newlinesBetween: 'always',
                internalPattern: ['#.+'],
              },
            ],
            errors: [
              {
                data: {
                  right: '#c',
                  left: '#b',
                },
                messageId: 'missedSpacingBetweenImports',
              },
              {
                data: {
                  right: '#b',
                  left: '#c',
                },
                messageId: 'unexpectedImportsOrder',
              },
            ],
            output: dedent`
              import type { T } from 'a'

              import { a } from 'a'

              import type { S } from '#b'

              import { b1, b2 } from '#b'
              import c from '#c'

              import { d } from '../d'
            `,
            code: dedent`
              import type { T } from 'a'

              import { a } from 'a'

              import type { S } from '#b'
              import c from '#c'
              import { b1, b2 } from '#b'

              import { d } from '../d'
            `,
          },
        ],
        valid: [
          {
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
                newlinesBetween: 'always',
                internalPattern: ['#.+'],
              },
            ],
            code: dedent`
              import type { T } from 'a'

              import { a } from 'a'

              import type { S } from '#b'

              import { b1, b2 } from '#b'
              import c from '#c'

              import { d } from '../d'
            `,
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use bun modules`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                leftGroup: 'external',
                rightGroup: 'builtin',
                right: 'bun:test',
                left: 'a',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
          ],
          options: [
            {
              ...options,
              groups: ['builtin', 'external', 'unknown'],
              newlinesBetween: 'never',
              environment: 'bun',
            },
          ],
          output: dedent`
            import { expect } from 'bun:test'
            import { a } from 'a'
          `,
          code: dedent`
            import { a } from 'a'
            import { expect } from 'bun:test'
          `,
        },
      ],
      valid: [
        {
          options: [
            {
              ...options,
              groups: ['builtin', 'external', 'unknown'],
              newlinesBetween: 'never',
              environment: 'bun',
            },
          ],
          code: dedent`
            import { expect } from 'bun:test'
            import { a } from 'a'
          `,
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts require imports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedImportsOrder',
            },
          ],
          output: dedent`
            const { a1, a2 } = require('a')
            const { b1 } = require('b')
          `,
          code: dedent`
            const { b1 } = require('b')
            const { a1, a2 } = require('a')
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            const { a1, a2 } = require('a')
            const { b1 } = require('b')
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts require imports by groups`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'e/a',
                  left: 'e/b',
                },
                messageId: 'unexpectedImportsOrder',
              },
              {
                data: {
                  leftGroup: 'internal',
                  rightGroup: 'builtin',
                  left: '~/b',
                  right: 'fs',
                },
                messageId: 'unexpectedImportsGroupOrder',
              },
              {
                data: {
                  right: '~/c',
                  left: 'fs',
                },
                messageId: 'missedSpacingBetweenImports',
              },
              {
                data: {
                  left: '../../h',
                  right: '.',
                },
                messageId: 'unexpectedImportsOrder',
              },
              {
                data: {
                  left: '../../h',
                  right: '.',
                },
                messageId: 'extraSpacingBetweenImports',
              },
            ],
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
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
          },
        ],
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
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
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
        invalid: [
          {
            errors: [
              {
                data: {
                  leftGroup: 'side-effect',
                  rightGroup: 'external',
                  left: 'bbb',
                  right: 'e',
                },
                messageId: 'unexpectedImportsGroupOrder',
              },
              {
                data: {
                  right: 'aaaa',
                  left: 'e',
                },
                messageId: 'unexpectedImportsOrder',
              },
              {
                data: {
                  right: '../d',
                  left: 'aaaa',
                },
                messageId: 'missedSpacingBetweenImports',
              },
            ],
            options: [
              {
                ...options,
                groups: ['external', 'side-effect', 'unknown'],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
                sortSideEffects: false,
              },
            ],
            output: dedent`
              import a from 'aaaa'
              import e from 'e'

              import './cc'
              import 'bbb'
              import '../d'
            `,
            code: dedent`
              import './cc'
              import 'bbb'
              import e from 'e'
              import a from 'aaaa'
              import '../d'
            `,
          },
          {
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedImportsOrder',
              },
              {
                data: {
                  right: 'aaa',
                  left: 'bb',
                },
                messageId: 'unexpectedImportsOrder',
              },
            ],
            options: [
              {
                ...options,
                groups: ['external', 'side-effect', 'unknown'],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
                sortSideEffects: true,
              },
            ],
            output: dedent`
              import 'aaa'
              import 'bb'
              import 'c'
            `,
            code: dedent`
              import 'c'
              import 'bb'
              import 'aaa'
            `,
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                groups: ['external', 'side-effect', 'unknown'],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
                sortSideEffects: false,
              },
            ],
            code: dedent`
              import a from 'aaaa'

              import 'bbb'
              import './cc'
              import '../d'
            `,
          },
          {
            options: [
              {
                ...options,
                groups: ['external', 'side-effect', 'unknown'],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
                sortSideEffects: false,
              },
            ],
            code: dedent`
              import 'c'
              import 'bb'
              import 'aaa'
            `,
          },
        ],
      },
    )

    describe(`${ruleName}(${type}): disabling side-effect sorting`, () => {
      ruleTester.run(
        `${ruleName}(${type}): allows 'side-effect' and 'side-effect-style' groups to stay in place`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: './b-side-effect',
                    left: './b',
                  },
                  messageId: 'unexpectedImportsOrder',
                },
                {
                  data: {
                    left: './a-side-effect',
                    right: './a',
                  },
                  messageId: 'unexpectedImportsOrder',
                },
              ],
              output: dedent`
                import "./z-side-effect.scss";
                import a from "./a";
                import './b-side-effect'
                import "./g-side-effect.css";
                import './a-side-effect'
                import b from "./b";
              `,
              code: dedent`
                import "./z-side-effect.scss";
                import b from "./b";
                import './b-side-effect'
                import "./g-side-effect.css";
                import './a-side-effect'
                import a from "./a";
              `,
              options: [
                {
                  ...options,
                  newlinesBetween: 'always',
                  groups: ['unknown'],
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows 'side-effect' to be grouped together but not sorted`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    left: './z-side-effect.scss',
                    right: './b',
                  },
                  messageId: 'missedSpacingBetweenImports',
                },
                {
                  data: {
                    rightGroup: 'side-effect',
                    right: './b-side-effect',
                    leftGroup: 'unknown',
                    left: './b',
                  },
                  messageId: 'unexpectedImportsGroupOrder',
                },
                {
                  data: {
                    left: './a-side-effect',
                    right: './a',
                  },
                  messageId: 'missedSpacingBetweenImports',
                },
              ],
              output: dedent`
                import "./z-side-effect.scss";
                import './b-side-effect'
                import "./g-side-effect.css";
                import './a-side-effect'

                import a from "./a";
                import b from "./b";
              `,
              code: dedent`
                import "./z-side-effect.scss";
                import b from "./b";
                import './b-side-effect'
                import "./g-side-effect.css";
                import './a-side-effect'
                import a from "./a";
              `,
              options: [
                {
                  ...options,
                  groups: ['side-effect', 'unknown'],
                  newlinesBetween: 'always',
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows 'side-effect' and 'side-effect-style' to be grouped together
         in the same group but not sorted`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    left: './z-side-effect.scss',
                    right: './b',
                  },
                  messageId: 'missedSpacingBetweenImports',
                },
                {
                  data: {
                    rightGroup: 'side-effect',
                    right: './b-side-effect',
                    leftGroup: 'unknown',
                    left: './b',
                  },
                  messageId: 'unexpectedImportsGroupOrder',
                },
                {
                  data: {
                    left: './a-side-effect',
                    right: './a',
                  },
                  messageId: 'missedSpacingBetweenImports',
                },
              ],
              output: dedent`
                import "./z-side-effect.scss";
                import './b-side-effect'
                import "./g-side-effect.css";
                import './a-side-effect'

                import a from "./a";
                import b from "./b";
              `,
              code: dedent`
                import "./z-side-effect.scss";
                import b from "./b";
                import './b-side-effect'
                import "./g-side-effect.css";
                import './a-side-effect'
                import a from "./a";
              `,
              options: [
                {
                  ...options,
                  groups: [['side-effect', 'side-effect-style'], 'unknown'],
                  newlinesBetween: 'always',
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows 'side-effect' and 'side-effect-style' to be grouped together but not sorted`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    left: './z-side-effect.scss',
                    right: './b',
                  },
                  messageId: 'missedSpacingBetweenImports',
                },
                {
                  data: {
                    rightGroup: 'side-effect',
                    right: './b-side-effect',
                    leftGroup: 'unknown',
                    left: './b',
                  },
                  messageId: 'unexpectedImportsGroupOrder',
                },
                {
                  data: {
                    right: './g-side-effect.css',
                    left: './b-side-effect',
                  },
                  messageId: 'missedSpacingBetweenImports',
                },
                {
                  data: {
                    leftGroup: 'side-effect-style',
                    left: './g-side-effect.css',
                    rightGroup: 'side-effect',
                    right: './a-side-effect',
                  },
                  messageId: 'unexpectedImportsGroupOrder',
                },
                {
                  data: {
                    left: './a-side-effect',
                    right: './a',
                  },
                  messageId: 'missedSpacingBetweenImports',
                },
              ],
              output: dedent`
                import './b-side-effect'
                import './a-side-effect'

                import "./z-side-effect.scss";
                import "./g-side-effect.css";

                import a from "./a";
                import b from "./b";
              `,
              code: dedent`
                import "./z-side-effect.scss";
                import b from "./b";
                import './b-side-effect'
                import "./g-side-effect.css";
                import './a-side-effect'
                import a from "./a";
              `,
              options: [
                {
                  ...options,
                  groups: ['side-effect', 'side-effect-style', 'unknown'],
                  newlinesBetween: 'always',
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows 'side-effect-style' to be grouped together but not sorted`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'side-effect-style',
                    right: './b-side-effect.scss',
                    leftGroup: 'unknown',
                    left: './b',
                  },
                  messageId: 'unexpectedImportsGroupOrder',
                },
                {
                  data: {
                    left: './b-side-effect.scss',
                    right: './g-side-effect',
                  },
                  messageId: 'missedSpacingBetweenImports',
                },
                {
                  data: {
                    rightGroup: 'side-effect-style',
                    right: './a-side-effect.css',
                    left: './g-side-effect',
                    leftGroup: 'unknown',
                  },
                  messageId: 'unexpectedImportsGroupOrder',
                },
                {
                  data: {
                    left: './a-side-effect.css',
                    right: './a',
                  },
                  messageId: 'missedSpacingBetweenImports',
                },
              ],
              output: dedent`
                import "./z-side-effect";

                import './b-side-effect.scss'
                import './a-side-effect.css'

                import "./g-side-effect";
                import a from "./a";
                import b from "./b";
              `,
              code: dedent`
                import "./z-side-effect";
                import b from "./b";
                import './b-side-effect.scss'
                import "./g-side-effect";
                import './a-side-effect.css'
                import a from "./a";
              `,
              options: [
                {
                  ...options,
                  groups: ['side-effect-style', 'unknown'],
                  newlinesBetween: 'always',
                },
              ],
            },
          ],
          valid: [],
        },
      )
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            options: [
              {
                ...options,
                specialCharacters: 'trim',
              },
            ],
            code: dedent`
              import '_a'
              import 'b'
              import '_c'
            `,
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
              import 'ab'
              import 'a_c'
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
            import '你好'
            import '世界'
            import 'a'
            import 'A'
            import 'b'
            import 'B'
          `,
          options: [{ ...options, locales: 'zh-CN' }],
        },
      ],
      invalid: [],
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
                    right: '~/y',
                    left: 'a',
                  },
                  messageId: 'extraSpacingBetweenImports',
                },
                {
                  data: {
                    right: '~/b',
                    left: '~/z',
                  },
                  messageId: 'unexpectedImportsOrder',
                },
                {
                  data: {
                    right: '~/b',
                    left: '~/z',
                  },
                  messageId: 'extraSpacingBetweenImports',
                },
              ],
              code: dedent`
                  import { A } from 'a'


                 import y from '~/y'
                import z from '~/z'

                    import b from '~/b'
              `,
              output: dedent`
                  import { A } from 'a'
                 import b from '~/b'
                import y from '~/y'
                    import z from '~/z'
              `,
              options: [
                {
                  ...options,
                  newlinesBetween: 'never',
                },
              ],
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
                    right: '~/a',
                    left: 'c',
                  },
                  messageId: 'missedSpacingBetweenImports',
                },
              ],
              options: [
                {
                  ...options,
                  newlinesBetween: 'always',
                },
              ],
              output: dedent`
                import c from 'c';    

                import a from '~/a'
              `,
              code: dedent`
                import c from 'c';    import a from '~/a'
              `,
            },
            {
              errors: [
                {
                  data: {
                    right: '~/c',
                    left: 'a',
                  },
                  messageId: 'extraSpacingBetweenImports',
                },
                {
                  data: {
                    right: '~/b',
                    left: '~/c',
                  },
                  messageId: 'unexpectedImportsOrder',
                },
                {
                  data: {
                    right: '~/d',
                    left: '~/b',
                  },
                  messageId: 'extraSpacingBetweenImports',
                },
              ],
              code: dedent`
                  import { A } from 'a'


                 import c from '~/c'
                import b from '~/b'

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
                },
              ],
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
                    customGroups: {
                      value: {
                        a: 'a',
                        b: 'b',
                        c: 'c',
                        d: 'd',
                        e: 'e',
                      },
                    },
                    newlinesBetween: 'always',
                  },
                ],
                errors: [
                  {
                    data: {
                      right: 'b',
                      left: 'a',
                    },
                    messageId: 'missedSpacingBetweenImports',
                  },
                  {
                    data: {
                      right: 'c',
                      left: 'b',
                    },
                    messageId: 'extraSpacingBetweenImports',
                  },
                  {
                    data: {
                      right: 'd',
                      left: 'c',
                    },
                    messageId: 'extraSpacingBetweenImports',
                  },
                ],
                output: dedent`
                  import { A } from 'a'

                  import { B } from 'b'

                  import { C } from 'c'
                  import { D } from 'd'


                  import { E } from 'e'
                `,
                code: dedent`
                  import { A } from 'a'
                  import { B } from 'b'


                  import { C } from 'c'

                  import { D } from 'd'


                  import { E } from 'e'
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
                        customGroups: {
                          value: {
                            unusedGroup: 'X',
                            a: 'a',
                            b: 'b',
                          },
                        },
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
                        messageId: 'missedSpacingBetweenImports',
                      },
                    ],
                    output: dedent`
                      import { a } from 'a';

                      import { b } from 'b';
                    `,
                    code: dedent`
                      import { a } from 'a';
                      import { b } from 'b';
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
                        customGroups: {
                          value: {
                            unusedGroup: 'X',
                            a: 'a',
                            b: 'b',
                          },
                        },
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
                      import { a } from 'a';

                      import { b } from 'b';
                    `,
                  },
                  {
                    options: [
                      {
                        ...options,
                        customGroups: {
                          value: {
                            unusedGroup: 'X',
                            a: 'a',
                            b: 'b',
                          },
                        },
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
                      import { a } from 'a';
                      import { b } from 'b';
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
                  import { a } from './a' // Comment after
                  import { b } from 'b'

                  import { c } from 'c'
                `,
                dedent`
                  import { a } from './a' // Comment after

                  import { b } from 'b'
                  import { c } from 'c'
                `,
              ],
              errors: [
                {
                  data: {
                    rightGroup: 'unknown',
                    leftGroup: 'external',
                    right: './a',
                    left: 'b',
                  },
                  messageId: 'unexpectedImportsGroupOrder',
                },
              ],
              code: dedent`
                import { b } from 'b'
                import { a } from './a' // Comment after

                import { c } from 'c'
              `,
              options: [
                {
                  groups: ['unknown', 'external'],
                  newlinesBetween: 'always',
                },
              ],
            },
          ],
          valid: [],
        },
      )
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
                messageId: 'unexpectedImportsOrder',
              },
            ],
            output: dedent`
              import { a } from "a"; import { b } from "b";
            `,
            code: dedent`
              import { b } from "b"; import { a } from "a"
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
                messageId: 'unexpectedImportsOrder',
              },
            ],
            output: dedent`
              import { a } from "a"; import { b } from "b";
            `,
            code: dedent`
              import { b } from "b"; import { a } from "a";
            `,
            options: [options],
          },
        ],
        valid: [],
      },
    )

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
                messageId: 'unexpectedImportsOrder',
              },
              {
                data: {
                  left: './second-folder',
                  right: './folder',
                },
                messageId: 'unexpectedImportsOrder',
              },
            ],
            output: dedent`
              import * as atoms from "./atoms";
              import * as organisms from "./organisms";
              import * as shared from "./shared";

              import { Named } from './folder';
              import { AnotherNamed } from './second-folder';
            `,
            code: dedent`
              import * as organisms from "./organisms";
              import * as atoms from "./atoms";
              import * as shared from "./shared";

              import { AnotherNamed } from './second-folder';
              import { Named } from './folder';
            `,
            options: [
              {
                ...options,
                newlinesBetween: 'ignore',
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
                import bbb from './bbb';
                import cc from './cc';
                import d from './d';
                // Part: B
                import aaaa from './aaaa';
                import e from './e';
                // Part: C
                // Not partition comment
                import fff from './fff';
                import gg from './gg';
              `,
              code: dedent`
                // Part: A
                import cc from './cc';
                import d from './d';
                // Not partition comment
                import bbb from './bbb';
                // Part: B
                import aaaa from './aaaa';
                import e from './e';
                // Part: C
                import gg from './gg';
                // Not partition comment
                import fff from './fff';
              `,
              errors: [
                {
                  data: {
                    right: './bbb',
                    left: './d',
                  },
                  messageId: 'unexpectedImportsOrder',
                },
                {
                  data: {
                    right: './fff',
                    left: './gg',
                  },
                  messageId: 'unexpectedImportsOrder',
                },
              ],
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
                import bb from './bb';
                // Other comment
                import a from './a';
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
                import d from './d'
                // Part: B
                import aaa from './aaa'
                import bb from './bb'
                import c from './c'
                /* Other */
                import e from './e'
              `,
              code: dedent`
                /* Partition Comment */
                // Part: A
                import d from './d'
                // Part: B
                import aaa from './aaa'
                import c from './c'
                import bb from './bb'
                /* Other */
                import e from './e'
              `,
              errors: [
                {
                  data: {
                    right: './bb',
                    left: './c',
                  },
                  messageId: 'unexpectedImportsOrder',
                },
              ],
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
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex for partition comments`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import e from './e'
              import f from './f'
              // I am a partition comment because I don't have f o o
              import a from './a'
              import b from './b'
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
                messageId: 'unexpectedImportsOrder',
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
              import a from './a'
              import b from './b'
            `,
            code: dedent`
              import b from './b'
              /* Comment */
              import a from './a'
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
                import b from './b'
                // Comment
                import a from './a'
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
                import c from './c'
                // b
                import b from './b'
                // a
                import a from './a'
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
                import b from './b'
                // I am a partition comment because I don't have f o o
                import a from './a'
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
                messageId: 'unexpectedImportsOrder',
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
              import a from './a'
              import b from './b'
            `,
            code: dedent`
              import b from './b'
              // Comment
              import a from './a'
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
                import b from './b'
                /* Comment */
                import a from './a'
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
                import c from './c'
                /* b */
                import b from './b'
                /* a */
                import a from './a'
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
                import b from './b'
                /* I am a partition comment because I don't have f o o */
                import a from './a'
              `,
            },
          ],
          invalid: [],
        },
      )
    })

    ruleTester.run(
      `${ruleName}(${type}): supports style imports with optional chaining`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  leftGroup: 'unknown',
                  right: './b.css?raw',
                  rightGroup: 'style',
                  left: './a.js',
                },
                messageId: 'unexpectedImportsGroupOrder',
              },
            ],
            options: [
              {
                ...options,
                groups: ['style', 'unknown'],
                newlinesBetween: 'always',
              },
            ],
            output: dedent`
              import b from './b.css?raw'
              import c from './c.css'

              import a from './a.js'
            `,
            code: dedent`
              import a from './a.js'
              import b from './b.css?raw'
              import c from './c.css'
            `,
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                groups: ['style', 'unknown'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import b from './b.css?raw'
              import c from './c.css'

              import a from './a.js'
            `,
          },
        ],
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
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedImportsOrder',
            },
          ],
          output: dedent`
            import { a1, a2 } from 'a'
            import { b1 } from 'b'
          `,
          code: dedent`
            import { b1 } from 'b'
            import { a1, a2 } from 'a'
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            import { a1, a2 } from 'a'
            import { b1 } from 'b'
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts imports by groups`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'e/a',
                left: 'e/b',
              },
              messageId: 'unexpectedImportsOrder',
            },
            {
              data: {
                rightGroup: 'internal-type',
                leftGroup: 'internal',
                right: '~/i',
                left: '~/b',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
            {
              data: {
                right: './d',
                left: '~/i',
              },
              messageId: 'missedSpacingBetweenImports',
            },
            {
              data: {
                leftGroup: 'sibling-type',
                rightGroup: 'builtin',
                left: './d',
                right: 'fs',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
            {
              data: {
                right: '~/c',
                left: 'fs',
              },
              messageId: 'missedSpacingBetweenImports',
            },
            {
              data: {
                right: '../../h',
                left: '../f',
              },
              messageId: 'missedSpacingBetweenImports',
            },
            {
              data: {
                rightGroup: 'index-type',
                right: './index.d.ts',
                leftGroup: 'parent',
                left: '../../h',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
            {
              data: {
                leftGroup: 'index',
                rightGroup: 'type',
                right: 't',
                left: '.',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
            {
              data: {
                right: './style.css',
                left: 't',
              },
              messageId: 'missedSpacingBetweenImports',
            },
          ],
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'always',
            },
          ],
        },
      ],
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'always',
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts imports with no spaces`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                rightGroup: 'external',
                leftGroup: 'index',
                right: 'a',
                left: '.',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
            {
              data: {
                leftGroup: 'internal',
                rightGroup: 'type',
                left: '~/c',
                right: 't',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
            {
              data: {
                rightGroup: 'internal',
                leftGroup: 'parent',
                left: '../../e',
                right: '~/b',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
          ],
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'never',
            },
          ],
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
        },
      ],
      valid: [
        {
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'never',
            },
          ],
          code: dedent`
            import type { T } from 't'
            import { a1, a2, a3 } from 'a'
            import { b1, b2 } from '~/b'
            import { c1, c2, c3 } from '~/c'
            import d from '.'
            import { e1, e2, e3 } from '../../e'
          `,
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): disallow extra spaces`, rule, {
      invalid: [
        {
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'always',
            },
          ],
          errors: [
            {
              data: {
                right: '~/b',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenImports',
            },
            {
              data: {
                right: '~/d',
                left: '~/c',
              },
              messageId: 'extraSpacingBetweenImports',
            },
          ],
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
        },
      ],
      valid: [
        {
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'always',
            },
          ],
          code: dedent`
            import { A } from 'a'

            import b from '~/b'
            import c from '~/c'
            import d from '~/d'
          `,
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): supports typescript object-imports`,
      rule,
      {
        invalid: [
          {
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
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            errors: [
              {
                data: {
                  right: '../b',
                  left: 'a',
                },
                messageId: 'missedSpacingBetweenImports',
              },
              {
                data: {
                  left: 'console.log',
                  right: 'c/c',
                },
                messageId: 'unexpectedImportsOrder',
              },
            ],
            output: dedent`
              import type T = require("T")

              import { A } from 'a'

              import { B } from '../b'

              import c = require('c/c')
              import log = console.log
            `,
            code: dedent`
              import type T = require("T")

              import { A } from 'a'
              import { B } from '../b'

              import log = console.log
              import c = require('c/c')
            `,
          },
        ],
        valid: [
          {
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
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import type T = require("T")

              import { A } from 'a'

              import { B } from '../b'

              import c = require('c/c')
              import log = console.log
            `,
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): use type if type of type is not defined`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: '../t',
                  right: 'v',
                },
                messageId: 'extraSpacingBetweenImports',
              },
              {
                data: {
                  right: '~/u',
                  left: 'v',
                },
                messageId: 'extraSpacingBetweenImports',
              },
            ],
            options: [
              {
                ...options,
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal',
                  ['parent', 'sibling', 'index'],
                ],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import type { T } from '../t'

              import type { V } from 'v'

              import type { U } from '~/u'
            `,
            output: dedent`
              import type { T } from '../t'
              import type { V } from 'v'
              import type { U } from '~/u'
            `,
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal',
                  ['parent', 'sibling', 'index'],
                ],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import type { T } from '../t'
              import type { V } from 'v'
              import type { U } from '~/u'
            `,
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): ignores inline comments`, rule, {
      valid: [
        {
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'always',
            },
          ],
          code: dedent`
            import { a } from 'a'
            import { b1, b2 } from 'b' // Comment
            import { c } from 'c'
          `,
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
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import type { T } from 't'

              // @ts-expect-error missing types
              import { t } from 't'
            `,
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
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import type { V } from 'v'

              export type { U } from 'u'

              import type { T1, T2 } from 't'
            `,
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
                  'style',
                  'object',
                  'unknown',
                ],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import { a1, a2 } from 'a'

              import styles from '../s.css'
              import './t.css'
            `,
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
                  'side-effect',
                  'object',
                  'unknown',
                ],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import { A } from '../a'
              import { b } from './b'

              import '../c.js'
              import './d'
            `,
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
            options: [
              {
                ...options,
                groups: ['builtin-type', 'type'],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import type { Server } from 'http'

              import a from 'a'
            `,
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with imports ending with a semicolon`,
      rule,
      {
        invalid: [
          {
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
                  ['object', 'unknown'],
                ],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            errors: [
              {
                data: {
                  right: './index',
                  left: 'a',
                },
                messageId: 'missedSpacingBetweenImports',
              },
            ],
            output: dedent`
              import a from 'a';

              import b from './index';
            `,
            code: dedent`
              import a from 'a';
              import b from './index';
            `,
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): remove unnecessary spaces`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: './b',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenImports',
            },
            {
              data: {
                rightGroup: 'external',
                leftGroup: 'sibling',
                left: './b',
                right: 'c',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
          ],
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
        },
      ],
      valid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to define custom groups`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: '@a/a1',
                  left: 't',
                },
                messageId: 'unexpectedImportsOrder',
              },
              {
                data: {
                  right: '@a/a1',
                  left: 't',
                },
                messageId: 'extraSpacingBetweenImports',
              },
              {
                data: {
                  right: '@b/b1',
                  left: '@a/a2',
                },
                messageId: 'missedSpacingBetweenImports',
              },
              {
                data: {
                  left: '@b/b3',
                  right: 'c',
                },
                messageId: 'missedSpacingBetweenImports',
              },
            ],
            options: [
              {
                ...options,
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
                customGroups: {
                  value: {
                    primary: ['t', '@a/.+'],
                    secondary: '@b/.+',
                  },
                  type: {
                    primary: ['t', '@a/.+'],
                  },
                },
              },
            ],
            output: dedent`
              import a1 from '@a/a1'
              import a2 from '@a/a2'
              import type { T } from 't'

              import b1 from '@b/b1'
              import b2 from '@b/b2'
              import b3 from '@b/b3'

              import { c } from 'c'
            `,
            code: dedent`
              import type { T } from 't'

              import a1 from '@a/a1'
              import a2 from '@a/a2'
              import b1 from '@b/b1'
              import b2 from '@b/b2'
              import b3 from '@b/b3'
              import { c } from 'c'
            `,
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to define value only custom groups`,
      rule,
      {
        invalid: [
          {
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
                data: {
                  right: 'a',
                  left: 'a',
                },
                messageId: 'missedSpacingBetweenImports',
              },
            ],
            output: dedent`
              import type { A } from 'a'

              import { a } from 'a'
            `,
            code: dedent`
              import type { A } from 'a'
              import { a } from 'a'
            `,
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows hash symbol in internal pattern`,
      rule,
      {
        invalid: [
          {
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
                newlinesBetween: 'always',
                internalPattern: ['#.+'],
              },
            ],
            errors: [
              {
                data: {
                  right: '#c',
                  left: '#b',
                },
                messageId: 'missedSpacingBetweenImports',
              },
              {
                data: {
                  right: '#b',
                  left: '#c',
                },
                messageId: 'unexpectedImportsOrder',
              },
            ],
            output: dedent`
              import type { T } from 'a'

              import { a } from 'a'

              import type { S } from '#b'

              import { b1, b2 } from '#b'
              import c from '#c'

              import { d } from '../d'
            `,
            code: dedent`
              import type { T } from 'a'

              import { a } from 'a'

              import type { S } from '#b'
              import c from '#c'
              import { b1, b2 } from '#b'

              import { d } from '../d'
            `,
          },
        ],
        valid: [
          {
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
                newlinesBetween: 'always',
                internalPattern: ['#.+'],
              },
            ],
            code: dedent`
              import type { T } from 'a'

              import { a } from 'a'

              import type { S } from '#b'

              import { b1, b2 } from '#b'
              import c from '#c'

              import { d } from '../d'
            `,
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use bun modules`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                leftGroup: 'external',
                rightGroup: 'builtin',
                right: 'bun:test',
                left: 'a',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
          ],
          options: [
            {
              ...options,
              groups: ['builtin', 'external', 'unknown'],
              newlinesBetween: 'never',
              environment: 'bun',
            },
          ],
          output: dedent`
            import { expect } from 'bun:test'
            import { a } from 'a'
          `,
          code: dedent`
            import { a } from 'a'
            import { expect } from 'bun:test'
          `,
        },
      ],
      valid: [
        {
          options: [
            {
              ...options,
              groups: ['builtin', 'external', 'unknown'],
              newlinesBetween: 'never',
              environment: 'bun',
            },
          ],
          code: dedent`
            import { expect } from 'bun:test'
            import { a } from 'a'
          `,
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts require imports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedImportsOrder',
            },
          ],
          output: dedent`
            const { a1, a2 } = require('a')
            const { b1 } = require('b')
          `,
          code: dedent`
            const { b1 } = require('b')
            const { a1, a2 } = require('a')
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            const { a1, a2 } = require('a')
            const { b1 } = require('b')
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts require imports by groups`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'e/a',
                  left: 'e/b',
                },
                messageId: 'unexpectedImportsOrder',
              },
              {
                data: {
                  leftGroup: 'internal',
                  rightGroup: 'builtin',
                  left: '~/b',
                  right: 'fs',
                },
                messageId: 'unexpectedImportsGroupOrder',
              },
              {
                data: {
                  right: '~/c',
                  left: 'fs',
                },
                messageId: 'missedSpacingBetweenImports',
              },
              {
                data: {
                  left: '../../h',
                  right: '.',
                },
                messageId: 'unexpectedImportsOrder',
              },
              {
                data: {
                  left: '../../h',
                  right: '.',
                },
                messageId: 'extraSpacingBetweenImports',
              },
            ],
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
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
          },
        ],
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
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
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
        invalid: [
          {
            errors: [
              {
                data: {
                  leftGroup: 'side-effect',
                  rightGroup: 'external',
                  left: 'bbb',
                  right: 'e',
                },
                messageId: 'unexpectedImportsGroupOrder',
              },
              {
                data: {
                  right: 'aaaa',
                  left: 'e',
                },
                messageId: 'unexpectedImportsOrder',
              },
              {
                data: {
                  right: '../d',
                  left: 'aaaa',
                },
                messageId: 'missedSpacingBetweenImports',
              },
            ],
            options: [
              {
                ...options,
                groups: ['external', 'side-effect', 'unknown'],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
                sortSideEffects: false,
              },
            ],
            output: dedent`
              import a from 'aaaa'
              import e from 'e'

              import './cc'
              import 'bbb'
              import '../d'
            `,
            code: dedent`
              import './cc'
              import 'bbb'
              import e from 'e'
              import a from 'aaaa'
              import '../d'
            `,
          },
          {
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedImportsOrder',
              },
              {
                data: {
                  right: 'aaa',
                  left: 'bb',
                },
                messageId: 'unexpectedImportsOrder',
              },
            ],
            options: [
              {
                ...options,
                groups: ['external', 'side-effect', 'unknown'],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
                sortSideEffects: true,
              },
            ],
            output: dedent`
              import 'aaa'
              import 'bb'
              import 'c'
            `,
            code: dedent`
              import 'c'
              import 'bb'
              import 'aaa'
            `,
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                groups: ['external', 'side-effect', 'unknown'],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
                sortSideEffects: false,
              },
            ],
            code: dedent`
              import a from 'aaaa'

              import 'bbb'
              import './cc'
              import '../d'
            `,
          },
          {
            options: [
              {
                ...options,
                groups: ['external', 'side-effect', 'unknown'],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
                sortSideEffects: false,
              },
            ],
            code: dedent`
              import 'c'
              import 'bb'
              import 'aaa'
            `,
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): supports style imports with optional chaining`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  leftGroup: 'unknown',
                  right: './b.css?raw',
                  rightGroup: 'style',
                  left: './a.js',
                },
                messageId: 'unexpectedImportsGroupOrder',
              },
            ],
            options: [
              {
                ...options,
                groups: ['style', 'unknown'],
                newlinesBetween: 'always',
              },
            ],
            output: dedent`
              import b from './b.css?raw'
              import c from './c.css'

              import a from './a.js'
            `,
            code: dedent`
              import a from './a.js'
              import b from './b.css?raw'
              import c from './c.css'
            `,
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                groups: ['style', 'unknown'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import b from './b.css?raw'
              import c from './c.css'

              import a from './a.js'
            `,
          },
        ],
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

    ruleTester.run(`${ruleName}(${type}): sorts imports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedImportsOrder',
            },
          ],
          output: dedent`
            import { a1, a2 } from 'a'
            import { b1 } from 'b'
          `,
          code: dedent`
            import { b1 } from 'b'
            import { a1, a2 } from 'a'
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            import { a1, a2 } from 'a'
            import { b1 } from 'b'
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

    ruleTester.run(`${ruleName}(${type}): sorts imports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedImportsOrder',
            },
          ],
          output: dedent`
            import { a1, a2 } from 'a'
            import { b1 } from 'b'
          `,
          code: dedent`
            import { b1 } from 'b'
            import { a1, a2 } from 'a'
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            import { a1, a2 } from 'a'
            import { b1 } from 'b'
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts imports by groups`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                rightGroup: 'internal-type',
                leftGroup: 'internal',
                right: '~/i',
                left: '~/b',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
            {
              data: {
                right: './d',
                left: '~/i',
              },
              messageId: 'missedSpacingBetweenImports',
            },
            {
              data: {
                leftGroup: 'sibling-type',
                rightGroup: 'builtin',
                left: './d',
                right: 'fs',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
            {
              data: {
                right: '~/c',
                left: 'fs',
              },
              messageId: 'missedSpacingBetweenImports',
            },
            {
              data: {
                right: '~/i',
                left: '~/c',
              },
              messageId: 'unexpectedImportsOrder',
            },
            {
              data: {
                right: '../f',
                left: '.',
              },
              messageId: 'unexpectedImportsOrder',
            },
            {
              data: {
                right: '../../h',
                left: '../f',
              },
              messageId: 'missedSpacingBetweenImports',
            },
            {
              data: {
                rightGroup: 'index-type',
                right: './index.d.ts',
                leftGroup: 'parent',
                left: '../../h',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
            {
              data: {
                leftGroup: 'index',
                rightGroup: 'type',
                right: 't',
                left: '.',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
            {
              data: {
                right: './style.css',
                left: 't',
              },
              messageId: 'missedSpacingBetweenImports',
            },
            {
              data: {
                left: './style.css',
                right: '../j',
              },
              messageId: 'unexpectedImportsOrder',
            },
            {
              data: {
                right: '../k',
                left: '../j',
              },
              messageId: 'unexpectedImportsOrder',
            },
          ],
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'always',
            },
          ],
        },
      ],
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'always',
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts imports with no spaces`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                rightGroup: 'external',
                leftGroup: 'index',
                right: 'a',
                left: '.',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
            {
              data: {
                leftGroup: 'internal',
                rightGroup: 'type',
                left: '~/c',
                right: 't',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
            {
              data: {
                rightGroup: 'internal',
                leftGroup: 'parent',
                left: '../../e',
                right: '~/b',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
          ],
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'never',
            },
          ],
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
        },
      ],
      valid: [
        {
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'never',
            },
          ],
          code: dedent`
            import type { T } from 't'
            import { a1, a2, a3 } from 'a'
            import { c1, c2, c3 } from '~/c'
            import { b1, b2 } from '~/b'
            import { e1, e2, e3 } from '../../e'
            import d from '.'
          `,
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): disallow extra spaces`, rule, {
      invalid: [
        {
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'always',
            },
          ],
          errors: [
            {
              data: {
                right: '~/b',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenImports',
            },
            {
              data: {
                right: '~/d',
                left: '~/c',
              },
              messageId: 'extraSpacingBetweenImports',
            },
          ],
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
        },
      ],
      valid: [
        {
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
              internalPattern: ['^~/.*'],
              newlinesBetween: 'always',
            },
          ],
          code: dedent`
            import { A } from 'a'

            import b from '~/b'
            import c from '~/c'
            import d from '~/d'
          `,
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): supports typescript object-imports`,
      rule,
      {
        invalid: [
          {
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
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            errors: [
              {
                data: {
                  right: '../b',
                  left: 'a',
                },
                messageId: 'missedSpacingBetweenImports',
              },
              {
                data: {
                  left: 'console.log',
                  right: 'c/c',
                },
                messageId: 'unexpectedImportsOrder',
              },
            ],
            output: dedent`
              import type T = require("T")

              import { A } from 'a'

              import { B } from '../b'

              import c = require('c/c')
              import log = console.log
            `,
            code: dedent`
              import type T = require("T")

              import { A } from 'a'
              import { B } from '../b'

              import log = console.log
              import c = require('c/c')
            `,
          },
        ],
        valid: [
          {
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
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import type T = require("T")

              import { A } from 'a'

              import { B } from '../b'

              import c = require('c/c')
              import log = console.log
            `,
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): use type if type of type is not defined`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: '../t',
                  right: '~/u',
                },
                messageId: 'extraSpacingBetweenImports',
              },
              {
                data: {
                  left: '~/u',
                  right: 'v',
                },
                messageId: 'extraSpacingBetweenImports',
              },
            ],
            options: [
              {
                ...options,
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal',
                  ['parent', 'sibling', 'index'],
                ],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
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
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                groups: [
                  'type',
                  ['builtin', 'external'],
                  'internal',
                  ['parent', 'sibling', 'index'],
                ],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import type { T } from '../t'
              import type { U } from '~/u'
              import type { V } from 'v'
            `,
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): ignores comments for counting lines between imports`,
      rule,
      {
        valid: [
          {
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
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import type { T } from 't'

              // @ts-expect-error missing types
              import { t } from 't'
            `,
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
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import type { V } from 'v'

              export type { U } from 'u'

              import type { T1, T2 } from 't'
            `,
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
                  'style',
                  'object',
                  'unknown',
                ],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import { a1, a2 } from 'a'

              import styles from '../s.css'
              import './t.css'
            `,
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
                  'side-effect',
                  'object',
                  'unknown',
                ],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import { A } from '../a'
              import { b } from './b'

              import '../c.js'
              import './d'
            `,
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
            options: [
              {
                ...options,
                groups: ['builtin-type', 'type'],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import type { Server } from 'http'

              import a from 'a'
            `,
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with imports ending with a semicolon`,
      rule,
      {
        invalid: [
          {
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
                  ['object', 'unknown'],
                ],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
            errors: [
              {
                data: {
                  right: './index',
                  left: 'a',
                },
                messageId: 'missedSpacingBetweenImports',
              },
            ],
            output: dedent`
              import a from 'a';

              import b from './index';
            `,
            code: dedent`
              import a from 'a';
              import b from './index';
            `,
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): remove unnecessary spaces`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: './b',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenImports',
            },
            {
              data: {
                rightGroup: 'external',
                leftGroup: 'sibling',
                left: './b',
                right: 'c',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
          ],
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
        },
      ],
      valid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to define custom groups`,
      rule,
      {
        invalid: [
          {
            options: [
              {
                ...options,
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
                customGroups: {
                  value: {
                    primary: ['t', '@a/.+'],
                    secondary: '@b/.+',
                  },
                  type: {
                    primary: ['t', '@a/.+'],
                  },
                },
              },
            ],
            errors: [
              {
                data: {
                  right: '@a/a1',
                  left: 't',
                },
                messageId: 'extraSpacingBetweenImports',
              },
              {
                data: {
                  right: '@b/b1',
                  left: '@a/a2',
                },
                messageId: 'missedSpacingBetweenImports',
              },
              {
                data: {
                  left: '@b/b3',
                  right: 'c',
                },
                messageId: 'missedSpacingBetweenImports',
              },
            ],
            output: dedent`
              import type { T } from 't'
              import a1 from '@a/a1'
              import a2 from '@a/a2'

              import b1 from '@b/b1'
              import b2 from '@b/b2'
              import b3 from '@b/b3'

              import { c } from 'c'
            `,
            code: dedent`
              import type { T } from 't'

              import a1 from '@a/a1'
              import a2 from '@a/a2'
              import b1 from '@b/b1'
              import b2 from '@b/b2'
              import b3 from '@b/b3'
              import { c } from 'c'
            `,
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to define value only custom groups`,
      rule,
      {
        invalid: [
          {
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
                data: {
                  right: 'a',
                  left: 'a',
                },
                messageId: 'missedSpacingBetweenImports',
              },
            ],
            output: dedent`
              import type { A } from 'a'

              import { a } from 'a'
            `,
            code: dedent`
              import type { A } from 'a'
              import { a } from 'a'
            `,
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows hash symbol in internal pattern`,
      rule,
      {
        invalid: [
          {
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
                newlinesBetween: 'always',
                internalPattern: ['#.+'],
              },
            ],
            errors: [
              {
                data: {
                  right: '#c',
                  left: '#b',
                },
                messageId: 'missedSpacingBetweenImports',
              },
              {
                data: {
                  right: '#b',
                  left: '#c',
                },
                messageId: 'unexpectedImportsOrder',
              },
            ],
            output: dedent`
              import type { T } from 'a'

              import { a } from 'a'

              import type { S } from '#b'

              import { b1, b2 } from '#b'
              import c from '#c'

              import { d } from '../d'
            `,
            code: dedent`
              import type { T } from 'a'

              import { a } from 'a'

              import type { S } from '#b'
              import c from '#c'
              import { b1, b2 } from '#b'

              import { d } from '../d'
            `,
          },
        ],
        valid: [
          {
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
                newlinesBetween: 'always',
                internalPattern: ['#.+'],
              },
            ],
            code: dedent`
              import type { T } from 'a'

              import { a } from 'a'

              import type { S } from '#b'

              import { b1, b2 } from '#b'
              import c from '#c'

              import { d } from '../d'
            `,
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): support`, rule, {
      invalid: [
        {
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
          errors: [
            {
              data: {
                right: 'app/components/LongName',
                left: 'IWillNotBeSplitUp',
              },
              messageId: 'unexpectedImportsOrder',
            },
            {
              data: {
                left: 'app/components/LongName',
                right: 'app/components/Short',
              },
              messageId: 'unexpectedImportsOrder',
            },
            {
              data: {
                left: 'IWillNotBePutOntoNewLines',
                right: 'IWillDefinitelyBeSplitUp',
              },
              messageId: 'unexpectedImportsOrder',
            },
          ],
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
              maxLineLength: 80,
              order: 'asc',
            },
          ],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}(${type}): allows to use bun modules`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                leftGroup: 'external',
                rightGroup: 'builtin',
                right: 'bun:test',
                left: 'a',
              },
              messageId: 'unexpectedImportsGroupOrder',
            },
          ],
          options: [
            {
              ...options,
              groups: ['builtin', 'external', 'unknown'],
              newlinesBetween: 'never',
              environment: 'bun',
            },
          ],
          output: dedent`
            import { expect } from 'bun:test'
            import { a } from 'a'
          `,
          code: dedent`
            import { a } from 'a'
            import { expect } from 'bun:test'
          `,
        },
      ],
      valid: [
        {
          options: [
            {
              ...options,
              groups: ['builtin', 'external', 'unknown'],
              newlinesBetween: 'never',
              environment: 'bun',
            },
          ],
          code: dedent`
            import { expect } from 'bun:test'
            import { a } from 'a'
          `,
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts require imports`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedImportsOrder',
            },
          ],
          output: dedent`
            const { a1, a2 } = require('a')
            const { b1 } = require('b')
          `,
          code: dedent`
            const { b1 } = require('b')
            const { a1, a2 } = require('a')
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            const { a1, a2 } = require('a')
            const { b1 } = require('b')
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts require imports by groups`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  leftGroup: 'internal',
                  rightGroup: 'builtin',
                  left: '~/b',
                  right: 'fs',
                },
                messageId: 'unexpectedImportsGroupOrder',
              },
              {
                data: {
                  right: '~/c',
                  left: 'fs',
                },
                messageId: 'missedSpacingBetweenImports',
              },
              {
                data: {
                  right: '~/i',
                  left: '~/c',
                },
                messageId: 'unexpectedImportsOrder',
              },
              {
                data: {
                  left: '../../h',
                  right: '.',
                },
                messageId: 'extraSpacingBetweenImports',
              },
              {
                data: {
                  right: '../j',
                  left: '.',
                },
                messageId: 'unexpectedImportsOrder',
              },
              {
                data: {
                  right: '../k',
                  left: '../j',
                },
                messageId: 'unexpectedImportsOrder',
              },
            ],
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
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
              },
            ],
          },
        ],
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
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
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
        invalid: [
          {
            errors: [
              {
                data: {
                  leftGroup: 'side-effect',
                  rightGroup: 'external',
                  left: 'bbb',
                  right: 'e',
                },
                messageId: 'unexpectedImportsGroupOrder',
              },
              {
                data: {
                  right: 'aaaa',
                  left: 'e',
                },
                messageId: 'unexpectedImportsOrder',
              },
              {
                data: {
                  right: '../d',
                  left: 'aaaa',
                },
                messageId: 'missedSpacingBetweenImports',
              },
            ],
            options: [
              {
                ...options,
                groups: ['external', 'side-effect', 'unknown'],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
                sortSideEffects: false,
              },
            ],
            output: dedent`
              import a from 'aaaa'
              import e from 'e'

              import './cc'
              import 'bbb'
              import '../d'
            `,
            code: dedent`
              import './cc'
              import 'bbb'
              import e from 'e'
              import a from 'aaaa'
              import '../d'
            `,
          },
          {
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedImportsOrder',
              },
              {
                data: {
                  right: 'aaa',
                  left: 'bb',
                },
                messageId: 'unexpectedImportsOrder',
              },
            ],
            options: [
              {
                ...options,
                groups: ['external', 'side-effect', 'unknown'],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
                sortSideEffects: true,
              },
            ],
            output: dedent`
              import 'aaa'
              import 'bb'
              import 'c'
            `,
            code: dedent`
              import 'c'
              import 'bb'
              import 'aaa'
            `,
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                groups: ['external', 'side-effect', 'unknown'],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
                sortSideEffects: false,
              },
            ],
            code: dedent`
              import a from 'aaaa'

              import 'bbb'
              import './cc'
              import '../d'
            `,
          },
          {
            options: [
              {
                ...options,
                groups: ['external', 'side-effect', 'unknown'],
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
                sortSideEffects: false,
              },
            ],
            code: dedent`
              import 'c'
              import 'bb'
              import 'aaa'
            `,
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): supports style imports with optional chaining`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  leftGroup: 'unknown',
                  right: './b.css?raw',
                  rightGroup: 'style',
                  left: './a.js',
                },
                messageId: 'unexpectedImportsGroupOrder',
              },
            ],
            options: [
              {
                ...options,
                groups: ['style', 'unknown'],
                newlinesBetween: 'always',
              },
            ],
            output: dedent`
              import b from './b.css?raw'
              import c from './c.css'

              import a from './a.js'
            `,
            code: dedent`
              import a from './a.js'
              import b from './b.css?raw'
              import c from './c.css'
            `,
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                groups: ['style', 'unknown'],
                newlinesBetween: 'always',
              },
            ],
            code: dedent`
              import b from './b.css?raw'
              import c from './c.css'

              import a from './a.js'
            `,
          },
        ],
      },
    )

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
                messageId: 'unexpectedImportsOrder',
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
              import { bb } from 'bb'
              import { c } from 'c'
              import { a } from 'a'
            `,
            code: dedent`
              import { a } from 'a'
              import { bb } from 'bb'
              import { c } from 'c'
            `,
          },
          {
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedImportsOrder',
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
              import { bb } from 'bb'
              import { a } from 'a'
              import { c } from 'c'
            `,
            code: dedent`
              import { c } from 'c'
              import { bb } from 'bb'
              import { a } from 'a'
            `,
          },
        ],
        valid: [],
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
            code: dedent`
              import type { T } from 't'

              // @ts-expect-error missing types
              import { t } from 't'
            `,
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
        invalid: [
          {
            errors: [
              {
                data: {
                  right: '~/b',
                  left: '~/c',
                },
                messageId: 'unexpectedImportsOrder',
              },
            ],
            output: dedent`
              import a from '~/a'
              import b from '~/b'
              import c from '~/c'
              import d from '~/d'
            `,
            code: dedent`
              import a from '~/a'
              import c from '~/c'
              import b from '~/b'
              import d from '~/d'
            `,
          },
        ],
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
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'node:fs/promises',
                  right: 'react',
                },
                messageId: 'missedSpacingBetweenImports',
              },
            ],
            output: dedent`
              import { writeFile } from 'node:fs/promises'

              import { useEffect } from 'react'
            `,
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
      },
    )

    ruleTester.run(
      `${ruleName}: define side-effect import with internal pattern as side-effect import`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: '~/hooks/useClient',
                  right: '~/data',
                },
                messageId: 'missedSpacingBetweenImports',
              },
              {
                data: {
                  rightGroup: 'side-effect-style',
                  right: '~/css/globals.css',
                  leftGroup: 'side-effect',
                  left: '~/data',
                },
                messageId: 'unexpectedImportsGroupOrder',
              },
            ],
            output: dedent`
              import { useClient } from '~/hooks/useClient'

              import '~/css/globals.css'

              import '~/data'
            `,
            code: dedent`
              import { useClient } from '~/hooks/useClient'
              import '~/data'
              import '~/css/globals.css'
            `,
            options: [
              {
                groups: ['internal', 'side-effect-style', 'side-effect'],
              },
            ],
          },
        ],
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
      },
    )

    ruleTester.run(
      `${ruleName}: works with big amount of custom groups`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: './cart/CartComponentB.vue',
                  right: '~/utils/ws.ts',
                  leftGroup: 'sibling',
                  rightGroup: 'utils',
                },
                messageId: 'unexpectedImportsGroupOrder',
              },
              {
                data: {
                  right: '~/services/cartService.ts',
                  rightGroup: 'services',
                  left: '~/utils/ws.ts',
                  leftGroup: 'utils',
                },
                messageId: 'unexpectedImportsGroupOrder',
              },
              {
                data: {
                  left: '~/services/cartService.ts',
                  right: '~/stores/userStore.ts',
                  leftGroup: 'services',
                  rightGroup: 'stores',
                },
                messageId: 'unexpectedImportsGroupOrder',
              },
              {
                data: {
                  left: '~/stores/userStore.ts',
                  right: '~/utils/dateTime.ts',
                },
                messageId: 'missedSpacingBetweenImports',
              },
              {
                data: {
                  left: '~/composable/useFetch.ts',
                  right: '~/stores/cartStore.ts',
                  leftGroup: 'composable',
                  rightGroup: 'stores',
                },
                messageId: 'unexpectedImportsGroupOrder',
              },
              {
                data: {
                  right: '~/composable/useDebounce.ts',
                  left: '~/stores/cartStore.ts',
                },
                messageId: 'missedSpacingBetweenImports',
              },
            ],
            options: [
              {
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
                    validators: ['~/validators/.+'],
                    composable: ['~/composable/.+'],
                    components: ['~/components/.+'],
                    services: ['~/services/.+'],
                    widgets: ['~/widgets/.+'],
                    stores: ['~/stores/.+'],
                    logics: ['~/logics/.+'],
                    assets: ['~/assets/.+'],
                    utils: ['~/utils/.+'],
                    pages: ['~/pages/.+'],
                    ui: ['~/ui/.+'],
                  },
                },
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
                type: 'line-length',
              },
            ],
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
          },
        ],
        valid: [
          {
            options: [
              {
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
                    validators: ['^~/validators/.+'],
                    composable: ['^~/composable/.+'],
                    components: ['^~/components/.+'],
                    services: ['^~/services/.+'],
                    widgets: ['^~/widgets/.+'],
                    stores: ['^~/stores/.+'],
                    logics: ['^~/logics/.+'],
                    assets: ['^~/assets/.+'],
                    utils: ['^~/utils/.+'],
                    pages: ['^~/pages/.+'],
                    ui: ['^~/ui/.+'],
                  },
                },
                internalPattern: ['^~/.*'],
                newlinesBetween: 'always',
                type: 'line-length',
              },
            ],
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
                groups: ['builtin', 'external', 'side-effect'],
                newlinesBetween: 'never',
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
              groups: ['builtin', 'external', 'side-effect'],
              newlinesBetween: 'never',
            },
          ],
        },
      ],
      invalid: [],
    })

    describe(`${ruleName}: checks compatibility between 'sortSideEffects' and 'groups'`, () => {
      let createRule = (
        groups: Options[0]['groups'],
        sortSideEffects: boolean = false,
      ): RuleListener =>
        rule.create({
          options: [
            {
              sortSideEffects,
              groups,
            },
          ],
        } as Readonly<RuleContext<MESSAGE_ID, Options>>)
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

    describe(`${ruleName}: handles tsconfig.json`, () => {
      ruleTester.run(
        `${ruleName}: marks internal imports as 'internal'`,
        rule,
        {
          valid: [
            {
              options: [
                {
                  groups: ['internal', 'unknown'],
                  tsconfigRootDir: '.',
                },
              ],
              before: () => {
                mockReadClosestTsConfigByPathWith({
                  baseUrl: './rules/',
                })
              },
              code: dedent`
                import { x } from 'sort-imports'

                import { a } from './a';
              `,
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}: marks external imports as 'external'`,
        rule,
        {
          valid: [
            {
              options: [
                {
                  groups: ['external', 'unknown'],
                  tsconfigRootDir: '.',
                },
              ],
              code: dedent`
                import type { ParsedCommandLine } from 'typescript'

                import { a } from './a';
              `,
              before: () => {
                mockReadClosestTsConfigByPathWith({
                  baseUrl: '.',
                })
              },
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}: marks non-resolved imports as 'external'`,
        rule,
        {
          valid: [
            {
              options: [
                {
                  groups: ['external', 'unknown'],
                  tsconfigRootDir: '.',
                },
              ],
              before: () => {
                mockReadClosestTsConfigByPathWith({
                  baseUrl: '.',
                })
              },
              code: dedent`
                import { b } from 'b'

                import { a } from './a';
              `,
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}: uses the fallback algorithm if typescript is not present`,
        rule,
        {
          valid: [
            {
              before: () => {
                mockReadClosestTsConfigByPathWith(null)
                vi.spyOn(
                  getTypescriptImportUtils,
                  'getTypescriptImport',
                ).mockReturnValue(null)
              },
              options: [
                {
                  groups: ['external', 'unknown'],
                  tsconfigRootDir: '.',
                },
              ],
              code: dedent`
                import { b } from 'b'

                import { a } from './a';
              `,
            },
          ],
          invalid: [],
        },
      )

      let mockReadClosestTsConfigByPathWith = (
        compilerOptions: CompilerOptions | null,
      ): void => {
        vi.spyOn(
          readClosestTsConfigUtils,
          'readClosestTsConfigByPath',
        ).mockReturnValue(
          compilerOptions
            ? {
                cache: createModuleResolutionCache(
                  '.',
                  filename => filename,
                  compilerOptions,
                ),
                compilerOptions,
              }
            : null,
        )
      }
    })

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
              messageId: 'unexpectedImportsOrder',
            },
          ],
          output: dedent`
            import { b } from './b'
            import { c } from './c'
            // eslint-disable-next-line
            import { a } from './a'
          `,
          code: dedent`
            import { c } from './c'
            import { b } from './b'
            // eslint-disable-next-line
            import { a } from './a'
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
              messageId: 'unexpectedImportsOrder',
            },
            {
              data: {
                right: './b',
                left: './a',
              },
              messageId: 'unexpectedImportsOrder',
            },
          ],
          output: dedent`
            import { b } from './b'
            import { c } from './c'
            // eslint-disable-next-line
            import { a } from './a'
            import { d } from './d'
          `,
          code: dedent`
            import { d } from './d'
            import { c } from './c'
            // eslint-disable-next-line
            import { a } from './a'
            import { b } from './b'
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
              messageId: 'unexpectedImportsOrder',
            },
          ],
          output: dedent`
            import { b } from './b'
            import { c } from './c'
            import { a } from './a' // eslint-disable-line
          `,
          code: dedent`
            import { c } from './c'
            import { b } from './b'
            import { a } from './a' // eslint-disable-line
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
              messageId: 'unexpectedImportsOrder',
            },
          ],
          output: dedent`
            import { b } from './b'
            import { c } from './c'
            /* eslint-disable-next-line */
            import { a } from './a'
          `,
          code: dedent`
            import { c } from './c'
            import { b } from './b'
            /* eslint-disable-next-line */
            import { a } from './a'
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
              messageId: 'unexpectedImportsOrder',
            },
          ],
          output: dedent`
            import { b } from './b'
            import { c } from './c'
            import { a } from './a' /* eslint-disable-line */
          `,
          code: dedent`
            import { c } from './c'
            import { b } from './b'
            import { a } from './a' /* eslint-disable-line */
          `,
          options: [{}],
        },
        {
          output: dedent`
            import { a } from './a'
            import { d } from './d'
            /* eslint-disable */
            import { c } from './c'
            import { b } from './b'
            // Shouldn't move
            /* eslint-enable */
            import { e } from './e'
          `,
          code: dedent`
            import { d } from './d'
            import { e } from './e'
            /* eslint-disable */
            import { c } from './c'
            import { b } from './b'
            // Shouldn't move
            /* eslint-enable */
            import { a } from './a'
          `,
          errors: [
            {
              data: {
                right: './a',
                left: './b',
              },
              messageId: 'unexpectedImportsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            import { b } from './b'
            import { c } from './c'
            // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
            import { a } from './a'
          `,
          code: dedent`
            import { c } from './c'
            import { b } from './b'
            // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
            import { a } from './a'
          `,
          errors: [
            {
              data: {
                right: './b',
                left: './c',
              },
              messageId: 'unexpectedImportsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            import { b } from './b'
            import { c } from './c'
            import { a } from './a' // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
          `,
          code: dedent`
            import { c } from './c'
            import { b } from './b'
            import { a } from './a' // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
          `,
          errors: [
            {
              data: {
                right: './b',
                left: './c',
              },
              messageId: 'unexpectedImportsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            import { b } from './b'
            import { c } from './c'
            /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
            import { a } from './a'
          `,
          code: dedent`
            import { c } from './c'
            import { b } from './b'
            /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
            import { a } from './a'
          `,
          errors: [
            {
              data: {
                right: './b',
                left: './c',
              },
              messageId: 'unexpectedImportsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            import { b } from './b'
            import { c } from './c'
            import { a } from './a' /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
          `,
          code: dedent`
            import { c } from './c'
            import { b } from './b'
            import { a } from './a' /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
          `,
          errors: [
            {
              data: {
                right: './b',
                left: './c',
              },
              messageId: 'unexpectedImportsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            import { a } from './a'
            import { d } from './d'
            /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
            import { c } from './c'
            import { b } from './b'
            // Shouldn't move
            /* eslint-enable */
            import { e } from './e'
          `,
          code: dedent`
            import { d } from './d'
            import { e } from './e'
            /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
            import { c } from './c'
            import { b } from './b'
            // Shouldn't move
            /* eslint-enable */
            import { a } from './a'
          `,
          errors: [
            {
              data: {
                right: './a',
                left: './b',
              },
              messageId: 'unexpectedImportsOrder',
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
              import { d } from '~./d.scss'
              import { a } from 'a'
              import * as b from 'b'
              import { c } from 'c'
            `,
            options: [{}],
          },
        ],
        invalid: [],
      },
    )
  })
})
