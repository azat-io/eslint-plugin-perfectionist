import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import {
  specialCharactersJsonSchema,
  ignoreCaseJsonSchema,
  matcherJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

type MESSAGE_ID =
  | 'unexpectedHeritageClausesGroupOrder'
  | 'unexpectedHeritageClausesOrder'

type Group<T extends string[]> = 'unknown' | T[number]

export type Options<T extends string[]> = [
  Partial<{
    customGroups: { [key in T[number]]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    specialCharacters: 'remove' | 'trim' | 'keep'
    groups: (Group<T>[] | Group<T>)[]
    matcher: 'minimatch' | 'regex'
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

const defaultOptions: Required<Options<string[]>[0]> = {
  type: 'alphabetical',
  matcher: 'minimatch',
  ignoreCase: true,
  specialCharacters: 'keep',
  customGroups: {},
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: 'sort-heritage-clauses',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted heritage clauses.',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: typeJsonSchema,
          order: orderJsonSchema,
          matcher: matcherJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          groups: {
            description: 'Specifies the order of the groups.',
            type: 'array',
            items: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              ],
            },
          },
          customGroups: {
            description: 'Specifies custom groups.',
            type: 'object',
            additionalProperties: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              ],
            },
          },
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

    let options = complete(context.options.at(0), settings, {
      ...defaultOptions,
    })

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

const sortHeritageClauses = (
  context: Readonly<RuleContext<MESSAGE_ID, Options<string[]>>>,
  options: Required<Options<string[]>[0]>,
  heritageClauses:
    | TSESTree.TSInterfaceHeritage[]
    | TSESTree.TSClassImplements[],
) => {
  if (heritageClauses.length < 2) {
    return
  }
  let sourceCode = getSourceCode(context)

  let formattedNodes: SortingNode[] = heritageClauses.map(heritageClause => {
    let name = getHeritageClauseExpressionName(heritageClause.expression)

    let { getGroup, setCustomGroups } = useGroups(options)
    setCustomGroups(options.customGroups, name)

    return {
      size: rangeToDiff(heritageClause.range),
      node: heritageClause,
      group: getGroup(),
      name,
    }
  })

  let sortedNodes = sortNodesByGroups(formattedNodes, options)
  pairwise(formattedNodes, (left, right) => {
    let indexOfLeft = sortedNodes.indexOf(left)
    let indexOfRight = sortedNodes.indexOf(right)
    if (indexOfLeft <= indexOfRight) {
      return
    }
    let leftNum = getGroupNumber(options.groups, left)
    let rightNum = getGroupNumber(options.groups, right)
    context.report({
      messageId:
        leftNum !== rightNum
          ? 'unexpectedHeritageClausesGroupOrder'
          : 'unexpectedHeritageClausesOrder',
      data: {
        left: toSingleLine(left.name),
        leftGroup: left.group,
        right: toSingleLine(right.name),
        rightGroup: right.group,
      },
      node: right.node,
      fix: fixer => makeFixes(fixer, formattedNodes, sortedNodes, sourceCode),
    })
  })
}

const getHeritageClauseExpressionName = (
  expression: TSESTree.PrivateIdentifier | TSESTree.Expression,
) => {
  if (expression.type === 'Identifier') {
    return expression.name
  }
  if ('property' in expression) {
    return getHeritageClauseExpressionName(expression.property)
    /* c8 ignore start - should never throw */
  }
  throw new Error(
    'Unexpected heritage clause expression. Please report this issue ' +
      'here: https://github.com/azat-io/eslint-plugin-perfectionist/issues',
  )
  /* c8 ignore end */
}
