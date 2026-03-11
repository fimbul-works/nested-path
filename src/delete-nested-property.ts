import type { Container, PathSeparatorFunction } from "./types.js";
import { dotSeparator, isObjOrArray } from "./util.js";

/**
 * Delete a nested property.
 *
 * @template {Container} T - Type of object or array
 * @template {keyof T & string} K - Key indexing T
 * @param {T} input - The context object or array containing variables.
 * @param {string} path - The variable name using dot notation.
 * @param {PathSeparatorFunction} [separator=dotSeparator] - Function that splits the path into individual keys (default: dotSeparator)
 */
export function deleteNestedProperty<T extends Container = Container, K extends keyof T & string = keyof T & string>(
  input: T,
  path: string,
  separator: PathSeparatorFunction = dotSeparator,
): void {
  const keys = separator(path) as K[];
  const lastKey = keys.pop() as K;
  let current = input;

  for (const key of keys) {
    if (!isObjOrArray<T>(current)) {
      throw new Error(`Key '${key}' in path '${path}' not found`);
    }
    current = current[key] as T;
  }

  if (!isObjOrArray<T>(current)) {
    throw new Error(`Key '${lastKey}' in path '${path}' not found`);
  }

  if (current[lastKey] === undefined) {
    throw new Error(`Cannot delete '${lastKey}' in path '${path}'`);
  }

  const numKey = Number(lastKey);
  if (Array.isArray(current) && numKey) {
    current.splice(numKey, 1);
  } else {
    delete current[lastKey];
  }
}
