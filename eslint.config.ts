import type { Linter } from 'eslint'

import eslintPlugin from 'eslint-plugin-eslint-plugin/configs/recommended'
import eslintConfig from '@azat-io/eslint-config'

export default eslintConfig({
  extends: [
    eslintPlugin,
    {
      rules: {
        '@typescript-eslint/max-params': 'off',
        'unicorn/no-array-for-each': 'off',
      },
    },
    {
      rules: {
        'perfectionist/sort-objects': 'off',
      },
      files: ['**/test/**', '**/rules/**', '**/utils/**'],
    },
  ],
  perfectionist: true,
  typescript: true,
  svelte: true,
  vitest: true,
  astro: true,
  node: true,
}) satisfies Promise<Linter.Config[]>
