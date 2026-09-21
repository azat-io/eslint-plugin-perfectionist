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
            patterns: [
              {
                regex:
                  '^@typescript-eslint/utils(/(?!ast-utils$|eslint-utils$).*)?$',
                message: 'Only type imports are allowed.',
                allowTypeImports: true,
              },
            ],
          },
        ],
        'eslint-plugin/require-meta-default-options': 'off',
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
