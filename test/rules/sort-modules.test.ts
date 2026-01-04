import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-modules'

describe('sort-modules', () => {
  let { valid: validEspree } = createRuleTester({
    name: 'sort-modules (espree)',
    rule,
  })
  let { invalid, valid } = createRuleTester({
    parser: typescriptParser,
    name: 'sort-modules',
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('ignores empty files', async () => {
      await valid({
        options: [options],
        code: '',
      })
    })

    it('ignores files with single statement', async () => {
      await valid({
        code: dedent`
          const a = 1
        `,
        options: [options],
      })
    })

    it('handles export without declaration', async () => {
      await valid({
        code: dedent`
          const foo = 1
          const bar = 2
          export { foo, bar }
        `,
        options: [options],
      })
    })

    it('handles module declaration without body', async () => {
      await valid({
        code: dedent`
          namespace A {
            const a = 1
          }
          declare module 'foo'
        `,
        options: [options],
      })
    })

    it('sorts modules according to group hierarchy', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'export-interface',
              left: 'FindUserInput',
              right: 'CacheType',
              rightGroup: 'enum',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: {
              rightGroup: 'export-function',
              left: 'assertInputIsCorrect',
              leftGroup: 'function',
              right: 'findUser',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: {
              leftGroup: 'export-function',
              right: 'FindAllUsersInput',
              rightGroup: 'export-type',
              left: 'findUser',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: {
              leftGroup: 'export-function',
              left: 'findAllUsers',
              rightGroup: 'class',
              right: 'Cache',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        output: dedent`
          enum CacheType {
            ALWAYS = 'ALWAYS',
            NEVER = 'NEVER',
          }

          export type FindAllUsersInput = {
            ids: string[]
            cache: CacheType
          }

          export type FindAllUsersOutput = FindUserOutput[]

          export interface FindUserInput {
            id: string
            cache: CacheType
          }

          export type FindUserOutput = {
            id: string
            name: string
            age: number
          }

          class Cache {
            // Some logic
          }

          export function findAllUsers(input: FindAllUsersInput): FindAllUsersOutput {
            assertInputIsCorrect(input)
            return _findUserByIds(input.ids)
          }

          export function findUser(input: FindUserInput): FindUserOutput {
            assertInputIsCorrect(input)
            return _findUserByIds([input.id])[0]
          }

          function assertInputIsCorrect(input: FindUserInput | FindAllUsersInput): void {
            // Some logic
          }
        `,
        code: dedent`
          export interface FindUserInput {
            id: string
            cache: CacheType
          }

          enum CacheType {
            ALWAYS = 'ALWAYS',
            NEVER = 'NEVER',
          }

          export type FindUserOutput = {
            id: string
            name: string
            age: number
          }

          function assertInputIsCorrect(input: FindUserInput | FindAllUsersInput): void {
            // Some logic
          }

          export function findUser(input: FindUserInput): FindUserOutput {
            assertInputIsCorrect(input)
            return _findUserByIds([input.id])[0]
          }

          export type FindAllUsersInput = {
            ids: string[]
            cache: CacheType
          }

          export type FindAllUsersOutput = FindUserOutput[]

          export function findAllUsers(input: FindAllUsersInput): FindAllUsersOutput {
            assertInputIsCorrect(input)
            return _findUserByIds(input.ids)
          }

          class Cache {
            // Some logic
          }
        `,
        options: [options],
      })
    })

    it('sorts modules within modules and namespaces', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          module ModuleB {
            interface A {}
            interface B {}
          }
          module ModuleA {
            interface A {}
            interface B {}
          }
        `,
        code: dedent`
          module ModuleB {
            interface B {}
            interface A {}
          }
          module ModuleA {
            interface B {}
            interface A {}
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          namespace NamespaceB {
            interface A {}
            interface B {}
          }
          namespace NamespaceA {
            interface A {}
            interface B {}
          }
        `,
        code: dedent`
          namespace NamespaceB {
            interface B {}
            interface A {}
          }
          namespace NamespaceA {
            interface B {}
            interface A {}
          }
        `,
        options: [options],
      })
    })

    it('creates partitions at variable declarations', async () => {
      await valid({
        code: dedent`
          interface B {}
          let a;
          interface A {}
        `,
        options: [options],
      })
    })

    it('creates partitions at function call expressions', async () => {
      await valid({
        code: dedent`
          interface B {}
          iAmCallingAFunction();
          interface A {}
        `,
        options: [options],
      })
    })

    it('accepts complex predefined group configurations', async () => {
      await valid({
        options: [
          {
            ...options,
            groups: [
              'export-declare-interface',
              'export-default-interface',
              'export-declare-function',
              'export-default-async-function',
              'export-decorated-class',
              'export-default-decorated-class',
              'export-declare-type',
              'export-enum',
              'export-declare-enum',
              'unknown',
            ],
          },
        ],
        code: dedent`
          export declare interface Interface {}

          export default interface Interface2 {}

          export declare function f2()

          export default async function f1()

          export @Decorator declare class Class1 {}

          export @Decorator default class Class2 {}

          export declare type Type = {}

          export enum Enum1 {}

          export declare enum Enum2 {}
        `,
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
            messageId: 'unexpectedModulesOrder',
            data: { right: 'B', left: 'A' },
          },
          {
            messageId: 'missedSpacingBetweenModulesMembers',
            data: { right: 'B', left: 'A' },
          },
        ],
        output: dedent`
          interface B {}

          interface A {}
        `,
        code: dedent`
          interface A {}
          interface B {}
        `,
      })
    })

    it('filters elements based on selector and modifiers', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unusedCustomGroup',
                modifiers: ['export'],
                selector: 'type',
              },
              {
                groupName: 'exportInterfaceGroup',
                selector: 'interface',
                modifiers: ['export'],
              },
              {
                groupName: 'interfaceGroup',
                selector: 'interface',
              },
            ],
            groups: ['interfaceGroup', 'exportInterfaceGroup'],
          },
        ],
        errors: [
          {
            data: {
              leftGroup: 'exportInterfaceGroup',
              rightGroup: 'interfaceGroup',
              right: 'C',
              left: 'B',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        output: dedent`
          interface C {}
          export interface A {}
          export interface B {}
        `,
        code: dedent`
          export interface A {}
          export interface B {}
          interface C {}
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array with string pattern', ['noMatch', 'hello']],
      ['case-insensitive regex object', { pattern: 'HELLO', flags: 'i' }],
      [
        'array with regex object',
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ],
    ])(
      'filters functions by element name pattern - %s',
      async (_description, elementNamePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'functionsStartingWithHello',
                  selector: 'function',
                  elementNamePattern,
                },
              ],
              groups: ['functionsStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'functionsStartingWithHello',
                right: 'helloFunction',
                leftGroup: 'unknown',
                left: 'func',
              },
              messageId: 'unexpectedModulesGroupOrder',
            },
          ],
          output: dedent`
            function helloFunction() {}
            interface A {}
            interface B {}
            function func() {}
          `,
          code: dedent`
            interface A {}
            interface B {}
            function func() {}
            function helloFunction() {}
          `,
        })
      },
    )

    it.each([
      ['string pattern', 'Hello'],
      ['array with string pattern', ['noMatch', 'Hello']],
      ['case-insensitive regex object', { pattern: 'HELLO', flags: 'i' }],
      [
        'array with regex object',
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ],
    ])(
      'filters classes by decorator name pattern - %s',
      async (_description, decoratorNamePattern) => {
        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'classesWithDecoratorStartingWithHello',
                leftGroup: 'unknown',
                left: 'func',
                right: 'C',
              },
              messageId: 'unexpectedModulesGroupOrder',
            },
            {
              data: { right: 'AnotherClass', left: 'C' },
              messageId: 'unexpectedModulesOrder',
            },
          ],
          options: [
            {
              customGroups: [
                {
                  groupName: 'classesWithDecoratorStartingWithHello',
                  decoratorNamePattern,
                  selector: 'class',
                },
              ],
              groups: ['classesWithDecoratorStartingWithHello', 'unknown'],
            },
          ],
          output: dedent`
            @HelloDecorator()
            class AnotherClass {}

            @HelloDecorator
            class C {}

            @Decorator
            class A {}

            class B {}

            function func() {}
          `,
          code: dedent`
            @Decorator
            class A {}

            class B {}

            function func() {}

            @HelloDecorator
            class C {}

            @HelloDecorator()
            class AnotherClass {}
          `,
        })
      },
    )

    it('filters elements using complex decorator name patterns', async () => {
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
              right: 'B',
              left: 'A',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        output: dedent`
          @B.B()
          class B {}

          @A.A.A(() => A)
          class A {}
        `,
        code: dedent`
          @A.A.A(() => A)
          class A {}

          @B.B()
          class B {}
        `,
      })
    })

    it('overrides sort type and order for custom groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'reversedFunctionsByLineLength',
              leftGroup: 'unknown',
              right: 'aFunction',
              left: 'DDDD',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: {
              rightGroup: 'reversedFunctionsByLineLength',
              right: 'anotherFunction',
              leftGroup: 'unknown',
              left: 'G',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: { right: 'yetAnotherFunction', left: 'anotherFunction' },
            messageId: 'unexpectedModulesOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedFunctionsByLineLength',
                selector: 'function',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedFunctionsByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          function yetAnotherFunction() {}

          function anotherFunction() {}

          function aFunction() {}

          interface A {}

          interface BB {}

          interface CCC {}

          interface DDDD {}

          interface EEE {}

          interface FF {}

          interface G {}
        `,
        code: dedent`
          interface A {}

          interface BB {}

          interface CCC {}

          interface DDDD {}

          function aFunction() {}

          interface EEE {}

          interface FF {}

          interface G {}

          function anotherFunction() {}

          function yetAnotherFunction() {}
        `,
      })
    })

    it('applies fallback sort when primary sort results in ties', async () => {
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
            messageId: 'unexpectedModulesOrder',
          },
        ],
        output: dedent`
          function fooBar() {}
          function fooZar() {}
        `,
        code: dedent`
          function fooZar() {}
          function fooBar() {}
        `,
      })
    })

    it('preserves original order for unsorted custom groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedFunctions',
                selector: 'function',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedFunctions', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedFunctions',
              leftGroup: 'unknown',
              left: 'Interface',
              right: 'c',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        output: dedent`
          function b() {}

          function a() {}

          function d() {}

          function e() {}

          function c() {}

          interface Interface {}
        `,
        code: dedent`
          function b() {}

          function a() {}

          function d() {}

          function e() {}

          interface Interface {}

          function c() {}
        `,
      })
    })

    it('sorts elements within custom group blocks', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    selector: 'interface',
                    modifiers: ['export'],
                  },
                  {
                    selector: 'function',
                    modifiers: ['async'],
                  },
                ],
                groupName: 'exportInterfacesAndAsyncFunctions',
              },
            ],
            groups: [['exportInterfacesAndAsyncFunctions', 'class'], 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'class',
              left: 'func',
              right: 'C',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: { right: 'aFunction', left: 'C' },
            messageId: 'unexpectedModulesOrder',
          },
          {
            data: { right: 'anotherFunction', left: 'D' },
            messageId: 'unexpectedModulesOrder',
          },
        ],
        output: dedent`
          export interface A {}

          async function aFunction() {}

          async function anotherFunction() {}

          class b {}

          class C {}

          export interface D {}

          class E {}

          function func() {}
        `,
        code: dedent`
          export interface A {}

          class b {}

          class E {}

          function func() {}

          class C {}

          async function aFunction() {}

          export interface D {}

          async function anotherFunction() {}
        `,
      })
    })

    it('supports negative regex patterns for element names in custom groups', async () => {
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
          function iHaveFooInMyName() {}
          function meTooIHaveFoo() {}
          function a() {}
          function b() {}
        `,
      })
    })

    it('supports regex patterns for decorator names in custom groups', async () => {
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
          @IHaveFooInMyName
          class X {}
          @MeTooIHaveFoo
          class Y {}
          class A {}
          class B {}
        `,
      })
    })

    it('enforces newlines between group members when newlinesInside is 1', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'group1',
                newlinesInside: 1,
                selector: 'type',
              },
            ],
            groups: ['group1'],
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenModulesMembers',
            data: { right: 'B', left: 'A' },
          },
        ],
        output: dedent`
          type A = {}

          type B = {}
        `,
        code: dedent`
          type A = {}
          type B = {}
        `,
      })
    })

    it('removes newlines between group members when newlinesInside is 0', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'group1',
                newlinesInside: 0,
                selector: 'type',
              },
            ],
            type: 'alphabetical',
            groups: ['group1'],
          },
        ],
        errors: [
          {
            messageId: 'extraSpacingBetweenModulesMembers',
            data: { right: 'B', left: 'A' },
          },
        ],
        output: dedent`
          type A = {}
          type B = {}
        `,
        code: dedent`
          type A = {}

          type B = {}
        `,
      })
    })

    it('prioritizes declare modifier over export modifier', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'declare-interface',
              leftGroup: 'function',
              right: 'Interface',
              left: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['declare-interface', 'function', 'export-interface'],
          },
        ],
        output: dedent`
          export declare interface Interface {}

          function f() {}
        `,
        code: dedent`
          function f() {}

          export declare interface Interface {}
        `,
      })
    })

    it('prioritizes default modifier over export modifier', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'default-interface',
              leftGroup: 'function',
              right: 'Interface',
              left: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['default-interface', 'function', 'export-interface'],
          },
        ],
        output: dedent`
          export default interface Interface {}

          function f() {}
        `,
        code: dedent`
          function f() {}

          export default interface Interface {}
        `,
      })
    })

    it('prioritizes declare modifier over export modifier for type declarations', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'declare-type',
              leftGroup: 'function',
              right: 'Type',
              left: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['declare-type', 'function', 'export-type'],
          },
        ],
        output: dedent`
          export declare type Type = {}

          function f() {}
        `,
        code: dedent`
          function f() {}

          export declare type Type = {}
        `,
      })
    })

    it('prioritizes declare modifier over export modifier for class declarations', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'declare-class',
              leftGroup: 'function',
              right: 'Class',
              left: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['declare-class', 'function', 'export-class'],
          },
        ],
        output: dedent`
          export declare class Class {}

          function f() {}
        `,
        code: dedent`
          function f() {}

          export declare class Class {}
        `,
      })
    })

    it('prioritizes declare modifier over export modifier for function declarations', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'declare-function',
              leftGroup: 'interface',
              left: 'Interface',
              right: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['declare-function', 'interface', 'export-function'],
          },
        ],
        output: dedent`
          export declare function f()

          interface Interface {}
        `,
        code: dedent`
          interface Interface {}

          export declare function f()
        `,
      })
    })

    it('prioritizes default modifier over async modifier for functions', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'default-function',
              leftGroup: 'interface',
              left: 'Interface',
              right: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['default-function', 'interface', 'async-function'],
          },
        ],
        output: dedent`
          export default async function f() {}

          interface Interface {}
        `,
        code: dedent`
          interface Interface {}

          export default async function f() {}
        `,
      })
    })

    it('prioritizes async modifier over export modifier for functions', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'async-function',
              leftGroup: 'interface',
              left: 'Interface',
              right: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['async-function', 'interface', 'export-function'],
          },
        ],
        output: dedent`
          export async function f() {}

          interface Interface {}
        `,
        code: dedent`
          interface Interface {}

          export async function f() {}
        `,
      })
    })

    it('prioritizes declare modifier over export modifier for enum declarations', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'declare-enum',
              leftGroup: 'function',
              right: 'Enum',
              left: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['declare-enum', 'function', 'export-enum'],
          },
        ],
        output: dedent`
          export declare enum Enum {}

          function f() {}
        `,
        code: dedent`
          function f() {}

          export declare enum Enum {}
        `,
      })
    })

    describe('dependency detection', () => {
      it('ignores non-static class method dependencies', async () => {
        await valid({
          code: dedent`
            class A {
              f() {
                return Enum.V
              }
            }

            enum Enum {
              V = 'V'
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

      it('ignores static class method dependencies when no static block or properties exist', async () => {
        await valid({
          code: dedent`
            class A {
              static f() {
                return Enum.V
              }
            }

            enum Enum {
              V = 'V'
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

      it('detects static class method dependencies when static block is present', async () => {
        await valid({
          code: dedent`
            enum Enum {
              V = 'V'
            }

            class A {
              static {
                console.log(Enum.V)
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

        await valid({
          code: dedent`
            enum Enum {
              V = 'V'
            }

            class A {
              static {
                console.log(A.f())
              }

              static f = () => {
                return Enum.V
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

        await valid({
          code: dedent`
            enum Enum {
              V = 'V'
            }

            class Class {
              static {
                const method = () => {
                  return Enum.V || true;
                };
                method();
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

      it('detects static class method dependencies when static property is present', async () => {
        await valid({
          code: dedent`
            enum Enum {
              V = 'V'
            }

            class A {
              static a = Enum.V
            }
          `,
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
        })

        await valid({
          code: dedent`
            enum Enum {
              V = 'V'
            }

            class A {
              static accessor a = Enum.V
            }
          `,
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
        })

        await valid({
          code: dedent`
            enum Enum {
              V = 'V'
            }

            class A {
              static a = Object.values(Enum)
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

      it('ignores non-static arrow method dependencies', async () => {
        await valid({
          code: dedent`
            class A {
              f = () => {
                return Enum.V
              }
            }

            enum Enum {
              V = 'V'
            }
          `,
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
        })

        await valid({
          code: dedent`
            class A {
              accessor f = () => {
                return Enum.V
              }
            }

            enum Enum {
              V = 'V'
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

      it('ignores static arrow method dependencies when no static block or properties exist', async () => {
        await valid({
          code: dedent`
            class A {
              static f = () => {
                return Enum.V
              }
            }

            enum Enum {
              V = 'V'
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

      it('ignores interface type dependencies', async () => {
        await valid({
          code: dedent`
            interface A {
              a: Enum.V
            }

            enum Enum {
              V = 'V'
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

      it('ignores type alias dependencies', async () => {
        await valid({
          code: dedent`
            type A = {
              a: Enum.V
            }

            enum Enum {
              V = 'V'
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

      it('ignores usages in interface values', async () => {
        await valid({
          code: dedent`
            export default interface A {
              field?: Record<string, [B | null] & C>;
            }

            type B = Something;
          `,
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
        })
      })

      it('ignores usages in type keys', async () => {
        await valid({
          code: dedent`
            type A = {
              [B]: string;
            }

            type B = 'b';
          `,
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
        })
      })

      it('ignores usages in type values', async () => {
        await valid({
          code: dedent`
            type A = {
              field: typeof B
            }

            type B = Something;
          `,
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
        })

        await valid({
          code: dedent`
            type A = {
              (...args: B): void;
            }

            type B = 'b';
          `,
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
        })
      })

      it('ignores usages in type generics', async () => {
        await valid({
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
          code: dedent`
            type A<T extends B> = {}

            type B = 'b';
          `,
        })
      })

      it('ignores usages in type indexes', async () => {
        await valid({
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
          code: dedent`
            type A = Foo[B]

            type B = 'b';
          `,
        })

        await valid({
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
          code: dedent`
            type A = B['foo']

            type B = 'b';
          `,
        })
      })

      it('ignores usages in conditional types', async () => {
        await valid({
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
          code: dedent`
            type A = Foo extends B ? true : false;

            type B = 'b';
          `,
        })

        await valid({
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
          code: dedent`
            type A = B extends Foo ? true : false;

            type B = 'b';
          `,
        })

        await valid({
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
          code: dedent`
            type A = Foo extends Bar ? B : false;

            type B = 'b';
          `,
        })

        await valid({
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
          code: dedent`
            type A = Foo extends Bar ? true : B;

            type B = 'b';
          `,
        })

        await valid({
          code: dedent`
            type A<T> = T extends {
              (...args: any[]): infer B;
            } ? Foo : Bar

            type B = 'b';
          `,
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
        })
      })

      it('ignores usages in interface extends', async () => {
        await valid({
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
          code: dedent`
            interface A extends B {}

            interface B {}
          `,
        })
      })

      it('ignores usages in classes implements', async () => {
        await valid({
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
          code: dedent`
            class A implements B {}

            interface B {}
          `,
        })
      })

      it('ignores usages in functions', async () => {
        await valid({
          code: dedent`
            function a() {
              let foo: B;
            }

            type B = 'b';
          `,
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
        })
      })

      it('ignores parameter binding usages that shadow module-level names', async () => {
        await valid({
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
          code: dedent`
            function a(B: number) {}

            type B = 'b'
          `,
        })

        await valid({
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
          code: dedent`
            const a = (...B) => {}

            type B = 'b'
          `,
        })

        await valid({
          code: dedent`
            class A {
              a = (...B) => {}
            }

            type B = 'b'
          `,
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
        })

        await valid({
          code: dedent`
            class A {
              a(...B) {}
            }

            type B = 'b'
          `,
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
        })

        await valid({
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
          code: dedent`
            function a(...B) {}

            type B = 'b'
          `,
        })
      })

      it('ignores usages in simple object keys', async () => {
        await valid({
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
          code: dedent`
            const a = {
              B: 'b'
            }

            type B = 'b'
          `,
        })
      })

      it('ignores usages in simple object type keys', async () => {
        await valid({
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
          code: dedent`
            type A = {
              B: 'b'
            }

            type B = 'b'
          `,
        })
      })

      it('ignores usages in simple arguments', async () => {
        await valid({
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
          code: dedent`
            type A = (B: 'b') => void

            type B = 'b'
          `,
        })
      })

      it('ignores usages in simple interface keys', async () => {
        await valid({
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
          code: dedent`
            interface A {
              B: 'b'
            }

            type B = 'b'
          `,
        })
      })

      it('detects enum value dependencies', async () => {
        await valid({
          code: dedent`
            enum B {
              V = 'V'
            }

            enum A {
              V = B.V
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

      it('detects deeply nested dependencies', async () => {
        await invalid({
          output: dedent`
            class B {
              static b = 1
            }

            class A {
              static a = x > y ? new Class([...{...!!method(1 + <any>(B?.b! as any))}]) : null
            }
          `,
          code: dedent`
            class A {
              static a = x > y ? new Class([...{...!!method(1 + <any>(B?.b! as any))}]) : null
            }

            class B {
              static b = 1
            }
          `,
          errors: [
            {
              data: { nodeDependentOnRight: 'A', right: 'B' },
              messageId: 'unexpectedModulesDependencyOrder',
            },
          ],
          options: [options],
        })
      })

      it('detects dependencies in template literal expressions', async () => {
        await valid({
          code: dedent`
            class B {
              static b = 1
            }

            class A {
              static a = \`\${B.b}\`
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

      it('detects dependencies in class inheritance', async () => {
        await valid({
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
          code: dedent`
            class B {}

            class A extends B {}
          `,
        })
      })

      it('detects dependencies in decorator expressions', async () => {
        await invalid({
          output: dedent`
            enum B {}

            class A {
              @SomeDecorator({
                a: {
                  b: c.concat([B])
                }
              })
              property
            }
          `,
          code: dedent`
            class A {
              @SomeDecorator({
                a: {
                  b: c.concat([B])
                }
              })
              property
            }

            enum B {}
          `,
          errors: [
            {
              data: { nodeDependentOnRight: 'A', right: 'B' },
              messageId: 'unexpectedModulesDependencyOrder',
            },
          ],
          options: [
            {
              ...options,
              groups: ['unknown'],
            },
          ],
        })
      })

      it('detects and handles circular dependencies', async () => {
        await invalid({
          output: dedent`
            class A {
              static a = B.b
            }

            class B {
              static b = C.c
            }

            class C {
              static c = A.a
            }
          `,
          code: dedent`
            class B {
              static b = C.c
            }

            class A {
              static a = B.b
            }

            class C {
              static c = A.a
            }
          `,
          errors: [
            {
              messageId: 'unexpectedModulesOrder',
              data: { right: 'A', left: 'B' },
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
              groups: ['export-class', 'class'],
            },
          ],
          code: dedent`
            class B { static b }
            export class A { static a = B.b }
          `,
        })
      })

      it('prioritizes dependencies over partition by comment', async () => {
        await invalid({
          errors: [
            {
              data: { nodeDependentOnRight: 'B', right: 'A' },
              messageId: 'unexpectedModulesDependencyOrder',
            },
          ],
          output: dedent`
            class A { static a }
            // Part1
            class B { static b = A.a }
          `,
          options: [
            {
              ...options,
              partitionByComment: 'Part',
            },
          ],
          code: dedent`
            class B { static b = A.a }
            // Part1
            class A { static a }
          `,
        })
      })

      it('prioritizes dependencies over partition by new line', async () => {
        await invalid({
          errors: [
            {
              data: { nodeDependentOnRight: 'B', right: 'A' },
              messageId: 'unexpectedModulesDependencyOrder',
            },
          ],
          options: [
            {
              ...options,
              partitionByNewLine: true,
            },
          ],
          output: dedent`
            class A { static a }

            class B { static = A.a }
          `,
          code: dedent`
            class B { static = A.a }

            class A { static a }
          `,
        })
      })
    })

    it('handles unknown groups correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'function',
              rightGroup: 'unknown',
              right: 'SomeClass',
              left: 'b',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: {
              rightGroup: 'function',
              leftGroup: 'unknown',
              left: 'SomeClass',
              right: 'a',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        output: dedent`
          function a() {}
          class SomeClass {}
          function b() {}
        `,
        code: dedent`
          function b() {}
          class SomeClass {}
          function a() {}
        `,
        options: [
          {
            ...options,
            groups: ['function'],
          },
        ],
      })
    })

    it('trims special characters when configured', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
        code: dedent`
          function _a() {}
          function b() {}
          function _c() {}
        `,
      })
    })

    it('removes special characters when configured', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          function ab() {}
          function a_c() {}
        `,
      })
    })

    it('sorts using locale-specific rules', async () => {
      await valid({
        code: dedent`
          function 你好() {}
          function 世界() {}
          function a() {}
          function A() {}
          function b() {}
          function B() {}
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('removes newlines between and inside groups by default when "newlinesBetween" is 0', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'interface',
              rightGroup: 'unknown',
              right: 'y',
              left: 'A',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'b', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenModulesMembers',
            data: { right: 'b', left: 'z' },
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown', 'interface'],
            newlinesBetween: 0,
          },
        ],
        code: dedent`
            interface A {}


           function y() {}
          function z() {}

              function b() {}
        `,
        output: dedent`
            function b() {}
           function y() {}
          function z() {}
              interface A {}
        `,
      })
    })

    it('removes newlines inside groups when newlinesInside is 0', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'interface',
              rightGroup: 'unknown',
              right: 'y',
              left: 'A',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'b', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenModulesMembers',
            data: { right: 'b', left: 'z' },
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown', 'interface'],
            newlinesInside: 0,
          },
        ],
        code: dedent`
            interface A {}


           function y() {}
          function z() {}

              function b() {}
        `,
        output: dedent`
          function b() {}
           function y() {}
          function z() {}

              interface A {}
        `,
      })
    })

    it('removes newlines between groups when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'interface',
              rightGroup: 'unknown',
              right: 'y',
              left: 'A',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'b', left: 'z' },
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown', 'interface'],
            newlinesInside: 'ignore',
            newlinesBetween: 0,
          },
        ],
        code: dedent`
            interface A {}


           function y() {}
          function z() {}

              function b() {}
        `,
        output: dedent`
          function b() {}


           function y() {}
          function z() {}
              interface A {}
        `,
      })
    })

    it('maintains single newline between groups when newlinesBetween is 1', async () => {
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
            groups: ['a', 'b'],
            newlinesBetween: 1,
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenModulesMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          function a() {};

          function b() {}
        `,
        code: dedent`
          function a() {};function b() {}
        `,
      })

      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenModulesMembers',
            data: { right: 'z', left: 'A' },
          },
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'y', left: 'z' },
          },
          {
            messageId: 'missedSpacingBetweenModulesMembers',
            data: { right: 'B', left: 'y' },
          },
        ],
        options: [
          {
            ...options,
            groups: ['interface', 'unknown', 'class'],
            newlinesBetween: 1,
          },
        ],
        output: dedent`
            interface A {}

           function y() {}
          function z() {}

              class B {}
        `,
        code: dedent`
            interface A {}


           function z() {}
          function y() {}
              class B {}
        `,
      })
    })

    it('handles newlinesBetween settings between consecutive groups', async () => {
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
            messageId: 'missedSpacingBetweenModulesMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenModulesMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenModulesMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          function a() {}

          function b() {}

          function c() {}
          function d() {}


          function e() {}
        `,
        code: dedent`
          function a() {}
          function b() {}


          function c() {}

          function d() {}


          function e() {}
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
              messageId: 'missedSpacingBetweenModulesMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            function a() {}


            function b() {}
          `,
          code: dedent`
            function a() {}
            function b() {}
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
              messageId: 'extraSpacingBetweenModulesMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            function a() {}
            function b() {}
          `,
          code: dedent`
            function a() {}

            function b() {}
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
            function a() {}

            function b() {}
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
            function a() {}
            function b() {}
          `,
        })
      },
    )

    it('handles newlines and comments after fixes', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'function',
              leftGroup: 'type',
              right: 'a',
              left: 'B',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            groups: ['function', 'type'],
            newlinesBetween: 1,
            newlinesInside: 0,
          },
        ],
        output: dedent`
          function a() {} // Comment after

          type B = string
          type C = string
        `,
        code: dedent`
          type B = string
          function a() {} // Comment after

          type C = string
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
            messageId: 'unexpectedModulesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          function a() {}

          // Partition comment

          function b() {}
          function c() {}
        `,
        code: dedent`
          function a() {}

          // Partition comment

          function c() {}
          function b() {}
        `,
      })
    })

    it('sorts inline non-declare functions correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          function a() {} function b() {}
        `,
        code: dedent`
          function b() {} function a() {}
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          function a() {} function b() {};
        `,
        code: dedent`
          function b() {} function a() {};
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          function a() {}; function b() {}
        `,
        code: dedent`
          function b() {}; function a() {}
        `,
        options: [options],
      })
    })

    it('sorts inline declare functions correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          declare function a(); declare function b();
        `,
        code: dedent`
          declare function b(); declare function a()
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          declare function a(); declare function b();
        `,
        code: dedent`
          declare function b(); declare function a();
        `,
        options: [options],
      })
    })

    it('sorts inline interfaces correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          interface A {} interface B {}
        `,
        code: dedent`
          interface B {} interface A {}
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          interface A {} interface B {};
        `,
        code: dedent`
          interface B {} interface A {};
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          interface A {}; interface B {}
        `,
        code: dedent`
          interface B {}; interface A {}
        `,
        options: [options],
      })
    })

    it('sorts inline type aliases correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type a = {}; type b = {};
        `,
        code: dedent`
          type b = {}; type a = {}
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type a = {}; type b = {};
        `,
        code: dedent`
          type b = {}; type a = {};
        `,
        options: [options],
      })
    })

    it('sorts inline classes correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          class A {} class B {}
        `,
        code: dedent`
          class B {} class A {}
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          class A {} class B {};
        `,
        code: dedent`
          class B {} class A {};
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          class A {}; class B {}
        `,
        code: dedent`
          class B {}; class A {}
        `,
        options: [options],
      })
    })

    it('sorts inline enums correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          enum A {} enum B {}
        `,
        code: dedent`
          enum B {} enum A {}
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          enum A {} enum B {};
        `,
        code: dedent`
          enum B {} enum A {};
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          enum A {}; enum B {}
        `,
        code: dedent`
          enum B {}; enum A {}
        `,
        options: [options],
      })
    })

    it('ignores exported decorated classes when sorting', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'B', left: 'C' },
          },
        ],
        output: dedent`
          @B
          class B {}

          @A
          export class A {}

          @C
          class C {}
        `,
        code: dedent`
          @C
          class C {}

          @A
          export class A {}

          @B
          class B {}
        `,
        options: [
          {
            ...options,
            groups: ['unknown'],
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

    it('sorts modules according to group hierarchy', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'export-interface',
              left: 'FindUserInput',
              right: 'CacheType',
              rightGroup: 'enum',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: {
              rightGroup: 'export-function',
              left: 'assertInputIsCorrect',
              leftGroup: 'function',
              right: 'findUser',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: {
              leftGroup: 'export-function',
              right: 'FindAllUsersInput',
              rightGroup: 'export-type',
              left: 'findUser',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: {
              leftGroup: 'export-function',
              left: 'findAllUsers',
              rightGroup: 'class',
              right: 'Cache',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        output: dedent`
          enum CacheType {
            ALWAYS = 'ALWAYS',
            NEVER = 'NEVER',
          }

          export type FindAllUsersInput = {
            ids: string[]
            cache: CacheType
          }

          export type FindAllUsersOutput = FindUserOutput[]

          export interface FindUserInput {
            id: string
            cache: CacheType
          }

          export type FindUserOutput = {
            id: string
            name: string
            age: number
          }

          class Cache {
            // Some logic
          }

          export function findAllUsers(input: FindAllUsersInput): FindAllUsersOutput {
            assertInputIsCorrect(input)
            return _findUserByIds(input.ids)
          }

          export function findUser(input: FindUserInput): FindUserOutput {
            assertInputIsCorrect(input)
            return _findUserByIds([input.id])[0]
          }

          function assertInputIsCorrect(input: FindUserInput | FindAllUsersInput): void {
            // Some logic
          }
        `,
        code: dedent`
          export interface FindUserInput {
            id: string
            cache: CacheType
          }

          enum CacheType {
            ALWAYS = 'ALWAYS',
            NEVER = 'NEVER',
          }

          export type FindUserOutput = {
            id: string
            name: string
            age: number
          }

          function assertInputIsCorrect(input: FindUserInput | FindAllUsersInput): void {
            // Some logic
          }

          export function findUser(input: FindUserInput): FindUserOutput {
            assertInputIsCorrect(input)
            return _findUserByIds([input.id])[0]
          }

          export type FindAllUsersInput = {
            ids: string[]
            cache: CacheType
          }

          export type FindAllUsersOutput = FindUserOutput[]

          export function findAllUsers(input: FindAllUsersInput): FindAllUsersOutput {
            assertInputIsCorrect(input)
            return _findUserByIds(input.ids)
          }

          class Cache {
            // Some logic
          }
        `,
        options: [options],
      })
    })

    it('sorts modules within modules and namespaces', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          module ModuleB {
            interface A {}
            interface B {}
          }
          module ModuleA {
            interface A {}
            interface B {}
          }
        `,
        code: dedent`
          module ModuleB {
            interface B {}
            interface A {}
          }
          module ModuleA {
            interface B {}
            interface A {}
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          namespace NamespaceB {
            interface A {}
            interface B {}
          }
          namespace NamespaceA {
            interface A {}
            interface B {}
          }
        `,
        code: dedent`
          namespace NamespaceB {
            interface B {}
            interface A {}
          }
          namespace NamespaceA {
            interface B {}
            interface A {}
          }
        `,
        options: [options],
      })
    })

    it('creates partitions at variable declarations', async () => {
      await valid({
        code: dedent`
          interface B {}
          let a;
          interface A {}
        `,
        options: [options],
      })
    })

    it('creates partitions at function call expressions', async () => {
      await valid({
        code: dedent`
          interface B {}
          iAmCallingAFunction();
          interface A {}
        `,
        options: [options],
      })
    })

    it('accepts complex predefined group configurations', async () => {
      await valid({
        options: [
          {
            ...options,
            groups: [
              'export-declare-interface',
              'export-default-interface',
              'export-declare-function',
              'export-default-async-function',
              'export-decorated-class',
              'export-default-decorated-class',
              'export-declare-type',
              'export-enum',
              'export-declare-enum',
              'unknown',
            ],
          },
        ],
        code: dedent`
          export declare interface Interface {}

          export default interface Interface2 {}

          export declare function f2()

          export default async function f1()

          export @Decorator declare class Class1 {}

          export @Decorator default class Class2 {}

          export declare type Type = {}

          export enum Enum1 {}

          export declare enum Enum2 {}
        `,
      })
    })

    it('filters elements based on selector and modifiers', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unusedCustomGroup',
                modifiers: ['export'],
                selector: 'type',
              },
              {
                groupName: 'exportInterfaceGroup',
                selector: 'interface',
                modifiers: ['export'],
              },
              {
                groupName: 'interfaceGroup',
                selector: 'interface',
              },
            ],
            groups: ['interfaceGroup', 'exportInterfaceGroup'],
          },
        ],
        errors: [
          {
            data: {
              leftGroup: 'exportInterfaceGroup',
              rightGroup: 'interfaceGroup',
              right: 'C',
              left: 'B',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        output: dedent`
          interface C {}
          export interface A {}
          export interface B {}
        `,
        code: dedent`
          export interface A {}
          export interface B {}
          interface C {}
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array with string pattern', ['noMatch', 'hello']],
      ['case-insensitive regex object', { pattern: 'HELLO', flags: 'i' }],
      [
        'array with regex object',
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ],
    ])(
      'filters functions by element name pattern - %s',
      async (_description, elementNamePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'functionsStartingWithHello',
                  selector: 'function',
                  elementNamePattern,
                },
              ],
              groups: ['functionsStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'functionsStartingWithHello',
                right: 'helloFunction',
                leftGroup: 'unknown',
                left: 'func',
              },
              messageId: 'unexpectedModulesGroupOrder',
            },
          ],
          output: dedent`
            function helloFunction() {}
            interface A {}
            interface B {}
            function func() {}
          `,
          code: dedent`
            interface A {}
            interface B {}
            function func() {}
            function helloFunction() {}
          `,
        })
      },
    )

    it.each([
      ['string pattern', 'Hello'],
      ['array with string pattern', ['noMatch', 'Hello']],
      ['case-insensitive regex object', { pattern: 'HELLO', flags: 'i' }],
      [
        'array with regex object',
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ],
    ])(
      'filters classes by decorator name pattern - %s',
      async (_description, decoratorNamePattern) => {
        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'classesWithDecoratorStartingWithHello',
                leftGroup: 'unknown',
                left: 'func',
                right: 'C',
              },
              messageId: 'unexpectedModulesGroupOrder',
            },
            {
              data: { right: 'AnotherClass', left: 'C' },
              messageId: 'unexpectedModulesOrder',
            },
          ],
          options: [
            {
              customGroups: [
                {
                  groupName: 'classesWithDecoratorStartingWithHello',
                  decoratorNamePattern,
                  selector: 'class',
                },
              ],
              groups: ['classesWithDecoratorStartingWithHello', 'unknown'],
            },
          ],
          output: dedent`
            @HelloDecorator()
            class AnotherClass {}

            @HelloDecorator
            class C {}

            @Decorator
            class A {}

            class B {}

            function func() {}
          `,
          code: dedent`
            @Decorator
            class A {}

            class B {}

            function func() {}

            @HelloDecorator
            class C {}

            @HelloDecorator()
            class AnotherClass {}
          `,
        })
      },
    )

    it('filters elements using complex decorator name patterns', async () => {
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
              right: 'B',
              left: 'A',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        output: dedent`
          @B.B()
          class B {}

          @A.A.A(() => A)
          class A {}
        `,
        code: dedent`
          @A.A.A(() => A)
          class A {}

          @B.B()
          class B {}
        `,
      })
    })

    it('overrides sort type and order for custom groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'reversedFunctionsByLineLength',
              leftGroup: 'unknown',
              right: 'aFunction',
              left: 'DDDD',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: {
              rightGroup: 'reversedFunctionsByLineLength',
              right: 'anotherFunction',
              leftGroup: 'unknown',
              left: 'G',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: { right: 'yetAnotherFunction', left: 'anotherFunction' },
            messageId: 'unexpectedModulesOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedFunctionsByLineLength',
                selector: 'function',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedFunctionsByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          function yetAnotherFunction() {}

          function anotherFunction() {}

          function aFunction() {}

          interface A {}

          interface BB {}

          interface CCC {}

          interface DDDD {}

          interface EEE {}

          interface FF {}

          interface G {}
        `,
        code: dedent`
          interface A {}

          interface BB {}

          interface CCC {}

          interface DDDD {}

          function aFunction() {}

          interface EEE {}

          interface FF {}

          interface G {}

          function anotherFunction() {}

          function yetAnotherFunction() {}
        `,
      })
    })

    it('applies fallback sort when primary sort results in ties', async () => {
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
            messageId: 'unexpectedModulesOrder',
          },
        ],
        output: dedent`
          function fooBar() {}
          function fooZar() {}
        `,
        code: dedent`
          function fooZar() {}
          function fooBar() {}
        `,
      })
    })

    it('preserves original order for unsorted custom groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedFunctions',
                selector: 'function',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedFunctions', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedFunctions',
              leftGroup: 'unknown',
              left: 'Interface',
              right: 'c',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        output: dedent`
          function b() {}

          function a() {}

          function d() {}

          function e() {}

          function c() {}

          interface Interface {}
        `,
        code: dedent`
          function b() {}

          function a() {}

          function d() {}

          function e() {}

          interface Interface {}

          function c() {}
        `,
      })
    })

    it('sorts elements within custom group blocks', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    selector: 'interface',
                    modifiers: ['export'],
                  },
                  {
                    selector: 'function',
                    modifiers: ['async'],
                  },
                ],
                groupName: 'exportInterfacesAndAsyncFunctions',
              },
            ],
            groups: [['exportInterfacesAndAsyncFunctions', 'class'], 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'class',
              left: 'func',
              right: 'C',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: { right: 'aFunction', left: 'C' },
            messageId: 'unexpectedModulesOrder',
          },
          {
            data: { right: 'anotherFunction', left: 'D' },
            messageId: 'unexpectedModulesOrder',
          },
        ],
        output: dedent`
          export interface A {}

          async function aFunction() {}

          async function anotherFunction() {}

          class b {}

          class C {}

          export interface D {}

          class E {}

          function func() {}
        `,
        code: dedent`
          export interface A {}

          class b {}

          class E {}

          function func() {}

          class C {}

          async function aFunction() {}

          export interface D {}

          async function anotherFunction() {}
        `,
      })
    })

    it('supports negative regex patterns for element names in custom groups', async () => {
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
          function iHaveFooInMyName() {}
          function meTooIHaveFoo() {}
          function a() {}
          function b() {}
        `,
      })
    })

    it('supports regex patterns for decorator names in custom groups', async () => {
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
          @IHaveFooInMyName
          class X {}
          @MeTooIHaveFoo
          class Y {}
          class A {}
          class B {}
        `,
      })
    })

    it('enforces newlines between group members when newlinesInside is 1', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'group1',
                newlinesInside: 1,
                selector: 'type',
              },
            ],
            groups: ['group1'],
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenModulesMembers',
            data: { right: 'B', left: 'A' },
          },
        ],
        output: dedent`
          type A = {}

          type B = {}
        `,
        code: dedent`
          type A = {}
          type B = {}
        `,
      })
    })

    it('removes newlines between group members when newlinesInside is 0', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'group1',
                newlinesInside: 0,
                selector: 'type',
              },
            ],
            type: 'alphabetical',
            groups: ['group1'],
          },
        ],
        errors: [
          {
            messageId: 'extraSpacingBetweenModulesMembers',
            data: { right: 'B', left: 'A' },
          },
        ],
        output: dedent`
          type A = {}
          type B = {}
        `,
        code: dedent`
          type A = {}

          type B = {}
        `,
      })
    })

    it('prioritizes declare modifier over export modifier', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'declare-interface',
              leftGroup: 'function',
              right: 'Interface',
              left: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['declare-interface', 'function', 'export-interface'],
          },
        ],
        output: dedent`
          export declare interface Interface {}

          function f() {}
        `,
        code: dedent`
          function f() {}

          export declare interface Interface {}
        `,
      })
    })

    it('prioritizes default modifier over export modifier', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'default-interface',
              leftGroup: 'function',
              right: 'Interface',
              left: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['default-interface', 'function', 'export-interface'],
          },
        ],
        output: dedent`
          export default interface Interface {}

          function f() {}
        `,
        code: dedent`
          function f() {}

          export default interface Interface {}
        `,
      })
    })

    it('prioritizes declare modifier over export modifier for type declarations', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'declare-type',
              leftGroup: 'function',
              right: 'Type',
              left: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['declare-type', 'function', 'export-type'],
          },
        ],
        output: dedent`
          export declare type Type = {}

          function f() {}
        `,
        code: dedent`
          function f() {}

          export declare type Type = {}
        `,
      })
    })

    it('prioritizes declare modifier over export modifier for class declarations', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'declare-class',
              leftGroup: 'function',
              right: 'Class',
              left: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['declare-class', 'function', 'export-class'],
          },
        ],
        output: dedent`
          export declare class Class {}

          function f() {}
        `,
        code: dedent`
          function f() {}

          export declare class Class {}
        `,
      })
    })

    it('prioritizes declare modifier over export modifier for function declarations', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'declare-function',
              leftGroup: 'interface',
              left: 'Interface',
              right: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['declare-function', 'interface', 'export-function'],
          },
        ],
        output: dedent`
          export declare function f()

          interface Interface {}
        `,
        code: dedent`
          interface Interface {}

          export declare function f()
        `,
      })
    })

    it('prioritizes default modifier over async modifier for functions', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'default-function',
              leftGroup: 'interface',
              left: 'Interface',
              right: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['default-function', 'interface', 'async-function'],
          },
        ],
        output: dedent`
          export default async function f() {}

          interface Interface {}
        `,
        code: dedent`
          interface Interface {}

          export default async function f() {}
        `,
      })
    })

    it('prioritizes async modifier over export modifier for functions', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'async-function',
              leftGroup: 'interface',
              left: 'Interface',
              right: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['async-function', 'interface', 'export-function'],
          },
        ],
        output: dedent`
          export async function f() {}

          interface Interface {}
        `,
        code: dedent`
          interface Interface {}

          export async function f() {}
        `,
      })
    })

    it('prioritizes declare modifier over export modifier for enum declarations', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'declare-enum',
              leftGroup: 'function',
              right: 'Enum',
              left: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['declare-enum', 'function', 'export-enum'],
          },
        ],
        output: dedent`
          export declare enum Enum {}

          function f() {}
        `,
        code: dedent`
          function f() {}

          export declare enum Enum {}
        `,
      })
    })

    it('ignores non-static class method dependencies', async () => {
      await valid({
        code: dedent`
          class A {
            f() {
              return Enum.V
            }
          }

          enum Enum {
            V = 'V'
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

    it('ignores static class method dependencies when no static block or properties exist', async () => {
      await valid({
        code: dedent`
          class A {
            static f() {
              return Enum.V
            }
          }

          enum Enum {
            V = 'V'
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

    it('detects static class method dependencies when static block is present', async () => {
      await valid({
        code: dedent`
          enum Enum {
            V = 'V'
          }

          class A {
            static {
              console.log(Enum.V)
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

      await valid({
        code: dedent`
          enum Enum {
            V = 'V'
          }

          class A {
            static {
              console.log(A.f())
            }

            static f = () => {
              return Enum.V
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

      await valid({
        code: dedent`
          enum Enum {
            V = 'V'
          }

          class Class {
            static {
              const method = () => {
                return Enum.V || true;
              };
              method();
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

    it('detects static class method dependencies when static property is present', async () => {
      await valid({
        code: dedent`
          enum Enum {
            V = 'V'
          }

          class A {
            static a = Enum.V
          }
        `,
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
      })

      await valid({
        code: dedent`
          enum Enum {
            V = 'V'
          }

          class A {
            static accessor a = Enum.V
          }
        `,
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
      })

      await valid({
        code: dedent`
          enum Enum {
            V = 'V'
          }

          class A {
            static a = Object.values(Enum)
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

    it('ignores non-static arrow method dependencies', async () => {
      await valid({
        code: dedent`
          class A {
            f = () => {
              return Enum.V
            }
          }

          enum Enum {
            V = 'V'
          }
        `,
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
      })

      await valid({
        code: dedent`
          class A {
            accessor f = () => {
              return Enum.V
            }
          }

          enum Enum {
            V = 'V'
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

    it('ignores static arrow method dependencies when no static block or properties exist', async () => {
      await valid({
        code: dedent`
          class A {
            static f = () => {
              return Enum.V
            }
          }

          enum Enum {
            V = 'V'
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

    it('ignores interface type dependencies', async () => {
      await valid({
        code: dedent`
          interface A {
            a: Enum.V
          }

          enum Enum {
            V = 'V'
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

    it('ignores type alias dependencies', async () => {
      await valid({
        code: dedent`
          type A = {
            a: Enum.V
          }

          enum Enum {
            V = 'V'
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

    it('detects enum value dependencies', async () => {
      await valid({
        code: dedent`
          enum B {
            V = 'V'
          }

          enum A {
            V = B.V
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

    it('detects deeply nested dependencies', async () => {
      await invalid({
        output: dedent`
          class B {
            static b = 1
          }

          class A {
            static a = x > y ? new Class([...{...!!method(1 + <any>(B?.b! as any))}]) : null
          }
        `,
        code: dedent`
          class A {
            static a = x > y ? new Class([...{...!!method(1 + <any>(B?.b! as any))}]) : null
          }

          class B {
            static b = 1
          }
        `,
        errors: [
          {
            data: { nodeDependentOnRight: 'A', right: 'B' },
            messageId: 'unexpectedModulesDependencyOrder',
          },
        ],
        options: [options],
      })
    })

    it('detects dependencies in template literal expressions', async () => {
      await valid({
        code: dedent`
          class B {
            static b = 1
          }

          class A {
            static a = \`\${B.b}\`
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

    it('detects dependencies in class inheritance', async () => {
      await valid({
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        code: dedent`
          class B {}

          class A extends B {}
        `,
      })
    })

    it('detects dependencies in decorator expressions', async () => {
      await invalid({
        output: dedent`
          enum B {}

          class A {
            @SomeDecorator({
              a: {
                b: c.concat([B])
              }
            })
            property
          }
        `,
        code: dedent`
          class A {
            @SomeDecorator({
              a: {
                b: c.concat([B])
              }
            })
            property
          }

          enum B {}
        `,
        errors: [
          {
            data: { nodeDependentOnRight: 'A', right: 'B' },
            messageId: 'unexpectedModulesDependencyOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
      })
    })

    it('detects and handles circular dependencies', async () => {
      await invalid({
        output: dedent`
          class A {
            static a = B.b
          }

          class B {
            static b = C.c
          }

          class C {
            static c = A.a
          }
        `,
        code: dedent`
          class B {
            static b = C.c
          }

          class A {
            static a = B.b
          }

          class C {
            static c = A.a
          }
        `,
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
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
            groups: ['export-class', 'class'],
          },
        ],
        code: dedent`
          class B { static b }
          export class A { static a = B.b }
        `,
      })
    })

    it('prioritizes dependencies over partition by comment', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'B', right: 'A' },
            messageId: 'unexpectedModulesDependencyOrder',
          },
        ],
        output: dedent`
          class A { static a }
          // Part1
          class B { static b = A.a }
        `,
        code: dedent`
          class B { static b = A.a }
          // Part1
          class A { static a }
        `,
        options: [
          {
            ...options,
            partitionByComment: 'Part',
          },
        ],
      })
    })

    it('prioritizes dependencies over partition by new line', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'B', right: 'A' },
            messageId: 'unexpectedModulesDependencyOrder',
          },
        ],
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
        output: dedent`
          class A { static a }

          class B { static = A.a }
        `,
        code: dedent`
          class B { static = A.a }

          class A { static a }
        `,
      })
    })

    it('handles unknown groups correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'function',
              rightGroup: 'unknown',
              right: 'SomeClass',
              left: 'b',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: {
              rightGroup: 'function',
              leftGroup: 'unknown',
              left: 'SomeClass',
              right: 'a',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        output: dedent`
          function a() {}
          class SomeClass {}
          function b() {}
        `,
        code: dedent`
          function b() {}
          class SomeClass {}
          function a() {}
        `,
        options: [
          {
            ...options,
            groups: ['function'],
          },
        ],
      })
    })

    it('trims special characters when configured', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
        code: dedent`
          function _a() {}
          function b() {}
          function _c() {}
        `,
      })
    })

    it('removes special characters when configured', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          function ab() {}
          function a_c() {}
        `,
      })
    })

    it('sorts using locale-specific rules', async () => {
      await valid({
        code: dedent`
          function 你好() {}
          function 世界() {}
          function a() {}
          function A() {}
          function b() {}
          function B() {}
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('removes newlines between groups when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'interface',
              rightGroup: 'unknown',
              right: 'y',
              left: 'A',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'b', left: 'z' },
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown', 'interface'],
            newlinesInside: 'ignore',
            newlinesBetween: 0,
          },
        ],
        output: dedent`
            function b() {}


           function y() {}
          function z() {}
              interface A {}
        `,
        code: dedent`
            interface A {}


           function y() {}
          function z() {}

              function b() {}
        `,
      })
    })

    it('maintains single newline between groups when newlinesBetween is 1', async () => {
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
            groups: ['a', 'b'],
            newlinesBetween: 1,
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenModulesMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          function a() {};

          function b() {}
        `,
        code: dedent`
          function a() {};function b() {}
        `,
      })

      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenModulesMembers',
            data: { right: 'z', left: 'A' },
          },
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'y', left: 'z' },
          },
          {
            messageId: 'missedSpacingBetweenModulesMembers',
            data: { right: 'B', left: 'y' },
          },
        ],
        options: [
          {
            ...options,
            groups: ['interface', 'unknown', 'class'],
            newlinesBetween: 1,
          },
        ],
        output: dedent`
            interface A {}

           function y() {}
          function z() {}

              class B {}
        `,
        code: dedent`
            interface A {}


           function z() {}
          function y() {}
              class B {}
        `,
      })
    })

    it('handles newlinesBetween settings between consecutive groups', async () => {
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
            messageId: 'missedSpacingBetweenModulesMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenModulesMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenModulesMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          function a() {}

          function b() {}

          function c() {}
          function d() {}


          function e() {}
        `,
        code: dedent`
          function a() {}
          function b() {}


          function c() {}

          function d() {}


          function e() {}
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
              messageId: 'missedSpacingBetweenModulesMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            function a() {}


            function b() {}
          `,
          code: dedent`
            function a() {}
            function b() {}
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
              messageId: 'extraSpacingBetweenModulesMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            function a() {}
            function b() {}
          `,
          code: dedent`
            function a() {}

            function b() {}
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
            function a() {}

            function b() {}
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
            function a() {}
            function b() {}
          `,
        })
      },
    )

    it('handles newlines and comments after fixes', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'function',
              leftGroup: 'type',
              right: 'a',
              left: 'B',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            groups: ['function', 'type'],
            newlinesBetween: 1,
            newlinesInside: 0,
          },
        ],
        output: dedent`
          function a() {} // Comment after

          type B = string
          type C = string
        `,
        code: dedent`
          type B = string
          function a() {} // Comment after

          type C = string
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
            messageId: 'unexpectedModulesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          function a() {}

          // Partition comment

          function b() {}
          function c() {}
        `,
        code: dedent`
          function a() {}

          // Partition comment

          function c() {}
          function b() {}
        `,
      })
    })

    it('sorts inline non-declare functions correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          function a() {} function b() {}
        `,
        code: dedent`
          function b() {} function a() {}
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          function a() {} function b() {};
        `,
        code: dedent`
          function b() {} function a() {};
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          function a() {}; function b() {}
        `,
        code: dedent`
          function b() {}; function a() {}
        `,
        options: [options],
      })
    })

    it('sorts inline declare functions correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          declare function a(); declare function b();
        `,
        code: dedent`
          declare function b(); declare function a()
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          declare function a(); declare function b();
        `,
        code: dedent`
          declare function b(); declare function a();
        `,
        options: [options],
      })
    })

    it('sorts inline interfaces correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          interface A {} interface B {}
        `,
        code: dedent`
          interface B {} interface A {}
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          interface A {} interface B {};
        `,
        code: dedent`
          interface B {} interface A {};
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          interface A {}; interface B {}
        `,
        code: dedent`
          interface B {}; interface A {}
        `,
        options: [options],
      })
    })

    it('sorts inline type aliases correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type a = {}; type b = {};
        `,
        code: dedent`
          type b = {}; type a = {}
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          type a = {}; type b = {};
        `,
        code: dedent`
          type b = {}; type a = {};
        `,
        options: [options],
      })
    })

    it('sorts inline classes correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          class A {} class B {}
        `,
        code: dedent`
          class B {} class A {}
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          class A {} class B {};
        `,
        code: dedent`
          class B {} class A {};
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          class A {}; class B {}
        `,
        code: dedent`
          class B {}; class A {}
        `,
        options: [options],
      })
    })

    it('sorts inline enums correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          enum A {} enum B {}
        `,
        code: dedent`
          enum B {} enum A {}
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          enum A {} enum B {};
        `,
        code: dedent`
          enum B {} enum A {};
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          enum A {}; enum B {}
        `,
        code: dedent`
          enum B {}; enum A {}
        `,
        options: [options],
      })
    })

    it('ignores exported decorated classes when sorting', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'B', left: 'C' },
          },
        ],
        output: dedent`
          @B
          class B {}

          @A
          export class A {}

          @C
          class C {}
        `,
        code: dedent`
          @C
          class C {}

          @A
          export class A {}

          @B
          class B {}
        `,
        options: [
          {
            ...options,
            groups: ['unknown'],
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

    it('sorts modules according to group hierarchy', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'export-interface',
              left: 'FindUserInput',
              right: 'CacheType',
              rightGroup: 'enum',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: {
              rightGroup: 'export-function',
              left: 'assertInputIsCorrect',
              leftGroup: 'function',
              right: 'findUser',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: {
              leftGroup: 'export-function',
              right: 'FindAllUsersInput',
              rightGroup: 'export-type',
              left: 'findUser',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: {
              leftGroup: 'export-function',
              left: 'findAllUsers',
              rightGroup: 'class',
              right: 'Cache',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        output: dedent`
          enum CacheType {
            ALWAYS = 'ALWAYS',
            NEVER = 'NEVER',
          }

          export type FindUserOutput = {
            name: string
            age: number
            id: string
          }

          export type FindAllUsersInput = {
            cache: CacheType
            ids: string[]
          }

          export interface FindUserInput {
            id: string
            cache: CacheType
          }

          export type FindAllUsersOutput = FindUserOutput[]

          class Cache {
            // Some logic
          }

          export function findAllUsers(input: FindAllUsersInput): FindAllUsersOutput {
            assertInputIsCorrect(input)
            return _findUserByIds(input.ids)
          }

          export function findUser(input: FindUserInput): FindUserOutput {
            assertInputIsCorrect(input)
            return _findUserByIds([input.id])[0]
          }

          function assertInputIsCorrect(input: FindUserInput | FindAllUsersInput): void {
            // Some logic
          }

        `,
        code: dedent`
          export interface FindUserInput {
            id: string
            cache: CacheType
          }

          enum CacheType {
            ALWAYS = 'ALWAYS',
            NEVER = 'NEVER',
          }

          export type FindUserOutput = {
            name: string
            age: number
            id: string
          }

          function assertInputIsCorrect(input: FindUserInput | FindAllUsersInput): void {
            // Some logic
          }

          export function findUser(input: FindUserInput): FindUserOutput {
            assertInputIsCorrect(input)
            return _findUserByIds([input.id])[0]
          }

          export type FindAllUsersInput = {
            cache: CacheType
            ids: string[]
          }

          export type FindAllUsersOutput = FindUserOutput[]

          export function findAllUsers(input: FindAllUsersInput): FindAllUsersOutput {
            assertInputIsCorrect(input)
            return _findUserByIds(input.ids)
          }

          class Cache {
            // Some logic
          }
        `,
        options: [options],
      })
    })

    it('sorts modules within modules and namespaces', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'AA', left: 'B' },
          },
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'AA', left: 'B' },
          },
        ],
        output: dedent`
          module ModuleB {
            interface AA {}
            interface B {}
          }
          module ModuleA {
            interface AA {}
            interface B {}
          }
        `,
        code: dedent`
          module ModuleB {
            interface B {}
            interface AA {}
          }
          module ModuleA {
            interface B {}
            interface AA {}
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'AA', left: 'B' },
          },
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'AA', left: 'B' },
          },
        ],
        output: dedent`
          namespace NamespaceB {
            interface AA {}
            interface B {}
          }
          namespace NamespaceA {
            interface AA {}
            interface B {}
          }
        `,
        code: dedent`
          namespace NamespaceB {
            interface B {}
            interface AA {}
          }
          namespace NamespaceA {
            interface B {}
            interface AA {}
          }
        `,
        options: [options],
      })
    })

    it('creates partitions at variable declarations', async () => {
      await valid({
        code: dedent`
          interface B {}
          let a;
          interface A {}
        `,
        options: [options],
      })
    })

    it('creates partitions at function call expressions', async () => {
      await valid({
        code: dedent`
          interface B {}
          iAmCallingAFunction();
          interface A {}
        `,
        options: [options],
      })
    })

    it('accepts complex predefined group configurations', async () => {
      await valid({
        options: [
          {
            ...options,
            groups: [
              'export-declare-interface',
              'export-default-interface',
              'export-declare-function',
              'export-default-async-function',
              'export-decorated-class',
              'export-default-decorated-class',
              'export-declare-type',
              'export-enum',
              'export-declare-enum',
              'unknown',
            ],
          },
        ],
        code: dedent`
          export declare interface Interface {}

          export default interface Interface2 {}

          export declare function f2()

          export default async function f1()

          export @Decorator declare class Class1 {}

          export @Decorator default class Class2 {}

          export declare type Type = {}

          export enum Enum1 {}

          export declare enum Enum2 {}
        `,
      })
    })

    it('filters elements based on selector and modifiers', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unusedCustomGroup',
                modifiers: ['export'],
                selector: 'type',
              },
              {
                groupName: 'exportInterfaceGroup',
                selector: 'interface',
                modifiers: ['export'],
              },
              {
                groupName: 'interfaceGroup',
                selector: 'interface',
              },
            ],
            groups: ['interfaceGroup', 'exportInterfaceGroup'],
          },
        ],
        errors: [
          {
            data: {
              leftGroup: 'exportInterfaceGroup',
              rightGroup: 'interfaceGroup',
              right: 'C',
              left: 'B',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        output: dedent`
          interface C {}
          export interface A {}
          export interface B {}
        `,
        code: dedent`
          export interface A {}
          export interface B {}
          interface C {}
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array with string pattern', ['noMatch', 'hello']],
      ['case-insensitive regex object', { pattern: 'HELLO', flags: 'i' }],
      [
        'array with regex object',
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ],
    ])(
      'filters functions by element name pattern - %s',
      async (_description, elementNamePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'functionsStartingWithHello',
                  selector: 'function',
                  elementNamePattern,
                },
              ],
              groups: ['functionsStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'functionsStartingWithHello',
                right: 'helloFunction',
                leftGroup: 'unknown',
                left: 'func',
              },
              messageId: 'unexpectedModulesGroupOrder',
            },
          ],
          output: dedent`
            function helloFunction() {}
            interface A {}
            interface B {}
            function func() {}
          `,
          code: dedent`
            interface A {}
            interface B {}
            function func() {}
            function helloFunction() {}
          `,
        })
      },
    )

    it.each([
      ['string pattern', 'Hello'],
      ['array with string pattern', ['noMatch', 'Hello']],
      ['case-insensitive regex object', { pattern: 'HELLO', flags: 'i' }],
      [
        'array with regex object',
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ],
    ])(
      'filters classes by decorator name pattern - %s',
      async (_description, decoratorNamePattern) => {
        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'classesWithDecoratorStartingWithHello',
                leftGroup: 'unknown',
                left: 'func',
                right: 'C',
              },
              messageId: 'unexpectedModulesGroupOrder',
            },
            {
              data: { right: 'AnotherClass', left: 'C' },
              messageId: 'unexpectedModulesOrder',
            },
          ],
          options: [
            {
              customGroups: [
                {
                  groupName: 'classesWithDecoratorStartingWithHello',
                  decoratorNamePattern,
                  selector: 'class',
                },
              ],
              groups: ['classesWithDecoratorStartingWithHello', 'unknown'],
            },
          ],
          output: dedent`
            @HelloDecorator()
            class AnotherClass {}

            @HelloDecorator
            class C {}

            @Decorator
            class A {}

            class B {}

            function func() {}
          `,
          code: dedent`
            @Decorator
            class A {}

            class B {}

            function func() {}

            @HelloDecorator
            class C {}

            @HelloDecorator()
            class AnotherClass {}
          `,
        })
      },
    )

    it('filters elements using complex decorator name patterns', async () => {
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
              right: 'B',
              left: 'A',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        output: dedent`
          @B.B()
          class B {}

          @A.A.A(() => A)
          class A {}
        `,
        code: dedent`
          @A.A.A(() => A)
          class A {}

          @B.B()
          class B {}
        `,
      })
    })

    it('overrides sort type and order for custom groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'reversedFunctionsByLineLength',
              leftGroup: 'unknown',
              right: 'aFunction',
              left: 'DDDD',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: {
              rightGroup: 'reversedFunctionsByLineLength',
              right: 'anotherFunction',
              leftGroup: 'unknown',
              left: 'G',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: { right: 'yetAnotherFunction', left: 'anotherFunction' },
            messageId: 'unexpectedModulesOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedFunctionsByLineLength',
                selector: 'function',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedFunctionsByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          function yetAnotherFunction() {}

          function anotherFunction() {}

          function aFunction() {}

          interface A {}

          interface BB {}

          interface CCC {}

          interface DDDD {}

          interface EEE {}

          interface FF {}

          interface G {}
        `,
        code: dedent`
          interface A {}

          interface BB {}

          interface CCC {}

          interface DDDD {}

          function aFunction() {}

          interface EEE {}

          interface FF {}

          interface G {}

          function anotherFunction() {}

          function yetAnotherFunction() {}
        `,
      })
    })

    it('applies fallback sort when primary sort results in ties', async () => {
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
            messageId: 'unexpectedModulesOrder',
          },
        ],
        output: dedent`
          function fooBar() {}
          function fooZar() {}
        `,
        code: dedent`
          function fooZar() {}
          function fooBar() {}
        `,
      })
    })

    it('preserves original order for unsorted custom groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedFunctions',
                selector: 'function',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedFunctions', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedFunctions',
              leftGroup: 'unknown',
              left: 'Interface',
              right: 'c',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        output: dedent`
          function b() {}

          function a() {}

          function d() {}

          function e() {}

          function c() {}

          interface Interface {}
        `,
        code: dedent`
          function b() {}

          function a() {}

          function d() {}

          function e() {}

          interface Interface {}

          function c() {}
        `,
      })
    })

    it('sorts elements within custom group blocks', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    selector: 'interface',
                    modifiers: ['export'],
                  },
                  {
                    selector: 'function',
                    modifiers: ['async'],
                  },
                ],
                groupName: 'exportInterfacesAndAsyncFunctions',
              },
            ],
            groups: [['exportInterfacesAndAsyncFunctions', 'class'], 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'class',
              left: 'func',
              right: 'C',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: { right: 'aFunction', left: 'C' },
            messageId: 'unexpectedModulesOrder',
          },
          {
            data: { right: 'anotherFunction', left: 'D' },
            messageId: 'unexpectedModulesOrder',
          },
        ],
        output: dedent`
          export interface A {}

          async function aFunction() {}

          async function anotherFunction() {}

          class b {}

          class C {}

          export interface D {}

          class E {}

          function func() {}
        `,
        code: dedent`
          export interface A {}

          class b {}

          class E {}

          function func() {}

          class C {}

          async function aFunction() {}

          export interface D {}

          async function anotherFunction() {}
        `,
      })
    })

    it('supports negative regex patterns for element names in custom groups', async () => {
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
          function iHaveFooInMyName() {}
          function meTooIHaveFoo() {}
          function a() {}
          function b() {}
        `,
      })
    })

    it('supports regex patterns for decorator names in custom groups', async () => {
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
          @IHaveFooInMyName
          class X {}
          @MeTooIHaveFoo
          class Y {}
          class A {}
          class B {}
        `,
      })
    })

    it('enforces newlines between group members when newlinesInside is 1', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'group1',
                newlinesInside: 1,
                selector: 'type',
              },
            ],
            groups: ['group1'],
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenModulesMembers',
            data: { right: 'B', left: 'A' },
          },
        ],
        output: dedent`
          type A = {}

          type B = {}
        `,
        code: dedent`
          type A = {}
          type B = {}
        `,
      })
    })

    it('removes newlines between group members when newlinesInside is 0', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'group1',
                newlinesInside: 0,
                selector: 'type',
              },
            ],
            type: 'alphabetical',
            groups: ['group1'],
          },
        ],
        errors: [
          {
            messageId: 'extraSpacingBetweenModulesMembers',
            data: { right: 'B', left: 'A' },
          },
        ],
        output: dedent`
          type A = {}
          type B = {}
        `,
        code: dedent`
          type A = {}

          type B = {}
        `,
      })
    })

    it('prioritizes declare modifier over export modifier', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'declare-interface',
              leftGroup: 'function',
              right: 'Interface',
              left: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['declare-interface', 'function', 'export-interface'],
          },
        ],
        output: dedent`
          export declare interface Interface {}

          function f() {}
        `,
        code: dedent`
          function f() {}

          export declare interface Interface {}
        `,
      })
    })

    it('prioritizes default modifier over export modifier', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'default-interface',
              leftGroup: 'function',
              right: 'Interface',
              left: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['default-interface', 'function', 'export-interface'],
          },
        ],
        output: dedent`
          export default interface Interface {}

          function f() {}
        `,
        code: dedent`
          function f() {}

          export default interface Interface {}
        `,
      })
    })

    it('prioritizes declare modifier over export modifier for type declarations', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'declare-type',
              leftGroup: 'function',
              right: 'Type',
              left: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['declare-type', 'function', 'export-type'],
          },
        ],
        output: dedent`
          export declare type Type = {}

          function f() {}
        `,
        code: dedent`
          function f() {}

          export declare type Type = {}
        `,
      })
    })

    it('prioritizes declare modifier over export modifier for class declarations', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'declare-class',
              leftGroup: 'function',
              right: 'Class',
              left: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['declare-class', 'function', 'export-class'],
          },
        ],
        output: dedent`
          export declare class Class {}

          function f() {}
        `,
        code: dedent`
          function f() {}

          export declare class Class {}
        `,
      })
    })

    it('prioritizes declare modifier over export modifier for function declarations', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'declare-function',
              leftGroup: 'interface',
              left: 'Interface',
              right: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['declare-function', 'interface', 'export-function'],
          },
        ],
        output: dedent`
          export declare function f()

          interface Interface {}
        `,
        code: dedent`
          interface Interface {}

          export declare function f()
        `,
      })
    })

    it('prioritizes default modifier over async modifier for functions', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'default-function',
              leftGroup: 'interface',
              left: 'Interface',
              right: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['default-function', 'interface', 'async-function'],
          },
        ],
        output: dedent`
          export default async function f() {}

          interface Interface {}
        `,
        code: dedent`
          interface Interface {}

          export default async function f() {}
        `,
      })
    })

    it('prioritizes async modifier over export modifier for functions', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'async-function',
              leftGroup: 'interface',
              left: 'Interface',
              right: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['async-function', 'interface', 'export-function'],
          },
        ],
        output: dedent`
          export async function f() {}

          interface Interface {}
        `,
        code: dedent`
          interface Interface {}

          export async function f() {}
        `,
      })
    })

    it('prioritizes declare modifier over export modifier for enum declarations', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'declare-enum',
              leftGroup: 'function',
              right: 'Enum',
              left: 'f',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['declare-enum', 'function', 'export-enum'],
          },
        ],
        output: dedent`
          export declare enum Enum {}

          function f() {}
        `,
        code: dedent`
          function f() {}

          export declare enum Enum {}
        `,
      })
    })

    it('ignores non-static class method dependencies', async () => {
      await valid({
        code: dedent`
          class A {
            f() {
              return Enum.V
            }
          }

          enum Enum {
            V = 'V'
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

    it('ignores static class method dependencies when no static block or properties exist', async () => {
      await valid({
        code: dedent`
          class A {
            static f() {
              return Enum.V
            }
          }

          enum Enum {
            V = 'V'
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

    it('detects static class method dependencies when static block is present', async () => {
      await valid({
        code: dedent`
          enum Enum {
            V = 'V'
          }

          class A {
            static {
              console.log(Enum.V)
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

      await valid({
        code: dedent`
          enum Enum {
            V = 'V'
          }

          class A {
            static {
              console.log(A.f())
            }

            static f = () => {
              return Enum.V
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

      await valid({
        code: dedent`
          enum Enum {
            V = 'V'
          }

          class Class {
            static {
              const method = () => {
                return Enum.V || true;
              };
              method();
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

    it('detects static class method dependencies when static property is present', async () => {
      await valid({
        code: dedent`
          enum Enum {
            V = 'V'
          }

          class A {
            static a = Enum.V
          }
        `,
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
      })

      await valid({
        code: dedent`
          enum Enum {
            V = 'V'
          }

          class A {
            static accessor a = Enum.V
          }
        `,
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
      })

      await valid({
        code: dedent`
          enum Enum {
            V = 'V'
          }

          class A {
            static a = Object.values(Enum)
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

    it('ignores non-static arrow method dependencies', async () => {
      await valid({
        code: dedent`
          class A {
            f = () => {
              return Enum.V
            }
          }

          enum Enum {
            V = 'V'
          }
        `,
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
      })

      await valid({
        code: dedent`
          class A {
            accessor f = () => {
              return Enum.V
            }
          }

          enum Enum {
            V = 'V'
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

    it('ignores static arrow method dependencies when no static block or properties exist', async () => {
      await valid({
        code: dedent`
          class A {
            static f = () => {
              return Enum.V
            }
          }

          enum Enum {
            V = 'V'
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

    it('ignores interface type dependencies', async () => {
      await valid({
        code: dedent`
          interface A {
            a: Enum.V
          }

          enum Enum {
            V = 'V'
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

    it('ignores type alias dependencies', async () => {
      await valid({
        code: dedent`
          type A = {
            a: Enum.V
          }

          enum Enum {
            V = 'V'
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

    it('detects enum value dependencies', async () => {
      await valid({
        code: dedent`
          enum B {
            V = 'V'
          }

          enum A {
            V = B.V
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

    it('detects deeply nested dependencies', async () => {
      await invalid({
        output: dedent`
          class B {
            static b = 1
          }

          class A {
            static a = x > y ? new Class([...{...!!method(1 + <any>(B?.b! as any))}]) : null
          }
        `,
        code: dedent`
          class A {
            static a = x > y ? new Class([...{...!!method(1 + <any>(B?.b! as any))}]) : null
          }

          class B {
            static b = 1
          }
        `,
        errors: [
          {
            data: { nodeDependentOnRight: 'A', right: 'B' },
            messageId: 'unexpectedModulesDependencyOrder',
          },
        ],
        options: [options],
      })
    })

    it('detects dependencies in template literal expressions', async () => {
      await valid({
        code: dedent`
          class B {
            static b = 1
          }

          class A {
            static a = \`\${B.b}\`
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

    it('detects dependencies in class inheritance', async () => {
      await valid({
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        code: dedent`
          class B {}

          class A extends B {}
        `,
      })
    })

    it('detects dependencies in decorator expressions', async () => {
      await invalid({
        output: dedent`
          enum B {}

          class A {
            @SomeDecorator({
              a: {
                b: c.concat([B])
              }
            })
            property
          }
        `,
        code: dedent`
          class A {
            @SomeDecorator({
              a: {
                b: c.concat([B])
              }
            })
            property
          }

          enum B {}
        `,
        errors: [
          {
            data: { nodeDependentOnRight: 'A', right: 'B' },
            messageId: 'unexpectedModulesDependencyOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
      })
    })

    it('detects and handles circular dependencies', async () => {
      await invalid({
        output: dedent`
          class AAA {
            static a = BB.b
          }

          class C {
            static c = AAA.a
          }

          class BB {
            static b = C.c
          }
        `,
        code: dedent`
          class BB {
            static b = C.c
          }

          class AAA {
            static a = BB.b
          }

          class C {
            static c = AAA.a
          }
        `,
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'AAA', left: 'BB' },
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
            groups: ['export-class', 'class'],
          },
        ],
        code: dedent`
          class B { static b }
          export class A { static a = B.b }
        `,
      })
    })

    it('prioritizes dependencies over partition by comment', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'B', right: 'A' },
            messageId: 'unexpectedModulesDependencyOrder',
          },
        ],
        output: dedent`
          class A { static a }
          // Part1
          class B { static b = A.a }
        `,
        code: dedent`
          class B { static b = A.a }
          // Part1
          class A { static a }
        `,
        options: [
          {
            ...options,
            partitionByComment: 'Part',
          },
        ],
      })
    })

    it('prioritizes dependencies over partition by new line', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'B', right: 'A' },
            messageId: 'unexpectedModulesDependencyOrder',
          },
        ],
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
        output: dedent`
          class A { static a }

          class B { static = A.a }
        `,
        code: dedent`
          class B { static = A.a }

          class A { static a }
        `,
      })
    })

    it('trims special characters when configured', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
        code: dedent`
          function _a() {}
          function bb() {}
          function _c() {}
        `,
      })
    })

    it('removes special characters when configured', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          function abc() {}
          function a_c() {}
        `,
      })
    })

    it('sorts using locale-specific rules', async () => {
      await valid({
        code: dedent`
          function 你好() {}
          function 世界() {}
          function a() {}
          function A() {}
          function b() {}
          function B() {}
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('removes newlines between groups when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'interface',
              rightGroup: 'unknown',
              left: 'AAAA',
              right: 'yy',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'bbb', left: 'z' },
          },
        ],
        options: [
          {
            ...options,
            groups: ['unknown', 'interface'],
            newlinesInside: 'ignore',
            newlinesBetween: 0,
          },
        ],
        output: dedent`
            function bbb() {}


           function yy() {}
          function z() {}
              interface AAAA {}
        `,
        code: dedent`
            interface AAAA {}


           function yy() {}
          function z() {}

              function bbb() {}
        `,
      })
    })

    it('maintains single newline between groups when newlinesBetween is 1', async () => {
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
            groups: ['a', 'b'],
            newlinesBetween: 1,
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenModulesMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          function a() {};

          function b() {}
        `,
        code: dedent`
          function a() {};function b() {}
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              left: 'AAAA',
              right: 'z',
            },
            messageId: 'extraSpacingBetweenModulesMembers',
          },
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'yy', left: 'z' },
          },
          {
            messageId: 'missedSpacingBetweenModulesMembers',
            data: { right: 'BBB', left: 'yy' },
          },
        ],
        options: [
          {
            ...options,
            groups: ['interface', 'unknown', 'class'],
            newlinesBetween: 1,
          },
        ],
        output: dedent`
            interface AAAA {}

           function yy() {}
          function z() {}

              class BBB {}
        `,
        code: dedent`
            interface AAAA {}


           function z() {}
          function yy() {}
              class BBB {}
        `,
      })
    })

    it('handles newlinesBetween settings between consecutive groups', async () => {
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
            messageId: 'missedSpacingBetweenModulesMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenModulesMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenModulesMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          function a() {}

          function b() {}

          function c() {}
          function d() {}


          function e() {}
        `,
        code: dedent`
          function a() {}
          function b() {}


          function c() {}

          function d() {}


          function e() {}
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
              messageId: 'missedSpacingBetweenModulesMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            function a() {}


            function b() {}
          `,
          code: dedent`
            function a() {}
            function b() {}
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
              messageId: 'extraSpacingBetweenModulesMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            function a() {}
            function b() {}
          `,
          code: dedent`
            function a() {}

            function b() {}
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
            function a() {}

            function b() {}
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
            function a() {}
            function b() {}
          `,
        })
      },
    )

    it('handles newlines and comments after fixes', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'function',
              leftGroup: 'type',
              right: 'a',
              left: 'B',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        options: [
          {
            groups: ['function', 'type'],
            newlinesBetween: 1,
            newlinesInside: 0,
          },
        ],
        output: dedent`
          function a() {} // Comment after

          type B = string
          type C = string
        `,
        code: dedent`
          type B = string
          function a() {} // Comment after

          type C = string
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
            messageId: 'unexpectedModulesOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
        output: dedent`
          function a() {}

          // Partition comment

          function bb() {}
          function c() {}
        `,
        code: dedent`
          function a() {}

          // Partition comment

          function c() {}
          function bb() {}
        `,
      })
    })

    it('sorts inline non-declare functions correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          function aa() {} function b() {}
        `,
        code: dedent`
          function b() {} function aa() {}
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          function aa() {} function b() {};
        `,
        code: dedent`
          function b() {} function aa() {};
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          function aa() {}; function b() {}
        `,
        code: dedent`
          function b() {}; function aa() {}
        `,
        options: [options],
      })
    })

    it('sorts inline declare functions correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          declare function aa(); declare function b();
        `,
        code: dedent`
          declare function b(); declare function aa();
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          declare function aa(); declare function b();
        `,
        code: dedent`
          declare function b(); declare function aa();
        `,
        options: [options],
      })
    })

    it('sorts inline interfaces correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'AA', left: 'B' },
          },
        ],
        output: dedent`
          interface AA {} interface B {}
        `,
        code: dedent`
          interface B {} interface AA {}
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'AA', left: 'B' },
          },
        ],
        output: dedent`
          interface AA {} interface B {};
        `,
        code: dedent`
          interface B {} interface AA {};
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'AA', left: 'B' },
          },
        ],
        output: dedent`
          interface AA {}; interface B {}
        `,
        code: dedent`
          interface B {}; interface AA {}
        `,
        options: [options],
      })
    })

    it('sorts inline type aliases correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          type aa = {}; type b = {};
        `,
        code: dedent`
          type b = {}; type aa = {}
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          type aa = {}; type b = {};
        `,
        code: dedent`
          type b = {}; type aa = {};
        `,
        options: [options],
      })
    })

    it('sorts inline classes correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'AA', left: 'B' },
          },
        ],
        output: dedent`
          class AA {} class B {}
        `,
        code: dedent`
          class B {} class AA {}
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'AA', left: 'B' },
          },
        ],
        output: dedent`
          class AA {} class B {};
        `,
        code: dedent`
          class B {} class AA {};
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'AA', left: 'B' },
          },
        ],
        output: dedent`
          class AA {}; class B {}
        `,
        code: dedent`
          class B {}; class AA {}
        `,
        options: [options],
      })
    })

    it('sorts inline enums correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'AA', left: 'B' },
          },
        ],
        output: dedent`
          enum AA {} enum B {}
        `,
        code: dedent`
          enum B {} enum AA {}
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'AA', left: 'B' },
          },
        ],
        output: dedent`
          enum AA {} enum B {};
        `,
        code: dedent`
          enum B {} enum AA {};
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'AA', left: 'B' },
          },
        ],
        output: dedent`
          enum AA {}; enum B {}
        `,
        code: dedent`
          enum B {}; enum AA {}
        `,
        options: [options],
      })
    })

    it('ignores exported decorated classes when sorting', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'BB', left: 'C' },
          },
        ],
        output: dedent`
          @B
          class BB {}

          @A
          export class AAA {}

          @C
          class C {}
        `,
        code: dedent`
          @C
          class C {}

          @A
          export class AAA {}

          @B
          class BB {}
        `,
        options: [
          {
            ...options,
            groups: ['unknown'],
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

    it('sorts modules according to group hierarchy', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'export-interface',
              left: 'FindUserInput',
              right: 'CacheType',
              rightGroup: 'enum',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: {
              rightGroup: 'export-function',
              left: 'assertInputIsCorrect',
              leftGroup: 'function',
              right: 'findUser',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: {
              leftGroup: 'export-function',
              right: 'FindAllUsersInput',
              rightGroup: 'export-type',
              left: 'findUser',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
          {
            data: {
              leftGroup: 'export-function',
              left: 'findAllUsers',
              rightGroup: 'class',
              right: 'Cache',
            },
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        output: dedent`
          enum CacheType {
            ALWAYS = 'ALWAYS',
            NEVER = 'NEVER',
          }

          export type FindAllUsersInput = {
            ids: string[]
            cache: CacheType
          }

          export type FindAllUsersOutput = FindUserOutput[]

          export interface FindUserInput {
            id: string
            cache: CacheType
          }

          export type FindUserOutput = {
            id: string
            name: string
            age: number
          }

          class Cache {
            // Some logic
          }

          export function findAllUsers(input: FindAllUsersInput): FindAllUsersOutput {
            assertInputIsCorrect(input)
            return _findUserByIds(input.ids)
          }

          export function findUser(input: FindUserInput): FindUserOutput {
            assertInputIsCorrect(input)
            return _findUserByIds([input.id])[0]
          }

          function assertInputIsCorrect(input: FindUserInput | FindAllUsersInput): void {
            // Some logic
          }
        `,
        code: dedent`
          export interface FindUserInput {
            id: string
            cache: CacheType
          }

          enum CacheType {
            ALWAYS = 'ALWAYS',
            NEVER = 'NEVER',
          }

          export type FindUserOutput = {
            id: string
            name: string
            age: number
          }

          function assertInputIsCorrect(input: FindUserInput | FindAllUsersInput): void {
            // Some logic
          }

          export function findUser(input: FindUserInput): FindUserOutput {
            assertInputIsCorrect(input)
            return _findUserByIds([input.id])[0]
          }

          export type FindAllUsersInput = {
            ids: string[]
            cache: CacheType
          }

          export type FindAllUsersOutput = FindUserOutput[]

          export function findAllUsers(input: FindAllUsersInput): FindAllUsersOutput {
            assertInputIsCorrect(input)
            return _findUserByIds(input.ids)
          }

          class Cache {
            // Some logic
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

    it('does not enforce element sorting within groups', async () => {
      await valid({
        code: dedent`
          function b() {}
          function c() {}
          function a() {}
        `,
        options: [options],
      })
    })

    it('enforces group ordering with custom groups', async () => {
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
            messageId: 'unexpectedModulesGroupOrder',
          },
        ],
        output: dedent`
          function ba() {}
          function bb() {}
          function ab() {}
          function aa() {}
        `,
        code: dedent`
          function ab() {}
          function aa() {}
          function ba() {}
          function bb() {}
        `,
      })
    })

    it('enforces newlines between groups', async () => {
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
            messageId: 'missedSpacingBetweenModulesMembers',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          function b() {}

          function a() {}
        `,
        code: dedent`
          function b() {}
          function a() {}
        `,
      })
    })

    it('enforces dependency-based ordering', async () => {
      await invalid({
        errors: [
          {
            data: { nodeDependentOnRight: 'A', right: 'B' },
            messageId: 'unexpectedModulesDependencyOrder',
          },
        ],
        output: dedent`
          class B {}
          class A extends B {}
        `,
        code: dedent`
          class A extends B {}
          class B {}
        `,
        options: [options],
      })
    })
  })

  describe('usage', () => {
    let options = {
      type: 'usage',
      order: 'asc',
    }

    it('enforces used elements to be first', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'B', left: 'C' },
          },
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          type A = 'a';
          type B = A;
          type C = B;
        `,
        code: dedent`
          type C = B;
          type B = A;
          type A = 'a';
        `,
        options: [options],
      })
    })

    it('detects and handles circular dependencies', async () => {
      await valid({
        code: dedent`
          type C = B;
          type B = A;
          type A = C;
        `,
        options: [options],
      })
    })

    it('detects usages in interface values', async () => {
      await invalid({
        output: dedent`
          type B = Something;

          export default interface A {
            field?: Record<string, [B | null] & C>;
          }
        `,
        code: dedent`
          export default interface A {
            field?: Record<string, [B | null] & C>;
          }

          type B = Something;
        `,
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
          },
        ],
      })
    })

    it('detects usages in type keys', async () => {
      await invalid({
        output: dedent`
          enum B {
            value = 'b'
          }

          type A = {
            [B.value]: string;
          }
        `,
        code: dedent`
          type A = {
            [B.value]: string;
          }

          enum B {
            value = 'b'
          }
        `,
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
          },
        ],
      })
    })

    it('detects usages in type values', async () => {
      await invalid({
        output: dedent`
          type B = Something;

          type A = {
            field: typeof B
          }
        `,
        code: dedent`
          type A = {
            field: typeof B
          }

          type B = Something;
        `,
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
          },
        ],
      })

      await invalid({
        output: dedent`
          type B = 'b';

          type A = {
            (...args: B): void;
          }
        `,
        code: dedent`
          type A = {
            (...args: B): void;
          }

          type B = 'b';
        `,
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
          },
        ],
      })
    })

    it('detects usages in type generics', async () => {
      await invalid({
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
          },
        ],
        output: dedent`
          type B = 'b';

          type A<T extends B> = {}
        `,
        code: dedent`
          type A<T extends B> = {}

          type B = 'b';
        `,
      })
    })

    it('detects usages in type indexes', async () => {
      await invalid({
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
          },
        ],
        output: dedent`
          type B = 'b';

          type A = Foo[B]
        `,
        code: dedent`
          type A = Foo[B]

          type B = 'b';
        `,
      })

      await invalid({
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
          },
        ],
        output: dedent`
          type B = 'b';

          type A = B['foo']
        `,
        code: dedent`
          type A = B['foo']

          type B = 'b';
        `,
      })
    })

    it('detects usages in conditional types', async () => {
      await invalid({
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        output: dedent`
          type B = 'b';

          type A = Foo extends B ? true : false;
        `,
        code: dedent`
          type A = Foo extends B ? true : false;

          type B = 'b';
        `,
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
          },
        ],
      })

      await invalid({
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        output: dedent`
          type B = 'b';

          type A = B extends Foo ? true : false;
        `,
        code: dedent`
          type A = B extends Foo ? true : false;

          type B = 'b';
        `,
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
          },
        ],
      })

      await invalid({
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        output: dedent`
          type B = 'b';

          type A = Foo extends Bar ? B : false;
        `,
        code: dedent`
          type A = Foo extends Bar ? B : false;

          type B = 'b';
        `,
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
          },
        ],
      })

      await invalid({
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        output: dedent`
          type B = 'b';

          type A = Foo extends Bar ? true : B;
        `,
        code: dedent`
          type A = Foo extends Bar ? true : B;

          type B = 'b';
        `,
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
          },
        ],
      })

      await invalid({
        output: dedent`
          type B = 'b';

          type A<T> = T extends {
            (...args: any[]): infer B;
          } ? Foo : Bar
        `,
        code: dedent`
          type A<T> = T extends {
            (...args: any[]): infer B;
          } ? Foo : Bar

          type B = 'b';
        `,
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
          },
        ],
      })
    })

    it('detects usages in interface extends', async () => {
      await invalid({
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
          },
        ],
        output: dedent`
          interface B {}

          interface A extends B {}
        `,
        code: dedent`
          interface A extends B {}

          interface B {}
        `,
      })
    })

    it('detects usages in classes implements', async () => {
      await invalid({
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
          },
        ],
        output: dedent`
          interface B {}

          class A implements B {}
        `,
        code: dedent`
          class A implements B {}

          interface B {}
        `,
      })
    })

    it('detects usages in functions', async () => {
      await invalid({
        output: dedent`
          type B = 'b';

          function a() {
            let foo: B;
          }
        `,
        code: dedent`
          function a() {
            let foo: B;
          }

          type B = 'b';
        `,
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
          },
        ],
      })
    })

    it('ignores parameter binding usages that shadow module-level names', async () => {
      await valid({
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        code: dedent`
          function a(B: number) {}

          type B = 'b'
        `,
      })
    })

    it('ignores usages in simple object keys', async () => {
      await valid({
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        code: dedent`
          const a = {
            B: 'b'
          }

          type B = 'b'
        `,
      })
    })

    it('ignores usages in simple object type keys', async () => {
      await valid({
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        code: dedent`
          type A = {
            B: 'b'
          }

          type B = 'b'
        `,
      })
    })

    it('ignores usages in simple arguments', async () => {
      await valid({
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        code: dedent`
          type A = (B: 'b') => void

          type B = 'b'
        `,
      })
    })

    it('ignores usages in simple interface keys', async () => {
      await valid({
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        code: dedent`
          interface A {
            B: 'b'
          }

          type B = 'b'
        `,
      })
    })

    /* Unhandled cases */
    it("doesn't support the following cases", async () => {
      await valid({
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        code: dedent`
          type B = 'b'

          function a(...B) {}
        `,
      })

      await valid({
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        code: dedent`
          type B = 'b'

          const a = (...B) => {}
        `,
      })

      await valid({
        code: dedent`
          type B = 'b'

          class A {
            a = (...B) => {}
          }
        `,
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
      })

      await valid({
        code: dedent`
          type B = 'b'

          class A {
            a(...B) {}
          }
        `,
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
      })

      await valid({
        options: [
          {
            ...options,
            groups: ['unknown'],
          },
        ],
        code: dedent`
          type B = 'b'

          type A<B> = void
        `,
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
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'B' },
          },
        ],
        output: dedent`
          function a() {}
          function A() {}
          function b() {}
          function B() {}
        `,
        code: dedent`
          function b() {}
          function B() {}
          function a() {}
          function A() {}
        `,
      })
    })

    it('sorts elements using default group order', async () => {
      await valid({
        code: dedent`
          declare enum O {}

          export enum N {}

          enum M {}

          declare interface K {}
          declare type L = {}

          export interface I {}
          export type J = {}

          interface G {}
          type H = {}

          declare class F {}

          class E {}

          export class D {}

          declare function c()

          export function b() {}

          function a() {}
        `,
        options: [
          {
            newlinesBetween: 1,
          },
        ],
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
          function ccc() {}
          function bb() {}
          function a() {}
        `,
        options: [{}],
        settings,
      })

      await valid({
        code: dedent`
          function a() {}
          function bb() {}
          function ccc() {}
        `,
        options: [{ type: 'alphabetical', order: 'asc' }],
        settings,
      })
    })

    it('preserves comments attached to their respective nodes', async () => {
      await invalid({
        output: dedent`
          // Ignore this comment

          // A4
          // A3
          /*
           * A2
           */
          // A1
          function a() {}

          /**
           * Ignore this comment as well
           */

          // B1
          function b() {}
        `,
        code: dedent`
          // Ignore this comment

          // B1
          function b() {}

          /**
           * Ignore this comment as well
           */

          // A4
          // A3
          /*
           * A2
           */
          // A1
          function a() {}
        `,
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
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

    it('handles partition comments correctly', async () => {
      await invalid({
        output: dedent`
          // Ignore this comment

          // B2
          /**
            * B1
            */
          function b() {}

          // C2
          // C1
          function c() {}

          // Above a partition comment ignore me
          // PartitionComment: 1
          function a() {}

          /**
            * D2
            */
          // D1
          function d() {}
        `,
        code: dedent`
          // Ignore this comment

          // C2
          // C1
          function c() {}

          // B2
          /**
            * B1
            */
          function b() {}

          // Above a partition comment ignore me
          // PartitionComment: 1
          /**
            * D2
            */
          // D1
          function d() {}

          function a() {}
        `,
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'b', left: 'c' },
          },
          {
            messageId: 'unexpectedModulesOrder',
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

    it('supports regex patterns for partition comments', async () => {
      await valid({
        code: dedent`
          function e() {}
          function f() {}
          // I am a partition comment because I don't have f o o
          function a() {}
          function b() {}
        `,
        options: [
          {
            partitionByComment: ['^(?!.*foo).*$'],
            type: 'alphabetical',
          },
        ],
      })
    })

    it('ignores block comments when line comments are specified', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [
          {
            partitionByComment: {
              line: true,
            },
          },
        ],
        output: dedent`
          /* Comment */
          function a() {}
          function b() {}
        `,
        code: dedent`
          function b() {}
          /* Comment */
          function a() {}
        `,
      })
    })

    it('uses line comments as partition boundaries', async () => {
      await valid({
        options: [
          {
            partitionByComment: {
              line: true,
            },
          },
        ],
        code: dedent`
          function b() {}
          // Comment
          function a() {}
        `,
      })
    })

    it('matches specific line comment patterns', async () => {
      await valid({
        code: dedent`
          function c() {}
          // b
          function b() {}
          // a
          function a() {}
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

    it('supports regex patterns for line comments', async () => {
      await valid({
        code: dedent`
          function b() {}
          // I am a partition comment because I don't have f o o
          function a() {}
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

    it('ignores line comments when block comments are specified', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [
          {
            partitionByComment: {
              block: true,
            },
          },
        ],
        output: dedent`
          // Comment
          function a() {}
          function b() {}
        `,
        code: dedent`
          function b() {}
          // Comment
          function a() {}
        `,
      })
    })

    it('uses block comments as partition boundaries', async () => {
      await valid({
        options: [
          {
            partitionByComment: {
              block: true,
            },
          },
        ],
        code: dedent`
          function b() {}
          /* Comment */
          function a() {}
        `,
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        code: dedent`
          function c() {}
          /* b */
          function b() {}
          /* a */
          function a() {}
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

    it('supports regex patterns for block comments', async () => {
      await valid({
        code: dedent`
          function b() {}
          /* I am a partition comment because I don't have f o o */
          function a() {}
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

    it('uses newlines as partition boundaries', async () => {
      await valid({
        code: dedent`
          function d() {}
          function e() {}

          function c() {}

          function a() {}
          function b() {}
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
            messageId: 'unexpectedModulesOrder',
            data: { right: 'd', left: 'e' },
          },
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          function d() {}
          function e() {}

          function c() {}

          function a() {}
          function b() {}
        `,
        code: dedent`
          function e() {}
          function d() {}

          function c() {}

          function b() {}
          function a() {}
        `,
        options: [
          {
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('ignores nodes with eslint-disable-next-line comments', async () => {
      await valid({
        code: dedent`
          function b() {}
          function c() {}
          // eslint-disable-next-line
          function a() {}
        `,
      })

      await invalid({
        output: dedent`
          function b() {}
          function c() {}
          // eslint-disable-next-line
          function a() {}
        `,
        code: dedent`
          function c() {}
          function b() {}
          // eslint-disable-next-line
          function a() {}
        `,
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })
    })

    it('handles eslint-disable with partition comments', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'c', left: 'd' },
          },
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          function b() {}
          function c() {}
          // eslint-disable-next-line
          function a() {}
          function d() {}
        `,
        code: dedent`
          function d() {}
          function c() {}
          // eslint-disable-next-line
          function a() {}
          function b() {}
        `,
        options: [
          {
            partitionByComment: true,
          },
        ],
      })
    })

    it('handles eslint-disable with class dependencies', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'B', left: 'C' },
          },
        ],
        output: dedent`
          class B extends A {}
          class C {}
          // eslint-disable-next-line
          class A {}
        `,
        code: dedent`
          class C {}
          class B extends A {}
          // eslint-disable-next-line
          class A {}
        `,
        options: [{}],
      })
    })

    it('handles inline eslint-disable-line comments', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          function b() {}
          function c() {}
          function a() {} // eslint-disable-line
        `,
        code: dedent`
          function c() {}
          function b() {}
          function a() {} // eslint-disable-line
        `,
        options: [{}],
      })
    })

    it('handles block eslint-disable-next-line comments', async () => {
      await invalid({
        output: dedent`
          function b() {}
          function c() {}
          /* eslint-disable-next-line */
          function a() {}
        `,
        code: dedent`
          function c() {}
          function b() {}
          /* eslint-disable-next-line */
          function a() {}
        `,
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })
    })

    it('handles inline block eslint-disable-line comments', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          function b() {}
          function c() {}
          function a() {} /* eslint-disable-line */
        `,
        code: dedent`
          function c() {}
          function b() {}
          function a() {} /* eslint-disable-line */
        `,
        options: [{}],
      })
    })

    it('handles eslint-disable/enable blocks', async () => {
      await invalid({
        output: dedent`
          function a() {}
          function d() {}
          /* eslint-disable */
          function c() {}
          function b() {}
          // Shouldn't move
          /* eslint-enable */
          function e() {}
        `,
        code: dedent`
          function d() {}
          function e() {}
          /* eslint-disable */
          function c() {}
          function b() {}
          // Shouldn't move
          /* eslint-enable */
          function a() {}
        `,
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [{}],
      })
    })

    it('handles rule-specific eslint-disable-next-line comments', async () => {
      await invalid({
        output: dedent`
          function b() {}
          function c() {}
          // eslint-disable-next-line rule-to-test/sort-modules
          function a() {}
        `,
        code: dedent`
          function c() {}
          function b() {}
          // eslint-disable-next-line rule-to-test/sort-modules
          function a() {}
        `,
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })
    })

    it('handles rule-specific inline eslint-disable-line comments', async () => {
      await invalid({
        output: dedent`
          function b() {}
          function c() {}
          function a() {} // eslint-disable-line rule-to-test/sort-modules
        `,
        code: dedent`
          function c() {}
          function b() {}
          function a() {} // eslint-disable-line rule-to-test/sort-modules
        `,
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })
    })

    it('handles rule-specific block eslint-disable-next-line comments', async () => {
      await invalid({
        output: dedent`
          function b() {}
          function c() {}
          /* eslint-disable-next-line rule-to-test/sort-modules */
          function a() {}
        `,
        code: dedent`
          function c() {}
          function b() {}
          /* eslint-disable-next-line rule-to-test/sort-modules */
          function a() {}
        `,
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })
    })

    it('handles rule-specific inline block eslint-disable-line comments', async () => {
      await invalid({
        output: dedent`
          function b() {}
          function c() {}
          function a() {} /* eslint-disable-line rule-to-test/sort-modules */
        `,
        code: dedent`
          function c() {}
          function b() {}
          function a() {} /* eslint-disable-line rule-to-test/sort-modules */
        `,
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })
    })

    it('handles rule-specific eslint-disable/enable blocks', async () => {
      await invalid({
        output: dedent`
          function a() {}
          function d() {}
          /* eslint-disable rule-to-test/sort-modules */
          function c() {}
          function b() {}
          // Shouldn't move
          /* eslint-enable */
          function e() {}
        `,
        code: dedent`
          function d() {}
          function e() {}
          /* eslint-disable rule-to-test/sort-modules */
          function c() {}
          function b() {}
          // Shouldn't move
          /* eslint-enable */
          function a() {}
        `,
        errors: [
          {
            messageId: 'unexpectedModulesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [{}],
      })
    })

    it('handles non typescript-eslint parser', async () => {
      await validEspree({
        code: dedent`
          class A {}
          function func() {}
        `,
        options: [{}],
      })
    })
  })

})
