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
    expectTypeOf(
      'get-method' as const,
    ).toMatchTypeOf<GetMethodOrSetMethodGroup>()

    expectTypeOf(
      'set-method' as const,
    ).toMatchTypeOf<GetMethodOrSetMethodGroup>()

    expectTypeOf(
      'protected-get-method' as const,
    ).toMatchTypeOf<GetMethodOrSetMethodGroup>()

    expectTypeOf(
      'public-decorated-get-method' as const,
    ).toMatchTypeOf<GetMethodOrSetMethodGroup>()
  })

  it('test non declare property group type', () => {
    expectTypeOf(
      'public-static-override-property' as const,
    ).toMatchTypeOf<NonDeclarePropertyGroup>()
  })

  it('test function property group type', () => {
    expectTypeOf(
      'private-static-function-property' as const,
    ).toMatchTypeOf<FunctionPropertyGroup>()
  })

  it('test accessor property group type', () => {
    expectTypeOf(
      'static-accessor-property' as const,
    ).toMatchTypeOf<AccessorPropertyGroup>()

    expectTypeOf(
      'protected-static-accessor-property' as const,
    ).toMatchTypeOf<AccessorPropertyGroup>()

    expectTypeOf(
      'accessor-property' as const,
    ).toMatchTypeOf<AccessorPropertyGroup>()

    expectTypeOf(
      'protected-accessor-property' as const,
    ).toMatchTypeOf<AccessorPropertyGroup>()
  })

  it('test declare property group type', () => {
    expectTypeOf(
      'declare-protected-static-readonly-property' as const,
    ).toMatchTypeOf<DeclarePropertyGroup>()
  })

  it('test declare method group type', () => {
    expectTypeOf('public-method' as const).toMatchTypeOf<MethodGroup>()

    expectTypeOf('protected-method' as const).toMatchTypeOf<MethodGroup>()

    expectTypeOf('private-method' as const).toMatchTypeOf<MethodGroup>()
  })

  it('test constructor group type', () => {
    expectTypeOf('constructor' as const).toMatchTypeOf<ConstructorGroup>()
  })

  it('test index signature group type', () => {
    expectTypeOf(
      'index-signature' as const,
    ).toMatchTypeOf<IndexSignatureGroup>()
  })
})
