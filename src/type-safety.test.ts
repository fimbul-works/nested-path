import { describe, expect, expectTypeOf, it } from "vitest";
import * as api from "./index.js";
import {
  deleteAtPath,
  dotSeparator,
  getAtPath,
  hasAtPath,
  type Paths,
  type PathValue,
  setAtPath,
  slashSeparator,
  type WriteValue,
} from "./index.js";

describe("typed paths", () => {
  it("only exports the checked operations", () => {
    expect("getAtPathDynamic" in api).toBe(false);
    expect("setAtPathDynamic" in api).toBe(false);
    expect("deleteAtPathDynamic" in api).toBe(false);
  });
  it("infers objects, arrays, tuples, numeric keys and literal delimiters", () => {
    const foo = { address: { street: "MyStreet", city: "Megalopolis" }, jobs: ["coder", "philanthropist"] };
    expectTypeOf(getAtPath(foo, "address")).toEqualTypeOf<typeof foo.address>();
    expectTypeOf(getAtPath(foo, "address.city")).toEqualTypeOf<string>();
    expectTypeOf(getAtPath(foo, "jobs.1")).toEqualTypeOf<string | undefined>();
    expectTypeOf(getAtPath(foo, "jobs.1", false)).toEqualTypeOf<string | boolean>();
    expectTypeOf(getAtPath(foo, "jobs.1", undefined)).toEqualTypeOf<string | undefined>();
    expectTypeOf(getAtPath(foo, "address/city", undefined, slashSeparator)).toEqualTypeOf<string>();
    expectTypeOf(getAtPath(foo, "jobs/1", undefined, slashSeparator)).toEqualTypeOf<string | undefined>();
    expectTypeOf(getAtPath(foo, "address::city", undefined, "::")).toEqualTypeOf<string>();
    expectTypeOf(getAtPath(foo, "address.city", 123)).toEqualTypeOf<string>();
    expectTypeOf(getAtPath(["coder", "philanthropist"] as const, "1")).toEqualTypeOf<"philanthropist">();
    expectTypeOf(getAtPath({ 42: { name: "answer" } }, "42.name")).toEqualTypeOf<string>();
    expectTypeOf(getAtPath({ "": { "": 1 } }, ".")).toEqualTypeOf<number>();
    expectTypeOf(getAtPath({ "with.dot": 42 }, "with.dot", undefined, slashSeparator)).toEqualTypeOf<number>();
    expect(getAtPath(foo, "jobs/1", undefined, slashSeparator)).toBe("philanthropist");
    expect(getAtPath(foo, "address::city", undefined, "::")).toBe("Megalopolis");
  });

  it("checks writes and optional-property or array deletions with every delimiter", () => {
    const foo: { address: { city: string; street?: string }; jobs: string[] } = {
      address: { city: "Megalopolis", street: "MyStreet" },
      jobs: ["coder", "philanthropist"],
    };
    expectTypeOf(setAtPath(foo, "address.city", "Helsinki")).toEqualTypeOf<boolean>();
    setAtPath(foo, "jobs/1", "writer", slashSeparator);
    setAtPath(foo, "address::street", "NewStreet", "::");
    expect(foo.address.city).toBe("Helsinki");
    expect(foo.jobs).toEqual(["coder", "writer"]);
    expectTypeOf(deleteAtPath(foo, "address/street", slashSeparator)).toEqualTypeOf<boolean>();
    deleteAtPath(foo, "jobs::0", "::");
    expect(foo.address.street).toBeUndefined();
    expect(foo.jobs).toEqual(["writer"]);
    setAtPath(foo, "address.street", "Restored");
    deleteAtPath(foo, "address.street");
    expect(hasAtPath(foo, "address.street")).toBe(false);
    expect(hasAtPath(foo, "any.runtime.path")).toBe(false);
  });

  it("returns fallback immediately instead of traversing into it", () => {
    const input: { a?: { b: string } } = {};
    const fallback = { b: "must not be traversed" };
    expect(getAtPath(input, "a.b", fallback)).toBe(fallback);
    expect(getAtPath({ a: null }, "a", "fallback")).toBeNull();
    let reads = 0;
    const accessor = {
      get value() {
        reads++;
        return 42;
      },
    };
    expect(getAtPath(accessor, "value")).toBe(42);
    expect(reads).toBe(1);
  });

  it("reports mutation failures and rejects an empty delimiter", () => {
    const input: { parent?: { name?: string } } = {};
    expect(setAtPath(input, "parent.name", "new")).toBe(false);
    expect(deleteAtPath(input, "parent.name")).toBe(false);
    const absent: { name?: string } = {};
    expect(deleteAtPath(absent, "name")).toBe(false);
  });

  it("exports literal string delimiters and keeps parser creation private", () => {
    expect(dotSeparator).toBe(".");
    expect(slashSeparator).toBe("/");
    expectTypeOf(dotSeparator).toEqualTypeOf<".">();
    expectTypeOf(slashSeparator).toEqualTypeOf<"/">();
    expect("createSeparator" in api).toBe(false);
  });
});

// These functions are compiled by test:types, but intentionally never executed.
function checkTypes(
  optional: { address?: { city: string | null } | null },
  dictionary: Record<string, { count: number }>,
  tuple: [string, number?],
  union: { item: { name: string; shared: string | number } } | { item: { count: number; shared: number | boolean } },
  readonlyInput: {
    readonly address: { city: string };
    readonly name?: string;
    readonly jobs: readonly { title: string }[];
  },
  path: string,
  unionPath: "name" | "count",
  delimiter: string,
  unionDelimiter: "." | "/",
) {
  expectTypeOf(getAtPath(optional, "address.city")).toEqualTypeOf<string | null | undefined>();
  expectTypeOf(getAtPath(optional, "address.city", 42)).toEqualTypeOf<string | null | number>();
  expectTypeOf(getAtPath(dictionary, "anything.count")).toEqualTypeOf<number | undefined>();
  expectTypeOf(getAtPath(tuple, "0")).toEqualTypeOf<string>();
  expectTypeOf(getAtPath(tuple, "1")).toEqualTypeOf<number | undefined>();
  expectTypeOf(getAtPath(union, "item.name")).toEqualTypeOf<string | undefined>();
  expectTypeOf(getAtPath(union, "item.shared")).toEqualTypeOf<string | number | boolean>();
  expectTypeOf<WriteValue<typeof union, "item.shared">>().toEqualTypeOf<number>();
  setAtPath(union, "item.shared", 42);
  setAtPath(readonlyInput, "address.city", "new");
  setAtPath(readonlyInput, "jobs.0.title", "new");
  setAtPath(dictionary, "new.count", 1);
  setAtPath(optional, "address.city", null);
  deleteAtPath(optional, "address");
  expectTypeOf<PathValue<{ a: { b: number } }, "a.b">>().toEqualTypeOf<number>();
  expectTypeOf<Paths<{ a: { b: number } }>>().toEqualTypeOf<"a" | "a.b">();
  type Tree = { value: number; next?: Tree };
  const tree: Tree = { value: 1 };
  expectTypeOf(getAtPath(tree, "next.next.next.next.next.next.value")).toEqualTypeOf<number | undefined>();
  expectTypeOf<Paths<Tree>>().toExtend<string>();

  const indexed: { [key: string]: number; required: number; optional?: number } = { required: 1 };
  expectTypeOf(getAtPath(indexed, "required")).toEqualTypeOf<number>();
  expectTypeOf(getAtPath(indexed, "missing")).toEqualTypeOf<number | undefined>();
  expectTypeOf(getAtPath(indexed, "optional")).toEqualTypeOf<number | undefined>();
  deleteAtPath(indexed, "missing");
  deleteAtPath(indexed, "optional");
  const pattern: { [key: `field${string}`]: number } = {};
  expectTypeOf(getAtPath(pattern, "fieldName")).toEqualTypeOf<number | undefined>();
  setAtPath(pattern, "fieldName", 1);
  deleteAtPath(pattern, "fieldName");
  const optionalValue: { name?: string; explicit?: string | undefined } = {};
  setAtPath(optionalValue, "name", "new");

  setAtPath(optionalValue, "explicit", undefined);
  const readonlyDictionary: Readonly<Record<string, number>> = {};
  const nestedArray: { rows: { id: number }[][] } = { rows: [] };
  expectTypeOf(getAtPath(nestedArray, "rows.0.1.id")).toEqualTypeOf<number | undefined>();
  setAtPath(nestedArray, "rows.0.1.id", 1);
  const restTuple: [string, ...number[]] = ["name"];
  expectTypeOf(getAtPath(restTuple, "0")).toEqualTypeOf<string>();
  expectTypeOf(getAtPath(restTuple, "3")).toEqualTypeOf<string | number | undefined>();
  setAtPath(restTuple, "3", 42);
  const trailingTuple: [...string[], number] = [1];
  const optionalRest: [string?, ...number[]] = [];
  setAtPath(optionalRest, "3", 42);
  // @ts-expect-error The rest array accepts numbers, not the fixed prefix type
  setAtPath(restTuple, "3", "new");
  // @ts-expect-error Variadic tuple splicing would shift fixed positions
  deleteAtPath(restTuple, "0");
  // @ts-expect-error Variadic tuple splicing can remove the fixed trailing slot
  deleteAtPath(trailingTuple, "0");
  // @ts-expect-error An ambiguous tuple position cannot be safely assigned
  setAtPath(trailingTuple, "0", "new");
  // @ts-expect-error The optional prefix does not change the rest value type
  setAtPath(optionalRest, "3", "new");
  const mixedDeletion = {} as { name?: string } | { name: string };
  const separatorUnion = {} as typeof dotSeparator | typeof slashSeparator;
  const wideSeparator = dotSeparator as import("./types.js").PathSeparator;
  const validUnion = {} as "address" | "address.city";
  expectTypeOf(getAtPath(optional, validUnion)).toEqualTypeOf<{ city: string | null } | string | null | undefined>();
  // A wide recursive schema must not expand every possible deep path for autocomplete.
  interface WideTree {
    value: number;
    a: WideTree;
    b: WideTree;
    c: WideTree;
    d: WideTree;
    e: WideTree;
    f: WideTree;
    g: WideTree;
    h: WideTree;
    i: WideTree;
    j: WideTree;
    k: WideTree;
    l: WideTree;
    m: WideTree;
    n: WideTree;
    o: WideTree;
    p: WideTree;
    q: WideTree;
    r: WideTree;
    s: WideTree;
    t: WideTree;
  }
  const wideTree = {} as WideTree;
  expectTypeOf(getAtPath(wideTree, "a.b.c.d.e.f.g.value")).toEqualTypeOf<number>();
  expectTypeOf<Paths<WideTree>>().toExtend<string>();

  // @ts-expect-error Optional properties do not implicitly accept undefined with exactOptionalPropertyTypes
  setAtPath(optionalValue, "name", undefined);
  // @ts-expect-error Optional tuple slots also follow exact optional semantics
  setAtPath(tuple, "1", undefined);
  // @ts-expect-error Explicitly declared required keys remain required alongside an index signature
  deleteAtPath(indexed, "required");
  // @ts-expect-error Readonly index signature
  setAtPath(readonlyDictionary, "anything", 1);
  // @ts-expect-error Readonly index signature
  deleteAtPath(readonlyDictionary, "anything");
  // @ts-expect-error Some union variants require this property
  deleteAtPath(mixedDeletion, "name");
  // @ts-expect-error A union of separators has no single known grammar
  getAtPath(optional, "address", undefined, separatorUnion);
  // @ts-expect-error Widened separator metadata cannot be inferred
  getAtPath(optional, "address", undefined, wideSeparator);
  // @ts-expect-error Date is a leaf
  getAtPath({ created: new Date() }, "created.getTime");
  // @ts-expect-error Unknown union path member
  getAtPath(optional, "" as "address" | "missing");
  // @ts-expect-error Symbol keys cannot be expressed in a string path
  getAtPath({ [Symbol.iterator]: 42 }, "Symbol.iterator");

  // @ts-expect-error Explicit generics must agree with the actual path
  getAtPath<{ name: string }, "missing">({ name: "coder" }, "name");
  // @ts-expect-error Supplying a fallback type does not make the fallback optional
  getAtPath<{ jobs: string[] }, "jobs.0", number>({ jobs: [] }, "jobs.0");
  // @ts-expect-error Unknown property
  getAtPath({ jobs: ["coder"] }, "job.0");
  // @ts-expect-error Scalar traversal
  getAtPath({ name: "coder" }, "name.length");
  // @ts-expect-error Tuple index out of bounds
  getAtPath(tuple, "2");
  // @ts-expect-error Arrays expose indices, not methods
  getAtPath({ jobs: ["coder"] }, "jobs.map");
  // @ts-expect-error Negative array index
  getAtPath({ jobs: ["coder"] }, "jobs.-1");
  // @ts-expect-error Fractional array index
  getAtPath({ jobs: ["coder"] }, "jobs.1.5");
  // @ts-expect-error Noncanonical array index
  getAtPath({ jobs: ["coder"] }, "jobs.01");
  // @ts-expect-error Dynamic strings are not statically known
  getAtPath(optional, path);
  // @ts-expect-error Arbitrary callback has no known grammar
  getAtPath(optional, "address/city", undefined, (p: string) => p.split("/"));
  // @ts-expect-error Slash parser does not parse dot paths
  getAtPath({ a: { b: 1 } }, "a.b", undefined, slashSeparator);
  // @ts-expect-error A key containing the delimiter cannot be addressed with that delimiter
  getAtPath({ "a.b": 1 }, "a.b");
  // @ts-expect-error Wrong write value cannot widen the inferred input or path
  setAtPath({ name: "coder" }, "name", 42);
  // @ts-expect-error Unknown write path
  setAtPath({ name: "coder" }, "missing", "new");
  // @ts-expect-error Readonly leaf
  setAtPath(readonlyInput, "address", { city: "new" });
  // @ts-expect-error Readonly array element
  setAtPath(readonlyInput, "jobs.0", { title: "new" });
  // @ts-expect-error Tuple write type
  setAtPath(tuple, "0", 42);
  // @ts-expect-error Missing in a possible union variant
  setAtPath(union, "item.name", "new");
  // @ts-expect-error Not assignable to every union variant
  setAtPath(union, "item.shared", "new");
  // @ts-expect-error A union of paths requires a value compatible with both destinations
  setAtPath({ name: "coder", count: 1 }, unionPath, "new");
  // @ts-expect-error Deleting a required property invalidates the object type
  deleteAtPath({ name: "coder" }, "name");
  // @ts-expect-error A required property that includes undefined is still required
  deleteAtPath({ name: undefined as string | undefined }, "name");
  // @ts-expect-error Cannot splice tuple positions
  deleteAtPath(tuple, "0");
  // @ts-expect-error Cannot splice an optional tuple position either
  deleteAtPath(tuple, "1");
  // @ts-expect-error Readonly optional property
  deleteAtPath(readonlyInput, "name");
  // @ts-expect-error Readonly array
  deleteAtPath(readonlyInput, "jobs.0");
  // @ts-expect-error A regex is not a literal string delimiter
  getAtPath({ a: 1 }, "a", undefined, /\s+/);
  // @ts-expect-error Existence checks require string delimiters
  hasAtPath(optional, "address", (path: string) => path.split(/\s+/));
  // @ts-expect-error A regex is not a string delimiter
  hasAtPath(optional, "address", /\./);
  // @ts-expect-error Empty delimiter has no path grammar
  getAtPath({ a: 1 }, "a", undefined, "");
  // @ts-expect-error Runtime delimiters cannot describe a statically known separator
  getAtPath({ a: 1 }, "a", undefined, delimiter);
  // @ts-expect-error Template-pattern delimiters also have an unknown runtime grammar
  getAtPath({ a: 1 }, "a", undefined, delimiter as `sep${string}`);
  // @ts-expect-error Numeric template patterns are not single literals
  getAtPath({ a: 1 }, "a", undefined, delimiter as `${number}`);
  // @ts-expect-error Union delimiter has no single known grammar
  getAtPath({ a: 1 }, "a", undefined, unionDelimiter);
}
void checkTypes;
