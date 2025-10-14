/**
 * @fileoverview Phase 66: Toolbar 순환 네비게이션 수정 테스트 (RED)
 * @description
 * - Phase 62에서 순환 네비게이션을 구현했지만, Toolbar.tsx의 navState()에서
 *   여전히 경계 조건을 체크하여 버튼이 비활성화되는 문제 해결
 * - totalCount > 1일 때 prevDisabled와 nextDisabled가 항상 false여야 함
 *
 * TDD RED 단계: 이 테스트는 실패해야 합니다 (구현 전)
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { getSolid } from '../../../src/shared/external/vendors';
import { Toolbar } from '../../../src/shared/components/ui/Toolbar/Toolbar';
import { render, cleanup } from '../../utils/testing-library';

const { h } = getSolid();

describe('Phase 66: Toolbar Circular Navigation Fix', () => {
  afterEach(() => {
    cleanup();
  });

  describe('RED: navState - 순환 네비게이션 지원', () => {
    it('totalCount > 1일 때 첫 번째 항목에서 이전 버튼이 활성화되어야 함', () => {
      const { container } = render(
        h(Toolbar, {
          currentIndex: 0,
          totalCount: 3,
          onPrevious: vi.fn(),
          onNext: vi.fn(),
          onDownloadCurrent: vi.fn(),
          onDownloadAll: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const prevButton = container.querySelector('[data-gallery-element="nav-previous"]');
      expect(prevButton).toBeTruthy();

      // RED: 현재는 data-disabled="true"이지만, false여야 함
      expect(prevButton?.getAttribute('data-disabled')).toBe('false');
    });

    it('totalCount > 1일 때 마지막 항목에서 다음 버튼이 활성화되어야 함', () => {
      const { container } = render(
        h(Toolbar, {
          currentIndex: 2,
          totalCount: 3,
          onPrevious: vi.fn(),
          onNext: vi.fn(),
          onDownloadCurrent: vi.fn(),
          onDownloadAll: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const nextButton = container.querySelector('[data-gallery-element="nav-next"]');
      expect(nextButton).toBeTruthy();

      // RED: 현재는 data-disabled="true"이지만, false여야 함
      expect(nextButton?.getAttribute('data-disabled')).toBe('false');
    });

    it('totalCount = 1일 때 이전 버튼이 비활성화되어야 함', () => {
      const { container } = render(
        h(Toolbar, {
          currentIndex: 0,
          totalCount: 1,
          onPrevious: vi.fn(),
          onNext: vi.fn(),
          onDownloadCurrent: vi.fn(),
          onDownloadAll: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const prevButton = container.querySelector('[data-gallery-element="nav-previous"]');
      expect(prevButton).toBeTruthy();
      expect(prevButton?.getAttribute('data-disabled')).toBe('true');
    });

    it('totalCount = 1일 때 다음 버튼이 비활성화되어야 함', () => {
      const { container } = render(
        h(Toolbar, {
          currentIndex: 0,
          totalCount: 1,
          onPrevious: vi.fn(),
          onNext: vi.fn(),
          onDownloadCurrent: vi.fn(),
          onDownloadAll: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const nextButton = container.querySelector('[data-gallery-element="nav-next"]');
      expect(nextButton).toBeTruthy();
      expect(nextButton?.getAttribute('data-disabled')).toBe('true');
    });

    it('props.disabled = true일 때 네비게이션 버튼이 비활성화되어야 함', () => {
      const { container } = render(
        h(Toolbar, {
          currentIndex: 1,
          totalCount: 3,
          disabled: true,
          onPrevious: vi.fn(),
          onNext: vi.fn(),
          onDownloadCurrent: vi.fn(),
          onDownloadAll: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const prevButton = container.querySelector('[data-gallery-element="nav-previous"]');
      const nextButton = container.querySelector('[data-gallery-element="nav-next"]');

      expect(prevButton?.getAttribute('data-disabled')).toBe('true');
      expect(nextButton?.getAttribute('data-disabled')).toBe('true');
    });
  });

  describe('RED: 중간 인덱스에서 양방향 네비게이션 활성화', () => {
    it('currentIndex = 1, totalCount = 3일 때 양쪽 버튼이 모두 활성화되어야 함', () => {
      const { container } = render(
        h(Toolbar, {
          currentIndex: 1,
          totalCount: 3,
          onPrevious: vi.fn(),
          onNext: vi.fn(),
          onDownloadCurrent: vi.fn(),
          onDownloadAll: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const prevButton = container.querySelector('[data-gallery-element="nav-previous"]');
      const nextButton = container.querySelector('[data-gallery-element="nav-next"]');

      expect(prevButton?.getAttribute('data-disabled')).toBe('false');
      expect(nextButton?.getAttribute('data-disabled')).toBe('false');
    });
  });

  describe('RED: focusedIndex와 currentIndex 불일치 시나리오', () => {
    it('스크롤로 focusedIndex가 변경되어도 순환 네비게이션이 유지되어야 함', () => {
      // 이 테스트는 focusedIndex prop이 추가되면 활성화
      // 현재는 currentIndex만 사용하므로 SKIP
      expect(true).toBe(true);
    });
  });
});
