import type { TSESTree } from '@typescript-eslint/types'

import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import rule, {
  MISSED_SPACING_ERROR_ID,
  GROUP_ORDER_ERROR_ID,
  ORDER_ERROR_ID,
} from '../../rules/sort-import-attributes'
import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import { Alphabet } from '../../utils/alphabet'

describe('sort-import-attributes', () => {
  let { invalid, valid } = createRuleTester({
    name: 'sort-import-attributes',
    parser: typescriptParser,
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('sorts import attributes', async () => {
      await valid({
        code: dedent`
          import data from 'module' with { a: 'a', b: 'b', c: 'c' }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: 'b', left: 'c' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with { a: 'a', b: 'b', c: 'c' }
        `,
        code: dedent`
          import data from 'module' with { a: 'a', c: 'c', b: 'b' }
        `,
        options: [options],
      })
    })

    it('sorts multiline import attributes', async () => {
      await valid({
        code: dedent`
          import data from 'module' with {
            a: 'a',
            b: 'b',
            c: 'c',
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          import data from 'module' with {
            a: 'a',
            b: 'b',
            c: 'c',
          }
        `,
        code: dedent`
          import data from 'module' with {
            a: 'a',
            c: 'c',
            b: 'b',
          }
        `,
        errors: [
          {
            data: { right: 'b', left: 'c' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [options],
      })
    })

    it('handles string-literal attribute keys', async () => {
      await valid({
        code: dedent`
          import data from 'module' with { 'a': '1', 'b': '2' }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: 'a', left: 'b' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with { 'a': '1', 'b': '2' }
        `,
        code: dedent`
          import data from 'module' with { 'b': '2', 'a': '1' }
        `,
        options: [options],
      })
    })

    it('allows overriding options in groups', async () => {
      await invalid({
        options: [
          {
            groups: [
              {
                type: 'alphabetical',
                newlinesInside: 1,
                group: 'unknown',
                order: 'desc',
              },
            ],
            type: 'unsorted',
          },
        ],
        errors: [
          {
            data: { right: 'b', left: 'a' },
            messageId: ORDER_ERROR_ID,
          },
          {
            messageId: MISSED_SPACING_ERROR_ID,
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          import { data } from 'module' with {
            b: 'b',

            a: 'a',
          }
        `,
        code: dedent`
          import { data } from 'module' with {
            a: 'a',
            b: 'b',
          }
        `,
      })
    })

    it('positions attributes according to group configuration', async () => {
      let grouped = {
        ...options,
        customGroups: [{ elementNamePattern: '^t', groupName: 't' }],
        groups: ['t', 'unknown'],
      } as const

      await valid({
        code: dedent`
          import data from 'module' with {
            type: 'json',
            mode: 'no-cors',
          }
        `,
        options: [grouped],
      })

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 't',
              right: 'type',
              left: 'mode',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with {
            type: 'json',
            mode: 'no-cors',
          }
        `,
        code: dedent`
          import data from 'module' with {
            mode: 'no-cors',
            type: 'json',
          }
        `,
        options: [grouped],
      })
    })

    it('adds newlines between groups when newlinesBetween is 1', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [{ elementNamePattern: '^t', groupName: 't' }],
            groups: ['t', 'unknown'],
            newlinesBetween: 1,
          },
        ],
        errors: [
          {
            data: { right: 'mode', left: 'type' },
            messageId: MISSED_SPACING_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with {
            type: 'json',

            mode: 'no-cors',
          }
        `,
        code: dedent`
          import data from 'module' with {
            type: 'json',
            mode: 'no-cors',
          }
        `,
      })
    })

    it('allows partitioning by new lines', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'a', left: 'b' },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: { right: 'c', left: 'd' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with {
            a: 'a',
            b: 'b',

            c: 'c',
            d: 'd',
          }
        `,
        code: dedent`
          import data from 'module' with {
            b: 'b',
            a: 'a',

            d: 'd',
            c: 'c',
          }
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
        errors: [
          {
            data: { right: 'a', left: 'b' },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: { right: 'c', left: 'd' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with {
            a: 'a',
            b: 'b',
            // Part: Section
            c: 'c',
            d: 'd',
          }
        `,
        code: dedent`
          import data from 'module' with {
            b: 'b',
            a: 'a',
            // Part: Section
            d: 'd',
            c: 'c',
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: '^Part',
            newlinesBetween: 'ignore',
          },
        ],
      })
    })
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it('sorts import attributes', async () => {
      await valid({
        code: dedent`
          import data from 'module' with { a: 'a', b: 'b', c: 'c' }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: 'b', left: 'c' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with { a: 'a', b: 'b', c: 'c' }
        `,
        code: dedent`
          import data from 'module' with { a: 'a', c: 'c', b: 'b' }
        `,
        options: [options],
      })
    })

    it('sorts multiline import attributes', async () => {
      await valid({
        code: dedent`
          import data from 'module' with {
            a: 'a',
            b: 'b',
            c: 'c',
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          import data from 'module' with {
            a: 'a',
            b: 'b',
            c: 'c',
          }
        `,
        code: dedent`
          import data from 'module' with {
            a: 'a',
            c: 'c',
            b: 'b',
          }
        `,
        errors: [
          {
            data: { right: 'b', left: 'c' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [options],
      })
    })

    it('sorts attributes in natural order', async () => {
      await valid({
        code: dedent`
          import data from 'module' with { link1: 'v', link2: 'v', link10: 'v' }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: 'link2', left: 'link10' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with { link1: 'v', link2: 'v', link10: 'v' }
        `,
        code: dedent`
          import data from 'module' with { link1: 'v', link10: 'v', link2: 'v' }
        `,
        options: [options],
      })
    })

    it('handles string-literal attribute keys', async () => {
      await valid({
        code: dedent`
          import data from 'module' with { 'a': '1', 'b': '2' }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: 'a', left: 'b' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with { 'a': '1', 'b': '2' }
        `,
        code: dedent`
          import data from 'module' with { 'b': '2', 'a': '1' }
        `,
        options: [options],
      })
    })
    it('positions attributes according to group configuration', async () => {
      let grouped = {
        ...options,
        customGroups: [{ elementNamePattern: '^t', groupName: 't' }],
        groups: ['t', 'unknown'],
      } as const

      await valid({
        code: dedent`
          import data from 'module' with {
            type: 'json',
            mode: 'no-cors',
          }
        `,
        options: [grouped],
      })

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 't',
              right: 'type',
              left: 'mode',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with {
            type: 'json',
            mode: 'no-cors',
          }
        `,
        code: dedent`
          import data from 'module' with {
            mode: 'no-cors',
            type: 'json',
          }
        `,
        options: [grouped],
      })
    })

    it('adds newlines between groups when newlinesBetween is 1', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [{ elementNamePattern: '^t', groupName: 't' }],
            groups: ['t', 'unknown'],
            newlinesBetween: 1,
          },
        ],
        errors: [
          {
            data: { right: 'mode', left: 'type' },
            messageId: MISSED_SPACING_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with {
            type: 'json',

            mode: 'no-cors',
          }
        `,
        code: dedent`
          import data from 'module' with {
            type: 'json',
            mode: 'no-cors',
          }
        `,
      })
    })

    it('allows partitioning by new lines', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'a', left: 'b' },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: { right: 'c', left: 'd' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with {
            a: 'a',
            b: 'b',

            c: 'c',
            d: 'd',
          }
        `,
        code: dedent`
          import data from 'module' with {
            b: 'b',
            a: 'a',

            d: 'd',
            c: 'c',
          }
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
        errors: [
          {
            data: { right: 'a', left: 'b' },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: { right: 'c', left: 'd' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with {
            a: 'a',
            b: 'b',
            // Part: Section
            c: 'c',
            d: 'd',
          }
        `,
        code: dedent`
          import data from 'module' with {
            b: 'b',
            a: 'a',
            // Part: Section
            d: 'd',
            c: 'c',
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: '^Part',
            newlinesBetween: 'ignore',
          },
        ],
      })
    })
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it('sorts import attributes', async () => {
      await valid({
        code: dedent`
          import data from 'module' with { ccc: 'v', bb: 'v', a: 'v' }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: 'ccc', left: 'a' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with { ccc: 'v', bb: 'v', a: 'v' }
        `,
        code: dedent`
          import data from 'module' with { a: 'v', ccc: 'v', bb: 'v' }
        `,
        options: [options],
      })
    })

    it('sorts multiline import attributes', async () => {
      await valid({
        code: dedent`
          import data from 'module' with {
            ccc: 'v',
            bb: 'v',
            a: 'v',
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          import data from 'module' with {
            ccc: 'v',
            bb: 'v',
            a: 'v',
          }
        `,
        code: dedent`
          import data from 'module' with {
            a: 'v',
            ccc: 'v',
            bb: 'v',
          }
        `,
        errors: [
          {
            data: { right: 'ccc', left: 'a' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [options],
      })
    })

    it('sorts attributes by name length', async () => {
      await valid({
        code: dedent`
          import data from 'module' with { ccc: 'v', bb: 'v', a: 'v' }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: 'ccc', left: 'a' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with { ccc: 'v', bb: 'v', a: 'v' }
        `,
        code: dedent`
          import data from 'module' with { a: 'v', ccc: 'v', bb: 'v' }
        `,
        options: [options],
      })
    })

    it('handles string-literal attribute keys', async () => {
      await valid({
        code: dedent`
          import data from 'module' with { 'bb': 'v', 'a': 'v' }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: 'bb', left: 'a' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with { 'bb': 'v', 'a': 'v' }
        `,
        code: dedent`
          import data from 'module' with { 'a': 'v', 'bb': 'v' }
        `,
        options: [options],
      })
    })
    it('positions attributes according to group configuration', async () => {
      let grouped = {
        ...options,
        customGroups: [{ elementNamePattern: '^t', groupName: 't' }],
        groups: ['t', 'unknown'],
      } as const

      await valid({
        code: dedent`
          import data from 'module' with {
            type: 'json',
            mode: 'no-cors',
          }
        `,
        options: [grouped],
      })

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 't',
              right: 'type',
              left: 'mode',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with {
            type: 'json',
            mode: 'no-cors',
          }
        `,
        code: dedent`
          import data from 'module' with {
            mode: 'no-cors',
            type: 'json',
          }
        `,
        options: [grouped],
      })
    })

    it('adds newlines between groups when newlinesBetween is 1', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [{ elementNamePattern: '^t', groupName: 't' }],
            groups: ['t', 'unknown'],
            newlinesBetween: 1,
          },
        ],
        errors: [
          {
            data: { right: 'mode', left: 'type' },
            messageId: MISSED_SPACING_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with {
            type: 'json',

            mode: 'no-cors',
          }
        `,
        code: dedent`
          import data from 'module' with {
            type: 'json',
            mode: 'no-cors',
          }
        `,
      })
    })

    it('allows partitioning by new lines', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'bb', left: 'a' },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: { right: 'ddd', left: 'c' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with {
            bb: 'b',
            a: 'a',

            ddd: 'd',
            c: 'c',
          }
        `,
        code: dedent`
          import data from 'module' with {
            a: 'a',
            bb: 'b',

            c: 'c',
            ddd: 'd',
          }
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
        errors: [
          {
            data: { right: 'bb', left: 'a' },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: { right: 'ddd', left: 'c' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with {
            bb: 'b',
            a: 'a',
            // Part: Section
            ddd: 'd',
            c: 'c',
          }
        `,
        code: dedent`
          import data from 'module' with {
            a: 'a',
            bb: 'b',
            // Part: Section
            c: 'c',
            ddd: 'd',
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: '^Part',
            newlinesBetween: 'ignore',
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

    it('sorts import attributes using custom alphabet', async () => {
      await valid({
        code: dedent`
          import data from 'module' with { a: 'a', b: 'b', c: 'c' }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: 'b', left: 'c' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with { a: 'a', b: 'b', c: 'c' }
        `,
        code: dedent`
          import data from 'module' with { a: 'a', c: 'c', b: 'b' }
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

    it('allows any order when type is unsorted', async () => {
      await valid({
        code: dedent`
          import data from 'module' with { b: 'b', c: 'c', a: 'a' }
        `,
        options: [options],
      })
    })

    it('enforces group order while preserving order within groups', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              { elementNamePattern: '^a', groupName: 'a' },
              { elementNamePattern: '^b', groupName: 'b' },
            ],
            groups: ['b', 'a'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'b',
              leftGroup: 'a',
              right: 'ba',
              left: 'aa',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with {
            ba: '1',
            bb: '1',
            ab: '1',
            aa: '1',
          }
        `,
        code: dedent`
          import data from 'module' with {
            ab: '1',
            aa: '1',
            ba: '1',
            bb: '1',
          }
        `,
      })
    })

    it('adds newlines between groups when newlinesBetween is 1', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              { elementNamePattern: '^b', groupName: 'b' },
              { elementNamePattern: '^a', groupName: 'a' },
            ],
            newlinesBetween: 1,
            groups: ['b', 'a'],
          },
        ],
        errors: [
          {
            messageId: MISSED_SPACING_ERROR_ID,
            data: { right: 'ab', left: 'ba' },
          },
        ],
        output: dedent`
          import data from 'module' with {
            ba: '1',

            ab: '1',
          }
        `,
        code: dedent`
          import data from 'module' with {
            ba: '1',
            ab: '1',
          }
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

    it('uses the attribute source when a literal key lacks value', async () => {
      function removeLiteralValue(program: TSESTree.Program): void {
        for (let statement of program.body) {
          if (statement.type !== 'ImportDeclaration') {
            continue
          }

          for (let attribute of statement.attributes) {
            if (
              attribute.key.type === 'Literal' &&
              attribute.key.value === 'a'
            ) {
              ;(attribute.key as { value?: unknown }).value = undefined
            }
          }
        }
      }

      let parserWithMissingLiteralValue = {
        ...typescriptParser,
        parseForESLint(
          code: string,
          parserOptions?: Parameters<typeof typescriptParser.parseForESLint>[1],
        ) {
          let result = typescriptParser.parseForESLint(code, parserOptions)
          removeLiteralValue(result.ast)
          return result
        },
        parse(
          code: string,
          parserOptions?: Parameters<typeof typescriptParser.parse>[1],
        ) {
          let program = typescriptParser.parse(code, parserOptions)
          removeLiteralValue(program)
          return program
        },
      }

      let { invalid: invalidWithMissingLiteralValue } = createRuleTester({
        parser: parserWithMissingLiteralValue,
        name: 'sort-import-attributes',
        rule,
      })

      let alphabetical = { type: 'alphabetical', order: 'asc' } as const

      await invalidWithMissingLiteralValue({
        errors: [
          {
            data: { right: "'a': '1'", left: 'b' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          import data from 'module' with { 'a': '1', 'b': '2' }
        `,
        code: dedent`
          import data from 'module' with { 'b': '2', 'a': '1' }
        `,
        options: [alphabetical],
      })
    })

    it('uses alphabetical ascending order by default', async () => {
      await valid(
        dedent`
          import data from 'module' with { a: 'a', b: 'b', c: 'c' }
        `,
      )

      await valid({
        code: dedent`
          import data from 'module' with { link1: 'v', link10: 'v', link2: 'v' }
        `,
        options: [{}],
      })
    })

    it('ignores imports without attributes', async () => {
      await valid(
        dedent`
          import data from 'module'
        `,
      )
    })

    it('ignores imports with a single attribute', async () => {
      await valid(
        dedent`
          import data from 'module' with { a: 'a' }
        `,
      )
    })

    it('ignores attributes disabled with eslint-disable-next-line', async () => {
      await valid({
        code: dedent`
          import data from 'module' with {
            b: 'b',
            // eslint-disable-next-line
            a: 'a',
            c: 'c',
          }
        `,
      })
    })

    it('sorts attributes with eslint-disable-line comments', async () => {
      await invalid({
        output: dedent`
          import data from 'module' with {
            b: 'b',
            c: 'c',
            a: 'a', // eslint-disable-line
          }
        `,
        code: dedent`
          import data from 'module' with {
            c: 'c',
            b: 'b',
            a: 'a', // eslint-disable-line
          }
        `,
        errors: [
          {
            data: { right: 'b', left: 'c' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [{}],
      })
    })

    it('handles block eslint-disable-next-line comments', async () => {
      await invalid({
        output: dedent`
          import data from 'module' with {
            b: 'b',
            c: 'c',
            /* eslint-disable-next-line */
            a: 'a',
          }
        `,
        code: dedent`
          import data from 'module' with {
            c: 'c',
            b: 'b',
            /* eslint-disable-next-line */
            a: 'a',
          }
        `,
        errors: [
          {
            data: { right: 'b', left: 'c' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [{}],
      })
    })

    it('sorts attributes around eslint-disable/enable block', async () => {
      await invalid({
        output: dedent`
          import data from 'module' with {
            a: 'a',
            d: 'd',
            /* eslint-disable */
            c: 'c',
            b: 'b',
            // Shouldn't move
            /* eslint-enable */
            e: 'e',
          }
        `,
        code: dedent`
          import data from 'module' with {
            d: 'd',
            e: 'e',
            /* eslint-disable */
            c: 'c',
            b: 'b',
            // Shouldn't move
            /* eslint-enable */
            a: 'a',
          }
        `,
        errors: [
          {
            data: { right: 'a', left: 'b' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [{}],
      })
    })

    it('handles rule-specific eslint-disable-next-line comments', async () => {
      await invalid({
        output: dedent`
          import data from 'module' with {
            b: 'b',
            c: 'c',
            // eslint-disable-next-line rule-to-test/sort-import-attributes
            a: 'a',
          }
        `,
        code: dedent`
          import data from 'module' with {
            c: 'c',
            b: 'b',
            // eslint-disable-next-line rule-to-test/sort-import-attributes
            a: 'a',
          }
        `,
        errors: [
          {
            data: { right: 'b', left: 'c' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [{}],
      })
    })

    it('handles rule-specific eslint-disable-line comments', async () => {
      await invalid({
        output: dedent`
          import data from 'module' with {
            b: 'b',
            c: 'c',
            a: 'a', // eslint-disable-line rule-to-test/sort-import-attributes
          }
        `,
        code: dedent`
          import data from 'module' with {
            c: 'c',
            b: 'b',
            a: 'a', // eslint-disable-line rule-to-test/sort-import-attributes
          }
        `,
        errors: [
          {
            data: { right: 'b', left: 'c' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [{}],
      })
    })

    it('sorts attributes around rule-specific eslint-disable/enable block', async () => {
      await invalid({
        output: dedent`
          import data from 'module' with {
            a: 'a',
            d: 'd',
            /* eslint-disable rule-to-test/sort-import-attributes */
            c: 'c',
            b: 'b',
            // Shouldn't move
            /* eslint-enable */
            e: 'e',
          }
        `,
        code: dedent`
          import data from 'module' with {
            d: 'd',
            e: 'e',
            /* eslint-disable rule-to-test/sort-import-attributes */
            c: 'c',
            b: 'b',
            // Shouldn't move
            /* eslint-enable */
            a: 'a',
          }
        `,
        errors: [
          {
            data: { right: 'a', left: 'b' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [{}],
      })
    })
  })
})
