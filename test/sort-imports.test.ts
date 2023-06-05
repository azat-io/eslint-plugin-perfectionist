import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it, vi } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { NewlinesBetweenValue, RULE_NAME } from '../rules/sort-imports'
import { SortType, SortOrder } from '../typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser',
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    it(`${RULE_NAME}(${type}): sorts imports`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import { SpiritedAway, HowlsMovingCastle } from 'hayao-miyazaki'
              import { Suzume } from 'makoto-shinkai'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                'ignore-case': true,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import { Suzume } from 'makoto-shinkai'
              import { SpiritedAway, HowlsMovingCastle } from 'hayao-miyazaki'
            `,
            output: dedent`
              import { SpiritedAway, HowlsMovingCastle } from 'hayao-miyazaki'
              import { Suzume } from 'makoto-shinkai'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                'ignore-case': true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: 'makoto-shinkai',
                  second: 'hayao-miyazaki',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts imports by groups`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import type { Chairman } from 'hunter'

              import fs from 'fs'
              import { GingFreecss } from 'hunter/freecss'
              import { Netero } from 'hunter/netero'
              import path from 'path'
              import { Feitan, Phinks, Shalnark, Pakunoda } from 'phantom-troupe'

              import type { Hunter } from '~/hunter-association'

              import { Gon, Kurapika, Leorio } from '~/hunter-association'
              import { Knuckle, Shoot } from '~/hunters/beast-hunters'
              import { CheadleYorkshire } from '~/hunters/virus-hunters'

              import type { Association } from '.'
              import type { ChimeraAnt } from '../ants'
              import type { IHero } from './association-data'
              import type { HeroList } from './index.d.ts'

              import association from '.'
              import hisoka from '../../hunters/histoka'
              import { Meruem, Neferpitou, Shaiapouf } from '../ants'
              import { ChimeraAntQueen } from '../ants'
              import './style.css'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
              import { GingFreecss } from 'hunter/freecss'
              import { Netero } from 'hunter/netero'

              import type { Hunter } from '~/hunter-association'
              import { Gon, Kurapika, Leorio } from '~/hunter-association'
              import { Feitan, Phinks, Shalnark, Pakunoda } from 'phantom-troupe'
              import type { Association } from '.'
              import { Meruem, Neferpitou, Shaiapouf } from '../ants'
              import path from 'path'
              import fs from 'fs'
              import type { ChimeraAnt } from '../ants'
              import type { IHero } from './association-data'
              import { Knuckle, Shoot } from '~/hunters/beast-hunters'
              import { CheadleYorkshire } from '~/hunters/virus-hunters'
              import type { HeroList } from './index.d.ts'
              import './style.css'
              import type { Chairman } from 'hunter'

              import association from '.'
              import { ChimeraAntQueen } from '../ants'
              import hisoka from '../../hunters/histoka'
            `,
            output: dedent`
              import type { Chairman } from 'hunter'

              import fs from 'fs'
              import { GingFreecss } from 'hunter/freecss'
              import { Netero } from 'hunter/netero'
              import path from 'path'
              import { Feitan, Phinks, Shalnark, Pakunoda } from 'phantom-troupe'

              import type { Hunter } from '~/hunter-association'

              import { Gon, Kurapika, Leorio } from '~/hunter-association'
              import { Knuckle, Shoot } from '~/hunters/beast-hunters'
              import { CheadleYorkshire } from '~/hunters/virus-hunters'

              import type { Association } from '.'
              import type { ChimeraAnt } from '../ants'
              import type { IHero } from './association-data'
              import type { HeroList } from './index.d.ts'

              import association from '.'
              import hisoka from '../../hunters/histoka'
              import { Meruem, Neferpitou, Shaiapouf } from '../ants'
              import { ChimeraAntQueen } from '../ants'
              import './style.css'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
                  first: '~/hunter-association',
                  second: '~/hunter-association',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '~/hunter-association',
                  second: 'phantom-troupe',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  first: 'phantom-troupe',
                  second: '.',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  first: '.',
                  second: '../ants',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '../ants',
                  second: 'path',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: 'path',
                  second: 'fs',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  first: 'fs',
                  second: '../ants',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: './association-data',
                  second: '~/hunters/beast-hunters',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  first: '~/hunters/virus-hunters',
                  second: './index.d.ts',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  first: './index.d.ts',
                  second: './style.css',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: './style.css',
                  second: 'hunter',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '../ants',
                  second: '../../hunters/histoka',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts imports with no spaces`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import type { JujutsuSorcerer } from 'jujutsu-kaisen'
              import { Satoru, Kiyotaka, Masamichi } from 'jujutsu-kaisen'
              import { Yuji, Megumi } from '~/tokyo-high/1st-year'
              import { Maki, Panda, Toge } from '~/tokyo-high/2nd-year'
              import Sukunа from '.'
              import { Aoi, Kokichi, Yoshinobu } from '../../kyoto-high/data'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.never,
                'internal-pattern': ['~/**'],
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
              import type { JujutsuSorcerer } from 'jujutsu-kaisen'
              import { Yuji, Megumi } from '~/tokyo-high/1st-year'

              import { Maki, Panda, Toge } from '~/tokyo-high/2nd-year'
              import { Satoru, Kiyotaka, Masamichi } from 'jujutsu-kaisen'

              import Sukunа from '.'
              import { Aoi, Kokichi, Yoshinobu } from '../../kyoto-high/data'
            `,
            output: dedent`
              import type { JujutsuSorcerer } from 'jujutsu-kaisen'
              import { Satoru, Kiyotaka, Masamichi } from 'jujutsu-kaisen'
              import { Yuji, Megumi } from '~/tokyo-high/1st-year'
              import { Maki, Panda, Toge } from '~/tokyo-high/2nd-year'
              import Sukunа from '.'
              import { Aoi, Kokichi, Yoshinobu } from '../../kyoto-high/data'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.never,
                'internal-pattern': ['~/**'],
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
                  first: '~/tokyo-high/1st-year',
                  second: '~/tokyo-high/2nd-year',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '~/tokyo-high/2nd-year',
                  second: 'jujutsu-kaisen',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  first: 'jujutsu-kaisen',
                  second: '.',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): disallow extra spaces`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import { Faputa } from 'narehate'

              import Nanachi from '~/team/nanachi'
              import Reg from '~/team/reg'
              import Riko from '~/team/riko'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
              import { Faputa } from 'narehate'


              import Nanachi from '~/team/nanachi'

              import Reg from '~/team/reg'
              import Riko from '~/team/riko'
            `,
            output: dedent`
              import { Faputa } from 'narehate'

              import Nanachi from '~/team/nanachi'
              import Reg from '~/team/reg'
              import Riko from '~/team/riko'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
                  first: 'narehate',
                  second: '~/team/nanachi',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  first: '~/team/nanachi',
                  second: '~/team/reg',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): supports typescript object-imports`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import type DaigoClan = require("A")

              import { Hyakkimaru } from 'daigo'

              import { Dororo } from '../town'

              import log = console.log
              import Tahomaru = require('daigo/tahomaru')
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
              import type DaigoClan = require("A")

              import { Dororo } from '../town'

              import log = console.log
              import { Hyakkimaru } from 'daigo'
              import Tahomaru = require('daigo/tahomaru')
            `,
            output: dedent`
              import type DaigoClan = require("A")

              import { Hyakkimaru } from 'daigo'

              import { Dororo } from '../town'

              import log = console.log
              import Tahomaru = require('daigo/tahomaru')
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
                  first: 'console.log',
                  second: 'daigo',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  first: 'daigo',
                  second: 'daigo/tahomaru',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): use type if type of type is not defined`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import type { Jiji } from '../cats'
              import type { Kiki } from '~/delivery-service'
              import type { SeniorWitch } from 'witches'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
              import type { Jiji } from '../cats'

              import type { Kiki } from '~/delivery-service'

              import type { SeniorWitch } from 'witches'
            `,
            output: dedent`
              import type { Jiji } from '../cats'
              import type { Kiki } from '~/delivery-service'
              import type { SeniorWitch } from 'witches'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
                  first: '../cats',
                  second: '~/delivery-service',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  first: '~/delivery-service',
                  second: 'witches',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): doesn't break user comments`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import { SebastianMichaelis, Grell } from 'butlers'

              /**
               * The story follows the two along with their other servants, as
               * they work to unravel the plot behind Ciel's parents' murder,
               * and the horrendous tragedies that befell Ciel in the month
               * directly after.
               */

              import { MeyRin } from 'maids'
              import { Ciel } from 'phantomhive'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
    })
  })

  describe(`${RULE_NAME}: sorting by natural order`, () => {
    let type = 'natural-order'

    it(`${RULE_NAME}(${type}): sorts imports`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import { SpiritedAway, HowlsMovingCastle } from 'hayao-miyazaki'
              import { Suzume } from 'makoto-shinkai'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                'ignore-case': true,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import { Suzume } from 'makoto-shinkai'
              import { SpiritedAway, HowlsMovingCastle } from 'hayao-miyazaki'
            `,
            output: dedent`
              import { SpiritedAway, HowlsMovingCastle } from 'hayao-miyazaki'
              import { Suzume } from 'makoto-shinkai'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                'ignore-case': true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: 'makoto-shinkai',
                  second: 'hayao-miyazaki',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts imports by groups`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import type { Chairman } from 'hunter'

              import fs from 'fs'
              import { GingFreecss } from 'hunter/freecss'
              import { Netero } from 'hunter/netero'
              import path from 'path'
              import { Feitan, Phinks, Shalnark, Pakunoda } from 'phantom-troupe'

              import type { Hunter } from '~/hunter-association'

              import { Gon, Kurapika, Leorio } from '~/hunter-association'
              import { Knuckle, Shoot } from '~/hunters/beast-hunters'
              import { CheadleYorkshire } from '~/hunters/virus-hunters'

              import type { Association } from '.'
              import type { ChimeraAnt } from '../ants'
              import type { IHero } from './association-data'
              import type { HeroList } from './index.d.ts'

              import association from '.'
              import hisoka from '../../hunters/histoka'
              import { Meruem, Neferpitou, Shaiapouf } from '../ants'
              import { ChimeraAntQueen } from '../ants'
              import './style.css'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
              import { GingFreecss } from 'hunter/freecss'
              import { Netero } from 'hunter/netero'

              import type { Hunter } from '~/hunter-association'
              import { Gon, Kurapika, Leorio } from '~/hunter-association'
              import { Feitan, Phinks, Shalnark, Pakunoda } from 'phantom-troupe'
              import type { Association } from '.'
              import { Meruem, Neferpitou, Shaiapouf } from '../ants'
              import path from 'path'
              import fs from 'fs'
              import type { ChimeraAnt } from '../ants'
              import type { IHero } from './association-data'
              import { Knuckle, Shoot } from '~/hunters/beast-hunters'
              import { CheadleYorkshire } from '~/hunters/virus-hunters'
              import type { HeroList } from './index.d.ts'
              import './style.css'
              import type { Chairman } from 'hunter'

              import association from '.'
              import { ChimeraAntQueen } from '../ants'
              import hisoka from '../../hunters/histoka'
            `,
            output: dedent`
              import type { Chairman } from 'hunter'

              import fs from 'fs'
              import { GingFreecss } from 'hunter/freecss'
              import { Netero } from 'hunter/netero'
              import path from 'path'
              import { Feitan, Phinks, Shalnark, Pakunoda } from 'phantom-troupe'

              import type { Hunter } from '~/hunter-association'

              import { Gon, Kurapika, Leorio } from '~/hunter-association'
              import { Knuckle, Shoot } from '~/hunters/beast-hunters'
              import { CheadleYorkshire } from '~/hunters/virus-hunters'

              import type { Association } from '.'
              import type { ChimeraAnt } from '../ants'
              import type { IHero } from './association-data'
              import type { HeroList } from './index.d.ts'

              import association from '.'
              import hisoka from '../../hunters/histoka'
              import { Meruem, Neferpitou, Shaiapouf } from '../ants'
              import { ChimeraAntQueen } from '../ants'
              import './style.css'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
                  first: '~/hunter-association',
                  second: '~/hunter-association',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '~/hunter-association',
                  second: 'phantom-troupe',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  first: 'phantom-troupe',
                  second: '.',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  first: '.',
                  second: '../ants',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '../ants',
                  second: 'path',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: 'path',
                  second: 'fs',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  first: 'fs',
                  second: '../ants',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: './association-data',
                  second: '~/hunters/beast-hunters',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  first: '~/hunters/virus-hunters',
                  second: './index.d.ts',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  first: './index.d.ts',
                  second: './style.css',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: './style.css',
                  second: 'hunter',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '../ants',
                  second: '../../hunters/histoka',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts imports with no spaces`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import type { JujutsuSorcerer } from 'jujutsu-kaisen'
              import { Satoru, Kiyotaka, Masamichi } from 'jujutsu-kaisen'
              import { Yuji, Megumi } from '~/tokyo-high/1st-year'
              import { Maki, Panda, Toge } from '~/tokyo-high/2nd-year'
              import Sukunа from '.'
              import { Aoi, Kokichi, Yoshinobu } from '../../kyoto-high/data'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.never,
                'internal-pattern': ['~/**'],
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
              import type { JujutsuSorcerer } from 'jujutsu-kaisen'
              import { Yuji, Megumi } from '~/tokyo-high/1st-year'

              import { Maki, Panda, Toge } from '~/tokyo-high/2nd-year'
              import { Satoru, Kiyotaka, Masamichi } from 'jujutsu-kaisen'

              import Sukunа from '.'
              import { Aoi, Kokichi, Yoshinobu } from '../../kyoto-high/data'
            `,
            output: dedent`
              import type { JujutsuSorcerer } from 'jujutsu-kaisen'
              import { Satoru, Kiyotaka, Masamichi } from 'jujutsu-kaisen'
              import { Yuji, Megumi } from '~/tokyo-high/1st-year'
              import { Maki, Panda, Toge } from '~/tokyo-high/2nd-year'
              import Sukunа from '.'
              import { Aoi, Kokichi, Yoshinobu } from '../../kyoto-high/data'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.never,
                'internal-pattern': ['~/**'],
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
                  first: '~/tokyo-high/1st-year',
                  second: '~/tokyo-high/2nd-year',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '~/tokyo-high/2nd-year',
                  second: 'jujutsu-kaisen',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  first: 'jujutsu-kaisen',
                  second: '.',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): disallow extra spaces`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import { Faputa } from 'narehate'

              import Nanachi from '~/team/nanachi'
              import Reg from '~/team/reg'
              import Riko from '~/team/riko'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
              import { Faputa } from 'narehate'


              import Nanachi from '~/team/nanachi'

              import Reg from '~/team/reg'
              import Riko from '~/team/riko'
            `,
            output: dedent`
              import { Faputa } from 'narehate'

              import Nanachi from '~/team/nanachi'
              import Reg from '~/team/reg'
              import Riko from '~/team/riko'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
                  first: 'narehate',
                  second: '~/team/nanachi',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  first: '~/team/nanachi',
                  second: '~/team/reg',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): supports typescript object-imports`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import type DaigoClan = require("A")

              import { Hyakkimaru } from 'daigo'

              import { Dororo } from '../town'

              import log = console.log
              import Tahomaru = require('daigo/tahomaru')
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
              import type DaigoClan = require("A")

              import { Dororo } from '../town'

              import log = console.log
              import { Hyakkimaru } from 'daigo'
              import Tahomaru = require('daigo/tahomaru')
            `,
            output: dedent`
              import type DaigoClan = require("A")

              import { Hyakkimaru } from 'daigo'

              import { Dororo } from '../town'

              import log = console.log
              import Tahomaru = require('daigo/tahomaru')
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
                  first: 'console.log',
                  second: 'daigo',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  first: 'daigo',
                  second: 'daigo/tahomaru',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): use type if type of type is not defined`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import type { Jiji } from '../cats'
              import type { Kiki } from '~/delivery-service'
              import type { SeniorWitch } from 'witches'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
              import type { Jiji } from '../cats'

              import type { Kiki } from '~/delivery-service'

              import type { SeniorWitch } from 'witches'
            `,
            output: dedent`
              import type { Jiji } from '../cats'
              import type { Kiki } from '~/delivery-service'
              import type { SeniorWitch } from 'witches'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
                  first: '../cats',
                  second: '~/delivery-service',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  first: '~/delivery-service',
                  second: 'witches',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): doesn't break user comments`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import { SebastianMichaelis, Grell } from 'butlers'

              /**
               * The story follows the two along with their other servants, as
               * they work to unravel the plot behind Ciel's parents' murder,
               * and the horrendous tragedies that befell Ciel in the month
               * directly after.
               */

              import { MeyRin } from 'maids'
              import { Ciel } from 'phantomhive'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
    })
  })

  describe(`${RULE_NAME}: sorting by line length`, () => {
    let type = 'line-length-order'

    it(`${RULE_NAME}(${type}): sorts imports`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import { SpiritedAway, HowlsMovingCastle } from 'hayao-miyazaki'
              import { Suzume } from 'makoto-shinkai'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                'ignore-case': true,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import { Suzume } from 'makoto-shinkai'
              import { SpiritedAway, HowlsMovingCastle } from 'hayao-miyazaki'
            `,
            output: dedent`
              import { SpiritedAway, HowlsMovingCastle } from 'hayao-miyazaki'
              import { Suzume } from 'makoto-shinkai'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                'ignore-case': true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: 'makoto-shinkai',
                  second: 'hayao-miyazaki',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts imports by groups`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import type { Chairman } from 'hunter'

              import { Feitan, Phinks, Shalnark, Pakunoda } from 'phantom-troupe'
              import { GingFreecss } from 'hunter/freecss'
              import { Netero } from 'hunter/netero'
              import path from 'path'
              import fs from 'fs'

              import type { Hunter } from '~/hunter-association'

              import { Gon, Kurapika, Leorio } from '~/hunter-association'
              import { CheadleYorkshire } from '~/hunters/virus-hunters'
              import { Knuckle, Shoot } from '~/hunters/beast-hunters'

              import type { IHero } from './association-data'
              import type { HeroList } from './index.d.ts'
              import type { ChimeraAnt } from '../ants'
              import type { Association } from '.'

              import { Meruem, Neferpitou, Shaiapouf } from '../ants'
              import hisoka from '../../hunters/histoka'
              import { ChimeraAntQueen } from '../ants'
              import association from '.'
              import './style.css'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
              import { GingFreecss } from 'hunter/freecss'
              import { Netero } from 'hunter/netero'

              import type { Hunter } from '~/hunter-association'
              import { Gon, Kurapika, Leorio } from '~/hunter-association'
              import { Feitan, Phinks, Shalnark, Pakunoda } from 'phantom-troupe'
              import type { Association } from '.'
              import { Meruem, Neferpitou, Shaiapouf } from '../ants'
              import path from 'path'
              import fs from 'fs'
              import type { ChimeraAnt } from '../ants'
              import type { IHero } from './association-data'
              import { Knuckle, Shoot } from '~/hunters/beast-hunters'
              import { CheadleYorkshire } from '~/hunters/virus-hunters'
              import type { HeroList } from './index.d.ts'
              import './style.css'
              import type { Chairman } from 'hunter'

              import association from '.'
              import { ChimeraAntQueen } from '../ants'
              import hisoka from '../../hunters/histoka'
            `,
            output: dedent`
              import type { Chairman } from 'hunter'

              import { Feitan, Phinks, Shalnark, Pakunoda } from 'phantom-troupe'
              import { GingFreecss } from 'hunter/freecss'
              import { Netero } from 'hunter/netero'
              import path from 'path'
              import fs from 'fs'

              import type { Hunter } from '~/hunter-association'

              import { Gon, Kurapika, Leorio } from '~/hunter-association'
              import { CheadleYorkshire } from '~/hunters/virus-hunters'
              import { Knuckle, Shoot } from '~/hunters/beast-hunters'

              import type { IHero } from './association-data'
              import type { HeroList } from './index.d.ts'
              import type { ChimeraAnt } from '../ants'
              import type { Association } from '.'

              import { Meruem, Neferpitou, Shaiapouf } from '../ants'
              import hisoka from '../../hunters/histoka'
              import { ChimeraAntQueen } from '../ants'
              import association from '.'
              import './style.css'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
                  first: '~/hunter-association',
                  second: '~/hunter-association',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '~/hunter-association',
                  second: 'phantom-troupe',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  first: 'phantom-troupe',
                  second: '.',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  first: '.',
                  second: '../ants',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '../ants',
                  second: 'path',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  first: 'fs',
                  second: '../ants',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '../ants',
                  second: './association-data',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: './association-data',
                  second: '~/hunters/beast-hunters',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '~/hunters/beast-hunters',
                  second: '~/hunters/virus-hunters',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  first: '~/hunters/virus-hunters',
                  second: './index.d.ts',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  first: './index.d.ts',
                  second: './style.css',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: './style.css',
                  second: 'hunter',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '.',
                  second: '../ants',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '../ants',
                  second: '../../hunters/histoka',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts imports with no spaces`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import type { JujutsuSorcerer } from 'jujutsu-kaisen'
              import { Satoru, Kiyotaka, Masamichi } from 'jujutsu-kaisen'
              import { Maki, Panda, Toge } from '~/tokyo-high/2nd-year'
              import { Yuji, Megumi } from '~/tokyo-high/1st-year'
              import { Aoi, Kokichi, Yoshinobu } from '../../kyoto-high/data'
              import Sukunа from '.'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                'newlines-between': NewlinesBetweenValue.never,
                'internal-pattern': ['~/**'],
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
              import type { JujutsuSorcerer } from 'jujutsu-kaisen'
              import { Yuji, Megumi } from '~/tokyo-high/1st-year'

              import { Maki, Panda, Toge } from '~/tokyo-high/2nd-year'
              import { Satoru, Kiyotaka, Masamichi } from 'jujutsu-kaisen'

              import Sukunа from '.'
              import { Aoi, Kokichi, Yoshinobu } from '../../kyoto-high/data'
            `,
            output: dedent`
              import type { JujutsuSorcerer } from 'jujutsu-kaisen'
              import { Satoru, Kiyotaka, Masamichi } from 'jujutsu-kaisen'
              import { Maki, Panda, Toge } from '~/tokyo-high/2nd-year'
              import { Yuji, Megumi } from '~/tokyo-high/1st-year'
              import { Aoi, Kokichi, Yoshinobu } from '../../kyoto-high/data'
              import Sukunа from '.'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                'newlines-between': NewlinesBetweenValue.never,
                'internal-pattern': ['~/**'],
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
                  first: '~/tokyo-high/1st-year',
                  second: '~/tokyo-high/2nd-year',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  first: '~/tokyo-high/1st-year',
                  second: '~/tokyo-high/2nd-year',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '~/tokyo-high/2nd-year',
                  second: 'jujutsu-kaisen',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  first: 'jujutsu-kaisen',
                  second: '.',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '.',
                  second: '../../kyoto-high/data',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): disallow extra spaces`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import { Faputa } from 'narehate'

              import Nanachi from '~/team/nanachi'
              import Riko from '~/team/riko'
              import Reg from '~/team/reg'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
              import { Faputa } from 'narehate'


              import Nanachi from '~/team/nanachi'

              import Reg from '~/team/reg'
              import Riko from '~/team/riko'
            `,
            output: dedent`
              import { Faputa } from 'narehate'

              import Nanachi from '~/team/nanachi'
              import Riko from '~/team/riko'
              import Reg from '~/team/reg'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
                  first: 'narehate',
                  second: '~/team/nanachi',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  first: '~/team/nanachi',
                  second: '~/team/reg',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '~/team/reg',
                  second: '~/team/riko',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): supports typescript object-imports`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import type DaigoClan = require("A")

              import { Hyakkimaru } from 'daigo'

              import { Dororo } from '../town'

              import Tahomaru = require('daigo/tahomaru')
              import log = console.log
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
              import type DaigoClan = require("A")

              import { Dororo } from '../town'

              import log = console.log
              import { Hyakkimaru } from 'daigo'
              import Tahomaru = require('daigo/tahomaru')
            `,
            output: dedent`
              import type DaigoClan = require("A")

              import { Hyakkimaru } from 'daigo'

              import { Dororo } from '../town'

              import Tahomaru = require('daigo/tahomaru')
              import log = console.log
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
                  first: 'console.log',
                  second: 'daigo',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  first: 'daigo',
                  second: 'daigo/tahomaru',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): use type if type of type is not defined`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import type { Kiki } from '~/delivery-service'
              import type { SeniorWitch } from 'witches'
              import type { Jiji } from '../cats'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
              import type { Jiji } from '../cats'

              import type { Kiki } from '~/delivery-service'

              import type { SeniorWitch } from 'witches'
            `,
            output: dedent`
              import type { Kiki } from '~/delivery-service'
              import type { SeniorWitch } from 'witches'
              import type { Jiji } from '../cats'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '../cats',
                  second: '~/delivery-service',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  first: '../cats',
                  second: '~/delivery-service',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  first: '~/delivery-service',
                  second: 'witches',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): doesn't break user comments`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import { SebastianMichaelis, Grell } from 'butlers'

              /**
               * The story follows the two along with their other servants, as
               * they work to unravel the plot behind Ciel's parents' murder,
               * and the horrendous tragedies that befell Ciel in the month
               * directly after.
               */

              import { Ciel } from 'phantomhive'
              import { MeyRin } from 'maids'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
    })
  })

  describe(`${RULE_NAME}: misc`, () => {
    it(`${RULE_NAME}: sets alphabetical asc sorting as default`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          dedent`
            import Hizuru from '~/higotoshima/hizuru'
            import Mio from '~/higotoshima/mio'
            import Shinpei from '~/higotoshima/shinpei'
            import Ushio from '~/higotoshima/ushio'
          `,
        ],
        invalid: [
          {
            code: dedent`
              import Shinpei from '~/higotoshima/shinpei'
              import Mio from '~/higotoshima/mio'
              import Ushio from '~/higotoshima/ushio'
              import Hizuru from '~/higotoshima/hizuru'
            `,
            output: dedent`
              import Hizuru from '~/higotoshima/hizuru'
              import Mio from '~/higotoshima/mio'
              import Shinpei from '~/higotoshima/shinpei'
              import Ushio from '~/higotoshima/ushio'
            `,
            errors: [
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '~/higotoshima/shinpei',
                  second: '~/higotoshima/mio',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  first: '~/higotoshima/ushio',
                  second: '~/higotoshima/hizuru',
                },
              },
            ],
          },
        ],
      })
    })
  })

  it(`${RULE_NAME}: allow to use paths from tsconfig.json`, () => {
    vi.mock('../utils/read-ts-config', () => ({
      TSConfig: {
        get: () => ({
          compilerOptions: {
            moduleResolution: 'bundler',
            verbatimModuleSyntax: true,
            resolveJsonModule: true,
            lib: ['ESNext', 'DOM'],
            esModuleInterop: true,
            skipLibCheck: true,
            module: 'esnext',
            target: 'es2020',
            paths: {
              '@/components/*': './src/components/*',
            },
          },
        }),
      },
    }))

    ruleTester.run(RULE_NAME, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            import { MikuruAsahina } from '@/components/mikuru'
            import { HaruhiSuzumiya } from '@melancholy/haruhi-suzumiya'
            import { YukiNagato } from '~/data/yuki'
          `,
          output: dedent`
            import { HaruhiSuzumiya } from '@melancholy/haruhi-suzumiya'

            import { MikuruAsahina } from '@/components/mikuru'
            import { YukiNagato } from '~/data/yuki'
          `,
          options: [
            {
              type: SortType['line-length'],
              order: SortOrder.desc,
              'newlines-between': NewlinesBetweenValue.always,
              'internal-pattern': ['~/**'],
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
              'read-tsconfig': true,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                first: '@/components/mikuru',
                second: '@melancholy/haruhi-suzumiya',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                first: '@melancholy/haruhi-suzumiya',
                second: '~/data/yuki',
              },
            },
          ],
        },
      ],
    })
  })
})
