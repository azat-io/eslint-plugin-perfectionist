import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import rule from '../../rules/sort-heritage-clauses'
import { Alphabet } from '../../utils/alphabet'

describe('sort-heritage-clauses', () => {
  let { invalid, valid } = createRuleTester({
    name: 'sort-heritage-clauses',
    parser: typescriptParser,
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('accepts sorted heritage clauses', async () => {
      await valid({
        code: dedent`
          interface Interface extends
            a,
            b,
            c {
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          interface Interface extends
            a {
          }
        `,
        options: [options],
      })
    })

    it('sorts simple heritage clauses', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          interface Interface extends
            a,
            b,
            c {
          }
        `,
        code: dedent`
          interface Interface extends
            a,
            c,
            b {
          }
        `,
        options: [options],
      })
    })

    it('sorts namespaced heritage clauses', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          interface Interface extends
            A.a,
            B.b,
            C.c {
          }
        `,
        code: dedent`
          interface Interface extends
            A.a,
            C.c,
            B.b {
          }
        `,
        options: [options],
      })
    })

    it('preserves comments when sorting heritage clauses', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
          {
            data: {
              right: 'c',
              left: 'd',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          interface Interface extends
            /**
             * Comment A
             */
            a,
            /**
             * Comment B
             */
            b,
            /* Comment C */
            c,
            // Comment D
            d {
          }
        `,
        code: dedent`
          interface Interface extends
            /**
             * Comment B
             */
            b,
            /**
             * Comment A
             */
            a,
            // Comment D
            d,
            /* Comment C */
            c {
          }
        `,
        options: [options],
      })
    })

    it('sorts heritage clauses with inline comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          interface Interface extends
            a // Comment A
            , b // Comment B
            {
          }
        `,
        code: dedent`
          interface Interface extends
            b // Comment B
            , a // Comment A
            {
          }
        `,
        options: [options],
      })
    })

    it('applies custom grouping to heritage clauses', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: {
              g: 'g',
            },
            groups: ['g'],
          },
        ],
        code: dedent`
          interface Interface extends
            g,
            a {
          }
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'g',
              right: 'g',
              left: 'a',
            },
            messageId: 'unexpectedHeritageClausesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            customGroups: {
              g: 'g',
            },
            groups: ['g'],
          },
        ],
        output: dedent`
          interface Interface extends
            g,
            a {
          }
        `,
        code: dedent`
          interface Interface extends
            a,
            g {
          }
        `,
      })
    })

    it('supports regex patterns in custom groups for heritage clauses', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: {
              elementsWithoutFoo: '^(?!.*Foo).*$',
            },
            groups: ['unknown', 'elementsWithoutFoo'],
          },
        ],
        code: dedent`
          interface Interface extends
              iHaveFooInMyName,
              meTooIHaveFoo,
              a,
              b {
          }
        `,
      })
    })

    it('trims special characters in heritage clauses', async () => {
      await valid({
        code: dedent`
          interface MyInterface extends
            _a,
            b,
            _c {
          }
        `,
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
      })
    })

    it('removes special characters in heritage clauses', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          interface MyInterface extends
            ab,
            a_c {
          }
        `,
      })
    })

    it('sorts heritage clauses according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          interface MyInterface extends
            你好,
            世界,
            a,
            A,
            b,
            B {
          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts inline heritage clauses in interfaces', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          interface Interface extends
            A, B
          {}
        `,
        code: dedent`
          interface Interface extends
            B, A
          {}
        `,
        options: [options],
      })
    })

    it('sorts inline heritage clauses in classes', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          class Class implements
            A, B
          {}
        `,
        code: dedent`
          class Class implements
            B, A
          {}
        `,
        options: [options],
      })
    })

    it.each([
      ['string pattern', 'Hello'],
      ['array of patterns', ['noMatch', 'Hello']],
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])(
      'groups elements by name pattern - %s',
      async (_, elementNamePattern) => {
        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'decoratorsContainingHello',
                right: 'HelloInterface',
                leftGroup: 'unknown',
                left: 'B',
              },
              messageId: 'unexpectedHeritageClausesGroupOrder',
            },
          ],
          options: [
            {
              customGroups: [
                {
                  groupName: 'decoratorsContainingHello',
                  elementNamePattern,
                },
              ],
              groups: ['decoratorsContainingHello', 'unknown'],
            },
          ],
          output: dedent`
            class Class implements
              HelloInterface, A, B
            {}
          `,
          code: dedent`
            class Class implements
              A, B, HelloInterface
            {}
          `,
        })
      },
    )

    it('overrides sort type and order for specific groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'reversedContainingFooByLineLength',
              leftGroup: 'unknown',
              right: 'aFoo',
              left: 'p',
            },
            messageId: 'unexpectedHeritageClausesGroupOrder',
          },
          {
            data: {
              rightGroup: 'reversedContainingFooByLineLength',
              leftGroup: 'unknown',
              right: 'bbFoo',
              left: 'oo',
            },
            messageId: 'unexpectedHeritageClausesGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedContainingFooByLineLength',
                elementNamePattern: 'Foo',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedContainingFooByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          class Class implements
            bbFoo, aFoo, oo, p
          {}
        `,
        code: dedent`
          class Class implements
            p, aFoo, oo, bbFoo
          {}
        `,
      })
    })

    it('applies fallback sort when primary sort results in tie', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                fallbackSort: {
                  type: 'alphabetical',
                  order: 'asc',
                },
                elementNamePattern: '^foo',
                type: 'line-length',
                groupName: 'foo',
                order: 'desc',
              },
            ],
            type: 'alphabetical',
            groups: ['foo'],
            order: 'asc',
          },
        ],
        errors: [
          {
            data: {
              right: 'fooBar',
              left: 'fooZar',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          class Class implements
            fooBar, fooZar
          {}
        `,
        code: dedent`
          class Class implements
            fooZar, fooBar
          {}
        `,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedContainingFoo',
                elementNamePattern: 'Foo',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedContainingFoo', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedContainingFoo',
              leftGroup: 'unknown',
              right: 'cFoo',
              left: 'm',
            },
            messageId: 'unexpectedHeritageClausesGroupOrder',
          },
        ],
        output: dedent`
          class Class implements
            bFoo, aFoo, dFoo, eFoo, cFoo, m
          {}
        `,
        code: dedent`
          class Class implements
            bFoo, aFoo, dFoo, eFoo, m, cFoo
          {}
        `,
      })
    })

    it('supports negative regex patterns in custom groups', async () => {
      await valid({
        options: [
          {
            customGroups: [
              {
                elementNamePattern: '^(?!.*Foo).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
            type: 'alphabetical',
          },
        ],
        code: dedent`
          class Class implements
            iHaveFooInMyName, meTooIHaveFoo, a, b
          {}
        `,
      })
    })
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it('accepts sorted heritage clauses', async () => {
      await valid({
        code: dedent`
          interface Interface extends
            a,
            b,
            c {
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          interface Interface extends
            a {
          }
        `,
        options: [options],
      })
    })

    it('sorts simple heritage clauses', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          interface Interface extends
            a,
            b,
            c {
          }
        `,
        code: dedent`
          interface Interface extends
            a,
            c,
            b {
          }
        `,
        options: [options],
      })
    })

    it('sorts namespaced heritage clauses', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          interface Interface extends
            A.a,
            B.b,
            C.c {
          }
        `,
        code: dedent`
          interface Interface extends
            A.a,
            C.c,
            B.b {
          }
        `,
        options: [options],
      })
    })

    it('preserves comments when sorting heritage clauses', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
          {
            data: {
              right: 'c',
              left: 'd',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          interface Interface extends
            /**
             * Comment A
             */
            a,
            /**
             * Comment B
             */
            b,
            /* Comment C */
            c,
            // Comment D
            d {
          }
        `,
        code: dedent`
          interface Interface extends
            /**
             * Comment B
             */
            b,
            /**
             * Comment A
             */
            a,
            // Comment D
            d,
            /* Comment C */
            c {
          }
        `,
        options: [options],
      })
    })

    it('sorts heritage clauses with inline comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          interface Interface extends
            a // Comment A
            , b // Comment B
            {
          }
        `,
        code: dedent`
          interface Interface extends
            b // Comment B
            , a // Comment A
            {
          }
        `,
        options: [options],
      })
    })

    it('applies custom grouping to heritage clauses', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: {
              g: 'g',
            },
            groups: ['g'],
          },
        ],
        code: dedent`
          interface Interface extends
            g,
            a {
          }
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'g',
              right: 'g',
              left: 'a',
            },
            messageId: 'unexpectedHeritageClausesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            customGroups: {
              g: 'g',
            },
            groups: ['g'],
          },
        ],
        output: dedent`
          interface Interface extends
            g,
            a {
          }
        `,
        code: dedent`
          interface Interface extends
            a,
            g {
          }
        `,
      })
    })

    it('supports regex patterns in custom groups for heritage clauses', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: {
              elementsWithoutFoo: '^(?!.*Foo).*$',
            },
            groups: ['unknown', 'elementsWithoutFoo'],
          },
        ],
        code: dedent`
          interface Interface extends
              iHaveFooInMyName,
              meTooIHaveFoo,
              a,
              b {
          }
        `,
      })
    })

    it('trims special characters in heritage clauses', async () => {
      await valid({
        code: dedent`
          interface MyInterface extends
            _a,
            b,
            _c {
          }
        `,
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
      })
    })

    it('removes special characters in heritage clauses', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          interface MyInterface extends
            ab,
            a_c {
          }
        `,
      })
    })

    it('sorts heritage clauses according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          interface MyInterface extends
            你好,
            世界,
            a,
            A,
            b,
            B {
          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts inline heritage clauses in interfaces', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          interface Interface extends
            A, B
          {}
        `,
        code: dedent`
          interface Interface extends
            B, A
          {}
        `,
        options: [options],
      })
    })

    it('sorts inline heritage clauses in classes', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          class Class implements
            A, B
          {}
        `,
        code: dedent`
          class Class implements
            B, A
          {}
        `,
        options: [options],
      })
    })
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it('accepts sorted heritage clauses', async () => {
      await valid({
        code: dedent`
          interface Interface extends
            a,
            b,
            c {
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          interface Interface extends
            a {
          }
        `,
        options: [options],
      })
    })

    it('sorts simple heritage clauses', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'c',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          interface Interface extends
            aaa,
            bb,
            c {
          }
        `,
        code: dedent`
          interface Interface extends
            aaa,
            c,
            bb {
          }
        `,
        options: [options],
      })
    })

    it('sorts namespaced heritage clauses', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'c',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          interface Interface extends
            A.aaa,
            B.bb,
            C.c {
          }
        `,
        code: dedent`
          interface Interface extends
            A.aaa,
            C.c,
            B.bb {
          }
        `,
        options: [options],
      })
    })

    it('preserves comments when sorting heritage clauses', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'aaaa',
              left: 'bbb',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
          {
            data: {
              right: 'cc',
              left: 'd',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          interface Interface extends
            /**
             * Comment A
             */
            aaaa,
            /**
             * Comment B
             */
            bbb,
            /* Comment C */
            cc,
            // Comment D
            d {
          }
        `,
        code: dedent`
          interface Interface extends
            /**
             * Comment B
             */
            bbb,
            /**
             * Comment A
             */
            aaaa,
            // Comment D
            d,
            /* Comment C */
            cc {
          }
        `,
        options: [options],
      })
    })

    it('sorts heritage clauses with inline comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'aa',
              left: 'b',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          interface Interface extends
            aa // Comment A
            , b // Comment B
            {
          }
        `,
        code: dedent`
          interface Interface extends
            b // Comment B
            , aa // Comment A
            {
          }
        `,
        options: [options],
      })
    })

    it('applies custom grouping to heritage clauses', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: {
              g: 'g',
            },
            groups: ['g'],
          },
        ],
        code: dedent`
          interface Interface extends
            g,
            a {
          }
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'g',
              right: 'g',
              left: 'a',
            },
            messageId: 'unexpectedHeritageClausesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            customGroups: {
              g: 'g',
            },
            groups: ['g'],
          },
        ],
        output: dedent`
          interface Interface extends
            g,
            a {
          }
        `,
        code: dedent`
          interface Interface extends
            a,
            g {
          }
        `,
      })
    })

    it('supports regex patterns in custom groups for heritage clauses', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: {
              elementsWithoutFoo: '^(?!.*Foo).*$',
            },
            groups: ['unknown', 'elementsWithoutFoo'],
          },
        ],
        code: dedent`
          interface Interface extends
              iHaveFooInMyName,
              meTooIHaveFoo,
              a,
              b {
          }
        `,
      })
    })

    it('trims special characters in heritage clauses', async () => {
      await valid({
        code: dedent`
          interface MyInterface extends
            _aaa,
            bb,
            _c {
          }
        `,
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
      })
    })

    it('removes special characters in heritage clauses', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          interface MyInterface extends
            abc,
            a_c {
          }
        `,
      })
    })

    it('sorts heritage clauses according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          interface MyInterface extends
            你好,
            世界,
            a,
            A,
            b,
            B {
          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts inline heritage clauses in interfaces', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'AA',
              left: 'B',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          interface Interface extends
            AA, B
          {}
        `,
        code: dedent`
          interface Interface extends
            B, AA
          {}
        `,
        options: [options],
      })
    })

    it('sorts inline heritage clauses in classes', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'AA',
              left: 'B',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          class Class implements
            AA, B
          {}
        `,
        code: dedent`
          class Class implements
            B, AA
          {}
        `,
        options: [options],
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

    it('accepts sorted heritage clauses', async () => {
      await valid({
        code: dedent`
          interface Interface extends
            a,
            b,
            c {
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          interface Interface extends
            a {
          }
        `,
        options: [options],
      })
    })

    it('sorts simple heritage clauses', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          interface Interface extends
            a,
            b,
            c {
          }
        `,
        code: dedent`
          interface Interface extends
            a,
            c,
            b {
          }
        `,
        options: [options],
      })
    })

    it('sorts namespaced heritage clauses', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          interface Interface extends
            A.a,
            B.b,
            C.c {
          }
        `,
        code: dedent`
          interface Interface extends
            A.a,
            C.c,
            B.b {
          }
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

    it('allows unsorted heritage clauses when sorting is not configured', async () => {
      await valid({
        code: dedent`
          interface Interface extends
            b,
            c,
            a
          {}
        `,
        options: [options],
      })
    })

    it('enforces custom group ordering in heritage clauses', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'b',
              leftGroup: 'a',
              right: 'ba',
              left: 'aa',
            },
            messageId: 'unexpectedHeritageClausesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            customGroups: {
              a: '^a',
              b: '^b',
            },
            groups: ['b', 'a'],
          },
        ],
        output: dedent`
          interface Interface extends
            ba,
            bb,
            ab,
            aa
          {}
        `,
        code: dedent`
          interface Interface extends
            ab,
            aa,
            ba,
            bb
          {}
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

    it('uses default sorting configuration', async () => {
      await valid(
        dedent`
          interface Interface extends
            a,
            b {
          }
        `,
      )

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedHeritageClausesOrder',
          },
        ],
        output: dedent`
          interface Interface extends
            a,
            b {
          }
        `,
        code: dedent`
          interface Interface extends
            b,
            a {
          }
        `,
      })
    })

    describe('handles eslint-disable comments', () => {
      it('accepts heritage clauses with eslint-disable-next-line comments', async () => {
        await valid({
          code: dedent`
            class Class implements
              B,
              C,
              // eslint-disable-next-line
              A
            {}
          `,
        })
      })

      it('sorts heritage clauses with eslint-disable-next-line comments', async () => {
        await invalid({
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            interface Interface extends
              B,
              C,
              // eslint-disable-next-line
              A
            {}
          `,
          code: dedent`
            interface Interface extends
              C,
              B,
              // eslint-disable-next-line
              A
            {}
          `,
          options: [{}],
        })

        await invalid({
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            interface Interface extends
              B,
              C,
              /* eslint-disable-next-line */
              A
            {}
          `,
          code: dedent`
            interface Interface extends
              C,
              B,
              /* eslint-disable-next-line */
              A
            {}
          `,
          options: [{}],
        })
      })

      it('sorts heritage clauses with eslint-disable-line comments', async () => {
        await invalid({
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            interface Interface extends
              B,
              C,
              A // eslint-disable-line
            {}
          `,
          code: dedent`
            interface Interface extends
              C,
              B,
              A // eslint-disable-line
            {}
          `,
          options: [{}],
        })

        await invalid({
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            interface Interface extends
              B,
              C,
              A /* eslint-disable-line */
            {}
          `,
          code: dedent`
            interface Interface extends
              C,
              B,
              A /* eslint-disable-line */
            {}
          `,
          options: [{}],
        })
      })

      it('sorts heritage clauses with multiple eslint-disable comments', async () => {
        await invalid({
          errors: [
            {
              data: {
                right: 'C',
                left: 'D',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
            {
              data: {
                right: 'B',
                left: 'A',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          output: dedent`
            interface Interface extends
              B,
              C,
              // eslint-disable-next-line
              A,
              D
            {}
          `,
          code: dedent`
            interface Interface extends
              D,
              C,
              // eslint-disable-next-line
              A,
              B
            {}
          `,
          options: [{}],
        })
      })

      it('respects eslint-disable/enable comment blocks', async () => {
        await invalid({
          output: dedent`
            interface Interface extends
              A,
              D,
              /* eslint-disable */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              E
            {}
          `,
          code: dedent`
            interface Interface extends
              D,
              E,
              /* eslint-disable */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              A
            {}
          `,
          errors: [
            {
              data: {
                right: 'A',
                left: 'B',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          options: [{}],
        })
      })

      it.each([
        ['interface extends', 'interface Interface extends'],
        ['class implements', 'class Class implements'],
      ])(
        'sorts %s with rule-specific eslint-disable comments',
        async (_description, declaration) => {
          await invalid({
            errors: [
              {
                data: {
                  right: 'B',
                  left: 'C',
                },
                messageId: 'unexpectedHeritageClausesOrder',
              },
            ],
            output: dedent`
              ${declaration}
                B,
                C,
                // eslint-disable-next-line rule-to-test/sort-heritage-clauses
                A
              {}
            `,
            code: dedent`
              ${declaration}
                C,
                B,
                // eslint-disable-next-line rule-to-test/sort-heritage-clauses
                A
              {}
            `,
            options: [{}],
          })

          await invalid({
            errors: [
              {
                data: {
                  right: 'B',
                  left: 'C',
                },
                messageId: 'unexpectedHeritageClausesOrder',
              },
            ],
            output: dedent`
              ${declaration}
                B,
                C,
                A // eslint-disable-line rule-to-test/sort-heritage-clauses
              {}
            `,
            code: dedent`
              ${declaration}
                C,
                B,
                A // eslint-disable-line rule-to-test/sort-heritage-clauses
              {}
            `,
            options: [{}],
          })

          await invalid({
            errors: [
              {
                data: {
                  right: 'B',
                  left: 'C',
                },
                messageId: 'unexpectedHeritageClausesOrder',
              },
            ],
            output: dedent`
              ${declaration}
                B,
                C,
                /* eslint-disable-next-line rule-to-test/sort-heritage-clauses */
                A
              {}
            `,
            code: dedent`
              ${declaration}
                C,
                B,
                /* eslint-disable-next-line rule-to-test/sort-heritage-clauses */
                A
              {}
            `,
            options: [{}],
          })

          await invalid({
            errors: [
              {
                data: {
                  right: 'B',
                  left: 'C',
                },
                messageId: 'unexpectedHeritageClausesOrder',
              },
            ],
            output: dedent`
              ${declaration}
                B,
                C,
                A /* eslint-disable-line rule-to-test/sort-heritage-clauses */
              {}
            `,
            code: dedent`
              ${declaration}
                C,
                B,
                A /* eslint-disable-line rule-to-test/sort-heritage-clauses */
              {}
            `,
            options: [{}],
          })
        },
      )

      it('respects rule-specific eslint-disable/enable blocks', async () => {
        await invalid({
          output: dedent`
            interface Interface extends
              A,
              D,
              /* eslint-disable rule-to-test/sort-heritage-clauses */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              E
            {}
          `,
          code: dedent`
            interface Interface extends
              D,
              E,
              /* eslint-disable rule-to-test/sort-heritage-clauses */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              A
            {}
          `,
          errors: [
            {
              data: {
                right: 'A',
                left: 'B',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          options: [{}],
        })

        await invalid({
          output: dedent`
            class Class implements
              A,
              D,
              /* eslint-disable rule-to-test/sort-heritage-clauses */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              E
            {}
          `,
          code: dedent`
            class Class implements
              D,
              E,
              /* eslint-disable rule-to-test/sort-heritage-clauses */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              A
            {}
          `,
          errors: [
            {
              data: {
                right: 'A',
                left: 'B',
              },
              messageId: 'unexpectedHeritageClausesOrder',
            },
          ],
          options: [{}],
        })
      })
    })
  })
})
