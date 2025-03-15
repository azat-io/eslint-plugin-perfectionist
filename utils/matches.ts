import type { RegexOption } from '../types/common-options'

export let matches = (value: string, regexOption: RegexOption): boolean => {
  if (Array.isArray(regexOption)) {
    return regexOption.some(opt => matches(value, opt))
  }

  if (typeof regexOption === 'string') {
    return new RegExp(regexOption).test(value)
  }

  // Handler for non-string regexes until an error is thrown on the JSON schema
  // Level
  if ('source' in regexOption) {
    throw new Error(
      'Invalid configuration: please enter your RegExp expressions as strings.\n' +
        'For example, write ".*foo" instead of /.*foo/',
    )
  }

  return new RegExp(regexOption.pattern, regexOption.flags).test(value)
}
