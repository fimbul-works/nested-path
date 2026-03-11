import { describe, expect, it } from "vitest";
import { hasNestedProperty } from "./index";

const slashSeparator = (path: string) => path.split("/");

describe("hasNestedProperty", () => {
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

  it("should return true for existing nested properties", () => {
    expect(hasNestedProperty(testObj, "a")).toBe(true);
    expect(hasNestedProperty(testObj, "b.c")).toBe(true);
    expect(hasNestedProperty(testObj, "b.d.e")).toBe(true);
  });

  it("should return true for null values", () => {
    expect(hasNestedProperty(testObj, "b.d.f")).toBe(true);
  });

  it("should return false for undefined values", () => {
    expect(hasNestedProperty(testObj, "b.d.g")).toBe(false);
  });

  it("should return false for non-existent properties", () => {
    expect(hasNestedProperty(testObj, "nonexistent")).toBe(false);
    expect(hasNestedProperty(testObj, "b.nonexistent")).toBe(false);
    expect(hasNestedProperty(testObj, "b.d.nonexistent")).toBe(false);
  });

  it("should return false when intermediate property is null", () => {
    const objWithNull = { a: { b: null } };
    expect(hasNestedProperty(objWithNull, "a.b.c")).toBe(false);
  });

  it("should return false when intermediate property is undefined", () => {
    const objWithUndefined = { a: { b: undefined } };
    expect(hasNestedProperty(objWithUndefined, "a.b.c")).toBe(false);
  });

  it("should handle empty object", () => {
    expect(hasNestedProperty({}, "a")).toBe(false);
    expect(hasNestedProperty({}, "a.b.c")).toBe(false);
  });

  it("should handle single character keys", () => {
    expect(hasNestedProperty({ a: { b: 1 } }, "a.b")).toBe(true);
  });

  it("should return true for existing array indices", () => {
    const obj = { user: { permissions: [{ token: "abc" }, { token: "def" }] } };
    expect(hasNestedProperty(obj, "user.permissions.0")).toBe(true);
    expect(hasNestedProperty(obj, "user.permissions.0.token")).toBe(true);
    expect(hasNestedProperty(obj, "user.permissions.1.token")).toBe(true);
  });

  it("should return false for out-of-bounds array indices", () => {
    const obj = { items: [1, 2, 3] };
    expect(hasNestedProperty(obj, "items.5")).toBe(false);
  });

  it("should return false when path continues past a non-object array element", () => {
    const obj = { items: [1, 2, 3] };
    expect(hasNestedProperty(obj, "items.0.nested")).toBe(false);
  });

  it("should accept a root array", () => {
    expect(hasNestedProperty([1, 2, 3], "0")).toBe(true);
    expect(hasNestedProperty([1, 2, 3], "5")).toBe(false);
    expect(hasNestedProperty([{ token: "abc" }], "0.token")).toBe(true);
  });

  it("should use a custom separator", () => {
    expect(hasNestedProperty(testObj, "b/d/e", slashSeparator)).toBe(true);
    expect(hasNestedProperty(testObj, "b/d/nonexistent", slashSeparator)).toBe(false);
  });
});
