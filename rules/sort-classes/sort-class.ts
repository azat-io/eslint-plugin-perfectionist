import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type {
  SortClassesSortingNode,
  NodeNameDetails,
  MessageId,
  Modifier,
  Selector,
  Options,
} from './types'
import type { Settings } from '../../utils/get-settings'

import {
  DEPENDENCY_ORDER_ERROR_ID,
  MISSED_SPACING_ERROR_ID,
  EXTRA_SPACING_ERROR_ID,
  GROUP_ORDER_ERROR_ID,
  ORDER_ERROR_ID,
  allModifiers,
  allSelectors,
} from './types'
import { buildOverloadSignatureNewlinesBetweenValueGetter } from '../../utils/overload-signature/build-overload-signature-newlines-between-value-getter'
import { populateSortingNodeGroupsWithOverloadSignature } from '../../utils/overload-signature/populate-sorting-node-groups-with-overload-signature'
import { populateSortingNodeGroupsWithDependencies } from '../../utils/populate-sorting-node-groups-with-dependencies'
import { validateNewlinesAndPartitionConfiguration } from '../../utils/validate-newlines-and-partition-configuration'
import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import { buildOptionsByGroupIndexComputer } from '../../utils/build-options-by-group-index-computer'
import { validateCustomSortConfiguration } from '../../utils/validate-custom-sort-configuration'
import { computeIndexSignatureDetails } from './node-info/compute-index-signature-details'
import { computeDependenciesBySortingNode } from './compute-dependencies-by-sorting-node'
import { validateGroupsConfiguration } from '../../utils/validate-groups-configuration'
import { computeStaticBlockDetails } from './node-info/compute-static-block-details'
import { computeOverloadSignatureGroups } from './compute-overload-signature-groups'
import { generatePredefinedGroups } from '../../utils/generate-predefined-groups'
import { sortNodesByDependencies } from '../../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../../utils/get-eslint-disabled-lines'
import { computePropertyDetails } from './node-info/compute-property-details'
import { computeAccessorDetails } from './node-info/compute-accessor-details'
import { doesCustomGroupMatch } from '../../utils/does-custom-group-match'
import { isNodeEslintDisabled } from '../../utils/is-node-eslint-disabled'
import { computeMethodDetails } from './node-info/compute-method-details'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { sortNodesByGroups } from '../../utils/sort-nodes-by-groups'
import { getNodeDecorators } from '../../utils/get-node-decorators'
import { getDecoratorName } from '../../utils/get-decorator-name'
import { reportAllErrors } from '../../utils/report-all-errors'
import { isKnownClassElement } from './is-known-class-element'
import { shouldPartition } from '../../utils/should-partition'
import { getGroupIndex } from '../../utils/get-group-index'
import { computeGroup } from '../../utils/compute-group'
import { rangeToDiff } from '../../utils/range-to-diff'
import { isSortable } from '../../utils/is-sortable'
import { complete } from '../../utils/complete'

/**
 * Cache computed groups by modifiers and selectors for performance.
 */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

export let defaultOptions: Required<Options[number]> = {
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
  useExperimentalDependencyDetection: true,
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

export function sortClass({
  settings,
  context,
  node,
}: {
  context: Readonly<TSESLint.RuleContext<MessageId, Options>>
  node: TSESTree.ClassBody
  settings: Settings
}): void {
  if (!isSortable(node.body)) {
    return
  }

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
  let optionsByGroupIndexComputer = buildOptionsByGroupIndexComputer(options)
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
      if (!isKnownClassElement(member)) {
        return accumulator
      }

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
      let nameDetails: NodeNameDetails | null
      let memberValue: undefined | string
      let isStatic: boolean
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
            nameDetails,
            modifiers,
            selectors,
            isStatic,
          } = computePropertyDetails({
            ignoreCallbackDependenciesPatterns:
              options.ignoreCallbackDependenciesPatterns,
            useExperimentalDependencyDetection:
              options.useExperimentalDependencyDetection,
            property: member,
            isDecorated,
            sourceCode,
            className,
          }))
          ;({ name } = nameDetails)
          break
        case AST_NODE_TYPES.TSAbstractMethodDefinition:
        case AST_NODE_TYPES.MethodDefinition:
          dependencyNames = []
          ;({
            addSafetySemicolonWhenInline,
            nameDetails,
            selectors,
            modifiers,
            isStatic,
          } = computeMethodDetails({
            hasParentDeclare: node.parent.declare,
            method: member,
            isDecorated,
            sourceCode,
          }))
          ;({ name } = nameDetails)
          break
        case AST_NODE_TYPES.TSAbstractAccessorProperty:
        case AST_NODE_TYPES.AccessorProperty:
          addSafetySemicolonWhenInline = true
          ;({ dependencyNames, nameDetails, selectors, modifiers, isStatic } =
            computeAccessorDetails({
              accessor: member,
              isDecorated,
              sourceCode,
            }))
          ;({ name } = nameDetails)
          break
        case AST_NODE_TYPES.TSIndexSignature:
          addSafetySemicolonWhenInline = true
          dependencyNames = []
          nameDetails = null
          isStatic = false
          ;({ modifiers, selectors, name } = computeIndexSignatureDetails({
            indexSignature: member,
            sourceCode,
          }))
          break
        case AST_NODE_TYPES.StaticBlock:
          addSafetySemicolonWhenInline = false
          dependencyNames = []
          name = 'static'
          nameDetails = null
          isStatic = true
          ;({ dependencies, selectors, modifiers } = computeStaticBlockDetails({
            useExperimentalDependencyDetection:
              options.useExperimentalDependencyDetection,
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
        nameDetails,
        isStatic,
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

  if (options.useExperimentalDependencyDetection) {
    let dependenciesBySortingNode = computeDependenciesBySortingNode({
      ignoreCallbackDependenciesPatterns:
        options.ignoreCallbackDependenciesPatterns,
      sortingNodes: sortingNodeGroups.flat(),
      classBody: node,
      sourceCode,
    })
    sortingNodeGroups = populateSortingNodeGroupsWithDependencies({
      dependenciesBySortingNode,
      sortingNodeGroups,
    })
  }

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
          getGroupIndex(options.groups, sortingNode) === options.groups.length,
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
}
