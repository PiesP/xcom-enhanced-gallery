/**
 * Polyfill for Solid JSX dev runtime used during Vitest transforms.
 * Solid 1.9 exposes only the production JSX runtime by default, and vite-plugin-solid
 * is configured to compile selected files only. When a TypeScript transform still emits
 * jsxDEV references (for example, in tests that run against Solid components without the
 * Babel preset applied), this lightweight adapter maps the dev runtime functions to the
 * standard JSX runtime implementation so rendering continues to work.
 */
import { jsx, jsxs } from 'solid-js/jsx-runtime';

export const Fragment = (props: { children?: unknown }) => props.children;
export { jsx, jsxs };

export const jsxDEV = jsx;
