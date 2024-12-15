import { isSortable } from './is-sortable'

export let pairwise = <T>(
  nodes: T[],
  callback: (left: T, right: T, iteration: number) => void,
): void => {
  if (!isSortable(nodes)) {
    return
  }
  for (let i = 1; i < nodes.length; i++) {
    let left = nodes.at(i - 1)
    let right = nodes.at(i)

    callback(left!, right!, i - 1)
  }
}
