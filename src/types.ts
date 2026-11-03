/** An object or array that can contain nested data, including readonly inputs. */
export type Container = object;

/** Callable parser shape used by the internal delimiter cache. */
export type PathSeparatorFunction = (path: string) => string[];

/** String delimiter; checked paths require one nonempty literal string. */
export type PathSeparator<D extends string = string> = D;

type IsAny<T> = 0 extends 1 & T ? true : false;
type IsUnion<T, Whole = T> = T extends Whole ? ([Whole] extends [T] ? false : true) : never;

type IsLiteralString<S extends string> = string extends S
  ? false
  : S extends ""
    ? true
    : S extends `${infer Head}${infer Tail}`
      ? string extends Head
        ? false
        : Head extends `${infer N extends number}`
          ? number extends N
            ? false
            : IsLiteralString<Tail>
          : Head extends `${infer N extends bigint}`
            ? bigint extends N
              ? false
              : IsLiteralString<Tail>
            : Uppercase<string> extends Head
              ? false
              : Lowercase<string> extends Head
                ? false
                : Capitalize<string> extends Head
                  ? false
                  : Uncapitalize<string> extends Head
                    ? false
                    : IsLiteralString<Tail>
      : false;

/**
 * Only a single, nonempty literal delimiter has a statically known grammar.
 */
export type LiteralDelimiter<D extends string> =
  true extends IsUnion<D> ? never : [D] extends [""] ? never : IsLiteralString<D> extends true ? D : never;

type Atomic = Function | Date | RegExp | ReadonlyMap<unknown, unknown> | ReadonlySet<unknown> | Promise<unknown>;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

type IsIndex<K extends string> = K extends `${bigint}`
  ? K extends `-${string}`
    ? false
    : K extends `${infer N extends number}`
      ? `${N}` extends K
        ? true
        : false
      : false
  : false;

// Index signatures (including template-pattern signatures) do not guarantee a key exists.
type DeclaredKeys<T> = keyof {
  [K in keyof T as {} extends Record<K, unknown> ? never : K]: T[K];
};
type ObjectKey<T, K extends string> = K extends keyof T
  ? K
  : K extends `${infer N extends number}`
    ? N extends keyof T
      ? N
      : never
    : never;

type HasKey<T, K extends string> =
  IsAny<T> extends true
    ? false
    : T extends Atomic
      ? false
      : T extends readonly unknown[]
        ? IsIndex<K> extends true
          ? K extends keyof T
            ? true
            : number extends T["length"]
              ? true
              : false
          : false
        : T extends object
          ? [ObjectKey<T, K>] extends [never]
            ? false
            : true
          : false;

type ReadKey<T, K extends string> =
  IsAny<T> extends true
    ? unknown
    : T extends readonly unknown[]
      ? IsIndex<K> extends true
        ? K extends keyof T
          ? T[K]
          : number extends T["length"]
            ? T[number] | undefined
            : undefined
        : undefined
      : T extends Atomic
        ? undefined
        : T extends object
          ? [ObjectKey<T, K>] extends [never]
            ? undefined
            : T[ObjectKey<T, K>] | (ObjectKey<T, K> extends DeclaredKeys<T> ? never : undefined)
          : undefined;

/** Resolve a literal path, retaining absence from optional ancestors and arrays. */
export type PathValue<T, P extends string, D extends string = "."> = P extends `${infer Head}${D}${infer Rest}`
  ? PathValue<ReadKey<T, Head>, Rest, D>
  : ReadKey<T, P>;

type ValidPath<T, P extends string, D extends string> = P extends `${infer Head}${D}${infer Rest}`
  ? true extends HasKey<T, Head>
    ? ValidPath<ReadKey<T, Head>, Rest, D>
    : false
  : true extends HasKey<T, P>
    ? true
    : false;

/** Validate the supplied path without imposing an autocomplete depth limit. */
export type CheckedPath<T, P extends string, D extends string = "."> = string extends P
  ? never
  : [LiteralDelimiter<D>] extends [never]
    ? never
    : [ValidPath<T, P, D>] extends [true]
      ? unknown
      : never;

type Keys<T> = T extends readonly unknown[]
  ? number extends T["length"]
    ? `${bigint}`
    : Extract<keyof T, `${number}`>
  : Extract<keyof T, string | number> extends infer K extends string | number
    ? `${K}`
    : never;

type SuggestedPaths<
  T,
  D extends string,
  Depth extends number,
  Seen extends unknown[] = [],
> = Seen["length"] extends Depth
  ? never
  : IsAny<T> extends true
    ? never
    : T extends Atomic
      ? never
      : T extends object
        ? {
            [K in Keys<T>]: K extends `${string}${D}${string}`
              ? never
              : K | `${K}${D}${SuggestedPaths<ReadKey<T, K>, D, Depth, [...Seen, unknown]>}`;
          }[Keys<T>]
        : never;

/** Path suggestions are bounded to keep editor work predictable on recursive schemas. */
export type Paths<T, D extends string = ".", Depth extends number = 2> = string extends D
  ? never
  : D extends ""
    ? never
    : SuggestedPaths<T, D, Depth>;

type CompletionKeys<T> = T extends readonly unknown[]
  ? Extract<keyof T, `${number}`>
  : Extract<DeclaredKeys<T>, string | number> extends infer K extends string | number
    ? `${K}`
    : never;
type Completions<T, D extends string, Seen extends unknown[] = []> = Seen["length"] extends 2
  ? never
  : IsAny<T> extends true
    ? never
    : T extends Atomic
      ? never
      : T extends object
        ? {
            [K in CompletionKeys<T>]: K extends `${string}${D}${string}`
              ? never
              : K | `${K}${D}${Completions<ReadKey<T, K>, D, [...Seen, unknown]>}`;
          }[CompletionKeys<T>]
        : never;

/** Finite suggestions plus validation of deeper paths and dictionary/array indices. */
export type PathArgument<T, P extends string, D extends string = "."> = P &
  (CheckedPath<T, P, D> | NoInfer<[LiteralDelimiter<D>] extends [never] ? never : Completions<T, D>>);

type WritableKeys<T> = keyof {
  [K in keyof T as Equal<Pick<T, K>, Mutable<Pick<T, K>>> extends true ? K : never]: T[K];
};
type WritableKey<T, K extends string> = T extends readonly unknown[]
  ? T extends unknown[]
    ? true
    : false
  : ObjectKey<T, K> extends infer Key extends keyof T
    ? Key extends DeclaredKeys<T>
      ? Equal<Pick<T, Key>, Mutable<Pick<T, Key>>>
      : K extends `${number}`
        ? number extends keyof T
          ? Equal<Pick<T, number>, Mutable<Pick<T, number>>>
          : Key extends WritableKeys<T>
            ? true
            : false
        : Key extends WritableKeys<T>
          ? true
          : false
    : false;

type IsTuple<T extends readonly unknown[]> =
  Extract<keyof T, `${number}`> extends never
    ? T extends readonly [...unknown[], unknown]
      ? true
      : number extends T["length"]
        ? false
        : true
    : true;

// Remove fixed leading slots before determining the value accepted by a rest array.
// A fixed trailing slot makes a dynamic position ambiguous, so it cannot be written safely.
type RestWriteValue<T extends readonly unknown[]> = T extends readonly [...unknown[], unknown]
  ? never
  : "0" extends keyof T
    ? T extends readonly [unknown?, ...infer Rest]
      ? RestWriteValue<Rest>
      : never
    : T[number];

type WriteBranch<T, P extends string, D extends string> = P extends `${infer Head}${D}${infer Rest}`
  ? HasKey<T, Head> extends true
    ? WriteValue<ReadKey<T, Head>, Rest, D>
    : never
  : HasKey<T, P> extends true
    ? WritableKey<T, P> extends true
      ? T extends readonly unknown[]
        ? P extends keyof T
          ? Required<T>[P]
          : RestWriteValue<T>
        : Required<T>[ObjectKey<T, P>]
      : never
    : never;

type WriteFunctions<T, P extends string, D extends string> = T extends unknown
  ? P extends unknown
    ? (value: WriteBranch<T, P, D>) => void
    : never
  : never;

/** A write must be valid for every possible input variant and supplied path. */
export type WriteValue<T, P extends string, D extends string = "."> = [NonNullable<T>] extends [never]
  ? never
  : WriteFunctions<NonNullable<T>, P, D> extends (value: infer V) => void
    ? V
    : never;

type DeleteBranch<T, P extends string, D extends string> = P extends `${infer Head}${D}${infer Rest}`
  ? HasKey<T, Head> extends true
    ? CanDelete<ReadKey<T, Head>, Rest, D>
    : false
  : HasKey<T, P> extends true
    ? WritableKey<T, P> extends true
      ? T extends readonly unknown[]
        ? IsTuple<T> extends true
          ? false
          : true
        : ObjectKey<T, P> extends DeclaredKeys<T>
          ? {} extends Pick<T, ObjectKey<T, P>>
            ? true
            : false
          : true
      : false
    : false;

type DeleteBranches<T, P extends string, D extends string> = T extends unknown
  ? P extends unknown
    ? DeleteBranch<T, P, D>
    : never
  : never;

type CanDelete<T, P extends string, D extends string> = [NonNullable<T>] extends [never]
  ? false
  : [DeleteBranches<NonNullable<T>, P, D>] extends [true]
    ? true
    : false;

/** Only optional properties and mutable, non-tuple array indices can be deleted. */
export type DeletablePath<T, P extends string, D extends string = "."> =
  CanDelete<T, P, D> extends true ? unknown : never;

/** A fallback replaces undefined, while null remains a value. */
export type WithDefault<V, F> = Exclude<V, undefined> | (undefined extends V ? F : never);
