import config from '@azat-io/eslint-config-typescript'

export default [
  ...config,
  {
    ignores: ['**/.vitepress/cache/**/*'],
  },
]
