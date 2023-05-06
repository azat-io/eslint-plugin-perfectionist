import packageJson from '../../package.json'

export let { description, repository, version } = packageJson

export let github = `https://github.com/${repository}`

export let changelog = `${github}/blob/main/changelog.md`
