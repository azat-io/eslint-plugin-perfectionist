import packageJson from '../../package.json'

export let { description, repository, homepage, keywords, version } =
  packageJson

export let title = 'Perfectionist'

export let changelog = `${repository}/blob/main/changelog.md`

export let contributing = `${repository}/blob/main/contributing.md`

export let image = `${homepage}/open-graph.png`
