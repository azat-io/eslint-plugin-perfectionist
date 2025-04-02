---
title: sort-enums
description: Ensure TypeScript enum members are sorted for better readability and maintainability. Use this ESLint rule to keep your enums organized
shortDescription: Enforce sorted TypeScript enums
keywords:
  - eslint
  - sort enums
  - eslint rule
  - coding standards
  - code quality
  - javascript linting
  - typescript enums sorting
---

import CodeExample from '../../components/CodeExample.svelte'
import CodeTabs from '../../components/CodeTabs.svelte'
import dedent from 'dedent'

Enforce sorted TypeScript enum members.

Enums are essential for defining a set of named constants, and keeping them in a consistent and predictable order is a best practice for readability and maintainability.

This rule ensures that TypeScript enum members are sorted, making it easier to reason about their values and identify any missing or duplicate entries. Sorted enums enhance the clarity of your code, making it more straightforward to understand and maintain.

## Try it out

<CodeExample
  alphabetical={dedent`
    enum Priority {
      Critical = 'Critical',
      High = 'High',
      Low = 'Low',
      Medium = 'Medium',
      None = 'None',
    }

    enum Status {
      Cancelled = 'Cancelled',
      Completed = 'Completed',
      InProgress = 'In Progress',
      NotStarted = 'Not Started',
      OnHold = 'On Hold',
    }
  `}
  lineLength={dedent`
    enum Priority {
      Critical = 'Critical',
      Medium = 'Medium',
      High = 'High',
      None = 'None',
      Low = 'Low',
    }

    enum Status {
      NotStarted = 'Not Started',
      InProgress = 'In Progress',
      Completed = 'Completed',
      Cancelled = 'Cancelled',
      OnHold = 'On Hold',
    }
  `}
  initial={dedent`
    enum Priority {
      Critical = 'Critical',
      None = 'None',
      Low = 'Low',
      High = 'High',
      Medium = 'Medium',
    }

    enum Status {
      InProgress = 'In Progress',
      Completed = 'Completed',
      OnHold = 'On Hold',
      Cancelled = 'Cancelled',
      NotStarted = 'Not Started',
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

### sortByValue

<sub>default: `false`</sub>

Controls whether sorting should be done using the enum's values or names.

- `true` — Use enum values.
- `false` — Use enum names.

When this setting is `true`, numeric enums will have their values sorted numerically regardless of the `type` setting.

### forceNumericSort

<sub>default: `false`</sub>

Controls whether numeric enums should always be sorted numerically, regardless of the `type` and `sortByValue` settings.

- `true` — Use enum values.
- `false` — Use enum names.

### partitionByComment

<sub>default: `false`</sub>

Enables the use of comments to separate the members of enums into logical groups. This can help in organizing and maintaining large enums by creating partitions within the enum based on comments.

- `true` — All comments will be treated as delimiters, creating partitions.
- `false` — Comments will not be used as delimiters.
- `RegExpPattern = string | { pattern: string; flags: string}` — A regexp pattern to specify which comments should act as delimiters.
- `RegExpPattern[]` — A list of regexp patterns to specify which comments should act as delimiters.
- `{ block: boolean | RegExpPattern | RegExpPattern[]; line: boolean | RegExpPattern | RegExpPattern[] }` — Specify which block and line comments should act as delimiters.

### partitionByNewLine

<sub>default: `false`</sub>

When `true`, the rule will not sort the members of an enum if there is an empty line between them. This helps maintain the defined order of logically separated groups of members.

```ts
enum Enum {
  // Group 1
  C = 'C',
  D = 'D',

  // Group 2
  B = 'B',

  // Group 3
  A = 'A',
  E = 'E',
}
```

Each group of enum members (separated by empty lines) is treated independently, and the order within each group is preserved.

### newlinesBetween

<sub>default: `'ignore'`</sub>

Specifies how to handle new lines between enum members.

- `ignore` — Do not report errors related to new lines between enum members.
- `always` — Enforce one new line between each group, and forbid new lines inside a group.
- `never` — No new lines are allowed in enums.

You can also enforce the newline behavior between two specific groups through the `groups` options.

See the [`groups`](#newlines-between-groups) option.

This option is only applicable when [`partitionByNewLine`](#partitionbynewline) is `false`.

### groups

<sub>
  type: `Array<string | string[]>`
</sub>
<sub>default: `[]`</sub>

Specifies a list of groups for sorting. Groups help organize elements into categories.

Each element will be assigned a single group specified in the `groups` option (or the `unknown` group if no match is found).
The order of items in the `groups` option determines how groups are ordered.

Within a given group, members will be sorted according to the `type`, `order`, `ignoreCase`, etc. options.

Individual groups can be combined together by placing them in an array. The order of groups in that array does not matter.
All members of the groups in the array will be sorted together as if they were part of a single group.

#### Newlines between groups

You may place `newlinesBetween` objects between your groups to enforce the newline behavior between two specific groups.

See the [`newlinesBetween`](#newlinesbetween) option.

This feature is only applicable when [`partitionByNewLine`](#partitionbynewline) is `false`.

```ts
{
  newlinesBetween: 'always',
  groups: [
    'a',
    { newlinesBetween: 'never' }, // Overrides the global newlinesBetween option
    'b',
  ]
}
```

### customGroups

<sub>
  type: `Array<CustomGroupDefinition | CustomGroupAnyOfDefinition>`
</sub>
<sub>default: `[]`</sub>

Defines custom groups to match specific elements.

A custom group definition may follow one of the two following interfaces:

```ts
interface CustomGroupDefinition {
  groupName: string
  type?: 'alphabetical' | 'natural' | 'line-length' | 'unsorted'
  order?: 'asc' | 'desc'
  fallbackSort?: { type: string; order?: 'asc' | 'desc' }
  newlinesInside?: 'always' | 'never'
  elementNamePattern?: string | string[] | { pattern: string; flags?: string } | { pattern: string; flags?: string }[]
}

```
An enum member will match a `CustomGroupDefinition` group if it matches all the filters of the custom group's definition.

or:

```ts
interface CustomGroupAnyOfDefinition {
  groupName: string
  type?: 'alphabetical' | 'natural' | 'line-length' | 'unsorted'
  order?: 'asc' | 'desc'
  fallbackSort?: { type: string; order?: 'asc' | 'desc' }
  newlinesInside?: 'always' | 'never'
  anyOf: Array<{
      elementNamePattern?: string | string[] | { pattern: string; flags?: string } | { pattern: string; flags?: string }[]
  }>
}
```

An enum member will match a `CustomGroupAnyOfDefinition` group if it matches all the filters of at least one of the `anyOf` items.

#### Attributes

- `groupName` — The group's name, which needs to be put in the [`groups`](#groups) option.
- `elementNamePattern` — If entered, will check that the name of the element matches the pattern entered.
- `elementValuePattern` — If entered, will check that the value of the element matches the pattern entered.
- `type` — Overrides the [`type`](#type) option for that custom group. `unsorted` will not sort the group.
- `order` — Overrides the [`order`](#order) option for that custom group.
- `fallbackSort` — Overrides the [`fallbackSort`](#fallbacksort) option for that custom group.
- `newlinesInside` — Enforces a specific newline behavior between elements of the group.

#### Match importance

The `customGroups` list is ordered:
The first custom group definition that matches an element will be used.

Custom groups have a higher priority than any predefined group.

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
              'perfectionist/sort-enums': [
                'error',
                {
                  type: 'alphabetical',
                  order: 'asc',
                  fallbackSort: { type: 'unsorted' },
                  ignoreCase: true,
                  specialCharacters: 'keep',
                  partitionByComment: false,
                  partitionByNewLine: false,
                  newlinesBetween: 'ignore',
                  sortByValue: false,
                  forceNumericSort: false,
                  groups: [],
                  customGroups: [],
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
            'perfectionist/sort-enums': [
              'error',
              {
                type: 'alphabetical',
                order: 'asc',
                fallbackSort: { type: 'unsorted' },
                ignoreCase: true,
                specialCharacters: 'keep',
                partitionByComment: false,
                partitionByNewLine: false,
                newlinesBetween: 'ignore',
                sortByValue: false,
                forceNumericSort: false,
                groups: [],
                customGroups: [],
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

This rule was introduced in [v0.8.0](https://github.com/azat-io/eslint-plugin-perfectionist/releases/tag/v0.8.0).

## Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-enums.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-enums.test.ts)
