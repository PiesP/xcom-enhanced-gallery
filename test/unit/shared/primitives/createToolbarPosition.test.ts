/**
 * Phase 0 Tests for createToolbarPosition Primitive
 * File existence and structure validation
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PRIMITIVE_PATH = resolve(
  __dirname,
  '../../../../src/shared/primitives/createToolbarPosition.ts'
);

describe('Phase 0: createToolbarPosition Primitive Tests', () => {
  describe('1. File Existence and Structure', () => {
    it('should exist as a TypeScript file', () => {
      expect(() => readFileSync(PRIMITIVE_PATH, 'utf-8')).not.toThrow();
    });

    it('should export createToolbarPosition function', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(
        /export\s+(function\s+createToolbarPosition|const\s+createToolbarPosition)/
      );
    });

    it('should have proper file header with copyright and description', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('Copyright');
      expect(content).toContain('@fileoverview');
      expect(content).toMatch(/toolbar position|hover-based toolbar/i);
    });
  });

  describe('2. Solid.js Primitives Usage', () => {
    it('should import createSignal from solid-js', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/import\s+\{[^}]*createSignal[^}]*\}\s+from\s+['"]solid-js['"]/);
    });

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
      expect(content).not.toContain('useState');
      expect(content).not.toContain('useEffect');
    });
  });

  describe('3. Function Signature', () => {
    it('should accept proper options parameter', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/createToolbarPosition\s*\(/);
      expect(content).toContain('CreateToolbarPositionOptions');
    });

    it('should return an object with expected properties', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('CreateToolbarPositionReturn');
      // Should return isVisible signal accessor, show, hide functions
      expect(content).toMatch(/return\s*\{[\s\S]*(isVisible|show|hide)[\s\S]*\}/);
    });

    it('should use interface naming convention (Create* not Use*)', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('CreateToolbarPositionOptions');
      expect(content).toContain('CreateToolbarPositionReturn');
      expect(content).not.toContain('UseToolbarPosition');
    });
  });

  describe('4. State Management', () => {
    it('should use createSignal for isVisible state', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/createSignal.*isVisible/);
    });

    it('should NOT use useState', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).not.toContain('useState');
    });

    it('should NOT have unnecessary refs', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      // No ref variables like hoverEnterRef, hoverLeaveRef, etc.
      expect(content).not.toMatch(/\w+Ref\s*=/);
    });
  });

  describe('5. Effect Management', () => {
    it('should use createEffect for event listener management', () => {
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
      for (const block of effectBlocks) {
        // Should not have "return () => {" pattern (Preact style)
        expect(block).not.toMatch(/return\s*\(\s*\)\s*=>\s*\{/);
      }
    });
  });

  describe('6. Event Management', () => {
    it('should handle mouseenter event', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('mouseenter');
    });

    it('should handle mouseleave event', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('mouseleave');
    });

    it('should add and remove event listeners', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('addEventListener');
      expect(content).toContain('removeEventListener');
    });
  });

  describe('7. Visibility Logic', () => {
    it('should have show function', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/const\s+show\s*=/);
    });

    it('should have hide function', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/const\s+hide\s*=/);
    });

    it('should respect enabled state', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/enabled/);
    });
  });

  describe('8. Animation Integration', () => {
    it('should import animation functions', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/toolbarSlideDown|toolbarSlideUp/);
    });

    it('should call slide animations', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toContain('toolbarSlideDown');
      expect(content).toContain('toolbarSlideUp');
    });
  });

  describe('9. CSS Variable Management', () => {
    it('should apply CSS variables for opacity and pointer-events', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/--toolbar-opacity/);
      expect(content).toMatch(/--toolbar-pointer-events/);
    });
  });

  describe('10. Code Quality', () => {
    it('should have proper TypeScript types', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/interface\s+CreateToolbarPositionOptions/);
      expect(content).toMatch(/interface\s+CreateToolbarPositionReturn/);
    });

    it('should be less than 150 lines', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      const lines = content.split('\n').length;
      expect(lines).toBeLessThan(150);
    });

    it('should have JSDoc comments for main function', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/\/\*\*[\s\S]*?@description[\s\S]*?\*\//);
    });
  });

  describe('11. Import Organization', () => {
    it('should have correct import order', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      const lines = content.split('\n');

      // Find first import line
      const firstImportIndex = lines.findIndex(line => line.trim().startsWith('import'));
      expect(firstImportIndex).toBeGreaterThanOrEqual(0);

      // solid-js should come before internal imports
      const solidImportIndex = lines.findIndex(line => line.includes("from 'solid-js'"));
      const internalImportIndex = lines.findIndex(
        line => line.includes('@shared') || line.includes('../')
      );

      if (solidImportIndex >= 0 && internalImportIndex >= 0) {
        expect(solidImportIndex).toBeLessThan(internalImportIndex);
      }
    });

    it('should NOT have preact imports', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).not.toMatch(/from\s+['"]preact['"]/);
      expect(content).not.toMatch(/from\s+['"].*preact.*['"]/);
    });
  });

  describe('12. Return Value Structure', () => {
    it('should return signal accessor for isVisible', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/return\s*\{[\s\S]*isVisible[\s\S]*\}/);
    });

    it('should return show function', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/return\s*\{[\s\S]*show[\s\S]*\}/);
    });

    it('should return hide function', () => {
      const content = readFileSync(PRIMITIVE_PATH, 'utf-8');
      expect(content).toMatch(/return\s*\{[\s\S]*hide[\s\S]*\}/);
    });
  });
});
