import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { createEslintRule } from '../utils/create-eslint-rule'

export type Options = []

type MessageId = 'separateTypePartitions'

let defaultOptions: Options = []

export default createEslintRule<Options, MessageId>({
  create: context => {
    let sourceCode = context.getSourceCode()

    return {
      Program: node => {
        let partitions = collectImportPartitions(node.body, sourceCode)
        let newline = sourceCode.text.includes('\r\n') ? '\r\n' : '\n'

        for (let partition of partitions) {
          if (!hasMixedPartitionKinds(partition)) {
            continue
          }

          let chunks = buildImportChunks(partition, sourceCode)
          let typeChunks = chunks.filter(chunk => chunk.kind === 'type')
          let valueChunks = chunks.filter(chunk => chunk.kind === 'value')

          let typeBlockText = buildBlockText(typeChunks, newline)
          let valueBlockText = buildBlockText(valueChunks, newline)
          let combinedText = `${typeBlockText}${newline}${newline}${valueBlockText}`

          context.report({
            fix: fixer =>
              fixer.replaceTextRange(
                [partition[0]!.range[0], partition.at(-1)!.range[1]],
                combinedText,
              ),
            messageId: 'separateTypePartitions',
            node: partition[0]!,
          })
        }
      },
    }
  },
  meta: {
    docs: {
      description:
        'Require a blank line between type-only and value import declarations.',
      recommended: true,
    },
    messages: {
      separateTypePartitions:
        'Separate type-only and value import declarations with a blank line.',
    },
    type: 'suggestion',
    fixable: 'code',
    schema: [],
  },
  name: 'separate-type-partitions',
  defaultOptions,
})

function collectImportPartitions(
  body: TSESTree.Program['body'],
  sourceCode: Readonly<{ text: string }>,
): TSESTree.ImportDeclaration[][] {
  let partitions: TSESTree.ImportDeclaration[][] = []
  let currentPartition: TSESTree.ImportDeclaration[] = []

  for (let statement of body) {
    if (statement.type !== AST_NODE_TYPES.ImportDeclaration) {
      if (currentPartition.length > 0) {
        partitions.push(currentPartition)
        currentPartition = []
      }
      continue
    }

    if (currentPartition.length === 0) {
      currentPartition.push(statement)
      continue
    }

    let previous = currentPartition.at(-1)!
    if (hasBlankLineBetween(previous, statement, sourceCode)) {
      partitions.push(currentPartition)
      currentPartition = [statement]
      continue
    }

    currentPartition.push(statement)
  }

  if (currentPartition.length > 0) {
    partitions.push(currentPartition)
  }

  return partitions
}

function buildImportChunks(
  partition: TSESTree.ImportDeclaration[],
  sourceCode: Readonly<{ text: string }>,
): { kind: 'value' | 'type'; prefix: string; text: string }[] {
  return partition.map((node, index) => {
    let previous = index === 0 ? null : partition[index - 1]!
    let prefix =
      previous === null ? '' : (
        sourceCode.text.slice(previous.range[1], node.range[0])
      )
    let text = sourceCode.text.slice(node.range[0], node.range[1])

    return {
      kind: getImportPartitionKind(node),
      prefix,
      text,
    }
  })
}

function buildBlockText(
  chunks: { prefix: string; text: string }[],
  newline: string,
): string {
  return chunks
    .map((chunk, index) => {
      let { prefix, text } = chunk
      if (index === 0) {
        prefix = trimLeadingNewline(prefix, newline)
      }
      return `${prefix}${text}`
    })
    .join('')
}

function hasMixedPartitionKinds(
  partition: TSESTree.ImportDeclaration[],
): boolean {
  let hasType = false
  let hasValue = false

  for (let node of partition) {
    if (getImportPartitionKind(node) === 'type') {
      hasType = true
    } else {
      hasValue = true
    }
  }

  return hasType && hasValue
}

function hasBlankLineBetween(
  left: TSESTree.ImportDeclaration,
  right: TSESTree.ImportDeclaration,
  sourceCode: Readonly<{ text: string }>,
): boolean {
  let textBetween = sourceCode.text.slice(left.range[1], right.range[0])
  return /\r?\n\s*\n/u.test(textBetween)
}

function trimLeadingNewline(prefix: string, newline: string): string {
  let trimmed = prefix
  if (trimmed.startsWith(newline)) {
    trimmed = trimmed.slice(newline.length)
  }
  return trimmed.replace(/^[\t ]+/u, '')
}

function getImportPartitionKind(
  node: TSESTree.ImportDeclaration,
): 'value' | 'type' {
  return node.importKind === 'type' ? 'type' : 'value'
}
