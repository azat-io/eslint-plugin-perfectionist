export let matches = (value: string, pattern: string): boolean =>
  new RegExp(pattern).test(value)
