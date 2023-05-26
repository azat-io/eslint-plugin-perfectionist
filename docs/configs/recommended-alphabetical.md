---
title: recommended-alphabetical
---

# recommended-alphabetical

## 📖 Details

Configuration for the `eslint-plugin-perfectionist` plugin, which provides all plugin rules with predefined options: alphabetical sorting in ascending order.

This configuration will allow you to navigate your code faster and easier.

## ⚙️ Usage

### Legacy config

<!-- prettier-ignore -->
```json
// .eslintrc
{
  "extends": [
    "plugin:perfectionist/recommended-alphabetical"
  ]
}
```

### Flat config

<!-- prettier-ignore -->
```js
// eslint.config.js
import perfectionistPluginRecommendedAlphabetical from 'eslint-plugin-perfectionist/configs/recommended-alphabetical'

export default [
  perfectionistPluginRecommendedAlphabetical
]
```
