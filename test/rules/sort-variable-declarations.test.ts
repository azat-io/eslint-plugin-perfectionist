import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import rule from '../../rules/sort-variable-declarations'
import { Alphabet } from '../../utils/alphabet'

describe('sort-variable-declarations', () => {
  let { invalid, valid } = createRuleTester({
    name: 'sort-variable-declarations',
    parser: typescriptParser,
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('sorts variable declarations', async () => {
      await valid({
        code: dedent`
          const aaa, bb, c
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'aaa', left: 'bb' },
          },
        ],
        output: dedent`
          const aaa, bb, c
        `,
        code: dedent`
          const bb, aaa, c
        `,
        options: [options],
      })
    })

    it('handles array and object destructuring in variable declarations', async () => {
      await valid({
        code: dedent`
          const [c] = C, { bb } = B, aaa
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: '{ bb }', left: 'aaa' },
          },
          {
            data: {
              left: '{ bb }',
              right: '[c]',
            },
            messageId: 'unexpectedVariableDeclarationsOrder',
          },
        ],
        output: dedent`
          const [c] = C, { bb } = B, aaa
        `,
        code: dedent`
          const aaa, { bb } = B, [c] = C
        `,
        options: [options],
      })
    })
    function testDependencyDetection(
      useExperimentalDependencyDetection: boolean,
    ): void {
      describe(`experimental dependency detection: ${useExperimentalDependencyDetection}`, () => {
        it('handles dependencies between variable declarations', async () => {
          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              const bb = 1,
                    aaa = bb + 2,
                    c = aaa + 3
            `,
          })

          await valid({
            code: dedent`
              let a = 1,
                  b = a + 2,
                  c = b + 3,
                  d = [a, b, c];
            `,
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
          })

          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              var x = 10,
                  y = x * 2,
                  z = y + 5 - x;
            `,
          })

          await valid({
            code: dedent`
              const arr = [1, 2, 3],
                    sum = arr.reduce((acc, val) => acc + val, 0),
                    avg = sum / arr.length;
            `,
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
          })

          await valid({
            code: dedent`
              const getValue = () => 1,
                    value = getValue(),
                    result = value + 2;
            `,
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
          })

          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let position = editor.state.selection.$anchor,
              depth = position.depth;
            `,
          })

          await invalid({
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsOrder',
                data: { right: 'a', left: 'b' },
              },
            ],
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            output: dedent`
              const a,
                    b,
                    c;
            `,
            code: dedent`
              const b,
                    a,
                    c;
            `,
          })

          await invalid({
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                data: { nodeDependentOnRight: 'aaa', right: 'bb' },
              },
            ],
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            output: dedent`
              const bb = 1,
                    aaa = bb + 2,
                    c = aaa + 3;
            `,
            code: dedent`
              const aaa = bb + 2,
                    bb = 1,
                    c = aaa + 3;
            `,
          })

          await invalid({
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                data: { nodeDependentOnRight: 'b', right: 'a' },
              },
            ],
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            output: dedent`
              let a = 1,
                  b = a + 2,
                  c = b + 3;
            `,
            code: dedent`
              let b = a + 2,
                  a = 1,
                  c = b + 3;
            `,
          })

          await invalid({
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                data: { nodeDependentOnRight: 'y', right: 'x' },
              },
            ],
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            output: dedent`
              var x = 10,
                  y = x * 2,
                  z = y + 5;
            `,
            code: dedent`
              var y = x * 2,
                  x = 10,
                  z = y + 5;
            `,
          })

          await invalid({
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                data: { nodeDependentOnRight: 'sum', right: 'arr' },
              },
            ],
            output: dedent`
              const arr = [1, 2, 3],
                    sum = arr.reduce((acc, val) => acc + val, 0),
                    avg = sum / arr.length;
            `,
            code: dedent`
              const sum = arr.reduce((acc, val) => acc + val, 0),
                    arr = [1, 2, 3],
                    avg = sum / arr.length;
            `,
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
          })

          await invalid({
            errors: [
              {
                data: { nodeDependentOnRight: 'value', right: 'getValue' },
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
              },
            ],
            output: dedent`
              const getValue = () => 1,
                    value = getValue(),
                    result = value + 2;
            `,
            code: dedent`
              const value = getValue(),
                    getValue = () => 1,
                    result = value + 2;
            `,
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
          })

          await invalid({
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                data: { nodeDependentOnRight: 'a', right: 'c' },
              },
            ],
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            output: dedent`
              const c = 10,
                    a = c,
                    b = 10;
            `,
            code: dedent`
              const a = c,
                    b = 10,
                    c = 10;
            `,
          })
        })

        it('detects function expression dependencies', async () => {
          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let b = () => 1,
              a = b();
            `,
          })

          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let b = function() { return 1 },
              a = b();
            `,
          })

          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let b = () => 1,
              a = a.map(b);
            `,
          })
        })

        it('detects dependencies in object properties', async () => {
          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let b = 1,
              a = {x: b};
            `,
          })

          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let b = 1,
              a = {[b]: 0};
            `,
          })
        })

        it('detects chained member expression dependencies', async () => {
          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let b = {x: 1},
              a = b.x;
            `,
          })

          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let b = new Subject(),
              a = b.asObservable();
            `,
          })
        })

        it('detects optional chaining dependencies', async () => {
          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let b = {x: 1},
              a = b?.x;
            `,
          })
        })

        it('detects non-null assertion dependencies', async () => {
          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let b = 1,
              a = b!;
            `,
          })
        })

        it('detects unary expression dependencies', async () => {
          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let b = true,
              a = !b;
            `,
          })
        })

        it('detects dependencies in default assignments', async () => {
          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let b = {x: 1},
              a = {b = 'b',};
            `,
          })

          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let b = [1]
              a = [b = 'b',];
            `,
          })
        })

        it('detects dependencies in conditional expressions', async () => {
          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let b = 0,
              a = b ? 1 : 0;
            `,
          })

          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let b = 0,
              a = x ? b : 0;
            `,
          })

          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let b = 0,
              a = x ? 0 : b;
            `,
          })
        })

        it('detects dependencies in type assertions', async () => {
          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let b = 'b',
              a = b as any;
            `,
          })

          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let b = 'b',
              a = <any>b;
            `,
          })
        })

        it('detects dependencies in template literals', async () => {
          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let b = 'b',
              a = \`\${b}\`
            `,
          })
        })

        it('detects dependencies in destructured assignments', async () => {
          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let a = "a",
                [{
                  b = a,
                }] = {}
            `,
          })
        })

        it('ignores dependencies inside function bodies', async () => {
          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let a = () => b,
              b = 1;
            `,
          })

          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let a = function() { return b },
              b = 1;
            `,
          })

          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let a = () => { return b },
              b = 1;
            `,
          })

          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let f = () => {
                  let b = 1,
                  a = b;
              }
            `,
          })
        })

        it('ignores dependencies in non-computed properties', async () => {
          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let { b: foo } = bar,
              b = 1;
            `,
          })
        })

        it('prioritizes dependencies over group configuration', async () => {
          await valid({
            options: [
              {
                ...options,
                customGroups: [
                  {
                    groupName: 'variablesStartingWithA',
                    elementNamePattern: 'a',
                  },
                  {
                    groupName: 'variablesStartingWithB',
                    elementNamePattern: 'b',
                  },
                ],
                groups: ['variablesStartingWithA', 'variablesStartingWithB'],
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              let
                b,
                a = b,
            `,
          })
        })

        it('prioritizes dependencies over partition comments', async () => {
          await invalid({
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                data: { nodeDependentOnRight: 'b', right: 'a' },
              },
            ],
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
                partitionByComment: '^Part',
              },
            ],
            output: dedent`
              let
                a = 0,
                // Part: 1
                b = a,
            `,
            code: dedent`
              let
                b = a,
                // Part: 1
                a = 0,
            `,
          })
        })

        it('prioritizes dependencies over newline partitions', async () => {
          await invalid({
            errors: [
              {
                messageId: 'unexpectedVariableDeclarationsDependencyOrder',
                data: { nodeDependentOnRight: 'b', right: 'a' },
              },
            ],
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
                partitionByNewLine: true,
              },
            ],
            output: dedent`
              let
                a = 0,

                b = a,
            `,
            code: dedent`
              let
                b = a,

                a = 0,
            `,
          })
        })
      })
    }
    testDependencyDetection(true)
    testDependencyDetection(false)

    it('sorts within newline-separated partitions', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'a', left: 'd' },
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'b', left: 'e' },
          },
        ],
        output: dedent`
          const
            a = 'A',
            d = 'D',

            c = 'C',

            b = 'B',
            e = 'E'
        `,
        code: dedent`
          const
            d = 'D',
            a = 'A',

            c = 'C',

            e = 'E',
            b = 'B'
        `,
        options: [
          {
            partitionByNewLine: true,
            type: 'alphabetical',
          },
        ],
      })
    })

    it('sorts within comment-defined partitions', async () => {
      await invalid({
        output: dedent`
          const
            // Part: A
            // Not partition comment
            bbb = 'BBB',
            cc = 'CC',
            d = 'D',
            // Part: B
            aaa = 'AAA',
            e = 'E',
            // Part: C
            // Not partition comment
            fff = 'FFF',
            gg = 'GG'
        `,
        code: dedent`
          const
            // Part: A
            cc = 'CC',
            d = 'D',
            // Not partition comment
            bbb = 'BBB',
            // Part: B
            aaa = 'AAA',
            e = 'E',
            // Part: C
            gg = 'GG',
            // Not partition comment
            fff = 'FFF'
        `,
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'bbb', left: 'd' },
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'fff', left: 'gg' },
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

    it('treats all comments as partition boundaries', async () => {
      await valid({
        code: dedent`
          const
            // Comment
            bb = 'bb',
            // Other comment
            a = 'a'
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
          const
            /* Partition Comment */
            // Part: A
            d = 'D',
            // Part: B
            aaa = 'AAA',
            bb = 'BB',
            c = 'C',
            /* Other */
            e = 'E'
        `,
        code: dedent`
          const
            /* Partition Comment */
            // Part: A
            d = 'D',
            // Part: B
            aaa = 'AAA',
            c = 'C',
            bb = 'BB',
            /* Other */
            e = 'E'
        `,
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
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
          const
            e = 'e',
            f = 'f',
            // I am a partition comment because I don't have f o o
            a = 'a',
            b = 'b'
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
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        output: dedent`
          const
            /* Comment */
            a: 'a',
            b: 'b',
        `,
        code: dedent`
          const
            b: 'b',
            /* Comment */
            a: 'a',
        `,
      })
    })

    it('uses line comments as partition boundaries', async () => {
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
          const
            b: 'b',
            // Comment
            a: 'a',
        `,
      })
    })

    it('matches specific line comment patterns', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['a', 'b'],
            },
          },
        ],
        code: dedent`
          const
            c: 'c',
            // b
            b: 'b',
            // a
            a: 'a',
        `,
      })
    })

    it('supports regex patterns for line comment partitions', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['^(?!.*foo).*$'],
            },
          },
        ],
        code: dedent`
          const
            b: 'b',
            // I am a partition comment because I don't have f o o
            a: 'a',
        `,
      })
    })

    it('ignores line comments when block comments are partition boundaries', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        output: dedent`
          const
            // Comment
            a: 'a',
            b: 'b',
        `,
        code: dedent`
          const
            b: 'b',
            // Comment
            a: 'a',
        `,
      })
    })

    it('uses block comments as partition boundaries', async () => {
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
          const
            b: 'b',
            /* Comment */
            a: 'a',
        `,
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['a', 'b'],
            },
          },
        ],
        code: dedent`
          const
            c: 'c',
            /* b */
            b: 'b',
            /* a */
            a: 'a',
        `,
      })
    })

    it('supports regex patterns for block comment partitions', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['^(?!.*foo).*$'],
            },
          },
        ],
        code: dedent`
          const
            b: 'b',
            /* I am a partition comment because I don't have f o o */
            a: 'a',
        `,
      })
    })

    it('ignores special characters at start when trimming', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
        code: dedent`
          const
            _a = 'a',
            b = 'b',
            _c = 'c'
        `,
      })
    })

    it('ignores special characters completely when removing', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          const
            ab = 'ab',
            a_c = 'ac'
        `,
      })
    })

    it('sorts elements according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          const
            你好 = '你好',
            世界 = '世界',
            a = 'a',
            A = 'A',
            b = 'b',
            B = 'B'
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts inline variable declarations', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          const
            a = 'a', b = 'b'
        `,
        code: dedent`
          const
            b = 'b', a = 'a'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          const
            a = 'a', b = 'b',
        `,
        code: dedent`
          const
            b = 'b', a = 'a',
        `,
        options: [options],
      })
    })

    it('enforces predefined group ordering', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'uninitialized',
              rightGroup: 'initialized',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedVariableDeclarationsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['initialized', 'uninitialized'],
          },
        ],
        output: dedent`
          let
            b ='b',
            a,
        `,
        code: dedent`
          let
            a,
            b ='b',
        `,
      })
    })

    it('allows overriding options in groups', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'missedSpacingBetweenVariableDeclarationsMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
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
        output: dedent`
          let
            b,

            a,
        `,
        code: dedent`
          let
            a,
            b,
        `,
      })
    })

    it('applies custom groups based on element selectors', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'uninitializedElements',
              leftGroup: 'unknown',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedVariableDeclarationsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'uninitializedElements',
                selector: 'uninitialized',
              },
            ],
            groups: ['uninitializedElements', 'unknown'],
          },
        ],
        output: dedent`
          let
            a,
            b = 'b',
        `,
        code: dedent`
          let
            b = 'b',
            a,
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array of patterns', ['noMatch', 'hello']],
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])(
      'groups elements by name pattern - %s',
      async (_, elementNamePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'uninitializedStartingWithHello',
                  selector: 'uninitialized',
                  elementNamePattern,
                },
              ],
              groups: ['uninitializedStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'uninitializedStartingWithHello',
                right: 'helloUninitialized',
                leftGroup: 'unknown',
                left: 'b',
              },
              messageId: 'unexpectedVariableDeclarationsGroupOrder',
            },
          ],
          output: dedent`
            let
              helloUninitialized,
              a,
              b,
          `,
          code: dedent`
            let
              a,
              b,
              helloUninitialized,
          `,
        })
      },
    )

    it('overrides sort type and order for specific groups', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'dddd', left: 'ccc' },
          },
          {
            data: {
              rightGroup: 'reversedUninitializedByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: 'm',
            },
            messageId: 'unexpectedVariableDeclarationsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedUninitializedByLineLength',
                selector: 'uninitialized',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedUninitializedByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          let
            dddd,
            ccc,
            eee,
            bb,
            ff,
            a,
            g,
            m = 'm',
            o = 'o',
            p = 'p',
        `,
        code: dedent`
          let
            a,
            bb,
            ccc,
            dddd,
            m = 'm',
            eee,
            ff,
            g,
            o = 'o',
            p = 'p',
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
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'fooBar', left: 'fooZar' },
          },
        ],
        output: dedent`
          let
            fooBar,
            fooZar,
        `,
        code: dedent`
          let
            fooZar,
            fooBar,
        `,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedUninitialized',
                selector: 'uninitialized',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedUninitialized', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedUninitialized',
              leftGroup: 'unknown',
              right: 'c',
              left: 'm',
            },
            messageId: 'unexpectedVariableDeclarationsGroupOrder',
          },
        ],
        output: dedent`
          let
            b,
            a,
            d,
            e,
            c,
            m = 'm',
        `,
        code: dedent`
          let
            b,
            a,
            d,
            e,
            m = 'm',
            c,
        `,
      })
    })

    it('combines multiple selectors with anyOf', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    elementNamePattern: 'foo|Foo',
                    selector: 'uninitialized',
                  },
                  {
                    elementNamePattern: 'foo|Foo',
                    selector: 'initialized',
                  },
                ],
                groupName: 'elementsIncludingFoo',
              },
            ],
            groups: ['elementsIncludingFoo', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'elementsIncludingFoo',
              leftGroup: 'unknown',
              right: 'cFoo',
              left: 'a',
            },
            messageId: 'unexpectedVariableDeclarationsGroupOrder',
          },
        ],
        output: dedent`
          let
            cFoo,
            foo = 'foo',
            a,
        `,
        code: dedent`
          let
            a,
            cFoo,
            foo = 'foo',
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
          let
            iHaveFooInMyName,
            meTooIHaveFoo,
            a,
            b,
        `,
      })
    })

    it('removes newlines between and inside groups by default when "newlinesBetween" is 0', async () => {
      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenVariableDeclarationsMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'b', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenVariableDeclarationsMembers',
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
          let
            a,


           y,
          z,

              b,
        `,
        output: dedent`
          let
            a,
           b,
          y,
              z,
        `,
      })
    })

    it('removes newlines inside groups when newlinesInside is 0', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'b', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenVariableDeclarationsMembers',
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
            newlinesInside: 0,
          },
        ],
        output: dedent`
          let
            a,


           b,
          y,
              z,
        `,
        code: dedent`
          let
            a,


           y,
          z,

              b,
        `,
      })
    })

    it('adds newlines between groups when newlinesBetween is 1', async () => {
      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenVariableDeclarationsMembers',
            data: { right: 'z', left: 'a' },
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'y', left: 'z' },
          },
          {
            messageId: 'missedSpacingBetweenVariableDeclarationsMembers',
            data: { right: 'b', left: 'y' },
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
              {
                elementNamePattern: 'b',
                groupName: 'b',
              },
            ],
            groups: ['a', 'unknown', 'b'],
            newlinesBetween: 1,
          },
        ],
        output: dedent`
          let
            a,

           y,
          z,

              b,
        `,
        code: dedent`
          let
            a,


           z,
          y,
              b,
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
            messageId: 'missedSpacingBetweenVariableDeclarationsMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenVariableDeclarationsMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenVariableDeclarationsMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          let
            a,

            b,

            c,
            d,


            e
        `,
        code: dedent`
          let
            a,
            b,


            c,

            d,


            e
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
              messageId: 'missedSpacingBetweenVariableDeclarationsMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            let
              a,


              b,
          `,
          code: dedent`
            let
              a,
              b,
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
              messageId: 'extraSpacingBetweenVariableDeclarationsMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            let
              a,
              b,
          `,
          code: dedent`
            let
              a,

              b,
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
            let
              a,

              b,
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
            let
              a,
              b,
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
            newlinesInside: 0,
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
            messageId: 'unexpectedVariableDeclarationsGroupOrder',
          },
        ],
        output: dedent`
          let
            a, // Comment after

            b,
            c
        `,
        code: dedent`
          let
            b,
            a, // Comment after

            c
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
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          let
            a,

            // Partition comment

            b,
            c
        `,
        code: dedent`
          let
            a,

            // Partition comment

            c,
            b
        `,
      })
    })
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it('sorts variable declarations', async () => {
      await valid({
        code: dedent`
          const aaa, bb, c
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'aaa', left: 'bb' },
          },
        ],
        output: dedent`
          const aaa, bb, c
        `,
        code: dedent`
          const bb, aaa, c
        `,
        options: [options],
      })
    })

    it('handles array and object destructuring in variable declarations', async () => {
      await valid({
        code: dedent`
          const [c] = C, aaa, { bb } = B
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              left: '{ bb }',
              right: '[c]',
            },
            messageId: 'unexpectedVariableDeclarationsOrder',
          },
        ],
        output: dedent`
          const [c] = C, aaa, { bb } = B
        `,
        code: dedent`
          const aaa, { bb } = B, [c] = C
        `,
        options: [options],
      })
    })

    it('handles dependencies between variable declarations', async () => {
      await valid({
        code: dedent`
          const bb = 1,
                aaa = bb + 2,
                c = aaa + 3
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let a = 1,
              b = a + 2,
              c = b + 3,
              d = [a, b, c];
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          var x = 10,
              y = x * 2,
              z = y + 5 - x;
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          const arr = [1, 2, 3],
                sum = arr.reduce((acc, val) => acc + val, 0),
                avg = sum / arr.length;
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          const getValue = () => 1,
                value = getValue(),
                result = value + 2;
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let position = editor.state.selection.$anchor,
          depth = position.depth;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          const a,
                b,
                c;
        `,
        code: dedent`
          const b,
                a,
                c;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsDependencyOrder',
            data: { nodeDependentOnRight: 'aaa', right: 'bb' },
          },
        ],
        output: dedent`
          const bb = 1,
                aaa = bb + 2,
                c = aaa + 3;
        `,
        code: dedent`
          const aaa = bb + 2,
                bb = 1,
                c = aaa + 3;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsDependencyOrder',
            data: { nodeDependentOnRight: 'b', right: 'a' },
          },
        ],
        output: dedent`
          let a = 1,
              b = a + 2,
              c = b + 3;
        `,
        code: dedent`
          let b = a + 2,
              a = 1,
              c = b + 3;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsDependencyOrder',
            data: { nodeDependentOnRight: 'y', right: 'x' },
          },
        ],
        output: dedent`
          var x = 10,
              y = x * 2,
              z = y + 5;
        `,
        code: dedent`
          var y = x * 2,
              x = 10,
              z = y + 5;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsDependencyOrder',
            data: { nodeDependentOnRight: 'sum', right: 'arr' },
          },
        ],
        output: dedent`
          const arr = [1, 2, 3],
                sum = arr.reduce((acc, val) => acc + val, 0),
                avg = sum / arr.length;
        `,
        code: dedent`
          const sum = arr.reduce((acc, val) => acc + val, 0),
                arr = [1, 2, 3],
                avg = sum / arr.length;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'value', right: 'getValue' },
            messageId: 'unexpectedVariableDeclarationsDependencyOrder',
          },
        ],
        output: dedent`
          const getValue = () => 1,
                value = getValue(),
                result = value + 2;
        `,
        code: dedent`
          const value = getValue(),
                getValue = () => 1,
                result = value + 2;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsDependencyOrder',
            data: { nodeDependentOnRight: 'a', right: 'c' },
          },
        ],
        output: dedent`
          const c = 10,
                a = c,
                b = 10;
        `,
        code: dedent`
          const a = c,
                b = 10,
                c = 10;
        `,
        options: [options],
      })
    })

    it('detects function expression dependencies', async () => {
      await valid({
        code: dedent`
          let b = () => 1,
          a = b();
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let b = function() { return 1 },
          a = b();
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let b = () => 1,
          a = a.map(b);
        `,
        options: [options],
      })
    })

    it('detects dependencies in object properties', async () => {
      await valid({
        code: dedent`
          let b = 1,
          a = {x: b};
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let b = 1,
          a = {[b]: 0};
        `,
        options: [options],
      })
    })

    it('detects chained member expression dependencies', async () => {
      await valid({
        code: dedent`
          let b = {x: 1},
          a = b.x;
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let b = new Subject(),
          a = b.asObservable();
        `,
        options: [options],
      })
    })

    it('detects optional chaining dependencies', async () => {
      await valid({
        code: dedent`
          let b = {x: 1},
          a = b?.x;
        `,
        options: [options],
      })
    })

    it('detects non-null assertion dependencies', async () => {
      await valid({
        code: dedent`
          let b = 1,
          a = b!;
        `,
        options: [options],
      })
    })

    it('detects unary expression dependencies', async () => {
      await valid({
        code: dedent`
          let b = true,
          a = !b;
        `,
        options: [options],
      })
    })

    it('detects dependencies in default assignments', async () => {
      await valid({
        code: dedent`
          let b = {x: 1},
          a = {b = 'b',};
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let b = [1]
          a = [b = 'b',];
        `,
        options: [options],
      })
    })

    it('detects dependencies in conditional expressions', async () => {
      await valid({
        code: dedent`
          let b = 0,
          a = b ? 1 : 0;
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let b = 0,
          a = x ? b : 0;
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let b = 0,
          a = x ? 0 : b;
        `,
        options: [options],
      })
    })

    it('detects dependencies in type assertions', async () => {
      await valid({
        code: dedent`
          let b = 'b',
          a = b as any;
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let b = 'b',
          a = <any>b;
        `,
        options: [options],
      })
    })

    it('detects dependencies in template literals', async () => {
      await valid({
        code: dedent`
          let b = 'b',
          a = \`\${b}\`
        `,
        options: [options],
      })
    })

    it('detects dependencies in destructured assignments', async () => {
      await valid({
        code: dedent`
          let a = "a",
            [{
              b = a,
            }] = {}
        `,
        options: [options],
      })
    })

    it('ignores dependencies inside function bodies', async () => {
      await valid({
        code: dedent`
          let a = () => b,
          b = 1;
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let a = function() { return b },
          b = 1;
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let a = () => { return b },
          b = 1;
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
                groupName: 'variablesStartingWithA',
                elementNamePattern: 'a',
              },
              {
                groupName: 'variablesStartingWithB',
                elementNamePattern: 'b',
              },
            ],
            groups: ['variablesStartingWithA', 'variablesStartingWithB'],
          },
        ],
        code: dedent`
          let
            b,
            a = b,
        `,
      })
    })

    it('prioritizes dependencies over partition comments', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsDependencyOrder',
            data: { nodeDependentOnRight: 'b', right: 'a' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
        output: dedent`
          let
            a = 0,
            // Part: 1
            b = a,
        `,
        code: dedent`
          let
            b = a,
            // Part: 1
            a = 0,
        `,
      })
    })

    it('prioritizes dependencies over newline partitions', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsDependencyOrder',
            data: { nodeDependentOnRight: 'b', right: 'a' },
          },
        ],
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
        output: dedent`
          let
            a = 0,

            b = a,
        `,
        code: dedent`
          let
            b = a,

            a = 0,
        `,
      })
    })

    it('sorts within newline-separated partitions', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'a', left: 'd' },
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'b', left: 'e' },
          },
        ],
        output: dedent`
          const
            a = 'A',
            d = 'D',

            c = 'C',

            b = 'B',
            e = 'E'
        `,
        code: dedent`
          const
            d = 'D',
            a = 'A',

            c = 'C',

            e = 'E',
            b = 'B'
        `,
        options: [
          {
            partitionByNewLine: true,
            type: 'alphabetical',
          },
        ],
      })
    })

    it('sorts within comment-defined partitions', async () => {
      await invalid({
        output: dedent`
          const
            // Part: A
            // Not partition comment
            bbb = 'BBB',
            cc = 'CC',
            d = 'D',
            // Part: B
            aaa = 'AAA',
            e = 'E',
            // Part: C
            // Not partition comment
            fff = 'FFF',
            gg = 'GG'
        `,
        code: dedent`
          const
            // Part: A
            cc = 'CC',
            d = 'D',
            // Not partition comment
            bbb = 'BBB',
            // Part: B
            aaa = 'AAA',
            e = 'E',
            // Part: C
            gg = 'GG',
            // Not partition comment
            fff = 'FFF'
        `,
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'bbb', left: 'd' },
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'fff', left: 'gg' },
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

    it('treats all comments as partition boundaries', async () => {
      await valid({
        code: dedent`
          const
            // Comment
            bb = 'bb',
            // Other comment
            a = 'a'
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
          const
            /* Partition Comment */
            // Part: A
            d = 'D',
            // Part: B
            aaa = 'AAA',
            bb = 'BB',
            c = 'C',
            /* Other */
            e = 'E'
        `,
        code: dedent`
          const
            /* Partition Comment */
            // Part: A
            d = 'D',
            // Part: B
            aaa = 'AAA',
            c = 'C',
            bb = 'BB',
            /* Other */
            e = 'E'
        `,
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
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
          const
            e = 'e',
            f = 'f',
            // I am a partition comment because I don't have f o o
            a = 'a',
            b = 'b'
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
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        output: dedent`
          const
            /* Comment */
            a: 'a',
            b: 'b',
        `,
        code: dedent`
          const
            b: 'b',
            /* Comment */
            a: 'a',
        `,
      })
    })

    it('uses line comments as partition boundaries', async () => {
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
          const
            b: 'b',
            // Comment
            a: 'a',
        `,
      })
    })

    it('matches specific line comment patterns', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['a', 'b'],
            },
          },
        ],
        code: dedent`
          const
            c: 'c',
            // b
            b: 'b',
            // a
            a: 'a',
        `,
      })
    })

    it('supports regex patterns for line comment partitions', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['^(?!.*foo).*$'],
            },
          },
        ],
        code: dedent`
          const
            b: 'b',
            // I am a partition comment because I don't have f o o
            a: 'a',
        `,
      })
    })

    it('ignores line comments when block comments are partition boundaries', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        output: dedent`
          const
            // Comment
            a: 'a',
            b: 'b',
        `,
        code: dedent`
          const
            b: 'b',
            // Comment
            a: 'a',
        `,
      })
    })

    it('uses block comments as partition boundaries', async () => {
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
          const
            b: 'b',
            /* Comment */
            a: 'a',
        `,
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['a', 'b'],
            },
          },
        ],
        code: dedent`
          const
            c: 'c',
            /* b */
            b: 'b',
            /* a */
            a: 'a',
        `,
      })
    })

    it('supports regex patterns for block comment partitions', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['^(?!.*foo).*$'],
            },
          },
        ],
        code: dedent`
          const
            b: 'b',
            /* I am a partition comment because I don't have f o o */
            a: 'a',
        `,
      })
    })

    it('ignores special characters at start when trimming', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
        code: dedent`
          const
            _a = 'a',
            b = 'b',
            _c = 'c'
        `,
      })
    })

    it('ignores special characters completely when removing', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          const
            ab = 'ab',
            a_c = 'ac'
        `,
      })
    })

    it('sorts elements according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          const
            你好 = '你好',
            世界 = '世界',
            a = 'a',
            A = 'A',
            b = 'b',
            B = 'B'
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts inline variable declarations', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          const
            a = 'a', b = 'b'
        `,
        code: dedent`
          const
            b = 'b', a = 'a'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          const
            a = 'a', b = 'b',
        `,
        code: dedent`
          const
            b = 'b', a = 'a',
        `,
        options: [options],
      })
    })

    it('enforces predefined group ordering', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'uninitialized',
              rightGroup: 'initialized',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedVariableDeclarationsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['initialized', 'uninitialized'],
          },
        ],
        output: dedent`
          let
            b ='b',
            a,
        `,
        code: dedent`
          let
            a,
            b ='b',
        `,
      })
    })

    it('applies custom groups based on element selectors', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'uninitializedElements',
              leftGroup: 'unknown',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedVariableDeclarationsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'uninitializedElements',
                selector: 'uninitialized',
              },
            ],
            groups: ['uninitializedElements', 'unknown'],
          },
        ],
        output: dedent`
          let
            a,
            b = 'b',
        `,
        code: dedent`
          let
            b = 'b',
            a,
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array of patterns', ['noMatch', 'hello']],
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])(
      'groups elements by name pattern - %s',
      async (_, elementNamePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'uninitializedStartingWithHello',
                  selector: 'uninitialized',
                  elementNamePattern,
                },
              ],
              groups: ['uninitializedStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'uninitializedStartingWithHello',
                right: 'helloUninitialized',
                leftGroup: 'unknown',
                left: 'b',
              },
              messageId: 'unexpectedVariableDeclarationsGroupOrder',
            },
          ],
          output: dedent`
            let
              helloUninitialized,
              a,
              b,
          `,
          code: dedent`
            let
              a,
              b,
              helloUninitialized,
          `,
        })
      },
    )

    it('overrides sort type and order for specific groups', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'dddd', left: 'ccc' },
          },
          {
            data: {
              rightGroup: 'reversedUninitializedByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: 'm',
            },
            messageId: 'unexpectedVariableDeclarationsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedUninitializedByLineLength',
                selector: 'uninitialized',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedUninitializedByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          let
            dddd,
            ccc,
            eee,
            bb,
            ff,
            a,
            g,
            m = 'm',
            o = 'o',
            p = 'p',
        `,
        code: dedent`
          let
            a,
            bb,
            ccc,
            dddd,
            m = 'm',
            eee,
            ff,
            g,
            o = 'o',
            p = 'p',
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
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'fooBar', left: 'fooZar' },
          },
        ],
        output: dedent`
          let
            fooBar,
            fooZar,
        `,
        code: dedent`
          let
            fooZar,
            fooBar,
        `,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedUninitialized',
                selector: 'uninitialized',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedUninitialized', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedUninitialized',
              leftGroup: 'unknown',
              right: 'c',
              left: 'm',
            },
            messageId: 'unexpectedVariableDeclarationsGroupOrder',
          },
        ],
        output: dedent`
          let
            b,
            a,
            d,
            e,
            c,
            m = 'm',
        `,
        code: dedent`
          let
            b,
            a,
            d,
            e,
            m = 'm',
            c,
        `,
      })
    })

    it('combines multiple selectors with anyOf', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    elementNamePattern: 'foo|Foo',
                    selector: 'uninitialized',
                  },
                  {
                    elementNamePattern: 'foo|Foo',
                    selector: 'initialized',
                  },
                ],
                groupName: 'elementsIncludingFoo',
              },
            ],
            groups: ['elementsIncludingFoo', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'elementsIncludingFoo',
              leftGroup: 'unknown',
              right: 'cFoo',
              left: 'a',
            },
            messageId: 'unexpectedVariableDeclarationsGroupOrder',
          },
        ],
        output: dedent`
          let
            cFoo,
            foo = 'foo',
            a,
        `,
        code: dedent`
          let
            a,
            cFoo,
            foo = 'foo',
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
          let
            iHaveFooInMyName,
            meTooIHaveFoo,
            a,
            b,
        `,
      })
    })

    it('removes newlines between groups when newlinesBetween is 0', async () => {
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
            newlinesInside: 'ignore',
            newlinesBetween: 0,
          },
        ],
        errors: [
          {
            messageId: 'extraSpacingBetweenVariableDeclarationsMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'b', left: 'z' },
          },
        ],
        code: dedent`
          let
            a,


           y,
          z,

              b,
        `,
        output: dedent`
          let
            a,
           b,
          y,

              z,
        `,
      })
    })

    it('adds newlines between groups when newlinesBetween is 1', async () => {
      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenVariableDeclarationsMembers',
            data: { right: 'z', left: 'a' },
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'y', left: 'z' },
          },
          {
            messageId: 'missedSpacingBetweenVariableDeclarationsMembers',
            data: { right: 'b', left: 'y' },
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
              {
                elementNamePattern: 'b',
                groupName: 'b',
              },
            ],
            groups: ['a', 'unknown', 'b'],
            newlinesBetween: 1,
          },
        ],
        output: dedent`
          let
            a,

           y,
          z,

              b,
        `,
        code: dedent`
          let
            a,


           z,
          y,
              b,
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
            messageId: 'missedSpacingBetweenVariableDeclarationsMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenVariableDeclarationsMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenVariableDeclarationsMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          let
            a,

            b,

            c,
            d,


            e
        `,
        code: dedent`
          let
            a,
            b,


            c,

            d,


            e
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
              messageId: 'missedSpacingBetweenVariableDeclarationsMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            let
              a,


              b,
          `,
          code: dedent`
            let
              a,
              b,
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
              messageId: 'extraSpacingBetweenVariableDeclarationsMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            let
              a,
              b,
          `,
          code: dedent`
            let
              a,

              b,
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
            let
              a,

              b,
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
            let
              a,
              b,
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
            newlinesInside: 0,
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
            messageId: 'unexpectedVariableDeclarationsGroupOrder',
          },
        ],
        output: dedent`
          let
            a, // Comment after

            b,
            c
        `,
        code: dedent`
          let
            b,
            a, // Comment after

            c
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
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          let
            a,

            // Partition comment

            b,
            c
        `,
        code: dedent`
          let
            a,

            // Partition comment

            c,
            b
        `,
      })
    })
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it('sorts variable declarations', async () => {
      await valid({
        code: dedent`
          const aaa, bb, c
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'aaa', left: 'bb' },
          },
        ],
        output: dedent`
          const aaa, bb, c
        `,
        code: dedent`
          const bb, aaa, c
        `,
        options: [options],
      })
    })

    it('handles array and object destructuring in variable declarations', async () => {
      await valid({
        code: dedent`
          const { bb } = B, [c] = C, aaa
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: '{ bb }', left: 'aaa' },
          },
        ],
        output: dedent`
          const { bb } = B, [c] = C, aaa
        `,
        code: dedent`
          const aaa, { bb } = B, [c] = C
        `,
        options: [options],
      })
    })

    it('handles dependencies between variable declarations', async () => {
      await valid({
        code: dedent`
          const bb = 1,
                aaa = bb + 2,
                c = aaa + 3
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let a = 1,
              b = a + 2,
              c = b + 3,
              d = [a, b, c];
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          var x = 10,
              y = x * 2,
              z = y + 5 - x;
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          const arr = [1, 2, 3],
                sum = arr.reduce((acc, val) => acc + val, 0),
                avg = sum / arr.length;
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          const getValue = () => 1,
                value = getValue(),
                result = value + 2;
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let position = editor.state.selection.$anchor,
          depth = position.depth;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'aaa', left: 'bb' },
          },
        ],
        output: dedent`
          const aaa,
                bb,
                c;
        `,
        code: dedent`
          const bb,
                aaa,
                c;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsDependencyOrder',
            data: { nodeDependentOnRight: 'aaa', right: 'bb' },
          },
        ],
        output: dedent`
          const bb = 1,
                aaa = bb + 2,
                c = aaa + 3;
        `,
        code: dedent`
          const aaa = bb + 2,
                bb = 1,
                c = aaa + 3;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsDependencyOrder',
            data: { nodeDependentOnRight: 'b', right: 'a' },
          },
        ],
        output: dedent`
          let a = 1,
              b = a + 2,
              c = b + 3;
        `,
        code: dedent`
          let b = a + 2,
              a = 1,
              c = b + 3;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsDependencyOrder',
            data: { nodeDependentOnRight: 'y', right: 'x' },
          },
        ],
        output: dedent`
          var x = 10,
              y = x * 2,
              z = y + 5;
        `,
        code: dedent`
          var y = x * 2,
              x = 10,
              z = y + 5;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsDependencyOrder',
            data: { nodeDependentOnRight: 'sum', right: 'arr' },
          },
        ],
        output: dedent`
          const arr = [1, 2, 3],
                sum = arr.reduce((acc, val) => acc + val, 0),
                avg = sum / arr.length;
        `,
        code: dedent`
          const sum = arr.reduce((acc, val) => acc + val, 0),
                arr = [1, 2, 3],
                avg = sum / arr.length;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'value', right: 'getValue' },
            messageId: 'unexpectedVariableDeclarationsDependencyOrder',
          },
        ],
        output: dedent`
          const getValue = () => 1,
                value = getValue(),
                result = value + 2;
        `,
        code: dedent`
          const value = getValue(),
                getValue = () => 1,
                result = value + 2;
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsDependencyOrder',
            data: { nodeDependentOnRight: 'aaa', right: 'c' },
          },
        ],
        output: dedent`
          const c = 10,
                aaa = c,
                bb = 10;
        `,
        code: dedent`
          const aaa = c,
                bb = 10,
                c = 10;
        `,
        options: [options],
      })
    })

    it('detects function expression dependencies', async () => {
      await valid({
        code: dedent`
          let b = () => 1,
          a = b();
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let b = function() { return 1 },
          a = b();
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let b = () => 1,
          a = a.map(b);
        `,
        options: [options],
      })
    })

    it('detects dependencies in object properties', async () => {
      await valid({
        code: dedent`
          let b = 1,
          a = {x: b};
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let b = 1,
          a = {[b]: 0};
        `,
        options: [options],
      })
    })

    it('detects chained member expression dependencies', async () => {
      await valid({
        code: dedent`
          let b = {x: 1},
          a = b.x;
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let b = new Subject(),
          a = b.asObservable();
        `,
        options: [options],
      })
    })

    it('detects optional chaining dependencies', async () => {
      await valid({
        code: dedent`
          let b = {x: 1},
          a = b?.x;
        `,
        options: [options],
      })
    })

    it('detects non-null assertion dependencies', async () => {
      await valid({
        code: dedent`
          let b = 1,
          a = b!;
        `,
        options: [options],
      })
    })

    it('detects unary expression dependencies', async () => {
      await valid({
        code: dedent`
          let b = true,
          a = !b;
        `,
        options: [options],
      })
    })

    it('detects dependencies in default assignments', async () => {
      await valid({
        code: dedent`
          let b = {x: 1},
          a = {b = 'b',};
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let b = [1]
          a = [b = 'b',];
        `,
        options: [options],
      })
    })

    it('detects dependencies in conditional expressions', async () => {
      await valid({
        code: dedent`
          let b = 0,
          a = b ? 1 : 0;
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let b = 0,
          a = x ? b : 0;
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let b = 0,
          a = x ? 0 : b;
        `,
        options: [options],
      })
    })

    it('detects dependencies in type assertions', async () => {
      await valid({
        code: dedent`
          let b = 'b',
          a = b as any;
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let b = 'b',
          a = <any>b;
        `,
        options: [options],
      })
    })

    it('detects dependencies in template literals', async () => {
      await valid({
        code: dedent`
          let b = 'b',
          a = \`\${b}\`
        `,
        options: [options],
      })
    })

    it('detects dependencies in destructured assignments', async () => {
      await valid({
        code: dedent`
          let a = "a",
            [{
              b = a,
            }] = {}
        `,
        options: [options],
      })
    })

    it('ignores dependencies inside function bodies', async () => {
      await valid({
        code: dedent`
          let a = () => b,
          b = 1;
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let a = function() { return b },
          b = 1;
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          let a = () => { return b },
          b = 1;
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
                groupName: 'variablesStartingWithA',
                elementNamePattern: 'a',
              },
              {
                groupName: 'variablesStartingWithB',
                elementNamePattern: 'b',
              },
            ],
            groups: ['variablesStartingWithA', 'variablesStartingWithB'],
          },
        ],
        code: dedent`
          let
            b,
            a = b,
        `,
      })
    })

    it('prioritizes dependencies over partition comments', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsDependencyOrder',
            data: { nodeDependentOnRight: 'b', right: 'a' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
        output: dedent`
          let
            a = 0,
            // Part: 1
            b = a,
        `,
        code: dedent`
          let
            b = a,
            // Part: 1
            a = 0,
        `,
      })
    })

    it('prioritizes dependencies over newline partitions', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsDependencyOrder',
            data: { nodeDependentOnRight: 'b', right: 'a' },
          },
        ],
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
        output: dedent`
          let
            a = 0,

            b = a,
        `,
        code: dedent`
          let
            b = a,

            a = 0,
        `,
      })
    })

    it('sorts within newline-separated partitions', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'a', left: 'd' },
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'b', left: 'e' },
          },
        ],
        output: dedent`
          const
            a = 'A',
            d = 'D',

            c = 'C',

            b = 'B',
            e = 'E'
        `,
        code: dedent`
          const
            d = 'D',
            a = 'A',

            c = 'C',

            e = 'E',
            b = 'B'
        `,
        options: [
          {
            partitionByNewLine: true,
            type: 'alphabetical',
          },
        ],
      })
    })

    it('sorts within comment-defined partitions', async () => {
      await invalid({
        output: dedent`
          const
            // Part: A
            // Not partition comment
            bbb = 'BBB',
            cc = 'CC',
            d = 'D',
            // Part: B
            aaa = 'AAA',
            e = 'E',
            // Part: C
            // Not partition comment
            fff = 'FFF',
            gg = 'GG'
        `,
        code: dedent`
          const
            // Part: A
            cc = 'CC',
            d = 'D',
            // Not partition comment
            bbb = 'BBB',
            // Part: B
            aaa = 'AAA',
            e = 'E',
            // Part: C
            gg = 'GG',
            // Not partition comment
            fff = 'FFF'
        `,
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'bbb', left: 'd' },
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'fff', left: 'gg' },
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

    it('treats all comments as partition boundaries', async () => {
      await valid({
        code: dedent`
          const
            // Comment
            bb = 'bb',
            // Other comment
            a = 'a'
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
          const
            /* Partition Comment */
            // Part: A
            d = 'D',
            // Part: B
            aaa = 'AAA',
            bb = 'BB',
            c = 'C',
            /* Other */
            e = 'E'
        `,
        code: dedent`
          const
            /* Partition Comment */
            // Part: A
            d = 'D',
            // Part: B
            aaa = 'AAA',
            c = 'C',
            bb = 'BB',
            /* Other */
            e = 'E'
        `,
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
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
          const
            e = 'e',
            f = 'f',
            // I am a partition comment because I don't have f o o
            a = 'a',
            b = 'b'
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
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        output: dedent`
          const
            /* Comment */
            aa: 'a',
            b: 'b',
        `,
        code: dedent`
          const
            b: 'b',
            /* Comment */
            aa: 'a',
        `,
      })
    })

    it('uses line comments as partition boundaries', async () => {
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
          const
            b: 'b',
            // Comment
            a: 'a',
        `,
      })
    })

    it('matches specific line comment patterns', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['a', 'b'],
            },
          },
        ],
        code: dedent`
          const
            c: 'c',
            // b
            b: 'b',
            // a
            a: 'a',
        `,
      })
    })

    it('supports regex patterns for line comment partitions', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['^(?!.*foo).*$'],
            },
          },
        ],
        code: dedent`
          const
            b: 'b',
            // I am a partition comment because I don't have f o o
            a: 'a',
        `,
      })
    })

    it('ignores line comments when block comments are partition boundaries', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        output: dedent`
          const
            // Comment
            aa: 'a',
            b: 'b',
        `,
        code: dedent`
          const
            b: 'b',
            // Comment
            aa: 'a',
        `,
      })
    })

    it('uses block comments as partition boundaries', async () => {
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
          const
            b: 'b',
            /* Comment */
            a: 'a',
        `,
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['a', 'b'],
            },
          },
        ],
        code: dedent`
          const
            c: 'c',
            /* b */
            b: 'b',
            /* a */
            a: 'a',
        `,
      })
    })

    it('supports regex patterns for block comment partitions', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['^(?!.*foo).*$'],
            },
          },
        ],
        code: dedent`
          const
            b: 'b',
            /* I am a partition comment because I don't have f o o */
            a: 'a',
        `,
      })
    })

    it('ignores special characters at start when trimming', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
        code: dedent`
          const
            _a = 'a',
            bb = 'b',
            _c = 'c'
        `,
      })
    })

    it('ignores special characters completely when removing', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          const
            abc = 'ab',
            a_c = 'ac'
        `,
      })
    })

    it('sorts elements according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          const
            你好 = '你好',
            世界 = '世界',
            a = 'a',
            A = 'A',
            b = 'b',
            B = 'B'
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts inline variable declarations', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          const
            aa = 'a', b = 'b'
        `,
        code: dedent`
          const
            b = 'b', aa = 'a'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          const
            aa = 'a', b = 'b',
        `,
        code: dedent`
          const
            b = 'b', aa = 'a',
        `,
        options: [options],
      })
    })

    it('enforces predefined group ordering', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'uninitialized',
              rightGroup: 'initialized',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedVariableDeclarationsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['initialized', 'uninitialized'],
          },
        ],
        output: dedent`
          let
            b ='b',
            a,
        `,
        code: dedent`
          let
            a,
            b ='b',
        `,
      })
    })

    it('applies custom groups based on element selectors', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'uninitializedElements',
              leftGroup: 'unknown',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedVariableDeclarationsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'uninitializedElements',
                selector: 'uninitialized',
              },
            ],
            groups: ['uninitializedElements', 'unknown'],
          },
        ],
        output: dedent`
          let
            a,
            b = 'b',
        `,
        code: dedent`
          let
            b = 'b',
            a,
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array of patterns', ['noMatch', 'hello']],
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])(
      'groups elements by name pattern - %s',
      async (_, elementNamePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'uninitializedStartingWithHello',
                  selector: 'uninitialized',
                  elementNamePattern,
                },
              ],
              groups: ['uninitializedStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'uninitializedStartingWithHello',
                right: 'helloUninitialized',
                leftGroup: 'unknown',
                left: 'b',
              },
              messageId: 'unexpectedVariableDeclarationsGroupOrder',
            },
          ],
          output: dedent`
            let
              helloUninitialized,
              a,
              b,
          `,
          code: dedent`
            let
              a,
              b,
              helloUninitialized,
          `,
        })
      },
    )

    it('overrides sort type and order for specific groups', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'dddd', left: 'ccc' },
          },
          {
            data: {
              rightGroup: 'reversedUninitializedByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: 'm',
            },
            messageId: 'unexpectedVariableDeclarationsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedUninitializedByLineLength',
                selector: 'uninitialized',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedUninitializedByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          let
            dddd,
            ccc,
            eee,
            bb,
            ff,
            a,
            g,
            m = 'm',
            o = 'o',
            p = 'p',
        `,
        code: dedent`
          let
            a,
            bb,
            ccc,
            dddd,
            m = 'm',
            eee,
            ff,
            g,
            o = 'o',
            p = 'p',
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
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'fooBar', left: 'fooZar' },
          },
        ],
        output: dedent`
          let
            fooBar,
            fooZar,
        `,
        code: dedent`
          let
            fooZar,
            fooBar,
        `,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedUninitialized',
                selector: 'uninitialized',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedUninitialized', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedUninitialized',
              leftGroup: 'unknown',
              right: 'c',
              left: 'm',
            },
            messageId: 'unexpectedVariableDeclarationsGroupOrder',
          },
        ],
        output: dedent`
          let
            b,
            a,
            d,
            e,
            c,
            m = 'm',
        `,
        code: dedent`
          let
            b,
            a,
            d,
            e,
            m = 'm',
            c,
        `,
      })
    })

    it('combines multiple selectors with anyOf', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    elementNamePattern: 'foo|Foo',
                    selector: 'uninitialized',
                  },
                  {
                    elementNamePattern: 'foo|Foo',
                    selector: 'initialized',
                  },
                ],
                groupName: 'elementsIncludingFoo',
              },
            ],
            groups: ['elementsIncludingFoo', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'elementsIncludingFoo',
              leftGroup: 'unknown',
              right: 'cFoo',
              left: 'a',
            },
            messageId: 'unexpectedVariableDeclarationsGroupOrder',
          },
        ],
        output: dedent`
          let
            cFoo,
            foo = 'foo',
            a,
        `,
        code: dedent`
          let
            a,
            cFoo,
            foo = 'foo',
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
          let
            iHaveFooInMyName,
            meTooIHaveFoo,
            a,
            b,
        `,
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
            messageId: 'extraSpacingBetweenVariableDeclarationsMembers',
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'bbb', left: 'z' },
          },
        ],
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'aaaa',
                groupName: 'a',
              },
            ],
            groups: ['a', 'unknown'],
            newlinesInside: 'ignore',
            newlinesBetween: 0,
          },
        ],
        code: dedent`
          let
            aaaa,


           yy,
          z,

              bbb,
        `,
        output: dedent`
          let
            aaaa,
           bbb,
          yy,

              z,
        `,
      })
    })

    it('adds newlines between groups when newlinesBetween is 1', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: 'aaaa',
              right: 'z',
            },
            messageId: 'extraSpacingBetweenVariableDeclarationsMembers',
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'yy', left: 'z' },
          },
          {
            messageId: 'missedSpacingBetweenVariableDeclarationsMembers',
            data: { right: 'bbb', left: 'yy' },
          },
        ],
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'aaaa',
                groupName: 'a',
              },
              {
                elementNamePattern: 'bbb',
                groupName: 'b',
              },
            ],
            groups: ['a', 'unknown', 'b'],
            newlinesBetween: 1,
          },
        ],
        output: dedent`
          let
            aaaa,

           yy,
          z,

              bbb,
        `,
        code: dedent`
          let
            aaaa,


           z,
          yy,
              bbb,
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
            messageId: 'missedSpacingBetweenVariableDeclarationsMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenVariableDeclarationsMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenVariableDeclarationsMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          let
            a,

            b,

            c,
            d,


            e
        `,
        code: dedent`
          let
            a,
            b,


            c,

            d,


            e
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
              messageId: 'missedSpacingBetweenVariableDeclarationsMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            let
              a,


              b,
          `,
          code: dedent`
            let
              a,
              b,
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
              messageId: 'extraSpacingBetweenVariableDeclarationsMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            let
              a,
              b,
          `,
          code: dedent`
            let
              a,

              b,
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
            let
              a,

              b,
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
            let
              a,
              b,
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
            newlinesInside: 0,
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
            messageId: 'unexpectedVariableDeclarationsGroupOrder',
          },
        ],
        output: dedent`
          let
            a, // Comment after

            b,
            c
        `,
        code: dedent`
          let
            b,
            a, // Comment after

            c
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
                elementNamePattern: 'aaa',
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
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
        output: dedent`
          let
            aaa,

            // Partition comment

            bb,
            c
        `,
        code: dedent`
          let
            aaa,

            // Partition comment

            c,
            bb
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

    it('sorts variable declarations', async () => {
      await valid({
        code: dedent`
          const aaa, bb, c
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'aaa', left: 'bb' },
          },
        ],
        output: dedent`
          const aaa, bb, c
        `,
        code: dedent`
          const bb, aaa, c
        `,
        options: [options],
      })
    })
  })

  describe('subgroup-order', () => {
    let options = {
      fallbackSort: {
        type: 'subgroup-order',
        order: 'asc',
      },
      type: 'line-length',
      order: 'desc',
    }

    it('fallback sorts by subgroup order', async () => {
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
            groups: [['a', 'b'], 'unknown'],
          },
        ],
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'bb', left: 'b' },
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'aa', left: 'a' },
          },
        ],
        output: dedent`
          let
            aa,
            bb,
            a,
            b,
        `,
        code: dedent`
          let
            b,
            bb,
            a,
            aa,
        `,
      })
    })

    it('fallback sorts by subgroup order through overriding groups option', async () => {
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
            groups: [{ group: ['a', 'b'], newlinesInside: 0 }, 'unknown'],
          },
        ],
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'bb', left: 'b' },
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'aa', left: 'a' },
          },
        ],
        output: dedent`
          let
            aa,
            bb,
            a,
            b,
        `,
        code: dedent`
          let
            b,
            bb,
            a,
            aa,
        `,
      })
    })
  })

  describe('unsorted', () => {
    let options = {
      type: 'unsorted',
      order: 'asc',
    } as const

    it('does not require specific order without sorting', async () => {
      await valid({
        code: dedent`
          let
            b,
            c,
            a,
        `,
        options: [options],
      })
    })

    it('adds required newlines between groups', async () => {
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
            messageId: 'missedSpacingBetweenVariableDeclarationsMembers',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          let
            b,

            a,
        `,
        code: dedent`
          let
            b,
            a,
        `,
      })
    })

    it('enforces dependency order between declarations', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsDependencyOrder',
            data: { nodeDependentOnRight: 'a', right: 'b' },
          },
        ],
        output: dedent`
          let
            b = 1,
            a = b,
        `,
        code: dedent`
          let
            a = b,
            b = 1,
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

    it('ignores variables with eslint-disable-next-line comments', async () => {
      await valid({
        code: dedent`
          let
            b,
            c,
            // eslint-disable-next-line
            a
        `,
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          let
            b,
            c,
            // eslint-disable-next-line
            a
        `,
        code: dedent`
          let
            c,
            b,
            // eslint-disable-next-line
            a
        `,
        options: [{}],
      })
    })

    it('handles partitioned comments with eslint-disable', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'c', left: 'd' },
          },
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          let
            b,
            c,
            // eslint-disable-next-line
            a,
            d
        `,
        code: dedent`
          let
            d,
            c,
            // eslint-disable-next-line
            a,
            b
        `,
        options: [
          {
            partitionByComment: true,
          },
        ],
      })
    })

    it('handles dependencies with eslint-disable comments', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          let
            b = a,
            c,
            // eslint-disable-next-line
            a
        `,
        code: dedent`
          let
            c,
            b = a,
            // eslint-disable-next-line
            a
        `,
        options: [{}],
      })
    })

    it('respects the global settings configuration', async () => {
      let settings = {
        perfectionist: {
          type: 'line-length',
          order: 'desc',
        },
      }

      await valid({
        code: dedent`
          let
            ccc,
            bb,
            a,
        `,
        options: [{}],
        settings,
      })

      await valid({
        code: dedent`
          let
            a,
            bb,
            ccc,
        `,
        options: [{ type: 'alphabetical', order: 'asc' }],
        settings,
      })
    })

    it('handles inline eslint-disable-line comments', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          let
            b,
            c,
            a // eslint-disable-line
        `,
        code: dedent`
          let
            c,
            b,
            a // eslint-disable-line
        `,
        options: [{}],
      })
    })

    it('handles block eslint-disable comments', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          let
            b,
            c,
            /* eslint-disable-next-line */
            a
        `,
        code: dedent`
          let
            c,
            b,
            /* eslint-disable-next-line */
            a
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          let
            b,
            c,
            a /* eslint-disable-line */
        `,
        code: dedent`
          let
            c,
            b,
            a /* eslint-disable-line */
        `,
        options: [{}],
      })
    })

    it('respects eslint-disable/enable block boundaries', async () => {
      await invalid({
        output: dedent`
          let
            a,
            d,
            /* eslint-disable */
            c,
            b,
            // Shouldn't move
            /* eslint-enable */
            e
        `,
        code: dedent`
          let
            d,
            e,
            /* eslint-disable */
            c,
            b,
            // Shouldn't move
            /* eslint-enable */
            a
        `,
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [{}],
      })
    })

    it('handles rule-specific eslint-disable comments', async () => {
      await invalid({
        output: dedent`
          let
            b,
            c,
            // eslint-disable-next-line rule-to-test/sort-variable-declarations
            a
        `,
        code: dedent`
          let
            c,
            b,
            // eslint-disable-next-line rule-to-test/sort-variable-declarations
            a
        `,
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          let
            b,
            c,
            a // eslint-disable-line rule-to-test/sort-variable-declarations
        `,
        code: dedent`
          let
            c,
            b,
            a // eslint-disable-line rule-to-test/sort-variable-declarations
        `,
        options: [{}],
      })
    })

    it('handles rule-specific block eslint-disable comments', async () => {
      await invalid({
        output: dedent`
          let
            b,
            c,
            /* eslint-disable-next-line rule-to-test/sort-variable-declarations */
            a
        `,
        code: dedent`
          let
            c,
            b,
            /* eslint-disable-next-line rule-to-test/sort-variable-declarations */
            a
        `,
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          let
            b,
            c,
            a /* eslint-disable-line rule-to-test/sort-variable-declarations */
        `,
        code: dedent`
          let
            c,
            b,
            a /* eslint-disable-line rule-to-test/sort-variable-declarations */
        `,
        options: [{}],
      })
    })

    it('respects rule-specific eslint-disable/enable blocks', async () => {
      await invalid({
        output: dedent`
          let
            a,
            d,
            /* eslint-disable rule-to-test/sort-variable-declarations */
            c,
            b,
            // Shouldn't move
            /* eslint-enable */
            e
        `,
        code: dedent`
          let
            d,
            e,
            /* eslint-disable rule-to-test/sort-variable-declarations */
            c,
            b,
            // Shouldn't move
            /* eslint-enable */
            a
        `,
        errors: [
          {
            messageId: 'unexpectedVariableDeclarationsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [{}],
      })
    })
  })
})
