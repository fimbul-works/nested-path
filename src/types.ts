/**
 * Type of container with nested elements
 */
export type Container = Record<string, any> | any[];

/**
 * Function that splits a string path into it's components.
 * @param {string} path - Path to separate
 * @return {string[]} - Array representing the path parts after separation
 */
export type PathSeparatorFunction = (path: string) => string[];
