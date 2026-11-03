import { isStr } from "@fimbul-works/hvat";
import type { PathSeparatorFunction } from "./types.js";

const pathSeparators = new Map<string, PathSeparatorFunction>();

/**
 * Get or create the cached parser for a nonempty string delimiter.
 *
 * @param delimiter - Literal string used to split a path; regexes and callbacks are rejected.
 * @returns The parser cached for this string delimiter.
 * @throws {TypeError} If the delimiter is not a nonempty string.
 * @internal
 */
export function createSeparator(delimiter: string): PathSeparatorFunction {
  if (!isStr(delimiter) || delimiter.length === 0) {
    throw new TypeError("A path separator must be a nonempty string");
  }

  const cached = pathSeparators.get(delimiter);
  if (cached) return cached;

  const separator = (path: string): string[] => path.split(delimiter);
  pathSeparators.set(delimiter, separator);

  return separator;
}

/**
 * Clear the cached path parsers, primarily to isolate tests.
 *
 * Future operations recreate parsers lazily. Existing parser references and
 * the exported delimiter constants remain usable.
 *
 * @returns Nothing; all entries are removed from the internal cache.
 * @internal
 */
export function clearPathSeparators(): void {
  pathSeparators.clear();
}

/** Default literal dot delimiter. */
export const dotSeparator = "." as const;

/** Literal slash delimiter. */
export const slashSeparator = "/" as const;
