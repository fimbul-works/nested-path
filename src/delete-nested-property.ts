import type { PathSeparatorFunction } from "./types.js";
import { dotSeparator, isObj } from "./util.js";

/**
 * Delete a nested property.
 *
 * @template {Record<string, unknown>} T - Type of object
 * @template {keyof T} K - Key mapping `T`
 * @param {T} obj - The context object containing variables.
 * @param {string} path - The variable name using dot notation.
 * @param {PathSeparatorFunction} [separator=dotSeparator] - Function that splits the path into individual keys (default: dotSeparator)
 */
export function deleteNestedProperty<
  T extends Record<string, unknown> = Record<string, unknown>,
  K extends keyof T & string = keyof T & string,
>(obj: T, path: string, separator: PathSeparatorFunction = dotSeparator): void {
  const keys = separator(path);
  const lastKey = keys.pop() as K;
  let current: T = obj;

  for (const key of keys) {
    if (!isObj(current)) {
      throw new Error(`Key '${key}' in path '${path}' is not an object`);
    }
    current = current[key] as T;
  }

  if (!isObj(current)) {
    throw new Error(`Key '${lastKey}' in path '${path}' is not an object`);
  }

  if (current[lastKey as K] === undefined) {
    throw new Error(`Cannot delete '${lastKey}' in path '${path}'`);
  }

  delete (current as T)[lastKey as K];
}
