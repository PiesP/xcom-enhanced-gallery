import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, fireEvent } from '@testing-library/preact';
import * as preactModule from 'preact';

// vendors.getPreact 패치 (Toolbar 내부가 getPreact 사용)
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
    getPreactHooks: () => hooks,
  };
});

// 아이콘 서비스 모킹 (불필요한 실제 아이콘 로딩 방지)
vi.mock('@/shared/services/icon-service', () => {
  return {
    getIcon: vi.fn().mockImplementation((name: string) => {
      const createElement = preactModule.createElement || (preactModule as any).h;
      return ({ size = 20, className = '', ...props }: any) =>
        createElement('svg', {
          width: size,
          height: size,
          className: `lucide-icon lucide-${name} ${className}`,
          'data-testid': `icon-${name}`,
          ...props,
        });
    }),
  };
});

// 무거운 상태 훅 및 스타일 시스템 모킹 (메모리 사용량 절감)
vi.mock('@shared/hooks/useToolbarState', () => ({
  useToolbarState: () => [
    { currentFitMode: 'original', needsHighContrast: false, isDownloading: false },
    { setCurrentFitMode: () => {}, setNeedsHighContrast: () => {}, setDownloading: () => {} },
  ],
  getToolbarDataState: () => 'idle',
  getToolbarClassName: () => '',
}));

vi.mock('@shared/styles/unified-dark-mode-style-system', () => ({
  UnifiedDarkModeStyleSystem: { getInstance: () => ({}) },
}));

// CSS 모듈 경량 모킹
vi.mock('@/shared/components/ui/Toolbar/Toolbar.module.css', () => ({
  default: new Proxy(
    {},
    {
      get: (_, prop: string) => prop,
    }
  ),
}));

describe('Toolbar Reload Button TDD - RED Phase', () => {
  const baseProps = {
    currentIndex: 0,
    totalCount: 5,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onDownloadCurrent: vi.fn(),
    onDownloadAll: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('onReload 미제공 시 reload 버튼이 렌더되지 않는다', async () => {
    const { Toolbar } = await import('@/shared/components/ui/Toolbar/Toolbar');
    const { queryByTestId } = render(<Toolbar {...(baseProps as any)} />);
    await waitFor(() => {
      // 다른 필수 버튼이 렌더된 뒤 검사 (예: 닫기 버튼 존재 확인)
      expect(document.querySelector('[data-testid="close"]')).toBeInTheDocument();
    });
    expect(queryByTestId('toolbar-reload-button')).toBeNull();
  });

  it('onReload 제공 시 reload 버튼이 렌더된다', async () => {
    const { Toolbar } = await import('@/shared/components/ui/Toolbar/Toolbar');
    const onReload = vi.fn();
    const { getByTestId } = render(<Toolbar {...(baseProps as any)} {...({ onReload } as any)} />);

    await waitFor(() => {
      expect(getByTestId('toolbar-reload-button')).toBeInTheDocument();
    });
    const btn = getByTestId('toolbar-reload-button');
    expect(btn).toHaveAttribute('aria-label', '미디어 다시 불러오기');
  });

  it('reload 버튼 클릭 시 onReload 호출된다', async () => {
    const { Toolbar } = await import('@/shared/components/ui/Toolbar/Toolbar');
    const onReload = vi.fn();
    const { getByTestId } = render(<Toolbar {...(baseProps as any)} {...({ onReload } as any)} />);
    const btn = await waitFor(() => getByTestId('toolbar-reload-button'));
    fireEvent.click(btn);
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it('isReloading=true 일 때 버튼은 disabled + aria-busy 적용', async () => {
    const { Toolbar } = await import('@/shared/components/ui/Toolbar/Toolbar');
    const onReload = vi.fn();
    const { getByTestId, rerender } = render(
      <Toolbar {...(baseProps as any)} {...({ onReload, isReloading: false } as any)} />
    );
    await waitFor(() => {
      expect(getByTestId('toolbar-reload-button')).toBeInTheDocument();
    });

    // 로딩 상태로 갱신
    rerender(<Toolbar {...(baseProps as any)} {...({ onReload, isReloading: true } as any)} />);
    const btn = getByTestId('toolbar-reload-button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    // 기본 Button 컴포넌트는 loading=true 시 내부에 spinner span을 렌더한다
    const spinner = btn.querySelector('span');
    expect(spinner).not.toBeNull();
  });

  it('canReload=false 일 때 버튼은 disabled', async () => {
    const { Toolbar } = await import('@/shared/components/ui/Toolbar/Toolbar');
    const onReload = vi.fn();
    const { getByTestId } = render(
      <Toolbar {...(baseProps as any)} {...({ onReload, canReload: false } as any)} />
    );
    await waitFor(() => {
      expect(getByTestId('toolbar-reload-button')).toBeInTheDocument();
    });
    const btn = getByTestId('toolbar-reload-button');
    expect(btn).toBeDisabled();
  });

  it('reload 그룹은 role="group" 및 aria-label="데이터 동기화"를 가진다', async () => {
    const { Toolbar } = await import('@/shared/components/ui/Toolbar/Toolbar');
    const onReload = vi.fn();
    const { getByTestId } = render(<Toolbar {...(baseProps as any)} {...({ onReload } as any)} />);
    await waitFor(() => {
      expect(getByTestId('toolbar-reload-button')).toBeInTheDocument();
    });
    // 그룹 탐색 (버튼의 closest)
    const btn = getByTestId('toolbar-reload-button');
    const group = btn.closest('[role="group"]');
    expect(group).not.toBeNull();
    expect(group).toHaveAttribute('aria-label', '데이터 동기화');
  });
});
