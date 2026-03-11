import { describe, expect, it } from "vitest";
import { getAtPath } from "./get-at-path";

const slashSeparator = (path: string) => path.split("/");

describe("getAtPath", () => {
  const testObj = {
    a: 1,
    b: {
      c: "nested",
      d: {
        e: [1, 2, 3],
        f: null,
        g: undefined,
      },
    },
    zero: 0,
    empty: "",
    false: false,
  };

  // --- basic object access ---
  describe("basic object access", () => {
    it("should get existing nested properties", () => {
      expect(getAtPath(testObj, "a")).toBe(1);
      expect(getAtPath(testObj, "b.c")).toBe("nested");
      expect(getAtPath(testObj, "b.d.e")).toEqual([1, 2, 3]);
    });

    it("should return null for null values", () => {
      expect(getAtPath(testObj, "b.d.f")).toBe(null);
    });

    it("should handle falsy values correctly", () => {
      expect(getAtPath(testObj, "zero")).toBe(0);
      expect(getAtPath(testObj, "empty")).toBe("");
      expect(getAtPath(testObj, "false")).toBe(false);
    });
  });

  describe("default values", () => {
    it("should return default value for undefined properties", () => {
      expect(getAtPath(testObj, "nonexistent", "default")).toBe("default");
      expect(getAtPath(testObj, "b.nonexistent", 42)).toBe(42);
      expect(getAtPath(testObj, "b.d.g", "fallback")).toBe("fallback");
    });

    it("should return undefined when no default is provided for missing properties", () => {
      expect(getAtPath(testObj, "nonexistent")).toBe(undefined);
      expect(getAtPath(testObj, "b.d.g")).toBe(undefined);
    });

    it("should handle complex default values", () => {
      const defaultObj = { complex: "object" };
      expect(getAtPath(testObj, "nonexistent", defaultObj)).toBe(defaultObj);
    });

    it("should return default value when intermediate property is null", () => {
      const obj = { a: { b: null } };
      expect(getAtPath(obj, "a.b.c", "default")).toBe("default");
    });

    it("should return default value when intermediate value is a string", () => {
      const obj = { a: { b: "hello" } };
      expect(getAtPath(obj, "a.b.c", "default")).toBe("default");
    });

    it("should return default value when intermediate value is a number", () => {
      const obj = { a: { b: 42 } };
      expect(getAtPath(obj, "a.b.c", "default")).toBe("default");
    });

    it("should return default value when intermediate value is a function", () => {
      const obj = { a: { fn: () => {} } };
      expect(getAtPath(obj, "a.fn.prop", "default")).toBe("default");
    });

    it("should handle empty object", () => {
      expect(getAtPath({}, "a", "default")).toBe("default");
      expect(getAtPath({}, "a.b.c")).toBe(undefined);
    });
  });

  describe("arrays", () => {
    it("should get array elements from an object property", () => {
      const obj = { items: [10, 20, 30] };
      expect(getAtPath(obj, "items.0")).toBe(10);
      expect(getAtPath(obj, "items.2")).toBe(30);
    });

    it("should traverse through array elements to nested properties", () => {
      const obj = { user: { permissions: [{ token: "abc" }, { token: "def" }] } };
      expect(getAtPath(obj, "user.permissions.0.token")).toBe("abc");
      expect(getAtPath(obj, "user.permissions.1.token")).toBe("def");
    });

    it("should return default value for an out-of-bounds array index", () => {
      const obj = { items: [1, 2, 3] };
      expect(getAtPath(obj, "items.5", "missing")).toBe("missing");
    });

    it("should accept a root-level array", () => {
      expect(getAtPath([10, 20, 30], "0")).toBe(10);
      expect(getAtPath([10, 20, 30], "2")).toBe(30);
    });

    it("should traverse into objects nested inside a root-level array", () => {
      expect(getAtPath([{ name: "Alice" }, { name: "Bob" }], "0.name")).toBe("Alice");
      expect(getAtPath([{ name: "Alice" }, { name: "Bob" }], "1.name")).toBe("Bob");
    });

    it("should return default value for a missing index in a root-level array", () => {
      expect(getAtPath([1, 2, 3], "9", "missing")).toBe("missing");
    });
  });

  describe("custom separator", () => {
    it("should use a custom separator for object keys", () => {
      expect(getAtPath(testObj, "b/c", undefined, slashSeparator)).toBe("nested");
      expect(getAtPath(testObj, "b/d/e", undefined, slashSeparator)).toEqual([1, 2, 3]);
      expect(getAtPath(testObj, "missing/key", "default", slashSeparator)).toBe("default");
    });

    it("should use a custom separator with array traversal through an object", () => {
      const obj = { user: { permissions: [{ token: "abc" }, { token: "def" }] } };
      expect(getAtPath(obj, "user/permissions/0/token", undefined, slashSeparator)).toBe("abc");
      expect(getAtPath(obj, "user/permissions/1/token", undefined, slashSeparator)).toBe("def");
    });

    it("should use a custom separator to access a single-level array element", () => {
      const obj = { items: [10, 20, 30] };
      expect(getAtPath(obj, "items/1", undefined, slashSeparator)).toBe(20);
    });

    it("should use a custom separator with a root-level array", () => {
      expect(getAtPath([10, 20, 30], "1", undefined, slashSeparator)).toBe(20);
      expect(getAtPath([{ name: "Alice" }], "0/name", undefined, slashSeparator)).toBe("Alice");
    });
  });
});
