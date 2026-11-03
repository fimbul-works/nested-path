import { describe, expect, it } from "vitest";
import { setAtPath as checkedSetAtPath } from "./set-at-path";

// Exercise unchecked JavaScript inputs against the same public implementation.
const setAtPath = checkedSetAtPath as (input: object, path: string, value: unknown, separator?: string) => boolean;

import { slashSeparator } from "./separator";

describe("setAtPath", () => {
  // --- basic object mutations ---
  describe("basic object mutations", () => {
    it("should set nested property values", () => {
      const obj = { a: 1, b: { c: "old", d: { e: "nested" } } };
      setAtPath(obj, "a", 42);
      expect(obj.a).toBe(42);
      setAtPath(obj, "b.c", "new");
      expect(obj.b.c).toBe("new");
      setAtPath(obj, "b.d.e", "updated");
      expect(obj.b.d.e).toBe("updated");
    });

    it("should set a property to various value types", () => {
      const obj = { a: "original", b: { c: 0 } };
      setAtPath(obj, "a", null);
      expect(obj.a).toBe(null);
      setAtPath(obj, "b.c", { nested: "object" });
      expect(obj.b.c).toEqual({ nested: "object" });
    });

    it("should handle single-level property setting", () => {
      const obj = { a: "old" };
      setAtPath(obj, "a", "new");
      expect(obj.a).toBe("new");
    });

    it("should handle deep nesting", () => {
      const obj = { a: { b: { c: { d: { e: "deep" } } } } };
      setAtPath(obj, "a.b.c.d.e", "updated");
      expect(obj.a.b.c.d.e).toBe("updated");
    });

    it("should maintain sibling object references when setting a nested value", () => {
      const obj = { a: { b: "original", c: "unchanged" } };
      const originalA = obj.a;
      setAtPath(obj, "a.b", "modified");
      expect(obj.a).toBe(originalA);
      expect(obj.a.b).toBe("modified");
      expect(obj.a.c).toBe("unchanged");
    });
  });

  describe("error states", () => {
    it("should return false when an intermediate key resolves to a non-traversable value", () => {
      // Non-traversable values make the mutation fail.
      expect(setAtPath({ a: "string" }, "a.b.c", "value")).toBe(false);
      expect(setAtPath({ a: 42 }, "a.b.c", "value")).toBe(false);
      expect(setAtPath({ a: () => {} }, "a.b.c", "value")).toBe(false);
    });

    it("should return false when the final container is a non-traversable value", () => {
      // path has 2 segments; non-traversable value found after last traversal step
      expect(setAtPath({ a: "string" }, "a.b", "value")).toBe(false);
      expect(setAtPath({ a: 42 }, "a.b", "value")).toBe(false);
    });

    it("should create a new key when it does not exist in the container", () => {
      const obj = { a: { b: "exists" } } as any;
      setAtPath(obj, "a.newKey", "value");
      expect(obj.a.newKey).toBe("value");
    });

    it("should create a new top-level key when it does not exist", () => {
      const obj = { a: "exists" } as any;
      setAtPath(obj, "newKey", "value");
      expect(obj.newKey).toBe("value");
    });
  });

  describe("arrays", () => {
    it("should traverse through an array index to set a nested property", () => {
      const obj = { user: { permissions: [{ token: "abc" }, { token: "def" }] } };
      setAtPath(obj, "user.permissions.0.token", "xyz");
      expect(obj.user.permissions[0]!.token).toBe("xyz");
      expect(obj.user.permissions[1]!.token).toBe("def");
    });

    it("should set an array element directly from an object property", () => {
      const obj = { items: [10, 20, 30] };
      setAtPath(obj, "items.0", 99);
      expect(obj.items[0]).toBe(99);
      setAtPath(obj, "items.2", 88);
      expect(obj.items[2]).toBe(88);
    });

    it("should set an element of a root-level array", () => {
      const arr = [10, 20, 30];
      setAtPath(arr, "1", 99);
      expect(arr[1]).toBe(99);
    });

    it("should set an out-of-bounds index on a root-level array", () => {
      const arr = [10, 20] as any[];
      setAtPath(arr, "5", 99);
      expect(arr[5]).toBe(99);
    });
  });

  describe("custom separator", () => {
    it("should use a custom separator for object keys", () => {
      const obj = { a: { b: { c: "old" } } };
      setAtPath(obj, "a/b/c", "new", slashSeparator);
      expect(obj.a.b.c).toBe("new");
    });

    it("should use a custom separator with array traversal through an object", () => {
      const obj = { user: { permissions: [{ token: "abc" }, { token: "def" }] } };
      setAtPath(obj, "user/permissions/0/token", "xyz", slashSeparator);
      expect(obj.user.permissions[0]!.token).toBe("xyz");
    });

    it("should use a custom separator to set a single-level array element", () => {
      const obj = { items: [10, 20, 30] };
      setAtPath(obj, "items/1", 99, slashSeparator);
      expect(obj.items[1]).toBe(99);
    });

    it("should use a custom separator with a root-level array", () => {
      const arr = [10, 20, 30];
      setAtPath(arr, "2", 99, slashSeparator);
      expect(arr[2]).toBe(99);
    });
  });
});

describe("setAtPath success results", () => {
  it("returns true for assignments, including unchanged values and new keys", () => {
    const input = { value: 1, nested: {} };
    expect(setAtPath(input, "value", 2)).toBe(true);
    expect(setAtPath(input, "value", 2)).toBe(true);
    expect(setAtPath(input, "nested.name", undefined)).toBe(true);
    expect(Object.hasOwn(input.nested, "name")).toBe(true);
    const array: number[] = [];
    expect(setAtPath(array, "2", 42)).toBe(true);
    expect(array[2]).toBe(42);
  });

  it("returns false for missing ancestors, rejected assignments, and empty parser results", () => {
    const input = { nested: null };
    expect(setAtPath(input, "nested.value", 1)).toBe(false);
    expect(setAtPath(input, "missing.value", 1)).toBe(false);
    expect(input).toEqual({ nested: null });
    expect(setAtPath(Object.freeze({ value: 1 }), "value", 2)).toBe(false);
    expect(setAtPath(Object.preventExtensions({}), "new", 1)).toBe(false);
    // @ts-expect-error
    expect(() => setAtPath({}, "", 1, () => [])).toThrow(TypeError);
    expect(
      setAtPath(
        {
          set value(_value: unknown) {
            throw new Error("rejected");
          },
        },
        "value",
        1,
      ),
    ).toBe(false);
  });
});
