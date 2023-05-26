---
title: recommended-natural
---

# recommended-natural

## 📖 Details

Configuration for the `eslint-plugin-perfectionist` plugin, which provides all plugin rules with predefined options: natural sorting in ascending order.

What is the difference between natural sorting and alphabetical sorting? Natural sort compares strings containing a mixture of letters and numbers, just as a human would do when sorting. For example: `item-1`, `item-2`, `item-10`.

This configuration will allow you to navigate through your code faster because all the data that can be safely sorted will be in order.

## ⚙️ Usage

### Legacy config

<!-- prettier-ignore -->
```json
// .eslintrc
{
  "extends": [
    "plugin:perfectionist/recommended-natural"
  ]
}
```

### Flat config

<!-- prettier-ignore -->
```js
// eslint.config.js
import perfectionistPluginRecommendedNatural from 'eslint-plugin-perfectionist/configs/recommended-natural'

export default [
  perfectionistPluginRecommendedNatural
]
```
