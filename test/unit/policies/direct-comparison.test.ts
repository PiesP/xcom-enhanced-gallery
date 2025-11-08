/**
 * @fileoverview Phase 14.1.2: Direct Comparison in JSX Policy
 * @description Verify that simple boolean checks are used directly in JSX
 * instead of unnecessary createMemo.
 *
 * Policy: Simple comparisons like `props.x > 0` can be used directly in JSX
 * without createMemo. The fine-grained reactivity system handles dependency
 * tracking automatically.
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Solid.js Direct Comparison Policy', () => {
  setupGlobalTestIsolation();

  describe('Toolbar - Simple Comparison Optimization', () => {
    it('should NOT wrap simple comparison in createMemo for canGoNext', () => {
      const filePath = join(process.cwd(), 'src/shared/components/ui/Toolbar/Toolbar.tsx');
      const content = readFileSync(filePath, 'utf-8');

      // Anti-pattern: const canGoNext = createMemo(() => props.currentIndex < props.totalCount - 1);
      const antiPattern =
        /const\s+canGoNext\s*=\s*createMemo\s*\(\s*\(\)\s*=>\s*props\.currentIndex\s*<\s*props\.totalCount/;

      expect(content).not.toMatch(antiPattern);
    });

    it('should NOT wrap simple comparison in createMemo for canGoPrevious', () => {
      const filePath = join(process.cwd(), 'src/shared/components/ui/Toolbar/Toolbar.tsx');
      const content = readFileSync(filePath, 'utf-8');

      // Anti-pattern: const canGoPrevious = createMemo(() => props.currentIndex > 0);
      const antiPattern =
        /const\s+canGoPrevious\s*=\s*createMemo\s*\(\s*\(\)\s*=>\s*props\.currentIndex\s*>\s*0/;

      expect(content).not.toMatch(antiPattern);
    });

    it('should allow createMemo for complex computations (progressWidth)', () => {
      const filePath = join(process.cwd(), 'src/shared/components/ui/Toolbar/Toolbar.tsx');
      const content = readFileSync(filePath, 'utf-8');

      // This is OK: complex string template with division
      const hasProgressWidthMemo = /const\s+progressWidth\s*=\s*createMemo/.test(content);

      // progressWidth involves division and string formatting, so memoization is acceptable
      expect(hasProgressWidthMemo).toBe(true);
    });

    it('should allow createMemo for displayedIndex (complex logic)', () => {
      const filePath = join(process.cwd(), 'src/shared/components/ui/Toolbar/Toolbar.tsx');
      const content = readFileSync(filePath, 'utf-8');

      // This is OK: displayedIndex has complex conditional logic
      const hasDisplayedIndexMemo = /const\s+displayedIndex\s*=\s*createMemo/.test(content);

      expect(hasDisplayedIndexMemo).toBe(true);
    });
  });
});
