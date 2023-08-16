---
title: sort-jsx-props
description: ESLint Plugin Perfectionist rule which enforce sorted JSX props within JSX elements
---

# sort-jsx-props

💼 This rule is enabled in the following [configs](/configs/): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted JSX props within JSX elements.

Maintaining a consistent and sorted order of JSX props can improve code readability, organization, and reduce potential errors caused by misplaced or unordered props.

It's **safe**. The rule considers spread elements in a props list and does not break component functionality.

:::info Important
If you use the [`jsx-sort-props`](https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/jsx-sort-props.md) rule from the [`eslint-plugin-react`](https://github.com/jsx-eslint/eslint-plugin-react) plugin, it is highly recommended to [disable it](https://eslint.org/docs/latest/use/configure/rules#using-configuration-files-1) to avoid conflicts.
:::

## 💡 Examples

::: code-group

<!-- prettier-ignore -->
```jsx [Alphabetical and Natural Sorting]
// ❌ Incorrect
<Input
  color="secondary"
  name="username"
  onChange={event => setUsername(event.target.value)}
  full
  placeholder={t['enter-username']}
  size="l"
  label={t.username}
  end={<UserProfileIcon />}
/>

// ✅ Correct
<Input
  color="secondary"
  end={<UserProfileIcon />}
  full
  label={t.username}
  name="username"
  onChange={event => setUsername(event.target.value)}
  placeholder={t['enter-username']}
  size="l"
/>
```

```jsx [Sorting by Line Length]
// ❌ Incorrect
<Input
  color="secondary"
  name="username"
  onChange={event => setUsername(event.target.value)}
  full
  placeholder={t['enter-username']}
  size="l"
  label={t.username}
  end={<UserProfileIcon />}
/>

// ✅ Correct
<Input
  onChange={event => setUsername(event.target.value)}
  placeholder={t['enter-username']}
  end={<UserProfileIcon />}
  label={t.username}
  color="secondary"
  name="username"
  size="l"
  full
/>
```

:::

## 🔧 Options

This rule accepts an options object with the following properties:

```ts
type Group = 'multiline' | 'shorthand' | 'unknown'

interface Options {
  type?: 'alphabetical' | 'natural' | 'line-length'
  order?: 'asc' | 'desc'
  'ignore-case'?: boolean
  groups?: (Group | Group[])[]
  'custom-groups': { [key in T[number]]: string[] | string }
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

You can set up a list of JSX props groups for sorting. Groups can be combined. There are predefined groups: `'multiline'`, `'shorthand'`.

### custom-groups

<sub>(default: `{}`)</sub>

You can define your own groups for JSX props. The [minimatch](https://github.com/isaacs/minimatch) library is used for pattern matching.

Example:

```
{
  "custom-groups": {
    "callback": "on*"
  }
}
```

## ⚙️ Usage

::: code-group

```json [Legacy Config]
// .eslintrc
{
  "plugins": ["perfectionist"],
  "rules": {
    "perfectionist/sort-jsx-props": [
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
      'perfectionist/sort-jsx-props': [
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

This rule was introduced in v0.2.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-jsx-props.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-jsx-props.test.ts)
