import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-classes'

type ParsedProgram = ReturnType<typeof typescriptParser.parseForESLint>['ast']

function injectUnknownClassElement({
  elementToMarkAsUnknown,
  code,
  ast,
}: {
  elementToMarkAsUnknown: string
  ast: ParsedProgram
  code: string
}): void {
  let classDeclaration = ast.body.find(node => node.type === 'ClassDeclaration')
  if (!classDeclaration) {
    throw new Error('No class declaration found')
  }

  let { body: classBody } = classDeclaration
  let matchingNodeIndex = classBody.body.findIndex(
    node => code.slice(node.range[0], node.range[1]) === elementToMarkAsUnknown,
  )
  if (matchingNodeIndex < 0) {
    throw new Error(
      `No class element found with content "${elementToMarkAsUnknown}".`,
    )
  }

  classBody.body[matchingNodeIndex] = {
    type: 'GlimmerTemplate',
  } as unknown as (typeof classBody.body)[number]
}

let unknownClassElementParser = {
  ...typescriptParser,
  parseForESLint(
    code: string,
    parserOptions?: Parameters<typeof typescriptParser.parseForESLint>[1] & {
      elementToMarkAsUnknown: string
    },
  ) {
    if (!parserOptions?.elementToMarkAsUnknown) {
      throw new Error('parserOptions.elementToMarkAsUnknown option is required')
    }
    let result = typescriptParser.parseForESLint(code, parserOptions)
    injectUnknownClassElement({
      elementToMarkAsUnknown: parserOptions.elementToMarkAsUnknown,
      ast: result.ast,
      code,
    })
    return result
  },
}

describe('sort-classes', () => {
  let { valid: validEspree } = createRuleTester({
    name: 'sort-classes (espree)',
    rule,
  })
  let { invalid, valid } = createRuleTester({
    parser: typescriptParser,
    name: 'sort-classes',
    rule,
  })
  let {
    invalid: invalidWithUnknownClassElement,
    valid: validWithUnknownClassElement,
  } = createRuleTester({
    name: 'sort-classes (unknown class element)',
    parser: unknownClassElementParser,
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('sorts class members', async () => {
      await valid({
        code: dedent`
          class Class {
            a
          }
        `,
        options: [options],
      })

      await valid({
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
      })

      await invalid({
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
            data: { right: 'd', left: 'e' },
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
      })
    })

    it('sorts complex official groups', async () => {
      await invalid({
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
            messageId: 'unexpectedClassesOrder',
            data: { right: 'm', left: 'n' },
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
      })
    })

    it('prioritizes selectors over modifiers quantity', async () => {
      await invalid({
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
      })
    })

    it('prioritizes static over readonly', async () => {
      await invalid({
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
      })
    })

    it('prioritizes constructor over method', async () => {
      await invalid({
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
      })
    })

    it('prioritizes get-method over method', async () => {
      await invalid({
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
      })
    })

    it('prioritizes set-method over method', async () => {
      await invalid({
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
      })
    })

    it('prioritizes static over override', async () => {
      await invalid({
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
      })
    })

    it('prioritizes abstract over override', async () => {
      await invalid({
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
      })
    })

    it('prioritizes decorated over override', async () => {
      await invalid({
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
      })
    })

    it.each([
      ['public', 'public'],
      ['protected', 'protected'],
      ['private', 'private'],
    ])(
      'prioritizes override over %s accessibility',
      async (_name, accessibilityModifier) => {
        await invalid({
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
        })
      },
    )

    it.each([
      ['public', 'public'],
      ['protected', 'protected'],
      ['private', 'private'],
    ])(
      'prioritizes %s accessibility over optional',
      async (_name, accessibilityModifier) => {
        await invalid({
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
        })
      },
    )

    it('prioritizes optional over async', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'optional-method',
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
            groups: ['optional-method', 'property', 'async-method'],
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
      })
    })

    it('prioritizes static over override for accessor properties', async () => {
      await invalid({
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
      })
    })

    it('prioritizes abstract over override for accessor properties', async () => {
      await invalid({
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
      })
    })

    it('prioritizes decorated over override for accessor properties', async () => {
      await invalid({
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
      })
    })

    it.each([
      ['public', 'public'],
      ['protected', 'protected'],
      ['private', 'private'],
    ])(
      'prioritizes override over %s accessibility for accessor properties',
      async (_name, accessibilityModifier) => {
        await invalid({
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
        })
      },
    )

    it('prioritizes function property over property', async () => {
      await invalid({
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
      })
    })

    it('prioritizes function property over property for arrow functions', async () => {
      await invalid({
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
      })
    })

    it('prioritizes static over declare', async () => {
      await invalid({
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
      })
    })

    it('prioritizes declare over abstract', async () => {
      await invalid({
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
      })
    })

    it('prioritizes abstract over override for properties', async () => {
      await invalid({
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
      })
    })

    it('prioritizes decorated over override for properties', async () => {
      await invalid({
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
      })
    })

    it('prioritizes override over readonly', async () => {
      await invalid({
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
      })
    })

    it.each([
      ['public', 'public'],
      ['protected', 'protected'],
      ['private', 'private'],
    ])(
      'prioritizes readonly over %s accessibility',
      async (_name, accessibilityModifier) => {
        await invalid({
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
        })
      },
    )

    it.each([
      ['public', 'public'],
      ['protected', 'protected'],
      ['private', 'private'],
    ])(
      'prioritizes %s accessibility over optional for properties',
      async (_name, accessibilityModifier) => {
        await invalid({
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
        })
      },
    )

    it('prioritizes optional over async for properties', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'optional-property',
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
            groups: ['optional-property', 'method', 'async-property'],
          },
        ],
      })
    })

    it('sorts class and group members', async () => {
      await valid({
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
      })

      await invalid({
        errors: [
          {
            data: {
              left: 'key in O',
              right: 'b',
            },
            messageId: 'unexpectedClassesOrder',
          },
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })
    })

    it('sorts class with attributes having the same name', async () => {
      await invalid({
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
      })
    })

    it('sorts class with ts index signatures', async () => {
      await valid({
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
      })

      await invalid({
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
      })
    })

    it('allows multiple method signatures', async () => {
      await valid({
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
            groups: ['unknown'],
          },
        ],
      })
    })

    it('sorts private methods with hash', async () => {
      await invalid({
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
      })
    })

    it('allows split methods with getters and setters', async () => {
      await invalid({
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
            data: { right: 'b', left: 'x' },
          },
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'c', left: 'z' },
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
      })
    })

    it('sorts decorated properties', async () => {
      await invalid({
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
      })

      await invalid({
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
      })
    })

    it('sorts decorated accessors', async () => {
      await invalid({
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
      })
    })

    it('sorts class members with partition comments', async () => {
      await valid({
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
      })

      await invalid({
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
        errors: [
          {
            data: { right: 'onSortChanged', left: 'updateTable' },
            messageId: 'unexpectedClassesOrder',
          },
          {
            data: { right: 'onPaginationChanged', left: 'onSortChanged' },
            messageId: 'unexpectedClassesOrder',
          },
          {
            data: { right: 'onValueChanged', left: 'setFormValue' },
            messageId: 'unexpectedClassesOrder',
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: 'Region:',
          },
        ],
      })
    })

    function testDependencyDetection(
      useExperimentalDependencyDetection: boolean,
    ): void {
      describe(`experimental dependency detection: ${useExperimentalDependencyDetection}`, () => {
        it('does not sort properties if the right value depends on the left value', async () => {
          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              class Class {
                b = 'b'

                aaa = [this.b]
              }
            `,
          })

          await valid({
            code: dedent`
              class Class {
                b = 'b'

                getAaa() {
                  return this.b;
                }
              }
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
              class Class {
                static c = 'c'

                b = Example.c
              }
            `,
          })

          await valid({
            code: dedent`
              class Class {
                #b = 'b'

                getAaa() {
                  return this.#b;
                }
              }
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
              class Class {
                static b = 'b'

                static getAaa() {
                  return this.b;
                }
              }
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
                data: { nodeDependentOnRight: 'aaa', right: 'b' },
                messageId: 'unexpectedClassesDependencyOrder',
              },
            ],
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
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
          })

          await invalid({
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
                data: {
                  rightGroup: 'static-property',
                  leftGroup: 'property',
                  right: 'c',
                  left: 'b',
                },
                messageId: 'unexpectedClassesGroupOrder',
              },
            ],
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
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
          })

          await invalid({
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
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
          })
        })

        it('ignores function expression dependencies', async () => {
          await valid({
            code: dedent`
              class MyClass {
                a = () => this.b()
                b = () => null
              }
            `,
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
          })
        })

        it('detects function property dependencies', async () => {
          await valid({
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
                useExperimentalDependencyDetection,
                groups: [['property', 'method']],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: [['property', 'method']],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: [['property', 'method']],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: [['property', 'method']],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: [['property', 'method']],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: [['property', 'method']],
              },
            ],
          })

          await valid({
            code: dedent`
              class Class {
                b = createQueryString();
                a = createState((set) => {
                    set('query', this.b.value);
                 });
              }
            `,
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
                groups: [['property', 'method']],
              },
            ],
          })

          await valid({
            code: dedent`
              class Class {
                b = function () {
                  return 1
                }
                a = [1].map(this["b"]);
              }
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
              class Class {
                ["b"] = function () {
                  return 1
                }
                a = [1].map(this.b);
              }
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
              class Class {
                ['b'] = function () {
                  return 1
                }
                a = [1].map(this.b);
              }
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
              class Class {
                ["'b'"] = function () {
                  return 1
                }
                a = [1].map(this["'b'"]);
              }
            `,
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
          })
        })

        it('detects static block dependencies', async () => {
          await valid({
            code: dedent`
              class Class {
                static z1;
                static z2;
                static z3;
                static z4;
                static ['z5'];
                static ['z6'];
                static ['z7'];
                static ['z8'];

                static {
                  this.z1;
                  Class.z2;
                  this['z3'];
                  Class['z4'];
                  this.z5
                  Class.z6
                  this['z7'];
                  Class['z8'];
                }
              }
            `,
            options: [
              {
                ...options,
                groups: [['static-block', 'static-property']],
                useExperimentalDependencyDetection,
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
              },
            ],
          })
        })

        it('detects property expression dependencies', async () => {
          await invalid({
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: { right: 'd', left: 'e' },
              },
              {
                messageId: 'unexpectedClassesOrder',
                data: { right: 'a', left: 'd' },
              },
              {
                data: { nodeDependentOnRight: 'd', right: 'b' },
                messageId: 'unexpectedClassesDependencyOrder',
              },
              {
                data: { nodeDependentOnRight: 'e', right: 'c' },
                messageId: 'unexpectedClassesDependencyOrder',
              },
              {
                data: { nodeDependentOnRight: 'b', right: 'z' },
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })
        })

        it('detects dependencies in objects', async () => {
          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })
        })

        it('detects nested property references', async () => {
          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
              },
            ],
          })
        })

        it('detects optional chained dependencies', async () => {
          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })
        })

        it('detects non-null asserted dependencies', async () => {
          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })
        })

        it('detects unary dependencies', async () => {
          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })
        })

        it('detects spread elements dependencies', async () => {
          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })
        })

        it('detects dependencies in conditional expressions', async () => {
          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })
        })

        it("detects dependencies in 'as' expressions", async () => {
          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })
        })

        it('detects dependencies in type assertion expressions', async () => {
          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })
        })

        it('detects dependencies in template literal expressions', async () => {
          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })

          await valid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })
        })

        it('detects # dependencies', async () => {
          await valid({
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
                useExperimentalDependencyDetection,
              },
            ],
          })

          await valid({
            code: dedent`
              class Class {
               static #b = () => 1
               static #a = this.#b()
              }
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
                groups: ['unknown'],
              },
            ],
            code: dedent`
              class Class {
               static #a = this.#b()
               static #b() {}
              }
            `,
          })
        })

        it('separates static from non-static dependencies', async () => {
          await valid({
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
            code: dedent`
              export class Class{
                b = 1;
                a = this.b;
                static b = 1;
              }
            `,
          })

          await invalid({
            errors: [
              {
                data: { nodeDependentOnRight: 'b', right: 'c' },
                messageId: 'unexpectedClassesDependencyOrder',
              },
              {
                data: { nodeDependentOnRight: 'a', right: 'c' },
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
          })
        })

        it('detects and ignores circular dependencies', async () => {
          await invalid({
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
                useExperimentalDependencyDetection,
                groups: ['property'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedClassesOrder',
                data: { right: 'a', left: 'b' },
              },
            ],
          })
        })

        it('ignores function body dependencies', async () => {
          await valid({
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
                useExperimentalDependencyDetection,
                groups: [['method', 'property']],
              },
            ],
          })
        })

        it('prioritizes dependencies over group configuration', async () => {
          await valid({
            options: [
              {
                ...options,
                groups: ['private-property', 'public-property'],
                useExperimentalDependencyDetection,
              },
            ],
            code: dedent`
              class Class {
                public b = 1;
                private a = this.b;
              }
            `,
          })
        })

        it('prioritizes dependencies over partitionByComment', async () => {
          await invalid({
            errors: [
              {
                data: { nodeDependentOnRight: 'b', right: 'a' },
                messageId: 'unexpectedClassesDependencyOrder',
              },
            ],
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
                partitionByComment: 'Part',
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
          })
        })

        it('prioritizes dependencies over partitionByNewLine', async () => {
          await invalid({
            errors: [
              {
                data: { nodeDependentOnRight: 'b', right: 'a' },
                messageId: 'unexpectedClassesDependencyOrder',
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
          })
        })

        it('works with left and right dependencies', async () => {
          await valid({
            code: dedent`
              class Class {
                left = 'left'
                right = 'right'

                aaa = this.left + this.right
              }
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
                data: { nodeDependentOnRight: 'aaa', right: 'left' },
                messageId: 'unexpectedClassesDependencyOrder',
              },
              {
                data: { nodeDependentOnRight: 'aaa', right: 'right' },
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
            options: [
              {
                ...options,
                useExperimentalDependencyDetection,
              },
            ],
          })
        })

        it.each([
          ['computed function pattern as string', '^computed$'],
          ['computed function pattern in array', ['noMatch', '^computed$']],
          [
            'computed function pattern as object',
            { pattern: '^COMPUTED$', flags: 'i' },
          ],
          [
            'computed function pattern as object in array',
            ['noMatch', { pattern: '^COMPUTED$', flags: 'i' }],
          ],
        ])(
          'ignores callback dependencies matching %s',
          async (_name, ignoreCallbackDependenciesPatterns) => {
            await valid({
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
                  useExperimentalDependencyDetection,
                },
              ],
            })

            await valid({
              code: dedent`
                class Class {
                  static a = computed(() => Class.c)
                  static c
                  static b = notComputed(() => Class.c)
                }
              `,
              options: [
                {
                  ignoreCallbackDependenciesPatterns,
                  useExperimentalDependencyDetection,
                },
              ],
            })
          },
        )
      })
    }
    testDependencyDetection(true)
    testDependencyDetection(false)

    it('ignores unknown group', async () => {
      await invalid({
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
      })

      await invalid({
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
      })
    })

    it('allows to trim special characters', async () => {
      await valid({
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
      })
    })

    it('allows to remove special characters', async () => {
      await valid({
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
      })
    })

    it('allows to use locale', async () => {
      await valid({
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
      })
    })

    it('removes newlines between and inside groups by default when "newlinesBetween" is 0', async () => {
      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenClassMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'b', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenClassMembers',
            data: { right: 'b', left: 'z' },
          },
        ],
        options: [
          {
            ...options,
            groups: ['method', 'unknown'],
            newlinesBetween: 0,
          },
        ],
        code: dedent`
          class Class {
            a() {}


           y = "y"
          z = "z"

              b = "b"
          }
        `,
        output: dedent`
          class Class {
            a() {}
           b = "b"
          y = "y"
              z = "z"
          }
        `,
      })
    })

    it('removes newlines inside groups when newlinesInside is 0', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'b', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenClassMembers',
            data: { right: 'b', left: 'z' },
          },
        ],
        options: [
          {
            ...options,
            groups: ['method', 'unknown'],
            newlinesInside: 0,
          },
        ],
        output: dedent`
          class Class {
            a() {}


           b = "b"
          y = "y"
              z = "z"
          }
        `,
        code: dedent`
          class Class {
            a() {}


           y = "y"
          z = "z"

              b = "b"
          }
        `,
      })
    })

    it('removes newlines between groups when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenClassMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'b', left: 'z' },
          },
        ],
        options: [
          {
            ...options,
            groups: ['method', 'unknown'],
            newlinesInside: 'ignore',
            newlinesBetween: 0,
          },
        ],
        code: dedent`
          class Class {
            a() {}


           y = "y"
          z = "z"

              b = "b"
          }
        `,
        output: dedent`
          class Class {
            a() {}
           b = "b"
          y = "y"

              z = "z"
          }
        `,
      })
    })

    it.each([1, 'ignore', 0])(
      'enforces 0 newline between overload signatures when newlinesBetween is %s',
      async newlinesBetween => {
        await invalid({
          errors: [
            {
              messageId: 'extraSpacingBetweenClassMembers',
              data: { right: 'method', left: 'method' },
            },
            {
              messageId: 'extraSpacingBetweenClassMembers',
              data: { right: 'method', left: 'method' },
            },
          ],
          output: dedent`
            class Class {
              method(a: string): void
              method(a: number): void
              method(a: string | number): void {}
            }
          `,
          code: dedent`
            class Class {
              method(a: string): void

              method(a: number): void

              method(a: string | number): void {}
            }
          `,
          options: [
            {
              ...options,
              newlinesBetween,
            },
          ],
        })
      },
    )

    it('distinguishes between static and non-static overload signatures', async () => {
      await invalid({
        output: dedent`
          class Class {
            static method(a: string): void
            static method(a: string | number): void {}

            method(a: string): void
            method(a: string | number): void {}
          }
        `,
        code: dedent`
          class Class {
            static method(a: string): void
            static method(a: string | number): void {}
            method(a: string): void
            method(a: string | number): void {}
          }
        `,
        errors: [
          {
            messageId: 'missedSpacingBetweenClassMembers',
            data: { right: 'method', left: 'method' },
          },
        ],
        options: [
          {
            ...options,
            newlinesBetween: 1,
          },
        ],
      })
    })

    it('handles "newlinesBetween" between consecutive groups', async () => {
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
            messageId: 'missedSpacingBetweenClassMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenClassMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenClassMembers',
            data: { right: 'd', left: 'c' },
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
      })
    })

    it.each([
      [2, 0],
      [2, 'ignore'],
      [0, 2],
      ['ignore', 2],
    ])(
      'enforces newlines if the global option is %s and the group option is %s',
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
              messageId: 'missedSpacingBetweenClassMembers',
              data: { right: 'b', left: 'a' },
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
        })
      },
    )

    it.each([1, 2, 'ignore', 0])(
      'enforces no newline if the global option is %s and "newlinesBetween: 0" exists between all groups',
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
              messageId: 'extraSpacingBetweenClassMembers',
              data: { right: 'b', left: 'a' },
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
        })
      },
    )

    it.each([
      ['ignore', 0],
      [0, 'ignore'],
    ])(
      'does not enforce a newline if the global option is %s and the group option is %s',
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
            class Class {
              a: string

              b: string
            }
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
            class Class {
              a: string
              b: string
            }
          `,
        })
      },
    )

    it('handles newlines and comment after fixes', async () => {
      await invalid({
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
        options: [
          {
            groups: ['property', 'method'],
            newlinesBetween: 1,
            newlinesInside: 0,
          },
        ],
        output: dedent`
          class Class {
            a // Comment after

            b() {}
            c() {}
          }
        `,
        code: dedent`
          class Class {
            b() {}
            a // Comment after

            c() {}
          }
        `,
      })
    })

    it('ignores newline fixes between different partitions when newlinesBetween is 0', async () => {
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
            messageId: 'unexpectedClassesOrder',
            data: { right: 'b', left: 'c' },
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
      })
    })

    it('sorts inline non-abstract methods correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })
    })

    it('sorts inline abstract methods correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })
    })

    it('sorts inline declare class methods correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })
    })

    it('sorts inline properties correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })
    })

    it('sorts inline accessors correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })
    })

    it('sorts inline index-signatures correctly', async () => {
      await invalid({
        errors: [
          {
            data: { right: '[key: number]', left: '[key: string]' },
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
      })

      await invalid({
        errors: [
          {
            data: { right: '[key: number]', left: '[key: string]' },
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
      })
    })

    it('sorts inline static-block correctly', async () => {
      await invalid({
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
      })
    })
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it('sorts class members', async () => {
      await valid({
        code: dedent`
          class Class {
            a
          }
        `,
        options: [options],
      })

      await valid({
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
      })

      await invalid({
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
            data: { right: 'd', left: 'e' },
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
      })
    })

    it('sorts complex official groups', async () => {
      await invalid({
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
            messageId: 'unexpectedClassesOrder',
            data: { right: 'm', left: 'n' },
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
      })
    })

    it('prioritizes selectors over modifiers quantity', async () => {
      await invalid({
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
      })
    })

    it('prioritizes static over readonly', async () => {
      await invalid({
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
      })
    })

    it('prioritizes constructor over method', async () => {
      await invalid({
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
      })
    })

    it('prioritizes get-method over method', async () => {
      await invalid({
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
      })
    })

    it('prioritizes set-method over method', async () => {
      await invalid({
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
      })
    })

    it('prioritizes static over override', async () => {
      await invalid({
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
      })
    })

    it('prioritizes abstract over override', async () => {
      await invalid({
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
      })
    })

    it('prioritizes decorated over override', async () => {
      await invalid({
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
      })
    })

    it.each([
      ['public', 'public'],
      ['protected', 'protected'],
      ['private', 'private'],
    ])(
      'prioritizes override over %s accessibility',
      async (_name, accessibilityModifier) => {
        await invalid({
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
        })
      },
    )

    it.each([
      ['public', 'public'],
      ['protected', 'protected'],
      ['private', 'private'],
    ])(
      'prioritizes %s accessibility over optional',
      async (_name, accessibilityModifier) => {
        await invalid({
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
        })
      },
    )

    it('prioritizes optional over async', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'optional-method',
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
            groups: ['optional-method', 'property', 'async-method'],
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
      })
    })

    it('prioritizes static over override for accessor properties', async () => {
      await invalid({
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
      })
    })

    it('prioritizes abstract over override for accessor properties', async () => {
      await invalid({
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
      })
    })

    it('prioritizes decorated over override for accessor properties', async () => {
      await invalid({
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
      })
    })

    it.each([
      ['public', 'public'],
      ['protected', 'protected'],
      ['private', 'private'],
    ])(
      'prioritizes override over %s accessibility for accessor properties',
      async (_name, accessibilityModifier) => {
        await invalid({
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
        })
      },
    )

    it('prioritizes function property over property', async () => {
      await invalid({
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
      })
    })

    it('prioritizes function property over property for arrow functions', async () => {
      await invalid({
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
      })
    })

    it('prioritizes static over declare', async () => {
      await invalid({
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
      })
    })

    it('prioritizes declare over abstract', async () => {
      await invalid({
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
      })
    })

    it('prioritizes abstract over override for properties', async () => {
      await invalid({
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
      })
    })

    it('prioritizes decorated over override for properties', async () => {
      await invalid({
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
      })
    })

    it('prioritizes override over readonly', async () => {
      await invalid({
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
      })
    })

    it.each([
      ['public', 'public'],
      ['protected', 'protected'],
      ['private', 'private'],
    ])(
      'prioritizes readonly over %s accessibility',
      async (_name, accessibilityModifier) => {
        await invalid({
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
        })
      },
    )

    it.each([
      ['public', 'public'],
      ['protected', 'protected'],
      ['private', 'private'],
    ])(
      'prioritizes %s accessibility over optional for properties',
      async (_name, accessibilityModifier) => {
        await invalid({
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
        })
      },
    )

    it('prioritizes optional over async for properties', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'optional-property',
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
            groups: ['optional-property', 'method', 'async-property'],
          },
        ],
      })
    })

    it('sorts class and group members', async () => {
      await valid({
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
      })

      await invalid({
        errors: [
          {
            data: {
              left: 'key in O',
              right: 'b',
            },
            messageId: 'unexpectedClassesOrder',
          },
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })
    })

    it('sorts class with attributes having the same name', async () => {
      await invalid({
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
      })
    })

    it('sorts class with ts index signatures', async () => {
      await valid({
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
      })

      await invalid({
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
      })
    })

    it('allows multiple method signatures', async () => {
      await valid({
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
            groups: ['unknown'],
          },
        ],
      })
    })

    it('sorts private methods with hash', async () => {
      await invalid({
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
      })
    })

    it('allows split methods with getters and setters', async () => {
      await invalid({
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
            data: { right: 'b', left: 'x' },
          },
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'c', left: 'z' },
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
      })
    })

    it('sorts decorated properties', async () => {
      await invalid({
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
      })

      await invalid({
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
      })
    })

    it('sorts decorated accessors', async () => {
      await invalid({
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
      })
    })

    it('sorts class members with partition comments', async () => {
      await valid({
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
      })

      await invalid({
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
        errors: [
          {
            data: { right: 'onSortChanged', left: 'updateTable' },
            messageId: 'unexpectedClassesOrder',
          },
          {
            data: { right: 'onPaginationChanged', left: 'onSortChanged' },
            messageId: 'unexpectedClassesOrder',
          },
          {
            data: { right: 'onValueChanged', left: 'setFormValue' },
            messageId: 'unexpectedClassesOrder',
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: 'Region:',
          },
        ],
      })
    })

    it('does not sort properties if the right value depends on the left value', async () => {
      await valid({
        code: dedent`
          class Class {
            b = 'b'

            aaa = [this.b]
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          class Class {
            b = 'b'

            getAaa() {
              return this.b;
            }
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          class Class {
            static c = 'c'

            b = Example.c
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          class Class {
            #b = 'b'

            getAaa() {
              return this.#b;
            }
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          class Class {
            static b = 'b'

            static getAaa() {
              return this.b;
            }
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'aaa', right: 'b' },
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
      })

      await invalid({
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
      })

      await invalid({
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
      })

      await invalid({
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
      })

      await invalid({
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
      })
    })

    it('ignores function expression dependencies', async () => {
      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })

      await valid({
        code: dedent`
          class MyClass {
            a = () => this.b()
            b = () => null
          }
        `,
        options: [options],
      })
    })

    it('detects function property dependencies', async () => {
      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })

      await valid({
        code: dedent`
          class Class {
            b = createQueryString();
            a = createState((set) => {
                set('query', this.b.value);
             });
          }
        `,
        options: [
          {
            ...options,
            groups: [['property', 'method']],
          },
        ],
      })
    })

    it('detects static block dependencies', async () => {
      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })
    })

    it('detects property expression dependencies', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'd', left: 'e' },
          },
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'd' },
          },
          {
            data: { nodeDependentOnRight: 'd', right: 'b' },
            messageId: 'unexpectedClassesDependencyOrder',
          },
          {
            data: { nodeDependentOnRight: 'e', right: 'c' },
            messageId: 'unexpectedClassesDependencyOrder',
          },
          {
            data: { nodeDependentOnRight: 'b', right: 'z' },
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
      })

      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'a', right: 'c' },
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
      })
    })

    it('detects dependencies in objects', async () => {
      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })
    })

    it('detects nested property references', async () => {
      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })

      await valid({
        code: dedent`
          class Class {
            static c = 1
            static b = new WhateverObject(this.c)
            static a = Class.b.bMethod().anotherNestedMethod(this.c).finalMethod()
          }
        `,
        options: [options],
      })
    })

    it('detects optional chained dependencies', async () => {
      await valid({
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
      })

      await valid({
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
      })
    })

    it('detects non-null asserted dependencies', async () => {
      await valid({
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
      })

      await valid({
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
      })
    })

    it('detects unary dependencies', async () => {
      await valid({
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
      })

      await valid({
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
      })
    })

    it('detects spread elements dependencies', async () => {
      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })
    })

    it('detects dependencies in conditional expressions', async () => {
      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })
    })

    it("detects dependencies in 'as' expressions", async () => {
      await valid({
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
      })

      await valid({
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
      })
    })

    it('detects dependencies in type assertion expressions', async () => {
      await valid({
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
      })

      await valid({
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
      })
    })

    it('detects dependencies in template literal expressions', async () => {
      await valid({
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
      })

      await valid({
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
      })
    })

    it('detects # dependencies', async () => {
      await valid({
        code: dedent`
          class Class {
           static a = Class.a
           static b = 1
           static #b = 1
           static #a = this.#b
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          class Class {
           static #b = () => 1
           static #a = this.#b()
          }
        `,
        options: [options],
      })

      await valid({
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
      })
    })

    it('separates static from non-static dependencies', async () => {
      await valid({
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
      })

      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'c' },
            messageId: 'unexpectedClassesDependencyOrder',
          },
          {
            data: { nodeDependentOnRight: 'a', right: 'c' },
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
      })
    })

    it('detects and ignores circular dependencies', async () => {
      await invalid({
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
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })
    })

    it('ignores function body dependencies', async () => {
      await valid({
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
      })
    })

    it('prioritizes dependencies over group configuration', async () => {
      await valid({
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
      })
    })

    it('prioritizes dependencies over partitionByComment', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'a' },
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
      })
    })

    it('prioritizes dependencies over partitionByNewLine', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'a' },
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
      })
    })

    it('works with left and right dependencies', async () => {
      await valid({
        code: dedent`
          class Class {
            left = 'left'
            right = 'right'

            aaa = this.left + this.right
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'aaa', right: 'left' },
            messageId: 'unexpectedClassesDependencyOrder',
          },
          {
            data: { nodeDependentOnRight: 'aaa', right: 'right' },
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
      })
    })

    it.each([
      ['computed function pattern as string', '^computed$'],
      ['computed function pattern in array', ['noMatch', '^computed$']],
      [
        'computed function pattern as object',
        { pattern: '^COMPUTED$', flags: 'i' },
      ],
      [
        'computed function pattern as object in array',
        ['noMatch', { pattern: '^COMPUTED$', flags: 'i' }],
      ],
    ])(
      'ignores callback dependencies matching %s',
      async (_name, ignoreCallbackDependenciesPatterns) => {
        await valid({
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
        })
      },
    )

    it('ignores unknown group', async () => {
      await invalid({
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
      })

      await invalid({
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
      })
    })

    it('allows to trim special characters', async () => {
      await valid({
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
      })
    })

    it('allows to remove special characters', async () => {
      await valid({
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
      })
    })

    it('allows to use locale', async () => {
      await valid({
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
      })
    })

    it('removes newlines between groups when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenClassMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'b', left: 'z' },
          },
        ],
        options: [
          {
            ...options,
            groups: ['method', 'unknown'],
            newlinesInside: 'ignore',
            newlinesBetween: 0,
          },
        ],
        code: dedent`
          class Class {
            a() {}


           y = "y"
          z = "z"

              b = "b"
          }
        `,
        output: dedent`
          class Class {
            a() {}
           b = "b"
          y = "y"

              z = "z"
          }
        `,
      })
    })

    it.each([1, 'ignore', 0])(
      'enforces 0 newline between overload signatures when newlinesBetween is %s',
      async newlinesBetween => {
        await invalid({
          errors: [
            {
              messageId: 'extraSpacingBetweenClassMembers',
              data: { right: 'method', left: 'method' },
            },
            {
              messageId: 'extraSpacingBetweenClassMembers',
              data: { right: 'method', left: 'method' },
            },
          ],
          output: dedent`
            class Class {
              method(a: string): void
              method(a: number): void
              method(a: string | number): void {}
            }
          `,
          code: dedent`
            class Class {
              method(a: string): void

              method(a: number): void

              method(a: string | number): void {}
            }
          `,
          options: [
            {
              ...options,
              newlinesBetween,
            },
          ],
        })
      },
    )

    it('handles "newlinesBetween" between consecutive groups', async () => {
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
            messageId: 'missedSpacingBetweenClassMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenClassMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenClassMembers',
            data: { right: 'd', left: 'c' },
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
      })
    })

    it.each([
      [2, 0],
      [2, 'ignore'],
      [0, 2],
      ['ignore', 2],
    ])(
      'enforces newlines if the global option is %s and the group option is %s',
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
              messageId: 'missedSpacingBetweenClassMembers',
              data: { right: 'b', left: 'a' },
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
        })
      },
    )

    it.each([1, 2, 'ignore', 0])(
      'enforces no newline if the global option is %s and "newlinesBetween: 0" exists between all groups',
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
              messageId: 'extraSpacingBetweenClassMembers',
              data: { right: 'b', left: 'a' },
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
        })
      },
    )

    it.each([
      ['ignore', 0],
      [0, 'ignore'],
    ])(
      'does not enforce a newline if the global option is %s and the group option is %s',
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
            class Class {
              a: string

              b: string
            }
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
            class Class {
              a: string
              b: string
            }
          `,
        })
      },
    )

    it('handles newlines and comment after fixes', async () => {
      await invalid({
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
        options: [
          {
            groups: ['property', 'method'],
            newlinesBetween: 1,
            newlinesInside: 0,
          },
        ],
        output: dedent`
          class Class {
            a // Comment after

            b() {}
            c() {}
          }
        `,
        code: dedent`
          class Class {
            b() {}
            a // Comment after

            c() {}
          }
        `,
      })
    })

    it('ignores newline fixes between different partitions when newlinesBetween is 0', async () => {
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
            messageId: 'unexpectedClassesOrder',
            data: { right: 'b', left: 'c' },
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
      })
    })

    it('sorts inline non-abstract methods correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })
    })

    it('sorts inline abstract methods correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })
    })

    it('sorts inline declare class methods correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })
    })

    it('sorts inline properties correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })
    })

    it('sorts inline accessors correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })
    })

    it('sorts inline index-signatures correctly', async () => {
      await invalid({
        errors: [
          {
            data: { right: '[key: number]', left: '[key: string]' },
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
      })

      await invalid({
        errors: [
          {
            data: { right: '[key: number]', left: '[key: string]' },
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
      })
    })

    it('sorts inline static-block correctly', async () => {
      await invalid({
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
      })
    })
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it('sorts class members', async () => {
      await valid({
        code: dedent`
          class Class {
            a
          }
        `,
        options: [options],
      })

      await valid({
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
      })

      await invalid({
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
        output: dedent`
          class Class {
            static a = 'a'

            protected b = 'b'

            private c = 'c'

            e = 'e'

            d = 'd'

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
        errors: [
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
      })
    })

    it('sorts complex official groups', async () => {
      await invalid({
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

            private n = async function() {};

            private m = async () => {};

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
      })
    })

    it('prioritizes selectors over modifiers quantity', async () => {
      await invalid({
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
      })
    })

    it('prioritizes static over readonly', async () => {
      await invalid({
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
      })
    })

    it('prioritizes constructor over method', async () => {
      await invalid({
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
      })
    })

    it('prioritizes get-method over method', async () => {
      await invalid({
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
      })
    })

    it('prioritizes set-method over method', async () => {
      await invalid({
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
      })
    })

    it('prioritizes static over override', async () => {
      await invalid({
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
      })
    })

    it('prioritizes abstract over override', async () => {
      await invalid({
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
      })
    })

    it('prioritizes decorated over override', async () => {
      await invalid({
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
      })
    })

    it.each([
      ['public', 'public'],
      ['protected', 'protected'],
      ['private', 'private'],
    ])(
      'prioritizes override over %s accessibility',
      async (_name, accessibilityModifier) => {
        await invalid({
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
        })
      },
    )

    it.each([
      ['public', 'public'],
      ['protected', 'protected'],
      ['private', 'private'],
    ])(
      'prioritizes %s accessibility over optional',
      async (_name, accessibilityModifier) => {
        await invalid({
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
        })
      },
    )

    it('prioritizes optional over async', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'optional-method',
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
            groups: ['optional-method', 'property', 'async-method'],
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
      })
    })

    it('prioritizes static over override for accessor properties', async () => {
      await invalid({
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
      })
    })

    it('prioritizes abstract over override for accessor properties', async () => {
      await invalid({
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
      })
    })

    it('prioritizes decorated over override for accessor properties', async () => {
      await invalid({
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
      })
    })

    it.each([
      ['public', 'public'],
      ['protected', 'protected'],
      ['private', 'private'],
    ])(
      'prioritizes override over %s accessibility for accessor properties',
      async (_name, accessibilityModifier) => {
        await invalid({
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
        })
      },
    )

    it('prioritizes function property over property', async () => {
      await invalid({
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
      })
    })

    it('prioritizes function property over property for arrow functions', async () => {
      await invalid({
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
      })
    })

    it('prioritizes static over declare', async () => {
      await invalid({
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
      })
    })

    it('prioritizes declare over abstract', async () => {
      await invalid({
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
      })
    })

    it('prioritizes abstract over override for properties', async () => {
      await invalid({
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
      })
    })

    it('prioritizes decorated over override for properties', async () => {
      await invalid({
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
      })
    })

    it('prioritizes override over readonly', async () => {
      await invalid({
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
      })
    })

    it.each([
      ['public', 'public'],
      ['protected', 'protected'],
      ['private', 'private'],
    ])(
      'prioritizes readonly over %s accessibility',
      async (_name, accessibilityModifier) => {
        await invalid({
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
        })
      },
    )

    it.each([
      ['public', 'public'],
      ['protected', 'protected'],
      ['private', 'private'],
    ])(
      'prioritizes %s accessibility over optional for properties',
      async (_name, accessibilityModifier) => {
        await invalid({
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
        })
      },
    )

    it('prioritizes optional over async for properties', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'optional-property',
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
            groups: ['optional-property', 'method', 'async-property'],
          },
        ],
      })
    })

    it('sorts class and group members', async () => {
      await valid({
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
      })

      await invalid({
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
      })
    })

    it('sorts class with attributes having the same name', async () => {
      await invalid({
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
      })
    })

    it('sorts class with ts index signatures', async () => {
      await valid({
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
      })

      await invalid({
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
      })
    })

    it('allows multiple method signatures', async () => {
      await valid({
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
            groups: ['unknown'],
          },
        ],
      })
    })

    it('sorts private methods with hash', async () => {
      await invalid({
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
      })
    })

    it('allows split methods with getters and setters', async () => {
      await invalid({
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
        output: dedent`
          class A {
            bb() {}
            x() {}
            get z() {}
            get c() {}
            set c() {}
          }
        `,
        code: dedent`
          class A {
            x() {}
            bb() {}
            get z() {}
            get c() {}
            set c() {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'bb', left: 'x' },
          },
        ],
      })
    })

    it('sorts decorated properties', async () => {
      await invalid({
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
      })

      await invalid({
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
      })
    })

    it('sorts decorated accessors', async () => {
      await invalid({
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
      })
    })

    it('sorts class members with partition comments', async () => {
      await valid({
        code: dedent`
          class Class {
            // Region: Table
            protected onPaginationChanged() {}

            protected onChangeColumns() {}

            protected onSortChanged() {}

            protected updateTable() {}

            // Region: Form
            protected onValueChanged() {}

            protected setFormValue() {}

            // Regular Comment
            protected disableForm() {}

            protected clearForm() {}

          }
        `,
        options: [
          {
            ...options,
            partitionByComment: 'Region:',
          },
        ],
      })

      await invalid({
        errors: [
          {
            data: { right: 'onSortChanged', left: 'updateTable' },
            messageId: 'unexpectedClassesOrder',
          },
          {
            data: { right: 'onPaginationChanged', left: 'onSortChanged' },
            messageId: 'unexpectedClassesOrder',
          },
          {
            data: { right: 'disableForm', left: 'clearForm' },
            messageId: 'unexpectedClassesOrder',
          },
          {
            data: { right: 'setFormValue', left: 'disableForm' },
            messageId: 'unexpectedClassesOrder',
          },
          {
            data: { right: 'onValueChanged', left: 'setFormValue' },
            messageId: 'unexpectedClassesOrder',
          },
        ],
        output: dedent`
          class Class {
            // Region: Table
            protected onPaginationChanged() {}

            protected onChangeColumns() {}

            protected onSortChanged() {}

            protected updateTable() {}

            // Region: Form
            protected onValueChanged() {}

            protected setFormValue() {}

            // Regular Comment
            protected disableForm() {}

            protected clearForm() {}
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

            // Regular Comment
            protected disableForm() {}

            protected setFormValue() {}

            protected onValueChanged() {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: 'Region:',
          },
        ],
      })
    })

    it('does not sort properties if the right value depends on the left value', async () => {
      await valid({
        code: dedent`
          class Class {
            b = 'b'

            aaa = [this.b]
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          class Class {
            b = 'b'

            getAaa() {
              return this.b;
            }
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          class Class {
            static c = 'c'

            b = Example.c
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          class Class {
            #b = 'b'

            getAaa() {
              return this.#b;
            }
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          class Class {
            static b = 'b'

            static getAaa() {
              return this.b;
            }
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'aaa', right: 'b' },
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
      })

      await invalid({
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
      })

      await invalid({
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
      })

      await invalid({
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
      })

      await invalid({
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
      })
    })

    it('ignores function expression dependencies', async () => {
      await valid({
        code: dedent`
          class Class {
            static b() {
              return 1
            }
            b() {
              return 1
            }
            static a = this.b()
            a = this.b()
          }
        `,
        options: [
          {
            ...options,
            groups: [['property', 'method']],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b() {
              return 1
            }
            b() {
              return 1
            }
            static a = Class.b()
            a = this.b()
          }
        `,
        options: [
          {
            ...options,
            groups: [['property', 'method']],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b() {
              return 1
            }
            static a = [1].map(this.b)
            b() {
              return 1
            }
            a = [1].map(this.b)
          }
        `,
        options: [
          {
            ...options,
            groups: [['property', 'method']],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b() {
              return 1
            }
            static a = [1].map(Class.b)
            b() {
              return 1
            }
            a = [1].map(this.b)
          }
        `,
        options: [
          {
            ...options,
            groups: [['property', 'method']],
          },
        ],
      })

      await valid({
        code: dedent`
          class MyClass {
            a = () => this.b()
            b = () => null
          }
        `,
        options: [options],
      })
    })

    it('detects function property dependencies', async () => {
      await valid({
        code: dedent`
          class Class {
            static b = () => {
              return 1
            }
            b = () => {
              return 1
            }
            static a = this.b()
            a = this.b()
          }
        `,
        options: [
          {
            ...options,
            groups: [['property', 'method']],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = function() {
              return 1
            }
            b = function() {
              return 1
            }
            static a = this.b()
            a = this.b()
          }
        `,
        options: [
          {
            ...options,
            groups: [['property', 'method']],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = () => {
              return 1
            }
            b = () => {
              return 1
            }
            static a = [1].map(this.b)
            a = [1].map(this.b)
          }
        `,
        options: [
          {
            ...options,
            groups: [['property', 'method']],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = function() {
              return 1
            }
            b = function() {
              return 1
            }
            static a = [1].map(this.b)
            a = [1].map(this.b)
          }
        `,
        options: [
          {
            ...options,
            groups: [['property', 'method']],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = () => {
              return 1
            }
            b = () => {
              return 1
            }
            static a = [1].map(Class.b)
            a = [1].map(this.b)
          }
        `,
        options: [
          {
            ...options,
            groups: [['property', 'method']],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = function() {
              return 1
            }
            b = function() {
              return 1
            }
            static a = [1].map(Class.b)
            a = [1].map(this.b)
          }
        `,
        options: [
          {
            ...options,
            groups: [['property', 'method']],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            state = createState((set) => {
              set('query', this.queryString.value);
            });
            querystring = createQueryString();
          }
        `,
        options: [
          {
            ...options,
            groups: [['property', 'method']],
          },
        ],
      })
    })

    it('detects static block dependencies', async () => {
      await valid({
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
      })

      await valid({
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
      })

      await valid({
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
      })
    })

    it('detects property expression dependencies', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'd' },
          },
          {
            data: { nodeDependentOnRight: 'd', right: 'b' },
            messageId: 'unexpectedClassesDependencyOrder',
          },
          {
            data: { nodeDependentOnRight: 'e', right: 'c' },
            messageId: 'unexpectedClassesDependencyOrder',
          },
          {
            data: { nodeDependentOnRight: 'b', right: 'z' },
            messageId: 'unexpectedClassesDependencyOrder',
          },
        ],
        output: dedent`
          class Class {
            static a = 10 + OtherClass.z

            static z = 1

            static c = 10 + this.z

            static e = 10 + this.c

            b = 10 + Class.z

            d = this.b
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
      })

      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'a', right: 'c' },
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
      })
    })

    it('detects dependencies in objects', async () => {
      await valid({
        code: dedent`
          class Class {
            static b = 1
            static a = {
              b: this.b
            }
            b = 1
            a = {
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
      })

      await valid({
        code: dedent`
          class Class {
            static b = 1
            static a = {
              b: Class.b
            }
            b = 1
            a = {
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
      })

      await valid({
        code: dedent`
          class Class {
            static b = 1
            static a = {
              [this.b]: A
            }
            b = 1
            a = {
              [this.b]: 1
            }
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = 1
            static a = {
              [Class.b]: 1
            }
            b = 1
            a = {
              [this.b]: 1
            }
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })
    })

    it('detects nested property references', async () => {
      await valid({
        code: dedent`
          class Class {
            static b = new Subject()
            static a = this.b.asObservable()
            b = new Subject()
            a = this.b.asObservable()
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = new Subject()
            static a = Class.b.asObservable()
            b = new Subject()
            a = this.b.asObservable()
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = new WhateverObject()
            static a = this.b.bProperty
            b = new WhateverObject()
            a = this.b.bProperty
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = new WhateverObject()
            static a = Class.b.bProperty
            b = new WhateverObject()
            a = this.b.bProperty
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
             static c = 1
             static b = new WhateverObject(this.c)
             static a = Class.b.bMethod().anotherNestedMethod(this.c).finalMethod()
          }
        `,
        options: [options],
      })
    })

    it('detects optional chained dependencies', async () => {
      await valid({
        code: dedent`
          class Class {
            static b = new Subject()
            static a = this.b?.asObservable()
            b = new Subject()
            a = this.b?.asObservable()
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = new Subject()
            static a = Class.b?.asObservable()
            b = new Subject()
            a = this.b?.asObservable()
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })
    })

    it('detects non-null asserted dependencies', async () => {
      await valid({
        code: dedent`
          class Class {
            static b = new Subject()
            static a = this.b!.asObservable()
            b = new Subject()
            a = this.b!.asObservable()
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = new Subject()
            static a = Class.b!.asObservable()
            b = new Subject()
            a = this.b!.asObservable()
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })
    })

    it('detects unary dependencies', async () => {
      await valid({
        code: dedent`
          class Class {
            static b = true
            static a = !this.b
            b = true
            a = !this.b
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = true
            static a = !Class.b
            b = true
            a = !this.b
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })
    })

    it('detects spread elements dependencies', async () => {
      await valid({
        code: dedent`
          class Class {
            static b = {}
            static a = {...this.b}
            b = {}
            a = {...this.b}
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = {}
            static a = {...Class.b}
            b = {}
            a = {...this.b}
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = []
            static a = [...this.b]
            b = []
            a = [...this.b]
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = []
            static a = [...Class.b]
            b = []
            a = [...this.b]
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })
    })

    it('detects dependencies in conditional expressions', async () => {
      await valid({
        code: dedent`
          class Class {
            static b = 1;
            static a = this.b ? 1 : 0;
            b = 1;
            a = this.b ? 1 : 0;
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = 1;
            static a = Class.b ? 1 : 0;
            b = 1;
            a = this.b ? 1 : 0;
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = 1;
            static a = someCondition ? this.b : 0;
            b = 1;
            a = someCondition ? this.b : 0;
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = 1;
            static a = someCondition ? Class.b : 0;
            b = 1;
            a = someCondition ? this.b : 0;
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = 1;
            static a = someCondition ? 0 : this.b;
            b = 1;
            a = someCondition ? 0 : this.b;
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = 1;
            static a = someCondition ? 0 : Class.b;
            b = 1;
            a = someCondition ? 0 : this.b;
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })
    })

    it("detects dependencies in 'as' expressions", async () => {
      await valid({
        code: dedent`
          class Class {
            static b = 1
            static a = this.b as any
            b = 1
            a = this.b as any
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = 1
            static a = Class.b as any
            b = 1
            a = this.b as any
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })
    })

    it('detects dependencies in type assertion expressions', async () => {
      await valid({
        code: dedent`
          class Class {
            static b = 1
            static a = <any>this.b
            b = 1
            a = <any>this.b
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = 1
            static a = <any>Class.b
            b = 1
            a = <any>this.b
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })
    })

    it('detects dependencies in template literal expressions', async () => {
      await valid({
        code: dedent`
          class Class {
            static b = 1
            static a = \`\${this.b}\`
            b = 1
            a = \`\${this.b}\`
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await valid({
        code: dedent`
          class Class {
            static b = 1
            static a = \`\${Class.b}\`
            b = 1
            a = \`\${this.b}\`
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })
    })

    it('detects # dependencies', async () => {
      await valid({
        code: dedent`
          class Class {
           static a = Class.a
           static b = 1
           static #b = 1
           static #a = this.#b
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          class Class {
           static #b = () => 1
           static #a = this.#b()
          }
        `,
        options: [options],
      })

      await valid({
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
      })
    })

    it('separates static from non-static dependencies', async () => {
      await valid({
        code: dedent`
          export class Class{
            static b = 1;
            b = 1;
            a = this.b;
          }
        `,
        options: [
          {
            ...options,
            groups: ['property'],
          },
        ],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'b', left: 'b' },
          },
          {
            data: { nodeDependentOnRight: 'b', right: 'c' },
            messageId: 'unexpectedClassesDependencyOrder',
          },
          {
            data: { nodeDependentOnRight: 'a', right: 'c' },
            messageId: 'unexpectedClassesDependencyOrder',
          },
        ],
        output: dedent`
          class Class {
            static c = 10
            static a = Class.c
            static b = this.c
            c = 10
            b = this.c
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
      })
    })

    it('detects and ignores circular dependencies', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'e', left: 'a' },
          },
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'g', left: 'f' },
          },
        ],
        output: dedent`
          class Class {
            b = this.e
            e = this.g
            g = this.b
            a
            f
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
      })
    })

    it('ignores function body dependencies', async () => {
      await valid({
        code: dedent`
          class Class {
            static c = () => {
               return this.a || Class.a
            }

            static b() {
               return this.a || Class.a
            }

            static a = true;

          }
        `,
        options: [
          {
            ...options,
            groups: [['method', 'property']],
          },
        ],
      })
    })

    it('prioritizes dependencies over group configuration', async () => {
      await valid({
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
      })
    })

    it('prioritizes dependencies over partitionByComment', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'a' },
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
      })
    })

    it('prioritizes dependencies over partitionByNewLine', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'b', right: 'a' },
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
      })
    })

    it('works with left and right dependencies', async () => {
      await valid({
        code: dedent`
          class Class {
            right = 'right'
            left = 'left'

            aaa = this.left + this.right
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'aaa', right: 'left' },
            messageId: 'unexpectedClassesDependencyOrder',
          },
          {
            data: { nodeDependentOnRight: 'aaa', right: 'right' },
            messageId: 'unexpectedClassesDependencyOrder',
          },
        ],
        output: dedent`
          class Class {
            right = 'right'

            left = 'left'

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
      })
    })

    it.each([
      ['computed function pattern as string', '^computed$'],
      ['computed function pattern in array', ['noMatch', '^computed$']],
      [
        'computed function pattern as object',
        { pattern: '^COMPUTED$', flags: 'i' },
      ],
      [
        'computed function pattern as object in array',
        ['noMatch', { pattern: '^COMPUTED$', flags: 'i' }],
      ],
    ])(
      'ignores callback dependencies matching %s',
      async (_name, ignoreCallbackDependenciesPatterns) => {
        await valid({
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
        })
      },
    )

    it('ignores unknown group', async () => {
      await invalid({
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
      })
    })

    it('allows to trim special characters', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
        code: dedent`
          class Class {
            _a
            _c
            b
          }
        `,
      })
    })

    it('allows to remove special characters', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          class Class {
            a_c
            ab
          }
        `,
      })
    })

    it('allows to use locale', async () => {
      await valid({
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
      })
    })

    it('removes newlines between groups when newlinesBetween is 0', async () => {
      await invalid({
        options: [
          {
            ...options,
            groups: ['method', 'unknown'],
            newlinesInside: 'ignore',
            newlinesBetween: 0,
          },
        ],
        errors: [
          {
            messageId: 'extraSpacingBetweenClassMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        code: dedent`
          class Class {
            a() {}


           b = "b"
          y = "y"

              z = "z"
          }
        `,
        output: dedent`
          class Class {
            a() {}
           b = "b"
          y = "y"

              z = "z"
          }
        `,
      })
    })

    it.each([1, 'ignore', 0])(
      'enforces 0 newline between overload signatures when newlinesBetween is %s',
      async newlinesBetween => {
        await invalid({
          errors: [
            {
              messageId: 'extraSpacingBetweenClassMembers',
              data: { right: 'method', left: 'method' },
            },
            {
              messageId: 'extraSpacingBetweenClassMembers',
              data: { right: 'method', left: 'method' },
            },
          ],
          output: dedent`
            class Class {
              method(a: string): void
              method(a: number): void
              method(a: string | number): void {}
            }
          `,
          code: dedent`
            class Class {
              method(a: string): void

              method(a: number): void

              method(a: string | number): void {}
            }
          `,
          options: [
            {
              ...options,
              newlinesBetween,
            },
          ],
        })
      },
    )

    it('handles "newlinesBetween" between consecutive groups', async () => {
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
            messageId: 'missedSpacingBetweenClassMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenClassMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenClassMembers',
            data: { right: 'd', left: 'c' },
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
      })
    })

    it.each([
      [2, 0],
      [2, 'ignore'],
      [0, 2],
      ['ignore', 2],
    ])(
      'enforces newlines if the global option is %s and the group option is %s',
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
              messageId: 'missedSpacingBetweenClassMembers',
              data: { right: 'b', left: 'a' },
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
        })
      },
    )

    it.each([1, 2, 'ignore', 0])(
      'enforces no newline if the global option is %s and "newlinesBetween: 0" exists between all groups',
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
              messageId: 'extraSpacingBetweenClassMembers',
              data: { right: 'b', left: 'a' },
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
        })
      },
    )

    it.each([
      ['ignore', 0],
      [0, 'ignore'],
    ])(
      'does not enforce a newline if the global option is %s and the group option is %s',
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
            class Class {
              a: string

              b: string
            }
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
            class Class {
              a: string
              b: string
            }
          `,
        })
      },
    )

    it('handles newlines and comment after fixes', async () => {
      await invalid({
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
        options: [
          {
            groups: ['property', 'method'],
            newlinesBetween: 1,
            newlinesInside: 0,
          },
        ],
        output: dedent`
          class Class {
            a // Comment after

            b() {}
            c() {}
          }
        `,
        code: dedent`
          class Class {
            b() {}
            a // Comment after

            c() {}
          }
        `,
      })
    })

    it('ignores newline fixes between different partitions when newlinesBetween is 0', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'aaa',
                groupName: 'aaa',
              },
            ],
            groups: ['aaa', 'unknown'],
            partitionByComment: true,
            newlinesBetween: 0,
          },
        ],
        output: dedent`
          class Class {
            aaa

            // Partition comment

            bb
            c
          }
        `,
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
        code: dedent`
          class Class {
            aaa

            // Partition comment

            c
            bb
          }
        `,
      })
    })

    it('sorts inline non-abstract methods correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          class Class {
            aa(){} b(){}
          }
        `,
        code: dedent`
          class Class {
            b(){} aa(){}
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          class Class {
            aa(){} b(){};
          }
        `,
        code: dedent`
          class Class {
            b(){} aa(){};
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          class Class {
            aa(){}; b(){}
          }
        `,
        code: dedent`
          class Class {
            b(){}; aa(){}
          }
        `,
        options: [options],
      })
    })

    it('sorts inline abstract methods correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          abstract class Class {
            abstract aa(); abstract b();
          }
        `,
        code: dedent`
          abstract class Class {
            abstract b(); abstract aa()
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          abstract class Class {
            abstract aa(); abstract b();
          }
        `,
        code: dedent`
          abstract class Class {
            abstract b(); abstract aa();
          }
        `,
        options: [options],
      })
    })

    it('sorts inline declare class methods correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          declare class Class {
            aa(); b();
          }
        `,
        code: dedent`
          declare class Class {
            b(); aa()
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          abstract class Class {
            abstract aa(); abstract b();
          }
        `,
        code: dedent`
          abstract class Class {
            abstract b(); abstract aa();
          }
        `,
        options: [options],
      })
    })

    it('sorts inline properties correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          class Class {
            aa; b;
          }
        `,
        code: dedent`
          class Class {
            b; aa
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          class Class {
            aa; b;
          }
        `,
        code: dedent`
          class Class {
            b; aa;
          }
        `,
        options: [options],
      })
    })

    it('sorts inline accessors correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          class Class {
            accessor aa; accessor b;
          }
        `,
        code: dedent`
          class Class {
            accessor b; accessor aa
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          class Class {
            accessor aa; accessor b;
          }
        `,
        code: dedent`
          class Class {
            accessor b; accessor aa;
          }
        `,
        options: [options],
      })
    })

    it('sorts inline static-block correctly', async () => {
      await invalid({
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
      })
    })

    it('uses the implementation node when overload signatures are present', async () => {
      await invalid({
        output: dedent`
          class Class {
            b(): void;
            b(arg: string): void {}

            a(arg: string | number | boolean): void;
            a(): void {}
          }
        `,
        code: dedent`
          class Class {
            a(arg: string | number | boolean): void;
            a(): void {}

            b(): void;
            b(arg: string): void {}
          }
        `,
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedClassesOrder',
          },
        ],
        options: [options],
      })
    })

    it('considers the latest overload signature if the implementation is not present', async () => {
      await invalid({
        output: dedent`
          class Class {
            b(): void;
            b(arg: string): void

            a(arg: string | number | boolean): void;
            a(): void
          }
        `,
        code: dedent`
          class Class {
            a(arg: string | number | boolean): void;
            a(): void

            b(): void;
            b(arg: string): void
          }
        `,
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedClassesOrder',
          },
        ],
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

    it('sorts class members', async () => {
      await valid({
        code: dedent`
          class Class {
            a
          }
        `,
        options: [options],
      })

      await valid({
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
      })

      await invalid({
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
            data: { right: 'd', left: 'e' },
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
      })
    })

    it('sorts complex official groups', async () => {
      await invalid({
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
            messageId: 'unexpectedClassesOrder',
            data: { right: 'm', left: 'n' },
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
      })
    })
  })

  describe('subgroup-order', () => {
    let options = {
      fallbackSort: {
        type: 'subgroup-order',
      },
      type: 'alphabetical',
    }

    it('fallback sorts by subgroup order', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
          },
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          class Class {
            get a() {}
            set a(value) {}
            get b() {}
            set b(value) {}
          }
        `,
        code: dedent`
          class Class {
            set b(value) {}
            set a(value) {}
            get b() {}
            get a() {}
          }
        `,
        options: [
          {
            ...options,
            groups: [['get-method', 'set-method'], 'unknown'],
          },
        ],
      })
    })

    it('fallback sorts by subgroup order through overriding groups option', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
          },
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [
          {
            ...options,
            groups: [
              { group: ['get-method', 'set-method'], newlinesInside: 0 },
              'unknown',
            ],
          },
        ],
        output: dedent`
          class Class {
            get a() {}
            set a(value) {}
            get b() {}
            set b(value) {}
          }
        `,
        code: dedent`
          class Class {
            set b(value) {}
            set a(value) {}
            get b() {}
            get a() {}
          }
        `,
      })
    })
  })

  describe('unsorted', () => {
    let options = {
      type: 'unsorted',
      order: 'asc',
    } as const

    it('does not enforce sorting', async () => {
      await valid({
        code: dedent`
          class Class {
            b
            c
            a
          }
        `,
        options: [options],
      })
    })

    it('enforces grouping', async () => {
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
      })
    })

    it('enforces newlines between', async () => {
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
            messageId: 'missedSpacingBetweenClassMembers',
            data: { right: 'a', left: 'b' },
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
      })
    })

    it('enforces dependency sorting', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'a', right: 'b' },
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
      })
    })
  })

  describe('misc', () => {
    it('validates the JSON schema', async () => {
      await expect(
        validateRuleJsonSchema(rule.meta.schema),
      ).resolves.not.toThrowError()
    })

    it('does not crash when class body contains unknown elements', async () => {
      await validWithUnknownClassElement({
        code: dedent`
          class Example {
            a() {}
            anUnknownElement
            b() {}
          }
        `,
        parserOptions: {
          elementToMarkAsUnknown: 'anUnknownElement',
        },
        options: [{}],
      })
    })

    it('does not take into account unknown elements', async () => {
      await invalidWithUnknownClassElement({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          class Example {
            a() {}
            anUnknownElement
            b() {}
          }
        `,
        code: dedent`
          class Example {
            b() {}
            anUnknownElement
            a() {}
          }
        `,
        parserOptions: {
          elementToMarkAsUnknown: 'anUnknownElement',
        },
        options: [{}],
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
            messageId: 'unexpectedClassesOrder',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'missedSpacingBetweenClassMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          class Class {
            b: string;

            a: string;
          }
        `,
        code: dedent`
          class Class {
            a: string;
            b: string;
          }
        `,
      })
    })

    it('filters on selector and modifiers', async () => {
      await invalid({
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
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array pattern', ['noMatch', 'hello']],
      ['object pattern', { pattern: 'HELLO', flags: 'i' }],
      [
        'object pattern in array',
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ],
    ])(
      'filters on elementNamePattern with %s',
      async (_name, elementNamePattern) => {
        await invalid({
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
              groups: ['propertiesStartingWithHello', 'constructor', 'unknown'],
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
        })
      },
    )

    it.each([
      ['string pattern', 'inject'],
      ['array pattern', ['noMatch', 'inject']],
      ['object pattern', { pattern: 'INJECT', flags: 'i' }],
      [
        'object pattern in array',
        ['noMatch', { pattern: 'INJECT', flags: 'i' }],
      ],
    ])(
      'filters on elementValuePattern with %s',
      async (_name, injectElementValuePattern) => {
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
        })
      },
    )

    it.each([
      ['string pattern', 'Hello'],
      ['array pattern', ['noMatch', 'Hello']],
      ['object pattern', { pattern: 'HELLO', flags: 'i' }],
      [
        'object pattern in array',
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ],
    ])(
      'filters on decoratorNamePattern with %s',
      async (_name, decoratorNamePattern) => {
        await invalid({
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
              data: { right: 'anotherProperty', left: 'property' },
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
        })
      },
    )

    it('filters on complex decoratorNamePattern', async () => {
      await invalid({
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
      })
    })

    it("sorts custom groups by overriding 'type' and 'order'", async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            data: { right: 'dddd', left: 'ccc' },
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
      })
    })

    it("sorts custom groups by overriding 'fallbackSort'", async () => {
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
      })
    })

    it("does not sort custom groups with 'unsorted' type", async () => {
      await invalid({
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
      })
    })

    it('sorts custom group blocks', async () => {
      await invalid({
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
      })
    })

    it('allows to use regex for element names in custom groups', async () => {
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
          class Class {
            iHaveFooInMyName: string
            meTooIHaveFoo: string
            a: string
            b: string
          }
        `,
      })
    })

    it('allows to use regex for element values in custom groups', async () => {
      await valid({
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
      })
    })

    it('allows to use regex for decorator names in custom groups', async () => {
      await valid({
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
      })
    })

    it('allows to use newlinesInside: 1', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'methodsWithNewlinesInside',
                selector: 'method',
                newlinesInside: 1,
              },
            ],
            groups: ['unknown', 'methodsWithNewlinesInside'],
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenClassMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenClassMembers',
            data: { right: 'd', left: 'c' },
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
      })
    })

    it('allows to use newlinesInside: 0', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'methodsWithoutNewlinesInside',
                selector: 'method',
                newlinesInside: 0,
              },
            ],
            groups: ['unknown', 'methodsWithoutNewlinesInside'],
          },
        ],
        errors: [
          {
            messageId: 'extraSpacingBetweenClassMembers',
            data: { right: 'd', left: 'c' },
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
      })
    })

    it.each([
      ['1', 1],
      ['0', 0],
    ])(
      'enforces 0 newline between overload signatures when newlinesInside is %s',
      async (_name, newlinesInside) => {
        await invalid({
          errors: [
            {
              messageId: 'extraSpacingBetweenClassMembers',
              data: { right: 'method', left: 'method' },
            },
            {
              messageId: 'extraSpacingBetweenClassMembers',
              data: { right: 'method', left: 'method' },
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
              method(a: string): void
              method(a: number): void
              method(a: string | number): void {}
            }
          `,
          code: dedent`
            class Class {
              method(a: string): void

              method(a: number): void

              method(a: string | number): void {}
            }
          `,
        })
      },
    )

    it('sets alphabetical asc sorting as default', async () => {
      await valid({
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
      })

      await invalid({
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
            data: { right: 'log10', left: 'log1p' },
            messageId: 'unexpectedClassesOrder',
          },
        ],
      })
    })

    it('sorts using default groups', async () => {
      await invalid({
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
            data: { right: 'privateAccessorProperty', left: 'privateProperty' },
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
            data: { right: 'publicAccessorProperty', left: 'publicProperty' },
            messageId: 'unexpectedClassesOrder',
          },
          {
            data: { right: 'publicGetMethod', left: 'publicSetMethod' },
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
          class Class {
            ccc
            bb
            a
          }
        `,
        options: [{}],
        settings,
      })

      await valid({
        code: dedent`
          class Class {
            a
            bb
            ccc
          }
        `,
        options: [{ type: 'alphabetical', order: 'asc' }],
        settings,
      })
    })

    it('keeps comments associated to their node', async () => {
      await invalid({
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
            messageId: 'unexpectedClassesOrder',
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

    it('handles partition comments', async () => {
      await invalid({
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
            messageId: 'unexpectedClassesOrder',
            data: { right: 'b', left: 'c' },
          },
          {
            messageId: 'unexpectedClassesOrder',
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

    it('allows to use regex for partition comments', async () => {
      await valid({
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
      })
    })

    it('ignores block comments', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })
    })

    it('allows to use all comments as parts', async () => {
      await valid({
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
      })
    })

    it('allows to use multiple partition comments', async () => {
      await valid({
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
      })
    })

    it('allows to use regex for partition comments with line option', async () => {
      await valid({
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
      })
    })

    it('ignores line comments', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })
    })

    it('allows to use all comments as parts with block option', async () => {
      await valid({
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
      })
    })

    it('allows to use multiple partition comments with block option', async () => {
      await valid({
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
      })
    })

    it('allows to use regex for partition comments with block option', async () => {
      await valid({
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
      })
    })

    it('allows to use new line as partition', async () => {
      await valid({
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
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'd', left: 'e' },
          },
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
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
      })
    })

    it("supports 'eslint-disable' for individual nodes", async () => {
      await valid({
        code: dedent`
          class Class {
            b
            c
            // eslint-disable-next-line
            a
          }
        `,
      })

      await invalid({
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
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'c', left: 'd' },
          },
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'b', left: 'a' },
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
      })

      await invalid({
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
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'b', left: 'c' },
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
      })

      await invalid({
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
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'b', left: 'c' },
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
      })

      await invalid({
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
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          class Class {
            b
            c
            // eslint-disable-next-line rule-to-test/sort-classes
            a
          }
        `,
        code: dedent`
          class Class {
            c
            b
            // eslint-disable-next-line rule-to-test/sort-classes
            a
          }
        `,
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          class Class {
            b
            c
            a // eslint-disable-line rule-to-test/sort-classes
          }
        `,
        code: dedent`
          class Class {
            c
            b
            a // eslint-disable-line rule-to-test/sort-classes
          }
        `,
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          class Class {
            b
            c
            /* eslint-disable-next-line rule-to-test/sort-classes */
            a
          }
        `,
        code: dedent`
          class Class {
            c
            b
            /* eslint-disable-next-line rule-to-test/sort-classes */
            a
          }
        `,
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          class Class {
            b
            c
            a /* eslint-disable-line rule-to-test/sort-classes */
          }
        `,
        code: dedent`
          class Class {
            c
            b
            a /* eslint-disable-line rule-to-test/sort-classes */
          }
        `,
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          class Class {
            a
            d
            /* eslint-disable rule-to-test/sort-classes */
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
            /* eslint-disable rule-to-test/sort-classes */
            c
            b
            // Shouldn't move
            /* eslint-enable */
            a
          }
        `,
        errors: [
          {
            messageId: 'unexpectedClassesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [{}],
      })
    })

    it('handles non typescript-eslint parser', async () => {
      await validEspree({
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
      })
    })
  })
})
