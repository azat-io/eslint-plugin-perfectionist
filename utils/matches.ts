import { minimatch } from 'minimatch'

export let matches = (
  value: string,
  pattern: string,
  type: 'minimatch' | 'regex',
) => {
  switch (type) {
    case 'regex':
      return new RegExp(pattern).test(value)
    case 'minimatch':
    default:
      return minimatch(value, pattern, {
        nocomment: true,
      })
  }
}
