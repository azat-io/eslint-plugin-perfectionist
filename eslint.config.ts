import type { Linter } from 'eslint'

import eslintPlugin from 'eslint-plugin-eslint-plugin'
import eslintConfig from '@azat-io/eslint-config'

export default eslintConfig({
  extends: [
    eslintPlugin.configs.recommended,
    {
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                message: 'Only type imports are allowed.',
                name: '@typescript-eslint/types',
                allowTypeImports: true,
              },
            ],
          },
        ],
        'eslint-plugin/require-meta-default-options': 'off',
      },
      settings: {
        perfectionist: {
          fallbackSort: { type: 'alphabetical', order: 'asc' },
        },
      },
    },
  ],
  perfectionist: true,
  typescript: true,
  svelte: true,
  vitest: true,
  astro: true,
  node: true,
}) satisfies Promise<Linter.Config[]>
