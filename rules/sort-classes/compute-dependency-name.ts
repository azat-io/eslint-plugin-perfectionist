export function computeDependencyName({
  nodeNameWithoutStartingHash,
  hasPrivateHash,
  isStatic,
}: {
  nodeNameWithoutStartingHash: string
  hasPrivateHash: boolean
  isStatic: boolean
}): string {
  return `${isStatic ? 'static ' : ''}${hasPrivateHash ? '#' : ''}${nodeNameWithoutStartingHash}`
}
