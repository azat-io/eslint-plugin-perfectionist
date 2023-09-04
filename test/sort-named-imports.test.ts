import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-named-imports'
import { SortOrder, SortType } from '../typings'

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
      type: SortType.alphabetical,
      order: SortOrder.asc,
      'ignore-case': false,
    }

    ruleTester.run(`${RULE_NAME}(${type}): sorts named imports`, rule, {
      valid: [
        {
          code: dedent`
            import { Kana, Kuu, Rakka, Reki } from 'haibane-renmei'
          `,
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'Reki',
                right: 'Rakka',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'Rakka',
                right: 'Kuu',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts named multiline imports`, rule, {
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
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'ReinerBraun',
                right: 'FalcoGrice',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'FalcoGrice',
                right: 'AnnieLeonhart',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'Gross',
                right: 'BertholdtHoover',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts named imports with aliases`, rule, {
      valid: [
        {
          code: dedent`
            import {
              ReiAyanami as Eva0,
              ShinjiIkari as Eva1,
              GendouIkari
            } from 'nerv'
          `,
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'GendouIkari',
                right: 'Eva0',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: not sorts default specifiers`, rule, {
      valid: [
        {
          code: dedent`
            import spiritedAway, { protagonist as chihiro } from 'spirited-away'
          `,
          options: [options],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${RULE_NAME}: sorts with import aliases`, rule, {
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
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'reinerBraun',
                right: 'colossusTitan',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'zekeYeager',
                right: 'erenYeager',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'erenYeager',
                right: 'annieLeonhart',
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
      type: SortType.natural,
      order: SortOrder.asc,
      'ignore-case': false,
    }

    ruleTester.run(`${RULE_NAME}(${type}): sorts named imports`, rule, {
      valid: [
        {
          code: dedent`
            import { Kana, Kuu, Rakka, Reki } from 'haibane-renmei'
          `,
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'Reki',
                right: 'Rakka',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'Rakka',
                right: 'Kuu',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts named multiline imports`, rule, {
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
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'ReinerBraun',
                right: 'FalcoGrice',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'FalcoGrice',
                right: 'AnnieLeonhart',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'Gross',
                right: 'BertholdtHoover',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts named imports with aliases`, rule, {
      valid: [
        {
          code: dedent`
            import {
              ReiAyanami as Eva0,
              ShinjiIkari as Eva1,
              GendouIkari
            } from 'nerv'
          `,
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'GendouIkari',
                right: 'Eva0',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: not sorts default specifiers`, rule, {
      valid: [
        {
          code: dedent`
            import spiritedAway, { protagonist as chihiro } from 'spirited-away'
          `,
          options: [options],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${RULE_NAME}: sorts with import aliases`, rule, {
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
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'reinerBraun',
                right: 'colossusTitan',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'zekeYeager',
                right: 'erenYeager',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'erenYeager',
                right: 'annieLeonhart',
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
      type: SortType['line-length'],
      order: SortOrder.desc,
    }

    ruleTester.run(`${RULE_NAME}(${type}): sorts named imports`, rule, {
      valid: [
        {
          code: dedent`
            import { Rakka, Reki, Kana, Kuu } from 'haibane-renmei'
          `,
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'Reki',
                right: 'Rakka',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts named multiline imports`, rule, {
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
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'AnnieLeonhart',
                right: 'BertholdtHoover',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'Gross',
                right: 'ReinerBraun',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts named imports with aliases`, rule, {
      valid: [
        {
          code: dedent`
            import {
              ShinjiIkari as Eva1,
              ReiAyanami as Eva0,
              GendouIkari
            } from 'nerv'
          `,
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'GendouIkari',
                right: 'Eva0',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'Eva0',
                right: 'Eva1',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: not sorts default specifiers`, rule, {
      valid: [
        {
          code: dedent`
            import spiritedAway, { protagonist as chihiro } from 'spirited-away'
          `,
          options: [options],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${RULE_NAME}: sorts with import aliases`, rule, {
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
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'colossusTitan',
                right: 'zekeYeager',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'zekeYeager',
                right: 'erenYeager',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: 'erenYeager',
                right: 'annieLeonhart',
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
          "import { David, Maine, Rebecca } from 'cyberpunks-edgerunners'",
          {
            code: "import { log, log10, log1p, log2 } from 'calculator'",
            options: [{}],
          },
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
                  left: 'Rebecca',
                  right: 'Maine',
                },
              },
            ],
          },
        ],
      },
    )
  })
})
