/**
 * @fileoverview Phase 62: 툴바 버튼 항상 활성화 테스트 (RED)
 * @description 순환 네비게이션 시 이전/다음 버튼이 항상 활성화되어야 함
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGalleryToolbarLogic } from '../../../src/shared/hooks/use-gallery-toolbar-logic';

describe('Phase 62: Toolbar Buttons Always Enabled (Circular Navigation)', () => {
  describe('RED: canGoPrevious() - 항상 활성화 (totalCount > 1)', () => {
    it('첫 번째 이미지(index=0, totalCount=3)에서도 이전 버튼이 활성화되어야 함', () => {
      // Arrange
      const props = {
        currentIndex: 0,
        totalCount: 3,
        isDownloading: false,
        disabled: false,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
        onFitOriginal: vi.fn(),
        onFitWidth: vi.fn(),
        onFitHeight: vi.fn(),
        onFitContainer: vi.fn(),
      };

      // Act
      const logic = useGalleryToolbarLogic(props);
      const canGoPrev = logic.state.canGoPrevious();

      // Assert - RED: 현재는 false이지만, true여야 함
      expect(canGoPrev).toBe(true);
    });

    it('중간 이미지(index=1, totalCount=3)에서 이전 버튼이 활성화되어야 함', () => {
      // Arrange
      const props = {
        currentIndex: 1,
        totalCount: 3,
        isDownloading: false,
        disabled: false,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
        onFitOriginal: vi.fn(),
        onFitWidth: vi.fn(),
        onFitHeight: vi.fn(),
        onFitContainer: vi.fn(),
      };

      // Act
      const logic = useGalleryToolbarLogic(props);
      const canGoPrev = logic.state.canGoPrevious();

      // Assert - 기존과 동일
      expect(canGoPrev).toBe(true);
    });

    it('단일 이미지(totalCount=1)에서는 이전 버튼이 비활성화되어야 함', () => {
      // Arrange
      const props = {
        currentIndex: 0,
        totalCount: 1,
        isDownloading: false,
        disabled: false,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
        onFitOriginal: vi.fn(),
        onFitWidth: vi.fn(),
        onFitHeight: vi.fn(),
        onFitContainer: vi.fn(),
      };

      // Act
      const logic = useGalleryToolbarLogic(props);
      const canGoPrev = logic.state.canGoPrevious();

      // Assert
      expect(canGoPrev).toBe(false);
    });
  });

  describe('RED: canGoNext() - 항상 활성화 (totalCount > 1)', () => {
    it('마지막 이미지(index=2, totalCount=3)에서도 다음 버튼이 활성화되어야 함', () => {
      // Arrange
      const props = {
        currentIndex: 2,
        totalCount: 3,
        isDownloading: false,
        disabled: false,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
        onFitOriginal: vi.fn(),
        onFitWidth: vi.fn(),
        onFitHeight: vi.fn(),
        onFitContainer: vi.fn(),
      };

      // Act
      const logic = useGalleryToolbarLogic(props);
      const canGoNext = logic.state.canGoNext();

      // Assert - RED: 현재는 false이지만, true여야 함
      expect(canGoNext).toBe(true);
    });

    it('중간 이미지(index=1, totalCount=3)에서 다음 버튼이 활성화되어야 함', () => {
      // Arrange
      const props = {
        currentIndex: 1,
        totalCount: 3,
        isDownloading: false,
        disabled: false,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
        onFitOriginal: vi.fn(),
        onFitWidth: vi.fn(),
        onFitHeight: vi.fn(),
        onFitContainer: vi.fn(),
      };

      // Act
      const logic = useGalleryToolbarLogic(props);
      const canGoNext = logic.state.canGoNext();

      // Assert - 기존과 동일
      expect(canGoNext).toBe(true);
    });

    it('단일 이미지(totalCount=1)에서는 다음 버튼이 비활성화되어야 함', () => {
      // Arrange
      const props = {
        currentIndex: 0,
        totalCount: 1,
        isDownloading: false,
        disabled: false,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
        onFitOriginal: vi.fn(),
        onFitWidth: vi.fn(),
        onFitHeight: vi.fn(),
        onFitContainer: vi.fn(),
      };

      // Act
      const logic = useGalleryToolbarLogic(props);
      const canGoNext = logic.state.canGoNext();

      // Assert
      expect(canGoNext).toBe(false);
    });
  });

  describe('RED: getActionProps() - 버튼 disabled 상태', () => {
    it('첫 번째 이미지에서 이전 버튼이 활성화되어야 함', () => {
      // Arrange
      const props = {
        currentIndex: 0,
        totalCount: 3,
        isDownloading: false,
        disabled: false,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
        onFitOriginal: vi.fn(),
        onFitWidth: vi.fn(),
        onFitHeight: vi.fn(),
        onFitContainer: vi.fn(),
      };

      // Act
      const logic = useGalleryToolbarLogic(props);
      const prevProps = logic.getActionProps('previous');

      // Assert - RED: disabled가 true이지만, false여야 함
      expect(prevProps.disabled).toBe(false);
    });

    it('마지막 이미지에서 다음 버튼이 활성화되어야 함', () => {
      // Arrange
      const props = {
        currentIndex: 2,
        totalCount: 3,
        isDownloading: false,
        disabled: false,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
        onFitOriginal: vi.fn(),
        onFitWidth: vi.fn(),
        onFitHeight: vi.fn(),
        onFitContainer: vi.fn(),
      };

      // Act
      const logic = useGalleryToolbarLogic(props);
      const nextProps = logic.getActionProps('next');

      // Assert - RED: disabled가 true이지만, false여야 함
      expect(nextProps.disabled).toBe(false);
    });
  });
});
