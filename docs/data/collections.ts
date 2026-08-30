export const GUIDE_ORDER = ['introduction', 'getting-started', 'integrations']

export const CONFIG_ORDER = [
  'recommended-alphabetical',
  'recommended-natural',
  'recommended-line-length',
  'recommended-custom',
]

export function orderIndex(order: readonly string[], id: string): number {
  let index = order.indexOf(id)
  return index === -1 ? order.length : index
}
