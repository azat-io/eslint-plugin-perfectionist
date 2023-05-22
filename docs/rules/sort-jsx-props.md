---
title: sort-jsx-props
---

# sort-jsx-props

> Enforce sorted JSX props.

## 💡 Examples

### Natural sorting

<!-- prettier-ignore -->
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

### Sorting by line length

<!-- prettier-ignore -->
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
