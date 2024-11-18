import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import {
  specialCharactersJsonSchema,
  customGroupsJsonSchema,
  ignoreCaseJsonSchema,
  localesJsonSchema,
  groupsJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

export type Options<T extends string[]> = [
  Partial<{
    customGroups: Record<T[number], string[] | string>
    type: 'alphabetical' | 'line-length' | 'natural'
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    groups: (Group<T>[] | Group<T>)[]
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

type MESSAGE_ID =
  | 'unexpectedHeritageClausesGroupOrder'
  | 'unexpectedHeritageClausesOrder'

type Group<T extends string[]> = 'unknown' | T[number]

let defaultOptions: Required<Options<string[]>[0]> = {
  type: 'alphabetical',
  ignoreCase: true,
  specialCharacters: 'keep',
  customGroups: {},
  order: 'asc',
  groups: [],
  locales: 'en-US',
}

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: 'sort-heritage-clauses',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted heritage clauses.',
      url: 'https://perfectionist.dev/rules/sort-heritage-clauses',
      recommended: true,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: typeJsonSchema,
          order: orderJsonSchema,
          locales: localesJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          groups: groupsJsonSchema,
          customGroups: customGroupsJsonSchema,
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedHeritageClausesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedHeritageClausesOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [defaultOptions],
  create: context => {
    let settings = getSettings(context.settings)

    let options = complete(context.options.at(0), settings, defaultOptions)

    validateGroupsConfiguration(
      options.groups,
      ['unknown'],
      Object.keys(options.customGroups),
    )

    return {
      ClassDeclaration: declaration =>
        sortHeritageClauses(context, options, declaration.implements),
      TSInterfaceDeclaration: declaration =>
        sortHeritageClauses(context, options, declaration.extends),
    }
  },
})

let sortHeritageClauses = (
  context: Readonly<RuleContext<MESSAGE_ID, Options<string[]>>>,
  options: Required<Options<string[]>[0]>,
  heritageClauses:
    | TSESTree.TSInterfaceHeritage[]
    | TSESTree.TSClassImplements[],
): void => {
  if (!isSortable(heritageClauses)) {
    return
  }
  let sourceCode = getSourceCode(context)
  let eslintDisabledLines = getEslintDisabledLines({
    sourceCode,
    ruleName: context.id,
  })

  let nodes: SortingNode[] = heritageClauses.map(heritageClause => {
    let name = getHeritageClauseExpressionName(heritageClause.expression)

    let { getGroup, setCustomGroups } = useGroups(options)
    setCustomGroups(options.customGroups, name)

    return {
      size: rangeToDiff(heritageClause, sourceCode),
      node: heritageClause,
      group: getGroup(),
      isEslintDisabled: isNodeEslintDisabled(
        heritageClause,
        eslintDisabledLines,
      ),
      name,
    }
  })

  let sortNodesExcludingEslintDisabled = (
    ignoreEslintDisabledNodes: boolean,
  ): SortingNode[] =>
    sortNodesByGroups(nodes, options, { ignoreEslintDisabledNodes })
  let sortedNodes = sortNodesExcludingEslintDisabled(false)
  let sortedNodesExcludingEslintDisabled =
    sortNodesExcludingEslintDisabled(true)

  pairwise(nodes, (left, right) => {
    let indexOfLeft = sortedNodes.indexOf(left)
    let indexOfRight = sortedNodes.indexOf(right)
    let indexOfRightExcludingEslintDisabled =
      sortedNodesExcludingEslintDisabled.indexOf(right)
    if (
      indexOfLeft < indexOfRight &&
      indexOfLeft < indexOfRightExcludingEslintDisabled
    ) {
      return
    }
    let leftNumber = getGroupNumber(options.groups, left)
    let rightNumber = getGroupNumber(options.groups, right)
    context.report({
      messageId:
        leftNumber === rightNumber
          ? 'unexpectedHeritageClausesOrder'
          : 'unexpectedHeritageClausesGroupOrder',
      data: {
        left: toSingleLine(left.name),
        leftGroup: left.group,
        right: toSingleLine(right.name),
        rightGroup: right.group,
      },
      node: right.node,
      fix: fixer =>
        makeFixes({
          fixer,
          nodes,
          sortedNodes: sortedNodesExcludingEslintDisabled,
          sourceCode,
        }),
    })
  })
}

let getHeritageClauseExpressionName = (
  expression: TSESTree.PrivateIdentifier | TSESTree.Expression,
): string => {
  if (expression.type === 'Identifier') {
    return expression.name
  }
  if ('property' in expression) {
    return getHeritageClauseExpressionName(expression.property)
    /* v8 ignore start - should never throw */
  }
  throw new Error(
    'Unexpected heritage clause expression. Please report this issue ' +
      'here: https://github.com/azat-io/eslint-plugin-perfectionist/issues',
  )
  /* v8 ignore end */
}
