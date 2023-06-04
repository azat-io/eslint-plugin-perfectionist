# Contributing

Hello! It's great that you are interested in contributing to ESLint Plugin Perfectionist. Before submitting your contribution, please take a moment to read the following guide:

## Installation

This project uses the [pnpm](https://pnpm.io) package manager. Therefore, to work with the project, you need to install it.

How to set up a project locally and run tests:

1. Clone repo:

```sh
git clone git@github.com:azat-io/eslint-plugin-perfectionist.git
```

2. Install dependencies:

```sh
pnpm install
```

3. Run tests:

```sh
pnpm test
```

## Pull Request Guidelines

Before create pull request fork this repo and create a new branch.

ESLint Plugin Perfectionist aims to be lightweight, so think before adding new dependencies to your project.

Commit messages must follow the [commit message convention](https://conventionalcommits.org/) so that changelogs can be automatically generated.

Make sure tests pass.

## Additional information

This plugin uses [@typescript/eslint-parser](https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/parser). When developing, I recommend using [AST explorer](https://astexplorer.net). It makes development much easier.
