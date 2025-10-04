/**
 * @fileoverview Epic UI-TEXT-ICON-OPTIMIZATION Phase 1: Icon semantic uniqueness test
 * @description Sub-Epic 1: ICON-SEMANTIC-FIX - Settings icon duplication resolution
 */

import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Sub-Epic 1: ICON-SEMANTIC-FIX Phase 1 RED', () => {
  describe('QuestionMark icon should exist', () => {
    it('QuestionMark icon should be defined in xeg-icons.ts', () => {
      const iconsPath = resolve(__dirname, '../../src/assets/icons/xeg-icons.ts');
      const iconsSource = readFileSync(iconsPath, 'utf-8');
      const hasQuestionMark = /export\s+const\s+QuestionMark/.test(iconsSource);
      expect(hasQuestionMark).toBe(true); // Phase 1 RED: false
    });

    it('QuestionMark should be registered in CORE_ICONS', () => {
      const registryPath = resolve(__dirname, '../../src/shared/services/iconRegistry.ts');
      const registrySource = readFileSync(registryPath, 'utf-8');
      const hasInRegistry = /CORE_ICONS[^}]*QuestionMark/s.test(registrySource);
      expect(hasInRegistry).toBe(true); // Phase 1 RED: false
    });
  });

  describe('Keyboard help button should use QuestionMark icon', () => {
    it('should use icon="QuestionMark"', () => {
      const toolbarPath = resolve(__dirname, '../../src/shared/components/ui/Toolbar/Toolbar.tsx');
      const toolbarSource = readFileSync(toolbarPath, 'utf-8');
      const pattern = /data-gallery-element=['"]keyboard-help['"][^>]*icon=['"]QuestionMark['"]/s;
      expect(pattern.test(toolbarSource)).toBe(true); // Phase 1 RED: false (uses Settings)
    });
  });

  describe('Settings icon should be unique', () => {
    it('Settings icon should be used only once', () => {
      const toolbarPath = resolve(__dirname, '../../src/shared/components/ui/Toolbar/Toolbar.tsx');
      const toolbarSource = readFileSync(toolbarPath, 'utf-8');
      const matches = toolbarSource.match(/icon=['"]Settings['"]/g);
      expect(matches?.length).toBe(1); // Phase 1 RED: 2 (duplicated)
    });
  });
});
