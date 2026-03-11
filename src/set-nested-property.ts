import type { PathSeparatorFunction } from "./types.js";
import { dotSeparator, isObj } from "./util.js";

/**
 * Assigns a value to the context object.
 *
 * @template V - Type of value to set
 * @template {Record<string, unknown>} T - Type of object
 * @template {keyof T} K - Key mapping `T`
 * @param {T} obj - The context object containing variables
 * @param {string} path - The variable name using dot notation
 * @param {V} value - The new value to set
 * @param {PathSeparatorFunction} [separator=dotSeparator] - Function that splits the path into individual keys (default: dotSeparator)
 */
export function setNestedProperty<
  V = any,
  T extends Record<string, unknown> = Record<string, unknown>,
  K extends keyof T & string = keyof T & string,
>(obj: T, path: string, value: V, separator: PathSeparatorFunction = dotSeparator): void {
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

  if (current[lastKey] === undefined) {
    throw new Error(`Cannot update '${lastKey}' in path '${path}'`);
  }

  current[lastKey] = value as T[K];
}
