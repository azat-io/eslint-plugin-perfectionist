export let pairwise = <T>(
  nodes: T[],
  callback: (first: T, second: T, iteration: number) => void,
) => {
  if (nodes.length > 1) {
    for (let i = 1; i < nodes.length; i++) {
      let first = nodes.at(i - 1)
      let second = nodes.at(i)

      if (first && second) {
        callback(first, second, i - 1)
      }
    }
  }
}
