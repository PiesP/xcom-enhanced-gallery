import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Phase 9.21.4 RED: GalleryRenderer effect optimization', () => {
  const galleryRendererPath = join(process.cwd(), 'src/features/gallery/GalleryRenderer.tsx');
  const content = readFileSync(galleryRendererPath, 'utf-8');

  describe('on() helper 사용', () => {
    it('RED: setupStateSubscription should use on() helper', () => {
      // on을 getSolid()에서 destructure해야 함
      expect(content).toContain('createEffect, createRoot, on');

      // createEffect(...on(...)) 패턴 사용 (줄바꿈 허용)
      const createEffectOnPattern = /createEffect\s*\(\s*on\s*\(/;
      expect(createEffectOnPattern.test(content)).toBe(true);
      expect(content).toContain('isGalleryOpen,');
    });

    it('RED: on() should use defer: true option', () => {
      // defer: true로 초기 실행 스킵
      expect(content).toContain('{ defer: true }');
    });

    it('RED: callback should receive isOpen parameter', () => {
      // on() callback은 isOpen을 parameter로 받음
      // 주석 제거 + 공백 정규화하여 구조만 검증
      const normalizedContent = content
        .replace(/\/\/.*$/gm, '') // 주석 제거
        .replace(/\s+/g, ' '); // 공백 정규화

      // on(isGalleryOpen, isOpen => ...) 패턴
      const onCallbackPattern = /on\s*\(\s*isGalleryOpen,\s*\(?\s*isOpen\s*\)?\s*=>/;
      expect(onCallbackPattern.test(normalizedContent)).toBe(true);
    });
  });

  describe('Phase 9.18 로직 제거 또는 단순화', () => {
    it('RED: isInitialSubscription should be removed when defer: true is used', () => {
      const hasDefer = content.includes('{ defer: true }');
      const hasIsInitialSubscription = content.includes('this.isInitialSubscription');

      // defer: true를 사용하면 isInitialSubscription 불필요
      if (hasDefer) {
        // defer: true가 있으면 isInitialSubscription은 없어야 함
        expect(hasIsInitialSubscription).toBe(false);
      }
    });
  });

  describe('Phase 9.21.4 주석', () => {
    it('RED: should have Phase 9.21.4 comments explaining on() helper', () => {
      expect(content).toContain('Phase 9.21.4');
      expect(content).toContain('on() helper');
    });

    it('RED: should NOT have Phase 9.21.3 createEffect pattern', () => {
      // 기존 createEffect(() => { const isOpen = isGalleryOpen(); }) 패턴 제거
      const oldPattern = /createEffect\(\(\)\s*=>\s*{\s*const isOpen = isGalleryOpen\(\);/;
      expect(oldPattern.test(content)).toBe(false);
    });
  });
});

describe('Phase 9.21.4 RED: ModalShell debug logging', () => {
  const modalShellPath = join(process.cwd(), 'src/shared/components/ui/ModalShell/ModalShell.tsx');
  const content = readFileSync(modalShellPath, 'utf-8');

  describe('디버깅 로깅', () => {
    it('RED: should import logger', () => {
      expect(content).toContain('import { logger } from');
    });

    it('RED: should have createEffect for debug logging', () => {
      expect(content).toContain('createEffect(() => {');
      expect(content).toContain("logger.debug('[ModalShell]");
    });

    it('RED: should log isOpen value', () => {
      expect(content).toContain('isOpen: local.isOpen');
    });

    it('RED: should log backdropClass value', () => {
      expect(content).toContain('backdropClass: backdropClass()');
    });

    it('RED: should log shellClass value', () => {
      expect(content).toContain('shellClass: shellClass()');
    });
  });

  describe('Phase 9.21.4 주석', () => {
    it('RED: should have Phase 9.21.4 comments for debugging', () => {
      expect(content).toContain('Phase 9.21.4');
      expect(content).toContain('\ub514\ubc84\uae45'); // "디버깅" in Korean
    });
  });
});
