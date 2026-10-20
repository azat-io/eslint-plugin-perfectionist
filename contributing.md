# Contributing

Hello! It's great that you are interested in contributing to ESLint Plugin
Perfectionist. Before submitting your contribution, please take a moment to read
the following guide:

## Installation

This project uses the [pnpm](https://pnpm.io) package manager. Therefore, to
work with the project, you need to install it.

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

ESLint Plugin Perfectionist aims to be lightweight, so think before adding new
dependencies to your project.

Commit messages must follow the
[commit message convention](https://conventionalcommits.org/) so that changelogs
can be automatically generated.

Make sure tests pass.

## Playground

The documentation site has a Playground at `/playground`. It runs ESLint, the
TypeScript parser and the plugin from the source code in a web worker in the
browser.

To work on it, build the docs once and start Netlify Dev. It applies the
production headers and content security policy from `dist/_headers`:

```sh
pnpm docs:build
pnpm docs:dev
```

Build again after changing `docs/public/_headers`, and after `pnpm build`, which
replaces `dist/` with the plugin. `pnpm docs:dev:astro` starts Astro alone,
without `_headers`, so it doesn't catch CSP problems.

ESLint and the parser expect Node.js. The Vite plugin in
`docs/plugins/playground-shims.ts` replaces the Node built-ins they import with
the browser shims from `docs/plugins/playground-shims/`, replaces the map of
ESLint's built-in rules with an empty one and gives ESLint the CommonJS build of
`esquery`. `docs/components/Playground/process-shim.ts` defines `process` in the
worker.

These shims depend on the internals of other packages. After updating `eslint`,
`@typescript-eslint/parser`, `typescript`, `vite` or `astro`, build the docs and
check that the Playground still sorts code:

```sh
pnpm docs:build
```

- `eslint/lib/config/default-config.js` still imports `../rules`, and
  `eslint/lib/linter/esquery.js` still requires `esquery`.
- `@typescript-eslint/parser` still supports the installed TypeScript version.
- The worker bundle has no `__vite-browser-external` imports.

## Additional information

This plugin uses
[@typescript-eslint/parser](https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/parser).
When developing, I recommend using [AST explorer](https://ast-explorer.dev). It
makes development much easier.
