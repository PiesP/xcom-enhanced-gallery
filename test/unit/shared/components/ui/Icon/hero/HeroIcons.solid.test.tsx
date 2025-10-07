/**
 * @fileoverview Hero Icons Tests (Solid.js) - All 9 Icons
 * @description Type verification tests for all Hero Solid.js icon components
 * Phase 0 스타일: 컴파일 및 타입 검증만 수행, DOM 렌더링 테스트는 제외
 */

import { describe, it, expect } from 'vitest';
import { HeroArrowAutofitHeight } from '@shared/components/ui/Icon/hero/HeroArrowAutofitHeight.solid';
import { HeroArrowAutofitWidth } from '@shared/components/ui/Icon/hero/HeroArrowAutofitWidth.solid';
import { HeroArrowsMaximize } from '@shared/components/ui/Icon/hero/HeroArrowsMaximize.solid';
import { HeroChevronLeft } from '@shared/components/ui/Icon/hero/HeroChevronLeft.solid';
import { HeroChevronRight } from '@shared/components/ui/Icon/hero/HeroChevronRight.solid';
import { HeroDownload } from '@shared/components/ui/Icon/hero/HeroDownload.solid';
import { HeroFileZip } from '@shared/components/ui/Icon/hero/HeroFileZip.solid';
import { HeroSettings } from '@shared/components/ui/Icon/hero/HeroSettings.solid';
import { HeroZoomIn } from '@shared/components/ui/Icon/hero/HeroZoomIn.solid';

const iconComponents = [
  { name: 'HeroArrowAutofitHeight', component: HeroArrowAutofitHeight },
  { name: 'HeroArrowAutofitWidth', component: HeroArrowAutofitWidth },
  { name: 'HeroArrowsMaximize', component: HeroArrowsMaximize },
  { name: 'HeroChevronLeft', component: HeroChevronLeft },
  { name: 'HeroChevronRight', component: HeroChevronRight },
  { name: 'HeroDownload', component: HeroDownload },
  { name: 'HeroFileZip', component: HeroFileZip },
  { name: 'HeroSettings', component: HeroSettings },
  { name: 'HeroZoomIn', component: HeroZoomIn },
];

describe('Hero Icons.solid (Type Verification - Phase 0 Style)', () => {
  describe('All 9 Hero icons should compile and export', () => {
    iconComponents.forEach(({ name, component }) => {
      it(`${name} should be defined and a function`, () => {
        expect(component).toBeDefined();
        expect(typeof component).toBe('function');
      });
    });
  });

  describe('All icons should accept props', () => {
    iconComponents.forEach(({ name, component }) => {
      it(`${name} should accept no props (default)`, () => {
        expect(() => component({})).not.toThrow();
      });

      it(`${name} should accept size prop (number)`, () => {
        expect(() => component({ size: 16 })).not.toThrow();
      });

      it(`${name} should accept size prop (string)`, () => {
        expect(() => component({ size: 'var(--xeg-icon-size)' })).not.toThrow();
      });

      it(`${name} should accept class prop`, () => {
        expect(() => component({ class: 'custom-icon' })).not.toThrow();
      });

      it(`${name} should accept aria-label prop`, () => {
        expect(() => component({ 'aria-label': 'Test label' })).not.toThrow();
      });

      it(`${name} should accept combined props`, () => {
        expect(() =>
          component({
            size: 24,
            class: 'hero-icon',
            'aria-label': 'Test icon',
          })
        ).not.toThrow();
      });

      it(`${name} should return JSX element (basic type check)`, () => {
        const result = component({ size: 16 });
        expect(result).toBeDefined();
      });
    });
  });
});
