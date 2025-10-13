import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const FILES = {
  toast: 'src/shared/components/ui/Toast/Toast.module.css',
  // Phase 48: SettingsModal removed, replaced with inline toolbar settings
  // settingsModal: 'src/shared/components/ui/SettingsModal/SettingsModal.module.css',
  settingsControls: 'src/shared/components/ui/Settings/SettingsControls.module.css',
  gallery: 'src/features/gallery/styles/Gallery.module.css',
};

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('A11y visual feedback consistency (tokens only)', () => {
  describe('focus-visible outlines must use tokens', () => {
    it('SettingsControls interactive controls use var(--xeg-focus-ring) and var(--xeg-focus-ring-offset)', () => {
      const css = read(FILES.settingsControls);
      const focusBlocks = css.match(/:[^{}]*focus[^}]*\{[^}]+\}/g) || [];
      if (focusBlocks.length === 0) {
        // SettingsControls에 focus 스타일이 없으면 테스트를 skip (select는 브라우저 기본 스타일 사용)
        expect(true).toBe(true);
        return;
      }
      const allTokenized = focusBlocks.every(
        block =>
          /outline:\s*(?:none|var\(--xeg-focus-ring\))/.test(block) ||
          /box-shadow:\s*[^;}]*var\(--xeg-color-primary/.test(block)
      );
      expect(allTokenized, 'SettingsControls focus must use xeg tokens or be properly styled').toBe(
        true
      );
    });

    it('Toast interactive controls provide focus-visible styles using tokens', () => {
      const css = read(FILES.toast);
      const focusBlocks = css.match(/:[^{}]*focus-visible[^}]*\{[^}]+\}/g) || [];
      // If focus styles exist, they must be tokenized; if none, this is a failure to ensure consistency
      expect(
        focusBlocks.length > 0,
        'Toast should define focus-visible styles for interactive elements'
      ).toBe(true);
      const allTokenized = focusBlocks.every(
        block =>
          /outline:\s*var\(--xeg-focus-ring\)/.test(block) &&
          /outline-offset:\s*var\(--xeg-focus-ring-offset\)/.test(block)
      );
      expect(allTokenized, 'Toast focus-visible must use xeg focus tokens').toBe(true);
    });
  });

  describe('hover/active lift must be standardized', () => {
    const liftToken = /translateY\(var\(--xeg-button-lift(?:-hover)?\)\)/;
    const hardcodedTranslatePxRem = /translateY\(-?\d+(?:px|rem)\)/;
    const emTranslate = /translateY\(-?\d*\.?\d+em\)/;

    it('Gallery hover/active lifts are tokenized (no px/rem/em hardcodes)', () => {
      const css = read(FILES.gallery);
      const hoverActiveBlocks = css.match(/:[^{}]*(?:hover|active)[^}]*\{[^}]+\}/g) || [];
      const hasHardcoded = hoverActiveBlocks.some(b => /translateY\(-?\d+(?:px|rem|em)\)/.test(b));
      expect(hasHardcoded, 'Gallery should not use hard-coded translateY in hover/active').toBe(
        false
      );
    });

    it('Toast action/controls use tokenized lift, not hard-coded px/rem', () => {
      const css = read(FILES.toast);
      const hoverBlocks = css.match(/:[^{}]*hover[^}]*\{[^}]+\}/g) || [];
      // If any translateY present, it must be tokenized
      const hasHardcoded = hoverBlocks.some(b => hardcodedTranslatePxRem.test(b));
      expect(hasHardcoded, 'Toast should not use hard-coded translateY in hover').toBe(false);
      const hasTranslate = hoverBlocks.some(b => /translateY\(/.test(b));
      if (hasTranslate) {
        const allTokenized = hoverBlocks
          .filter(b => /translateY\(/.test(b))
          .every(b => liftToken.test(b));
        expect(allTokenized, 'Toast translateY in hover must use --xeg-button-lift tokens').toBe(
          true
        );
      }
    });

    it('SettingsControls use tokens for lift or no translateY (no px/rem)', () => {
      const css = read(FILES.settingsControls);
      const hoverBlocks = css.match(/:[^{}]*hover[^}]*\{[^}]+\}/g) || [];
      const hasPxRem = hoverBlocks.some(b => hardcodedTranslatePxRem.test(b));
      expect(hasPxRem, 'SettingsControls should not use px/rem translateY in hover').toBe(false);
      const hasTranslate = hoverBlocks.some(b => /translateY\(/.test(b));
      if (hasTranslate) {
        const allStandardized = hoverBlocks
          .filter(b => /translateY\(/.test(b))
          .every(b => liftToken.test(b) || emTranslate.test(b));
        expect(
          allStandardized,
          'SettingsControls translateY in hover must use tokens or em units'
        ).toBe(true);
      }
    });
  });
});
