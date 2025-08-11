/**
 * TDD Step 3: 설정 모달 아이콘 통합 테스트 (RED)
 *
 * 목표:
 * 1. 닫기 버튼에 X 아이콘이 표시된다
 * 2. 토큰 헬퍼 버튼들에 적절한 아이콘이 표시된다 (추후)
 * 3. 저장/초기화 버튼에 아이콘이 표시된다 (추후)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/preact';
import { SettingsOverlay } from '@/features/settings/components/SettingsOverlay';

// vendors.getPreact를 패치하여 h 함수를 제공
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

// Mock settings-menu module
vi.mock('@/features/settings/settings-menu', () => ({
  wireSettingsModal: vi.fn(),
}));

describe('SettingsOverlay Icon Integration TDD - RED Phase', () => {
  let h: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const preact = await vi.importActual<any>('preact');
    h = preact.createElement || preact.h;
  });

  describe('닫기 버튼 아이콘', () => {
    it('should render close button with X icon', async () => {
      // Given: 설정 모달이 렌더링된다
      const onClose = vi.fn();
      const { getByTestId, getByRole } = render(h(SettingsOverlay, { onClose }));

      // When: 모달이 표시되고 아이콘이 로딩된다
      await waitFor(() => {
        expect(getByTestId('xeg-settings-modal')).toBeInTheDocument();
      });

      // Then: 닫기 버튼에 X 아이콘이 표시된다
      const closeButton = getByRole('button', { name: /닫기/i });
      expect(closeButton).toBeInTheDocument();

      // 아이콘이 로딩될 때까지 기다린다
      await waitFor(() => {
        expect(getByTestId('icon-x')).toBeInTheDocument();
      });
    });

    it('should close modal when close button with icon is clicked', async () => {
      // Given: 닫기 콜백이 있는 설정 모달
      const onClose = vi.fn();
      const { getByTestId, getByRole } = render(h(SettingsOverlay, { onClose }));

      // When: 닫기 버튼을 클릭한다
      const closeButton = getByRole('button', { name: /닫기/i });
      closeButton.click();

      // Then: 모달이 닫힌다
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('설정 섹션 구조', () => {
    it('should render settings modal with all sections', async () => {
      // Given: 설정 모달이 렌더링된다
      const { getByText, getByTestId } = render(h(SettingsOverlay, { onClose: vi.fn() }));

      // Then: 모든 설정 섹션이 표시된다
      expect(getByText('XEG 설정')).toBeInTheDocument();
      expect(getByText('다운로드 설정')).toBeInTheDocument();
      expect(getByText('갤러리 설정')).toBeInTheDocument();

      // 주요 설정 컨트롤들이 존재한다
      expect(getByTestId('filename-pattern')).toBeInTheDocument();
      expect(getByTestId('custom-template')).toBeInTheDocument();
      expect(getByTestId('token-helpers')).toBeInTheDocument();
    });
  });

  describe('토큰 헬퍼 버튼들 (향후 아이콘 적용 예정)', () => {
    it('should render token helper buttons', async () => {
      // Given: 설정 모달이 렌더링된다
      const { getByTestId, getByText } = render(h(SettingsOverlay, { onClose: vi.fn() }));

      // Then: 토큰 헬퍼 버튼들이 표시된다
      const tokenHelpers = getByTestId('token-helpers');
      expect(tokenHelpers).toBeInTheDocument();

      expect(getByText('유저명')).toBeInTheDocument();
      expect(getByText('트윗ID')).toBeInTheDocument();
      expect(getByText('인덱스')).toBeInTheDocument();
      expect(getByText('확장자')).toBeInTheDocument();
    });
  });
});
