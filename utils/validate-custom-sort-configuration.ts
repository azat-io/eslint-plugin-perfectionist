import type { TypeOption } from '../types/common-options'

interface Options {
  type: TypeOption | 'unsorted'
  alphabet: string
}

export let validateCustomSortConfiguration = ({
  alphabet,
  type,
}: Options): void => {
  if (type !== 'custom') {
    return
  }
  if (alphabet.length === 0) {
    throw new Error('`alphabet` option must not be empty')
  }
}
