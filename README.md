# @fimbul-works/nested-path

`@fimbul-works/nested-path` provides a small set of utilities for reading, writing, checking, and deleting values at arbitrary depths inside objects and arrays. Paths are plain strings, using dot notation by default, but the separator is fully customizable.

[![npm version](https://badge.fury.io/js/%40fimbul-works%2Fnested-path.svg)](https://www.npmjs.com/package/@fimbul-works/nested-path)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/microsoft/TypeScript)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@fimbul-works/nested-path)](https://bundlephobia.com/package/@fimbul-works/nested-path)

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Path Separators](#path-separators)
- [API](#api)
- [License](#license)

## Features

- 🔍 Read, write, check, and delete values at any depth
- 🔀 Works seamlessly with both objects and arrays
- 🔌 Configurable path separator — dot notation, slashes, or your own
- 🎯 Zero external dependencies
- 📦 Ultra-lightweight

## Quick Start

```typescript
import { hasAtPath, getAtPath, setAtPath, deleteAtPath } from '@fimbul-works/nested-path';

const obj = {
  user: {
    name: 'Odin',
    roles: ['admin', 'editor'],
    address: {
      city: 'Asgard'
    }
  }
};

// Check
hasAtPath(obj, 'user.address.city'); // true
hasAtPath(obj, 'user.age');          // false

// Read
getAtPath(obj, 'user.name');           // 'Odin'
getAtPath(obj, 'user.roles.0');        // 'admin'
getAtPath(obj, 'user.age', 'unknown'); // 'unknown' (default)

// Write
setAtPath(obj, 'user.address.city', 'Valhalla');
getAtPath(obj, 'user.address.city'); // 'Valhalla'

// Delete
deleteAtPath(obj, 'user.address.city');
hasAtPath(obj, 'user.address.city'); // false
```

## Installation

```bash
npm install @fimbul-works/nested-path
# or
yarn add @fimbul-works/nested-path
# or
pnpm install @fimbul-works/nested-path
```

## Path Separators

The default separator splits on `.`, but every function accepts an optional `PathSeparatorFunction` as its last argument. This makes any string format a valid path.

```typescript
import { getAtPath, type PathSeparatorFunction } from '@fimbul-works/nested-path';

const obj = { a: { b: { c: 42 } } };

// Slash-separated (e.g. file system or URL style)
const slashSeparator: PathSeparatorFunction = (path) => path.split('/');
getAtPath(obj, 'a/b/c', undefined, slashSeparator); // 42

// XPath-inspired
const xpathSeparator: PathSeparatorFunction = (path) => path.split('>').map(p => p.trim());
getAtPath(obj, 'a > b > c', undefined, xpathSeparator); // 42
```

The separator receives the full path string and returns an array of keys. Array indices are supported natively — any numeric string key is treated as an array index.

## API

### `hasAtPath(input, path, separator?)`

Returns `true` if a value exists at the given path, `false` otherwise. A value explicitly set to `undefined` is treated as absent.

```typescript
hasAtPath({ a: { b: 1 } }, 'a.b'); // true
hasAtPath({ a: { b: 1 } }, 'a.c'); // false
```

---

### `getAtPath(input, path, defaultValue?, separator?)`

Returns the value at the given path. Returns `defaultValue` (or `undefined`) if the path is not found.

```typescript
getAtPath({ a: { b: 42 } }, 'a.b');            // 42
getAtPath({ a: { b: 42 } }, 'a.c', 0);         // 0
getAtPath({ a: [10, 20, 30] }, 'a.1');          // 20
```

---

### `setAtPath(input, path, value, separator?)`

Assigns a value at the given path in-place. The final key is created if it does not exist. All intermediate keys must already resolve to an object or array — if any intermediate value is a primitive (string, number, function, etc.), an error is thrown.

```typescript
const obj = { a: { b: 42 } };
setAtPath(obj, 'a.b', 100);
// obj → { a: { b: 100 } }

setAtPath(obj, 'a.newKey', 'hello');
// obj → { a: { b: 100, newKey: 'hello' } }

setAtPath(obj, 'a.b.deep', 1); // throws — 'a.b' is a number, not traversable
```

---

### `deleteAtPath(input, path, separator?)`

Removes the value at the given path. For arrays, splices the element out by index. Throws if the key is not found.

```typescript
const obj = { a: { b: 42, c: 99 } };
deleteAtPath(obj, 'a.b');
// obj → { a: { c: 99 } }

const arr = { items: ['x', 'y', 'z'] };
deleteAtPath(arr, 'items.1');
// arr → { items: ['x', 'z'] }
```

---

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

Built with ⚡ by [FimbulWorks](https://github.com/fimbul-works)
