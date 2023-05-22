---
title: recommended-line-length
---

# recommended-line-length

## 📖 Details

Configuration for the `eslint-plugin-perfectionist` plugin, which provides all plugin rules with preset options: sorting by string length in descending order.

This configuration will make your code prettier and more pleasing to the eye.

## ⚙️ Usage

### Legacy config

<!-- prettier-ignore -->
```json
// .eslintrc
{
  "extends": [
    "plugin:perfectionist/recommended-line-length"
  ]
}
```

### Flat config

<!-- prettier-ignore -->
```js
// eslint.config.js
import perfectionistPluginRecommendedLineLength from 'eslint-plugin-perfectionist/config/recommended-line-length'

export default [
  perfectionistPluginRecommendedLineLength
]
```
