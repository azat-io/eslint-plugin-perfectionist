export let groupBy = <T>(array: T[], predicate: (v: T) => string) =>
  array.reduce((acc, value) => {
    let computedValue = predicate(value)

    if (!(computedValue in acc)) {
      acc[computedValue] = []
    }

    acc[computedValue].push(value)
    return acc
  }, {} as { [key: string]: T[] })
