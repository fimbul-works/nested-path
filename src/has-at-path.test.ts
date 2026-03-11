import { describe, expect, it } from "vitest";
import { hasAtPath } from "./has-at-path";

const slashSeparator = (path: string) => path.split("/");

describe("hasAtPath", () => {
  const testObj = {
    a: 1,
    b: {
      c: 2,
      d: {
        e: 3,
        f: null,
        g: undefined,
      },
    },
    empty: {},
  };

  describe("basic object access", () => {
    it("should return true for existing nested properties", () => {
      expect(hasAtPath(testObj, "a")).toBe(true);
      expect(hasAtPath(testObj, "b.c")).toBe(true);
      expect(hasAtPath(testObj, "b.d.e")).toBe(true);
    });

    it("should return true for null values", () => {
      expect(hasAtPath(testObj, "b.d.f")).toBe(true);
    });

    it("should return true for an empty object value", () => {
      expect(hasAtPath(testObj, "empty")).toBe(true);
    });

    it("should return false for undefined values", () => {
      expect(hasAtPath(testObj, "b.d.g")).toBe(false);
    });

    it("should return false for non-existent properties", () => {
      expect(hasAtPath(testObj, "nonexistent")).toBe(false);
      expect(hasAtPath(testObj, "b.nonexistent")).toBe(false);
      expect(hasAtPath(testObj, "b.d.nonexistent")).toBe(false);
    });

    it("should handle an empty object", () => {
      expect(hasAtPath({}, "a")).toBe(false);
      expect(hasAtPath({}, "a.b.c")).toBe(false);
    });
  });

  describe("non-traversable intermediate values", () => {
    it("should return false when an intermediate property is null", () => {
      expect(hasAtPath({ a: { b: null } }, "a.b.c")).toBe(false);
    });

    it("should return false when an intermediate property is undefined", () => {
      expect(hasAtPath({ a: { b: undefined } }, "a.b.c")).toBe(false);
    });

    it("should return false when an intermediate value is a string", () => {
      expect(hasAtPath({ a: { b: "hello" } }, "a.b.c")).toBe(false);
    });

    it("should return false when an intermediate value is a number", () => {
      expect(hasAtPath({ a: { b: 42 } }, "a.b.c")).toBe(false);
    });

    it("should return false when an intermediate value is a function", () => {
      expect(hasAtPath({ a: { fn: () => {} } }, "a.fn.prop")).toBe(false);
    });
  });

  describe("arrays", () => {
    it("should return true for existing array indices in an object property", () => {
      const obj = { user: { permissions: [{ token: "abc" }, { token: "def" }] } };
      expect(hasAtPath(obj, "user.permissions.0")).toBe(true);
      expect(hasAtPath(obj, "user.permissions.0.token")).toBe(true);
      expect(hasAtPath(obj, "user.permissions.1.token")).toBe(true);
    });

    it("should return false for an out-of-bounds array index", () => {
      expect(hasAtPath({ items: [1, 2, 3] }, "items.5")).toBe(false);
    });

    it("should return false when the path continues past a scalar array element", () => {
      expect(hasAtPath({ items: [1, 2, 3] }, "items.0.nested")).toBe(false);
    });

    it("should accept a root-level array", () => {
      expect(hasAtPath([1, 2, 3], "0")).toBe(true);
      expect(hasAtPath([1, 2, 3], "2")).toBe(true);
      expect(hasAtPath([1, 2, 3], "5")).toBe(false);
    });

    it("should traverse into objects nested inside a root-level array", () => {
      expect(hasAtPath([{ token: "abc" }], "0.token")).toBe(true);
      expect(hasAtPath([{ token: "abc" }], "0.nonexistent")).toBe(false);
    });

    it("should return false for an empty array", () => {
      expect(hasAtPath([], "0")).toBe(false);
    });
  });

  describe("custom separator", () => {
    it("should use a custom separator for object keys", () => {
      expect(hasAtPath(testObj, "b/d/e", slashSeparator)).toBe(true);
      expect(hasAtPath(testObj, "b/d/nonexistent", slashSeparator)).toBe(false);
      expect(hasAtPath(testObj, "b/d/f", slashSeparator)).toBe(true);
    });

    it("should use a custom separator with array traversal through an object", () => {
      const obj = { user: { permissions: [{ token: "abc" }, { token: "def" }] } };
      expect(hasAtPath(obj, "user/permissions/0/token", slashSeparator)).toBe(true);
      expect(hasAtPath(obj, "user/permissions/5/token", slashSeparator)).toBe(false);
    });

    it("should use a custom separator to access a single-level array element", () => {
      const obj = { items: [10, 20, 30] };
      expect(hasAtPath(obj, "items/0", slashSeparator)).toBe(true);
      expect(hasAtPath(obj, "items/9", slashSeparator)).toBe(false);
    });

    it("should use a custom separator with a root-level array", () => {
      expect(hasAtPath([1, 2, 3], "0", slashSeparator)).toBe(true);
      expect(hasAtPath([1, 2, 3], "5", slashSeparator)).toBe(false);
      expect(hasAtPath([{ token: "abc" }], "0/token", slashSeparator)).toBe(true);
    });
  });
});
