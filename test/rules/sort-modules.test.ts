import type { Rule } from 'eslint'

import { RuleTester } from '@typescript-eslint/rule-tester'
import { RuleTester as EslintRuleTester } from 'eslint'
import { afterAll, describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-modules'

let ruleName = 'sort-modules'

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

    ruleTester.run(`${ruleName}(${type}): sorts modules`, rule, {
      invalid: [
        {
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
        },
      ],
      valid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts modules withing modules and namespaces`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedModulesOrder',
              },
              {
                data: {
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedModulesOrder',
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
          },
          {
            errors: [
              {
                data: {
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedModulesOrder',
              },
              {
                data: {
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedModulesOrder',
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
          },
        ],
        valid: [],
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
          },
        ],
        invalid: [],
      },
    )

    describe(`${ruleName}: custom groups`, () => {
      ruleTester.run(`${ruleName}: filters on selector and modifiers`, rule, {
        invalid: [
          {
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
                    rightGroup: 'classesWithDecoratorStartingWithHello',
                    leftGroup: 'unknown',
                    left: 'func',
                    right: 'C',
                  },
                  messageId: 'unexpectedModulesGroupOrder',
                },
                {
                  data: {
                    right: 'AnotherClass',
                    left: 'C',
                  },
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
                  data: {
                    right: 'yetAnotherFunction',
                    left: 'anotherFunction',
                  },
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
                  leftGroup: 'unknown',
                  rightGroup: 'class',
                  left: 'func',
                  right: 'C',
                },
                messageId: 'unexpectedModulesGroupOrder',
              },
              {
                data: {
                  right: 'aFunction',
                  left: 'C',
                },
                messageId: 'unexpectedModulesOrder',
              },
              {
                data: {
                  right: 'anotherFunction',
                  left: 'D',
                },
                messageId: 'unexpectedModulesOrder',
              },
            ],
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
                groups: [
                  ['exportInterfacesAndAsyncFunctions', 'class'],
                  'unknown',
                ],
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
                function iHaveFooInMyName() {}
                function meTooIHaveFoo() {}
                function a() {}
                function b() {}
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
                @IHaveFooInMyName
                class X {}
                @MeTooIHaveFoo
                class Y {}
                class A {}
                class B {}
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
                        groupName: 'group1',
                        selector: 'type',
                      },
                    ],
                    groups: ['group1'],
                  },
                ],
                errors: [
                  {
                    data: {
                      right: 'B',
                      left: 'A',
                    },
                    messageId: 'missedSpacingBetweenModulesMembers',
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
                        groupName: 'group1',
                        selector: 'type',
                      },
                    ],
                    type: 'alphabetical',
                    groups: ['group1'],
                  },
                ],
                errors: [
                  {
                    data: {
                      right: 'B',
                      left: 'A',
                    },
                    messageId: 'extraSpacingBetweenModulesMembers',
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
              },
            ],
            valid: [],
          },
        )
      })
    })

    describe(`${ruleName}(${type}): interface modifiers priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize declare over export`,
        rule,
        {
          invalid: [
            {
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
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize default over export`,
        rule,
        {
          invalid: [
            {
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
            },
          ],
          valid: [],
        },
      )
    })

    describe(`${ruleName}(${type}): type modifiers priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize declare over export`,
        rule,
        {
          invalid: [
            {
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
            },
          ],
          valid: [],
        },
      )
    })

    describe(`${ruleName}(${type}): class modifiers priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize declare over export`,
        rule,
        {
          invalid: [
            {
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
            },
          ],
          valid: [],
        },
      )

      /* Currently not handled correctly
      ruleTester.run(
        `${ruleName}(${type}): prioritize default over decorated`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'default-class',
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
                  groups: ['default-class', 'function', 'decorated-class'],
                },
              ],
              output: dedent`
                export default @Decorator class Class {}

                function f() {}
              `,
              code: dedent`
                function f() {}

                export default @Decorator class Class {}
              `,
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize decorated over export`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    rightGroup: 'decorated-class',
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
                  groups: ['decorated-class', 'function', 'export-class'],
                },
              ],
              output: dedent`
                export @Decorator class Class {}

                function f() {}
              `,
              code: dedent`
                function f() {}

                export @Decorator class Class {}
              `,
            },
          ],
          valid: [],
        },
      )
      */
    })

    describe(`${ruleName}(${type}): function modifiers priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize declare over export`,
        rule,
        {
          invalid: [
            {
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
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize default over async`,
        rule,
        {
          invalid: [
            {
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
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): prioritize async over export`,
        rule,
        {
          invalid: [
            {
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
            },
          ],
          valid: [],
        },
      )
    })

    describe(`${ruleName}(${type}): enum modifiers priority`, () => {
      ruleTester.run(
        `${ruleName}(${type}): prioritize declare over export`,
        rule,
        {
          invalid: [
            {
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
            },
          ],
          valid: [],
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
        invalid: [
          {
            errors: [
              {
                data: {
                  nodeDependentOnRight: 'A',
                  right: 'B',
                },
                messageId: 'unexpectedModulesDependencyOrder',
              },
            ],
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
            options: [options],
          },
        ],
        valid: [],
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
              options: [
                {
                  ...options,
                  groups: [],
                },
              ],
              code: dedent`
                class B {}

                class A extends B {}
              `,
            },
          ],
          invalid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}) detects and ignores circular dependencies`,
        rule,
        {
          invalid: [
            {
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
                  data: {
                    right: 'A',
                    left: 'B',
                  },
                  messageId: 'unexpectedModulesOrder',
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
                  groups: ['export-class', 'class'],
                },
              ],
              code: dedent`
                class B { static b }
                export class A { static a = B.b }
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
                    nodeDependentOnRight: 'B',
                    right: 'A',
                  },
                  messageId: 'unexpectedModulesDependencyOrder',
                },
              ],
              options: [
                {
                  ...options,
                  partitionByComment: 'Part',
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
                    nodeDependentOnRight: 'B',
                    right: 'A',
                  },
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
            },
          ],
          valid: [],
        },
      )
    })

    ruleTester.run(`${ruleName}(${type}): should ignore unknown group`, rule, {
      invalid: [
        {
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
          options: [
            {
              ...options,
              groups: ['function'],
            },
          ],
          code: dedent`
            function b() {}
            class SomeClass {}
            function a() {}
          `,
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
              function _a() {}
              function b() {}
              function _c() {}
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
              function ab() {}
              function a_c() {}
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
          invalid: [
            {
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
                  data: {
                    right: 'b',
                    left: 'z',
                  },
                  messageId: 'unexpectedModulesOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'z',
                  },
                  messageId: 'extraSpacingBetweenModulesMembers',
                },
              ],
              options: [
                {
                  ...options,
                  groups: ['unknown', 'interface'],
                  newlinesBetween: 'never',
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
                  messageId: 'missedSpacingBetweenModulesMembers',
                },
              ],
              output: dedent`
                function a() {};

                function b() {}
              `,
              code: dedent`
                function a() {};function b() {}
              `,
            },
            {
              errors: [
                {
                  data: {
                    right: 'z',
                    left: 'A',
                  },
                  messageId: 'extraSpacingBetweenModulesMembers',
                },
                {
                  data: {
                    right: 'y',
                    left: 'z',
                  },
                  messageId: 'unexpectedModulesOrder',
                },
                {
                  data: {
                    right: 'B',
                    left: 'y',
                  },
                  messageId: 'missedSpacingBetweenModulesMembers',
                },
              ],
              options: [
                {
                  ...options,
                  groups: ['interface', 'unknown', 'class'],
                  newlinesBetween: 'always',
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
                    messageId: 'missedSpacingBetweenModulesMembers',
                  },
                  {
                    data: {
                      right: 'c',
                      left: 'b',
                    },
                    messageId: 'extraSpacingBetweenModulesMembers',
                  },
                  {
                    data: {
                      right: 'd',
                      left: 'c',
                    },
                    messageId: 'extraSpacingBetweenModulesMembers',
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
                        messageId: 'missedSpacingBetweenModulesMembers',
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
                        messageId: 'extraSpacingBetweenModulesMembers',
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
                      function a() {}

                      function b() {}
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
                      function a() {}
                      function b() {}
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
                  function a() {} // Comment after
                  type B = string

                  type C = string
                `,
                dedent`
                  function a() {} // Comment after

                  type B = string
                  type C = string
                `,
              ],
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
                  newlinesBetween: 'always',
                },
              ],
              code: dedent`
                type B = string
                function a() {} // Comment after

                type C = string
              `,
            },
          ],
          valid: [],
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
              invalid: [
                {
                  errors: [
                    {
                      data: {
                        right: 'a',
                        left: 'b',
                      },
                      messageId: 'unexpectedModulesOrder',
                    },
                  ],
                  output: dedent`
                    function a() {} function b() {}
                  `,
                  code: dedent`
                    function b() {} function a() {}
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
                      messageId: 'unexpectedModulesOrder',
                    },
                  ],
                  output: dedent`
                    function a() {} function b() {};
                  `,
                  code: dedent`
                    function b() {} function a() {};
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
                      messageId: 'unexpectedModulesOrder',
                    },
                  ],
                  output: dedent`
                    function a() {}; function b() {}
                  `,
                  code: dedent`
                    function b() {}; function a() {}
                  `,
                  options: [options],
                },
              ],
              valid: [],
            },
          )
        })

        describe(`${ruleName}(${type}): declare functions`, () => {
          ruleTester.run(
            `${ruleName}(${type}): sorts inline declare functions correctly`,
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
                      messageId: 'unexpectedModulesOrder',
                    },
                  ],
                  output: dedent`
                    declare function a(); declare function b();
                  `,
                  code: dedent`
                    declare function b(); declare function a()
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
                      messageId: 'unexpectedModulesOrder',
                    },
                  ],
                  output: dedent`
                    declare function a(); declare function b();
                  `,
                  code: dedent`
                    declare function b(); declare function a();
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
        `${ruleName}(${type}): sorts inline interfaces correctly`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'A',
                    left: 'B',
                  },
                  messageId: 'unexpectedModulesOrder',
                },
              ],
              output: dedent`
                interface A {} interface B {}
              `,
              code: dedent`
                interface B {} interface A {}
              `,
              options: [options],
            },
            {
              errors: [
                {
                  data: {
                    right: 'A',
                    left: 'B',
                  },
                  messageId: 'unexpectedModulesOrder',
                },
              ],
              output: dedent`
                interface A {} interface B {};
              `,
              code: dedent`
                interface B {} interface A {};
              `,
              options: [options],
            },
            {
              errors: [
                {
                  data: {
                    right: 'A',
                    left: 'B',
                  },
                  messageId: 'unexpectedModulesOrder',
                },
              ],
              output: dedent`
                interface A {}; interface B {}
              `,
              code: dedent`
                interface B {}; interface A {}
              `,
              options: [options],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): sorts inline types correctly`,
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
                  messageId: 'unexpectedModulesOrder',
                },
              ],
              output: dedent`
                type a = {}; type b = {};
              `,
              code: dedent`
                type b = {}; type a = {}
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
                  messageId: 'unexpectedModulesOrder',
                },
              ],
              output: dedent`
                type a = {}; type b = {};
              `,
              code: dedent`
                type b = {}; type a = {};
              `,
              options: [options],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): sorts inline classes correctly`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'A',
                    left: 'B',
                  },
                  messageId: 'unexpectedModulesOrder',
                },
              ],
              output: dedent`
                class A {} class B {}
              `,
              code: dedent`
                class B {} class A {}
              `,
              options: [options],
            },
            {
              errors: [
                {
                  data: {
                    right: 'A',
                    left: 'B',
                  },
                  messageId: 'unexpectedModulesOrder',
                },
              ],
              output: dedent`
                class A {} class B {};
              `,
              code: dedent`
                class B {} class A {};
              `,
              options: [options],
            },
            {
              errors: [
                {
                  data: {
                    right: 'A',
                    left: 'B',
                  },
                  messageId: 'unexpectedModulesOrder',
                },
              ],
              output: dedent`
                class A {}; class B {}
              `,
              code: dedent`
                class B {}; class A {}
              `,
              options: [options],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): sorts inline enums correctly`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'A',
                    left: 'B',
                  },
                  messageId: 'unexpectedModulesOrder',
                },
              ],
              output: dedent`
                enum A {} enum B {}
              `,
              code: dedent`
                enum B {} enum A {}
              `,
              options: [options],
            },
            {
              errors: [
                {
                  data: {
                    right: 'A',
                    left: 'B',
                  },
                  messageId: 'unexpectedModulesOrder',
                },
              ],
              output: dedent`
                enum A {} enum B {};
              `,
              code: dedent`
                enum B {} enum A {};
              `,
              options: [options],
            },
            {
              errors: [
                {
                  data: {
                    right: 'A',
                    left: 'B',
                  },
                  messageId: 'unexpectedModulesOrder',
                },
              ],
              output: dedent`
                enum A {}; enum B {}
              `,
              code: dedent`
                enum B {}; enum A {}
              `,
              options: [options],
            },
          ],
          valid: [],
        },
      )
    })

    ruleTester.run(
      `${ruleName}(${type}): ignores exported decorated classes`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'B',
                  left: 'C',
                },
                messageId: 'unexpectedModulesOrder',
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
          },
        ],
        valid: [],
      },
    )
  })

  describe(`${ruleName}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts modules`, rule, {
      invalid: [
        {
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

    ruleTester.run(`${ruleName}(${type}): sorts modules`, rule, {
      invalid: [
        {
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
        },
      ],
      valid: [],
    })
  })

  describe(`${ruleName}: sorting by line-length`, () => {
    let type = 'line-length'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts modules`, rule, {
      invalid: [
        {
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
                messageId: 'unexpectedModulesOrder',
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
              function bb() {}
              function c() {}
              function a() {}
            `,
            code: dedent`
              function a() {}
              function bb() {}
              function c() {}
            `,
          },
          {
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedModulesOrder',
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
              function bb() {}
              function a() {}
              function c() {}
            `,
            code: dedent`
              function c() {}
              function bb() {}
              function a() {}
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
            function b() {}
            function c() {}
            function a() {}
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
              messageId: 'missedSpacingBetweenModulesMembers',
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
                nodeDependentOnRight: 'A',
                right: 'B',
              },
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
                  right: 'a',
                  left: 'B',
                },
                messageId: 'unexpectedModulesOrder',
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
          },
        ],
        valid: [],
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
        invalid: [
          {
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
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedModulesOrder',
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
                  data: {
                    right: 'b',
                    left: 'c',
                  },
                  messageId: 'unexpectedModulesOrder',
                },
                {
                  data: {
                    right: 'a',
                    left: 'd',
                  },
                  messageId: 'unexpectedModulesOrder',
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
                    messageId: 'unexpectedModulesOrder',
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
                    function b() {}
                    // Comment
                    function a() {}
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
                  options: [
                    {
                      partitionByComment: {
                        line: ['^(?!.*foo).*$'],
                      },
                    },
                  ],
                  code: dedent`
                    function b() {}
                    // I am a partition comment because I don't have f o o
                    function a() {}
                  `,
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
                    messageId: 'unexpectedModulesOrder',
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
                        block: true,
                      },
                    },
                  ],
                  code: dedent`
                    function b() {}
                    /* Comment */
                    function a() {}
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
                  options: [
                    {
                      partitionByComment: {
                        block: ['^(?!.*foo).*$'],
                      },
                    },
                  ],
                  code: dedent`
                    function b() {}
                    /* I am a partition comment because I don't have f o o */
                    function a() {}
                  `,
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
                messageId: 'unexpectedModulesOrder',
              },
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedModulesOrder',
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
          },
        ],
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
              messageId: 'unexpectedModulesOrder',
            },
          ],
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
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'c',
                left: 'd',
              },
              messageId: 'unexpectedModulesOrder',
            },
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedModulesOrder',
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
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedModulesOrder',
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
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedModulesOrder',
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
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedModulesOrder',
            },
          ],
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
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedModulesOrder',
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
        },
        {
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
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedModulesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            function b() {}
            function c() {}
            // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
            function a() {}
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedModulesOrder',
            },
          ],
          code: dedent`
            function c() {}
            function b() {}
            // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
            function a() {}
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
              messageId: 'unexpectedModulesOrder',
            },
          ],
          output: dedent`
            function b() {}
            function c() {}
            function a() {} // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
          `,
          code: dedent`
            function c() {}
            function b() {}
            function a() {} // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
          `,
          options: [{}],
        },
        {
          output: dedent`
            function b() {}
            function c() {}
            /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
            function a() {}
          `,
          code: dedent`
            function c() {}
            function b() {}
            /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
            function a() {}
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedModulesOrder',
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
              messageId: 'unexpectedModulesOrder',
            },
          ],
          output: dedent`
            function b() {}
            function c() {}
            function a() {} /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
          `,
          code: dedent`
            function c() {}
            function b() {}
            function a() {} /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
          `,
          options: [{}],
        },
        {
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
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedModulesOrder',
            },
          ],
          options: [{}],
        },
      ],
      valid: [
        {
          code: dedent`
            function b() {}
            function c() {}
            // eslint-disable-next-line
            function a() {}
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
              class A {}

              function func() {}
            `,
            options: [{}],
          },
        ],
        invalid: [],
      },
    )
  })
})
