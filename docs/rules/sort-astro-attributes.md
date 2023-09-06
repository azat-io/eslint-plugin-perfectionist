---
title: sort-astro-attributes
description: ESLint Plugin Perfectionist rule which enforce sorted ES class members
---

# sort-astro-attributes

💼 This rule is enabled in the following [configs](/configs/): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted attributes in Astro elements.

It's **safe**. The rule considers spread elements in an attributes list and does not break component functionality.

## 🔧 Options

This rule accepts an options object with the following properties:

```ts
type CustomGroup = string
type Group =
  | 'multiline'
  | 'shorthand'
  | 'astro-shorthand'
  | 'unknown'
  | CustomGroup

interface Options {
  type?: 'alphabetical' | 'natural' | 'line-length'
  order?: 'asc' | 'desc'
  'ignore-case'?: boolean
  groups?: (Group | Group[])[]
  'custom-groups': { [key: CustomGroup]: string[] | string }
}
```

### type

<sub>(default: `'alphabetical'`)</sub>

- `alphabetical` - sort alphabetically.
- `natural` - sort in natural order.
- `line-length` - sort by code line length.

### order

<sub>(default: `'asc'`)</sub>

- `asc` - enforce properties to be in ascending order.
- `desc` - enforce properties to be in descending order.

### ignore-case

<sub>(default: `false`)</sub>

Only affects alphabetical and natural sorting. When `true` the rule ignores the case-sensitivity of the order.

### groups

<sub>(default: `[]`)</sub>

You can set up a list of Astro attribute groups for sorting. Groups can be combined. There are predefined groups: `'multiline'`, `'shorthand'`, `'astro-shorthand'`.

### custom-groups

<sub>(default: `{}`)</sub>

You can define your own groups for Astro attributes. The [minimatch](https://github.com/isaacs/minimatch) library is used for pattern matching.

Example:

```
{
  "custom-groups": {
    "callback": "on*"
  }
}
```

## ⚙️ Usage

In order to start using this rule, you need to install additional dependency:

- `astro-eslint-parser`

::: code-group

```json [Legacy Config]
// .eslintrc
{
  "plugins": ["perfectionist"],
  "rules": {
    "perfectionist/sort-astro-attributes": [
      "error",
      {
        "type": "natural",
        "order": "asc",
        "groups": ["multiline", "unknown", ["shorthand", "astro-shorthand"]]
      }
    ]
  }
}
```

```js [Flat Config]
// eslint.config.js
import perfectionist from 'eslint-plugin-perfectionist'

export default [
  {
    plugins: {
      perfectionist,
    },
    rules: {
      'perfectionist/sort-astro-attributes': [
        'error',
        {
          type: 'natural',
          order: 'asc',
          groups: ['multiline', 'unknown', ['shorthand', 'astro-shorthand']],
        },
      ],
    },
  },
]
```

:::

## 🚀 Version

This rule was introduced in v2.0.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-astro-attributes.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-astro-attributes.test.ts)
