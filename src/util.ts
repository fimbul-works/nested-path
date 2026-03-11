import type { PathSeparatorFunction } from "./types.js";

/**
 * Check if a value is an object.
 * @template {object} T - Type of object
 * @param {any} v - Value to check
 * @returns {boolean} Returns `true` if `v` is an object, `false` otherwise.
 */
export const isObj = <T extends object>(v: any): v is T => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Check if a value is an object or array.
 * @template {T extends object | any[]} T - Type of object or array
 * @param {any} v - Value to check
 * @returns {boolean} Returns `true` if `v` is an object or array, `false` otherwise.
 */
export const isObjOrArray = <T extends object | any[]>(v: any): v is T => typeof v === "object" && v !== null;

/**
 * Split a string using dots.
 * @param {string} path - Path to split into parts
 * @returns {string[]} The path parts
 */
export const dotSeparator: PathSeparatorFunction = (path: string): string[] => path.split(".");

/**
 * Split a string using slashes.
 * @param {string} path - Path to split into parts
 * @returns {string[]} The path parts
 */
export const slashSeparator: PathSeparatorFunction = (path: string): string[] => path.split("/");
