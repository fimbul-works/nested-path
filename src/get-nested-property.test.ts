import { describe, expect, it } from "vitest";
import { getNestedProperty } from "./index";

const slashSeparator = (path: string) => path.split("/");

describe("getNestedProperty", () => {
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

  it("should get existing nested properties", () => {
    expect(getNestedProperty(testObj, "a")).toBe(1);
    expect(getNestedProperty(testObj, "b.c")).toBe("nested");
    expect(getNestedProperty(testObj, "b.d.e")).toEqual([1, 2, 3]);
  });

  it("should return null for null values", () => {
    expect(getNestedProperty(testObj, "b.d.f")).toBe(null);
  });

  it("should return default value for undefined properties", () => {
    expect(getNestedProperty(testObj, "nonexistent", "default")).toBe("default");
    expect(getNestedProperty(testObj, "b.nonexistent", 42)).toBe(42);
    expect(getNestedProperty(testObj, "b.d.g", "fallback")).toBe("fallback");
  });

  it("should return undefined when no default is provided for missing properties", () => {
    expect(getNestedProperty(testObj, "nonexistent")).toBe(undefined);
    expect(getNestedProperty(testObj, "b.d.g")).toBe(undefined);
  });

  it("should handle falsy values correctly", () => {
    expect(getNestedProperty(testObj, "zero")).toBe(0);
    expect(getNestedProperty(testObj, "empty")).toBe("");
    expect(getNestedProperty(testObj, "false")).toBe(false);
  });

  it("should return default value when intermediate property is null", () => {
    const objWithNull = { a: { b: null } };
    expect(getNestedProperty(objWithNull, "a.b.c", "default")).toBe("default");
  });

  it("should handle empty object", () => {
    expect(getNestedProperty({}, "a", "default")).toBe("default");
    expect(getNestedProperty({}, "a.b.c")).toBe(undefined);
  });

  it("should handle complex default values", () => {
    const defaultObj = { complex: "object" };
    expect(getNestedProperty(testObj, "nonexistent", defaultObj)).toBe(defaultObj);
  });

  it("should get values through array indices", () => {
    const obj = { user: { permissions: [{ token: "abc" }, { token: "def" }] } };
    expect(getNestedProperty(obj, "user.permissions.0.token")).toBe("abc");
    expect(getNestedProperty(obj, "user.permissions.1.token")).toBe("def");
  });

  it("should get array elements directly", () => {
    const obj = { items: [10, 20, 30] };
    expect(getNestedProperty(obj, "items.0")).toBe(10);
    expect(getNestedProperty(obj, "items.2")).toBe(30);
  });

  it("should return default value for out-of-bounds array index", () => {
    const obj = { items: [1, 2, 3] };
    expect(getNestedProperty(obj, "items.5", "missing")).toBe("missing");
  });

  it("should accept a root array", () => {
    expect(getNestedProperty([10, 20, 30], "1")).toBe(20);
    expect(getNestedProperty([{ name: "Alice" }], "0.name")).toBe("Alice");
  });

  it("should return default value for missing index in root array", () => {
    expect(getNestedProperty([1, 2, 3], "9", "missing")).toBe("missing");
  });

  it("should use a custom separator", () => {
    expect(getNestedProperty(testObj, "b/c", undefined, slashSeparator)).toBe("nested");
    expect(getNestedProperty(testObj, "b/d/e", undefined, slashSeparator)).toEqual([1, 2, 3]);
    expect(getNestedProperty(testObj, "missing/key", "default", slashSeparator)).toBe("default");
  });
});
