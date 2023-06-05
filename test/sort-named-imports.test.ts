import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-named-imports'
import { SortType, SortOrder } from '../typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser',
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    it(`${RULE_NAME}(${type}): sorts named imports`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import { Kana, Kuu, Rakka, Reki } from 'haibane-renmei'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import { Kana, Reki, Rakka, Kuu } from 'haibane-renmei'
            `,
            output: dedent`
              import { Kana, Kuu, Rakka, Reki } from 'haibane-renmei'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'Reki',
                  second: 'Rakka',
                },
              },
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'Rakka',
                  second: 'Kuu',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: sorts named multiline imports`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import {
                AnnieLeonhart,
                BertholdtHoover,
                FalcoGrice,
                GabiBraun,
                Gross,
                ReinerBraun,
              } from 'marleyan-military'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import {
                GabiBraun,
                ReinerBraun,
                FalcoGrice,
                AnnieLeonhart,
                Gross,
                BertholdtHoover,
              } from 'marleyan-military'
            `,
            output: dedent`
              import {
                AnnieLeonhart,
                BertholdtHoover,
                FalcoGrice,
                GabiBraun,
                Gross,
                ReinerBraun,
              } from 'marleyan-military'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'ReinerBraun',
                  second: 'FalcoGrice',
                },
              },
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'FalcoGrice',
                  second: 'AnnieLeonhart',
                },
              },
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'Gross',
                  second: 'BertholdtHoover',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: sorts named imports with aliases`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import {
                ReiAyanami as Eva0,
                ShinjiIkari as Eva1,
                GendouIkari
              } from 'nerv'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import {
                GendouIkari,
                ReiAyanami as Eva0,
                ShinjiIkari as Eva1
              } from 'nerv'
            `,
            output: dedent`
              import {
                ReiAyanami as Eva0,
                ShinjiIkari as Eva1,
                GendouIkari
              } from 'nerv'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'GendouIkari',
                  second: 'Eva0',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: not sorts default specifiers`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import spiritedAway, { protagonist as chihiro } from 'spirited-away'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [],
      })
    })

    it(`${RULE_NAME}: sorts with import aliases`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import titan, {
                femaleTitan as annieLeonhart,
                colossusTitan,
                attackTitan as erenYeager,
                armoredTitan as reinerBraun,
                beastTitan as zekeYeager,
              } from '~/titans'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import titan, {
                armoredTitan as reinerBraun,
                colossusTitan,
                beastTitan as zekeYeager,
                attackTitan as erenYeager,
                femaleTitan as annieLeonhart,
              } from '~/titans'
          `,
            output: dedent`
              import titan, {
                femaleTitan as annieLeonhart,
                colossusTitan,
                attackTitan as erenYeager,
                armoredTitan as reinerBraun,
                beastTitan as zekeYeager,
              } from '~/titans'
          `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'reinerBraun',
                  second: 'colossusTitan',
                },
              },
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'zekeYeager',
                  second: 'erenYeager',
                },
              },
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'erenYeager',
                  second: 'annieLeonhart',
                },
              },
            ],
          },
        ],
      })
    })
  })

  describe(`${RULE_NAME}: sorting by natural order`, () => {
    let type = 'natural-order'

    it(`${RULE_NAME}(${type}): sorts named imports`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import { Kana, Kuu, Rakka, Reki } from 'haibane-renmei'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import { Kana, Reki, Rakka, Kuu } from 'haibane-renmei'
            `,
            output: dedent`
              import { Kana, Kuu, Rakka, Reki } from 'haibane-renmei'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'Reki',
                  second: 'Rakka',
                },
              },
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'Rakka',
                  second: 'Kuu',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: sorts named multiline imports`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import {
                AnnieLeonhart,
                BertholdtHoover,
                FalcoGrice,
                GabiBraun,
                Gross,
                ReinerBraun,
              } from 'marleyan-military'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import {
                GabiBraun,
                ReinerBraun,
                FalcoGrice,
                AnnieLeonhart,
                Gross,
                BertholdtHoover,
              } from 'marleyan-military'
            `,
            output: dedent`
              import {
                AnnieLeonhart,
                BertholdtHoover,
                FalcoGrice,
                GabiBraun,
                Gross,
                ReinerBraun,
              } from 'marleyan-military'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'ReinerBraun',
                  second: 'FalcoGrice',
                },
              },
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'FalcoGrice',
                  second: 'AnnieLeonhart',
                },
              },
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'Gross',
                  second: 'BertholdtHoover',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: sorts named imports with aliases`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import {
                ReiAyanami as Eva0,
                ShinjiIkari as Eva1,
                GendouIkari
              } from 'nerv'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import {
                GendouIkari,
                ReiAyanami as Eva0,
                ShinjiIkari as Eva1
              } from 'nerv'
            `,
            output: dedent`
              import {
                ReiAyanami as Eva0,
                ShinjiIkari as Eva1,
                GendouIkari
              } from 'nerv'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'GendouIkari',
                  second: 'Eva0',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: not sorts default specifiers`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import spiritedAway, { protagonist as chihiro } from 'spirited-away'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [],
      })
    })

    it(`${RULE_NAME}: sorts with import aliases`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import titan, {
                femaleTitan as annieLeonhart,
                colossusTitan,
                attackTitan as erenYeager,
                armoredTitan as reinerBraun,
                beastTitan as zekeYeager,
              } from '~/titans'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import titan, {
                armoredTitan as reinerBraun,
                colossusTitan,
                beastTitan as zekeYeager,
                attackTitan as erenYeager,
                femaleTitan as annieLeonhart,
              } from '~/titans'
          `,
            output: dedent`
              import titan, {
                femaleTitan as annieLeonhart,
                colossusTitan,
                attackTitan as erenYeager,
                armoredTitan as reinerBraun,
                beastTitan as zekeYeager,
              } from '~/titans'
          `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'reinerBraun',
                  second: 'colossusTitan',
                },
              },
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'zekeYeager',
                  second: 'erenYeager',
                },
              },
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'erenYeager',
                  second: 'annieLeonhart',
                },
              },
            ],
          },
        ],
      })
    })
  })

  describe(`${RULE_NAME}: sorting by line length`, () => {
    let type = 'line-length-order'

    it(`${RULE_NAME}(${type}): sorts named imports`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import { Rakka, Reki, Kana, Kuu } from 'haibane-renmei'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import { Kana, Reki, Rakka, Kuu } from 'haibane-renmei'
            `,
            output: dedent`
              import { Rakka, Reki, Kana, Kuu } from 'haibane-renmei'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'Reki',
                  second: 'Rakka',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: sorts named multiline imports`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import {
                BertholdtHoover,
                AnnieLeonhart,
                ReinerBraun,
                FalcoGrice,
                GabiBraun,
                Gross,
              } from 'marleyan-military'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import {
                AnnieLeonhart,
                BertholdtHoover,
                FalcoGrice,
                GabiBraun,
                Gross,
                ReinerBraun,
              } from 'marleyan-military'
            `,
            output: dedent`
              import {
                BertholdtHoover,
                AnnieLeonhart,
                ReinerBraun,
                FalcoGrice,
                GabiBraun,
                Gross,
              } from 'marleyan-military'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'AnnieLeonhart',
                  second: 'BertholdtHoover',
                },
              },
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'Gross',
                  second: 'ReinerBraun',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: sorts named imports with aliases`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import {
                ShinjiIkari as Eva1,
                ReiAyanami as Eva0,
                GendouIkari
              } from 'nerv'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import {
                GendouIkari,
                ReiAyanami as Eva0,
                ShinjiIkari as Eva1
              } from 'nerv'
            `,
            output: dedent`
              import {
                ShinjiIkari as Eva1,
                ReiAyanami as Eva0,
                GendouIkari
              } from 'nerv'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'GendouIkari',
                  second: 'Eva0',
                },
              },
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'Eva0',
                  second: 'Eva1',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: not sorts default specifiers`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import spiritedAway, { protagonist as chihiro } from 'spirited-away'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
          },
        ],
        invalid: [],
      })
    })

    it(`${RULE_NAME}: sorts with import aliases`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              import titan, {
                femaleTitan as annieLeonhart,
                armoredTitan as reinerBraun,
                attackTitan as erenYeager,
                beastTitan as zekeYeager,
                colossusTitan,
              } from '~/titans'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              import titan, {
                armoredTitan as reinerBraun,
                colossusTitan,
                beastTitan as zekeYeager,
                attackTitan as erenYeager,
                femaleTitan as annieLeonhart,
              } from '~/titans'
          `,
            output: dedent`
              import titan, {
                femaleTitan as annieLeonhart,
                armoredTitan as reinerBraun,
                attackTitan as erenYeager,
                beastTitan as zekeYeager,
                colossusTitan,
              } from '~/titans'
          `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'colossusTitan',
                  second: 'zekeYeager',
                },
              },
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'zekeYeager',
                  second: 'erenYeager',
                },
              },
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'erenYeager',
                  second: 'annieLeonhart',
                },
              },
            ],
          },
        ],
      })
    })
  })

  describe(`${RULE_NAME}: misc`, () => {
    it(`${RULE_NAME}: sets alphabetical asc sorting as default`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          "import { David, Maine, Rebecca } from 'cyberpunks-edgerunners'",
        ],
        invalid: [
          {
            code: dedent`
              import { David, Rebecca, Maine } from 'cyberpunks-edgerunners'
            `,
            output: dedent`
              import { David, Maine, Rebecca } from 'cyberpunks-edgerunners'
            `,
            errors: [
              {
                messageId: 'unexpectedNamedImportsOrder',
                data: {
                  first: 'Rebecca',
                  second: 'Maine',
                },
              },
            ],
          },
        ],
      })
    })
  })
})
