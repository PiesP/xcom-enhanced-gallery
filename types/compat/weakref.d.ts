// types/compat/weakref.d.ts
// Compatibility shim for WeakRef TypeScript definitions
// Rationale: Some environments or toolchains (for example, Vitest/ts-node or esbuild
// transpilations) may not include TypeScript `lib` definitions that contain the WeakRef
// type. Happy-dom and other dependencies use WeakRef in their type signatures, which
// can lead to TS2304 errors (Cannot find name 'WeakRef') during test-type checks or
// certain runtime compiles. This file declares a minimal global WeakRef interface
// to ensure those type checks pass across differing build environments.

declare global {
  // Minimal WeakRef interface for environments where it's absent in lib definitions.
  // Do not redeclare the WeakRef constructor since it may already exist in lib definitions.
  interface WeakRef<T extends object> {
    deref(): T | undefined;
  }
}

export {};
