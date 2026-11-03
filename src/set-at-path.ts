import { isUndef } from "@fimbul-works/hvat";
import { createSeparator, dotSeparator } from "./separator.js";
import type { Container, PathArgument, LiteralDelimiter, WriteValue } from "./types.js";
import { isNested } from "./util.js";

/**
 * Assign a value at a checked path using a literal string delimiter.
 *
 * Mutates the input in place. The value must fit every possible destination;
 * readonly destinations and undeclared fields are rejected at compile time.
 * Intermediate containers must already exist at runtime.
 *
 * @typeParam T - Type of the input object or array.
 * @typeParam P - Literal path to update.
 * @typeParam D - Literal string delimiter used to interpret the path.
 * @param input - Object or array to mutate.
 * @param path - Checked path interpreted using the supplied string delimiter.
 * @param value - Value assignable to every possible destination of the path.
 * @param separator - Nonempty literal string delimiter. (Default: {@link dotSeparator})
 * @returns True if the mutation succeeds; false if the path cannot be traversed or the mutation fails.
 * @throws {TypeError} If the separator is not a nonempty string.
 * @example
 * ```ts
 * const input = { user: { name: "Odin" } };
 * setAtPath(input, "user/name", "Thor", slashSeparator);
 * ```
 */
export function setAtPath<T extends Container, const P extends string, const D extends string>(
  input: T,
  path: PathArgument<NoInfer<T>, P, NoInfer<D>>,
  value: NoInfer<WriteValue<T, P, D>>,
  separator: D & LiteralDelimiter<NoInfer<D>>,
): boolean;
export function setAtPath<T extends Container, const P extends string>(
  input: T,
  path: PathArgument<NoInfer<T>, P>,
  value: NoInfer<WriteValue<T, P>>,
  separator?: undefined,
): boolean;
export function setAtPath(input: Container, path: string, value: unknown, separator: string = dotSeparator): boolean {
  const parse = createSeparator(separator);

  try {
    const keys = parse(path);
    const lastKey = keys.pop();
    if (isUndef(lastKey)) {
      return false;
    }
    let current: unknown = input;
    for (const key of keys) {
      if (!isNested(current)) {
        return false;
      }
      current = current[key];
    }
    return isNested(current) && Reflect.set(current, lastKey, value);
  } catch {
    return false;
  }
}
