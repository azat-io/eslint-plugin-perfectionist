import type { TSESLint } from '@typescript-eslint/utils'

export type Settings = Partial<{
  type: 'alphabetical' | 'line-length' | 'natural'
  partitionByComment: string[] | boolean | string
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

  let validateOptions = (object: Record<string, unknown>) => {
    let allowedOptions = [
      'partitionByComment',
      'partitionByNewLine',
      'ignorePattern',
      'ignoreCase',
      'order',
      'type',
    ]

    let keys = Object.keys(object)
    for (let key of keys) {
      /* c8 ignore start */
      if (!allowedOptions.includes(key)) {
        return false
      }
      /* c8 ignore end */
    }
    return true
  }

  let perfectionistSettings = settings.perfectionist as Record<string, unknown>

  /* c8 ignore start */
  if (!validateOptions(perfectionistSettings)) {
    throw new Error('Invalid Perfectionist settings')
  }
  /* c8 ignore end */

  return settings.perfectionist as Settings
}
