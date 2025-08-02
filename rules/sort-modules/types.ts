import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'
import type { JoinWithDash } from '../../types/join-with-dash'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
  regexJsonSchema,
} from '../../utils/common-json-schemas'

export type SingleCustomGroup = (
  | (DecoratorNamePatternFilterCustomGroup &
      BaseSingleCustomGroup<ClassSelector>)
  | BaseSingleCustomGroup<InterfaceSelector>
  | BaseSingleCustomGroup<FunctionSelector>
  | BaseSingleCustomGroup<EnumSelector>
  | BaseSingleCustomGroup<TypeSelector>
) &
  ElementNamePatternFilterCustomGroup

export type SortModulesOptions = [
  Partial<
    {
      customGroups: CustomGroupsOption<SingleCustomGroup>
      partitionByComment: PartitionByCommentOption
      newlinesBetween: NewlinesBetweenOption
      groups: GroupsOptions<Group>
      partitionByNewLine: boolean
    } & CommonOptions
  >,
]

export type Selector =
  // | NamespaceSelector
  | InterfaceSelector
  | FunctionSelector
  // | ModuleSelector
  | ClassSelector
  | TypeSelector
  | EnumSelector

export type Modifier =
  | DecoratedModifier
  | DeclareModifier
  | DefaultModifier
  | ExportModifier
  | AsyncModifier

/** Only used in code as well. */
interface AllowedModifiersPerSelector {
  function: DeclareModifier | DefaultModifier | ExportModifier | AsyncModifier
  interface: DeclareModifier | DefaultModifier | ExportModifier
  class: DeclareModifier | DefaultModifier | ExportModifier
  namespace: DeclareModifier | ExportModifier
  module: DeclareModifier | ExportModifier
  enum: DeclareModifier | ExportModifier
  type: DeclareModifier | ExportModifier
}

/** Only used in code, so I don't know if it's worth maintaining this. */
type Group =
  | NonDefaultInterfaceGroup
  | NonDefaultFunctionGroup
  | DefaultInterfaceGroup
  | DefaultFunctionGroup
  | NonDefaultClassGroup
  | DefaultClassGroup
  | EnumGroup
  | TypeGroup
  | 'unknown'
  | string

interface BaseSingleCustomGroup<T extends Selector> {
  modifiers?: AllowedModifiersPerSelector[T][]
  selector?: T
}

type NonDefaultClassGroup = JoinWithDash<
  [ExportModifier, DeclareModifier, DecoratedModifier, ClassSelector]
>

type DefaultFunctionGroup = JoinWithDash<
  [ExportModifier, DefaultModifier, AsyncModifier, FunctionSelector]
>

type DefaultClassGroup = JoinWithDash<
  [ExportModifier, DefaultModifier, DecoratedModifier, ClassSelector]
>

type NonDefaultInterfaceGroup = JoinWithDash<
  [ExportModifier, DeclareModifier, InterfaceSelector]
>

type NonDefaultFunctionGroup = JoinWithDash<
  [ExportModifier, DeclareModifier, FunctionSelector]
>

type DefaultInterfaceGroup = JoinWithDash<
  [ExportModifier, DefaultModifier, InterfaceSelector]
>

interface DecoratorNamePatternFilterCustomGroup {
  decoratorNamePattern?: RegexOption
}

interface ElementNamePatternFilterCustomGroup {
  elementNamePattern?: RegexOption
}

type TypeGroup = JoinWithDash<[ExportModifier, DeclareModifier, TypeSelector]>

type EnumGroup = JoinWithDash<[ExportModifier, DeclareModifier, EnumSelector]>

type DecoratedModifier = 'decorated'

type InterfaceSelector = 'interface'

type FunctionSelector = 'function'

type DeclareModifier = 'declare'

type DefaultModifier = 'default'

type ExportModifier = 'export'

type AsyncModifier = 'async'

type ClassSelector = 'class'

type TypeSelector = 'type'

type EnumSelector = 'enum'

export let allSelectors: Selector[] = [
  'enum',
  'function',
  'interface',
  // 'module',
  // 'namespace',
  'type',
  'class',
]

export let allModifiers: Modifier[] = [
  'async',
  'declare',
  'decorated',
  'default',
  'export',
]

/**
 * Ideally, we should generate as many schemas as there are selectors, and
 * ensure that users do not enter invalid modifiers for a given selector.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  decoratorNamePattern: regexJsonSchema,
  elementNamePattern: regexJsonSchema,
}
