import { PathSeparatorFunction } from "./types.js";

/**
 * Split a string using dots.
 *
 * @param {string} path - Path to split into parts
 * @returns {string[]} The path parts
 */
export const dotSeparator: PathSeparatorFunction = (path: string): string[] => path.split(".");

/**
 * Split a string using slashes.
 *
 * @param {string} path - Path to split into parts
 * @returns {string[]} The path parts
 */
export const slashSeparator: PathSeparatorFunction = (path: string): string[] => path.split("/");
