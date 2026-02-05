import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { createEslintRule } from '../utils/create-eslint-rule'

export type Options = [
  {
    blankLine?: BlankLineOption
    order?: OrderOption
  },
]
type MessageId = 'separateTypeImports' | 'useImportType'

type OrderOption = 'value-first' | 'type-first'

type BlankLineOption = 'always' | 'never'

let defaultOptions: Required<Options[number]> = {
  order: 'type-first',
  blankLine: 'always',
}

export default createEslintRule<Options, MessageId>({
  create: context => ({
    ImportDeclaration: node => {
      if (node.importKind === 'type') {
        return
      }

      let namedSpecifiers = node.specifiers.filter(
        (specifier): specifier is TSESTree.ImportSpecifier =>
          specifier.type === AST_NODE_TYPES.ImportSpecifier,
      )
      if (namedSpecifiers.length === 0) {
        return
      }

      let typeSpecifiers = namedSpecifiers.filter(
        specifier => specifier.importKind === 'type',
      )
      if (typeSpecifiers.length === 0) {
        return
      }

      let defaultSpecifier = node.specifiers.find(
        specifier => specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier,
      )
      let namespaceSpecifier = node.specifiers.find(
        specifier => specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier,
      )
      let valueNamedSpecifiers = namedSpecifiers.filter(
        specifier => specifier.importKind !== 'type',
      )
      let hasValueImports =
        valueNamedSpecifiers.length > 0 ||
        Boolean(defaultSpecifier) ||
        Boolean(namespaceSpecifier)

      let options = { ...defaultOptions, ...context.options.at(0) }

      if (hasValueImports) {
        context.report({
          fix: fixer => {
            let fix = buildSeparatedImportsFix({
              options,
              context,
              node,
            })
            return fixer.replaceTextRange(fix.range, fix.text)
          },
          messageId: 'separateTypeImports',
          node,
        })
        return
      }

      context.report({
        fix: fixer => {
          let fixText = buildTypeOnlyImport({
            context,
            node,
          })
          return fixer.replaceText(node, fixText)
        },
        messageId: 'useImportType',
        node,
      })
    },
  }),
  meta: {
    schema: {
      items: {
        properties: {
          order: {
            description: 'Controls whether type imports are placed first.',
            enum: ['type-first', 'value-first'],
            type: 'string',
          },
          blankLine: {
            description: 'Controls blank lines between split imports.',
            enum: ['always', 'never'],
            type: 'string',
          },
        },
        additionalProperties: false,
        type: 'object',
      },
      uniqueItems: true,
      type: 'array',
    },
    messages: {
      separateTypeImports:
        'Split mixed type and value imports into separate declarations.',
      useImportType: 'Use "import type" for type-only named imports.',
    },
    docs: {
      description: 'Require separating inline type imports from value imports.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'separate-type-imports',
})

type TSESLintSourceCode = Readonly<{
  getTokenAfter(
    node: TSESTree.Node,
    options?: {
      filter?(token: TSESTree.Token): boolean
      includeComments?: boolean
    },
  ): TSESTree.Token | null
  getLastToken(node: TSESTree.Node): TSESTree.Token | null
  getText(node: TSESTree.Node): string
  text: string
}>

function buildSeparatedImportsFix({
  context,
  options,
  node,
}: {
  context: Readonly<{ sourceCode: TSESLintSourceCode }>
  options: Required<Options[number]>
  node: TSESTree.ImportDeclaration
}): { range: TSESTree.Range; text: string } {
  let { sourceCode } = context
  let namedSpecifiers = node.specifiers.filter(
    (specifier): specifier is TSESTree.ImportSpecifier =>
      specifier.type === AST_NODE_TYPES.ImportSpecifier,
  )

  let segments = buildNamedSpecifierSegments(namedSpecifiers, sourceCode)

  let typeSegments = segments
    .filter(segment => segment.specifier.importKind === 'type')
    .map(segment => stripTypeKeyword(segment.text))
  let valueSegments = segments
    .filter(segment => segment.specifier.importKind !== 'type')
    .map(segment => segment.text)

  let typeNamedText = buildNamedListText(typeSegments)
  let valueNamedText = buildNamedListText(valueSegments)

  let defaultSpecifier = node.specifiers.find(
    specifier => specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier,
  )
  let namespaceSpecifier = node.specifiers.find(
    specifier => specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier,
  )

  let sourceText = sourceCode.getText(node.source)
  let { attributesText, semicolon } = getImportSuffix(node, sourceCode)

  let typeImportText = buildImportDeclarationText({
    namedText: typeNamedText,
    importKind: 'type',
    attributesText,
    sourceText,
    semicolon,
  })

  let valueImportText = buildImportDeclarationText({
    namespaceText:
      /* v8 ignore next -- @preserve Namespace specifiers cannot coexist with named specifiers in valid syntax. */
      namespaceSpecifier ? sourceCode.getText(namespaceSpecifier) : null,
    defaultText: defaultSpecifier ? sourceCode.getText(defaultSpecifier) : null,
    namedText: valueNamedText,
    importKind: 'value',
    attributesText,
    sourceText,
    semicolon,
  })

  let newline = sourceCode.text.includes('\r\n') ? '\r\n' : '\n'
  let separator = newline + newline
  let combinedText =
    options.order === 'type-first' ?
      `${typeImportText}${separator}${valueImportText}`
    : `${valueImportText}${separator}${typeImportText}`

  if (options.order === 'type-first') {
    let partitionStart = getPartitionStart(node, sourceCode)
    if (partitionStart && partitionStart !== node) {
      let partitionPrefix = sourceCode.text.slice(
        partitionStart.range[0],
        node.range[0],
      )
      let trimmedPrefix = partitionPrefix.replace(/[\t ]*(?:\r?\n)+$/u, '')
      return {
        text: `${typeImportText}${separator}${trimmedPrefix}${separator}${valueImportText}`,
        range: [partitionStart.range[0], node.range[1]],
      }
    }
  }

  return {
    range: [node.range[0], node.range[1]],
    text: combinedText,
  }
}

function buildTypeOnlyImport({
  context,
  node,
}: {
  context: Readonly<{ sourceCode: TSESLintSourceCode }>
  node: TSESTree.ImportDeclaration
}): string {
  let { sourceCode } = context
  let namedSpecifiers = node.specifiers.filter(
    (specifier): specifier is TSESTree.ImportSpecifier =>
      specifier.type === AST_NODE_TYPES.ImportSpecifier,
  )

  let segments = buildNamedSpecifierSegments(namedSpecifiers, sourceCode)

  let typeSegments = segments.map(segment => stripTypeKeyword(segment.text))
  let typeNamedText = buildNamedListText(typeSegments)

  let sourceText = sourceCode.getText(node.source)
  let { attributesText, semicolon } = getImportSuffix(node, sourceCode)

  return buildImportDeclarationText({
    namedText: typeNamedText,
    importKind: 'type',
    attributesText,
    sourceText,
    semicolon,
  })
}

function getPartitionStart(
  node: TSESTree.ImportDeclaration,
  sourceCode: TSESLintSourceCode,
): TSESTree.ImportDeclaration | null {
  let { parent } = node
  /* v8 ignore next 2 -- @preserve ImportDeclaration nodes belong to Program. */
  if (parent.type !== AST_NODE_TYPES.Program) {
    return null
  }

  let index = parent.body.indexOf(node)
  if (index <= 0) {
    return node
  }

  let start = node
  for (let i = index - 1; i >= 0; i -= 1) {
    let previous = parent.body[i]!
    /* v8 ignore next 2 -- @preserve ImportDeclaration nodes cannot follow non-import statements. */
    if (previous.type !== AST_NODE_TYPES.ImportDeclaration) {
      break
    }

    if (hasBlankLineBetween(previous, start, sourceCode)) {
      break
    }

    start = previous
  }

  return start
}

function buildImportDeclarationText({
  attributesText,
  namespaceText,
  defaultText,
  importKind,
  sourceText,
  namedText,
  semicolon,
}: {
  namespaceText?: string | null
  importKind: 'value' | 'type'
  defaultText?: string | null
  namedText?: string | null
  attributesText: string
  sourceText: string
  semicolon: string
}): string {
  let importClauseParts = [
    defaultText ?? null,
    namespaceText ?? null,
    namedText ? `{ ${namedText} }` : null,
  ].filter(Boolean)

  let importClause = importClauseParts.join(', ')
  let importKeyword = importKind === 'type' ? 'import type' : 'import'

  return `${importKeyword} ${importClause} from ${sourceText}${attributesText}${semicolon}`
}

function buildNamedSpecifierSegments(
  specifiers: TSESTree.ImportSpecifier[],
  sourceCode: TSESLintSourceCode,
): { specifier: TSESTree.ImportSpecifier; text: string }[] {
  let sorted = [...specifiers].toSorted(
    (left, right) => left.range[0] - right.range[0],
  )
  let lastSpecifier = sorted.at(-1)!
  let closingBraceToken = getClosingBraceToken(sourceCode, lastSpecifier)

  return sorted.map((specifier, index) => {
    let end =
      index === sorted.length - 1 ?
        closingBraceToken.range[0]
      : sorted[index + 1]!.range[0]
    return {
      text: sourceCode.text.slice(specifier.range[0], end),
      specifier,
    }
  })
}

function getImportSuffix(
  node: TSESTree.ImportDeclaration,
  sourceCode: TSESLintSourceCode,
): { attributesText: string; semicolon: string } {
  let attributesText = sourceCode.text.slice(
    node.source.range[1],
    node.range[1],
  )

  let hasSemicolon = sourceCode.getLastToken(node)?.value === ';'
  if (hasSemicolon && attributesText.endsWith(';')) {
    attributesText = attributesText.slice(0, -1)
  }

  return { semicolon: hasSemicolon ? ';' : '', attributesText }
}

function getClosingBraceToken(
  sourceCode: TSESLintSourceCode,
  specifier: TSESTree.ImportSpecifier,
): TSESTree.Token {
  let token = sourceCode.getTokenAfter(specifier, {
    includeComments: false,
  })!
  if (token.value === ',') {
    return sourceCode.getTokenAfter(specifier, {
      filter: nextToken => nextToken.value === '}',
      includeComments: false,
    })!
  }
  return token
}

function buildNamedListText(segments: string[]): string {
  let combined = segments.join('').trim()
  combined = combined.replace(/,\s*$/u, '')
  if (/\r?\n/u.test(combined) && !/\/\*|\/\//u.test(combined)) {
    combined = combined
      .replaceAll(/\s*\n\s*/gu, ' ')
      .replaceAll(/\s+/gu, ' ')
      .trim()
  }
  return combined
}

function hasBlankLineBetween(
  left: TSESTree.ImportDeclaration,
  right: TSESTree.ImportDeclaration,
  sourceCode: TSESLintSourceCode,
): boolean {
  let textBetween = sourceCode.text.slice(left.range[1], right.range[0])
  return /\r?\n\s*\n/u.test(textBetween)
}

function stripTypeKeyword(text: string): string {
  return text.replace(/^type\b\s*/u, '')
}
