# @fimbul-works/nested-path

Small TypeScript utilities to get, set, check, and delete values in nested objects and arrays. Read and mutation paths are checked against your data, getter results are inferred automatically, and writes must match the destination type. Existence checks accept runtime paths and return a boolean.

[![npm version](https://badge.fury.io/js/%40fimbul-works%2Fnested-path.svg)](https://www.npmjs.com/package/@fimbul-works/nested-path)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/microsoft/TypeScript)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@fimbul-works/nested-path)](https://bundlephobia.com/package/@fimbul-works/nested-path)

## Installation

```sh
pnpm add @fimbul-works/nested-path
# or
npm install @fimbul-works/nested-path
```

TypeScript declarations require TypeScript 5.4 or newer with `strict` enabled. JavaScript callers can use the same functions; compile-time checks do not perform runtime schema validation.

## Quick start

```ts
import { getAtPath, setAtPath, deleteAtPath, hasAtPath } from '@fimbul-works/nested-path';

const person = {
  address: { street: 'MyStreet', city: 'Megalopolis' },
  jobs: ['coder', 'philanthropist'],
};

const address = getAtPath(person, 'address'); // { street: string; city: string }
const city = getAtPath(person, 'address.city'); // string
const job = getAtPath(person, 'jobs.1'); // string | undefined

setAtPath(person, 'address.city', 'Helsinki'); // true
hasAtPath(person, 'address.city'); // true
hasAtPath(person, 'anything.at.runtime'); // false

deleteAtPath(person, 'jobs.0'); // true; person.jobs becomes ['philanthropist']
```

Incorrect paths and incompatible writes are rejected by TypeScript:

```ts
getAtPath(person, 'job.1'); // Compile error: no property named 'job'
setAtPath(person, 'address.city', 123); // Compile error: city requires a string
deleteAtPath(person, 'address.city'); // Compile error: city is required
```

## Type inference

Checked reads and mutations require literal paths, or unions of known valid literal paths; an arbitrary `string` cannot be checked against the input shape. No return-type arguments or casts are needed. Optional ancestors, dictionary lookups, and ordinary array indices include `undefined` when the value might be missing. This remains true even without `noUncheckedIndexedAccess`.

Fixed tuples preserve the type of each position:

```ts
const jobs = ['coder', 'philanthropist'] as const;
getAtPath(jobs, '1'); // 'philanthropist'
getAtPath(jobs, '2'); // Compile error: index out of bounds
```

Fallbacks replace `undefined`, while a `null` leaf is retained:

```ts
const person: { address?: { city: string | null } } = {};
getAtPath(person, 'address.city'); // string | null | undefined
getAtPath(person, 'address.city', 'N/A'); // string | null
getAtPath(person, 'address.city', 42); // string | null | 42
```

Union reads include possible values and absence. Union writes must be compatible with every possible destination. Optional-property writes respect `exactOptionalPropertyTypes`.

Automatic path suggestions cover two levels of finite, declared keys. Deeper paths and dictionary/array indices are still checked and inferred on demand, subject to TypeScript's recursion limits. Primitives, functions, dates, regexes, maps, sets, and promises are leaves in the checked path types. Array paths expose indices rather than methods or `length`.

## String delimiters

Pass a nonempty string directly as the separator. Dot notation is the default:

```ts
import { slashSeparator, getAtPath, setAtPath } from '@fimbul-works/nested-path';

const person = { address: { city: 'Megalopolis' } };
getAtPath(person, 'address/city', undefined, '/'); // string
setAtPath(person, 'address/city', 'Helsinki', slashSeparator); // true
getAtPath(person, 'address::city', undefined, '::'); // string
```

`dotSeparator` and `slashSeparator` are the literal string constants `'.'` and `'/'`. All four operations accept string separators; regular expressions, empty strings, and parser callbacks are rejected. Checked reads and mutations need one known literal delimiter for type inference. `hasAtPath` also accepts a runtime string delimiter because its boolean result does not depend on resolving a path type.

The library caches one parser per delimiter in an internal `Map`. Repeated operations using the same delimiter reuse that parser. `createSeparator` is internal and is not part of the public API.

String splitting is literal, with no regex matching, escaping, trimming, or wildcard expansion. The separator `'.*'` splits on those two characters, for example. A key containing the active delimiter cannot be addressed literally with that delimiter; choose another delimiter when appropriate. Symbol keys cannot be represented by string paths.

Empty keys are preserved:

```ts
const data = { '': { '': { name: 'Odin' } }, child: { '': 42 } };
getAtPath(data, ''); // { '': { name: string } }
getAtPath(data, '..name'); // 'Odin'
getAtPath(data, 'child.'); // 42
```

An empty path addresses the key `''`; it does not mean the root object. Repeated, leading, and trailing delimiters denote empty key segments. Reads, writes, existence checks, and permitted deletions all follow this rule.

## API

| Function | Result | Behavior |
| --- | --- | --- |
| `getAtPath(input, path, defaultValue?, separator?)` | Inferred value type | Reads a checked path; returns the fallback on a missing or undefined lookup. |
| `setAtPath(input, path, value, separator?)` | `boolean` | Assigns a compatible value in place; returns whether assignment succeeded. |
| `deleteAtPath(input, path, separator?)` | `boolean` | Deletes an optional property or dictionary entry, or removes an ordinary array element and shifts later elements left. |
| `hasAtPath(input, path, separator?)` | `boolean` | Accepts runtime string paths; checks for a value other than undefined without narrowing the input's type. |
| `clearPathSeparators()` | `void` | Empties the internal parser cache, primarily for test isolation. |

All operations use dot notation when the separator is omitted. See the [generated API documentation](docs/README.md) for signatures and examples.

### Reading and checking

The getter stops at the first failed lookup and returns the fallback immediately, without traversing into it. Null leaf values, zero, false, and empty strings remain values. `hasAtPath` considers `undefined` absent and `null` present. Reads and checks follow inherited properties as normal JavaScript property access does.

`hasAtPath` returns a plain boolean, not a type predicate. A successful check does not narrow optional properties, array indices, or the input object's type. To narrow a retrieved value, check the getter result directly:

```ts
const config: { auth?: { token?: string } } = {};
const token = getAtPath(config, 'auth.token'); // string | undefined
if (token !== undefined) {
  token.toUpperCase(); // string
}
```


### Writing

All intermediate containers must already exist. Missing or non-object ancestors return `false`. An optional final property or dictionary entry can be created. Successful assignments return `true`, including assignment of the existing value; rejected assignments return `false`.

Readonly checks follow normal property assignment rules: a readonly property holding a mutable object still allows changes to that object's mutable children. Mutable fixed tuple positions can be assigned compatible values. Writes into a rest tuple use its rest element type; ambiguous positions before fixed trailing elements are rejected.

### Deleting

Deletion mutates the input in place and returns a boolean. It does not return a transformed object, remove fields from the input variable's declared type, or support chaining deletion results as objects.

Only mutable optional properties, dictionary entries, and ordinary array indices are deletable through the checked API. Required properties, readonly destinations, and fixed or variadic tuple element removal are rejected at compile time.

```ts
const person: { name: string; nickname?: string } = { name: 'Odin', nickname: 'O' };
deleteAtPath(person, 'nickname'); // true
// deleteAtPath(person, 'name'); // Compile error
```

Deletion returns `true` only when an own key is removed, including a key whose value is `undefined`. Missing keys, inherited-only final keys, array holes, and rejected mutations return `false`.

Before removing an array element, the affected slots and array length are checked. Sealed or frozen arrays, blocked slots, accessor-backed slots, and moves requiring new properties on a nonextensible array return `false` before shifting. Affected existing slots must be writable and configurable. Ordinary sparse arrays keep their holes; overridden instance `splice` methods are ignored.

### Runtime failures

Invalid separators always throw a `TypeError`, including in production, Vitest, and mutation operations. Getter and existence-check exceptions from property access propagate. Mutations catch traversal and mutation exceptions and return `false`; separator validation runs before that catch.

The array preflight prevents ordinary descriptor-related partial splice failures. Arbitrary side effects from proxies, custom constructors, or accessors elsewhere in an object graph are not transactional and cannot be rolled back.

## Parser cache and tests

`clearPathSeparators()` removes every cached parser. Subsequent operations recreate parsers lazily, including the default dot parser. Clearing the cache does not alter input data, invalidate the exported delimiter constants, or affect parser references already held internally.

```ts
import { afterEach } from 'vitest';
import { clearPathSeparators } from '@fimbul-works/nested-path';

afterEach(clearPathSeparators);
```

The map retains one function for each distinct delimiter until cleared. It is intended for the small set of delimiters used by an application.

## Exported types

The primary utility types are:

- `PathValue<T, P, D = '.'>` resolves a path's value type, including possible absence.
- `Paths<T, D = '.', Depth = 2>` generates bounded path suggestions, rather than an exhaustive validator. Greater depths on wide schemas can produce large unions.
- `WriteValue<T, P, D = '.'>` describes values safe for every possible destination.
- `PathSeparator<D>` is an alias for a string delimiter type; specifying `D` preserves the literal type.
- `PathSeparatorFunction` describes the internal cached parser shape. Public operations take strings.
- `Container` accepts objects, interfaces, and readonly arrays.

## Migration from 1.x

The four operation names and argument order are retained. Version 2 adds inferred result types and stricter path and mutation checks:

- Remove explicit result-type arguments such as `getAtPath<string>(...)`.
- Replace parser callbacks with literal strings such as `'.'`, `'/'`, or `'::'`. `dotSeparator` and `slashSeparator` are now string constants. Regex and arbitrary callback separators are not supported.
- Use known literal paths for reads and mutations. `hasAtPath` still accepts runtime string paths.
- Declare properties as optional before deleting them through the checked API.
- Handle possible absence when reading ordinary array elements and dictionary entries.
- Set and delete operations now return success booleans. Deleting an own undefined-valued key succeeds.
- The getter returns its fallback immediately when traversal fails.

## VSCode playground and integration fixture

Open [examples/intellisense.ts](examples/intellisense.ts) in VSCode and hover the exported variables to inspect inferred types. Use Ctrl+Space inside path strings to inspect the finite path suggestions. The folder has its own [tsconfig.json](examples/tsconfig.json), so VSCode uses strict checks and exact optional-property semantics.

The [configuration fixture](examples/config-fixture.ts) includes database replicas, credentials, tenant invoices with nested line-item arrays, dictionaries, nullable services, a discriminated union, readonly tuples, empty keys, and recursive nodes. The playground includes intentionally invalid calls inside an uncalled function; temporarily remove their `@ts-expect-error` comments to inspect diagnostics.

The README examples are extracted and tested directly by [src/readme.test.ts](src/readme.test.ts): type comments are checked, value comments are asserted at runtime, and examples marked `Compile error` must fail type checking without being executed.

Integration tests exercise all four operations on fresh fixtures using dot, slash, and multi-character delimiters. Editor tests use TypeScript's language service to check completions and hover types on the same fixture. They verify the underlying TypeScript behavior, while VSCode extensions and editor settings may affect presentation. Automatic path suggestions remain bounded to two levels; supplied deeper paths are checked and inferred.

## Development

```sh
pnpm typecheck          # Source, type regressions, and examples
pnpm test:run           # Compile-time checks, runtime integration, and editor-service tests
pnpm typecheck:examples # Check the VSCode playground
pnpm test               # Compile-time checks, followed by tests in watch mode
pnpm build              # ESM, CommonJS, declarations, and API documentation
```

## License

MIT — see [LICENSE](LICENSE).
