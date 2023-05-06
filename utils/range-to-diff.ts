import type { Range } from '@typescript-eslint/types/dist/generated/ast-spec'

export let rangeToDiff = (range: Range): number => {
  let [from, to] = range
  return to - from
}
