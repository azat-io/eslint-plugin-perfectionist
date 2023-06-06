import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME, Position } from '../rules/sort-jsx-props'
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
                'ignore-case': true,
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
                'ignore-case': true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'type',
                  right: 'role',
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
                  left: 'parasite:name',
                  right: 'name',
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
                  left: 'lastName',
                  right: 'big',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'occupation',
                  right: 'age',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set shorthand props position`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let Spike = () => (
                <Hunter
                  age={27}
                  bloodType={0}
                  origin="Mars"
                  isFromCowboyBebop
                />
              )
            `,
            options: [
              {
                type: SortType.alphabetical,
                shorthand: Position.last,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              let Spike = () => (
                <Hunter
                  age={27}
                  bloodType={0}
                  isFromCowboyBebop
                  origin="Mars"
                />
              )
            `,
            output: dedent`
              let Spike = () => (
                <Hunter
                  age={27}
                  bloodType={0}
                  origin="Mars"
                  isFromCowboyBebop
                />
              )
            `,
            options: [
              {
                type: SortType.alphabetical,
                shorthand: Position.last,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'isFromCowboyBebop',
                  right: 'origin',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set callback props position`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              <DeathNote
                author="Light Yagami"
                list={deathNotes}
                shinigami="Ryuk"
                onChange={updateDeathNotes}
              />
            `,
            options: [
              {
                type: SortType.alphabetical,
                callback: Position.last,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <DeathNote
                author="Light Yagami"
                list={deathNotes}
                onChange={updateDeathNotes}
                shinigami="Ryuk"
              />
            `,
            output: dedent`
              <DeathNote
                author="Light Yagami"
                list={deathNotes}
                shinigami="Ryuk"
                onChange={updateDeathNotes}
              />
            `,
            options: [
              {
                type: SortType.alphabetical,
                callback: Position.last,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'onChange',
                  right: 'shinigami',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set multiline props position`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              <Holo
                handleTransform={(type: 'Human' | 'Wolf') => {
                  toogleForm(form)
                }}
                style={{
                  position: 'absolute',
                  color: 'red',
                }}
                form={form}
                residence="Pasloe"
                title="Wisewolf"
              />
            `,
            options: [
              {
                type: SortType.alphabetical,
                multiline: Position.first,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <Holo
                form={form}
                handleTransform={(type: 'Human' | 'Wolf') => {
                  toogleForm(form)
                }}
                residence="Pasloe"
                style={{
                  position: 'absolute',
                  color: 'red',
                }}
                title="Wisewolf"
              />
            `,
            output: dedent`
              <Holo
                handleTransform={(type: 'Human' | 'Wolf') => {
                  toogleForm(form)
                }}
                style={{
                  position: 'absolute',
                  color: 'red',
                }}
                form={form}
                residence="Pasloe"
                title="Wisewolf"
              />
            `,
            options: [
              {
                type: SortType.alphabetical,
                multiline: Position.first,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'form',
                  right: 'handleTransform',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'residence',
                  right: 'style',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set priority props`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              <Hero
                id="ed2cc26e-ec5a-41da-aab0-51a61d6a919f"
                name="Saitama"
                age={25}
                height={175}
                nickname="One-Punch Man"
                weight={70}
              />
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                'always-on-top': ['id', 'name'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <Hero
                age={25}
                nickname="One-Punch Man"
                name="Saitama"
                id="ed2cc26e-ec5a-41da-aab0-51a61d6a919f"
                height={175}
                weight={70}
              />
            `,
            output: dedent`
              <Hero
                id="ed2cc26e-ec5a-41da-aab0-51a61d6a919f"
                name="Saitama"
                age={25}
                height={175}
                nickname="One-Punch Man"
                weight={70}
              />
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                'always-on-top': ['id', 'name'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'nickname',
                  right: 'name',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'name',
                  right: 'id',
                },
              },
            ],
          },
          {
            code: dedent`
              <Hero
                name="Genos"
                id="dabd9d43-a165-419a-bfc8-061533bf40bd"
              />
            `,
            output: dedent`
              <Hero
                id="dabd9d43-a165-419a-bfc8-061533bf40bd"
                name="Genos"
              />
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                'always-on-top': ['id', 'name'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'name',
                  right: 'id',
                },
              },
            ],
          },
          {
            code: dedent`
              <Hero
                name="King"
                id="5bcd11c7-bb04-4046-b986-a4e4796fa624"
              />
            `,
            output: dedent`
              <Hero
                id="5bcd11c7-bb04-4046-b986-a4e4796fa624"
                name="King"
              />
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                'always-on-top': ['id'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'name',
                  right: 'id',
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
                'ignore-case': true,
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
                'ignore-case': true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'type',
                  right: 'role',
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
                  left: 'parasite:name',
                  right: 'name',
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
                  left: 'lastName',
                  right: 'big',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'occupation',
                  right: 'age',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set shorthand props position`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let Spike = () => (
                <Hunter
                  age={27}
                  bloodType={0}
                  origin="Mars"
                  isFromCowboyBebop
                />
              )
            `,
            options: [
              {
                type: SortType.natural,
                shorthand: Position.last,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              let Spike = () => (
                <Hunter
                  age={27}
                  bloodType={0}
                  isFromCowboyBebop
                  origin="Mars"
                />
              )
            `,
            output: dedent`
              let Spike = () => (
                <Hunter
                  age={27}
                  bloodType={0}
                  origin="Mars"
                  isFromCowboyBebop
                />
              )
            `,
            options: [
              {
                type: SortType.natural,
                shorthand: Position.last,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'isFromCowboyBebop',
                  right: 'origin',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set callback props position`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              <DeathNote
                author="Light Yagami"
                list={deathNotes}
                shinigami="Ryuk"
                onChange={updateDeathNotes}
              />
            `,
            options: [
              {
                type: SortType.natural,
                callback: Position.last,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <DeathNote
                author="Light Yagami"
                list={deathNotes}
                onChange={updateDeathNotes}
                shinigami="Ryuk"
              />
            `,
            output: dedent`
              <DeathNote
                author="Light Yagami"
                list={deathNotes}
                shinigami="Ryuk"
                onChange={updateDeathNotes}
              />
            `,
            options: [
              {
                type: SortType.natural,
                callback: Position.last,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'onChange',
                  right: 'shinigami',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set multiline props position`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              <Holo
                handleTransform={(type: 'Human' | 'Wolf') => {
                  toogleForm(form)
                }}
                style={{
                  position: 'absolute',
                  color: 'red',
                }}
                form={form}
                residence="Pasloe"
                title="Wisewolf"
              />
            `,
            options: [
              {
                type: SortType.natural,
                multiline: Position.first,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <Holo
                form={form}
                handleTransform={(type: 'Human' | 'Wolf') => {
                  toogleForm(form)
                }}
                residence="Pasloe"
                style={{
                  position: 'absolute',
                  color: 'red',
                }}
                title="Wisewolf"
              />
            `,
            output: dedent`
              <Holo
                handleTransform={(type: 'Human' | 'Wolf') => {
                  toogleForm(form)
                }}
                style={{
                  position: 'absolute',
                  color: 'red',
                }}
                form={form}
                residence="Pasloe"
                title="Wisewolf"
              />
            `,
            options: [
              {
                type: SortType.natural,
                multiline: Position.first,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'form',
                  right: 'handleTransform',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'residence',
                  right: 'style',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set priority props`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              <Hero
                id="ed2cc26e-ec5a-41da-aab0-51a61d6a919f"
                name="Saitama"
                age={25}
                height={175}
                nickname="One-Punch Man"
                weight={70}
              />
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                'always-on-top': ['id', 'name'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <Hero
                age={25}
                nickname="One-Punch Man"
                name="Saitama"
                id="ed2cc26e-ec5a-41da-aab0-51a61d6a919f"
                height={175}
                weight={70}
              />
            `,
            output: dedent`
              <Hero
                id="ed2cc26e-ec5a-41da-aab0-51a61d6a919f"
                name="Saitama"
                age={25}
                height={175}
                nickname="One-Punch Man"
                weight={70}
              />
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                'always-on-top': ['id', 'name'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'nickname',
                  right: 'name',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'name',
                  right: 'id',
                },
              },
            ],
          },
          {
            code: dedent`
              <Hero
                name="Genos"
                id="dabd9d43-a165-419a-bfc8-061533bf40bd"
              />
            `,
            output: dedent`
              <Hero
                id="dabd9d43-a165-419a-bfc8-061533bf40bd"
                name="Genos"
              />
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                'always-on-top': ['id', 'name'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'name',
                  right: 'id',
                },
              },
            ],
          },
          {
            code: dedent`
              <Hero
                name="King"
                id="5bcd11c7-bb04-4046-b986-a4e4796fa624"
              />
            `,
            output: dedent`
              <Hero
                id="5bcd11c7-bb04-4046-b986-a4e4796fa624"
                name="King"
              />
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                'always-on-top': ['id'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'name',
                  right: 'id',
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
                'ignore-case': true,
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
                'ignore-case': true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'type',
                  right: 'role',
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
                  left: 'age',
                  right: 'parasite:name',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'parasite:name',
                  right: 'name',
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
                  left: 'age',
                  right: 'weapon',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set shorthand props position`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              let Spike = () => (
                <Hunter
                  bloodType={0}
                  origin="Mars"
                  age={27}
                  isFromCowboyBebop
                />
              )
            `,
            options: [
              {
                type: SortType['line-length'],
                shorthand: Position.last,
                order: SortOrder.desc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              let Spike = () => (
                <Hunter
                  age={27}
                  bloodType={0}
                  isFromCowboyBebop
                  origin="Mars"
                />
              )
            `,
            output: dedent`
              let Spike = () => (
                <Hunter
                  origin="Mars"
                  bloodType={0}
                  age={27}
                  isFromCowboyBebop
                />
              )
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                shorthand: Position.last,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'age',
                  right: 'bloodType',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'isFromCowboyBebop',
                  right: 'origin',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set callback props position`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              <DeathNote
                author="Light Yagami"
                list={deathNotes}
                shinigami="Ryuk"
                onChange={updateDeathNotes}
              />
            `,
            options: [
              {
                type: SortType['line-length'],
                callback: Position.last,
                order: SortOrder.desc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <DeathNote
                author="Light Yagami"
                list={deathNotes}
                onChange={updateDeathNotes}
                shinigami="Ryuk"
              />
            `,
            output: dedent`
              <DeathNote
                author="Light Yagami"
                list={deathNotes}
                shinigami="Ryuk"
                onChange={updateDeathNotes}
              />
            `,
            options: [
              {
                type: SortType['line-length'],
                callback: Position.last,
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'onChange',
                  right: 'shinigami',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set multiline props position`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              <Holo
                handleTransform={(type: 'Human' | 'Wolf') => {
                  toogleForm(form)
                }}
                style={{
                  position: 'absolute',
                  color: 'red',
                }}
                residence="Pasloe"
                title="Wisewolf"
                form={form}
              />
            `,
            options: [
              {
                type: SortType['line-length'],
                multiline: Position.first,
                order: SortOrder.desc,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <Holo
                form={form}
                handleTransform={(type: 'Human' | 'Wolf') => {
                  toogleForm(form)
                }}
                residence="Pasloe"
                style={{
                  position: 'absolute',
                  color: 'red',
                }}
                title="Wisewolf"
              />
            `,
            output: dedent`
              <Holo
                handleTransform={(type: 'Human' | 'Wolf') => {
                  toogleForm(form)
                }}
                style={{
                  position: 'absolute',
                  color: 'red',
                }}
                residence="Pasloe"
                title="Wisewolf"
                form={form}
              />
            `,
            options: [
              {
                type: SortType['line-length'],
                multiline: Position.first,
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'form',
                  right: 'handleTransform',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'residence',
                  right: 'style',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set priority props`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              <Hero
                id="ed2cc26e-ec5a-41da-aab0-51a61d6a919f"
                name="Saitama"
                nickname="One-Punch Man"
                height={175}
                weight={70}
                age={25}
              />
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                'always-on-top': ['id', 'name'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <Hero
                age={25}
                nickname="One-Punch Man"
                name="Saitama"
                id="ed2cc26e-ec5a-41da-aab0-51a61d6a919f"
                height={175}
                weight={70}
              />
            `,
            output: dedent`
              <Hero
                id="ed2cc26e-ec5a-41da-aab0-51a61d6a919f"
                name="Saitama"
                nickname="One-Punch Man"
                height={175}
                weight={70}
                age={25}
              />
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                'always-on-top': ['id', 'name'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'age',
                  right: 'nickname',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'nickname',
                  right: 'name',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'name',
                  right: 'id',
                },
              },
            ],
          },
          {
            code: dedent`
              <Hero
                name="Genos"
                id="dabd9d43-a165-419a-bfc8-061533bf40bd"
              />
            `,
            output: dedent`
              <Hero
                id="dabd9d43-a165-419a-bfc8-061533bf40bd"
                name="Genos"
              />
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                'always-on-top': ['id', 'name'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'name',
                  right: 'id',
                },
              },
            ],
          },
          {
            code: dedent`
              <Hero
                name="King"
                id="5bcd11c7-bb04-4046-b986-a4e4796fa624"
              />
            `,
            output: dedent`
              <Hero
                id="5bcd11c7-bb04-4046-b986-a4e4796fa624"
                name="King"
              />
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                'always-on-top': ['id'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'name',
                  right: 'id',
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
                  left: 'occupation',
                  right: 'firstName',
                },
              },
            ],
          },
        ],
      })
    })
  })
})
