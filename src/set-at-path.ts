import type { Container, PathSeparatorFunction } from "./types.js";
import { dotSeparator, isObjOrArray } from "./util.js";

/**
 * Assigns a value to the context object or array.
 *
 * @template V - Type of value to set
 * @template {Container} T - Type of object or array
 * @template {keyof T & string} K - Key indexing T
 * @param {T} input - The context object or array containing variables
 * @param {string} path - The variable name using dot notation
 * @param {V} value - The new value to set
 * @param {PathSeparatorFunction} [separator=dotSeparator] - Function that splits the path into individual keys (default: dotSeparator)
 */
export function setAtPath<V = any, T extends Container = Container, K extends keyof T & string = keyof T & string>(
  input: T,
  path: string,
  value: V,
  separator: PathSeparatorFunction = dotSeparator,
): void {
  const pathKeys = separator(path) as K[];
  const lastKey = pathKeys.pop() as K;
  let current = input;

  for (const key of pathKeys) {
    if (!isObjOrArray<T>(current)) {
      throw new Error(`Key '${key}' in path '${path}' is not an object`);
    }
    current = current[key] as T;
  }

  if (!isObjOrArray<T>(current)) {
    throw new Error(`Key '${lastKey}' in path '${path}' not found`);
  }

  current[lastKey] = value as T[K];
}
