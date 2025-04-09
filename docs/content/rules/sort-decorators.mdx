---
title: sort-decorators
description: Enforce sorting of decorators for improved readability and maintainability. Use this ESLint rule to keep your decorators well-organized
shortDescription: Enforce sorted decorators
keywords:
  - eslint
  - sort decorators
  - eslint rule
  - coding standards
  - code quality
  - javascript linting
  - typescript decorators sorting
---

import CodeExample from '../../components/CodeExample.svelte'
import Important from '../../components/Important.astro'
import CodeTabs from '../../components/CodeTabs.svelte'
import dedent from 'dedent'

Enforce sorted decorators.

Sorting decorators provides a clear and predictable structure to the codebase. This rule detects instances where decorators are not sorted and raises linting errors, encouraging developers to arrange elements in the desired order.

Consistently sorted decorators enhance the overall clarity and organization of your code.

## Try it out

<CodeExample
  alphabetical={dedent`
    @ApiDescription('Create a new user')
    @Authenticated()
    @Controller()
    @Post('/users')
    class CreateUserController {

      @AutoInjected()
      @NotNull()
      userService: UserService;

      @IsBoolean()
      @NotNull()
      accessor disableController: boolean;

      @ApiError({ status: 400, description: 'Bad request' })
      @ApiResponse({ status: 200, description: 'User created successfully' })
      createUser(
        @Body()
        @IsNotEmpty()
        @ValidateNested()
        createUserDto: CreateUserDto
      ): UserDto {
        // ...
      }

    }
  `}
  lineLength={dedent`
    @ApiDescription('Create a new user')
    @Authenticated()
    @Post('/users')
    @Controller()
    class CreateUserController {

      @AutoInjected()
      @NotNull()
      userService: UserService;

      @IsBoolean()
      @NotNull()
      accessor disableController: boolean;

      @ApiResponse({ status: 200, description: 'User created successfully' })
      @ApiError({ status: 400, description: 'Bad request' })
      createUser(
        @ValidateNested()
        @IsNotEmpty()
        @Body()
        createUserDto: CreateUserDto
      ): UserDto {
        // ...
      }

    }
  `}
  initial={dedent`
    @Post('/users')
    @ApiDescription('Create a new user')
    @Authenticated()
    @Controller()
    class CreateUserController {

      @NotNull()
      @AutoInjected()
      userService: UserService;

      @NotNull()
      @IsBoolean()
      accessor disableController: boolean;

      @ApiError({ status: 400, description: 'Bad request' })
      @ApiResponse({ status: 200, description: 'User created successfully' })
      createUser(
        @IsNotEmpty()
        @ValidateNested()
        @Body()
        createUserDto: CreateUserDto
      ): UserDto {
        // ...
      }

    }
  `}
  client:load
  lang="tsx"
/>

## Options

This rule accepts an options object with the following properties:

### type

<sub>default: `'alphabetical'`</sub>

Specifies the sorting method.

- `'alphabetical'` — Sort items alphabetically (e.g., “a” < “b” < “c”) using [localeCompare](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare).
- `'natural'` — Sort items in a [natural](https://github.com/yobacca/natural-orderby) order (e.g., “item2” < “item10”).
- `'line-length'` — Sort items by code line length (shorter lines first).
- `'custom'` — Sort items using the alphabet specified in the [`alphabet`](#alphabet) option.
- `'unsorted'` — Do not sort items. [`grouping`](#groups) and [`newlines behavior`](#newlinesbetween) are still enforced.

### order

<sub>default: `'asc'`</sub>

Specifies whether to sort items in ascending or descending order.

- `'asc'` — Sort items in ascending order (A to Z, 1 to 9).
- `'desc'` — Sort items in descending order (Z to A, 9 to 1).

### fallbackSort

<sub>
  type:
  ```
  {
    type: 'alphabetical' | 'natural' | 'line-length' | 'custom' | 'unsorted'
    order?: 'asc' | 'desc'
  }
  ```
</sub>
<sub>default: `{ type: 'unsorted' }`</sub>

Specifies fallback sort options for elements that are equal according to the primary sort
[`type`](#type).

Example: enforce alphabetical sort between two elements with the same length.
```ts
{
  type: 'line-length',
  order: 'desc',
  fallbackSort: { type: 'alphabetical', order: 'asc' }
}
```

### alphabet

<sub>default: `''`</sub>

Used only when the [`type`](#type) option is set to `'custom'`. Specifies the custom alphabet for sorting.

Use the `Alphabet` utility class from `eslint-plugin-perfectionist/alphabet` to quickly generate a custom alphabet.

Example: `0123456789abcdef...`

### ignoreCase

<sub>default: `true`</sub>

Specifies whether sorting should be case-sensitive.

- `true` — Ignore case when sorting alphabetically or naturally (e.g., “A” and “a” are the same).
- `false` — Consider case when sorting (e.g., “a” comes before “A”).

### specialCharacters

<sub>default: `keep`</sub>

Specifies whether to trim, remove, or keep special characters before sorting.

- `'keep'` — Keep special characters when sorting (e.g., “_a” comes before “a”).
- `'trim'` — Trim special characters when sorting alphabetically or naturally (e.g., “_a” and “a” are the same).
- `'remove'` — Remove special characters when sorting (e.g., “/a/b” and “ab” are the same).

### locales

<sub>default: `'en-US'`</sub>

Specifies the sorting locales. Refer To [String.prototype.localeCompare() - locales](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare#locales).

- `string` — A BCP 47 language tag (e.g. `'en'`, `'en-US'`, `'zh-CN'`).
- `string[]` — An array of BCP 47 language tags.

### sortOnClasses

<sub>default: `true`</sub>

Controls whether sorting should be enabled for class decorators.

### sortOnMethods

<sub>default: `true`</sub>

Controls whether sorting should be enabled for class method decorators.

### sortOnProperties

<sub>default: `true`</sub>

Controls whether sorting should be enabled for class property decorators.

### sortOnAccessors

<sub>default: `true`</sub>

Controls whether sorting should be enabled for class auto-accessor decorators.

### sortOnParameters

<sub>default: `true`</sub>

Controls whether sorting should be enabled for method parameter decorators.

### partitionByComment

<sub>default: `false`</sub>

Enables the use of comments to separate class decorators into logical groups.

- `true` — All comments will be treated as delimiters, creating partitions.
- `false` — Comments will not be used as delimiters.
- `RegExpPattern = string | { pattern: string; flags: string}` — A regexp pattern to specify which comments should act as delimiters.
- `RegExpPattern[]` — A list of regexp patterns to specify which comments should act as delimiters.
- `{ block: boolean | RegExpPattern | RegExpPattern[]; line: boolean | RegExpPattern | RegExpPattern[] }` — Specify which block and line comments should act as delimiters.

### groups

<sub>
  type: `Array<string | string[]>`
</sub>
<sub>default: `[]`</sub>

Specifies a list of decorator groups for sorting.

Predefined groups:

- `'unknown'` — Decorators that don’t fit into any group specified in the `groups` option.

If the `unknown` group is not specified in the `groups` option, it will automatically be added to the end of the list.

Each decorator will be assigned a single group specified in the `groups` option (or the `unknown` group if no match is found).
The order of items in the `groups` option determines how groups are ordered.

Within a given group, members will be sorted according to the `type`, `order`, `ignoreCase`, etc. options.

Individual groups can be combined together by placing them in an array. The order of groups in that array does not matter.
All members of the groups in the array will be sorted together as if they were part of a single group.

### customGroups

<sub>
  type: `{ [groupName: string]: string | string[] }`
</sub>
<sub>default: `{}`</sub>

You can define your own groups and use regex to match specific decorators.

Each key of `customGroups` represents a group name which you can then use in the `groups` option. The value for each key can either be of type:
- `string` — A decorator's name matching the value will be marked as part of the group referenced by the key.
- `string[]` — A decorator's name matching any of the values of the array will be marked as part of the group referenced by the key.
The order of values in the array does not matter.

Custom group matching takes precedence over predefined group matching.

#### Example for class decorators

```ts

Put all error-related decorators at the bottom:

```ts
@Component()
@Validated()
@AtLeastOneAttributeError()
@NoPublicAttributeError()
class MyClass {
}
```

`groups` and `customGroups` configuration:

```js
 {
   groups: [
     'unknown',
     'error'          // [!code ++]
   ],
+  customGroups: {    // [!code ++]
+    error: '.*Error' // [!code ++]
+  }                  // [!code ++]
 }
```

## Usage

<CodeTabs
  code={[
    {
      source: dedent`
        // eslint.config.js
        import perfectionist from 'eslint-plugin-perfectionist'

        export default [
          {
            plugins: {
              perfectionist,
            },
            rules: {
              'perfectionist/sort-decorators': [
                'error',
                {
                  type: 'alphabetical',
                  order: 'asc',
                  fallbackSort: { type: 'unsorted' },
                  ignoreCase: true,
                  specialCharacters: 'keep',
                  groups: [],
                  customGroups: {},
                  sortOnClasses: true,
                  sortOnMethods: true,
                  sortOnAccessors: true,
                  sortOnProperties: true,
                  sortOnParameters: true,
                },
              ],
            },
          },
        ]
      `,
      name: 'Flat Config',
      value: 'flat',
    },
    {
      source: dedent`
        // .eslintrc.js
        module.exports = {
          plugins: [
            'perfectionist',
          ],
          rules: {
            'perfectionist/sort-decorators': [
              'error',
              {
                type: 'alphabetical',
                order: 'asc',
                fallbackSort: { type: 'unsorted' },
                ignoreCase: true,
                specialCharacters: 'keep',
                groups: [],
                customGroups: {},
                sortOnClasses: true,
                sortOnMethods: true,
                sortOnAccessors: true,
                sortOnProperties: true,
                sortOnParameters: true,
              },
            ],
          },
        }
      `,
      name: 'Legacy Config',
      value: 'legacy',
    },
  ]}
  type="config-type"
  client:load
  lang="tsx"
/>

## Version

This rule was introduced in [v4.0.0](https://github.com/azat-io/eslint-plugin-perfectionist/releases/tag/v4.0.0).

## Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-decorators.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-decorators.test.ts)
