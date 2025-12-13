import type { RegexOption } from './common-options'

export type SingleRegexOption =
  | {
      pattern: string
      flags?: string
      scope?: Scope
    }
  | string
export type ScopedRegexOption = RegexOption<{
  scope?: Scope
}>

export type Scope = (typeof regexScopes)[number]

export let regexScopes = ['shallow', 'deep'] as const
