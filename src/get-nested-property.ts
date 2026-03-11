import type { PathSeparatorFunction } from "./types.js";
import { dotSeparator } from "./util.js";

/**
 * Retrieves a nested value from an object.
 *
 * @template V - Expected type of the ressult
 * @template {Record<string, unknown>} T - Type of object
 * @param {T} obj - The context object to reatrieve a value from
 * @param {string} path - The path to parse
 * @param {V} [defaultValue] - Optional value to return when the requested path is not found
 * @param {PathSeparatorFunction} [separator=dotSeparator] - Function that splits the path into individual keys (default: dotSeparator)
 * @returns {V} The value of the variable, or `defaultValue` if not found.
 */
export function getNestedProperty<V = any, T extends Record<string, unknown> = Record<string, unknown>>(
  obj: T,
  path: string,
  defaultValue?: V,
  separator: PathSeparatorFunction = dotSeparator,
): V {
  return separator(path).reduce<any>(
    (current: T, key: string) => (current?.[key] !== undefined ? current[key] : defaultValue),
    obj,
  ) as V;
}
