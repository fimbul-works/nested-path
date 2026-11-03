import { isUndef } from "@fimbul-works/hvat";
import { createSeparator, dotSeparator } from "./separator.js";
import type { Container, PathSeparatorFunction } from "./types.js";
import { isNested } from "./util.js";

/**
 * Check whether a runtime path resolves to a value other than undefined.
 *
 * Accepts arbitrary string paths and parser callbacks. Null counts as present;
 * missing keys and non-traversable ancestors return false. Inherited properties
 * are included. This boolean check does not narrow the input's static type.
 *
 * @param input - Object or array to inspect without mutation.
 * @param path - Runtime path to check.
 * @param separator - Parser for the path; defaults to {@link dotSeparator}.
 * @returns True when the path resolves to a value other than undefined.
 * @example
 * ```ts
 * hasAtPath({ user: { name: "Odin" } }, "user.name"); // true
 * hasAtPath({ user: {} }, "user.name"); // false
 * ```
 */
export function hasAtPath(input: Container, path: string, separator: string = dotSeparator): boolean {
  const parse = createSeparator(separator);

  let current: unknown = input;
  for (const key of parse(path)) {
    if (!isNested(current) || !(key in current)) {
      return false;
    }
    current = current[key];
  }

  return !isUndef(current);
}
