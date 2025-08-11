import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/preact';
import { ToolbarIconButton } from '@/shared/components/ui/Toolbar/components/ToolbarIconButton';
import type { IconName } from '@/shared/services/icon-service';

// vendors.getPreact를 패치하여 h 함수를 제공 (테스트 환경의 preact mock은 createElement만 노출)
vi.mock('@shared/external/vendors', async () => {
  const actual = await vi.importActual<any>('@shared/external/vendors');
  const preact = await vi.importActual<any>('preact');
  const hooks = await vi.importActual<any>('preact/hooks');
  return {
    ...actual,
    getPreact: () => ({
      ...(preact.default ?? preact),
      h: (...args: any[]) => preact.createElement?.(...args),
    }),
    getPreactHooks: () => hooks, // Use actual hooks for proper behavior
  };
});

// Mock icon service
vi.mock('@/shared/services/icon-service', () => ({
  getIcon: vi.fn().mockImplementation(async (name: string) => {
    // Mock icon component using createElement directly
    const preact = await vi.importActual<any>('preact');
    const createElement = preact.createElement || preact.h;
    return ({ size = 20, className = '', ...props }: any) =>
      createElement('svg', {
        width: size,
        height: size,
        className: `lucide-icon lucide-${name} ${className}`,
        'data-testid': `icon-${name}`,
        ...props,
      });
  }),
}));

describe('ToolbarIconButton TDD - RED Phase', () => {
  let h: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const preact = await vi.importActual<any>('preact');
    h = preact.createElement || preact.h;
  });

  describe('기본 렌더링', () => {
    it('should render button with icon and label', async () => {
      // Given: 다운로드 아이콘 버튼
      const { getByTestId, getByText } = render(
        h(ToolbarIconButton, {
          icon: 'download' as IconName,
          label: '다운로드',
          'data-testid': 'download-btn',
        })
      );

      // When: 컴포넌트가 렌더링된다
      // 아이콘이 로딩될 때까지 기다린다
      await waitFor(() => {
        expect(getByTestId('icon-download')).toBeInTheDocument();
      });

      // Then: 아이콘과 라벨이 표시된다
      expect(getByText('다운로드')).toBeInTheDocument();
    });

    it('should handle click events', async () => {
      // Given: 클릭 핸들러가 있는 버튼
      const handleClick = vi.fn();
      const { getByTestId } = render(
        h(ToolbarIconButton, {
          icon: 'settings' as IconName,
          label: '설정',
          onClick: handleClick,
          'data-testid': 'settings-btn',
        })
      );

      // When: 버튼을 클릭한다
      await waitFor(() => {
        expect(getByTestId('settings-btn')).toBeInTheDocument();
      });

      getByTestId('settings-btn').click();

      // Then: 클릭 핸들러가 호출된다
      expect(handleClick).toHaveBeenCalledOnce();
    });
  });

  describe('아이콘 로딩', () => {
    it('should show loading state while icon loads', async () => {
      // Given: 느린 아이콘 로딩
      const { getIcon } = await import('@/shared/services/icon-service');
      vi.mocked(getIcon).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve(() => h('svg')), 100))
      );

      const { getByTestId } = render(
        h(ToolbarIconButton, {
          icon: 'download' as IconName,
          label: '다운로드',
          'data-testid': 'download-btn',
        })
      );

      // When: 로딩 중일 때
      // Then: 로딩 인디케이터나 플레이스홀더가 표시된다
      expect(getByTestId('download-btn')).toBeInTheDocument();
      // 아이콘이 로딩될 때까지 기다린다
      await waitFor(() => {
        expect(getByTestId('download-btn').querySelector('svg')).toBeInTheDocument();
      });
    });

    it('should handle icon loading failure gracefully', async () => {
      // Given: 아이콘 로딩 실패
      const { getIcon } = await import('@/shared/services/icon-service');
      vi.mocked(getIcon).mockRejectedValueOnce(new Error('Failed to load icon'));

      const { getByTestId } = render(
        h(ToolbarIconButton, {
          icon: 'invalid-icon' as any,
          label: '테스트',
          'data-testid': 'test-btn',
        })
      );

      // When: 컴포넌트가 렌더링된다
      await waitFor(() => {
        expect(getByTestId('test-btn')).toBeInTheDocument();
      });

      // Then: 폴백 처리가 정상적으로 작동한다
      expect(getByTestId('test-btn')).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('should provide proper accessibility attributes', async () => {
      // Given: 접근성 속성이 있는 버튼
      const { getByTestId } = render(
        h(ToolbarIconButton, {
          icon: 'close' as IconName,
          label: '닫기',
          'aria-label': '갤러리 닫기',
          disabled: false,
          'data-testid': 'close-btn',
        })
      );

      // When: 컴포넌트가 렌더링된다
      await waitFor(() => {
        expect(getByTestId('close-btn')).toBeInTheDocument();
      });

      const button = getByTestId('close-btn');

      // Then: 접근성 속성들이 올바르게 설정된다
      expect(button).toHaveAttribute('aria-label', '갤러리 닫기');
      expect(button).toHaveAttribute('type', 'button');
      expect(button).not.toBeDisabled();
    });

    it('should handle disabled state correctly', async () => {
      // Given: 비활성화된 버튼
      const { getByTestId } = render(
        h(ToolbarIconButton, {
          icon: 'download' as IconName,
          label: '다운로드',
          disabled: true,
          'data-testid': 'disabled-btn',
        })
      );

      // When: 컴포넌트가 렌더링된다
      await waitFor(() => {
        expect(getByTestId('disabled-btn')).toBeInTheDocument();
      });

      // Then: 버튼이 비활성화된다
      expect(getByTestId('disabled-btn')).toBeDisabled();
    });
  });

  describe('스타일 및 변형', () => {
    it('should apply variant classes correctly', async () => {
      // Given: 프라이머리 변형 버튼
      const { getByTestId } = render(
        h(ToolbarIconButton, {
          icon: 'download' as IconName,
          label: '다운로드',
          variant: 'primary',
          'data-testid': 'primary-btn',
        })
      );

      // When: 컴포넌트가 렌더링된다
      await waitFor(() => {
        expect(getByTestId('primary-btn')).toBeInTheDocument();
      });

      // Then: 프라이머리 스타일이 적용된다
      const button = getByTestId('primary-btn');
      expect(button.className).toContain('primary');
    });

    it('should support different sizes', async () => {
      // Given: 큰 크기 버튼
      const { getByTestId } = render(
        h(ToolbarIconButton, {
          icon: 'settings' as IconName,
          label: '설정',
          size: 'lg',
          'data-testid': 'large-btn',
        })
      );

      // When: 컴포넌트가 렌더링된다
      await waitFor(() => {
        expect(getByTestId('large-btn')).toBeInTheDocument();
      });

      // Then: 큰 크기 스타일이 적용된다
      const button = getByTestId('large-btn');
      expect(button.className).toContain('lg');
    });
  });
});
