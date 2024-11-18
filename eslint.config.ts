import type { Linter } from 'eslint'

import eslintPlugin from 'eslint-plugin-eslint-plugin/configs/recommended'
import eslintConfig from '@azat-io/eslint-config'

export default eslintConfig({
  extends: eslintPlugin,
  perfectionist: true,
  typescript: true,
  svelte: true,
  vitest: true,
  astro: true,
  node: true,
}) satisfies Promise<Linter.Config[]>
