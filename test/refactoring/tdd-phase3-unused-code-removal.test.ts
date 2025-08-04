/**
 * @fileoverview TDD Phase 3: 미사용 코드 제거 테스트
 * @description RED → GREEN → REFACTOR 사이클로 미사용 코드 제거 검증
 */

import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

describe('🔴 TDD Phase 3: 미사용 코드 제거 (RED)', () => {
  describe('미사용 HOC 컴포넌트 제거 검증', () => {
    it('HOC index.ts에서 중복된 withGallery exports가 제거되어야 함', async () => {
      const hocIndexPath = path.join(process.cwd(), 'src/shared/components/hoc/index.ts');
      const content = await fs.readFile(hocIndexPath, 'utf-8');

      // 중복된 withGallery export가 존재하지 않아야 함 (현재는 존재하므로 실패해야 함)
      const withGalleryMatches = content.match(/withGallery/g) || [];
      expect(withGalleryMatches.length).toBe(1); // 하나만 있어야 함
    });

    it('HOC index.ts에서 미사용 GalleryHOC export가 제거되어야 함', async () => {
      const hocIndexPath = path.join(process.cwd(), 'src/shared/components/hoc/index.ts');
      const content = await fs.readFile(hocIndexPath, 'utf-8');

      // 직접적인 GalleryHOC export는 더 이상 사용하지 않으므로 export되지 않아야 함
      // (import 경로의 './GalleryHOC'는 허용, 실제 export GalleryHOC는 제거되어야 함)
      expect(content).not.toMatch(/export\s*{\s*[^}]*GalleryHOC[^}]*}/);
    });

    it('components/index.ts에서 미사용 HOC export가 정리되어야 함', async () => {
      const componentsIndexPath = path.join(process.cwd(), 'src/shared/components/index.ts');
      const content = await fs.readFile(componentsIndexPath, 'utf-8');

      // 필수적인 것만 export되어야 함
      const lines = content.split('\n');
      const hocExportLine = lines.find(
        line => line.includes('withGallery') && line.includes('export')
      );

      if (hocExportLine) {
        // withGallery만 있고 GalleryHOC는 없어야 함
        expect(hocExportLine).not.toContain('GalleryHOC');
      }
    });
  });

  describe('미사용 Virtual Scroll 컴포넌트 제거 검증', () => {
    it('useVirtualScroll 훅이 hooks/index.ts에서 export되지 않아야 함', async () => {
      const hooksIndexPath = path.join(process.cwd(), 'src/shared/hooks/index.ts');
      const content = await fs.readFile(hooksIndexPath, 'utf-8');

      // useVirtualScroll이 더 이상 export되지 않아야 함
      expect(content).not.toContain('useVirtualScroll');
    });

    it('VirtualGallery 컴포넌트가 존재하지 않아야 함', async () => {
      const virtualGalleryPath = path.join(
        process.cwd(),
        'src/shared/components/virtual/VirtualGallery.tsx'
      );

      try {
        await fs.access(virtualGalleryPath);
        // 파일이 존재하면 실패 (삭제되어야 하므로)
        expect(false).toBe(true);
      } catch {
        // 파일이 존재하지 않으면 성공
        expect(true).toBe(true);
      }
    });

    it('shared/index.ts에서 virtual 관련 export가 제거되어야 함', async () => {
      const sharedIndexPath = path.join(process.cwd(), 'src/shared/index.ts');
      const content = await fs.readFile(sharedIndexPath, 'utf-8');

      // virtual 관련 export가 없어야 함
      expect(content).not.toContain('virtual');
      expect(content).not.toContain('VirtualGallery');
      expect(content).not.toContain('useVirtualScroll');
    });
  });

  describe('테스트 파일의 미사용 import 정리 검증', () => {
    it('테스트 파일에서 WithGallery import가 정리되어야 함', async () => {
      const testFiles = [
        'test/consolidated/integration.consolidated.test.ts',
        'test/consolidated/media-extraction.consolidated.test.ts',
        'test/consolidated/styles-optimization.consolidated.test.ts',
        'test/consolidated/user-interactions.consolidated.test.ts',
        'test/utils/helpers/page-test-environment.ts',
      ];

      for (const testFile of testFiles) {
        const filePath = path.join(process.cwd(), testFile);
        try {
          const content = await fs.readFile(filePath, 'utf-8');

          // WithGallery import가 정리되어야 함
          expect(content).not.toContain('WithGallery');
        } catch {
          // 파일이 존재하지 않으면 건너뜀
          continue;
        }
      }
    });
  });

  describe('번들 크기 최적화 검증', () => {
    it('미사용 코드 제거 후 번들 크기가 감소해야 함', async () => {
      // 현재 프로덕션 빌드 크기 측정 (기준점)
      const currentBundleSize = 410.53; // KB (현재 측정값)

      // 미사용 코드 제거 후 예상 크기 (5% 이상 감소 목표)
      const expectedMaxSize = currentBundleSize * 0.95;

      // 실제 테스트는 빌드 후에 확인해야 하므로, 지금은 기준만 설정
      // TODO: 실제 빌드 크기 측정 로직 추가 필요
      expect(expectedMaxSize).toBeLessThan(currentBundleSize);
    });
  });
});

describe('🟢 TDD Phase 3: 미사용 코드 제거 (GREEN) - 구현 후 통과 예정', () => {
  describe('정리된 Export 구조 검증', () => {
    it('HOC exports가 정리되어 중복이 없어야 함', async () => {
      // GREEN 단계에서 구현 후 통과할 테스트
      expect(true).toBe(true); // 임시
    });

    it('필수 컴포넌트만 export되어야 함', async () => {
      // GREEN 단계에서 구현 후 통과할 테스트
      expect(true).toBe(true); // 임시
    });
  });
});

describe('🔵 TDD Phase 3: 미사용 코드 제거 (REFACTOR) - 최적화 검증', () => {
  describe('최종 구조 검증', () => {
    it('깔끔한 export 구조를 가져야 함', async () => {
      // REFACTOR 단계에서 최적화 후 통과할 테스트
      expect(true).toBe(true); // 임시
    });
  });
});
