---
title: sort-map-elements
---

# sort-map-elements

💼 This rule is enabled in the following [configs](https://eslint-plugin-perfectionist.azat.io/configs): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted elements within a JavaScript `Map` object.

Sorting Map elements provides a clear and predictable structure to the codebase, making it easier for developers to locate and understand the key-value pairs defined within a Map.

This rule detects instances where Map elements are not sorted in a specified order and raises a linting error. It encourages developers to rearrange the elements in the desired order, ensuring a consistent structure across Map objects.

## 💡 Examples

### Alphabetical and Natural Sorting

```ts
// Incorrect
let bebop = Map([
  ['spike', 'Spike Spiegel'],
  ['ed', 'Edward'],
  ['ein', 'Ein'],
  ['faye', 'Faye Valentine'],
  ['jet', 'Jet Black'],
])

// Correct
let bebop = Map([
  ['ed', 'Edward'],
  ['ein', 'Ein'],
  ['faye', 'Faye Valentine'],
  ['jet', 'Jet Black'],
  ['spike', 'Spike Spiegel'],
])
```

### Sorting by Line Length

```ts
// Incorrect
let bebop = Map([
  ['spike', 'Spike Spiegel'],
  ['ed', 'Edward'],
  ['ein', 'Ein'],
  ['faye', 'Faye Valentine'],
  ['jet', 'Jet Black'],
])

// Correct
let bebop = Map([
  ['spike', 'Spike Spiegel'],
  ['faye', 'Faye Valentine'],
  ['jet', 'Jet Black'],
  ['ed', 'Edward'],
  ['ein', 'Ein'],
])
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

## ⚙️ Usage

### Legacy Config

```json
// .eslintrc
{
  "rules": {
    "perfectionist/sort-map-elements": [
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
      'perfectionist/sort-map-elements': [
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

This rule was introduced in v0.5.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-map-elements.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-map-elements.test.ts)
