---
title: sort-map-elements
---

# sort-map-elements

> Enforce sorted Map elements.

## 📖 Rule details

This rule verifies that all `Map` elements are sorted in order of string length.

### Incorrect

<!-- prettier-ignore -->
```ts
Map([
  ['react', 'facebook/react'],
  ['vue', 'vuejs/core'],
  ['svelte', 'sveltejs/svelte'],
  ['solid', 'solidjs/solid']
  ['qwik', 'BuilderIO/qwik'],
])
```

### Correct

<!-- prettier-ignore -->
```ts
Map([
  ['svelte', 'sveltejs/svelte'],
  ['react', 'facebook/react'],
  ['solid', 'solidjs/solid']
  ['qwik', 'BuilderIO/qwik'],
  ['vue', 'vuejs/core'],
])
```

## 🔧 Options

### `type`

- `natural` (default) - sorting, which is similar to alphabetical order.
- `line-length` - sort by code line length.

### `order`

- `asc` (default) - enforce properties to be in ascending order.
- `desc` - enforce properties to be in descending order.

## ⚙️ Usage

### Legacy config

```json
// .eslintrc
{
  "rules": {
    "perfectionist/sort-map-elements": ["error", { "type": "line-length", "order": "desc" }]
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
    'perfectionist/sort-map-elements': ['error', { type: 'line-length', order: 'desc' }],
  },
}
```

## 🚀 Version

Coming soon.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-map-elements.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-map-elements.test.ts)
