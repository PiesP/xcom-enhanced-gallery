/**
 * @fileoverview Stage D Phase 3 - Shared UI Solid-only verification
 * @description Verifies that priority shared UI components use Solid exclusively
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');
const SHARED_UI_PATH = join(PROJECT_ROOT, 'src/shared/components/ui');
const SHARED_COMPONENTS_PATH = join(PROJECT_ROOT, 'src/shared/components');

/**
 * Phase 3 Priority Components (per blueprint Section 3.2 Phase B)
 */
const PRIORITY_COMPONENTS = [
  { name: 'Toolbar', path: join(SHARED_UI_PATH, 'Toolbar/Toolbar.tsx') },
  { name: 'Toast', path: join(SHARED_UI_PATH, 'Toast/Toast.tsx') },
  {
    name: 'SettingsModal',
    path: join(SHARED_UI_PATH, 'SettingsModal/SettingsModal.tsx'),
  },
  { name: 'LazyIcon', path: join(SHARED_COMPONENTS_PATH, 'LazyIcon.tsx') },
  {
    name: 'ModalShell',
    indexPath: join(SHARED_UI_PATH, 'ModalShell/index.ts'),
    solidPath: join(SHARED_UI_PATH, 'ModalShell/ModalShell.solid.tsx'),
  },
] as const;

describe('Stage D Phase 3 - Shared UI Solid-only verification', () => {
  describe('No Preact imports in priority components', () => {
    PRIORITY_COMPONENTS.forEach(component => {
      if ('path' in component) {
        it(`${component.name} should not import from preact`, () => {
          expect(existsSync(component.path), `${component.name} file should exist`).toBe(true);
          const content = readFileSync(component.path, 'utf-8');

          // Check for Preact imports
          const preactImportPattern = /from\s+['"](@)?preact/gi;
          const matches = content.match(preactImportPattern);

          expect(
            matches,
            `${component.name} should not have any Preact imports. Found: ${matches?.join(', ') || 'none'}`
          ).toBeNull();
        });
      }
    });
  });

  describe('Solid vendor getter usage', () => {
    PRIORITY_COMPONENTS.forEach(component => {
      if ('path' in component) {
        it(`${component.name} should use getSolidCore() or Solid APIs`, () => {
          const content = readFileSync(component.path, 'utf-8');

          // Check for Solid vendor getter or Solid/web imports
          const solidVendorPattern = /getSolidCore\(\)/gi;
          const solidWebPattern = /from\s+['"]solid-js\/web['"]/gi;
          const hasSolidGetter = solidVendorPattern.test(content);
          const hasSolidWeb = solidWebPattern.test(content);

          // Toast is a wrapper that uses createComponent from solid-js/web
          const isValidSolidUsage = hasSolidGetter || hasSolidWeb;

          expect(
            isValidSolidUsage,
            `${component.name} should use getSolidCore() or Solid/web APIs (hasSolidCore: ${hasSolidGetter}, hasSolidWeb: ${hasSolidWeb})`
          ).toBe(true);
        });
      }
    });
  });

  describe('Solid JSX type usage', () => {
    PRIORITY_COMPONENTS.forEach(component => {
      if ('path' in component) {
        it(`${component.name} should import JSX type from solid-js`, () => {
          const content = readFileSync(component.path, 'utf-8');

          // Check for Solid JSX type
          const solidJsxPattern = /import\s+.*JSX.*from\s+['"]solid-js['"]/gi;
          const hasSolidJsx = solidJsxPattern.test(content);

          expect(hasSolidJsx, `${component.name} should import JSX type from solid-js`).toBe(true);
        });
      }
    });
  });

  describe('ModalShell .solid.tsx variant usage', () => {
    it('ModalShell index.ts should export from .solid variant', () => {
      const component = PRIORITY_COMPONENTS.find(c => c.name === 'ModalShell')!;
      expect(existsSync(component.indexPath!), 'ModalShell index.ts should exist').toBe(true);

      const indexContent = readFileSync(component.indexPath!, 'utf-8');

      // Check that index.ts exports from .solid variant
      const solidExportPattern = /from\s+['"]\.\/ModalShell\.solid['"]/gi;
      const hasSolidExport = solidExportPattern.test(indexContent);

      expect(hasSolidExport, 'ModalShell index.ts should export from ModalShell.solid').toBe(true);
    });

    it('ModalShell.solid.tsx should exist and use Solid', () => {
      const component = PRIORITY_COMPONENTS.find(c => c.name === 'ModalShell')!;
      expect(existsSync(component.solidPath!), 'ModalShell.solid.tsx should exist').toBe(true);

      const solidContent = readFileSync(component.solidPath!, 'utf-8');

      // Check for Solid vendor getter
      const solidVendorPattern = /getSolidCore\(\)/gi;
      const hasSolidGetter = solidVendorPattern.test(solidContent);

      expect(hasSolidGetter, 'ModalShell.solid.tsx should use getSolidCore()').toBe(true);

      // Check for Solid JSX type
      const solidJsxPattern = /import\s+.*JSX.*from\s+['"]solid-js['"]/gi;
      const hasSolidJsx = solidJsxPattern.test(solidContent);

      expect(hasSolidJsx, 'ModalShell.solid.tsx should import JSX from solid-js').toBe(true);

      // No Preact imports
      const preactImportPattern = /from\s+['"](@)?preact/gi;
      const preactMatches = solidContent.match(preactImportPattern);

      expect(preactMatches, 'ModalShell.solid.tsx should not have Preact imports').toBeNull();
    });
  });

  describe('Production usage verification', () => {
    it('Toast should wrap SolidToast.solid implementation', () => {
      const toastComponent = PRIORITY_COMPONENTS.find(c => c.name === 'Toast')!;
      const content = readFileSync(toastComponent.path, 'utf-8');

      // Check for SolidToast import
      const solidToastImport = /import.*SolidToast.*from\s+['"]\.\/SolidToast\.solid['"]/gi;
      const hasSolidToastImport = solidToastImport.test(content);

      expect(hasSolidToastImport, 'Toast should import SolidToast').toBe(true);

      // Check for createComponent usage
      const createComponentUsage = /createComponent\s*\(\s*SolidToast/gi;
      const usesCreateComponent = createComponentUsage.test(content);

      expect(usesCreateComponent, 'Toast should use createComponent(SolidToast)').toBe(true);
    });
  });

  describe('Phase 3 acceptance criteria', () => {
    it('All priority components should have Solid paths established', () => {
      const results = PRIORITY_COMPONENTS.map(component => {
        const filePath = 'path' in component ? component.path : component.solidPath!;
        const exists = existsSync(filePath);
        const content = exists ? readFileSync(filePath, 'utf-8') : '';
        const hasSolidCore = /getSolidCore\(\)/gi.test(content);
        const hasSolidWeb = /from\s+['"]solid-js\/web['"]/gi.test(content);
        const hasPreact = /from\s+['"](@)?preact/gi.test(content);
        const isValidSolid = hasSolidCore || hasSolidWeb;

        return {
          name: component.name,
          exists,
          hasSolidCore,
          hasSolidWeb,
          hasPreact,
          status: exists && isValidSolid && !hasPreact ? 'SOLID' : 'INCOMPLETE',
        };
      });

      const allSolid = results.every(r => r.status === 'SOLID');

      expect(
        allSolid,
        `Phase 3 acceptance: All components should be Solid-only. Status:\n${results.map(r => `  - ${r.name}: ${r.status} (exists: ${r.exists}, SolidCore: ${r.hasSolidCore}, SolidWeb: ${r.hasSolidWeb}, Preact: ${r.hasPreact})`).join('\n')}`
      ).toBe(true);
    });
  });
});
