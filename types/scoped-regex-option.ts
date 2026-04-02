import type { RegexOption } from './common-options'

export type Scope = (typeof regexScopes)[number]

export type ScopedRegexOption = RegexOption

export let regexScopes = ['shallow', 'deep'] as const
