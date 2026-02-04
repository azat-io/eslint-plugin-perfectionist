import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, it } from 'vitest'
import dedent from 'dedent'

import rule from '../../rules/separate-type-imports'

describe('separate-type-imports', () => {
  let { invalid, valid } = createRuleTester({
    name: 'separate-type-imports',
    parser: typescriptParser,
    rule,
  })

  describe('default behavior', () => {
    it('splits mixed inline type and value imports', async () => {
      await invalid({
        output: dedent`
          import type { ComponentProps } from 'react';

          import { useState, useEffect } from 'react';
        `,
        code: dedent`
          import { useState, type ComponentProps, useEffect } from 'react';
        `,
        errors: [{ messageId: 'separateTypeImports' }],
      })
    })

    it('converts type-only named imports to import type', async () => {
      await invalid({
        code: dedent`
          import { type User, type Profile } from './types';
        `,
        output: dedent`
          import type { User, Profile } from './types';
        `,
        errors: [{ messageId: 'useImportType' }],
      })
    })

    it('normalizes multiline type-only imports without comments', async () => {
      await invalid({
        code: dedent`
          import {
            type CriterionConfig,
            type CriterionOperatorEnum,
          } from '@crm-ui/graphql/generated';
        `,
        output: dedent`
          import type { CriterionConfig, CriterionOperatorEnum } from '@crm-ui/graphql/generated';
        `,
        errors: [{ messageId: 'useImportType' }],
      })
    })

    it('splits default and inline type named imports', async () => {
      await invalid({
        output: dedent`
          import type { FC } from 'react';

          import React, { useState } from 'react';
        `,
        code: dedent`
          import React, { type FC, useState } from 'react';
        `,
        errors: [{ messageId: 'separateTypeImports' }],
      })
    })

    it('splits default imports when only type named imports remain', async () => {
      await invalid({
        output: dedent`
          import type { FC } from 'react';

          import React from 'react';
        `,
        code: dedent`
          import React, { type FC } from 'react';
        `,
        errors: [{ messageId: 'separateTypeImports' }],
      })
    })

    it('splits aliased type imports from values', async () => {
      await invalid({
        output: dedent`
          import type { User as UserType } from './utils';

          import { getName } from './utils';
        `,
        code: dedent`
          import { type User as UserType, getName } from './utils';
        `,
        errors: [{ messageId: 'separateTypeImports' }],
      })
    })

    it('separates extracted type imports into their own partition', async () => {
      await invalid({
        output: dedent`
          import foo from 'foo';

          import type { Baz } from 'c';

          import { a } from 'a';
          import { b } from 'b';

          import { c } from 'c';
        `,
        code: dedent`
          import foo from 'foo';

          import { a } from 'a';
          import { b } from 'b';
          import { c, type Baz } from 'c';
        `,
        errors: [{ messageId: 'separateTypeImports' }],
      })
    })

    it('handles trailing commas in mixed imports', async () => {
      await invalid({
        output: dedent`
          import type { Bar } from './mod';

          import { foo } from './mod';
        `,
        code: dedent`
          import { foo, type Bar, } from './mod';
        `,
        errors: [{ messageId: 'separateTypeImports' }],
      })
    })

    it('keeps inline comments during splitting', async () => {
      await invalid({
        output: dedent`
          import type { Bar } from './mod';

          import { foo, /* keep */ } from './mod';
        `,
        code: dedent`
          import { foo, /* keep */ type Bar } from './mod';
        `,
        errors: [{ messageId: 'separateTypeImports' }],
      })
    })
  })

  describe('options', () => {
    it('supports value-first ordering', async () => {
      await invalid({
        output: dedent`
          import { foo } from './mod';

          import type { Bar } from './mod';
        `,
        code: dedent`
          import { foo, type Bar } from './mod';
        `,
        errors: [{ messageId: 'separateTypeImports' }],
        options: [{ order: 'value-first' }],
      })
    })

    it('keeps a blank line partition even when blankLine is never', async () => {
      await invalid({
        output: dedent`
          import type { Bar } from './mod'

          import { foo } from './mod'
        `,
        code: dedent`
          import { foo, type Bar } from './mod'
        `,
        errors: [{ messageId: 'separateTypeImports' }],
        options: [{ blankLine: 'never' }],
      })
    })

    it('preserves CRLF line endings', async () => {
      await invalid({
        output:
          "import type { Bar } from './mod';\r\n\r\nimport { foo } from './mod';\r\n",
        code: "import { foo, type Bar } from './mod';\r\n",
        errors: [{ messageId: 'separateTypeImports' }],
      })
    })
  })

  describe('valid', () => {
    it('accepts already separated imports', async () => {
      await valid({
        code: dedent`
          import type { FC } from 'react';

          import React, { useState } from 'react';
        `,
      })
    })

    it('accepts type-only imports', async () => {
      await valid({
        code: dedent`
          import type { User, Profile } from './types';
        `,
      })
    })
  })

  describe('misc', () => {
    it('uses type-first ordering with a blank line by default', async () => {
      await invalid({
        output: dedent`
          import type { Bar } from './mod';

          import { foo } from './mod';
        `,
        code: dedent`
          import { foo, type Bar } from './mod';
        `,
        errors: [{ messageId: 'separateTypeImports' }],
      })
    })
  })
})
