export let complete = <T extends Object>(
  options: Partial<T> = {},
  defaults: T,
): T => Object.assign(defaults, options)
