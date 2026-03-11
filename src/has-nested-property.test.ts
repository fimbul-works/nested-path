import { describe, expect, it } from "vitest";
import { deleteNestedProperty, getNestedProperty, hasNestedProperty, setNestedProperty } from "./index";

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
});
