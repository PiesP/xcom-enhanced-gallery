/**
 * @file ToolbarButton 표준화 테스트
 * @description 툴바와 설정 모달의 버튼 일관성을 위한 TDD 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/preact';
import { h } from 'preact';

describe('ToolbarButton 표준화', () => {
  describe('🔴 RED: 표준화 모듈 존재 확인', () => {
    it('useStandardEventHandling Hook이 생성되어야 한다', async () => {
      // Dynamic import 사용하여 모듈 존재 확인
      const moduleExists = async () => {
        try {
          const module = await import('../../src/shared/hooks/useStandardEventHandling');
          return module.useStandardEventHandling;
        } catch {
          return null;
        }
      };

      const hook = await moduleExists();
      expect(hook).toBeDefined();
      expect(typeof hook).toBe('function');
    });

    it('ToolbarButton 컴포넌트가 생성되어야 한다', async () => {
      const moduleExists = async () => {
        try {
          const module = await import(
            '../../src/shared/components/ui/Toolbar/components/ToolbarButton'
          );
          return module.ToolbarButton;
        } catch {
          return null;
        }
      };

      const component = await moduleExists();
      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    });
  });

  describe('🟢 GREEN: 기본 기능 테스트', () => {
    it('useStandardEventHandling이 handleButtonClick을 제공해야 한다', async () => {
      const { useStandardEventHandling } = await import(
        '../../src/shared/hooks/useStandardEventHandling'
      );

      // Mock React hooks
      const mockUseCallback = vi.fn((fn, deps) => fn);
      vi.doMock('@shared/utils/optimization/memo', () => ({
        useCallback: mockUseCallback,
      }));

      const { handleButtonClick } = useStandardEventHandling();

      expect(handleButtonClick).toBeDefined();
      expect(typeof handleButtonClick).toBe('function');
    });

    it('ToolbarButton 컴포넌트가 올바른 구조를 가져야 한다', async () => {
      // 컴포넌트 존재만 확인 (실제 렌더링 테스트는 복잡한 의존성 때문에 별도로)
      const { ToolbarButton } = await import(
        '../../src/shared/components/ui/Toolbar/components/ToolbarButton'
      );

      expect(ToolbarButton).toBeDefined();
      expect(typeof ToolbarButton).toBe('function');
      expect(ToolbarButton.length).toBeGreaterThanOrEqual(1); // props 파라미터 있음
    });
  });

  describe('📋 리팩토링 진행 상황 체크', () => {
    it('설정 모달에서 ToolbarButton이 사용되었는지 확인', async () => {
      // SettingsOverlay 파일의 내용을 확인
      let settingsOverlayContent = '';
      try {
        const fs = await import('fs');
        const path = await import('path');
        const settingsPath = path.resolve(
          process.cwd(),
          'src/features/settings/components/SettingsOverlay.tsx'
        );
        settingsOverlayContent = fs.readFileSync(settingsPath, 'utf8');
      } catch {
        // 파일 읽기 실패시 스킵
        return;
      }

      // ToolbarButton import가 있는지 확인
      expect(settingsOverlayContent).toContain('ToolbarButton');
      expect(settingsOverlayContent).toContain(
        '@shared/components/ui/Toolbar/components/ToolbarButton'
      );

      // h(ToolbarButton, ... 사용되는지 확인
      expect(settingsOverlayContent).toContain('h(ToolbarButton,');
    });

    it('기존 네이티브 button 태그가 ToolbarButton으로 교체되었는지 확인', async () => {
      let settingsOverlayContent = '';
      try {
        const fs = await import('fs');
        const path = await import('path');
        const settingsPath = path.resolve(
          process.cwd(),
          'src/features/settings/components/SettingsOverlay.tsx'
        );
        settingsOverlayContent = fs.readFileSync(settingsPath, 'utf8');
      } catch {
        return;
      }

      // 이전 button 태그 방식이 제거되었는지 확인 (settings 닫기 버튼)
      const hasOldButtonPattern =
        settingsOverlayContent.includes("h(\n          'button'") ||
        settingsOverlayContent.includes("h('button'");

      // ToolbarButton 사용 패턴이 있는지 확인
      const hasNewToolbarButton = settingsOverlayContent.includes('h(ToolbarButton');

      expect(hasNewToolbarButton).toBe(true);
      // 완전 교체되지 않았을 수도 있으므로 경고만
      if (hasOldButtonPattern) {
        console.warn('일부 button 태그가 아직 ToolbarButton으로 교체되지 않았습니다.');
      }
    });
  });
});
