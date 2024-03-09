import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, expect, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { NewlinesBetweenValue, RULE_NAME } from '../rules/sort-imports'
import { areOptionsValid } from './utils/are-options-valid'

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
      'ignore-case': false,
      order: 'asc',
    } as const

    ruleTester.run(`${RULE_NAME}(${type}): sorts imports`, rule, {
      valid: [
        {
          code: dedent`
            import { SpiritedAway, HowlsMovingCastle } from 'hayao-miyazaki'
            import { Suzume } from 'makoto-shinkai'
          `,
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: 'makoto-shinkai',
                right: 'hayao-miyazaki',
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
              ...options,
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
              ...options,
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
                left: '~/hunter-association',
                right: '~/hunter-association',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '~/hunter-association',
                right: 'phantom-troupe',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: 'phantom-troupe',
                right: '.',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: '.',
                right: '../ants',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '../ants',
                right: 'path',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: 'path',
                right: 'fs',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: 'fs',
                right: '../ants',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: './association-data',
                right: '~/hunters/beast-hunters',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: '~/hunters/virus-hunters',
                right: './index.d.ts',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: './index.d.ts',
                right: './style.css',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: './style.css',
                right: 'hunter',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '../ants',
                right: '../../hunters/histoka',
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
              import type { JujutsuSorcerer } from 'jujutsu-kaisen'
              import { Satoru, Kiyotaka, Masamichi } from 'jujutsu-kaisen'
              import { Yuji, Megumi } from '~/tokyo-high/1st-year'
              import { Maki, Panda, Toge } from '~/tokyo-high/2nd-year'
              import Sukunа from '.'
              import { Aoi, Kokichi, Yoshinobu } from '../../kyoto-high/data'
            `,
            options: [
              {
                ...options,
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
                ...options,
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
                  left: '~/tokyo-high/1st-year',
                  right: '~/tokyo-high/2nd-year',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '~/tokyo-high/2nd-year',
                  right: 'jujutsu-kaisen',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: 'jujutsu-kaisen',
                  right: '.',
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
              import { Faputa } from 'narehate'

              import Nanachi from '~/team/nanachi'
              import Reg from '~/team/reg'
              import Riko from '~/team/riko'
            `,
          options: [
            {
              ...options,
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
              ...options,
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
                left: 'narehate',
                right: '~/team/nanachi',
              },
            },
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: '~/team/nanachi',
                right: '~/team/reg',
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
              import type DaigoClan = require("A")

              import { Hyakkimaru } from 'daigo'

              import { Dororo } from '../town'

              import log = console.log
              import Tahomaru = require('daigo/tahomaru')
            `,
            options: [
              {
                ...options,
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
                ...options,
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
                  left: 'console.log',
                  right: 'daigo',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'daigo',
                  right: 'daigo/tahomaru',
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
              import type { Jiji } from '../cats'
              import type { Kiki } from '~/delivery-service'
              import type { SeniorWitch } from 'witches'
            `,
            options: [
              {
                ...options,
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
                ...options,
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
                  left: '../cats',
                  right: '~/delivery-service',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: '~/delivery-service',
                  right: 'witches',
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
              ...options,
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

    ruleTester.run(
      `${RULE_NAME}(${type}): ignores comments for counting lines between imports`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { SunshineGirl } from 'weathering-with-you'

              // @ts-expect-error missing types
              import { hinaAmano } from 'weathering-with-you'
            `,
            options: [
              {
                ...options,
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
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): breaks import sorting if there is other nodes between`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { Totoro } from 'gods-of-forest'

              export type { KonekoBus } from 'bus-station'

              import type { Satsuki, Mei } from './data/users'
            `,
            options: [
              {
                ...options,
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
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): separates style imports from the rest`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import { MatsuriShihou, AonoMorimiya } from 'sola'

              import styles from '../sunrise.css'
              import './sky.css'
            `,
            options: [
              {
                ...options,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
              import { ShōyaIshida } from '../edu/kuise-hairdressing-school'
              import { ShoukoNishimiya } from './salon-stray-cat'

              import '../edu/prepare-students.js'
              import './load-memories'
            `,
            options: [
              {
                ...options,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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

              import express, { static as serveStatic } from 'express'
            `,
            options: [
              {
                ...options,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
            import TakakiTohno from '5-cm-per-second';
            import AkariShinohara from './index';
          `,
            output: dedent`
              import TakakiTohno from '5-cm-per-second';

              import AkariShinohara from './index';
            `,
            options: [
              {
                ...options,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
                  left: '5-cm-per-second',
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
            import { RintarouOkabe } from 'scientists'


            import { ItaruHashida } from './universities/tokyo-denki'



            import { MayuriShiina } from 'prepatory-academy'
          `,
          output: dedent`
            import { MayuriShiina } from 'prepatory-academy'
            import { RintarouOkabe } from 'scientists'

            import { ItaruHashida } from './universities/tokyo-denki'
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
                left: 'scientists',
                right: './universities/tokyo-denki',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: './universities/tokyo-denki',
                right: 'prepatory-academy',
              },
            },
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: './universities/tokyo-denki',
                right: 'prepatory-academy',
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
              import type { Titan } from 'titans'

              import Armin from '@scout-regiment/armin'
              import Mikasa from '@scout-regiment/mikasa'
              import Reiner from '@titans/armored-titan'
              import Eren from '@titans/attack-titan'
              import Zeke from '@titans/beast-titan'
              import { KennyAckermann } from 'military-police'
            `,
            output: dedent`
              import Reiner from '@titans/armored-titan'
              import Eren from '@titans/attack-titan'
              import Zeke from '@titans/beast-titan'
              import type { Titan } from 'titans'

              import Armin from '@scout-regiment/armin'
              import Mikasa from '@scout-regiment/mikasa'

              import { KennyAckermann } from 'military-police'
            `,
            options: [
              {
                ...options,
                'custom-groups': {
                  type: {
                    titans: ['titans', '@titans/**'],
                  },
                  value: {
                    titans: ['titans', '@titans/**'],
                    scouts: '@scout-regiment/**',
                  },
                },
                groups: [
                  'type',
                  'titans',
                  'scouts',
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
                  left: '@scout-regiment/mikasa',
                  right: '@titans/armored-titan',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: '@titans/beast-titan',
                  right: 'military-police',
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
              import type { Child } from 'giovannis-island'
              import { Kanta, Junpei } from 'giovannis-island'
            `,
            output: dedent`
              import type { Child } from 'giovannis-island'

              import { Kanta, Junpei } from 'giovannis-island'
            `,
            options: [
              {
                ...options,
                'custom-groups': {
                  value: {
                    giovanni: ['giovannis-island'],
                  },
                },
                groups: ['type', 'giovanni'],
              },
            ],
            errors: [
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'giovannis-island',
                  right: 'giovannis-island',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to hash symbol in internal pattern`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { Characters } from 'skip-and-loafer'

              import { events } from 'skip-and-loafer'

              import type { Student } from '#school'

              import Satonosuke from '#pets'
              import { MitsumiIwakura, SousukeShima } from '#school'

              import { Nao } from '../family'
            `,
            options: [
              {
                ...options,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['#**'],
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
              import type { Student } from '#school'
              import type { Characters } from 'skip-and-loafer'

              import Satonosuke from '#pets'
              import { events } from 'skip-and-loafer'
              import { MitsumiIwakura, SousukeShima } from '#school'

              import { Nao } from '../family'
            `,
            output: dedent`
              import type { Characters } from 'skip-and-loafer'

              import { events } from 'skip-and-loafer'

              import type { Student } from '#school'

              import Satonosuke from '#pets'
              import { MitsumiIwakura, SousukeShima } from '#school'

              import { Nao } from '../family'
            `,
            options: [
              {
                ...options,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['#**'],
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
                  left: '#school',
                  right: 'skip-and-loafer',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '#pets',
                  right: 'skip-and-loafer',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'skip-and-loafer',
                  right: '#school',
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
      'ignore-case': false,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${RULE_NAME}(${type}): sorts imports`, rule, {
      valid: [
        {
          code: dedent`
            import { SpiritedAway, HowlsMovingCastle } from 'hayao-miyazaki'
            import { Suzume } from 'makoto-shinkai'
          `,
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: 'makoto-shinkai',
                right: 'hayao-miyazaki',
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
              ...options,
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
              ...options,
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
                left: '~/hunter-association',
                right: '~/hunter-association',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '~/hunter-association',
                right: 'phantom-troupe',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: 'phantom-troupe',
                right: '.',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: '.',
                right: '../ants',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '../ants',
                right: 'path',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: 'path',
                right: 'fs',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: 'fs',
                right: '../ants',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: './association-data',
                right: '~/hunters/beast-hunters',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: '~/hunters/virus-hunters',
                right: './index.d.ts',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: './index.d.ts',
                right: './style.css',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: './style.css',
                right: 'hunter',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '../ants',
                right: '../../hunters/histoka',
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
              import type { JujutsuSorcerer } from 'jujutsu-kaisen'
              import { Satoru, Kiyotaka, Masamichi } from 'jujutsu-kaisen'
              import { Yuji, Megumi } from '~/tokyo-high/1st-year'
              import { Maki, Panda, Toge } from '~/tokyo-high/2nd-year'
              import Sukunа from '.'
              import { Aoi, Kokichi, Yoshinobu } from '../../kyoto-high/data'
            `,
            options: [
              {
                ...options,
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
                ...options,
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
                  left: '~/tokyo-high/1st-year',
                  right: '~/tokyo-high/2nd-year',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '~/tokyo-high/2nd-year',
                  right: 'jujutsu-kaisen',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: 'jujutsu-kaisen',
                  right: '.',
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
            import { Faputa } from 'narehate'

            import Nanachi from '~/team/nanachi'
            import Reg from '~/team/reg'
            import Riko from '~/team/riko'
          `,
          options: [
            {
              ...options,
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
              ...options,
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
                left: 'narehate',
                right: '~/team/nanachi',
              },
            },
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: '~/team/nanachi',
                right: '~/team/reg',
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
              import type DaigoClan = require("A")

              import { Hyakkimaru } from 'daigo'

              import { Dororo } from '../town'

              import log = console.log
              import Tahomaru = require('daigo/tahomaru')
            `,
            options: [
              {
                ...options,
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
                ...options,
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
                  left: 'console.log',
                  right: 'daigo',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'daigo',
                  right: 'daigo/tahomaru',
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
              import type { Jiji } from '../cats'
              import type { Kiki } from '~/delivery-service'
              import type { SeniorWitch } from 'witches'
            `,
            options: [
              {
                ...options,
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
                ...options,
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
                  left: '../cats',
                  right: '~/delivery-service',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: '~/delivery-service',
                  right: 'witches',
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
              ...options,
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

    ruleTester.run(
      `${RULE_NAME}(${type}): ignores comments for counting lines between imports`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { SunshineGirl } from 'weathering-with-you'

              // @ts-expect-error missing types
              import { hinaAmano } from 'weathering-with-you'
            `,
            options: [
              {
                ...options,
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
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): breaks import sorting if there is other nodes between`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { Totoro } from 'gods-of-forest'

              export type { KonekoBus } from 'bus-station'

              import type { Satsuki, Mei } from './data/users'
            `,
            options: [
              {
                ...options,
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
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): separates style imports from the rest`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import { MatsuriShihou, AonoMorimiya } from 'sola'

              import styles from '../sunrise.css'
              import './sky.css'
            `,
            options: [
              {
                ...options,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
              import { ShōyaIshida } from '../edu/kuise-hairdressing-school'
              import { ShoukoNishimiya } from './salon-stray-cat'

              import '../edu/prepare-students.js'
              import './load-memories'
            `,
            options: [
              {
                ...options,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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

              import express, { static as serveStatic } from 'express'
            `,
            options: [
              {
                ...options,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
            import TakakiTohno from '5-cm-per-second';
            import AkariShinohara from './index';
          `,
            output: dedent`
              import TakakiTohno from '5-cm-per-second';

              import AkariShinohara from './index';
            `,
            options: [
              {
                ...options,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
                  left: '5-cm-per-second',
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
            import { RintarouOkabe } from 'scientists'


            import { ItaruHashida } from './universities/tokyo-denki'



            import { MayuriShiina } from 'prepatory-academy'
          `,
          output: dedent`
            import { MayuriShiina } from 'prepatory-academy'
            import { RintarouOkabe } from 'scientists'

            import { ItaruHashida } from './universities/tokyo-denki'
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
                left: 'scientists',
                right: './universities/tokyo-denki',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: './universities/tokyo-denki',
                right: 'prepatory-academy',
              },
            },
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: './universities/tokyo-denki',
                right: 'prepatory-academy',
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
              import type { Titan } from 'titans'

              import Armin from '@scout-regiment/armin'
              import Mikasa from '@scout-regiment/mikasa'
              import Reiner from '@titans/armored-titan'
              import Eren from '@titans/attack-titan'
              import Zeke from '@titans/beast-titan'
              import { KennyAckermann } from 'military-police'
            `,
            output: dedent`
              import Reiner from '@titans/armored-titan'
              import Eren from '@titans/attack-titan'
              import Zeke from '@titans/beast-titan'
              import type { Titan } from 'titans'

              import Armin from '@scout-regiment/armin'
              import Mikasa from '@scout-regiment/mikasa'

              import { KennyAckermann } from 'military-police'
            `,
            options: [
              {
                ...options,
                'custom-groups': {
                  type: {
                    titans: ['titans', '@titans/**'],
                  },
                  value: {
                    titans: ['titans', '@titans/**'],
                    scouts: '@scout-regiment/**',
                  },
                },
                groups: [
                  'type',
                  'titans',
                  'scouts',
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
                  left: '@scout-regiment/mikasa',
                  right: '@titans/armored-titan',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: '@titans/beast-titan',
                  right: 'military-police',
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
              import type { Child } from 'giovannis-island'
              import { Kanta, Junpei } from 'giovannis-island'
            `,
            output: dedent`
              import type { Child } from 'giovannis-island'

              import { Kanta, Junpei } from 'giovannis-island'
            `,
            options: [
              {
                ...options,
                'custom-groups': {
                  value: {
                    giovanni: ['giovannis-island'],
                  },
                },
                groups: ['type', 'giovanni'],
              },
            ],
            errors: [
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'giovannis-island',
                  right: 'giovannis-island',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to hash symbol in internal pattern`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { Characters } from 'skip-and-loafer'

              import { events } from 'skip-and-loafer'

              import type { Student } from '#school'

              import Satonosuke from '#pets'
              import { MitsumiIwakura, SousukeShima } from '#school'

              import { Nao } from '../family'
            `,
            options: [
              {
                ...options,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['#**'],
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
              import type { Student } from '#school'
              import type { Characters } from 'skip-and-loafer'

              import Satonosuke from '#pets'
              import { events } from 'skip-and-loafer'
              import { MitsumiIwakura, SousukeShima } from '#school'

              import { Nao } from '../family'
            `,
            output: dedent`
              import type { Characters } from 'skip-and-loafer'

              import { events } from 'skip-and-loafer'

              import type { Student } from '#school'

              import Satonosuke from '#pets'
              import { MitsumiIwakura, SousukeShima } from '#school'

              import { Nao } from '../family'
            `,
            options: [
              {
                ...options,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['#**'],
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
                  left: '#school',
                  right: 'skip-and-loafer',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '#pets',
                  right: 'skip-and-loafer',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'skip-and-loafer',
                  right: '#school',
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

    ruleTester.run(`${RULE_NAME}(${type}): sorts imports`, rule, {
      valid: [
        {
          code: dedent`
            import { SpiritedAway, HowlsMovingCastle } from 'hayao-miyazaki'
            import { Suzume } from 'makoto-shinkai'
          `,
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: 'makoto-shinkai',
                right: 'hayao-miyazaki',
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
              ...options,
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
              ...options,
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
                left: '~/hunter-association',
                right: '~/hunter-association',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '~/hunter-association',
                right: 'phantom-troupe',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: 'phantom-troupe',
                right: '.',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: '.',
                right: '../ants',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '../ants',
                right: 'path',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: 'fs',
                right: '../ants',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '../ants',
                right: './association-data',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: './association-data',
                right: '~/hunters/beast-hunters',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '~/hunters/beast-hunters',
                right: '~/hunters/virus-hunters',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: '~/hunters/virus-hunters',
                right: './index.d.ts',
              },
            },
            {
              messageId: 'missedSpacingBetweenImports',
              data: {
                left: './index.d.ts',
                right: './style.css',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: './style.css',
                right: 'hunter',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '.',
                right: '../ants',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '../ants',
                right: '../../hunters/histoka',
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
              import type { JujutsuSorcerer } from 'jujutsu-kaisen'
              import { Satoru, Kiyotaka, Masamichi } from 'jujutsu-kaisen'
              import { Maki, Panda, Toge } from '~/tokyo-high/2nd-year'
              import { Yuji, Megumi } from '~/tokyo-high/1st-year'
              import { Aoi, Kokichi, Yoshinobu } from '../../kyoto-high/data'
              import Sukunа from '.'
            `,
            options: [
              {
                ...options,
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
                ...options,
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
                  left: '~/tokyo-high/1st-year',
                  right: '~/tokyo-high/2nd-year',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: '~/tokyo-high/1st-year',
                  right: '~/tokyo-high/2nd-year',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '~/tokyo-high/2nd-year',
                  right: 'jujutsu-kaisen',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: 'jujutsu-kaisen',
                  right: '.',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '.',
                  right: '../../kyoto-high/data',
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
            import { Faputa } from 'narehate'

            import Nanachi from '~/team/nanachi'
            import Riko from '~/team/riko'
            import Reg from '~/team/reg'
          `,
          options: [
            {
              ...options,
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
              ...options,
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
                left: 'narehate',
                right: '~/team/nanachi',
              },
            },
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: '~/team/nanachi',
                right: '~/team/reg',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: '~/team/reg',
                right: '~/team/riko',
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
              import type DaigoClan = require("A")

              import { Hyakkimaru } from 'daigo'

              import { Dororo } from '../town'

              import Tahomaru = require('daigo/tahomaru')
              import log = console.log
            `,
            options: [
              {
                ...options,
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
                ...options,
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
                  left: 'console.log',
                  right: 'daigo',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'daigo',
                  right: 'daigo/tahomaru',
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
              import type { Kiki } from '~/delivery-service'
              import type { SeniorWitch } from 'witches'
              import type { Jiji } from '../cats'
            `,
            options: [
              {
                ...options,
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
                ...options,
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
                  left: '../cats',
                  right: '~/delivery-service',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: '../cats',
                  right: '~/delivery-service',
                },
              },
              {
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: '~/delivery-service',
                  right: 'witches',
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
              ...options,
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

    ruleTester.run(
      `${RULE_NAME}(${type}): ignores comments for counting lines between imports`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { SunshineGirl } from 'weathering-with-you'

              // @ts-expect-error missing types
              import { hinaAmano } from 'weathering-with-you'
            `,
            options: [
              {
                ...options,
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
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): breaks import sorting if there is other nodes between`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { Totoro } from 'gods-of-forest'

              export type { KonekoBus } from 'bus-station'

              import type { Satsuki, Mei } from './data/users'
            `,
            options: [
              {
                ...options,
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
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): separates style imports from the rest`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import { MatsuriShihou, AonoMorimiya } from 'sola'

              import styles from '../sunrise.css'
              import './sky.css'
            `,
            options: [
              {
                ...options,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
              import { ShōyaIshida } from '../edu/kuise-hairdressing-school'
              import { ShoukoNishimiya } from './salon-stray-cat'

              import '../edu/prepare-students.js'
              import './load-memories'
            `,
            options: [
              {
                ...options,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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

              import express, { static as serveStatic } from 'express'
            `,
            options: [
              {
                ...options,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
            import TakakiTohno from '5-cm-per-second';
            import AkariShinohara from './index';
          `,
            output: dedent`
              import TakakiTohno from '5-cm-per-second';

              import AkariShinohara from './index';
            `,
            options: [
              {
                ...options,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
                  left: '5-cm-per-second',
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
            import { RintarouOkabe } from 'scientists'


            import { ItaruHashida } from './universities/tokyo-denki'



            import { MayuriShiina } from 'prepatory-academy'
          `,
          output: dedent`
            import { MayuriShiina } from 'prepatory-academy'
            import { RintarouOkabe } from 'scientists'

            import { ItaruHashida } from './universities/tokyo-denki'
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
                left: 'scientists',
                right: './universities/tokyo-denki',
              },
            },
            {
              messageId: 'unexpectedImportsOrder',
              data: {
                left: './universities/tokyo-denki',
                right: 'prepatory-academy',
              },
            },
            {
              messageId: 'extraSpacingBetweenImports',
              data: {
                left: './universities/tokyo-denki',
                right: 'prepatory-academy',
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
              import type { Titan } from 'titans'

              import Armin from '@scout-regiment/armin'
              import Mikasa from '@scout-regiment/mikasa'
              import Reiner from '@titans/armored-titan'
              import Eren from '@titans/attack-titan'
              import Zeke from '@titans/beast-titan'
              import { KennyAckermann } from 'military-police'
            `,
            output: dedent`
              import Reiner from '@titans/armored-titan'
              import Eren from '@titans/attack-titan'
              import Zeke from '@titans/beast-titan'
              import type { Titan } from 'titans'

              import Mikasa from '@scout-regiment/mikasa'
              import Armin from '@scout-regiment/armin'

              import { KennyAckermann } from 'military-police'
            `,
            options: [
              {
                ...options,
                'custom-groups': {
                  type: {
                    titans: ['titans', '@titans/**'],
                  },
                  value: {
                    titans: ['titans', '@titans/**'],
                    scouts: '@scout-regiment/**',
                  },
                },
                groups: [
                  'type',
                  'titans',
                  'scouts',
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
                  left: '@scout-regiment/armin',
                  right: '@scout-regiment/mikasa',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '@scout-regiment/mikasa',
                  right: '@titans/armored-titan',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: '@titans/beast-titan',
                  right: 'military-police',
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
              import type { Child } from 'giovannis-island'
              import { Kanta, Junpei } from 'giovannis-island'
            `,
            output: dedent`
              import type { Child } from 'giovannis-island'

              import { Kanta, Junpei } from 'giovannis-island'
            `,
            options: [
              {
                ...options,
                'custom-groups': {
                  value: {
                    giovanni: ['giovannis-island'],
                  },
                },
                groups: ['type', 'giovanni'],
              },
            ],
            errors: [
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'giovannis-island',
                  right: 'giovannis-island',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to hash symbol in internal pattern`,
      rule,
      {
        valid: [
          {
            code: dedent`
              import type { Characters } from 'skip-and-loafer'

              import { events } from 'skip-and-loafer'

              import type { Student } from '#school'

              import { MitsumiIwakura, SousukeShima } from '#school'
              import Satonosuke from '#pets'

              import { Nao } from '../family'
            `,
            options: [
              {
                ...options,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['#**'],
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
              import type { Student } from '#school'
              import type { Characters } from 'skip-and-loafer'

              import Satonosuke from '#pets'
              import { events } from 'skip-and-loafer'
              import { MitsumiIwakura, SousukeShima } from '#school'

              import { Nao } from '../family'
            `,
            output: dedent`
              import type { Characters } from 'skip-and-loafer'

              import { events } from 'skip-and-loafer'

              import type { Student } from '#school'

              import { MitsumiIwakura, SousukeShima } from '#school'
              import Satonosuke from '#pets'

              import { Nao } from '../family'
            `,
            options: [
              {
                ...options,
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['#**'],
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
                  left: '#school',
                  right: 'skip-and-loafer',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '#pets',
                  right: 'skip-and-loafer',
                },
              },
              {
                messageId: 'missedSpacingBetweenImports',
                data: {
                  left: 'skip-and-loafer',
                  right: '#school',
                },
              },
            ],
          },
        ],
      },
    )

    describe(`${RULE_NAME}(${type}): support max line length`, () => {
      ruleTester.run('rule', rule, {
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
                order: 'asc',
                'max-line-length': 80,
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

      let subType = 'schema'

      it(`${subType} -- type must be set if 'max-line-length' is`, () => {
        expect(
          areOptionsValid(rule, {
            ...options,
            type: undefined,
            'max-line-length': 80,
          }),
        ).toBe(
          'data[0] should have property type when property max-line-length is present',
        )
      })

      it(`${subType} -- type must be set to 'line-length' if 'max-line-length' is set`, () => {
        expect(
          areOptionsValid(rule, {
            ...options,
            'max-line-length': 80,
            type: 'alphabetical',
          }),
        ).toBe(
          'data[0] should NOT be valid, data[0].type should be equal to one of the allowed values, data[0] should match some schema in anyOf',
        )
      })

      it(`${subType} -- if it's set, 'max-line-length' must be greater than 0`, () => {
        expect(
          areOptionsValid(rule, {
            ...options,
            'max-line-length': 0,
          }),
        ).toBe("data[0]['max-line-length'] should be > 0")
      })
    })
  })

  describe(`${RULE_NAME}: misc`, () => {
    ruleTester.run(
      `${RULE_NAME}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          dedent`
            import Hizuru from '~/higotoshima/hizuru'
            import Mio from '~/higotoshima/mio'
            import Shinpei from '~/higotoshima/shinpei'
            import Ushio from '~/higotoshima/ushio'
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
                  left: '~/higotoshima/shinpei',
                  right: '~/higotoshima/mio',
                },
              },
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: '~/higotoshima/ushio',
                  right: '~/higotoshima/hizuru',
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
              import { expect, test } from 'bun:test'
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
              import { expect, test } from 'bun:test'
            `,
            output: dedent`
              import { expect, test } from 'bun:test'
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
              {
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: 'react',
                  right: 'bun:test',
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
                'custom-groups': {
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
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
                'custom-groups': {
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
                'newlines-between': NewlinesBetweenValue.always,
                'internal-pattern': ['~/**'],
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
  })
})
