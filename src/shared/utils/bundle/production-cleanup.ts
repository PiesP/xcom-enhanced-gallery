/**
 * Build-time string transforms used by Vite/Rollup post-processing.
 *
 * IMPORTANT:
 * - Keep this module side-effect free.
 * - Do not import runtime-only services here.
 * - This is consumed by the build config and unit tests.
 */

function escapeRegExp(source: string): string {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Removes empty `__esmMin(() => {})` init wrappers and their calls.
 *
 * Example patterns targeted:
 * - `var init_x = __esmMin((() => {}));`
 * - `let init_x = __esmMin((() => { }));`
 * - `const init_x = __esmMin((() => {\n}));`
 * - `init_x();`
 *
 * This function is intentionally conservative:
 * - It only removes wrappers whose function body is empty.
 * - It only removes calls that match the removed wrapper names.
 */
export function stripEmptyEsmMinInitWrappers(code: string): string {
  const removedNames = new Set<string>();

  // Match declarations like: var init_x = __esmMin((() => {}));
  // Notes:
  // - `init_` prefix is used by Vite/Rollup for ESM init wrappers.
  // - We only match arrow functions with an empty block body.
  const declRe =
    /\b(?:var|let|const)\s+(init_[a-zA-Z0-9_$]+)\s*=\s*__esmMin\(\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)\s*\)\s*;?/g;

  let result = code.replace(declRe, (_match, name: string) => {
    removedNames.add(name);
    return '';
  });

  if (removedNames.size === 0) {
    return result;
  }

  for (const name of removedNames) {
    const callRe = new RegExp(`\\b${escapeRegExp(name)}\\(\\)\\s*;?\\s*\\n?`, 'g');
    result = result.replace(callRe, '');
  }

  return result;
}
