/**
 * Generates all possible combinations of a specific size from an array.
 * @param {string[]} array - The array of strings to generate combinations from.
 * @param {number} number - The number of elements in each combination.
 * @returns {string[][]} An array containing all possible combinations.
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
