import type { TSESLint } from '@typescript-eslint/utils'

export type Settings = Partial<{
  type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
  partitionByComment: string[] | boolean | string
  specialCharacters: 'remove' | 'trim' | 'keep'
  locales: NonNullable<Intl.LocalesArgument>
  partitionByNewLine: boolean
  ignorePattern: string[]
  order: 'desc' | 'asc'
  ignoreCase: boolean
  alphabet: string
}>

export let getSettings = (
  settings: TSESLint.SharedConfigurationSettings = {},
): Settings => {
  if (!settings.perfectionist) {
    return {}
  }

  let getInvalidOptions = (object: Record<string, unknown>): string[] => {
    let allowedOptions = new Set<keyof Settings>([
      'partitionByComment',
      'partitionByNewLine',
      'specialCharacters',
      'ignorePattern',
      'ignoreCase',
      'alphabet',
      'locales',
      'order',
      'type',
    ])

    return Object.keys(object).filter(
      key => !allowedOptions.has(key as keyof Settings),
    )
  }

  let perfectionistSettings = settings.perfectionist as Record<string, unknown>

  let invalidOptions = getInvalidOptions(perfectionistSettings)
  if (invalidOptions.length) {
    throw new Error(
      `Invalid Perfectionist setting(s): ${invalidOptions.join(', ')}`,
    )
  }

  return settings.perfectionist as Settings
}
