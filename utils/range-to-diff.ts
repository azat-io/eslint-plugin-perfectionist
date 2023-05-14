import type { TSESTree } from '@typescript-eslint/types'

export let rangeToDiff = (range: TSESTree.Range): number => {
  let [from, to] = range
  return to - from
}
