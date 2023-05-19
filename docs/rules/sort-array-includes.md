---
title: sort-array-includes
---

# sort-array-includes

> Enforce sorted array values if the include method is called after the array is created.

## 📖 Rule details

### Incorrect

```ts
[
  'Armored Titan',
  'Cart Titan',
  ...titans
  'Beast Titan',
  'War Hammer Titan',
  'Attack Titan',
].includes(titan)
```

### Correct

<!-- prettier-ignore -->
```ts
[
  'War Hammer Titan',
  'Armored Titan',
  'Attack Titan',
  'Beast Titan',
  'Cart Titan',
  ...titans
].includes(titan)
```

## 🔧 Options

### `type`

- `natural` (default) - sorting, which is similar to alphabetical order.
- `line-length` - sort by code line length.

### `order`

- `asc` (default) - enforce properties to be in ascending order.
- `desc` - enforce properties to be in descending order.

### `spreadLast`

- `boolean` (default: `false`) - enforce spread elements in array to be last

## ⚙️ Usage

### Legacy config

```json
// .eslintrc
{
  "rules": {
    "perfectionist/sort-array-includes": ["error", { "type": "line-length", "order": "desc" }]
  }
}
```

### Flat config

```js
// eslint.config.js
import perfectionist from 'eslint-plugin-perfectionist'

export default {
  plugins: {
    perfectionist,
  },
  rules: {
    'perfectionist/sort-array-includes': ['error', { type: 'line-length', order: 'desc' }],
  },
}
```

## 🚀 Version

Coming soon.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-array-includes.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-array-includes.test.ts)
