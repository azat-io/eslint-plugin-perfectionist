import type { Rule } from 'eslint'

import { RuleTester } from '@typescript-eslint/rule-tester'
import { RuleTester as EslintRuleTester } from 'eslint'
import { afterAll, describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-objects'

let ruleName = 'sort-objects'

describe(ruleName, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester()
  let eslintRuleTester = new EslintRuleTester()

  describe(`${ruleName}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    let options = {
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(
      `${ruleName}(${type}): sorts object with identifier and literal keys`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
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
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              let Obj = {
                a: 'aaaa',
                b: 'bbb',
                [c]: 'cc',
                d: 'd',
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorting does not break object`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
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
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              let Obj = {
                b: 'bb',
                c: 'c',
                ...rest,
                a: 'aaa',
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts objects in objects`, rule, {
      invalid: [
        {
          output: [
            dedent`
              let Obj = {
                x: {
                  b: 'b',
                  a: 'aa',
                },
                y: {
                  b: 'b',
                  a: 'aa',
                },
              }
            `,
            dedent`
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
          ],
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedObjectsOrder',
            },
            {
              data: {
                right: 'x',
                left: 'y',
              },
              messageId: 'unexpectedObjectsOrder',
            },
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedObjectsOrder',
            },
          ],
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
        },
      ],
      valid: [
        {
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
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts objects computed keys`, rule, {
      invalid: [
        {
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
        },
      ],
      valid: [
        {
          code: dedent`
            let Obj = {
              'a': 'aaa',
              [b()]: 'bb',
              [c[1]]: 'c',
            }
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): allows to set priority keys`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                leftGroup: 'unknown',
                rightGroup: 'top',
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedObjectsGroupOrder',
            },
          ],
          options: [
            {
              ...options,
              customGroups: { top: ['c', 'b'] },
              groups: ['top', 'unknown'],
            },
          ],
          output: dedent`
            let Obj = {
              b: 'bb',
              c: 'ccc',
              a: 'aaaa',
              d: 'd',
            }
          `,
          code: dedent`
            let Obj = {
              a: 'aaaa',
              b: 'bb',
              c: 'ccc',
              d: 'd',
            }
          `,
        },
      ],
      valid: [
        {
          options: [
            {
              ...options,
              customGroups: { top: ['c', 'b'] },
              groups: ['top', 'unknown'],
            },
          ],
          code: dedent`
            let Obj = {
              b: 'bb',
              c: 'ccc',
              a: 'aaaa',
              d: 'd',
            }
          `,
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex for custom groups`,
      rule,
      {
        valid: [
          {
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
              let Obj = {
                iHaveFooInMyName: string,
                meTooIHaveFoo: string,
                a: string,
                b: "b",
              }
            `,
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts with comments on the same line`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
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
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              let Obj = {
                a: 'aaa', // Comment A
                b: 'bb', // Comment B
                c: 'c' // Comment C
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): do not sorts objects without a comma and with a comment in the last element`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectsOrder',
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts destructured object`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'c',
              },
              messageId: 'unexpectedObjectsOrder',
            },
          ],
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
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}): does not sort keys if the right value depends on the left value`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
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
            options: [options],
          },
        ],
        valid: [],
      },
    )

    describe('detects dependencies', () => {
      ruleTester.run(
        `${ruleName}(${type}): works with complex dependencies`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    nodeDependentOnRight: 'b',
                    right: 'c',
                  },
                  messageId: 'unexpectedObjectsDependencyOrder',
                },
                {
                  data: {
                    nodeDependentOnRight: 'b',
                    right: 'd',
                  },
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
            },
            {
              errors: [
                {
                  data: {
                    nodeDependentOnRight: 'c',
                    right: 'b',
                  },
                  messageId: 'unexpectedObjectsDependencyOrder',
                },
              ],
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
              options: [options],
            },
            {
              errors: [
                {
                  data: {
                    nodeDependentOnRight: 'b',
                    right: 'c',
                  },
                  messageId: 'unexpectedObjectsDependencyOrder',
                },
                {
                  data: {
                    nodeDependentOnRight: 'b',
                    right: 'd',
                  },
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
            },
            {
              errors: [
                {
                  data: {
                    nodeDependentOnRight: 'b',
                    right: 'c',
                  },
                  messageId: 'unexpectedObjectsDependencyOrder',
                },
              ],
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
              options: [options],
            },
            {
              errors: [
                {
                  data: {
                    nodeDependentOnRight: 'b',
                    right: 'c',
                  },
                  messageId: 'unexpectedObjectsDependencyOrder',
                },
              ],
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
              options: [options],
            },
            {
              errors: [
                {
                  data: {
                    nodeDependentOnRight: 'a',
                    right: 'c',
                  },
                  messageId: 'unexpectedObjectsDependencyOrder',
                },
              ],
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
              options: [options],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): detects function expression dependencies`,
        rule,
        {
          valid: [
            {
              code: dedent`
                let Func = ({
                  b = () => 1,
                  a = b(),
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
            {
              code: dedent`
                let Func = ({
                  b = function() { return 1 },
                  a = b(),
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
            {
              code: dedent`
                let Func = ({
                  b = () => 1,
                  a = a.map(b),
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) detects dependencies in objects`,
        rule,
        {
          valid: [
            {
              code: dedent`
                let Func = ({
                  b = 1,
                  a = {x: b},
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
            {
              code: dedent`
                let Func = ({
                  b = 1,
                  a = {[b]: 0},
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) detects chained dependencies`,
        rule,
        {
          valid: [
            {
              code: dedent`
                let Func = ({
                  b = {x: 1},
                  a = b.x,
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
            {
              code: dedent`
                let Func = ({
                  b = new Subject(),
                  a = b.asObservable(),
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) detects optional chained dependencies`,
        rule,
        {
          valid: [
            {
              code: dedent`
                let Func = ({
                  b = {x: 1},
                  a = b?.x,
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) detects non-null asserted dependencies`,
        rule,
        {
          valid: [
            {
              code: dedent`
                let Func = ({
                  b = 1,
                  a = b!,
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(`${ruleName}(${type}) detects unary dependencies`, rule, {
        valid: [
          {
            code: dedent`
              let Func = ({
                b = true,
                a = !b,
              }) => {
                // ...
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
      })

      ruleTester.run(
        `${ruleName}(${type}) detects spread elements dependencies`,
        rule,
        {
          valid: [
            {
              code: dedent`
                let Func = ({
                  b = {x: 1},
                  a = {...b},
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
            {
              code: dedent`
                let Func = ({
                  b = [1],
                  a = [...b],
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) detects dependencies in conditional expressions`,
        rule,
        {
          valid: [
            {
              code: dedent`
                let Func = ({
                  b = 0,
                  a = b ? 1 : 0,
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
            {
              code: dedent`
                let Func = ({
                  b = 0,
                  a = x ? b : 0,
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
            {
              code: dedent`
                let Func = ({
                  b = 0,
                  a = x ? 0 : b,
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) detects dependencies in 'as' expressions`,
        rule,
        {
          valid: [
            {
              code: dedent`
                let Func = ({
                  b = 'b',
                  a = b as any,
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) detects dependencies in type assertion expressions`,
        rule,
        {
          valid: [
            {
              code: dedent`
                let Func = ({
                  b = 'b',
                  a = <any>b,
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) detects dependencies in template literal expressions`,
        rule,
        {
          valid: [
            {
              code: dedent`
                let Func = ({
                  b = 'b',
                  a = \`\${b}\`,
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) ignores function body dependencies`,
        rule,
        {
          valid: [
            {
              code: dedent`
                let Func = ({
                  a = () => b,
                  b = 1,
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
            {
              code: dedent`
                let Func = ({
                  a = function() { return b },
                  b = 1,
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
            {
              code: dedent`
                let Func = ({
                  a = () => {return b},
                  b = 1,
                }) => {
                  // ...
                }
              `,
              options: [options],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): detects dependencies in object destructuring`,
        rule,
        {
          invalid: [
            {
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
            },
            {
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
            },
            {
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
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): detects and ignores circular dependencies`,
        rule,
        {
          invalid: [
            {
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
                  data: {
                    right: 'a',
                    left: 'b',
                  },
                  messageId: 'unexpectedObjectsOrder',
                },
              ],
              options: [options],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritizes dependencies over group configuration`,
        rule,
        {
          valid: [
            {
              options: [
                {
                  ...options,
                  customGroups: {
                    attributesStartingWithA: 'a',
                    attributesStartingWithB: 'b',
                  },
                  groups: [
                    'attributesStartingWithA',
                    'attributesStartingWithB',
                  ],
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
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritizes dependencies over partitionByComment`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    nodeDependentOnRight: 'b',
                    right: 'a',
                  },
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
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritizes dependencies over partitionByNewLine`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    nodeDependentOnRight: 'b',
                    right: 'a',
                  },
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
            },
          ],
          valid: [],
        },
      )
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use partition comments`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'd',
                  left: 'e',
                },
                messageId: 'unexpectedObjectsOrder',
              },
              {
                data: {
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
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
            options: [
              {
                ...options,
                partitionByComment: '^Part',
              },
            ],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use all comments as parts`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use multiple partition comments`,
      rule,
      {
        invalid: [
          {
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
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
            options: [
              {
                ...options,
                partitionByComment: ['Partition Comment', 'Part:'],
              },
            ],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex for partition comments`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    describe(`${ruleName}(${type}): allows to use "partitionByComment.line"`, () => {
      ruleTester.run(`${ruleName}(${type}): ignores block comments`, rule, {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectsOrder',
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
          },
        ],
        valid: [],
      })

      ruleTester.run(
        `${ruleName}(${type}): allows to use all comments as parts`,
        rule,
        {
          valid: [
            {
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
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows to use multiple partition comments`,
        rule,
        {
          valid: [
            {
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
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows to use regex for partition comments`,
        rule,
        {
          valid: [
            {
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
            },
          ],
          invalid: [],
        },
      )
    })

    describe(`${ruleName}(${type}): allows to use "partitionByComment.block"`, () => {
      ruleTester.run(`${ruleName}(${type}): ignores line comments`, rule, {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectsOrder',
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
          },
        ],
        valid: [],
      })

      ruleTester.run(
        `${ruleName}(${type}): allows to use all comments as parts`,
        rule,
        {
          valid: [
            {
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
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows to use multiple partition comments`,
        rule,
        {
          valid: [
            {
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
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows to use regex for partition comments`,
        rule,
        {
          valid: [
            {
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
            },
          ],
          invalid: [],
        },
      )
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'd',
                  left: 'e',
                },
                messageId: 'unexpectedObjectsOrder',
              },
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectsOrder',
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to remove special characters`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use locale`, rule, {
      valid: [
        {
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
        },
      ],
      invalid: [],
    })

    describe(`${ruleName}(${type}): selectors priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize method over multiline`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    left: 'multilineProperty',
                    leftGroup: 'multiline',
                    rightGroup: 'method',
                    right: 'method',
                  },
                  messageId: 'unexpectedObjectsGroupOrder',
                },
              ],
              output: dedent`
                let obj = {
                  method() {},
                  multilineProperty: {
                    // Some multiline stuff
                  },
                }
              `,
              code: dedent`
                let obj = {
                  multilineProperty: {
                    // Some multiline stuff
                  },
                  method() {},
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['method', 'multiline'],
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize property over multiline`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    left: 'multilineFunction',
                    leftGroup: 'multiline',
                    rightGroup: 'property',
                    right: 'property',
                  },
                  messageId: 'unexpectedObjectsGroupOrder',
                },
              ],
              output: dedent`
                let obj = {
                  property,
                  multilineFunction() {
                    // Some multiline stuff
                  },
                }
              `,
              code: dedent`
                let obj = {
                  multilineFunction() {
                    // Some multiline stuff
                  },
                  property,
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['property', 'multiline'],
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize property over member`,
        rule,
        {
          invalid: [
            {
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
            },
          ],
          valid: [],
        },
      )
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        valid: [
          {
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
                groups: ['multiline', 'unknown', 'method'],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    describe(`${ruleName}: newlinesBetween`, () => {
      ruleTester.run(
        `${ruleName}(${type}): removes newlines when never`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'y',
                    left: 'a',
                  },
                  messageId: 'extraSpacingBetweenObjectMembers',
                },
                {
                  data: {
                    right: 'b',
                    left: 'z',
                  },
                  messageId: 'unexpectedObjectsOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'z',
                  },
                  messageId: 'extraSpacingBetweenObjectMembers',
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
                  newlinesBetween: 'never',
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): keeps one newline when always`,
        rule,
        {
          invalid: [
            {
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
                  newlinesBetween: 'always',
                  groups: ['a', 'b'],
                },
              ],
              errors: [
                {
                  data: {
                    right: 'b',
                    left: 'a',
                  },
                  messageId: 'missedSpacingBetweenObjectMembers',
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
                  a, b,
                }
              `,
            },
            {
              errors: [
                {
                  data: {
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'extraSpacingBetweenObjectMembers',
                },
                {
                  data: {
                    right: 'y',
                    left: 'z',
                  },
                  messageId: 'unexpectedObjectsOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'y',
                  },
                  messageId: 'missedSpacingBetweenObjectMembers',
                },
              ],
              output: dedent`
                let Obj = {
                  a: () => null,

                 y: "y",
                z: "z",

                    b: {
                      // Newline stuff
                    },
                }
              `,
              code: dedent`
                let Obj = {
                  a: () => null,


                 z: "z",
                y: "y",
                    b: {
                      // Newline stuff
                    },
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['method', 'unknown', 'multiline'],
                  newlinesBetween: 'always',
                },
              ],
            },
          ],
          valid: [],
        },
      )

      describe(`${ruleName}(${type}): "newlinesBetween" inside groups`, () => {
        ruleTester.run(
          `${ruleName}(${type}): handles "newlinesBetween" between consecutive groups`,
          rule,
          {
            invalid: [
              {
                options: [
                  {
                    ...options,
                    groups: [
                      'a',
                      { newlinesBetween: 'always' },
                      'b',
                      { newlinesBetween: 'always' },
                      'c',
                      { newlinesBetween: 'never' },
                      'd',
                      { newlinesBetween: 'ignore' },
                      'e',
                    ],
                    customGroups: {
                      a: 'a',
                      b: 'b',
                      c: 'c',
                      d: 'd',
                      e: 'e',
                    },
                    newlinesBetween: 'always',
                  },
                ],
                errors: [
                  {
                    data: {
                      right: 'b',
                      left: 'a',
                    },
                    messageId: 'missedSpacingBetweenObjectMembers',
                  },
                  {
                    data: {
                      right: 'c',
                      left: 'b',
                    },
                    messageId: 'extraSpacingBetweenObjectMembers',
                  },
                  {
                    data: {
                      right: 'd',
                      left: 'c',
                    },
                    messageId: 'extraSpacingBetweenObjectMembers',
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
              },
            ],
            valid: [],
          },
        )

        describe(`${ruleName}(${type}): "newlinesBetween" between non-consecutive groups`, () => {
          for (let [globalNewlinesBetween, groupNewlinesBetween] of [
            ['always', 'never'] as const,
            ['always', 'ignore'] as const,
            ['never', 'always'] as const,
            ['ignore', 'always'] as const,
          ]) {
            ruleTester.run(
              `${ruleName}(${type}): enforces a newline if the global option is "${globalNewlinesBetween}" and the group option is "${groupNewlinesBetween}"`,
              rule,
              {
                invalid: [
                  {
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
                        data: {
                          right: 'b',
                          left: 'a',
                        },
                        messageId: 'missedSpacingBetweenObjectMembers',
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
                  },
                ],
                valid: [],
              },
            )
          }

          for (let globalNewlinesBetween of [
            'always',
            'ignore',
            'never',
          ] as const) {
            ruleTester.run(
              `${ruleName}(${type}): enforces no newline if the global option is "${globalNewlinesBetween}" and "newlinesBetween: never" exists between all groups`,
              rule,
              {
                invalid: [
                  {
                    options: [
                      {
                        ...options,
                        groups: [
                          'a',
                          { newlinesBetween: 'never' },
                          'unusedGroup',
                          { newlinesBetween: 'never' },
                          'b',
                          { newlinesBetween: 'always' },
                          'c',
                        ],
                        customGroups: [
                          { elementNamePattern: 'a', groupName: 'a' },
                          { elementNamePattern: 'b', groupName: 'b' },
                          { elementNamePattern: 'c', groupName: 'c' },
                          { groupName: 'unusedGroup', elementNamePattern: 'X' },
                        ],
                        newlinesBetween: globalNewlinesBetween,
                      },
                    ],
                    errors: [
                      {
                        data: {
                          right: 'b',
                          left: 'a',
                        },
                        messageId: 'extraSpacingBetweenObjectMembers',
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
                  },
                ],
                valid: [],
              },
            )
          }

          for (let [globalNewlinesBetween, groupNewlinesBetween] of [
            ['ignore', 'never'] as const,
            ['never', 'ignore'] as const,
          ]) {
            ruleTester.run(
              `${ruleName}(${type}): does not enforce a newline if the global option is "${globalNewlinesBetween}" and the group option is "${groupNewlinesBetween}"`,
              rule,
              {
                valid: [
                  {
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
                      let obj = {
                        a: null,

                        b: null,
                      }
                    `,
                  },
                  {
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
                      let obj = {
                        a: null,
                        b: null,
                      }
                    `,
                  },
                ],
                invalid: [],
              },
            )
          }
        })
      })

      ruleTester.run(
        `${ruleName}(${type}): handles newlines and comment after fixes`,
        rule,
        {
          invalid: [
            {
              output: [
                dedent`
                  let obj = {
                    a, // Comment after
                    b() {},

                    c() {},
                  };
                `,
                dedent`
                  let obj = {
                    a, // Comment after

                    b() {},
                    c() {},
                  };
                `,
              ],
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
                  newlinesBetween: 'always',
                },
              ],
            },
          ],
          valid: [],
        },
      )
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts inline elements correctly`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectsOrder',
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
          },
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectsOrder',
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
          },
        ],
        valid: [],
      },
    )

    describe(`${ruleName}(${type}): allows to use 'useConfigurationIf'`, () => {
      for (let rgbAllNamesMatchPattern of [
        '^r|g|b$',
        ['noMatch', '^r|g|b$'],
        { pattern: '^R|G|B$', flags: 'i' },
        ['noMatch', { pattern: '^R|G|B$', flags: 'i' }],
      ]) {
        ruleTester.run(
          `${ruleName}(${type}): allows to use 'allNamesMatchPattern'`,
          rule,
          {
            invalid: [
              {
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
                options: [
                  {
                    ...options,
                    useConfigurationIf: {
                      allNamesMatchPattern: 'foo',
                    },
                  },
                  {
                    ...options,
                    customGroups: {
                      r: 'r',
                      g: 'g',
                      b: 'b',
                    },
                    useConfigurationIf: {
                      allNamesMatchPattern: rgbAllNamesMatchPattern,
                    },
                    groups: ['r', 'g', 'b'],
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
              },
            ],
            valid: [],
          },
        )
      }

      ruleTester.run(
        `${ruleName}(${type}): allows to use 'callingFunctionNamePattern'`,
        rule,
        {
          invalid: [
            {
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
                  customGroups: {
                    r: 'r',
                    g: 'g',
                    b: 'b',
                  },
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
            },
          ],
          valid: [],
        },
      )
    })

    describe(`${ruleName}: custom groups`, () => {
      ruleTester.run(`${ruleName}: filters on selector and modifiers`, rule, {
        invalid: [
          {
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
          },
        ],
        valid: [],
      })

      for (let elementNamePattern of [
        'hello',
        ['noMatch', 'hello'],
        { pattern: 'HELLO', flags: 'i' },
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ]) {
        ruleTester.run(`${ruleName}: filters on elementNamePattern`, rule, {
          invalid: [
            {
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
            },
          ],
          valid: [],
        })
      }

      for (let injectElementValuePattern of [
        'inject',
        ['noMatch', 'inject'],
        { pattern: 'INJECT', flags: 'i' },
        ['noMatch', { pattern: 'INJECT', flags: 'i' }],
      ]) {
        ruleTester.run(`${ruleName}: filters on elementValuePattern`, rule, {
          invalid: [
            {
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
            },
          ],
          valid: [],
        })
      }

      ruleTester.run(
        `${ruleName}: sort custom groups by overriding 'type' and 'order'`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'bb',
                    left: 'a',
                  },
                  messageId: 'unexpectedObjectsOrder',
                },
                {
                  data: {
                    right: 'ccc',
                    left: 'bb',
                  },
                  messageId: 'unexpectedObjectsOrder',
                },
                {
                  data: {
                    right: 'dddd',
                    left: 'ccc',
                  },
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
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}: sort custom groups by overriding 'fallbackSort'`,
        rule,
        {
          invalid: [
            {
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
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}: does not sort custom groups with 'unsorted' type`,
        rule,
        {
          invalid: [
            {
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
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(`${ruleName}: sort custom group blocks`, rule, {
        invalid: [
          {
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
          },
        ],
        valid: [],
      })

      ruleTester.run(
        `${ruleName}: allows to use regex for element names in custom groups`,
        rule,
        {
          valid: [
            {
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
            },
          ],
          invalid: [],
        },
      )

      describe('newlinesInside', () => {
        ruleTester.run(
          `${ruleName}: allows to use newlinesInside: always`,
          rule,
          {
            invalid: [
              {
                options: [
                  {
                    customGroups: [
                      {
                        newlinesInside: 'always',
                        selector: 'property',
                        groupName: 'group1',
                      },
                    ],
                    groups: ['group1'],
                  },
                ],
                errors: [
                  {
                    data: {
                      right: 'b',
                      left: 'a',
                    },
                    messageId: 'missedSpacingBetweenObjectMembers',
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
              },
            ],
            valid: [],
          },
        )

        ruleTester.run(
          `${ruleName}: allows to use newlinesInside: never`,
          rule,
          {
            invalid: [
              {
                options: [
                  {
                    customGroups: [
                      {
                        newlinesInside: 'never',
                        selector: 'property',
                        groupName: 'group1',
                      },
                    ],
                    type: 'alphabetical',
                    groups: ['group1'],
                  },
                ],
                errors: [
                  {
                    data: {
                      right: 'b',
                      left: 'a',
                    },
                    messageId: 'extraSpacingBetweenObjectMembers',
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
              },
            ],
            valid: [],
          },
        )
      })

      ruleTester.run(
        `${ruleName}(${type}): allows to use regex for custom groups`,
        rule,
        {
          valid: [
            {
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
                let obj = {
                  iHaveFooInMyName,
                  meTooIHaveFoo,
                  a,
                  b,
                }
              `,
            },
          ],
          invalid: [],
        },
      )
    })
  })

  describe(`${ruleName}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(
      `${ruleName}(${type}): sorts object with identifier and literal keys`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
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
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              let Obj = {
                a: 'aaaa',
                b: 'bbb',
                [c]: 'cc',
                d: 'd',
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorting does not break object`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
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
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              let Obj = {
                b: 'bb',
                c: 'c',
                ...rest,
                a: 'aaa',
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts objects in objects`, rule, {
      invalid: [
        {
          output: [
            dedent`
              let Obj = {
                x: {
                  b: 'b',
                  a: 'aa',
                },
                y: {
                  b: 'b',
                  a: 'aa',
                },
              }
            `,
            dedent`
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
          ],
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedObjectsOrder',
            },
            {
              data: {
                right: 'x',
                left: 'y',
              },
              messageId: 'unexpectedObjectsOrder',
            },
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedObjectsOrder',
            },
          ],
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
        },
      ],
      valid: [
        {
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
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts objects computed keys`, rule, {
      invalid: [
        {
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
        },
      ],
      valid: [
        {
          code: dedent`
            let Obj = {
              'a': 'aaa',
              [b()]: 'bb',
              [c[1]]: 'c',
            }
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): allows to set priority keys`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                leftGroup: 'unknown',
                rightGroup: 'top',
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedObjectsGroupOrder',
            },
          ],
          options: [
            {
              ...options,
              customGroups: { top: ['c', 'b'] },
              groups: ['top', 'unknown'],
            },
          ],
          output: dedent`
            let Obj = {
              b: 'bb',
              c: 'ccc',
              a: 'aaaa',
              d: 'd',
            }
          `,
          code: dedent`
            let Obj = {
              a: 'aaaa',
              b: 'bb',
              c: 'ccc',
              d: 'd',
            }
          `,
        },
      ],
      valid: [
        {
          options: [
            {
              ...options,
              customGroups: { top: ['c', 'b'] },
              groups: ['top', 'unknown'],
            },
          ],
          code: dedent`
            let Obj = {
              b: 'bb',
              c: 'ccc',
              a: 'aaaa',
              d: 'd',
            }
          `,
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts with comments on the same line`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
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
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              let Obj = {
                a: 'aaa', // Comment A
                b: 'bb', // Comment B
                c: 'c', // Comment C
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): do not sorts objects without a comma and with a comment in the last element`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectsOrder',
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts destructured object`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'c',
              },
              messageId: 'unexpectedObjectsOrder',
            },
          ],
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
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}): does not sort keys if the right value depends on the left value`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
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
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with complex dependencies`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  nodeDependentOnRight: 'b',
                  right: 'c',
                },
                messageId: 'unexpectedObjectsDependencyOrder',
              },
              {
                data: {
                  nodeDependentOnRight: 'b',
                  right: 'd',
                },
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
          },
          {
            errors: [
              {
                data: {
                  nodeDependentOnRight: 'c',
                  right: 'b',
                },
                messageId: 'unexpectedObjectsDependencyOrder',
              },
            ],
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
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  nodeDependentOnRight: 'b',
                  right: 'c',
                },
                messageId: 'unexpectedObjectsDependencyOrder',
              },
              {
                data: {
                  nodeDependentOnRight: 'b',
                  right: 'd',
                },
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
          },
          {
            errors: [
              {
                data: {
                  nodeDependentOnRight: 'b',
                  right: 'c',
                },
                messageId: 'unexpectedObjectsDependencyOrder',
              },
            ],
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
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  nodeDependentOnRight: 'b',
                  right: 'c',
                },
                messageId: 'unexpectedObjectsDependencyOrder',
              },
            ],
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
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use partition comments`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'd',
                  left: 'e',
                },
                messageId: 'unexpectedObjectsOrder',
              },
              {
                data: {
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
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
            options: [
              {
                ...options,
                partitionByComment: '^Part',
              },
            ],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use all comments as parts`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use multiple partition comments`,
      rule,
      {
        invalid: [
          {
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
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
            options: [
              {
                ...options,
                partitionByComment: ['Partition Comment', 'Part:'],
              },
            ],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'd',
                  left: 'e',
                },
                messageId: 'unexpectedObjectsOrder',
              },
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectsOrder',
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )
  })

  describe(`${ruleName}: sorts by custom alphabet`, () => {
    let type = 'custom'

    let alphabet = Alphabet.generateRecommendedAlphabet()
      .sortByLocaleCompare('en-US')
      .getCharacters()
    let options = {
      type: 'custom',
      order: 'asc',
      alphabet,
    } as const

    ruleTester.run(
      `${ruleName}(${type}): sorts object with identifier and literal keys`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
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
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              let Obj = {
                a: 'aaaa',
                b: 'bbb',
                [c]: 'cc',
                d: 'd',
              }
            `,
            options: [options],
          },
        ],
      },
    )
  })

  describe(`${ruleName}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(
      `${ruleName}(${type}): sorts object with identifier and literal keys`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'c',
                  left: 'd',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
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
                d: 'd',
                [c]: 'cc',
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              let Obj = {
                a: 'aaaa',
                [c]: 'cc',
                b: 'bbb',
                d: 'd',
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorting does not break object`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
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
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              let Obj = {
                b: 'bb',
                c: 'c',
                ...rest,
                a: 'aaa',
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts objects in objects`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedObjectsOrder',
            },
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedObjectsOrder',
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
              x: {
                b: 'b',
                a: 'aa',
              },
              y: {
                b: 'b',
                a: 'aa',
              },
            }
          `,
          options: [options],
        },
      ],
      valid: [
        {
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
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts objects computed keys`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b()',
                left: 'a',
              },
              messageId: 'unexpectedObjectsOrder',
            },
          ],
          output: dedent`
            let Obj = {
              [b()]: 'bb',
              [c[1]]: 'c',
              'a': 'aaa',
            }
          `,
          code: dedent`
            let Obj = {
              'a': 'aaa',
              [b()]: 'bb',
              [c[1]]: 'c',
            }
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            let Obj = {
              [b()]: 'bb',
              [c[1]]: 'c',
              'a': 'aaa',
            }
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): allows to set priority keys`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                leftGroup: 'unknown',
                rightGroup: 'top',
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedObjectsGroupOrder',
            },
            {
              data: {
                right: 'c',
                left: 'b',
              },
              messageId: 'unexpectedObjectsOrder',
            },
          ],
          options: [
            {
              ...options,
              customGroups: { top: ['c', 'b'] },
              groups: ['top', 'unknown'],
            },
          ],
          output: dedent`
            let Obj = {
              c: 'ccc',
              b: 'bb',
              a: 'aaaa',
              d: 'd',
            }
          `,
          code: dedent`
            let Obj = {
              a: 'aaaa',
              b: 'bb',
              c: 'ccc',
              d: 'd',
            }
          `,
        },
      ],
      valid: [
        {
          options: [
            {
              ...options,
              customGroups: { top: ['c', 'b'] },
              groups: ['top', 'unknown'],
            },
          ],
          code: dedent`
            let Obj = {
              c: 'ccc',
              b: 'bb',
              a: 'aaaa',
              d: 'd',
            }
          `,
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts with comments on the same line`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
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
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              let Obj = {
                a: 'aaa', // Comment A
                b: 'bb', // Comment B
                c: 'c' // Comment C
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): do not sorts objects without a comma and with a comment in the last element`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectsOrder',
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts destructured object`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'a',
                left: 'c',
              },
              messageId: 'unexpectedObjectsOrder',
            },
          ],
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
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}): does not sort keys if the right value depends on the left value`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
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
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with complex dependencies`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  nodeDependentOnRight: 'b',
                  right: 'c',
                },
                messageId: 'unexpectedObjectsDependencyOrder',
              },
              {
                data: {
                  nodeDependentOnRight: 'b',
                  right: 'd',
                },
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
          },
          {
            errors: [
              {
                data: {
                  nodeDependentOnRight: 'c',
                  right: 'b',
                },
                messageId: 'unexpectedObjectsDependencyOrder',
              },
            ],
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
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  nodeDependentOnRight: 'b',
                  right: 'c',
                },
                messageId: 'unexpectedObjectsDependencyOrder',
              },
              {
                data: {
                  nodeDependentOnRight: 'b',
                  right: 'd',
                },
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
          },
          {
            errors: [
              {
                data: {
                  nodeDependentOnRight: 'b',
                  right: 'c',
                },
                messageId: 'unexpectedObjectsDependencyOrder',
              },
            ],
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
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use partition comments`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'd',
                  left: 'e',
                },
                messageId: 'unexpectedObjectsOrder',
              },
              {
                data: {
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
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
            options: [
              {
                ...options,
                partitionByComment: '^Part',
              },
            ],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use all comments as parts`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use multiple partition comments`,
      rule,
      {
        invalid: [
          {
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
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
            options: [
              {
                ...options,
                partitionByComment: ['Partition Comment', 'Part:'],
              },
            ],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): not changes order if the same length`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'd',
                  left: 'c',
                },
                messageId: 'unexpectedObjectsOrder',
              },
              {
                data: {
                  right: 'e',
                  left: 'd',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
            options: [
              {
                ...options,
                partitionByComment: [
                  'Public Safety Bureau',
                  'Crime Coefficient:',
                  'Victims',
                ],
              },
            ],
            output: dedent`
              export const test = {
                e: 'e12',
                d: 'd1',
                a: 'a',
                b: 'b',
                c: 'c',
              }
            `,
            code: dedent`
              export const test = {
                a: 'a',
                b: 'b',
                c: 'c',
                d: 'd1',
                e: 'e12',
              }
            `,
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'd',
                  left: 'e',
                },
                messageId: 'unexpectedObjectsOrder',
              },
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectsOrder',
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): handles "fallbackSort" option`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'a',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
            options: [
              {
                ...options,
                fallbackSort: {
                  type: 'alphabetical',
                },
              },
            ],
            output: dedent`
              let obj = {
                bb: 'bb',
                c: 'c',
                a: 'a',
              }
            `,
            code: dedent`
              let obj = {
                a: 'a',
                bb: 'bb',
                c: 'c',
              }
            `,
          },
          {
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
            options: [
              {
                ...options,
                fallbackSort: {
                  type: 'alphabetical',
                  order: 'asc',
                },
              },
            ],
            output: dedent`
              let obj = {
                bb: 'bb',
                a: 'a',
                c: 'c',
              }
            `,
            code: dedent`
              let obj = {
                c: 'c',
                bb: 'bb',
                a: 'a',
              }
            `,
          },
        ],
        valid: [],
      },
    )
  })

  describe(`${ruleName}: unsorted type`, () => {
    let type = 'unsorted'

    let options = {
      type: 'unsorted',
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): does not enforce sorting`, rule, {
      valid: [
        {
          code: dedent`
            let obj = {
              b: 'b',
              c: 'c',
              a: 'a',
            }
          `,
          options: [options],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}(${type}): enforces grouping`, rule, {
      invalid: [
        {
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
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}(${type}): enforces newlines between`, rule, {
      invalid: [
        {
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
              newlinesBetween: 'always',
              groups: ['b', 'a'],
            },
          ],
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'missedSpacingBetweenObjectMembers',
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
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}(${type}): enforces dependency sorting`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                nodeDependentOnRight: 'a',
                right: 'b',
              },
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
        },
      ],
      valid: [],
    })
  })

  describe(`${ruleName}: misc`, () => {
    it('validates the JSON schema', async () => {
      await expect(
        validateRuleJsonSchema(rule.meta.schema),
      ).resolves.not.toThrow()
    })

    ruleTester.run(
      `${ruleName}: sets alphabetical asc sorting as default`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedObjectsOrder',
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
          },
        ],
        valid: [
          dedent`
            let Obj = {
              a: 'a',
              b: 'b',
              c: 'c',
            }
          `,
          {
            code: dedent`
              const calculator = {
                log: () => undefined,
                log10: () => undefined,
                log1p: () => undefined,
                log2: () => undefined,
              }
            `,
            options: [{}],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}: allow to disable rule for styledComponents`,
      rule,
      {
        valid: [
          {
            code: dedent`
              const Box = styled.div({
                background: "red",
                width: "50px",
                height: "50px",
              })
            `,
            options: [
              {
                styledComponents: false,
              },
            ],
          },
          {
            code: dedent`
              const PropsBox = styled.div((props) => ({
                background: props.background,
                height: "50px",
                width: "50px",
              }))
            `,
            options: [
              {
                styledComponents: false,
              },
            ],
          },
          {
            code: dedent`
              export default styled('div')(() => ({
                borderRadius: 0,
                borderWidth: 0,
                border: 0,
                borderBottom: hasBorder && \`1px solid \${theme.palette.divider}\`,
              }))
            `,
            options: [
              {
                styledComponents: false,
              },
            ],
          },
          {
            code: dedent`
              const headerClass = css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '3',
                gridGap: '8',
              });
            `,
            options: [
              {
                styledComponents: false,
              },
            ],
          },
          {
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
            options: [
              {
                styledComponents: false,
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(`${ruleName}: allow to ignore pattern`, rule, {
      invalid: [
        {
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
        },
      ],
      valid: [],
    })

    for (let ignorePattern of [
      'Styles$',
      ['noMatch', 'Styles$'],
      { pattern: 'STYLES$', flags: 'i' },
      ['noMatch', { pattern: 'STYLES$', flags: 'i' }],
    ]) {
      ruleTester.run(`${ruleName}: allow to ignore pattern`, rule, {
        valid: [
          {
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
          },
        ],
        invalid: [],
      })
    }

    ruleTester.run(`${ruleName}: allow to ignore pattern`, rule, {
      invalid: [
        {
          output: dedent`
            export default {
              data() {
                return {
                  background: "palevioletred",
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
                  background: "palevioletred",
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
        },
      ],
      valid: [
        {
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
        },
      ],
    })

    ruleTester.run(`${ruleName}: allow to use 'destructureOnly'`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectsOrder',
            },
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedObjectsOrder',
            },
          ],
          output: dedent`
            let obj = {
              c: 'c',
              b: 'b',
              a: 'a',
            }

            let { a, b, c } = obj
          `,
          code: dedent`
            let obj = {
              c: 'c',
              b: 'b',
              a: 'a',
            }

            let { c, b, a } = obj
          `,
          options: [
            {
              destructureOnly: true,
            },
          ],
        },
      ],
      valid: [
        {
          code: dedent`
            let obj = {
              c: 'c',
              b: 'b',
              a: 'a',
            }

            let { a, b, c } = obj
          `,
          options: [
            {
              destructureOnly: true,
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: allow to use 'objectDeclarations'`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectsOrder',
            },
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedObjectsOrder',
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
          options: [
            {
              objectDeclarations: false,
            },
          ],
        },
      ],
      valid: [
        {
          code: dedent`
            let obj = {
              c: 'c',
              a: 'a',
              b: 'b',
            }

            let { a, b, c } = obj
          `,
          options: [
            {
              objectDeclarations: false,
            },
          ],
        },
      ],
    })

    describe(`${ruleName}: allow to use 'destructuredObjects'`, () => {
      ruleTester.run(`${ruleName}: boolean 'destructuredObjects'`, rule, {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedObjectsOrder',
              },
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectsOrder',
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
            options: [
              {
                destructuredObjects: false,
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
              let obj = {
                a: 'a',
                b: 'b',
                c: 'c',
              }

              let { b, c, a } = obj
            `,
            options: [
              {
                destructuredObjects: false,
              },
            ],
          },
        ],
      })

      ruleTester.run(
        `${ruleName}: object 'destructuredObjects': 'groups' attribute`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    leftGroup: 'unknown',
                    rightGroup: 'top',
                    right: 'c',
                    left: 'a',
                  },
                  messageId: 'unexpectedObjectsGroupOrder',
                },
              ],
              options: [
                {
                  customGroups: {
                    top: 'c',
                  },
                  destructuredObjects: { groups: true },
                  groups: ['top', 'unknown'],
                },
              ],
              output: dedent`
                let { c, a, b } = obj
              `,
              code: dedent`
                let { a, c, b } = obj
              `,
            },
            {
              errors: [
                {
                  data: {
                    rightGroup: 'unknown',
                    leftGroup: 'top',
                    right: 'b',
                    left: 'c',
                  },
                  messageId: 'unexpectedObjectsGroupOrder',
                },
              ],
              options: [
                {
                  customGroups: {
                    top: 'c',
                  },
                  destructuredObjects: { groups: false },
                  groups: ['top', 'unknown'],
                },
              ],
              output: dedent`
                let { a, b, c } = obj
              `,
              code: dedent`
                let { a, c, b } = obj
              `,
            },
          ],
          valid: [],
        },
      )
    })

    ruleTester.run(`${ruleName}: works with settings`, rule, {
      valid: [
        {
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
        },
      ],
      invalid: [],
    })

    describe('handles complex comment cases', () => {
      ruleTester.run(`keeps comments associated to their node`, rule, {
        invalid: [
          {
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
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
            options: [
              {
                type: 'alphabetical',
              },
            ],
          },
        ],
        valid: [],
      })

      ruleTester.run(`handles partition comments`, rule, {
        invalid: [
          {
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
                data: {
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedObjectsOrder',
              },
              {
                data: {
                  right: 'a',
                  left: 'd',
                },
                messageId: 'unexpectedObjectsOrder',
              },
            ],
            options: [
              {
                partitionByComment: 'PartitionComment:',
                type: 'alphabetical',
              },
            ],
          },
        ],
        valid: [],
      })
    })

    let ruleTesterJSX = new RuleTester({
      languageOptions: {
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
        },
      },
    })
    ruleTesterJSX.run(
      'allows to disable sorting object is style prop in jsx',
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    let eslintDisableRuleTesterName = `${ruleName}: supports 'eslint-disable' for individual nodes`
    ruleTester.run(eslintDisableRuleTesterName, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectsOrder',
            },
          ],
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
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'c',
                left: 'd',
              },
              messageId: 'unexpectedObjectsOrder',
            },
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedObjectsOrder',
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
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectsOrder',
            },
          ],
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
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectsOrder',
            },
          ],
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
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectsOrder',
            },
          ],
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
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectsOrder',
            },
          ],
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
          options: [{}],
        },
        {
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
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedObjectsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            let obj = {
              b = 'b',
              c = 'c',
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              a = 'a'
            }
          `,
          code: dedent`
            let obj = {
              c = 'c',
              b = 'b',
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              a = 'a'
            }
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            let obj = {
              b = 'b',
              c = 'c',
              a = 'a' // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            }
          `,
          code: dedent`
            let obj = {
              c = 'c',
              b = 'b',
              a = 'a' // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            }
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            let obj = {
              b = 'b',
              c = 'c',
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              a = 'a'
            }
          `,
          code: dedent`
            let obj = {
              c = 'c',
              b = 'b',
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              a = 'a'
            }
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            let obj = {
              b = 'b',
              c = 'c',
              a = 'a' /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            }
          `,
          code: dedent`
            let obj = {
              c = 'c',
              b = 'b',
              a = 'a' /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            }
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedObjectsOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            let obj = {
              a = 'a',
              d = 'd',
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
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
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              c = 'c',
              b = 'b',
              // Shouldn't move
              /* eslint-enable */
              a = 'a'
            }
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedObjectsOrder',
            },
          ],
          options: [{}],
        },
      ],
      valid: [
        {
          code: dedent`
            let obj = {
              b = 'b',
              c = 'c',
              // eslint-disable-next-line
              a = 'a',
            }
          `,
        },
      ],
    })

    eslintRuleTester.run(
      `${ruleName}: handles non typescript-eslint parser`,
      rule as unknown as Rule.RuleModule,
      {
        valid: [
          {
            code: dedent`
              let Func = ({
                b = () => 1,
                a = b(),
              }) => {
                // ...
              }
            `,
            options: [{}],
          },
        ],
        invalid: [],
      },
    )
  })
})
