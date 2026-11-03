/**
 * An object or array that can contain nested data, including readonly inputs.
 */
export type Container = object;

/**
 * Describe the callable parser stored in the internal delimiter cache.
 */
export type PathSeparatorFunction = (path: string) => string[];

/**
 * Represent a string delimiter while preserving an optional literal type.
 *
 * @template D - Delimiter string type (defaults to string).
 */
export type PathSeparator<D extends string = string> = D;

/**
 * Check whether a type is any.
 *
 * @template T - Type to inspect.
 */
type IsAny<T> = 0 extends 1 & T ? true : false;
/**
 * Check whether a type contains multiple union members.
 *
 * @template T - Type or distributed union member to inspect.
 * @template Whole - Original union retained for comparison (defaults to T).
 */
type IsUnion<T, Whole = T> = T extends Whole ? ([Whole] extends [T] ? false : true) : never;

/**
 * Check whether a string type represents fixed text rather than an open string pattern.
 *
 * @template S - String type to inspect recursively.
 */
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
 * Keep a single nonempty literal delimiter, or return never if its grammar is unknown.
 *
 * @template D - Candidate string delimiter type.
 */
export type LiteralDelimiter<D extends string> =
  true extends IsUnion<D> ? never : [D] extends [""] ? never : IsLiteralString<D> extends true ? D : never;

/**
 * Built-in values treated as leaves by the checked path types.
 */
type Atomic = Function | Date | RegExp | ReadonlyMap<unknown, unknown> | ReadonlySet<unknown> | Promise<unknown>;
/**
 * Check whether two types are exactly equal.
 *
 * @template A - First type to compare.
 * @template B - Second type to compare.
 */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
/**
 * Remove readonly modifiers from the immediate properties of a type.
 *
 * @template T - Type whose properties should become writable.
 */
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/**
 * Check whether a string is a canonical nonnegative integer index.
 *
 * @template K - String path segment to inspect.
 */
type IsIndex<K extends string> = K extends `${bigint}`
  ? K extends `-${string}`
    ? false
    : K extends `${infer N extends number}`
      ? `${N}` extends K
        ? true
        : false
      : false
  : false;

/**
 * Extract explicitly declared keys, excluding broad and template-pattern index signatures.
 *
 * @template T - Object type whose declared keys should be extracted.
 */
type DeclaredKeys<T> = keyof {
  [K in keyof T as {} extends Record<K, unknown> ? never : K]: T[K];
};
/**
 * Match a string path segment to a string or numeric object key.
 *
 * @template T - Object type to index.
 * @template K - String path segment to resolve.
 */
type ObjectKey<T, K extends string> = K extends keyof T
  ? K
  : K extends `${infer N extends number}`
    ? N extends keyof T
      ? N
      : never
    : never;

/**
 * Check whether a type supports a traversable property or array index.
 *
 * @template T - Type or union of types to inspect.
 * @template K - String path segment to check.
 */
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

/**
 * Resolve one path segment, including undefined when its value may be absent.
 *
 * @template T - Type or union of types to read.
 * @template K - String property name or array index to resolve.
 */
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

/**
 * Resolve a literal path while retaining possible absence from ancestors and array indices.
 *
 * @template T - Root type to traverse.
 * @template P - Literal path whose value should be resolved.
 * @template D - String delimiter between path segments (defaults to dot).
 */
export type PathValue<T, P extends string, D extends string = "."> = P extends `${infer Head}${D}${infer Rest}`
  ? PathValue<ReadKey<T, Head>, Rest, D>
  : ReadKey<T, P>;

/**
 * Check whether the input shape supports every segment of a literal path.
 *
 * @template T - Type at the current traversal position.
 * @template P - Remaining literal path to validate.
 * @template D - String delimiter between path segments.
 */
type ValidPath<T, P extends string, D extends string> = P extends `${infer Head}${D}${infer Rest}`
  ? true extends HasKey<T, Head>
    ? ValidPath<ReadKey<T, Head>, Rest, D>
    : false
  : true extends HasKey<T, P>
    ? true
    : false;

/**
 * Return unknown for a valid literal path, or never for an invalid path or delimiter.
 *
 * @template T - Root type against which the path is checked.
 * @template P - Candidate literal path or union of literal paths.
 * @template D - Known nonempty literal delimiter (defaults to dot).
 */
export type CheckedPath<T, P extends string, D extends string = "."> = string extends P
  ? never
  : [LiteralDelimiter<D>] extends [never]
    ? never
    : [ValidPath<T, P, D>] extends [true]
      ? unknown
      : never;

/**
 * Build candidate string keys for objects, tuples, and ordinary array index patterns.
 *
 * @template T - Container type whose candidate keys should be generated.
 */
type Keys<T> = T extends readonly unknown[]
  ? number extends T["length"]
    ? `${bigint}`
    : Extract<keyof T, `${number}`>
  : Extract<keyof T, string | number> extends infer K extends string | number
    ? `${K}`
    : never;

/**
 * Generate nested path suggestions up to a configured traversal depth.
 *
 * @template T - Type at the current traversal position.
 * @template D - String delimiter used to join path segments.
 * @template Depth - Maximum number of path segments to suggest.
 * @template Seen - Tuple tracking the current recursion depth (defaults to an empty tuple).
 */
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

/**
 * Generate bounded path suggestions to keep editor work predictable on recursive schemas.
 *
 * @template T - Root type whose paths should be suggested.
 * @template D - String delimiter between segments (defaults to dot).
 * @template Depth - Maximum number of path segments to suggest (defaults to 2).
 */
export type Paths<T, D extends string = ".", Depth extends number = 2> = string extends D
  ? never
  : D extends ""
    ? never
    : SuggestedPaths<T, D, Depth>;

/**
 * Extract finite declared keys and fixed tuple indices for editor completions.
 *
 * @template T - Container type whose completion keys should be extracted.
 */
type CompletionKeys<T> = T extends readonly unknown[]
  ? Extract<keyof T, `${number}`>
  : Extract<DeclaredKeys<T>, string | number> extends infer K extends string | number
    ? `${K}`
    : never;
/**
 * Generate finite editor path completions bounded to two segments.
 *
 * @template T - Type at the current traversal position.
 * @template D - String delimiter used to join completion segments.
 * @template Seen - Tuple tracking the current recursion depth (defaults to an empty tuple).
 */
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

/**
 * Combine literal path validation with finite editor suggestions.
 *
 * @template T - Root type against which the path is checked.
 * @template P - Inferred literal path supplied by the caller.
 * @template D - Known nonempty literal delimiter (defaults to dot).
 */
export type PathArgument<T, P extends string, D extends string = "."> = P &
  (CheckedPath<T, P, D> | NoInfer<[LiteralDelimiter<D>] extends [never] ? never : Completions<T, D>>);

/**
 * Extract keys whose properties or index signatures are writable.
 *
 * @template T - Object type whose writable keys should be extracted.
 */
type WritableKeys<T> = keyof {
  [K in keyof T as Equal<Pick<T, K>, Mutable<Pick<T, K>>> extends true ? K : never]: T[K];
};
/**
 * Check whether a resolved object key or array position is writable.
 *
 * @template T - Container type that holds the destination.
 * @template K - String path segment identifying the destination.
 */
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

/**
 * Distinguish fixed and variadic tuples from ordinary array types.
 *
 * @template T - Array or tuple type to inspect.
 */
type IsTuple<T extends readonly unknown[]> =
  Extract<keyof T, `${number}`> extends never
    ? T extends readonly [...unknown[], unknown]
      ? true
      : number extends T["length"]
        ? false
        : true
    : true;

// Remove fixed leading slots before determining the value accepted by a rest array.
/**
 * Resolve safe rest-element writes after fixed leading slots; reject fixed trailing slots.
 *
 * @template T - Array or tuple whose rest element type should be resolved.
 */
type RestWriteValue<T extends readonly unknown[]> = T extends readonly [...unknown[], unknown]
  ? never
  : "0" extends keyof T
    ? T extends readonly [unknown?, ...infer Rest]
      ? RestWriteValue<Rest>
      : never
    : T[number];

/**
 * Resolve the accepted write value for one input variant and one literal path.
 *
 * @template T - Input variant at the current traversal position.
 * @template P - Remaining literal path to the destination.
 * @template D - String delimiter between path segments.
 */
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

/**
 * Distribute input and path unions into function parameters for safe write intersections.
 *
 * @template T - Input type or union of possible input variants.
 * @template P - Literal path or union of possible paths.
 * @template D - String delimiter between path segments.
 */
type WriteFunctions<T, P extends string, D extends string> = T extends unknown
  ? P extends unknown
    ? (value: WriteBranch<T, P, D>) => void
    : never
  : never;

/**
 * Resolve values assignable to every possible input variant and path destination.
 *
 * @template T - Root type or union of possible input types.
 * @template P - Literal path or union of possible destination paths.
 * @template D - String delimiter between path segments (defaults to dot).
 */
export type WriteValue<T, P extends string, D extends string = "."> = [NonNullable<T>] extends [never]
  ? never
  : WriteFunctions<NonNullable<T>, P, D> extends (value: infer V) => void
    ? V
    : never;

/**
 * Check whether one input variant permits deletion at a literal path.
 *
 * @template T - Input variant at the current traversal position.
 * @template P - Remaining literal path to the property or array index.
 * @template D - String delimiter between path segments.
 */
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

/**
 * Distribute deletion checks across all input variants and possible paths.
 *
 * @template T - Input type or union of possible input variants.
 * @template P - Literal path or union of possible deletion paths.
 * @template D - String delimiter between path segments.
 */
type DeleteBranches<T, P extends string, D extends string> = T extends unknown
  ? P extends unknown
    ? DeleteBranch<T, P, D>
    : never
  : never;

/**
 * Check whether deletion is safe for every non-null input variant and possible path.
 *
 * @template T - Type or union of types containing the deletion target.
 * @template P - Literal path or union of possible deletion paths.
 * @template D - String delimiter between path segments.
 */
type CanDelete<T, P extends string, D extends string> = [NonNullable<T>] extends [never]
  ? false
  : [DeleteBranches<NonNullable<T>, P, D>] extends [true]
    ? true
    : false;

/**
 * Allow mutable optional properties, dictionary entries, and ordinary array indices to be deleted.
 *
 * @template T - Root type containing the deletion target.
 * @template P - Literal path or union of possible deletion paths.
 * @template D - String delimiter between path segments (defaults to dot).
 */
export type DeletablePath<T, P extends string, D extends string = "."> =
  CanDelete<T, P, D> extends true ? unknown : never;

/**
 * Replace possible undefined with a fallback type while retaining null and other values.
 *
 * @template V - Resolved value type before applying a fallback.
 * @template F - Fallback type used when the value can be undefined.
 */
export type WithDefault<V, F> = Exclude<V, undefined> | (undefined extends V ? F : never);
