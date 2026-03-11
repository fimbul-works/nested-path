import type { PathSeparatorFunction } from "./types.js";

/**
 * Check if a value is an object.
 * @template {object} T - Type of object
 * @param {any} v - Value to check
 * @returns {boolean} Returns `true` if `v` is an object, `false` otherwise.
 */
export const isObj = <T extends object>(v: any): v is T => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Split a string using a dot.
 * @param {string} path - Path to split into parts
 * @returns {string[]} The path parts
 */
export const dotSeparator: PathSeparatorFunction = (path: string): string[] => path.split(".");
