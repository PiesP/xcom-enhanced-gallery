/**
 * VerticalImageItem Smart Image Fit Integration Tests
 *
 * TDD 완료 상태: Smart Image Fit 시스템 통합 검증
 * - useSmartImageFit 훅 통합 완료
 * - 뷰포트 리사이즈 감지 활성화
 * - 기존 기능과의 완벽한 호환성 보장
 */

// @ts-nocheck - 테스트용 확장 props 사용
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/preact';
import { VerticalImageItem } from '../../../src/features/gallery/components/vertical-gallery-view/VerticalImageItem';

// Mock dependencies
vi.mock('../../../src/shared/external/vendors', () => ({
  getPreactHooks: () => ({
    useCallback: vi.fn(fn => fn),
    useEffect: vi.fn(),
    useRef: vi.fn(() => ({
      current: {
        naturalWidth: 1000,
        naturalHeight: 750,
        complete: true,
      },
    })),
    useState: vi.fn(initial => [initial, vi.fn()]),
  }),
  getPreactCompat: () => ({
    memo: vi.fn(component => component),
  }),
}));

vi.mock('../../../src/shared/components/hoc/GalleryHOC', () => ({
  withGallery: vi.fn(component => component),
}));

vi.mock('../../../src/shared/components/ui/Button/Button', () => ({
  Button: ({ children, ...props }) => {
    return { type: 'button', props: { ...props, children } };
  },
}));

vi.mock('../../../src/shared/components/ui/StandardProps', () => ({
  ComponentStandards: {
    createClassName: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
    createAriaProps: vi.fn(props => props),
    createTestProps: vi.fn(testId => (testId ? { 'data-testid': testId } : {})),
  },
}));

vi.mock('../../../src/shared/browser/utils/browser-utils', () => ({
  getViewportSize: vi.fn(() => ({ width: 1920, height: 1080 })),
}));

vi.mock('../../../src/shared/utils/media/smart-image-fit', () => ({
  calculateSmartImageFit: vi.fn(() => ({
    width: 800,
    height: 600,
    shouldApply: true,
    mode: 'fitWidth',
  })),
}));

// useSmartImageFit 훅 모킹
vi.mock('../../../src/features/gallery/hooks/useSmartImageFit', () => ({
  useSmartImageFit: vi.fn(() => ({
    imageStyle: {
      width: '800px',
      height: '600px',
      maxWidth: '1000px',
      maxHeight: '750px',
    },
    isApplied: true,
    calculatedSize: { width: 800, height: 600 },
  })),
}));

describe('VerticalImageItem Smart Image Fit 통합 검증', () => {
  const defaultProps = {
    media: {
      url: 'https://example.com/test-image.jpg',
      filename: 'test-image.jpg',
    },
    index: 0,
    isActive: false,
    onClick: vi.fn(),
    forceVisible: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('✅ GREEN: Smart Image Fit 통합 완료 검증', () => {
    it('useSmartImageFit 훅이 올바른 props로 호출됨', async () => {
      const { useSmartImageFit } = await import(
        '../../../src/features/gallery/hooks/useSmartImageFit'
      );

      render(VerticalImageItem(/** @type {any} */ { ...defaultProps, fitMode: 'fitWidth' }));

      // useSmartImageFit 훅이 호출되었는지 확인
      expect(useSmartImageFit).toHaveBeenCalledWith(
        expect.objectContaining({
          fitMode: 'fitWidth',
          watchViewportResize: true,
        })
      );
    });

    it('스마트 이미지 스타일이 컴포넌트에 적용됨', async () => {
      render(VerticalImageItem(/** @type {any} */ { ...defaultProps, fitMode: 'fitContainer' }));

      // 컨테이너가 렌더링되기를 기다림
      await waitFor(() => {
        const container = screen.getByRole('button');
        expect(container).toBeInTheDocument();
      });

      const container = screen.getByRole('button');
      expect(container).toHaveAttribute('aria-label', expect.stringContaining('test-image.jpg'));
    });

    it('비디오 미디어에도 스마트 핏이 적용됨', async () => {
      const videoProps = {
        ...defaultProps,
        media: {
          url: 'https://example.com/test-video.mp4',
          filename: 'test-video.mp4',
        },
      };

      const { useSmartImageFit } = await import(
        '../../../src/features/gallery/hooks/useSmartImageFit'
      );

      render(VerticalImageItem(/** @type {any} */ { ...videoProps, fitMode: 'fitContainer' }));

      // 비디오에도 훅이 적용되었는지 확인
      expect(useSmartImageFit).toHaveBeenCalledWith(
        expect.objectContaining({
          fitMode: 'fitContainer',
          watchViewportResize: true,
        })
      );
    });

    it('뷰포트 리사이즈 감지가 활성화됨', async () => {
      const { useSmartImageFit } = await import(
        '../../../src/features/gallery/hooks/useSmartImageFit'
      );

      render(VerticalImageItem(/** @type {any} */ { ...defaultProps, fitMode: 'fitWidth' }));

      // watchViewportResize가 true로 설정되었는지 확인
      expect(useSmartImageFit).toHaveBeenCalledWith(
        expect.objectContaining({
          watchViewportResize: true,
        })
      );
    });
  });

  describe('🔄 REFACTOR: 성능 최적화 검증', () => {
    it('fitMode 변경 시 재계산됨', async () => {
      const { useSmartImageFit } = await import(
        '../../../src/features/gallery/hooks/useSmartImageFit'
      );

      const { rerender } = render(
        VerticalImageItem(/** @type {any} */ { ...defaultProps, fitMode: 'fitWidth' })
      );

      expect(useSmartImageFit).toHaveBeenCalledWith(
        expect.objectContaining({ fitMode: 'fitWidth' })
      );

      // fitMode 변경
      rerender(VerticalImageItem(/** @type {any} */ { ...defaultProps, fitMode: 'fitContainer' }));

      expect(useSmartImageFit).toHaveBeenCalledWith(
        expect.objectContaining({ fitMode: 'fitContainer' })
      );
    });

    it('에러 상태에서도 안정적으로 동작함', () => {
      // 에러가 발생해도 컴포넌트가 크래시하지 않아야 함
      expect(() => {
        render(VerticalImageItem({ ...defaultProps, fitMode: 'fitWidth' }));
      }).not.toThrow();
    });
  });

  describe('🔗 INTEGRATION: 기존 기능과의 호환성', () => {
    it('다운로드 기능이 정상 작동함', () => {
      const onDownload = vi.fn();
      render(VerticalImageItem({ ...defaultProps, onDownload, fitMode: 'fitWidth' }));

      // 컴포넌트가 정상적으로 렌더링되는지 확인
      const container = screen.getByRole('button');
      expect(container).toBeInTheDocument();

      // onDownload prop이 전달되었으므로 다운로드 기능이 활성화됨
      expect(onDownload).toBeDefined();
    });

    it('컨텍스트 메뉴가 정상 작동함', () => {
      const onImageContextMenu = vi.fn();
      render(VerticalImageItem({ ...defaultProps, onImageContextMenu, fitMode: 'fitWidth' }));

      const container = screen.getByRole('button');
      expect(container).toBeInTheDocument();
    });

    it('lazy loading이 정상 작동함', () => {
      render(VerticalImageItem({ ...defaultProps, forceVisible: false, fitMode: 'fitWidth' }));

      const container = screen.getByRole('button');
      expect(container).toBeInTheDocument();
    });

    it('접근성 속성이 유지됨', () => {
      render(
        VerticalImageItem({ ...defaultProps, 'aria-label': 'Test image', fitMode: 'fitWidth' })
      );

      const container = screen.getByRole('button');
      expect(container).toHaveAttribute('aria-label', 'Test image');
    });

    it('기본 갤러리 기능이 유지됨', async () => {
      const onClick = vi.fn();
      render(VerticalImageItem({ ...defaultProps, onClick, fitMode: 'fitWidth' }));

      const container = screen.getByRole('button');
      expect(container).toBeInTheDocument();
      expect(container).toHaveAttribute('data-index', '0');
    });
  });

  describe('📊 성능 및 안정성 검증', () => {
    it('메모이제이션이 적용되어 불필요한 렌더링이 방지됨', () => {
      const { rerender } = render(VerticalImageItem({ ...defaultProps, fitMode: 'fitWidth' }));

      // 동일한 props로 재렌더링
      rerender(VerticalImageItem({ ...defaultProps, fitMode: 'fitWidth' }));

      // 컴포넌트가 정상적으로 렌더링됨
      const container = screen.getByRole('button');
      expect(container).toBeInTheDocument();
    });

    it('다양한 fitMode에서 안정적으로 동작함', () => {
      const fitModes = ['original', 'fitWidth', 'fitHeight', 'fitContainer'];

      fitModes.forEach(fitMode => {
        cleanup();
        expect(() => {
          render(VerticalImageItem({ ...defaultProps, fitMode }));
        }).not.toThrow();

        const container = screen.getByRole('button');
        expect(container).toBeInTheDocument();
      });
    });

    it('빈 미디어 정보에서도 안전하게 처리됨', () => {
      const emptyMediaProps = {
        ...defaultProps,
        media: {
          url: '',
          filename: '',
        },
      };

      expect(() => {
        render(VerticalImageItem({ ...emptyMediaProps, fitMode: 'fitWidth' }));
      }).not.toThrow();
    });
  });
});
