/**
 * Phase 14.1.4: VerticalGalleryView lightweight operation test
 *
 * Objective: Verify that VerticalGalleryView doesn't use createMemo for
 * lightweight map operations that SolidJS can optimize automatically.
 *
 * SolidJS Best Practice: Simple array mapping operations are cheap and don't
 * need memoization. The framework's fine-grained reactivity already minimizes
 * re-evaluation. Unnecessary memoization adds overhead.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('[Phase 14.1.4] VerticalGalleryView - Lightweight Operations', () => {
  it('should NOT wrap simple map operation in createMemo (memoizedMediaItems)', () => {
    const filePath = join(
      process.cwd(),
      'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx'
    );
    const content = readFileSync(filePath, 'utf-8');

    // Anti-pattern: const memoizedMediaItems = createMemo(() => items.map(...));
    // For simple transformations, direct usage is fine
    const antiPattern = /const\s+memoizedMediaItems\s*=\s*createMemo\s*\(/;

    expect(content).not.toMatch(antiPattern);

    if (antiPattern.test(content)) {
      throw new Error(
        'Found unnecessary createMemo for lightweight map operation (memoizedMediaItems). ' +
          'Simple array transformations are cheap - use them directly in JSX or as inline getters.'
      );
    }
  });

  it('should allow createMemo for complex computations (preloadIndices)', () => {
    const filePath = join(
      process.cwd(),
      'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx'
    );
    const content = readFileSync(filePath, 'utf-8');

    // This is OK: preloadIndices involves function calls and logic
    const hasPreloadIndicesMemo = /const\s+preloadIndices\s*=\s*createMemo/.test(content);

    // Complex computation with function calls should be memoized
    expect(hasPreloadIndicesMemo).toBe(true);
  });

  it('should use direct mediaItems() access for simple transformations', () => {
    const filePath = join(
      process.cwd(),
      'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx'
    );
    const content = readFileSync(filePath, 'utf-8');

    // Should see direct mediaItems() calls, not through memoizedMediaItems()
    const hasDirectMediaItemsAccess = /mediaItems\(\)/.test(content);

    expect(hasDirectMediaItemsAccess).toBe(true);
  });
});
