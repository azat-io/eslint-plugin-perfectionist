---
title: sort-imports
---

# sort-imports

💼 This rule is enabled in the following [configs](/configs/): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted imports.

Maintaining a consistent and sorted order of imports can improve code readability, organization, and reduce the likelihood of errors caused by import conflicts.

Sorting imports ensures that imports are easily locatable and quickly scannable, especially in modules with a large number of import statements. It provides a clear and predictable structure to the codebase, making it easier for developers to identify and manage imports.

:::info Important
If you use the [`sort-imports`](https://eslint.org/docs/latest/rules/sort-imports) rule or the [`order`](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/order.md) rule from the [`eslint-plugin-import`](https://github.com/import-js/eslint-plugin-import) plugin, it is highly recommended to [disable them](https://eslint.org/docs/latest/use/configure/rules#using-configuration-files-1) to avoid conflicts.
:::

Rule `perfectionist/sort-imports` works in a similar way to rule `import/order`, but with some differences:

1. Supporting for new import types: `'internal-type'`, `'parent-type'`, `'sibling-type'`, `'index-type'`
2. Parsing `tsconfig.json` with the `read-tsconfig` option enabled to recognize internal imports
3. Sorting not only alphabetically, but also naturally and by line length

## 💡 Examples

### Alphabetical and Natural Sorting

```ts
// Incorrect
import { GingFreecss } from 'hunter/freecss'
import { Netero } from 'hunter/netero'

import type { Hunter } from '~/hunter-association'
import { Gon, Kurapika, Leorio } from '~/hunter-association'
import { Feitan, Phinks, Shalnark, Pakunoda } from 'phantom-troupe'
import type { Association } from '.'
import { Meruem, Neferpitou, Shaiapouf } from '../ants'
import path from 'path'
import fs from 'fs'
import type { ChimeraAnt } from '../ants'
import type { IHero } from './association-data'
import { Knuckle, Shoot } from '~/hunters/beast-hunters'
import { CheadleYorkshire } from '~/hunters/virus-hunters'
import type { HeroList } from './index.d.ts'
import './style.css'
import type { Chairman } from 'hunter'

import association from '.'
import { ChimeraAntQueen } from '../ants'
import hisoka from '../../hunters/histoka'

// Correct
import type { Chairman } from 'hunter'

import fs from 'fs'
import { GingFreecss } from 'hunter/freecss'
import { Netero } from 'hunter/netero'
import path from 'path'
import { Feitan, Phinks, Shalnark, Pakunoda } from 'phantom-troupe'

import type { Hunter } from '~/hunter-association'

import { Gon, Kurapika, Leorio } from '~/hunter-association'
import { Knuckle, Shoot } from '~/hunters/beast-hunters'
import { CheadleYorkshire } from '~/hunters/virus-hunters'

import type { Association } from '.'
import type { ChimeraAnt } from '../ants'
import type { IHero } from './association-data'
import type { HeroList } from './index.d.ts'

import association from '.'
import hisoka from '../../hunters/histoka'
import { Meruem, Neferpitou, Shaiapouf } from '../ants'
import { ChimeraAntQueen } from '../ants'
import './style.css'
```

### Sorting by Line Length

```ts
// Incorrect
import { GingFreecss } from 'hunter/freecss'
import { Netero } from 'hunter/netero'

import type { Hunter } from '~/hunter-association'
import { Gon, Kurapika, Leorio } from '~/hunter-association'
import { Feitan, Phinks, Shalnark, Pakunoda } from 'phantom-troupe'
import type { Association } from '.'
import { Meruem, Neferpitou, Shaiapouf } from '../ants'
import path from 'path'
import fs from 'fs'
import type { ChimeraAnt } from '../ants'
import type { IHero } from './association-data'
import { Knuckle, Shoot } from '~/hunters/beast-hunters'
import { CheadleYorkshire } from '~/hunters/virus-hunters'
import type { HeroList } from './index.d.ts'
import './style.css'
import type { Chairman } from 'hunter'

import association from '.'
import { ChimeraAntQueen } from '../ants'
import hisoka from '../../hunters/histoka'

// Correct
import type { Chairman } from 'hunter'

import { Feitan, Phinks, Shalnark, Pakunoda } from 'phantom-troupe'
import { GingFreecss } from 'hunter/freecss'
import { Netero } from 'hunter/netero'
import path from 'path'
import fs from 'fs'

import type { Hunter } from '~/hunter-association'

import { Gon, Kurapika, Leorio } from '~/hunter-association'
import { CheadleYorkshire } from '~/hunters/virus-hunters'
import { Knuckle, Shoot } from '~/hunters/beast-hunters'

import type { IHero } from './association-data'
import type { HeroList } from './index.d.ts'
import type { ChimeraAnt } from '../ants'
import type { Association } from '.'

import { Meruem, Neferpitou, Shaiapouf } from '../ants'
import hisoka from '../../hunters/histoka'
import { ChimeraAntQueen } from '../ants'
import association from '.'
import './style.css'
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

### `groups`

- `[array]`

If you use [one of the configs](/configs/) exported by this plugin, you get the following import grouping settings:

```js
{
  order: [
    'type',
    ['builtin', 'external'],
    'internal-type',
    'internal',
    ['parent-type', 'sibling-type', 'index-type'],
    ['parent', 'sibling', 'index'],
    'object',
    'unknown',
  ]
}
```

### `internal-pattern`

- `[string]` (default: `['~/**']`)

### `newlines-between`

- `enum` (default: `always`):
  - `ignore` - do not report errors related to new lines between import groups.
  - `always` - at least one new line between each group will be enforced, and new lines inside a group will be forbidden.
  - `never` - no new lines are allowed in the entire import section.

### `read-tsconfig`

- `boolean` (default: `false`) - read `tsconfig.json` and use `paths` as internal imports.

## ⚙️ Usage

### Legacy Config

```json
// .eslintrc
{
  "rules": {
    "perfectionist/sort-imports": [
      "error",
      {
        "newlines-between": "always",
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
      'perfectionist/sort-imports': [
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

This rule was introduced in v0.9.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-imports.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-imports.test.ts)
