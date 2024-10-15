import type { TSESLint } from '@typescript-eslint/utils'

export type Settings = Partial<{
  type: 'alphabetical' | 'line-length' | 'natural'
  partitionByComment: string[] | boolean | string
  specialCharacters: 'remove' | 'trim' | 'keep'
  matcher: 'minimatch' | 'regex'
  partitionByNewLine: boolean
  ignorePattern: string[]
  order: 'desc' | 'asc'
  ignoreCase: boolean
}>

export let getSettings = (
  settings: TSESLint.SharedConfigurationSettings = {},
) => {
  if (!settings.perfectionist) {
    return {}
  }

  let getInvalidOptions = (object: Record<string, unknown>) => {
    let allowedOptions: (keyof Settings)[] = [
      'partitionByComment',
      'partitionByNewLine',
      'specialCharacters',
      'ignorePattern',
      'ignoreCase',
      'matcher',
      'order',
      'type',
    ]

    return Object.keys(object).filter(
      key => !allowedOptions.includes(key as keyof Settings),
    )
  }

  let perfectionistSettings = settings.perfectionist as Record<string, unknown>

  let invalidOptions = getInvalidOptions(perfectionistSettings)
  if (invalidOptions.length) {
    throw new Error(
      'Invalid Perfectionist setting(s): ' + invalidOptions.join(', '),
    )
  }

  return settings.perfectionist as Settings
}
