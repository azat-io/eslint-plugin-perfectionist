import type { RegexOption } from '../types/common-options'

export let matches = (value: string, regexOption: RegexOption): boolean => {
  if (Array.isArray(regexOption)) {
    return regexOption.some(opt => matches(value, opt))
  }

  if (typeof regexOption === 'string') {
    return new RegExp(regexOption).test(value)
  }

  // Handler for non-string regexes until an error is thrown
  if ('source' in regexOption) {
    return new RegExp(regexOption.source as string).test(value)
  }

  return new RegExp(regexOption.pattern, regexOption.flags).test(value)
}
