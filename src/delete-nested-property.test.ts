import { describe, expect, it } from "vitest";
import { deleteNestedProperty } from "./index";

describe("deleteNestedProperty", () => {
  it("should delete nested property values", () => {
    const testObj = {
      a: 1,
      b: {
        c: "old",
        d: {
          e: "nested",
        },
      },
    };

    deleteNestedProperty(testObj, "a");
    expect(testObj.a).toBe(undefined);

    deleteNestedProperty(testObj, "b.c");
    expect(testObj.b.c).toBe(undefined);

    deleteNestedProperty(testObj, "b.d.e");
    expect(testObj.b.d.e).toBe(undefined);
  });

  it("should throw error when intermediate key is not an object", () => {
    const testObj = {
      a: "string",
      b: {
        c: 123,
      },
    };

    expect(() => {
      deleteNestedProperty(testObj, "a.b");
    }).toThrow("Key 'b' in path 'a.b' is not an object");
  });

  it("should throw error when final key is not an object", () => {
    const testObj = {
      a: {
        b: "string",
      },
    };

    expect(() => {
      deleteNestedProperty(testObj, "a.b.c");
    }).toThrow("Key 'c' in path 'a.b.c' is not an object");
  });

  it("should throw error when trying to delete non-existent property", () => {
    const testObj = {
      a: {
        b: "exists",
      },
    };

    expect(() => {
      deleteNestedProperty(testObj, "a.nonexistent");
    }).toThrow("Cannot delete 'nonexistent' in path 'a.nonexistent'");
  });

  it("should handle deep nesting", () => {
    const testObj = {
      a: {
        b: {
          c: {
            d: {
              e: "deep",
            },
          },
        },
      },
    };

    deleteNestedProperty(testObj, "a.b.c.d.e");
    expect(testObj.a.b.c.d.e).toBe(undefined);
  });
});
