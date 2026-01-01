export function computeDependencyName({
  nodeNameWithoutStartingHash,
  isPrivateHash,
  isStatic,
}: {
  nodeNameWithoutStartingHash: string
  isPrivateHash: boolean
  isStatic: boolean
}): string {
  return `${isStatic ? 'static ' : ''}${isPrivateHash ? '#' : ''}${nodeNameWithoutStartingHash}`
}
