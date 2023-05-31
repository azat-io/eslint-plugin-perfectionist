import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-jsx-props'
import { SortType, SortOrder } from '../typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    it(`${RULE_NAME}(${type}): sorts jsx props`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let Odokawa = () => (
                <Character
                  role="taxi driver"
                  type="walrus"
                  variant="odd"
                >
                  Pew-pew
                </Character>
              )
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
              let Odokawa = () => (
                <Character
                  type="walrus"
                  role="taxi driver"
                  variant="odd"
                >
                  Pew-pew
                </Character>
              )
            `,
            output: dedent`
              let Odokawa = () => (
                <Character
                  role="taxi driver"
                  type="walrus"
                  variant="odd"
                >
                  Pew-pew
                </Character>
              )
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  first: 'type',
                  second: 'role',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts jsx props with namespaced names`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let Protagonist = () => (
                <User
                  age={16}
                  name="Shinichi Izumi"
                  parasite:name="Migi"
                  school="West High"
                />
              )
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
              let Protagonist = () => (
                <User
                  age={16}
                  parasite:name="Migi"
                  name="Shinichi Izumi"
                  school="West High"
                />
              )
            `,
            output: dedent`
              let Protagonist = () => (
                <User
                  age={16}
                  name="Shinichi Izumi"
                  parasite:name="Migi"
                  school="West High"
                />
              )
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  first: 'parasite:name',
                  second: 'name',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): does not break the property list`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let ArmorBoy = () => (
                <Alchemist
                  big
                  firstName="Alphonse"
                  lastName="Elric"
                  {...data}
                  age={14}
                  occupation="Alchemist"
                  weapon={['fists']}
                />
              )
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
              let ArmorBoy = () => (
                <Alchemist
                  firstName="Alphonse"
                  lastName="Elric"
                  big
                  {...data}
                  occupation="Alchemist"
                  age={14}
                  weapon={['fists']}
                />
              )
            `,
            output: dedent`
              let ArmorBoy = () => (
                <Alchemist
                  big
                  firstName="Alphonse"
                  lastName="Elric"
                  {...data}
                  age={14}
                  occupation="Alchemist"
                  weapon={['fists']}
                />
              )
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  first: 'lastName',
                  second: 'big',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  first: 'occupation',
                  second: 'age',
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

    it(`${RULE_NAME}(${type}): sorts jsx props`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let Odokawa = () => (
                <Character
                  role="taxi driver"
                  type="walrus"
                  variant="odd"
                >
                  Pew-pew
                </Character>
              )
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
              let Odokawa = () => (
                <Character
                  type="walrus"
                  role="taxi driver"
                  variant="odd"
                >
                  Pew-pew
                </Character>
              )
            `,
            output: dedent`
              let Odokawa = () => (
                <Character
                  role="taxi driver"
                  type="walrus"
                  variant="odd"
                >
                  Pew-pew
                </Character>
              )
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  first: 'type',
                  second: 'role',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts jsx props with namespaced names`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let Protagonist = () => (
                <User
                  age={16}
                  name="Shinichi Izumi"
                  parasite:name="Migi"
                  school="West High"
                />
              )
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
              let Protagonist = () => (
                <User
                  age={16}
                  parasite:name="Migi"
                  name="Shinichi Izumi"
                  school="West High"
                />
              )
            `,
            output: dedent`
              let Protagonist = () => (
                <User
                  age={16}
                  name="Shinichi Izumi"
                  parasite:name="Migi"
                  school="West High"
                />
              )
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  first: 'parasite:name',
                  second: 'name',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): does not break the property list`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let ArmorBoy = () => (
                <Alchemist
                  big
                  firstName="Alphonse"
                  lastName="Elric"
                  {...data}
                  age={14}
                  occupation="Alchemist"
                  weapon={['fists']}
                />
              )
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
              let ArmorBoy = () => (
                <Alchemist
                  firstName="Alphonse"
                  lastName="Elric"
                  big
                  {...data}
                  occupation="Alchemist"
                  age={14}
                  weapon={['fists']}
                />
              )
            `,
            output: dedent`
              let ArmorBoy = () => (
                <Alchemist
                  big
                  firstName="Alphonse"
                  lastName="Elric"
                  {...data}
                  age={14}
                  occupation="Alchemist"
                  weapon={['fists']}
                />
              )
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  first: 'lastName',
                  second: 'big',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  first: 'occupation',
                  second: 'age',
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

    it(`${RULE_NAME}(${type}): sorts jsx props`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let Odokawa = () => (
                <Character
                  role="taxi driver"
                  type="walrus"
                  variant="odd"
                >
                  Pew-pew
                </Character>
              )
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
              let Odokawa = () => (
                <Character
                  type="walrus"
                  role="taxi driver"
                  variant="odd"
                >
                  Pew-pew
                </Character>
              )
            `,
            output: dedent`
              let Odokawa = () => (
                <Character
                  role="taxi driver"
                  variant="odd"
                  type="walrus"
                >
                  Pew-pew
                </Character>
              )
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  first: 'type',
                  second: 'role',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts jsx props with namespaced names`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let Protagonist = () => (
                <User
                  name="Shinichi Izumi"
                  parasite:name="Migi"
                  school="West High"
                  age={16}
                />
              )
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
              let Protagonist = () => (
                <User
                  age={16}
                  parasite:name="Migi"
                  name="Shinichi Izumi"
                  school="West High"
                />
              )
            `,
            output: dedent`
              let Protagonist = () => (
                <User
                  name="Shinichi Izumi"
                  parasite:name="Migi"
                  school="West High"
                  age={16}
                />
              )
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  first: 'age',
                  second: 'parasite:name',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  first: 'parasite:name',
                  second: 'name',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): does not break the property list`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let ArmorBoy = () => (
                <Alchemist
                  firstName="Alphonse"
                  lastName="Elric"
                  big
                  {...data}
                  occupation="Alchemist"
                  weapon={['fists']}
                  age={14}
                />
              )
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
              let ArmorBoy = () => (
                <Alchemist
                  firstName="Alphonse"
                  lastName="Elric"
                  big
                  {...data}
                  occupation="Alchemist"
                  age={14}
                  weapon={['fists']}
                />
              )
            `,
            output: dedent`
              let ArmorBoy = () => (
                <Alchemist
                  firstName="Alphonse"
                  lastName="Elric"
                  big
                  {...data}
                  occupation="Alchemist"
                  weapon={['fists']}
                  age={14}
                />
              )
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  first: 'age',
                  second: 'weapon',
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
          dedent`
            let Mob = () => (
              <Character
                firstName="Shigeo"
                lastName="Kageyama"
                occupation={['student', 'club vice-president']}
              />
            )
          `,
        ],
        invalid: [
          {
            code: dedent`
              let Mob = () => (
                <Character
                  occupation={['student', 'club vice-president']}
                  firstName="Shigeo"
                  lastName="Kageyama"
                />
              )
            `,
            output: dedent`
              let Mob = () => (
                <Character
                  firstName="Shigeo"
                  lastName="Kageyama"
                  occupation={['student', 'club vice-president']}
                />
              )
            `,
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  first: 'occupation',
                  second: 'firstName',
                },
              },
            ],
          },
        ],
      })
    })
  })
})
