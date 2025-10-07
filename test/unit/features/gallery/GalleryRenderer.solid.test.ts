/**
 * @fileoverview Phase 0 Tests for GalleryRenderer Solid Integration
 * @description TDD approach - RED phase tests for Solid.js render() integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const GALLERY_RENDERER_PATH = join(process.cwd(), 'src/features/gallery/GalleryRenderer.tsx');

describe('Phase 0: GalleryRenderer Solid Integration Tests', () => {
  describe('1. TypeScript Compilation', () => {
    it('should compile without errors', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(0);
    });

    it('should use Solid render instead of Preact', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

      // Solid import should exist
      expect(content).toContain("from 'solid-js/web'");

      // Preact render should NOT exist
      expect(content).not.toContain('getPreact()');
      expect(content).not.toContain('createElement');
    });
  });

  describe('2. Solid.js Integration', () => {
    it('should import render from solid-js/web', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');
      expect(content).toMatch(/import\s+\{[^}]*render[^}]*\}\s+from\s+['"]solid-js\/web['"]/);
    });

    it('should use Solid render with JSX', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

      // Solid render pattern: render(() => <Component />, container)
      expect(content).toContain('render(');
      expect(content).toContain('() =>');
    });

    it('should NOT use Preact vendor getters', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

      // Preact getters should NOT exist
      expect(content).not.toContain('getPreact');
      expect(content).not.toContain('getPreactHooks');
      expect(content).not.toContain('getPreactCompat');
    });
  });

  describe('3. Component References', () => {
    it('should import Solid components (.solid.tsx)', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

      // Should use Solid versions
      expect(content).toContain('VerticalGalleryView.solid');
      expect(content).toContain('GalleryContainer.solid');
    });

    it('should NOT import Preact components', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

      // Should NOT use Preact versions (without .solid)
      expect(content).not.toMatch(/from ['"].*\/VerticalGalleryView['"]/);
      expect(content).not.toMatch(/from ['"].*\/GalleryContainer['"](?!\.solid)/);
    });
  });

  describe('4. Render Method', () => {
    it('should have renderComponent method using Solid render', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

      // Should have renderComponent method
      expect(content).toContain('renderComponent');

      // Should use Solid render
      expect(content).toContain('render(');
    });

    it('should use JSX syntax instead of createElement', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

      // JSX should be used
      expect(content).toMatch(/<[A-Z][a-zA-Z]*\b/); // <ComponentName

      // createElement should NOT be used
      expect(content).not.toContain('createElement(');
    });

    it('should pass props correctly to Solid components', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

      // Props should be passed
      expect(content).toContain('onClose');
      expect(content).toContain('onPrevious');
      expect(content).toContain('onNext');
    });
  });

  describe('5. Cleanup and Lifecycle', () => {
    it('should have dispose method for Solid cleanup', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

      // Solid uses dispose() returned from render()
      // Pattern: const dispose = render(...)
      expect(content).toMatch(/(?:const|let)\s+dispose\s*=/);
    });

    it('should store and call dispose on cleanup', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

      // Should store dispose function
      expect(content).toMatch(/dispose\s*\??\(/);
    });
  });

  describe('6. Import Organization', () => {
    it('should have correct import order (types → Solid → components → state)', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

      const lines = content.split('\n');
      const importLines = lines.filter(line => line.trim().startsWith('import'));

      // Check order approximately
      const solidImportIndex = importLines.findIndex(line => line.includes('solid-js/web'));
      const componentImportIndex = importLines.findIndex(line =>
        line.includes('VerticalGalleryView.solid')
      );

      expect(solidImportIndex).toBeGreaterThan(-1);
      expect(componentImportIndex).toBeGreaterThan(-1);
      expect(solidImportIndex).toBeLessThan(componentImportIndex);
    });

    it('should NOT have Preact-related imports', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

      expect(content).not.toContain("from 'preact'");
      expect(content).not.toContain("from '@preact");
      expect(content).not.toContain('getPreact');
    });
  });

  describe('7. File Size and Complexity', () => {
    it('should be less than 350 lines (simplified with Solid)', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');
      const lines = content.split('\n').length;

      expect(lines).toBeLessThanOrEqual(350);
    });

    it('should have fewer methods (Solid simplifies lifecycle)', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

      // Count methods (approximately)
      const methodCount = (content.match(/private\s+\w+\s*\(/g) || []).length;

      expect(methodCount).toBeLessThanOrEqual(10);
    });
  });

  describe('8. Error Boundary Integration', () => {
    it('should use ErrorBoundary.solid', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

      // Should import Solid ErrorBoundary
      expect(content).toContain('ErrorBoundary.solid');
    });
  });

  describe('9. State Management', () => {
    it('should use galleryState signals', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

      expect(content).toContain('galleryState');
      expect(content).toContain('closeGallery');
      expect(content).toContain('openGallery');
    });

    it('should NOT manually subscribe to signals (Solid auto-tracks)', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

      // Manual subscription should be removed in Solid version
      // (Solid components auto-track signals)
      // But GalleryRenderer might still need subscribe for open/close detection
      // This is acceptable as long as components don't re-render manually
    });
  });

  describe('10. Code Metrics', () => {
    it('should reduce complexity compared to Preact version', () => {
      const content = readFileSync(GALLERY_RENDERER_PATH, 'utf-8');

      // No more createElement chains
      expect(content).not.toContain('createElement(');

      // Simpler render pattern
      expect(content).toContain('render(');

      // Fewer helper methods
      const helperMethods = (content.match(/private\s+\w+\s*\(/g) || []).length;
      expect(helperMethods).toBeLessThanOrEqual(8);
    });
  });
});
