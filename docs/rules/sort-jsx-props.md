---
title: sort-jsx-props
---

# sort-jsx-props

> Enforce sorted JSX props.

## 📖 Rule details

This rule verifies that JSX props are sorted sorted in order of string length.

### Incorrect

```tsx
let Container = () => (
  <Input
    placeholder="Password"
    value={password}
    full
    className="input"
    type="password"
    name="element"
    error={false}
    autoFocus
  />
)
```

### Correct

```tsx
let Container = () => (
  <Input
    placeholder="Password"
    className="input"
    value={password}
    type="password"
    name="element"
    error={false}
    autoFocus
    full
  />
)
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
    "perfectionist/sort-jsx-props": ["error", { "type": "line-length", "order": "desc" }]
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
    'perfectionist/sort-jsx-props': ['error', { type: 'line-length', order: 'desc' }],
  },
}
```

## 🚀 Version

This rule was introduced in v0.2.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-jsx-props.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-jsx-props.test.ts)
