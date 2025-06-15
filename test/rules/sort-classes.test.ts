import type { Rule } from 'eslint'

import { RuleTester } from '@typescript-eslint/rule-tester'
import { RuleTester as EslintRuleTester } from 'eslint'
import { afterAll, describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-classes'

let ruleName = 'sort-classes'

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

    ruleTester.run(`${ruleName}(${type}): sorts class members`, rule, {
      invalid: [
        {
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
              data: {
                right: 'd',
                left: 'e',
              },
              messageId: 'unexpectedClassesOrder',
            },
            {
              data: {
                leftGroup: 'static-method',
                rightGroup: 'constructor',
                right: 'constructor',
                left: 'f',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
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
        },
      ],
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
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts complex official groups`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  leftGroup: 'public-optional-async-method',
                  rightGroup: 'public-optional-property',
                  right: 'o',
                  left: 'p',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  leftGroup: 'public-optional-property',
                  rightGroup: 'static-block',
                  right: 'static',
                  left: 'o',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  rightGroup: 'static-readonly-index-signature',
                  right: 'static readonly [key: string]',
                  leftGroup: 'static-block',
                  left: 'static',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  leftGroup: 'static-readonly-index-signature',
                  left: 'static readonly [key: string]',
                  rightGroup: 'async-function-property',
                  right: 'n',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  right: 'm',
                  left: 'n',
                },
                messageId: 'unexpectedClassesOrder',
              },
              {
                data: {
                  rightGroup: 'declare-private-static-readonly-property',
                  leftGroup: 'async-function-property',
                  right: 'l',
                  left: 'm',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  leftGroup: 'declare-private-static-readonly-property',
                  rightGroup: 'private-property',
                  right: 'k',
                  left: 'l',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  rightGroup: 'protected-property',
                  leftGroup: 'private-property',
                  right: 'j',
                  left: 'k',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  leftGroup: 'protected-property',
                  rightGroup: 'public-property',
                  right: 'i',
                  left: 'j',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  rightGroup: 'private-readonly-property',
                  leftGroup: 'public-property',
                  right: 'h',
                  left: 'i',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  rightGroup: 'protected-readonly-property',
                  leftGroup: 'private-readonly-property',
                  right: 'g',
                  left: 'h',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  leftGroup: 'protected-readonly-property',
                  rightGroup: 'public-readonly-property',
                  right: 'f',
                  left: 'g',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  rightGroup: 'static-private-override-readonly-property',
                  leftGroup: 'public-readonly-property',
                  right: 'e',
                  left: 'f',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  rightGroup: 'static-protected-override-readonly-property',
                  leftGroup: 'static-private-override-readonly-property',
                  right: 'd',
                  left: 'e',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  leftGroup: 'static-protected-override-readonly-property',
                  rightGroup: 'static-public-override-readonly-property',
                  right: 'c',
                  left: 'd',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  rightGroup:
                    'protected-abstract-override-readonly-decorated-property',
                  leftGroup: 'static-public-override-readonly-property',
                  right: 'b',
                  left: 'c',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  leftGroup:
                    'protected-abstract-override-readonly-decorated-property',
                  rightGroup:
                    'public-abstract-override-readonly-decorated-property',
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
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
                  'async-function-property',
                  'static-readonly-index-signature',
                  'static-block',
                  'public-optional-property',
                  'public-optional-async-method',
                ],
              },
            ],
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

                private m = async () => {};

                private n = async function() {};

                static readonly [key: string]: string;

                static {}

                o?;

                async p?(): Promise<void>;
              }
            `,
            code: dedent`
              abstract class Class {

                async p?(): Promise<void>;

                o?;

                static {}

                static readonly [key: string]: string;

                private n = async function() {};

                private m = async () => {};

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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): prioritize selectors over modifiers quantity`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  leftGroup: 'public-abstract-override-method',
                  rightGroup: 'get-method',
                  right: 'fields',
                  left: 'method',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
            output: dedent`
              export abstract class Class extends Class2 {

                public abstract override get fields(): string;

                public abstract override method(): string;
              }
            `,
            code: dedent`
              export abstract class Class extends Class2 {

                public abstract override method(): string;

                public abstract override get fields(): string;
              }
            `,
            options: [
              {
                ...options,
                groups: ['get-method', 'public-abstract-override-method'],
              },
            ],
          },
        ],
        valid: [],
      },
    )

    describe(`${ruleName}(${type}): index-signature modifiers priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize static over readonly`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'static readonly [key: string]',
                    rightGroup: 'static-index-signature',
                    leftGroup: 'property',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
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
              output: dedent`
                export class Class {

                  static readonly [key: string]: string;

                  a: string;
                }
              `,
              code: dedent`
                export class Class {

                  a: string;

                  static readonly [key: string]: string;
                }
              `,
            },
          ],
          valid: [],
        },
      )
    })

    describe(`${ruleName}(${type}): method selectors priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize constructor over method`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'constructor',
                    right: 'constructor',
                    leftGroup: 'method',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
              output: dedent`
                export class Class {

                  constructor() {}

                  a(): void;
                }
              `,
              code: dedent`
                export class Class {

                  a(): void;

                  constructor() {}
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['constructor', 'method'],
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize get-method over method`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'get-method',
                    leftGroup: 'method',
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
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
              code: dedent`
                export class Class {

                  a(): void;

                  get z() {}
                }
              `,
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize set-method over method`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'set-method',
                    leftGroup: 'method',
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
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
              code: dedent`
                export class Class {

                  a(): void;

                  set z() {}
                }
              `,
            },
          ],
          valid: [],
        },
      )
    })

    describe(`${ruleName}(${type}): method modifiers priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize static over override`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'static-method',
                    leftGroup: 'property',
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
              output: dedent`
                export class Class extends Class2 {

                  static override z(): string;

                  a: string;
                }
              `,
              code: dedent`
                export class Class extends Class2 {

                  a: string;

                  static override z(): string;
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['static-method', 'property', 'override-method'],
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize abstract over override`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'abstract-method',
                    leftGroup: 'property',
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
              output: dedent`
                export abstract class Class extends Class2 {

                  abstract override z(): string;

                  a: string;
                }
              `,
              code: dedent`
                export abstract class Class extends Class2 {

                  a: string;

                  abstract override z(): string;
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['abstract-method', 'property', 'override-method'],
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize decorated over override`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'decorated-method',
                    leftGroup: 'property',
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
              output: dedent`
                export abstract class Class extends Class2 {

                  @Decorator
                  override z(): void {}

                  a: string;
                }
              `,
              code: dedent`
                export abstract class Class extends Class2 {

                  a: string;

                  @Decorator
                  override z(): void {}
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['decorated-method', 'property', 'override-method'],
                },
              ],
            },
          ],
          valid: [],
        },
      )

      for (let accessibilityModifier of ['public', 'protected', 'private']) {
        ruleTester.run(
          `${ruleName}(${type}): prioritize override over ${accessibilityModifier} accessibility`,
          rule,
          {
            invalid: [
              {
                errors: [
                  {
                    data: {
                      rightGroup: 'override-method',
                      leftGroup: 'property',
                      right: 'z',
                      left: 'a',
                    },
                    messageId: 'unexpectedClassesGroupOrder',
                  },
                ],
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
                output: dedent`
                  export class Class {

                    ${accessibilityModifier} override z(): string;

                    a: string;
                  }
                `,
                code: dedent`
                  export class Class {

                    a: string;

                    ${accessibilityModifier} override z(): string;
                  }
                `,
              },
            ],
            valid: [],
          },
        )

        ruleTester.run(
          `${ruleName}(${type}): prioritize ${accessibilityModifier} accessibility over optional`,
          rule,
          {
            invalid: [
              {
                errors: [
                  {
                    data: {
                      rightGroup: `${accessibilityModifier}-method`,
                      leftGroup: 'property',
                      right: 'z',
                      left: 'a',
                    },
                    messageId: 'unexpectedClassesGroupOrder',
                  },
                ],
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
                output: dedent`
                  export class Class {

                    ${accessibilityModifier} z?(): string;

                    a: string;
                  }
                `,
                code: dedent`
                  export class Class {

                    a: string;

                    ${accessibilityModifier} z?(): string;
                  }
                `,
              },
            ],
            valid: [],
          },
        )
      }

      ruleTester.run(
        `${ruleName}(${type}): prioritize optional over async`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: `optional-method`,
                    leftGroup: 'property',
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
              options: [
                {
                  ...options,
                  groups: [`optional-method`, 'property', 'async-method'],
                },
              ],
              output: dedent`
                export class Class {

                  async z?(): Promise<string>;

                  a: string;
                }
              `,
              code: dedent`
                export class Class {

                  a: string;

                  async z?(): Promise<string>;
                }
              `,
            },
          ],
          valid: [],
        },
      )
    })

    describe(`${ruleName}(${type}): accessor modifiers priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize static over override`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'static-accessor-property',
                    leftGroup: 'property',
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
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
              output: dedent`
                export class Class extends Class2 {

                  static override accessor z: string;

                  a: string;
                }
              `,
              code: dedent`
                export class Class extends Class2 {

                  a: string;

                  static override accessor z: string;
                }
              `,
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize abstract over override`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'abstract-accessor-property',
                    leftGroup: 'property',
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
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
              output: dedent`
                export abstract class Class extends Class2 {

                  abstract override accessor z: string;

                  a: string;
                }
              `,
              code: dedent`
                export abstract class Class extends Class2 {

                  a: string;

                  abstract override accessor z: string;
                }
              `,
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize decorated over override`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'decorated-accessor-property',
                    leftGroup: 'property',
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
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
              output: dedent`
                export abstract class Class extends Class2 {

                  @Decorator
                  override accessor z: string;

                  a: string;
                }
              `,
              code: dedent`
                export abstract class Class extends Class2 {

                  a: string;

                  @Decorator
                  override accessor z: string;
                }
              `,
            },
          ],
          valid: [],
        },
      )

      for (let accessibilityModifier of ['public', 'protected', 'private']) {
        ruleTester.run(
          `${ruleName}(${type}): prioritize override over ${accessibilityModifier} accessibility`,
          rule,
          {
            invalid: [
              {
                errors: [
                  {
                    data: {
                      rightGroup: 'override-accessor-property',
                      leftGroup: 'property',
                      right: 'z',
                      left: 'a',
                    },
                    messageId: 'unexpectedClassesGroupOrder',
                  },
                ],
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
                output: dedent`
                  export class Class {

                    ${accessibilityModifier} override accessor z: string;

                    a: string;
                  }
                `,
                code: dedent`
                  export class Class {

                    a: string;

                    ${accessibilityModifier} override accessor z: string;
                  }
                `,
              },
            ],
            valid: [],
          },
        )
      }
    })

    describe(`${ruleName}(${type}): property selectors priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize function property over property`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    leftGroup: 'function-property',
                    rightGroup: 'property',
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
              options: [
                {
                  ...options,
                  groups: ['property', 'function-property'],
                },
              ],
              output: dedent`
                export class Class {

                  z: string;

                  a = function() {}
                }
              `,
              code: dedent`
                export class Class {

                  a = function() {}

                  z: string;
                }
              `,
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize function property over property for arrow functions`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    leftGroup: 'function-property',
                    rightGroup: 'property',
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
              options: [
                {
                  ...options,
                  groups: ['property', 'function-property'],
                },
              ],
              output: dedent`
                export class Class {

                  z: string;

                  a = () => {}
                }
              `,
              code: dedent`
                export class Class {

                  a = () => {}

                  z: string;
                }
              `,
            },
          ],
          valid: [],
        },
      )
    })

    describe(`${ruleName}(${type}): property modifiers priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize static over declare`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'static-property',
                    leftGroup: 'method',
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
              output: dedent`
                export class Class extends Class2 {

                  declare static z: string;

                  a(): void {}
                }
              `,
              code: dedent`
                export class Class extends Class2 {

                  a(): void {}

                  declare static z: string;
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['static-property', 'method', 'declare-property'],
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize declare over abstract`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'declare-property',
                    leftGroup: 'method',
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
              output: dedent`
                export class Class extends Class2 {

                  declare abstract z: string;

                  a(): void {}
                }
              `,
              code: dedent`
                export class Class extends Class2 {

                  a(): void {}

                  declare abstract z: string;
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['declare-property', 'method', 'abstract-property'],
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize abstract over override`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'abstract-property',
                    leftGroup: 'method',
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
              output: dedent`
                export abstract class Class extends Class2 {

                  abstract override z: string;

                  a(): void {}
                }
              `,
              code: dedent`
                export abstract class Class extends Class2 {

                  a(): void {}

                  abstract override z: string;
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['abstract-property', 'method', 'override-property'],
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize decorated over override`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'decorated-property',
                    leftGroup: 'method',
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
              output: dedent`
                export abstract class Class extends Class2 {

                  @Decorator
                  override z: string;

                  a(): void {}
                }
              `,
              code: dedent`
                export abstract class Class extends Class2 {

                  a(): void {}

                  @Decorator
                  override z: string;
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['decorated-property', 'method', 'override-property'],
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize decorated over override`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'decorated-property',
                    leftGroup: 'method',
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
              output: dedent`
                export abstract class Class extends Class2 {

                  @Decorator
                  override z: string;

                  a(): void {}
                }
              `,
              code: dedent`
                export abstract class Class extends Class2 {

                  a(): void {}

                  @Decorator
                  override z: string;
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['decorated-property', 'method', 'override-property'],
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize override over readonly`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'override-property',
                    leftGroup: 'method',
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
              output: dedent`
                export abstract class Class extends Class2 {

                  override readonly z: string;

                  a(): void {}
                }
              `,
              code: dedent`
                export abstract class Class extends Class2 {

                  a(): void {}

                  override readonly z: string;
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['override-property', 'method', 'readonly-property'],
                },
              ],
            },
          ],
          valid: [],
        },
      )

      for (let accessibilityModifier of ['public', 'protected', 'private']) {
        ruleTester.run(
          `${ruleName}(${type}): prioritize readonly over ${accessibilityModifier} accessibility`,
          rule,
          {
            invalid: [
              {
                errors: [
                  {
                    data: {
                      rightGroup: 'readonly-property',
                      leftGroup: 'method',
                      right: 'z',
                      left: 'a',
                    },
                    messageId: 'unexpectedClassesGroupOrder',
                  },
                ],
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
                output: dedent`
                  export class Class {

                    ${accessibilityModifier} readonly z: string;

                    a(): void {}
                  }
                `,
                code: dedent`
                  export class Class {

                    a(): void {}

                    ${accessibilityModifier} readonly z: string;
                  }
                `,
              },
            ],
            valid: [],
          },
        )

        ruleTester.run(
          `${ruleName}(${type}): prioritize ${accessibilityModifier} accessibility over optional`,
          rule,
          {
            invalid: [
              {
                errors: [
                  {
                    data: {
                      rightGroup: `${accessibilityModifier}-property`,
                      leftGroup: 'method',
                      right: 'z',
                      left: 'a',
                    },
                    messageId: 'unexpectedClassesGroupOrder',
                  },
                ],
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
                output: dedent`
                  export class Class {

                    ${accessibilityModifier} z?: string;

                    a(): void {}
                  }
                `,
                code: dedent`
                  export class Class {

                    a(): void {}

                    ${accessibilityModifier} z?: string;
                  }
                `,
              },
            ],
            valid: [],
          },
        )
      }

      ruleTester.run(
        `${ruleName}(${type}): prioritize optional over async`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: `optional-property`,
                    leftGroup: 'method',
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
              output: dedent`
                export class Class {

                  z?: Promise<string> = async () => {};

                  a(): void {}
                }
              `,
              code: dedent`
                export class Class {

                  a(): void {}

                  z?: Promise<string> = async () => {};
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['optional-property', 'method', `async-property`],
                },
              ],
            },
          ],
          valid: [],
        },
      )
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts class and group members`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'key in O',
                  right: 'b',
                },
                messageId: 'unexpectedClassesOrder',
              },
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedClassesOrder',
              },
            ],
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts class with attributes having the same name`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  leftGroup: 'static-property',
                  rightGroup: 'property',
                  right: 'a',
                  left: 'a',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
            options: [
              {
                ...options,
                groups: ['property', 'static-property'],
              },
            ],
            output: dedent`
              class Class {
                a;

                static a;
              }
            `,
            code: dedent`
              class Class {
                static a;

                a;
              }
            `,
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts class with ts index signatures`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'static-property',
                  leftGroup: 'index-signature',
                  left: '[k: string];',
                  right: 'a',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'index-signature',
                ],
              },
            ],
            output: dedent`
              class Class {
                static a = 'a';

                [k: string]: any;

                [k: string];
              }
            `,
            code: dedent`
              class Class {
                [k: string]: any;

                [k: string];

                static a = 'a';
              }
            `,
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                ],
              },
            ],
            code: dedent`
              class Class {
                static a = 'a';

                [k: string]: any;

                [k: string];
              }
            `,
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
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'private-property',
                  left: '#aPrivateStaticMethod',
                  right: '#somePrivateProperty',
                  leftGroup: 'static-method',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  right: '#someOtherPrivateProperty',
                  left: '#somePrivateProperty',
                },
                messageId: 'unexpectedClassesOrder',
              },
              {
                data: {
                  left: '#someOtherPrivateProperty',
                  leftGroup: 'private-property',
                  rightGroup: 'static-property',
                  right: 'someStaticProperty',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  right: '#someStaticPrivateProperty',
                  left: 'someStaticProperty',
                },
                messageId: 'unexpectedClassesOrder',
              },
              {
                data: {
                  right: '#aPrivateInstanceMethod',
                  rightGroup: 'private-method',
                  leftGroup: 'static-method',
                  left: 'aStaticMethod',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows split methods with getters and setters`,
      rule,
      {
        invalid: [
          {
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
                data: {
                  right: 'b',
                  left: 'x',
                },
                messageId: 'unexpectedClassesOrder',
              },
              {
                data: {
                  right: 'c',
                  left: 'z',
                },
                messageId: 'unexpectedClassesOrder',
              },
            ],
            output: dedent`
              class A {
                b() {}
                x() {}
                get c() {}
                set c() {}
                get z() {}
              }
            `,
            code: dedent`
              class A {
                x() {}
                b() {}
                get z() {}
                get c() {}
                set c() {}
              }
            `,
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts decorated properties`, rule, {
      invalid: [
        {
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
            }
          `,
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
            }
          `,
          errors: [
            {
              data: {
                leftGroup: 'decorated-property',
                rightGroup: 'property',
                right: 'lastName',
                left: 'email',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
          options: [
            {
              ...options,
              groups: ['property', 'decorated-property', 'unknown'],
            },
          ],
        },
        {
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
            }
          `,
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
            }
          `,
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
              data: {
                rightGroup: 'decorated-set-method',
                leftGroup: 'set-method',
                left: 'message',
                right: 'prop',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}(${type}): sorts decorated accessors`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                rightGroup: 'private-decorated-accessor-property',
                leftGroup: 'decorated-method',
                right: '#active',
                left: 'toggle',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                leftGroup: 'private-decorated-accessor-property',
                rightGroup: 'decorated-accessor-property',
                right: 'finished',
                left: '#active',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
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
            }
          `,
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
            }
          `,
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
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}(${type}): sorts decorated accessors`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'onSortChanged',
                left: 'updateTable',
              },
              messageId: 'unexpectedClassesOrder',
            },
            {
              data: {
                right: 'onPaginationChanged',
                left: 'onSortChanged',
              },
              messageId: 'unexpectedClassesOrder',
            },
            {
              data: {
                right: 'onValueChanged',
                left: 'setFormValue',
              },
              messageId: 'unexpectedClassesOrder',
            },
          ],
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
          options: [
            {
              ...options,
              partitionByComment: 'Region:',
            },
          ],
        },
      ],
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
              partitionByComment: 'Region:',
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): does not sort properties if the right value depends on the left value`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  nodeDependentOnRight: 'aaa',
                  right: 'b',
                },
                messageId: 'unexpectedClassesDependencyOrder',
              },
            ],
            output: dedent`
              class Class {
                b = 'b'

                aaa = [this.b]
              }
            `,
            code: dedent`
              class Class {
                aaa = [this.b]

                b = 'b'
              }
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  rightGroup: 'property',
                  leftGroup: 'method',
                  left: 'getAaa',
                  right: 'b',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
            output: dedent`
              class Class {
                b = 'b'

                getAaa() {
                  return this.b;
                }
              }
            `,
            code: dedent`
              class Class {
                getAaa() {
                  return this.b;
                }

                b = 'b'
              }
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  rightGroup: 'static-property',
                  leftGroup: 'property',
                  right: 'c',
                  left: 'b',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
            output: dedent`
              class Class {
                static c = 'c'

                b = Example.c
              }
            `,
            code: dedent`
              class Class {
                b = Example.c

                static c = 'c'
              }
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  rightGroup: 'private-property',
                  leftGroup: 'method',
                  left: 'getAaa',
                  right: '#b',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
            output: dedent`
              class Class {
                #b = 'b'

                getAaa() {
                  return this.#b;
                }
              }
            `,
            code: dedent`
              class Class {
                getAaa() {
                  return this.#b;
                }

                #b = 'b'
              }
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  rightGroup: 'static-property',
                  leftGroup: 'static-method',
                  left: 'getAaa',
                  right: 'b',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
            output: dedent`
              class Class {
                static b = 'b'

                static getAaa() {
                  return this.b;
                }
              }
            `,
            code: dedent`
              class Class {
                static getAaa() {
                  return this.b;
                }

                static b = 'b'
              }
            `,
            options: [options],
          },
        ],
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
            {
              code: dedent`
                class MyClass {
                  a = () => this.b()
                  b = () => null
                }
              `,
              options: [options],
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
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'd',
                    left: 'e',
                  },
                  messageId: 'unexpectedClassesOrder',
                },
                {
                  data: {
                    right: 'a',
                    left: 'd',
                  },
                  messageId: 'unexpectedClassesOrder',
                },
                {
                  data: {
                    nodeDependentOnRight: 'd',
                    right: 'b',
                  },
                  messageId: 'unexpectedClassesDependencyOrder',
                },
                {
                  data: {
                    nodeDependentOnRight: 'e',
                    right: 'c',
                  },
                  messageId: 'unexpectedClassesDependencyOrder',
                },
                {
                  data: {
                    nodeDependentOnRight: 'b',
                    right: 'z',
                  },
                  messageId: 'unexpectedClassesDependencyOrder',
                },
              ],
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
              options: [
                {
                  ...options,
                  groups: ['property'],
                },
              ],
            },
            {
              errors: [
                {
                  data: {
                    nodeDependentOnRight: 'a',
                    right: 'c',
                  },
                  messageId: 'unexpectedClassesDependencyOrder',
                },
              ],
              output: dedent`
                class Class {
                  c = 10
                  a = this.c
                  b = 10
                }
              `,
              code: dedent`
                class Class {
                  a = this.c
                  b = 10
                  c = 10
                }
              `,
              options: [options],
            },
          ],
          valid: [],
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
            options: [options],
          },
          {
            code: dedent`
              class Class {
               static #b = () => 1
               static #a = this.#b()
              }
            `,
            options: [options],
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
          invalid: [
            {
              errors: [
                {
                  data: {
                    nodeDependentOnRight: 'b',
                    right: 'c',
                  },
                  messageId: 'unexpectedClassesDependencyOrder',
                },
                {
                  data: {
                    nodeDependentOnRight: 'a',
                    right: 'c',
                  },
                  messageId: 'unexpectedClassesDependencyOrder',
                },
              ],
              output: dedent`
                class Class {
                  static c = 10
                  static a = Class.c
                  c = 10
                  b = this.c
                  static b = this.c
                }
              `,
              code: dedent`
                class Class {
                  static a = Class.c
                  b = this.c
                  static b = this.c
                  c = 10
                  static c = 10
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
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) detects and ignores circular dependencies`,
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
                  messageId: 'unexpectedClassesOrder',
                },
              ],
              output: dedent`
                class Class {
                  a
                  b = this.e
                  e = this.g
                  f
                  g = this.b
                }
              `,
              code: dedent`
                class Class {
                  b = this.e
                  a
                  e = this.g
                  f
                  g = this.b
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
          valid: [],
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
              options: [
                {
                  ...options,
                  groups: ['private-property', 'public-property'],
                },
              ],
              code: dedent`
                class Class {
                  public b = 1;
                  private a = this.b;
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
                  messageId: 'unexpectedClassesDependencyOrder',
                },
              ],
              output: dedent`
                class Class {
                  a
                  // Part1
                  b = this.a
                }
              `,
              code: dedent`
                class Class {
                  b = this.a
                  // Part1
                  a
                }
              `,
              options: [
                {
                  ...options,
                  partitionByComment: 'Part',
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
                  messageId: 'unexpectedClassesDependencyOrder',
                },
              ],
              options: [
                {
                  ...options,
                  partitionByNewLine: true,
                },
              ],
              output: dedent`
                class Class {
                  a

                  b = this.a
                }
              `,
              code: dedent`
                class Class {
                  b = this.a

                  a
                }
              `,
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): works with left and right dependencies`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    nodeDependentOnRight: 'aaa',
                    right: 'left',
                  },
                  messageId: 'unexpectedClassesDependencyOrder',
                },
                {
                  data: {
                    nodeDependentOnRight: 'aaa',
                    right: 'right',
                  },
                  messageId: 'unexpectedClassesDependencyOrder',
                },
              ],
              output: dedent`
                class Class {
                  left = 'left'

                  right = 'right'

                  aaa = this.left + this.right
                }
              `,
              code: dedent`
                class Class {
                  aaa = this.left + this.right

                  left = 'left'

                  right = 'right'
                }
              `,
              options: [options],
            },
          ],
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
        },
      )

      for (let ignoreCallbackDependenciesPatterns of [
        '^computed$',
        ['noMatch', '^computed$'],
        { pattern: '^COMPUTED$', flags: 'i' },
        ['noMatch', { pattern: '^COMPUTED$', flags: 'i' }],
      ]) {
        ruleTester.run(
          `${ruleName}(${type}): should ignore callback dependencies in 'ignoreCallbackDependenciesPatterns'`,
          rule,
          {
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
                    ignoreCallbackDependenciesPatterns,
                  },
                ],
              },
            ],
            invalid: [],
          },
        )
      }
    })

    ruleTester.run(`${ruleName}(${type}): should ignore unknown group`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                rightGroup: 'private-method',
                leftGroup: 'property',
                right: 'z',
                left: 'i',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                leftGroup: 'private-method',
                rightGroup: 'unknown',
                right: 'method3',
                left: 'z',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                rightGroup: 'private-method',
                leftGroup: 'unknown',
                left: 'method3',
                right: 'y',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                rightGroup: 'private-method',
                leftGroup: 'unknown',
                left: 'method1',
                right: 'x',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
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
          options: [
            {
              ...options,
              groups: ['private-method', 'property'],
            },
          ],
        },
        {
          errors: [
            {
              data: {
                leftGroup: 'property',
                rightGroup: 'unknown',
                right: 'someMethod',
                left: 'b',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                rightGroup: 'property',
                leftGroup: 'unknown',
                left: 'someMethod',
                right: 'a',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
          output: dedent`
            class Class {
              a
              someMethod() {
              }
              b
            }
          `,
          code: dedent`
            class Class {
              b
              someMethod() {
              }
              a
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
      valid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            options: [
              {
                ...options,
                specialCharacters: 'trim',
              },
            ],
            code: dedent`
              class Class {
                _a
                b
                _c
              }
            `,
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
              class Class {
                ab
                a_c
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
      for (let newlinesBetween of ['never', 0] as const) {
        ruleTester.run(
          `${ruleName}(${type}): removes newlines when "${newlinesBetween}"`,
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
                    messageId: 'extraSpacingBetweenClassMembers',
                  },
                  {
                    data: {
                      right: 'b',
                      left: 'z',
                    },
                    messageId: 'unexpectedClassesOrder',
                  },
                  {
                    data: {
                      right: 'b',
                      left: 'z',
                    },
                    messageId: 'extraSpacingBetweenClassMembers',
                  },
                ],
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
                    groups: ['method', 'unknown'],
                    newlinesBetween,
                  },
                ],
              },
            ],
            valid: [],
          },
        )
      }

      for (let newlinesBetween of ['always', 1] as const) {
        ruleTester.run(
          `${ruleName}(${type}): keeps one newline when "${newlinesBetween}"`,
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
                    groups: ['a', 'b'],
                    newlinesBetween,
                  },
                ],
                errors: [
                  {
                    data: {
                      right: 'b',
                      left: 'a',
                    },
                    messageId: 'missedSpacingBetweenClassMembers',
                  },
                ],
                output: dedent`
                  class Class {
                    a; 

                  b;
                  }
                `,
                code: dedent`
                  class Class {
                    a; b;
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
                    messageId: 'extraSpacingBetweenClassMembers',
                  },
                  {
                    data: {
                      right: 'y',
                      left: 'z',
                    },
                    messageId: 'unexpectedClassesOrder',
                  },
                  {
                    data: {
                      right: 'b',
                      left: 'y',
                    },
                    messageId: 'missedSpacingBetweenClassMembers',
                  },
                ],
                options: [
                  {
                    ...options,
                    groups: ['function-property', 'unknown', 'method'],
                    newlinesBetween,
                  },
                ],
                output: dedent`
                  class Class {
                    a = () => null

                   y = "y"
                  z = "z"

                      b() {}
                  }
                `,
                code: dedent`
                  class Class {
                    a = () => null


                   z = "z"
                  y = "y"
                      b() {}
                  }
                `,
              },
            ],
            valid: [],
          },
        )
      }

      for (let newlinesBetween of [
        'always',
        1,
        'ignore',
        'never',
        0,
      ] as const) {
        ruleTester.run(
          `${ruleName}: enforces no newline between overload signatures when newlinesBetween is "${newlinesBetween}"`,
          rule,
          {
            invalid: [
              {
                errors: [
                  {
                    data: {
                      right: 'method',
                      left: 'method',
                    },
                    messageId: 'extraSpacingBetweenClassMembers',
                  },
                  {
                    data: {
                      right: 'method',
                      left: 'method',
                    },
                    messageId: 'extraSpacingBetweenClassMembers',
                  },
                ],
                output: dedent`
                  class Class {
                    method(a: string): void {}
                    method(a: number): void {}
                    method(a: string | number): void {}
                  }
                `,
                code: dedent`
                  class Class {
                    method(a: string): void {}

                    method(a: number): void {}

                    method(a: string | number): void {}
                  }
                `,
                options: [
                  {
                    newlinesBetween,
                  },
                ],
              },
            ],
            valid: [],
          },
        )
      }

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
                    customGroups: [
                      { elementNamePattern: 'a', groupName: 'a' },
                      { elementNamePattern: 'b', groupName: 'b' },
                      { elementNamePattern: 'c', groupName: 'c' },
                      { elementNamePattern: 'd', groupName: 'd' },
                      { elementNamePattern: 'e', groupName: 'e' },
                    ],
                    newlinesBetween: 'always',
                  },
                ],
                errors: [
                  {
                    data: {
                      right: 'b',
                      left: 'a',
                    },
                    messageId: 'missedSpacingBetweenClassMembers',
                  },
                  {
                    data: {
                      right: 'c',
                      left: 'b',
                    },
                    messageId: 'extraSpacingBetweenClassMembers',
                  },
                  {
                    data: {
                      right: 'd',
                      left: 'c',
                    },
                    messageId: 'extraSpacingBetweenClassMembers',
                  },
                ],
                output: dedent`
                  class Class {
                    a: string

                    b: string

                    c: string
                    d: string


                    e: string
                  }
                `,
                code: dedent`
                  class Class {
                    a: string
                    b: string


                    c: string

                    d: string


                    e: string
                  }
                `,
              },
            ],
            valid: [],
          },
        )

        describe(`${ruleName}(${type}): "newlinesBetween" between non-consecutive groups`, () => {
          for (let [globalNewlinesBetween, groupNewlinesBetween] of [
            [2, 'never'],
            [2, 0],
            [2, 'ignore'],
            ['never', 2],
            [0, 2],
            ['ignore', 2],
          ] as const) {
            ruleTester.run(
              `${ruleName}(${type}): enforces newlines if the global option is ${globalNewlinesBetween} and the group option is "${groupNewlinesBetween}"`,
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
                        messageId: 'missedSpacingBetweenClassMembers',
                      },
                    ],
                    output: dedent`
                      class Class {
                        a: string


                        b: string
                      }
                    `,
                    code: dedent`
                      class Class {
                        a: string
                        b: string
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
            2,
            'ignore',
            'never',
            0,
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
                        messageId: 'extraSpacingBetweenClassMembers',
                      },
                    ],
                    output: dedent`
                      class Class {
                        a
                        b
                      }
                    `,
                    code: dedent`
                      class Class {
                        a

                        b
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
            ['ignore', 0] as const,
            ['never', 'ignore'] as const,
            [0, 'ignore'] as const,
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
                      class Class {
                        a: string

                        b: string
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
                      class Class {
                        a: string
                        b: string
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
                  class Class {
                    a // Comment after
                    b() {}

                    c() {}
                  }
                `,
                dedent`
                  class Class {
                    a // Comment after

                    b() {}
                    c() {}
                  }
                `,
              ],
              errors: [
                {
                  data: {
                    rightGroup: 'property',
                    leftGroup: 'method',
                    right: 'a',
                    left: 'b',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
              code: dedent`
                class Class {
                  b() {}
                  a // Comment after

                  c() {}
                }
              `,
              options: [
                {
                  groups: ['property', 'method'],
                  newlinesBetween: 'always',
                },
              ],
            },
          ],
          valid: [],
        },
      )

      for (let newlinesBetween of ['never', 0] as const) {
        ruleTester.run(
          `${ruleName}(${type}): ignores newline fixes between different partitions (${newlinesBetween})`,
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
                    ],
                    groups: ['a', 'unknown'],
                    partitionByComment: true,
                    newlinesBetween,
                  },
                ],
                errors: [
                  {
                    data: {
                      right: 'b',
                      left: 'c',
                    },
                    messageId: 'unexpectedClassesOrder',
                  },
                ],
                output: dedent`
                  class Class {
                    a

                    // Partition comment

                    b
                    c
                  }
                `,
                code: dedent`
                  class Class {
                    a

                    // Partition comment

                    c
                    b
                  }
                `,
              },
            ],
            valid: [],
          },
        )
      }
    })

    describe(`${ruleName}(${type}): sorts inline elements correctly`, () => {
      describe(`${ruleName}(${type}): methods`, () => {
        describe(`${ruleName}(${type}): non-abstract methods`, () => {
          ruleTester.run(
            `${ruleName}(${type}): sorts inline non-abstract methods correctly`,
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
                      messageId: 'unexpectedClassesOrder',
                    },
                  ],
                  output: dedent`
                    class Class {
                      a(){} b(){}
                    }
                  `,
                  code: dedent`
                    class Class {
                      b(){} a(){}
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
                      messageId: 'unexpectedClassesOrder',
                    },
                  ],
                  output: dedent`
                    class Class {
                      a(){} b(){};
                    }
                  `,
                  code: dedent`
                    class Class {
                      b(){} a(){};
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
                      messageId: 'unexpectedClassesOrder',
                    },
                  ],
                  output: dedent`
                    class Class {
                      a(){}; b(){}
                    }
                  `,
                  code: dedent`
                    class Class {
                      b(){}; a(){}
                    }
                  `,
                  options: [options],
                },
              ],
              valid: [],
            },
          )
        })

        describe(`${ruleName}(${type}): abstract methods`, () => {
          ruleTester.run(
            `${ruleName}(${type}): sorts inline abstract methods correctly`,
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
                      messageId: 'unexpectedClassesOrder',
                    },
                  ],
                  output: dedent`
                    abstract class Class {
                      abstract a(); abstract b();
                    }
                  `,
                  code: dedent`
                    abstract class Class {
                      abstract b(); abstract a()
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
                      messageId: 'unexpectedClassesOrder',
                    },
                  ],
                  output: dedent`
                    abstract class Class {
                      abstract a(); abstract b();
                    }
                  `,
                  code: dedent`
                    abstract class Class {
                      abstract b(); abstract a();
                    }
                  `,
                  options: [options],
                },
              ],
              valid: [],
            },
          )
        })
      })

      ruleTester.run(
        `${ruleName}(${type}): sorts inline declare class methods correctly`,
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
                  messageId: 'unexpectedClassesOrder',
                },
              ],
              output: dedent`
                declare class Class {
                  a(); b();
                }
              `,
              code: dedent`
                declare class Class {
                  b(); a()
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
                  messageId: 'unexpectedClassesOrder',
                },
              ],
              output: dedent`
                abstract class Class {
                  abstract a(); abstract b();
                }
              `,
              code: dedent`
                abstract class Class {
                  abstract b(); abstract a();
                }
              `,
              options: [options],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): sorts inline properties correctly`,
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
                  messageId: 'unexpectedClassesOrder',
                },
              ],
              output: dedent`
                class Class {
                  a; b;
                }
              `,
              code: dedent`
                class Class {
                  b; a
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
                  messageId: 'unexpectedClassesOrder',
                },
              ],
              output: dedent`
                class Class {
                  a; b;
                }
              `,
              code: dedent`
                class Class {
                  b; a;
                }
              `,
              options: [options],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): sorts inline accessors correctly`,
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
                  messageId: 'unexpectedClassesOrder',
                },
              ],
              output: dedent`
                class Class {
                  accessor a; accessor b;
                }
              `,
              code: dedent`
                class Class {
                  accessor b; accessor a
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
                  messageId: 'unexpectedClassesOrder',
                },
              ],
              output: dedent`
                class Class {
                  accessor a; accessor b;
                }
              `,
              code: dedent`
                class Class {
                  accessor b; accessor a;
                }
              `,
              options: [options],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): sorts inline index-signatures correctly`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: '[key: number]',
                    left: '[key: string]',
                  },
                  messageId: 'unexpectedClassesOrder',
                },
              ],
              output: dedent`
                class Class {
                  [key: number]: string; [key: string]: string;
                }
              `,
              code: dedent`
                class Class {
                  [key: string]: string; [key: number]: string
                }
              `,
              options: [options],
            },
            {
              errors: [
                {
                  data: {
                    right: '[key: number]',
                    left: '[key: string]',
                  },
                  messageId: 'unexpectedClassesOrder',
                },
              ],
              output: dedent`
                class Class {
                  [key: number]: string; [key: string]: string;
                }
              `,
              code: dedent`
                class Class {
                  [key: string]: string; [key: number]: string;
                }
              `,
              options: [options],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): sorts inline static-block correctly`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'static-block',
                    leftGroup: 'property',
                    right: 'static',
                    left: 'a',
                  },
                  messageId: 'unexpectedClassesGroupOrder',
                },
              ],
              output: dedent`
                class Class {
                  static {} a;
                }
              `,
              code: dedent`
                class Class {
                  a; static {}
                }
              `,
              options: [options],
            },
          ],
          valid: [],
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
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'd',
                left: 'e',
              },
              messageId: 'unexpectedClassesOrder',
            },
            {
              data: {
                leftGroup: 'static-method',
                rightGroup: 'constructor',
                right: 'constructor',
                left: 'f',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
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
        },
      ],
      valid: [
        {
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
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts class and group members`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'key in O',
                  right: 'b',
                },
                messageId: 'unexpectedClassesOrder',
              },
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedClassesOrder',
              },
            ],
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts class with ts index signatures`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'static-property',
                  leftGroup: 'index-signature',
                  left: '[k: string];',
                  right: 'a',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'index-signature',
                ],
              },
            ],
            output: dedent`
              class Class {
                static a = 'a';

                [k: string]: any;

                [k: string];
              }
            `,
            code: dedent`
              class Class {
                [k: string]: any;

                [k: string];

                static a = 'a';
              }
            `,
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                ],
              },
            ],
            code: dedent`
              class Class {
                static a = 'a';

                [k: string]: any;

                [k: string];
              }
            `,
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
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'private-property',
                  left: '#aPrivateStaticMethod',
                  right: '#somePrivateProperty',
                  leftGroup: 'static-method',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  right: '#someOtherPrivateProperty',
                  left: '#somePrivateProperty',
                },
                messageId: 'unexpectedClassesOrder',
              },
              {
                data: {
                  left: '#someOtherPrivateProperty',
                  leftGroup: 'private-property',
                  rightGroup: 'static-property',
                  right: 'someStaticProperty',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  right: '#someStaticPrivateProperty',
                  left: 'someStaticProperty',
                },
                messageId: 'unexpectedClassesOrder',
              },
              {
                data: {
                  right: '#aPrivateInstanceMethod',
                  rightGroup: 'private-method',
                  leftGroup: 'static-method',
                  left: 'aStaticMethod',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows split methods with getters and setters`,
      rule,
      {
        invalid: [
          {
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
                data: {
                  right: 'b',
                  left: 'x',
                },
                messageId: 'unexpectedClassesOrder',
              },
              {
                data: {
                  right: 'c',
                  left: 'z',
                },
                messageId: 'unexpectedClassesOrder',
              },
            ],
            output: dedent`
              class A {
                b() {}
                x() {}
                get c() {}
                set c() {}
                get z() {}
              }
            `,
            code: dedent`
              class A {
                x() {}
                b() {}
                get z() {}
                get c() {}
                set c() {}
              }
            `,
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts decorated properties`, rule, {
      invalid: [
        {
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
            }
          `,
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
            }
          `,
          errors: [
            {
              data: {
                leftGroup: 'decorated-property',
                rightGroup: 'property',
                right: 'lastName',
                left: 'email',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
          options: [
            {
              ...options,
              groups: ['property', 'decorated-property', 'unknown'],
            },
          ],
        },
        {
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
            }
          `,
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
            }
          `,
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
              data: {
                rightGroup: 'decorated-set-method',
                leftGroup: 'set-method',
                left: 'message',
                right: 'prop',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}(${type}): sorts decorated accessors`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                rightGroup: 'private-decorated-accessor-property',
                leftGroup: 'decorated-method',
                right: '#active',
                left: 'toggle',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                leftGroup: 'private-decorated-accessor-property',
                rightGroup: 'decorated-accessor-property',
                right: 'finished',
                left: '#active',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
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
            }
          `,
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
            }
          `,
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
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}(${type}): sorts decorated accessors`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'onSortChanged',
                left: 'updateTable',
              },
              messageId: 'unexpectedClassesOrder',
            },
            {
              data: {
                right: 'onPaginationChanged',
                left: 'onSortChanged',
              },
              messageId: 'unexpectedClassesOrder',
            },
            {
              data: {
                right: 'onValueChanged',
                left: 'setFormValue',
              },
              messageId: 'unexpectedClassesOrder',
            },
          ],
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
          options: [
            {
              ...options,
              partitionByComment: 'Region:',
            },
          ],
        },
      ],
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
              partitionByComment: 'Region:',
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): does not sort properties if the right value depends on the left value`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  nodeDependentOnRight: 'aaa',
                  right: 'b',
                },
                messageId: 'unexpectedClassesDependencyOrder',
              },
            ],
            output: dedent`
              class Class {
                b = 'b'

                aaa = [this.b]
              }
            `,
            code: dedent`
              class Class {
                aaa = [this.b]

                b = 'b'
              }
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  rightGroup: 'property',
                  leftGroup: 'method',
                  left: 'getAaa',
                  right: 'b',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
            output: dedent`
              class Class {
                b = 'b'

                getAaa() {
                  return this.b;
                }
              }
            `,
            code: dedent`
              class Class {
                getAaa() {
                  return this.b;
                }

                b = 'b'
              }
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  rightGroup: 'static-property',
                  leftGroup: 'property',
                  right: 'c',
                  left: 'b',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
            output: dedent`
              class Class {
                static c = 'c'

                b = Example.c
              }
            `,
            code: dedent`
              class Class {
                b = Example.c

                static c = 'c'
              }
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  rightGroup: 'private-property',
                  leftGroup: 'method',
                  left: 'getAaa',
                  right: '#b',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
            output: dedent`
              class Class {
                #b = 'b'

                getAaa() {
                  return this.#b;
                }
              }
            `,
            code: dedent`
              class Class {
                getAaa() {
                  return this.#b;
                }

                #b = 'b'
              }
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  rightGroup: 'static-property',
                  leftGroup: 'static-method',
                  left: 'getAaa',
                  right: 'b',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
            output: dedent`
              class Class {
                static b = 'b'

                static getAaa() {
                  return this.b;
                }
              }
            `,
            code: dedent`
              class Class {
                static getAaa() {
                  return this.b;
                }

                static b = 'b'
              }
            `,
            options: [options],
          },
        ],
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
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with left and right dependencies`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  nodeDependentOnRight: 'aaa',
                  right: 'left',
                },
                messageId: 'unexpectedClassesDependencyOrder',
              },
              {
                data: {
                  nodeDependentOnRight: 'aaa',
                  right: 'right',
                },
                messageId: 'unexpectedClassesDependencyOrder',
              },
            ],
            output: dedent`
              class Class {
                left = 'left'

                right = 'right'

                aaa = this.left + this.right
              }
            `,
            code: dedent`
              class Class {
                aaa = this.left + this.right

                left = 'left'

                right = 'right'
              }
            `,
            options: [options],
          },
        ],
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
      },
    )

    ruleTester.run(`${ruleName}(${type}): should ignore unknown group`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                rightGroup: 'private-method',
                leftGroup: 'property',
                right: 'z',
                left: 'i',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                leftGroup: 'private-method',
                rightGroup: 'unknown',
                right: 'method3',
                left: 'z',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                rightGroup: 'private-method',
                leftGroup: 'unknown',
                left: 'method3',
                right: 'y',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                rightGroup: 'private-method',
                leftGroup: 'unknown',
                left: 'method1',
                right: 'x',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
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
          options: [
            {
              ...options,
              groups: ['private-method', 'property'],
            },
          ],
        },
        {
          errors: [
            {
              data: {
                leftGroup: 'property',
                rightGroup: 'unknown',
                right: 'someMethod',
                left: 'b',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                rightGroup: 'property',
                leftGroup: 'unknown',
                left: 'someMethod',
                right: 'a',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
          output: dedent`
            class Class {
              a
              someMethod() {
              }
              b
            }
          `,
          code: dedent`
            class Class {
              b
              someMethod() {
              }
              a
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
      valid: [],
    })
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

    ruleTester.run(`${ruleName}(${type}): sorts class members`, rule, {
      invalid: [
        {
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
              data: {
                right: 'd',
                left: 'e',
              },
              messageId: 'unexpectedClassesOrder',
            },
            {
              data: {
                leftGroup: 'static-method',
                rightGroup: 'constructor',
                right: 'constructor',
                left: 'f',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
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
        },
      ],
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
      invalid: [
        {
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
          errors: [
            {
              data: {
                leftGroup: 'static-method',
                rightGroup: 'constructor',
                right: 'constructor',
                left: 'e',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
        },
      ],
      valid: [
        {
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
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts class and group members`,
      rule,
      {
        invalid: [
          {
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
            errors: [
              {
                data: {
                  left: 'key in O',
                  right: 'b',
                },
                messageId: 'unexpectedClassesOrder',
              },
            ],
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts class with ts index signatures`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'static-property',
                  leftGroup: 'index-signature',
                  left: '[k: string];',
                  right: 'a',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'index-signature',
                ],
              },
            ],
            output: dedent`
              class Class {
                static a = 'a';

                [k: string]: any;

                [k: string];
              }
            `,
            code: dedent`
              class Class {
                [k: string]: any;

                [k: string];

                static a = 'a';
              }
            `,
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                groups: [
                  ['static-property', 'private-property', 'property'],
                  'constructor',
                ],
              },
            ],
            code: dedent`
              class Class {
                static a = 'a';

                [k: string]: any;

                [k: string];
              }
            `,
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts class with ts index signatures`,
      rule,
      {
        invalid: [
          {
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
            errors: [
              {
                data: {
                  rightGroup: 'static-method',
                  right: 'setBackground',
                  left: 'setBackground',
                  leftGroup: 'method',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  leftGroup: 'static-method',
                  rightGroup: 'property',
                  left: 'setBackground',
                  right: 'a',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
            options: [options],
          },
        ],
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
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts private methods with hash`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'private-property',
                  left: '#aPrivateStaticMethod',
                  right: '#somePrivateProperty',
                  leftGroup: 'static-method',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  right: '#someOtherPrivateProperty',
                  left: '#somePrivateProperty',
                },
                messageId: 'unexpectedClassesOrder',
              },
              {
                data: {
                  left: '#someOtherPrivateProperty',
                  leftGroup: 'private-property',
                  rightGroup: 'static-property',
                  right: 'someStaticProperty',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  right: '#someStaticPrivateProperty',
                  left: 'someStaticProperty',
                },
                messageId: 'unexpectedClassesOrder',
              },
              {
                data: {
                  right: '#aPrivateInstanceMethod',
                  rightGroup: 'private-method',
                  leftGroup: 'static-method',
                  left: 'aStaticMethod',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts decorated properties`, rule, {
      invalid: [
        {
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
            }
          `,
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
            }
          `,
          errors: [
            {
              data: {
                leftGroup: 'decorated-property',
                rightGroup: 'property',
                right: 'lastName',
                left: 'email',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
          options: [
            {
              ...options,
              groups: ['property', 'decorated-property', 'unknown'],
            },
          ],
        },
        {
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
            }
          `,
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
            }
          `,
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
              data: {
                rightGroup: 'decorated-set-method',
                leftGroup: 'set-method',
                left: 'message',
                right: 'prop',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}(${type}): sorts decorated accessors`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                left: 'customLastGroupProperty',
                leftGroup: 'my-last-group',
                rightGroup: 'property',
                right: 'id',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                right: 'customFirstGroupProperty',
                rightGroup: 'my-first-group',
                leftGroup: 'constructor',
                left: 'constructor',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                rightGroup: 'private-decorated-accessor-property',
                leftGroup: 'decorated-method',
                right: '#active',
                left: 'toggle',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                leftGroup: 'private-decorated-accessor-property',
                rightGroup: 'decorated-accessor-property',
                right: 'finished',
                left: '#active',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
          options: [
            {
              ...options,
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
              customGroups: [
                {
                  elementNamePattern: 'customFirst',
                  groupName: 'my-first-group',
                },
                {
                  elementNamePattern: 'customLast',
                  groupName: 'my-last-group',
                },
              ],
            },
          ],
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

            }
          `,
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

            }
          `,
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}(${type}): should ignore unknown group`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                rightGroup: 'private-method',
                leftGroup: 'property',
                right: 'z',
                left: 'i',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                rightGroup: 'private-method',
                leftGroup: 'unknown',
                left: 'method3',
                right: 'y',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                rightGroup: 'private-method',
                leftGroup: 'unknown',
                left: 'method1',
                right: 'x',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
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
          options: [
            {
              ...options,
              groups: ['private-method', 'property'],
            },
          ],
        },
      ],
      valid: [],
    })

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
                messageId: 'unexpectedClassesOrder',
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
              class Class {
                bb: string;
                c: string;
                a: string;
              }
            `,
            code: dedent`
              class Class {
                a: string;
                bb: string;
                c: string;
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
                messageId: 'unexpectedClassesOrder',
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
              class Class {
                bb: string;
                a: string;
                c: string;
              }
            `,
            code: dedent`
              class Class {
                c: string;
                bb: string;
                a: string;
              }
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
                  modifiers: ['private'],
                  selector: 'property',
                },
                {
                  groupName: 'privatePropertyGroup',
                  modifiers: ['private'],
                  selector: 'property',
                },
                {
                  groupName: 'propertyGroup',
                  selector: 'property',
                },
              ],
              groups: ['propertyGroup', 'constructor', 'privatePropertyGroup'],
            },
          ],
          errors: [
            {
              data: {
                leftGroup: 'privatePropertyGroup',
                rightGroup: 'propertyGroup',
                right: 'c',
                left: 'b',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
          output: dedent`
            class Class {
              c;
              constructor() {}
              private a;
              private b;
            }
          `,
          code: dedent`
            class Class {
              private a;
              private b;
              c;
              constructor() {}
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
            errors: [
              {
                data: {
                  rightGroup: 'constructor',
                  leftGroup: 'unknown',
                  right: 'constructor',
                  left: 'b',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  rightGroup: 'propertiesStartingWithHello',
                  right: 'helloProperty',
                  leftGroup: 'unknown',
                  left: 'method',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
            options: [
              {
                customGroups: [
                  {
                    groupName: 'propertiesStartingWithHello',
                    selector: 'property',
                    elementNamePattern,
                  },
                ],
                groups: [
                  'propertiesStartingWithHello',
                  'constructor',
                  'unknown',
                ],
              },
            ],
            output: dedent`
              class Class {
                helloProperty;

                constructor() {}

                a;

                b;

                method() {}
              }
            `,
            code: dedent`
              class Class {
                a;

                b;

                constructor() {}

                method() {}

                helloProperty;
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
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
            output: dedent`
              class Class {
                a = computed(A)
                z = computed(Z)
                b = inject(B)
                y = inject(Y)
                c() {}
              }
            `,
            code: dedent`
              class Class {
                a = computed(A)
                b = inject(B)
                y = inject(Y)
                z = computed(Z)
                c() {}
              }
            `,
          },
        ],
        valid: [],
      })
    }

    for (let decoratorNamePattern of [
      'Hello',
      ['noMatch', 'Hello'],
      { pattern: 'HELLO', flags: 'i' },
      ['noMatch', { pattern: 'HELLO', flags: 'i' }],
    ]) {
      ruleTester.run(`${ruleName}: filters on decoratorNamePattern`, rule, {
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'constructor',
                  leftGroup: 'unknown',
                  right: 'constructor',
                  left: 'b',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  rightGroup: 'propertiesWithDecoratorStartingWithHello',
                  leftGroup: 'unknown',
                  right: 'property',
                  left: 'method',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  right: 'anotherProperty',
                  left: 'property',
                },
                messageId: 'unexpectedClassesOrder',
              },
            ],
            options: [
              {
                customGroups: [
                  {
                    groupName: 'propertiesWithDecoratorStartingWithHello',
                    decoratorNamePattern,
                    selector: 'property',
                  },
                ],
                groups: [
                  'propertiesWithDecoratorStartingWithHello',
                  'constructor',
                  'unknown',
                ],
              },
            ],
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
          },
        ],
        valid: [],
      })
    }

    ruleTester.run(
      `${ruleName}: filters on complex decoratorNamePattern`,
      rule,
      {
        invalid: [
          {
            options: [
              {
                customGroups: [
                  {
                    decoratorNamePattern: 'B',
                    groupName: 'B',
                  },
                  {
                    decoratorNamePattern: 'A',
                    groupName: 'A',
                  },
                ],
                type: 'alphabetical',
                groups: ['B', 'A'],
                order: 'asc',
              },
            ],
            errors: [
              {
                data: {
                  rightGroup: 'B',
                  leftGroup: 'A',
                  right: 'b',
                  left: 'a',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
            output: dedent`
              class Class {
                @B.B()
                b() {}

                @A.A.A(() => A)
                a() {}
              }
            `,
            code: dedent`
              class Class {
                @A.A.A(() => A)
                a() {}

                @B.B()
                b() {}
              }
            `,
          },
        ],
        valid: [],
      },
    )

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
                messageId: 'unexpectedClassesOrder',
              },
              {
                data: {
                  right: 'ccc',
                  left: 'bb',
                },
                messageId: 'unexpectedClassesOrder',
              },
              {
                data: {
                  right: 'dddd',
                  left: 'ccc',
                },
                messageId: 'unexpectedClassesOrder',
              },
              {
                data: {
                  rightGroup: 'reversedPropertiesByLineLength',
                  leftGroup: 'unknown',
                  left: 'method',
                  right: 'eee',
                },
                messageId: 'unexpectedClassesGroupOrder',
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
                groups: [
                  'reversedPropertiesByLineLength',
                  'constructor',
                  'unknown',
                ],
                type: 'alphabetical',
                order: 'asc',
              },
            ],
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
                messageId: 'unexpectedClassesOrder',
              },
            ],
            output: dedent`
              class Class {
                fooBar: string
                fooZar: string
              }
            `,
            code: dedent`
              class Class {
                fooZar: string
                fooBar: string
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
            errors: [
              {
                data: {
                  rightGroup: 'unsortedProperties',
                  leftGroup: 'constructor',
                  left: 'constructor',
                  right: 'd',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
              {
                data: {
                  rightGroup: 'unsortedProperties',
                  leftGroup: 'unknown',
                  left: 'method',
                  right: 'c',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
            options: [
              {
                customGroups: [
                  {
                    groupName: 'unsortedProperties',
                    selector: 'property',
                    type: 'unsorted',
                  },
                ],
                groups: ['unsortedProperties', 'constructor', 'unknown'],
              },
            ],
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
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(`${ruleName}: sort custom group blocks`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                rightGroup: 'privatePropertiesAndProtectedMethods',
                leftGroup: 'unknown',
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                rightGroup: 'privatePropertiesAndProtectedMethods',
                leftGroup: 'unknown',
                left: 'method',
                right: 'c',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                rightGroup: 'privatePropertiesAndProtectedMethods',
                right: 'anotherProtectedMethod',
                leftGroup: 'unknown',
                left: 'd',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
          options: [
            {
              customGroups: [
                {
                  anyOf: [
                    {
                      modifiers: ['private'],
                      selector: 'property',
                    },
                    {
                      modifiers: ['protected'],
                      selector: 'method',
                    },
                  ],
                  groupName: 'privatePropertiesAndProtectedMethods',
                },
              ],
              groups: [
                [
                  'privatePropertiesAndProtectedMethods',
                  'decorated-protected-property',
                ],
                'constructor',
                'unknown',
              ],
            },
          ],
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
              class Class {
                iHaveFooInMyName: string
                meTooIHaveFoo: string
                a: string
                b: string
              }
            `,
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
            options: [
              {
                customGroups: [
                  {
                    elementValuePattern: '^(?!.*Foo).*$',
                    groupName: 'elementsWithoutFoo',
                  },
                ],
                groups: ['unknown', 'elementsWithoutFoo'],
                type: 'alphabetical',
              },
            ],
            code: dedent`
              class Class {
                x = "iHaveFooInMyName"
                z = "MeTooIHaveFoo"
                a = "a"
                b = "b"
              }
            `,
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
            options: [
              {
                customGroups: [
                  {
                    decoratorNamePattern: '^.*Foo.*$',
                    groupName: 'decoratorsWithFoo',
                  },
                ],
                groups: ['decoratorsWithFoo', 'unknown'],
                type: 'alphabetical',
              },
            ],
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
          },
        ],
        invalid: [],
      },
    )

    describe('newlinesInside', () => {
      for (let newlinesInside of ['always', 1] as const) {
        ruleTester.run(
          `${ruleName}: allows to use newlinesInside: "${newlinesInside}"`,
          rule,
          {
            invalid: [
              {
                errors: [
                  {
                    data: {
                      right: 'c',
                      left: 'b',
                    },
                    messageId: 'missedSpacingBetweenClassMembers',
                  },
                  {
                    data: {
                      right: 'd',
                      left: 'c',
                    },
                    messageId: 'extraSpacingBetweenClassMembers',
                  },
                ],
                options: [
                  {
                    customGroups: [
                      {
                        groupName: 'methodsWithNewlinesInside',
                        selector: 'method',
                        newlinesInside,
                      },
                    ],
                    groups: ['unknown', 'methodsWithNewlinesInside'],
                  },
                ],
                output: dedent`
                  class Class {
                    a
                    b() {}

                    c() {}

                    d() {}
                  }
                `,
                code: dedent`
                  class Class {
                    a
                    b() {}
                    c() {}


                    d() {}
                  }
                `,
              },
            ],
            valid: [],
          },
        )
      }

      for (let newlinesInside of ['never', 0] as const) {
        ruleTester.run(
          `${ruleName}: allows to use newlinesInside: "${newlinesInside}"`,
          rule,
          {
            invalid: [
              {
                options: [
                  {
                    customGroups: [
                      {
                        groupName: 'methodsWithoutNewlinesInside',
                        selector: 'method',
                        newlinesInside,
                      },
                    ],
                    groups: ['unknown', 'methodsWithoutNewlinesInside'],
                  },
                ],
                errors: [
                  {
                    data: {
                      right: 'd',
                      left: 'c',
                    },
                    messageId: 'extraSpacingBetweenClassMembers',
                  },
                ],
                output: dedent`
                  class Class {
                    a

                    c() {}
                    d() {}
                  }
                `,
                code: dedent`
                  class Class {
                    a

                    c() {}

                    d() {}
                  }
                `,
              },
            ],
            valid: [],
          },
        )
      }

      for (let newlinesInside of ['always', 1, 'never', 0] as const) {
        ruleTester.run(
          `${ruleName}: enforces no newline between overload signatures when newlinesBetween is "${newlinesInside}"`,
          rule,
          {
            invalid: [
              {
                errors: [
                  {
                    data: {
                      right: 'method',
                      left: 'method',
                    },
                    messageId: 'extraSpacingBetweenClassMembers',
                  },
                  {
                    data: {
                      right: 'method',
                      left: 'method',
                    },
                    messageId: 'extraSpacingBetweenClassMembers',
                  },
                ],
                options: [
                  {
                    customGroups: [
                      {
                        groupName: 'methods',
                        selector: 'method',
                        newlinesInside,
                      },
                    ],
                    groups: ['methods'],
                  },
                ],
                output: dedent`
                  class Class {
                    method(a: string): void {}
                    method(a: number): void {}
                    method(a: string | number): void {}
                  }
                `,
                code: dedent`
                  class Class {
                    method(a: string): void {}

                    method(a: number): void {}

                    method(a: string | number): void {}
                  }
                `,
              },
            ],
            valid: [],
          },
        )
      }
    })
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
            class Class {
              b
              c
              a
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
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
          output: dedent`
            class Class {
              ba
              bb
              ab
              aa
            }
          `,
          code: dedent`
            class Class {
              ab
              aa
              ba
              bb
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
              messageId: 'missedSpacingBetweenClassMembers',
            },
          ],
          output: dedent`
            class Class {
              b

              a
            }
          `,
          code: dedent`
            class Class {
              b
              a
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
              messageId: 'unexpectedClassesDependencyOrder',
            },
          ],
          output: dedent`
            class Class {
              b
              a = this.b
            }
          `,
          code: dedent`
            class Class {
              a = this.b
              b
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
            errors: [
              {
                data: {
                  right: 'log10',
                  left: 'log1p',
                },
                messageId: 'unexpectedClassesOrder',
              },
            ],
          },
        ],
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
      },
    )

    ruleTester.run(`${ruleName}: sorts using default groups`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                rightGroup: 'protected-method',
                leftGroup: 'private-method',
                right: 'protectedMethod',
                left: 'privateMethod',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                leftGroup: 'protected-method',
                left: 'protectedMethod',
                right: 'publicMethod',
                rightGroup: 'method',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                rightGroup: 'private-static-method',
                right: 'privateStaticMethod',
                left: 'publicMethod',
                leftGroup: 'method',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                rightGroup: 'protected-static-method',
                leftGroup: 'private-static-method',
                right: 'protectedStaticMethod',
                left: 'privateStaticMethod',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                leftGroup: 'protected-static-method',
                left: 'protectedStaticMethod',
                right: 'publicStaticMethod',
                rightGroup: 'static-method',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                left: 'publicStaticMethod',
                leftGroup: 'static-method',
                rightGroup: 'constructor',
                right: 'constructor',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                rightGroup: 'private-property',
                leftGroup: 'constructor',
                right: 'privateProperty',
                left: 'constructor',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                right: 'privateAccessorProperty',
                left: 'privateProperty',
              },
              messageId: 'unexpectedClassesOrder',
            },
            {
              data: {
                leftGroup: 'private-accessor-property',
                rightGroup: 'protected-property',
                left: 'privateAccessorProperty',
                right: 'protectedProperty',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                leftGroup: 'protected-property',
                left: 'protectedProperty',
                right: 'publicProperty',
                rightGroup: 'property',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                right: 'publicAccessorProperty',
                left: 'publicProperty',
              },
              messageId: 'unexpectedClassesOrder',
            },
            {
              data: {
                right: 'publicGetMethod',
                left: 'publicSetMethod',
              },
              messageId: 'unexpectedClassesOrder',
            },
            {
              data: {
                leftGroup: 'protected-accessor-property',
                left: 'protectedAccessorProperty',
                rightGroup: 'static-block',
                right: 'static',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                rightGroup: 'private-static-property',
                right: 'privateStaticProperty',
                leftGroup: 'static-block',
                left: 'static',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                rightGroup: 'protected-static-property',
                leftGroup: 'private-static-property',
                right: 'protectedStaticProperty',
                left: 'privateStaticProperty',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                leftGroup: 'protected-static-property',
                left: 'protectedStaticProperty',
                right: 'publicStaticProperty',
                rightGroup: 'static-property',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
            {
              data: {
                rightGroup: 'index-signature',
                left: 'publicStaticProperty',
                leftGroup: 'static-property',
                right: '[key: string]',
              },
              messageId: 'unexpectedClassesGroupOrder',
            },
          ],
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
        },
      ],
      valid: [],
    })

    describe('handles complex comment cases', () => {
      ruleTester.run(`keeps comments associated to their node`, rule, {
        invalid: [
          {
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
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedClassesOrder',
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

      describe('partition comments', () => {
        ruleTester.run(`handles partition comments`, rule, {
          invalid: [
            {
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
              errors: [
                {
                  data: {
                    right: 'b',
                    left: 'c',
                  },
                  messageId: 'unexpectedClassesOrder',
                },
                {
                  data: {
                    right: 'a',
                    left: 'd',
                  },
                  messageId: 'unexpectedClassesOrder',
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
                    partitionByComment: ['^(?!.*foo).*$'],
                    type: 'alphabetical',
                  },
                ],
              },
            ],
            invalid: [],
          },
        )

        describe(`${ruleName}: allows to use "partitionByComment.line"`, () => {
          ruleTester.run(`${ruleName}: ignores block comments`, rule, {
            invalid: [
              {
                errors: [
                  {
                    data: {
                      right: 'a',
                      left: 'b',
                    },
                    messageId: 'unexpectedClassesOrder',
                  },
                ],
                output: dedent`
                  class Class {
                    /* Comment */
                    a() {}
                    b() {}
                  }
                `,
                code: dedent`
                  class Class {
                    b() {}
                    /* Comment */
                    a() {}
                  }
                `,
                options: [
                  {
                    partitionByComment: {
                      line: true,
                    },
                  },
                ],
              },
            ],
            valid: [],
          })

          ruleTester.run(
            `${ruleName}: allows to use all comments as parts`,
            rule,
            {
              valid: [
                {
                  options: [
                    {
                      partitionByComment: {
                        line: true,
                      },
                    },
                  ],
                  code: dedent`
                    class Class {
                      b() {}
                      // Comment
                      a() {}
                    }
                  `,
                },
              ],
              invalid: [],
            },
          )

          ruleTester.run(
            `${ruleName}: allows to use multiple partition comments`,
            rule,
            {
              valid: [
                {
                  code: dedent`
                    class Class {
                      c() {}
                      // b
                      b() {}
                      // a
                      a() {}
                    }
                  `,
                  options: [
                    {
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
            `${ruleName}: allows to use regex for partition comments`,
            rule,
            {
              valid: [
                {
                  code: dedent`
                    class Class {
                      b() {}
                      // I am a partition comment because I don't have f o o
                      a() {}
                    }
                  `,
                  options: [
                    {
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

        describe(`${ruleName}: allows to use "partitionByComment.block"`, () => {
          ruleTester.run(`${ruleName}: ignores line comments`, rule, {
            invalid: [
              {
                errors: [
                  {
                    data: {
                      right: 'a',
                      left: 'b',
                    },
                    messageId: 'unexpectedClassesOrder',
                  },
                ],
                output: dedent`
                  class Class {
                    // Comment
                    a() {}
                    b() {}
                  }
                `,
                options: [
                  {
                    partitionByComment: {
                      block: true,
                    },
                  },
                ],
                code: dedent`
                  class Class {
                    b() {}
                    // Comment
                    a() {}
                  }
                `,
              },
            ],
            valid: [],
          })

          ruleTester.run(
            `${ruleName}: allows to use all comments as parts`,
            rule,
            {
              valid: [
                {
                  code: dedent`
                    class Class {
                      b() {}
                      /* Comment */
                      a() {}
                    }
                  `,
                  options: [
                    {
                      partitionByComment: {
                        block: true,
                      },
                    },
                  ],
                },
              ],
              invalid: [],
            },
          )

          ruleTester.run(
            `${ruleName}: allows to use multiple partition comments`,
            rule,
            {
              valid: [
                {
                  code: dedent`
                    class Class {
                      c() {}
                      /* b */
                      b() {}
                      /* a */
                      a() {}
                    }
                  `,
                  options: [
                    {
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
            `${ruleName}: allows to use regex for partition comments`,
            rule,
            {
              valid: [
                {
                  code: dedent`
                    class Class {
                      b() {}
                      /* I am a partition comment because I don't have f o o */
                      a() {}
                    }
                  `,
                  options: [
                    {
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
      })

      ruleTester.run(`${ruleName}: allows to use new line as partition`, rule, {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'd',
                  left: 'e',
                },
                messageId: 'unexpectedClassesOrder',
              },
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedClassesOrder',
              },
            ],
            output: dedent`
              class Class {
                d = 'dd'
                e = 'e'

                c = 'ccc'

                a = 'aaaaa'
                b = 'bbbb'
              }
            `,
            code: dedent`
              class Class {
                e = 'e'
                d = 'dd'

                c = 'ccc'

                b = 'bbbb'
                a = 'aaaaa'
              }
            `,
            options: [
              {
                partitionByNewLine: true,
              },
            ],
          },
        ],
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
      })
    })

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
              messageId: 'unexpectedClassesOrder',
            },
          ],
          output: dedent`
            class Class {
              b
              c
              // eslint-disable-next-line
              a
            }
          `,
          code: dedent`
            class Class {
              c
              b
              // eslint-disable-next-line
              a
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
              messageId: 'unexpectedClassesOrder',
            },
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedClassesOrder',
            },
          ],
          output: dedent`
            class Class {
              b
              c
              // eslint-disable-next-line
              a
              d
            }
          `,
          code: dedent`
            class Class {
              d
              c
              // eslint-disable-next-line
              a
              b
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
              messageId: 'unexpectedClassesOrder',
            },
          ],
          output: dedent`
            class Class {
              b = this.a
              c
              // eslint-disable-next-line
              a
            }
          `,
          code: dedent`
            class Class {
              c
              b = this.a
              // eslint-disable-next-line
              a
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
              messageId: 'unexpectedClassesOrder',
            },
          ],
          output: dedent`
            class Class {
              b
              c
              a // eslint-disable-line
            }
          `,
          code: dedent`
            class Class {
              c
              b
              a // eslint-disable-line
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
              messageId: 'unexpectedClassesOrder',
            },
          ],
          output: dedent`
            class Class {
              b
              c
              /* eslint-disable-next-line */
              a
            }
          `,
          code: dedent`
            class Class {
              c
              b
              /* eslint-disable-next-line */
              a
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
              messageId: 'unexpectedClassesOrder',
            },
          ],
          output: dedent`
            class Class {
              b
              c
              a /* eslint-disable-line */
            }
          `,
          code: dedent`
            class Class {
              c
              b
              a /* eslint-disable-line */
            }
          `,
          options: [{}],
        },
        {
          output: dedent`
            class Class {
              a
              d
              /* eslint-disable */
              c
              b
              // Shouldn't move
              /* eslint-enable */
              e
            }
          `,
          code: dedent`
            class Class {
              d
              e
              /* eslint-disable */
              c
              b
              // Shouldn't move
              /* eslint-enable */
              a
            }
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedClassesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            class Class {
              b
              c
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              a
            }
          `,
          code: dedent`
            class Class {
              c
              b
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              a
            }
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedClassesOrder',
            },
          ],
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedClassesOrder',
            },
          ],
          output: dedent`
            class Class {
              b
              c
              a // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            }
          `,
          code: dedent`
            class Class {
              c
              b
              a // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            }
          `,
          options: [{}],
        },
        {
          output: dedent`
            class Class {
              b
              c
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              a
            }
          `,
          code: dedent`
            class Class {
              c
              b
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              a
            }
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedClassesOrder',
            },
          ],
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedClassesOrder',
            },
          ],
          output: dedent`
            class Class {
              b
              c
              a /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            }
          `,
          code: dedent`
            class Class {
              c
              b
              a /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            }
          `,
          options: [{}],
        },
        {
          output: dedent`
            class Class {
              a
              d
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              c
              b
              // Shouldn't move
              /* eslint-enable */
              e
            }
          `,
          code: dedent`
            class Class {
              d
              e
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              c
              b
              // Shouldn't move
              /* eslint-enable */
              a
            }
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedClassesOrder',
            },
          ],
          options: [{}],
        },
      ],
      valid: [
        {
          code: dedent`
            class Class {
              b
              c
              // eslint-disable-next-line
              a
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
              class A {

                static {}

                b
                a = this.b

                constructor() {}

                method() {}
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
