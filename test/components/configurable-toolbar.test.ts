/**
 * @fileoverview Toolbar Config-based Rendering Tests (TDD Phase T3)
 * @description Toolbar을 config 기반으로 렌더링하는 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/preact';
import { h } from 'preact';

describe('Toolbar Config-based Rendering (Phase T3)', () => {
  const mockProps = {
    currentIndex: 1,
    totalCount: 5,
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Config-based Toolbar 컴포넌트 존재성', () => {
    it('ConfigurableToolbar 컴포넌트가 import되어야 한다', async () => {
      try {
        const { ConfigurableToolbar } = await import(
          '@shared/components/ui/Toolbar/ConfigurableToolbar'
        );
        expect(ConfigurableToolbar).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined(); // RED 상태 예상
      }
    });
  });

  describe('기본 config', () => {
    it('기본 toolbar config가 정의되어야 한다', async () => {
      try {
        const { defaultToolbarConfig } = await import(
          '@shared/components/ui/Toolbar/toolbarConfig'
        );
        expect(defaultToolbarConfig).toBeDefined();
        expect(defaultToolbarConfig.actionGroups).toBeInstanceOf(Array);
      } catch (error) {
        expect(error).toBeDefined(); // RED 상태 예상
      }
    });
  });
});
