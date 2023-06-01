---
title: sort-array-includes
---

# sort-array-includes

💼 This rule is enabled in the following [configs](https://eslint-plugin-perfectionist.azat.io/configs): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted array values if the `includes` method is immediately called after the array is created.

This rule aims to promote code readability and maintainability by enforcing a consistent ordering of values in arrays.

## 💡 Examples

### Alphabetical and Natural Sorting

```ts
// Incorrect
[
  'Beast Titan',
  'Armored Titan',
  'Jaw Titan',
  'Cart Titan',
  'War Hammer Titan',
  'Attack Titan',
].includes(titan)

// Correct
[
  'Armored Titan',
  'Attack Titan',
  'Beast Titan',
  'Cart Titan',
  'Jaw Titan',
  'War Hammer Titan',
].includes(titan)
```

### Sorting by Line Length

```ts
// Incorrect
[
  'Beast Titan',
  'Armored Titan',
  'Jaw Titan',
  'Cart Titan',
  'War Hammer Titan',
  'Attack Titan',
].includes(titan)

// Correct
[
  'War Hammer Titan',
  'Armored Titan',
  'Attack Titan',
  'Beast Titan',
  'Cart Titan',
  'Jaw Titan',
].includes(titan)
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

### `spreadLast`

- `boolean` (default: `false`) - enforce spread elements in array to be last

## ⚙️ Usage

### Legacy Config

```json
// .eslintrc
{
  "rules": {
    "perfectionist/sort-array-includes": [
      "error",
      {
        "type": "line-length",
        "order": "desc",
        "spreadLast": true
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
      'perfectionist/sort-array-includes': [
        'error',
        {
          type: 'line-length',
          order: 'desc',
          spreadLast: true,
        },
      ],
    },
  },
]
```

## 🚀 Version

This rule was introduced in v0.5.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-array-includes.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-array-includes.test.ts)
