import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-objects'

describe('sort-objects', () => {
  let { invalid, valid } = createRuleTester({
    parser: typescriptParser,
    name: 'sort-objects',
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('sorts object with identifier and literal keys', async () => {
      await valid({
        code: dedent`
          let Obj = {
            a: 'aaaa',
            b: 'bbb',
            [c]: 'cc',
            d: 'd',
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Obj = {
            a: 'aaaa',
            b: 'bbb',
            [c]: 'cc',
            d: 'd',
          }
        `,
        code: dedent`
          let Obj = {
            a: 'aaaa',
            [c]: 'cc',
            b: 'bbb',
            d: 'd',
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [options],
      })
    })

    it('preserves object structure when sorting', async () => {
      await valid({
        code: dedent`
          let Obj = {
            b: 'bb',
            c: 'c',
            ...rest,
            a: 'aaa',
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Obj = {
            b: 'bb',
            c: 'c',
            ...rest,
            a: 'aaa',
          }
        `,
        code: dedent`
          let Obj = {
            c: 'c',
            b: 'bb',
            ...rest,
            a: 'aaa',
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [options],
      })
    })

    it('sorts nested objects', async () => {
      await valid({
        code: dedent`
          let Obj = {
            x: {
              a: 'aa',
              b: 'b',
            },
            y: {
              a: 'aa',
              b: 'b',
            },
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'x', left: 'y' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let Obj = {
            x: {
              a: 'aa',
              b: 'b',
            },
            y: {
              a: 'aa',
              b: 'b',
            },
          }
        `,
        code: dedent`
          let Obj = {
            y: {
              b: 'b',
              a: 'aa',
            },
            x: {
              b: 'b',
              a: 'aa',
            },
          }
        `,
        options: [options],
      })
    })

    it('sorts objects with computed keys', async () => {
      await valid({
        code: dedent`
          let Obj = {
            'a': 'aaa',
            [b()]: 'bb',
            [c[1]]: 'c',
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              left: 'c[1]',
              right: 'b()',
            },
            messageId: 'unexpectedObjectsOrder',
          },
          {
            data: {
              left: 'b()',
              right: 'a',
            },
            messageId: 'unexpectedObjectsOrder',
          },
        ],
        output: dedent`
          let Obj = {
            'a': 'aaa',
            [b()]: 'bb',
            [c[1]]: 'c',
          }
        `,
        code: dedent`
          let Obj = {
            [c[1]]: 'c',
            [b()]: 'bb',
            'a': 'aaa',
          }
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
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'missedSpacingBetweenObjectMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          let obj = {
            b: 'b',

            a: 'a',
          }
        `,
        code: dedent`
          let obj = {
            a: 'a',
            b: 'b',
          }
        `,
      })
    })

    it('allows using regex patterns for custom groups', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^(?!.*Foo).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
          },
        ],
        code: dedent`
          let Obj = {
            iHaveFooInMyName: string,
            meTooIHaveFoo: string,
            a: string,
            b: "b",
          }
        `,
      })
    })

    it('sorts with inline comments', async () => {
      await valid({
        code: dedent`
          let Obj = {
            a: 'aaa', // Comment A
            b: 'bb', // Comment B
            c: 'c' // Comment C
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Obj = {
            a: 'aaa', // Comment A
            b: 'bb', // Comment B
            c: 'c', // Comment C
          }
        `,
        code: dedent`
          let Obj = {
            a: 'aaa', // Comment A
            c: 'c', // Comment C
            b: 'bb', // Comment B
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [options],
      })
    })

    it('sorts objects without trailing comma when last element has a comment', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let Obj = {
            a: 'aa', // Comment A
            b: 'b' // Comment B
          }
        `,
        code: dedent`
          let Obj = {
            b: 'b', // Comment B
            a: 'aa' // Comment A
          }
        `,
        options: [options],
      })
    })

    it('sorts destructured object parameters', async () => {
      await invalid({
        output: dedent`
          let Func = ({
            a = 'aa',
            b,
            c
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            c,
            a = 'aa',
            b
          }) => {
            // ...
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'c' },
          },
        ],
        options: [options],
      })
    })

    it('preserves order when right value depends on left value', async () => {
      await invalid({
        output: dedent`
          let Func = ({
            a = 'a',
            c,
            b = c,
            d,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            c,
            b = c,
            a = 'a',
            d,
          }) => {
            // ...
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [options],
      })
    })

    it('handles complex dependencies between destructured parameters', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'c' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
          {
            data: { nodeDependentOnRight: 'b', right: 'd' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let Func = ({
            a,
            c,
            d,
            b = a + c + d,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            a,
            b = a + c + d,
            c,
            d,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Func = ({
            a,
            b,
            c = 1 === 1 ? 1 === 1 ? a : b : b,
            d,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            a,
            c = 1 === 1 ? 1 === 1 ? a : b : b,
            b,
            d,
          }) => {
            // ...
          }
        `,
        errors: [
          {
            data: { nodeDependentOnRight: 'c', right: 'b' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'c' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
          {
            data: { nodeDependentOnRight: 'b', right: 'd' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let Func = ({
            a,
            c,
            d,
            b = ['a', 'b', 'c'].includes(d, c, a),
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            a,
            b = ['a', 'b', 'c'].includes(d, c, a),
            c,
            d,
          }) => {
            // ...
          }
        `,
        options: [
          {
            type: 'alphabetical',
            order: 'asc',
          },
        ],
      })

      await invalid({
        output: dedent`
          let Func = ({
            a,
            c,
            b = c || c,
            d,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            a,
            b = c || c,
            c,
            d,
          }) => {
            // ...
          }
        `,
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'c' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        options: [options],
      })

      await invalid({
        output: dedent`
          let Func = ({
            a,
            c,
            b = 1 === 1 ? a : c,
            d,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            a,
            b = 1 === 1 ? a : c,
            c,
            d,
          }) => {
            // ...
          }
        `,
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'c' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        options: [options],
      })

      await invalid({
        output: dedent`
          let Func = ({
              c = 10,
              a = c,
              b = 10,
              }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
              a = c,
              b = 10,
              c = 10,
              }) => {
            // ...
          }
        `,
        errors: [
          {
            data: { nodeDependentOnRight: 'a', right: 'c' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        options: [options],
      })
    })

    it('detects function expression dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = () => 1,
            a = b(),
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = function() { return 1 },
            a = b(),
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = () => 1,
            a = a.map(b),
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects dependencies in object literals', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = 1,
            a = {x: b},
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = 1,
            a = {[b]: 0},
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects chained member expression dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = {x: 1},
            a = b.x,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = new Subject(),
            a = b.asObservable(),
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects optional chaining dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = {x: 1},
            a = b?.x,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects non-null assertion dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = 1,
            a = b!,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects unary expression dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = true,
            a = !b,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects spread element dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = {x: 1},
            a = {...b},
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = [1],
            a = [...b],
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects dependencies in conditional expressions', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = 0,
            a = b ? 1 : 0,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = 0,
            a = x ? b : 0,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = 0,
            a = x ? 0 : b,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects dependencies in type assertions', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = 'b',
            a = b as any,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = 'b',
            a = <any>b,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects dependencies in template literals', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = 'b',
            a = \`\${b}\`,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('ignores function body dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            a = () => b,
            b = 1,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            a = function() { return b },
            b = 1,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            a = () => {return b},
            b = 1,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects dependencies in object destructuring patterns', async () => {
      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'a',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let {
            b: bRenamed,
            a = bRenamed,
          } = obj;
        `,
        code: dedent`
          let {
            a = bRenamed,
            b: bRenamed,
          } = obj;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'a',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let {
            b: [, nested] = [],
            a = nested,
          } = obj;
        `,
        code: dedent`
          let {
            a = nested,
            b: [, nested] = [],
          } = obj;
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let {
            a,
            b: {} = {},
          } = obj;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'a',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let [{
            b: bRenamed,
            a = bRenamed,
          }] = [obj];
        `,
        code: dedent`
          let [{
            a = bRenamed,
            b: bRenamed,
          }] = [obj];
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'a',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let {
            [b]: bRenamed,
            a = bRenamed,
          } = obj;
        `,
        code: dedent`
          let {
            a = bRenamed,
            [b]: bRenamed,
          } = obj;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'a',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let {
            [b]: bRenamed = something,
            a = bRenamed,
          } = obj;
        `,
        code: dedent`
          let {
            a = bRenamed,
            [b]: bRenamed = something,
          } = obj;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'a',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let {
            b: { nested } = { nested: 'default' },
            a = nested,
          } = obj;
        `,
        code: dedent`
          let {
            a = nested,
            b: { nested } = { nested: 'default' },
          } = obj;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'a',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let {
            b: { nested, ...rest } = { extra: 2, nested: 1 },
            a = rest,
          } = obj;
        `,
        code: dedent`
          let {
            a = rest,
            b: { nested, ...rest } = { extra: 2, nested: 1 },
          } = obj;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'a',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let {
            b: [first, ...restArr] = [],
            a = restArr,
          } = obj;
        `,
        code: dedent`
          let {
            a = restArr,
            b: [first, ...restArr] = [],
          } = obj;
        `,
        options: [options],
      })
    })

    it('detects and handles circular dependencies', async () => {
      await invalid({
        output: dedent`
          let Func = ({
            a,
            b = f + 1,
            c,
            d = b + 1,
            e,
            f = d + 1
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            b = f + 1,
            a,
            c,
            d = b + 1,
            e,
            f = d + 1
          }) => {
            // ...
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [options],
      })
    })

    it('prioritizes dependencies over group configuration', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: [
              {
                groupName: 'attributesStartingWithA',
                elementNamePattern: '^a',
              },
              {
                groupName: 'attributesStartingWithB',
                elementNamePattern: '^b',
              },
            ],
            groups: ['attributesStartingWithA', 'attributesStartingWithB'],
          },
        ],
        code: dedent`
          let Func = ({
            b,
            a = b,
          }) => {
            // ...
          }
        `,
      })
    })

    it('prioritizes dependencies over partition comments', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'a' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let Func = ({
            a = 0,
            // Part: 1
            b = a,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            b = a,
            // Part: 1
            a = 0,
          }) => {
            // ...
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('prioritizes dependencies over newline partitions', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'a' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let Func = ({
            a = 0,

            b = a,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            b = a,

            a = 0,
          }) => {
            // ...
          }
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('allows using partition comments', async () => {
      await invalid({
        output: dedent`
          let Obj = {
            // Part: 1
            d: 'ddd',
            e: 'ee',
            // Part: 2
            f: 'f',
            // Part: 3
            a: 'aaaaaa',
            // Not partition comment
            b: 'bbbbb',
            c: 'cccc',
          }
        `,
        code: dedent`
          let Obj = {
            // Part: 1
            e: 'ee',
            d: 'ddd',
            // Part: 2
            f: 'f',
            // Part: 3
            a: 'aaaaaa',
            c: 'cccc',
            // Not partition comment
            b: 'bbbbb',
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'd', left: 'e' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('allows treating all comments as partitions', async () => {
      await valid({
        code: dedent`
          let Obj = {
            // Some comment
            b: 'b',
            // Other comment
            a: 'aa',
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

    it('allows using multiple partition comments', async () => {
      await invalid({
        output: dedent`
          let Object = {
            /* Partition Comment */
            // Part: 1
            c: 'cc',
            // Part: 2
            a: 'aaaa',
            b: 'bbb',
            d: 'd',
            /* Part: 3 */
            e: 'e',
          }
        `,
        code: dedent`
          let Object = {
            /* Partition Comment */
            // Part: 1
            c: 'cc',
            // Part: 2
            b: 'bbb',
            a: 'aaaa',
            d: 'd',
            /* Part: 3 */
            e: 'e',
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: ['Partition Comment', 'Part:'],
          },
        ],
      })
    })

    it('allows using regex patterns for partition comments', async () => {
      await valid({
        code: dedent`
          let obj = {
            e = 'e',
            f = 'f',
            // I am a partition comment because I don't have f o o
            a = 'a',
            b = 'b',
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

    it('ignores block comments when using line partition option', async () => {
      await invalid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let Obj = {
            /* Comment */
            a: 'a',
            b: 'b',
          }
        `,
        code: dedent`
          let Obj = {
            b: 'b',
            /* Comment */
            a: 'a',
          }
        `,
      })
    })

    it('treats line comments as partitions when line option is enabled', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        code: dedent`
          let Obj = {
            b: 'b',
            // Comment
            a: 'a',
          }
        `,
      })
    })

    it('allows multiple line partition comments with specific patterns', async () => {
      await valid({
        code: dedent`
          let Obj = {
            c: 'c',
            // b
            b: 'b',
            // a
            a: 'a',
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['a', 'b'],
            },
          },
        ],
      })
    })

    it('allows regex patterns for line partition comments', async () => {
      await valid({
        code: dedent`
          let Obj = {
            b: 'b',
            // I am a partition comment because I don't have f o o
            a: 'a',
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

    it('ignores line comments when using block partition option', async () => {
      await invalid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let Obj = {
            // Comment
            a: 'a',
            b: 'b',
          }
        `,
        code: dedent`
          let Obj = {
            b: 'b',
            // Comment
            a: 'a',
          }
        `,
      })
    })

    it('treats block comments as partitions when block option is enabled', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        code: dedent`
          let Obj = {
            b: 'b',
            /* Comment */
            a: 'a',
          }
        `,
      })
    })

    it('allows multiple block partition comments with specific patterns', async () => {
      await valid({
        code: dedent`
          let Obj = {
            c: 'c',
            /* b */
            b: 'b',
            /* a */
            a: 'a',
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['a', 'b'],
            },
          },
        ],
      })
    })

    it('allows regex patterns for block partition comments', async () => {
      await valid({
        code: dedent`
          let Obj = {
            b: 'b',
            /* I am a partition comment because I don't have f o o */
            a: 'a',
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

    it('allows using newlines as partitions', async () => {
      await valid({
        code: dedent`
          let Obj = {
            d: 'dd',
            e: 'e',

            c: 'ccc',

            a: 'aaaaa',
            b: 'bbbb',
          }
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'd', left: 'e' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let Obj = {
            d: 'dd',
            e: 'e',

            c: 'ccc',

            a: 'aaaaa',
            b: 'bbbb',
          }
        `,
        code: dedent`
          let Obj = {
            e: 'e',
            d: 'dd',

            c: 'ccc',

            b: 'bbbb',
            a: 'aaaaa',
          }
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('allows trimming special characters', async () => {
      await valid({
        code: dedent`
          let obj = {
            _a = 'a',
            b = 'b',
            _c = 'c',
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

    it('allows removing special characters', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          let obj = {
            ab = 'ab',
            a_c = 'ac',
          }
        `,
      })
    })

    it('sorts using specified locale', async () => {
      await valid({
        code: dedent`
          let obj = {
            你好 = '你好',
            世界 = '世界',
            a = 'a',
            A = 'A',
            b = 'b',
            B = 'B',
          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('prioritizes methods over member selector', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: 'memberProperty',
              rightGroup: 'method',
              leftGroup: 'member',
              right: 'method',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        output: dedent`
          let obj = {
            method() {},
            memberProperty: something,
          }
        `,
        code: dedent`
          let obj = {
            memberProperty: something,
            method() {},
          }
        `,
        options: [
          {
            ...options,
            groups: ['method', 'member'],
          },
        ],
      })
    })

    it('prioritizes properties over methods when configured', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'property',
              leftGroup: 'member',
              right: 'property',
              left: 'method',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['property', 'member'],
          },
        ],
        output: dedent`
          let obj = {
            property,
            method() {},
          }
        `,
        code: dedent`
          let obj = {
            method() {},
            property,
          }
        `,
      })
    })

    it('sorts by configured groups', async () => {
      await valid({
        code: dedent`
          let obj = {
            z: {
              // Some multiline stuff
            },
            f: 'a',
            a1: () => {},
            a2: function() {},
            a3() {},
          }
        `,
        options: [
          {
            ...options,
            groups: ['multiline-member', 'unknown', 'method'],
          },
        ],
      })
    })

    it('removes newlines between groups when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenObjectMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenObjectMembers',
            data: { right: 'b', left: 'z' },
          },
        ],
        code: dedent`
          let Obj = {
            a: () => null,


           y: "y",
          z: "z",

              b: "b",
          }
        `,
        output: dedent`
          let Obj = {
            a: () => null,
           b: "b",
          y: "y",
              z: "z",
          }
        `,
        options: [
          {
            ...options,
            groups: ['method', 'unknown'],
            newlinesBetween: 0,
          },
        ],
      })
    })

    it('handles newlinesBetween configuration between consecutive groups', async () => {
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
              {
                elementNamePattern: 'c',
                groupName: 'c',
              },
              {
                elementNamePattern: 'd',
                groupName: 'd',
              },
              {
                elementNamePattern: 'e',
                groupName: 'e',
              },
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
            messageId: 'missedSpacingBetweenObjectMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenObjectMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenObjectMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          let obj = {
            a: 'a',

            b: 'b',

            c: 'c',
            d: 'd',


            e: 'e',
          }
        `,
        code: dedent`
          let obj = {
            a: 'a',
            b: 'b',


            c: 'c',

            d: 'd',


            e: 'e',
          }
        `,
      })
    })

    it.each([
      [2, 0],
      [2, 'ignore'],
      [0, 2],
      ['ignore', 2],
    ])(
      'enforces newlines between non-consecutive groups when global is %s and group is %s',
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
              messageId: 'missedSpacingBetweenObjectMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            let obj = {
              a: null,


              b: null,
            }
          `,
          code: dedent`
            let obj = {
              a: null,
              b: null,
            }
          `,
        })
      },
    )

    it.each([1, 2, 'ignore', 0])(
      'removes newlines when 0 is configured between all groups (global: %s)',
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
              messageId: 'extraSpacingBetweenObjectMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            let obj = {
              a: null,
              b: null,
            }
          `,
          code: dedent`
            let obj = {
              a: null,

              b: null,
            }
          `,
        })
      },
    )

    it.each([
      ['ignore', 0],
      [0, 'ignore'],
    ])(
      'allows any spacing when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        let testOptions = {
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
        }

        await valid({
          code: dedent`
            let obj = {
              a: null,

              b: null,
            }
          `,
          options: [testOptions],
        })

        await valid({
          code: dedent`
            let obj = {
              a: null,
              b: null,
            }
          `,
          options: [testOptions],
        })
      },
    )

    it('preserves comments and handles newlines after fixes', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'unknown',
              leftGroup: 'method',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        output: dedent`
          let obj = {
            a, // Comment after

            b() {},
            c() {},
          };
        `,
        code: dedent`
          let obj = {
            b() {},
            a, // Comment after

            c() {},
          };
        `,
        options: [
          {
            groups: ['unknown', 'method'],
            newlinesBetween: 1,
          },
        ],
      })
    })

    it('preserves newlines between different partitions when newlinesBetween is 0', async () => {
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
        output: dedent`
          let obj = {
            a,

            // Partition comment

            b,
            c,
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        code: dedent`
          let obj = {
            a,

            // Partition comment

            c,
            b,
          }
        `,
      })
    })

    it('sorts inline object properties correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let obj = {
            a: string, b: string
          }
        `,
        code: dedent`
          let obj = {
            b: string, a: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let obj = {
            a: string, b: string,
          }
        `,
        code: dedent`
          let obj = {
            b: string, a: string,
          }
        `,
        options: [options],
      })
    })

    it.each([
      '^r|g|b$',
      ['noMatch', '^r|g|b$'],
      { pattern: '^R|G|B$', flags: 'i' },
      ['noMatch', { pattern: '^R|G|B$', flags: 'i' }],
    ])(
      'applies configuration when allNamesMatchPattern matches (pattern: %s)',
      async rgbAllNamesMatchPattern => {
        await invalid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                allNamesMatchPattern: 'foo',
              },
            },
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: 'r',
                  groupName: 'r',
                },
                {
                  elementNamePattern: 'g',
                  groupName: 'g',
                },
                {
                  elementNamePattern: 'b',
                  groupName: 'b',
                },
              ],
              useConfigurationIf: {
                allNamesMatchPattern: rgbAllNamesMatchPattern,
              },
              groups: ['r', 'g', 'b'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'g',
                leftGroup: 'b',
                right: 'g',
                left: 'b',
              },
              messageId: 'unexpectedObjectsGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedObjectsGroupOrder',
            },
          ],
          output: dedent`
            let obj = {
              r: string,
              g: string,
              b: string
            }
          `,
          code: dedent`
            let obj = {
              b: string,
              g: string,
              r: string
            }
          `,
        })
      },
    )

    it('applies configuration when callingFunctionNamePattern matches', async () => {
      await invalid({
        options: [
          {
            ...options,
            useConfigurationIf: {
              callingFunctionNamePattern: '^.*$',
            },
            type: 'unsorted',
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          ({ a: 1, b: 1 })
        `,
        code: dedent`
          ({ b: 1, a: 1 })
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'g',
              leftGroup: 'b',
              right: 'g',
              left: 'b',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
          {
            data: {
              rightGroup: 'r',
              leftGroup: 'g',
              right: 'r',
              left: 'g',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
          {
            data: {
              rightGroup: 'g',
              leftGroup: 'b',
              right: 'g',
              left: 'b',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
          {
            data: {
              rightGroup: 'r',
              leftGroup: 'g',
              right: 'r',
              left: 'g',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            useConfigurationIf: {
              callingFunctionNamePattern: 'foo',
            },
          },
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'r',
                groupName: 'r',
              },
              {
                elementNamePattern: 'g',
                groupName: 'g',
              },
              {
                elementNamePattern: 'b',
                groupName: 'b',
              },
            ],
            useConfigurationIf: {
              callingFunctionNamePattern: '^someFunction$',
            },
            groups: ['r', 'g', 'b'],
          },
        ],
        output: dedent`
          let obj = {
            b,
            g,
            r
          }

          someFunction(true, {
            r: string,
            g: string,
            b: string
          })

          let a = someFunction(true, {
            r: string,
            g: string,
            b: string
          })
        `,
        code: dedent`
          let obj = {
            b,
            g,
            r
          }

          someFunction(true, {
            b: string,
            g: string,
            r: string
          })

          let a = someFunction(true, {
            b: string,
            g: string,
            r: string
          })
        `,
      })

      await valid({
        options: [
          {
            ...options,
            useConfigurationIf: {
              callingFunctionNamePattern: '^Schema.index$',
            },
            type: 'unsorted',
          },
        ],
        code: dedent`
          Schema.index({ b: 1, a: 1 });
        `,
      })
    })

    it('applies configuration when declarationMatchesPattern matches', async () => {
      await valid({
        options: [
          {
            useConfigurationIf: {
              declarationMatchesPattern: '^constant$',
            },
            type: 'unsorted',
          },
          options,
        ],
        code: dedent`
          const constant = {
            b,
            a,
            c,
          }
        `,
      })

      await valid({
        options: [
          {
            useConfigurationIf: {
              declarationMatchesPattern: '^constant$',
            },
            type: 'unsorted',
          },
          options,
        ],
        code: dedent`
          const notAConstant = {
            constant: {
              b,
              a,
              c,
            }
          }
        `,
      })

      await invalid({
        options: [
          {
            ...options,
            useConfigurationIf: {
              declarationMatchesPattern: '^.*$',
            },
            type: 'unsorted',
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          func({ a: 1, b: 1 })
        `,
        code: dedent`
          func({ b: 1, a: 1 })
        `,
      })

      await invalid({
        options: [
          {
            useConfigurationIf: {
              declarationMatchesPattern: '^constant$',
            },
            type: 'unsorted',
          },
          options,
        ],
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let notAConstant = {
            a,
            b,
          }
        `,
        code: dedent`
          let notAConstant = {
            b,
            a,
          }
        `,
      })

      await invalid({
        options: [
          {
            ...options,
            useConfigurationIf: {
              declarationMatchesPattern: '^.*$',
            },
            type: 'unsorted',
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          ({ a: 1, b: 1 })
        `,
        code: dedent`
          ({ b: 1, a: 1 })
        `,
      })
    })

    it('applies configuration when declaration comment matches', async () => {
      await valid({
        options: [
          {
            useConfigurationIf: {
              declarationCommentMatchesPattern: '^Ignore me$',
            },
            type: 'unsorted',
          },
          options,
        ],
        code: dedent`
          // Ignore me
          const obj = {
            b,
            c,
            a,
          }
        `,
      })

      await valid({
        options: [
          {
            useConfigurationIf: {
              declarationCommentMatchesPattern: '^Ignore me$',
            },
            type: 'unsorted',
          },
          options,
        ],
        code: dedent`
          // Ignore me
          func({
            b,
            c,
            a,
          })
        `,
      })

      await invalid({
        options: [
          {
            useConfigurationIf: {
              declarationCommentMatchesPattern: '^Ignore me$',
            },
            type: 'unsorted',
          },
          options,
        ],
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          // Do NOT ignore me
          const obj = {
            a,
            b,
          }
        `,
        code: dedent`
          // Do NOT ignore me
          const obj = {
            b,
            a,
          }
        `,
      })
    })

    it('applies configuration when object only has numeric keys', async () => {
      await valid({
        options: [
          {
            useConfigurationIf: {
              hasNumericKeysOnly: true,
            },
            type: 'unsorted',
          },
        ],
        code: dedent`
          const obj = {
            5: 'five',
            2: {},
            3: 'three',
            8: 'eight',
          }
        `,
      })

      await invalid({
        options: [
          {
            useConfigurationIf: {
              hasNumericKeysOnly: true,
            },
            type: 'unsorted',
          },
          options,
        ],
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: '1', left: '2' },
          },
        ],
        output: dedent`
          let obj = {
            '1': 1,
            2: 2,
          }
        `,
        code: dedent`
          let obj = {
            2: 2,
            '1': 1,
          }
        `,
      })

      await invalid({
        options: [
          {
            useConfigurationIf: {
              hasNumericKeysOnly: true,
            },
            type: 'unsorted',
          },
          options,
        ],
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let Func = ({
            a,
            b,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            b,
            a,
          }) => {
            // ...
          }
        `,
      })
    })

    it('skips object declarations when objectType is "destructured"', async () => {
      await valid({
        options: [
          {
            useConfigurationIf: {
              objectType: 'destructured',
            },
          },
          {
            type: 'unsorted',
          },
        ],
        code: dedent`
          let obj = {
            c: 'c',
            a: 'a',
            b: 'b',
          }

          let { a, b, c } = obj
        `,
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [
          {
            useConfigurationIf: {
              objectType: 'destructured',
            },
          },
          {
            type: 'unsorted',
          },
        ],
        output: dedent`
          let obj = {
            c: 'c',
            a: 'a',
            b: 'b',
          }

          let { a, b, c } = obj
        `,
        code: dedent`
          let obj = {
            c: 'c',
            a: 'a',
            b: 'b',
          }

          let { c, b, a } = obj
        `,
      })
    })

    it('skips destructured objects when objectType is "non-destructured"', async () => {
      await valid({
        options: [
          {
            useConfigurationIf: {
              objectType: 'non-destructured',
            },
          },
          {
            type: 'unsorted',
          },
        ],
        code: dedent`
          let obj = {
            a: 'a',
            b: 'b',
            c: 'c',
          }

          let { b, c, a } = obj
        `,
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [
          {
            useConfigurationIf: {
              objectType: 'non-destructured',
            },
          },
          {
            type: 'unsorted',
          },
        ],
        output: dedent`
          let obj = {
            a: 'a',
            b: 'b',
            c: 'c',
          }

          let { c, a, b } = obj
        `,
        code: dedent`
          let obj = {
            c: 'c',
            b: 'b',
            a: 'a',
          }

          let { c, a, b } = obj
        `,
      })
    })

    it('filters custom groups by selector and modifiers', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unusedCustomGroup',
                modifiers: ['multiline'],
                selector: 'method',
              },
              {
                groupName: 'multilinePropertyGroup',
                modifiers: ['multiline'],
                selector: 'property',
              },
              {
                groupName: 'propertyGroup',
                selector: 'property',
              },
            ],
            groups: ['propertyGroup', 'multilinePropertyGroup'],
          },
        ],
        errors: [
          {
            data: {
              leftGroup: 'multilinePropertyGroup',
              rightGroup: 'propertyGroup',
              right: 'c',
              left: 'b',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        output: dedent`
          let obj = {
            c,
            a: {
              // Multiline
            },
            b: {
              // Multiline
            },
          }
        `,
        code: dedent`
          let obj = {
            a: {
              // Multiline
            },
            b: {
              // Multiline
            },
            c,
          }
        `,
      })
    })

    it.each([
      'hello',
      ['noMatch', 'hello'],
      { pattern: 'HELLO', flags: 'i' },
      ['noMatch', { pattern: 'HELLO', flags: 'i' }],
    ])(
      'filters custom groups by elementNamePattern (%s)',
      async elementNamePattern => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'propertiesStartingWithHello',
                  selector: 'property',
                  elementNamePattern,
                },
              ],
              groups: ['propertiesStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'propertiesStartingWithHello',
                right: 'helloProperty',
                leftGroup: 'unknown',
                left: 'method',
              },
              messageId: 'unexpectedObjectsGroupOrder',
            },
          ],
          output: dedent`
            let obj = {
              helloProperty,
              a,
              b,
              method() {},
            }
          `,
          code: dedent`
            let obj = {
              a,
              b,
              method() {},
              helloProperty,
            }
          `,
        })
      },
    )

    it.each([
      'inject',
      ['noMatch', 'inject'],
      { pattern: 'INJECT', flags: 'i' },
      ['noMatch', { pattern: 'INJECT', flags: 'i' }],
    ])(
      'filters custom groups by elementValuePattern (%s)',
      async injectElementValuePattern => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  elementValuePattern: injectElementValuePattern,
                  groupName: 'inject',
                },
                {
                  elementValuePattern: 'computed',
                  groupName: 'computed',
                },
              ],
              groups: ['computed', 'inject', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'computed',
                leftGroup: 'inject',
                right: 'z',
                left: 'y',
              },
              messageId: 'unexpectedObjectsGroupOrder',
            },
          ],
          output: dedent`
            let obj = {
              a: computed(A),
              z: computed(Z),
              b: inject(B),
              y: inject(Y),
              c() {},
            }
          `,
          code: dedent`
            let obj = {
              a: computed(A),
              b: inject(B),
              y: inject(Y),
              z: computed(Z),
              c() {},
            }
          `,
        })
      },
    )

    it('sorts custom groups with overridden type and order', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            data: { right: 'dddd', left: 'ccc' },
            messageId: 'unexpectedObjectsOrder',
          },
          {
            data: {
              rightGroup: 'reversedPropertiesByLineLength',
              leftGroup: 'unknown',
              left: 'method',
              right: 'eee',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedPropertiesByLineLength',
                selector: 'property',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedPropertiesByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          let obj = {
            dddd,
            ccc,
            eee,
            bb,
            ff,
            a,
            g,
            anotherMethod() {},
            method() {},
            yetAnotherMethod() {},
          }
        `,
        code: dedent`
          let obj = {
            a,
            bb,
            ccc,
            dddd,
            method() {},
            eee,
            ff,
            g,
            anotherMethod() {},
            yetAnotherMethod() {},
          }
        `,
      })
    })

    it('sorts custom groups with fallbackSort override', async () => {
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
            data: { right: 'fooBar', left: 'fooZar' },
            messageId: 'unexpectedObjectsOrder',
          },
        ],
        output: dedent`
          let obj = {
            fooBar: 'fooBar',
            fooZar: 'fooZar',
          }
        `,
        code: dedent`
          let obj = {
            fooZar: 'fooZar',
            fooBar: 'fooBar',
          }
        `,
      })
    })

    it('preserves order within unsorted custom groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedProperties',
                selector: 'property',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedProperties', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedProperties',
              leftGroup: 'unknown',
              left: 'method',
              right: 'c',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        output: dedent`
          let obj = {
            b,
            a,
            d,
            e,
            c,
            method() {},
          }
        `,
        code: dedent`
          let obj = {
            b,
            a,
            d,
            e,
            method() {},
            c,
          }
        `,
      })
    })

    it('sorts custom groups with anyOf conditions', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    modifiers: ['multiline'],
                    selector: 'property',
                  },
                  {
                    modifiers: ['multiline'],
                    selector: 'method',
                  },
                ],
                groupName: 'multilinePropertiesAndMultilineMethods',
              },
            ],
            groups: ['multilinePropertiesAndMultilineMethods', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'multilinePropertiesAndMultilineMethods',
              leftGroup: 'unknown',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        output: dedent`
          let obj = {
            b() {
              // Multiline
            },
            c: {
              // Multiline
            },
            a,
            d() {},
            e,
          }
        `,
        code: dedent`
          let obj = {
            a,
            b() {
              // Multiline
            },
            c: {
              // Multiline
            },
            d() {},
            e,
          }
        `,
      })
    })

    it('allows regex patterns for element names in custom groups', async () => {
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
          let obj = {
            iHaveFooInMyName,
            meTooIHaveFoo,
            a,
            b,
          }
        `,
      })
    })

    it('enforces newlines within custom groups when newlinesInside is 1', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                selector: 'property',
                groupName: 'group1',
                newlinesInside: 1,
              },
            ],
            groups: ['group1'],
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenObjectMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          let obj = {
            a,

            b,
          }
        `,
        code: dedent`
          let obj = {
            a,
            b,
          }
        `,
      })
    })

    it('removes newlines within custom groups when newlinesInside is 0', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                selector: 'property',
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
            messageId: 'extraSpacingBetweenObjectMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          let obj = {
            a,
            b,
          }
        `,
        code: dedent`
          let obj = {
            a,

            b,
          }
        `,
      })
    })

    it('allows regex patterns in custom groups', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^(?!.*Foo).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
          },
        ],
        code: dedent`
          let obj = {
            iHaveFooInMyName,
            meTooIHaveFoo,
            a,
            b,
          }
        `,
      })
    })
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it('sorts object with identifier and literal keys', async () => {
      await valid({
        code: dedent`
          let Obj = {
            a: 'aaaa',
            b: 'bbb',
            [c]: 'cc',
            d: 'd',
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Obj = {
            a: 'aaaa',
            b: 'bbb',
            [c]: 'cc',
            d: 'd',
          }
        `,
        code: dedent`
          let Obj = {
            a: 'aaaa',
            [c]: 'cc',
            b: 'bbb',
            d: 'd',
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [options],
      })
    })

    it('preserves object structure when sorting', async () => {
      await valid({
        code: dedent`
          let Obj = {
            b: 'bb',
            c: 'c',
            ...rest,
            a: 'aaa',
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Obj = {
            b: 'bb',
            c: 'c',
            ...rest,
            a: 'aaa',
          }
        `,
        code: dedent`
          let Obj = {
            c: 'c',
            b: 'bb',
            ...rest,
            a: 'aaa',
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [options],
      })
    })

    it('sorts nested objects', async () => {
      await valid({
        code: dedent`
          let Obj = {
            x: {
              a: 'aa',
              b: 'b',
            },
            y: {
              a: 'aa',
              b: 'b',
            },
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'x', left: 'y' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let Obj = {
            x: {
              a: 'aa',
              b: 'b',
            },
            y: {
              a: 'aa',
              b: 'b',
            },
          }
        `,
        code: dedent`
          let Obj = {
            y: {
              b: 'b',
              a: 'aa',
            },
            x: {
              b: 'b',
              a: 'aa',
            },
          }
        `,
        options: [options],
      })
    })

    it('sorts objects with computed keys', async () => {
      await valid({
        code: dedent`
          let Obj = {
            'a': 'aaa',
            [b()]: 'bb',
            [c[1]]: 'c',
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              left: 'c[1]',
              right: 'b()',
            },
            messageId: 'unexpectedObjectsOrder',
          },
          {
            data: {
              left: 'b()',
              right: 'a',
            },
            messageId: 'unexpectedObjectsOrder',
          },
        ],
        output: dedent`
          let Obj = {
            'a': 'aaa',
            [b()]: 'bb',
            [c[1]]: 'c',
          }
        `,
        code: dedent`
          let Obj = {
            [c[1]]: 'c',
            [b()]: 'bb',
            'a': 'aaa',
          }
        `,
        options: [options],
      })
    })

    it('allows using regex patterns for custom groups', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^(?!.*Foo).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
          },
        ],
        code: dedent`
          let Obj = {
            iHaveFooInMyName: string,
            meTooIHaveFoo: string,
            a: string,
            b: "b",
          }
        `,
      })
    })

    it('sorts with inline comments', async () => {
      await valid({
        code: dedent`
          let Obj = {
            a: 'aaa', // Comment A
            b: 'bb', // Comment B
            c: 'c' // Comment C
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Obj = {
            a: 'aaa', // Comment A
            b: 'bb', // Comment B
            c: 'c', // Comment C
          }
        `,
        code: dedent`
          let Obj = {
            a: 'aaa', // Comment A
            c: 'c', // Comment C
            b: 'bb', // Comment B
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [options],
      })
    })

    it('sorts objects without trailing comma when last element has a comment', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let Obj = {
            a: 'aa', // Comment A
            b: 'b' // Comment B
          }
        `,
        code: dedent`
          let Obj = {
            b: 'b', // Comment B
            a: 'aa' // Comment A
          }
        `,
        options: [options],
      })
    })

    it('sorts destructured object parameters', async () => {
      await invalid({
        output: dedent`
          let Func = ({
            a = 'aa',
            b,
            c
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            c,
            a = 'aa',
            b
          }) => {
            // ...
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'c' },
          },
        ],
        options: [options],
      })
    })

    it('preserves order when right value depends on left value', async () => {
      await invalid({
        output: dedent`
          let Func = ({
            a = 'a',
            c,
            b = c,
            d,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            c,
            b = c,
            a = 'a',
            d,
          }) => {
            // ...
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [options],
      })
    })

    it('handles complex dependencies between destructured parameters', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'c' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
          {
            data: { nodeDependentOnRight: 'b', right: 'd' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let Func = ({
            a,
            c,
            d,
            b = a + c + d,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            a,
            b = a + c + d,
            c,
            d,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Func = ({
            a,
            b,
            c = 1 === 1 ? 1 === 1 ? a : b : b,
            d,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            a,
            c = 1 === 1 ? 1 === 1 ? a : b : b,
            b,
            d,
          }) => {
            // ...
          }
        `,
        errors: [
          {
            data: { nodeDependentOnRight: 'c', right: 'b' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'c' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
          {
            data: { nodeDependentOnRight: 'b', right: 'd' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let Func = ({
            a,
            c,
            d,
            b = ['a', 'b', 'c'].includes(d, c, a),
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            a,
            b = ['a', 'b', 'c'].includes(d, c, a),
            c,
            d,
          }) => {
            // ...
          }
        `,
        options: [
          {
            type: 'alphabetical',
            order: 'asc',
          },
        ],
      })

      await invalid({
        output: dedent`
          let Func = ({
            a,
            c,
            b = c || c,
            d,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            a,
            b = c || c,
            c,
            d,
          }) => {
            // ...
          }
        `,
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'c' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        options: [options],
      })

      await invalid({
        output: dedent`
          let Func = ({
            a,
            c,
            b = 1 === 1 ? a : c,
            d,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            a,
            b = 1 === 1 ? a : c,
            c,
            d,
          }) => {
            // ...
          }
        `,
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'c' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        options: [options],
      })

      await invalid({
        output: dedent`
          let Func = ({
              c = 10,
              a = c,
              b = 10,
              }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
              a = c,
              b = 10,
              c = 10,
              }) => {
            // ...
          }
        `,
        errors: [
          {
            data: { nodeDependentOnRight: 'a', right: 'c' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        options: [options],
      })
    })

    it('detects function expression dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = () => 1,
            a = b(),
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = function() { return 1 },
            a = b(),
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = () => 1,
            a = a.map(b),
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects dependencies in object literals', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = 1,
            a = {x: b},
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = 1,
            a = {[b]: 0},
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects chained member expression dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = {x: 1},
            a = b.x,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = new Subject(),
            a = b.asObservable(),
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects optional chaining dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = {x: 1},
            a = b?.x,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects non-null assertion dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = 1,
            a = b!,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects unary expression dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = true,
            a = !b,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects spread element dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = {x: 1},
            a = {...b},
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = [1],
            a = [...b],
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects dependencies in conditional expressions', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = 0,
            a = b ? 1 : 0,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = 0,
            a = x ? b : 0,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = 0,
            a = x ? 0 : b,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects dependencies in type assertions', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = 'b',
            a = b as any,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = 'b',
            a = <any>b,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects dependencies in template literals', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = 'b',
            a = \`\${b}\`,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('ignores function body dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            a = () => b,
            b = 1,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            a = function() { return b },
            b = 1,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            a = () => {return b},
            b = 1,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects dependencies in object destructuring patterns', async () => {
      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'a',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let {
            b: bRenamed,
            a = bRenamed,
          } = obj;
        `,
        code: dedent`
          let {
            a = bRenamed,
            b: bRenamed,
          } = obj;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'a',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let [{
            b: bRenamed,
            a = bRenamed,
          }] = [obj];
        `,
        code: dedent`
          let [{
            a = bRenamed,
            b: bRenamed,
          }] = [obj];
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'a',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let {
            [b]: bRenamed,
            a = bRenamed,
          } = obj;
        `,
        code: dedent`
          let {
            a = bRenamed,
            [b]: bRenamed,
          } = obj;
        `,
        options: [options],
      })
    })

    it('detects and handles circular dependencies', async () => {
      await invalid({
        output: dedent`
          let Func = ({
            a,
            b = f + 1,
            c,
            d = b + 1,
            e,
            f = d + 1
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            b = f + 1,
            a,
            c,
            d = b + 1,
            e,
            f = d + 1
          }) => {
            // ...
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [options],
      })
    })

    it('prioritizes dependencies over group configuration', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: [
              {
                groupName: 'attributesStartingWithA',
                elementNamePattern: '^a',
              },
              {
                groupName: 'attributesStartingWithB',
                elementNamePattern: '^b',
              },
            ],
            groups: ['attributesStartingWithA', 'attributesStartingWithB'],
          },
        ],
        code: dedent`
          let Func = ({
            b,
            a = b,
          }) => {
            // ...
          }
        `,
      })
    })

    it('prioritizes dependencies over partition comments', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'a' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let Func = ({
            a = 0,
            // Part: 1
            b = a,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            b = a,
            // Part: 1
            a = 0,
          }) => {
            // ...
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('prioritizes dependencies over newline partitions', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'a' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let Func = ({
            a = 0,

            b = a,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            b = a,

            a = 0,
          }) => {
            // ...
          }
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('allows using partition comments', async () => {
      await invalid({
        output: dedent`
          let Obj = {
            // Part: 1
            d: 'ddd',
            e: 'ee',
            // Part: 2
            f: 'f',
            // Part: 3
            a: 'aaaaaa',
            // Not partition comment
            b: 'bbbbb',
            c: 'cccc',
          }
        `,
        code: dedent`
          let Obj = {
            // Part: 1
            e: 'ee',
            d: 'ddd',
            // Part: 2
            f: 'f',
            // Part: 3
            a: 'aaaaaa',
            c: 'cccc',
            // Not partition comment
            b: 'bbbbb',
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'd', left: 'e' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('allows treating all comments as partitions', async () => {
      await valid({
        code: dedent`
          let Obj = {
            // Some comment
            b: 'b',
            // Other comment
            a: 'aa',
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

    it('allows using multiple partition comments', async () => {
      await invalid({
        output: dedent`
          let Object = {
            /* Partition Comment */
            // Part: 1
            c: 'cc',
            // Part: 2
            a: 'aaaa',
            b: 'bbb',
            d: 'd',
            /* Part: 3 */
            e: 'e',
          }
        `,
        code: dedent`
          let Object = {
            /* Partition Comment */
            // Part: 1
            c: 'cc',
            // Part: 2
            b: 'bbb',
            a: 'aaaa',
            d: 'd',
            /* Part: 3 */
            e: 'e',
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: ['Partition Comment', 'Part:'],
          },
        ],
      })
    })

    it('allows using regex patterns for partition comments', async () => {
      await valid({
        code: dedent`
          let obj = {
            e = 'e',
            f = 'f',
            // I am a partition comment because I don't have f o o
            a = 'a',
            b = 'b',
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

    it('ignores block comments when using line partition option', async () => {
      await invalid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let Obj = {
            /* Comment */
            a: 'a',
            b: 'b',
          }
        `,
        code: dedent`
          let Obj = {
            b: 'b',
            /* Comment */
            a: 'a',
          }
        `,
      })
    })

    it('treats line comments as partitions when line option is enabled', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        code: dedent`
          let Obj = {
            b: 'b',
            // Comment
            a: 'a',
          }
        `,
      })
    })

    it('allows multiple line partition comments with specific patterns', async () => {
      await valid({
        code: dedent`
          let Obj = {
            c: 'c',
            // b
            b: 'b',
            // a
            a: 'a',
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['a', 'b'],
            },
          },
        ],
      })
    })

    it('allows regex patterns for line partition comments', async () => {
      await valid({
        code: dedent`
          let Obj = {
            b: 'b',
            // I am a partition comment because I don't have f o o
            a: 'a',
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

    it('ignores line comments when using block partition option', async () => {
      await invalid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let Obj = {
            // Comment
            a: 'a',
            b: 'b',
          }
        `,
        code: dedent`
          let Obj = {
            b: 'b',
            // Comment
            a: 'a',
          }
        `,
      })
    })

    it('treats block comments as partitions when block option is enabled', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        code: dedent`
          let Obj = {
            b: 'b',
            /* Comment */
            a: 'a',
          }
        `,
      })
    })

    it('allows multiple block partition comments with specific patterns', async () => {
      await valid({
        code: dedent`
          let Obj = {
            c: 'c',
            /* b */
            b: 'b',
            /* a */
            a: 'a',
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['a', 'b'],
            },
          },
        ],
      })
    })

    it('allows regex patterns for block partition comments', async () => {
      await valid({
        code: dedent`
          let Obj = {
            b: 'b',
            /* I am a partition comment because I don't have f o o */
            a: 'a',
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

    it('allows using newlines as partitions', async () => {
      await valid({
        code: dedent`
          let Obj = {
            d: 'dd',
            e: 'e',

            c: 'ccc',

            a: 'aaaaa',
            b: 'bbbb',
          }
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'd', left: 'e' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let Obj = {
            d: 'dd',
            e: 'e',

            c: 'ccc',

            a: 'aaaaa',
            b: 'bbbb',
          }
        `,
        code: dedent`
          let Obj = {
            e: 'e',
            d: 'dd',

            c: 'ccc',

            b: 'bbbb',
            a: 'aaaaa',
          }
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('allows trimming special characters', async () => {
      await valid({
        code: dedent`
          let obj = {
            _a = 'a',
            b = 'b',
            _c = 'c',
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

    it('allows removing special characters', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          let obj = {
            ab = 'ab',
            a_c = 'ac',
          }
        `,
      })
    })

    it('sorts using specified locale', async () => {
      await valid({
        code: dedent`
          let obj = {
            你好 = '你好',
            世界 = '世界',
            a = 'a',
            A = 'A',
            b = 'b',
            B = 'B',
          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('prioritizes methods over member selector', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: 'memberProperty',
              rightGroup: 'method',
              leftGroup: 'member',
              right: 'method',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        output: dedent`
          let obj = {
            method() {},
            memberProperty: something,
          }
        `,
        code: dedent`
          let obj = {
            memberProperty: something,
            method() {},
          }
        `,
        options: [
          {
            ...options,
            groups: ['method', 'member'],
          },
        ],
      })
    })

    it('prioritizes properties over methods when configured', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'property',
              leftGroup: 'member',
              right: 'property',
              left: 'method',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['property', 'member'],
          },
        ],
        output: dedent`
          let obj = {
            property,
            method() {},
          }
        `,
        code: dedent`
          let obj = {
            method() {},
            property,
          }
        `,
      })
    })

    it('sorts by configured groups', async () => {
      await valid({
        code: dedent`
          let obj = {
            z: {
              // Some multiline stuff
            },
            f: 'a',
            a1: () => {},
            a2: function() {},
            a3() {},
          }
        `,
        options: [
          {
            ...options,
            groups: ['multiline-member', 'unknown', 'method'],
          },
        ],
      })
    })

    it('removes newlines between groups when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenObjectMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenObjectMembers',
            data: { right: 'b', left: 'z' },
          },
        ],
        code: dedent`
          let Obj = {
            a: () => null,


           y: "y",
          z: "z",

              b: "b",
          }
        `,
        output: dedent`
          let Obj = {
            a: () => null,
           b: "b",
          y: "y",
              z: "z",
          }
        `,
        options: [
          {
            ...options,
            groups: ['method', 'unknown'],
            newlinesBetween: 0,
          },
        ],
      })
    })

    it('handles newlinesBetween configuration between consecutive groups', async () => {
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
              {
                elementNamePattern: 'c',
                groupName: 'c',
              },
              {
                elementNamePattern: 'd',
                groupName: 'd',
              },
              {
                elementNamePattern: 'e',
                groupName: 'e',
              },
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
            messageId: 'missedSpacingBetweenObjectMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenObjectMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenObjectMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          let obj = {
            a: 'a',

            b: 'b',

            c: 'c',
            d: 'd',


            e: 'e',
          }
        `,
        code: dedent`
          let obj = {
            a: 'a',
            b: 'b',


            c: 'c',

            d: 'd',


            e: 'e',
          }
        `,
      })
    })

    it.each([
      [2, 0],
      [2, 'ignore'],
      [0, 2],
      ['ignore', 2],
    ])(
      'enforces newlines between non-consecutive groups when global is %s and group is %s',
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
              messageId: 'missedSpacingBetweenObjectMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            let obj = {
              a: null,


              b: null,
            }
          `,
          code: dedent`
            let obj = {
              a: null,
              b: null,
            }
          `,
        })
      },
    )

    it.each([1, 2, 'ignore', 0])(
      'removes newlines when 0 is configured between all groups (global: %s)',
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
              messageId: 'extraSpacingBetweenObjectMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            let obj = {
              a: null,
              b: null,
            }
          `,
          code: dedent`
            let obj = {
              a: null,

              b: null,
            }
          `,
        })
      },
    )

    it.each([
      ['ignore', 0],
      [0, 'ignore'],
    ])(
      'allows any spacing when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        let testOptions = {
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
        }

        await valid({
          code: dedent`
            let obj = {
              a: null,

              b: null,
            }
          `,
          options: [testOptions],
        })

        await valid({
          code: dedent`
            let obj = {
              a: null,
              b: null,
            }
          `,
          options: [testOptions],
        })
      },
    )

    it('preserves comments and handles newlines after fixes', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'unknown',
              leftGroup: 'method',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        output: dedent`
          let obj = {
            a, // Comment after

            b() {},
            c() {},
          };
        `,
        code: dedent`
          let obj = {
            b() {},
            a, // Comment after

            c() {},
          };
        `,
        options: [
          {
            groups: ['unknown', 'method'],
            newlinesBetween: 1,
          },
        ],
      })
    })

    it('preserves newlines between different partitions when newlinesBetween is 0', async () => {
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
        output: dedent`
          let obj = {
            a,

            // Partition comment

            b,
            c,
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        code: dedent`
          let obj = {
            a,

            // Partition comment

            c,
            b,
          }
        `,
      })
    })

    it('sorts inline object properties correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let obj = {
            a: string, b: string
          }
        `,
        code: dedent`
          let obj = {
            b: string, a: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let obj = {
            a: string, b: string,
          }
        `,
        code: dedent`
          let obj = {
            b: string, a: string,
          }
        `,
        options: [options],
      })
    })

    it.each([
      '^r|g|b$',
      ['noMatch', '^r|g|b$'],
      { pattern: '^R|G|B$', flags: 'i' },
      ['noMatch', { pattern: '^R|G|B$', flags: 'i' }],
    ])(
      'applies configuration when allNamesMatchPattern matches (pattern: %s)',
      async rgbAllNamesMatchPattern => {
        await invalid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                allNamesMatchPattern: 'foo',
              },
            },
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: 'r',
                  groupName: 'r',
                },
                {
                  elementNamePattern: 'g',
                  groupName: 'g',
                },
                {
                  elementNamePattern: 'b',
                  groupName: 'b',
                },
              ],
              useConfigurationIf: {
                allNamesMatchPattern: rgbAllNamesMatchPattern,
              },
              groups: ['r', 'g', 'b'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'g',
                leftGroup: 'b',
                right: 'g',
                left: 'b',
              },
              messageId: 'unexpectedObjectsGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedObjectsGroupOrder',
            },
          ],
          output: dedent`
            let obj = {
              r: string,
              g: string,
              b: string
            }
          `,
          code: dedent`
            let obj = {
              b: string,
              g: string,
              r: string
            }
          `,
        })
      },
    )

    it('applies configuration when callingFunctionNamePattern matches', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'g',
              leftGroup: 'b',
              right: 'g',
              left: 'b',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
          {
            data: {
              rightGroup: 'r',
              leftGroup: 'g',
              right: 'r',
              left: 'g',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
          {
            data: {
              rightGroup: 'g',
              leftGroup: 'b',
              right: 'g',
              left: 'b',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
          {
            data: {
              rightGroup: 'r',
              leftGroup: 'g',
              right: 'r',
              left: 'g',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            useConfigurationIf: {
              callingFunctionNamePattern: 'foo',
            },
          },
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'r',
                groupName: 'r',
              },
              {
                elementNamePattern: 'g',
                groupName: 'g',
              },
              {
                elementNamePattern: 'b',
                groupName: 'b',
              },
            ],
            useConfigurationIf: {
              callingFunctionNamePattern: '^someFunction$',
            },
            groups: ['r', 'g', 'b'],
          },
        ],
        output: dedent`
          let obj = {
            b,
            g,
            r
          }

          someFunction(true, {
            r: string,
            g: string,
            b: string
          })

          let a = someFunction(true, {
            r: string,
            g: string,
            b: string
          })
        `,
        code: dedent`
          let obj = {
            b,
            g,
            r
          }

          someFunction(true, {
            b: string,
            g: string,
            r: string
          })

          let a = someFunction(true, {
            b: string,
            g: string,
            r: string
          })
        `,
      })
    })

    it('filters custom groups by selector and modifiers', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unusedCustomGroup',
                modifiers: ['multiline'],
                selector: 'method',
              },
              {
                groupName: 'multilinePropertyGroup',
                modifiers: ['multiline'],
                selector: 'property',
              },
              {
                groupName: 'propertyGroup',
                selector: 'property',
              },
            ],
            groups: ['propertyGroup', 'multilinePropertyGroup'],
          },
        ],
        errors: [
          {
            data: {
              leftGroup: 'multilinePropertyGroup',
              rightGroup: 'propertyGroup',
              right: 'c',
              left: 'b',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        output: dedent`
          let obj = {
            c,
            a: {
              // Multiline
            },
            b: {
              // Multiline
            },
          }
        `,
        code: dedent`
          let obj = {
            a: {
              // Multiline
            },
            b: {
              // Multiline
            },
            c,
          }
        `,
      })
    })

    it.each([
      'hello',
      ['noMatch', 'hello'],
      { pattern: 'HELLO', flags: 'i' },
      ['noMatch', { pattern: 'HELLO', flags: 'i' }],
    ])(
      'filters custom groups by elementNamePattern (%s)',
      async elementNamePattern => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'propertiesStartingWithHello',
                  selector: 'property',
                  elementNamePattern,
                },
              ],
              groups: ['propertiesStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'propertiesStartingWithHello',
                right: 'helloProperty',
                leftGroup: 'unknown',
                left: 'method',
              },
              messageId: 'unexpectedObjectsGroupOrder',
            },
          ],
          output: dedent`
            let obj = {
              helloProperty,
              a,
              b,
              method() {},
            }
          `,
          code: dedent`
            let obj = {
              a,
              b,
              method() {},
              helloProperty,
            }
          `,
        })
      },
    )

    it.each([
      'inject',
      ['noMatch', 'inject'],
      { pattern: 'INJECT', flags: 'i' },
      ['noMatch', { pattern: 'INJECT', flags: 'i' }],
    ])(
      'filters custom groups by elementValuePattern (%s)',
      async injectElementValuePattern => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  elementValuePattern: injectElementValuePattern,
                  groupName: 'inject',
                },
                {
                  elementValuePattern: 'computed',
                  groupName: 'computed',
                },
              ],
              groups: ['computed', 'inject', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'computed',
                leftGroup: 'inject',
                right: 'z',
                left: 'y',
              },
              messageId: 'unexpectedObjectsGroupOrder',
            },
          ],
          output: dedent`
            let obj = {
              a: computed(A),
              z: computed(Z),
              b: inject(B),
              y: inject(Y),
              c() {},
            }
          `,
          code: dedent`
            let obj = {
              a: computed(A),
              b: inject(B),
              y: inject(Y),
              z: computed(Z),
              c() {},
            }
          `,
        })
      },
    )

    it('sorts custom groups with overridden type and order', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            data: { right: 'dddd', left: 'ccc' },
            messageId: 'unexpectedObjectsOrder',
          },
          {
            data: {
              rightGroup: 'reversedPropertiesByLineLength',
              leftGroup: 'unknown',
              left: 'method',
              right: 'eee',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedPropertiesByLineLength',
                selector: 'property',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedPropertiesByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          let obj = {
            dddd,
            ccc,
            eee,
            bb,
            ff,
            a,
            g,
            anotherMethod() {},
            method() {},
            yetAnotherMethod() {},
          }
        `,
        code: dedent`
          let obj = {
            a,
            bb,
            ccc,
            dddd,
            method() {},
            eee,
            ff,
            g,
            anotherMethod() {},
            yetAnotherMethod() {},
          }
        `,
      })
    })

    it('sorts custom groups with fallbackSort override', async () => {
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
            data: { right: 'fooBar', left: 'fooZar' },
            messageId: 'unexpectedObjectsOrder',
          },
        ],
        output: dedent`
          let obj = {
            fooBar: 'fooBar',
            fooZar: 'fooZar',
          }
        `,
        code: dedent`
          let obj = {
            fooZar: 'fooZar',
            fooBar: 'fooBar',
          }
        `,
      })
    })

    it('preserves order within unsorted custom groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedProperties',
                selector: 'property',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedProperties', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedProperties',
              leftGroup: 'unknown',
              left: 'method',
              right: 'c',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        output: dedent`
          let obj = {
            b,
            a,
            d,
            e,
            c,
            method() {},
          }
        `,
        code: dedent`
          let obj = {
            b,
            a,
            d,
            e,
            method() {},
            c,
          }
        `,
      })
    })

    it('sorts custom groups with anyOf conditions', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    modifiers: ['multiline'],
                    selector: 'property',
                  },
                  {
                    modifiers: ['multiline'],
                    selector: 'method',
                  },
                ],
                groupName: 'multilinePropertiesAndMultilineMethods',
              },
            ],
            groups: ['multilinePropertiesAndMultilineMethods', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'multilinePropertiesAndMultilineMethods',
              leftGroup: 'unknown',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        output: dedent`
          let obj = {
            b() {
              // Multiline
            },
            c: {
              // Multiline
            },
            a,
            d() {},
            e,
          }
        `,
        code: dedent`
          let obj = {
            a,
            b() {
              // Multiline
            },
            c: {
              // Multiline
            },
            d() {},
            e,
          }
        `,
      })
    })

    it('allows regex patterns for element names in custom groups', async () => {
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
          let obj = {
            iHaveFooInMyName,
            meTooIHaveFoo,
            a,
            b,
          }
        `,
      })
    })

    it('enforces newlines within custom groups when newlinesInside is 1', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                selector: 'property',
                groupName: 'group1',
                newlinesInside: 1,
              },
            ],
            groups: ['group1'],
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenObjectMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          let obj = {
            a,

            b,
          }
        `,
        code: dedent`
          let obj = {
            a,
            b,
          }
        `,
      })
    })

    it('removes newlines within custom groups when newlinesInside is 0', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                selector: 'property',
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
            messageId: 'extraSpacingBetweenObjectMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          let obj = {
            a,
            b,
          }
        `,
        code: dedent`
          let obj = {
            a,

            b,
          }
        `,
      })
    })

    it('allows regex patterns in custom groups', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^(?!.*Foo).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
          },
        ],
        code: dedent`
          let obj = {
            iHaveFooInMyName,
            meTooIHaveFoo,
            a,
            b,
          }
        `,
      })
    })
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it('sorts object with identifier and literal keys', async () => {
      await valid({
        code: dedent`
          let Obj = {
            a: 'aaaa',
            [c]: 'cc',
            b: 'bbb',
            d: 'd',
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Obj = {
            a: 'aaaa',
            [c]: 'cc',
            b: 'bbb',
            d: 'd',
          }
        `,
        code: dedent`
          let Obj = {
            a: 'aaaa',
            b: 'bbb',
            [c]: 'cc',
            d: 'd',
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'c', left: 'b' },
          },
        ],
        options: [options],
      })
    })

    it('preserves object structure when sorting', async () => {
      await valid({
        code: dedent`
          let Obj = {
            b: 'bb',
            c: 'c',
            ...rest,
            a: 'aaa',
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Obj = {
            b: 'bb',
            c: 'c',
            ...rest,
            a: 'aaa',
          }
        `,
        code: dedent`
          let Obj = {
            c: 'c',
            b: 'bb',
            ...rest,
            a: 'aaa',
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [options],
      })
    })

    it('sorts nested objects', async () => {
      await valid({
        code: dedent`
          let Obj = {
            x: {
              a: 'aa',
              b: 'b',
            },
            y: {
              a: 'aa',
              b: 'b',
            },
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let Obj = {
            y: {
              a: 'aa',
              b: 'b',
            },
            x: {
              a: 'aa',
              b: 'b',
            },
          }
        `,
        code: dedent`
          let Obj = {
            y: {
              b: 'b',
              a: 'aa',
            },
            x: {
              b: 'b',
              a: 'aa',
            },
          }
        `,
        options: [options],
      })
    })

    it('sorts objects with computed keys', async () => {
      await valid({
        code: dedent`
          let Obj = {
            [c[1]]: 'c',
            [b()]: 'bb',
            'a': 'aaa',
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b()', left: 'a' },
          },
        ],
        output: dedent`
          let Obj = {
            [c[1]]: 'c',
            [b()]: 'bb',
            'a': 'aaa',
          }
        `,
        code: dedent`
          let Obj = {
            [c[1]]: 'c',
            'a': 'aaa',
            [b()]: 'bb',
          }
        `,
        options: [options],
      })
    })

    it('allows using regex patterns for custom groups', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^(?!.*Foo).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
          },
        ],
        code: dedent`
          let Obj = {
            iHaveFooInMyName: string,
            meTooIHaveFoo: string,
            a: string,
            b: "b",
          }
        `,
      })
    })

    it('sorts with inline comments', async () => {
      await valid({
        code: dedent`
          let Obj = {
            a: 'aaa', // Comment A
            b: 'bb', // Comment B
            c: 'c' // Comment C
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Obj = {
            a: 'aaa', // Comment A
            b: 'bb', // Comment B
            c: 'c', // Comment C
          }
        `,
        code: dedent`
          let Obj = {
            a: 'aaa', // Comment A
            c: 'c', // Comment C
            b: 'bb', // Comment B
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [options],
      })
    })

    it('sorts objects without trailing comma when last element has a comment', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let Obj = {
            a: 'aa', // Comment A
            b: 'b' // Comment B
          }
        `,
        code: dedent`
          let Obj = {
            b: 'b', // Comment B
            a: 'aa' // Comment A
          }
        `,
        options: [options],
      })
    })

    it('sorts destructured object parameters', async () => {
      await invalid({
        output: dedent`
          let Func = ({
            a = 'aa',
            c,
            b
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            c,
            a = 'aa',
            b
          }) => {
            // ...
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'c' },
          },
        ],
        options: [options],
      })
    })

    it('preserves order when right value depends on left value', async () => {
      await invalid({
        output: dedent`
          let Func = ({
            a = 'a',
            c,
            b = c,
            d,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            c,
            b = c,
            a = 'a',
            d,
          }) => {
            // ...
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [options],
      })
    })

    it('handles complex dependencies between destructured parameters', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'c' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
          {
            data: { nodeDependentOnRight: 'b', right: 'd' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let Func = ({
            a,
            c,
            d,
            b = a + c + d,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            a,
            b = a + c + d,
            c,
            d,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Func = ({
            a,
            b,
            c = 1 === 1 ? 1 === 1 ? a : b : b,
            d,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            a,
            c = 1 === 1 ? 1 === 1 ? a : b : b,
            b,
            d,
          }) => {
            // ...
          }
        `,
        errors: [
          {
            data: { nodeDependentOnRight: 'c', right: 'b' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'c' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
          {
            data: { nodeDependentOnRight: 'b', right: 'd' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let Func = ({
            a,
            c,
            d,
            b = ['a', 'b', 'c'].includes(d, c, a),
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            a,
            b = ['a', 'b', 'c'].includes(d, c, a),
            c,
            d,
          }) => {
            // ...
          }
        `,
        options: [
          {
            type: 'alphabetical',
            order: 'asc',
          },
        ],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'a' },
          },
          {
            data: { nodeDependentOnRight: 'b', right: 'c' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let Func = ({
            c,
            b = c || c,
            a,
            d,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            a,
            b = c || c,
            c,
            d,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Func = ({
            a,
            c,
            b = 1 === 1 ? a : c,
            d,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            a,
            b = 1 === 1 ? a : c,
            c,
            d,
          }) => {
            // ...
          }
        `,
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'c' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'a' },
          },
          {
            data: { nodeDependentOnRight: 'a', right: 'c' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let Func = ({
              b = 10,
              c = 10,
              a = c,
              }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
              a = c,
              b = 10,
              c = 10,
              }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects function expression dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = () => 1,
            a = b(),
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = function() { return 1 },
            a = b(),
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = () => 1,
            a = a.map(b),
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects dependencies in object literals', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = 1,
            a = {x: b},
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = 1,
            a = {[b]: 0},
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects chained member expression dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = {x: 1},
            a = b.x,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = new Subject(),
            a = b.asObservable(),
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects optional chaining dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = {x: 1},
            a = b?.x,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects non-null assertion dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = 1,
            a = b!,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects unary expression dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = true,
            a = !b,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects spread element dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = {x: 1},
            a = {...b},
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = [1],
            a = [...b],
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects dependencies in conditional expressions', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = 0,
            a = b ? 1 : 0,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = 0,
            a = x ? b : 0,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = 0,
            a = x ? 0 : b,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects dependencies in type assertions', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = 'b',
            a = b as any,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            b = 'b',
            a = <any>b,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects dependencies in template literals', async () => {
      await valid({
        code: dedent`
          let Func = ({
            b = 'b',
            a = \`\${b}\`,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('ignores function body dependencies', async () => {
      await valid({
        code: dedent`
          let Func = ({
            a = () => b,
            b = 1,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            a = function() { return b },
            b = 1,
          }) => {
            // ...
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let Func = ({
            a = () => {return b},
            b = 1,
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('detects dependencies in object destructuring patterns', async () => {
      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'a',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let {
            b: bRenamed,
            a = bRenamed,
          } = obj;
        `,
        code: dedent`
          let {
            a = bRenamed,
            b: bRenamed,
          } = obj;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'a',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let [{
            b: bRenamed,
            a = bRenamed,
          }] = [obj];
        `,
        code: dedent`
          let [{
            a = bRenamed,
            b: bRenamed,
          }] = [obj];
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'a',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let {
            [b]: bRenamed,
            a = bRenamed,
          } = obj;
        `,
        code: dedent`
          let {
            a = bRenamed,
            [b]: bRenamed,
          } = obj;
        `,
        options: [options],
      })
    })

    it('detects and handles circular dependencies', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'd', left: 'c' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'f', left: 'e' },
          },
        ],
        output: dedent`
          let Func = ({
            b = f + 1,
            d = b + 1,
            f = d + 1,
            a,
            c,
            e
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            b = f + 1,
            a,
            c,
            d = b + 1,
            e,
            f = d + 1
          }) => {
            // ...
          }
        `,
        options: [options],
      })
    })

    it('prioritizes dependencies over group configuration', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: [
              {
                groupName: 'attributesStartingWithA',
                elementNamePattern: '^a',
              },
              {
                groupName: 'attributesStartingWithB',
                elementNamePattern: '^b',
              },
            ],
            groups: ['attributesStartingWithA', 'attributesStartingWithB'],
          },
        ],
        code: dedent`
          let Func = ({
            b,
            a = b,
          }) => {
            // ...
          }
        `,
      })
    })

    it('prioritizes dependencies over partition comments', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'a' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let Func = ({
            a = 0,
            // Part: 1
            b = a,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            b = a,
            // Part: 1
            a = 0,
          }) => {
            // ...
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('prioritizes dependencies over newline partitions', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'a' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let Func = ({
            a = 0,

            b = a,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            b = a,

            a = 0,
          }) => {
            // ...
          }
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('allows using partition comments', async () => {
      await invalid({
        output: dedent`
          let Obj = {
            // Part: 1
            d: 'ddd',
            e: 'ee',
            // Part: 2
            f: 'f',
            // Part: 3
            a: 'aaaaaa',
            // Not partition comment
            b: 'bbbbb',
            c: 'cccc',
          }
        `,
        code: dedent`
          let Obj = {
            // Part: 1
            e: 'ee',
            d: 'ddd',
            // Part: 2
            f: 'f',
            // Part: 3
            a: 'aaaaaa',
            c: 'cccc',
            // Not partition comment
            b: 'bbbbb',
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'd', left: 'e' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('allows treating all comments as partitions', async () => {
      await valid({
        code: dedent`
          let Obj = {
            // Some comment
            b: 'b',
            // Other comment
            a: 'aa',
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

    it('allows using multiple partition comments', async () => {
      await invalid({
        output: dedent`
          let Object = {
            /* Partition Comment */
            // Part: 1
            c: 'cc',
            // Part: 2
            a: 'aaaa',
            b: 'bbb',
            d: 'd',
            /* Part: 3 */
            e: 'e',
          }
        `,
        code: dedent`
          let Object = {
            /* Partition Comment */
            // Part: 1
            c: 'cc',
            // Part: 2
            b: 'bbb',
            a: 'aaaa',
            d: 'd',
            /* Part: 3 */
            e: 'e',
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: ['Partition Comment', 'Part:'],
          },
        ],
      })
    })

    it('allows using regex patterns for partition comments', async () => {
      await valid({
        code: dedent`
          let obj = {
            e = 'e',
            f = 'f',
            // I am a partition comment because I don't have f o o
            a = 'a',
            b = 'b',
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

    it('ignores block comments when using line partition option', async () => {
      await invalid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          let Obj = {
            /* Comment */
            aa: 'a',
            b: 'b',
          }
        `,
        code: dedent`
          let Obj = {
            b: 'b',
            /* Comment */
            aa: 'a',
          }
        `,
      })
    })

    it('treats line comments as partitions when line option is enabled', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        code: dedent`
          let Obj = {
            b: 'b',
            // Comment
            a: 'a',
          }
        `,
      })
    })

    it('allows multiple line partition comments with specific patterns', async () => {
      await valid({
        code: dedent`
          let Obj = {
            c: 'c',
            // b
            b: 'b',
            // a
            a: 'a',
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['a', 'b'],
            },
          },
        ],
      })
    })

    it('allows regex patterns for line partition comments', async () => {
      await valid({
        code: dedent`
          let Obj = {
            b: 'b',
            // I am a partition comment because I don't have f o o
            a: 'a',
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

    it('ignores line comments when using block partition option', async () => {
      await invalid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          let Obj = {
            // Comment
            aa: 'a',
            b: 'b',
          }
        `,
        code: dedent`
          let Obj = {
            b: 'b',
            // Comment
            aa: 'a',
          }
        `,
      })
    })

    it('treats block comments as partitions when block option is enabled', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        code: dedent`
          let Obj = {
            b: 'b',
            /* Comment */
            a: 'a',
          }
        `,
      })
    })

    it('allows multiple block partition comments with specific patterns', async () => {
      await valid({
        code: dedent`
          let Obj = {
            c: 'c',
            /* b */
            b: 'b',
            /* a */
            a: 'a',
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['a', 'b'],
            },
          },
        ],
      })
    })

    it('allows regex patterns for block partition comments', async () => {
      await valid({
        code: dedent`
          let Obj = {
            b: 'b',
            /* I am a partition comment because I don't have f o o */
            a: 'a',
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

    it('allows using newlines as partitions', async () => {
      await valid({
        code: dedent`
          let Obj = {
            d: 'dd',
            e: 'e',

            c: 'ccc',

            a: 'aaaaa',
            b: 'bbbb',
          }
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'd', left: 'e' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let Obj = {
            d: 'dd',
            e: 'e',

            c: 'ccc',

            a: 'aaaaa',
            b: 'bbbb',
          }
        `,
        code: dedent`
          let Obj = {
            e: 'e',
            d: 'dd',

            c: 'ccc',

            b: 'bbbb',
            a: 'aaaaa',
          }
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('allows trimming special characters', async () => {
      await valid({
        code: dedent`
          let obj = {
            _a = 'a',
            bb = 'b',
            _c = 'c',
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

    it('allows removing special characters', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          let obj = {
            abc = 'ab',
            a_c = 'ac',
          }
        `,
      })
    })

    it('sorts using specified locale', async () => {
      await valid({
        code: dedent`
          let obj = {
            你好 = '你好',
            世界 = '世界',
            a = 'a',
            A = 'A',
            b = 'b',
            B = 'B',
          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('prioritizes methods over member selector', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: 'memberProperty',
              rightGroup: 'method',
              leftGroup: 'member',
              right: 'method',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        output: dedent`
          let obj = {
            method() {},
            memberProperty: something,
          }
        `,
        code: dedent`
          let obj = {
            memberProperty: something,
            method() {},
          }
        `,
        options: [
          {
            ...options,
            groups: ['method', 'member'],
          },
        ],
      })
    })

    it('prioritizes properties over methods when configured', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'property',
              leftGroup: 'member',
              right: 'property',
              left: 'method',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['property', 'member'],
          },
        ],
        output: dedent`
          let obj = {
            property,
            method() {},
          }
        `,
        code: dedent`
          let obj = {
            method() {},
            property,
          }
        `,
      })
    })

    it('sorts by configured groups', async () => {
      await valid({
        code: dedent`
          let obj = {
            z: {
              // Some multiline stuff
            },
            f: 'a',
            a2: function() {},
            a1: () => {},
            a3() {},
          }
        `,
        options: [
          {
            ...options,
            groups: ['multiline-member', 'unknown', 'method'],
          },
        ],
      })
    })

    it('removes newlines between groups when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: 'aaaa',
              right: 'yy',
            },
            messageId: 'extraSpacingBetweenObjectMembers',
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'bbb', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenObjectMembers',
            data: { right: 'bbb', left: 'z' },
          },
        ],
        code: dedent`
          let Obj = {
            aaaa: () => null,


           yy: "y",
          z: "z",

              bbb: "b",
          }
        `,
        output: dedent`
          let Obj = {
            aaaa: () => null,
           bbb: "b",
          yy: "y",
              z: "z",
          }
        `,
        options: [
          {
            ...options,
            groups: ['method', 'unknown'],
            newlinesBetween: 0,
          },
        ],
      })
    })

    it('handles newlinesBetween configuration between consecutive groups', async () => {
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
              {
                elementNamePattern: 'c',
                groupName: 'c',
              },
              {
                elementNamePattern: 'd',
                groupName: 'd',
              },
              {
                elementNamePattern: 'e',
                groupName: 'e',
              },
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
            messageId: 'missedSpacingBetweenObjectMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenObjectMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenObjectMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          let obj = {
            a: 'a',

            b: 'b',

            c: 'c',
            d: 'd',


            e: 'e',
          }
        `,
        code: dedent`
          let obj = {
            a: 'a',
            b: 'b',


            c: 'c',

            d: 'd',


            e: 'e',
          }
        `,
      })
    })

    it.each([
      [2, 0],
      [2, 'ignore'],
      [0, 2],
      ['ignore', 2],
    ])(
      'enforces newlines between non-consecutive groups when global is %s and group is %s',
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
              messageId: 'missedSpacingBetweenObjectMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            let obj = {
              a: null,


              b: null,
            }
          `,
          code: dedent`
            let obj = {
              a: null,
              b: null,
            }
          `,
        })
      },
    )

    it.each([1, 2, 'ignore', 0])(
      'removes newlines when 0 is configured between all groups (global: %s)',
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
              messageId: 'extraSpacingBetweenObjectMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            let obj = {
              a: null,
              b: null,
            }
          `,
          code: dedent`
            let obj = {
              a: null,

              b: null,
            }
          `,
        })
      },
    )

    it.each([
      ['ignore', 0],
      [0, 'ignore'],
    ])(
      'allows any spacing when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        let testOptions = {
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
        }

        await valid({
          code: dedent`
            let obj = {
              a: null,

              b: null,
            }
          `,
          options: [testOptions],
        })

        await valid({
          code: dedent`
            let obj = {
              a: null,
              b: null,
            }
          `,
          options: [testOptions],
        })
      },
    )

    it('preserves comments and handles newlines after fixes', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'unknown',
              leftGroup: 'method',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        output: dedent`
          let obj = {
            a, // Comment after

            b() {},
            c() {},
          };
        `,
        code: dedent`
          let obj = {
            b() {},
            a, // Comment after

            c() {},
          };
        `,
        options: [
          {
            groups: ['unknown', 'method'],
            newlinesBetween: 1,
          },
        ],
      })
    })

    it('preserves newlines between different partitions when newlinesBetween is 0', async () => {
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
        output: dedent`
          let obj = {
            a,

            // Partition comment

            bb,
            c,
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
        code: dedent`
          let obj = {
            a,

            // Partition comment

            c,
            bb,
          }
        `,
      })
    })

    it('sorts inline object properties correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          let obj = {
            aa: string, b: string
          }
        `,
        code: dedent`
          let obj = {
            b: string, aa: string
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          let obj = {
            aa: string, b: string,
          }
        `,
        code: dedent`
          let obj = {
            b: string, aa: string,
          }
        `,
        options: [options],
      })
    })

    it.each([
      '^r|g|b$',
      ['noMatch', '^r|g|b$'],
      { pattern: '^R|G|B$', flags: 'i' },
      ['noMatch', { pattern: '^R|G|B$', flags: 'i' }],
    ])(
      'applies configuration when allNamesMatchPattern matches (pattern: %s)',
      async rgbAllNamesMatchPattern => {
        await invalid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                allNamesMatchPattern: 'foo',
              },
            },
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: 'r',
                  groupName: 'r',
                },
                {
                  elementNamePattern: 'g',
                  groupName: 'g',
                },
                {
                  elementNamePattern: 'b',
                  groupName: 'b',
                },
              ],
              useConfigurationIf: {
                allNamesMatchPattern: rgbAllNamesMatchPattern,
              },
              groups: ['r', 'g', 'b'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'g',
                leftGroup: 'b',
                right: 'g',
                left: 'b',
              },
              messageId: 'unexpectedObjectsGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedObjectsGroupOrder',
            },
          ],
          output: dedent`
            let obj = {
              r: string,
              g: string,
              b: string
            }
          `,
          code: dedent`
            let obj = {
              b: string,
              g: string,
              r: string
            }
          `,
        })
      },
    )

    it('applies configuration when callingFunctionNamePattern matches', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'g',
              leftGroup: 'b',
              right: 'g',
              left: 'b',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
          {
            data: {
              rightGroup: 'r',
              leftGroup: 'g',
              right: 'r',
              left: 'g',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
          {
            data: {
              rightGroup: 'g',
              leftGroup: 'b',
              right: 'g',
              left: 'b',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
          {
            data: {
              rightGroup: 'r',
              leftGroup: 'g',
              right: 'r',
              left: 'g',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            useConfigurationIf: {
              callingFunctionNamePattern: 'foo',
            },
          },
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'r',
                groupName: 'r',
              },
              {
                elementNamePattern: 'g',
                groupName: 'g',
              },
              {
                elementNamePattern: 'b',
                groupName: 'b',
              },
            ],
            useConfigurationIf: {
              callingFunctionNamePattern: '^someFunction$',
            },
            groups: ['r', 'g', 'b'],
          },
        ],
        output: dedent`
          let obj = {
            b,
            g,
            r
          }

          someFunction(true, {
            r: string,
            g: string,
            b: string
          })

          let a = someFunction(true, {
            r: string,
            g: string,
            b: string
          })
        `,
        code: dedent`
          let obj = {
            b,
            g,
            r
          }

          someFunction(true, {
            b: string,
            g: string,
            r: string
          })

          let a = someFunction(true, {
            b: string,
            g: string,
            r: string
          })
        `,
      })
    })

    it('filters custom groups by selector and modifiers', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unusedCustomGroup',
                modifiers: ['multiline'],
                selector: 'method',
              },
              {
                groupName: 'multilinePropertyGroup',
                modifiers: ['multiline'],
                selector: 'property',
              },
              {
                groupName: 'propertyGroup',
                selector: 'property',
              },
            ],
            groups: ['propertyGroup', 'multilinePropertyGroup'],
          },
        ],
        errors: [
          {
            data: {
              leftGroup: 'multilinePropertyGroup',
              rightGroup: 'propertyGroup',
              right: 'c',
              left: 'b',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        output: dedent`
          let obj = {
            c,
            a: {
              // Multiline
            },
            b: {
              // Multiline
            },
          }
        `,
        code: dedent`
          let obj = {
            a: {
              // Multiline
            },
            b: {
              // Multiline
            },
            c,
          }
        `,
      })
    })

    it.each([
      'hello',
      ['noMatch', 'hello'],
      { pattern: 'HELLO', flags: 'i' },
      ['noMatch', { pattern: 'HELLO', flags: 'i' }],
    ])(
      'filters custom groups by elementNamePattern (%s)',
      async elementNamePattern => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'propertiesStartingWithHello',
                  selector: 'property',
                  elementNamePattern,
                },
              ],
              groups: ['propertiesStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'propertiesStartingWithHello',
                right: 'helloProperty',
                leftGroup: 'unknown',
                left: 'method',
              },
              messageId: 'unexpectedObjectsGroupOrder',
            },
          ],
          output: dedent`
            let obj = {
              helloProperty,
              a,
              b,
              method() {},
            }
          `,
          code: dedent`
            let obj = {
              a,
              b,
              method() {},
              helloProperty,
            }
          `,
        })
      },
    )

    it.each([
      'inject',
      ['noMatch', 'inject'],
      { pattern: 'INJECT', flags: 'i' },
      ['noMatch', { pattern: 'INJECT', flags: 'i' }],
    ])(
      'filters custom groups by elementValuePattern (%s)',
      async injectElementValuePattern => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  elementValuePattern: injectElementValuePattern,
                  groupName: 'inject',
                },
                {
                  elementValuePattern: 'computed',
                  groupName: 'computed',
                },
              ],
              groups: ['computed', 'inject', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'computed',
                leftGroup: 'inject',
                right: 'z',
                left: 'y',
              },
              messageId: 'unexpectedObjectsGroupOrder',
            },
          ],
          output: dedent`
            let obj = {
              a: computed(A),
              z: computed(Z),
              b: inject(B),
              y: inject(Y),
              c() {},
            }
          `,
          code: dedent`
            let obj = {
              a: computed(A),
              b: inject(B),
              y: inject(Y),
              z: computed(Z),
              c() {},
            }
          `,
        })
      },
    )

    it('sorts custom groups with overridden type and order', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            data: { right: 'dddd', left: 'ccc' },
            messageId: 'unexpectedObjectsOrder',
          },
          {
            data: {
              rightGroup: 'reversedPropertiesByLineLength',
              leftGroup: 'unknown',
              left: 'method',
              right: 'eee',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedPropertiesByLineLength',
                selector: 'property',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedPropertiesByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          let obj = {
            dddd,
            ccc,
            eee,
            bb,
            ff,
            a,
            g,
            anotherMethod() {},
            method() {},
            yetAnotherMethod() {},
          }
        `,
        code: dedent`
          let obj = {
            a,
            bb,
            ccc,
            dddd,
            method() {},
            eee,
            ff,
            g,
            anotherMethod() {},
            yetAnotherMethod() {},
          }
        `,
      })
    })

    it('sorts custom groups with fallbackSort override', async () => {
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
            data: { right: 'fooBar', left: 'fooZar' },
            messageId: 'unexpectedObjectsOrder',
          },
        ],
        output: dedent`
          let obj = {
            fooBar: 'fooBar',
            fooZar: 'fooZar',
          }
        `,
        code: dedent`
          let obj = {
            fooZar: 'fooZar',
            fooBar: 'fooBar',
          }
        `,
      })
    })

    it('preserves order within unsorted custom groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedProperties',
                selector: 'property',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedProperties', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedProperties',
              leftGroup: 'unknown',
              left: 'method',
              right: 'c',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        output: dedent`
          let obj = {
            b,
            a,
            d,
            e,
            c,
            method() {},
          }
        `,
        code: dedent`
          let obj = {
            b,
            a,
            d,
            e,
            method() {},
            c,
          }
        `,
      })
    })

    it('sorts custom groups with anyOf conditions', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    modifiers: ['multiline'],
                    selector: 'property',
                  },
                  {
                    modifiers: ['multiline'],
                    selector: 'method',
                  },
                ],
                groupName: 'multilinePropertiesAndMultilineMethods',
              },
            ],
            groups: ['multilinePropertiesAndMultilineMethods', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'multilinePropertiesAndMultilineMethods',
              leftGroup: 'unknown',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        output: dedent`
          let obj = {
            b() {
              // Multiline
            },
            c: {
              // Multiline
            },
            a,
            d() {},
            e,
          }
        `,
        code: dedent`
          let obj = {
            a,
            b() {
              // Multiline
            },
            c: {
              // Multiline
            },
            d() {},
            e,
          }
        `,
      })
    })

    it('allows regex patterns for element names in custom groups', async () => {
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
          let obj = {
            iHaveFooInMyName,
            meTooIHaveFoo,
            a,
            b,
          }
        `,
      })
    })

    it('enforces newlines within custom groups when newlinesInside is 1', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                selector: 'property',
                groupName: 'group1',
                newlinesInside: 1,
              },
            ],
            groups: ['group1'],
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenObjectMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          let obj = {
            a,

            b,
          }
        `,
        code: dedent`
          let obj = {
            a,
            b,
          }
        `,
      })
    })

    it('removes newlines within custom groups when newlinesInside is 0', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                selector: 'property',
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
            messageId: 'extraSpacingBetweenObjectMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          let obj = {
            a,
            b,
          }
        `,
        code: dedent`
          let obj = {
            a,

            b,
          }
        `,
      })
    })

    it('allows regex patterns in custom groups', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^(?!.*Foo).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
          },
        ],
        code: dedent`
          let obj = {
            iHaveFooInMyName,
            meTooIHaveFoo,
            a,
            b,
          }
        `,
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

    it('sorts objects with identifier and literal keys', async () => {
      await valid({
        code: dedent`
          let Obj = {
            a: 'aaaa',
            b: 'bbb',
            [c]: 'cc',
            d: 'd',
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Obj = {
            a: 'aaaa',
            b: 'bbb',
            [c]: 'cc',
            d: 'd',
          }
        `,
        code: dedent`
          let Obj = {
            a: 'aaaa',
            [c]: 'cc',
            b: 'bbb',
            d: 'd',
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [options],
      })
    })
  })

  describe('unsorted', () => {
    let options = {
      type: 'unsorted',
      order: 'asc',
    } as const

    it('does not enforce sorting when type is unsorted', async () => {
      await valid({
        code: dedent`
          let obj = {
            b: 'b',
            c: 'c',
            a: 'a',
          }
        `,
        options: [options],
      })
    })

    it('enforces grouping for unsorted type', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^a',
                groupName: 'a',
              },
              {
                elementNamePattern: '^b',
                groupName: 'b',
              },
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
            messageId: 'unexpectedObjectsGroupOrder',
          },
        ],
        output: dedent`
          let obj = {
            ba: 'ba',
            bb: 'bb',
            ab: 'ab',
            aa: 'aa',
          }
        `,
        code: dedent`
          let obj = {
            ab: 'ab',
            aa: 'aa',
            ba: 'ba',
            bb: 'bb',
          }
        `,
      })
    })

    it('enforces newlines between groups for unsorted type', async () => {
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
            newlinesBetween: 1,
            groups: ['b', 'a'],
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenObjectMembers',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let obj = {
            b: 'b',

            a: 'a',
          }
        `,
        code: dedent`
          let obj = {
            b: 'b',
            a: 'a',
          }
        `,
      })
    })

    it('enforces dependency order for unsorted type', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'a', right: 'b' },
            messageId: 'unexpectedObjectsDependencyOrder',
          },
        ],
        output: dedent`
          let Func = ({
            b,
            a = b,
          }) => {
            // ...
          }
        `,
        code: dedent`
          let Func = ({
            a = b,
            b,
          }) => {
            // ...
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
      ).resolves.not.toThrowError()
    })

    it('uses alphabetical ascending order by default', async () => {
      await valid(
        dedent`
          let Obj = {
            a: 'a',
            b: 'b',
            c: 'c',
          }
        `,
      )

      await valid({
        code: dedent`
          const calculator = {
            log: () => undefined,
            log10: () => undefined,
            log1p: () => undefined,
            log2: () => undefined,
          }
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          let Obj = {
            a: 'a',
            b: 'b',
            c: 'c',
          }
        `,
        code: dedent`
          let Obj = {
            a: 'a',
            c: 'c',
            b: 'b',
          }
        `,
      })
    })

    it('allows disabling sorting for styled components', async () => {
      let styledComponentsOptions = [{ styledComponents: false }]

      await valid({
        code: dedent`
          const Box = styled.div({
            background: "red",
            width: "50px",
            height: "50px",
          })
        `,
        options: styledComponentsOptions,
      })

      await valid({
        code: dedent`
          const PropsBox = styled.div((props) => ({
            background: props.background,
            height: "50px",
            width: "50px",
          }))
        `,
        options: styledComponentsOptions,
      })

      await valid({
        code: dedent`
          export default styled('div')(() => ({
            borderRadius: 0,
            borderWidth: 0,
            border: 0,
            borderBottom: hasBorder && \`1px solid \${theme.palette.divider}\`,
          }))
        `,
        options: styledComponentsOptions,
      })

      await valid({
        code: dedent`
          const headerClass = css({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '3',
            gridGap: '8',
          });
        `,
        options: styledComponentsOptions,
      })

      await valid({
        code: dedent`
          const PropsBox = styled.div((props) => ({
            nested1: {
              nested2: {
                [theme.breakpoints.down('mid2')]: {
                  right: '24px',
                },
                [theme.breakpoints.down('mid1')]: {
                  bottom: '-273px',
                }
              }
            }
          }))
        `,
        options: styledComponentsOptions,
      })
    })

    it('ignores objects matching ignorePattern', async () => {
      await valid({
        code: dedent`
          ignore({
            c: 'c',
            b: 'bb',
            a: 'aaa',
          })
        `,
        options: [
          {
            ignorePattern: ['ignore'],
          },
        ],
      })

      await invalid({
        output: dedent`
          export default {
            data() {
              return {
                background: "red",
                display: 'flex',
                flexDirection: 'column',
                width: "50px",
                height: "50px",
              }
            },
            methods: {
              foo() {},
              bar() {},
              baz() {},
            },
          }
        `,
        code: dedent`
          export default {
            methods: {
              foo() {},
              bar() {},
              baz() {},
            },
            data() {
              return {
                background: "red",
                display: 'flex',
                flexDirection: 'column',
                width: "50px",
                height: "50px",
              }
            },
          }
        `,
        errors: [
          {
            data: {
              left: 'methods',
              right: 'data',
            },
            messageId: 'unexpectedObjectsOrder',
          },
        ],
        options: [
          {
            ignorePattern: ['data', 'methods'],
          },
        ],
      })
    })

    it.each([
      'Styles$',
      ['noMatch', 'Styles$'],
      { pattern: 'STYLES$', flags: 'i' },
      ['noMatch', { pattern: 'STYLES$', flags: 'i' }],
    ])('ignores patterns matching %s', async ignorePattern => {
      await valid({
        code: dedent`
          const buttonStyles = {
            background: "red",
            display: 'flex',
            flexDirection: 'column',
            width: "50px",
            height: "50px",
          }
        `,
        options: [
          {
            ignorePattern,
          },
        ],
      })
    })

    it('respects global settings configuration', async () => {
      await valid({
        code: dedent`
          let obj = {
            ccc: 'ccc',
            bb: 'bb',
            a: 'a',
          }
        `,
        settings: {
          perfectionist: {
            type: 'line-length',
            order: 'desc',
          },
        },
        options: [{}],
      })
    })

    it('preserves comments with their associated properties', async () => {
      await invalid({
        output: dedent`
          let obj = {
            // Ignore this comment

            // A3
            /**
              * A2
              */
            // A1
            a,

            // Ignore this comment

            // B2
            /**
              * B1
              */
            b,
          }
        `,
        code: dedent`
          let obj = {
            // Ignore this comment

            // B2
            /**
              * B1
              */
            b,

            // Ignore this comment

            // A3
            /**
              * A2
              */
            // A1
            a,
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [
          {
            type: 'alphabetical',
          },
        ],
      })
    })

    it('respects partition comments when sorting', async () => {
      await invalid({
        output: dedent`
          let obj = {
            // Ignore this comment

            // B2
            /**
              * B1
              */
            b,

            // C2
            // C1
            c,

            // Above a partition comment ignore me
            // PartitionComment: 1
            a,

            /**
              * D2
              */
            // D1
            d,
          }
        `,
        code: dedent`
          let obj = {
            // Ignore this comment

            // C2
            // C1
            c,

            // B2
            /**
              * B1
              */
            b,

            // Above a partition comment ignore me
            // PartitionComment: 1
            /**
              * D2
              */
            // D1
            d,

            a,
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'd' },
          },
        ],
        options: [
          {
            partitionByComment: 'PartitionComment:',
            type: 'alphabetical',
          },
        ],
      })
    })

    it('allows to disable sorting object in style prop in jsx', async () => {
      let jsxRuleTester = createRuleTester({
        languageOptions: {
          parserOptions: {
            ecmaFeatures: {
              jsx: true,
            },
          },
        },
        name: 'sort-objects',
        rule,
      })
      await jsxRuleTester.valid({
        code: dedent`
          let Element = () => (
            <div
              style={{
                display: 'block',
                margin: 0,
                padding: 20,
                background: 'orange',
              }}
            />
          )
        `,
        options: [
          {
            styledComponents: false,
          },
        ],
      })
    })

    it('handles eslint-disable comments correctly', async () => {
      await valid({
        code: dedent`
          let obj = {
            b = 'b',
            c = 'c',
            // eslint-disable-next-line
            a = 'a',
          }
        `,
      })

      await invalid({
        output: dedent`
          let obj = {
            b = 'b',
            c = 'c',
            // eslint-disable-next-line
            a = 'a'
          }
        `,
        code: dedent`
          let obj = {
            c = 'c',
            b = 'b',
            // eslint-disable-next-line
            a = 'a'
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'c', left: 'd' },
          },
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          let obj = {
            b: 'b',
            c: 'c',
            // eslint-disable-next-line
            a: 'a',
            d: 'd'
          }
        `,
        code: dedent`
          let obj = {
            d: 'd',
            c: 'c',
            // eslint-disable-next-line
            a: 'a',
            b: 'b'
          }
        `,
        options: [
          {
            partitionByComment: true,
          },
        ],
      })

      await invalid({
        output: dedent`
          let obj = {
            b = a,
            c = 'c',
            // eslint-disable-next-line
            a = 'a'
          }
        `,
        code: dedent`
          let obj = {
            c = 'c',
            b = a,
            // eslint-disable-next-line
            a = 'a'
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          let obj = {
            b = 'b',
            c = 'c',
            a = 'a' // eslint-disable-line
          }
        `,
        code: dedent`
          let obj = {
            c = 'c',
            b = 'b',
            a = 'a' // eslint-disable-line
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          let obj = {
            b = 'b',
            c = 'c',
            /* eslint-disable-next-line */
            a = 'a'
          }
        `,
        code: dedent`
          let obj = {
            c = 'c',
            b = 'b',
            /* eslint-disable-next-line */
            a = 'a'
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          let obj = {
            b = 'b',
            c = 'c',
            a = 'a' /* eslint-disable-line */
          }
        `,
        code: dedent`
          let obj = {
            c = 'c',
            b = 'b',
            a = 'a' /* eslint-disable-line */
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          let obj = {
            a = 'a',
            d = 'd',
            /* eslint-disable */
            c = 'c',
            b = 'b',
            // Shouldn't move
            /* eslint-enable */
            e = 'e'
          }
        `,
        code: dedent`
          let obj = {
            d = 'd',
            e = 'e',
            /* eslint-disable */
            c = 'c',
            b = 'b',
            // Shouldn't move
            /* eslint-enable */
            a = 'a'
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [{}],
      })
    })

    it('handles rule-specific eslint-disable comments', async () => {
      await invalid({
        output: dedent`
          let obj = {
            b = 'b',
            c = 'c',
            // eslint-disable-next-line rule-to-test/sort-objects
            a = 'a'
          }
        `,
        code: dedent`
          let obj = {
            c = 'c',
            b = 'b',
            // eslint-disable-next-line rule-to-test/sort-objects
            a = 'a'
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          let obj = {
            b = 'b',
            c = 'c',
            a = 'a' // eslint-disable-line rule-to-test/sort-objects
          }
        `,
        code: dedent`
          let obj = {
            c = 'c',
            b = 'b',
            a = 'a' // eslint-disable-line rule-to-test/sort-objects
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          let obj = {
            b = 'b',
            c = 'c',
            /* eslint-disable-next-line rule-to-test/sort-objects */
            a = 'a'
          }
        `,
        code: dedent`
          let obj = {
            c = 'c',
            b = 'b',
            /* eslint-disable-next-line rule-to-test/sort-objects */
            a = 'a'
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          let obj = {
            b = 'b',
            c = 'c',
            a = 'a' /* eslint-disable-line rule-to-test/sort-objects */
          }
        `,
        code: dedent`
          let obj = {
            c = 'c',
            b = 'b',
            a = 'a' /* eslint-disable-line rule-to-test/sort-objects */
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          let obj = {
            a = 'a',
            d = 'd',
            /* eslint-disable rule-to-test/sort-objects */
            c = 'c',
            b = 'b',
            // Shouldn't move
            /* eslint-enable */
            e = 'e'
          }
        `,
        code: dedent`
          let obj = {
            d = 'd',
            e = 'e',
            /* eslint-disable rule-to-test/sort-objects */
            c = 'c',
            b = 'b',
            // Shouldn't move
            /* eslint-enable */
            a = 'a'
          }
        `,
        errors: [
          {
            messageId: 'unexpectedObjectsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [{}],
      })
    })
  })
})
