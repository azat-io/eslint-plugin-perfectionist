import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '~/rules/sort-jsx-props'
import { SortType, SortOrder } from '~/typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  })

  it(`${RULE_NAME}: sorts jsx props`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: [
        {
          code: dedent`
            let Container = () => (
              <Button
                variant="solid"
                type="button"
                color="main"
              >
                Press me
              </Button>
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
            let Container = () => (
              <Button
                type="button"
                variant="solid"
                color="main"
              >
                Press me
              </Button>
            )
          `,
          output: dedent`
            let Container = () => (
              <Button
                variant="solid"
                type="button"
                color="main"
              >
                Press me
              </Button>
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
                second: 'variant',
              },
            },
          ],
        },
      ],
    })
  })

  it(`${RULE_NAME}: sorts jsx props with namespaced names`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: [
        dedent`
          let Container = () => (
            <Element
              foo:bar="namespace"
              name="element"
            />
          )
        `,
      ],
      invalid: [
        {
          code: dedent`
            let Container = () => (
              <Element
                name="element"
                foo:bar="namespace"
              />
            )
          `,
          output: dedent`
            let Container = () => (
              <Element
                foo:bar="namespace"
                name="element"
              />
            )
          `,
          errors: [
            {
              messageId: 'unexpectedJSXPropsOrder',
              data: {
                first: 'name',
                second: 'foo:bar',
              },
            },
          ],
        },
      ],
    })
  })

  it(`${RULE_NAME}: does not break the property list`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: [
        {
          code: dedent`
            let Container = () => (
              <Input
                placeholder="Password"
                value={password}
                full
                {...props}
                className="input"
                type="password"
                name="element"
                error={false}
                autoFocus
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
            let Container = () => (
              <Input
                placeholder="Password"
                full
                value={password}
                {...props}
                error={false}
                name="element"
                type="password"
                autoFocus
                className="input"
              />
            )
          `,
          output: dedent`
            let Container = () => (
              <Input
                placeholder="Password"
                value={password}
                full
                {...props}
                className="input"
                type="password"
                name="element"
                error={false}
                autoFocus
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
                first: 'full',
                second: 'value',
              },
            },
            {
              messageId: 'unexpectedJSXPropsOrder',
              data: {
                first: 'error',
                second: 'name',
              },
            },
            {
              messageId: 'unexpectedJSXPropsOrder',
              data: {
                first: 'name',
                second: 'type',
              },
            },
            {
              messageId: 'unexpectedJSXPropsOrder',
              data: {
                first: 'autoFocus',
                second: 'className',
              },
            },
          ],
        },
      ],
    })
  })
})
