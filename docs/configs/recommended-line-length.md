---
title: recommended-line-length
description: ESLint Plugin Perfectionist config for sorting by line length
---

# recommended-line-length

## 📖 Config Details

Configuration for the `eslint-plugin-perfectionist` plugin, which provides all plugin rules with preset options: sorting by string length in descending order.

This configuration will make your code prettier and more pleasing to the eye.

## ⚙️ Usage

### Legacy Config

<!-- prettier-ignore -->
```json
// .eslintrc
{
  "extends": [
    "plugin:perfectionist/recommended-line-length"
  ]
}
```

### Flat Config

<!-- prettier-ignore -->
```js
// eslint.config.js
import perfectionistLineLength from 'eslint-plugin-perfectionist/configs/recommended-line-length'

export default [
  perfectionistLineLength
]
```
