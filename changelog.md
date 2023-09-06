# Changelog


## v2.0.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.5.1...v2.0.0)

### 🚀 Features

- ⚠️  Rename sort-map-elements rule to sort-maps ([d371934](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d371934))
- ⚠️  Remove read-tsconfig option in sort-imports rule ([cccced1](https://github.com/azat-io/eslint-plugin-perfectionist/commit/cccced1))
- ⚠️  Move callback, multiline and shorthand opts to groups in sort-jsx-props rule ([10d357c](https://github.com/azat-io/eslint-plugin-perfectionist/commit/10d357c))
- Add sort-svelte-attributes rule ([409295e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/409295e))
- Add sort-astro-attributes rule ([036b41d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/036b41d))
- ⚠️  Move from always-on-top option to groups in sort-objects rule ([0bbcb5a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/0bbcb5a))
- Allow disabling sort-objects rule for styled-components ([70f2afc](https://github.com/azat-io/eslint-plugin-perfectionist/commit/70f2afc))
- Add sort-vue-attributes rule ([e031275](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e031275))
- Add groups option to sort-interfaces rule ([903c029](https://github.com/azat-io/eslint-plugin-perfectionist/commit/903c029))
- Add groups options in sort-object-types rule ([a219f23](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a219f23))
- Replace is-core-module dependency with builtin module ([e190c45](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e190c45))
- Move to typescript-eslint v6 ([9c61238](https://github.com/azat-io/eslint-plugin-perfectionist/commit/9c61238))
- Add option in sort-union-types rule to put null and undefined types at end ([b313ba7](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b313ba7))
- Add index-signature group to sort-classes rule ([f857b80](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f857b80))
- Add get and set methods groups to sort-classes rule ([73132e8](https://github.com/azat-io/eslint-plugin-perfectionist/commit/73132e8))

### 🐞 Bug Fixes

- Disable sorting enums with implicit values ([f4a0e25](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f4a0e25))
- Ignore string quotes in sort-array-includes rule ([ec2e2f5](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ec2e2f5))
- Handle more complex expressions in sort-objects ([a7d966c](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a7d966c))
- Set alphabetical sorting as default in sort-svelte-attributes rule ([b224428](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b224428))
- Fix sorting single line union type with comment at end ([95560ab](https://github.com/azat-io/eslint-plugin-perfectionist/commit/95560ab))
- Fix sorting class overloads ([c4939b4](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c4939b4))
- Fix loading default options for configs ([ef99f44](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ef99f44))
- Disable sort-jsx-props for vue, astro and svelte files ([afb6ecc](https://github.com/azat-io/eslint-plugin-perfectionist/commit/afb6ecc))
- Improve determinition of static fields in sort-classes rule ([c00ac10](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c00ac10))
- Prevent order changes when adding new elements in line-length sorting ([c0e2e60](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c0e2e60))

#### ⚠️ Breaking Changes

- ⚠️  Rename sort-map-elements rule to sort-maps ([d371934](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d371934))
- ⚠️  Remove read-tsconfig option in sort-imports rule ([cccced1](https://github.com/azat-io/eslint-plugin-perfectionist/commit/cccced1))
- ⚠️  Move callback, multiline and shorthand opts to groups in sort-jsx-props rule ([10d357c](https://github.com/azat-io/eslint-plugin-perfectionist/commit/10d357c))
- ⚠️  Move from always-on-top option to groups in sort-objects rule ([0bbcb5a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/0bbcb5a))

### ❤️ Contributors

- Azat S. ([@azat-io](http://github.com/azat-io))
- Azat S ([@azat-io](http://github.com/azat-io))
- Martin Šťovíček

## v1.5.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.5.0...v1.5.1)

### 🐞 Bug Fixes

- Use alphabetical as the default sort type in schemas ([3b9366e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/3b9366e))
- Disable sorting side-effect imports ([01da88a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/01da88a))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))
- Hao Cheng <hcheng636@gmail.com>

## v1.5.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.4.0...v1.5.0)

### 🚀 Features

- Add external-type import group ([47b07cc](https://github.com/azat-io/eslint-plugin-perfectionist/commit/47b07cc))

### 🏎 Performance Improvements

- Move from foreach to for loops ([b648f74](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b648f74))
- Move from reduce to for loops in sort-imports ([16f6361](https://github.com/azat-io/eslint-plugin-perfectionist/commit/16f6361))

### 🐞 Bug Fixes

- Don't sort ts call signature declarations in interfactes ([5829a65](https://github.com/azat-io/eslint-plugin-perfectionist/commit/5829a65))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v1.4.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.3.0...v1.4.0)


### 🚀 Features

  - Allow separating object properties into logical parts ([933b621](https://github.com/azat-io/eslint-plugin-perfectionist/commit/933b621))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v1.3.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.2.1...v1.3.0)


### 🚀 Features

  - Support custom import groups ([0b837d4](https://github.com/azat-io/eslint-plugin-perfectionist/commit/0b837d4))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v1.2.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.2.0...v1.2.1)


### 🐞 Bug Fixes

  - Fix removing extra spaces between imports ([21bc7a8](https://github.com/azat-io/eslint-plugin-perfectionist/commit/21bc7a8))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v1.2.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.1.2...v1.2.0)


### 🚀 Features

  - Support stylus file imports ([dbef415](https://github.com/azat-io/eslint-plugin-perfectionist/commit/dbef415))
  - Add sort-exports rule ([a71eeb3](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a71eeb3))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v1.1.2

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.1.1...v1.1.2)


### 🐞 Bug Fixes

  - Fix sorting interfaces and types with comment on same line ([03e5508](https://github.com/azat-io/eslint-plugin-perfectionist/commit/03e5508))

### ❤️  Contributors

- Azat S <to@azat.io>

## v1.1.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.1.0...v1.1.1)


### 🐞 Bug Fixes

  - Fix adding extra lines if import ends with semi ([e435f91](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e435f91))
  - Don't sort keys if right value depends on left ([3e987ae](https://github.com/azat-io/eslint-plugin-perfectionist/commit/3e987ae))
  - Ignore semi at the end of object type member value ([623ac67](https://github.com/azat-io/eslint-plugin-perfectionist/commit/623ac67))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v1.1.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.0.1...v1.1.0)


### 🚀 Features

  - Add style group to sort the imports ([05bf0f7](https://github.com/azat-io/eslint-plugin-perfectionist/commit/05bf0f7))
  - Add side-effect group to sort the imports ([02f51fb](https://github.com/azat-io/eslint-plugin-perfectionist/commit/02f51fb))
  - Add builtin-type group to sort the imports ([ca34b5e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ca34b5e))

### 🐞 Bug Fixes

  - Allow to sort destructured objects ([65fe6c7](https://github.com/azat-io/eslint-plugin-perfectionist/commit/65fe6c7))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v1.0.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.0.0...v1.0.1)


### 🐞 Bug Fixes

  - Do not sort enums with implicit values ([166edac](https://github.com/azat-io/eslint-plugin-perfectionist/commit/166edac))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v1.0.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.11.6...v1.0.0)


### 🎉 Stable release

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.11.6

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.11.5...v0.11.6)


### 🐞 Bug Fixes

  - Improve sort-imports fix function ([e7a39f2](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e7a39f2))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.11.5

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.11.4...v0.11.5)


### 🐞 Bug Fixes

  - Fix sorting objects with inline comments ([37a537d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/37a537d))
  - Split imports if there are other nodes between ([b1a8837](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b1a8837))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.11.4

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.11.3...v0.11.4)


### 🐞 Bug Fixes

  - Use service comments when sorting imports ([b577ac7](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b577ac7))
  - Fix sorting nodes with comments on the same line ([16887ea](https://github.com/azat-io/eslint-plugin-perfectionist/commit/16887ea))
  - Do not fix objects if last member contains a comment and doesn't contain comma ([a9915f1](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a9915f1))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.11.3

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.11.2...v0.11.3)


### 🐞 Bug Fixes

  - Fix working sort-map-elements with empty map ([de061ff](https://github.com/azat-io/eslint-plugin-perfectionist/commit/de061ff))
  - Disallow to sort default import specifiers ([60044c6](https://github.com/azat-io/eslint-plugin-perfectionist/commit/60044c6))
  - Do not sort imports if there are tokens between them ([a4fabe9](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a4fabe9))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.11.2

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.11.1...v0.11.2)


### 🏎 Performance Improvements

  - Do not compute options if rule is not used ([4574caa](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4574caa))

### 🐞 Bug Fixes

  - Fix single line type objects sorting ([aaa446a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/aaa446a))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.11.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.11.0...v0.11.1)


### 🐞 Bug Fixes

  - Fix option names in sort-classes in configs ([bf578ed](https://github.com/azat-io/eslint-plugin-perfectionist/commit/bf578ed))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.11.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.10.0...v0.11.0)


### 🚀 Features

  - Add sort-object-types rule ([e3a06cf](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e3a06cf))
  - Add sort-classes rule ([b3a0cb8](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b3a0cb8))

### 🐞 Bug Fixes

  - Fix multiline option value in sort-jsx-props rule in configs ([556690d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/556690d))
  - Improve error output ([c1ad261](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c1ad261))
  - Fix internal patter in configs ([4be8a74](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4be8a74))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.10.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.9.0...v0.10.0)


### 🚀 Features

  - Add read-tsconfig option to sort-imports rule ([84cfc3d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/84cfc3d))
  - Allow to ignore interface by pattern ([9aaf08a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/9aaf08a))
  - Add ignore-case option to each rule ([e331b9a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e331b9a))
  - Rename spread-last option in sort-array-includes rule to kebab case ([fc342d2](https://github.com/azat-io/eslint-plugin-perfectionist/commit/fc342d2))
  - Add shorthand position option to sort-jsx-props rule ([416ffee](https://github.com/azat-io/eslint-plugin-perfectionist/commit/416ffee))
  - Add callback position option to sort-jsx-props rule ([8c6189f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/8c6189f))
  - Add multiline position option to sort-jsx-props rule ([58e094a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/58e094a))
  - Add always-on-top option to sort-jsx-props rule ([57af3a2](https://github.com/azat-io/eslint-plugin-perfectionist/commit/57af3a2))
  - Rename sort-object-keys rule to sort-objects ([3340a9f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/3340a9f))
  - Add always-on-top option to sort-objects rule ([464108f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/464108f))

### 🏎 Performance Improvements

  - Make reading tsconfig singleton ([c748445](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c748445))
  - Improve sort-imports rule performance ([2989539](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2989539))

### 🐞 Bug Fixes

  - Fix groups in sort-imports rule in configs ([f83c499](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f83c499))
  - Move parentheses when sorting ([d09395f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d09395f))
  - Update peer deps ([800c2a3](https://github.com/azat-io/eslint-plugin-perfectionist/commit/800c2a3))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.9.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.8.0...v0.9.0)


### 🚀 Features

  - Add sort-imports rule ([e3ed15e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e3ed15e))

### 🐞 Bug Fixes

  - Keep code comments when sorting ([547f825](https://github.com/azat-io/eslint-plugin-perfectionist/commit/547f825))
  - Update url to documentation of rules ([423b145](https://github.com/azat-io/eslint-plugin-perfectionist/commit/423b145))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.8.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.7.0...v0.8.0)


### 🚀 Features

  - Add sort-enums rule ([47167e0](https://github.com/azat-io/eslint-plugin-perfectionist/commit/47167e0))

### 🐞 Bug Fixes

  - Fix defenition for rule not found error ([050d20d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/050d20d))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.7.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.6.0...v0.7.0)


### 🐞 Bug Fixes

  - Fix plugin configs creation ([559a2ce](https://github.com/azat-io/eslint-plugin-perfectionist/commit/559a2ce))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.6.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.5.0...v0.6.0)


### 🚀 Features

  - Support flat eslint config ([969ae4e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/969ae4e))
  - Add sort-object-keys rule ([6dcb425](https://github.com/azat-io/eslint-plugin-perfectionist/commit/6dcb425))
  - Add recommended-alphabetical config ([66c99f0](https://github.com/azat-io/eslint-plugin-perfectionist/commit/66c99f0))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.5.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.4.0...v0.5.0)


### 🚀 Features

  - Add sort-map-elements rule ([049c004](https://github.com/azat-io/eslint-plugin-perfectionist/commit/049c004))
  - Add sort-array-includes rule ([bb7605b](https://github.com/azat-io/eslint-plugin-perfectionist/commit/bb7605b))

### 🐞 Bug Fixes

  - Fix rules descriptions ([1d18a26](https://github.com/azat-io/eslint-plugin-perfectionist/commit/1d18a26))
  - Add default rules properties ([48d2835](https://github.com/azat-io/eslint-plugin-perfectionist/commit/48d2835))
  - Add array constructor support to sort-array-includes rule ([d255c22](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d255c22))
  - Fix interface sorting ([86e3b56](https://github.com/azat-io/eslint-plugin-perfectionist/commit/86e3b56))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.4.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.3.0...v0.4.0)


### 🚀 Features

  - Add sort-named-exports rule ([b3f4b57](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b3f4b57))

### 🐞 Bug Fixes

  - Fix rule configs creation ([8a43758](https://github.com/azat-io/eslint-plugin-perfectionist/commit/8a43758))
  - Fix missed sort-union-types rule export ([3b02609](https://github.com/azat-io/eslint-plugin-perfectionist/commit/3b02609))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.3.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.2.0...v0.3.0)


### 🚀 Features

  - Add natural sorting ([c50d585](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c50d585))
  - Add sort-union-types rule ([e0cca5b](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e0cca5b))

### 🐞 Bug Fixes

  - Fix plugin exports ([a2f3f48](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a2f3f48))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.2.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.1.0...v0.2.0)


### 🚀 Features

  - Add sort-named-imports rule ([827ee5a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/827ee5a))
  - Add sort-jsx-props rule ([656c86b](https://github.com/azat-io/eslint-plugin-perfectionist/commit/656c86b))

### 🐞 Bug Fixes

  - Fix commonjs support ([942cca6](https://github.com/azat-io/eslint-plugin-perfectionist/commit/942cca6))

### ❤️  Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.1.0

### 🔥️️ Initial Release
