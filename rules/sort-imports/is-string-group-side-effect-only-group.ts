export function isStringGroupSideEffectOnlyGroup(groupName: string): boolean {
  return groupName === 'side-effect' || groupName === 'side-effect-style'
}
