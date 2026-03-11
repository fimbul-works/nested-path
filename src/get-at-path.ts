import type { Container, PathSeparatorFunction } from "./types.js";
import { dotSeparator } from "./util.js";

/**
 * Retrieves a nested value from an object or array.
 *
 * @template V - Expected type of the result
 * @template {Container} T - Type of object or array
 * @param {T} input - The context object or array to retrieve a value from
 * @param {string} path - The path to parse
 * @param {V} [defaultValue] - Optional value to return when the requested path is not found
 * @param {PathSeparatorFunction} [separator=dotSeparator] - Function that splits the path into individual keys (default: dotSeparator)
 * @returns {V} The value at the path, or `defaultValue` if not found.
 */
export function getAtPath<V = any, T extends Container = Container>(
  input: T,
  path: string,
  defaultValue?: V,
  separator: PathSeparatorFunction = dotSeparator,
): V {
  return separator(path).reduce<any>(
    (current, key) => (current?.[key] !== undefined ? current[key] : defaultValue),
    input,
  ) as V;
}
