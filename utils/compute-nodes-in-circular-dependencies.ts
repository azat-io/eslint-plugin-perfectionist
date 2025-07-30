import type { SortingNodeWithDependencies } from './sort-nodes-by-dependencies'

export function computeNodesInCircularDependencies<
  T extends SortingNodeWithDependencies,
>(elements: T[]): Set<T> {
  let elementsInCycles = new Set<T>()
  let visitingElements = new Set<T>()
  let visitedElements = new Set<T>()

  function depthFirstSearch(element: T, path: T[]): void {
    if (visitedElements.has(element)) {
      return
    }

    if (visitingElements.has(element)) {
      let cycleStartIndex = path.indexOf(element)
      if (cycleStartIndex !== -1) {
        for (let cycleElements of path.slice(cycleStartIndex)) {
          elementsInCycles.add(cycleElements)
        }
      }
      return
    }

    visitingElements.add(element)
    path.push(element)

    for (let dependency of element.dependencies) {
      let dependencyElement = elements
        .filter(currentElement => currentElement !== element)
        .find(currentElement =>
          currentElement.dependencyNames.includes(dependency),
        )
      if (dependencyElement) {
        depthFirstSearch(dependencyElement, [...path])
      }
    }

    visitingElements.delete(element)
    visitedElements.add(element)
  }

  for (let element of elements) {
    if (!visitedElements.has(element)) {
      depthFirstSearch(element, [])
    }
  }

  return elementsInCycles
}
