/**
 * @fileoverview Phase 14.1.3: LazyIcon Reactive Evaluation Policy
 * @description Verify that components use getter functions for props-dependent values
 * instead of static evaluation to maintain Solid.js reactivity.
 *
 * Policy: Props can change over time. Don't evaluate them statically - use getter
 * functions to maintain fine-grained reactivity.
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Solid.js Reactive Evaluation Policy', () => {
  setupGlobalTestIsolation();

  describe('LazyIcon - Props Reactivity', () => {
    it('should NOT statically evaluate className from props', () => {
      const filePath = join(process.cwd(), 'src/shared/components/ui/Icon/lazy-icon.tsx');
      const content = readFileSync(filePath, 'utf-8');

      // Anti-pattern: const className = [...props.className...];
      // Should be: const className = () => [...props.className...];
      const antiPattern = /const\s+className\s*=\s*\[.+?props\.className.+?\]\.filter/s;

      expect(content).not.toMatch(antiPattern);
    });

    it('should NOT statically evaluate style from props', () => {
      const filePath = join(process.cwd(), 'src/shared/components/ui/Icon/lazy-icon.tsx');
      const content = readFileSync(filePath, 'utf-8');

      // Anti-pattern: const style = props.size ? {...} : undefined;
      // Should be: const style = () => props.size ? {...} : undefined;
      const antiPattern = /const\s+style\s*=\s*props\.size\s*\?/;

      expect(content).not.toMatch(antiPattern);
    });

    it('should use getter functions for className and style', () => {
      const filePath = join(process.cwd(), 'src/shared/components/ui/Icon/lazy-icon.tsx');
      const content = readFileSync(filePath, 'utf-8');

      // Expected pattern: const className = () => ...
      const hasClassNameGetter = /const\s+className\s*=\s*\(\)\s*=>/.test(content);
      // Expected pattern: const style = () => ...
      const hasStyleGetter = /const\s+style\s*=\s*\(\)\s*=>/.test(content);

      expect(hasClassNameGetter).toBe(true);
      expect(hasStyleGetter).toBe(true);
    });

    it('should call getter functions in JSX', () => {
      const filePath = join(process.cwd(), 'src/shared/components/ui/Icon/lazy-icon.tsx');
      const content = readFileSync(filePath, 'utf-8');

      // Should use className() and style() in JSX
      const hasClassNameCall = /class=\{className\(\)\}/.test(content);
      const hasStyleCall = /style=\{style\(\)\}/.test(content);

      expect(hasClassNameCall).toBe(true);
      expect(hasStyleCall).toBe(true);
    });
  });
});
