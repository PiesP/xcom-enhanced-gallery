import type { JSX } from 'solid-js';

declare module 'solid-js/jsx-runtime' {
  // Solid's runtime exports `jsx` and `jsxs`, but the published typings only
  // re-export the JSX namespace. Augment the module so TypeScript is aware of
  // the runtime helpers without disturbing the existing JSX definitions.
  export { JSX } from 'solid-js';
  export const jsx: (...args: unknown[]) => unknown;
  export const jsxs: (...args: unknown[]) => unknown;
}
