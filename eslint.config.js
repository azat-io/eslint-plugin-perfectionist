import eslintPlugin from 'eslint-plugin-eslint-plugin/configs/all'
import config from '@azat-io/eslint-config-typescript'

export default [
  ...config,
  eslintPlugin,
  {
    ignores: ['**/.vitepress/cache/**/*', 'coverage/**/*'],
  },
  {
    rules: {
      'eslint-plugin/require-meta-docs-url': 'off',
    },
  },
  {
    files: ['**/test/*', '**/rules/*', '**/docs/.vitepress/config.ts'],
    rules: {
      'perfectionist/sort-objects': 'off',
    },
  },
]
