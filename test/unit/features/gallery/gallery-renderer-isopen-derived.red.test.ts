/**
 * @file gallery-renderer-isopen-derived.red.test.ts
 * @description Phase 9.21.3 RED: isGalleryOpen derived signal 검증
 *
 * Phase 9.21.2 실패 원인:
 * - untrack() 내부 값은 반응성 없음
 * - createEffect가 isOpen 변경을 감지할 수 없었음
 *
 * Phase 9.21.3 해결책:
 * - createMemo로 isOpen만 추적하는 derived signal 구현
 * - GalleryRenderer가 derived signal 사용하도록 수정
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const SIGNALS_PATH = join(process.cwd(), 'src/shared/state/signals/gallery.signals.ts');
const RENDERER_PATH = join(process.cwd(), 'src/features/gallery/GalleryRenderer.tsx');

describe('[Phase 9.21.3] RED: isGalleryOpen Derived Signal', () => {
  const signalsSource = readFileSync(SIGNALS_PATH, 'utf-8');
  const rendererSource = readFileSync(RENDERER_PATH, 'utf-8');

  describe('1. isGalleryOpen derived signal 존재', () => {
    it('RED: gallery.signals.ts에 isGalleryOpen이 export되어야 함', () => {
      expect(signalsSource).toContain('export const isGalleryOpen');
    });

    it('RED: isGalleryOpen은 createMemo를 사용해야 함', () => {
      const hasCreateMemo =
        signalsSource.includes('createMemo') && signalsSource.includes('isGalleryOpen');
      expect(hasCreateMemo).toBe(true);
    });

    it('RED: isGalleryOpen은 galleryState.value.isOpen을 반환해야 함', () => {
      // isGalleryOpen = createMemo(() => galleryState.value.isOpen)
      const pattern = /isGalleryOpen\s*=\s*createMemo\(\s*\(\)\s*=>\s*galleryState\.value\.isOpen/;
      expect(signalsSource).toMatch(pattern);
    });
  });

  describe('2. isGalleryOpen과 galleryState 동기화', () => {
    it('RED: isGalleryOpen은 galleryState.value.isOpen을 직접 참조해야 함', () => {
      // 간접 참조나 별도 로직 없이 직접 반환
      const hasDirectReference =
        signalsSource.includes('isGalleryOpen') &&
        signalsSource.includes('galleryState.value.isOpen');
      expect(hasDirectReference).toBe(true);
    });
  });

  describe('3. GalleryRenderer가 isGalleryOpen 사용', () => {
    it('RED: GalleryRenderer.tsx에서 isGalleryOpen을 import해야 함', () => {
      const importPattern =
        /import\s+{[^}]*isGalleryOpen[^}]*}\s+from\s+['"][^'"]*gallery\.signals/;
      expect(rendererSource).toMatch(importPattern);
    });

    it('RED: setupStateSubscription에서 isGalleryOpen()을 호출해야 함', () => {
      // const isOpen = isGalleryOpen();
      const hasUsage =
        rendererSource.includes('setupStateSubscription') &&
        rendererSource.includes('isGalleryOpen()');
      expect(hasUsage).toBe(true);
    });

    it('RED: setupStateSubscription에서 untrack 사용을 제거해야 함', () => {
      // Phase 9.21.2의 잘못된 untrack 패턴 제거
      const setupMethod = rendererSource.match(
        /private\s+setupStateSubscription\(\s*\)\s*:\s*void\s*{[\s\S]*?^\s{2}}/m
      );
      if (setupMethod) {
        expect(setupMethod[0]).not.toContain('untrack');
      }
    });

    it('RED: setupStateSubscription에서 galleryState.value 직접 접근 금지', () => {
      // isGalleryOpen()을 통해서만 접근해야 함
      const setupMethod = rendererSource.match(
        /private\s+setupStateSubscription\(\s*\)\s*:\s*void\s*{[\s\S]*?^\s{2}}/m
      );
      if (setupMethod) {
        // galleryState.value.isOpen 직접 접근 금지
        const hasDirectAccess = /galleryState\.value\.isOpen/.test(setupMethod[0]);
        expect(hasDirectAccess).toBe(false);
      }
    });
  });

  describe('4. 주석 및 문서화', () => {
    it('RED: isGalleryOpen에 Phase 9.21.3 주석이 있어야 함', () => {
      const hasPhaseComment = /Phase 9\.21\.3|createMemo.*isOpen/.test(signalsSource);
      expect(hasPhaseComment).toBe(true);
    });

    it('RED: setupStateSubscription에 Phase 9.21.3 주석이 있어야 함', () => {
      const hasPhaseComment = /Phase 9\.21\.3/.test(rendererSource);
      expect(hasPhaseComment).toBe(true);
    });
  });
});
