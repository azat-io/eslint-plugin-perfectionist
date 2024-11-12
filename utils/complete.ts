import type { Settings } from './get-settings'

export let complete = <T extends Record<string, unknown>>(
  options: Partial<T> = {},
  settings: Settings = {},
  defaults: T = {} as T,
): T => ({ ...defaults, ...settings, ...options })
