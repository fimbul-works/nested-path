import { isArr, isUndef } from "@fimbul-works/hvat";
import { createSeparator, dotSeparator } from "./separator.js";
import type { Container, DeletablePath, PathArgument, LiteralDelimiter } from "./types.js";
import { canSplice, isNested } from "./util.js";

/**
 * Delete an optional property or splice an array using a literal string delimiter.
 *
 * Mutates the input in place. Required properties, readonly destinations, and
 * tuple element removal are rejected at compile time. Ordinary array indices
 * are removed with the built-in splice, shifting later elements to the left.
 * Affected slots are checked before mutation; blocked or accessor-backed slots
 * return false without shifting ordinary arrays.
 *
 * @typeParam T - Type of the input object or array.
 * @typeParam P - Literal path of a mutable optional property, dictionary entry, or ordinary array index.
 * @typeParam D - Literal string delimiter used to interpret the path.
 * @param input - Object or array to mutate.
 * @param path - Checked deletable path interpreted using the supplied string delimiter.
 * @param separator - Nonempty literal string delimiter, such as "/" or "::".
 * @returns `true` if the mutation succeeds; `false` if the path cannot be traversed or the mutation fails.
 * @throws {TypeError} If the separator is not a nonempty string.
 */
export function deleteAtPath<T extends Container, const P extends string, const D extends string>(
  input: T,
  path: PathArgument<NoInfer<T>, P, NoInfer<D>> & NoInfer<DeletablePath<T, P, D>>,
  separator: D & LiteralDelimiter<NoInfer<D>>,
): boolean;
/**
 * Delete a mutable optional property or splice an ordinary array at a dot-separated path.
 *
 * @typeParam T - Type of the input object or array.
 * @typeParam P - Literal dot-separated deletable path.
 * @param input - Object or array to mutate.
 * @param path - Checked deletable path using dot notation.
 * @param separator - Omit or pass undefined to use the default dot separator.
 * @returns `true` if the mutation succeeds; `false` if the path cannot be traversed or the mutation fails.
 * @throws {TypeError} If the separator is not a nonempty string.
 */
export function deleteAtPath<T extends Container, const P extends string>(
  input: T,
  path: PathArgument<NoInfer<T>, P> & NoInfer<DeletablePath<T, P>>,
  separator?: undefined,
): boolean;
export function deleteAtPath(input: Container, path: string, separator: string = dotSeparator): boolean {
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

    if (!isNested(current) || !Reflect.getOwnPropertyDescriptor(current, lastKey)) {
      return false;
    }

    if (isArr(current)) {
      const index = Number(lastKey);
      if (Number.isInteger(index) && index >= 0 && index < 2 ** 32 - 1 && String(index) === lastKey) {
        if (!canSplice(current, index)) return false;
        Array.prototype.splice.call(current, index, 1);
        return true;
      }
    }
    return Reflect.deleteProperty(current, lastKey);
  } catch {
    return false;
  }
}