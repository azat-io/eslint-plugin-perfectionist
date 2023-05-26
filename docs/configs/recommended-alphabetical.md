---
title: recommended-alphabetical
---

# recommended-alphabetical

## 📖 Details

Configuration for the `eslint-plugin-perfectionist` plugin, which provides all plugin rules with predefined options: alphabetical sorting in ascending order.

It makes it just a tiny bit faster to find a declaration in a large list. Remember, you read code far more than you write it.

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
