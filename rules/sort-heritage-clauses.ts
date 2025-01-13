import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../types/sorting-node'

import {
  specialCharactersJsonSchema,
  customGroupsJsonSchema,
  ignoreCaseJsonSchema,
  buildTypeJsonSchema,
  alphabetJsonSchema,
  localesJsonSchema,
  groupsJsonSchema,
  orderJsonSchema,
} from '../utils/common-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { createNodeIndexMap } from '../utils/create-node-index-map'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { makeFixes } from '../utils/make-fixes'
import { useGroups } from '../utils/use-groups'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

export type Options<T extends string[]> = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
    customGroups: Record<T[number], string[] | string>
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    groups: (Group<T>[] | Group<T>)[]
    order: 'desc' | 'asc'
    ignoreCase: boolean
    alphabet: string
  }>,
]

type MESSAGE_ID =
  | 'unexpectedHeritageClausesGroupOrder'
  | 'unexpectedHeritageClausesOrder'

type Group<T extends string[]> = 'unknown' | T[number]

let defaultOptions: Required<Options<string[]>[0]> = {
  specialCharacters: 'keep',
  type: 'alphabetical',
  ignoreCase: true,
  customGroups: {},
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  meta: {
    schema: [
      {
        properties: {
          specialCharacters: specialCharactersJsonSchema,
          customGroups: customGroupsJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          alphabet: alphabetJsonSchema,
          type: buildTypeJsonSchema(),
          locales: localesJsonSchema,
          groups: groupsJsonSchema,
          order: orderJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    messages: {
      unexpectedHeritageClausesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedHeritageClausesOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-heritage-clauses',
      description: 'Enforce sorted heritage clauses.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  create: context => {
    let settings = getSettings(context.settings)

    let options = complete(context.options.at(0), settings, defaultOptions)
    validateCustomSortConfiguration(options)
    validateGroupsConfiguration(
      options.groups,
      ['unknown'],
      Object.keys(options.customGroups),
    )

    return {
      TSInterfaceDeclaration: declaration =>
        sortHeritageClauses(context, options, declaration.extends),
      ClassDeclaration: declaration =>
        sortHeritageClauses(context, options, declaration.implements),
    }
  },
  defaultOptions: [defaultOptions],
  name: 'sort-heritage-clauses',
})

let sortHeritageClauses = (
  context: Readonly<RuleContext<MESSAGE_ID, Options<string[]>>>,
  options: Required<Options<string[]>[0]>,
  heritageClauses:
    | TSESTree.TSInterfaceHeritage[]
    | TSESTree.TSClassImplements[]
    | undefined,
): void => {
  if (!isSortable(heritageClauses)) {
    return
  }
  let sourceCode = getSourceCode(context)
  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: context.id,
    sourceCode,
  })

  let nodes: SortingNode[] = heritageClauses!.map(heritageClause => {
    let name = getHeritageClauseExpressionName(heritageClause.expression)

    let { setCustomGroups, getGroup } = useGroups(options)
    setCustomGroups(options.customGroups, name)

    return {
      isEslintDisabled: isNodeEslintDisabled(
        heritageClause,
        eslintDisabledLines,
      ),
      size: rangeToDiff(heritageClause, sourceCode),
      node: heritageClause,
      group: getGroup(),
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

  let nodeIndexMap = createNodeIndexMap(sortedNodes)

  pairwise(nodes, (left, right) => {
    let leftIndex = nodeIndexMap.get(left)!
    let rightIndex = nodeIndexMap.get(right)!

    let indexOfRightExcludingEslintDisabled =
      sortedNodesExcludingEslintDisabled.indexOf(right)
    if (
      leftIndex < rightIndex &&
      leftIndex < indexOfRightExcludingEslintDisabled
    ) {
      return
    }
    let leftNumber = getGroupNumber(options.groups, left)
    let rightNumber = getGroupNumber(options.groups, right)
    context.report({
      fix: fixer =>
        makeFixes({
          sortedNodes: sortedNodesExcludingEslintDisabled,
          sourceCode,
          fixer,
          nodes,
        }),
      data: {
        right: toSingleLine(right.name),
        left: toSingleLine(left.name),
        rightGroup: right.group,
        leftGroup: left.group,
      },
      messageId:
        leftNumber === rightNumber
          ? 'unexpectedHeritageClausesOrder'
          : 'unexpectedHeritageClausesGroupOrder',
      node: right.node,
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
