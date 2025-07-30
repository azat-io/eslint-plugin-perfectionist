import type { TSESLint } from '@typescript-eslint/utils'

import type {
  SpecialCharactersOption,
  FallbackSortOption,
  OrderOption,
  RegexOption,
  TypeOption,
} from '../types/common-options'

export type Settings = Partial<{
  partitionByComment:
    | {
        block?: string[] | boolean | string
        line?: string[] | boolean | string
      }
    | string[]
    | boolean
    | string
  specialCharacters: SpecialCharactersOption
  locales: NonNullable<Intl.LocalesArgument>
  fallbackSort: FallbackSortOption
  partitionByNewLine: boolean
  ignorePattern: RegexOption
  ignoreCase: boolean
  order: OrderOption
  type: TypeOption
  alphabet: string
}>

export function getSettings(
  settings: TSESLint.SharedConfigurationSettings = {},
): Settings {
  if (!settings['perfectionist']) {
    return {}
  }

  function getInvalidOptions(object: Record<string, unknown>): string[] {
    let allowedOptions = new Set<keyof Settings>([
      'partitionByComment',
      'partitionByNewLine',
      'specialCharacters',
      'ignorePattern',
      'fallbackSort',
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

  let perfectionistSettings = settings['perfectionist'] as Record<
    string,
    unknown
  >

  let invalidOptions = getInvalidOptions(perfectionistSettings)
  if (invalidOptions.length > 0) {
    throw new Error(
      `Invalid Perfectionist setting(s): ${invalidOptions.join(', ')}`,
    )
  }

  return settings['perfectionist'] as Settings
}
