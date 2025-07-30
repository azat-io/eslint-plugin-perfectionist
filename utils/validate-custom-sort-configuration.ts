import type { TypeOption } from '../types/common-options'

interface Options {
  type: TypeOption
  alphabet: string
}

export function validateCustomSortConfiguration({
  alphabet,
  type,
}: Options): void {
  if (type !== 'custom') {
    return
  }
  if (alphabet.length === 0) {
    throw new Error('`alphabet` option must not be empty')
  }
}
