import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '~/rules/sort-named-exports'
import { SortType, SortOrder } from '~/typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser',
  })

  it(`${RULE_NAME}: sets natural asc sorting as default`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: ['export { get, post, put }'],
      invalid: [
        {
          code: dedent`
            export { get, post, put, patch }
          `,
          output: dedent`
            export { get, patch, post, put }
          `,
          errors: [
            {
              messageId: 'unexpectedNamedExportsOrder',
              data: {
                first: 'put',
                second: 'patch',
              },
            },
          ],
        },
      ],
    })
  })

  it(`${RULE_NAME}: sorts by length`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: [
        {
          code: 'export { post, get, put }',
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
            export { get, post, put, patch }
          `,
          options: [
            {
              type: SortType['line-length'],
              order: SortOrder.desc,
            },
          ],
          output: dedent`
            export { patch, post, put, get }
          `,
          errors: [
            {
              messageId: 'unexpectedNamedExportsOrder',
              data: {
                first: 'get',
                second: 'post',
              },
            },
            {
              messageId: 'unexpectedNamedExportsOrder',
              data: {
                first: 'put',
                second: 'patch',
              },
            },
          ],
        },
      ],
    })
  })
})
