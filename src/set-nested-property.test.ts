import { describe, expect, it } from "vitest";
import { setNestedProperty } from "./index";

describe("setNestedProperty", () => {
  it("should set nested property values", () => {
    const testObj = {
      a: 1,
      b: {
        c: "old",
        d: {
          e: "nested",
        },
      },
    };

    setNestedProperty(testObj, "a", 42);
    expect(testObj.a).toBe(42);

    setNestedProperty(testObj, "b.c", "new");
    expect(testObj.b.c).toBe("new");

    setNestedProperty(testObj, "b.d.e", "updated");
    expect(testObj.b.d.e).toBe("updated");
  });

  it("should set property to various types", () => {
    const testObj = {
      a: "original",
      b: { c: 0 },
    };

    setNestedProperty(testObj, "a", null);
    expect(testObj.a).toBe(null);

    setNestedProperty(testObj, "b.c", { nested: "object" });
    expect(testObj.b.c).toEqual({ nested: "object" });
  });

  it("should throw error when intermediate key is not an object", () => {
    const testObj = {
      a: "string",
      b: {
        c: 123,
      },
    };

    expect(() => {
      setNestedProperty(testObj, "a.b", "value");
    }).toThrow("Key 'b' in path 'a.b' not found");
  });

  it("should throw error when final key is not an object", () => {
    const testObj = {
      a: {
        b: "string",
      },
    };

    expect(() => {
      setNestedProperty(testObj, "a.b.c", "value");
    }).toThrow("Key 'c' in path 'a.b.c' not found");
  });

  it("should throw error when trying to set non-existent property", () => {
    const testObj = {
      a: {
        b: "exists",
      },
    };

    expect(() => {
      setNestedProperty(testObj, "a.nonexistent", "value");
    }).toThrow("Cannot update 'nonexistent' in path 'a.nonexistent'");
  });

  it("should handle single-level property setting", () => {
    const testObj = { a: "old" };
    setNestedProperty(testObj, "a", "new");
    expect(testObj.a).toBe("new");
  });

  it("should throw error for non-existent single-level property", () => {
    const testObj = { a: "exists" };
    expect(() => {
      setNestedProperty(testObj, "nonexistent", "value");
    }).toThrow("Cannot update 'nonexistent' in path 'nonexistent'");
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

    setNestedProperty(testObj, "a.b.c.d.e", "updated");
    expect(testObj.a.b.c.d.e).toBe("updated");
  });

  it("should set values through array indices", () => {
    const obj = { user: { permissions: [{ token: "abc" }, { token: "def" }] } };
    setNestedProperty(obj, "user.permissions.0.token", "xyz");
    expect(obj.user.permissions[0].token).toBe("xyz");
    expect(obj.user.permissions[1].token).toBe("def");
  });

  it("should set array elements directly", () => {
    const obj = { items: [10, 20, 30] };
    setNestedProperty(obj, "items.1", 99);
    expect(obj.items[1]).toBe(99);
  });

  it("should maintain object references", () => {
    const testObj = {
      a: {
        b: "original",
        c: "unchanged",
      },
    };
    const originalA = testObj.a;

    setNestedProperty(testObj, "a.b", "modified");
    expect(testObj.a).toBe(originalA); // Same reference
    expect(testObj.a.b).toBe("modified");
    expect(testObj.a.c).toBe("unchanged");
  });
});
