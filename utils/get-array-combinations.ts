/**
 * Get possible combinations of n elements from an array
 */
export let getArrayCombinations = (
  array: string[],
  number: number,
): string[][] => {
  let result: string[][] = []

  let backtrack = (start: number, comb: string[]): void => {
    if (comb.length === number) {
      result.push([...comb])
      return
    }
    for (let i = start; i < array.length; i++) {
      comb.push(array[i])
      backtrack(i + 1, comb)
      comb.pop()
    }
  }

  backtrack(0, [])
  return result
}
