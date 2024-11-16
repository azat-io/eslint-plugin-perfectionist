import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule from '../rules/sort-modules'

let ruleName = 'sort-modules'

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

    ruleTester.run(`${ruleName}(${type}): sorts modules`, rule, {
      valid: [],
      invalid: [
        {
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedModulesGroupOrder',
              data: {
                left: 'FindUserInput',
                leftGroup: 'export-interface',
                right: 'CacheType',
                rightGroup: 'enum',
              },
            },
            {
              messageId: 'unexpectedModulesGroupOrder',
              data: {
                left: 'assertInputIsCorrect',
                leftGroup: 'function',
                right: 'findUser',
                rightGroup: 'export-function',
              },
            },
            {
              messageId: 'unexpectedModulesGroupOrder',
              data: {
                left: 'findUser',
                leftGroup: 'export-function',
                right: 'FindAllUsersInput',
                rightGroup: 'export-type',
              },
            },
            {
              messageId: 'unexpectedModulesGroupOrder',
              data: {
                left: 'findAllUsers',
                leftGroup: 'export-function',
                right: 'Cache',
                rightGroup: 'class',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts modules withing modules and namespaces`,
      rule,
      {
        valid: [],
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedModulesOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
              {
                messageId: 'unexpectedModulesOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
            ],
          },
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedModulesOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
              {
                messageId: 'unexpectedModulesOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): partitions when encountering a variable declaration`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface B {}
              let a;
              interface A {}
            `,
            options: [options],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): partitions when encountering expressions`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface B {}
              iAmCallingAFunction();
              interface A {}
            `,
            options: [options],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts complex predefined groups`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    describe(`${ruleName}: custom groups`, () => {
      ruleTester.run(`${ruleName}: filters on selector and modifiers`, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              export interface A {}
              export interface B {}
              interface C {}
            `,
            output: dedent`
              interface C {}
              export interface A {}
              export interface B {}
            `,
            options: [
              {
                groups: ['interfaceGroup', 'exportInterfaceGroup'],
                customGroups: [
                  {
                    groupName: 'unusedCustomGroup',
                    selector: 'type',
                    modifiers: ['export'],
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
              },
            ],
            errors: [
              {
                messageId: 'unexpectedModulesGroupOrder',
                data: {
                  left: 'B',
                  leftGroup: 'exportInterfaceGroup',
                  right: 'C',
                  rightGroup: 'interfaceGroup',
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
              interface A {}
              interface B {}
              function func() {}
              function helloFunction() {}
            `,
            output: dedent`
              function helloFunction() {}
              interface A {}
              interface B {}
              function func() {}
            `,
            options: [
              {
                groups: ['functionsStartingWithHello', 'unknown'],
                customGroups: [
                  {
                    groupName: 'functionsStartingWithHello',
                    selector: 'function',
                    elementNamePattern: 'hello*',
                  },
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedModulesGroupOrder',
                data: {
                  left: 'func',
                  leftGroup: 'unknown',
                  right: 'helloFunction',
                  rightGroup: 'functionsStartingWithHello',
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
              @Decorator
              class A {}

              class B {}

              function func() {}

              @HelloDecorator
              class C {}

              @HelloDecorator()
              class AnotherClass {}
            `,
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
            options: [
              {
                groups: ['classesWithDecoratorStartingWithHello', 'unknown'],
                customGroups: [
                  {
                    groupName: 'classesWithDecoratorStartingWithHello',
                    selector: 'class',
                    decoratorNamePattern: 'Hello*',
                  },
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedModulesGroupOrder',
                data: {
                  left: 'func',
                  leftGroup: 'unknown',
                  right: 'C',
                  rightGroup: 'classesWithDecoratorStartingWithHello',
                },
              },
              {
                messageId: 'unexpectedModulesOrder',
                data: {
                  left: 'C',
                  right: 'AnotherClass',
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
              options: [
                {
                  type: 'alphabetical',
                  order: 'asc',
                  groups: ['reversedFunctionsByLineLength', 'unknown'],
                  customGroups: [
                    {
                      groupName: 'reversedFunctionsByLineLength',
                      selector: 'function',
                      type: 'line-length',
                      order: 'desc',
                    },
                  ],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedModulesGroupOrder',
                  data: {
                    left: 'DDDD',
                    leftGroup: 'unknown',
                    right: 'aFunction',
                    rightGroup: 'reversedFunctionsByLineLength',
                  },
                },
                {
                  messageId: 'unexpectedModulesGroupOrder',
                  data: {
                    left: 'G',
                    leftGroup: 'unknown',
                    right: 'anotherFunction',
                    rightGroup: 'reversedFunctionsByLineLength',
                  },
                },
                {
                  messageId: 'unexpectedModulesOrder',
                  data: {
                    left: 'anotherFunction',
                    right: 'yetAnotherFunction',
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
                function b() {}

                function a() {}

                function d() {}

                function e() {}

                interface Interface {}

                function c() {}
              `,
              output: dedent`
                function b() {}

                function a() {}

                function d() {}

                function e() {}

                function c() {}

                interface Interface {}
            `,
              options: [
                {
                  groups: ['unsortedFunctions', 'unknown'],
                  customGroups: [
                    {
                      groupName: 'unsortedFunctions',
                      selector: 'function',
                      type: 'unsorted',
                    },
                  ],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedModulesGroupOrder',
                  data: {
                    left: 'Interface',
                    leftGroup: 'unknown',
                    right: 'c',
                    rightGroup: 'unsortedFunctions',
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
              export interface A {}

              class b {}

              class E {}

              function func() {}

              class C {}

              async function aFunction() {}

              export interface D {}

              async function anotherFunction() {}
            `,
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
            options: [
              {
                groups: [
                  ['exportInterfacesAndAsyncFunctions', 'class'],
                  'unknown',
                ],
                customGroups: [
                  {
                    groupName: 'exportInterfacesAndAsyncFunctions',
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
                  },
                ],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedModulesGroupOrder',
                data: {
                  left: 'func',
                  leftGroup: 'unknown',
                  right: 'C',
                  rightGroup: 'class',
                },
              },
              {
                messageId: 'unexpectedModulesOrder',
                data: {
                  left: 'C',
                  right: 'aFunction',
                },
              },
              {
                messageId: 'unexpectedModulesOrder',
                data: {
                  left: 'D',
                  right: 'anotherFunction',
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
                function iHaveFooInMyName() {}
                function meTooIHaveFoo() {}
                function a() {}
                function b() {}
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
        `${ruleName}: allows to use regex for decorator names in custom groups`,
        rule,
        {
          valid: [
            {
              code: dedent`
                @IHaveFooInMyName
                class X {}
                @MeTooIHaveFoo
                class Y {}
                class A {}
                class B {}
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

    describe(`${ruleName}(${type}): interface modifiers priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize declare over export`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                function f() {}

                export declare interface Interface {}
              `,
              output: dedent`
                export declare interface Interface {}

                function f() {}
              `,
              options: [
                {
                  ...options,
                  groups: ['declare-interface', 'function', 'export-interface'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedModulesGroupOrder',
                  data: {
                    left: 'f',
                    leftGroup: 'function',
                    right: 'Interface',
                    rightGroup: 'declare-interface',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize default over export`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                function f() {}

                export default interface Interface {}
              `,
              output: dedent`
                export default interface Interface {}

                function f() {}
              `,
              options: [
                {
                  ...options,
                  groups: ['default-interface', 'function', 'export-interface'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedModulesGroupOrder',
                  data: {
                    left: 'f',
                    leftGroup: 'function',
                    right: 'Interface',
                    rightGroup: 'default-interface',
                  },
                },
              ],
            },
          ],
        },
      )
    })

    describe(`${ruleName}(${type}): type modifiers priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize declare over export`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                function f() {}

                export declare type Type = {}
              `,
              output: dedent`
                export declare type Type = {}

                function f() {}
              `,
              options: [
                {
                  ...options,
                  groups: ['declare-type', 'function', 'export-type'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedModulesGroupOrder',
                  data: {
                    left: 'f',
                    leftGroup: 'function',
                    right: 'Type',
                    rightGroup: 'declare-type',
                  },
                },
              ],
            },
          ],
        },
      )
    })

    describe(`${ruleName}(${type}): class modifiers priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize declare over export`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                function f() {}

                export declare class Class {}
              `,
              output: dedent`
                export declare class Class {}

                function f() {}
              `,
              options: [
                {
                  ...options,
                  groups: ['declare-class', 'function', 'export-class'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedModulesGroupOrder',
                  data: {
                    left: 'f',
                    leftGroup: 'function',
                    right: 'Class',
                    rightGroup: 'declare-class',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize default over decorated`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                function f() {}

                export default @Decorator class Class {}
              `,
              output: dedent`
                export default @Decorator class Class {}

                function f() {}
              `,
              options: [
                {
                  ...options,
                  groups: ['default-class', 'function', 'decorated-class'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedModulesGroupOrder',
                  data: {
                    left: 'f',
                    leftGroup: 'function',
                    right: 'Class',
                    rightGroup: 'default-class',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize decorated over export`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                function f() {}

                export @Decorator class Class {}
              `,
              output: dedent`
                export @Decorator class Class {}

                function f() {}
              `,
              options: [
                {
                  ...options,
                  groups: ['decorated-class', 'function', 'export-class'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedModulesGroupOrder',
                  data: {
                    left: 'f',
                    leftGroup: 'function',
                    right: 'Class',
                    rightGroup: 'decorated-class',
                  },
                },
              ],
            },
          ],
        },
      )
    })

    describe(`${ruleName}(${type}): function modifiers priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize declare over export`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                interface Interface {}

                export declare function f()
              `,
              output: dedent`
                export declare function f()

                interface Interface {}
              `,
              options: [
                {
                  ...options,
                  groups: ['declare-function', 'interface', 'export-function'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedModulesGroupOrder',
                  data: {
                    left: 'Interface',
                    leftGroup: 'interface',
                    right: 'f',
                    rightGroup: 'declare-function',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize default over async`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                interface Interface {}

                export default async function f() {}
              `,
              output: dedent`
                export default async function f() {}

                interface Interface {}
              `,
              options: [
                {
                  ...options,
                  groups: ['default-function', 'interface', 'async-function'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedModulesGroupOrder',
                  data: {
                    left: 'Interface',
                    leftGroup: 'interface',
                    right: 'f',
                    rightGroup: 'default-function',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize async over export`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                interface Interface {}

                export async function f() {}
              `,
              output: dedent`
                export async function f() {}

                interface Interface {}
              `,
              options: [
                {
                  ...options,
                  groups: ['async-function', 'interface', 'export-function'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedModulesGroupOrder',
                  data: {
                    left: 'Interface',
                    leftGroup: 'interface',
                    right: 'f',
                    rightGroup: 'async-function',
                  },
                },
              ],
            },
          ],
        },
      )
    })

    describe(`${ruleName}(${type}): enum modifiers priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize declare over export`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                function f() {}

                export declare enum Enum {}
              `,
              output: dedent`
                export declare enum Enum {}

                function f() {}
              `,
              options: [
                {
                  ...options,
                  groups: ['declare-enum', 'function', 'export-enum'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedModulesGroupOrder',
                  data: {
                    left: 'f',
                    leftGroup: 'function',
                    right: 'Enum',
                    rightGroup: 'declare-enum',
                  },
                },
              ],
            },
          ],
        },
      )
    })

    describe(`${ruleName}(${type}): detects dependencies`, () => {
      ruleTester.run(
        `${ruleName}(${type}) ignores non-static class method dependencies`,
        rule,
        {
          valid: [
            {
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
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) ignores static class method dependencies if no static block or static properties are present`,
        rule,
        {
          valid: [
            {
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
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) detects static class method dependencies if a static block is present`,
        rule,
        {
          valid: [
            {
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
            },
            {
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
            },
            {
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
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) detects static class method dependencies if a static property is present`,
        rule,
        {
          valid: [
            {
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
            },
            {
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
            },
            {
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
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) ignores non-static arrow-method dependencies`,
        rule,
        {
          valid: [
            {
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
            },
            {
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
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) ignores static arrow-method dependencies if no static block or static properties are present`,
        rule,
        {
          valid: [
            {
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
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) ignores interface dependencies`,
        rule,
        {
          valid: [
            {
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
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(`${ruleName}(${type}) ignores type dependencies`, rule, {
        valid: [
          {
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
          },
        ],
        invalid: [],
      })

      ruleTester.run(`${ruleName}(${type}) detects enum dependencies`, rule, {
        valid: [
          {
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
          },
        ],
        invalid: [],
      })

      ruleTester.run(`${ruleName}(${type}) detects nested dependencies`, rule, {
        valid: [],
        invalid: [
          {
            code: dedent`
              class A {
                static a = x > y ? new Class([...{...!!method(1 + <any>(B?.b! as any))}]) : null
              }

              class B {
                static b = 1
              }
            `,
            output: dedent`
              class B {
                static b = 1
              }

              class A {
                static a = x > y ? new Class([...{...!!method(1 + <any>(B?.b! as any))}]) : null
              }
            `,
            options: [
              {
                ...options,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedModulesDependencyOrder',
                data: {
                  right: 'B',
                  nodeDependentOnRight: 'A',
                },
              },
            ],
          },
        ],
      })

      ruleTester.run(
        `${ruleName}(${type}) detects dependencies in template literal expressions`,
        rule,
        {
          valid: [
            {
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
                  groups: [],
                },
              ],
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) detects dependencies in classes extend`,
        rule,
        {
          valid: [
            {
              code: dedent`
                class B {}

                class A extends B {}
              `,
              options: [
                {
                  ...options,
                  groups: [],
                },
              ],
            },
          ],
          invalid: [],
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
              output: dedent`
                class C {
                  static c = A.a
                }

                class B {
                  static b = C.c
                }

                class A {
                  static a = B.b
                }
              `,
              options: [
                {
                  ...options,
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedModulesDependencyOrder',
                  data: {
                    right: 'B',
                    nodeDependentOnRight: 'A',
                  },
                },
                {
                  messageId: 'unexpectedModulesDependencyOrder',
                  data: {
                    right: 'C',
                    nodeDependentOnRight: 'B',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritizes dependencies over group configuration`,
        rule,
        {
          valid: [
            {
              code: dedent`
                class B { static b }
                export class A { static a = B.b }
              `,
              options: [
                {
                  ...options,
                  groups: ['export-class', 'class'],
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
                class B { static b = A.a }
                // Part1
                class A { static a }
              `,
              output: dedent`
                class A { static a }
                // Part1
                class B { static b = A.a }
              `,
              options: [
                {
                  ...options,
                  partitionByComment: 'Part*',
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedModulesDependencyOrder',
                  data: {
                    right: 'A',
                    nodeDependentOnRight: 'B',
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
                class B { static = A.a }

                class A { static a }
              `,
              output: dedent`
                class A { static a }

                class B { static = A.a }
              `,
              options: [
                {
                  ...options,
                  partitionByNewLine: true,
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedModulesDependencyOrder',
                  data: {
                    right: 'A',
                    nodeDependentOnRight: 'B',
                  },
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
              function b() {}
              class SomeClass {}
              function a() {}
            `,
          output: dedent`
              function a() {}
              class SomeClass {}
              function b() {}
            `,
          options: [
            {
              ...options,
              groups: ['function'],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedModulesGroupOrder',
              data: {
                left: 'b',
                leftGroup: 'function',
                right: 'SomeClass',
                rightGroup: 'unknown',
              },
            },
            {
              messageId: 'unexpectedModulesGroupOrder',
              data: {
                left: 'SomeClass',
                leftGroup: 'unknown',
                right: 'a',
                rightGroup: 'function',
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
              function _a() {}
              function b() {}
              function _c() {}
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
              function ab() {}
              function a_c() {}
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
            function 你好() {}
            function 世界() {}
            function a() {}
            function A() {}
            function b() {}
            function B() {}
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
              options: [
                {
                  ...options,
                  newlinesBetween: 'never',
                  groups: ['unknown', 'interface'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedModulesGroupOrder',
                  data: {
                    left: 'A',
                    leftGroup: 'interface',
                    right: 'y',
                    rightGroup: 'unknown',
                  },
                },
                {
                  messageId: 'extraSpacingBetweenModulesMembers',
                  data: {
                    left: 'A',
                    right: 'y',
                  },
                },
                {
                  messageId: 'unexpectedModulesOrder',
                  data: {
                    left: 'z',
                    right: 'b',
                  },
                },
                {
                  messageId: 'extraSpacingBetweenModulesMembers',
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
                interface A {}


               function z() {}
              function y() {}
                  class B {}
              `,
              output: dedent`
                  interface A {}

                 function y() {}
                function z() {}

                    class B {}
                `,
              options: [
                {
                  ...options,
                  newlinesBetween: 'always',
                  groups: ['interface', 'unknown', 'class'],
                },
              ],
              errors: [
                {
                  messageId: 'extraSpacingBetweenModulesMembers',
                  data: {
                    left: 'A',
                    right: 'z',
                  },
                },
                {
                  messageId: 'unexpectedModulesOrder',
                  data: {
                    left: 'z',
                    right: 'y',
                  },
                },
                {
                  messageId: 'missedSpacingBetweenModulesMembers',
                  data: {
                    left: 'y',
                    right: 'B',
                  },
                },
              ],
            },
          ],
        },
      )
    })

    describe(`${ruleName}(${type}): sorts inline elements correctly`, () => {
      describe(`${ruleName}(${type}): functions`, () => {
        describe(`${ruleName}(${type}): non-declare functions`, () => {
          ruleTester.run(
            `${ruleName}(${type}): sorts inline non-declare functions correctly`,
            rule,
            {
              valid: [],
              invalid: [
                {
                  code: dedent`
                  function b() {} function a() {}
                `,
                  output: dedent`
                  function a() {} function b() {}
                `,
                  options: [options],
                  errors: [
                    {
                      messageId: 'unexpectedModulesOrder',
                      data: {
                        left: 'b',
                        right: 'a',
                      },
                    },
                  ],
                },
                {
                  code: dedent`
                  function b() {} function a() {};
                `,
                  output: dedent`
                  function a() {} function b() {};
                `,
                  options: [options],
                  errors: [
                    {
                      messageId: 'unexpectedModulesOrder',
                      data: {
                        left: 'b',
                        right: 'a',
                      },
                    },
                  ],
                },
                {
                  code: dedent`
                  function b() {}; function a() {}
                `,
                  output: dedent`
                  function a() {}; function b() {}
                `,
                  options: [options],
                  errors: [
                    {
                      messageId: 'unexpectedModulesOrder',
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

        describe(`${ruleName}(${type}): declare functions`, () => {
          ruleTester.run(
            `${ruleName}(${type}): sorts inline declare functions correctly`,
            rule,
            {
              valid: [],
              invalid: [
                {
                  code: dedent`
                  declare function b(); declare function a()
                `,
                  output: dedent`
                  declare function a(); declare function b();
                `,
                  options: [options],
                  errors: [
                    {
                      messageId: 'unexpectedModulesOrder',
                      data: {
                        left: 'b',
                        right: 'a',
                      },
                    },
                  ],
                },
                {
                  code: dedent`
                  declare function b(); declare function a();
                `,
                  output: dedent`
                  declare function a(); declare function b();
                `,
                  options: [options],
                  errors: [
                    {
                      messageId: 'unexpectedModulesOrder',
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
        `${ruleName}(${type}): sorts inline interfaces correctly`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                interface B {} interface A {}
              `,
              output: dedent`
                interface A {} interface B {}
              `,
              options: [options],
              errors: [
                {
                  messageId: 'unexpectedModulesOrder',
                  data: {
                    left: 'B',
                    right: 'A',
                  },
                },
              ],
            },
            {
              code: dedent`
                interface B {} interface A {};
              `,
              output: dedent`
                interface A {} interface B {};
              `,
              options: [options],
              errors: [
                {
                  messageId: 'unexpectedModulesOrder',
                  data: {
                    left: 'B',
                    right: 'A',
                  },
                },
              ],
            },
            {
              code: dedent`
                interface B {}; interface A {}
              `,
              output: dedent`
                interface A {}; interface B {}
              `,
              options: [options],
              errors: [
                {
                  messageId: 'unexpectedModulesOrder',
                  data: {
                    left: 'B',
                    right: 'A',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): sorts inline types correctly`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                  type b = {}; type a = {}
                `,
              output: dedent`
                  type a = {}; type b = {};
                `,
              options: [options],
              errors: [
                {
                  messageId: 'unexpectedModulesOrder',
                  data: {
                    left: 'b',
                    right: 'a',
                  },
                },
              ],
            },
            {
              code: dedent`
                  type b = {}; type a = {};
                `,
              output: dedent`
                  type a = {}; type b = {};
                `,
              options: [options],
              errors: [
                {
                  messageId: 'unexpectedModulesOrder',
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
        `${ruleName}(${type}): sorts inline classes correctly`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                class B {} class A {}
              `,
              output: dedent`
                class A {} class B {}
              `,
              options: [options],
              errors: [
                {
                  messageId: 'unexpectedModulesOrder',
                  data: {
                    left: 'B',
                    right: 'A',
                  },
                },
              ],
            },
            {
              code: dedent`
                class B {} class A {};
              `,
              output: dedent`
                class A {} class B {};
              `,
              options: [options],
              errors: [
                {
                  messageId: 'unexpectedModulesOrder',
                  data: {
                    left: 'B',
                    right: 'A',
                  },
                },
              ],
            },
            {
              code: dedent`
                class B {}; class A {}
              `,
              output: dedent`
                class A {}; class B {}
              `,
              options: [options],
              errors: [
                {
                  messageId: 'unexpectedModulesOrder',
                  data: {
                    left: 'B',
                    right: 'A',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): sorts inline enums correctly`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                enum B {} enum A {}
              `,
              output: dedent`
                enum A {} enum B {}
              `,
              options: [options],
              errors: [
                {
                  messageId: 'unexpectedModulesOrder',
                  data: {
                    left: 'B',
                    right: 'A',
                  },
                },
              ],
            },
            {
              code: dedent`
                enum B {} enum A {};
              `,
              output: dedent`
                enum A {} enum B {};
              `,
              options: [options],
              errors: [
                {
                  messageId: 'unexpectedModulesOrder',
                  data: {
                    left: 'B',
                    right: 'A',
                  },
                },
              ],
            },
            {
              code: dedent`
                enum B {}; enum A {}
              `,
              output: dedent`
                enum A {}; enum B {}
              `,
              options: [options],
              errors: [
                {
                  messageId: 'unexpectedModulesOrder',
                  data: {
                    left: 'B',
                    right: 'A',
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
      type: 'natural',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts modules`, rule, {
      valid: [],
      invalid: [
        {
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedModulesGroupOrder',
              data: {
                left: 'FindUserInput',
                leftGroup: 'export-interface',
                right: 'CacheType',
                rightGroup: 'enum',
              },
            },
            {
              messageId: 'unexpectedModulesGroupOrder',
              data: {
                left: 'assertInputIsCorrect',
                leftGroup: 'function',
                right: 'findUser',
                rightGroup: 'export-function',
              },
            },
            {
              messageId: 'unexpectedModulesGroupOrder',
              data: {
                left: 'findUser',
                leftGroup: 'export-function',
                right: 'FindAllUsersInput',
                rightGroup: 'export-type',
              },
            },
            {
              messageId: 'unexpectedModulesGroupOrder',
              data: {
                left: 'findAllUsers',
                leftGroup: 'export-function',
                right: 'Cache',
                rightGroup: 'class',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${ruleName}: sorting by line-length`, () => {
    let type = 'line-length'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts modules`, rule, {
      valid: [],
      invalid: [
        {
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
          output: dedent`
            enum CacheType {
              ALWAYS = 'ALWAYS',
              NEVER = 'NEVER',
            }

            export type FindUserOutput = {
              id: string
              name: string
              age: number
            }

            export type FindAllUsersInput = {
              ids: string[]
              cache: CacheType
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedModulesGroupOrder',
              data: {
                left: 'FindUserInput',
                leftGroup: 'export-interface',
                right: 'CacheType',
                rightGroup: 'enum',
              },
            },
            {
              messageId: 'unexpectedModulesGroupOrder',
              data: {
                left: 'assertInputIsCorrect',
                leftGroup: 'function',
                right: 'findUser',
                rightGroup: 'export-function',
              },
            },
            {
              messageId: 'unexpectedModulesGroupOrder',
              data: {
                left: 'findUser',
                leftGroup: 'export-function',
                right: 'FindAllUsersInput',
                rightGroup: 'export-type',
              },
            },
            {
              messageId: 'unexpectedModulesGroupOrder',
              data: {
                left: 'findAllUsers',
                leftGroup: 'export-function',
                right: 'Cache',
                rightGroup: 'class',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${ruleName}: misc`, () => {
    ruleTester.run(
      `${ruleName}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              function b() {}
              function B() {}
              function a() {}
              function A() {}
            `,
            output: dedent`
              function a() {}
              function A() {}
              function b() {}
              function B() {}
            `,
            errors: [
              {
                messageId: 'unexpectedModulesOrder',
                data: {
                  left: 'B',
                  right: 'a',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}: sorts using default groups`, rule, {
      valid: [
        {
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
              newlinesBetween: 'always',
            },
          ],
        },
      ],
      invalid: [],
    })

    describe('handles complex comment cases', () => {
      ruleTester.run(`keeps comments associated to their node`, rule, {
        valid: [],
        invalid: [
          {
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
            options: [
              {
                type: 'alphabetical',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedModulesOrder',
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
              options: [
                {
                  type: 'alphabetical',
                  partitionByComment: 'PartitionComment:*',
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedModulesOrder',
                  data: {
                    left: 'c',
                    right: 'b',
                  },
                },
                {
                  messageId: 'unexpectedModulesOrder',
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
                  function e() {}
                  function f() {}
                  // I am a partition comment because I don't have f o o
                  function a() {}
                  function b() {}
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
          },
        ],
        invalid: [
          {
            code: dedent`
              function e() {}
              function d() {}

              function c() {}

              function b() {}
              function a() {}
            `,
            output: dedent`
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
            errors: [
              {
                messageId: 'unexpectedModulesOrder',
                data: {
                  left: 'e',
                  right: 'd',
                },
              },
              {
                messageId: 'unexpectedModulesOrder',
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

    let eslintDisableRuleTesterName = `${ruleName}: supports 'eslint-disable' for individual nodes`
    ruleTester.run(eslintDisableRuleTesterName, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            function c() {}
            function b() {}
            // eslint-disable-next-line
            function a() {}
          `,
          output: dedent`
            function b() {}
            function c() {}
            // eslint-disable-next-line
            function a() {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedModulesOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
        {
          code: dedent`
            function d() {}
            function c() {}
            // eslint-disable-next-line
            function a() {}
            function b() {}
          `,
          output: dedent`
            function b() {}
            function c() {}
            // eslint-disable-next-line
            function a() {}
            function d() {}
          `,
          options: [
            {
              partitionByComment: true,
            },
          ],
          errors: [
            {
              messageId: 'unexpectedModulesOrder',
              data: {
                left: 'd',
                right: 'c',
              },
            },
            {
              messageId: 'unexpectedModulesOrder',
              data: {
                left: 'a',
                right: 'b',
              },
            },
          ],
        },
        {
          code: dedent`
            class C {}
            class B extends A {}
            // eslint-disable-next-line
            class A {}
          `,
          output: dedent`
            class B extends A {}
            class C {}
            // eslint-disable-next-line
            class A {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedModulesOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
        },
        {
          code: dedent`
            function c() {}
            function b() {}
            function a() {} // eslint-disable-line
          `,
          output: dedent`
            function b() {}
            function c() {}
            function a() {} // eslint-disable-line
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedModulesOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
        {
          code: dedent`
            function c() {}
            function b() {}
            /* eslint-disable-next-line */
            function a() {}
          `,
          output: dedent`
            function b() {}
            function c() {}
            /* eslint-disable-next-line */
            function a() {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedModulesOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
        {
          code: dedent`
            function c() {}
            function b() {}
            function a() {} /* eslint-disable-line */
          `,
          output: dedent`
            function b() {}
            function c() {}
            function a() {} /* eslint-disable-line */
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedModulesOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
        {
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
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedModulesOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
          ],
        },
        {
          code: dedent`
            function c() {}
            function b() {}
            // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
            function a() {}
          `,
          output: dedent`
            function b() {}
            function c() {}
            // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
            function a() {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedModulesOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
        {
          code: dedent`
            function c() {}
            function b() {}
            function a() {} // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
          `,
          output: dedent`
            function b() {}
            function c() {}
            function a() {} // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedModulesOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
        {
          code: dedent`
            function c() {}
            function b() {}
            /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
            function a() {}
          `,
          output: dedent`
            function b() {}
            function c() {}
            /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
            function a() {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedModulesOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
        {
          code: dedent`
            function c() {}
            function b() {}
            function a() {} /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
          `,
          output: dedent`
            function b() {}
            function c() {}
            function a() {} /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedModulesOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
        {
          code: dedent`
            function d() {}
            function e() {}
            /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
            function c() {}
            function b() {}
            // Shouldn't move
            /* eslint-enable */
            function a() {}
          `,
          output: dedent`
            function a() {}
            function d() {}
            /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
            function c() {}
            function b() {}
            // Shouldn't move
            /* eslint-enable */
            function e() {}
          `,
          options: [{}],
          errors: [
            {
              messageId: 'unexpectedModulesOrder',
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
