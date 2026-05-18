import type { Container, PathSeparatorFunction } from "./types.js";
import { isNested } from "./util.js";
import { dotSeparator } from "./separator.js";

/**
 * Checks if a key exists in an object or array.
 *
 * @template {Container} T - Type of object or array
 * @template {keyof T & string} K - Key indexing T
 *
 * @param {T} input - The object or array to check
 * @param {string} path - The path using the configured separator notation
 * @param {PathSeparatorFunction} [separator=dotSeparator] - Function that splits the path into individual keys (default: dotSeparator)
 * @returns {boolean} `true` if the key exists, `false` otherwise.
 */
export function hasAtPath<T extends Container = Container, K extends keyof T & string = keyof T & string>(
  input: T,
  path: string,
  separator: PathSeparatorFunction = dotSeparator,
): boolean {
  const pathKeys = separator(path) as K[];
  let current = input;

  for (const key of pathKeys) {
    if (!isNested(current) || !(key in current)) {
      return false;
    }
    current = current[key] as T;
  }

  if (current === undefined) {
    return false;
  }

  return true;
}
