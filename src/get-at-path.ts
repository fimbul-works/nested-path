import { isNullish, isUndef } from "@fimbul-works/hvat";
import { createSeparator, dotSeparator } from "./separator.js";
import type { Container, PathArgument, LiteralDelimiter, PathValue, WithDefault } from "./types.js";

/**
 * Retrieve a value at a checked literal path using a literal string delimiter.
 *
 * Optional ancestors, missing dictionary entries, and ordinary array lookups can
 * produce `undefined`. The fallback replaces `undefined`, while `null` is retained.
 * Traversal stops immediately when a lookup fails.
 *
 * @typeParam T - Type of the input object or array.
 * @typeParam P - Literal path to retrieve.
 * @typeParam D - Literal string delimiter used to interpret the path.
 * @typeParam F - Type of the fallback value.
 * @param input - Object or array to read without mutation.
 * @param path - Path interpreted using the supplied string delimiter.
 * @param defaultValue - Value returned when traversal fails or the leaf is undefined.
 * Pass `undefined` to read without a fallback.
 * @param separator - Nonempty literal string delimiter, such as "/" or "::".
 * @returns The inferred path value, with possible undefined replaced by the fallback type.
 * @throws {TypeError} If the separator is not a nonempty string.
 * @example
 * ```ts
 * const input = { user: { name: "Odin" } };
 * getAtPath(input, "user/name", undefined, slashSeparator); // string
 * ```
 */
export function getAtPath<T extends Container, const P extends string, const D extends string, F>(
  input: T,
  path: PathArgument<NoInfer<T>, P, NoInfer<D>>,
  defaultValue: F,
  separator: D & LiteralDelimiter<NoInfer<D>>,
): WithDefault<PathValue<T, P, D>, F>;

/**
 * Retrieve a value at a checked dot-separated path with a fallback.
 *
 * @typeParam T - Type of the input object or array.
 * @typeParam P - Literal dot-separated path to retrieve.
 * @typeParam F - Type of the fallback value.
 * @param input - Object or array to read without mutation.
 * @param path - Checked path using dot notation.
 * @param defaultValue - Value returned for a missing or undefined result; null is retained.
 * @param separator - Nonempty literal string delimiter. (Default: {@link dotSeparator})
 * @returns The inferred path value, with possible undefined replaced by the fallback type.
 * @throws {TypeError} If the separator is not a nonempty string.
 */
export function getAtPath<T extends Container, const P extends string, F>(
  input: T,
  path: PathArgument<NoInfer<T>, P>,
  defaultValue: F,
  separator?: undefined,
): WithDefault<PathValue<T, P>, F>;
/**
 * Retrieve a value at a checked dot-separated path without a fallback.
 *
 * @typeParam T - Type of the input object or array.
 * @typeParam P - Literal dot-separated path to retrieve.
 * @param input - Object or array to read without mutation.
 * @param path - Checked path using dot notation.
 * @param defaultValue - Omit or pass undefined to read without a fallback.
 * @param separator - Nonempty literal string delimiter. (Default: {@link dotSeparator})
 * @returns The inferred path value, including undefined when traversal can fail.
 */
export function getAtPath<T extends Container, const P extends string>(
  input: T,
  path: PathArgument<NoInfer<T>, P>,
  defaultValue?: undefined,
  separator?: undefined,
): PathValue<T, P>;
export function getAtPath(
  input: Container,
  path: string,
  defaultValue?: unknown,
  separator: string = dotSeparator,
): unknown {
  const parse = createSeparator(separator);

  let current: unknown = input;
  for (const key of parse(path)) {
    if (isNullish(current)) {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[key];
    if (isUndef(current)) {
      return defaultValue;
    }
  }
  return current;
}
