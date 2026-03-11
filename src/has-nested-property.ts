import type { PathSeparatorFunction } from "./types.js";
import { dotSeparator, isObj } from "./util.js";

/**
 * Checks if a key exists in an object using dot notation.
 *
 * @template {Record<string, unknown>} T - Type of object
 * @param {T} obj - The object containing variables.
 * @param {string} path - The variable name using dot notation.
 * @param {PathSeparatorFunction} [separator=dotSeparator] - Function that splits the path into individual keys (default: dotSeparator)
 * @returns {booelan} `true` if the key exists in the object, and `false` if does not.
 */
export function hasNestedProperty<T extends Record<string, unknown> = Record<string, unknown>>(
  obj: T,
  path: string,
  separator: PathSeparatorFunction = dotSeparator,
): boolean {
  const pathKeys = separator(path);
  let current: T = obj;

  for (const key of pathKeys) {
    if (!isObj(current) || !(key in current)) {
      return false;
    }
    current = current[key] as T;
  }

  if (current === undefined) {
    return false;
  }

  return true;
}
