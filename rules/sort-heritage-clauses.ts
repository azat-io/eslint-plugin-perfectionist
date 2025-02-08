import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import type { CommonOptions, TypeOption } from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import {
  customGroupsJsonSchema,
  buildTypeJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
} from '../utils/common-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { GROUP_ORDER_ERROR, ORDER_ERROR } from '../utils/report-errors'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { useGroups } from '../utils/use-groups'
import { complete } from '../utils/complete'

export type Options<T extends string = string> = [
  Partial<
    {
      customGroups: Record<T, string[] | string>
      groups: (Group<T>[] | Group<T>)[]
      type: TypeOption
    } & CommonOptions
  >,
]

type MESSAGE_ID =
  | 'unexpectedHeritageClausesGroupOrder'
  | 'unexpectedHeritageClausesOrder'

type Group<T extends string> = 'unknown' | T

let defaultOptions: Required<Options[0]> = {
  specialCharacters: 'keep',
  type: 'alphabetical',
  ignoreCase: true,
  customGroups: {},
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MESSAGE_ID>({
  meta: {
    schema: [
      {
        properties: {
          ...commonJsonSchemas,
          customGroups: customGroupsJsonSchema,
          type: buildTypeJsonSchema(),
          groups: groupsJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    docs: {
      url: 'https://perfectionist.dev/rules/sort-heritage-clauses',
      description: 'Enforce sorted heritage clauses.',
      recommended: true,
    },
    messages: {
      unexpectedHeritageClausesGroupOrder: GROUP_ORDER_ERROR,
      unexpectedHeritageClausesOrder: ORDER_ERROR,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  create: context => {
    let settings = getSettings(context.settings)

    let options = complete(context.options.at(0), settings, defaultOptions)
    validateCustomSortConfiguration(options)
    validateGroupsConfiguration({
      allowedCustomGroups: Object.keys(options.customGroups),
      allowedPredefinedGroups: ['unknown'],
      options,
    })

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
  context: Readonly<RuleContext<MESSAGE_ID, Options>>,
  options: Required<Options[0]>,
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

  reportAllErrors<MESSAGE_ID>({
    availableMessageIds: {
      unexpectedGroupOrder: 'unexpectedHeritageClausesGroupOrder',
      unexpectedOrder: 'unexpectedHeritageClausesOrder',
    },
    sortNodesExcludingEslintDisabled,
    sourceCode,
    options,
    context,
    nodes,
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
