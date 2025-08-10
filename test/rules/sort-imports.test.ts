import type {
  RuleListener,
  RuleContext,
} from '@typescript-eslint/utils/ts-eslint'
import type { CompilerOptions } from 'typescript'

import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { createModuleResolutionCache } from 'typescript'
import { describe, expect, it, vi } from 'vitest'
import dedent from 'dedent'

import type { Options } from '../../rules/sort-imports/types'
import type { MessageId } from '../../rules/sort-imports'

import * as readClosestTsConfigUtilities from '../../rules/sort-imports/read-closest-ts-config-by-path'
import * as getTypescriptImportUtilities from '../../rules/sort-imports/get-typescript-import'
import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-imports'

describe('sort-imports', () => {
  let { invalid, valid } = createRuleTester({
    parser: typescriptParser,
    name: 'sort-imports',
    rule,
  })

  function mockReadClosestTsConfigByPathWith(
    compilerOptions: CompilerOptions,
  ): void {
    vi.spyOn(
      readClosestTsConfigUtilities,
      'readClosestTsConfigByPath',
    ).mockReturnValue({
      cache: createModuleResolutionCache(
        '.',
        filename => filename,
        compilerOptions,
      ),
      compilerOptions,
    })
  }

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('sorts imports by module name', async () => {
      await valid({
        code: dedent`
          import { a1, a2 } from 'a'
          import { b1 } from 'b'
        `,
        options: [options],
      })

      await invalid({
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
      })
    })

    it('groups and sorts imports by type and source', async () => {
      await valid({
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
        options: [options],
      })

      await invalid({
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
              rightGroup: 'type-internal',
              leftGroup: 'value-internal',
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
              rightGroup: 'value-builtin',
              leftGroup: 'type-sibling',
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
              leftGroup: 'value-parent',
              rightGroup: 'type-index',
              right: './index.d.ts',
              left: '../../h',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
          {
            data: {
              rightGroup: 'type-import',
              leftGroup: 'value-index',
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
        options: [options],
      })
    })

    it('sorts imports without spacing between groups when configured', async () => {
      await valid({
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
          },
        ],
      })

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'value-external',
              leftGroup: 'value-index',
              right: 'a',
              left: '.',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
          {
            data: {
              leftGroup: 'value-internal',
              rightGroup: 'type-import',
              left: '~/c',
              right: 't',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
          {
            data: {
              rightGroup: 'value-internal',
              leftGroup: 'value-parent',
              left: '../../e',
              right: '~/b',
            },
            messageId: 'unexpectedImportsGroupOrder',
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
        options: [
          {
            ...options,
            newlinesBetween: 'never',
          },
        ],
      })
    })

    it('removes extra spacing between import groups', async () => {
      await valid({
        code: dedent`
          import { A } from 'a'

          import b from '~/b'
          import c from '~/c'
          import d from '~/d'
        `,
        options: [options],
      })

      await invalid({
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
        options: [options],
      })
    })

    it('handles TypeScript import-equals syntax correctly', async () => {
      await valid({
        code: dedent`
          import type T = require("T")

          import { A } from 'a'
          import c = require('c/c')

          import { B } from '../b'

          import log = console.log
        `,
        options: [options],
      })

      await invalid({
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
              leftGroup: 'ts-equals-import',
              rightGroup: 'value-external',
              left: 'console.log',
              right: 'c/c',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        output: dedent`
          import type T = require("T")

          import { A } from 'a'
          import c = require('c/c')

          import { B } from '../b'

          import log = console.log
        `,
        code: dedent`
          import type T = require("T")

          import { A } from 'a'
          import { B } from '../b'

          import log = console.log
          import c = require('c/c')
        `,
        options: [options],
      })
    })

    it('groups all type imports together when specific type groups not configured', async () => {
      await valid({
        options: [
          {
            ...options,
            groups: [
              'type',
              ['builtin', 'external'],
              'internal',
              ['parent', 'sibling', 'index'],
            ],
          },
        ],
        code: dedent`
          import type { T } from '../t'
          import type { U } from '~/u'
          import type { V } from 'v'
        `,
      })

      await invalid({
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
      })
    })

    it('preserves inline comments during sorting', async () => {
      await valid({
        code: dedent`
          import { a } from 'a'
          import { b1, b2 } from 'b' // Comment
          import { c } from 'c'
        `,
        options: [options],
      })
    })

    it('ignores comments when calculating spacing between imports', async () => {
      await valid({
        code: dedent`
          import type { T } from 't'

          // @ts-expect-error missing types
          import { t } from 't'
        `,
        options: [options],
      })
    })

    it('stops grouping imports when other statements appear between them', async () => {
      await valid({
        code: dedent`
          import type { V } from 'v'

          export type { U } from 'u'

          import type { T1, T2 } from 't'
        `,
        options: [options],
      })
    })

    it('groups style imports separately when configured', async () => {
      await valid({
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
              'unknown',
            ],
          },
        ],
        code: dedent`
          import { a1, a2 } from 'a'

          import styles from '../s.css'
          import './t.css'
        `,
      })
    })

    it('groups side-effect imports separately when configured', async () => {
      await valid({
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
              'unknown',
            ],
          },
        ],
        code: dedent`
          import { A } from '../a'
          import { b } from './b'

          import '../c.js'
          import './d'
        `,
      })
    })

    it('groups builtin types separately from other type imports', async () => {
      await valid({
        options: [
          {
            ...options,
            groups: ['builtin-type', 'type'],
          },
        ],
        code: dedent`
          import type { Server } from 'http'

          import a from 'a'
        `,
      })
    })

    it('handles imports with semicolons correctly', async () => {
      await invalid({
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
              'unknown',
            ],
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
      })
    })

    it('removes extra spacing and sorts imports correctly', async () => {
      await invalid({
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
              rightGroup: 'value-external',
              leftGroup: 'value-sibling',
              left: './b',
              right: 'c',
            },
            messageId: 'unexpectedImportsGroupOrder',
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
        options: [options],
      })
    })

    it('supports custom import groups with primary and secondary categories', async () => {
      await invalid({
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
      })
    })

    it('supports custom groups for value imports only', async () => {
      await invalid({
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
      })
    })

    it('handles hash symbol in internal patterns correctly', async () => {
      await valid({
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
            internalPattern: ['#.+'],
          },
        ],
      })

      await invalid({
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
        options: [
          {
            ...options,
            internalPattern: ['#.+'],
          },
        ],
      })
    })

    it('recognizes Bun built-in modules when configured', async () => {
      await valid({
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
      })

      await invalid({
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
      })
    })

    it('sorts CommonJS require imports by module name', async () => {
      await valid({
        code: dedent`
          const { a1, a2 } = require('a')
          const { b1 } = require('b')
        `,
        options: [options],
      })

      await invalid({
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
      })
    })

    it('groups and sorts CommonJS require imports by type and source', async () => {
      await valid({
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
        options: [options],
      })

      await invalid({
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
              leftGroup: 'value-internal',
              rightGroup: 'value-builtin',
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
        options: [options],
      })
    })

    it('preserves side-effect import order when sorting disabled', async () => {
      await valid({
        options: [
          {
            ...options,
            groups: ['external', 'side-effect', 'unknown'],
            sortSideEffects: false,
          },
        ],
        code: dedent`
          import a from 'aaaa'

          import 'bbb'
          import './cc'
          import '../d'
        `,
      })

      await valid({
        options: [
          {
            ...options,
            groups: ['external', 'side-effect', 'unknown'],
            sortSideEffects: false,
          },
        ],
        code: dedent`
          import 'c'
          import 'bb'
          import 'aaa'
        `,
      })

      await invalid({
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
      })
    })

    it('sorts side-effect imports when sorting enabled', async () => {
      await invalid({
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
      })
    })

    it('preserves original order when side-effect imports are not grouped', async () => {
      await invalid({
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
            groups: ['unknown'],
          },
        ],
      })
    })

    it('groups side-effect imports together without sorting them', async () => {
      await invalid({
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
          },
        ],
      })
    })

    it('groups side-effect and style imports together in same group without sorting', async () => {
      await invalid({
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
          },
        ],
      })
    })

    it('separates side-effect and style imports into distinct groups without sorting', async () => {
      await invalid({
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
          },
        ],
      })
    })

    it('groups style side-effect imports separately without sorting', async () => {
      await invalid({
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
          },
        ],
      })
    })

    it('ignores fallback sorting for side-effect imports', async () => {
      await valid({
        options: [
          {
            groups: ['side-effect', 'side-effect-style'],
            fallbackSort: { type: 'alphabetical' },
          },
        ],
        code: dedent`
          import 'b';
          import 'a';

          import 'b.css';
          import 'a.css';
        `,
      })
    })

    it('handles special characters with trim option', async () => {
      await valid({
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
      })
    })

    it('handles special characters with remove option', async () => {
      await valid({
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
      })
    })

    it('supports locale-specific sorting', async () => {
      await valid({
        code: dedent`
          import '你好'
          import '世界'
          import 'a'
          import 'A'
          import 'b'
          import 'B'
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it.each([
      ['removes newlines with never option', 'never'],
      ['removes newlines with 0 option', 0],
    ])('%s', async (_description, newlinesBetween) => {
      await invalid({
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
            newlinesBetween,
          },
        ],
      })
    })

    it('handles custom spacing rules between consecutive groups', async () => {
      await invalid({
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
      })
    })

    it.each([
      [
        'enforces spacing when global option is 2 and group option is never',
        2,
        'never',
      ],
      ['enforces spacing when global option is 2 and group option is 0', 2, 0],
      [
        'enforces spacing when global option is 2 and group option is ignore',
        2,
        'ignore',
      ],
      [
        'enforces spacing when global option is never and group option is 2',
        'never',
        2,
      ],
      ['enforces spacing when global option is 0 and group option is 2', 0, 2],
      [
        'enforces spacing when global option is ignore and group option is 2',
        'ignore',
        2,
      ],
    ])(
      '%s',
      async (_description, globalNewlinesBetween, groupNewlinesBetween) => {
        await invalid({
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
        })
      },
    )

    it.each([
      [
        'removes spacing when never option exists between groups regardless of global setting always',
        'always',
      ],
      [
        'removes spacing when never option exists between groups regardless of global setting 2',
        2,
      ],
      [
        'removes spacing when never option exists between groups regardless of global setting ignore',
        'ignore',
      ],
      [
        'removes spacing when never option exists between groups regardless of global setting never',
        'never',
      ],
      [
        'removes spacing when never option exists between groups regardless of global setting 0',
        0,
      ],
    ])('%s', async (_description, globalNewlinesBetween) => {
      await invalid({
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
            customGroups: {
              value: {
                unusedGroup: 'X',
                a: 'a',
                b: 'b',
                c: 'c',
              },
            },
            newlinesBetween: globalNewlinesBetween,
          },
        ],
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'extraSpacingBetweenImports',
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
      })
    })

    it.each([
      [
        'preserves existing spacing when ignore and never options are combined',
        'ignore',
        'never',
      ],
      [
        'preserves existing spacing when ignore and 0 options are combined',
        'ignore',
        0,
      ],
      [
        'preserves existing spacing when never and ignore options are combined',
        'never',
        'ignore',
      ],
      [
        'preserves existing spacing when 0 and ignore options are combined',
        0,
        'ignore',
      ],
    ])(
      '%s',
      async (_description, globalNewlinesBetween, groupNewlinesBetween) => {
        await valid({
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
        })

        await valid({
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
        })
      },
    )

    it('handles newlines and comments after fixes', async () => {
      await invalid({
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
        output: dedent`
          import { a } from './a' // Comment after

          import { b } from 'b'
          import { c } from 'c'
        `,
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
      })
    })

    it.each([
      [
        'ignores newline fixes between different partitions with never option',
        'never',
      ],
      ['ignores newline fixes between different partitions with 0 option', 0],
    ])('%s', async (_description, newlinesBetween) => {
      await invalid({
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
            partitionByComment: true,
            newlinesBetween,
          },
        ],
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
          import a from 'a';

          // Partition comment

          import { b } from './b';
          import { c } from './c';
        `,
        code: dedent`
          import a from 'a';

          // Partition comment

          import { c } from './c';
          import { b } from './b';
        `,
      })
    })

    it('sorts inline imports correctly', async () => {
      await invalid({
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
      })

      await invalid({
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
      })
    })

    it('allows partitioning by new lines', async () => {
      await invalid({
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
      })
    })

    it('allows partitioning by comment patterns', async () => {
      await invalid({
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
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('treats all comments as partition boundaries when enabled', async () => {
      await valid({
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
      })
    })

    it('supports multiple partition comment patterns', async () => {
      await invalid({
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
            partitionByComment: ['Partition Comment', 'Part:', 'Other'],
          },
        ],
      })
    })

    it('supports regex patterns for partition comments', async () => {
      await valid({
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
      })
    })

    it('ignores block comments when line comment partitioning is enabled', async () => {
      await invalid({
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
      })
    })

    it('treats all line comments as partition boundaries when enabled', async () => {
      await valid({
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
      })
    })

    it('supports multiple line comment patterns for partitioning', async () => {
      await valid({
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
      })
    })

    it('supports regex patterns for line comment partitioning', async () => {
      await valid({
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
      })
    })

    it('ignores line comments when block comment partitioning is enabled', async () => {
      await invalid({
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
      })
    })

    it('treats all block comments as partition boundaries when enabled', async () => {
      await valid({
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
      })
    })

    it('supports multiple block comment patterns for partitioning', async () => {
      await valid({
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
      })
    })

    it('supports regex patterns for block comment partitioning', async () => {
      await valid({
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
      })
    })

    it('supports style imports with query parameters', async () => {
      await valid({
        code: dedent`
          import b from './b.css?raw'
          import c from './c.css'

          import a from './a.js'
        `,
        options: [
          {
            ...options,
            groups: ['style', 'unknown'],
          },
        ],
      })

      await invalid({
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
        options: [
          {
            ...options,
            groups: ['style', 'unknown'],
          },
        ],
      })
    })

    it('prioritizes index types over sibling types', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'sibling-type',
              rightGroup: 'index-type',
              right: './index',
              left: './a',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['index-type', 'sibling-type'],
          },
        ],
        output: dedent`
          import type b from './index'

          import type a from './a'
        `,
        code: dedent`
          import type a from './a'

          import type b from './index'
        `,
      })
    })

    it('prioritizes specific type selectors over generic type group', async () => {
      await invalid({
        options: [
          {
            ...options,
            groups: [
              [
                'index-type',
                'internal-type',
                'external-type',
                'sibling-type',
                'builtin-type',
              ],
              'type',
            ],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'sibling-type',
              leftGroup: 'type',
              right: './b',
              left: '../a',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        output: dedent`
          import type b from './b'
          import type c from './index'
          import type d from 'd'
          import type e from 'timers'

          import type a from '../a'
        `,
        code: dedent`
          import type a from '../a'

          import type b from './b'
          import type c from './index'
          import type d from 'd'
          import type e from 'timers'
        `,
      })
    })

    it('prioritizes index imports over sibling imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'sibling',
              rightGroup: 'index',
              right: './index',
              left: './a',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['index', 'sibling'],
          },
        ],
        output: dedent`
          import b from './index'

          import a from './a'
        `,
        code: dedent`
          import a from './a'

          import b from './index'
        `,
      })
    })

    it('prioritizes style side-effects over generic side-effects', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'side-effect-style',
              leftGroup: 'side-effect',
              right: 'style.css',
              left: 'something',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['side-effect-style', 'side-effect'],
          },
        ],
        output: dedent`
          import 'style.css'

          import 'something'
        `,
        code: dedent`
          import 'something'

          import 'style.css'
        `,
      })
    })

    it('prioritizes side-effects over style imports with default exports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'side-effect',
              right: 'something',
              leftGroup: 'style',
              left: 'style.css',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['side-effect', 'style'],
          },
        ],
        output: dedent`
          import 'something'

          import style from 'style.css'
        `,
        code: dedent`
          import style from 'style.css'

          import 'something'
        `,
      })
    })

    it('prioritizes style imports over other import types', async () => {
      await invalid({
        options: [
          {
            ...options,
            groups: [
              'style',
              [
                'index',
                'internal',
                'subpath',
                'external',
                'sibling',
                'builtin',
                'parent',
                'tsconfig-path',
              ],
            ],
            tsconfigRootDir: '.',
          },
        ],
        output: dedent`
          import style from 'style.css'

          import a from '../a'
          import b from './b'
          import c from './index'
          import subpath from '#subpath'
          import tsConfigPath from '$path'
          import d from 'd'
          import e from 'timers'
        `,
        code: dedent`
          import a from '../a'
          import b from './b'
          import c from './index'
          import subpath from '#subpath'
          import tsConfigPath from '$path'
          import d from 'd'
          import e from 'timers'

          import style from 'style.css'
        `,
        errors: [
          {
            data: {
              leftGroup: 'builtin',
              rightGroup: 'style',
              right: 'style.css',
              left: 'timers',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        before: () => {
          mockReadClosestTsConfigByPathWith({
            paths: {
              $path: ['./path'],
            },
          })
        },
      })
    })

    it('prioritizes external imports over generic import group', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'external',
              leftGroup: 'import',
              left: './a',
              right: 'b',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['external', 'import'],
          },
        ],
        output: dedent`
          import b from 'b'

          import a from './a'
        `,
        code: dedent`
          import a from './a'

          import b from 'b'
        `,
      })
    })

    it('prioritizes type imports over TypeScript equals imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'type-import',
              leftGroup: 'external',
              right: 'z',
              left: 'f',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['type-import', 'external', 'ts-equals-import'],
          },
        ],
        output: dedent`
          import type z = z

          import f from 'f'
        `,
        code: dedent`
          import f from 'f'

          import type z = z
        `,
      })
    })

    it('prioritizes side-effect imports over value imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'side-effect-import',
              leftGroup: 'external',
              right: './z',
              left: 'f',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['side-effect-import', 'external', 'value-import'],
            sortSideEffects: true,
          },
        ],
        output: dedent`
          import "./z"

          import f from 'f'
        `,
        code: dedent`
          import f from 'f'

          import "./z"
        `,
      })
    })

    it('prioritizes value imports over TypeScript equals imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'value-import',
              leftGroup: 'external',
              right: 'z',
              left: 'f',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['value-import', 'external', 'ts-equals-import'],
          },
        ],
        output: dedent`
          import z = z

          import f from 'f'
        `,
        code: dedent`
          import f from 'f'

          import z = z
        `,
      })
    })

    it('prioritizes TypeScript equals imports over require imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'ts-equals-import',
              leftGroup: 'external',
              right: './z',
              left: 'f',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['ts-equals-import', 'external', 'require-import'],
          },
        ],
        output: dedent`
          import z = require('./z')

          import f from 'f'
        `,
        code: dedent`
          import f from 'f'

          import z = require('./z')
        `,
      })
    })

    it('prioritizes default imports over named imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'default-import',
              leftGroup: 'external',
              right: './z',
              left: 'f',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['default-import', 'external', 'named-import'],
          },
        ],
        output: dedent`
          import z, { z } from "./z"

          import f from 'f'
        `,
        code: dedent`
          import f from 'f'

          import z, { z } from "./z"
        `,
      })
    })

    it('prioritizes wildcard imports over named imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'wildcard-import',
              leftGroup: 'external',
              right: './z',
              left: 'f',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['wildcard-import', 'external', 'named-import'],
          },
        ],
        output: dedent`
          import z, * as z from "./z"

          import f from 'f'
        `,
        code: dedent`
          import f from 'f'

          import z, * as z from "./z"
        `,
      })
    })

    it.each([
      ['filters on element name pattern with string', 'hello'],
      ['filters on element name pattern with array', ['noMatch', 'hello']],
      [
        'filters on element name pattern with regex object',
        { pattern: 'HELLO', flags: 'i' },
      ],
      [
        'filters on element name pattern with array containing regex',
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ],
    ])('%s', async (_description, elementNamePattern) => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'importsStartingWithHello',
              right: 'helloImport',
              leftGroup: 'unknown',
              left: 'a',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'importsStartingWithHello',
                elementNamePattern,
              },
            ],
            groups: ['importsStartingWithHello', 'unknown'],
          },
        ],
        output: dedent`
          import hello from 'helloImport'

          import a from 'a'
        `,
        code: dedent`
          import a from 'a'

          import hello from 'helloImport'
        `,
      })
    })

    it('sorts custom groups by overriding type and order settings', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: 'unexpectedImportsOrder',
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: 'unexpectedImportsOrder',
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: 'unexpectedImportsOrder',
          },
          {
            data: {
              rightGroup: 'reversedExternalImportsByLineLength',
              leftGroup: 'unknown',
              left: './jjjjj',
              right: 'eee',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedExternalImportsByLineLength',
                selector: 'external',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedExternalImportsByLineLength', 'unknown'],
            newlinesBetween: 'ignore',
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          import dddd from 'dddd'
          import ccc from 'ccc'
          import eee from 'eee'
          import bb from 'bb'
          import ff from 'ff'
          import a from 'a'
          import g from 'g'
          import h from './h'
          import i from './i'
          import jjjjj from './jjjjj'
        `,
        code: dedent`
          import a from 'a'
          import bb from 'bb'
          import ccc from 'ccc'
          import dddd from 'dddd'
          import jjjjj from './jjjjj'
          import eee from 'eee'
          import ff from 'ff'
          import g from 'g'
          import h from './h'
          import i from './i'
        `,
      })
    })

    it('sorts custom groups using fallback sort settings', async () => {
      await invalid({
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
            messageId: 'unexpectedImportsOrder',
          },
        ],
        output: dedent`
          import fooBar from 'fooBar'
          import fooZar from 'fooZar'
        `,
        code: dedent`
          import fooZar from 'fooZar'
          import fooBar from 'fooBar'
        `,
      })
    })

    it('preserves order for custom groups with unsorted type', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedExternalImports',
                selector: 'external',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedExternalImports', 'unknown'],
            newlinesBetween: 'ignore',
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedExternalImports',
              leftGroup: 'unknown',
              left: './something',
              right: 'c',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        output: dedent`
          import b from 'b'
          import a from 'a'
          import d from 'd'
          import e from 'e'
          import c from 'c'
          import something from './something'
        `,
        code: dedent`
          import b from 'b'
          import a from 'a'
          import d from 'd'
          import e from 'e'
          import something from './something'
          import c from 'c'
        `,
      })
    })

    it('sorts custom group blocks with complex selectors', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    selector: 'external',
                  },
                  {
                    selector: 'sibling',
                    modifiers: ['type'],
                  },
                ],
                groupName: 'externalAndTypeSiblingImports',
              },
            ],
            groups: [['externalAndTypeSiblingImports', 'index'], 'unknown'],
            newlinesBetween: 'ignore',
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'externalAndTypeSiblingImports',
              leftGroup: 'unknown',
              right: './c',
              left: './b',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
          {
            data: {
              right: './index',
              left: 'e',
            },
            messageId: 'unexpectedImportsOrder',
          },
        ],
        output: dedent`
          import type c from './c'
          import type d from './d'
          import i from './index'
          import a from 'a'
          import e from 'e'
          import b from './b'
        `,
        code: dedent`
          import a from 'a'
          import b from './b'
          import type c from './c'
          import type d from './d'
          import e from 'e'
          import i from './index'
        `,
      })
    })

    it.each([
      [
        'adds spacing inside custom groups when always option is used',
        'always',
      ],
      ['adds spacing inside custom groups when 1 option is used', 1],
    ])('%s', async (_description, newlinesInside) => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                selector: 'external',
                groupName: 'group1',
                newlinesInside,
              },
            ],
            groups: ['group1'],
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
          import a from 'a'

          import b from 'b'
        `,
        code: dedent`
          import a from 'a'
          import b from 'b'
        `,
      })
    })

    it.each([
      [
        'removes spacing inside custom groups when never option is used',
        'never',
      ],
      ['removes spacing inside custom groups when 0 option is used', 0],
    ])('%s', async (_description, newlinesInside) => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                selector: 'external',
                groupName: 'group1',
                newlinesInside,
              },
            ],
            type: 'alphabetical',
            groups: ['group1'],
          },
        ],
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'extraSpacingBetweenImports',
          },
        ],
        output: dedent`
          import a from 'a'
          import b from 'b'
        `,
        code: dedent`
          import a from 'a'

          import b from 'b'
        `,
      })
    })

    it('detects TypeScript import-equals dependencies', async () => {
      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        output: dedent`
          import { aImport } from "b";
          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;
          import { aImport } from "b";
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        output: dedent`
          import * as aImport from "b";
          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;
          import * as aImport from "b";
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        output: dedent`
          import aImport from "b";
          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;
          import aImport from "b";
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        output: dedent`
          import aImport = require("b")
          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;
          import aImport = require("b")
        `,
      })
    })

    it('prioritizes dependencies over group configuration', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: [
              {
                groupName: 'importsStartingWithA',
                elementNamePattern: '^a',
              },
              {
                groupName: 'importsStartingWithB',
                elementNamePattern: '^b',
              },
            ],
            groups: ['importsStartingWithA', 'importsStartingWithB'],
          },
        ],
        code: dedent`
          import aImport from "b";
          import a = aImport.a1.a2;
        `,
      })

      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                groupName: 'importsStartingWithA',
                elementNamePattern: '^a',
              },
              {
                groupName: 'importsStartingWithB',
                elementNamePattern: '^b',
              },
            ],
            groups: ['importsStartingWithA', 'importsStartingWithB'],
          },
        ],
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
          {
            data: {
              left: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'missedSpacingBetweenImports',
          },
        ],
        output: dedent`
          import aImport from "b";
          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;
          import aImport from "b";
        `,
      })
    })

    it('prioritizes dependencies over comment-based partitions', async () => {
      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        output: dedent`
          import aImport from "b";

          // Part: 1
          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;

          // Part: 1
          import aImport from "b";
        `,
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('prioritizes dependencies over newline-based partitions', async () => {
      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        options: [
          {
            ...options,
            newlinesBetween: 'ignore',
            partitionByNewLine: true,
          },
        ],
        output: dedent`
          import aImport from "b";

          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;

          import aImport from "b";
        `,
      })
    })

    it('prioritizes content separation over dependencies', async () => {
      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'yImport.y1.y2',
              right: 'z',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        output: dedent`
          import f = fImport.f1.f2;

          import yImport from "z";

          import y = yImport.y1.y2;

          export { something } from "something";

          import aImport from "b";

          import a = aImport.a1.a2;

          import fImport from "g";
        `,
        code: dedent`
          import f = fImport.f1.f2;

          import y = yImport.y1.y2;

          import yImport from "z";

          export { something } from "something";

          import a = aImport.a1.a2;

          import aImport from "b";

          import fImport from "g";
        `,
        options: [
          {
            ...options,
            newlinesBetween: 'ignore',
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('ignores shebang comments when sorting imports', async () => {
      await invalid({
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
          #!/usr/bin/node
          import { a } from 'a'
          import { b } from 'b'
        `,
        code: dedent`
          #!/usr/bin/node
          import { b } from 'b'
          import { a } from 'a'
        `,
        options: [options],
      })
    })

    it('treats @ symbol pattern as internal imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: '@/a',
              left: 'b',
            },
            messageId: 'missedSpacingBetweenImports',
          },
        ],
        options: [
          {
            ...options,
            groups: ['external', 'internal'],
            newlinesBetween: 'always',
          },
        ],
        output: dedent`
          import { b } from 'b'

          import { a } from '@/a'
        `,
        code: dedent`
          import { b } from 'b'
          import { a } from '@/a'
        `,
      })
    })

    it('reports missing comments above import groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Comment above a',
              right: 'a',
            },
            messageId: 'missedCommentAboveImport',
          },
          {
            data: {
              missedCommentAbove: 'Comment above b',
              right: './b',
            },
            messageId: 'missedCommentAboveImport',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              { commentAbove: 'Comment above a' },
              'external',
              { commentAbove: 'Comment above b' },
              'unknown',
            ],
          },
        ],
        output: dedent`
          // Comment above a
          import { a } from "a";

          // Comment above b
          import { b } from "./b";
        `,
        code: dedent`
          import { a } from "a";

          import { b } from "./b";
        `,
      })
    })

    it('reports missing comments for single import groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Comment above',
              right: 'a',
            },
            messageId: 'missedCommentAboveImport',
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
          import { a } from "a";
        `,
        code: dedent`
          import { a } from "a";
        `,
      })
    })

    it('ignores shebangs and top-level comments when adding group comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Comment above',
              right: 'b',
            },
            messageId: 'missedCommentAboveImport',
          },
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedImportsOrder',
          },
        ],
        output: dedent`
          #!/usr/bin/node
          // Some disclaimer

          // Comment above
          import a from "a";
          import b from "b";
        `,
        options: [
          {
            ...options,
            groups: [{ commentAbove: 'Comment above' }, 'external'],
          },
        ],
        code: dedent`
          #!/usr/bin/node
          // Some disclaimer

          import b from "b";
          import a from "a";
        `,
      })
    })

    it.each([
      [
        'detects existing line comment with extra spaces',
        '//   Comment above  ',
      ],
      [
        'detects existing line comment with different case',
        '//   comment above  ',
      ],
      [
        'detects existing block comment with standard format',
        dedent`
          /**
           * Comment above
           */
        `,
      ],
      [
        'detects existing block comment with surrounding text',
        dedent`
          /**
           * Something before
           * CoMmEnT ABoVe
           * Something after
           */
        `,
      ],
    ])('%s', async (_description, comment) => {
      await valid({
        options: [
          {
            ...options,
            groups: ['external', { commentAbove: 'Comment above' }, 'unknown'],
          },
        ],
        code: dedent`
          import a from "a";

          ${comment}
          import b from "./b";
        `,
      })
    })

    it('removes and repositions invalid auto-added comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'internal',
              right: '~/d',
            },
            messageId: 'missedCommentAboveImport',
          },
          {
            data: {
              right: '~/c',
              left: '~/d',
            },
            messageId: 'unexpectedImportsOrder',
          },
          {
            data: {
              rightGroup: 'sibling',
              leftGroup: 'internal',
              right: './b',
              left: '~/c',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
          {
            data: {
              rightGroup: 'external',
              leftGroup: 'sibling',
              left: './b',
              right: 'a',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              { commentAbove: 'external' },
              'external',
              { commentAbove: 'sibling' },
              'sibling',
              { commentAbove: 'internal' },
              'internal',
            ],
          },
        ],
        output: dedent`
          // external
          import a from "a";

          // sibling
          import b from './b';

          // internal
          import c from '~/c';
          import d from '~/d';
        `,
        code: dedent`
          import d from '~/d';
          // internal
          import c from '~/c';

          // sibling
          import b from './b';

          // external
          import a from "a";
        `,
      })
    })

    it('handles complex scenarios with multiple error types and comment management', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'internal or sibling',
              right: './c',
            },
            messageId: 'missedCommentAboveImport',
          },
          {
            data: {
              rightGroup: 'external',
              leftGroup: 'sibling',
              left: './c',
              right: 'a',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
          {
            data: {
              right: '~/b',
              left: 'a',
            },
            messageId: 'missedSpacingBetweenImports',
          },
          {
            data: {
              missedCommentAbove: 'internal or sibling',
              right: '~/b',
            },
            messageId: 'missedCommentAboveImport',
          },
        ],
        code: dedent`
          #!/usr/bin/node
          // Some disclaimer

          // Comment above c
          // external
          import c from './c'; // Comment after c
          // Comment above a
          // internal or sibling
          import a from "a"; // Comment after a
          // Comment above b
          // external
          import b from '~/b'; // Comment after b
        `,
        options: [
          {
            ...options,
            groups: [
              { commentAbove: 'external' },
              'external',
              {
                commentAbove: 'internal or sibling',
                newlinesBetween: 'always',
              },
              ['internal', 'sibling'],
            ],
            newlinesBetween: 'never',
          },
        ],
        output: dedent`
          #!/usr/bin/node
          // Some disclaimer

          // Comment above a
          // external
          import a from "a"; // Comment after a

          // internal or sibling
          // Comment above c
          import c from './c'; // Comment after c
          // Comment above b
          import b from '~/b'; // Comment after b
        `,
      })
    })
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it('sorts imports by module name', async () => {
      await valid({
        code: dedent`
          import { a1, a2 } from 'a'
          import { b1 } from 'b'
        `,
        options: [options],
      })

      await invalid({
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
      })
    })

    it('groups and sorts imports by type and source', async () => {
      await valid({
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
        options: [options],
      })

      await invalid({
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
              rightGroup: 'type-internal',
              leftGroup: 'value-internal',
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
              rightGroup: 'value-builtin',
              leftGroup: 'type-sibling',
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
              leftGroup: 'value-parent',
              rightGroup: 'type-index',
              right: './index.d.ts',
              left: '../../h',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
          {
            data: {
              rightGroup: 'type-import',
              leftGroup: 'value-index',
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
        options: [options],
      })
    })

    it('sorts imports without spacing between groups when configured', async () => {
      await valid({
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
          },
        ],
      })

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'value-external',
              leftGroup: 'value-index',
              right: 'a',
              left: '.',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
          {
            data: {
              leftGroup: 'value-internal',
              rightGroup: 'type-import',
              left: '~/c',
              right: 't',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
          {
            data: {
              rightGroup: 'value-internal',
              leftGroup: 'value-parent',
              left: '../../e',
              right: '~/b',
            },
            messageId: 'unexpectedImportsGroupOrder',
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
        options: [
          {
            ...options,
            newlinesBetween: 'never',
          },
        ],
      })
    })

    it('removes extra spacing between import groups', async () => {
      await valid({
        code: dedent`
          import { A } from 'a'

          import b from '~/b'
          import c from '~/c'
          import d from '~/d'
        `,
        options: [options],
      })

      await invalid({
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
        options: [options],
      })
    })

    it('handles TypeScript import-equals syntax correctly', async () => {
      await valid({
        code: dedent`
          import type T = require("T")

          import { A } from 'a'
          import c = require('c/c')

          import { B } from '../b'

          import log = console.log
        `,
        options: [options],
      })

      await invalid({
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
              leftGroup: 'ts-equals-import',
              rightGroup: 'value-external',
              left: 'console.log',
              right: 'c/c',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        output: dedent`
          import type T = require("T")

          import { A } from 'a'
          import c = require('c/c')

          import { B } from '../b'

          import log = console.log
        `,
        code: dedent`
          import type T = require("T")

          import { A } from 'a'
          import { B } from '../b'

          import log = console.log
          import c = require('c/c')
        `,
        options: [options],
      })
    })

    it('groups all type imports together when specific type groups not configured', async () => {
      await valid({
        options: [
          {
            ...options,
            groups: [
              'type',
              ['builtin', 'external'],
              'internal',
              ['parent', 'sibling', 'index'],
            ],
          },
        ],
        code: dedent`
          import type { T } from '../t'
          import type { V } from 'v'
          import type { U } from '~/u'
        `,
      })

      await invalid({
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
            messageId: 'unexpectedImportsOrder',
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
          },
        ],
        code: dedent`
          import type { T } from '../t'

          import type { U } from '~/u'

          import type { V } from 'v'
        `,
        output: dedent`
          import type { T } from '../t'
          import type { V } from 'v'
          import type { U } from '~/u'
        `,
      })
    })

    it('preserves inline comments during sorting', async () => {
      await valid({
        code: dedent`
          import { a } from 'a'
          import { b1, b2 } from 'b' // Comment
          import { c } from 'c'
        `,
        options: [options],
      })
    })

    it('ignores comments when calculating spacing between imports', async () => {
      await valid({
        code: dedent`
          import type { T } from 't'

          // @ts-expect-error missing types
          import { t } from 't'
        `,
        options: [options],
      })
    })

    it('stops grouping imports when other statements appear between them', async () => {
      await valid({
        code: dedent`
          import type { V } from 'v'

          export type { U } from 'u'

          import type { T1, T2 } from 't'
        `,
        options: [options],
      })
    })

    it('groups style imports separately when configured', async () => {
      await valid({
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
              'unknown',
            ],
          },
        ],
        code: dedent`
          import { a1, a2 } from 'a'

          import styles from '../s.css'
          import './t.css'
        `,
      })
    })

    it('groups side-effect imports separately when configured', async () => {
      await valid({
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
              'unknown',
            ],
          },
        ],
        code: dedent`
          import { A } from '../a'
          import { b } from './b'

          import '../c.js'
          import './d'
        `,
      })
    })

    it('groups builtin types separately from other type imports', async () => {
      await valid({
        options: [
          {
            ...options,
            groups: ['builtin-type', 'type'],
          },
        ],
        code: dedent`
          import type { Server } from 'http'

          import a from 'a'
        `,
      })
    })

    it('handles imports with semicolons correctly', async () => {
      await invalid({
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
              'unknown',
            ],
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
      })
    })

    it('removes extra spacing and sorts imports correctly', async () => {
      await invalid({
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
              rightGroup: 'value-external',
              leftGroup: 'value-sibling',
              left: './b',
              right: 'c',
            },
            messageId: 'unexpectedImportsGroupOrder',
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
        options: [options],
      })
    })

    it('supports custom import groups with primary and secondary categories', async () => {
      await invalid({
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
      })
    })

    it('supports custom groups for value imports only', async () => {
      await invalid({
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
      })
    })

    it('handles hash symbol in internal patterns correctly', async () => {
      await valid({
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
            internalPattern: ['#.+'],
          },
        ],
      })

      await invalid({
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
        options: [
          {
            ...options,
            internalPattern: ['#.+'],
          },
        ],
      })
    })

    it('recognizes Bun built-in modules when configured', async () => {
      await valid({
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
      })

      await invalid({
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
      })
    })

    it('sorts CommonJS require imports by module name', async () => {
      await valid({
        code: dedent`
          const { a1, a2 } = require('a')
          const { b1 } = require('b')
        `,
        options: [options],
      })

      await invalid({
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
      })
    })

    it('groups and sorts CommonJS require imports by type and source', async () => {
      await valid({
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
        options: [options],
      })

      await invalid({
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
              leftGroup: 'value-internal',
              rightGroup: 'value-builtin',
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
        options: [options],
      })
    })

    it('preserves side-effect import order when sorting disabled', async () => {
      await valid({
        options: [
          {
            ...options,
            groups: ['external', 'side-effect', 'unknown'],
            sortSideEffects: false,
          },
        ],
        code: dedent`
          import a from 'aaaa'

          import 'bbb'
          import './cc'
          import '../d'
        `,
      })

      await valid({
        options: [
          {
            ...options,
            groups: ['external', 'side-effect', 'unknown'],
            sortSideEffects: false,
          },
        ],
        code: dedent`
          import 'c'
          import 'bb'
          import 'aaa'
        `,
      })

      await invalid({
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
      })
    })

    it('sorts side-effect imports when sorting enabled', async () => {
      await invalid({
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
      })
    })

    it('preserves original order when side-effect imports are not grouped', async () => {
      await invalid({
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
            groups: ['unknown'],
          },
        ],
      })
    })

    it('groups side-effect imports together without sorting them', async () => {
      await invalid({
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
          },
        ],
      })
    })

    it('groups side-effect and style imports together in same group without sorting', async () => {
      await invalid({
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
          },
        ],
      })
    })

    it('separates side-effect and style imports into distinct groups without sorting', async () => {
      await invalid({
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
          },
        ],
      })
    })

    it('groups style side-effect imports separately without sorting', async () => {
      await invalid({
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
          },
        ],
      })
    })

    it('ignores fallback sorting for side-effect imports', async () => {
      await valid({
        options: [
          {
            groups: ['side-effect', 'side-effect-style'],
            fallbackSort: { type: 'alphabetical' },
          },
        ],
        code: dedent`
          import 'b';
          import 'a';

          import 'b.css';
          import 'a.css';
        `,
      })
    })

    it('handles special characters with trim option', async () => {
      await valid({
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
      })
    })

    it('handles special characters with remove option', async () => {
      await valid({
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
      })
    })

    it('supports locale-specific sorting', async () => {
      await valid({
        code: dedent`
          import '你好'
          import '世界'
          import 'a'
          import 'A'
          import 'b'
          import 'B'
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it.each([
      ['removes newlines with never option', 'never'],
      ['removes newlines with 0 option', 0],
    ])('%s', async (_description, newlinesBetween) => {
      await invalid({
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
            newlinesBetween,
          },
        ],
      })
    })

    it('handles custom spacing rules between consecutive groups', async () => {
      await invalid({
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
      })
    })

    it.each([
      [
        'enforces spacing when global option is 2 and group option is never',
        2,
        'never',
      ],
      ['enforces spacing when global option is 2 and group option is 0', 2, 0],
      [
        'enforces spacing when global option is 2 and group option is ignore',
        2,
        'ignore',
      ],
      [
        'enforces spacing when global option is never and group option is 2',
        'never',
        2,
      ],
      ['enforces spacing when global option is 0 and group option is 2', 0, 2],
      [
        'enforces spacing when global option is ignore and group option is 2',
        'ignore',
        2,
      ],
    ])(
      '%s',
      async (_description, globalNewlinesBetween, groupNewlinesBetween) => {
        await invalid({
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
        })
      },
    )

    it.each([
      [
        'removes spacing when never option exists between groups regardless of global setting always',
        'always',
      ],
      [
        'removes spacing when never option exists between groups regardless of global setting 2',
        2,
      ],
      [
        'removes spacing when never option exists between groups regardless of global setting ignore',
        'ignore',
      ],
      [
        'removes spacing when never option exists between groups regardless of global setting never',
        'never',
      ],
      [
        'removes spacing when never option exists between groups regardless of global setting 0',
        0,
      ],
    ])('%s', async (_description, globalNewlinesBetween) => {
      await invalid({
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
            customGroups: {
              value: {
                unusedGroup: 'X',
                a: 'a',
                b: 'b',
                c: 'c',
              },
            },
            newlinesBetween: globalNewlinesBetween,
          },
        ],
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'extraSpacingBetweenImports',
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
      })
    })

    it.each([
      [
        'preserves existing spacing when ignore and never options are combined',
        'ignore',
        'never',
      ],
      [
        'preserves existing spacing when ignore and 0 options are combined',
        'ignore',
        0,
      ],
      [
        'preserves existing spacing when never and ignore options are combined',
        'never',
        'ignore',
      ],
      [
        'preserves existing spacing when 0 and ignore options are combined',
        0,
        'ignore',
      ],
    ])(
      '%s',
      async (_description, globalNewlinesBetween, groupNewlinesBetween) => {
        await valid({
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
        })

        await valid({
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
        })
      },
    )

    it('handles newlines and comments after fixes', async () => {
      await invalid({
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
        output: dedent`
          import { a } from './a' // Comment after

          import { b } from 'b'
          import { c } from 'c'
        `,
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
      })
    })

    it.each([
      [
        'ignores newline fixes between different partitions with never option',
        'never',
      ],
      ['ignores newline fixes between different partitions with 0 option', 0],
    ])('%s', async (_description, newlinesBetween) => {
      await invalid({
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
            partitionByComment: true,
            newlinesBetween,
          },
        ],
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
          import a from 'a';

          // Partition comment

          import { b } from './b';
          import { c } from './c';
        `,
        code: dedent`
          import a from 'a';

          // Partition comment

          import { c } from './c';
          import { b } from './b';
        `,
      })
    })

    it('sorts inline imports correctly', async () => {
      await invalid({
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
      })

      await invalid({
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
      })
    })

    it('allows partitioning by new lines', async () => {
      await invalid({
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
      })
    })

    it('allows partitioning by comment patterns', async () => {
      await invalid({
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
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('treats all comments as partition boundaries when enabled', async () => {
      await valid({
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
      })
    })

    it('supports multiple partition comment patterns', async () => {
      await invalid({
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
            partitionByComment: ['Partition Comment', 'Part:', 'Other'],
          },
        ],
      })
    })

    it('supports regex patterns for partition comments', async () => {
      await valid({
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
      })
    })

    it('ignores block comments when line comment partitioning is enabled', async () => {
      await invalid({
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
      })
    })

    it('treats all line comments as partition boundaries when enabled', async () => {
      await valid({
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
      })
    })

    it('supports multiple line comment patterns for partitioning', async () => {
      await valid({
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
      })
    })

    it('supports regex patterns for line comment partitioning', async () => {
      await valid({
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
      })
    })

    it('ignores line comments when block comment partitioning is enabled', async () => {
      await invalid({
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
      })
    })

    it('treats all block comments as partition boundaries when enabled', async () => {
      await valid({
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
      })
    })

    it('supports multiple block comment patterns for partitioning', async () => {
      await valid({
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
      })
    })

    it('supports regex patterns for block comment partitioning', async () => {
      await valid({
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
      })
    })

    it('supports style imports with query parameters', async () => {
      await valid({
        code: dedent`
          import b from './b.css?raw'
          import c from './c.css'

          import a from './a.js'
        `,
        options: [
          {
            ...options,
            groups: ['style', 'unknown'],
          },
        ],
      })

      await invalid({
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
        options: [
          {
            ...options,
            groups: ['style', 'unknown'],
          },
        ],
      })
    })

    it('prioritizes index types over sibling types', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'sibling-type',
              rightGroup: 'index-type',
              right: './index',
              left: './a',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['index-type', 'sibling-type'],
          },
        ],
        output: dedent`
          import type b from './index'

          import type a from './a'
        `,
        code: dedent`
          import type a from './a'

          import type b from './index'
        `,
      })
    })

    it('prioritizes specific type selectors over generic type group', async () => {
      await invalid({
        options: [
          {
            ...options,
            groups: [
              [
                'index-type',
                'internal-type',
                'external-type',
                'sibling-type',
                'builtin-type',
              ],
              'type',
            ],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'sibling-type',
              leftGroup: 'type',
              right: './b',
              left: '../a',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        output: dedent`
          import type b from './b'
          import type c from './index'
          import type d from 'd'
          import type e from 'timers'

          import type a from '../a'
        `,
        code: dedent`
          import type a from '../a'

          import type b from './b'
          import type c from './index'
          import type d from 'd'
          import type e from 'timers'
        `,
      })
    })

    it('prioritizes index imports over sibling imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'sibling',
              rightGroup: 'index',
              right: './index',
              left: './a',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['index', 'sibling'],
          },
        ],
        output: dedent`
          import b from './index'

          import a from './a'
        `,
        code: dedent`
          import a from './a'

          import b from './index'
        `,
      })
    })

    it('prioritizes style side-effects over generic side-effects', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'side-effect-style',
              leftGroup: 'side-effect',
              right: 'style.css',
              left: 'something',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['side-effect-style', 'side-effect'],
          },
        ],
        output: dedent`
          import 'style.css'

          import 'something'
        `,
        code: dedent`
          import 'something'

          import 'style.css'
        `,
      })
    })

    it('prioritizes side-effects over style imports with default exports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'side-effect',
              right: 'something',
              leftGroup: 'style',
              left: 'style.css',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['side-effect', 'style'],
          },
        ],
        output: dedent`
          import 'something'

          import style from 'style.css'
        `,
        code: dedent`
          import style from 'style.css'

          import 'something'
        `,
      })
    })

    it('prioritizes style imports over other import types', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: '#subpath',
              left: './index',
            },
            messageId: 'unexpectedImportsOrder',
          },
          {
            data: {
              leftGroup: 'builtin',
              rightGroup: 'style',
              right: 'style.css',
              left: 'timers',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              'style',
              [
                'index',
                'internal',
                'subpath',
                'external',
                'sibling',
                'builtin',
                'parent',
                'tsconfig-path',
              ],
            ],
            tsconfigRootDir: '.',
          },
        ],
        output: dedent`
          import style from 'style.css'

          import subpath from '#subpath'
          import tsConfigPath from '$path'
          import a from '../a'
          import b from './b'
          import c from './index'
          import d from 'd'
          import e from 'timers'
        `,
        code: dedent`
          import a from '../a'
          import b from './b'
          import c from './index'
          import subpath from '#subpath'
          import tsConfigPath from '$path'
          import d from 'd'
          import e from 'timers'

          import style from 'style.css'
        `,
        before: () => {
          mockReadClosestTsConfigByPathWith({
            paths: {
              $path: ['./path'],
            },
          })
        },
      })
    })

    it('prioritizes external imports over generic import group', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'external',
              leftGroup: 'import',
              left: './a',
              right: 'b',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['external', 'import'],
          },
        ],
        output: dedent`
          import b from 'b'

          import a from './a'
        `,
        code: dedent`
          import a from './a'

          import b from 'b'
        `,
      })
    })

    it('prioritizes type imports over TypeScript equals imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'type-import',
              leftGroup: 'external',
              right: 'z',
              left: 'f',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['type-import', 'external', 'ts-equals-import'],
          },
        ],
        output: dedent`
          import type z = z

          import f from 'f'
        `,
        code: dedent`
          import f from 'f'

          import type z = z
        `,
      })
    })

    it('prioritizes side-effect imports over value imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'side-effect-import',
              leftGroup: 'external',
              right: './z',
              left: 'f',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['side-effect-import', 'external', 'value-import'],
            sortSideEffects: true,
          },
        ],
        output: dedent`
          import "./z"

          import f from 'f'
        `,
        code: dedent`
          import f from 'f'

          import "./z"
        `,
      })
    })

    it('prioritizes value imports over TypeScript equals imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'value-import',
              leftGroup: 'external',
              right: 'z',
              left: 'f',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['value-import', 'external', 'ts-equals-import'],
          },
        ],
        output: dedent`
          import z = z

          import f from 'f'
        `,
        code: dedent`
          import f from 'f'

          import z = z
        `,
      })
    })

    it('prioritizes TypeScript equals imports over require imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'ts-equals-import',
              leftGroup: 'external',
              right: './z',
              left: 'f',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['ts-equals-import', 'external', 'require-import'],
          },
        ],
        output: dedent`
          import z = require('./z')

          import f from 'f'
        `,
        code: dedent`
          import f from 'f'

          import z = require('./z')
        `,
      })
    })

    it('prioritizes default imports over named imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'default-import',
              leftGroup: 'external',
              right: './z',
              left: 'f',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['default-import', 'external', 'named-import'],
          },
        ],
        output: dedent`
          import z, { z } from "./z"

          import f from 'f'
        `,
        code: dedent`
          import f from 'f'

          import z, { z } from "./z"
        `,
      })
    })

    it('prioritizes wildcard imports over named imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'wildcard-import',
              leftGroup: 'external',
              right: './z',
              left: 'f',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['wildcard-import', 'external', 'named-import'],
          },
        ],
        output: dedent`
          import z, * as z from "./z"

          import f from 'f'
        `,
        code: dedent`
          import f from 'f'

          import z, * as z from "./z"
        `,
      })
    })

    it.each([
      ['filters on element name pattern with string', 'hello'],
      ['filters on element name pattern with array', ['noMatch', 'hello']],
      [
        'filters on element name pattern with regex object',
        { pattern: 'HELLO', flags: 'i' },
      ],
      [
        'filters on element name pattern with array containing regex',
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ],
    ])('%s', async (_description, elementNamePattern) => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'importsStartingWithHello',
              right: 'helloImport',
              leftGroup: 'unknown',
              left: 'a',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'importsStartingWithHello',
                elementNamePattern,
              },
            ],
            groups: ['importsStartingWithHello', 'unknown'],
          },
        ],
        output: dedent`
          import hello from 'helloImport'

          import a from 'a'
        `,
        code: dedent`
          import a from 'a'

          import hello from 'helloImport'
        `,
      })
    })

    it('sorts custom groups by overriding type and order settings', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: 'unexpectedImportsOrder',
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: 'unexpectedImportsOrder',
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: 'unexpectedImportsOrder',
          },
          {
            data: {
              rightGroup: 'reversedExternalImportsByLineLength',
              leftGroup: 'unknown',
              left: './jjjjj',
              right: 'eee',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedExternalImportsByLineLength',
                selector: 'external',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedExternalImportsByLineLength', 'unknown'],
            newlinesBetween: 'ignore',
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          import dddd from 'dddd'
          import ccc from 'ccc'
          import eee from 'eee'
          import bb from 'bb'
          import ff from 'ff'
          import a from 'a'
          import g from 'g'
          import h from './h'
          import i from './i'
          import jjjjj from './jjjjj'
        `,
        code: dedent`
          import a from 'a'
          import bb from 'bb'
          import ccc from 'ccc'
          import dddd from 'dddd'
          import jjjjj from './jjjjj'
          import eee from 'eee'
          import ff from 'ff'
          import g from 'g'
          import h from './h'
          import i from './i'
        `,
      })
    })

    it('sorts custom groups using fallback sort settings', async () => {
      await invalid({
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
            messageId: 'unexpectedImportsOrder',
          },
        ],
        output: dedent`
          import fooBar from 'fooBar'
          import fooZar from 'fooZar'
        `,
        code: dedent`
          import fooZar from 'fooZar'
          import fooBar from 'fooBar'
        `,
      })
    })

    it('preserves order for custom groups with unsorted type', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedExternalImports',
                selector: 'external',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedExternalImports', 'unknown'],
            newlinesBetween: 'ignore',
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedExternalImports',
              leftGroup: 'unknown',
              left: './something',
              right: 'c',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        output: dedent`
          import b from 'b'
          import a from 'a'
          import d from 'd'
          import e from 'e'
          import c from 'c'
          import something from './something'
        `,
        code: dedent`
          import b from 'b'
          import a from 'a'
          import d from 'd'
          import e from 'e'
          import something from './something'
          import c from 'c'
        `,
      })
    })

    it('sorts custom group blocks with complex selectors', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    selector: 'external',
                  },
                  {
                    selector: 'sibling',
                    modifiers: ['type'],
                  },
                ],
                groupName: 'externalAndTypeSiblingImports',
              },
            ],
            groups: [['externalAndTypeSiblingImports', 'index'], 'unknown'],
            newlinesBetween: 'ignore',
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'externalAndTypeSiblingImports',
              leftGroup: 'unknown',
              right: './c',
              left: './b',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
          {
            data: {
              right: './index',
              left: 'e',
            },
            messageId: 'unexpectedImportsOrder',
          },
        ],
        output: dedent`
          import type c from './c'
          import type d from './d'
          import i from './index'
          import a from 'a'
          import e from 'e'
          import b from './b'
        `,
        code: dedent`
          import a from 'a'
          import b from './b'
          import type c from './c'
          import type d from './d'
          import e from 'e'
          import i from './index'
        `,
      })
    })

    it('detects TypeScript import-equals dependencies', async () => {
      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        output: dedent`
          import { aImport } from "b";
          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;
          import { aImport } from "b";
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        output: dedent`
          import * as aImport from "b";
          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;
          import * as aImport from "b";
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        output: dedent`
          import aImport from "b";
          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;
          import aImport from "b";
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        output: dedent`
          import aImport = require("b")
          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;
          import aImport = require("b")
        `,
      })
    })

    it('prioritizes dependencies over group configuration', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: [
              {
                groupName: 'importsStartingWithA',
                elementNamePattern: '^a',
              },
              {
                groupName: 'importsStartingWithB',
                elementNamePattern: '^b',
              },
            ],
            groups: ['importsStartingWithA', 'importsStartingWithB'],
          },
        ],
        code: dedent`
          import aImport from "b";
          import a = aImport.a1.a2;
        `,
      })

      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                groupName: 'importsStartingWithA',
                elementNamePattern: '^a',
              },
              {
                groupName: 'importsStartingWithB',
                elementNamePattern: '^b',
              },
            ],
            groups: ['importsStartingWithA', 'importsStartingWithB'],
          },
        ],
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
          {
            data: {
              left: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'missedSpacingBetweenImports',
          },
        ],
        output: dedent`
          import aImport from "b";
          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;
          import aImport from "b";
        `,
      })
    })

    it('prioritizes dependencies over comment-based partitions', async () => {
      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        output: dedent`
          import aImport from "b";

          // Part: 1
          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;

          // Part: 1
          import aImport from "b";
        `,
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('prioritizes dependencies over newline-based partitions', async () => {
      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        options: [
          {
            ...options,
            newlinesBetween: 'ignore',
            partitionByNewLine: true,
          },
        ],
        output: dedent`
          import aImport from "b";

          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;

          import aImport from "b";
        `,
      })
    })

    it('prioritizes content separation over dependencies', async () => {
      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'yImport.y1.y2',
              right: 'z',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        output: dedent`
          import f = fImport.f1.f2;

          import yImport from "z";

          import y = yImport.y1.y2;

          export { something } from "something";

          import aImport from "b";

          import a = aImport.a1.a2;

          import fImport from "g";
        `,
        code: dedent`
          import f = fImport.f1.f2;

          import y = yImport.y1.y2;

          import yImport from "z";

          export { something } from "something";

          import a = aImport.a1.a2;

          import aImport from "b";

          import fImport from "g";
        `,
        options: [
          {
            ...options,
            newlinesBetween: 'ignore',
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('ignores shebang comments when sorting imports', async () => {
      await invalid({
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
          #!/usr/bin/node
          import { a } from 'a'
          import { b } from 'b'
        `,
        code: dedent`
          #!/usr/bin/node
          import { b } from 'b'
          import { a } from 'a'
        `,
        options: [options],
      })
    })

    it('treats @ symbol pattern as internal imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: '@/a',
              left: 'b',
            },
            messageId: 'missedSpacingBetweenImports',
          },
        ],
        options: [
          {
            ...options,
            groups: ['external', 'internal'],
            newlinesBetween: 'always',
          },
        ],
        output: dedent`
          import { b } from 'b'

          import { a } from '@/a'
        `,
        code: dedent`
          import { b } from 'b'
          import { a } from '@/a'
        `,
      })
    })

    it('reports missing comments above import groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Comment above a',
              right: 'a',
            },
            messageId: 'missedCommentAboveImport',
          },
          {
            data: {
              missedCommentAbove: 'Comment above b',
              right: './b',
            },
            messageId: 'missedCommentAboveImport',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              { commentAbove: 'Comment above a' },
              'external',
              { commentAbove: 'Comment above b' },
              'unknown',
            ],
          },
        ],
        output: dedent`
          // Comment above a
          import { a } from "a";

          // Comment above b
          import { b } from "./b";
        `,
        code: dedent`
          import { a } from "a";

          import { b } from "./b";
        `,
      })
    })

    it('reports missing comments for single import groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Comment above',
              right: 'a',
            },
            messageId: 'missedCommentAboveImport',
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
          import { a } from "a";
        `,
        code: dedent`
          import { a } from "a";
        `,
      })
    })

    it('ignores shebangs and top-level comments when adding group comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Comment above',
              right: 'b',
            },
            messageId: 'missedCommentAboveImport',
          },
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedImportsOrder',
          },
        ],
        output: dedent`
          #!/usr/bin/node
          // Some disclaimer

          // Comment above
          import a from "a";
          import b from "b";
        `,
        options: [
          {
            ...options,
            groups: [{ commentAbove: 'Comment above' }, 'external'],
          },
        ],
        code: dedent`
          #!/usr/bin/node
          // Some disclaimer

          import b from "b";
          import a from "a";
        `,
      })
    })

    it.each([
      [
        'detects existing line comment with extra spaces',
        '//   Comment above  ',
      ],
      [
        'detects existing line comment with different case',
        '//   comment above  ',
      ],
      [
        'detects existing block comment with standard format',
        dedent`
          /**
           * Comment above
           */
        `,
      ],
      [
        'detects existing block comment with surrounding text',
        dedent`
          /**
           * Something before
           * CoMmEnT ABoVe
           * Something after
           */
        `,
      ],
    ])('%s', async (_description, comment) => {
      await valid({
        options: [
          {
            ...options,
            groups: ['external', { commentAbove: 'Comment above' }, 'unknown'],
          },
        ],
        code: dedent`
          import a from "a";

          ${comment}
          import b from "./b";
        `,
      })
    })

    it('removes and repositions invalid auto-added comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'internal',
              right: '~/d',
            },
            messageId: 'missedCommentAboveImport',
          },
          {
            data: {
              right: '~/c',
              left: '~/d',
            },
            messageId: 'unexpectedImportsOrder',
          },
          {
            data: {
              rightGroup: 'sibling',
              leftGroup: 'internal',
              right: './b',
              left: '~/c',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
          {
            data: {
              rightGroup: 'external',
              leftGroup: 'sibling',
              left: './b',
              right: 'a',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              { commentAbove: 'external' },
              'external',
              { commentAbove: 'sibling' },
              'sibling',
              { commentAbove: 'internal' },
              'internal',
            ],
          },
        ],
        output: dedent`
          // external
          import a from "a";

          // sibling
          import b from './b';

          // internal
          import c from '~/c';
          import d from '~/d';
        `,
        code: dedent`
          import d from '~/d';
          // internal
          import c from '~/c';

          // sibling
          import b from './b';

          // external
          import a from "a";
        `,
      })
    })

    it('handles complex scenarios with multiple error types and comment management', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'internal or sibling',
              right: './c',
            },
            messageId: 'missedCommentAboveImport',
          },
          {
            data: {
              rightGroup: 'external',
              leftGroup: 'sibling',
              left: './c',
              right: 'a',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
          {
            data: {
              right: '~/b',
              left: 'a',
            },
            messageId: 'missedSpacingBetweenImports',
          },
          {
            data: {
              missedCommentAbove: 'internal or sibling',
              right: '~/b',
            },
            messageId: 'missedCommentAboveImport',
          },
        ],
        code: dedent`
          #!/usr/bin/node
          // Some disclaimer

          // Comment above c
          // external
          import c from './c'; // Comment after c
          // Comment above a
          // internal or sibling
          import a from "a"; // Comment after a
          // Comment above b
          // external
          import b from '~/b'; // Comment after b
        `,
        options: [
          {
            ...options,
            groups: [
              { commentAbove: 'external' },
              'external',
              {
                commentAbove: 'internal or sibling',
                newlinesBetween: 'always',
              },
              ['internal', 'sibling'],
            ],
            newlinesBetween: 'never',
          },
        ],
        output: dedent`
          #!/usr/bin/node
          // Some disclaimer

          // Comment above a
          // external
          import a from "a"; // Comment after a

          // internal or sibling
          // Comment above c
          import c from './c'; // Comment after c
          // Comment above b
          import b from '~/b'; // Comment after b
        `,
      })
    })
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it('sorts imports by module name', async () => {
      await valid({
        code: dedent`
          import { a1, a2 } from 'a'
          import { b1 } from 'b'
        `,
        options: [options],
      })

      await invalid({
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
      })
    })

    it('groups and sorts imports by type and source', async () => {
      await valid({
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
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'type-internal',
              leftGroup: 'value-internal',
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
              rightGroup: 'value-builtin',
              leftGroup: 'type-sibling',
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
              leftGroup: 'value-parent',
              rightGroup: 'type-index',
              right: './index.d.ts',
              left: '../../h',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
          {
            data: {
              rightGroup: 'type-import',
              leftGroup: 'value-index',
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
        options: [options],
      })
    })

    it('sorts imports without spacing between groups when configured', async () => {
      await valid({
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
          },
        ],
      })

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'value-external',
              leftGroup: 'value-index',
              right: 'a',
              left: '.',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
          {
            data: {
              leftGroup: 'value-internal',
              rightGroup: 'type-import',
              left: '~/c',
              right: 't',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
          {
            data: {
              rightGroup: 'value-internal',
              leftGroup: 'value-parent',
              left: '../../e',
              right: '~/b',
            },
            messageId: 'unexpectedImportsGroupOrder',
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
        options: [
          {
            ...options,
            newlinesBetween: 'never',
          },
        ],
      })
    })

    it('removes extra spacing between import groups', async () => {
      await valid({
        code: dedent`
          import { A } from 'a'

          import b from '~/b'
          import c from '~/c'
          import d from '~/d'
        `,
        options: [options],
      })

      await invalid({
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
        options: [options],
      })
    })

    it('handles TypeScript import-equals syntax correctly', async () => {
      await valid({
        code: dedent`
          import type T = require("T")

          import c = require('c/c')
          import { A } from 'a'

          import { B } from '../b'

          import log = console.log
        `,
        options: [options],
      })

      await invalid({
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
              leftGroup: 'ts-equals-import',
              rightGroup: 'value-external',
              left: 'console.log',
              right: 'c/c',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        output: dedent`
          import type T = require("T")

          import c = require('c/c')
          import { A } from 'a'

          import { B } from '../b'

          import log = console.log
        `,
        code: dedent`
          import type T = require("T")

          import { A } from 'a'
          import { B } from '../b'

          import log = console.log
          import c = require('c/c')
        `,
        options: [options],
      })
    })

    it('groups all type imports together when specific type groups not configured', async () => {
      await valid({
        options: [
          {
            ...options,
            groups: [
              'type',
              ['builtin', 'external'],
              'internal',
              ['parent', 'sibling', 'index'],
            ],
          },
        ],
        code: dedent`
          import type { T } from '../t'
          import type { U } from '~/u'
          import type { V } from 'v'
        `,
      })

      await invalid({
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
      })
    })

    it('preserves inline comments during sorting', async () => {
      await valid({
        code: dedent`
          import { b1, b2 } from 'b' // Comment
          import { a } from 'a'
          import { c } from 'c'
        `,
        options: [options],
      })
    })

    it('ignores comments when calculating spacing between imports', async () => {
      await valid({
        code: dedent`
          import type { T } from 't'

          // @ts-expect-error missing types
          import { t } from 't'
        `,
        options: [options],
      })
    })

    it('stops grouping imports when other statements appear between them', async () => {
      await valid({
        code: dedent`
          import type { V } from 'v'

          export type { U } from 'u'

          import type { T1, T2 } from 't'
        `,
        options: [options],
      })
    })

    it('groups style imports separately when configured', async () => {
      await valid({
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
              'unknown',
            ],
          },
        ],
        code: dedent`
          import { a1, a2 } from 'a'

          import styles from '../s.css'
          import './t.css'
        `,
      })
    })

    it('groups side-effect imports separately when configured', async () => {
      await valid({
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
              'unknown',
            ],
          },
        ],
        code: dedent`
          import { A } from '../a'
          import { b } from './b'

          import '../c.js'
          import './d'
        `,
      })
    })

    it('groups builtin types separately from other type imports', async () => {
      await valid({
        options: [
          {
            ...options,
            groups: ['builtin-type', 'type'],
          },
        ],
        code: dedent`
          import type { Server } from 'http'

          import a from 'a'
        `,
      })
    })

    it('handles imports with semicolons correctly', async () => {
      await invalid({
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
              'unknown',
            ],
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
      })
    })

    it('removes extra spacing and sorts imports correctly', async () => {
      await invalid({
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
              rightGroup: 'value-external',
              leftGroup: 'value-sibling',
              left: './b',
              right: 'c',
            },
            messageId: 'unexpectedImportsGroupOrder',
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
        options: [options],
      })
    })

    it('supports custom import groups with primary and secondary categories', async () => {
      await invalid({
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
      })
    })

    it('supports custom groups for value imports only', async () => {
      await invalid({
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
      })
    })

    it('handles hash symbol in internal patterns correctly', async () => {
      await valid({
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
            internalPattern: ['#.+'],
          },
        ],
      })

      await invalid({
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
        options: [
          {
            ...options,
            internalPattern: ['#.+'],
          },
        ],
      })
    })

    it('recognizes Bun built-in modules when configured', async () => {
      await valid({
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
      })

      await invalid({
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
      })
    })

    it('sorts CommonJS require imports by module name', async () => {
      await valid({
        code: dedent`
          const { a1, a2 } = require('a')
          const { b1 } = require('b')
        `,
        options: [options],
      })

      await invalid({
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
      })
    })

    it('groups and sorts CommonJS require imports by type and source', async () => {
      await valid({
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
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'value-internal',
              rightGroup: 'value-builtin',
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
        options: [options],
      })
    })

    it('preserves side-effect import order when sorting disabled', async () => {
      await valid({
        options: [
          {
            ...options,
            groups: ['external', 'side-effect', 'unknown'],
            sortSideEffects: false,
          },
        ],
        code: dedent`
          import a from 'aaaa'

          import 'bbb'
          import './cc'
          import '../d'
        `,
      })

      await valid({
        options: [
          {
            ...options,
            groups: ['external', 'side-effect', 'unknown'],
            sortSideEffects: false,
          },
        ],
        code: dedent`
          import 'c'
          import 'bb'
          import 'aaa'
        `,
      })

      await invalid({
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
      })
    })

    it('sorts side-effect imports when sorting enabled', async () => {
      await invalid({
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
      })
    })

    it('preserves original order when side-effect imports are not grouped', async () => {
      await invalid({
        output: dedent`
          import "./z-side-effect.scss";
          import a from "./aa";
          import b from "./b";
          import './b-side-effect'
          import "./g-side-effect.css";
          import './a-side-effect'
        `,
        code: dedent`
          import "./z-side-effect.scss";
          import b from "./b";
          import a from "./aa";
          import './b-side-effect'
          import "./g-side-effect.css";
          import './a-side-effect'
        `,
        errors: [
          {
            data: {
              right: './aa',
              left: './b',
            },
            messageId: 'unexpectedImportsOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
      })
    })

    it('groups side-effect imports together without sorting them', async () => {
      await invalid({
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

          import b from "./b";
          import a from "./a";
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
          },
        ],
      })
    })

    it('groups side-effect and style imports together in same group without sorting', async () => {
      await invalid({
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

          import b from "./b";
          import a from "./a";
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
          },
        ],
      })
    })

    it('separates side-effect and style imports into distinct groups without sorting', async () => {
      await invalid({
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

          import b from "./b";
          import a from "./a";
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
          },
        ],
      })
    })

    it('groups style side-effect imports separately without sorting', async () => {
      await invalid({
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
          import b from "./b";
          import a from "./a";
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
          },
        ],
      })
    })

    it('ignores fallback sorting for side-effect imports', async () => {
      await valid({
        options: [
          {
            groups: ['side-effect', 'side-effect-style'],
            fallbackSort: { type: 'alphabetical' },
          },
        ],
        code: dedent`
          import 'b';
          import 'a';

          import 'b.css';
          import 'a.css';
        `,
      })
    })

    it('handles special characters with trim option', async () => {
      await valid({
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
      })
    })

    it('handles special characters with remove option', async () => {
      await valid({
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
      })
    })

    it('supports locale-specific sorting', async () => {
      await valid({
        code: dedent`
          import '你好'
          import '世界'
          import 'a'
          import 'A'
          import 'b'
          import 'B'
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it.each([
      ['removes newlines with never option', 'never'],
      ['removes newlines with 0 option', 0],
    ])('%s', async (_description, newlinesBetween) => {
      await invalid({
        errors: [
          {
            data: {
              right: '~/y',
              left: 'aaaa',
            },
            messageId: 'extraSpacingBetweenImports',
          },
          {
            data: {
              right: '~/bb',
              left: '~/z',
            },
            messageId: 'unexpectedImportsOrder',
          },
          {
            data: {
              right: '~/bb',
              left: '~/z',
            },
            messageId: 'extraSpacingBetweenImports',
          },
        ],
        code: dedent`
            import { A } from 'aaaa'


           import y from '~/y'
          import z from '~/z'

              import b from '~/bb'
        `,
        output: dedent`
            import { A } from 'aaaa'
           import b from '~/bb'
          import y from '~/y'
              import z from '~/z'
        `,
        options: [
          {
            ...options,
            newlinesBetween,
          },
        ],
      })
    })

    it('handles custom spacing rules between consecutive groups', async () => {
      await invalid({
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
      })
    })

    it.each([
      [
        'enforces spacing when global option is 2 and group option is never',
        2,
        'never',
      ],
      ['enforces spacing when global option is 2 and group option is 0', 2, 0],
      [
        'enforces spacing when global option is 2 and group option is ignore',
        2,
        'ignore',
      ],
      [
        'enforces spacing when global option is never and group option is 2',
        'never',
        2,
      ],
      ['enforces spacing when global option is 0 and group option is 2', 0, 2],
      [
        'enforces spacing when global option is ignore and group option is 2',
        'ignore',
        2,
      ],
    ])(
      '%s',
      async (_description, globalNewlinesBetween, groupNewlinesBetween) => {
        await invalid({
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
        })
      },
    )

    it.each([
      [
        'removes spacing when never option exists between groups regardless of global setting always',
        'always',
      ],
      [
        'removes spacing when never option exists between groups regardless of global setting 2',
        2,
      ],
      [
        'removes spacing when never option exists between groups regardless of global setting ignore',
        'ignore',
      ],
      [
        'removes spacing when never option exists between groups regardless of global setting never',
        'never',
      ],
      [
        'removes spacing when never option exists between groups regardless of global setting 0',
        0,
      ],
    ])('%s', async (_description, globalNewlinesBetween) => {
      await invalid({
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
            customGroups: {
              value: {
                unusedGroup: 'X',
                a: 'a',
                b: 'b',
                c: 'c',
              },
            },
            newlinesBetween: globalNewlinesBetween,
          },
        ],
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'extraSpacingBetweenImports',
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
      })
    })

    it.each([
      [
        'preserves existing spacing when ignore and never options are combined',
        'ignore',
        'never',
      ],
      [
        'preserves existing spacing when ignore and 0 options are combined',
        'ignore',
        0,
      ],
      [
        'preserves existing spacing when never and ignore options are combined',
        'never',
        'ignore',
      ],
      [
        'preserves existing spacing when 0 and ignore options are combined',
        0,
        'ignore',
      ],
    ])(
      '%s',
      async (_description, globalNewlinesBetween, groupNewlinesBetween) => {
        await valid({
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
        })

        await valid({
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
        })
      },
    )

    it('handles newlines and comments after fixes', async () => {
      await invalid({
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
        output: dedent`
          import { a } from './a' // Comment after

          import { b } from 'b'
          import { c } from 'c'
        `,
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
      })
    })

    it.each([
      [
        'ignores newline fixes between different partitions with never option',
        'never',
      ],
      ['ignores newline fixes between different partitions with 0 option', 0],
    ])('%s', async (_description, newlinesBetween) => {
      await invalid({
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
            partitionByComment: true,
            newlinesBetween,
          },
        ],
        errors: [
          {
            data: {
              right: './bb',
              left: './c',
            },
            messageId: 'unexpectedImportsOrder',
          },
        ],
        output: dedent`
          import a from 'a';

          // Partition comment

          import { b } from './bb';
          import { c } from './c';
        `,
        code: dedent`
          import a from 'a';

          // Partition comment

          import { c } from './c';
          import { b } from './bb';
        `,
      })
    })

    it('sorts inline imports correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'aa',
              left: 'b',
            },
            messageId: 'unexpectedImportsOrder',
          },
        ],
        output: dedent`
          import { a } from "aa"; import { b } from "b";
        `,
        code: dedent`
          import { b } from "b"; import { a } from "aa"
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'aa',
              left: 'b',
            },
            messageId: 'unexpectedImportsOrder',
          },
        ],
        output: dedent`
          import { a } from "aa"; import { b } from "b";
        `,
        code: dedent`
          import { b } from "b"; import { a } from "aa";
        `,
        options: [options],
      })
    })

    it('allows partitioning by new lines', async () => {
      await invalid({
        output: dedent`
          import * as organisms from "./organisms";
          import * as shared from "./shared";
          import * as atoms from "./atoms";

          import { AnotherNamed } from './second-folder';
          import { Named } from './folder';
        `,
        code: dedent`
          import * as organisms from "./organisms";
          import * as atoms from "./atoms";
          import * as shared from "./shared";

          import { AnotherNamed } from './second-folder';
          import { Named } from './folder';
        `,
        errors: [
          {
            data: {
              right: './shared',
              left: './atoms',
            },
            messageId: 'unexpectedImportsOrder',
          },
        ],
        options: [
          {
            ...options,
            newlinesBetween: 'ignore',
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('allows partitioning by comment patterns', async () => {
      await invalid({
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
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('treats all comments as partition boundaries when enabled', async () => {
      await valid({
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
      })
    })

    it('supports multiple partition comment patterns', async () => {
      await invalid({
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
            partitionByComment: ['Partition Comment', 'Part:', 'Other'],
          },
        ],
      })
    })

    it('supports regex patterns for partition comments', async () => {
      await valid({
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
      })
    })

    it('ignores block comments when line comment partitioning is enabled', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: './aa',
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
          import a from './aa'
          import b from './b'
        `,
        code: dedent`
          import b from './b'
          /* Comment */
          import a from './aa'
        `,
      })
    })

    it('treats all line comments as partition boundaries when enabled', async () => {
      await valid({
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
      })
    })

    it('supports multiple line comment patterns for partitioning', async () => {
      await valid({
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
      })
    })

    it('supports regex patterns for line comment partitioning', async () => {
      await valid({
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
      })
    })

    it('ignores line comments when block comment partitioning is enabled', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: './aa',
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
          import a from './aa'
          import b from './b'
        `,
        code: dedent`
          import b from './b'
          // Comment
          import a from './aa'
        `,
      })
    })

    it('treats all block comments as partition boundaries when enabled', async () => {
      await valid({
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
      })
    })

    it('supports multiple block comment patterns for partitioning', async () => {
      await valid({
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
      })
    })

    it('supports regex patterns for block comment partitioning', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['^(?!.*foo).*$'],
            },
          },
        ],
        code: dedent`
          import b from './bb'
          /* I am a partition comment because I don't have f o o */
          import a from './a'
        `,
      })
    })

    it('supports style imports with query parameters', async () => {
      await valid({
        code: dedent`
          import b from './b.css?raw'
          import c from './c.css'

          import a from './a.js'
        `,
        options: [
          {
            ...options,
            groups: ['style', 'unknown'],
          },
        ],
      })

      await invalid({
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
        options: [
          {
            ...options,
            groups: ['style', 'unknown'],
          },
        ],
      })
    })

    it('prioritizes index types over sibling types', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'sibling-type',
              rightGroup: 'index-type',
              right: './index',
              left: './a',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['index-type', 'sibling-type'],
          },
        ],
        output: dedent`
          import type b from './index'

          import type a from './a'
        `,
        code: dedent`
          import type a from './a'

          import type b from './index'
        `,
      })
    })

    it('prioritizes specific type selectors over generic type group', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'sibling-type',
              leftGroup: 'type',
              right: './b',
              left: '../a',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
          {
            data: {
              right: './index',
              left: './b',
            },
            messageId: 'unexpectedImportsOrder',
          },
          {
            data: {
              right: 'timers',
              left: 'd',
            },
            messageId: 'unexpectedImportsOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              [
                'index-type',
                'internal-type',
                'external-type',
                'sibling-type',
                'builtin-type',
              ],
              'type',
            ],
          },
        ],
        output: dedent`
          import type c from './index'
          import type e from 'timers'
          import type b from './b'
          import type d from 'd'

          import type a from '../a'
        `,
        code: dedent`
          import type a from '../a'

          import type b from './b'
          import type c from './index'
          import type d from 'd'
          import type e from 'timers'
        `,
      })
    })

    it('prioritizes index imports over sibling imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'sibling',
              rightGroup: 'index',
              right: './index',
              left: './a',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['index', 'sibling'],
          },
        ],
        output: dedent`
          import b from './index'

          import a from './a'
        `,
        code: dedent`
          import a from './a'

          import b from './index'
        `,
      })
    })

    it('prioritizes style side-effects over generic side-effects', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'side-effect-style',
              leftGroup: 'side-effect',
              right: 'style.css',
              left: 'something',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['side-effect-style', 'side-effect'],
          },
        ],
        output: dedent`
          import 'style.css'

          import 'something'
        `,
        code: dedent`
          import 'something'

          import 'style.css'
        `,
      })
    })

    it('prioritizes side-effects over style imports with default exports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'side-effect',
              right: 'something',
              leftGroup: 'style',
              left: 'style.css',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['side-effect', 'style'],
          },
        ],
        output: dedent`
          import 'something'

          import style from 'style.css'
        `,
        code: dedent`
          import style from 'style.css'

          import 'something'
        `,
      })
    })

    it('prioritizes style imports over other import types', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: './index',
              left: './b',
            },
            messageId: 'unexpectedImportsOrder',
          },
          {
            data: {
              right: '#subpath',
              left: './index',
            },
            messageId: 'unexpectedImportsOrder',
          },
          {
            data: {
              left: '#subpath',
              right: '$path',
            },
            messageId: 'unexpectedImportsOrder',
          },
          {
            data: {
              right: 'timers',
              left: 'd',
            },
            messageId: 'unexpectedImportsOrder',
          },
          {
            data: {
              leftGroup: 'builtin',
              rightGroup: 'style',
              right: 'style.css',
              left: 'timers',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              'style',
              [
                'index',
                'internal',
                'subpath',
                'external',
                'sibling',
                'builtin',
                'parent',
                'tsconfig-path',
              ],
            ],
            tsconfigRootDir: '.',
          },
        ],
        output: dedent`
          import style from 'style.css'

          import tsConfigPath from '$path'
          import subpath from '#subpath'
          import c from './index'
          import e from 'timers'
          import a from '../a'
          import b from './b'
          import d from 'd'
        `,
        code: dedent`
          import a from '../a'
          import b from './b'
          import c from './index'
          import subpath from '#subpath'
          import tsConfigPath from '$path'
          import d from 'd'
          import e from 'timers'

          import style from 'style.css'
        `,
        before: () => {
          mockReadClosestTsConfigByPathWith({
            paths: {
              $path: ['./path'],
            },
          })
        },
      })
    })

    it('prioritizes external imports over generic import group', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'external',
              leftGroup: 'import',
              left: './aa',
              right: 'b',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['external', 'import'],
          },
        ],
        output: dedent`
          import b from 'b'

          import a from './aa'
        `,
        code: dedent`
          import a from './aa'

          import b from 'b'
        `,
      })
    })

    it('prioritizes type imports over TypeScript equals imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'type-import',
              leftGroup: 'external',
              right: 'z',
              left: 'f',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['type-import', 'external', 'ts-equals-import'],
          },
        ],
        output: dedent`
          import type z = z

          import f from 'f'
        `,
        code: dedent`
          import f from 'f'

          import type z = z
        `,
      })
    })

    it('prioritizes side-effect imports over value imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'side-effect-import',
              leftGroup: 'external',
              right: './z',
              left: 'f',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['side-effect-import', 'external', 'value-import'],
            sortSideEffects: true,
          },
        ],
        output: dedent`
          import "./z"

          import f from 'f'
        `,
        code: dedent`
          import f from 'f'

          import "./z"
        `,
      })
    })

    it('prioritizes value imports over TypeScript equals imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'value-import',
              leftGroup: 'external',
              right: 'z',
              left: 'f',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['value-import', 'external', 'ts-equals-import'],
          },
        ],
        output: dedent`
          import z = z

          import f from 'f'
        `,
        code: dedent`
          import f from 'f'

          import z = z
        `,
      })
    })

    it('prioritizes TypeScript equals imports over require imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'ts-equals-import',
              leftGroup: 'external',
              right: './z',
              left: 'f',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['ts-equals-import', 'external', 'require-import'],
          },
        ],
        output: dedent`
          import z = require('./z')

          import f from 'f'
        `,
        code: dedent`
          import f from 'f'

          import z = require('./z')
        `,
      })
    })

    it('prioritizes default imports over named imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'default-import',
              leftGroup: 'external',
              right: './z',
              left: 'f',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['default-import', 'external', 'named-import'],
          },
        ],
        output: dedent`
          import z, { z } from "./z"

          import f from 'f'
        `,
        code: dedent`
          import f from 'f'

          import z, { z } from "./z"
        `,
      })
    })

    it('prioritizes wildcard imports over named imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'wildcard-import',
              leftGroup: 'external',
              right: './z',
              left: 'f',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['wildcard-import', 'external', 'named-import'],
          },
        ],
        output: dedent`
          import z, * as z from "./z"

          import f from 'f'
        `,
        code: dedent`
          import f from 'f'

          import z, * as z from "./z"
        `,
      })
    })

    it.each([
      ['filters on element name pattern with string', 'hello'],
      ['filters on element name pattern with array', ['noMatch', 'hello']],
      [
        'filters on element name pattern with regex object',
        { pattern: 'HELLO', flags: 'i' },
      ],
      [
        'filters on element name pattern with array containing regex',
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ],
    ])('%s', async (_description, elementNamePattern) => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'importsStartingWithHello',
              right: 'helloImport',
              leftGroup: 'unknown',
              left: 'a',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'importsStartingWithHello',
                elementNamePattern,
              },
            ],
            groups: ['importsStartingWithHello', 'unknown'],
          },
        ],
        output: dedent`
          import hello from 'helloImport'

          import a from 'a'
        `,
        code: dedent`
          import a from 'a'

          import hello from 'helloImport'
        `,
      })
    })

    it('sorts custom groups by overriding type and order settings', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: 'unexpectedImportsOrder',
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: 'unexpectedImportsOrder',
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: 'unexpectedImportsOrder',
          },
          {
            data: {
              rightGroup: 'reversedExternalImportsByLineLength',
              leftGroup: 'unknown',
              left: './jjjjj',
              right: 'eee',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedExternalImportsByLineLength',
                selector: 'external',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedExternalImportsByLineLength', 'unknown'],
            newlinesBetween: 'ignore',
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          import dddd from 'dddd'
          import ccc from 'ccc'
          import eee from 'eee'
          import bb from 'bb'
          import ff from 'ff'
          import a from 'a'
          import g from 'g'
          import h from './h'
          import i from './i'
          import jjjjj from './jjjjj'
        `,
        code: dedent`
          import a from 'a'
          import bb from 'bb'
          import ccc from 'ccc'
          import dddd from 'dddd'
          import jjjjj from './jjjjj'
          import eee from 'eee'
          import ff from 'ff'
          import g from 'g'
          import h from './h'
          import i from './i'
        `,
      })
    })

    it('sorts custom groups using fallback sort settings', async () => {
      await invalid({
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
            messageId: 'unexpectedImportsOrder',
          },
        ],
        output: dedent`
          import fooBar from 'fooBar'
          import fooZar from 'fooZar'
        `,
        code: dedent`
          import fooZar from 'fooZar'
          import fooBar from 'fooBar'
        `,
      })
    })

    it('preserves order for custom groups with unsorted type', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedExternalImports',
                selector: 'external',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedExternalImports', 'unknown'],
            newlinesBetween: 'ignore',
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedExternalImports',
              leftGroup: 'unknown',
              left: './something',
              right: 'c',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        output: dedent`
          import b from 'b'
          import a from 'a'
          import d from 'd'
          import e from 'e'
          import c from 'c'
          import something from './something'
        `,
        code: dedent`
          import b from 'b'
          import a from 'a'
          import d from 'd'
          import e from 'e'
          import something from './something'
          import c from 'c'
        `,
      })
    })

    it('sorts custom group blocks with complex selectors', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    selector: 'external',
                  },
                  {
                    selector: 'sibling',
                    modifiers: ['type'],
                  },
                ],
                groupName: 'externalAndTypeSiblingImports',
              },
            ],
            groups: [['externalAndTypeSiblingImports', 'index'], 'unknown'],
            newlinesBetween: 'ignore',
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'externalAndTypeSiblingImports',
              leftGroup: 'unknown',
              right: './c',
              left: './b',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
          {
            data: {
              right: './index',
              left: 'e',
            },
            messageId: 'unexpectedImportsOrder',
          },
        ],
        output: dedent`
          import type c from './c'
          import type d from './d'
          import i from './index'
          import a from 'a'
          import e from 'e'
          import b from './b'
        `,
        code: dedent`
          import a from 'a'
          import b from './b'
          import type c from './c'
          import type d from './d'
          import e from 'e'
          import i from './index'
        `,
      })
    })

    it('detects TypeScript import-equals dependencies', async () => {
      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        output: dedent`
          import { aImport } from "b";
          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;
          import { aImport } from "b";
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        output: dedent`
          import * as aImport from "b";
          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;
          import * as aImport from "b";
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        output: dedent`
          import aImport from "b";
          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;
          import aImport from "b";
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        output: dedent`
          import aImport = require("b")
          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;
          import aImport = require("b")
        `,
      })
    })

    it('prioritizes dependencies over group configuration', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: [
              {
                groupName: 'importsStartingWithA',
                elementNamePattern: '^a',
              },
              {
                groupName: 'importsStartingWithB',
                elementNamePattern: '^b',
              },
            ],
            groups: ['importsStartingWithA', 'importsStartingWithB'],
          },
        ],
        code: dedent`
          import aImport from "b";
          import a = aImport.a1.a2;
        `,
      })

      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                groupName: 'importsStartingWithA',
                elementNamePattern: '^a',
              },
              {
                groupName: 'importsStartingWithB',
                elementNamePattern: '^b',
              },
            ],
            groups: ['importsStartingWithA', 'importsStartingWithB'],
          },
        ],
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
          {
            data: {
              left: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'missedSpacingBetweenImports',
          },
        ],
        output: dedent`
          import aImport from "b";
          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;
          import aImport from "b";
        `,
      })
    })

    it('prioritizes dependencies over comment-based partitions', async () => {
      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        output: dedent`
          import aImport from "b";

          // Part: 1
          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;

          // Part: 1
          import aImport from "b";
        `,
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('prioritizes dependencies over newline-based partitions', async () => {
      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        options: [
          {
            ...options,
            newlinesBetween: 'ignore',
            partitionByNewLine: true,
          },
        ],
        output: dedent`
          import aImport from "b";

          import a = aImport.a1.a2;
        `,
        code: dedent`
          import a = aImport.a1.a2;

          import aImport from "b";
        `,
      })
    })

    it('prioritizes content separation over dependencies', async () => {
      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'yImport.y1.y2',
              right: 'z',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
          {
            data: {
              nodeDependentOnRight: 'aImport.a1.a2',
              right: 'b',
            },
            messageId: 'unexpectedImportsDependencyOrder',
          },
        ],
        output: dedent`
          import f = fImport.f1.f2;

          import yImport from "z";

          import y = yImport.y1.y2;

          export { something } from "something";

          import aImport from "b";

          import a = aImport.a1.a2;

          import fImport from "g";
        `,
        code: dedent`
          import f = fImport.f1.f2;

          import y = yImport.y1.y2;

          import yImport from "z";

          export { something } from "something";

          import a = aImport.a1.a2;

          import aImport from "b";

          import fImport from "g";
        `,
        options: [
          {
            ...options,
            newlinesBetween: 'ignore',
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('ignores shebang comments when sorting imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'aa',
              left: 'b',
            },
            messageId: 'unexpectedImportsOrder',
          },
        ],
        output: dedent`
          #!/usr/bin/node
          import { a } from 'aa'
          import { b } from 'b'
        `,
        code: dedent`
          #!/usr/bin/node
          import { b } from 'b'
          import { a } from 'aa'
        `,
        options: [options],
      })
    })

    it('treats @ symbol pattern as internal imports', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: '@/a',
              left: 'b',
            },
            messageId: 'missedSpacingBetweenImports',
          },
        ],
        options: [
          {
            ...options,
            groups: ['external', 'internal'],
            newlinesBetween: 'always',
          },
        ],
        output: dedent`
          import { b } from 'b'

          import { a } from '@/a'
        `,
        code: dedent`
          import { b } from 'b'
          import { a } from '@/a'
        `,
      })
    })

    it('reports missing comments above import groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Comment above a',
              right: 'a',
            },
            messageId: 'missedCommentAboveImport',
          },
          {
            data: {
              missedCommentAbove: 'Comment above b',
              right: './b',
            },
            messageId: 'missedCommentAboveImport',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              { commentAbove: 'Comment above a' },
              'external',
              { commentAbove: 'Comment above b' },
              'unknown',
            ],
          },
        ],
        output: dedent`
          // Comment above a
          import { a } from "a";

          // Comment above b
          import { b } from "./b";
        `,
        code: dedent`
          import { a } from "a";

          import { b } from "./b";
        `,
      })
    })

    it('reports missing comments for single import groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Comment above',
              right: 'a',
            },
            messageId: 'missedCommentAboveImport',
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
          import { a } from "a";
        `,
        code: dedent`
          import { a } from "a";
        `,
      })
    })

    it('ignores shebangs and top-level comments when adding group comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Comment above',
              right: 'b',
            },
            messageId: 'missedCommentAboveImport',
          },
          {
            data: {
              right: 'aa',
              left: 'b',
            },
            messageId: 'unexpectedImportsOrder',
          },
        ],
        output: dedent`
          #!/usr/bin/node
          // Some disclaimer

          // Comment above
          import a from "aa";
          import b from "b";
        `,
        options: [
          {
            ...options,
            groups: [{ commentAbove: 'Comment above' }, 'external'],
          },
        ],
        code: dedent`
          #!/usr/bin/node
          // Some disclaimer

          import b from "b";
          import a from "aa";
        `,
      })
    })

    it.each([
      [
        'detects existing line comment with extra spaces',
        '//   Comment above  ',
      ],
      [
        'detects existing line comment with different case',
        '//   comment above  ',
      ],
      [
        'detects existing block comment with standard format',
        dedent`
          /**
           * Comment above
           */
        `,
      ],
      [
        'detects existing block comment with surrounding text',
        dedent`
          /**
           * Something before
           * CoMmEnT ABoVe
           * Something after
           */
        `,
      ],
    ])('%s', async (_description, comment) => {
      await valid({
        options: [
          {
            ...options,
            groups: ['external', { commentAbove: 'Comment above' }, 'unknown'],
          },
        ],
        code: dedent`
          import a from "a";

          ${comment}
          import b from "./b";
        `,
      })
    })

    it('removes and repositions invalid auto-added comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'internal',
              right: '~/d',
            },
            messageId: 'missedCommentAboveImport',
          },
          {
            data: {
              right: '~/cc',
              left: '~/d',
            },
            messageId: 'unexpectedImportsOrder',
          },
          {
            data: {
              rightGroup: 'sibling',
              leftGroup: 'internal',
              right: './bbb',
              left: '~/cc',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
          {
            data: {
              rightGroup: 'external',
              leftGroup: 'sibling',
              left: './bbb',
              right: 'aaaa',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              { commentAbove: 'external' },
              'external',
              { commentAbove: 'sibling' },
              'sibling',
              { commentAbove: 'internal' },
              'internal',
            ],
          },
        ],
        output: dedent`
          // external
          import a from "aaaa";

          // sibling
          import b from './bbb';

          // internal
          import c from '~/cc';
          import d from '~/d';
        `,
        code: dedent`
          import d from '~/d';
          // internal
          import c from '~/cc';

          // sibling
          import b from './bbb';

          // external
          import a from "aaaa";
        `,
      })
    })

    it('handles complex scenarios with multiple error types and comment management', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'internal or sibling',
              right: './c',
            },
            messageId: 'missedCommentAboveImport',
          },
          {
            data: {
              rightGroup: 'external',
              leftGroup: 'sibling',
              left: './c',
              right: 'a',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
          {
            data: {
              right: '~/b',
              left: 'a',
            },
            messageId: 'missedSpacingBetweenImports',
          },
          {
            data: {
              missedCommentAbove: 'internal or sibling',
              right: '~/b',
            },
            messageId: 'missedCommentAboveImport',
          },
        ],
        code: dedent`
          #!/usr/bin/node
          // Some disclaimer

          // Comment above c
          // external
          import c from './c'; // Comment after c
          // Comment above a
          // internal or sibling
          import a from "a"; // Comment after a
          // Comment above b
          // external
          import b from '~/b'; // Comment after b
        `,
        options: [
          {
            ...options,
            groups: [
              { commentAbove: 'external' },
              'external',
              {
                commentAbove: 'internal or sibling',
                newlinesBetween: 'always',
              },
              ['internal', 'sibling'],
            ],
            newlinesBetween: 'never',
          },
        ],
        output: dedent`
          #!/usr/bin/node
          // Some disclaimer

          // Comment above a
          // external
          import a from "a"; // Comment after a

          // internal or sibling
          // Comment above c
          import c from './c'; // Comment after c
          // Comment above b
          import b from '~/b'; // Comment after b
        `,
      })
    })

    it('handles complex import formatting with line length constraints', async () => {
      await invalid({
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
            maxLineLength: 80,
            order: 'asc',
          },
        ],
      })
    })
  })

  describe('custom', () => {
    let alphabet = Alphabet.generateRecommendedAlphabet()
      .sortByLocaleCompare('en-US')
      .getCharacters()

    let options = {
      type: 'custom',
      order: 'asc',
      alphabet,
    } as const

    it('sorts imports by module name', async () => {
      await valid({
        code: dedent`
          import { a1, a2 } from 'a'
          import { b1 } from 'b'
        `,
        options: [options],
      })

      await invalid({
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
      })
    })
  })

  describe('unsorted', () => {
    let options = {
      type: 'unsorted',
      order: 'asc',
    } as const

    it('preserves original order when sorting is disabled', async () => {
      await valid({
        code: dedent`
          import { b } from 'b';
          import { c } from 'c';
          import { a } from 'a';
        `,
        options: [options],
      })
    })

    it('enforces group order regardless of sorting settings', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'b',
              leftGroup: 'a',
              right: 'ba',
              left: 'aa',
            },
            messageId: 'unexpectedImportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            customGroups: {
              value: {
                a: '^a',
                b: '^b',
              },
            },
            groups: ['b', 'a'],
          },
        ],
        output: dedent`
          import { ba } from 'ba'
          import { bb } from 'bb'

          import { ab } from 'ab'
          import { aa } from 'aa'
        `,
        code: dedent`
          import { ab } from 'ab'
          import { aa } from 'aa'
          import { ba } from 'ba'
          import { bb } from 'bb'
        `,
      })
    })

    it('enforces spacing rules between import groups', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: {
              value: {
                a: '^a',
                b: '^b',
              },
            },
            newlinesBetween: 'never',
            groups: ['b', 'a'],
          },
        ],
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'extraSpacingBetweenImports',
          },
        ],
        output: dedent`
          import { b } from 'b'
          import { a } from 'a'
        `,
        code: dedent`
          import { b } from 'b'

          import { a } from 'a'
        `,
      })
    })
  })

  describe('misc', () => {
    it('validates the JSON schema', async () => {
      await expect(
        validateRuleJsonSchema(rule.meta.schema),
      ).resolves.not.toThrow()
    })

    it('supports combination of predefined and custom groups', async () => {
      await valid({
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
      })
    })

    it('uses alphabetical ascending sorting by default', async () => {
      await valid(dedent`
        import a from '~/a'
        import b from '~/b'
        import c from '~/c'
        import d from '~/d'
      `)

      await valid({
        code: dedent`
          import { log } from './log'
          import { log10 } from './log10'
          import { log1p } from './log1p'
          import { log2 } from './log2'
        `,
        options: [{}],
      })

      await invalid({
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
      })
    })

    it('preserves order of side-effect imports', async () => {
      await valid(dedent`
        import './index.css'
        import './animate.css'
        import './reset.css'
      `)
    })

    it('recognizes Node.js built-in modules with node: prefix', async () => {
      await valid({
        code: dedent`
          import { writeFile } from 'node:fs/promises'

          import { useEffect } from 'react'
        `,
        options: [
          {
            groups: ['builtin', 'external'],
          },
        ],
      })

      await invalid({
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
      })
    })

    it('classifies internal pattern side-effects correctly by group priority', async () => {
      await valid({
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
      })

      await invalid({
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
      })
    })

    it('handles complex projects with many custom groups', async () => {
      await valid({
        options: [
          {
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
              'unknown',
            ],
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
      })

      await invalid({
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
              'unknown',
            ],
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
      })
    })

    it('treats empty named imports as regular imports not side-effects', async () => {
      await valid({
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
      })
    })

    it('ignores dynamic require statements', async () => {
      await valid({
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
      })
    })

    describe('validates compatibility between sortSideEffects and groups configuration', () => {
      function createRule(
        groups: Options[0]['groups'],
        sortSideEffects: boolean = false,
      ): RuleListener {
        return rule.create({
          options: [
            {
              sortSideEffects,
              groups,
            },
          ],
        } as Readonly<RuleContext<MessageId, Options>>)
      }

      let expectedThrownError =
        "Side effect groups cannot be nested with non side effect groups when 'sortSideEffects' is 'false'."

      it('throws error when side-effect group is nested with non-side-effect groups', () => {
        expect(() =>
          createRule(['external', ['side-effect', 'internal']]),
        ).toThrow(expectedThrownError)
      })

      it('throws error when side-effect-style group is nested with non-side-effect groups', () => {
        expect(() =>
          createRule(['external', ['side-effect-style', 'internal']]),
        ).toThrow(expectedThrownError)
      })

      it('throws error when mixed side-effect groups are nested with non-side-effect groups', () => {
        expect(() =>
          createRule([
            'external',
            ['side-effect-style', 'internal', 'side-effect'],
          ]),
        ).toThrow(expectedThrownError)
      })

      it('allows side-effect groups to be nested together', () => {
        expect(() =>
          createRule(['external', ['side-effect-style', 'side-effect']]),
        ).not.toThrow(expectedThrownError)
      })

      it('allows any group nesting when sortSideEffects is enabled', () => {
        expect(() =>
          createRule(
            ['external', ['side-effect-style', 'internal', 'side-effect']],
            true,
          ),
        ).not.toThrow(expectedThrownError)
      })
    })

    it('classifies TypeScript configured imports as internal', async () => {
      await valid({
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
        after: () => {
          vi.resetAllMocks()
        },
      })
    })

    it('classifies package imports as external', async () => {
      await valid({
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
        after: () => {
          vi.resetAllMocks()
        },
      })
    })

    it('treats unresolved imports as external by default', async () => {
      await valid({
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
        after: () => {
          vi.resetAllMocks()
        },
      })
    })

    it('falls back to basic classification when TypeScript is unavailable', async () => {
      await valid({
        before: () => {
          vi.spyOn(
            getTypescriptImportUtilities,
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
        after: () => {
          vi.resetAllMocks()
        },
      })
    })

    it('classifies TypeScript configured imports as internal with tsconfig option', async () => {
      await valid({
        options: [
          {
            tsconfig: {
              filename: 'tsconfig.json',
              rootDir: '.',
            },
            groups: ['internal', 'unknown'],
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
        after: () => {
          vi.resetAllMocks()
        },
      })
    })

    it('classifies package imports as external with tsconfig option', async () => {
      await valid({
        options: [
          {
            tsconfig: {
              filename: 'tsconfig.json',
              rootDir: '.',
            },
            groups: ['external', 'unknown'],
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
        after: () => {
          vi.resetAllMocks()
        },
      })
    })

    it('treats unresolved imports as external by default with tsconfig option', async () => {
      await valid({
        options: [
          {
            tsconfig: {
              filename: 'tsconfig.json',
              rootDir: '.',
            },
            groups: ['external', 'unknown'],
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
        after: () => {
          vi.resetAllMocks()
        },
      })
    })

    it('falls back to basic classification when TypeScript is unavailable with tsconfig option', async () => {
      await valid({
        options: [
          {
            tsconfig: {
              filename: 'tsconfig.json',
              rootDir: '.',
            },
            groups: ['external', 'unknown'],
          },
        ],
        before: () => {
          vi.spyOn(
            getTypescriptImportUtilities,
            'getTypescriptImport',
          ).mockReturnValue(null)
        },
        code: dedent`
          import { b } from 'b'

          import { a } from './a';
        `,
        after: () => {
          vi.resetAllMocks()
        },
      })
    })

    it('respects ESLint disable comments when sorting imports', async () => {
      await valid({
        code: dedent`
          import { b } from "./b"
          import { c } from "./c"
          // eslint-disable-next-line
          import { a } from "./a"
        `,
      })

      await invalid({
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
      })

      await invalid({
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
      })

      await invalid({
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
      })

      await invalid({
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
      })

      await invalid({
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
      })

      await invalid({
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
      })

      await invalid({
        output: dedent`
          import { b } from './b'
          import { c } from './c'
          // eslint-disable-next-line rule-to-test/sort-imports
          import { a } from './a'
        `,
        code: dedent`
          import { c } from './c'
          import { b } from './b'
          // eslint-disable-next-line rule-to-test/sort-imports
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
      })

      await invalid({
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
          import { a } from './a' // eslint-disable-line rule-to-test/sort-imports
        `,
        code: dedent`
          import { c } from './c'
          import { b } from './b'
          import { a } from './a' // eslint-disable-line rule-to-test/sort-imports
        `,
        options: [{}],
      })

      await invalid({
        output: dedent`
          import { b } from './b'
          import { c } from './c'
          /* eslint-disable-next-line rule-to-test/sort-imports */
          import { a } from './a'
        `,
        code: dedent`
          import { c } from './c'
          import { b } from './b'
          /* eslint-disable-next-line rule-to-test/sort-imports */
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
      })

      await invalid({
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
          import { a } from './a' /* eslint-disable-line rule-to-test/sort-imports */
        `,
        code: dedent`
          import { c } from './c'
          import { b } from './b'
          import { a } from './a' /* eslint-disable-line rule-to-test/sort-imports */
        `,
        options: [{}],
      })

      await invalid({
        output: dedent`
          import { a } from './a'
          import { d } from './d'
          /* eslint-disable rule-to-test/sort-imports */
          import { c } from './c'
          import { b } from './b'
          // Shouldn't move
          /* eslint-enable */
          import { e } from './e'
        `,
        code: dedent`
          import { d } from './d'
          import { e } from './e'
          /* eslint-disable rule-to-test/sort-imports */
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
      })
    })
  })
})
