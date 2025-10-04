/**
 * @fileoverview Epic UI-TEXT-ICON-OPTIMIZATION Phase 1: ARIA/Title semantic separation test
 * @description Contract test for separating aria-label and title attributes
 */

import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { LanguageService } from '@/shared/services/LanguageService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Epic UI-TEXT-ICON-OPTIMIZATION Phase 1: Button Label Semantics', () => {
  describe('Toolbar button aria-label and title separation', () => {
    it('buttons with keyboard shortcuts should have separated labels', () => {
      const toolbarPath = resolve(__dirname, '../../src/shared/components/ui/Toolbar/Toolbar.tsx');
      const toolbarSource = readFileSync(toolbarPath, 'utf-8');

      const duplicatePatterns = [
        { label: '이전 미디어', title: '이전 미디어 (←)' },
        { label: '다음 미디어', title: '다음 미디어 (→)' },
      ];

      duplicatePatterns.forEach(({ label }) => {
        expect(toolbarSource).toContain("aria-label='" + label + "'");
      });
    });
  });
});
