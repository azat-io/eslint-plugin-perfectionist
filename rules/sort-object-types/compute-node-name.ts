import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

/**
 * Computes the name of an object-type-like node.
 *
 * @param props - The parameters object.
 * @param props.sourceCode - ESLint source code object for text extraction.
 * @param props.node - The AST node representing an object-type-like node.
 * @returns The name of the object-type like node.
 */
export function computeNodeName({
  sourceCode,
  node,
}: {
  sourceCode: TSESLint.SourceCode
  node: TSESTree.TypeElement
}): string {
  switch (node.type) {
    case AST_NODE_TYPES.TSConstructSignatureDeclaration:
    case AST_NODE_TYPES.TSCallSignatureDeclaration:
      return formatName(sourceCode.getText(node))
    case AST_NODE_TYPES.TSPropertySignature:
      return computePropertySignatureName(node, sourceCode)
    case AST_NODE_TYPES.TSMethodSignature:
      return computeMethodSignatureName(node, sourceCode)
    case AST_NODE_TYPES.TSIndexSignature:
      return computeIndexSignatureName(node, sourceCode)
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node)
  }
}

function computePropertySignatureName(
  node: TSESTree.TSPropertySignature,
  sourceCode: TSESLint.SourceCode,
): string {
  switch (node.key.type) {
    case AST_NODE_TYPES.Identifier:
      return node.key.name
    case AST_NODE_TYPES.Literal:
      return `${node.key.value}`
    default: {
      let endIndex: number =
        node.typeAnnotation?.range.at(0) ??
        node.range.at(1)! - (node.optional ? '?'.length : 0)
      return sourceCode.text.slice(node.range.at(0), endIndex)
    }
  }
}

function computeMethodSignatureName(
  node: TSESTree.TSMethodSignature,
  sourceCode: TSESLint.SourceCode,
): string {
  /* v8 ignore else -- @preserve Unsure if we can reach it. */
  if ('name' in node.key) {
    return node.key.name
  }
  /* v8 ignore next -- @preserve Unsure if we can reach it. */
  return formatName(sourceCode.getText(node))
}

function computeIndexSignatureName(
  node: TSESTree.TSIndexSignature,
  sourceCode: TSESLint.SourceCode,
): string {
  let endIndex = node.typeAnnotation?.range.at(0) ?? node.range.at(1)
  return formatName(sourceCode.text.slice(node.range.at(0), endIndex))
}

function formatName(value: string): string {
  return value.replace(/[,;]$/u, '')
}
