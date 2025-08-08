import type { TSESTree } from '@typescript-eslint/types'

/**
 * Core data structure representing a sortable element in the AST.
 *
 * This interface wraps AST nodes with metadata required for sorting operations.
 * Every element that needs to be sorted (imports, properties, class members,
 * etc.) is transformed into a SortingNode, providing a uniform interface for
 * all sorting algorithms across the plugin.
 *
 * The SortingNode abstraction allows the sorting logic to be decoupled from the
 * specific AST node types, making the sorting algorithms reusable across
 * different rule implementations.
 *
 * @template Node - Type of the underlying AST node, defaults to any
 *   TSESTree.Node.
 */
export interface SortingNode<Node extends TSESTree.Node = TSESTree.Node> {
  /**
   * Indicates whether a safety semicolon should be added when the node is moved
   * inline.
   *
   * Used to prevent Automatic Semicolon Insertion (ASI) issues when reordering
   * statements. For example, when moving a statement that starts with `[` or
   * `(` after another statement without a semicolon, a safety semicolon is
   * added to prevent the two statements from being incorrectly interpreted as
   * one.
   */
  addSafetySemicolonWhenInline?: boolean

  /**
   * Whether ESLint rules are disabled for this node via comments.
   *
   * When true, the node maintains its original position during sorting to
   * respect explicit disable directives like `eslint-disable-line` or
   * `eslint-disable-next-line`. This ensures that intentionally unsorted
   * elements remain in their specified positions.
   */
  isEslintDisabled: boolean

  /**
   * Identifier for the partition (independent sorting section) this node
   * belongs to.
   *
   * Partitions divide code into separate blocks that are sorted independently.
   * Nodes with different partition IDs are never moved across partition
   * boundaries, preserving logical code organization. Common partition
   * boundaries include:
   *
   * - Blank lines (when partitionByNewLine is enabled)
   * - Special comments (when partitionByComment is configured)
   * - Different code sections (e.g., imports vs code).
   */
  partitionId: number

  /**
   * The group identifier this node belongs to within the sorting configuration.
   *
   * Groups determine the high-level ordering of elements. Nodes are first
   * organized by group (e.g., 'external' imports before 'internal' imports),
   * then sorted within each group according to the sorting algorithm. The group
   * can be a predefined group, custom group, or 'unknown' for uncategorized
   * elements.
   */
  group: string

  /**
   * The string representation used for sorting comparisons.
   *
   * This is the primary value used when comparing nodes during sorting. The
   * exact content depends on the node type and rule implementation:
   *
   * - For imports: the module specifier ('react', './utils', etc.)
   * - For properties: the property key name
   * - For class members: the member name
   * - For union types: the type literal or identifier.
   *
   * The sorting algorithm uses this value for alphabetical, natural, or custom
   * sorting comparisons.
   */
  name: string

  /**
   * The size metric used for line-length sorting.
   *
   * Typically represents the character count of the node's source code,
   * excluding trailing punctuation like commas or semicolons. Used when the
   * sort type is 'line-length' to order elements from shortest to longest (or
   * vice versa based on order setting).
   */
  size: number

  /**
   * The underlying AST node from the TypeScript ESLint parser.
   *
   * Preserves the complete AST node information, allowing access to location
   * data, parent references, and type-specific properties. This is used when
   * generating fixes to know exactly what text to move and where it's located
   * in the source code.
   */
  node: Node
}
