import type { Settings } from './get-settings'

export let complete = <T extends { [key: string]: unknown }>(
  options: Partial<T> = {},
  settings: Settings = {},
  defaults: T,
): T => Object.assign(defaults, settings, options)
