import { describe, expect, it } from "vitest";
import { deleteAtPath as checkedDeleteAtPath } from "./delete-at-path";

// Exercise unchecked JavaScript inputs against the same public implementation.
const deleteAtPath = checkedDeleteAtPath as (input: object, path: string, separator?: string) => boolean;
import { slashSeparator } from "./separator";

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
    it("should return false when an intermediate key resolves to a non-traversable value", () => {
      expect(deleteAtPath({ a: "string" }, "a.b.c")).toBe(false);
      expect(deleteAtPath({ a: 42 }, "a.b.c")).toBe(false);
      expect(deleteAtPath({ a: () => {} }, "a.b.c")).toBe(false);
    });

    it("should return false when the final container is a non-traversable value", () => {
      expect(deleteAtPath({ a: { b: "string" } }, "a.b.c")).toBe(false);
    });

    it("should return false when the key does not exist in the container", () => {
      expect(deleteAtPath({ a: { b: "exists" } }, "a.nonexistent")).toBe(false);
    });

    it("should return false for a non-existent top-level key", () => {
      expect(deleteAtPath({ a: 1 }, "nonexistent")).toBe(false);
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
      expect(obj.user.permissions[0]!.role).toBe("admin");
    });

    it("should return false when deleting a non-existent array index", () => {
      expect(deleteAtPath({ items: [1, 2, 3] }, "items.9")).toBe(false);
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

    it("should return false when deleting a non-existent index from a root-level array", () => {
      expect(deleteAtPath([1, 2, 3], "9")).toBe(false);
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
      expect(obj.user.permissions[0]!.role).toBe("admin");
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

describe("deleteAtPath success results", () => {
  it("returns true only when an own key is removed, even when its value is undefined", () => {
    const input = { value: undefined, nested: { name: "Odin" } };
    expect(deleteAtPath(input, "value")).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(input, "value")).toBe(false);
    expect(deleteAtPath(input, "value")).toBe(false);
    expect(deleteAtPath(input, "nested/name", slashSeparator)).toBe(true);
    const array = [undefined, "next"];
    expect(deleteAtPath(array, "0")).toBe(true);
    expect(array).toEqual(["next"]);
  });

  it("returns false without splicing holes or deleting inherited properties", () => {
    const array = new Array(3);
    expect(deleteAtPath(array, "1")).toBe(false);
    expect(array.length).toBe(3);
    const input = Object.create({ inherited: 42 });
    expect(deleteAtPath(input, "inherited")).toBe(false);
    expect(input.inherited).toBe(42);
  });

  it("returns false when deletion fails or its path cannot be traversed", () => {
    expect(deleteAtPath(Object.freeze({ value: 1 }), "value")).toBe(false);
    expect(deleteAtPath(Object.freeze([1, 2]), "0")).toBe(false);
    expect(deleteAtPath({ nested: null }, "nested.value")).toBe(false);
    // @ts-expect-error
    expect(() => deleteAtPath({}, "", () => [])).toThrow(TypeError);
    expect(
      deleteAtPath(
        {
          get nested() {
            throw new Error("rejected");
          },
        },
        "nested.value",
      ),
    ).toBe(false);
  });
});

describe("deleteAtPath array property keys", () => {
  it.each(["01", "", " 1", "1e0", "-0", "-1", "1.5", "NaN", "Infinity", "0x1", "+1", "4294967295"])(
    "deletes the named property %j without splicing an element",
    (key) => {
      const array = [10, 20, 30];
      Object.defineProperty(array, key, { value: "named", configurable: true });
      expect(deleteAtPath(array, key, slashSeparator)).toBe(true);
      expect(Reflect.getOwnPropertyDescriptor(array, key)).toBeUndefined();
      expect(array).toEqual([10, 20, 30]);
    },
  );
});

describe("deleteAtPath array mutation preflight", () => {
  it.each([0, 1, 2])("leaves a sealed array unchanged when deleting index %i", (index) => {
    const array = Object.seal([1, 2, 3]);
    expect(deleteAtPath(array, String(index))).toBe(false);
    expect(array).toEqual([1, 2, 3]);
  });

  it.each(["readonly", "nonconfigurable", "length", "accessor"])(
    "returns false before shifting when an affected slot is %s",
    (kind) => {
      const array = [1, 2, 3, 4];
      if (kind === "readonly") Object.defineProperty(array, "2", { writable: false });
      if (kind === "nonconfigurable") Object.defineProperty(array, "3", { configurable: false });
      if (kind === "length") Object.defineProperty(array, "length", { writable: false });
      if (kind === "accessor") Object.defineProperty(array, "2", { get: () => 3 });
      const before = Object.getOwnPropertyDescriptors(array);
      expect(deleteAtPath(array, "0")).toBe(false);
      expect(Object.getOwnPropertyDescriptors(array)).toEqual(before);
    },
  );

  it("ignores an overridden splice and preserves sparse-array holes", () => {
    const array = [1, 2, 3];
    array.splice = () => {
      throw new Error("must not be called");
    };
    expect(deleteAtPath(array, "0")).toBe(true);
    expect([...array]).toEqual([2, 3]);
    const sparse = [1, , 3, 4];
    expect(deleteAtPath(sparse, "0")).toBe(true);
    expect(sparse.length).toBe(3);
    expect(Reflect.getOwnPropertyDescriptor(sparse, "0")).toBeUndefined();
    expect(sparse[1]).toBe(3);
    expect(sparse[2]).toBe(4);
  });

  it("supports nonextensible dense arrays but rejects moves into nonextensible holes", () => {
    const dense = Object.preventExtensions([1, 2, 3]);
    expect(deleteAtPath(dense, "0")).toBe(true);
    expect(dense).toEqual([2, 3]);
    const sparse = Object.preventExtensions([1, , 3]);
    const before = Object.getOwnPropertyDescriptors(sparse);
    expect(deleteAtPath(sparse, "0")).toBe(false);
    expect(Object.getOwnPropertyDescriptors(sparse)).toEqual(before);
  });
});
