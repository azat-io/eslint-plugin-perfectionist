---
title: sort-vue-attributes
description: ESLint Plugin Perfectionist rule which enforce sorted attributes in Vue elements
---

# sort-vue-attributes

💼 This rule is enabled in the following [configs](/configs/): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted attributes in Vue elements.

## 💡 Examples

::: code-group

```vue [Alphabetical and Natural Sorting]
<!-- ❌ Incorrect -->
<template>
  <v-avatar
    size="s"
    color="info"
    variant="circle"
    name="Jonah Jameson"
  ></v-avatar>
</template>

<!-- ✅ Correct -->
<template>
  <v-avatar
    color="info"
    name="Jonah Jameson"
    size="s"
    variant="circle"
  ></v-avatar>
</template>
```

```vue [Sorting by Line Length]
<!-- ❌ Incorrect -->
<template>
  <v-avatar
    size="s"
    color="info"
    variant="circle"
    name="Jonah Jameson"
  ></v-avatar>
</template>

<!-- ✅ Correct -->
<template>
  <v-avatar
    name="Jonah Jameson"
    variant="circle"
    color="info"
    size="s"
  ></v-avatar>
</template>
```

:::

## 🔧 Options

This rule accepts an options object with the following properties:

```ts
type CustomGroup = string
type Group = 'multiline' | 'shorthand' | 'unknown' | CustomGroup

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

You can set up a list of Vue attribute groups for sorting. Groups can be combined. There are predefined groups: `'multiline'`, `'shorthand'`.

### custom-groups

<sub>(default: `{}`)</sub>

You can define your own groups for Vue attributes. The [minimatch](https://github.com/isaacs/minimatch) library is used for pattern matching.

Example:

```
{
  "custom-groups": {
    "callback": "on*"
  }
}
```

## ⚙️ Usage

:::info Important
In order to start using this rule, you need to install additional dependencies:

- `vue-eslint-parser`

:::

::: code-group

```json [Legacy Config]
// .eslintrc
{
  "plugins": ["perfectionist"],
  "rules": {
    "perfectionist/sort-vue-attributes": [
      "error",
      {
        "type": "natural",
        "order": "asc",
        "groups": ["multiline", "unknown", "shorthand"]
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
      'perfectionist/sort-vue-attributes': [
        'error',
        {
          type: 'natural',
          order: 'asc',
          groups: ['multiline', 'unknown', 'shorthand'],
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

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-vue-attributes.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-vue-attributes.test.ts)
