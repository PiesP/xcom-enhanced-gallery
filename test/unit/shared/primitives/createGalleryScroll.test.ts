/**
 * @fileoverview Phase 0 Tests for createGalleryScroll Primitive
 * @description TDD approach - RED phase tests for Solid.js primitive conversion
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PRIMITIVE_PATH = join(process.cwd(), 'src/shared/primitives/createGalleryScroll.ts');

describe('Phase 0: createGalleryScroll Primitive Tests', () => {
  describe('1. File Existence and Structure', () => {
    it('should exist as a TypeScript file', () => {
      expect(() => readFileSync(PRIMITIVE_PATH, 'utf-8')).not.toThrow();
    });

    it('should export createGalleryScroll function', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(
        /export\s+(function\s+createGalleryScroll|const\s+createGalleryScroll)/
      );
    });

    it('should have proper file header with copyright and description', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('Copyright');
      expect(content).toContain('@fileoverview');
      // Solid primitive uses English description
      expect(content).toMatch(/primitive for gallery scroll|galllery scroll management/i);
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
      expect(content).not.toContain('useEffect');
      expect(content).not.toContain('useRef');
      expect(content).not.toContain('useCallback');
    });

    it('should NOT import useSelector (Preact-specific)', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).not.toContain('useSelector');
    });
  });

  describe('3. Function Signature', () => {
    it('should accept options parameter', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/createGalleryScroll\s*\(/);
      expect(content).toContain('CreateGalleryScrollOptions');
    });

    it('should return an object with expected properties', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      // Should define return type
      expect(content).toContain('CreateGalleryScrollReturn');
    });

    it('should use interface naming convention (Create* not Use*)', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('CreateGalleryScrollOptions');
      expect(content).toContain('CreateGalleryScrollReturn');
      expect(content).not.toContain('UseGalleryScrollOptions');
      expect(content).not.toContain('UseGalleryScrollReturn');
    });
  });

  describe('4. State Management', () => {
    it('should use let variables instead of useRef', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      // Should have let declarations for state
      expect(content).toMatch(/let\s+\w+\s*=/);
      // Should NOT have useRef
      expect(content).not.toMatch(/useRef\s*</);
    });

    it('should use createMemo for derived state if needed', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      // May or may not use createMemo, but if it does, it should be from solid-js
      if (content.includes('createMemo')) {
        expect(content).toMatch(/import\s+\{[^}]*createMemo[^}]*\}\s+from\s+['"]solid-js['"]/);
      }
    });

    it('should access galleryState directly without useSelector', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('galleryState');
      // Direct access pattern: galleryState.value.isOpen or () => galleryState.value.isOpen
      expect(content).toMatch(/galleryState\.value|galleryState\(\)/);
    });
  });

  describe('5. Effect Management', () => {
    it('should use createEffect instead of useEffect', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/createEffect\s*\(/);
      expect(content).not.toMatch(/useEffect\s*\(/);
    });

    it('should use onCleanup for cleanup logic', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/onCleanup\s*\(/);
    });

    it('should NOT return cleanup function from effects', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      // Solid uses onCleanup, not return () => {}
      // Look for useEffect-style return pattern
      const effectReturns = content.match(/createEffect\([^)]*=>\s*\{[\s\S]*?return\s*\(/g);
      if (effectReturns) {
        // If there are returns, they should not be cleanup functions
        expect(effectReturns.length).toBe(0);
      }
    });
  });

  describe('6. Callback Functions', () => {
    it('should use regular functions instead of useCallback', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).not.toMatch(/useCallback\s*\(/);
      // Should have function declarations or arrow functions
      expect(content).toMatch(/const\s+\w+\s*=\s*\([^)]*\)\s*=>/);
    });

    it('should NOT wrap callbacks in memoization', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).not.toContain('useCallback');
      expect(content).not.toContain('useMemo');
    });
  });

  describe('7. Event Management', () => {
    it('should use EventManager for event listeners', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('EventManager');
    });

    it('should cleanup EventManager in onCleanup', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      // Check for eventManager.cleanup() call
      expect(content).toContain('eventManager.cleanup()');
      expect(content).toContain('onCleanup');
    });
  });

  describe('8. Timer Management', () => {
    it('should use globalTimerManager for timers', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('globalTimerManager');
    });

    it('should clear timers in onCleanup', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      // Check for globalTimerManager.clearTimeout() call
      expect(content).toContain('globalTimerManager.clearTimeout');
      expect(content).toContain('onCleanup');
    });
  });

  describe('9. Code Quality', () => {
    it('should have proper TypeScript types', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      // Should have interface definitions
      expect(content).toMatch(/interface\s+CreateGalleryScrollOptions/);
      expect(content).toMatch(/interface\s+CreateGalleryScrollReturn/);
    });

    it('should be less than 300 lines (simpler than hook version)', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      const lines = content.split('\n').length;
      expect(lines).toBeLessThan(300);
    });

    it('should have JSDoc comments for main function', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/\/\*\*[\s\S]*?@description[\s\S]*?\*\//);
    });
  });

  describe('10. Logging and Debugging', () => {
    it('should import logger', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('logger');
    });

    it('should have debug logs for key operations', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/logger\.debug/);
    });
  });

  describe('11. Import Organization', () => {
    it('should have correct import order (types → Solid → services → state → utils)', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      const lines = content.split('\n');

      const imports = lines.filter(line => line.trim().startsWith('import'));

      let solidImportIndex = -1;
      let servicesImportIndex = -1;
      let stateImportIndex = -1;

      imports.forEach((line, index) => {
        if (line.includes('solid-js')) solidImportIndex = index;
        if (line.includes('services/')) servicesImportIndex = index;
        if (line.includes('state/')) stateImportIndex = index;
      });

      // Solid imports should come before services and state
      if (solidImportIndex !== -1 && servicesImportIndex !== -1) {
        expect(solidImportIndex).toBeLessThan(servicesImportIndex);
      }
      if (solidImportIndex !== -1 && stateImportIndex !== -1) {
        expect(solidImportIndex).toBeLessThan(stateImportIndex);
      }
    });

    it('should NOT have preact imports', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).not.toMatch(/from\s+['"]preact['"]/);
      expect(content).not.toMatch(/from\s+['"].*preact.*['"]/);
    });
  });

  describe('12. Return Value Structure', () => {
    it('should return reactive values (accessors or signals)', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      // Should return an object with properties
      expect(content).toMatch(/return\s+\{[\s\S]*?\}/);
    });

    it('should provide lastScrollTime accessor', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/lastScrollTime/);
    });

    it('should provide isScrolling accessor', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/isScrolling/);
    });
  });

  describe('13. PC-Only Events Policy', () => {
    it('should only handle wheel events (PC-only)', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('wheel');
      // Should NOT have touch or pointer events
      expect(content).not.toMatch(/touch(start|move|end)/i);
      expect(content).not.toMatch(/pointer(down|move|up)/i);
    });
  });

  describe('14. File Size and Complexity', () => {
    it('should be simpler than original hook version', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');

      // Count function/const declarations (rough complexity measure)
      const declarations = (content.match(/(?:const|let|function)\s+\w+/g) || []).length;

      // Should have reasonable number of declarations (not overly complex)
      expect(declarations).toBeLessThan(30);
    });
  });
});
