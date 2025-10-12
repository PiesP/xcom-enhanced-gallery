/**
 * Phase 14.1.3: LazyIcon static evaluation test
 *
 * Objective: Verify that LazyIcon uses getter functions for props-dependent
 * values instead of static evaluation.
 *
 * SolidJS Best Practice: Props can change over time. Don't evaluate them
 * statically - use getter functions to maintain reactivity.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('[Phase 14.1.3] LazyIcon - Reactive Evaluation', () => {
  it('should NOT statically evaluate className from props', () => {
    const filePath = join(process.cwd(), 'src/shared/components/lazy-icon.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // Anti-pattern: const className = [...props.className...];
    // Should be: const className = () => [...props.className...];
    const antiPattern = /const\s+className\s*=\s*\[.+?props\.className.+?\]\.filter/s;

    expect(content).not.toMatch(antiPattern);

    if (antiPattern.test(content)) {
      throw new Error(
        'Found static evaluation of className from props. ' +
          'Use getter function: const className = () => [...props.className...].filter(Boolean).join(" ")'
      );
    }
  });

  it('should NOT statically evaluate style from props', () => {
    const filePath = join(process.cwd(), 'src/shared/components/lazy-icon.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // Anti-pattern: const style = props.size ? {...} : undefined;
    // Should be: const style = () => props.size ? {...} : undefined;
    const antiPattern = /const\s+style\s*=\s*props\.size\s*\?/;

    expect(content).not.toMatch(antiPattern);

    if (antiPattern.test(content)) {
      throw new Error(
        'Found static evaluation of style from props. ' +
          'Use getter function: const style = () => props.size ? {...} : undefined'
      );
    }
  });

  it('should use getter functions for className and style', () => {
    const filePath = join(process.cwd(), 'src/shared/components/lazy-icon.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // Expected pattern: const className = () => ...
    const hasClassNameGetter = /const\s+className\s*=\s*\(\)\s*=>/.test(content);
    // Expected pattern: const style = () => ...
    const hasStyleGetter = /const\s+style\s*=\s*\(\)\s*=>/.test(content);

    expect(hasClassNameGetter).toBe(true);
    expect(hasStyleGetter).toBe(true);
  });

  it('should call getter functions in JSX', () => {
    const filePath = join(process.cwd(), 'src/shared/components/lazy-icon.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // Should use className() and style() in JSX
    const hasClassNameCall = /class=\{className\(\)\}/.test(content);
    const hasStyleCall = /style=\{style\(\)\}/.test(content);

    expect(hasClassNameCall).toBe(true);
    expect(hasStyleCall).toBe(true);
  });
});
