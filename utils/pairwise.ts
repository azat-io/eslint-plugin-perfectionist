export let pairwise = <T>(
  nodes: T[],
  callback: (left: T, right: T, iteration: number) => void,
) => {
  if (nodes.length > 1) {
    for (let i = 1; i < nodes.length; i++) {
      let left = nodes.at(i - 1)
      let right = nodes.at(i)

      if (left && right) {
        callback(left, right, i - 1)
      }
    }
  }
}
