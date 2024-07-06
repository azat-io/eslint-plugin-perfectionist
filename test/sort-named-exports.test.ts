import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-named-exports'
import { GroupKind, SortOrder, SortType } from '../typings'

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
      ignoreCase: false,
    }

    ruleTester.run(`${RULE_NAME}(${type}): sorts named exports`, rule, {
      valid: [
        {
          code: 'export { ErisBoreas, Rudeus, RuijerdSuperdia }',
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export {
              Rudeus,
              RuijerdSuperdia,
              ErisBoreas
            }
          `,
          output: dedent`
            export {
              ErisBoreas,
              Rudeus,
              RuijerdSuperdia
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedExportsOrder',
              data: {
                left: 'RuijerdSuperdia',
                right: 'ErisBoreas',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}: sorts named exports grouping by their kind`,
      rule,
      {
        valid: [
          {
            code: dedent`
              export { Kenshin, type Sakabotou, Sanosuke, type Zanbato }
            `,
            options: [{ ...options, groupKind: GroupKind.mixed }],
          },
          {
            code: dedent`
              export { Kenshin, Sanosuke, type Sakabotou, type Zanbato }
            `,
            options: [{ ...options, groupKind: GroupKind['values-first'] }],
          },
          {
            code: dedent`
              export { type Sakabotou, type Zanbato, Kenshin, Sanosuke }
            `,
            options: [{ ...options, groupKind: GroupKind['types-first'] }],
          },
        ],
        invalid: [
          {
            code: dedent`
              export { type Zanbato, Sanosuke, type Sakabotou, Kenshin }
            `,
            output: dedent`
             export { Kenshin, type Sakabotou, Sanosuke, type Zanbato }
            `,
            options: [{ ...options, groupKind: GroupKind.mixed }],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'Zanbato',
                  right: 'Sanosuke',
                },
              },
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'Sanosuke',
                  right: 'Sakabotou',
                },
              },
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'Sakabotou',
                  right: 'Kenshin',
                },
              },
            ],
          },
          {
            code: dedent`
              export { type Zanbato, Sanosuke, type Sakabotou, Kenshin }
            `,
            output: dedent`
              export { Kenshin, Sanosuke, type Sakabotou, type Zanbato }
            `,
            options: [{ ...options, groupKind: GroupKind['values-first'] }],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'Zanbato',
                  right: 'Sanosuke',
                },
              },
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'Sakabotou',
                  right: 'Kenshin',
                },
              },
            ],
          },
          {
            code: dedent`
              export { type Zanbato, Sanosuke, type Sakabotou, Kenshin }
            `,
            output: dedent`
              export { type Sakabotou, type Zanbato, Kenshin, Sanosuke }
            `,
            options: [{ ...options, groupKind: GroupKind['types-first'] }],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'Sanosuke',
                  right: 'Sakabotou',
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
      type: SortType.natural,
      order: SortOrder.asc,
      ignoreCase: false,
    }

    ruleTester.run(`${RULE_NAME}(${type}): sorts named exports`, rule, {
      valid: [
        {
          code: 'export { ErisBoreas, Rudeus, RuijerdSuperdia }',
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export {
              Rudeus,
              RuijerdSuperdia,
              ErisBoreas
            }
          `,
          output: dedent`
            export {
              ErisBoreas,
              Rudeus,
              RuijerdSuperdia
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedExportsOrder',
              data: {
                left: 'RuijerdSuperdia',
                right: 'ErisBoreas',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}: sorts named exports grouping by their kind`,
      rule,
      {
        valid: [
          {
            code: dedent`
              export { Kenshin, type Sakabotou, Sanosuke, type Zanbato }
            `,
            options: [{ ...options, groupKind: GroupKind.mixed }],
          },
          {
            code: dedent`
              export { Kenshin, Sanosuke, type Sakabotou, type Zanbato }
            `,
            options: [{ ...options, groupKind: GroupKind['values-first'] }],
          },
          {
            code: dedent`
              export { type Sakabotou, type Zanbato, Kenshin, Sanosuke }
            `,
            options: [{ ...options, groupKind: GroupKind['types-first'] }],
          },
        ],
        invalid: [
          {
            code: dedent`
              export { type Zanbato, Sanosuke, type Sakabotou, Kenshin }
            `,
            output: dedent`
             export { Kenshin, type Sakabotou, Sanosuke, type Zanbato }
            `,
            options: [{ ...options, groupKind: GroupKind.mixed }],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'Zanbato',
                  right: 'Sanosuke',
                },
              },
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'Sanosuke',
                  right: 'Sakabotou',
                },
              },
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'Sakabotou',
                  right: 'Kenshin',
                },
              },
            ],
          },
          {
            code: dedent`
              export { type Zanbato, Sanosuke, type Sakabotou, Kenshin }
            `,
            output: dedent`
              export { Kenshin, Sanosuke, type Sakabotou, type Zanbato }
            `,
            options: [{ ...options, groupKind: GroupKind['values-first'] }],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'Zanbato',
                  right: 'Sanosuke',
                },
              },
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'Sakabotou',
                  right: 'Kenshin',
                },
              },
            ],
          },
          {
            code: dedent`
              export { type Zanbato, Sanosuke, type Sakabotou, Kenshin }
            `,
            output: dedent`
              export { type Sakabotou, type Zanbato, Kenshin, Sanosuke }
            `,
            options: [{ ...options, groupKind: GroupKind['types-first'] }],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'Sanosuke',
                  right: 'Sakabotou',
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
      type: SortType['line-length'],
      order: SortOrder.desc,
    }

    ruleTester.run(`${RULE_NAME}(${type}): sorts named exports`, rule, {
      valid: [
        {
          code: 'export { RuijerdSuperdia, ErisBoreas, Rudeus }',
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export {
              Rudeus,
              RuijerdSuperdia,
              ErisBoreas
            }
          `,
          output: dedent`
            export {
              RuijerdSuperdia,
              ErisBoreas,
              Rudeus
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedNamedExportsOrder',
              data: {
                left: 'Rudeus',
                right: 'RuijerdSuperdia',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}: sorts named exports grouping by their kind`,
      rule,
      {
        valid: [
          {
            code: dedent`
              export {
                Kaoru as Kamiya,
                type Sakabotou,
                type Zanbato,
                Sanosuke,
                Kenshin,
              }
            `,
            options: [{ ...options, groupKind: GroupKind.mixed }],
          },
          {
            code: dedent`
              export {
                Kaoru as Kamiya,
                Sanosuke,
                Kenshin,
                type Sakabotou,
                type Zanbato,
              }
            `,
            options: [{ ...options, groupKind: GroupKind['values-first'] }],
          },
          {
            code: dedent`
              export {
                type Sakabotou,
                type Zanbato,
                Kaoru as Kamiya,
                Sanosuke,
                Kenshin,
              }
            `,
            options: [{ ...options, groupKind: GroupKind['types-first'] }],
          },
        ],
        invalid: [
          {
            code: dedent`
              export {
                Kaoru as Kamiya,
                type Sakabotou,
                Sanosuke,
                type Zanbato,
                Kenshin,
              }
            `,
            output: dedent`
              export {
                Kaoru as Kamiya,
                type Sakabotou,
                type Zanbato,
                Sanosuke,
                Kenshin,
              }
            `,
            options: [{ ...options, groupKind: GroupKind.mixed }],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'Sanosuke',
                  right: 'Zanbato',
                },
              },
            ],
          },
          {
            code: dedent`
              export {
                Kaoru as Kamiya,
                type Sakabotou,
                Sanosuke,
                type Zanbato,
                Kenshin,
              }
            `,
            output: dedent`
              export {
                Kaoru as Kamiya,
                Sanosuke,
                Kenshin,
                type Sakabotou,
                type Zanbato,
              }
            `,
            options: [{ ...options, groupKind: GroupKind['values-first'] }],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'Sakabotou',
                  right: 'Sanosuke',
                },
              },
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'Zanbato',
                  right: 'Kenshin',
                },
              },
            ],
          },
          {
            code: dedent`
              export {
                Kaoru as Kamiya,
                type Sakabotou,
                Sanosuke,
                type Zanbato,
                Kenshin,
              }
            `,
            output: dedent`
              export {
                type Sakabotou,
                type Zanbato,
                Kaoru as Kamiya,
                Sanosuke,
                Kenshin,
              }
            `,
            options: [{ ...options, groupKind: GroupKind['types-first'] }],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'Kaoru',
                  right: 'Sakabotou',
                },
              },
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'Sanosuke',
                  right: 'Zanbato',
                },
              },
            ],
          },
        ],
      },
    )
  })

  describe(`${RULE_NAME}: misc`, () => {
    ruleTester.run(
      `${RULE_NAME}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          'export { KayoHinazuki, SatoruFujinuma }',
          {
            code: 'export { log, log10, log1p, log2 }',
            options: [{}],
          },
        ],
        invalid: [
          {
            code: dedent`
              export { SatoruFujinuma, KayoHinazuki }
            `,
            output: dedent`
              export { KayoHinazuki, SatoruFujinuma }
            `,
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  left: 'SatoruFujinuma',
                  right: 'KayoHinazuki',
                },
              },
            ],
          },
        ],
      },
    )
  })
})
