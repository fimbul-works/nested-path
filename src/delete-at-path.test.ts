import { describe, expect, it } from "vitest";
import { deleteAtPath } from "./delete-at-path";
import { slashSeparator } from "./util";

describe("deleteAtPath", () => {
  describe("basic object mutations", () => {
    it("should delete nested property values", () => {
      const obj = { a: 1, b: { c: "old", d: { e: "nested" } } };
      deleteAtPath(obj, "a");
      expect(obj.a).toBe(undefined);
      deleteAtPath(obj, "b.c");
      expect(obj.b.c).toBe(undefined);
      deleteAtPath(obj, "b.d.e");
      expect(obj.b.d.e).toBe(undefined);
    });

    it("should handle deep nesting", () => {
      const obj = { a: { b: { c: { d: { e: "deep" } } } } };
      deleteAtPath(obj, "a.b.c.d.e");
      expect(obj.a.b.c.d.e).toBe(undefined);
    });
  });

  describe("error states", () => {
    it("should throw when an intermediate key resolves to a non-traversable value", () => {
      expect(() => deleteAtPath({ a: "string" }, "a.b.c")).toThrow("Key 'b' in path 'a.b.c' not found");
      expect(() => deleteAtPath({ a: 42 }, "a.b.c")).toThrow("Key 'b' in path 'a.b.c' not found");
      expect(() => deleteAtPath({ a: () => {} }, "a.b.c")).toThrow("Key 'b' in path 'a.b.c' not found");
    });

    it("should throw when the final container is a non-traversable value", () => {
      expect(() => deleteAtPath({ a: { b: "string" } }, "a.b.c")).toThrow("Key 'c' in path 'a.b.c' not found");
    });

    it("should throw when the key does not exist in the container", () => {
      expect(() => deleteAtPath({ a: { b: "exists" } }, "a.nonexistent")).toThrow(
        "Cannot delete 'nonexistent' in path 'a.nonexistent'",
      );
    });

    it("should throw for a non-existent top-level key", () => {
      expect(() => deleteAtPath({ a: 1 }, "nonexistent")).toThrow("Cannot delete 'nonexistent' in path 'nonexistent'");
    });
  });

  describe("arrays", () => {
    it("should splice out the first element of an array (index 0)", () => {
      const obj = { items: [10, 20, 30] };
      deleteAtPath(obj, "items.0");
      expect(obj.items).toEqual([20, 30]);
    });

    it("should splice out a mid-array element", () => {
      const obj = { items: [10, 20, 30] };
      deleteAtPath(obj, "items.1");
      expect(obj.items).toEqual([10, 30]);
    });

    it("should splice out the last element of an array", () => {
      const obj = { items: [10, 20, 30] };
      deleteAtPath(obj, "items.2");
      expect(obj.items).toEqual([10, 20]);
    });

    it("should delete a property of an object nested inside an array", () => {
      const obj = { user: { permissions: [{ token: "abc", role: "admin" }] } };
      deleteAtPath(obj, "user.permissions.0.token");
      expect((obj.user.permissions[0] as any).token).toBe(undefined);
      expect(obj.user.permissions[0].role).toBe("admin");
    });

    it("should throw when deleting a non-existent array index", () => {
      expect(() => deleteAtPath({ items: [1, 2, 3] }, "items.9")).toThrow("Cannot delete '9' in path 'items.9'");
    });

    it("should splice an element from a root-level array", () => {
      const arr = [10, 20, 30];
      deleteAtPath(arr, "1");
      expect(arr).toEqual([10, 30]);
    });

    it("should splice the first element from a root-level array (index 0)", () => {
      const arr = [10, 20, 30];
      deleteAtPath(arr, "0");
      expect(arr).toEqual([20, 30]);
    });

    it("should throw when deleting a non-existent index from a root-level array", () => {
      expect(() => deleteAtPath([1, 2, 3], "9")).toThrow("Cannot delete '9' in path '9'");
    });
  });

  describe("custom separator", () => {
    it("should use a custom separator for object keys", () => {
      const obj = { a: { b: { c: "value" } } };
      deleteAtPath(obj, "a/b/c", slashSeparator);
      expect(obj.a.b.c).toBe(undefined);
    });

    it("should use a custom separator with array traversal through an object", () => {
      const obj = { user: { permissions: [{ token: "abc", role: "admin" }] } };
      deleteAtPath(obj, "user/permissions/0/token", slashSeparator);
      expect((obj.user.permissions[0] as any).token).toBe(undefined);
      expect(obj.user.permissions[0].role).toBe("admin");
    });

    it("should use a custom separator to splice a single-level array element", () => {
      const obj = { items: [10, 20, 30] };
      deleteAtPath(obj, "items/1", slashSeparator);
      expect(obj.items).toEqual([10, 30]);
    });

    it("should use a custom separator to splice from a root-level array", () => {
      const arr = [10, 20, 30];
      deleteAtPath(arr, "0", slashSeparator);
      expect(arr).toEqual([20, 30]);
    });
  });
});
