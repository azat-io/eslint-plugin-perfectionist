---
title: sort-array-includes
---

# sort-array-includes

> Enforce sorted array values if the include method is called after the array is created.

## 💡 Examples

### Natural sorting

<!-- prettier-ignore -->
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

### Sorting by line length

<!-- prettier-ignore -->
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

- `enum` (default: `natural`):
  - `natural` - sorting, which is similar to alphabetical order.
  - `line-length` - sort by code line length.

### `order`

- `enum` (default: `asc`):
  - `asc` - enforce properties to be in ascending order.
  - `desc` - enforce properties to be in descending order.

### `spreadLast`

- `boolean` (default: `false`) - enforce spread elements in array to be last

## ⚙️ Usage

### Legacy config

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

### Flat config

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
