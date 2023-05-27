import packageJson from '../../package.json'

export let { description, repository, homepage, keywords, version } =
  packageJson

export let title = 'Perfectionist'

export let github = `https://github.com/${repository}`

export let changelog = `${github}/blob/main/changelog.md`

export let image = `${homepage}/open-graph.png`
