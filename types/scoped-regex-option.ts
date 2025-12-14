import type { RegexOption } from './common-options'

export type ScopedRegexOption = RegexOption<{
  scope?: Scope
}>
export type Scope = (typeof regexScopes)[number]

export let regexScopes = ['shallow', 'deep'] as const
