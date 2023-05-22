---
title: sort-map-elements
---

# sort-map-elements

> Enforce sorted `Map` elements.

## 💡 Examples

### Natural sorting

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

### Sorting by line length

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

- `enum` (default: `natural`):
  - `natural` - sorting, which is similar to alphabetical order.
  - `line-length` - sort by code line length.

### `order`

- `enum` (default: `asc`):
  - `asc` - enforce properties to be in ascending order.
  - `desc` - enforce properties to be in descending order.

## ⚙️ Usage

### Legacy config

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
