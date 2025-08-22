/**
 * @fileoverview Toolbar Icons Integration Tests
 * @version 1.0.0 - 툴바 아이콘 교체 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/preact';
import { h } from 'preact';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';

describe('Toolbar Icons Integration', () => {
  beforeEach(() => {
    // 각 테스트 전 정리
  });

  afterEach(() => {
    cleanup();
  });

  describe('네비게이션 아이콘', () => {
    it('이전 버튼에 chevron-left 아이콘이 렌더링되어야 함', () => {
      const { container } = render(
        h(Toolbar, {
          currentIndex: 1,
          totalCount: 3,
          onPrevious: () => {},
          onNext: () => {},
          onClose: () => {},
          onDownloadCurrent: () => {},
          onDownloadAll: () => {},
        })
      );

      const prevButton = container.querySelector('[data-gallery-element="nav-previous"]');
      expect(prevButton).toBeTruthy();

      const svg = prevButton?.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    });

    it('다음 버튼에 chevron-right 아이콘이 렌더링되어야 함', () => {
      const { container } = render(
        h(Toolbar, {
          currentIndex: 0,
          totalCount: 3,
          onPrevious: () => {},
          onNext: () => {},
          onClose: () => {},
          onDownloadCurrent: () => {},
          onDownloadAll: () => {},
        })
      );

      const nextButton = container.querySelector('[data-gallery-element="nav-next"]');
      expect(nextButton).toBeTruthy();

      const svg = nextButton?.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    });
  });

  describe('액션 아이콘', () => {
    it('다운로드 버튼에 download 아이콘이 렌더링되어야 함', () => {
      const { container } = render(
        h(Toolbar, {
          currentIndex: 0,
          totalCount: 3,
          onPrevious: () => {},
          onNext: () => {},
          onClose: () => {},
          onDownloadCurrent: () => {},
          onDownloadAll: () => {},
        })
      );

      const downloadButton = container.querySelector('[data-gallery-element="download-current"]');
      expect(downloadButton).toBeTruthy();

      const svg = downloadButton?.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    });

    it('전체 다운로드 버튼에 file-zip 아이콘이 렌더링되어야 함', () => {
      const { container } = render(
        h(Toolbar, {
          currentIndex: 0,
          totalCount: 3,
          onPrevious: () => {},
          onNext: () => {},
          onClose: () => {},
          onDownloadCurrent: () => {},
          onDownloadAll: () => {},
        })
      );

      const downloadAllButton = container.querySelector('[data-gallery-element="download-all"]');
      expect(downloadAllButton).toBeTruthy();

      const svg = downloadAllButton?.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    });

    it('닫기 버튼에 x 아이콘이 렌더링되어야 함', () => {
      const { container } = render(
        h(Toolbar, {
          currentIndex: 0,
          totalCount: 3,
          onPrevious: () => {},
          onNext: () => {},
          onClose: () => {},
          onDownloadCurrent: () => {},
          onDownloadAll: () => {},
        })
      );

      const closeButton = container.querySelector('[data-gallery-element="close"]');
      expect(closeButton).toBeTruthy();

      const svg = closeButton?.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    });
  });

  describe('핏 모드 아이콘', () => {
    it('원본 크기 버튼에 zoom-in 아이콘이 렌더링되어야 함', () => {
      const { container } = render(
        h(Toolbar, {
          currentIndex: 0,
          totalCount: 3,
          onPrevious: () => {},
          onNext: () => {},
          onClose: () => {},
          onDownloadCurrent: () => {},
          onDownloadAll: () => {},
          onFitOriginal: () => {},
          onFitWidth: () => {},
          onFitHeight: () => {},
          onFitContainer: () => {},
        })
      );

      const fitOriginalButton = container.querySelector('[data-gallery-element="fit-original"]');
      expect(fitOriginalButton).toBeTruthy();

      const svg = fitOriginalButton?.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    });
  });
});
