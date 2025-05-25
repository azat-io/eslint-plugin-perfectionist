import { defineConfig } from 'eslint-rule-benchmark'

export default defineConfig({
  tests: [
    {
      cases: [
        {
          testPath: './sort-array-includes/base-alphabetical.ts',
          options: [{ type: 'alphabetical', order: 'asc' }],
        },
        {
          testPath: './sort-array-includes/base-natural.ts',
          options: [{ type: 'natural', order: 'asc' }],
        },
        {
          testPath: './sort-array-includes/base-line-length.ts',
          options: [{ type: 'line-length', order: 'desc' }],
        },
      ],
      rulePath: '../rules/sort-array-includes.ts',
      name: 'Rule: sort-array-includes',
      ruleId: 'sort-array-includes',
    },
    {
      cases: [
        {
          testPath: './sort-classes/base-alphabetical.ts',
          options: [{ type: 'alphabetical', order: 'asc' }],
        },
        {
          testPath: './sort-classes/base-natural.ts',
          options: [{ type: 'natural', order: 'asc' }],
        },
        {
          testPath: './sort-classes/base-line-length.ts',
          options: [{ type: 'line-length', order: 'desc' }],
        },
      ],
      rulePath: '../rules/sort-classes.ts',
      name: 'Rule: sort-classes',
      ruleId: 'sort-classes',
    },
    {
      cases: [
        {
          testPath: './sort-decorators/base-alphabetical.ts',
          options: [{ type: 'alphabetical', order: 'asc' }],
        },
        {
          testPath: './sort-decorators/base-natural.ts',
          options: [{ type: 'natural', order: 'asc' }],
        },
        {
          testPath: './sort-decorators/base-line-length.ts',
          options: [{ type: 'line-length', order: 'desc' }],
        },
      ],
      rulePath: '../rules/sort-decorators.ts',
      name: 'Rule: sort-decorators',
      ruleId: 'sort-decorators',
    },
    {
      cases: [
        {
          testPath: './sort-enums/base-alphabetical.ts',
          options: [{ type: 'alphabetical', order: 'asc' }],
        },
        {
          testPath: './sort-enums/base-natural.ts',
          options: [{ type: 'natural', order: 'asc' }],
        },
        {
          testPath: './sort-enums/base-line-length.ts',
          options: [{ type: 'line-length', order: 'desc' }],
        },
      ],
      rulePath: '../rules/sort-enums.ts',
      name: 'Rule: sort-enums',
      ruleId: 'sort-enums',
    },
    {
      cases: [
        {
          testPath: './sort-exports/base-alphabetical.ts',
          options: [{ type: 'alphabetical', order: 'asc' }],
        },
        {
          testPath: './sort-exports/base-natural.ts',
          options: [{ type: 'natural', order: 'asc' }],
        },
        {
          testPath: './sort-exports/base-line-length.ts',
          options: [{ type: 'line-length', order: 'desc' }],
        },
      ],
      rulePath: '../rules/sort-exports.ts',
      name: 'Rule: sort-exports',
      ruleId: 'sort-exports',
    },
    {
      cases: [
        {
          testPath: './sort-heritage-clauses/base-alphabetical.ts',
          options: [{ type: 'alphabetical', order: 'asc' }],
        },
        {
          testPath: './sort-heritage-clauses/base-natural.ts',
          options: [{ type: 'natural', order: 'asc' }],
        },
        {
          testPath: './sort-heritage-clauses/base-line-length.ts',
          options: [{ type: 'line-length', order: 'desc' }],
        },
      ],
      rulePath: '../rules/sort-heritage-clauses.ts',
      name: 'Rule: sort-heritage-clauses',
      ruleId: 'sort-heritage-clauses',
    },
    {
      cases: [
        {
          testPath: './sort-imports/base-alphabetical.ts',
          options: [{ type: 'alphabetical', order: 'asc' }],
        },
        {
          testPath: './sort-imports/base-natural.ts',
          options: [{ type: 'natural', order: 'asc' }],
        },
        {
          testPath: './sort-imports/base-line-length.ts',
          options: [{ type: 'line-length', order: 'desc' }],
        },
      ],
      rulePath: '../rules/sort-imports.ts',
      name: 'Rule: sort-imports',
      ruleId: 'sort-imports',
    },
    {
      cases: [
        {
          testPath: './sort-interfaces/base-alphabetical.ts',
          options: [{ type: 'alphabetical', order: 'asc' }],
        },
        {
          testPath: './sort-interfaces/base-natural.ts',
          options: [{ type: 'natural', order: 'asc' }],
        },
        {
          testPath: './sort-interfaces/base-line-length.ts',
          options: [{ type: 'line-length', order: 'desc' }],
        },
      ],
      rulePath: '../rules/sort-interfaces.ts',
      name: 'Rule: sort-interfaces',
      ruleId: 'sort-interfaces',
    },
    {
      cases: [
        {
          testPath: './sort-intersection-types/base-alphabetical.ts',
          options: [{ type: 'alphabetical', order: 'asc' }],
        },
        {
          testPath: './sort-intersection-types/base-natural.ts',
          options: [{ type: 'natural', order: 'asc' }],
        },
        {
          testPath: './sort-intersection-types/base-line-length.ts',
          options: [{ type: 'line-length', order: 'desc' }],
        },
      ],
      rulePath: '../rules/sort-intersection-types.ts',
      name: 'Rule: sort-intersection-types',
      ruleId: 'sort-intersection-types',
    },
    {
      cases: [
        {
          testPath: './sort-jsx-props/base-alphabetical.tsx',
          options: [{ type: 'alphabetical', order: 'asc' }],
        },
        {
          testPath: './sort-jsx-props/base-natural.tsx',
          options: [{ type: 'natural', order: 'asc' }],
        },
        {
          testPath: './sort-jsx-props/base-line-length.tsx',
          options: [{ type: 'line-length', order: 'desc' }],
        },
      ],
      rulePath: '../rules/sort-jsx-props.ts',
      name: 'Rule: sort-jsx-props',
      ruleId: 'sort-jsx-props',
    },
    {
      cases: [
        {
          testPath: './sort-maps/base-alphabetical.ts',
          options: [{ type: 'alphabetical', order: 'asc' }],
        },
        {
          testPath: './sort-maps/base-natural.ts',
          options: [{ type: 'natural', order: 'asc' }],
        },
        {
          testPath: './sort-maps/base-line-length.ts',
          options: [{ type: 'line-length', order: 'desc' }],
        },
      ],
      rulePath: '../rules/sort-maps.ts',
      name: 'Rule: sort-maps',
      ruleId: 'sort-maps',
    },
    {
      cases: [
        {
          testPath: './sort-named-exports/base-alphabetical.ts',
          options: [{ type: 'alphabetical', order: 'asc' }],
        },
        {
          testPath: './sort-named-exports/base-natural.ts',
          options: [{ type: 'natural', order: 'asc' }],
        },
        {
          testPath: './sort-named-exports/base-line-length.ts',
          options: [{ type: 'line-length', order: 'desc' }],
        },
      ],
      rulePath: '../rules/sort-named-exports.ts',
      name: 'Rule: sort-named-exports',
      ruleId: 'sort-named-exports',
    },
    {
      cases: [
        {
          testPath: './sort-named-imports/base-alphabetical.ts',
          options: [{ type: 'alphabetical', order: 'asc' }],
        },
        {
          testPath: './sort-named-imports/base-natural.ts',
          options: [{ type: 'natural', order: 'asc' }],
        },
        {
          testPath: './sort-named-imports/base-line-length.ts',
          options: [{ type: 'line-length', order: 'desc' }],
        },
      ],
      rulePath: '../rules/sort-named-imports.ts',
      name: 'Rule: sort-named-imports',
      ruleId: 'sort-named-imports',
    },
    {
      cases: [
        {
          testPath: './sort-object-types/base-alphabetical.ts',
          options: [{ type: 'alphabetical', order: 'asc' }],
        },
        {
          testPath: './sort-object-types/base-natural.ts',
          options: [{ type: 'natural', order: 'asc' }],
        },
        {
          testPath: './sort-object-types/base-line-length.ts',
          options: [{ type: 'line-length', order: 'desc' }],
        },
      ],
      rulePath: '../rules/sort-object-types.ts',
      name: 'Rule: sort-object-types',
      ruleId: 'sort-object-types',
    },
    {
      cases: [
        {
          testPath: './sort-objects/base-alphabetical.ts',
          options: [{ type: 'alphabetical', order: 'asc' }],
        },
        {
          testPath: './sort-objects/base-natural.ts',
          options: [{ type: 'natural', order: 'asc' }],
        },
        {
          testPath: './sort-objects/base-line-length.ts',
          options: [{ type: 'line-length', order: 'desc' }],
        },
      ],
      rulePath: '../rules/sort-objects.ts',
      name: 'Rule: sort-objects',
      ruleId: 'sort-objects',
    },
    {
      cases: [
        {
          testPath: './sort-sets/base-alphabetical.ts',
          options: [{ type: 'alphabetical', order: 'asc' }],
        },
        {
          testPath: './sort-sets/base-natural.ts',
          options: [{ type: 'natural', order: 'asc' }],
        },
        {
          testPath: './sort-sets/base-line-length.ts',
          options: [{ type: 'line-length', order: 'desc' }],
        },
      ],
      rulePath: '../rules/sort-sets.ts',
      name: 'Rule: sort-sets',
      ruleId: 'sort-sets',
    },
    {
      cases: [
        {
          testPath: './sort-switch-case/base-alphabetical.ts',
          options: [{ type: 'alphabetical', order: 'asc' }],
        },
        {
          testPath: './sort-switch-case/base-natural.ts',
          options: [{ type: 'natural', order: 'asc' }],
        },
        {
          testPath: './sort-switch-case/base-line-length.ts',
          options: [{ type: 'line-length', order: 'desc' }],
        },
      ],
      rulePath: '../rules/sort-switch-case.ts',
      name: 'Rule: sort-switch-case',
      ruleId: 'sort-switch-case',
    },
    {
      cases: [
        {
          testPath: './sort-union-types/base-alphabetical.ts',
          options: [{ type: 'alphabetical', order: 'asc' }],
        },
        {
          testPath: './sort-union-types/base-natural.ts',
          options: [{ type: 'natural', order: 'asc' }],
        },
        {
          testPath: './sort-union-types/base-line-length.ts',
          options: [{ type: 'line-length', order: 'desc' }],
        },
      ],
      rulePath: '../rules/sort-union-types.ts',
      name: 'Rule: sort-union-types',
      ruleId: 'sort-union-types',
    },
    {
      cases: [
        {
          testPath: './sort-variable-declarations/base-alphabetical.ts',
          options: [{ type: 'alphabetical', order: 'asc' }],
        },
        {
          testPath: './sort-variable-declarations/base-natural.ts',
          options: [{ type: 'natural', order: 'asc' }],
        },
        {
          testPath: './sort-variable-declarations/base-line-length.ts',
          options: [{ type: 'line-length', order: 'desc' }],
        },
      ],
      rulePath: '../rules/sort-variable-declarations.ts',
      name: 'Rule: sort-variable-declarations',
      ruleId: 'sort-variable-declarations',
    },
  ],
})
