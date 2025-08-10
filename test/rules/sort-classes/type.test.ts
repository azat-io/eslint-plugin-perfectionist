import { expectTypeOf, describe, it } from 'vitest'

import type {
  GetMethodOrSetMethodGroup,
  NonDeclarePropertyGroup,
  FunctionPropertyGroup,
  AccessorPropertyGroup,
  DeclarePropertyGroup,
  IndexSignatureGroup,
  ConstructorGroup,
  MethodGroup,
} from '../../../rules/sort-classes/types'

let ruleName = 'sort-classes'

describe(`${ruleName}: test types`, () => {
  it('test get method or set method group type', () => {
    expectTypeOf('get-method' as const).toExtend<GetMethodOrSetMethodGroup>()

    expectTypeOf('set-method' as const).toExtend<GetMethodOrSetMethodGroup>()

    expectTypeOf(
      'protected-get-method' as const,
    ).toExtend<GetMethodOrSetMethodGroup>()

    expectTypeOf(
      'public-decorated-get-method' as const,
    ).toExtend<GetMethodOrSetMethodGroup>()
  })

  it('test non declare property group type', () => {
    expectTypeOf(
      'public-static-override-property' as const,
    ).toExtend<NonDeclarePropertyGroup>()
  })

  it('test function property group type', () => {
    expectTypeOf(
      'private-static-function-property' as const,
    ).toExtend<FunctionPropertyGroup>()
  })

  it('test accessor property group type', () => {
    expectTypeOf(
      'static-accessor-property' as const,
    ).toExtend<AccessorPropertyGroup>()

    expectTypeOf(
      'protected-static-accessor-property' as const,
    ).toExtend<AccessorPropertyGroup>()

    expectTypeOf('accessor-property' as const).toExtend<AccessorPropertyGroup>()

    expectTypeOf(
      'protected-accessor-property' as const,
    ).toExtend<AccessorPropertyGroup>()
  })

  it('test declare property group type', () => {
    expectTypeOf(
      'declare-protected-static-readonly-property' as const,
    ).toExtend<DeclarePropertyGroup>()
  })

  it('test declare method group type', () => {
    expectTypeOf('public-method' as const).toExtend<MethodGroup>()

    expectTypeOf('protected-method' as const).toExtend<MethodGroup>()

    expectTypeOf('private-method' as const).toExtend<MethodGroup>()
  })

  it('test constructor group type', () => {
    expectTypeOf('constructor' as const).toExtend<ConstructorGroup>()
  })

  it('test index signature group type', () => {
    expectTypeOf('index-signature' as const).toExtend<IndexSignatureGroup>()
  })
})
