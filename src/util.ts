import { isArr, isObj } from "@fimbul-works/hvat";

/**
 * Check whether a value can be traversed as a non-null object or array.
 *
 * @param value - Value to inspect.
 * @returns `true` for non-null objects and arrays, narrowing the value accordingly.
 */
export const isNested = (value: unknown): value is Record<string | number, unknown> => isObj(value) || isArr(value);

/**
 * Check the affected data slots before splice can make any partial changes.
 *
 * @param array - The array to check.
 * @param index - The index to check.
 * @returns `true` if the array can be spliced at the given index; `false` otherwise.
 */
export function canSplice(array: unknown[], index: number): boolean {
  if (!Reflect.getOwnPropertyDescriptor(array, "length")?.writable) {
    return false;
  }

  const extensible = Object.isExtensible(array);
  for (let key = index; key < array.length; key++) {
    const descriptor = Reflect.getOwnPropertyDescriptor(array, String(key));
    if (descriptor) {
      // Accessors can throw or change descriptors midway through a splice.
      if (!("value" in descriptor) || !descriptor.writable || !descriptor.configurable) {
        return false;
      }
    } else {
      // Inherited indexed properties can introduce setters and unexpected values.
      if (key in array || (!extensible && key + 1 in array)) {
        return false;
      }
    }
  }
  return true;
}
