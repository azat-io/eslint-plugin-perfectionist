import type { TestCaseError } from 'eslint-vitest-rule-tester'

import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import rule, {
  MISSED_SPACING_ERROR_ID,
  EXTRA_SPACING_ERROR_ID,
  GROUP_ORDER_ERROR_ID,
  ORDER_ERROR_ID,
} from '../../rules/sort-decorators'
import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import { Alphabet } from '../../utils/alphabet'

describe('sort-decorators', () => {
  let { invalid, valid } = createRuleTester({
    parser: typescriptParser,
    name: 'sort-decorators',
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('sorts decorators', async () => {
      await valid({
        code: dedent`
          @A
          class Class {

            @A
            property

            @A
            accessor field

            @A
            method(
              @A
              parameter) {}

          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          @A
          @B()
          @C
          class Class {

            @A @B() C
            property

            @A @B() C
            accessor field

            @A @B() C
            method(
              @A @B() @C
              parameter) {}

          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          @A @B() @C
          class Class {

            @A @B() @C
            property

            @A @B() @C
            accessor field

            @A @B() @C
            method(
              @A
              @B()
              @C
              parameter) {}

          }
        `,
        code: dedent`
          @A @C @B()
          class Class {

            @A @C @B()
            property

            @A @C @B()
            accessor field

            @A @C @B()
            method(
              @A
              @C
              @B()
              parameter) {}

          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'B', left: 'C' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [options],
      })
    })

    it('preserves decorator documentation comments', async () => {
      await invalid({
        output: dedent`
          /**
           * JSDoc comment that shouldn't move
           */
          /**
           * Comment A
           */
          @A
          @B
          /* Comment C */
          @C
          // Comment D
          @D
          class Class {

            /**
             * JSDoc comment that shouldn't move
             */
            /**
             * Comment A
             */
            @A
            @B
            /* Comment C */
            @C
            // Comment D
            @D
            property

            /**
             * JSDoc comment that shouldn't move
             */
            /**
             * Comment A
             */
            @A
            @B
            /* Comment C */
            @C
            // Comment D
            @D
            accessor field

            /**
             * JSDoc comment that shouldn't move
             */
            /**
             * Comment A
             */
            @A
            @B
            /* Comment C */
            @C
            // Comment D
            @D
            method(
              /**
               * JSDoc comment that shouldn't move
               */
              /**
               * Comment A
               */
              @A
              @B
              /* Comment C */
              @C
              // Comment D
              @D
              parameter) {}

          }
        `,
        code: dedent`
          /**
           * JSDoc comment that shouldn't move
           */
          @B
          /**
           * Comment A
           */
          @A
          // Comment D
          @D
          /* Comment C */
          @C
          class Class {

            /**
             * JSDoc comment that shouldn't move
             */
            @B
            /**
             * Comment A
             */
            @A
            // Comment D
            @D
            /* Comment C */
            @C
            property

            /**
             * JSDoc comment that shouldn't move
             */
            @B
            /**
             * Comment A
             */
            @A
            // Comment D
            @D
            /* Comment C */
            @C
            accessor field

            /**
             * JSDoc comment that shouldn't move
             */
            @B
            /**
             * Comment A
             */
            @A
            // Comment D
            @D
            /* Comment C */
            @C
            method(
              /**
               * JSDoc comment that shouldn't move
               */
              @B
              /**
               * Comment A
               */
              @A
              // Comment D
              @D
              /* Comment C */
              @C
              parameter) {}

          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'A', left: 'B' },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: { right: 'C', left: 'D' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [options],
      })
    })

    it('sorts decorators with inline comments', async () => {
      await invalid({
        output: dedent`
          @A // Comment A
          @B // Comment B
          class Class {

            @A // Comment A
            @B // Comment B
            property

            @A // Comment A
            @B // Comment B
            accessor field

            @A // Comment A
            @B // Comment B
            method(
              @A // Comment A
              @B // Comment B
              parameter) {}

          }
        `,
        code: dedent`
          @B // Comment B
          @A // Comment A
          class Class {

            @B // Comment B
            @A // Comment A
            property

            @B // Comment B
            @A // Comment A
            accessor field

            @B // Comment B
            @A // Comment A
            method(
              @B // Comment B
              @A // Comment A
              parameter) {}

          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'A', left: 'B' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [options],
      })
    })

    it('handles JSDoc comments before decorators correctly', async () => {
      await invalid({
        output: dedent`
          class Class {
            // Should not move
            /**
             * JSDoc comment
             */
            // A
            @A()
            @B()
            foo: number;
          }
        `,
        code: dedent`
          class Class {
            // Should not move
            /**
             * JSDoc comment
             */
            @B()
            // A
            @A()
            foo: number;
          }
        `,
        errors: [
          {
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [options],
      })

      await invalid({
        output: dedent`
          class Class {
            // Should not move
            /**
             * JSDoc comment
             */
            /**
             * A
             */
            @A()
            @B()
            foo: number;
          }
        `,
        code: dedent`
          class Class {
            // Should not move
            /**
             * JSDoc comment
             */
            @B()
            /**
             * A
             */
            @A()
            foo: number;
          }
        `,
        errors: [
          {
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [options],
      })

      await invalid({
        output: dedent`
          class Class {
            // Shouldn't move
            /** JSDoc comment */
            @A()
            @B()
            foo: number;
          }
        `,
        code: dedent`
          class Class {
            // Shouldn't move
            /** JSDoc comment */
            @B()
            @A()
            foo: number;
          }
        `,
        errors: [
          {
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [options],
      })

      await invalid({
        output: dedent`
          class Class {
            // Not aJSDoc comment
            @A()
            @B()
            foo: number;
          }
        `,
        code: dedent`
          class Class {
            @B()
            // Not aJSDoc comment
            @A()
            foo: number;
          }
        `,
        errors: [
          {
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [options],
      })
    })

    it('allows overriding options in groups', async () => {
      await invalid({
        output: dedent`
          @B

          @A
          class Class {

            @B

            @A
            property

            @B

            @A
            accessor field

            @B

            @A
            method(
              @B

              @A
              parameter) {}

          }
        `,
        code: dedent`
          @A
          @B
          class Class {

            @A
            @B
            property

            @A
            @B
            accessor field

            @A
            @B
            method(
              @A
              @B
              parameter) {}

          }
        `,
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
        errors: duplicate5Times([
          {
            data: { right: 'B', left: 'A' },
            messageId: ORDER_ERROR_ID,
          },
          {
            messageId: MISSED_SPACING_ERROR_ID,
            data: { right: 'B', left: 'A' },
          },
        ]),
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
          output: dedent`
            @HelloDecorator
            @A
            @B
            class Class {

              @HelloDecorator
              @A
              @B
              property

              @HelloDecorator
              @A
              @B
              accessor field

              @HelloDecorator
              @A
              @B
              method(
                @HelloDecorator
                @A
                @B
                parameter) {}

            }
          `,
          code: dedent`
            @A
            @B
            @HelloDecorator
            class Class {

              @A
              @B
              @HelloDecorator
              property

              @A
              @B
              @HelloDecorator
              accessor field

              @A
              @B
              @HelloDecorator
              method(
                @A
                @B
                @HelloDecorator
                parameter) {}

            }
          `,
          errors: duplicate5Times([
            {
              data: {
                rightGroup: 'decoratorsContainingHello',
                right: 'HelloDecorator',
                leftGroup: 'unknown',
                left: 'B',
              },
              messageId: GROUP_ORDER_ERROR_ID,
            },
          ]),
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
            messageId: GROUP_ORDER_ERROR_ID,
          },
          {
            data: {
              rightGroup: 'reversedContainingFooByLineLength',
              leftGroup: 'unknown',
              right: 'bbFoo',
              left: 'oo',
            },
            messageId: GROUP_ORDER_ERROR_ID,
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
          @bbFoo
          @aFoo
          @oo
          @p
          class Class {}
        `,
        code: dedent`
          @p
          @aFoo
          @oo
          @bbFoo
          class Class {}
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
        output: dedent`
          @fooBar
          @fooZar
          class Class {

            @fooBar
            @fooZar
            property

            @fooBar
            @fooZar
            accessor field

            @fooBar
            @fooZar
            method(
              @fooBar
              @fooZar
              parameter) {}

          }
        `,
        code: dedent`
          @fooZar
          @fooBar
          class Class {

            @fooZar
            @fooBar
            property

            @fooZar
            @fooBar
            accessor field

            @fooZar
            @fooBar
            method(
              @fooZar
              @fooBar
              parameter) {}

          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'fooBar', left: 'fooZar' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
      })
    })

    it('preserves original order for unsorted groups', async () => {
      await invalid({
        output: dedent`
          @bFoo
          @aFoo
          @dFoo
          @eFoo
          @cFoo
          @m
          class Class {

            @bFoo
            @aFoo
            @dFoo
            @eFoo
            @cFoo
            @m
            property

            @bFoo
            @aFoo
            @dFoo
            @eFoo
            @cFoo
            @m
            accessor field

            @bFoo
            @aFoo
            @dFoo
            @eFoo
            @cFoo
            @m
            method(
              @bFoo
              @aFoo
              @dFoo
              @eFoo
              @cFoo
              @m
              parameter) {}

          }
        `,
        code: dedent`
          @bFoo
          @aFoo
          @dFoo
          @eFoo
          @m
          @cFoo
          class Class {

            @bFoo
            @aFoo
            @dFoo
            @eFoo
            @m
            @cFoo
            property

            @bFoo
            @aFoo
            @dFoo
            @eFoo
            @m
            @cFoo
            accessor field

            @bFoo
            @aFoo
            @dFoo
            @eFoo
            @m
            @cFoo
            method(
              @bFoo
              @aFoo
              @dFoo
              @eFoo
              @m
              @cFoo
              parameter) {}

          }
        `,
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
        errors: duplicate5Times([
          {
            data: {
              rightGroup: 'unsortedContainingFoo',
              leftGroup: 'unknown',
              right: 'cFoo',
              left: 'm',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ]),
      })
    })

    it('supports negative regex patterns in custom groups', async () => {
      await valid({
        code: dedent`
          @iHaveFooInMyName
          @meTooIHaveFoo
          @a
          @b
          class Class {

            @iHaveFooInMyName
            @meTooIHaveFoo
            @a
            @b
            property

            @iHaveFooInMyName
            @meTooIHaveFoo
            @a
            @b
            accessor field

            @iHaveFooInMyName
            @meTooIHaveFoo
            @a
            @b
            method(
              @iHaveFooInMyName
              @meTooIHaveFoo
              @a
              @b
              parameter) {}

          }
        `,
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
      })
    })

    it('removes newlines between groups when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            messageId: EXTRA_SPACING_ERROR_ID,
            data: { right: 'y', left: 'a' },
          },
          {
            data: { right: 'b', left: 'z' },
            messageId: ORDER_ERROR_ID,
          },
          {
            messageId: EXTRA_SPACING_ERROR_ID,
            data: { right: 'b', left: 'z' },
          },
        ],
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'a',
                groupName: 'a',
              },
            ],
            groups: ['a', 'unknown'],
            newlinesBetween: 0,
          },
        ],
        code: dedent`
            @a


           @y
          @z

              @b
          class Class {}
        `,
        output: dedent`
            @a
           @b
          @y
              @z
          class Class {}
        `,
      })
    })

    it('adds newlines between groups when newlinesBetween is 1', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'a',
                groupName: 'a',
              },
              {
                elementNamePattern: 'b',
                groupName: 'b',
              },
            ],
            groups: ['a', 'unknown', 'b'],
            newlinesBetween: 1,
          },
        ],
        errors: [
          {
            messageId: EXTRA_SPACING_ERROR_ID,
            data: { right: 'z', left: 'a' },
          },
          {
            data: { right: 'y', left: 'z' },
            messageId: ORDER_ERROR_ID,
          },
          {
            messageId: MISSED_SPACING_ERROR_ID,
            data: { right: 'b', left: 'y' },
          },
        ],
        output: dedent`
            @a

           @y
          @z

              @b
          class Class {}
        `,
        code: dedent`
            @a


           @z
          @y
              @b
          class Class {}
        `,
      })
    })

    it('applies inline newline settings between specific groups', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              { elementNamePattern: 'a', groupName: 'a' },
              { elementNamePattern: 'b', groupName: 'b' },
              { elementNamePattern: 'c', groupName: 'c' },
              { elementNamePattern: 'd', groupName: 'd' },
              { elementNamePattern: 'e', groupName: 'e' },
            ],
            groups: [
              'a',
              { newlinesBetween: 1 },
              'b',
              { newlinesBetween: 1 },
              'c',
              { newlinesBetween: 0 },
              'd',
              { newlinesBetween: 'ignore' },
              'e',
            ],
            newlinesBetween: 1,
          },
        ],
        errors: [
          {
            messageId: MISSED_SPACING_ERROR_ID,
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: EXTRA_SPACING_ERROR_ID,
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: EXTRA_SPACING_ERROR_ID,
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          @a

          @b

          @c
          @d


          @e
          class Class {}
        `,
        code: dedent`
          @a
          @b


          @c

          @d


          @e
          class Class {}
        `,
      })
    })

    it.each([
      [2, 0],
      [2, 'ignore'],
      [0, 2],
      ['ignore', 2],
    ])(
      'enforces 2 newlines when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              messageId: MISSED_SPACING_ERROR_ID,
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            @a


            @b
            class Class {}
          `,
          code: dedent`
            @a
            @b
            class Class {}
          `,
        })
      },
    )

    it.each([1, 2, 'ignore', 0])(
      'removes newlines when 0 overrides global %s between specific groups',
      async globalNewlinesBetween => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { elementNamePattern: 'c', groupName: 'c' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                { newlinesBetween: 0 },
                'unusedGroup',
                { newlinesBetween: 0 },
                'b',
                { newlinesBetween: 1 },
                'c',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              messageId: EXTRA_SPACING_ERROR_ID,
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            @a
            @b
            class Class {}
          `,
          code: dedent`
            @a

            @b
            class Class {}
          `,
        })
      },
    )

    it.each([
      ['ignore', 0],
      [0, 'ignore'],
    ])(
      'accepts any spacing when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await valid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            @a

            @b
            class Class {}
          `,
        })

        await valid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            @a
            @b
            class Class {}
          `,
        })
      },
    )

    it('preserves inline comments when reordering elements', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                elementNamePattern: 'b|c',
                groupName: 'b|c',
              },
            ],
            groups: ['unknown', 'b|c'],
            newlinesBetween: 1,
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unknown',
              leftGroup: 'b|c',
              right: 'a',
              left: 'b',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          @a // Comment after

          @b
          @c
          class Class {}
        `,
        code: dedent`
          @b
          @a // Comment after

          @c
          class Class {}
        `,
      })
    })

    it('preserves partition boundaries regardless of newlinesBetween 0', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'a',
                groupName: 'a',
              },
            ],
            groups: ['a', 'unknown'],
            partitionByComment: true,
            newlinesBetween: 0,
          },
        ],
        errors: [
          {
            data: { right: 'b', left: 'c' },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          @a

          // Partition comment

          @b
          @c
          class Class {}
        `,
        code: dedent`
          @a

          // Partition comment

          @c
          @b
          class Class {}
        `,
      })
    })

    it('allows to use newlinesInside: 1', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                elementNamePattern: '.*',
                groupName: 'group1',
                newlinesInside: 1,
              },
            ],
            groups: ['group1'],
          },
        ],
        errors: [
          {
            messageId: MISSED_SPACING_ERROR_ID,
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          @a

          @b
          class Class {}
        `,
        code: dedent`
          @a
          @b
          class Class {}
        `,
      })
    })

    it('allows to use newlinesInside: 0', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                elementNamePattern: '.*',
                groupName: 'group1',
                newlinesInside: 0,
              },
            ],
            type: 'alphabetical',
            groups: ['group1'],
          },
        ],
        errors: [
          {
            messageId: EXTRA_SPACING_ERROR_ID,
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          @a
          @b
          class Class {}
        `,
        code: dedent`
          @a

          @b
          class Class {}
        `,
      })
    })

    it('sorts within newline-separated partitions', async () => {
      await invalid({
        output: dedent`
          @a
          @d

          @c

          @b
          @e
          class Class {

            @a
            @d

            @c

            @b
            @e
            property

            @a
            @d

            @c

            @b
            @e
            accessor field

            @a
            @d

            @c

            @b
            @e
            method(
              @a
              @d

              @c

              @b
              @e
              parameter) {}

          }
        `,
        code: dedent`
          @d
          @a

          @c

          @e
          @b
          class Class {

            @d
            @a

            @c

            @e
            @b
            property

            @d
            @a

            @c

            @e
            @b
            accessor field

            @d
            @a

            @c

            @e
            @b
            method(
              @d
              @a

              @c

              @e
              @b
              parameter) {}

          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'a', left: 'd' },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: { right: 'b', left: 'e' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [
          {
            partitionByNewLine: true,
            type: 'alphabetical',
          },
        ],
      })
    })

    it('sorts decorators within partition comment boundaries', async () => {
      await invalid({
        output: dedent`
          // Part: A
          // Not partition comment
          @Bbb
          @Cc
          @D
          // Part: B
          @Aaaa
          @E
          // Part: C
          // Not partition comment
          @Fff
          @Gg()
          class Class {

            // Part: A
            // Not partition comment
            @Bbb
            @Cc
            @D
            // Part: B
            @Aaaa
            @E
            // Part: C
            // Not partition comment
            @Fff
            @Gg()
            property

            // Part: A
            // Not partition comment
            @Bbb
            @Cc
            @D
            // Part: B
            @Aaaa
            @E
            // Part: C
            // Not partition comment
            @Fff
            @Gg()
            accessor field

            // Part: A
            // Not partition comment
            @Bbb
            @Cc
            @D
            // Part: B
            @Aaaa
            @E
            // Part: C
            // Not partition comment
            @Fff
            @Gg()
            method(
              // Part: A
              // Not partition comment
              @Bbb
              @Cc
              @D
              // Part: B
              @Aaaa
              @E
              // Part: C
              // Not partition comment
              @Fff
              @Gg()
              parameter) {}

          }
        `,
        code: dedent`
          // Part: A
          @Cc
          @D
          // Not partition comment
          @Bbb
          // Part: B
          @Aaaa
          @E
          // Part: C
          @Gg()
          // Not partition comment
          @Fff
          class Class {

            // Part: A
            @Cc
            @D
            // Not partition comment
            @Bbb
            // Part: B
            @Aaaa
            @E
            // Part: C
            @Gg()
            // Not partition comment
            @Fff
            property

            // Part: A
            @Cc
            @D
            // Not partition comment
            @Bbb
            // Part: B
            @Aaaa
            @E
            // Part: C
            @Gg()
            // Not partition comment
            @Fff
            accessor field

            // Part: A
            @Cc
            @D
            // Not partition comment
            @Bbb
            // Part: B
            @Aaaa
            @E
            // Part: C
            @Gg()
            // Not partition comment
            @Fff
            method(
              // Part: A
              @Cc
              @D
              // Not partition comment
              @Bbb
              // Part: B
              @Aaaa
              @E
              // Part: C
              @Gg()
              // Not partition comment
              @Fff
              parameter) {}

          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'Bbb', left: 'D' },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: { right: 'Fff', left: 'Gg' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('treats all comments as partition boundaries', async () => {
      await valid({
        code: dedent`
          // Comment
          @bb
          // Other comment
          @a
          class Class {

            // Comment
            @bb
            // Other comment
            @a
            property

            // Comment
            @bb
            // Other comment
            @a
            accessor field

            // Comment
            @bb
            // Other comment
            @a
            method(
              // Comment
              @bb
              // Other comment
              @a
              parameter) {}

          }
        `,
        options: [
          {
            ...options,
            partitionByComment: true,
          },
        ],
      })
    })

    it('supports multiple partition comment patterns', async () => {
      await invalid({
        output: dedent`
          /* Partition Comment */
          // Part: A
          @D
          // Part: B
          @Aaa
          @Bb
          @C
          /* Other */
          @E
          class Class {

            /* Partition Comment */
            // Part: A
            @D
            // Part: B
            @Aaa
            @Bb
            @C
            /* Other */
            @E
            property

            /* Partition Comment */
            // Part: A
            @D
            // Part: B
            @Aaa
            @Bb
            @C
            /* Other */
            @E
            accessor field

            /* Partition Comment */
            // Part: A
            @D
            // Part: B
            @Aaa
            @Bb
            @C
            /* Other */
            @E
            method(
              /* Partition Comment */
              // Part: A
              @D
              // Part: B
              @Aaa
              @Bb
              @C
              /* Other */
              @E
              parameter) {}

          }
        `,
        code: dedent`
          /* Partition Comment */
          // Part: A
          @D
          // Part: B
          @Aaa
          @C
          @Bb
          /* Other */
          @E
          class Class {

            /* Partition Comment */
            // Part: A
            @D
            // Part: B
            @Aaa
            @C
            @Bb
            /* Other */
            @E
            property

            /* Partition Comment */
            // Part: A
            @D
            // Part: B
            @Aaa
            @C
            @Bb
            /* Other */
            @E
            accessor field

            /* Partition Comment */
            // Part: A
            @D
            // Part: B
            @Aaa
            @C
            @Bb
            /* Other */
            @E
            method(
              /* Partition Comment */
              // Part: A
              @D
              // Part: B
              @Aaa
              @C
              @Bb
              /* Other */
              @E
              parameter) {}

          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'Bb', left: 'C' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [
          {
            ...options,
            partitionByComment: ['Partition Comment', 'Part:', 'Other'],
          },
        ],
      })
    })

    it('supports regex patterns for partition comments', async () => {
      await valid({
        code: dedent`
          @E
          @F
          // I am a partition comment because I don't have f o o
          @A
          @B
          class Class {

            @E
            @F
            // I am a partition comment because I don't have f o o
            @A
            @B
            property

            @E
            @F
            // I am a partition comment because I don't have f o o
            @A
            @B
            accessor field

            @E
            @F
            // I am a partition comment because I don't have f o o
            @A
            @B
            method(
              @E
              @F
              // I am a partition comment because I don't have f o o
              @A
              @B
              parameter) {}

          }
        `,
        options: [
          {
            ...options,
            partitionByComment: ['^(?!.*foo).*$'],
          },
        ],
      })
    })

    it('ignores block comments when line comments are partition boundaries', async () => {
      await invalid({
        output: dedent`
          /* Comment */
          @A
          @B
          class Class {

            /* Comment */
            @A
            @B
            property

            /* Comment */
            @A
            @B
            accessor field

            /* Comment */
            @A
            @B
            method(
              /* Comment */
              @A
              @B
              parameter) {}
          }
        `,
        code: dedent`
          @B
          /* Comment */
          @A
          class Class {

            @B
            /* Comment */
            @A
            property

            @B
            /* Comment */
            @A
            accessor field

            @B
            /* Comment */
            @A
            method(
              @B
              /* Comment */
              @A
              parameter) {}
          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'A', left: 'B' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
      })
    })

    it('uses line comments as partition boundaries', async () => {
      await valid({
        code: dedent`
          @B
          // Comment
          @A
          class Class {

            @B
            // Comment
            @A
            property

            @B
            // Comment
            @A
            accessor field

            @B
            // Comment
            @A
            method(
              @B
              // Comment
              @A
              parameter) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
      })
    })

    it('matches specific line comment patterns', async () => {
      await valid({
        code: dedent`
          @C
          // B
          @B
          // A
          @A
          class Class {

            @C
            // B
            @B
            // A
            @A
            property

            @C
            // B
            @B
            // A
            @A
            accessor field

            @C
            // B
            @B
            // A
            @A
            method(
              @C
              // B
              @B
              // A
              @A
              parameter) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['A', 'B'],
            },
          },
        ],
      })
    })

    it('supports regex patterns for line comment partitions', async () => {
      await valid({
        code: dedent`
          @B
          // I am a partition comment because I don't have f o o
          @A
          class Class {

            @B
            // I am a partition comment because I don't have f o o
            @A
            property

            @B
            // I am a partition comment because I don't have f o o
            @A
            accessor field

            @B
            // I am a partition comment because I don't have f o o
            @A
            method(
              @B
              // I am a partition comment because I don't have f o o
              @A
              parameter) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['^(?!.*foo).*$'],
            },
          },
        ],
      })
    })

    it('ignores line comments when block comments are partition boundaries', async () => {
      await invalid({
        output: dedent`
          // Comment
          @A
          @B
          class Class {

            // Comment
            @A
            @B
            property

            // Comment
            @A
            @B
            accessor field

            // Comment
            @A
            @B
            method(
              // Comment
              @A
              @B
              parameter) {}
          }
        `,
        code: dedent`
          @B
          // Comment
          @A
          class Class {

            @B
            // Comment
            @A
            property

            @B
            // Comment
            @A
            accessor field

            @B
            // Comment
            @A
            method(
              @B
              // Comment
              @A
              parameter) {}
          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'A', left: 'B' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
      })
    })

    it('uses block comments as partition boundaries', async () => {
      await valid({
        code: dedent`
          @B
          /* Comment */
          @A
          class Class {

            @B
            /* Comment */
            @A
            property

            @B
            /* Comment */
            @A
            accessor field

            @B
            /* Comment */
            @A
            method(
              @B
              /* Comment */
              @A
              parameter) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        code: dedent`
          @C
          /* B */
          @B
          /* A */
          @A
          class Class {

            @C
            /* B */
            @B
            /* A */
            @A
            property

            @C
            /* B */
            @B
            /* A */
            @A
            accessor field

            @C
            /* B */
            @B
            /* A */
            @A
            method(
              @C
              /* B */
              @B
              /* A */
              @A
              parameter) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['A', 'B'],
            },
          },
        ],
      })
    })

    it('supports regex patterns for block comment partitions', async () => {
      await valid({
        code: dedent`
          @B
          /* I am a partition comment because I don't have f o o */
          @A
          class Class {

            @B
            /* I am a partition comment because I don't have f o o */
            @A
            property

            @B
            /* I am a partition comment because I don't have f o o */
            @A
            accessor field

            @B
            /* I am a partition comment because I don't have f o o */
            @A
            method(
              @B
              /* I am a partition comment because I don't have f o o */
              @A
              parameter) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['^(?!.*foo).*$'],
            },
          },
        ],
      })
    })

    it('sorts decorators with special character trimming', async () => {
      await valid({
        code: dedent`

          @_A
          @B
          @_C
          class Class {

            @_A
            @B
            @_C
            property

            @_A
            @B
            @_C
            accessor field

            @_A
            @B
            @_C
            method(
              @_A
              @B
              @_C
              parameter) {}

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

    it('sorts decorators with special character removal', async () => {
      await valid({
        code: dedent`

          @AB
          @A_C
          class Class {

            @AB
            @A_C
            property

            @AB
            @A_C
            accessor field

            @AB
            @A_C
            method(
              @AB
              @A_C
              parameter) {}

          }
        `,
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
      })
    })

    it('sorts decorators according to locale-specific rules', async () => {
      await valid({
        code: dedent`

          @你好
          @世界
          @a
          @A
          @b
          @B
          class Class {

            @你好
            @世界
            @a
            @A
            @b
            @B
            property

            @你好
            @世界
            @a
            @A
            @b
            @B
            accessor field

            @你好
            @世界
            @a
            @A
            @b
            @B
            method(
              @你好
              @世界
              @a
              @A
              @b
              @B
              parameter) {}

          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it('sorts decorators', async () => {
      await valid({
        code: dedent`
          @A
          class Class {

            @A
            property

            @A
            accessor field

            @A
            method(
              @A
              parameter) {}

          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          @A
          @B()
          @C
          class Class {

            @A @B() C
            property

            @A @B() C
            accessor field

            @A @B() C
            method(
              @A @B() @C
              parameter) {}

          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          @A @B() @C
          class Class {

            @A @B() @C
            property

            @A @B() @C
            accessor field

            @A @B() @C
            method(
              @A
              @B()
              @C
              parameter) {}

          }
        `,
        code: dedent`
          @A @C @B()
          class Class {

            @A @C @B()
            property

            @A @C @B()
            accessor field

            @A @C @B()
            method(
              @A
              @C
              @B()
              parameter) {}

          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'B', left: 'C' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [options],
      })
    })

    it('preserves decorator documentation comments', async () => {
      await invalid({
        output: dedent`
          /**
           * JSDoc comment that shouldn't move
           */
          /**
           * Comment A
           */
          @A
          @B
          /* Comment C */
          @C
          // Comment D
          @D
          class Class {

            /**
             * JSDoc comment that shouldn't move
             */
            /**
             * Comment A
             */
            @A
            @B
            /* Comment C */
            @C
            // Comment D
            @D
            property

            /**
             * JSDoc comment that shouldn't move
             */
            /**
             * Comment A
             */
            @A
            @B
            /* Comment C */
            @C
            // Comment D
            @D
            accessor field

            /**
             * JSDoc comment that shouldn't move
             */
            /**
             * Comment A
             */
            @A
            @B
            /* Comment C */
            @C
            // Comment D
            @D
            method(
              /**
               * JSDoc comment that shouldn't move
               */
              /**
               * Comment A
               */
              @A
              @B
              /* Comment C */
              @C
              // Comment D
              @D
              parameter) {}

          }
        `,
        code: dedent`
          /**
           * JSDoc comment that shouldn't move
           */
          @B
          /**
           * Comment A
           */
          @A
          // Comment D
          @D
          /* Comment C */
          @C
          class Class {

            /**
             * JSDoc comment that shouldn't move
             */
            @B
            /**
             * Comment A
             */
            @A
            // Comment D
            @D
            /* Comment C */
            @C
            property

            /**
             * JSDoc comment that shouldn't move
             */
            @B
            /**
             * Comment A
             */
            @A
            // Comment D
            @D
            /* Comment C */
            @C
            accessor field

            /**
             * JSDoc comment that shouldn't move
             */
            @B
            /**
             * Comment A
             */
            @A
            // Comment D
            @D
            /* Comment C */
            @C
            method(
              /**
               * JSDoc comment that shouldn't move
               */
              @B
              /**
               * Comment A
               */
              @A
              // Comment D
              @D
              /* Comment C */
              @C
              parameter) {}

          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'A', left: 'B' },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: { right: 'C', left: 'D' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [options],
      })
    })

    it('sorts decorators with inline comments', async () => {
      await invalid({
        output: dedent`
          @A // Comment A
          @B // Comment B
          class Class {

            @A // Comment A
            @B // Comment B
            property

            @A // Comment A
            @B // Comment B
            accessor field

            @A // Comment A
            @B // Comment B
            method(
              @A // Comment A
              @B // Comment B
              parameter) {}

          }
        `,
        code: dedent`
          @B // Comment B
          @A // Comment A
          class Class {

            @B // Comment B
            @A // Comment A
            property

            @B // Comment B
            @A // Comment A
            accessor field

            @B // Comment B
            @A // Comment A
            method(
              @B // Comment B
              @A // Comment A
              parameter) {}

          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'A', left: 'B' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [options],
      })
    })

    it('handles JSDoc comments before decorators correctly', async () => {
      await invalid({
        output: dedent`
          class Class {
            // Should not move
            /**
             * JSDoc comment
             */
            // A
            @A()
            @B()
            foo: number;
          }
        `,
        code: dedent`
          class Class {
            // Should not move
            /**
             * JSDoc comment
             */
            @B()
            // A
            @A()
            foo: number;
          }
        `,
        errors: [
          {
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [options],
      })

      await invalid({
        output: dedent`
          class Class {
            // Should not move
            /**
             * JSDoc comment
             */
            /**
             * A
             */
            @A()
            @B()
            foo: number;
          }
        `,
        code: dedent`
          class Class {
            // Should not move
            /**
             * JSDoc comment
             */
            @B()
            /**
             * A
             */
            @A()
            foo: number;
          }
        `,
        errors: [
          {
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [options],
      })

      await invalid({
        output: dedent`
          class Class {
            // Shouldn't move
            /** JSDoc comment */
            @A()
            @B()
            foo: number;
          }
        `,
        code: dedent`
          class Class {
            // Shouldn't move
            /** JSDoc comment */
            @B()
            @A()
            foo: number;
          }
        `,
        errors: [
          {
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [options],
      })

      await invalid({
        output: dedent`
          class Class {
            // Not aJSDoc comment
            @A()
            @B()
            foo: number;
          }
        `,
        code: dedent`
          class Class {
            @B()
            // Not aJSDoc comment
            @A()
            foo: number;
          }
        `,
        errors: [
          {
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [options],
      })
    })

    it('sorts decorators within partition comment boundaries', async () => {
      await invalid({
        output: dedent`
          // Part: A
          // Not partition comment
          @Bbb
          @Cc
          @D
          // Part: B
          @Aaaa
          @E
          // Part: C
          // Not partition comment
          @Fff
          @Gg()
          class Class {

            // Part: A
            // Not partition comment
            @Bbb
            @Cc
            @D
            // Part: B
            @Aaaa
            @E
            // Part: C
            // Not partition comment
            @Fff
            @Gg()
            property

            // Part: A
            // Not partition comment
            @Bbb
            @Cc
            @D
            // Part: B
            @Aaaa
            @E
            // Part: C
            // Not partition comment
            @Fff
            @Gg()
            accessor field

            // Part: A
            // Not partition comment
            @Bbb
            @Cc
            @D
            // Part: B
            @Aaaa
            @E
            // Part: C
            // Not partition comment
            @Fff
            @Gg()
            method(
              // Part: A
              // Not partition comment
              @Bbb
              @Cc
              @D
              // Part: B
              @Aaaa
              @E
              // Part: C
              // Not partition comment
              @Fff
              @Gg()
              parameter) {}

          }
        `,
        code: dedent`
          // Part: A
          @Cc
          @D
          // Not partition comment
          @Bbb
          // Part: B
          @Aaaa
          @E
          // Part: C
          @Gg()
          // Not partition comment
          @Fff
          class Class {

            // Part: A
            @Cc
            @D
            // Not partition comment
            @Bbb
            // Part: B
            @Aaaa
            @E
            // Part: C
            @Gg()
            // Not partition comment
            @Fff
            property

            // Part: A
            @Cc
            @D
            // Not partition comment
            @Bbb
            // Part: B
            @Aaaa
            @E
            // Part: C
            @Gg()
            // Not partition comment
            @Fff
            accessor field

            // Part: A
            @Cc
            @D
            // Not partition comment
            @Bbb
            // Part: B
            @Aaaa
            @E
            // Part: C
            @Gg()
            // Not partition comment
            @Fff
            method(
              // Part: A
              @Cc
              @D
              // Not partition comment
              @Bbb
              // Part: B
              @Aaaa
              @E
              // Part: C
              @Gg()
              // Not partition comment
              @Fff
              parameter) {}

          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'Bbb', left: 'D' },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: { right: 'Fff', left: 'Gg' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('treats all comments as partition boundaries', async () => {
      await valid({
        code: dedent`
          // Comment
          @bb
          // Other comment
          @a
          class Class {

            // Comment
            @bb
            // Other comment
            @a
            property

            // Comment
            @bb
            // Other comment
            @a
            accessor field

            // Comment
            @bb
            // Other comment
            @a
            method(
              // Comment
              @bb
              // Other comment
              @a
              parameter) {}

          }
        `,
        options: [
          {
            ...options,
            partitionByComment: true,
          },
        ],
      })
    })

    it('supports multiple partition comment patterns', async () => {
      await invalid({
        output: dedent`
          /* Partition Comment */
          // Part: A
          @D
          // Part: B
          @Aaa
          @Bb
          @C
          /* Other */
          @E
          class Class {

            /* Partition Comment */
            // Part: A
            @D
            // Part: B
            @Aaa
            @Bb
            @C
            /* Other */
            @E
            property

            /* Partition Comment */
            // Part: A
            @D
            // Part: B
            @Aaa
            @Bb
            @C
            /* Other */
            @E
            accessor field

            /* Partition Comment */
            // Part: A
            @D
            // Part: B
            @Aaa
            @Bb
            @C
            /* Other */
            @E
            method(
              /* Partition Comment */
              // Part: A
              @D
              // Part: B
              @Aaa
              @Bb
              @C
              /* Other */
              @E
              parameter) {}

          }
        `,
        code: dedent`
          /* Partition Comment */
          // Part: A
          @D
          // Part: B
          @Aaa
          @C
          @Bb
          /* Other */
          @E
          class Class {

            /* Partition Comment */
            // Part: A
            @D
            // Part: B
            @Aaa
            @C
            @Bb
            /* Other */
            @E
            property

            /* Partition Comment */
            // Part: A
            @D
            // Part: B
            @Aaa
            @C
            @Bb
            /* Other */
            @E
            accessor field

            /* Partition Comment */
            // Part: A
            @D
            // Part: B
            @Aaa
            @C
            @Bb
            /* Other */
            @E
            method(
              /* Partition Comment */
              // Part: A
              @D
              // Part: B
              @Aaa
              @C
              @Bb
              /* Other */
              @E
              parameter) {}

          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'Bb', left: 'C' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [
          {
            ...options,
            partitionByComment: ['Partition Comment', 'Part:', 'Other'],
          },
        ],
      })
    })

    it('supports regex patterns for partition comments', async () => {
      await valid({
        code: dedent`
          @E
          @F
          // I am a partition comment because I don't have f o o
          @A
          @B
          class Class {

            @E
            @F
            // I am a partition comment because I don't have f o o
            @A
            @B
            property

            @E
            @F
            // I am a partition comment because I don't have f o o
            @A
            @B
            accessor field

            @E
            @F
            // I am a partition comment because I don't have f o o
            @A
            @B
            method(
              @E
              @F
              // I am a partition comment because I don't have f o o
              @A
              @B
              parameter) {}

          }
        `,
        options: [
          {
            ...options,
            partitionByComment: ['^(?!.*foo).*$'],
          },
        ],
      })
    })

    it('ignores block comments when line comments are partition boundaries', async () => {
      await invalid({
        output: dedent`
          /* Comment */
          @A
          @B
          class Class {

            /* Comment */
            @A
            @B
            property

            /* Comment */
            @A
            @B
            accessor field

            /* Comment */
            @A
            @B
            method(
              /* Comment */
              @A
              @B
              parameter) {}
          }
        `,
        code: dedent`
          @B
          /* Comment */
          @A
          class Class {

            @B
            /* Comment */
            @A
            property

            @B
            /* Comment */
            @A
            accessor field

            @B
            /* Comment */
            @A
            method(
              @B
              /* Comment */
              @A
              parameter) {}
          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'A', left: 'B' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
      })
    })

    it('uses line comments as partition boundaries', async () => {
      await valid({
        code: dedent`
          @B
          // Comment
          @A
          class Class {

            @B
            // Comment
            @A
            property

            @B
            // Comment
            @A
            accessor field

            @B
            // Comment
            @A
            method(
              @B
              // Comment
              @A
              parameter) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
      })
    })

    it('matches specific line comment patterns', async () => {
      await valid({
        code: dedent`
          @C
          // B
          @B
          // A
          @A
          class Class {

            @C
            // B
            @B
            // A
            @A
            property

            @C
            // B
            @B
            // A
            @A
            accessor field

            @C
            // B
            @B
            // A
            @A
            method(
              @C
              // B
              @B
              // A
              @A
              parameter) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['A', 'B'],
            },
          },
        ],
      })
    })

    it('supports regex patterns for line comment partitions', async () => {
      await valid({
        code: dedent`
          @B
          // I am a partition comment because I don't have f o o
          @A
          class Class {

            @B
            // I am a partition comment because I don't have f o o
            @A
            property

            @B
            // I am a partition comment because I don't have f o o
            @A
            accessor field

            @B
            // I am a partition comment because I don't have f o o
            @A
            method(
              @B
              // I am a partition comment because I don't have f o o
              @A
              parameter) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['^(?!.*foo).*$'],
            },
          },
        ],
      })
    })

    it('ignores line comments when block comments are partition boundaries', async () => {
      await invalid({
        output: dedent`
          // Comment
          @A
          @B
          class Class {

            // Comment
            @A
            @B
            property

            // Comment
            @A
            @B
            accessor field

            // Comment
            @A
            @B
            method(
              // Comment
              @A
              @B
              parameter) {}
          }
        `,
        code: dedent`
          @B
          // Comment
          @A
          class Class {

            @B
            // Comment
            @A
            property

            @B
            // Comment
            @A
            accessor field

            @B
            // Comment
            @A
            method(
              @B
              // Comment
              @A
              parameter) {}
          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'A', left: 'B' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
      })
    })

    it('uses block comments as partition boundaries', async () => {
      await valid({
        code: dedent`
          @B
          /* Comment */
          @A
          class Class {

            @B
            /* Comment */
            @A
            property

            @B
            /* Comment */
            @A
            accessor field

            @B
            /* Comment */
            @A
            method(
              @B
              /* Comment */
              @A
              parameter) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        code: dedent`
          @C
          /* B */
          @B
          /* A */
          @A
          class Class {

            @C
            /* B */
            @B
            /* A */
            @A
            property

            @C
            /* B */
            @B
            /* A */
            @A
            accessor field

            @C
            /* B */
            @B
            /* A */
            @A
            method(
              @C
              /* B */
              @B
              /* A */
              @A
              parameter) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['A', 'B'],
            },
          },
        ],
      })
    })

    it('supports regex patterns for block comment partitions', async () => {
      await valid({
        code: dedent`
          @B
          /* I am a partition comment because I don't have f o o */
          @A
          class Class {

            @B
            /* I am a partition comment because I don't have f o o */
            @A
            property

            @B
            /* I am a partition comment because I don't have f o o */
            @A
            accessor field

            @B
            /* I am a partition comment because I don't have f o o */
            @A
            method(
              @B
              /* I am a partition comment because I don't have f o o */
              @A
              parameter) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['^(?!.*foo).*$'],
            },
          },
        ],
      })
    })

    it('sorts decorators with special character trimming', async () => {
      await valid({
        code: dedent`

          @_A
          @B
          @_C
          class Class {

            @_A
            @B
            @_C
            property

            @_A
            @B
            @_C
            accessor field

            @_A
            @B
            @_C
            method(
              @_A
              @B
              @_C
              parameter) {}

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

    it('sorts decorators with special character removal', async () => {
      await valid({
        code: dedent`

          @AB
          @A_C
          class Class {

            @AB
            @A_C
            property

            @AB
            @A_C
            accessor field

            @AB
            @A_C
            method(
              @AB
              @A_C
              parameter) {}

          }
        `,
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
      })
    })

    it('sorts decorators according to locale-specific rules', async () => {
      await valid({
        code: dedent`

          @你好
          @世界
          @a
          @A
          @b
          @B
          class Class {

            @你好
            @世界
            @a
            @A
            @b
            @B
            property

            @你好
            @世界
            @a
            @A
            @b
            @B
            accessor field

            @你好
            @世界
            @a
            @A
            @b
            @B
            method(
              @你好
              @世界
              @a
              @A
              @b
              @B
              parameter) {}

          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it('sorts decorators', async () => {
      await valid({
        code: dedent`
          @A
          class Class {

            @A
            property

            @A
            accessor field

            @A
            method(
              @A
              parameter) {}

          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          @AAA
          @B()
          @C
          class Class {

            @AAA @B() C
            property

            @AAA @B() C
            accessor field

            @AAA @B() C
            method(
              @AAA @B() @C
              parameter) {}

          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          @AAA @B() @C
          class Class {

            @AAA @B() @C
            property

            @AAA @B() @C
            accessor field

            @AAA @B() @C
            method(
              @AAA
              @B()
              @C
              parameter) {}

          }
        `,
        code: dedent`
          @AAA @C @B()
          class Class {

            @AAA @C @B()
            property

            @AAA @C @B()
            accessor field

            @AAA @C @B()
            method(
              @AAA
              @C
              @B()
              parameter) {}

          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'B', left: 'C' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [options],
      })
    })

    it('preserves decorator documentation comments', async () => {
      await invalid({
        output: dedent`
          /**
           * JSDoc comment that shouldn't move
           */
          /**
           * Comment A
           */
          @AAAA
          @BBB
          /* Comment C */
          @CC
          // Comment D
          @D
          class Class {

            /**
             * JSDoc comment that shouldn't move
             */
            /**
             * Comment A
             */
            @AAAA
            @BBB
            /* Comment C */
            @CC
            // Comment D
            @D
            property

            /**
             * JSDoc comment that shouldn't move
             */
            /**
             * Comment A
             */
            @AAAA
            @BBB
            /* Comment C */
            @CC
            // Comment D
            @D
            accessor field

            /**
             * JSDoc comment that shouldn't move
             */
            /**
             * Comment A
             */
            @AAAA
            @BBB
            /* Comment C */
            @CC
            // Comment D
            @D
            method(
              /**
               * JSDoc comment that shouldn't move
               */
              /**
               * Comment A
               */
              @AAAA
              @BBB
              /* Comment C */
              @CC
              // Comment D
              @D
              parameter) {}

          }
        `,
        code: dedent`
          /**
           * JSDoc comment that shouldn't move
           */
          @BBB
          /**
           * Comment A
           */
          @AAAA
          // Comment D
          @D
          /* Comment C */
          @CC
          class Class {

            /**
             * JSDoc comment that shouldn't move
             */
            @BBB
            /**
             * Comment A
             */
            @AAAA
            // Comment D
            @D
            /* Comment C */
            @CC
            property

            /**
             * JSDoc comment that shouldn't move
             */
            @BBB
            /**
             * Comment A
             */
            @AAAA
            // Comment D
            @D
            /* Comment C */
            @CC
            accessor field

            /**
             * JSDoc comment that shouldn't move
             */
            @BBB
            /**
             * Comment A
             */
            @AAAA
            // Comment D
            @D
            /* Comment C */
            @CC
            method(
              /**
               * JSDoc comment that shouldn't move
               */
              @BBB
              /**
               * Comment A
               */
              @AAAA
              // Comment D
              @D
              /* Comment C */
              @CC
              parameter) {}

          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'AAAA', left: 'BBB' },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: { right: 'CC', left: 'D' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [options],
      })
    })

    it('sorts decorators with inline comments', async () => {
      await invalid({
        output: dedent`
          @AA // Comment A
          @B // Comment B
          class Class {

            @AA // Comment A
            @B // Comment B
            property

            @AA // Comment A
            @B // Comment B
            accessor field

            @AA // Comment A
            @B // Comment B
            method(
              @AA // Comment A
              @B // Comment B
              parameter) {}

          }
        `,
        code: dedent`
          @B // Comment B
          @AA // Comment A
          class Class {

            @B // Comment B
            @AA // Comment A
            property

            @B // Comment B
            @AA // Comment A
            accessor field

            @B // Comment B
            @AA // Comment A
            method(
              @B // Comment B
              @AA // Comment A
              parameter) {}

          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'AA', left: 'B' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [options],
      })
    })

    it('handles JSDoc comments before decorators correctly', async () => {
      await invalid({
        output: dedent`
          class Class {
            // Should not move
            /**
             * JSDoc comment
             */
            // A
            @AA()
            @B()
            foo: number;
          }
        `,
        code: dedent`
          class Class {
            // Should not move
            /**
             * JSDoc comment
             */
            @B()
            // A
            @AA()
            foo: number;
          }
        `,
        errors: [
          {
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [options],
      })

      await invalid({
        output: dedent`
          class Class {
            // Should not move
            /**
             * JSDoc comment
             */
            /**
             * A
             */
            @AA()
            @B()
            foo: number;
          }
        `,
        code: dedent`
          class Class {
            // Should not move
            /**
             * JSDoc comment
             */
            @B()
            /**
             * A
             */
            @AA()
            foo: number;
          }
        `,
        errors: [
          {
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [options],
      })

      await invalid({
        output: dedent`
          class Class {
            // Shouldn't move
            /** JSDoc comment */
            @AA()
            @B()
            foo: number;
          }
        `,
        code: dedent`
          class Class {
            // Shouldn't move
            /** JSDoc comment */
            @B()
            @AA()
            foo: number;
          }
        `,
        errors: [
          {
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [options],
      })

      await invalid({
        output: dedent`
          class Class {
            // Not aJSDoc comment
            @AA()
            @B()
            foo: number;
          }
        `,
        code: dedent`
          class Class {
            @B()
            // Not aJSDoc comment
            @AA()
            foo: number;
          }
        `,
        errors: [
          {
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [options],
      })
    })

    it('sorts decorators within partition comment boundaries', async () => {
      await invalid({
        output: dedent`
          // Part: A
          // Not partition comment
          @Bbb
          @Cc
          @D
          // Part: B
          @Aaaa
          @E
          // Part: C
          // Not partition comment
          @Fffff
          @Gg()
          class Class {

            // Part: A
            // Not partition comment
            @Bbb
            @Cc
            @D
            // Part: B
            @Aaaa
            @E
            // Part: C
            // Not partition comment
            @Fffff
            @Gg()
            property

            // Part: A
            // Not partition comment
            @Bbb
            @Cc
            @D
            // Part: B
            @Aaaa
            @E
            // Part: C
            // Not partition comment
            @Fffff
            @Gg()
            accessor field

            // Part: A
            // Not partition comment
            @Bbb
            @Cc
            @D
            // Part: B
            @Aaaa
            @E
            // Part: C
            // Not partition comment
            @Fffff
            @Gg()
            method(
              // Part: A
              // Not partition comment
              @Bbb
              @Cc
              @D
              // Part: B
              @Aaaa
              @E
              // Part: C
              // Not partition comment
              @Fffff
              @Gg()
              parameter) {}

          }
        `,
        code: dedent`
          // Part: A
          @Cc
          @D
          // Not partition comment
          @Bbb
          // Part: B
          @Aaaa
          @E
          // Part: C
          @Gg()
          // Not partition comment
          @Fffff
          class Class {

            // Part: A
            @Cc
            @D
            // Not partition comment
            @Bbb
            // Part: B
            @Aaaa
            @E
            // Part: C
            @Gg()
            // Not partition comment
            @Fffff
            property

            // Part: A
            @Cc
            @D
            // Not partition comment
            @Bbb
            // Part: B
            @Aaaa
            @E
            // Part: C
            @Gg()
            // Not partition comment
            @Fffff
            accessor field

            // Part: A
            @Cc
            @D
            // Not partition comment
            @Bbb
            // Part: B
            @Aaaa
            @E
            // Part: C
            @Gg()
            // Not partition comment
            @Fffff
            method(
              // Part: A
              @Cc
              @D
              // Not partition comment
              @Bbb
              // Part: B
              @Aaaa
              @E
              // Part: C
              @Gg()
              // Not partition comment
              @Fffff
              parameter) {}

          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'Bbb', left: 'D' },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: { right: 'Fffff', left: 'Gg' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('treats all comments as partition boundaries', async () => {
      await valid({
        code: dedent`
          // Comment
          @bb
          // Other comment
          @a
          class Class {

            // Comment
            @bb
            // Other comment
            @a
            property

            // Comment
            @bb
            // Other comment
            @a
            accessor field

            // Comment
            @bb
            // Other comment
            @a
            method(
              // Comment
              @bb
              // Other comment
              @a
              parameter) {}

          }
        `,
        options: [
          {
            ...options,
            partitionByComment: true,
          },
        ],
      })
    })

    it('supports multiple partition comment patterns', async () => {
      await invalid({
        output: dedent`
          /* Partition Comment */
          // Part: A
          @D
          // Part: B
          @Aaa
          @Bb
          @C
          /* Other */
          @E
          class Class {

            /* Partition Comment */
            // Part: A
            @D
            // Part: B
            @Aaa
            @Bb
            @C
            /* Other */
            @E
            property

            /* Partition Comment */
            // Part: A
            @D
            // Part: B
            @Aaa
            @Bb
            @C
            /* Other */
            @E
            accessor field

            /* Partition Comment */
            // Part: A
            @D
            // Part: B
            @Aaa
            @Bb
            @C
            /* Other */
            @E
            method(
              /* Partition Comment */
              // Part: A
              @D
              // Part: B
              @Aaa
              @Bb
              @C
              /* Other */
              @E
              parameter) {}

          }
        `,
        code: dedent`
          /* Partition Comment */
          // Part: A
          @D
          // Part: B
          @Aaa
          @C
          @Bb
          /* Other */
          @E
          class Class {

            /* Partition Comment */
            // Part: A
            @D
            // Part: B
            @Aaa
            @C
            @Bb
            /* Other */
            @E
            property

            /* Partition Comment */
            // Part: A
            @D
            // Part: B
            @Aaa
            @C
            @Bb
            /* Other */
            @E
            accessor field

            /* Partition Comment */
            // Part: A
            @D
            // Part: B
            @Aaa
            @C
            @Bb
            /* Other */
            @E
            method(
              /* Partition Comment */
              // Part: A
              @D
              // Part: B
              @Aaa
              @C
              @Bb
              /* Other */
              @E
              parameter) {}

          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'Bb', left: 'C' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [
          {
            ...options,
            partitionByComment: ['Partition Comment', 'Part:', 'Other'],
          },
        ],
      })
    })

    it('supports regex patterns for partition comments', async () => {
      await valid({
        code: dedent`
          @E
          @F
          // I am a partition comment because I don't have f o o
          @A
          @B
          class Class {

            @E
            @F
            // I am a partition comment because I don't have f o o
            @A
            @B
            property

            @E
            @F
            // I am a partition comment because I don't have f o o
            @A
            @B
            accessor field

            @E
            @F
            // I am a partition comment because I don't have f o o
            @A
            @B
            method(
              @E
              @F
              // I am a partition comment because I don't have f o o
              @A
              @B
              parameter) {}

          }
        `,
        options: [
          {
            ...options,
            partitionByComment: ['^(?!.*foo).*$'],
          },
        ],
      })
    })

    it('ignores block comments when line comments are partition boundaries', async () => {
      await invalid({
        output: dedent`
          /* Comment */
          @AA
          @B
          class Class {

            /* Comment */
            @AA
            @B
            property

            /* Comment */
            @AA
            @B
            accessor field

            /* Comment */
            @AA
            @B
            method(
              /* Comment */
              @AA
              @B
              parameter) {}
          }
        `,
        code: dedent`
          @B
          /* Comment */
          @AA
          class Class {

            @B
            /* Comment */
            @AA
            property

            @B
            /* Comment */
            @AA
            accessor field

            @B
            /* Comment */
            @AA
            method(
              @B
              /* Comment */
              @AA
              parameter) {}
          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'AA', left: 'B' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
      })
    })

    it('uses line comments as partition boundaries', async () => {
      await valid({
        code: dedent`
          @B
          // Comment
          @A
          class Class {

            @B
            // Comment
            @A
            property

            @B
            // Comment
            @A
            accessor field

            @B
            // Comment
            @A
            method(
              @B
              // Comment
              @A
              parameter) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
      })
    })

    it('matches specific line comment patterns', async () => {
      await valid({
        code: dedent`
          @C
          // B
          @B
          // A
          @A
          class Class {

            @C
            // B
            @B
            // A
            @A
            property

            @C
            // B
            @B
            // A
            @A
            accessor field

            @C
            // B
            @B
            // A
            @A
            method(
              @C
              // B
              @B
              // A
              @A
              parameter) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['A', 'B'],
            },
          },
        ],
      })
    })

    it('supports regex patterns for line comment partitions', async () => {
      await valid({
        code: dedent`
          @B
          // I am a partition comment because I don't have f o o
          @A
          class Class {

            @B
            // I am a partition comment because I don't have f o o
            @A
            property

            @B
            // I am a partition comment because I don't have f o o
            @A
            accessor field

            @B
            // I am a partition comment because I don't have f o o
            @A
            method(
              @B
              // I am a partition comment because I don't have f o o
              @A
              parameter) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['^(?!.*foo).*$'],
            },
          },
        ],
      })
    })

    it('ignores line comments when block comments are partition boundaries', async () => {
      await invalid({
        output: dedent`
          // Comment
          @AA
          @B
          class Class {

            // Comment
            @AA
            @B
            property

            // Comment
            @AA
            @B
            accessor field

            // Comment
            @AA
            @B
            method(
              // Comment
              @AA
              @B
              parameter) {}
          }
        `,
        code: dedent`
          @B
          // Comment
          @AA
          class Class {

            @B
            // Comment
            @AA
            property

            @B
            // Comment
            @AA
            accessor field

            @B
            // Comment
            @AA
            method(
              @B
              // Comment
              @AA
              parameter) {}
          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'AA', left: 'B' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
      })
    })

    it('uses block comments as partition boundaries', async () => {
      await valid({
        code: dedent`
          @B
          /* Comment */
          @A
          class Class {

            @B
            /* Comment */
            @A
            property

            @B
            /* Comment */
            @A
            accessor field

            @B
            /* Comment */
            @A
            method(
              @B
              /* Comment */
              @A
              parameter) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        code: dedent`
          @C
          /* B */
          @B
          /* A */
          @A
          class Class {

            @C
            /* B */
            @B
            /* A */
            @A
            property

            @C
            /* B */
            @B
            /* A */
            @A
            accessor field

            @C
            /* B */
            @B
            /* A */
            @A
            method(
              @C
              /* B */
              @B
              /* A */
              @A
              parameter) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['A', 'B'],
            },
          },
        ],
      })
    })

    it('supports regex patterns for block comment partitions', async () => {
      await valid({
        code: dedent`
          @B
          /* I am a partition comment because I don't have f o o */
          @A
          class Class {

            @B
            /* I am a partition comment because I don't have f o o */
            @A
            property

            @B
            /* I am a partition comment because I don't have f o o */
            @A
            accessor field

            @B
            /* I am a partition comment because I don't have f o o */
            @A
            method(
              @B
              /* I am a partition comment because I don't have f o o */
              @A
              parameter) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['^(?!.*foo).*$'],
            },
          },
        ],
      })
    })

    it('sorts decorators with special character trimming', async () => {
      await valid({
        code: dedent`

          @_AAA
          @BBB
          @_C
          class Class {

            @_AAA
            @BBB
            @_C
            property

            @_AAA
            @BBB
            @_C
            accessor field

            @_AAA
            @BBB
            @_C
            method(
              @_AAA
              @BBB
              @_C
              parameter) {}

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

    it('sorts decorators with special character removal', async () => {
      await valid({
        code: dedent`

          @ABC
          @A_C
          class Class {

            @ABC
            @A_C
            property

            @ABC
            @A_C
            accessor field

            @ABC
            @A_C
            method(
              @ABC
              @A_C
              parameter) {}

          }
        `,
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
      })
    })

    it('sorts decorators according to locale-specific rules', async () => {
      await valid({
        code: dedent`

          @你好
          @世界
          @a
          @A
          @b
          @B
          class Class {

            @你好
            @世界
            @a
            @A
            @b
            @B
            property

            @你好
            @世界
            @a
            @A
            @b
            @B
            accessor field

            @你好
            @世界
            @a
            @A
            @b
            @B
            method(
              @你好
              @世界
              @a
              @A
              @b
              @B
              parameter) {}

          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
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

    it('sorts decorators', async () => {
      await valid({
        code: dedent`
          @A
          class Class {

            @A
            property

            @A
            accessor field

            @A
            method(
              @A
              parameter) {}

          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          @A
          @B()
          @C
          class Class {

            @A @B() C
            property

            @A @B() C
            accessor field

            @A @B() C
            method(
              @A @B() @C
              parameter) {}

          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          @A @B() @C
          class Class {

            @A @B() @C
            property

            @A @B() @C
            accessor field

            @A @B() @C
            method(
              @A
              @B()
              @C
              parameter) {}

          }
        `,
        code: dedent`
          @A @C @B()
          class Class {

            @A @C @B()
            property

            @A @C @B()
            accessor field

            @A @C @B()
            method(
              @A
              @C
              @B()
              parameter) {}

          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'B', left: 'C' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [options],
      })
    })
  })

  describe('unsorted', () => {
    let options = {
      type: 'unsorted',
      order: 'asc',
    } as const

    it('accepts decorators in any order when sorting is disabled', async () => {
      await valid({
        code: dedent`
          @B
          @C
          @A
          class Class {

            @B
            @C
            @A
            property

            @B
            @C
            @A
            accessor field

            @B
            @C
            @A
            method(
              @B
              @C
              @A
              parameter) {}
          }
        `,
        options: [options],
      })
    })
  })

  describe('misc', () => {
    it('validates the JSON schema', async () => {
      await expect(
        validateRuleJsonSchema(rule.meta.schema),
      ).resolves.not.toThrow()
    })

    it('defaults to alphabetical ascending order', async () => {
      await valid({
        code: dedent`
          @AA
          @B
          @EEE
          @F
          class Class {
          }
        `,
      })
    })

    it('allows disabling decorator sorting on classes', async () => {
      await valid({
        options: [
          {
            sortOnClasses: false,
          },
        ],
        code: dedent`
          @B
          @A
          class Class {}
        `,
      })
    })

    it('allows disabling decorator sorting on accessors', async () => {
      await valid({
        code: dedent`
          class Class {

            @B
            @A
            accessor field

          }
        `,
        options: [
          {
            sortOnAccessors: false,
          },
        ],
      })
    })

    it('allows disabling decorator sorting on properties', async () => {
      await valid({
        code: dedent`
          class Class {

            @B
            @A
            property

          }
        `,
        options: [
          {
            sortOnProperties: false,
          },
        ],
      })
    })

    it('allows disabling decorator sorting on methods', async () => {
      await valid({
        code: dedent`
          class Class {

            @B
            @A
            method() {}

          }
        `,
        options: [
          {
            sortOnMethods: false,
          },
        ],
      })
    })

    it('allows disabling decorator sorting on parameters', async () => {
      await valid({
        code: dedent`
          class Class {

            method(
              @B
              @A
              parameter) {}

          }
        `,
        options: [
          {
            sortOnParameters: false,
          },
        ],
      })
    })

    it('sorts decorators with eslint-disable-line comments', async () => {
      await invalid({
        output: dedent`
          @B
          @C
          @A // eslint-disable-line
          class Class {

            @B
            @C
            @A // eslint-disable-line
            property

            @B
            @C
            @A // eslint-disable-line
            accessor field

            @B
            @C
            @A // eslint-disable-line
            method(
              @B
              @C
              @A // eslint-disable-line
              parameter) {}
          }
        `,
        code: dedent`
          @C
          @B
          @A // eslint-disable-line
          class Class {

            @C
            @B
            @A // eslint-disable-line
            property

            @C
            @B
            @A // eslint-disable-line
            accessor field

            @C
            @B
            @A // eslint-disable-line
            method(
              @C
              @B
              @A // eslint-disable-line
              parameter) {}
          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'B', left: 'C' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [{}],
      })
    })

    it('sorts decorators with eslint-disable-line comments and partitions', async () => {
      await invalid({
        output: dedent`
          @B
          @C
          @A // eslint-disable-line
          @D
          class Class {

            @B
            @C
            @A // eslint-disable-line
            @D
            property

            @B
            @C
            @A // eslint-disable-line
            @D
            accessor field

            @B
            @C
            @A // eslint-disable-line
            @D
            method(
              @B
              @C
              @A // eslint-disable-line
              @D
              parameter) {}
          }
        `,
        code: dedent`
          @D
          @C
          @A // eslint-disable-line
          @B
          class Class {

            @D
            @C
            @A // eslint-disable-line
            @B
            property

            @D
            @C
            @A // eslint-disable-line
            @B
            accessor field

            @D
            @C
            @A // eslint-disable-line
            @B
            method(
              @D
              @C
              @A // eslint-disable-line
              @B
              parameter) {}
          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'C', left: 'D' },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: { right: 'B', left: 'A' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [
          {
            partitionByComment: true,
          },
        ],
      })
    })

    it('sorts decorators with eslint-disable-next-line block comments', async () => {
      await invalid({
        output: dedent`
          @B
          @C
          /* eslint-disable-next-line */
          @A
          class Class {

            @B
            @C
            /* eslint-disable-next-line */
            @A
            property

            @B
            @C
            /* eslint-disable-next-line */
            @A
            accessor field

            @B
            @C
            /* eslint-disable-next-line */
            @A
            method(
              @B
              @C
              /* eslint-disable-next-line */
              @A
              parameter) {}
          }
        `,
        code: dedent`
          @C
          @B
          /* eslint-disable-next-line */
          @A
          class Class {

            @C
            @B
            /* eslint-disable-next-line */
            @A
            property

            @C
            @B
            /* eslint-disable-next-line */
            @A
            accessor field

            @C
            @B
            /* eslint-disable-next-line */
            @A
            method(
              @C
              @B
              /* eslint-disable-next-line */
              @A
              parameter) {}
          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'B', left: 'C' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [{}],
      })
    })

    it('sorts decorators with inline eslint-disable-line comments', async () => {
      await invalid({
        output: dedent`
          @B
          @C
          @A /* eslint-disable-line */
          class Class {

            @B
            @C
            @A /* eslint-disable-line */
            property

            @B
            @C
            @A /* eslint-disable-line */
            accessor field

            @B
            @C
            @A /* eslint-disable-line */
            method(
              @B
              @C
              @A /* eslint-disable-line */
              parameter) {}
          }
        `,
        code: dedent`
          @C
          @B
          @A /* eslint-disable-line */
          class Class {

            @C
            @B
            @A /* eslint-disable-line */
            property

            @C
            @B
            @A /* eslint-disable-line */
            accessor field

            @C
            @B
            @A /* eslint-disable-line */
            method(
              @C
              @B
              @A /* eslint-disable-line */
              parameter) {}
          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'B', left: 'C' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [{}],
      })
    })

    it('sorts decorators with rule-specific eslint-disable-next-line comments', async () => {
      await invalid({
        output: dedent`
          @B
          @C
          // eslint-disable-next-line rule-to-test/sort-decorators
          @A
          class Class {

            @B
            @C
            // eslint-disable-next-line rule-to-test/sort-decorators
            @A
            property

            @B
            @C
            // eslint-disable-next-line rule-to-test/sort-decorators
            @A
            accessor field

            @B
            @C
            // eslint-disable-next-line rule-to-test/sort-decorators
            @A
            method(
              @B
              @C
              // eslint-disable-next-line rule-to-test/sort-decorators
              @A
              parameter) {}
          }
        `,
        code: dedent`
          @C
          @B
          // eslint-disable-next-line rule-to-test/sort-decorators
          @A
          class Class {

            @C
            @B
            // eslint-disable-next-line rule-to-test/sort-decorators
            @A
            property

            @C
            @B
            // eslint-disable-next-line rule-to-test/sort-decorators
            @A
            accessor field

            @C
            @B
            // eslint-disable-next-line rule-to-test/sort-decorators
            @A
            method(
              @C
              @B
              // eslint-disable-next-line rule-to-test/sort-decorators
              @A
              parameter) {}
          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'B', left: 'C' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [{}],
      })
    })

    it('sorts decorators with eslint-disable/enable block comments', async () => {
      await invalid({
        output: dedent`
          @A
          @D
          /* eslint-disable */
          @C
          @B
          // Shouldn't move
          /* eslint-enable */
          @E
          class Class {

            @A
            @D
            /* eslint-disable */
            @C
            @B
            // Shouldn't move
            /* eslint-enable */
            @E
            property

            @A
            @D
            /* eslint-disable */
            @C
            @B
            // Shouldn't move
            /* eslint-enable */
            @E
            accessor field

            @A
            @D
            /* eslint-disable */
            @C
            @B
            // Shouldn't move
            /* eslint-enable */
            @E
            method(
              @A
              @D
              /* eslint-disable */
              @C
              @B
              // Shouldn't move
              /* eslint-enable */
              @E
              parameter) {}
          }
        `,
        code: dedent`
          @D
          @E
          /* eslint-disable */
          @C
          @B
          // Shouldn't move
          /* eslint-enable */
          @A
          class Class {

            @D
            @E
            /* eslint-disable */
            @C
            @B
            // Shouldn't move
            /* eslint-enable */
            @A
            property

            @D
            @E
            /* eslint-disable */
            @C
            @B
            // Shouldn't move
            /* eslint-enable */
            @A
            accessor field

            @D
            @E
            /* eslint-disable */
            @C
            @B
            // Shouldn't move
            /* eslint-enable */
            @A
            method(
              @D
              @E
              /* eslint-disable */
              @C
              @B
              // Shouldn't move
              /* eslint-enable */
              @A
              parameter) {}
          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'A', left: 'B' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [{}],
      })
    })

    it('sorts decorators with rule-specific eslint-disable-line comments', async () => {
      await invalid({
        output: dedent`
          @B
          @C
          @A // eslint-disable-line rule-to-test/sort-decorators
          class Class {

            @B
            @C
            @A // eslint-disable-line rule-to-test/sort-decorators
            property

            @B
            @C
            @A // eslint-disable-line rule-to-test/sort-decorators
            accessor field

            @B
            @C
            @A // eslint-disable-line rule-to-test/sort-decorators
            method(
              @B
              @C
              @A // eslint-disable-line rule-to-test/sort-decorators
              parameter) {}
          }
        `,
        code: dedent`
          @C
          @B
          @A // eslint-disable-line rule-to-test/sort-decorators
          class Class {

            @C
            @B
            @A // eslint-disable-line rule-to-test/sort-decorators
            property

            @C
            @B
            @A // eslint-disable-line rule-to-test/sort-decorators
            accessor field

            @C
            @B
            @A // eslint-disable-line rule-to-test/sort-decorators
            method(
              @C
              @B
              @A // eslint-disable-line rule-to-test/sort-decorators
              parameter) {}
          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'B', left: 'C' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [{}],
      })
    })

    it('sorts decorators with rule-specific eslint-disable-next-line block comments', async () => {
      await invalid({
        output: dedent`
          @B
          @C
          /* eslint-disable-next-line rule-to-test/sort-decorators */
          @A
          class Class {

            @B
            @C
            /* eslint-disable-next-line rule-to-test/sort-decorators */
            @A
            property

            @B
            @C
            /* eslint-disable-next-line rule-to-test/sort-decorators */
            @A
            accessor field

            @B
            @C
            /* eslint-disable-next-line rule-to-test/sort-decorators */
            @A
            method(
              @B
              @C
              /* eslint-disable-next-line rule-to-test/sort-decorators */
              @A
              parameter) {}
          }
        `,
        code: dedent`
          @C
          @B
          /* eslint-disable-next-line rule-to-test/sort-decorators */
          @A
          class Class {

            @C
            @B
            /* eslint-disable-next-line rule-to-test/sort-decorators */
            @A
            property

            @C
            @B
            /* eslint-disable-next-line rule-to-test/sort-decorators */
            @A
            accessor field

            @C
            @B
            /* eslint-disable-next-line rule-to-test/sort-decorators */
            @A
            method(
              @C
              @B
              /* eslint-disable-next-line rule-to-test/sort-decorators */
              @A
              parameter) {}
          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'B', left: 'C' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [{}],
      })
    })

    it('sorts decorators with inline rule-specific eslint-disable-line comments', async () => {
      await invalid({
        output: dedent`
          @B
          @C
          @A /* eslint-disable-line rule-to-test/sort-decorators */
          class Class {

            @B
            @C
            @A /* eslint-disable-line rule-to-test/sort-decorators */
            property

            @B
            @C
            @A /* eslint-disable-line rule-to-test/sort-decorators */
            accessor field

            @B
            @C
            @A /* eslint-disable-line rule-to-test/sort-decorators */
            method(
              @B
              @C
              @A /* eslint-disable-line rule-to-test/sort-decorators */
              parameter) {}
          }
        `,
        code: dedent`
          @C
          @B
          @A /* eslint-disable-line rule-to-test/sort-decorators */
          class Class {

            @C
            @B
            @A /* eslint-disable-line rule-to-test/sort-decorators */
            property

            @C
            @B
            @A /* eslint-disable-line rule-to-test/sort-decorators */
            accessor field

            @C
            @B
            @A /* eslint-disable-line rule-to-test/sort-decorators */
            method(
              @C
              @B
              @A /* eslint-disable-line rule-to-test/sort-decorators */
              parameter) {}
          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'B', left: 'C' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [{}],
      })
    })

    it('sorts decorators with rule-specific eslint-disable/enable blocks', async () => {
      await invalid({
        output: dedent`
          @A
          @D
          /* eslint-disable rule-to-test/sort-decorators */
          @C
          @B
          // Shouldn't move
          /* eslint-enable */
          @E
          class Class {

            @A
            @D
            /* eslint-disable rule-to-test/sort-decorators */
            @C
            @B
            // Shouldn't move
            /* eslint-enable */
            @E
            property

            @A
            @D
            /* eslint-disable rule-to-test/sort-decorators */
            @C
            @B
            // Shouldn't move
            /* eslint-enable */
            @E
            accessor field

            @A
            @D
            /* eslint-disable rule-to-test/sort-decorators */
            @C
            @B
            // Shouldn't move
            /* eslint-enable */
            @E
            method(
              @A
              @D
              /* eslint-disable rule-to-test/sort-decorators */
              @C
              @B
              // Shouldn't move
              /* eslint-enable */
              @E
              parameter) {}
          }
        `,
        code: dedent`
          @D
          @E
          /* eslint-disable rule-to-test/sort-decorators */
          @C
          @B
          // Shouldn't move
          /* eslint-enable */
          @A
          class Class {

            @D
            @E
            /* eslint-disable rule-to-test/sort-decorators */
            @C
            @B
            // Shouldn't move
            /* eslint-enable */
            @A
            property

            @D
            @E
            /* eslint-disable rule-to-test/sort-decorators */
            @C
            @B
            // Shouldn't move
            /* eslint-enable */
            @A
            accessor field

            @D
            @E
            /* eslint-disable rule-to-test/sort-decorators */
            @C
            @B
            // Shouldn't move
            /* eslint-enable */
            @A
            method(
              @D
              @E
              /* eslint-disable rule-to-test/sort-decorators */
              @C
              @B
              // Shouldn't move
              /* eslint-enable */
              @A
              parameter) {}
          }
        `,
        errors: duplicate5Times([
          {
            data: { right: 'A', left: 'B' },
            messageId: ORDER_ERROR_ID,
          },
        ]),
        options: [{}],
      })
    })

    it('preserves decorator order with eslint-disable-next-line comments', async () => {
      await valid({
        code: dedent`
          @B
          @C
          // eslint-disable-next-line
          @A
          class Class {

            @B
            @C
            // eslint-disable-next-line
            @A
            property

            @B
            @C
            // eslint-disable-next-line
            @A
            accessor field

            @B
            @C
            // eslint-disable-next-line
            @A
            method(
              @B
              @C
              // eslint-disable-next-line
              @A
              parameter) {}
          }
        `,
      })
    })
  })
})

function duplicate5Times(
  errors: TestCaseError<
    | typeof MISSED_SPACING_ERROR_ID
    | typeof GROUP_ORDER_ERROR_ID
    | typeof ORDER_ERROR_ID
  >[],
): TestCaseError<
  | typeof MISSED_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID
>[] {
  return Array.from({ length: 5 }, () => errors).flat()
}
