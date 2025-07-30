import type { Settings } from './get-settings'

export function complete<T extends Record<string, unknown>>(
  options: Partial<T> = {},
  settings: Settings = {},
  defaults: T = {} as T,
): T {
  return { ...defaults, ...settings, ...options }
}
