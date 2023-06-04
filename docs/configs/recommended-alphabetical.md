---
title: recommended-alphabetical
description: ESLint Plugin Perfectionist config for alphabetical sorting
---

# recommended-alphabetical

## 📖 Config Details

Configuration for the `eslint-plugin-perfectionist` plugin, which provides all plugin rules with predefined options: alphabetical sorting in ascending order.

It makes it just a tiny bit faster to find a declaration in a large list. Remember, you read code far more than you write it.

## ⚙️ Usage

### Legacy Config

<!-- prettier-ignore -->
```json
// .eslintrc
{
  "extends": [
    "plugin:perfectionist/recommended-alphabetical"
  ]
}
```

### Flat Config

<!-- prettier-ignore -->
```js
// eslint.config.js
import perfectionistAlphabetical from 'eslint-plugin-perfectionist/configs/recommended-alphabetical'

export default [
  perfectionistAlphabetical
]
```
