/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * Phase 0 테스트: createGalleryItemScroll primitive
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PRIMITIVE_PATH = resolve(
  __dirname,
  '../../../../src/shared/primitives/createGalleryItemScroll.ts'
);

describe('Phase 0: createGalleryItemScroll Primitive Tests', () => {
  describe('1. File Existence and Structure', () => {
    it('should exist as a TypeScript file', () => {
      expect(() => readFileSync(PRIMITIVE_PATH, 'utf-8')).not.toThrow();
    });

    it('should export createGalleryItemScroll function', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(
        /export\s+(function\s+createGalleryItemScroll|const\s+createGalleryItemScroll)/
      );
    });

    it('should have proper file header with copyright and description', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('Copyright');
      expect(content).toContain('@fileoverview');
      expect(content).toMatch(/primitive for gallery item scroll|item scroll management/i);
    });
  });

  describe('2. Solid.js Primitives Usage', () => {
    it('should import createEffect from solid-js', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/import\s+\{[^}]*createEffect[^}]*\}\s+from\s+['"]solid-js['"]/);
    });

    it('should import onCleanup from solid-js', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/import\s+\{[^}]*onCleanup[^}]*\}\s+from\s+['"]solid-js['"]/);
    });

    it('should NOT import Preact hooks', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).not.toContain('getPreactHooks');
      expect(content).not.toContain('useCallback');
    });

    it('should NOT use useState (use createSignal if state needed)', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).not.toContain('useState');
    });
  });

  describe('3. Function Signature', () => {
    it('should accept proper options parameter', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/createGalleryItemScroll\s*\(/);
      expect(content).toContain('CreateGalleryItemScrollOptions');
    });

    it('should return an object with expected properties', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('CreateGalleryItemScrollReturn');
      // Should return scrollToItem and scrollToCurrentItem
      expect(content).toMatch(/scrollToItem/);
      expect(content).toMatch(/scrollToCurrentItem/);
    });

    it('should use interface naming convention (Create* not Use*)', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('CreateGalleryItemScrollOptions');
      expect(content).toContain('CreateGalleryItemScrollReturn');
      expect(content).not.toContain('UseGalleryItemScrollOptions');
    });
  });

  describe('4. State Management', () => {
    it('should use let variables instead of useRef', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      // Should have let declarations for state
      expect(content).toMatch(/let\s+\w+\s*=/);
      // Should NOT have useRef
      expect(content).not.toContain('useRef');
    });

    it('should NOT have Ref suffix for variables', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      // No more "Ref" suffix patterns
      expect(content).not.toMatch(/\w+Ref\s*=/);
    });

    it('should track scroll state with let variables', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      // Should have variables like lastScrolledIndex, scrollTimeout, retryCount
      expect(content).toMatch(/let\s+(lastScrolledIndex|scrollTimeout|retryCount)/);
    });
  });

  describe('5. Effect Management', () => {
    it('should use createEffect for auto-scroll on currentIndex change', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/createEffect\s*\(/);
    });

    it('should use onCleanup for cleanup logic', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/onCleanup\s*\(/);
    });

    it('should NOT return cleanup function from effects', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      // Look for useEffect-style return pattern inside createEffect
      const effectBlocks = content.match(/createEffect\s*\([^{]*\{[\s\S]*?\}\s*\)/g) || [];
      effectBlocks.forEach(block => {
        // Should not have "return () => {" pattern inside createEffect
        expect(block).not.toMatch(/return\s*\(\s*\)\s*=>\s*\{/);
      });
    });
  });

  describe('6. Callback Functions', () => {
    it('should use regular functions instead of useCallback', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).not.toContain('useCallback');
      // Should have function declarations or arrow functions
      expect(content).toMatch(/const\s+scrollToItem\s*=\s*\(/);
    });

    it('should NOT wrap functions in memoization', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).not.toContain('useCallback');
      expect(content).not.toContain('useMemo');
    });
  });

  describe('7. Scroll Logic', () => {
    it('should use scrollIntoView for scrolling', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('scrollIntoView');
    });

    it('should query items container with data-xeg-role', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/data-xeg-role.*items-list|items-container/);
    });

    it('should handle prefers-reduced-motion', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('prefers-reduced-motion');
    });

    it('should support offset adjustment', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/offset/i);
    });
  });

  describe('8. Timer Management', () => {
    it('should use globalTimerManager for timers', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('globalTimerManager');
    });

    it('should clear timers in cleanup', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('globalTimerManager.clearTimeout');
      expect(content).toContain('onCleanup');
    });
  });

  describe('9. Error Handling and Retry', () => {
    it('should have error handling with try-catch', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/try\s*\{[\s\S]*?\}\s*catch/);
    });

    it('should implement retry logic', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/retry/i);
      // Should have retry count tracking
      expect(content).toMatch(/retryCount/i);
    });

    it('should use IntersectionObserver for visibility-based retry', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('IntersectionObserver');
    });
  });

  describe('10. Code Quality', () => {
    it('should have proper TypeScript types', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/interface\s+CreateGalleryItemScrollOptions/);
      expect(content).toMatch(/interface\s+CreateGalleryItemScrollReturn/);
    });

    it('should be less than 300 lines', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      const lines = content.split('\n').length;
      expect(lines).toBeLessThan(300);
    });

    it('should have JSDoc comments for main function', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/\/\*\*[\s\S]*?@description[\s\S]*?\*\//);
    });
  });

  describe('11. Logging and Debugging', () => {
    it('should import logger', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('logger');
    });

    it('should have debug logs for key operations', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/logger\.debug/);
    });

    it('should have error logs for failures', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/logger\.(error|warn)/);
    });
  });

  describe('12. Import Organization', () => {
    it('should have correct import order', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      const lines = content.split('\n');

      const importLines = lines.filter(line => line.trim().startsWith('import'));
      const solidImportIndex = importLines.findIndex(line => line.includes('solid-js'));
      const loggerImportIndex = importLines.findIndex(line => line.includes('logger'));
      const timerImportIndex = importLines.findIndex(line => line.includes('timer-management'));

      // Solid should come before shared imports
      if (solidImportIndex >= 0 && loggerImportIndex >= 0) {
        expect(solidImportIndex).toBeLessThan(loggerImportIndex);
      }
    });

    it('should NOT have preact imports', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).not.toMatch(/from\s+['"]preact['"]/);
      expect(content).not.toMatch(/from\s+['"].*preact.*['"]/);
    });
  });

  describe('13. Return Value Structure', () => {
    it('should return function references (not wrapped in accessors)', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      // Should return functions directly, not as accessors like () => fn
      expect(content).toMatch(/return\s*\{[\s\S]*scrollToItem[\s\S]*\}/);
    });

    it('should provide scrollToItem function', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/scrollToItem/);
    });

    it('should provide scrollToCurrentItem function', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/scrollToCurrentItem/);
    });
  });

  describe('14. File Size and Complexity', () => {
    it('should be reasonably sized', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      const lines = content.split('\n').length;

      // Original was 253 lines, primitive should be similar or smaller
      expect(lines).toBeLessThan(280);
    });
  });
});
