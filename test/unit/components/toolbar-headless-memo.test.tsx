/**
 * Phase 14.1.1: ToolbarHeadless unnecessary memoization test
 *
 * Objective: Verify that ToolbarHeadless uses direct props access instead of
 * unnecessary createMemo wrappers for currentIndex/totalCount.
 *
 * SolidJS Best Practice: Props are already reactive getters, wrapping them in
 * createMemo adds no value and creates unnecessary indirection.
 *
 * Test Strategy: Verify code does NOT contain props wrapping patterns via
 * static analysis (grep_search). This is a compliance test, not a runtime test.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('[Phase 14.1.1] ToolbarHeadless - Direct Props Access', () => {
  it('should NOT wrap props.currentIndex in createMemo', () => {
    const filePath = join(process.cwd(), 'src/shared/components/ui/Toolbar/ToolbarHeadless.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // Anti-pattern: const currentIndex = createMemo(() => props.currentIndex);
    const antiPattern =
      /const\s+currentIndex\s*=\s*createMemo\s*\(\s*\(\)\s*=>\s*props\.currentIndex/;

    expect(content).not.toMatch(antiPattern);

    // If found, provide helpful message
    if (antiPattern.test(content)) {
      throw new Error(
        'Found unnecessary createMemo wrapping props.currentIndex. ' +
          'SolidJS props are already reactive getters - use props.currentIndex directly.'
      );
    }
  });

  it('should NOT wrap props.totalCount in createMemo', () => {
    const filePath = join(process.cwd(), 'src/shared/components/ui/Toolbar/ToolbarHeadless.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // Anti-pattern: const totalCount = createMemo(() => props.totalCount);
    const antiPattern = /const\s+totalCount\s*=\s*createMemo\s*\(\s*\(\)\s*=>\s*props\.totalCount/;

    expect(content).not.toMatch(antiPattern);

    // If found, provide helpful message
    if (antiPattern.test(content)) {
      throw new Error(
        'Found unnecessary createMemo wrapping props.totalCount. ' +
          'SolidJS props are already reactive getters - use props.totalCount directly.'
      );
    }
  });

  it('should use props directly in computed values', () => {
    const filePath = join(process.cwd(), 'src/shared/components/ui/Toolbar/ToolbarHeadless.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // Expected pattern: const items = createMemo(() => { ... props.currentIndex ... });
    // Should see direct props access in items computation
    const hasDirectPropsAccess =
      content.includes('props.currentIndex') || content.includes('props.totalCount');

    expect(hasDirectPropsAccess).toBe(true);
  });

  it('should allow createMemo for complex computations (items array)', () => {
    const filePath = join(process.cwd(), 'src/shared/components/ui/Toolbar/ToolbarHeadless.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // This is OK: const items = createMemo(() => [...complex computation...]);
    const hasItemsMemo = /const\s+items\s*=\s*createMemo/.test(content);

    expect(hasItemsMemo).toBe(true);
  });
});
