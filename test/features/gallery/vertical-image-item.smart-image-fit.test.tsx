/**
 * VerticalImageItem + Smart Image Fit 통합 테스트
 * TDD로 구현하는 스마트 이미지 핏 통합
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/preact';
import { VerticalImageItem } from '../../../src/features/gallery/components/vertical-gallery-view/VerticalImageItem';

// Mock smart image fit hook
vi.mock('../../../src/features/gallery/hooks/useSmartImageFit', () => ({
  useSmartImageFit: vi.fn(),
}));

// Mock vendor dependencies
vi.mock('../../../src/shared/external/vendors', () => ({
  getPreactHooks: () => ({
    useCallback: fn => fn,
    useEffect: () => {},
    useRef: () => ({ current: null }),
    useState: initial => [initial, () => {}],
  }),
  getPreactCompat: () => ({
    memo: component => component,
  }),
}));

// Mock HOC
vi.mock('../../../src/shared/components/hoc/GalleryHOC', () => ({
  withGallery: component => component,
}));

// Mock StandardProps
vi.mock('../../../src/shared/components/ui/StandardProps', () => ({
  ComponentStandards: {
    createClassName: (...classes) => classes.filter(Boolean).join(' '),
    createAriaProps: props => props,
    createTestProps: testId => (testId ? { 'data-testid': testId } : {}),
  },
}));

// Mock Button component
vi.mock('../../../src/shared/components/ui/Button/Button', () => ({
  Button: vi.fn().mockImplementation(({ children, onClick, ...props }) => {
    const element = document.createElement('button');
    element.onclick = onClick;
    Object.assign(element, props);
    element.textContent = typeof children === 'string' ? children : 'Button';
    return element;
  }),
}));

describe('TDD: VerticalImageItem Smart Image Fit 통합', () => {
  const mockMedia = {
    url: 'https://example.com/test-image.jpg',
    filename: 'test-image.jpg',
  };

  const defaultProps = {
    media: mockMedia,
    index: 0,
    isActive: false,
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RED: 스마트 이미지 핏 미적용 상태', () => {
    it('useSmartImageFit 훅이 호출되지 않는 현재 상태', () => {
      const { useSmartImageFit } = require('../../../src/features/gallery/hooks/useSmartImageFit');

      render(<VerticalImageItem {...defaultProps} fitMode='fitWidth' />);

      // 현재는 훅이 호출되지 않아야 함 (RED 상태)
      expect(useSmartImageFit).not.toHaveBeenCalled();
    });

    it('fitMode가 전달되어도 스마트 핏이 적용되지 않는 상태', () => {
      render(<VerticalImageItem {...defaultProps} fitMode='fitContainer' />);

      // 현재는 CSS 기반 핏만 적용됨
      const img = screen.getByRole('img');
      expect(img).toHaveClass('fitContainer');
      // 하지만 동적 스타일이 적용되지 않음
      expect(img.style.width).toBe('');
      expect(img.style.height).toBe('');
    });

    it('원본보다 큰 이미지도 스케일업되는 문제 (현재 상태)', () => {
      // 현재는 CSS만으로 핏 모드를 처리하므로
      // 작은 이미지도 컨테이너에 맞춰 확대될 수 있음
      render(<VerticalImageItem {...defaultProps} fitMode='fitContainer' />);

      const img = screen.getByRole('img');
      // CSS 기반이므로 원본 크기 보호가 없음
      expect(img.style.maxWidth).toBe('');
      expect(img.style.maxHeight).toBe('');
    });

    it('뷰포트 크기를 고려하지 않는 현재 상태', () => {
      render(<VerticalImageItem {...defaultProps} fitMode='fitWidth' />);

      // 현재는 뷰포트 크기와 관계없이 CSS 핏 모드만 적용
      const img = screen.getByRole('img');
      expect(img).toHaveClass('fitWidth');
      // 하지만 실제 뷰포트 크기 비교는 없음
    });
  });

  describe('GREEN: 스마트 이미지 핏 적용 목표', () => {
    it('useSmartImageFit 훅이 올바른 props로 호출되어야 함', () => {
      const { useSmartImageFit } = require('../../../src/features/gallery/hooks/useSmartImageFit');
      useSmartImageFit.mockReturnValue({
        imageStyle: {},
        isApplied: false,
        calculatedSize: { width: 0, height: 0 },
      });

      render(<VerticalImageItem {...defaultProps} fitMode='fitWidth' />);

      // 훅이 올바른 인수로 호출되어야 함
      expect(useSmartImageFit).toHaveBeenCalledWith({
        imageElement: null, // 초기값 (아직 ref가 설정되지 않음)
        fitMode: 'fitWidth',
        watchViewportResize: true,
      });
    });

    it('계산된 스타일이 이미지에 적용되어야 함', () => {
      const { useSmartImageFit } = require('../../../src/features/gallery/hooks/useSmartImageFit');
      useSmartImageFit.mockReturnValue({
        imageStyle: {
          width: '800px',
          height: '600px',
          maxWidth: '1200px',
          maxHeight: '900px',
          objectFit: 'contain',
        },
        isApplied: true,
        calculatedSize: { width: 800, height: 600 },
      });

      render(<VerticalImageItem {...defaultProps} fitMode='fitContainer' />);

      const img = screen.getByRole('img');
      // 계산된 스타일이 적용되어야 함
      expect(img.style.width).toBe('800px');
      expect(img.style.height).toBe('600px');
      expect(img.style.maxWidth).toBe('1200px');
      expect(img.style.maxHeight).toBe('900px');
      expect(img.style.objectFit).toBe('contain');
    });

    it('스마트 핏이 적용되지 않을 때는 기존 CSS 클래스만 사용해야 함', () => {
      const { useSmartImageFit } = require('../../../src/features/gallery/hooks/useSmartImageFit');
      useSmartImageFit.mockReturnValue({
        imageStyle: {},
        isApplied: false,
        calculatedSize: { width: 400, height: 300 },
      });

      render(<VerticalImageItem {...defaultProps} fitMode='original' />);

      const img = screen.getByRole('img');
      // 기존 CSS 클래스는 유지
      expect(img).toHaveClass('fitOriginal');
      // 하지만 추가 인라인 스타일은 없음
      expect(img.style.width).toBe('');
      expect(img.style.height).toBe('');
    });

    it('이미지 ref가 설정된 후 훅이 재호출되어야 함', async () => {
      const { useSmartImageFit } = require('../../../src/features/gallery/hooks/useSmartImageFit');
      useSmartImageFit.mockReturnValue({
        imageStyle: {},
        isApplied: false,
        calculatedSize: { width: 0, height: 0 },
      });

      render(<VerticalImageItem {...defaultProps} fitMode='fitWidth' />);

      // 이미지 로드 시뮬레이션
      const img = screen.getByRole('img');
      Object.defineProperty(img, 'naturalWidth', { value: 1200 });
      Object.defineProperty(img, 'naturalHeight', { value: 800 });

      // 이미지 로드 이벤트 발생
      img.dispatchEvent(new Event('load'));

      await waitFor(() => {
        // 이미지 ref가 설정된 후 훅이 재호출되어야 함
        expect(useSmartImageFit).toHaveBeenCalledWith(
          expect.objectContaining({
            imageElement: expect.any(HTMLImageElement),
          })
        );
      });
    });

    it('비디오 요소에도 스마트 핏이 적용되어야 함', () => {
      const videoMedia: MediaInfo = {
        url: 'https://example.com/test-video.mp4',
        filename: 'test-video.mp4',
      };

      const { useSmartImageFit } = require('../../../src/features/gallery/hooks/useSmartImageFit');
      useSmartImageFit.mockReturnValue({
        imageStyle: {
          width: '640px',
          height: '480px',
          objectFit: 'contain',
        },
        isApplied: true,
        calculatedSize: { width: 640, height: 480 },
      });

      render(<VerticalImageItem {...defaultProps} media={videoMedia} fitMode='fitHeight' />);

      const video = screen.getByRole('application'); // video 요소
      expect(video.style.width).toBe('640px');
      expect(video.style.height).toBe('480px');
      expect(video.style.objectFit).toBe('contain');
    });
  });

  describe('REFACTOR: 성능 최적화 및 안정성', () => {
    it('fitMode 변경 시에만 재계산되어야 함', () => {
      const { useSmartImageFit } = require('../../../src/features/gallery/hooks/useSmartImageFit');
      useSmartImageFit.mockReturnValue({
        imageStyle: {},
        isApplied: false,
        calculatedSize: { width: 0, height: 0 },
      });

      const { rerender } = render(<VerticalImageItem {...defaultProps} fitMode='fitWidth' />);

      // fitMode가 같으면 재호출되지 않아야 함
      rerender(<VerticalImageItem {...defaultProps} fitMode='fitWidth' isActive={true} />);

      // fitMode가 변경되면 재호출되어야 함
      rerender(<VerticalImageItem {...defaultProps} fitMode='fitHeight' isActive={true} />);

      expect(useSmartImageFit).toHaveBeenCalledTimes(2);
    });

    it('뷰포트 리사이즈 감지가 활성화되어야 함', () => {
      const { useSmartImageFit } = require('../../../src/features/gallery/hooks/useSmartImageFit');
      useSmartImageFit.mockReturnValue({
        imageStyle: {},
        isApplied: false,
        calculatedSize: { width: 0, height: 0 },
      });

      render(<VerticalImageItem {...defaultProps} fitMode='fitContainer' />);

      expect(useSmartImageFit).toHaveBeenCalledWith(
        expect.objectContaining({
          watchViewportResize: true,
        })
      );
    });

    it('메모이제이션으로 불필요한 재렌더링이 방지되어야 함', () => {
      const { useSmartImageFit } = require('../../../src/features/gallery/hooks/useSmartImageFit');
      const mockReturn = {
        imageStyle: { width: '800px' },
        isApplied: true,
        calculatedSize: { width: 800, height: 600 },
      };
      useSmartImageFit.mockReturnValue(mockReturn);

      const { rerender } = render(<VerticalImageItem {...defaultProps} fitMode='fitWidth' />);

      // 동일한 props로 재렌더링 시 훅 호출 횟수가 증가하지 않아야 함
      rerender(<VerticalImageItem {...defaultProps} fitMode='fitWidth' />);

      expect(useSmartImageFit).toHaveBeenCalledTimes(1);
    });

    it('에러 상태에서도 안정적으로 동작해야 함', () => {
      const { useSmartImageFit } = require('../../../src/features/gallery/hooks/useSmartImageFit');
      useSmartImageFit.mockImplementation(() => {
        throw new Error('Smart fit calculation failed');
      });

      // 에러가 발생해도 컴포넌트가 크래시되지 않아야 함
      expect(() => {
        render(<VerticalImageItem {...defaultProps} fitMode='fitContainer' />);
      }).not.toThrow();
    });
  });

  describe('INTEGRATION: 기존 기능과의 호환성', () => {
    it('다운로드 기능은 영향받지 않아야 함', () => {
      const { useSmartImageFit } = require('../../../src/features/gallery/hooks/useSmartImageFit');
      useSmartImageFit.mockReturnValue({
        imageStyle: {},
        isApplied: false,
        calculatedSize: { width: 0, height: 0 },
      });

      const onDownload = vi.fn();
      render(<VerticalImageItem {...defaultProps} onDownload={onDownload} fitMode='fitWidth' />);

      const downloadButton = screen.getByRole('button');
      downloadButton.click();

      expect(onDownload).toHaveBeenCalled();
    });

    it('컨텍스트 메뉴는 영향받지 않아야 함', () => {
      const { useSmartImageFit } = require('../../../src/features/gallery/hooks/useSmartImageFit');
      useSmartImageFit.mockReturnValue({
        imageStyle: {},
        isApplied: false,
        calculatedSize: { width: 0, height: 0 },
      });

      const onImageContextMenu = vi.fn();
      render(
        <VerticalImageItem
          {...defaultProps}
          onImageContextMenu={onImageContextMenu}
          fitMode='fitContainer'
        />
      );

      const img = screen.getByRole('img');
      img.dispatchEvent(new MouseEvent('contextmenu'));

      expect(onImageContextMenu).toHaveBeenCalled();
    });

    it('lazy loading은 영향받지 않아야 함', () => {
      const { useSmartImageFit } = require('../../../src/features/gallery/hooks/useSmartImageFit');
      useSmartImageFit.mockReturnValue({
        imageStyle: {},
        isApplied: false,
        calculatedSize: { width: 0, height: 0 },
      });

      // forceVisible이 false일 때는 이미지가 렌더링되지 않아야 함
      render(<VerticalImageItem {...defaultProps} forceVisible={false} fitMode='fitWidth' />);

      expect(screen.queryByRole('img')).toBeNull();
    });

    it('접근성 속성들은 유지되어야 함', () => {
      const { useSmartImageFit } = require('../../../src/features/gallery/hooks/useSmartImageFit');
      useSmartImageFit.mockReturnValue({
        imageStyle: {},
        isApplied: false,
        calculatedSize: { width: 0, height: 0 },
      });

      render(
        <VerticalImageItem
          {...defaultProps}
          fitMode='fitHeight'
          aria-label='Test image'
          data-testid='test-image'
        />
      );

      const container = screen.getByTestId('test-image');
      expect(container).toHaveAttribute('aria-label', 'Test image');
    });
  });
});
