export let complete = <T extends { [key: string]: unknown }>(options: Partial<T> = {}, defaults: T): T =>
  Object.assign(defaults, options)
