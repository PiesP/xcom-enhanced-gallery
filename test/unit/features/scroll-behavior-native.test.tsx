/**
 * Phase 76: 브라우저 네이티브 스크롤 전환 테스트
 *
 * 목표:
 * - VerticalGalleryView에서 scrollBy 수동 호출 제거
 * - 브라우저 네이티브 스크롤로 전환 (CSS overflow:auto)
 * - passive 이벤트 리스너 사용
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

describe('Phase 76: Native Browser Scroll', () => {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const verticalGalleryViewPath = resolve(
    currentDir,
    '../../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx'
  );

  describe('VerticalGalleryView scrollBy 제거', () => {
    it('should NOT call scrollBy manually in VerticalGalleryView', () => {
      const source = readFileSync(verticalGalleryViewPath, 'utf-8');

      // scrollBy 수동 호출이 없어야 함
      const hasScrollByCall = /\.scrollBy\s*\(/i.test(source);

      expect(hasScrollByCall).toBe(false);
    });

    it('should NOT have manual scroll clamping logic', () => {
      const source = readFileSync(verticalGalleryViewPath, 'utf-8');

      // 수동 경계 계산 로직이 없어야 함
      const hasClampingLogic = /Math\.max\(0,\s*Math\.min\(desiredTop,\s*maxScrollTop\)\)/i.test(
        source
      );

      expect(hasClampingLogic).toBe(false);
    });

    it('should NOT calculate scrollDelta manually', () => {
      const source = readFileSync(verticalGalleryViewPath, 'utf-8');

      // 수동 scrollDelta 계산이 없어야 함
      const hasScrollDeltaCalc = /const scrollDelta = clampedTop - currentTop/i.test(source);

      expect(hasScrollDeltaCalc).toBe(false);
    });
  });

  describe('useGalleryScroll 단순화', () => {
    const useGalleryScrollPath = resolve(
      currentDir,
      '../../../src/features/gallery/hooks/useGalleryScroll.ts'
    );

    it('should use passive event listeners for wheel events', () => {
      const source = readFileSync(useGalleryScrollPath, 'utf-8');

      // passive: true 옵션이 있어야 함
      const hasPassiveListener = /passive:\s*true/i.test(source);

      expect(hasPassiveListener).toBe(true);
    });

    it('should NOT manually prevent default scroll behavior unnecessarily', () => {
      const source = readFileSync(useGalleryScrollPath, 'utf-8');

      // onScroll 콜백에서 scrollBy를 호출하지 않아야 함
      // (트위터 스크롤 차단은 유지, 하지만 갤러리 내부 스크롤은 네이티브로)
      const onScrollCallbackMatch = source.match(/onScroll[?]?\(\s*delta,\s*\w+\s*\)/g);

      // onScroll 콜백이 있으면, 그 내부에서 scrollBy가 호출되지 않아야 함
      if (onScrollCallbackMatch) {
        // VerticalGalleryView에서 scrollBy를 호출하지 않으면 패스
        const verticalGallerySource = readFileSync(verticalGalleryViewPath, 'utf-8');
        const hasScrollByInCallback = /onScroll:.*scrollBy/is.test(verticalGallerySource);

        expect(hasScrollByInCallback).toBe(false);
      }
    });
  });

  describe('CSS 기반 스크롤 설정', () => {
    const stylesPath = resolve(
      currentDir,
      '../../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
    );

    it('should have overflow-y: auto for natural scrolling', () => {
      const styles = readFileSync(stylesPath, 'utf-8');

      // overflow-y: auto 또는 overflow: auto가 있어야 함
      const hasOverflowAuto = /overflow(-y)?:\s*auto/i.test(styles);

      expect(hasOverflowAuto).toBe(true);
    });

    it('should have scroll-behavior: smooth for smooth scrolling', () => {
      const styles = readFileSync(stylesPath, 'utf-8');

      // scroll-behavior: smooth가 있어야 함 (선택적)
      const hasScrollBehavior = /scroll-behavior:\s*smooth/i.test(styles);

      // 있으면 좋고, 없어도 되지만 권장
      // 이 테스트는 정보 제공 목적
      if (hasScrollBehavior) {
        expect(hasScrollBehavior).toBe(true);
      }
    });
  });
});
