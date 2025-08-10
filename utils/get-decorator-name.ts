import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

/**
 * Extracts the name of a decorator from its AST node.
 *
 * Processes the decorator text to extract just the name portion, removing the
 * '@' prefix if present and any parameters or arguments that follow the name.
 * This is useful for sorting and matching decorators by their base name.
 *
 * @example
 *   // Simple decorator
 *   getDecoratorName({ sourceCode, decorator: @Component });
 *   // Returns: 'Component'
 *
 * @example
 *   // Decorator with parameters
 *   getDecoratorName({ sourceCode, decorator: @Injectable({ providedIn: 'root' }) });
 *   // Returns: 'Injectable'
 *
 * @example
 *   // Namespaced decorator
 *   getDecoratorName({ sourceCode, decorator: @angular.Component() });
 *   // Returns: 'angular.Component'
 *
 * @param params - Parameters object.
 * @param params.sourceCode - ESLint source code object for text extraction.
 * @param params.decorator - Decorator AST node to extract name from.
 * @returns The decorator name without '@' prefix and parameters.
 */
export function getDecoratorName({
  sourceCode,
  decorator,
}: {
  sourceCode: TSESLint.SourceCode
  decorator: TSESTree.Decorator
}): string {
  let fullName = sourceCode.getText(decorator)
  if (fullName.startsWith('@')) {
    fullName = fullName.slice(1)
  }
  return fullName.split('(')[0]!
}
