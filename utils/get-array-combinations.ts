/**
 * Generates all possible combinations of a specific size from an array.
 *
 * @param array - The array of strings to generate combinations from.
 * @param number - The number of elements in each combination.
 * @returns An array containing all possible combinations.
 */
export function getArrayCombinations(
  array: string[],
  number: number,
): string[][] {
  let result: string[][] = []

  function backtrack(start: number, comb: string[]): void {
    if (comb.length === number) {
      result.push([...comb])
      return
    }
    for (let i = start; i < array.length; i++) {
      comb.push(array[i]!)
      backtrack(i + 1, comb)
      comb.pop()
    }
  }

  backtrack(0, [])
  return result
}
