/**
 * Copied from
 * https://github.com/sindresorhus/type-fest/blob/main/source/readonly-deep.d.ts.
 */
export type ReadonlyDeep<T> = T extends BuiltIns
  ? T
  : // eslint-disable-next-line typescript/no-explicit-any
    T extends new (...arguments_: any[]) => unknown
    ? T // Skip class constructors
    : // eslint-disable-next-line typescript/no-explicit-any
      T extends (...arguments_: any[]) => unknown
      ? // eslint-disable-next-line typescript/no-empty-object-type
        {} extends ReadonlyObjectDeep<T>
        ? T
        : HasMultipleCallSignatures<T> extends true
          ? T
          : ((...arguments_: Parameters<T>) => ReturnType<T>) &
              ReadonlyObjectDeep<T>
      : T extends Readonly<ReadonlyMap<infer KeyType, infer ValueType>>
        ? ReadonlyMapDeep<KeyType, ValueType>
        : T extends Readonly<ReadonlySet<infer ItemType>>
          ? ReadonlySetDeep<ItemType>
          : // Identify tuples to avoid converting them to arrays inadvertently; special case `readonly [...never[]]`, as it emerges undesirably from recursive invocations of ReadonlyDeep below.
            T extends readonly [...never[]] | readonly []
            ? readonly []
            : T extends readonly [infer U, ...infer V]
              ? readonly [ReadonlyDeep<U>, ...ReadonlyDeep<V>]
              : T extends readonly [...infer U, infer V]
                ? readonly [...ReadonlyDeep<U>, ReadonlyDeep<V>]
                : T extends readonly (infer ItemType)[]
                  ? readonly ReadonlyDeep<ItemType>[]
                  : T extends object
                    ? ReadonlyObjectDeep<T>
                    : unknown

type HasMultipleCallSignatures<
  // eslint-disable-next-line typescript/no-explicit-any
  T extends (...arguments_: any[]) => unknown,
> = T extends {
  (...arguments_: infer A): unknown
  (...arguments_: infer B): unknown
}
  ? B extends A
    ? A extends B
      ? false
      : true
    : true
  : false

/**
 * Same as `ReadonlyDeep`, but accepts only `object`s as inputs. Internal helper
 * for `ReadonlyDeep`.
 */
type ReadonlyObjectDeep<ObjectType extends object> = {
  readonly [KeyType in keyof ObjectType]: ReadonlyDeep<ObjectType[KeyType]>
}

/**
 * Same as `ReadonlyDeep`, but accepts only `ReadonlyMap`s as inputs. Internal
 * helper for `ReadonlyDeep`.
 */
type ReadonlyMapDeep<KeyType, ValueType> = Readonly<
  ReadonlyMap<ReadonlyDeep<KeyType>, ReadonlyDeep<ValueType>>
> & {}

/**
 * Same as `ReadonlyDeep`, but accepts only `ReadonlySet`s as inputs. Internal
 * helper for `ReadonlyDeep`.
 */
type ReadonlySetDeep<ItemType> = Readonly<
  ReadonlySet<ReadonlyDeep<ItemType>>
> & {}

type Primitive = undefined | boolean | string | number | symbol | bigint | null

// eslint-disable-next-line typescript/no-invalid-void-type
type BuiltIns = Primitive | RegExp | void | Date
