/**
 * Check if a value is an object or array.
 *
 * @template {T extends object | any[]} T - Type of object or array
 * @param {any} v - Value to check
 * @returns {boolean} Returns `true` if `v` is an object or array, `false` otherwise.
 */
export const isNested = <T extends object | any[]>(v: any): v is T => typeof v === "object" && v !== null;
