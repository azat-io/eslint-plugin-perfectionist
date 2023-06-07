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
interface Options {
  type?: 'alphabetical' | 'natural' | 'natural'
  order?: 'asc' | 'desc'
  'ignore-case'?: boolean
  'always-on-top'?: string[]
  callback?: 'first' | 'ignore' | 'last'
  multiline?: 'first' | 'ignore' | 'last'
  shorthand?: 'first' | 'ignore' | 'last'
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

### always-on-top

<sub>(default: `[]`)</sub>

You can set a list of property names that will always go at the beginning of the JSX element.

### callback

<sub>(default: `'ignore'`)</sub>

- `first` - enforce callback JSX props to be at the top of the list
- `ignore` - sort callback props in general order
- `last` - enforce callback JSX props to be at the end of the list

### multiline

<sub>(default: `'ignore'`)</sub>

- `first` - enforce multiline JSX props to be at the top of the list
- `ignore` - sort multiline props in general order
- `last` - enforce multiline JSX props to be at the end of the list

### shorthand

<sub>(default: `'ignore'`)</sub>

- `first` - enforce shorthand JSX props to be at the top of the list
- `ignore` - sort shorthand props in general order
- `last` - enforce shorthand JSX props to be at the end of the list

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
        "type": "line-length",
        "order": "desc",
        "always-on-top": ["id", "name"],
        "shorthand": "last",
        "multiline": "first",
        "callback": "ignore"
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
          type: 'line-length',
          order: 'desc',
          'always-on-top': ['id', 'name'],
          shorthand: 'last',
          multiline: 'first',
          callback: 'ignore',
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
