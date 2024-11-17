import type { Linter } from 'eslint'

import eslintPlugin from 'eslint-plugin-eslint-plugin/configs/all'
import eslintConfig from '@azat-io/eslint-config'

export default eslintConfig({
  extends: [
    eslintPlugin,
    {
      rules: {
        'eslint-plugin/require-meta-docs-description': [
          'error',
          { pattern: '^Enforce' },
        ],
        'eslint-plugin/require-meta-schema-description': 'off',
        'jsdoc/require-param-description': 'off',
        '@typescript-eslint/max-params': 'off',
        'unicorn/no-array-for-each': 'off',
        'jsdoc/require-param-type': 'off',
        'jsdoc/check-param-names': 'off',
        'jsdoc/require-returns': 'off',
        'jsdoc/require-param': 'off',
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
