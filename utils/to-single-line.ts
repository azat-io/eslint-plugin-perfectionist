export let toSingleLine = (string: string): string =>
  string.replaceAll(/\s{2,}/gu, ' ').trim()
