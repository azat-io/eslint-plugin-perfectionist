import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type {
  SortClassesSortingNode,
  Modifier,
  Selector,
  Options,
} from './sort-classes/types'

import {
  DEPENDENCY_ORDER_ERROR,
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { buildOverloadSignatureNewlinesBetweenValueGetter } from '../utils/overload-signature/build-overload-signature-newlines-between-value-getter'
import { populateSortingNodeGroupsWithOverloadSignature } from '../utils/overload-signature/populate-sorting-node-groups-with-overload-signature'
import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
} from '../utils/json-schemas/common-partition-json-schemas'
import {
  additionalCustomGroupMatchOptionsJsonSchema,
  allModifiers,
  allSelectors,
} from './sort-classes/types'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import {
  buildCommonJsonSchemas,
  buildRegexJsonSchema,
} from '../utils/json-schemas/common-json-schemas'
import { defaultComparatorByOptionsComputer } from '../utils/compare/default-comparator-by-options-computer'
import { computeIndexSignatureDetails } from './sort-classes/node-info/compute-index-signature-details'
import { buildOptionsByGroupIndexComputer } from '../utils/build-options-by-group-index-computer'
import { computeStaticBlockDetails } from './sort-classes/node-info/compute-static-block-details'
import { computeOverloadSignatureGroups } from './sort-classes/compute-overload-signature-groups'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { computePropertyDetails } from './sort-classes/node-info/compute-property-details'
import { computeAccessorDetails } from './sort-classes/node-info/compute-accessor-details'
import { computeMethodDetails } from './sort-classes/node-info/compute-method-details'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { UnreachableCaseError } from '../utils/unreachable-case-error'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getNodeDecorators } from '../utils/get-node-decorators'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getDecoratorName } from '../utils/get-decorator-name'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { getGroupIndex } from '../utils/get-group-index'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

/** Cache computed groups by modifiers and selectors for performance. */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

const ORDER_ERROR_ID = 'unexpectedClassesOrder'
const GROUP_ORDER_ERROR_ID = 'unexpectedClassesGroupOrder'
const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenClassMembers'
const MISSED_SPACING_ERROR_ID = 'missedSpacingBetweenClassMembers'
const DEPENDENCY_ORDER_ERROR_ID = 'unexpectedClassesDependencyOrder'

type MessageId =
  | typeof DEPENDENCY_ORDER_ERROR_ID
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

let defaultOptions: Required<Options[number]> = {
  groups: [
    'index-signature',
    ['static-property', 'static-accessor-property'],
    ['static-get-method', 'static-set-method'],
    ['protected-static-property', 'protected-static-accessor-property'],
    ['protected-static-get-method', 'protected-static-set-method'],
    ['private-static-property', 'private-static-accessor-property'],
    ['private-static-get-method', 'private-static-set-method'],
    'static-block',
    ['property', 'accessor-property'],
    ['get-method', 'set-method'],
    ['protected-property', 'protected-accessor-property'],
    ['protected-get-method', 'protected-set-method'],
    ['private-property', 'private-accessor-property'],
    ['private-get-method', 'private-set-method'],
    'constructor',
    ['static-method', 'static-function-property'],
    ['protected-static-method', 'protected-static-function-property'],
    ['private-static-method', 'private-static-function-property'],
    ['method', 'function-property'],
    ['protected-method', 'protected-function-property'],
    ['private-method', 'private-function-property'],
    'unknown',
  ],
  ignoreCallbackDependenciesPatterns: [],
  fallbackSort: { type: 'unsorted' },
  newlinesInside: 'newlinesBetween',
  partitionByComment: false,
  partitionByNewLine: false,
  newlinesBetween: 'ignore',
  specialCharacters: 'keep',
  type: 'alphabetical',
  ignoreCase: true,
  customGroups: [],
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
}

export default createEslintRule<Options, MessageId>({
  create: context => ({
    ClassBody: node => {
      if (!isSortable(node.body)) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)
      validateCustomSortConfiguration(options)
      validateGroupsConfiguration({
        modifiers: allModifiers,
        selectors: allSelectors,
        options,
      })
      validateNewlinesAndPartitionConfiguration(options)

      let { sourceCode, id } = context
      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: id,
        sourceCode,
      })
      let optionsByGroupIndexComputer =
        buildOptionsByGroupIndexComputer(options)
      let overloadSignatureNewlinesBetweenValueGetter =
        buildOverloadSignatureNewlinesBetweenValueGetter()

      let className = node.parent.id?.name

      let sortingNodeGroupsWithoutOverloadSignature: Omit<
        SortClassesSortingNode,
        'overloadSignatureImplementation'
      >[][] = node.body.reduce(
        (
          accumulator: Omit<
            SortClassesSortingNode,
            'overloadSignatureImplementation'
          >[][],
          member,
        ) => {
          let dependencies: string[] = []

          let isDecorated = false
          let decorators: string[] = []

          if ('decorators' in member) {
            decorators = getNodeDecorators(member).map(decorator =>
              getDecoratorName({ sourceCode, decorator }),
            )
            isDecorated = decorators.length > 0
          }

          let addSafetySemicolonWhenInline: boolean
          let dependencyNames: string[]
          let name: string
          let memberValue: undefined | string
          let modifiers: Modifier[]
          let selectors: Selector[]

          switch (member.type) {
            case AST_NODE_TYPES.TSAbstractPropertyDefinition:
            case AST_NODE_TYPES.PropertyDefinition:
              addSafetySemicolonWhenInline = true
              ;({
                dependencyNames,
                dependencies,
                memberValue,
                modifiers,
                selectors,
                name,
              } = computePropertyDetails({
                ignoreCallbackDependenciesPatterns:
                  options.ignoreCallbackDependenciesPatterns,
                property: member,
                isDecorated,
                sourceCode,
                className,
              }))
              break
            case AST_NODE_TYPES.TSAbstractMethodDefinition:
            case AST_NODE_TYPES.MethodDefinition:
              dependencyNames = []
              ;({ addSafetySemicolonWhenInline, selectors, modifiers, name } =
                computeMethodDetails({
                  hasParentDeclare: node.parent.declare,
                  method: member,
                  isDecorated,
                  sourceCode,
                }))
              break
            case AST_NODE_TYPES.TSAbstractAccessorProperty:
            case AST_NODE_TYPES.AccessorProperty:
              addSafetySemicolonWhenInline = true
              ;({ dependencyNames, selectors, modifiers, name } =
                computeAccessorDetails({
                  accessor: member,
                  isDecorated,
                  sourceCode,
                }))
              break
            case AST_NODE_TYPES.TSIndexSignature:
              addSafetySemicolonWhenInline = true
              dependencyNames = []
              ;({ modifiers, selectors, name } = computeIndexSignatureDetails({
                indexSignature: member,
                sourceCode,
              }))
              break
            case AST_NODE_TYPES.StaticBlock:
              addSafetySemicolonWhenInline = false
              dependencyNames = []
              name = 'static'
              ;({ dependencies, selectors, modifiers } =
                computeStaticBlockDetails({
                  ignoreCallbackDependenciesPatterns:
                    options.ignoreCallbackDependenciesPatterns,
                  staticBlock: member,
                  className,
                }))
              break
            /* v8 ignore next 2 -- @preserve Exhaustive guard. */
            default:
              throw new UnreachableCaseError(member)
          }

          let predefinedGroups = generatePredefinedGroups({
            cache: cachedGroupsByModifiersAndSelectors,
            selectors,
            modifiers,
          })
          let group = computeGroup({
            customGroupMatcher: customGroup =>
              doesCustomGroupMatch({
                elementValue: memberValue,
                elementName: name,
                customGroup,
                decorators,
                modifiers,
                selectors,
              }),
            predefinedGroups,
            options,
          })

          let sortingNode: Omit<
            SortClassesSortingNode,
            'overloadSignatureImplementation' | 'partitionId'
          > = {
            isEslintDisabled: isNodeEslintDisabled(member, eslintDisabledLines),
            size: rangeToDiff(member, sourceCode),
            addSafetySemicolonWhenInline,
            dependencyNames,
            node: member,
            dependencies,
            group,
            name,
          }

          let lastSortingNode = accumulator.at(-1)?.at(-1)

          if (
            shouldPartition({
              lastSortingNode,
              sortingNode,
              sourceCode,
              options,
            })
          ) {
            accumulator.push([])
          }

          accumulator.at(-1)!.push({
            ...sortingNode,
            partitionId: accumulator.length,
          })

          return accumulator
        },
        [[]],
      )

      let sortingNodeGroups = populateSortingNodeGroupsWithOverloadSignature({
        overloadSignatureGroups: computeOverloadSignatureGroups(node.body),
        sortingNodeGroups: sortingNodeGroupsWithoutOverloadSignature,
      })
      let sortingNodes = sortingNodeGroups.flat()

      reportAllErrors<MessageId, SortClassesSortingNode>({
        availableMessageIds: {
          missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
          unexpectedDependencyOrder: DEPENDENCY_ORDER_ERROR_ID,
          extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
          unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
          unexpectedOrder: ORDER_ERROR_ID,
        },
        newlinesBetweenValueGetter: overloadSignatureNewlinesBetweenValueGetter,
        sortNodesExcludingEslintDisabled,
        nodes: sortingNodes,
        options,
        context,
      })

      function sortNodesExcludingEslintDisabled(
        ignoreEslintDisabledNodes: boolean,
      ): SortClassesSortingNode[] {
        let nodesSortedByGroups = sortingNodeGroups.flatMap(sortingNodeGroup =>
          sortNodesByGroups({
            isNodeIgnored: sortingNode =>
              getGroupIndex(options.groups, sortingNode) ===
              options.groups.length,
            comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
            optionsByGroupIndexComputer,
            ignoreEslintDisabledNodes,
            nodes: sortingNodeGroup,
            groups: options.groups,
          }),
        )

        return sortNodesByDependencies(nodesSortedByGroups, {
          ignoreEslintDisabledNodes,
        })
      }
    },
  }),
  meta: {
    schema: [
      {
        properties: {
          ...buildCommonJsonSchemas(),
          ...buildCommonGroupsJsonSchemas({
            additionalCustomGroupMatchProperties:
              additionalCustomGroupMatchOptionsJsonSchema,
          }),
          ignoreCallbackDependenciesPatterns: buildRegexJsonSchema(),
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    messages: {
      [DEPENDENCY_ORDER_ERROR_ID]: DEPENDENCY_ORDER_ERROR,
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-classes',
      description: 'Enforce sorted classes.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-classes',
})
