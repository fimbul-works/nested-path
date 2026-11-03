import { afterEach, describe, expect, it, vi } from "vitest";
import * as api from "./index.js";
import {
  deleteAtPath,
  dotSeparator,
  getAtPath,
  hasAtPath,
  setAtPath,
  slashSeparator,
} from "./index.js";
import { clearPathSeparators, createSeparator } from "./separator.js";

// Check JavaScript inputs as well as the literal delimiter types.
const getUnchecked = getAtPath as (input: object, path: string, fallback: unknown, separator: unknown) => unknown;
const hasUnchecked = hasAtPath as (input: object, path: string, separator: unknown) => boolean;
const setUnchecked = setAtPath as (input: object, path: string, value: unknown, separator: unknown) => boolean;
const deleteUnchecked = deleteAtPath as (input: object, path: string, separator: unknown) => boolean;

afterEach(() => {
  clearPathSeparators();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("cached string delimiters", () => {
  it("reuses one parser for each delimiter", () => {
    const dot = createSeparator(".");
    const slash = createSeparator("/");
    const custom = createSeparator("::");
    expect(createSeparator(".")).toBe(dot);
    expect(createSeparator("/")).toBe(slash);
    expect(createSeparator("::")).toBe(custom);
    expect(dot).not.toBe(slash);
    expect(custom?.("user::name")).toEqual(["user", "name"]);
  });

  it("clears the cache without invalidating constants or existing parser references", () => {
    const old = createSeparator(".");
    clearPathSeparators();
    const fresh = createSeparator(".");
    expect(fresh).not.toBe(old);
    expect(createSeparator(".")).toBe(fresh);
    expect(old?.("user.name")).toEqual(["user", "name"]);
    clearPathSeparators();
    expect(getAtPath({ user: { name: "Odin" } }, "user.name", undefined, dotSeparator)).toBe("Odin");
    clearPathSeparators();
    const input: { user: { name?: string } } = { user: { name: "Odin" } };
    expect(setAtPath(input, "user/name", "Thor", slashSeparator)).toBe(true);
    clearPathSeparators();
    expect(hasAtPath(input, "user/name", slashSeparator)).toBe(true);
    clearPathSeparators();
    expect(deleteAtPath(input, "user/name", slashSeparator)).toBe(true);
    clearPathSeparators();
    expect(getAtPath({ value: 1 }, "value")).toBe(1);
  });

  it("takes custom string delimiters directly while keeping the factory private", () => {
    const input: { user: { name?: string } } = { user: { name: "Odin" } };
    expect(getAtPath(input, "user.*name", undefined, ".*")).toBe("Odin");
    expect(hasAtPath(input, "user.*name", ".*")).toBe(true);
    expect(setAtPath(input, "user.*name", "Thor", ".*")).toBe(true);
    expect(deleteAtPath(input, "user.*name", ".*")).toBe(true);
    expect("createSeparator" in api).toBe(false);
    expect("isPathSeparator" in api).toBe(false);
    expect("validatePathSeparator" in api).toBe(false);
  });

  it("preserves empty keys for all operations", () => {
    const input: { ""?: { "": { name?: string } } } = { "": { "": { name: "Odin" } } };
    expect(getAtPath(input, "..name")).toBe("Odin");
    expect(hasAtPath(input, "..name")).toBe(true);
    expect(setAtPath(input, "..name", "Thor")).toBe(true);
    expect(deleteAtPath(input, "..name")).toBe(true);
    expect(hasAtPath(input, "..name")).toBe(false);
    expect(deleteAtPath(input, "")).toBe(true);
    expect(setAtPath(input, "", { "": {} })).toBe(true);
    expect(getAtPath(input, ".")).toEqual({});
  });
});

describe("invalid delimiter diagnostics", () => {
  it.each([/\s+/, 42, null, {}, new String("."), "", (path: string) => path.split(/\s+/)])(
    "rejects a non-string or empty delimiter: %j",
    (delimiter) => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("VITEST", undefined);
      const input = { name: "Odin" };
      expect(() => getUnchecked(input, "name", "fallback", delimiter)).toThrow(TypeError);
      expect(() => hasUnchecked(input, "name", delimiter)).toThrow(TypeError);
      expect(() => setUnchecked(input, "name", "Thor", delimiter)).toThrow(TypeError);
      expect(() => deleteUnchecked(input, "name", delimiter)).toThrow(TypeError);
      expect(input).toEqual({ name: "Odin" });
    },
  );

  it.each([
    [undefined, undefined],
    ["development", undefined],
    ["production", undefined],
    ["test", "true"],
    ["production", "true"],
  ])("always throws in NODE_ENV=%s, VITEST=%s without invoking an invalid parser", (mode, vitest) => {
    vi.stubEnv("NODE_ENV", mode);
    vi.stubEnv("VITEST", vitest);
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const invalid = vi.fn(() => ["name"]);
    const input = { name: "Odin" };
    expect(() => getUnchecked(input, "name", "fallback", invalid)).toThrow(TypeError);
    expect(() => hasUnchecked(input, "name", invalid)).toThrow(TypeError);
    expect(() => setUnchecked(input, "name", "Thor", invalid)).toThrow(TypeError);
    expect(() => deleteUnchecked(input, "name", invalid)).toThrow(TypeError);
    expect(warning).not.toHaveBeenCalled();
    expect(invalid).not.toHaveBeenCalled();
    expect(input).toEqual({ name: "Odin" });
  });
});
