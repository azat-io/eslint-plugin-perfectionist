import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, it } from 'vitest'
import dedent from 'dedent'

import rule from '../../rules/separate-type-partitions'

describe('separate-type-partitions', () => {
  let { invalid, valid } = createRuleTester({
    name: 'separate-type-partitions',
    parser: typescriptParser,
    rule,
  })

  describe('invalid', () => {
    it('adds a blank line between adjacent type and value imports', async () => {
      await invalid({
        output: dedent`
          import type { A } from 'a';

          import { B } from 'b';
        `,
        code: dedent`
          import type { A } from 'a';
          import { B } from 'b';
        `,
        errors: [{ messageId: 'separateTypePartitions' }],
      })
    })

    it('adds a single blank line between type and value blocks', async () => {
      await invalid({
        output: dedent`
          import type { A } from 'a';
          import type { B } from 'b';

          import { C } from 'c';
          import { D } from 'd';
        `,
        code: dedent`
          import type { A } from 'a';
          import type { B } from 'b';
          import { C } from 'c';
          import { D } from 'd';
        `,
        errors: [{ messageId: 'separateTypePartitions' }],
      })
    })

    it('separates value imports from following type imports', async () => {
      await invalid({
        output: dedent`
          import type { B } from 'b';

          import { A } from 'a';
        `,
        code: dedent`
          import { A } from 'a';
          import type { B } from 'b';
        `,
        errors: [{ messageId: 'separateTypePartitions' }],
      })
    })

    it('treats inline type specifiers as value imports', async () => {
      await invalid({
        output: dedent`
          import type { A } from 'a';

          import { type B } from 'b';
        `,
        code: dedent`
          import type { A } from 'a';
          import { type B } from 'b';
        `,
        errors: [{ messageId: 'separateTypePartitions' }],
      })
    })

    it('inserts blank lines for mixed type/value order in one partition', async () => {
      await invalid({
        output: dedent`
          import type { A } from 'a';
          import type { C } from 'c';

          import { B } from 'b';
          import { D } from 'd';
        `,
        code: dedent`
          import type { A } from 'a';
          import { B } from 'b';
          import type { C } from 'c';
          import { D } from 'd';
        `,
        errors: [{ messageId: 'separateTypePartitions' }],
      })
    })

    it('preserves CRLF line endings', async () => {
      await invalid({
        output: "import type { A } from 'a';\r\n\r\nimport { B } from 'b';\r\n",
        code: "import type { A } from 'a';\r\nimport { B } from 'b';\r\n",
        errors: [{ messageId: 'separateTypePartitions' }],
      })
    })

    it('keeps same-line separators with reordering', async () => {
      await invalid({
        output:
          "/* note */ import type { B } from 'b';\n\nimport { A } from 'a';",
        code: "import { A } from 'a'; /* note */ import type { B } from 'b';",
        errors: [{ messageId: 'separateTypePartitions' }],
      })
    })

    it('reorders mixed blocks with default imports', async () => {
      await invalid({
        output: dedent`
          import type { A } from 'a';
          import type { C } from 'c';

          import React from 'react';
          import { B } from 'b';
          import D from 'd';
        `,
        code: dedent`
          import React from 'react';
          import type { A } from 'a';
          import { B } from 'b';
          import type { C } from 'c';
          import D from 'd';
        `,
        errors: [{ messageId: 'separateTypePartitions' }],
      })
    })

    it('reorders mixed blocks with default and named imports', async () => {
      await invalid({
        output: dedent`
          import type { Bar } from 'bar';
          import type { Qux } from 'qux';

          import Foo, { foo } from 'foo';
          import Baz from 'baz';
          import { quux } from 'quux';
        `,
        code: dedent`
          import Foo, { foo } from 'foo';
          import type { Bar } from 'bar';
          import Baz from 'baz';
          import type { Qux } from 'qux';
          import { quux } from 'quux';
        `,
        errors: [{ messageId: 'separateTypePartitions' }],
      })
    })
  })

  describe('valid', () => {
    it('accepts already separated type and value imports', async () => {
      await valid({
        code: dedent`
          import type { A } from 'a';

          import { B } from 'b';
        `,
      })
    })

    it('accepts consecutive imports of the same kind', async () => {
      await valid({
        code: dedent`
          import { A } from 'a';
          import { B } from 'b';
        `,
      })
    })

    it('ignores non-import statements between partitions', async () => {
      await valid({
        code: dedent`
          import type { A } from 'a';
          const value = 1;
          import { B } from 'b';
        `,
      })
    })

    it('ignores files without imports', async () => {
      await valid({
        code: dedent`
          const value = 1;
          function demo() {
            return value;
          }
        `,
      })
    })

    it('accepts separated blocks with more than three imports', async () => {
      await valid({
        code: dedent`
          import type { A } from 'a';
          import type { B } from 'b';
          import type { C } from 'c';
          import type { D } from 'd';

          import E from 'e';
          import { F } from 'f';
          import G from 'g';
          import { H } from 'h';
        `,
      })
    })

    it('accepts multiple partitions with some already valid', async () => {
      await valid({
        code: dedent`
          import type { A } from 'a';
          import type { B } from 'b';
          import type { C } from 'c';

          import D from 'd';
          import { E } from 'e';
          import F from 'f';

          import { G } from 'g';
          import { H } from 'h';
          import { I } from 'i';
        `,
      })
    })

    it('accepts default imports in both type and value blocks', async () => {
      await valid({
        code: dedent`
          import type { A } from 'a';
          import type { B } from 'b';
          import type { C } from 'c';

          import React from 'react';
          import Foo, { foo } from 'foo';
          import Bar from 'bar';
        `,
      })
    })

    it('accepts multiple partitions with mixed valid blocks', async () => {
      await valid({
        code: dedent`
          import type { A } from 'a';
          import type { C } from 'c';

          import { B } from 'b';
          import { D } from 'd';

          import type { E } from 'e';
          import type { F } from 'f';
          import type { G } from 'g';

          import H from 'h';
          import { I } from 'i';
          import J from 'j';
        `,
      })
    })
  })

  describe('mixed partitions', () => {
    it('fixes only the violating partition and keeps valid ones', async () => {
      await invalid({
        output: dedent`
          import type { A } from 'a';
          import type { C } from 'c';

          import { B } from 'b';
          import { D } from 'd';

          import type { Bar } from 'bar';
          import type { Qux } from 'qux';

          import Foo, { foo } from 'foo';
          import Baz from 'baz';
          import { quux } from 'quux';
        `,
        code: dedent`
          import type { A } from 'a';
          import type { C } from 'c';

          import { B } from 'b';
          import { D } from 'd';

          import Foo, { foo } from 'foo';
          import type { Bar } from 'bar';
          import Baz from 'baz';
          import type { Qux } from 'qux';
          import { quux } from 'quux';
        `,
        errors: [{ messageId: 'separateTypePartitions' }],
      })
    })

    it('fixes multiple violating partitions while preserving valid ones', async () => {
      await invalid({
        output: dedent`
          import type { A } from 'a';
          import type { C } from 'c';

          import { B } from 'b';
          import { D } from 'd';

          import type { E } from 'e';
          import type { F } from 'f';
          import type { G } from 'g';

          import type { H } from 'h';
          import type { J } from 'j';

          import React from 'react';
          import { I } from 'i';
        `,
        code: dedent`
          import type { A } from 'a';
          import { B } from 'b';
          import type { C } from 'c';
          import { D } from 'd';

          import type { E } from 'e';
          import type { F } from 'f';
          import type { G } from 'g';

          import React from 'react';
          import type { H } from 'h';
          import { I } from 'i';
          import type { J } from 'j';
        `,
        errors: [
          { messageId: 'separateTypePartitions' },
          { messageId: 'separateTypePartitions' },
        ],
      })
    })
  })
})
