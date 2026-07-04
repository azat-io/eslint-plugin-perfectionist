import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Checks whether a function expression is executed as soon as the expression
 * containing it is evaluated.
 *
 * Covers directly invoked functions (IIFE), including functions used as the
 * callee of a `new` expression, methods and accessors of object literals that
 * are immediately used, and members of class expressions that are immediately
 * used.
 *
 * @param functionNode - The function expression to check.
 * @returns Whether the function is immediately executed.
 */
export function isFunctionImmediatelyExecuted(
  functionNode: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression,
): boolean {
  if (isNodeImmediatelyCalled(functionNode)) {
    return true
  }

  let { parent } = functionNode
  switch (parent.type) {
    case AST_NODE_TYPES.MethodDefinition:
      return (
        parent.value === functionNode &&
        isClassExpressionMemberImmediatelyExecuted(parent)
      )
    case AST_NODE_TYPES.Property:
      return (
        parent.value === functionNode &&
        isObjectLiteralMemberImmediatelyExecuted(parent)
      )
    default:
      return false
  }
}

/**
 * Checks whether a node is the callee of a call or `new` expression.
 *
 * @param node - The AST node to check.
 * @returns Whether the node is immediately called.
 */
export function isNodeImmediatelyCalled(node: TSESTree.Expression): boolean {
  let { parent } = node
  return (
    (parent.type === AST_NODE_TYPES.CallExpression ||
      parent.type === AST_NODE_TYPES.NewExpression) &&
    parent.callee === node
  )
}

/**
 * Checks whether a class-expression member runs while the expression containing
 * the class is evaluated.
 *
 * A constructor runs when the class expression is directly instantiated, as in
 * `new (class { constructor() {} })()`. A static member must be accessed on the
 * class expression itself, as in `(class { static m() {} }).m()`. An instance
 * member requires the class to be instantiated first and the member to be
 * accessed on the `new` result, as in `new (class { m() {} })().m()`.
 *
 * @param methodDefinition - The class member holding the function value.
 * @returns Whether the member body runs immediately.
 */
function isClassExpressionMemberImmediatelyExecuted(
  methodDefinition: TSESTree.MethodDefinition,
): boolean {
  let classNode = methodDefinition.parent.parent
  if (classNode.type !== AST_NODE_TYPES.ClassExpression) {
    return false
  }

  if (methodDefinition.kind === 'constructor') {
    return (
      isNodeImmediatelyCalled(classNode) &&
      classNode.parent.type === AST_NODE_TYPES.NewExpression
    )
  }

  let isAccessorKind =
    methodDefinition.kind === 'get' || methodDefinition.kind === 'set'
  if (methodDefinition.static) {
    return isMemberAccessExecuted({
      receiver: classNode,
      isAccessorKind,
    })
  }

  let newExpression = classNode.parent
  if (
    newExpression.type !== AST_NODE_TYPES.NewExpression ||
    newExpression.callee !== classNode
  ) {
    return false
  }

  return isMemberAccessExecuted({
    receiver: newExpression,
    isAccessorKind,
  })
}

/**
 * Checks whether an object-literal method or accessor runs while the expression
 * containing the object is evaluated.
 *
 * The object literal itself must be the receiver of a member access, as in `({
 * m() {} }).m()` or `({ get x() {} }).x`.
 *
 * @param property - The object member holding the function value.
 * @returns Whether the member body runs immediately.
 */
function isObjectLiteralMemberImmediatelyExecuted(
  property: TSESTree.Property,
): boolean {
  let objectNode = property.parent
  /* v8 ignore if -- @preserve A function-valued property is always inside an object expression. */
  if (objectNode.type !== AST_NODE_TYPES.ObjectExpression) {
    return false
  }

  return isMemberAccessExecuted({
    isAccessorKind: property.kind === 'get' || property.kind === 'set',
    receiver: objectNode,
  })
}

/**
 * Checks whether accessing a member on the receiver executes the member body.
 *
 * The receiver must be the object of a member expression. Getters and setters
 * run on the access alone, while a plain method additionally requires the
 * member expression to be called.
 *
 * @param params - Parameters object.
 * @param params.receiver - The expression the member is accessed on.
 * @param params.isAccessorKind - Whether the member is a getter or a setter.
 * @returns Whether the member body runs immediately.
 */
function isMemberAccessExecuted({
  isAccessorKind,
  receiver,
}: {
  receiver: TSESTree.Expression
  isAccessorKind: boolean
}): boolean {
  let memberExpression = receiver.parent
  if (
    memberExpression.type !== AST_NODE_TYPES.MemberExpression ||
    memberExpression.object !== receiver
  ) {
    return false
  }

  if (isAccessorKind) {
    return true
  }

  return isNodeImmediatelyCalled(memberExpression)
}
