# Changelog

## v5.8.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v5.7.0...v5.8.0)

### 🚀 Features

- **sort-array:** Add new rule
  ([76f423c5](https://github.com/azat-io/eslint-plugin-perfectionist/commit/76f423c5))

### 🐞 Bug Fixes

- Add oxlint rule tester and fix issue in sort-classes
  ([4949b1d7](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4949b1d7))
- **sort-modules:** Add missing partition cases
  ([7244ff1e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/7244ff1e))

### ❤️ Contributors

- Hugo ([@hugop95](https://github.com/hugop95))

## v5.7.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v5.6.0...v5.7.0)

### 🚀 Features

- **sort-array-includes:** Support conditional config by ast selector
  ([bcd12a37](https://github.com/azat-io/eslint-plugin-perfectionist/commit/bcd12a37))
- **sort-objects:** Support conditional config by ast selector
  ([3a629862](https://github.com/azat-io/eslint-plugin-perfectionist/commit/3a629862))
- **sort-enums:** Support conditional config by ast selector
  ([ad6f971d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ad6f971d))
- **sort-maps:** Support conditional config by ast selector
  ([5757889c](https://github.com/azat-io/eslint-plugin-perfectionist/commit/5757889c))
- **sort-classes:** Support conditional config by ast selector and name pattern
  ([c2965cc6](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c2965cc6))
- **sort-objects:** Support computed-key partitioning
  ([1d6005e4](https://github.com/azat-io/eslint-plugin-perfectionist/commit/1d6005e4))
- **sort-jsx-props:** Support conditional config by ast selector
  ([a90a0794](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a90a0794))
- **sort-named-exports:** Support conditional config by ast selector
  ([d573f93f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d573f93f))
- **sort-heritage-clauses:** Support conditional config by ast selector and name
  pattern
  ([745c79cf](https://github.com/azat-io/eslint-plugin-perfectionist/commit/745c79cf))
- **sort-variable-declarations:** Support conditional config by ast selector and
  name pattern
  ([498bef97](https://github.com/azat-io/eslint-plugin-perfectionist/commit/498bef97))
- **sort-named-imports:** Support conditional config by ast selector and name
  pattern
  ([2c28d110](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2c28d110))
- **sort-object-types:** Support conditional config by ast selector
  ([1d3dd304](https://github.com/azat-io/eslint-plugin-perfectionist/commit/1d3dd304))
- **sort-import-attributes:** Support conditional config by ast selector and
  name pattern
  ([8f6f21d4](https://github.com/azat-io/eslint-plugin-perfectionist/commit/8f6f21d4))
- **sort-union-types:** Support conditional config by ast selector and name
  pattern
  ([1953b4f7](https://github.com/azat-io/eslint-plugin-perfectionist/commit/1953b4f7))

### 🐞 Bug Fixes

- **sort-array-includes:** Fix invalid arrays being sorted
  ([fc671f0b](https://github.com/azat-io/eslint-plugin-perfectionist/commit/fc671f0b))
- Make selector match priority deterministic across overlapping options
  ([76633eea](https://github.com/azat-io/eslint-plugin-perfectionist/commit/76633eea))
- Apply the first matching configuration in option order
  ([936bf505](https://github.com/azat-io/eslint-plugin-perfectionist/commit/936bf505))

### ❤️ Contributors

- Hugo ([@hugop95](https://github.com/hugop95))
- Azat S. ([@azat-io](https://github.com/azat-io))

## v5.6.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v5.5.0...v5.6.0)

### 🚀 Features

- Support eslint v10
  ([5b0d27cd](https://github.com/azat-io/eslint-plugin-perfectionist/commit/5b0d27cd))

### 🐞 Bug Fixes

- **sort-classes:** Avoid crashes on unknown class elements
  ([912f8a8b](https://github.com/azat-io/eslint-plugin-perfectionist/commit/912f8a8b))
- **sort-objects:** Find declaration comments before exported variables
  ([9f90465e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/9f90465e))
- Normalize parenthesized union and intersection member names
  ([d82f1e9f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d82f1e9f))

### ❤️ Contributors

- Azat S. ([@azat-io](https://github.com/azat-io))

## v5.5.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v5.4.0...v5.5.0)

### 🚀 Features

- **sort-classes:** Improve dependency detection algorithm
  ([8bcbc88a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/8bcbc88a))

### 🐞 Bug Fixes

- Prevent spread operator reordering in sort-sets and sort-array-includes
  ([06b0f73e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/06b0f73e))

### ❤️ Contributors

- Azat S. ([@azat-io](https://github.com/azat-io))
- Hugo ([@hugop95](https://github.com/hugop95))

## v5.4.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v5.3.1...v5.4.0)

### 🚀 Features

- **sort-objects:** Allow sorting by name and value
  ([2622a734](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2622a734))
- Improve dependency detection algorithm
  ([a80d8105](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a80d8105))

### 🏎 Performance Improvements

- Cache group options and improve subgroup-order coverage
  ([858076c7](https://github.com/azat-io/eslint-plugin-perfectionist/commit/858076c7))
- Avoid accumulating spreads in hot paths
  ([2c964ae0](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2c964ae0))

### 🐞 Bug Fixes

- **sort-modules:** Enable fallback sorting for usage mode
  ([a2b898e4](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a2b898e4))
- **sort-modules:** Fix error loop due to overload signatures with sort-usages
  ([2dcdb687](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2dcdb687))
- **sort-modules:** Add support for overload signatures
  ([d760ae7a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d760ae7a))
- **sort-modules:** Avoid deprecated enum members access
  ([a0a7d478](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a0a7d478))

### ❤️ Contributors

- Azat S. ([@azat-io](https://github.com/azat-io))
- Hugo ([@hugop95](https://github.com/hugop95))

## v5.3.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v5.3.0...v5.3.1)

### 🐞 Bug Fixes

- Align plugin configs typing with eslint
  ([7c44de3](https://github.com/azat-io/eslint-plugin-perfectionist/commit/7c44de3))

### ❤️ Contributors

- Azat S. ([@azat-io](https://github.com/azat-io))

## v5.3.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v5.2.0...v5.3.0)

### 🚀 Features

- Fallback sort subgroup order
  ([3c8fecf](https://github.com/azat-io/eslint-plugin-perfectionist/commit/3c8fecf))
- **sort-modules:** Allow exported then decorated classes to be sorted
  ([53b00c8](https://github.com/azat-io/eslint-plugin-perfectionist/commit/53b00c8))

### 🐞 Bug Fixes

- Use runtime-safe node type checks
  ([a0ec110](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a0ec110))

### ❤️ Contributors

- Hugo ([@hugop95](https://github.com/hugop95))
- Sam ([@Lievesley](https://github.com/Lievesley))

## v5.2.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v5.1.0...v5.2.0)

### 🚀 Features

- **sort-modules:** Sort by order of use
  ([fc297a2](https://github.com/azat-io/eslint-plugin-perfectionist/commit/fc297a2))
- Allow fallback sort override in groups with overrides
  ([64a9fee](https://github.com/azat-io/eslint-plugin-perfectionist/commit/64a9fee))
- **sort-imports:** Allow sorting by specifiers
  ([05c66aa](https://github.com/azat-io/eslint-plugin-perfectionist/commit/05c66aa))

### 🐞 Bug Fixes

- Add explicit type annotation for plugin configs
  ([780a25a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/780a25a))

### ❤️ Contributors

- Hugo ([@hugop95](https://github.com/hugop95))
- Azat S. ([@azat-io](https://github.com/azat-io))

## v5.1.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v5.0.0...v5.1.0)

### 🚀 Features

- Add new lines between to settings
  ([ae36860](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ae36860))
- Add new lines inside at rule options and settings level
  ([1430b19](https://github.com/azat-io/eslint-plugin-perfectionist/commit/1430b19))

### 🐞 Bug Fixes

- Add js extensions to relative imports in decl files
  ([2cfeed9](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2cfeed9))
- Handle missing export kind in sort exports
  ([179d432](https://github.com/azat-io/eslint-plugin-perfectionist/commit/179d432))
- Allow overriding settings with default values
  ([08d69ca](https://github.com/azat-io/eslint-plugin-perfectionist/commit/08d69ca))
- Improve plugin type compatibility
  ([af1ce61](https://github.com/azat-io/eslint-plugin-perfectionist/commit/af1ce61))

### ❤️ Contributors

- Azat S. ([@azat-io](https://github.com/azat-io))
- Hugo ([@hugop95](https://github.com/hugop95))

## v5.0.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.15.1...v5.0.0)

### 🚀 Features

- ⚠️ Drop nodejs v18 support
  ([6c4a74a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/6c4a74a))
- ⚠️ Move to esm only
  ([442f409](https://github.com/azat-io/eslint-plugin-perfectionist/commit/442f409))
- **sort-decorators:** Add array-based custom groups api
  ([358b1f4](https://github.com/azat-io/eslint-plugin-perfectionist/commit/358b1f4))
- ⚠️ Drop group kind support
  ([44af851](https://github.com/azat-io/eslint-plugin-perfectionist/commit/44af851))
- **sort-heritage-clauses:** Add array-based custom groups api
  ([e6ef242](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e6ef242))
- **sort-imports:** ⚠️ Drop deprecated ts config root dir support
  ([5452245](https://github.com/azat-io/eslint-plugin-perfectionist/commit/5452245))
- ⚠️ Drop deprecated selectors support for multiple rules
  ([4c0161a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4c0161a))
- ⚠️ Drop deprecated object-based custom groups support
  ([5a6d5fa](https://github.com/azat-io/eslint-plugin-perfectionist/commit/5a6d5fa))
- Support annotation-based config
  ([96cda80](https://github.com/azat-io/eslint-plugin-perfectionist/commit/96cda80))
- **sort-object-types:** ⚠️ Drop deprecated ignore pattern option
  ([d28a154](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d28a154))
- **sort-jsx-props:** ⚠️ Drop deprecated ignore pattern option
  ([f1a2498](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f1a2498))
- Add sort-import-attributes rule
  ([d147c56](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d147c56))
- Add sort-export-attributes rule
  ([ac7e597](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ac7e597))
- **sort-object:** ⚠️ Drop deprecated destructure only option
  ([2f9d620](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2f9d620))
- **sort-objects:** Add pattern matching for variable declarations
  ([ea22aa1](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ea22aa1))
- ⚠️ Drop deprecated newlines between always and never
  ([4a9a693](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4a9a693))
- **sort-objects:** ⚠️ Migrate object type options to conditional configuration
  pattern
  ([724d044](https://github.com/azat-io/eslint-plugin-perfectionist/commit/724d044))
- **sort-enums:** ⚠️ Replace force numeric sort and update default sort by value
  option
  ([b707549](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b707549))
- **sort-objects:** Add numeric keys detection option
  ([2a6653d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2a6653d))
- **sort-object-types:** Add numeric keys detection option
  ([88f1c19](https://github.com/azat-io/eslint-plugin-perfectionist/commit/88f1c19))
- **sort-imports:** Add multiline and singleline modifiers
  ([2c954d4](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2c954d4))
- ⚠️ Improve comment above integration in groups
  ([2011d6c](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2011d6c))
- Allow type overrides in groups option
  ([7985717](https://github.com/azat-io/eslint-plugin-perfectionist/commit/7985717))
- **sort-imports:** ⚠️ Drop deprecated selectors
  ([f089488](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f089488))
- Allow order overrides in groups option
  ([2c64f20](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2c64f20))
- Allow new lines inside overrides in groups option
  ([f9300b6](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f9300b6))
- **sort-imports:** Allow type-import-first fallback sort
  ([a73c690](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a73c690))
- **sort-exports:** Add wildcard, named and line-related modifiers
  ([2211eb6](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2211eb6))
- **sort-objects:** ⚠️ Drop deprecated ignore pattern
  ([02a09d3](https://github.com/azat-io/eslint-plugin-perfectionist/commit/02a09d3))
- **sort-objects:** Add scope option for pattern matching
  ([a2e013d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a2e013d))
- **sort-object-types:** Add scoped matching for declaration patterns
  ([7fde0b5](https://github.com/azat-io/eslint-plugin-perfectionist/commit/7fde0b5))
- **sort-objects:** Add scoped matching for declaration patterns
  ([e80691a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e80691a))
- **sort-object-types:** Add scoped matching for declaration comments
  ([1addc94](https://github.com/azat-io/eslint-plugin-perfectionist/commit/1addc94))

### 🐞 Bug Fixes

- Fix plugin usage with legacy configurations
  ([a5e5b66](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a5e5b66))
- Keep settings priority when meta default options provided
  ([5d5793d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/5d5793d))
- Require sorting type in fallback sort schema
  ([404a9b0](https://github.com/azat-io/eslint-plugin-perfectionist/commit/404a9b0))
- **sort-objects:** Handle destructured dependencies
  ([572d54a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/572d54a))
- **sort-object-types:** Improve detection of complex object type declarations
  ([7d9f3bd](https://github.com/azat-io/eslint-plugin-perfectionist/commit/7d9f3bd))
- Honor declaration comments for nested types
  ([c54c522](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c54c522))
- **sort-object-types:** Match declaration names from variable declarations
  ([99d50bc](https://github.com/azat-io/eslint-plugin-perfectionist/commit/99d50bc))

#### ⚠️ Breaking Changes

- ⚠️ Drop nodejs v18 support
  ([6c4a74a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/6c4a74a))
- ⚠️ Move to esm only
  ([442f409](https://github.com/azat-io/eslint-plugin-perfectionist/commit/442f409))
- ⚠️ Drop group kind support
  ([44af851](https://github.com/azat-io/eslint-plugin-perfectionist/commit/44af851))
- **sort-imports:** ⚠️ Drop deprecated ts config root dir support
  ([5452245](https://github.com/azat-io/eslint-plugin-perfectionist/commit/5452245))
- ⚠️ Drop deprecated selectors support for multiple rules
  ([4c0161a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4c0161a))
- ⚠️ Drop deprecated object-based custom groups support
  ([5a6d5fa](https://github.com/azat-io/eslint-plugin-perfectionist/commit/5a6d5fa))
- **sort-object-types:** ⚠️ Drop deprecated ignore pattern option
  ([d28a154](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d28a154))
- **sort-jsx-props:** ⚠️ Drop deprecated ignore pattern option
  ([f1a2498](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f1a2498))
- **sort-object:** ⚠️ Drop deprecated destructure only option
  ([2f9d620](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2f9d620))
- ⚠️ Drop deprecated newlines between always and never
  ([4a9a693](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4a9a693))
- **sort-objects:** ⚠️ Migrate object type options to conditional configuration
  pattern
  ([724d044](https://github.com/azat-io/eslint-plugin-perfectionist/commit/724d044))
- **sort-enums:** ⚠️ Replace force numeric sort and update default sort by value
  option
  ([b707549](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b707549))
- ⚠️ Improve comment above integration in groups
  ([2011d6c](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2011d6c))
- **sort-imports:** ⚠️ Drop deprecated selectors
  ([f089488](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f089488))
- **sort-objects:** ⚠️ Drop deprecated ignore pattern
  ([02a09d3](https://github.com/azat-io/eslint-plugin-perfectionist/commit/02a09d3))

### ❤️ Contributors

- Hugo ([@hugop95](https://github.com/hugop95))
- Azat S. ([@azat-io](https://github.com/azat-io))

## v4.15.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.15.0...v4.15.1)

### 🐞 Bug Fixes

- **sort-modules:** Fix decorator dependencies not detected
  ([86f1626](https://github.com/azat-io/eslint-plugin-perfectionist/commit/86f1626))
- **sort-objects:** Fix complex call expressions being ignored in calling
  function name pattern
  ([20da679](https://github.com/azat-io/eslint-plugin-perfectionist/commit/20da679))
- **sort-variable-declarations:** Fix destructured assignments dependencies not
  detected
  ([1def9db](https://github.com/azat-io/eslint-plugin-perfectionist/commit/1def9db))

### ❤️ Contributors

- Hugo ([@hugop95](https://github.com/hugop95))

## v4.15.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.14.0...v4.15.0)

### 🚀 Features

- Add main and types fields for npm compatibility
  ([b12950a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b12950a))
- Allow newlines between to support number
  ([2f5a58a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2f5a58a))

### 🐞 Bug Fixes

- **sort-imports:** Allow single imports to be linted for comment above
  ([f0fae7c](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f0fae7c))
- Don't enforce new lines between behavior in unordered groups
  ([05b4797](https://github.com/azat-io/eslint-plugin-perfectionist/commit/05b4797))
- Prevent newlines fixes between different partitions
  ([b14fd3f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b14fd3f))

### ❤️ Contributors

- Hugo ([@hugop95](https://github.com/hugop95))
- Azat S. ([@azat-io](https://github.com/azat-io))

## v4.14.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.13.0...v4.14.0)

### 🚀 Features

- **sort-imports:** Allow to find alternate tsconfig file
  ([54b8a42](https://github.com/azat-io/eslint-plugin-perfectionist/commit/54b8a42))
- Enforce group comments
  ([1a02538](https://github.com/azat-io/eslint-plugin-perfectionist/commit/1a02538))

### 🐞 Bug Fixes

- Correctly identify node builtin modules with subpaths
  ([de0cbb3](https://github.com/azat-io/eslint-plugin-perfectionist/commit/de0cbb3))

### ❤️ Contributors

- Azat S. ([@azat-io](https://github.com/azat-io))
- Hugo ([@hugop95](https://github.com/hugop95))

## v4.13.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.12.3...v4.13.0)

### 🚀 Features

- **sort-union-types:** Migrate groups to new api
  ([28d2170](https://github.com/azat-io/eslint-plugin-perfectionist/commit/28d2170))
- **sort-variable-declarations:** Add groups and custom groups
  ([911e6fa](https://github.com/azat-io/eslint-plugin-perfectionist/commit/911e6fa))
- Use @/ as internal import pattern by default
  ([cbc91e0](https://github.com/azat-io/eslint-plugin-perfectionist/commit/cbc91e0))

### 🐞 Bug Fixes

- **sort-imports:** Fix weak json schema typings generated
  ([45306fa](https://github.com/azat-io/eslint-plugin-perfectionist/commit/45306fa))
- Strengthen json schemas
  ([c7f62a0](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c7f62a0))
- Ignore shebang comments
  ([d08e071](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d08e071))

### ❤️ Contributors

- Azat S. ([@azat-io](https://github.com/azat-io))
- Hugo ([@hugop95](https://github.com/hugop95))

## v4.12.3

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.12.2...v4.12.3)

### 🏎 Performance Improvements

- Use validate generated groups configuration for deprecated and new api
  ([bf57f25](https://github.com/azat-io/eslint-plugin-perfectionist/commit/bf57f25))

### ❤️ Contributors

- Hugo ([@hugop95](https://github.com/hugop95))

## v4.12.2

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.12.1...v4.12.2)

### 🐞 Bug Fixes

- **sort-imports:** Fix json-schema throwing uncaught warning
  ([2544ae8](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2544ae8))

### ❤️ Contributors

- Hugo ([@hugop95](https://github.com/hugop95))

## v4.12.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.12.0...v4.12.1)

### 🐞 Bug Fixes

- **sort-imports:** Fix json schema definition not found for eslint-typegen
  ([b531618](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b531618))

### ❤️ Contributors

- Hugo ([@hugop95](https://github.com/hugop95))

## v4.12.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.11.0...v4.12.0)

### 🚀 Features

- Add groups-related options to sort-named-exports and sort-named-imports
  ([ae7a4a1](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ae7a4a1))
- **sort-imports:** Add support for new groups and custom groups api
  ([aeb0322](https://github.com/azat-io/eslint-plugin-perfectionist/commit/aeb0322))
- **sort-imports:** Update default groups to new api
  ([c76c28a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c76c28a))
- **sort-imports:** Add ts-equals modifier to replace deprecated object group
  ([d03a9b3](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d03a9b3))
- **sort-imports:** Add subpath, tsconfig-path selectors and 5 modifiers
  ([5c35234](https://github.com/azat-io/eslint-plugin-perfectionist/commit/5c35234))

### 🐞 Bug Fixes

- Fix typescript imports always matching unknown
  ([3b0922f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/3b0922f))
- **sort-objects:** Fix nested objects not impacted by styled components
  ([f790779](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f790779))
- **sort-imports:** Fix undetected typescript import-equals dependencies
  ([d7bf203](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d7bf203))

### ❤️ Contributors

- Hugo ([@hugop95](https://github.com/hugop95))

## v4.11.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.10.1...v4.11.0)

### 🚀 Features

- **sort-exports:** Add groups-related options
  ([ca3f34d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ca3f34d))
- **sort-jsx-props:** Migrate groups-related option to new api
  ([3e500d0](https://github.com/azat-io/eslint-plugin-perfectionist/commit/3e500d0))

### 🐞 Bug Fixes

- Export plugin meta data
  ([38a3a23](https://github.com/azat-io/eslint-plugin-perfectionist/commit/38a3a23))
- Fix detection of object destructuring dependencies
  ([a0af5a7](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a0af5a7))
- Throw an error if regexp expressions are entered
  ([2b27b7d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2b27b7d))
- Fix false positive errors from eslint-disable
  ([067a871](https://github.com/azat-io/eslint-plugin-perfectionist/commit/067a871))
- Prevent circular dependency loops
  ([ab50323](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ab50323))
- Fix invalid newlines between results
  ([e18a65a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e18a65a))

### ❤️ Contributors

- Hugo ([@hugop95](https://github.com/hugop95))
- Ntnyq ([@ntnyq](https://github.com/ntnyq))

## v4.10.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.10.0...v4.10.1)

### 🐞 Bug Fixes

- Remove deprecated eslint source code api
  ([8d4ad4f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/8d4ad4f))
- **sort-imports:** Fix explicit fallback sort overriding side-effects
  ([1ac83c9](https://github.com/azat-io/eslint-plugin-perfectionist/commit/1ac83c9))

### ❤️ Contributors

- Hugo ([@hugop95](https://github.com/hugop95))
- Azat S. ([@azat-io](https://github.com/azat-io))

## v4.10.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.9.0...v4.10.0)

### 🚀 Features

- Add sort by value related-options
  ([94caac8](https://github.com/azat-io/eslint-plugin-perfectionist/commit/94caac8))
- Add custom groups fallback sort option
  ([f42f24f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f42f24f))
- Support sorting by type in fallback sorting
  ([79d0441](https://github.com/azat-io/eslint-plugin-perfectionist/commit/79d0441))

### 🐞 Bug Fixes

- Fix maximum call stack size with fallback sort
  ([8b78710](https://github.com/azat-io/eslint-plugin-perfectionist/commit/8b78710))

### ❤️ Contributors

- Hugo ([@hugop95](https://github.com/hugop95))

## v4.9.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.8.0...v4.9.0)

### 🚀 Features

- Add missing newlines between validation in groups
  ([e6e0588](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e6e0588))
- Improve regex-related options
  ([00a8080](https://github.com/azat-io/eslint-plugin-perfectionist/commit/00a8080))
- Add fallback sort option to all rules
  ([f639d94](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f639d94))
- **sort-jsx-props:** Add use configuration if option
  ([7208274](https://github.com/azat-io/eslint-plugin-perfectionist/commit/7208274))
- Allow unsorted type for all remaining rules
  ([f92ab2a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f92ab2a))

### 🐞 Bug Fixes

- Fix complex decorators not being handled
  ([e667433](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e667433))
- **sort-classes:** Fix dependency detection regression
  ([df40df4](https://github.com/azat-io/eslint-plugin-perfectionist/commit/df40df4))

### ❤️ Contributors

- Hugo ([@hugop95](http://github.com/hugop95))

## v4.8.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.7.0...v4.8.0)

### 🚀 Features

- **sort-enums:** Adds groups, custom groups and newlines between
  ([fe134a9](https://github.com/azat-io/eslint-plugin-perfectionist/commit/fe134a9))
- Improve new lines between inside groups option behavior
  ([a682297](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a682297))
- **sort-named-exports:** Add ignore alias option
  ([266910b](https://github.com/azat-io/eslint-plugin-perfectionist/commit/266910b))

### 🐞 Bug Fixes

- Add missing closing curly bracket
  ([0ec132a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/0ec132a))
- **sort-classes:** Fix new lines inside always for signature overloads
  ([f581714](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f581714))

### ❤️ Contributors

- Hugo ([@hugop95](http://github.com/hugop95))

## v4.7.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.6.0...v4.7.0)

### 🚀 Features

- **sort-objects:** Add array-based custom groups option
  ([afdda90](https://github.com/azat-io/eslint-plugin-perfectionist/commit/afdda90))
- **sort-maps:** Add groups, custom groups and new lines between options
  ([317baaa](https://github.com/azat-io/eslint-plugin-perfectionist/commit/317baaa))
- Add newlines-between to some rules
  ([231af42](https://github.com/azat-io/eslint-plugin-perfectionist/commit/231af42))

### 🐞 Bug Fixes

- Fix overlapping errors between newlines-between and comment-after fixes
  ([a6e1daf](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a6e1daf))

### ❤️ Contributors

- Hugo ([@hugop95](http://github.com/hugop95))

## v4.6.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.5.0...v4.6.0)

### 🚀 Features

- Allow to enter new lines between in groups
  ([4045595](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4045595))

### 🐞 Bug Fixes

- **sort-objects:** Fix function name pattern usage with variable assignment
  ([8d15b98](https://github.com/azat-io/eslint-plugin-perfectionist/commit/8d15b98))

### ❤️ Contributors

- Hugo ([@hugop95](http://github.com/hugop95))

## v4.5.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.4.0...v4.5.0)

### 🚀 Features

- Add custom group newlines inside option
  ([3b3d2d5](https://github.com/azat-io/eslint-plugin-perfectionist/commit/3b3d2d5))
- Make partition by comment support line and block
  ([dd71f11](https://github.com/azat-io/eslint-plugin-perfectionist/commit/dd71f11))

### 🐞 Bug Fixes

- Gives maximum priority to the void character in custom sort type
  ([1649bea](https://github.com/azat-io/eslint-plugin-perfectionist/commit/1649bea))

### ❤️ Contributors

- Hugo ([@hugop95](http://github.com/hugop95))

## v4.4.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.3.0...v4.4.0)

### 🚀 Features

- **sort-array-includes:** Add use configuration if and groups
  ([a06ce5c](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a06ce5c))
- Add ignore rule for objects passed as arguments to function calls
  ([41c9f4f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/41c9f4f))
- Add use configuration if option to sort-object-types and sort-interfaces
  ([aa18f1a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/aa18f1a))

### 🏎 Performance Improvements

- Improve rules performance
  ([42ac82d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/42ac82d))

### 🐞 Bug Fixes

- **sort-interfaces:** Prevent constructor declarations from being sorted
  ([b4ee1cc](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b4ee1cc))

### ❤️ Contributors

- Azat S. ([@azat-io](http://github.com/azat-io))
- Hugo ([@hugop95](http://github.com/hugop95))

## v4.3.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.2.0...v4.3.0)

### 🚀 Features

- Improve function detection
  ([ac1e7c4](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ac1e7c4))
- **sort-objects:** Handle context-based configurations
  ([a3ee3ff](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a3ee3ff))
- Add custom sort type through custom alphabet
  ([ac7d709](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ac7d709))

### ❤️ Contributors

- Hugo ([@hugop95](http://github.com/hugop95))

## v4.2.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.1.2...v4.2.0)

### 🚀 Features

- Improve groups and custom groups in sort-interfaces and sort-object-types
  ([8407bae](https://github.com/azat-io/eslint-plugin-perfectionist/commit/8407bae))

### 🐞 Bug Fixes

- **sort-decorators:** Keep jsdoc blocks in place
  ([54dfdd9](https://github.com/azat-io/eslint-plugin-perfectionist/commit/54dfdd9))
- Fix ignoring order in natural sorting
  ([82cb68a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/82cb68a))

### ❤️ Contributors

- Hugo ([@hugop95](http://github.com/hugop95))

## v4.1.2

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.1.1...v4.1.2)

### 🐞 Bug Fixes

- Fix invalid import
  ([b9ce62e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b9ce62e))

### ❤️ Contributors

- Hugo ([@hugop95](http://github.com/hugop95))

## v4.1.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.1.0...v4.1.1)

### 🐞 Bug Fixes

- **sort-modules:** Check if node is sortable
  ([26e2195](https://github.com/azat-io/eslint-plugin-perfectionist/commit/26e2195))

### ❤️ Contributors

- Azat S. ([@azat-io](http://github.com/azat-io))

## v4.1.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.0.3...v4.1.0)

### 🚀 Features

- **sort-enums:** Handle numeric operations
  ([710cc24](https://github.com/azat-io/eslint-plugin-perfectionist/commit/710cc24))
- **sort-objects:** Add object declarations and destructured objects options
  ([5606fad](https://github.com/azat-io/eslint-plugin-perfectionist/commit/5606fad))

### ❤️ Contributors

- Hugo ([@hugop95](http://github.com/hugop95))

## v4.0.3

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.0.2...v4.0.3)

### 🐞 Bug Fixes

- **sort-modules:** Handle deprecated eslint enum attributes
  ([979ece8](https://github.com/azat-io/eslint-plugin-perfectionist/commit/979ece8))
- Fix runtime errors in non-typescript eslint projects
  ([84cddf7](https://github.com/azat-io/eslint-plugin-perfectionist/commit/84cddf7))

### ❤️ Contributors

- Hugo ([@hugop95](http://github.com/hugop95))

## v4.0.2

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.0.1...v4.0.2)

### 🐞 Bug Fixes

- **sort-imports:** Sort default internal pattern
  ([a4bfc2b](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a4bfc2b))

### ❤️ Contributors

- Azat S. <to@azat.io>

## v4.0.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v4.0.0...v4.0.1)

### 🐞 Bug Fixes

- Fix peer dependencies issues
  ([3eba895](https://github.com/azat-io/eslint-plugin-perfectionist/commit/3eba895))
- Fix peer dependencies issues
  ([191902a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/191902a))
- **sort-modules:** Disable sorting for export decorated classes
  ([84de1d4](https://github.com/azat-io/eslint-plugin-perfectionist/commit/84de1d4))

### ❤️ Contributors

- Hugo ([@hugop95](http://github.com/hugop95))
- Hugo.prunaux <hugo.prunaux@gmail.com>

## v4.0.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v3.9.1...v4.0.0)

### 🚀 Features

- ⚠️ Remove sort-astro-attributes, sort-svelte-attributes and
  sort-vue-attributes
  ([0430412](https://github.com/azat-io/eslint-plugin-perfectionist/commit/0430412))
- **sort-classes:** ⚠️ Update default grouping
  ([97adf51](https://github.com/azat-io/eslint-plugin-perfectionist/commit/97adf51))
- Add sort-decorators rule
  ([8fd2c4e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/8fd2c4e))
- Support arbitrary module identifiers
  ([5557198](https://github.com/azat-io/eslint-plugin-perfectionist/commit/5557198))
- **sort-objects:** Add multiline and method groups
  ([1f454d9](https://github.com/azat-io/eslint-plugin-perfectionist/commit/1f454d9))
- Adds newlines between option
  ([7f44e80](https://github.com/azat-io/eslint-plugin-perfectionist/commit/7f44e80))
- Add sort-heritage-clauses rule
  ([90dfb15](https://github.com/azat-io/eslint-plugin-perfectionist/commit/90dfb15))
- **sort-classes:** ⚠️ Remove support for old custom groups api
  ([93e0b53](https://github.com/azat-io/eslint-plugin-perfectionist/commit/93e0b53))
- **sort-switch-case:** Improve sorting nodes with comments
  ([140c2c8](https://github.com/azat-io/eslint-plugin-perfectionist/commit/140c2c8))
- ⚠️ Remove minimatch in favor of regexp
  ([e240971](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e240971))
- Add locales option for all rules
  ([f84cb5f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f84cb5f))
- **sort-classes:** Add partition by new line and newlines between options
  ([4369803](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4369803))
- **sort-imports:** Resolve aliased imports through tsconfig.json
  ([9ac3188](https://github.com/azat-io/eslint-plugin-perfectionist/commit/9ac3188))
- **sort-imports:** ⚠️ Add partition by new line and partition by comment
  options
  ([6812e2b](https://github.com/azat-io/eslint-plugin-perfectionist/commit/6812e2b))
- **sort-classes:** Adds ignore callback dependencies patterns option
  ([90a9132](https://github.com/azat-io/eslint-plugin-perfectionist/commit/90a9132))
- Add eslint disable directives handling
  ([a485c39](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a485c39))
- Add sort-modules rule
  ([950db4e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/950db4e))
- **sort-classes:** Add async modifier
  ([be0b68f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/be0b68f))
- ⚠️ Move from natural-compare-lite to natural-orderby
  ([cdc0f2e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/cdc0f2e))

### 🐞 Bug Fixes

- Respect comment boundaries with partitioning by comments
  ([e5279ac](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e5279ac))
- Improve ending commas and semicolon behavior
  ([a3804b8](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a3804b8))
- Make types compatible with eslint types
  ([c9a48dd](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c9a48dd))
- **sort-switch-case:** Fix ignoring breaks in case statements
  ([960e21c](https://github.com/azat-io/eslint-plugin-perfectionist/commit/960e21c))
- **sort-classes:** Fix # properties not being detected as dependencies
  ([0cf84ae](https://github.com/azat-io/eslint-plugin-perfectionist/commit/0cf84ae))
- Support optional chaining imports
  ([932c5c9](https://github.com/azat-io/eslint-plugin-perfectionist/commit/932c5c9))
- **sort-classes:** Fix inline issue with declare class
  ([59ee21c](https://github.com/azat-io/eslint-plugin-perfectionist/commit/59ee21c))
- **sort-object-types:** Fix getting key name
  ([eb81e69](https://github.com/azat-io/eslint-plugin-perfectionist/commit/eb81e69))

#### ⚠️ Breaking Changes

- ⚠️ Remove sort-astro-attributes, sort-svelte-attributes and
  sort-vue-attributes
  ([0430412](https://github.com/azat-io/eslint-plugin-perfectionist/commit/0430412))
- **sort-classes:** ⚠️ Update default grouping
  ([97adf51](https://github.com/azat-io/eslint-plugin-perfectionist/commit/97adf51))
- **sort-classes:** ⚠️ Remove support for old custom groups api
  ([93e0b53](https://github.com/azat-io/eslint-plugin-perfectionist/commit/93e0b53))
- ⚠️ Remove minimatch in favor of regexp
  ([e240971](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e240971))
- **sort-imports:** ⚠️ Add partition by new line and partition by comment
  options
  ([6812e2b](https://github.com/azat-io/eslint-plugin-perfectionist/commit/6812e2b))
- ⚠️ Move from natural-compare-lite to natural-orderby
  ([cdc0f2e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/cdc0f2e))

### ❤️ Contributors

- Azat S. ([@azat-io](http://github.com/azat-io))
- Hugo ([@hugop95](http://github.com/hugop95))
- Fkworld ([@fkworld](http://github.com/fkworld))

## v3.9.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v3.9.0...v3.9.1)

### 🐞 Bug Fixes

- **sort-switch-case:** Fixe expressions being ignored
  ([3fb34fc](https://github.com/azat-io/eslint-plugin-perfectionist/commit/3fb34fc))

### ❤️ Contributors

- Hugo ([@hugop95](http://github.com/hugop95))

## v3.9.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v3.8.0...v3.9.0)

### 🚀 Features

- Adds possibility to trim / remove special characters before sorting
  ([96f8b10](https://github.com/azat-io/eslint-plugin-perfectionist/commit/96f8b10))
- Add element value pattern filter for properties in sort-classes
  ([4e7e5ad](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4e7e5ad))
- Throw error when a group does not exist or duplicated in sort-classes
  ([d447ffb](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d447ffb))
- Add method group in sort-interfaces
  ([b797371](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b797371))
- Add method group in sort-object-types
  ([4609ad2](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4609ad2))
- Add special characters and matcher to settings
  ([a7d3f8c](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a7d3f8c))
- Improve side-effect handling behavior in sort-imports
  ([398ac13](https://github.com/azat-io/eslint-plugin-perfectionist/commit/398ac13))
- Deprecate sort-astro-attributes, sort-svelte-attributes and
  sort-vue-attributes
  ([46790ea](https://github.com/azat-io/eslint-plugin-perfectionist/commit/46790ea))

### 🐞 Bug Fixes

- Fix runtime error related o dependencies in sort-classes
  ([7dfcb8e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/7dfcb8e))
- Fix unrecognized break statements in sort-switch-case
  ([552c65c](https://github.com/azat-io/eslint-plugin-perfectionist/commit/552c65c))

### ❤️ Contributors

- Azat S. ([@azat-io](http://github.com/azat-io))
- Hugo ([@hugop95](http://github.com/hugop95))

## v3.8.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v3.7.0...v3.8.0)

### 🚀 Features

- Add matcher option
  ([9434334](https://github.com/azat-io/eslint-plugin-perfectionist/commit/9434334))
- Add ability to disable sorting objects in jsx styles
  ([45f7661](https://github.com/azat-io/eslint-plugin-perfectionist/commit/45f7661))

### 🐞 Bug Fixes

- Ignore whitespaces in node names
  ([7a0a96c](https://github.com/azat-io/eslint-plugin-perfectionist/commit/7a0a96c))
- Fix linting of nodes that are neighboring to ignored nodes
  ([a11841a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a11841a))

### ❤️ Contributors

- Azat S. ([@azat-io](http://github.com/azat-io))
- Hugo ([@hugop95](http://github.com/hugop95))

## v3.7.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v3.6.0...v3.7.0)

### 🚀 Features

- Add partition by new line and group kind in sort-exports
  ([4db2c5e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4db2c5e))
- Add dependency order errors
  ([125e1cb](https://github.com/azat-io/eslint-plugin-perfectionist/commit/125e1cb))
- Add partition by comment option in sort-exports
  ([f6b7803](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f6b7803))
- Add partition by comment and partition by new line in sort-intersection-types
  ([9fe8abd](https://github.com/azat-io/eslint-plugin-perfectionist/commit/9fe8abd))
- Add partition by comment and partition by new line in sort-union-types
  ([4a0931b](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4a0931b))
- Add partition by comment and partition by new line in sort-named-imports
  ([41e18b9](https://github.com/azat-io/eslint-plugin-perfectionist/commit/41e18b9))
- Add partition by comment and partition by new line in sort-named-exports
  ([928246e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/928246e))
- Add partition by comment and partition by new line in sort-maps
  ([7bf6756](https://github.com/azat-io/eslint-plugin-perfectionist/commit/7bf6756))
- Add partition by comment and partition by new line in
  sort-variable-declarations
  ([aa29335](https://github.com/azat-io/eslint-plugin-perfectionist/commit/aa29335))
- Add partition by comment and partition by new line in sort-interfaces
  ([fae756a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/fae756a))
- Add partition by comment and partition by new line in sort-array-includes and
  sort-sets
  ([e4fc538](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e4fc538))
- Add partition by comment option in sort-objects-types
  ([69b643e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/69b643e))
- Add partition by new line option in sort-enums
  ([defd370](https://github.com/azat-io/eslint-plugin-perfectionist/commit/defd370))

### 🐞 Bug Fixes

- Prioritize dependencies over partitions by comment and partitions by line
  ([199ab39](https://github.com/azat-io/eslint-plugin-perfectionist/commit/199ab39))

### ❤️ Contributors

- Hugo ([@hugop95](http://github.com/hugop95))
- Chirokas ([@chirokas](http://github.com/chirokas))

## v3.6.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v3.5.0...v3.6.0)

### 🚀 Features

- Improve error messages when sorting different groups
  ([e0f375a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e0f375a))
- Improve dependency detection in sort-objects rule
  ([412d5da](https://github.com/azat-io/eslint-plugin-perfectionist/commit/412d5da))
- Keep comments above elements being sorted
  ([bd8ba3f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/bd8ba3f))

### 🐞 Bug Fixes

- Detect dependencies in template literals in sort-enums
  ([c9367eb](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c9367eb))

### ❤️ Contributors

- Hugo ([@hugop95](http://github.com/hugop95))

## v3.5.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v3.4.0...v3.5.0)

### 🚀 Features

- Add ability to disable or enable side effect imports sorting
  ([ae02009](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ae02009))

### 🐞 Bug Fixes

- Detect dependencies in template literals
  ([4e0e6d8](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4e0e6d8))
- Improve dependency detection in sort-variable-declarations rule
  ([6beb536](https://github.com/azat-io/eslint-plugin-perfectionist/commit/6beb536))

### ❤️ Contributors

- Hugo ([@hugop95](http://github.com/hugop95))
- Azat S. ([@azat-io](http://github.com/azat-io))

## v3.4.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v3.3.0...v3.4.0)

### 🚀 Features

- Improve ability to expand custom groups
  ([5088619](https://github.com/azat-io/eslint-plugin-perfectionist/commit/5088619))
- Downgrade minimatch dependency
  ([4803030](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4803030))
- Generate exception if group does not exist
  ([0872bdd](https://github.com/azat-io/eslint-plugin-perfectionist/commit/0872bdd))
- Add sort-sets rule
  ([7d4cf14](https://github.com/azat-io/eslint-plugin-perfectionist/commit/7d4cf14))

### 🐞 Bug Fixes

- Place static-block after static-property in default-options in sort-classes
  ([73b1b54](https://github.com/azat-io/eslint-plugin-perfectionist/commit/73b1b54))
- Fix sorting of members with dependencies
  ([e7c113d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e7c113d))

### ❤️ Contributors

- Hugo ([@hugop95](http://github.com/hugop95))
- Denis Sokolov ([@denis-sokolov](http://github.com/denis-sokolov))

## v3.3.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v3.2.0...v3.3.0)

### 🚀 Features

- Improve checking if a member is private in sort-classes rule
  ([4e19b94](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4e19b94))
- Add static-block and accessor-property to default groups in sort-classes
  ([0c724e0](https://github.com/azat-io/eslint-plugin-perfectionist/commit/0c724e0))
- Don't sort unknown elements if unknown is not referenced in groups
  ([0086427](https://github.com/azat-io/eslint-plugin-perfectionist/commit/0086427))
- Add optional modifier in sort-classes rule
  ([27fa7e8](https://github.com/azat-io/eslint-plugin-perfectionist/commit/27fa7e8))

### 🐞 Bug Fixes

- Fix sorting class members with same names
  ([f1f875e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f1f875e))
- Fix use of case named default in sort-switch-case rule
  ([5583eb0](https://github.com/azat-io/eslint-plugin-perfectionist/commit/5583eb0))
- Take into account dependencies in sort-enums
  ([eeb0534](https://github.com/azat-io/eslint-plugin-perfectionist/commit/eeb0534))

### ❤️ Contributors

- Hugo ([@hugop95](http://github.com/hugop95))

## v3.2.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v3.1.3...v3.2.0)

### 🚀 Features

- Use dynamic group generation in sort-classes
  ([baa701d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/baa701d))
- Support for sorting by enum value
  ([285a451](https://github.com/azat-io/eslint-plugin-perfectionist/commit/285a451))
- Improve group order error messages in sort-classes
  ([b02d626](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b02d626))
- Allow specifying cross-rule settings
  ([8e15730](https://github.com/azat-io/eslint-plugin-perfectionist/commit/8e15730))
- Add property-function groups in sort-class rule
  ([41b92d3](https://github.com/azat-io/eslint-plugin-perfectionist/commit/41b92d3))

### ❤️ Contributors

- Hugo ([@hugop95](http://github.com/hugop95))
- Azat S. ([@azat-io](http://github.com/azat-io))

## v3.1.3

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v3.1.2...v3.1.3)

### 🐞 Bug Fixes

- Fix export of typescript types
  ([1c4e960](https://github.com/azat-io/eslint-plugin-perfectionist/commit/1c4e960))

### ❤️ Contributors

- Josh Goldberg ✨ <git@joshuakgoldberg.com>

## v3.1.2

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v3.1.1...v3.1.2)

### 🏎 Performance Improvements

- Remove node cloning to improve performance
  ([00b2cc3](https://github.com/azat-io/eslint-plugin-perfectionist/commit/00b2cc3))

### 🐞 Bug Fixes

- Fix sorting switch cases with default in middle of group
  ([4ee655e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4ee655e))
- Fix getting enum members in eslint v8
  ([3f3d77c](https://github.com/azat-io/eslint-plugin-perfectionist/commit/3f3d77c))

### ❤️ Contributors

- Azat S. ([@azat-io](http://github.com/azat-io))

## v3.1.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v3.1.0...v3.1.1)

### 🐞 Bug Fixes

- Fix getting enum members in eslint v8
  ([4789764](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4789764))

### ❤️ Contributors

- Azat S. ([@azat-io](http://github.com/azat-io))

## v3.1.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v3.0.0...v3.1.0)

### 🚀 Features

- Support for ordering protected properties and methods in classes
  ([7efadfa](https://github.com/azat-io/eslint-plugin-perfectionist/commit/7efadfa))
- Replace sort-objects custom ignore option with destructure only
  ([f3906f9](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f3906f9))
- Move to typescript-eslint v8
  ([05b6502](https://github.com/azat-io/eslint-plugin-perfectionist/commit/05b6502))

### 🐞 Bug Fixes

- Fix switch case sorting with grouped default case
  ([7428523](https://github.com/azat-io/eslint-plugin-perfectionist/commit/7428523))
- Switch from to-sorted to sort method
  ([bff6575](https://github.com/azat-io/eslint-plugin-perfectionist/commit/bff6575))
- Disable sorting dynamic require imports
  ([68632df](https://github.com/azat-io/eslint-plugin-perfectionist/commit/68632df))
- Define as builtin modules that require a node prefix
  ([aac4725](https://github.com/azat-io/eslint-plugin-perfectionist/commit/aac4725))
- Fix sorting of complex switch case expressions
  ([d07f5f7](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d07f5f7))

### ❤️ Contributors

- Azat S. ([@azat-io](http://github.com/azat-io))
- Williamkolean ([@williamkolean](http://github.com/williamkolean))

## v3.0.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v2.11.0...v3.0.0)

### 🚀 Features

- ⚠️ Drop nodejs v16 support
  ([79f74f5](https://github.com/azat-io/eslint-plugin-perfectionist/commit/79f74f5))
- Move to typescript-eslint v7
  ([933cebd](https://github.com/azat-io/eslint-plugin-perfectionist/commit/933cebd))
- Add new docs website
  ([76b29e8](https://github.com/azat-io/eslint-plugin-perfectionist/commit/76b29e8))
- ⚠️ Rename options from kebab case to camel case
  ([6592f6f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/6592f6f))
- ⚠️ Make case ignoring enabled by default
  ([63efbf7](https://github.com/azat-io/eslint-plugin-perfectionist/commit/63efbf7))
- Update svelte eslint parser
  ([611f088](https://github.com/azat-io/eslint-plugin-perfectionist/commit/611f088))
- Add ability to ignore jsx elements
  ([da515ce](https://github.com/azat-io/eslint-plugin-perfectionist/commit/da515ce))
- Use ignore pattern when sorting object for call expressions
  ([471de40](https://github.com/azat-io/eslint-plugin-perfectionist/commit/471de40))
- ⚠️ Make new config export
  ([2a7eec2](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2a7eec2))
- Add sort-switch-case rule
  ([5311118](https://github.com/azat-io/eslint-plugin-perfectionist/commit/5311118))
- Add typescript types
  ([2b63ab5](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2b63ab5))
- Add custom ignore to enable customisable ignore sort-objects rule
  ([4fa2b3e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4fa2b3e))
- Respect numeric separators in natural sorting
  ([7b57ba2](https://github.com/azat-io/eslint-plugin-perfectionist/commit/7b57ba2))
- Add groups option in sort-intersection-types rule
  ([208a9db](https://github.com/azat-io/eslint-plugin-perfectionist/commit/208a9db))
- ⚠️ Remove nullable last option in sort-union-types
  ([c4977df](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c4977df))
- Add groups option in sort-union-types rule
  ([c69f277](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c69f277))
- Add partition by comment option in sort-classes
  ([da01c85](https://github.com/azat-io/eslint-plugin-perfectionist/commit/da01c85))
- ⚠️ Make recommended options default
  ([d0d9115](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d0d9115))
- ⚠️ Replace spread last sort-array-includes option with group kind
  ([721e1ee](https://github.com/azat-io/eslint-plugin-perfectionist/commit/721e1ee))
- Add group kind option in sort-object-types
  ([96cfcd8](https://github.com/azat-io/eslint-plugin-perfectionist/commit/96cfcd8))
- ⚠️ Rename optionality order option to group kind in sort-interfaces rule
  ([79a4823](https://github.com/azat-io/eslint-plugin-perfectionist/commit/79a4823))
- Add sort-variable-declarations rule
  ([12bd265](https://github.com/azat-io/eslint-plugin-perfectionist/commit/12bd265))
- Support require in sort-imports
  ([bc16243](https://github.com/azat-io/eslint-plugin-perfectionist/commit/bc16243))

### 🐞 Bug Fixes

- Move typescript-eslint types to dependencies
  ([44edb63](https://github.com/azat-io/eslint-plugin-perfectionist/commit/44edb63))
- Add ability to select enviorenment and separate bun modules
  ([c8b2fa4](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c8b2fa4))
- Fix disabling styled components when using css func
  ([d4e8011](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d4e8011))
- Support old getting context eslint api
  ([09900aa](https://github.com/azat-io/eslint-plugin-perfectionist/commit/09900aa))
- Fix export and import kind default value
  ([a0208ac](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a0208ac))
- Don't sort class members if right value depends on left
  ([8c35a7d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/8c35a7d))

#### ⚠️ Breaking Changes

- ⚠️ Drop nodejs v16 support
  ([79f74f5](https://github.com/azat-io/eslint-plugin-perfectionist/commit/79f74f5))
- ⚠️ Rename options from kebab case to camel case
  ([6592f6f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/6592f6f))
- ⚠️ Make case ignoring enabled by default
  ([63efbf7](https://github.com/azat-io/eslint-plugin-perfectionist/commit/63efbf7))
- ⚠️ Make new config export
  ([2a7eec2](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2a7eec2))
- ⚠️ Remove nullable last option in sort-union-types
  ([c4977df](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c4977df))
- ⚠️ Make recommended options default
  ([d0d9115](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d0d9115))
- ⚠️ Replace spread last sort-array-includes option with group kind
  ([721e1ee](https://github.com/azat-io/eslint-plugin-perfectionist/commit/721e1ee))
- ⚠️ Rename optionality order option to group kind in sort-interfaces rule
  ([79a4823](https://github.com/azat-io/eslint-plugin-perfectionist/commit/79a4823))

### ❤️ Contributors

- Azat S. ([@azat-io](http://github.com/azat-io))
- Sergio ([@KID-joker](http://github.com/KID-joker))
- Azat S ([@azat-io](http://github.com/azat-io))
- Luca Cavallaro <luca.cavallaro@posteo.net>

## v2.11.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v2.10.0...v2.11.0)

### 🚀 Features

- Update svelte
  ([861a381](https://github.com/azat-io/eslint-plugin-perfectionist/commit/861a381))
- **sort-classes:** Add custom-group to sort-classes rule
  ([1773ffb](https://github.com/azat-io/eslint-plugin-perfectionist/commit/1773ffb))

### ❤️ Contributors

- Gustavo Pedroni ([@gustavopedroni](http://github.com/gustavopedroni))
- Tkhs ([@tkhs0813](http://github.com/tkhs0813))

## v2.10.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v2.9.0...v2.10.0)

### 🚀 Features

- Allow typescript-eslint v7
  ([ccdaeb8](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ccdaeb8))

### 🐞 Bug Fixes

- **sort-imports:** Empty named imports being considered side-effect imports
  ([ca69069](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ca69069))

### ❤️ Contributors

- Josh Goldberg ✨ <git@joshuakgoldberg.com>
- Hampus ([@hampus-stravito](http://github.com/hampus-stravito))

## v2.9.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v2.8.0...v2.9.0)

### 🚀 Features

- Add sort-intersection-types rule
  ([3ad40ff](https://github.com/azat-io/eslint-plugin-perfectionist/commit/3ad40ff))
- Use preserve modules for package build
  ([be13a21](https://github.com/azat-io/eslint-plugin-perfectionist/commit/be13a21))

### 🐞 Bug Fixes

- Sort-objects ignore-pattern add property type
  ([3de399f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/3de399f))
- **sort-exports:** Work with star exports
  ([ce76606](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ce76606))

### ❤️ Contributors

- Azat S. ([@azat-io](http://github.com/azat-io))
- Chirokas ([@chirokas](http://github.com/chirokas))
- Sergio ([@KID-joker](http://github.com/KID-joker))
- Josh Goldberg ✨ <git@joshuakgoldberg.com>

## v2.8.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v2.7.0...v2.8.0)

### 🚀 Features

- **sort-interfaces:** Add `optionalityOrder` option
  ([e142c39](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e142c39))

### 🐞 Bug Fixes

- Convert `optionalityOrder` to kebab case
  ([7726294](https://github.com/azat-io/eslint-plugin-perfectionist/commit/7726294))

### ❤️ Contributors

- Chirokas ([@chirokas](http://github.com/chirokas))

## v2.7.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v2.6.0...v2.7.0)

### 🚀 Features

- **sort-enums:** Add `partition-by-comment` option
  ([ec3d11c](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ec3d11c))
- Add group-kind option on sort-named-imports and sort-named-exports
  ([eb78461](https://github.com/azat-io/eslint-plugin-perfectionist/commit/eb78461))

### ❤️ Contributors

- Renato Böhler <renato.bohler@gmail.com>
- Chirokas ([@chirokas](http://github.com/chirokas))

## v2.6.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v2.5.0...v2.6.0)

### 🚀 Features

- **sort-classes:** Add decorators support
  ([cbe3f4b](https://github.com/azat-io/eslint-plugin-perfectionist/commit/cbe3f4b))

### ❤️ Contributors

- Chirokas

## v2.5.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v2.4.2...v2.5.0)

### 🚀 Features

- Add ignore-pattern option for sort-objects rule
  ([ac5b240](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ac5b240))

### ❤️ Contributors

- Azat S. ([@azat-io](http://github.com/azat-io))

## v2.4.2

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v2.4.1...v2.4.2)

### 🐞 Bug Fixes

- Fix cjs plugin usage
  ([1293490](https://github.com/azat-io/eslint-plugin-perfectionist/commit/1293490))

### ❤️ Contributors

- Azat S. ([@azat-io](http://github.com/azat-io))

## v2.4.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v2.4.0...v2.4.1)

### 🐞 Bug Fixes

- Fix output with a large number of groups
  ([6847eaf](https://github.com/azat-io/eslint-plugin-perfectionist/commit/6847eaf))

### ❤️ Contributors

- Azat S. ([@azat-io](http://github.com/azat-io))

## v2.4.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v2.3.0...v2.4.0)

### 🚀 Features

- Add side-effect-style import group
  ([32dbef8](https://github.com/azat-io/eslint-plugin-perfectionist/commit/32dbef8))

### ❤️ Contributors

- Azat S. ([@azat-io](http://github.com/azat-io))

## v2.3.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v2.2.0...v2.3.0)

### 🚀 Features

- Add max line length option for multiline imports sorting
  ([4b81340](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4b81340))
- Add partition by new line option to sort-objects rule
  ([8654e44](https://github.com/azat-io/eslint-plugin-perfectionist/commit/8654e44))
- Add partition by new line option to sort-interfaces rule
  ([48532ef](https://github.com/azat-io/eslint-plugin-perfectionist/commit/48532ef))
- Add partition by new line option to sort-object-typea rule
  ([563c815](https://github.com/azat-io/eslint-plugin-perfectionist/commit/563c815))

### ❤️ Contributors

- Azat S. ([@azat-io](http://github.com/azat-io))
- Azat S ([@azat-io](http://github.com/azat-io))
- Tthornton3-chwy

## v2.2.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v2.1.0...v2.2.0)

### 🚀 Features

- Add ignore-alias option to sort-named-imports rule
  ([4ad560b](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4ad560b))

### 🐞 Bug Fixes

- Side-effect import with an internal pattern are defined as internal module in
  sort-imports rule
  ([b6f4e91](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b6f4e91))
- Improve recognition of external modules
  ([a22eaf6](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a22eaf6))

### ❤️ Contributors

- Azat S. ([@azat-io](http://github.com/azat-io))
- Wondermarin

## v2.1.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v2.0.1...v2.1.0)

### 🚀 Features

- Add static-private-method group for sort-classes rule
  ([37512c9](https://github.com/azat-io/eslint-plugin-perfectionist/commit/37512c9))
- Support bun builtin modules in sort-imports rule
  ([37bca14](https://github.com/azat-io/eslint-plugin-perfectionist/commit/37bca14))

### 🐞 Bug Fixes

- Allow internal imports starting with a hash character
  ([f35deef](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f35deef))

### ❤️ Contributors

- Azat S. ([@azat-io](http://github.com/azat-io))

## v2.0.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v2.0.0...v2.0.1)

### 🐞 Bug Fixes

- Prefix-only builtin modules are defined as external modules in sort-imports
  rule
  ([92b7240](https://github.com/azat-io/eslint-plugin-perfectionist/commit/92b7240))

### ❤️ Contributors

- Wondermarin

## v2.0.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.5.1...v2.0.0)

### 🚀 Features

- ⚠️ Rename sort-map-elements rule to sort-maps
  ([d371934](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d371934))
- ⚠️ Remove read-tsconfig option in sort-imports rule
  ([cccced1](https://github.com/azat-io/eslint-plugin-perfectionist/commit/cccced1))
- ⚠️ Move callback, multiline and shorthand opts to groups in sort-jsx-props
  rule
  ([10d357c](https://github.com/azat-io/eslint-plugin-perfectionist/commit/10d357c))
- Add sort-svelte-attributes rule
  ([409295e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/409295e))
- Add sort-astro-attributes rule
  ([036b41d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/036b41d))
- ⚠️ Move from always-on-top option to groups in sort-objects rule
  ([0bbcb5a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/0bbcb5a))
- Allow disabling sort-objects rule for styled-components
  ([70f2afc](https://github.com/azat-io/eslint-plugin-perfectionist/commit/70f2afc))
- Add sort-vue-attributes rule
  ([e031275](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e031275))
- Add groups option to sort-interfaces rule
  ([903c029](https://github.com/azat-io/eslint-plugin-perfectionist/commit/903c029))
- Add groups options in sort-object-types rule
  ([a219f23](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a219f23))
- Replace is-core-module dependency with builtin module
  ([e190c45](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e190c45))
- Move to typescript-eslint v6
  ([9c61238](https://github.com/azat-io/eslint-plugin-perfectionist/commit/9c61238))
- Add option in sort-union-types rule to put null and undefined types at end
  ([b313ba7](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b313ba7))
- Add index-signature group to sort-classes rule
  ([f857b80](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f857b80))
- Add get and set methods groups to sort-classes rule
  ([73132e8](https://github.com/azat-io/eslint-plugin-perfectionist/commit/73132e8))

### 🐞 Bug Fixes

- Disable sorting enums with implicit values
  ([f4a0e25](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f4a0e25))
- Ignore string quotes in sort-array-includes rule
  ([ec2e2f5](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ec2e2f5))
- Handle more complex expressions in sort-objects
  ([a7d966c](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a7d966c))
- Set alphabetical sorting as default in sort-svelte-attributes rule
  ([b224428](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b224428))
- Fix sorting single line union type with comment at end
  ([95560ab](https://github.com/azat-io/eslint-plugin-perfectionist/commit/95560ab))
- Fix sorting class overloads
  ([c4939b4](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c4939b4))
- Fix loading default options for configs
  ([ef99f44](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ef99f44))
- Disable sort-jsx-props for vue, astro and svelte files
  ([afb6ecc](https://github.com/azat-io/eslint-plugin-perfectionist/commit/afb6ecc))
- Improve determinition of static fields in sort-classes rule
  ([c00ac10](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c00ac10))
- Prevent order changes when adding new elements in line-length sorting
  ([c0e2e60](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c0e2e60))

#### ⚠️ Breaking Changes

- ⚠️ Rename sort-map-elements rule to sort-maps
  ([d371934](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d371934))
- ⚠️ Remove read-tsconfig option in sort-imports rule
  ([cccced1](https://github.com/azat-io/eslint-plugin-perfectionist/commit/cccced1))
- ⚠️ Move callback, multiline and shorthand opts to groups in sort-jsx-props
  rule
  ([10d357c](https://github.com/azat-io/eslint-plugin-perfectionist/commit/10d357c))
- ⚠️ Move from always-on-top option to groups in sort-objects rule
  ([0bbcb5a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/0bbcb5a))

### ❤️ Contributors

- Azat S. ([@azat-io](http://github.com/azat-io))
- Azat S ([@azat-io](http://github.com/azat-io))
- Martin Šťovíček

## v1.5.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.5.0...v1.5.1)

### 🐞 Bug Fixes

- Use alphabetical as the default sort type in schemas
  ([3b9366e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/3b9366e))
- Disable sorting side-effect imports
  ([01da88a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/01da88a))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))
- Hao Cheng <hcheng636@gmail.com>

## v1.5.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.4.0...v1.5.0)

### 🚀 Features

- Add external-type import group
  ([47b07cc](https://github.com/azat-io/eslint-plugin-perfectionist/commit/47b07cc))

### 🏎 Performance Improvements

- Move from foreach to for loops
  ([b648f74](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b648f74))
- Move from reduce to for loops in sort-imports
  ([16f6361](https://github.com/azat-io/eslint-plugin-perfectionist/commit/16f6361))

### 🐞 Bug Fixes

- Don't sort ts call signature declarations in interfactes
  ([5829a65](https://github.com/azat-io/eslint-plugin-perfectionist/commit/5829a65))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v1.4.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.3.0...v1.4.0)

### 🚀 Features

- Allow separating object properties into logical parts
  ([933b621](https://github.com/azat-io/eslint-plugin-perfectionist/commit/933b621))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v1.3.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.2.1...v1.3.0)

### 🚀 Features

- Support custom import groups
  ([0b837d4](https://github.com/azat-io/eslint-plugin-perfectionist/commit/0b837d4))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v1.2.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.2.0...v1.2.1)

### 🐞 Bug Fixes

- Fix removing extra spaces between imports
  ([21bc7a8](https://github.com/azat-io/eslint-plugin-perfectionist/commit/21bc7a8))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v1.2.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.1.2...v1.2.0)

### 🚀 Features

- Support stylus file imports
  ([dbef415](https://github.com/azat-io/eslint-plugin-perfectionist/commit/dbef415))
- Add sort-exports rule
  ([a71eeb3](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a71eeb3))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v1.1.2

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.1.1...v1.1.2)

### 🐞 Bug Fixes

- Fix sorting interfaces and types with comment on same line
  ([03e5508](https://github.com/azat-io/eslint-plugin-perfectionist/commit/03e5508))

### ❤️ Contributors

- Azat S <to@azat.io>

## v1.1.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.1.0...v1.1.1)

### 🐞 Bug Fixes

- Fix adding extra lines if import ends with semi
  ([e435f91](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e435f91))
- Don't sort keys if right value depends on left
  ([3e987ae](https://github.com/azat-io/eslint-plugin-perfectionist/commit/3e987ae))
- Ignore semi at the end of object type member value
  ([623ac67](https://github.com/azat-io/eslint-plugin-perfectionist/commit/623ac67))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v1.1.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.0.1...v1.1.0)

### 🚀 Features

- Add style group to sort the imports
  ([05bf0f7](https://github.com/azat-io/eslint-plugin-perfectionist/commit/05bf0f7))
- Add side-effect group to sort the imports
  ([02f51fb](https://github.com/azat-io/eslint-plugin-perfectionist/commit/02f51fb))
- Add builtin-type group to sort the imports
  ([ca34b5e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/ca34b5e))

### 🐞 Bug Fixes

- Allow to sort destructured objects
  ([65fe6c7](https://github.com/azat-io/eslint-plugin-perfectionist/commit/65fe6c7))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v1.0.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v1.0.0...v1.0.1)

### 🐞 Bug Fixes

- Do not sort enums with implicit values
  ([166edac](https://github.com/azat-io/eslint-plugin-perfectionist/commit/166edac))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v1.0.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.11.6...v1.0.0)

### 🎉 Stable release

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.11.6

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.11.5...v0.11.6)

### 🐞 Bug Fixes

- Improve sort-imports fix function
  ([e7a39f2](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e7a39f2))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.11.5

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.11.4...v0.11.5)

### 🐞 Bug Fixes

- Fix sorting objects with inline comments
  ([37a537d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/37a537d))
- Split imports if there are other nodes between
  ([b1a8837](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b1a8837))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.11.4

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.11.3...v0.11.4)

### 🐞 Bug Fixes

- Use service comments when sorting imports
  ([b577ac7](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b577ac7))
- Fix sorting nodes with comments on the same line
  ([16887ea](https://github.com/azat-io/eslint-plugin-perfectionist/commit/16887ea))
- Do not fix objects if last member contains a comment and doesn't contain comma
  ([a9915f1](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a9915f1))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.11.3

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.11.2...v0.11.3)

### 🐞 Bug Fixes

- Fix working sort-map-elements with empty map
  ([de061ff](https://github.com/azat-io/eslint-plugin-perfectionist/commit/de061ff))
- Disallow to sort default import specifiers
  ([60044c6](https://github.com/azat-io/eslint-plugin-perfectionist/commit/60044c6))
- Do not sort imports if there are tokens between them
  ([a4fabe9](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a4fabe9))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.11.2

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.11.1...v0.11.2)

### 🏎 Performance Improvements

- Do not compute options if rule is not used
  ([4574caa](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4574caa))

### 🐞 Bug Fixes

- Fix single line type objects sorting
  ([aaa446a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/aaa446a))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.11.1

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.11.0...v0.11.1)

### 🐞 Bug Fixes

- Fix option names in sort-classes in configs
  ([bf578ed](https://github.com/azat-io/eslint-plugin-perfectionist/commit/bf578ed))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.11.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.10.0...v0.11.0)

### 🚀 Features

- Add sort-object-types rule
  ([e3a06cf](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e3a06cf))
- Add sort-classes rule
  ([b3a0cb8](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b3a0cb8))

### 🐞 Bug Fixes

- Fix multiline option value in sort-jsx-props rule in configs
  ([556690d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/556690d))
- Improve error output
  ([c1ad261](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c1ad261))
- Fix internal patter in configs
  ([4be8a74](https://github.com/azat-io/eslint-plugin-perfectionist/commit/4be8a74))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.10.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.9.0...v0.10.0)

### 🚀 Features

- Add read-tsconfig option to sort-imports rule
  ([84cfc3d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/84cfc3d))
- Allow to ignore interface by pattern
  ([9aaf08a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/9aaf08a))
- Add ignore-case option to each rule
  ([e331b9a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e331b9a))
- Rename spread-last option in sort-array-includes rule to kebab case
  ([fc342d2](https://github.com/azat-io/eslint-plugin-perfectionist/commit/fc342d2))
- Add shorthand position option to sort-jsx-props rule
  ([416ffee](https://github.com/azat-io/eslint-plugin-perfectionist/commit/416ffee))
- Add callback position option to sort-jsx-props rule
  ([8c6189f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/8c6189f))
- Add multiline position option to sort-jsx-props rule
  ([58e094a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/58e094a))
- Add always-on-top option to sort-jsx-props rule
  ([57af3a2](https://github.com/azat-io/eslint-plugin-perfectionist/commit/57af3a2))
- Rename sort-object-keys rule to sort-objects
  ([3340a9f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/3340a9f))
- Add always-on-top option to sort-objects rule
  ([464108f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/464108f))

### 🏎 Performance Improvements

- Make reading tsconfig singleton
  ([c748445](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c748445))
- Improve sort-imports rule performance
  ([2989539](https://github.com/azat-io/eslint-plugin-perfectionist/commit/2989539))

### 🐞 Bug Fixes

- Fix groups in sort-imports rule in configs
  ([f83c499](https://github.com/azat-io/eslint-plugin-perfectionist/commit/f83c499))
- Move parentheses when sorting
  ([d09395f](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d09395f))
- Update peer deps
  ([800c2a3](https://github.com/azat-io/eslint-plugin-perfectionist/commit/800c2a3))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.9.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.8.0...v0.9.0)

### 🚀 Features

- Add sort-imports rule
  ([e3ed15e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e3ed15e))

### 🐞 Bug Fixes

- Keep code comments when sorting
  ([547f825](https://github.com/azat-io/eslint-plugin-perfectionist/commit/547f825))
- Update url to documentation of rules
  ([423b145](https://github.com/azat-io/eslint-plugin-perfectionist/commit/423b145))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.8.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.7.0...v0.8.0)

### 🚀 Features

- Add sort-enums rule
  ([47167e0](https://github.com/azat-io/eslint-plugin-perfectionist/commit/47167e0))

### 🐞 Bug Fixes

- Fix defenition for rule not found error
  ([050d20d](https://github.com/azat-io/eslint-plugin-perfectionist/commit/050d20d))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.7.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.6.0...v0.7.0)

### 🐞 Bug Fixes

- Fix plugin configs creation
  ([559a2ce](https://github.com/azat-io/eslint-plugin-perfectionist/commit/559a2ce))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.6.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.5.0...v0.6.0)

### 🚀 Features

- Support flat eslint config
  ([969ae4e](https://github.com/azat-io/eslint-plugin-perfectionist/commit/969ae4e))
- Add sort-object-keys rule
  ([6dcb425](https://github.com/azat-io/eslint-plugin-perfectionist/commit/6dcb425))
- Add recommended-alphabetical config
  ([66c99f0](https://github.com/azat-io/eslint-plugin-perfectionist/commit/66c99f0))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.5.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.4.0...v0.5.0)

### 🚀 Features

- Add sort-map-elements rule
  ([049c004](https://github.com/azat-io/eslint-plugin-perfectionist/commit/049c004))
- Add sort-array-includes rule
  ([bb7605b](https://github.com/azat-io/eslint-plugin-perfectionist/commit/bb7605b))

### 🐞 Bug Fixes

- Fix rules descriptions
  ([1d18a26](https://github.com/azat-io/eslint-plugin-perfectionist/commit/1d18a26))
- Add default rules properties
  ([48d2835](https://github.com/azat-io/eslint-plugin-perfectionist/commit/48d2835))
- Add array constructor support to sort-array-includes rule
  ([d255c22](https://github.com/azat-io/eslint-plugin-perfectionist/commit/d255c22))
- Fix interface sorting
  ([86e3b56](https://github.com/azat-io/eslint-plugin-perfectionist/commit/86e3b56))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.4.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.3.0...v0.4.0)

### 🚀 Features

- Add sort-named-exports rule
  ([b3f4b57](https://github.com/azat-io/eslint-plugin-perfectionist/commit/b3f4b57))

### 🐞 Bug Fixes

- Fix rule configs creation
  ([8a43758](https://github.com/azat-io/eslint-plugin-perfectionist/commit/8a43758))
- Fix missed sort-union-types rule export
  ([3b02609](https://github.com/azat-io/eslint-plugin-perfectionist/commit/3b02609))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.3.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.2.0...v0.3.0)

### 🚀 Features

- Add natural sorting
  ([c50d585](https://github.com/azat-io/eslint-plugin-perfectionist/commit/c50d585))
- Add sort-union-types rule
  ([e0cca5b](https://github.com/azat-io/eslint-plugin-perfectionist/commit/e0cca5b))

### 🐞 Bug Fixes

- Fix plugin exports
  ([a2f3f48](https://github.com/azat-io/eslint-plugin-perfectionist/commit/a2f3f48))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.2.0

[compare changes](https://github.com/azat-io/eslint-plugin-perfectionist/compare/v0.1.0...v0.2.0)

### 🚀 Features

- Add sort-named-imports rule
  ([827ee5a](https://github.com/azat-io/eslint-plugin-perfectionist/commit/827ee5a))
- Add sort-jsx-props rule
  ([656c86b](https://github.com/azat-io/eslint-plugin-perfectionist/commit/656c86b))

### 🐞 Bug Fixes

- Fix commonjs support
  ([942cca6](https://github.com/azat-io/eslint-plugin-perfectionist/commit/942cca6))

### ❤️ Contributors

- Azat S ([@azat-io](http://github.com/azat-io))

## v0.1.0

### 🔥️️ Initial Release
