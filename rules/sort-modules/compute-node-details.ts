import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { SortModulesNode, Modifier, Selector } from './types'

import { isPropertyOrAccessorNode } from './is-property-or-accessor-node'
import { getNodeDecorators } from '../../utils/get-node-decorators'
import { getDecoratorName } from '../../utils/get-decorator-name'
import { isArrowFunctionNode } from './is-arrow-function-node'
import { computeDependencies } from './compute-dependencies'

interface ParsableNodeDetails {
  nodeDetails: {
    addSafetySemicolonWhenInline: boolean
    dependencies: string[]
    modifiers: Modifier[]
    decorators: string[]
    selector: Selector
    name: string
  }
  shouldPartitionAfterNode?: never
  moduleBlock?: never
}
interface NonParsableNodeDetails {
  moduleBlock: TSESTree.TSModuleBlock | null
  shouldPartitionAfterNode: boolean
  nodeDetails?: never
}
type Details = NonParsableNodeDetails | ParsableNodeDetails

/**
 * Compute details about a module-related node.
 *
 * @param params - The parameters object.
 * @param params.sourceCode - The source code object.
 * @param params.node - The AST node to compute details for.
 * @returns The computed details about the node, such as whether it should be
 *   ignored, if a module block was found, and information about the node.
 */
export function computeNodeDetails({
  sourceCode,
  node,
}: {
  sourceCode: TSESLint.SourceCode
  node: SortModulesNode
}): Details {
  let selector: undefined | Selector
  let name: undefined | string
  let modifiers: Modifier[] = []
  let dependencies: string[] = []
  let decorators: string[] = []
  let addSafetySemicolonWhenInline: boolean = false
  let moduleBlock: TSESTree.TSModuleBlock | null = null
  let shouldPartitionAfterNode: boolean = false
  let ignoredDueToDecoratedThenExportedDecoratedClass: boolean = false
  let exportNode:
    | TSESTree.ExportDefaultDeclaration
    | TSESTree.ExportNamedDeclaration

  parseNode(node)

  // eslint-disable-next-line typescript/no-unnecessary-condition
  if (!selector || !name || ignoredDueToDecoratedThenExportedDecoratedClass) {
    return {
      shouldPartitionAfterNode,
      moduleBlock,
    }
  }

  return {
    nodeDetails: {
      addSafetySemicolonWhenInline,
      dependencies,
      decorators,
      modifiers,
      selector,
      name,
    },
  }

  function parseNode(
    nodeToParse:
      | TSESTree.DefaultExportDeclarations
      | TSESTree.NamedExportDeclarations
      | SortModulesNode,
  ): void {
    if ('declare' in nodeToParse && nodeToParse.declare) {
      modifiers.push('declare')
    }
    switch (nodeToParse.type) {
      case AST_NODE_TYPES.ExportDefaultDeclaration:
        exportNode = nodeToParse
        modifiers.push('default', 'export')
        parseNode(nodeToParse.declaration)
        break
      case AST_NODE_TYPES.ExportNamedDeclaration:
        exportNode = nodeToParse
        if (nodeToParse.declaration) {
          parseNode(nodeToParse.declaration)
        }
        modifiers.push('export')
        break
      case AST_NODE_TYPES.TSInterfaceDeclaration:
        selector = 'interface'
        ;({ name } = nodeToParse.id)
        break
      case AST_NODE_TYPES.TSTypeAliasDeclaration:
        selector = 'type'
        ;({ name } = nodeToParse.id)
        addSafetySemicolonWhenInline = true
        break
      case AST_NODE_TYPES.FunctionDeclaration:
      case AST_NODE_TYPES.TSDeclareFunction:
        selector = 'function'
        if (nodeToParse.async) {
          modifiers.push('async')
        }
        if (modifiers.includes('declare')) {
          addSafetySemicolonWhenInline = true
        }
        name = nodeToParse.id?.name
        break
      case AST_NODE_TYPES.TSModuleDeclaration:
        shouldPartitionAfterNode = true
        moduleBlock = nodeToParse.body ?? null
        break
      case AST_NODE_TYPES.VariableDeclaration:
        shouldPartitionAfterNode = true
        break
      case AST_NODE_TYPES.TSEnumDeclaration:
        selector = 'enum'
        ;({ name } = nodeToParse.id)
        dependencies = [...dependencies, ...extractDependencies(nodeToParse)]
        break
      case AST_NODE_TYPES.ClassDeclaration:
        selector = 'class'
        name = nodeToParse.id?.name
        // eslint-disable-next-line no-case-declarations -- Easier to handle
        let nodeDecorators = getNodeDecorators(nodeToParse)
        if (nodeDecorators[0]) {
          modifiers.push('decorated')
          ignoredDueToDecoratedThenExportedDecoratedClass =
            isExportAfterDecorators({
              firstDecorator: nodeDecorators[0],
              exportNode,
            })
        }
        decorators = nodeDecorators.map(decorator =>
          getDecoratorName({
            sourceCode,
            decorator,
          }),
        )
        dependencies = [...dependencies, ...extractDependencies(nodeToParse)]
        break
      /* v8 ignore next 2 -- @preserve Unhandled cases */
      default:
        break
    }
  }
}

function extractDependencies(
  expression: TSESTree.TSEnumDeclaration | TSESTree.ClassDeclaration,
): string[] {
  /**
   * Search static methods only if there is a static block or a static property
   * that is not an arrow function.
   */
  let searchStaticMethodsAndFunctionProperties =
    expression.type === AST_NODE_TYPES.ClassDeclaration &&
    expression.body.body.some(
      classElement =>
        classElement.type === AST_NODE_TYPES.StaticBlock ||
        (classElement.static &&
          isPropertyOrAccessorNode(classElement) &&
          !isArrowFunctionNode(classElement)),
    )

  return computeDependencies(expression, {
    searchStaticMethodsAndFunctionProperties,
    type: 'hard',
  })
}

function isExportAfterDecorators({
  firstDecorator,
  exportNode,
}: {
  exportNode:
    | TSESTree.ExportDefaultDeclaration
    | TSESTree.ExportNamedDeclaration
    | undefined
  firstDecorator: TSESTree.Decorator
}): boolean {
  if (!exportNode) {
    return false
  }

  return exportNode.range[0] > firstDecorator.range[0]
}
