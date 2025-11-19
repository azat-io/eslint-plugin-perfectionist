import type { Alternative, Element } from '@eslint-community/regexpp/ast'

/**
 * Checks whether any alternative contains an unnamed capturing group.
 *
 * @param alternatives - Alternatives to inspect.
 * @returns True if at least one unnamed capturing group is found.
 */
export function alternativesContainUnnamedCapturingGroups(
  alternatives: Alternative[],
): boolean {
  return alternatives.some(alternativeContainsUnnamedCapturingGroups)
}

/**
 * Determines whether the given element (or any nested element) contains an
 * unnamed capturing group.
 *
 * @param element - Regex element to inspect.
 * @returns True when an unnamed capturing group is found.
 */
function elementContainsUnnamedCapturingGroups(element: Element): boolean {
  switch (element.type) {
    case 'CapturingGroup': {
      if (!element.name) {
        return true
      }

      return element.alternatives.some(
        alternativeContainsUnnamedCapturingGroups,
      )
    }

    case 'Quantifier': {
      return elementContainsUnnamedCapturingGroups(element.element)
    }

    case 'Assertion': {
      if (element.kind === 'lookahead' || element.kind === 'lookbehind') {
        return element.alternatives.some(
          alternativeContainsUnnamedCapturingGroups,
        )
      }

      return false
    }

    case 'Group': {
      return element.alternatives.some(
        alternativeContainsUnnamedCapturingGroups,
      )
    }

    default: {
      return false
    }
  }
}

/**
 * Checks whether an alternative contains unnamed capturing groups by inspecting
 * all of its direct elements.
 *
 * @param alternative - Alternative to inspect.
 * @returns True when an unnamed capture appears within the alternative.
 */
function alternativeContainsUnnamedCapturingGroups(
  alternative: Alternative,
): boolean {
  return alternative.elements.some(elementContainsUnnamedCapturingGroups)
}
