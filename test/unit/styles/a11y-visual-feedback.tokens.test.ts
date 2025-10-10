import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const FILES = {
  toast: 'src/shared/components/ui/Toast/Toast.module.css',
  settingsModal: 'src/shared/components/ui/SettingsModal/SettingsModal.module.css',
  gallery: 'src/features/gallery/styles/Gallery.module.css',
};

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('A11y visual feedback consistency (tokens only)', () => {
  describe('focus-visible outlines must use tokens', () => {
    it('SettingsModal interactive controls use var(--xeg-focus-ring) and var(--xeg-focus-ring-offset)', () => {
      const css = read(FILES.settingsModal);
      const focusBlocks = css.match(/:[^{}]*focus-visible[^}]*\{[^}]+\}/g) || [];
      const allTokenized = focusBlocks.every(
        block =>
          /outline:\s*var\(--xeg-focus-ring\)/.test(block) &&
          /outline-offset:\s*var\(--xeg-focus-ring-offset\)/.test(block)
      );
      expect(allTokenized, 'SettingsModal focus-visible must use xeg focus tokens').toBe(true);
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

    it('SettingsModal controls use em units or tokens for lift (no px/rem)', () => {
      const css = read(FILES.settingsModal);
      const hoverBlocks = css.match(/:[^{}]*hover[^}]*\{[^}]+\}/g) || [];
      const hasPxRem = hoverBlocks.some(b => hardcodedTranslatePxRem.test(b));
      expect(hasPxRem, 'SettingsModal should not use px/rem translateY in hover').toBe(false);
      const hasTranslate = hoverBlocks.some(b => /translateY\(/.test(b));
      if (hasTranslate) {
        const allStandardized = hoverBlocks
          .filter(b => /translateY\(/.test(b))
          .every(b => liftToken.test(b) || emTranslate.test(b));
        expect(
          allStandardized,
          'SettingsModal translateY in hover must use tokens or em units'
        ).toBe(true);
      }
    });
  });
});
