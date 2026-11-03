# @fimbul-works/nested-path

## Type Aliases

### CheckedPath

```ts
type CheckedPath<T, P, D> = string extends P ? never : [LiteralDelimiter<D>] extends [never] ? never : [ValidPath<T, P, D>] extends [true] ? unknown : never;
```

Validate the supplied path without imposing an autocomplete depth limit.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` | - |
| <a id="type-parameter-p"></a> `P` *extends* `string` | - |
| <a id="type-parameter-d"></a> `D` *extends* `string` | `"."` |

***

### Container

```ts
type Container = object;
```

An object or array that can contain nested data, including readonly inputs.

***

### DeletablePath

```ts
type DeletablePath<T, P, D> = CanDelete<T, P, D> extends true ? unknown : never;
```

Only optional properties and mutable, non-tuple array indices can be deleted.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t-1"></a> `T` | - |
| <a id="type-parameter-p-1"></a> `P` *extends* `string` | - |
| <a id="type-parameter-d-1"></a> `D` *extends* `string` | `"."` |

***

### LiteralDelimiter

```ts
type LiteralDelimiter<D> = true extends IsUnion<D> ? never : [D] extends [""] ? never : IsLiteralString<D> extends true ? D : never;
```

Only a single, nonempty literal delimiter has a statically known grammar.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-d-2"></a> `D` *extends* `string` |

***

### PathArgument

```ts
type PathArgument<T, P, D> = P & (
  | CheckedPath<T, P, D>
  | NoInfer<[LiteralDelimiter<D>] extends [never] ? never : Completions<T, D>>);
```

Finite suggestions plus validation of deeper paths and dictionary/array indices.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t-2"></a> `T` | - |
| <a id="type-parameter-p-2"></a> `P` *extends* `string` | - |
| <a id="type-parameter-d-3"></a> `D` *extends* `string` | `"."` |

***

### Paths

```ts
type Paths<T, D, Depth> = string extends D ? never : D extends "" ? never : SuggestedPaths<T, D, Depth>;
```

Path suggestions are bounded to keep editor work predictable on recursive schemas.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t-3"></a> `T` | - |
| <a id="type-parameter-d-4"></a> `D` *extends* `string` | `"."` |
| <a id="type-parameter-depth"></a> `Depth` *extends* `number` | `2` |

***

### PathSeparator

```ts
type PathSeparator<D> = D;
```

String delimiter; checked paths require one nonempty literal string.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-d-5"></a> `D` *extends* `string` | `string` |

***

### PathSeparatorFunction

```ts
type PathSeparatorFunction = (path) => string[];
```

Callable parser shape used by the internal delimiter cache.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`string`[]

***

### PathValue

```ts
type PathValue<T, P, D> = P extends `${infer Head}${D}${infer Rest}` ? PathValue<ReadKey<T, Head>, Rest, D> : ReadKey<T, P>;
```

Resolve a literal path, retaining absence from optional ancestors and arrays.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t-4"></a> `T` | - |
| <a id="type-parameter-p-3"></a> `P` *extends* `string` | - |
| <a id="type-parameter-d-6"></a> `D` *extends* `string` | `"."` |

***

### WithDefault

```ts
type WithDefault<V, F> = Exclude<V, undefined> | undefined extends V ? F : never;
```

A fallback replaces undefined, while null remains a value.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-v"></a> `V` |
| <a id="type-parameter-f"></a> `F` |

***

### WriteValue

```ts
type WriteValue<T, P, D> = [NonNullable<T>] extends [never] ? never : WriteFunctions<NonNullable<T>, P, D> extends (value) => void ? V : never;
```

A write must be valid for every possible input variant and supplied path.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t-5"></a> `T` | - |
| <a id="type-parameter-p-4"></a> `P` *extends* `string` | - |
| <a id="type-parameter-d-7"></a> `D` *extends* `string` | `"."` |

## Variables

### dotSeparator

```ts
const dotSeparator: ".";
```

Default literal dot delimiter.

***

### slashSeparator

```ts
const slashSeparator: "/";
```

Literal slash delimiter.

## Functions

### clearPathSeparators()

```ts
function clearPathSeparators(): void;
```

**`Internal`**

Clear the cached path parsers, primarily to isolate tests.

Future operations recreate parsers lazily. Existing parser references and
the exported delimiter constants remain usable.

#### Returns

`void`

Nothing; all entries are removed from the internal cache.

***

### deleteAtPath()

#### Call Signature

```ts
function deleteAtPath<T, P, D>(
   input,
   path,
   separator
): boolean;
```

Delete an optional property or splice an array using a literal string delimiter.

Mutates the input in place. Required properties, readonly destinations, and
tuple element removal are rejected at compile time. Ordinary array indices
are removed with the built-in splice, shifting later elements to the left.
Affected slots are checked before mutation; blocked or accessor-backed slots
return false without shifting ordinary arrays.

##### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| <a id="type-parameter-t-6"></a> `T` *extends* `object` | Type of the input object or array. |
| <a id="type-parameter-p-5"></a> `P` *extends* `string` | Literal path of a mutable optional property, dictionary entry, or ordinary array index. |
| <a id="type-parameter-d-8"></a> `D` *extends* `string` | Literal string delimiter used to interpret the path. |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | `T` | Object or array to mutate. |
| `path` | [`PathArgument`](#pathargument)\<`NoInfer`\<`T`\>, `P`, `NoInfer`\<`D`\>\> & `NoInfer`\<[`DeletablePath`](#deletablepath)\<`T`, `P`, `D`\>\> | Checked deletable path interpreted using the supplied string delimiter. |
| `separator` | `D` & [`LiteralDelimiter`](#literaldelimiter)\<`NoInfer`\<`D`\>\> | Nonempty literal string delimiter, such as "/" or "::". |

##### Returns

`boolean`

`true` if the mutation succeeds; `false` if the path cannot be traversed or the mutation fails.

##### Throws

If the separator is not a nonempty string.

#### Call Signature

```ts
function deleteAtPath<T, P>(
   input,
   path,
   separator?
): boolean;
```

Delete a mutable optional property or splice an ordinary array at a dot-separated path.

##### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| <a id="type-parameter-t-7"></a> `T` *extends* `object` | Type of the input object or array. |
| <a id="type-parameter-p-6"></a> `P` *extends* `string` | Literal dot-separated deletable path. |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | `T` | Object or array to mutate. |
| `path` | [`PathArgument`](#pathargument)\<`NoInfer`\<`T`\>, `P`\> & `NoInfer`\<[`DeletablePath`](#deletablepath)\<`T`, `P`\>\> | Checked deletable path using dot notation. |
| `separator?` | `undefined` | Omit or pass undefined to use the default dot separator. |

##### Returns

`boolean`

`true` if the mutation succeeds; `false` if the path cannot be traversed or the mutation fails.

##### Throws

If the separator is not a nonempty string.

***

### getAtPath()

#### Call Signature

```ts
function getAtPath<T, P, D, F>(
   input,
   path,
   defaultValue,
   separator
): WithDefault<PathValue<T, P, D>, F>;
```

Retrieve a value at a checked literal path using a literal string delimiter.

Optional ancestors, missing dictionary entries, and ordinary array lookups can
produce `undefined`. The fallback replaces `undefined`, while `null` is retained.
Traversal stops immediately when a lookup fails.

##### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| <a id="type-parameter-t-8"></a> `T` *extends* `object` | Type of the input object or array. |
| <a id="type-parameter-p-7"></a> `P` *extends* `string` | Literal path to retrieve. |
| <a id="type-parameter-d-9"></a> `D` *extends* `string` | Literal string delimiter used to interpret the path. |
| <a id="type-parameter-f-1"></a> `F` | Type of the fallback value. |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | `T` | Object or array to read without mutation. |
| `path` | [`PathArgument`](#pathargument)\<`NoInfer`\<`T`\>, `P`, `NoInfer`\<`D`\>\> | Path interpreted using the supplied string delimiter. |
| `defaultValue` | `F` | Value returned when traversal fails or the leaf is undefined. Pass `undefined` to read without a fallback. |
| `separator` | `D` & [`LiteralDelimiter`](#literaldelimiter)\<`NoInfer`\<`D`\>\> | Nonempty literal string delimiter, such as "/" or "::". |

##### Returns

[`WithDefault`](#withdefault)\<[`PathValue`](#pathvalue)\<`T`, `P`, `D`\>, `F`\>

The inferred path value, with possible undefined replaced by the fallback type.

##### Throws

If the separator is not a nonempty string.

##### Example

```ts
const input = { user: { name: "Odin" } };
getAtPath(input, "user/name", undefined, slashSeparator); // string
```

#### Call Signature

```ts
function getAtPath<T, P, F>(
   input,
   path,
   defaultValue,
   separator?
): WithDefault<PathValue<T, P>, F>;
```

Retrieve a value at a checked dot-separated path with a fallback.

##### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| <a id="type-parameter-t-9"></a> `T` *extends* `object` | Type of the input object or array. |
| <a id="type-parameter-p-8"></a> `P` *extends* `string` | Literal dot-separated path to retrieve. |
| <a id="type-parameter-f-2"></a> `F` | Type of the fallback value. |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | `T` | Object or array to read without mutation. |
| `path` | [`PathArgument`](#pathargument)\<`NoInfer`\<`T`\>, `P`\> | Checked path using dot notation. |
| `defaultValue` | `F` | Value returned for a missing or undefined result; null is retained. |
| `separator?` | `undefined` | Omit or pass undefined to use the default dot separator. |

##### Returns

[`WithDefault`](#withdefault)\<[`PathValue`](#pathvalue)\<`T`, `P`\>, `F`\>

The inferred path value, with possible undefined replaced by the fallback type.

##### Throws

If the separator is not a nonempty string.

#### Call Signature

```ts
function getAtPath<T, P>(
   input,
   path,
   defaultValue?,
   separator?
): PathValue<T, P>;
```

Retrieve a value at a checked dot-separated path without a fallback.

##### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| <a id="type-parameter-t-10"></a> `T` *extends* `object` | Type of the input object or array. |
| <a id="type-parameter-p-9"></a> `P` *extends* `string` | Literal dot-separated path to retrieve. |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | `T` | Object or array to read without mutation. |
| `path` | [`PathArgument`](#pathargument)\<`NoInfer`\<`T`\>, `P`\> | Checked path using dot notation. |
| `defaultValue?` | `undefined` | Omit or pass undefined to read without a fallback. |
| `separator?` | `undefined` | Omit or pass undefined to use the default dot separator. |

##### Returns

[`PathValue`](#pathvalue)\<`T`, `P`\>

The inferred path value, including undefined when traversal can fail.

***

### hasAtPath()

```ts
function hasAtPath(
   input,
   path,
   separator?
): boolean;
```

Check whether a runtime path resolves to a value other than undefined.

Accepts arbitrary string paths and parser callbacks. Null counts as present;
missing keys and non-traversable ancestors return false. Inherited properties
are included. This boolean check does not narrow the input's static type.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `input` | `object` | `undefined` | Object or array to inspect without mutation. |
| `path` | `string` | `undefined` | Runtime path to check. |
| `separator?` | `string` | `dotSeparator` | Parser for the path; defaults to [dotSeparator](#dotseparator). |

#### Returns

`boolean`

True when the path resolves to a value other than undefined.

#### Example

```ts
hasAtPath({ user: { name: "Odin" } }, "user.name"); // true
hasAtPath({ user: {} }, "user.name"); // false
```

***

### setAtPath()

#### Call Signature

```ts
function setAtPath<T, P, D>(
   input,
   path,
   value,
   separator
): boolean;
```

Assign a value at a checked path using a literal string delimiter.

Mutates the input in place. The value must fit every possible destination;
readonly destinations and undeclared fields are rejected at compile time.
Intermediate containers must already exist at runtime.

##### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| <a id="type-parameter-t-11"></a> `T` *extends* `object` | Type of the input object or array. |
| <a id="type-parameter-p-10"></a> `P` *extends* `string` | Literal path to update. |
| <a id="type-parameter-d-10"></a> `D` *extends* `string` | Literal string delimiter used to interpret the path. |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | `T` | Object or array to mutate. |
| `path` | [`PathArgument`](#pathargument)\<`NoInfer`\<`T`\>, `P`, `NoInfer`\<`D`\>\> | Checked path interpreted using the supplied string delimiter. |
| `value` | `NoInfer`\<[`WriteValue`](#writevalue)\<`T`, `P`, `D`\>\> | Value assignable to every possible destination of the path. |
| `separator` | `D` & [`LiteralDelimiter`](#literaldelimiter)\<`NoInfer`\<`D`\>\> | Nonempty literal string delimiter, such as "/" or "::". |

##### Returns

`boolean`

True if the mutation succeeds; false if the path cannot be traversed or the mutation fails.

##### Throws

If the separator is not a nonempty string.

##### Example

```ts
const input = { user: { name: "Odin" } };
setAtPath(input, "user/name", "Thor", slashSeparator);
```

#### Call Signature

```ts
function setAtPath<T, P>(
   input,
   path,
   value,
   separator?
): boolean;
```

Assign a value at a checked path using a literal string delimiter.

Mutates the input in place. The value must fit every possible destination;
readonly destinations and undeclared fields are rejected at compile time.
Intermediate containers must already exist at runtime.

##### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| <a id="type-parameter-t-12"></a> `T` *extends* `object` | Type of the input object or array. |
| <a id="type-parameter-p-11"></a> `P` *extends* `string` | Literal path to update. |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | `T` | Object or array to mutate. |
| `path` | [`PathArgument`](#pathargument)\<`NoInfer`\<`T`\>, `P`\> | Checked path interpreted using the supplied string delimiter. |
| `value` | `NoInfer`\<[`WriteValue`](#writevalue)\<`T`, `P`\>\> | Value assignable to every possible destination of the path. |
| `separator?` | `undefined` | Nonempty literal string delimiter, such as "/" or "::". |

##### Returns

`boolean`

True if the mutation succeeds; false if the path cannot be traversed or the mutation fails.

##### Throws

If the separator is not a nonempty string.

##### Example

```ts
const input = { user: { name: "Odin" } };
setAtPath(input, "user/name", "Thor", slashSeparator);
```
