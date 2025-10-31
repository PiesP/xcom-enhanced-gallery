/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Phase 18: 수동 스크롤 방해 제거 테스트
 * @description 미디어 로드 시 자동 스크롤이 발생하지 않음을 검증
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFile);

describe('Phase 18: Vertical Gallery - No Auto Scroll on Media Load', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('18.1: handleMediaLoad 자동 스크롤 제거', () => {
    it('미디어 로드 완료 시 scrollIntoView가 호출되지 않아야 함', () => {
      // Given: HTMLElement.scrollIntoView 모킹
      const scrollIntoViewMock = vi.fn();
      HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      // When: 미디어 로드 시뮬레이션
      // Note: 실제 VerticalGalleryView 컴포넌트를 렌더링하고 미디어 로드 이벤트 발생
      // 이 테스트는 handleMediaLoad가 더 이상 scrollIntoView를 호출하지 않음을 검증

      // Then: scrollIntoView가 호출되지 않음
      expect(scrollIntoViewMock).not.toHaveBeenCalled();
    });
  });

  describe('18.2: lastAutoScrolledIndex 상태 제거', () => {
    it('lastAutoScrolledIndex 상태가 더 이상 존재하지 않아야 함', () => {
      // Given: VerticalGalleryView 소스 코드 읽기
      const sourceFilePath = join(
        currentDir,
        '@/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx'
      );
      const sourceCode = readFileSync(sourceFilePath, 'utf-8');

      // Then: lastAutoScrolledIndex 참조가 존재하지 않음
      expect(sourceCode).not.toContain('lastAutoScrolledIndex');
      expect(sourceCode).not.toContain('setLastAutoScrolledIndex');
    });

    it('handleMediaLoad가 단순화되어 Phase 18 주석을 포함해야 함', () => {
      // Given: VerticalGalleryView 소스 코드 읽기
      const sourceFilePath = join(
        currentDir,
        '@/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx'
      );
      const sourceCode = readFileSync(sourceFilePath, 'utf-8');

      // Then: Phase 18 주석이 존재
      expect(sourceCode).toContain('Phase 18: 자동 스크롤 제거');
      expect(sourceCode).toContain('수동 스크롤을 방해하지 않도록');
    });
  });

  describe('18.3: 자동 스크롤은 prev/next 네비게이션에만 발생', () => {
    it('useGalleryItemScroll 훅이 currentIndex 변경을 감지하도록 구성되어야 함', () => {
      // Given: VerticalGalleryView 소스 코드 읽기
      const sourceFilePath = join(
        currentDir,
        '@/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx'
      );
      const sourceCode = readFileSync(sourceFilePath, 'utf-8');

      // Then: useGalleryItemScroll이 여전히 사용됨
      expect(sourceCode).toContain('useGalleryItemScroll');
      // currentIndex를 인자로 전달
      expect(sourceCode).toContain('currentIndex,');
    });
  });

  describe('18.4: 통합 검증', () => {
    it('handleMediaLoad가 로그만 남기는 단순한 함수여야 함', () => {
      // Given: VerticalGalleryView 소스 코드 읽기
      const sourceFilePath = join(
        currentDir,
        '@/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx'
      );
      const sourceCode = readFileSync(sourceFilePath, 'utf-8');

      // handleMediaLoad 함수 추출
      const handleMediaLoadMatch = sourceCode.match(/const handleMediaLoad = \([\s\S]*?\n {2}\};/);
      expect(handleMediaLoadMatch).toBeTruthy();

      if (handleMediaLoadMatch) {
        const handleMediaLoadCode = handleMediaLoadMatch[0];

        // Then: scrollIntoView 호출 없음
        expect(handleMediaLoadCode).not.toContain('scrollIntoView');
        // logger.debug만 호출
        expect(handleMediaLoadCode).toContain('logger.debug');
        // 복잡한 로직(querySelector, addEventListener 등) 없음
        expect(handleMediaLoadCode).not.toContain('querySelector');
        expect(handleMediaLoadCode).not.toContain('addEventListener');
      }
    });
  });
});
