/**
 * @fileoverview SettingsModal positioning regression tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanup, render } from '@test/utils/testing-library';
import { SettingsModal } from '../../../../src/shared/components/ui/SettingsModal/SettingsModal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cssPath = resolve(
  __dirname,
  '../../../../src/shared/components/ui/SettingsModal/SettingsModal.module.css'
);

describe('SettingsModal positioning', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  describe('CSS rules', () => {
    it('center position should vertically center the modal', () => {
      const css = readFileSync(cssPath, 'utf-8');
      const centerMatch = css.match(/\.center\s*\{[^}]*\}/);
      expect(centerMatch).not.toBeNull();
      const centerBlock = centerMatch?.[0] ?? '';

      expect(centerBlock).toMatch(/top:\s*50%/);
      expect(centerBlock).toMatch(/transform:\s*translate\(-50%,\s*-50%\)/);
      expect(centerBlock).toMatch(/max-height:\s*calc\(100vh - var\(--space-lg,\s*16px\) \* 2\)/);
      expect(centerBlock).toMatch(/overflow-y:\s*auto/);
    });

    it('backdrop should use flex layout with viewport padding', () => {
      const css = readFileSync(cssPath, 'utf-8');
      const backdropMatch = css.match(/:global\(\.settings-modal-backdrop\)\s*\{[^}]*\}/);
      expect(backdropMatch).not.toBeNull();
      const backdropBlock = backdropMatch?.[0] ?? '';

      expect(backdropBlock).toMatch(/display:\s*flex/);
      expect(backdropBlock).toMatch(/align-items:\s*center/);
      expect(backdropBlock).toMatch(/justify-content:\s*center/);
      expect(backdropBlock).toMatch(/padding:\s*var\(--space-lg,\s*16px\)/);
    });

    it('backdrop center override should reset fixed positioning', () => {
      const css = readFileSync(cssPath, 'utf-8');
      const overrideMatch = css.match(
        /:global\(\.settings-modal-backdrop\)\s*\.center\s*\{[^}]*\}/
      );
      expect(overrideMatch).not.toBeNull();
      const overrideBlock = overrideMatch?.[0] ?? '';

      expect(overrideBlock).toMatch(/position:\s*static/);
      expect(overrideBlock).toMatch(/transform:\s*none/);
    });
  });

  describe('Modal mode rendering', () => {
    it('modal mode with center position should apply center classes', () => {
      render(() => (
        <SettingsModal isOpen={true} onClose={() => {}} mode='modal' position='center' />
      ));

      // Modal 모드의 content div는 role="document"로 찾을 수 있음
      const content = document.querySelector('[role="document"]');
      expect(content).not.toBeNull();

      // Center 위치를 위한 클래스 확인 (CSS 모듈 해시 또는 클래스명)
      const classList = Array.from(content?.classList ?? []);
      const hasCenterClass = classList.some(
        cls => cls.includes('center') || cls.includes('Center')
      );
      const hasPanelClass = classList.some(cls => cls.includes('panel') || cls.includes('Panel'));

      expect(hasPanelClass).toBe(true);
      expect(hasCenterClass).toBe(true);
    });

    it('modal mode with default position should center by default', () => {
      render(() => <SettingsModal isOpen={true} onClose={() => {}} mode='modal' />);

      const content = document.querySelector('[role="document"]');
      expect(content).not.toBeNull();

      // 기본 위치가 center이므로 center 클래스가 적용되어야 함
      const classList = Array.from(content?.classList ?? []);
      const hasCenterClass = classList.some(
        cls => cls.includes('center') || cls.includes('Center')
      );

      expect(hasCenterClass).toBe(true);
    });

    it('modal mode should not use inline styles for center position', () => {
      render(() => (
        <SettingsModal isOpen={true} onClose={() => {}} mode='modal' position='center' />
      ));

      const content = document.querySelector('[role="document"]') as HTMLElement;
      expect(content).not.toBeNull();

      // Center 위치는 CSS 클래스로 처리되므로 인라인 스타일이 없어야 함
      // style 속성 자체가 없거나 undefined여야 함
      const styleAttr = content?.getAttribute('style');
      expect(styleAttr).toBeNull();
    });

    it('panel mode with center position should apply center class', () => {
      render(() => (
        <SettingsModal isOpen={true} onClose={() => {}} mode='panel' position='center' />
      ));

      const panel = document.querySelector(`[data-position="center"]`);
      expect(panel).not.toBeNull();

      // Center 위치 클래스가 적용되어야 함
      const classList = Array.from(panel?.classList ?? []);
      const hasCenterClass = classList.some(
        cls => cls.includes('center') || cls.includes('Center')
      );

      expect(hasCenterClass).toBe(true);
    });
  });
});
