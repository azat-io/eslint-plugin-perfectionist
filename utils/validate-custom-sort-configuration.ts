interface Options {
  type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
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
