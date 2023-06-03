---
title: sort-jsx-props
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

### Alphabetical and Natural Sorting

```tsx
// Incorrect
let Riko = () => (
  <CaveRaider
    level="White Whistle"
    name="Riko"
    home="Belchero Orphanage"
    delver
    age={12}
  />
)

// Correct
let Riko = () => (
  <CaveRaider
    age={12}
    delver
    home="Belchero Orphanage"
    level="White Whistle"
    name="Riko"
  />
)
```

### Sorting by Line Length

```tsx
// Incorrect
let Riko = () => (
  <CaveRaider
    level="White Whistle"
    name="Riko"
    home="Belchero Orphanage"
    delver
    age={12}
  />
)

// Correct
let Riko = () => (
  <CaveRaider
    home="Belchero Orphanage"
    level="White Whistle"
    name="Riko"
    age={12}
    delver
  />
)
```

## 🔧 Options

### `type`

- `enum` (default: `alphabetical`):
  - `alphabetical` - sort alphabetically.
  - `natural` - sort in natural order.
  - `line-length` - sort by code line length.

### `order`

- `enum` (default: `asc`):
  - `asc` - enforce properties to be in ascending order.
  - `desc` - enforce properties to be in descending order.

### `ignore-case`

- `boolean` (default: `false`) - only affects alphabetical and natural sorting. When `true` the rule ignores the case-sensitivity of the order.

### `callback`

- `enum` (default: `ignore`):
  - `first` - enforce callback JSX props to be at the top of the list
  - `ignore` - sort callback props in general order
  - `last` - enforce callback JSX props to be at the end of the list

### `shorthand`

- `enum` (default: `ignore`):
  - `first` - enforce shorthand JSX props to be at the top of the list
  - `ignore` - sort shorthand props in general order
  - `last` - enforce shorthand JSX props to be at the end of the list

## ⚙️ Usage

### Legacy Config

```json
// .eslintrc
{
  "rules": {
    "perfectionist/sort-jsx-props": [
      "error",
      {
        "type": "line-length",
        "order": "desc"
      }
    ]
  }
}
```

### Flat Config

```js
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
        },
      ],
    },
  },
]
```

## 🚀 Version

This rule was introduced in v0.2.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-jsx-props.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-jsx-props.test.ts)
