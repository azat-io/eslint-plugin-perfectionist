import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule from '../rules/sort-classes'

let ruleName = 'sort-classes'

describe(ruleName, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester()

  describe(`${ruleName}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    let options = {
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts class members`, rule, {
      valid: [
        {
          code: dedent`
            class Class {
              a
            }
          `,
          options: [options],
        },
        {
          code: dedent`
            class Class {
              static a = 'a'

              protected b = 'b'

              private c = 'c'

              d = 'd'

              e = 'e'

              constructor() {}

              static f() {}

              protected static g() {}

              protected h() {}

              private i() {}

              j() {}

              k() {}
            }
          `,
          options: [
            {
              ...options,
              groups: [
                'static-property',
                'protected-property',
                'private-property',
                'property',
                'constructor',
                'static-method',
                'static-protected-method',
                'protected-method',
                'private-method',
                'method',
                'unknown',
              ],
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            class Class {
              static a = 'a'

              protected b = 'b'

              private c = 'c'

              e = 'e'

              d = 'd'

              static f() {}

              constructor() {}

              protected static g() {}

              protected h() {}

              private i() {}

              j() {}

              k() {}
            }
          `,
          output: dedent`
            class Class {
              static a = 'a'

              protected b = 'b'

              private c = 'c'

              d = 'd'

              e = 'e'

              constructor() {}

              static f() {}

              protected static g() {}

              protected h() {}

              private i() {}

              j() {}

              k() {}
            }
          `,
          options: [
            {
              ...options,
              groups: [
                'static-property',
                'protected-property',
                'private-property',
                'property',
                'constructor',
                'static-method',
                'static-protected-method',
                'protected-method',
                'private-method',
                'method',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'e',
                right: 'd',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'f',
                leftGroup: 'static-method',
                right: 'constructor',
                rightGroup: 'constructor',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts complex official groups`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
            abstract class Class {

              p?(): void;

              o?;

              static {}

              static readonly [key: string]: string;

              private n = function() {};

              private m = () => {};

              declare private static readonly l;

              private k = 'k';

              protected j = 'j';

              public i = 'i';

              private readonly h = 'h';

              protected readonly g = 'g';

              public readonly f = 'f';

              private static override readonly e = 'e';

              protected static override readonly d = 'd';

              static override readonly c = 'c';

              @Decorator
              protected abstract override readonly b;

              @Decorator
              abstract override readonly a;
            }
          `,
            output: dedent`
            abstract class Class {

              @Decorator
              abstract override readonly a;

              @Decorator
              protected abstract override readonly b;

              static override readonly c = 'c';

              protected static override readonly d = 'd';

              private static override readonly e = 'e';

              public readonly f = 'f';

              protected readonly g = 'g';

              private readonly h = 'h';

              public i = 'i';

              protected j = 'j';

              private k = 'k';

              declare private static readonly l;

              private m = () => {};

              private n = function() {};

              static readonly [key: string]: string;

              static {}

              o?;

              p?(): void;
            }
          `,
            options: [
              {
                ...options,
                groups: [
                  'unknown',
                  'public-abstract-override-readonly-decorated-property',
                  'protected-abstract-override-readonly-decorated-property',
                  'static-public-override-readonly-property',
                  'static-protected-override-readonly-property',
                  'static-private-override-readonly-property',
                  'public-readonly-property',
                  'protected-readonly-property',
                  'private-readonly-property',
                  'public-property',
                  'protected-property',
                  'private-property',
                  'declare-private-static-readonly-property',
                  'function-property',
                  'static-readonly-index-signature',
                  'static-block',
                  'public-optional-property',
                  'public-optional-method',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'p',
                  leftGroup: 'public-optional-method',
                  right: 'o',
                  rightGroup: 'public-optional-property',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'o',
                  leftGroup: 'public-optional-property',
                  right: 'static',
                  rightGroup: 'static-block',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'static',
                  leftGroup: 'static-block',
                  right: 'static readonly [key: string]',
                  rightGroup: 'static-readonly-index-signature',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'static readonly [key: string]',
                  leftGroup: 'static-readonly-index-signature',
                  right: 'n',
                  rightGroup: 'function-property',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'n',
                  right: 'm',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'm',
                  leftGroup: 'function-property',
                  right: 'l',
                  rightGroup: 'declare-private-static-readonly-property',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'l',
                  leftGroup: 'declare-private-static-readonly-property',
                  right: 'k',
                  rightGroup: 'private-property',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'k',
                  leftGroup: 'private-property',
                  right: 'j',
                  rightGroup: 'protected-property',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'j',
                  leftGroup: 'protected-property',
                  right: 'i',
                  rightGroup: 'public-property',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'i',
                  leftGroup: 'public-property',
                  right: 'h',
                  rightGroup: 'private-readonly-property',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'h',
                  leftGroup: 'private-readonly-property',
                  right: 'g',
                  rightGroup: 'protected-readonly-property',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'g',
                  leftGroup: 'protected-readonly-property',
                  right: 'f',
                  rightGroup: 'public-readonly-property',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'f',
                  leftGroup: 'public-readonly-property',
                  right: 'e',
                  rightGroup: 'static-private-override-readonly-property',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'e',
                  leftGroup: 'static-private-override-readonly-property',
                  right: 'd',
                  rightGroup: 'static-protected-override-readonly-property',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'd',
                  leftGroup: 'static-protected-override-readonly-property',
                  right: 'c',
                  rightGroup: 'static-public-override-readonly-property',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'c',
                  leftGroup: 'static-public-override-readonly-property',
                  right: 'b',
                  rightGroup:
                    'protected-abstract-override-readonly-decorated-property',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'b',
                  leftGroup:
                    'protected-abstract-override-readonly-decorated-property',
                  right: 'a',
                  rightGroup:
                    'public-abstract-override-readonly-decorated-property',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): prioritize selectors over modifiers quantity`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
            export abstract class Class extends Class2 {

              public abstract override method(): string;

              public abstract override get fields(): string;
            }
          `,
            output: dedent`
            export abstract class Class extends Class2 {

              public abstract override get fields(): string;

              public abstract override method(): string;
            }
          `,
            options: [
              {
                ...options,
                groups: ['get-method', 'public-abstract-override-method'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'method',
                  leftGroup: 'public-abstract-override-method',
                  right: 'fields',
                  rightGroup: 'get-method',
                },
              },
            ],
          },
        ],
      },
    )

    describe(`${ruleName}(${type}): index-signature modifiers priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize static over readonly`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
            export class Class {

              a: string;

              static readonly [key: string]: string;
            }
          `,
              output: dedent`
            export class Class {

              static readonly [key: string]: string;

              a: string;
            }
          `,
              options: [
                {
                  ...options,
                  groups: [
                    'static-index-signature',
                    'property',
                    'readonly-index-signature',
                  ],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesGroupOrder',
                  data: {
                    left: 'a',
                    leftGroup: 'property',
                    right: 'static readonly [key: string]',
                    rightGroup: 'static-index-signature',
                  },
                },
              ],
            },
          ],
        },
      )
    })

    describe(`${ruleName}(${type}): method selectors priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize constructor over method`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
            export class Class {

              a(): void;

              constructor() {}
            }
          `,
              output: dedent`
            export class Class {

              constructor() {}

              a(): void;
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['constructor', 'method'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesGroupOrder',
                  data: {
                    left: 'a',
                    leftGroup: 'method',
                    right: 'constructor',
                    rightGroup: 'constructor',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize get-method over method`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
            export class Class {

              a(): void;

              get z() {}
            }
          `,
              output: dedent`
            export class Class {

              get z() {}

              a(): void;
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['get-method', 'method'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesGroupOrder',
                  data: {
                    left: 'a',
                    leftGroup: 'method',
                    right: 'z',
                    rightGroup: 'get-method',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize set-method over method`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
            export class Class {

              a(): void;

              set z() {}
            }
          `,
              output: dedent`
            export class Class {

              set z() {}

              a(): void;
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['set-method', 'method'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesGroupOrder',
                  data: {
                    left: 'a',
                    leftGroup: 'method',
                    right: 'z',
                    rightGroup: 'set-method',
                  },
                },
              ],
            },
          ],
        },
      )
    })

    describe(`${ruleName}(${type}): method modifiers priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize static over override`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
            export class Class extends Class2 {

              a: string;

              static override z(): string;
            }
          `,
              output: dedent`
            export class Class extends Class2 {

              static override z(): string;

              a: string;
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['static-method', 'property', 'override-method'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesGroupOrder',
                  data: {
                    left: 'a',
                    leftGroup: 'property',
                    right: 'z',
                    rightGroup: 'static-method',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize abstract over override`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
            export abstract class Class extends Class2 {

              a: string;

              abstract override z(): string;
            }
          `,
              output: dedent`
            export abstract class Class extends Class2 {

              abstract override z(): string;

              a: string;
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['abstract-method', 'property', 'override-method'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesGroupOrder',
                  data: {
                    left: 'a',
                    leftGroup: 'property',
                    right: 'z',
                    rightGroup: 'abstract-method',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize decorated over override`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
            export abstract class Class extends Class2 {

              a: string;

              @Decorator
              override z(): void {}
            }
          `,
              output: dedent`
            export abstract class Class extends Class2 {

              @Decorator
              override z(): void {}

              a: string;
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['decorated-method', 'property', 'override-method'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesGroupOrder',
                  data: {
                    left: 'a',
                    leftGroup: 'property',
                    right: 'z',
                    rightGroup: 'decorated-method',
                  },
                },
              ],
            },
          ],
        },
      )

      for (let accessibilityModifier of ['public', 'protected', 'private']) {
        ruleTester.run(
          `${ruleName}(${type}): prioritize override over ${accessibilityModifier} accessibility`,
          rule,
          {
            valid: [],
            invalid: [
              {
                code: dedent`
              export class Class {

                a: string;

                ${accessibilityModifier} override z(): string;
              }
            `,
                output: dedent`
              export class Class {

                ${accessibilityModifier} override z(): string;

                a: string;
              }
            `,
                options: [
                  {
                    ...options,
                    groups: [
                      'override-method',
                      'property',
                      `${accessibilityModifier}-method`,
                    ],
                  },
                ],
                errors: [
                  {
                    messageId: 'unexpectedClassesGroupOrder',
                    data: {
                      left: 'a',
                      leftGroup: 'property',
                      right: 'z',
                      rightGroup: 'override-method',
                    },
                  },
                ],
              },
            ],
          },
        )

        ruleTester.run(
          `${ruleName}(${type}): prioritize ${accessibilityModifier} accessibility over optional`,
          rule,
          {
            valid: [],
            invalid: [
              {
                code: dedent`
              export class Class {

                a: string;

                ${accessibilityModifier} z?(): string;
              }
            `,
                output: dedent`
              export class Class {

                ${accessibilityModifier} z?(): string;

                a: string;
              }
            `,
                options: [
                  {
                    ...options,
                    groups: [
                      `${accessibilityModifier}-method`,
                      'property',
                      'optional-method',
                    ],
                  },
                ],
                errors: [
                  {
                    messageId: 'unexpectedClassesGroupOrder',
                    data: {
                      left: 'a',
                      leftGroup: 'property',
                      right: 'z',
                      rightGroup: `${accessibilityModifier}-method`,
                    },
                  },
                ],
              },
            ],
          },
        )
      }
    })

    describe(`${ruleName}(${type}): accessor modifiers priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize static over override`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
            export class Class extends Class2 {

              a: string;

              static override accessor z: string;
            }
          `,
              output: dedent`
            export class Class extends Class2 {

              static override accessor z: string;

              a: string;
            }
          `,
              options: [
                {
                  ...options,
                  groups: [
                    'static-accessor-property',
                    'property',
                    'override-accessor-property',
                  ],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesGroupOrder',
                  data: {
                    left: 'a',
                    leftGroup: 'property',
                    right: 'z',
                    rightGroup: 'static-accessor-property',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize abstract over override`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
            export abstract class Class extends Class2 {

              a: string;

              abstract override accessor z: string;
            }
          `,
              output: dedent`
            export abstract class Class extends Class2 {

              abstract override accessor z: string;

              a: string;
            }
          `,
              options: [
                {
                  ...options,
                  groups: [
                    'abstract-accessor-property',
                    'property',
                    'override-accessor-property',
                  ],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesGroupOrder',
                  data: {
                    left: 'a',
                    leftGroup: 'property',
                    right: 'z',
                    rightGroup: 'abstract-accessor-property',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize decorated over override`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
            export abstract class Class extends Class2 {

              a: string;

              @Decorator
              override accessor z: string;
            }
          `,
              output: dedent`
            export abstract class Class extends Class2 {

              @Decorator
              override accessor z: string;

              a: string;
            }
          `,
              options: [
                {
                  ...options,
                  groups: [
                    'decorated-accessor-property',
                    'property',
                    'override-accessor-property',
                  ],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesGroupOrder',
                  data: {
                    left: 'a',
                    leftGroup: 'property',
                    right: 'z',
                    rightGroup: 'decorated-accessor-property',
                  },
                },
              ],
            },
          ],
        },
      )

      for (let accessibilityModifier of ['public', 'protected', 'private']) {
        ruleTester.run(
          `${ruleName}(${type}): prioritize override over ${accessibilityModifier} accessibility`,
          rule,
          {
            valid: [],
            invalid: [
              {
                code: dedent`
              export class Class {

                a: string;

                ${accessibilityModifier} override accessor z: string;
              }
            `,
                output: dedent`
              export class Class {

                ${accessibilityModifier} override accessor z: string;

                a: string;
              }
            `,
                options: [
                  {
                    ...options,
                    groups: [
                      'override-accessor-property',
                      'property',
                      `${accessibilityModifier}-accessor-property`,
                    ],
                  },
                ],
                errors: [
                  {
                    messageId: 'unexpectedClassesGroupOrder',
                    data: {
                      left: 'a',
                      leftGroup: 'property',
                      right: 'z',
                      rightGroup: 'override-accessor-property',
                    },
                  },
                ],
              },
            ],
          },
        )
      }
    })

    describe(`${ruleName}(${type}): property selectors priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize function property over property`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
            export class Class {

              a = function() {}

              z: string;
            }
          `,
              output: dedent`
            export class Class {

              z: string;

              a = function() {}
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['property', 'function-property'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesGroupOrder',
                  data: {
                    left: 'a',
                    leftGroup: 'function-property',
                    right: 'z',
                    rightGroup: 'property',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize function property over property for arrow functions`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
            export class Class {

              a = () => {}

              z: string;
            }
          `,
              output: dedent`
            export class Class {

              z: string;

              a = () => {}
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['property', 'function-property'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesGroupOrder',
                  data: {
                    left: 'a',
                    leftGroup: 'function-property',
                    right: 'z',
                    rightGroup: 'property',
                  },
                },
              ],
            },
          ],
        },
      )
    })

    describe(`${ruleName}(${type}): property modifiers priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize static over declare`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
            export class Class extends Class2 {

              a(): void {}

              declare static z: string;
            }
          `,
              output: dedent`
            export class Class extends Class2 {

              declare static z: string;

              a(): void {}
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['static-property', 'method', 'declare-property'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesGroupOrder',
                  data: {
                    left: 'a',
                    leftGroup: 'method',
                    right: 'z',
                    rightGroup: 'static-property',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize declare over abstract`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
            export class Class extends Class2 {

              a(): void {}

              declare abstract z: string;
            }
          `,
              output: dedent`
            export class Class extends Class2 {

              declare abstract z: string;

              a(): void {}
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['declare-property', 'method', 'abstract-property'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesGroupOrder',
                  data: {
                    left: 'a',
                    leftGroup: 'method',
                    right: 'z',
                    rightGroup: 'declare-property',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize abstract over override`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
            export abstract class Class extends Class2 {

              a(): void {}

              abstract override z: string;
            }
          `,
              output: dedent`
            export abstract class Class extends Class2 {

              abstract override z: string;

              a(): void {}
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['abstract-property', 'method', 'override-property'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesGroupOrder',
                  data: {
                    left: 'a',
                    leftGroup: 'method',
                    right: 'z',
                    rightGroup: 'abstract-property',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize decorated over override`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
            export abstract class Class extends Class2 {

              a(): void {}

              @Decorator
              override z: string;
            }
          `,
              output: dedent`
            export abstract class Class extends Class2 {

              @Decorator
              override z: string;

              a(): void {}
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['decorated-property', 'method', 'override-property'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesGroupOrder',
                  data: {
                    left: 'a',
                    leftGroup: 'method',
                    right: 'z',
                    rightGroup: 'decorated-property',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize decorated over override`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
            export abstract class Class extends Class2 {

              a(): void {}

              @Decorator
              override z: string;
            }
          `,
              output: dedent`
            export abstract class Class extends Class2 {

              @Decorator
              override z: string;

              a(): void {}
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['decorated-property', 'method', 'override-property'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesGroupOrder',
                  data: {
                    left: 'a',
                    leftGroup: 'method',
                    right: 'z',
                    rightGroup: 'decorated-property',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize override over readonly`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
            export abstract class Class extends Class2 {

              a(): void {}

              override readonly z: string;
            }
          `,
              output: dedent`
            export abstract class Class extends Class2 {

              override readonly z: string;

              a(): void {}
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['override-property', 'method', 'readonly-property'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesGroupOrder',
                  data: {
                    left: 'a',
                    leftGroup: 'method',
                    right: 'z',
                    rightGroup: 'override-property',
                  },
                },
              ],
            },
          ],
        },
      )

      for (let accessibilityModifier of ['public', 'protected', 'private']) {
        ruleTester.run(
          `${ruleName}(${type}): prioritize readonly over ${accessibilityModifier} accessibility`,
          rule,
          {
            valid: [],
            invalid: [
              {
                code: dedent`
              export class Class {

                a(): void {}

                ${accessibilityModifier} readonly z: string;
              }
            `,
                output: dedent`
              export class Class {

                ${accessibilityModifier} readonly z: string;

                a(): void {}
              }
            `,
                options: [
                  {
                    ...options,
                    groups: [
                      'readonly-property',
                      'method',
                      `${accessibilityModifier}-property`,
                    ],
                  },
                ],
                errors: [
                  {
                    messageId: 'unexpectedClassesGroupOrder',
                    data: {
                      left: 'a',
                      leftGroup: 'method',
                      right: 'z',
                      rightGroup: 'readonly-property',
                    },
                  },
                ],
              },
            ],
          },
        )

        ruleTester.run(
          `${ruleName}(${type}): prioritize ${accessibilityModifier} accessibility over optional`,
          rule,
          {
            valid: [],
            invalid: [
              {
                code: dedent`
              export class Class {

                a(): void {}

                ${accessibilityModifier} z?: string;
              }
            `,
                output: dedent`
              export class Class {

                ${accessibilityModifier} z?: string;

                a(): void {}
              }
            `,
                options: [
                  {
                    ...options,
                    groups: [
                      `${accessibilityModifier}-property`,
                      'method',
                      'optional-property',
                    ],
                  },
                ],
                errors: [
                  {
                    messageId: 'unexpectedClassesGroupOrder',
                    data: {
                      left: 'a',
                      leftGroup: 'method',
                      right: 'z',
                      rightGroup: `${accessibilityModifier}-property`,
                    },
                  },
                ],
              },
            ],
          },
        )
      }
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts class and group members`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {
                static a

                static b = 'b'

                [key in O]

                static {
                  this.a = 'd'
                }
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                  ['static-method', 'private-method', 'method'],
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              class Class {
                [key in O]

                static b = 'b'

                static a

                static {
                  this.a = 'd'
                }
              }
            `,
            output: dedent`
              class Class {
                static a

                static b = 'b'

                [key in O]

                static {
                  this.a = 'd'
                }
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                  ['static-method', 'private-method', 'method'],
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'key in O',
                  right: 'b',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts class with attributes having the same name`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class Class {
                static a;

                a;
              }
            `,
            output: dedent`
              class Class {
                a;

                static a;
              }
            `,
            options: [
              {
                ...options,
                groups: ['property', 'static-property'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'a',
                  leftGroup: 'static-property',
                  right: 'a',
                  rightGroup: 'property',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts class with ts index signatures`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {
                static a = 'a';

                [k: string]: any;

                [k: string];
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              class Class {
                [k: string]: any;

                [k: string];

                static a = 'a';
              }
            `,
            output: dedent`
              class Class {
                static a = 'a';

                [k: string]: any;

                [k: string];
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'index-signature',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: '[k: string];',
                  leftGroup: 'index-signature',
                  right: 'a',
                  rightGroup: 'static-property',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts class with ts index signatures`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Decorations {
                setBackground(color: number, hexFlag: boolean): this
                setBackground(color: Color | string | CSSColor): this
                setBackground(r: number, g: number, b: number, a?: number): this
                setBackground(color: ColorArgument, arg1?: boolean | number, arg2?: number, arg3?: number): this {
                    /* ... */
                }
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts private methods with hash`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class MyUnsortedClass {
                someOtherProperty

                someProperty = 1

                constructor() {}

                static #aPrivateStaticMethod () {}

                #somePrivateProperty

                #someOtherPrivateProperty = 2

                static someStaticProperty = 3

                static #someStaticPrivateProperty = 4

                aInstanceMethod () {}

                static aStaticMethod () {}

                #aPrivateInstanceMethod () {}
              }
            `,
            output: dedent`
              class MyUnsortedClass {
                static #someStaticPrivateProperty = 4

                static someStaticProperty = 3

                #someOtherPrivateProperty = 2

                #somePrivateProperty

                someOtherProperty

                someProperty = 1

                constructor() {}

                aInstanceMethod () {}

                #aPrivateInstanceMethod () {}

                static #aPrivateStaticMethod () {}

                static aStaticMethod () {}
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  'static-property',
                  'private-property',
                  'property',
                  'constructor',
                  'method',
                  'private-method',
                  'static-method',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: '#aPrivateStaticMethod',
                  leftGroup: 'static-method',
                  right: '#somePrivateProperty',
                  rightGroup: 'private-property',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: '#somePrivateProperty',
                  right: '#someOtherPrivateProperty',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: '#someOtherPrivateProperty',
                  leftGroup: 'private-property',
                  right: 'someStaticProperty',
                  rightGroup: 'static-property',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'someStaticProperty',
                  right: '#someStaticPrivateProperty',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'aStaticMethod',
                  leftGroup: 'static-method',
                  right: '#aPrivateInstanceMethod',
                  rightGroup: 'private-method',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows split methods with getters and setters`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class A {
                x() {}
                b() {}
                get z() {}
                get c() {}
                set c() {}
              }
            `,
            output: dedent`
              class A {
                b() {}
                x() {}
                get c() {}
                set c() {}
                get z() {}
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  'index-signature',
                  'static-property',
                  'private-property',
                  'property',
                  'constructor',
                  'static-method',
                  'private-method',
                  'method',
                  ['get-method', 'set-method'],
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'x',
                  right: 'b',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'z',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts decorated properties`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            class User {
              firstName: string

              id: number

              @Index({ name: 'born_index' })
              @Property()
              born: string

              @Property()
              @Unique()
              email: string

              lastName: string
            }`,
          output: dedent`
            class User {
              firstName: string

              id: number

              lastName: string

              @Index({ name: 'born_index' })
              @Property()
              born: string

              @Property()
              @Unique()
              email: string
            }`,
          options: [
            {
              ...options,
              groups: ['property', 'decorated-property', 'unknown'],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'email',
                leftGroup: 'decorated-property',
                right: 'lastName',
                rightGroup: 'property',
              },
            },
          ],
        },
        {
          code: dedent`
            class MyElement {
              @property({ attribute: false })
              data = {}

              @property()
              greeting: string = 'Hello'

              @property()
              protected type = ''

              @state()
              private _counter = 0

              private _message = ''

              private _prop = 0

              constructor() {}

              @property()
              get message(): string {
                return this._message
              }

              set message(message: string) {
                this._message = message
              }

              @property()
              set prop(val: number) {
                this._prop = Math.floor(val)
              }

              get prop() {
                return this._prop
              }

              render() {}
            }`,
          output: dedent`
            class MyElement {
              @property({ attribute: false })
              data = {}

              @property()
              greeting: string = 'Hello'

              @property()
              protected type = ''

              @state()
              private _counter = 0

              private _message = ''

              private _prop = 0

              constructor() {}

              @property()
              get message(): string {
                return this._message
              }

              @property()
              set prop(val: number) {
                this._prop = Math.floor(val)
              }

              set message(message: string) {
                this._message = message
              }

              get prop() {
                return this._prop
              }

              render() {}
            }`,
          options: [
            {
              ...options,
              groups: [
                'decorated-property',
                'property',
                'protected-decorated-property',
                'private-decorated-property',
                'private-property',
                'constructor',
                ['decorated-get-method', 'decorated-set-method'],
                ['get-method', 'set-method'],
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'message',
                leftGroup: 'set-method',
                right: 'prop',
                rightGroup: 'decorated-set-method',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts decorated accessors`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            class Todo {
              id = Math.random()

              constructor() {}

              @action
              toggle() {}

              @observable
              accessor #active = false

              @observable
              accessor finished = false

              @observable
              accessor title = ''

              @observable
              protected accessor type = ''
            }`,
          output: dedent`
            class Todo {
              @observable
              accessor finished = false

              @observable
              accessor title = ''

              @observable
              protected accessor type = ''

              @observable
              accessor #active = false

              id = Math.random()

              constructor() {}

              @action
              toggle() {}
            }`,
          options: [
            {
              ...options,
              groups: [
                'decorated-accessor-property',
                'protected-decorated-accessor-property',
                'private-decorated-accessor-property',
                'property',
                'constructor',
                'decorated-method',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'toggle',
                leftGroup: 'decorated-method',
                right: '#active',
                rightGroup: 'private-decorated-accessor-property',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: '#active',
                leftGroup: 'private-decorated-accessor-property',
                right: 'finished',
                rightGroup: 'decorated-accessor-property',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts decorated accessors`, rule, {
      valid: [
        {
          code: dedent`
            class Class {
              // Region: Table
              protected onChangeColumns() {}

              protected onPaginationChanged() {}

              protected onSortChanged() {}

              protected updateTable() {}

              // Region: Form
              protected clearForm() {}

              protected disableForm() {}

              // Regular Comment
              protected onValueChanged() {}

              protected setFormValue() {}
            }
          `,
          options: [
            {
              ...options,
              partitionByComment: 'Region:*',
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            class Class {
              // Region: Table
              protected onChangeColumns() {}

              protected updateTable() {}

              protected onSortChanged() {}

              protected onPaginationChanged() {}

              // Region: Form
              protected clearForm() {}

              protected disableForm() {}

              protected setFormValue() {}

              // Regular Comment
              protected onValueChanged() {}
            }
          `,
          output: dedent`
            class Class {
              // Region: Table
              protected onChangeColumns() {}

              protected onPaginationChanged() {}

              protected onSortChanged() {}

              protected updateTable() {}

              // Region: Form
              protected clearForm() {}

              protected disableForm() {}

              // Regular Comment
              protected onValueChanged() {}

              protected setFormValue() {}
            }
          `,
          options: [
            {
              ...options,
              partitionByComment: 'Region:*',
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'updateTable',
                right: 'onSortChanged',
              },
            },
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'onSortChanged',
                right: 'onPaginationChanged',
              },
            },
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'setFormValue',
                right: 'onValueChanged',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): does not sort properties if the right value depends on the left value`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {
                b = 'b'

                aaa = [this.b]
              }
            `,
            options: [options],
          },
          {
            code: dedent`
              class Class {
                b = 'b'

                getAaa() {
                  return this.b;
                }
              }
            `,
            options: [options],
          },
          {
            code: dedent`
              class Class {
                static c = 'c'

                b = Example.c
              }
            `,
            options: [options],
          },
          {
            code: dedent`
              class Class {
                #b = 'b'

                getAaa() {
                  return this.#b;
                }
              }
            `,
            options: [options],
          },
          {
            code: dedent`
              class Class {
                static b = 'b'

                static getAaa() {
                  return this.b;
                }
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              class Class {
                aaa = [this.b]

                b = 'b'
              }
            `,
            output: dedent`
              class Class {
                b = 'b'

                aaa = [this.b]
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedClassesDependencyOrder',
                data: {
                  right: 'b',
                  nodeDependentOnRight: 'aaa',
                },
              },
            ],
          },
          {
            code: dedent`
              class Class {
                getAaa() {
                  return this.b;
                }

                b = 'b'
              }
            `,
            output: dedent`
              class Class {
                b = 'b'

                getAaa() {
                  return this.b;
                }
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'getAaa',
                  leftGroup: 'method',
                  right: 'b',
                  rightGroup: 'property',
                },
              },
            ],
          },
          {
            code: dedent`
              class Class {
                b = Example.c

                static c = 'c'
              }
            `,
            output: dedent`
              class Class {
                static c = 'c'

                b = Example.c
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'b',
                  leftGroup: 'property',
                  right: 'c',
                  rightGroup: 'static-property',
                },
              },
            ],
          },
          {
            code: dedent`
              class Class {
                getAaa() {
                  return this.#b;
                }

                #b = 'b'
              }
            `,
            output: dedent`
              class Class {
                #b = 'b'

                getAaa() {
                  return this.#b;
                }
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'getAaa',
                  leftGroup: 'method',
                  right: '#b',
                  rightGroup: 'private-property',
                },
              },
            ],
          },
          {
            code: dedent`
              class Class {
                static getAaa() {
                  return this.b;
                }

                static b = 'b'
              }
            `,
            output: dedent`
              class Class {
                static b = 'b'

                static getAaa() {
                  return this.b;
                }
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'getAaa',
                  leftGroup: 'static-method',
                  right: 'b',
                  rightGroup: 'static-property',
                },
              },
            ],
          },
        ],
      },
    )

    describe(`${ruleName}(${type}): detects dependencies`, () => {
      ruleTester.run(
        `${ruleName}(${type}) ignores function expression dependencies`,
        rule,
        {
          valid: [
            {
              code: dedent`
                class Class {
                  a = this.b()
                  static a = this.b()
                  b() {
                    return 1
                  }
                  static b() {
                    return 1
                  }
                }
              `,
              options: [
                {
                  ...options,
                  groups: [['property', 'method']],
                },
              ],
            },
            {
              code: dedent`
                class Class {
                  a = this.b()
                  static a = Class.b()
                  b() {
                    return 1
                  }
                  static b() {
                    return 1
                  }
                }
              `,
              options: [
                {
                  ...options,
                  groups: [['property', 'method']],
                },
              ],
            },
            {
              code: dedent`
                class Class {
                  a = [1].map(this.b)
                  static a = [1].map(this.b)
                  b() {
                    return 1
                  }
                  static b() {
                    return 1
                  }
                }
              `,
              options: [
                {
                  ...options,
                  groups: [['property', 'method']],
                },
              ],
            },
            {
              code: dedent`
                class Class {
                  a = [1].map(this.b)
                  static a = [1].map(Class.b)
                  b() {
                    return 1
                  }
                  static b() {
                    return 1
                  }
                }
              `,
              options: [
                {
                  ...options,
                  groups: [['property', 'method']],
                },
              ],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) detects function property dependencies`,
        rule,
        {
          valid: [
            {
              code: dedent`
                class Class {
                  b = () => {
                    return 1
                  }
                  a = this.b()
                  static b = () => {
                    return 1
                  }
                  static a = this.b()
                }
              `,
              options: [
                {
                  ...options,
                  groups: [['property', 'method']],
                },
              ],
            },
            {
              code: dedent`
                class Class {
                  b = function() {
                    return 1
                  }
                  a = this.b()
                  static b = function() {
                    return 1
                  }
                  static a = this.b()
                }
              `,
              options: [
                {
                  ...options,
                  groups: [['property', 'method']],
                },
              ],
            },
            {
              code: dedent`
                class Class {
                  b = () => {
                    return 1
                  }
                  a = [1].map(this.b)
                  static b = () => {
                    return 1
                  }
                  static a = [1].map(this.b)
                }
              `,
              options: [
                {
                  ...options,
                  groups: [['property', 'method']],
                },
              ],
            },
            {
              code: dedent`
                class Class {
                  b = function() {
                    return 1
                  }
                  a = [1].map(this.b)
                  static b = function() {
                    return 1
                  }
                  static a = [1].map(this.b)
                }
              `,
              options: [
                {
                  ...options,
                  groups: [['property', 'method']],
                },
              ],
            },
            {
              code: dedent`
                class Class {
                  b = () => {
                    return 1
                  }
                  a = [1].map(this.b)
                  static b = () => {
                    return 1
                  }
                  static a = [1].map(Class.b)
                }
              `,
              options: [
                {
                  ...options,
                  groups: [['property', 'method']],
                },
              ],
            },
            {
              code: dedent`
                class Class {
                  b = function() {
                    return 1
                  }
                  a = [1].map(this.b)
                  static b = function() {
                    return 1
                  }
                  static a = [1].map(Class.b)
                }
              `,
              options: [
                {
                  ...options,
                  groups: [['property', 'method']],
                },
              ],
            },
            {
              code: dedent`
                class Class {
                  querystring = createQueryString();
                  state = createState((set) => {
                      set('query', this.queryString.value);
                   });
                }
              `,
              options: [
                {
                  ...options,
                  groups: [['property', 'method']],
                },
              ],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) detects static block dependencies`,
        rule,
        {
          valid: [
            {
              code: dedent`
                class Class {
                  static {
                    return true || OtherClass.z;
                  }
                  static z = true;
                }
              `,
              options: [
                {
                  ...options,
                  groups: [['static-block', 'static-property']],
                },
              ],
            },
            {
              code: dedent`
                class Class {
                  static z = true;
                  static {
                    const method = () => {
                      return (Class.z || true) && (false || this.z);
                    };
                    method();
                  }
                }
              `,
              options: [
                {
                  ...options,
                  groups: [['static-block', 'static-property']],
                },
              ],
            },
            {
              code: dedent`
                class Class {
                  static z = true;
                  static {
                    const method = () => {
                      return (Class.z || true) && (false || this.z);
                    };
                    method();
                    return (Class.z || true) && (false || this.z);
                  }
                }
              `,
              options: [
                {
                  ...options,
                  groups: [['static-block', 'static-property']],
                },
              ],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) detects property expression dependencies`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                class Class {
                  static e = 10 + this.c

                  d = this.b

                  static a = 10 + OtherClass.z

                  b = 10 + Class.z

                  static c = 10 + this.z

                  static z = 1
                }
              `,
              output: dedent`
                class Class {
                  static a = 10 + OtherClass.z

                  static z = 1

                  b = 10 + Class.z

                  static c = 10 + this.z

                  d = this.b

                  static e = 10 + this.c
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesOrder',
                  data: {
                    left: 'e',
                    right: 'd',
                  },
                },
                {
                  messageId: 'unexpectedClassesOrder',
                  data: {
                    left: 'd',
                    right: 'a',
                  },
                },
                {
                  messageId: 'unexpectedClassesDependencyOrder',
                  data: {
                    right: 'b',
                    nodeDependentOnRight: 'd',
                  },
                },
                {
                  messageId: 'unexpectedClassesDependencyOrder',
                  data: {
                    right: 'c',
                    nodeDependentOnRight: 'e',
                  },
                },
                {
                  messageId: 'unexpectedClassesDependencyOrder',
                  data: {
                    right: 'z',
                    nodeDependentOnRight: 'b',
                  },
                },
              ],
            },
            {
              code: dedent`
                class Class {
                  a = this.c
                  b = 10
                  c = 10
                }
              `,
              output: dedent`
                class Class {
                  c = 10
                  a = this.c
                  b = 10
                }
              `,
              options: [
                {
                  ...options,
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesDependencyOrder',
                  data: {
                    right: 'c',
                    nodeDependentOnRight: 'a',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) detects dependencies in objects`,
        rule,
        {
          valid: [
            {
              code: dedent`
               class Class {
                 b = 1
                 a = {
                   b: this.b
                 }
                 static b = 1
                 static a = {
                   b: this.b
                 }
               }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
               class Class {
                 b = 1
                 a = {
                   b: this.b
                 }
                 static b = 1
                 static a = {
                   b: Class.b
                 }
               }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
               class Class {
                 b = 1
                 a = {
                   [this.b]: 1
                 }
                 static b = 1
                 static a = {
                   [this.b]: A
                 }
               }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
               class Class {
                 b = 1
                 a = {
                   [this.b]: 1
                 }
                 static b = 1
                 static a = {
                   [Class.b]: 1
                 }
               }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) detects nested property references`,
        rule,
        {
          valid: [
            {
              code: dedent`
               class Class {
                  b = new Subject()
                  a = this.b.asObservable()
                  static b = new Subject()
                  static a = this.b.asObservable()
               }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
               class Class {
                  b = new Subject()
                  a = this.b.asObservable()
                  static b = new Subject()
                  static a = Class.b.asObservable()
               }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
               class Class {
                  b = new WhateverObject()
                  a = this.b.bProperty
                  static b = new WhateverObject()
                  static a = this.b.bProperty
               }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
               class Class {
                  b = new WhateverObject()
                  a = this.b.bProperty
                  static b = new WhateverObject()
                  static a = Class.b.bProperty
               }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
               class Class {
                  static c = 1
                  static b = new WhateverObject(this.c)
                  static a = Class.b.bMethod().anotherNestedMethod(this.c).finalMethod()
               }
              `,
              options: [
                {
                  ...options,
                },
              ],
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
               class Class {
                  b = new Subject()
                  a = this.b?.asObservable()
                  static b = new Subject()
                  static a = this.b?.asObservable()
               }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
               class Class {
                  b = new Subject()
                  a = this.b?.asObservable()
                  static b = new Subject()
                  static a = Class.b?.asObservable()
               }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
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
               class Class {
                  b = new Subject()
                  a = this.b!.asObservable()
                  static b = new Subject()
                  static a = this.b!.asObservable()
               }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
               class Class {
                  b = new Subject()
                  a = this.b!.asObservable()
                  static b = new Subject()
                  static a = Class.b!.asObservable()
               }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(`${ruleName}(${type}) detects unary dependencies`, rule, {
        valid: [
          {
            code: dedent`
               class Class {
                  b = true
                  a = !this.b
                  static b = true
                  static a = !this.b
               }
              `,
            options: [
              {
                ...options,
                groups: ['property'],
              },
            ],
          },
          {
            code: dedent`
               class Class {
                  b = true
                  a = !this.b
                  static b = true
                  static a = !Class.b
               }
              `,
            options: [
              {
                ...options,
                groups: ['property'],
              },
            ],
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
               class Class {
                  b = {}
                  a = {...this.b}
                  static b = {}
                  static a = {...this.b}
               }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
               class Class {
                  b = {}
                  a = {...this.b}
                  static b = {}
                  static a = {...Class.b}
               }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
               class Class {
                  b = []
                  a = [...this.b]
                  static b = []
                  static a = [...this.b]
               }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
               class Class {
                  b = []
                  a = [...this.b]
                  static b = []
                  static a = [...Class.b]
               }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
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
            class Class {
              b = 1;
              a = this.b ? 1 : 0;
              static b = 1;
              static a = this.b ? 1 : 0;
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
            class Class {
              b = 1;
              a = this.b ? 1 : 0;
              static b = 1;
              static a = Class.b ? 1 : 0;
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
            class Class {
              b = 1;
              a = someCondition ? this.b : 0;
              static b = 1;
              static a = someCondition ? this.b : 0;
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
            class Class {
              b = 1;
              a = someCondition ? this.b : 0;
              static b = 1;
              static a = someCondition ? Class.b : 0;
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
            class Class {
              b = 1;
              a = someCondition ? 0 : this.b;
              static b = 1;
              static a = someCondition ? 0 : this.b;
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
            class Class {
              b = 1;
              a = someCondition ? 0 : this.b;
              static b = 1;
              static a = someCondition ? 0 : Class.b;
            }
          `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
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
                class Class {
                  b = 1
                  a = this.b as any
                  static b = 1
                  static a = this.b as any
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
                class Class {
                  b = 1
                  a = this.b as any
                  static b = 1
                  static a = Class.b as any
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
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
                class Class {
                  b = 1
                  a = <any>this.b
                  static b = 1
                  static a = <any>this.b
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
                class Class {
                  b = 1
                  a = <any>this.b
                  static b = 1
                  static a = <any>Class.b
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
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
               class Class {
                b = 1
                a = \`\${this.b}\`
                static b = 1
                static a = \`\${this.b}\`
               }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              code: dedent`
               class Class {
                b = 1
                a = \`\${this.b}\`
                static b = 1
                static a = \`\${Class.b}\`
               }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(`${ruleName}(${type}): detects # dependencies`, rule, {
        valid: [
          {
            code: dedent`
              class Class {
               static a = Class.a
               static b = 1
               static #b = 1
               static #a = this.#b
              }
            `,
            options: [
              {
                ...options,
              },
            ],
          },
          {
            code: dedent`
              class Class {
               static #b = () => 1
               static #a = this.#b()
              }
            `,
            options: [
              {
                ...options,
              },
            ],
          },
          {
            code: dedent`
              class Class {
               static #a = this.#b()
               static #b() {}
              }
            `,
            options: [
              {
                ...options,
                groups: ['unknown'],
              },
            ],
          },
        ],
        invalid: [],
      })

      ruleTester.run(
        `${ruleName}(${type}) separates static from non-static dependencies`,
        rule,
        {
          valid: [
            {
              code: dedent`
              export class Class{
                b = 1;
                a = this.b;
                static b = 1;
              }
            `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
          ],
          invalid: [
            {
              code: dedent`
                class Class {
                  static a = Class.c
                  b = this.c
                  static b = this.c
                  c = 10
                  static c = 10
                }
              `,
              output: dedent`
                class Class {
                  static c = 10
                  static a = Class.c
                  c = 10
                  b = this.c
                  static b = this.c
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesDependencyOrder',
                  data: {
                    right: 'c',
                    nodeDependentOnRight: 'b',
                  },
                },
                {
                  messageId: 'unexpectedClassesDependencyOrder',
                  data: {
                    right: 'c',
                    nodeDependentOnRight: 'a',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) detects circular dependencies`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                class Class {
                  b = this.e
                  a
                  e = this.g
                  f
                  g = this.b
                }
              `,
              output: dedent`
                class Class {
                  a
                  g = this.b
                  e = this.g
                  b = this.e
                  f
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesOrder',
                  data: {
                    left: 'b',
                    right: 'a',
                  },
                },
                {
                  messageId: 'unexpectedClassesDependencyOrder',
                  data: {
                    right: 'e',
                    nodeDependentOnRight: 'b',
                  },
                },
                {
                  messageId: 'unexpectedClassesDependencyOrder',
                  data: {
                    right: 'g',
                    nodeDependentOnRight: 'e',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) ignores function body dependencies`,
        rule,
        {
          valid: [
            {
              code: dedent`
                class Class {
                  static a = true;

                  static b() {
                     return this.a || Class.a
                  }

                  static c = () => {
                     return this.a || Class.a
                  }
                }
              `,
              options: [
                {
                  ...options,
                  groups: [['method', 'property']],
                },
              ],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritizes dependencies over group configuration`,
        rule,
        {
          valid: [
            {
              code: dedent`
                class Class {
                  public b = 1;
                  private a = this.b;
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['private-property', 'public-property'],
                },
              ],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritizes dependencies over partitionByComment`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                class Class {
                  b = this.a
                  // Part1
                  a
                }
              `,
              output: dedent`
                class Class {
                  a
                  // Part1
                  b = this.a
                }
              `,
              options: [
                {
                  ...options,
                  partitionByComment: 'Part*',
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesDependencyOrder',
                  data: {
                    right: 'a',
                    nodeDependentOnRight: 'b',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritizes dependencies over partitionByNewLine`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                class Class {
                  b = this.a

                  a
                }
              `,
              output: dedent`
                class Class {
                  a

                  b = this.a
                }
              `,
              options: [
                {
                  ...options,
                  partitionByNewLine: true,
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesDependencyOrder',
                  data: {
                    right: 'a',
                    nodeDependentOnRight: 'b',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): works with left and right dependencies`,
        rule,
        {
          valid: [
            {
              code: dedent`
              class Class {
                left = 'left'
                right = 'right'

                aaa = this.left + this.right
              }
            `,
              options: [options],
            },
          ],
          invalid: [
            {
              code: dedent`
              class Class {
                aaa = this.left + this.right

                left = 'left'

                right = 'right'
              }
            `,
              output: dedent`
              class Class {
                left = 'left'

                right = 'right'

                aaa = this.left + this.right
              }
            `,
              options: [options],
              errors: [
                {
                  messageId: 'unexpectedClassesDependencyOrder',
                  data: {
                    right: 'left',
                    nodeDependentOnRight: 'aaa',
                  },
                },
                {
                  messageId: 'unexpectedClassesDependencyOrder',
                  data: {
                    right: 'right',
                    nodeDependentOnRight: 'aaa',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): should ignore callback dependencies in 'ignoreCallbackDependenciesPatterns'`,
        rule,
        {
          invalid: [],
          valid: [
            {
              code: dedent`
                class Class {
                  a = computed(() => this.c)
                  c
                  b = notComputed(() => this.c)
                }
              `,
              options: [
                {
                  ignoreCallbackDependenciesPatterns: ['^computed$'],
                },
              ],
            },
          ],
        },
      )
    })

    ruleTester.run(`${ruleName}(${type}): should ignore unknown group`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
              class Class {

                public i = 'i';
                private z() {}
                public method3() {}
                private y() {}
                public method4() {}
                public method1() {}
                private x() {}
              }
            `,
          output: dedent`
              class Class {

                private x() {}
                private y() {}
                public method3() {}
                private z() {}
                public method4() {}
                public method1() {}
                public i = 'i';
              }
            `,
          options: [
            {
              ...options,
              groups: ['private-method', 'property'],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'i',
                leftGroup: 'property',
                right: 'z',
                rightGroup: 'private-method',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'z',
                leftGroup: 'private-method',
                right: 'method3',
                rightGroup: 'unknown',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'method3',
                leftGroup: 'unknown',
                right: 'y',
                rightGroup: 'private-method',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'method1',
                leftGroup: 'unknown',
                right: 'x',
                rightGroup: 'private-method',
              },
            },
          ],
        },
        {
          code: dedent`
              class Class {
                b
                someMethod() {
                }
                a
              }
            `,
          output: dedent`
              class Class {
                a
                someMethod() {
                }
                b
              }
            `,
          options: [
            {
              ...options,
              groups: ['property'],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'b',
                leftGroup: 'property',
                right: 'someMethod',
                rightGroup: 'unknown',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'someMethod',
                leftGroup: 'unknown',
                right: 'a',
                rightGroup: 'property',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {
                _a
                b
                _c
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
            code: dedent`
              class Class {
                ab
                a_c
              }
            `,
            options: [
              {
                ...options,
                specialCharacters: 'remove',
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use locale`, rule, {
      valid: [
        {
          code: dedent`
            class Class {
              你好 = '你好'

              世界 = '世界'

              a = 'a'

              A = 'A'

              b = 'b'

              B = 'B'
            }
          `,
          options: [{ ...options, locales: 'zh-CN' }],
        },
      ],
      invalid: [],
    })

    describe(`${ruleName}: newlinesBetween`, () => {
      ruleTester.run(
        `${ruleName}(${type}): removes newlines when never`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                class Class {
                  a = () => null


                 y = "y"
                z = "z"

                    b = "b"
                }
              `,
              output: dedent`
                class Class {
                  a = () => null
                 b = "b"
                y = "y"
                    z = "z"
                }
              `,
              options: [
                {
                  ...options,
                  newlinesBetween: 'never',
                  groups: ['method', 'unknown'],
                },
              ],
              errors: [
                {
                  messageId: 'extraSpacingBetweenClassMembers',
                  data: {
                    left: 'a',
                    right: 'y',
                  },
                },
                {
                  messageId: 'unexpectedClassesOrder',
                  data: {
                    left: 'z',
                    right: 'b',
                  },
                },
                {
                  messageId: 'extraSpacingBetweenClassMembers',
                  data: {
                    left: 'z',
                    right: 'b',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): keeps one newline when always`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                class Class {
                  a = () => null


                 z = "z"
                y = "y"
                    b() {}
                }
              `,
              output: dedent`
                class Class {
                  a = () => null

                 y = "y"
                z = "z"

                    b() {}
                }
                `,
              options: [
                {
                  ...options,
                  newlinesBetween: 'always',
                  groups: ['function-property', 'unknown', 'method'],
                },
              ],
              errors: [
                {
                  messageId: 'extraSpacingBetweenClassMembers',
                  data: {
                    left: 'a',
                    right: 'z',
                  },
                },
                {
                  messageId: 'unexpectedClassesOrder',
                  data: {
                    left: 'z',
                    right: 'y',
                  },
                },
                {
                  messageId: 'missedSpacingBetweenClassMembers',
                  data: {
                    left: 'y',
                    right: 'b',
                  },
                },
              ],
            },
          ],
        },
      )
    })

    describe(`${ruleName}(${type}): sorts inline elements correctly`, () => {
      describe(`${ruleName}(${type}): methods`, () => {
        describe(`${ruleName}(${type}): non-abstract methods`, () => {
          ruleTester.run(
            `${ruleName}(${type}): sorts inline non-abstract methods correctly`,
            rule,
            {
              valid: [],
              invalid: [
                {
                  code: dedent`
                  class Class {
                    b(){} a(){}
                  }
                `,
                  output: dedent`
                  class Class {
                    a(){} b(){}
                  }
                `,
                  options: [options],
                  errors: [
                    {
                      messageId: 'unexpectedClassesOrder',
                      data: {
                        left: 'b',
                        right: 'a',
                      },
                    },
                  ],
                },
                {
                  code: dedent`
                  class Class {
                    b(){} a(){};
                  }
                `,
                  output: dedent`
                  class Class {
                    a(){} b(){};
                  }
                `,
                  options: [options],
                  errors: [
                    {
                      messageId: 'unexpectedClassesOrder',
                      data: {
                        left: 'b',
                        right: 'a',
                      },
                    },
                  ],
                },
                {
                  code: dedent`
                  class Class {
                    b(){}; a(){}
                  }
                `,
                  output: dedent`
                  class Class {
                    a(){}; b(){}
                  }
                `,
                  options: [options],
                  errors: [
                    {
                      messageId: 'unexpectedClassesOrder',
                      data: {
                        left: 'b',
                        right: 'a',
                      },
                    },
                  ],
                },
              ],
            },
          )
        })

        describe(`${ruleName}(${type}): abstract methods`, () => {
          ruleTester.run(
            `${ruleName}(${type}): sorts inline abstract methods correctly`,
            rule,
            {
              valid: [],
              invalid: [
                {
                  code: dedent`
                  abstract class Class {
                    abstract b(); abstract a()
                  }
                `,
                  output: dedent`
                  abstract class Class {
                    abstract a(); abstract b();
                  }
                `,
                  options: [options],
                  errors: [
                    {
                      messageId: 'unexpectedClassesOrder',
                      data: {
                        left: 'b',
                        right: 'a',
                      },
                    },
                  ],
                },
                {
                  code: dedent`
                  abstract class Class {
                    abstract b(); abstract a();
                  }
                `,
                  output: dedent`
                  abstract class Class {
                    abstract a(); abstract b();
                  }
                `,
                  options: [options],
                  errors: [
                    {
                      messageId: 'unexpectedClassesOrder',
                      data: {
                        left: 'b',
                        right: 'a',
                      },
                    },
                  ],
                },
              ],
            },
          )
        })
      })

      ruleTester.run(
        `${ruleName}(${type}): sorts inline properties correctly`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                  class Class {
                    b; a
                  }
                `,
              output: dedent`
                  class Class {
                    a; b;
                  }
                `,
              options: [options],
              errors: [
                {
                  messageId: 'unexpectedClassesOrder',
                  data: {
                    left: 'b',
                    right: 'a',
                  },
                },
              ],
            },
            {
              code: dedent`
                  class Class {
                    b; a;
                  }
                `,
              output: dedent`
                  class Class {
                    a; b;
                  }
                `,
              options: [options],
              errors: [
                {
                  messageId: 'unexpectedClassesOrder',
                  data: {
                    left: 'b',
                    right: 'a',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): sorts inline accessors correctly`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                  class Class {
                    accessor b; accessor a
                  }
                `,
              output: dedent`
                  class Class {
                    accessor a; accessor b;
                  }
                `,
              options: [options],
              errors: [
                {
                  messageId: 'unexpectedClassesOrder',
                  data: {
                    left: 'b',
                    right: 'a',
                  },
                },
              ],
            },
            {
              code: dedent`
                  class Class {
                    accessor b; accessor a;
                  }
                `,
              output: dedent`
                  class Class {
                    accessor a; accessor b;
                  }
                `,
              options: [options],
              errors: [
                {
                  messageId: 'unexpectedClassesOrder',
                  data: {
                    left: 'b',
                    right: 'a',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): sorts inline index-signatures correctly`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                  class Class {
                    [key: string]: string; [key: number]: string
                  }
                `,
              output: dedent`
                  class Class {
                    [key: number]: string; [key: string]: string;
                  }
                `,
              options: [options],
              errors: [
                {
                  messageId: 'unexpectedClassesOrder',
                  data: {
                    left: '[key: string]',
                    right: '[key: number]',
                  },
                },
              ],
            },
            {
              code: dedent`
                  class Class {
                    [key: string]: string; [key: number]: string;
                  }
                `,
              output: dedent`
                  class Class {
                    [key: number]: string; [key: string]: string;
                  }
                `,
              options: [options],
              errors: [
                {
                  messageId: 'unexpectedClassesOrder',
                  data: {
                    left: '[key: string]',
                    right: '[key: number]',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): sorts inline static-block correctly`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                  class Class {
                    a; static {}
                  }
                `,
              output: dedent`
                  class Class {
                    static {} a;
                  }
                `,
              options: [options],
              errors: [
                {
                  messageId: 'unexpectedClassesGroupOrder',
                  data: {
                    left: 'a',
                    leftGroup: 'property',
                    right: 'static',
                    rightGroup: 'static-block',
                  },
                },
              ],
            },
          ],
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

    ruleTester.run(`${ruleName}(${type}): sorts class members`, rule, {
      valid: [
        {
          code: dedent`
            class Class {
              static a = 'a'

              protected b = 'b'

              private c = 'c'

              d = 'd'

              e = 'e'

              constructor() {}

              static f() {}

              protected g() {}

              private h() {}

              i() {}

              j() {}
            }
          `,
          options: [
            {
              ...options,
              groups: [
                'static-property',
                'protected-property',
                'private-property',
                'property',
                'constructor',
                'static-method',
                'protected-method',
                'private-method',
                'method',
                'unknown',
              ],
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            class Class {
              static a = 'a'

              protected b = 'b'

              private c = 'c'

              e = 'e'

              d = 'd'

              static f() {}

              constructor() {}

              protected g() {}

              private h() {}

              i() {}

              j() {}
            }
          `,
          output: dedent`
            class Class {
              static a = 'a'

              protected b = 'b'

              private c = 'c'

              d = 'd'

              e = 'e'

              constructor() {}

              static f() {}

              protected g() {}

              private h() {}

              i() {}

              j() {}
            }
          `,
          options: [
            {
              ...options,
              groups: [
                'static-property',
                'protected-property',
                'private-property',
                'property',
                'constructor',
                'static-method',
                'protected-method',
                'private-method',
                'method',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'e',
                right: 'd',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'f',
                leftGroup: 'static-method',
                right: 'constructor',
                rightGroup: 'constructor',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts class and group members`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {
                static a

                static b = 'b'

                [key in O]

                static {
                  this.a = 'd'
                }
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                  ['static-method', 'private-method', 'method'],
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              class Class {
                [key in O]

                static b = 'b'

                static a

                static {
                  this.a = 'd'
                }
              }
            `,
            output: dedent`
              class Class {
                static a

                static b = 'b'

                [key in O]

                static {
                  this.a = 'd'
                }
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                  ['static-method', 'private-method', 'method'],
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'key in O',
                  right: 'b',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts class with ts index signatures`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {
                static a = 'a';

                [k: string]: any;

                [k: string];
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              class Class {
                [k: string]: any;

                [k: string];

                static a = 'a';
              }
            `,
            output: dedent`
              class Class {
                static a = 'a';

                [k: string]: any;

                [k: string];
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'index-signature',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: '[k: string];',
                  leftGroup: 'index-signature',
                  right: 'a',
                  rightGroup: 'static-property',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts class with ts index signatures`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Decorations {
                setBackground(color: number, hexFlag: boolean): this
                setBackground(color: Color | string | CSSColor): this
                setBackground(r: number, g: number, b: number, a?: number): this
                setBackground(color: ColorArgument, arg1?: boolean | number, arg2?: number, arg3?: number): this {
                    /* ... */
                }
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts private methods with hash`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class MyUnsortedClass {
                someOtherProperty

                someProperty = 1

                constructor() {}

                static #aPrivateStaticMethod () {}

                #somePrivateProperty

                #someOtherPrivateProperty = 2

                static someStaticProperty = 3

                static #someStaticPrivateProperty = 4

                aInstanceMethod () {}

                static aStaticMethod () {}

                #aPrivateInstanceMethod () {}
              }
            `,
            output: dedent`
              class MyUnsortedClass {
                static #someStaticPrivateProperty = 4

                static someStaticProperty = 3

                #someOtherPrivateProperty = 2

                #somePrivateProperty

                someOtherProperty

                someProperty = 1

                constructor() {}

                aInstanceMethod () {}

                #aPrivateInstanceMethod () {}

                static #aPrivateStaticMethod () {}

                static aStaticMethod () {}
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  'static-property',
                  'private-property',
                  'property',
                  'constructor',
                  'method',
                  'private-method',
                  'static-method',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: '#aPrivateStaticMethod',
                  leftGroup: 'static-method',
                  right: '#somePrivateProperty',
                  rightGroup: 'private-property',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: '#somePrivateProperty',
                  right: '#someOtherPrivateProperty',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: '#someOtherPrivateProperty',
                  leftGroup: 'private-property',
                  right: 'someStaticProperty',
                  rightGroup: 'static-property',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'someStaticProperty',
                  right: '#someStaticPrivateProperty',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'aStaticMethod',
                  leftGroup: 'static-method',
                  right: '#aPrivateInstanceMethod',
                  rightGroup: 'private-method',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows split methods with getters and setters`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class A {
                x() {}
                b() {}
                get z() {}
                get c() {}
                set c() {}
              }
            `,
            output: dedent`
              class A {
                b() {}
                x() {}
                get c() {}
                set c() {}
                get z() {}
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  'index-signature',
                  'static-property',
                  'private-property',
                  'property',
                  'constructor',
                  'static-method',
                  'private-method',
                  'method',
                  ['get-method', 'set-method'],
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'x',
                  right: 'b',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'z',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts decorated properties`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            class User {
              firstName: string

              id: number

              @Index({ name: 'born_index' })
              @Property()
              born: string

              @Property()
              @Unique()
              email: string

              lastName: string
            }`,
          output: dedent`
            class User {
              firstName: string

              id: number

              lastName: string

              @Index({ name: 'born_index' })
              @Property()
              born: string

              @Property()
              @Unique()
              email: string
            }`,
          options: [
            {
              ...options,
              groups: ['property', 'decorated-property', 'unknown'],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'email',
                leftGroup: 'decorated-property',
                right: 'lastName',
                rightGroup: 'property',
              },
            },
          ],
        },
        {
          code: dedent`
            class MyElement {
              @property({ attribute: false })
              data = {}

              @property()
              greeting: string = 'Hello'

              @property()
              protected type = ''

              @state()
              private _counter = 0

              private _message = ''

              private _prop = 0

              constructor() {}

              @property()
              get message(): string {
                return this._message
              }

              set message(message: string) {
                this._message = message
              }

              @property()
              set prop(val: number) {
                this._prop = Math.floor(val)
              }

              get prop() {
                return this._prop
              }

              render() {}
            }`,
          output: dedent`
            class MyElement {
              @property({ attribute: false })
              data = {}

              @property()
              greeting: string = 'Hello'

              @property()
              protected type = ''

              @state()
              private _counter = 0

              private _message = ''

              private _prop = 0

              constructor() {}

              @property()
              get message(): string {
                return this._message
              }

              @property()
              set prop(val: number) {
                this._prop = Math.floor(val)
              }

              set message(message: string) {
                this._message = message
              }

              get prop() {
                return this._prop
              }

              render() {}
            }`,
          options: [
            {
              ...options,
              groups: [
                'decorated-property',
                'property',
                'protected-decorated-property',
                'private-decorated-property',
                'private-property',
                'constructor',
                ['decorated-get-method', 'decorated-set-method'],
                ['get-method', 'set-method'],
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'message',
                leftGroup: 'set-method',
                right: 'prop',
                rightGroup: 'decorated-set-method',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts decorated accessors`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            class Todo {
              id = Math.random()

              constructor() {}

              @action
              toggle() {}

              @observable
              accessor #active = false

              @observable
              accessor finished = false

              @observable
              accessor title = ''

              @observable
              protected accessor type = ''
            }`,
          output: dedent`
            class Todo {
              @observable
              accessor finished = false

              @observable
              accessor title = ''

              @observable
              protected accessor type = ''

              @observable
              accessor #active = false

              id = Math.random()

              constructor() {}

              @action
              toggle() {}
            }`,
          options: [
            {
              ...options,
              groups: [
                'decorated-accessor-property',
                'protected-decorated-accessor-property',
                'private-decorated-accessor-property',
                'property',
                'constructor',
                'decorated-method',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'toggle',
                leftGroup: 'decorated-method',
                right: '#active',
                rightGroup: 'private-decorated-accessor-property',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: '#active',
                leftGroup: 'private-decorated-accessor-property',
                right: 'finished',
                rightGroup: 'decorated-accessor-property',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts decorated accessors`, rule, {
      valid: [
        {
          code: dedent`
            class Class {
              // Region: Table
              protected onChangeColumns() {}

              protected onPaginationChanged() {}

              protected onSortChanged() {}

              protected updateTable() {}

              // Region: Form
              protected clearForm() {}

              protected disableForm() {}

              // Regular Comment
              protected onValueChanged() {}

              protected setFormValue() {}
            }
          `,
          options: [
            {
              ...options,
              partitionByComment: 'Region:*',
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            class Class {
              // Region: Table
              protected onChangeColumns() {}

              protected updateTable() {}

              protected onSortChanged() {}

              protected onPaginationChanged() {}

              // Region: Form
              protected clearForm() {}

              protected disableForm() {}

              protected setFormValue() {}

              // Regular Comment
              protected onValueChanged() {}
            }
          `,
          output: dedent`
            class Class {
              // Region: Table
              protected onChangeColumns() {}

              protected onPaginationChanged() {}

              protected onSortChanged() {}

              protected updateTable() {}

              // Region: Form
              protected clearForm() {}

              protected disableForm() {}

              // Regular Comment
              protected onValueChanged() {}

              protected setFormValue() {}
            }
          `,
          options: [
            {
              ...options,
              partitionByComment: 'Region:*',
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'updateTable',
                right: 'onSortChanged',
              },
            },
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'onSortChanged',
                right: 'onPaginationChanged',
              },
            },
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'setFormValue',
                right: 'onValueChanged',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): does not sort properties if the right value depends on the left value`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {
                b = 'b'

                aaa = [this.b]
              }
            `,
            options: [options],
          },
          {
            code: dedent`
              class Class {
                b = 'b'

                getAaa() {
                  return this.b;
                }
              }
            `,
            options: [options],
          },
          {
            code: dedent`
              class Class {
                static c = 'c'

                b = Example.c
              }
            `,
            options: [options],
          },
          {
            code: dedent`
              class Class {
                #b = 'b'

                getAaa() {
                  return this.#b;
                }
              }
            `,
            options: [options],
          },
          {
            code: dedent`
              class Class {
                static b = 'b'

                static getAaa() {
                  return this.b;
                }
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              class Class {
                aaa = [this.b]

                b = 'b'
              }
            `,
            output: dedent`
              class Class {
                b = 'b'

                aaa = [this.b]
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedClassesDependencyOrder',
                data: {
                  right: 'b',
                  nodeDependentOnRight: 'aaa',
                },
              },
            ],
          },
          {
            code: dedent`
              class Class {
                getAaa() {
                  return this.b;
                }

                b = 'b'
              }
            `,
            output: dedent`
              class Class {
                b = 'b'

                getAaa() {
                  return this.b;
                }
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'getAaa',
                  leftGroup: 'method',
                  right: 'b',
                  rightGroup: 'property',
                },
              },
            ],
          },
          {
            code: dedent`
              class Class {
                b = Example.c

                static c = 'c'
              }
            `,
            output: dedent`
              class Class {
                static c = 'c'

                b = Example.c
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'b',
                  leftGroup: 'property',
                  right: 'c',
                  rightGroup: 'static-property',
                },
              },
            ],
          },
          {
            code: dedent`
              class Class {
                getAaa() {
                  return this.#b;
                }

                #b = 'b'
              }
            `,
            output: dedent`
              class Class {
                #b = 'b'

                getAaa() {
                  return this.#b;
                }
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'getAaa',
                  leftGroup: 'method',
                  right: '#b',
                  rightGroup: 'private-property',
                },
              },
            ],
          },
          {
            code: dedent`
              class Class {
                static getAaa() {
                  return this.b;
                }

                static b = 'b'
              }
            `,
            output: dedent`
              class Class {
                static b = 'b'

                static getAaa() {
                  return this.b;
                }
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'getAaa',
                  leftGroup: 'static-method',
                  right: 'b',
                  rightGroup: 'static-property',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with left and right dependencies`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {
                left = 'left'
                right = 'right'

                aaa = this.left + this.right
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              class Class {
                aaa = this.left + this.right

                left = 'left'

                right = 'right'
              }
            `,
            output: dedent`
              class Class {
                left = 'left'

                right = 'right'

                aaa = this.left + this.right
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedClassesDependencyOrder',
                data: {
                  right: 'left',
                  nodeDependentOnRight: 'aaa',
                },
              },
              {
                messageId: 'unexpectedClassesDependencyOrder',
                data: {
                  right: 'right',
                  nodeDependentOnRight: 'aaa',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): should ignore unknown group`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
              class Class {

                public i = 'i';
                private z() {}
                public method3() {}
                private y() {}
                public method4() {}
                public method1() {}
                private x() {}
              }
            `,
          output: dedent`
              class Class {

                private x() {}
                private y() {}
                public method3() {}
                private z() {}
                public method4() {}
                public method1() {}
                public i = 'i';
              }
            `,
          options: [
            {
              ...options,
              groups: ['private-method', 'property'],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'i',
                leftGroup: 'property',
                right: 'z',
                rightGroup: 'private-method',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'z',
                leftGroup: 'private-method',
                right: 'method3',
                rightGroup: 'unknown',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'method3',
                leftGroup: 'unknown',
                right: 'y',
                rightGroup: 'private-method',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'method1',
                leftGroup: 'unknown',
                right: 'x',
                rightGroup: 'private-method',
              },
            },
          ],
        },
        {
          code: dedent`
              class Class {
                b
                someMethod() {
                }
                a
              }
            `,
          output: dedent`
              class Class {
                a
                someMethod() {
                }
                b
              }
            `,
          options: [
            {
              ...options,
              groups: ['property'],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'b',
                leftGroup: 'property',
                right: 'someMethod',
                rightGroup: 'unknown',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'someMethod',
                leftGroup: 'unknown',
                right: 'a',
                rightGroup: 'property',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${ruleName}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts class members`, rule, {
      valid: [
        {
          code: dedent`
            class Class {
              static a = 'a'

              private b = 'b'

              c = 'c'

              d = 'd'

              constructor() {}

              static e() {}

              private f() {}

              g() {}

              h() {}
            }
          `,
          options: [
            {
              ...options,
              groups: [
                'static-property',
                'private-property',
                'property',
                'constructor',
                'static-method',
                'private-method',
                'method',
                'unknown',
              ],
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            class Class {
              static a = 'a'

              private b = 'b'

              d = 'd'

              c = 'c'

              static e() {}

              constructor() {}

              private f() {}

              g() {}

              h() {}
            }
          `,
          output: dedent`
            class Class {
              static a = 'a'

              private b = 'b'

              d = 'd'

              c = 'c'

              constructor() {}

              static e() {}

              private f() {}

              g() {}

              h() {}
            }
          `,
          options: [
            {
              ...options,
              groups: [
                'static-property',
                'private-property',
                'property',
                'constructor',
                'static-method',
                'private-method',
                'method',
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'e',
                leftGroup: 'static-method',
                right: 'constructor',
                rightGroup: 'constructor',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts class and group members`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {
                static b = 'b'

                [key in O]

                static a

                static {
                  this.a = 'd'
                }
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                  ['static-method', 'private-method', 'method'],
                  'unknown',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              class Class {
                [key in O]

                static b = 'b'

                static a

                static {
                  this.a = 'd'
                }
              }
            `,
            output: dedent`
              class Class {
                static b = 'b'

                [key in O]

                static a

                static {
                  this.a = 'd'
                }
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                  ['static-method', 'private-method', 'method'],
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'key in O',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts class with ts index signatures`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {
                static a = 'a';

                [k: string]: any;

                [k: string];
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              class Class {
                [k: string]: any;

                [k: string];

                static a = 'a';
              }
            `,
            output: dedent`
              class Class {
                static a = 'a';

                [k: string]: any;

                [k: string];
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'index-signature',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: '[k: string];',
                  leftGroup: 'index-signature',
                  right: 'a',
                  rightGroup: 'static-property',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts class with ts index signatures`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Decorations {
                setBackground(color: number, hexFlag: boolean): this
                setBackground(color: Color | string | CSSColor): this
                setBackground(r: number, g: number, b: number, a?: number): this
                setBackground(color: ColorArgument, arg1?: boolean | number, arg2?: number, arg3?: number): this {
                    /* ... */
                }
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                ],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              class Decorations {

                setBackground(r: number, g: number, b: number, a?: number): this
                setBackground(color: number, hexFlag: boolean): this
                setBackground(color: Color | string | CSSColor): this
                setBackground(color: ColorArgument, arg1?: boolean | number, arg2?: number, arg3?: number): this {
                  /* ... */
                }

                static setBackground(r: number, g: number, b: number, a?: number): this
                static setBackground(color: number, hexFlag: boolean): this
                static setBackground(color: Color | string | CSSColor): this
                static setBackground(color: ColorArgument, arg1?: boolean | number, arg2?: number, arg3?: number): this {
                  /* ... */
                }

                a
              }
            `,
            output: dedent`
              class Decorations {

                a
                static setBackground(r: number, g: number, b: number, a?: number): this
                static setBackground(color: number, hexFlag: boolean): this
                static setBackground(color: Color | string | CSSColor): this

                static setBackground(color: ColorArgument, arg1?: boolean | number, arg2?: number, arg3?: number): this {
                  /* ... */
                }
                setBackground(r: number, g: number, b: number, a?: number): this
                setBackground(color: number, hexFlag: boolean): this
                setBackground(color: Color | string | CSSColor): this

                setBackground(color: ColorArgument, arg1?: boolean | number, arg2?: number, arg3?: number): this {
                  /* ... */
                }
              }
            `,
            options: [
              {
                ...options,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'setBackground',
                  leftGroup: 'method',
                  right: 'setBackground',
                  rightGroup: 'static-method',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'setBackground',
                  leftGroup: 'static-method',
                  right: 'a',
                  rightGroup: 'property',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts private methods with hash`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class MyUnsortedClass {
                someOtherProperty

                someProperty = 1

                constructor() {}

                static #aPrivateStaticMethod () {}

                #somePrivateProperty

                #someOtherPrivateProperty = 2

                static someStaticProperty = 3

                static #someStaticPrivateProperty = 4

                aInstanceMethod () {}

                static aStaticMethod () {}

                #aPrivateInstanceMethod () {}
              }
            `,
            output: dedent`
              class MyUnsortedClass {
                static #someStaticPrivateProperty = 4

                static someStaticProperty = 3

                #someOtherPrivateProperty = 2

                #somePrivateProperty

                someOtherProperty

                someProperty = 1

                constructor() {}

                aInstanceMethod () {}

                #aPrivateInstanceMethod () {}

                static #aPrivateStaticMethod () {}

                static aStaticMethod () {}
              }
            `,
            options: [
              {
                ...options,
                groups: [
                  'static-property',
                  'private-property',
                  'property',
                  'constructor',
                  'method',
                  'private-method',
                  'static-method',
                  'unknown',
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: '#aPrivateStaticMethod',
                  leftGroup: 'static-method',
                  right: '#somePrivateProperty',
                  rightGroup: 'private-property',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: '#somePrivateProperty',
                  right: '#someOtherPrivateProperty',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: '#someOtherPrivateProperty',
                  leftGroup: 'private-property',
                  right: 'someStaticProperty',
                  rightGroup: 'static-property',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'someStaticProperty',
                  right: '#someStaticPrivateProperty',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'aStaticMethod',
                  leftGroup: 'static-method',
                  right: '#aPrivateInstanceMethod',
                  rightGroup: 'private-method',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts decorated properties`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            class User {
              firstName: string

              id: number

              @Index({ name: 'born_index' })
              @Property()
              born: string

              @Property()
              @Unique()
              email: string

              lastName: string
            }`,
          output: dedent`
            class User {
              firstName: string

              lastName: string

              id: number

              @Index({ name: 'born_index' })
              @Property()
              born: string

              @Property()
              @Unique()
              email: string
            }`,
          options: [
            {
              ...options,
              groups: ['property', 'decorated-property', 'unknown'],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'email',
                leftGroup: 'decorated-property',
                right: 'lastName',
                rightGroup: 'property',
              },
            },
          ],
        },
        {
          code: dedent`
            class MyElement {
              @property({ attribute: false })
              data = {}

              @property()
              greeting: string = 'Hello'

              @property()
              protected type = ''

              @state()
              private _counter = 0

              private _message = ''

              private _prop = 0

              constructor() {}

              @property()
              get message(): string {
                return this._message
              }

              set message(message: string) {
                this._message = message
              }

              @property()
              set prop(val: number) {
                this._prop = Math.floor(val)
              }

              get prop() {
                return this._prop
              }

              render() {}
            }`,
          output: dedent`
            class MyElement {
              @property({ attribute: false })
              data = {}

              @property()
              greeting: string = 'Hello'

              @property()
              protected type = ''

              @state()
              private _counter = 0

              private _message = ''

              private _prop = 0

              constructor() {}

              @property()
              set prop(val: number) {
                this._prop = Math.floor(val)
              }

              @property()
              get message(): string {
                return this._message
              }

              set message(message: string) {
                this._message = message
              }

              get prop() {
                return this._prop
              }

              render() {}
            }`,
          options: [
            {
              ...options,
              groups: [
                'decorated-property',
                'property',
                'private-decorated-property',
                'private-property',
                'constructor',
                ['decorated-get-method', 'decorated-set-method'],
                ['get-method', 'set-method'],
                'unknown',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'message',
                leftGroup: 'set-method',
                right: 'prop',
                rightGroup: 'decorated-set-method',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts decorated accessors`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            class Todo {
              @observable
              customLastGroupProperty = 1

              id = Math.random()

              constructor() {}

              @observable
              customFirstGroupProperty = 1

              @action
              toggle() {}

              @observable
              accessor #active = false

              @observable
              accessor finished = false

              @observable
              accessor title = ''

              @observable
              protected accessor type = ''

            }`,
          output: dedent`
            class Todo {
              @observable
              customFirstGroupProperty = 1

              @observable
              accessor finished = false

              @observable
              accessor title = ''

              @observable
              protected accessor type = ''

              @observable
              accessor #active = false

              id = Math.random()

              constructor() {}

              @action
              toggle() {}

              @observable
              customLastGroupProperty = 1

            }`,
          options: [
            {
              ...options,
              customGroups: [
                {
                  groupName: 'my-first-group',
                  elementNamePattern: 'customFirst*',
                },
                {
                  groupName: 'my-last-group',
                  elementNamePattern: 'customLast*',
                },
              ],
              groups: [
                'my-first-group',
                'decorated-accessor-property',
                'protected-decorated-accessor-property',
                'private-decorated-accessor-property',
                'property',
                'constructor',
                'decorated-method',
                'unknown',
                'my-last-group',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'customLastGroupProperty',
                leftGroup: 'my-last-group',
                right: 'id',
                rightGroup: 'property',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'constructor',
                leftGroup: 'constructor',
                right: 'customFirstGroupProperty',
                rightGroup: 'my-first-group',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'toggle',
                leftGroup: 'decorated-method',
                right: '#active',
                rightGroup: 'private-decorated-accessor-property',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: '#active',
                leftGroup: 'private-decorated-accessor-property',
                right: 'finished',
                rightGroup: 'decorated-accessor-property',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): should ignore unknown group`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
              class Class {

                public i = 'i';
                private z() {}
                public method3() {}
                private y() {}
                public method4() {}
                public method1() {}
                private x() {}
              }
            `,
          output: dedent`
              class Class {

                private z() {}
                private y() {}
                public method3() {}
                private x() {}
                public method4() {}
                public method1() {}
                public i = 'i';
              }
            `,
          options: [
            {
              ...options,
              groups: ['private-method', 'property'],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'i',
                leftGroup: 'property',
                right: 'z',
                rightGroup: 'private-method',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'method3',
                leftGroup: 'unknown',
                right: 'y',
                rightGroup: 'private-method',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'method1',
                leftGroup: 'unknown',
                right: 'x',
                rightGroup: 'private-method',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${ruleName}: custom groups`, () => {
    ruleTester.run(`${ruleName}: filters on selector and modifiers`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
              class Class {
                private a;
                private b;
                c;
                constructor() {}
              }
            `,
          output: dedent`
            class Class {
              c;
              constructor() {}
              private a;
              private b;
            }
            `,
          options: [
            {
              groups: ['propertyGroup', 'constructor', 'privatePropertyGroup'],
              customGroups: [
                {
                  groupName: 'unusedCustomGroup',
                  selector: 'property',
                  modifiers: ['private'],
                },
                {
                  groupName: 'privatePropertyGroup',
                  selector: 'property',
                  modifiers: ['private'],
                },
                {
                  groupName: 'propertyGroup',
                  selector: 'property',
                },
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'b',
                leftGroup: 'privatePropertyGroup',
                right: 'c',
                rightGroup: 'propertyGroup',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: filters on elementNamePattern`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
              class Class {
                a;

                b;

                constructor() {}

                method() {}

                helloProperty;
              }
            `,
          output: dedent`
              class Class {
                helloProperty;

                constructor() {}

                a;

                b;

                method() {}
              }
            `,
          options: [
            {
              groups: ['propertiesStartingWithHello', 'constructor', 'unknown'],
              customGroups: [
                {
                  groupName: 'propertiesStartingWithHello',
                  selector: 'property',
                  elementNamePattern: 'hello*',
                },
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'b',
                leftGroup: 'unknown',
                right: 'constructor',
                rightGroup: 'constructor',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'method',
                leftGroup: 'unknown',
                right: 'helloProperty',
                rightGroup: 'propertiesStartingWithHello',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: filters on elementValuePattern`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
              class Class {
                a = computed(A)
                b = inject(B)
                y = inject(Y)
                z = computed(Z)
                c() {}
              }
            `,
          output: dedent`
              class Class {
                a = computed(A)
                z = computed(Z)
                b = inject(B)
                y = inject(Y)
                c() {}
              }
            `,
          options: [
            {
              groups: ['computed', 'inject', 'unknown'],
              customGroups: [
                {
                  groupName: 'inject',
                  elementValuePattern: 'inject*',
                },
                {
                  groupName: 'computed',
                  elementValuePattern: 'computed*',
                },
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'y',
                leftGroup: 'inject',
                right: 'z',
                rightGroup: 'computed',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: filters on decoratorNamePattern`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
              class Class {
                @Decorator
                a;

                b;

                constructor() {}

                method() {}

                @HelloDecorator
                property;

                @HelloDecorator()
                anotherProperty;
              }
            `,
          output: dedent`
            class Class {
              @HelloDecorator()
              anotherProperty;

              @HelloDecorator
              property;

              constructor() {}

              @Decorator
              a;

              b;

              method() {}
            }
            `,
          options: [
            {
              groups: [
                'propertiesWithDecoratorStartingWithHello',
                'constructor',
                'unknown',
              ],
              customGroups: [
                {
                  groupName: 'propertiesWithDecoratorStartingWithHello',
                  selector: 'property',
                  decoratorNamePattern: 'Hello*',
                },
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'b',
                leftGroup: 'unknown',
                right: 'constructor',
                rightGroup: 'constructor',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'method',
                leftGroup: 'unknown',
                right: 'property',
                rightGroup: 'propertiesWithDecoratorStartingWithHello',
              },
            },
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'property',
                right: 'anotherProperty',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}: sort custom groups by overriding 'type' and 'order'`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
            class Class {

              a;

              bb;

              ccc;

              dddd;

              method() {}

              eee;

              ff;

              g;

              constructor() {}

              anotherMethod() {}

              yetAnotherMethod() {}
            }
            `,
            output: dedent`
            class Class {

              dddd;

              ccc;

              eee;

              bb;

              ff;

              a;

              g;

              constructor() {}

              anotherMethod() {}

              method() {}

              yetAnotherMethod() {}
            }
            `,
            options: [
              {
                type: 'alphabetical',
                order: 'asc',
                groups: [
                  'reversedPropertiesByLineLength',
                  'constructor',
                  'unknown',
                ],
                customGroups: [
                  {
                    groupName: 'reversedPropertiesByLineLength',
                    selector: 'property',
                    type: 'line-length',
                    order: 'desc',
                  },
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'a',
                  right: 'bb',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'bb',
                  right: 'ccc',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'ccc',
                  right: 'dddd',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'method',
                  leftGroup: 'unknown',
                  right: 'eee',
                  rightGroup: 'reversedPropertiesByLineLength',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}: does not sort custom groups with 'unsorted' type`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
            class Class {
              b;

              a;

              constructor() {}

              d

              e

              method() {}

              c
            }
            `,
            output: dedent`
            class Class {
              b;

              a;

              d

              e

              c

              constructor() {}

              method() {}
            }
            `,
            options: [
              {
                groups: ['unsortedProperties', 'constructor', 'unknown'],
                customGroups: [
                  {
                    groupName: 'unsortedProperties',
                    selector: 'property',
                    type: 'unsorted',
                  },
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'constructor',
                  leftGroup: 'constructor',
                  right: 'd',
                  rightGroup: 'unsortedProperties',
                },
              },
              {
                messageId: 'unexpectedClassesGroupOrder',
                data: {
                  left: 'method',
                  leftGroup: 'unknown',
                  right: 'c',
                  rightGroup: 'unsortedProperties',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}: sort custom group blocks`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            class Class {
              constructor() {}

              protected a;

              private b;

              @Decorator
              protected e;

              method() {}

              private c;

              protected protectedMethod() {}

              protected d;

              protected anotherProtectedMethod() {}
            }
            `,
          output: dedent`
            class Class {
              protected anotherProtectedMethod() {}

              private b;

              private c;

              @Decorator
              protected e;

              protected protectedMethod() {}

              constructor() {}

              protected a;

              protected d;

              method() {}
            }
            `,
          options: [
            {
              groups: [
                [
                  'privatePropertiesAndProtectedMethods',
                  'decorated-protected-property',
                ],
                'constructor',
                'unknown',
              ],
              customGroups: [
                {
                  groupName: 'privatePropertiesAndProtectedMethods',
                  anyOf: [
                    {
                      selector: 'property',
                      modifiers: ['private'],
                    },
                    {
                      selector: 'method',
                      modifiers: ['protected'],
                    },
                  ],
                },
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'a',
                leftGroup: 'unknown',
                right: 'b',
                rightGroup: 'privatePropertiesAndProtectedMethods',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'method',
                leftGroup: 'unknown',
                right: 'c',
                rightGroup: 'privatePropertiesAndProtectedMethods',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'd',
                leftGroup: 'unknown',
                right: 'anotherProtectedMethod',
                rightGroup: 'privatePropertiesAndProtectedMethods',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}: allows to use regex for element names in custom groups`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {
                iHaveFooInMyName: string
                meTooIHaveFoo: string
                a: string
                b: string
              }
            `,
            options: [
              {
                type: 'alphabetical',
                groups: ['unknown', 'elementsWithoutFoo'],
                customGroups: [
                  {
                    groupName: 'elementsWithoutFoo',
                    elementNamePattern: '^(?!.*Foo).*$',
                  },
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}: allows to use regex for element values in custom groups`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {
                x = "iHaveFooInMyName"
                z = "MeTooIHaveFoo"
                a = "a"
                b = "b"
              }
            `,
            options: [
              {
                type: 'alphabetical',
                groups: ['unknown', 'elementsWithoutFoo'],
                customGroups: [
                  {
                    groupName: 'elementsWithoutFoo',
                    elementValuePattern: '^(?!.*Foo).*$',
                  },
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}: allows to use regex for decorator names in custom groups`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Class {
                @IHaveFooInMyName
                x: string
                @MeTooIHaveFoo
                y: string
                a: string
                b: string
              }
            `,
            options: [
              {
                type: 'alphabetical',
                groups: ['decoratorsWithFoo', 'unknown'],
                customGroups: [
                  {
                    groupName: 'decoratorsWithFoo',
                    decoratorNamePattern: '^.*Foo.*$',
                  },
                ],
              },
            ],
          },
        ],
        invalid: [],
      },
    )
  })

  describe(`${ruleName}: misc`, () => {
    ruleTester.run(
      `${ruleName}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          {
            code: dedent`
              class Calculator {
                static log(x) {
                  return 0;
                }

                static log10(x) {
                  return 0;
                }

                static log1p(x) {
                  return 0;
                }

                static log2(x) {
                  return 0;
                }
              }
            `,
            options: [{}],
          },
        ],
        invalid: [
          {
            code: dedent`
              class Calculator {
                static log(x) {
                  return 0;
                }

                static log1p(x) {
                  return 0;
                }

                static log10(x) {
                  return 0;
                }

                static log2(x) {
                  return 0;
                }
              }
            `,
            output: dedent`
              class Calculator {
                static log(x) {
                  return 0;
                }

                static log10(x) {
                  return 0;
                }

                static log1p(x) {
                  return 0;
                }

                static log2(x) {
                  return 0;
                }
              }
            `,
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'log1p',
                  right: 'log10',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}: sorts using default groups`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
              class Class {
                private privateMethod() {}

                protected protectedMethod() {}

                public publicMethod() {}

                private static privateStaticMethod() {}

                protected static protectedStaticMethod() {}

                public static publicStaticMethod() {}

                constructor() {}

                private privateProperty

                private accessor privateAccessorProperty

                protected protectedProperty

                public publicProperty

                public accessor publicAccessorProperty

                public set publicSetMethod() {}

                public get publicGetMethod() {}

                protected accessor protectedAccessorProperty

                static {}

                private static privateStaticProperty

                protected static protectedStaticProperty

                public static publicStaticProperty

                [key: string]: string
              }
            `,
          output: dedent`
              class Class {
                [key: string]: string

                public static publicStaticProperty

                protected static protectedStaticProperty

                private static privateStaticProperty

                static {}

                public accessor publicAccessorProperty

                public publicProperty

                public get publicGetMethod() {}

                public set publicSetMethod() {}

                protected accessor protectedAccessorProperty

                protected protectedProperty

                private accessor privateAccessorProperty

                private privateProperty

                constructor() {}

                public static publicStaticMethod() {}

                protected static protectedStaticMethod() {}

                private static privateStaticMethod() {}

                public publicMethod() {}

                protected protectedMethod() {}

                private privateMethod() {}
              }
            `,
          errors: [
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'privateMethod',
                leftGroup: 'private-method',
                right: 'protectedMethod',
                rightGroup: 'protected-method',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'protectedMethod',
                leftGroup: 'protected-method',
                right: 'publicMethod',
                rightGroup: 'method',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'publicMethod',
                leftGroup: 'method',
                right: 'privateStaticMethod',
                rightGroup: 'private-static-method',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'privateStaticMethod',
                leftGroup: 'private-static-method',
                right: 'protectedStaticMethod',
                rightGroup: 'protected-static-method',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'protectedStaticMethod',
                leftGroup: 'protected-static-method',
                right: 'publicStaticMethod',
                rightGroup: 'static-method',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'publicStaticMethod',
                leftGroup: 'static-method',
                right: 'constructor',
                rightGroup: 'constructor',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'constructor',
                leftGroup: 'constructor',
                right: 'privateProperty',
                rightGroup: 'private-property',
              },
            },
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'privateProperty',
                right: 'privateAccessorProperty',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'privateAccessorProperty',
                leftGroup: 'private-accessor-property',
                right: 'protectedProperty',
                rightGroup: 'protected-property',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'protectedProperty',
                leftGroup: 'protected-property',
                right: 'publicProperty',
                rightGroup: 'property',
              },
            },
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'publicProperty',
                right: 'publicAccessorProperty',
              },
            },
            {
              messageId: 'unexpectedClassesOrder',
              data: {
                left: 'publicSetMethod',
                right: 'publicGetMethod',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'protectedAccessorProperty',
                leftGroup: 'protected-accessor-property',
                right: 'static',
                rightGroup: 'static-block',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'static',
                leftGroup: 'static-block',
                right: 'privateStaticProperty',
                rightGroup: 'private-static-property',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'privateStaticProperty',
                leftGroup: 'private-static-property',
                right: 'protectedStaticProperty',
                rightGroup: 'protected-static-property',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'protectedStaticProperty',
                leftGroup: 'protected-static-property',
                right: 'publicStaticProperty',
                rightGroup: 'static-property',
              },
            },
            {
              messageId: 'unexpectedClassesGroupOrder',
              data: {
                left: 'publicStaticProperty',
                leftGroup: 'static-property',
                right: '[key: string]',
                rightGroup: 'index-signature',
              },
            },
          ],
        },
      ],
    })

    describe('handles complex comment cases', () => {
      ruleTester.run(`keeps comments associated to their node`, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              class Class {
                // Ignore this comment

                // B1
                b

                /**
                 * Ignore this comment as well
                 */

                // A4
                // A3
                /*
                 * A2
                 */
                // A1
                a
              }
            `,
            output: dedent`
              class Class {
                // Ignore this comment

                // A4
                // A3
                /*
                 * A2
                 */
                // A1
                a

                /**
                 * Ignore this comment as well
                 */

                // B1
                b
              }
            `,
            options: [
              {
                type: 'alphabetical',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
        ],
      })

      describe('partition comments', () => {
        ruleTester.run(`handles partition comments`, rule, {
          valid: [],
          invalid: [
            {
              code: dedent`
              class Class {
                // Ignore this comment

                // C2
                // C1
                c

                // B2
                /**
                  * B1
                  */
                b

                // Above a partition comment ignore me
                // PartitionComment: 1
                /**
                  * D2
                  */
                // D1
                d

                a
              }
            `,
              output: dedent`
              class Class {
                // Ignore this comment

                // B2
                /**
                  * B1
                  */
                b

                // C2
                // C1
                c

                // Above a partition comment ignore me
                // PartitionComment: 1
                a

                /**
                  * D2
                  */
                // D1
                d
              }
            `,
              options: [
                {
                  type: 'alphabetical',
                  partitionByComment: 'PartitionComment:*',
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedClassesOrder',
                  data: {
                    left: 'c',
                    right: 'b',
                  },
                },
                {
                  messageId: 'unexpectedClassesOrder',
                  data: {
                    left: 'd',
                    right: 'a',
                  },
                },
              ],
            },
          ],
        })

        ruleTester.run(
          `${ruleName}: allows to use regex for partition comments`,
          rule,
          {
            valid: [
              {
                code: dedent`
                  class Class {
                    e
                    f
                    // I am a partition comment because I don't have f o o
                    a
                    b
                  }
                `,
                options: [
                  {
                    type: 'alphabetical',
                    partitionByComment: ['^(?!.*foo).*$'],
                  },
                ],
              },
            ],
            invalid: [],
          },
        )
      })

      ruleTester.run(`${ruleName}: allows to use new line as partition`, rule, {
        valid: [
          {
            code: dedent`
              class Class {
                d = 'dd'
                e = 'e'

                c = 'ccc'

                a = 'aaaaa'
                b = 'bbbb'
              }
            `,
            options: [
              {
                partitionByNewLine: true,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              class Class {
                e = 'e'
                d = 'dd'

                c = 'ccc'

                b = 'bbbb'
                a = 'aaaaa'
              }
            `,
            output: dedent`
              class Class {
                d = 'dd'
                e = 'e'

                c = 'ccc'

                a = 'aaaaa'
                b = 'bbbb'
              }
            `,
            options: [
              {
                partitionByNewLine: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'e',
                  right: 'd',
                },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
        ],
      })
    })
  })
})
