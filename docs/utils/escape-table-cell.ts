export function escapeTableCell(value: string): string {
  return value
    .replaceAll('|', String.raw`\|`)
    .replaceAll(/\s+/gu, ' ')
    .trim()
}
