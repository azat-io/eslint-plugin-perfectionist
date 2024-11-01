export let matches = (value: string, pattern: string) =>
  new RegExp(pattern).test(value)
