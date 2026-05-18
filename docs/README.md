# @fimbul-works/nested-path

## Type Aliases

### Container

```ts
type Container = Record<string, any> | any[];
```

Defined in: [types.ts:4](https://github.com/fimbul-works/nested-path/blob/main/src/types.ts#L4)

Type of container with nested elements

***

### PathSeparatorFunction

```ts
type PathSeparatorFunction = (path) => string[];
```

Defined in: [types.ts:11](https://github.com/fimbul-works/nested-path/blob/main/src/types.ts#L11)

Function that splits a string path into it's components.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Path to separate |

#### Returns

`string`[]

- Array representing the path parts after separation

## Variables

### dotSeparator

```ts
const dotSeparator: PathSeparatorFunction;
```

Defined in: [separator.ts:9](https://github.com/fimbul-works/nested-path/blob/main/src/separator.ts#L9)

Split a string using dots.

#### Param

Path to split into parts

#### Returns

The path parts

***

### slashSeparator

```ts
const slashSeparator: PathSeparatorFunction;
```

Defined in: [separator.ts:17](https://github.com/fimbul-works/nested-path/blob/main/src/separator.ts#L17)

Split a string using slashes.

#### Param

Path to split into parts

#### Returns

The path parts

## Functions

### deleteAtPath()

```ts
function deleteAtPath<T, K>(
   input, 
   path, 
   separator?): void;
```

Defined in: [delete-at-path.ts:15](https://github.com/fimbul-works/nested-path/blob/main/src/delete-at-path.ts#L15)

Delete a nested property.

#### Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `T` *extends* [`Container`](#container) | [`Container`](#container) | Type of object or array |
| `K` *extends* `string` | keyof `T` & `string` | Key indexing T |

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `input` | `T` | `undefined` | The context object or array containing variables |
| `path` | `string` | `undefined` | The variable name using dot notation |
| `separator?` | [`PathSeparatorFunction`](#pathseparatorfunction) | `dotSeparator` | Function that splits the path into individual keys (default: dotSeparator) |

#### Returns

`void`

***

### getAtPath()

```ts
function getAtPath<V, T>(
   input, 
   path, 
   defaultValue?, 
   separator?): V;
```

Defined in: [get-at-path.ts:16](https://github.com/fimbul-works/nested-path/blob/main/src/get-at-path.ts#L16)

Retrieves a nested value from an object or array.

#### Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `V` | - | Expected type of the result |
| `T` *extends* [`Container`](#container) | [`Container`](#container) | Type of object or array |

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `input` | `T` | `undefined` | The context object or array to retrieve a value from |
| `path` | `string` | `undefined` | The path to parse |
| `defaultValue?` | `V` | `undefined` | Optional value to return when the requested path is not found |
| `separator?` | [`PathSeparatorFunction`](#pathseparatorfunction) | `dotSeparator` | Function that splits the path into individual keys (default: dotSeparator) |

#### Returns

`V`

The value at the path, or `defaultValue` if not found.

***

### hasAtPath()

```ts
function hasAtPath<T, K>(
   input, 
   path, 
   separator?): boolean;
```

Defined in: [has-at-path.ts:16](https://github.com/fimbul-works/nested-path/blob/main/src/has-at-path.ts#L16)

Checks if a key exists in an object or array.

#### Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `T` *extends* [`Container`](#container) | [`Container`](#container) | Type of object or array |
| `K` *extends* `string` | keyof `T` & `string` | Key indexing T |

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `input` | `T` | `undefined` | The object or array to check |
| `path` | `string` | `undefined` | The path using the configured separator notation |
| `separator?` | [`PathSeparatorFunction`](#pathseparatorfunction) | `dotSeparator` | Function that splits the path into individual keys (default: dotSeparator) |

#### Returns

`boolean`

`true` if the key exists, `false` otherwise.

***

### setAtPath()

```ts
function setAtPath<V, T, K>(
   input, 
   path, 
   value, 
   separator?): void;
```

Defined in: [set-at-path.ts:17](https://github.com/fimbul-works/nested-path/blob/main/src/set-at-path.ts#L17)

Assigns a value to the context object or array.

#### Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `V` | - | Type of value to set |
| `T` *extends* [`Container`](#container) | [`Container`](#container) | Type of object or array |
| `K` *extends* `string` | keyof `T` & `string` | Key indexing T |

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `input` | `T` | `undefined` | The context object or array containing variables |
| `path` | `string` | `undefined` | The variable name using dot notation |
| `value` | `V` | `undefined` | The new value to set |
| `separator?` | [`PathSeparatorFunction`](#pathseparatorfunction) | `dotSeparator` | Function that splits the path into individual keys (default: dotSeparator) |

#### Returns

`void`
