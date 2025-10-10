/**
 * P3: data-* to aria-* Attribute Migration Test
 * @description data-role="toolbar" → aria-label, data-state → aria-pressed 등 마이그레이션 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, h } from '../../../../utils/testing-library';
import { Button } from '@shared/components/ui/Button/Button';

describe('P3: ARIA Attributes Migration', () => {
  beforeEach(() => {
    // DOM 초기화
    if (typeof document !== 'undefined') {
      document.body.innerHTML = '';
    }
  });

  afterEach(() => {
    cleanup();
  });

  describe('Toolbar ARIA Migration', () => {
    it('버튼이 aria-pressed를 사용해야 함 (토글 상태)', () => {
      render(
        h(
          Button,
          {
            'aria-pressed': 'true',
            'aria-label': 'Fit to Width',
            'data-testid': 'fit-width-button',
          },
          'Fit'
        )
      );

      const button = screen.getByTestId('fit-width-button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(button).toHaveAttribute('aria-label', 'Fit to Width');
    });

    it('버튼이 aria-expanded를 사용해야 함 (드롭다운)', () => {
      render(
        h(
          Button,
          {
            'aria-expanded': 'false',
            'aria-haspopup': 'menu',
            'aria-label': 'Download Options',
            'data-testid': 'download-menu-button',
          },
          'Download'
        )
      );

      const button = screen.getByTestId('download-menu-button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
    });
  });

  describe('Settings Modal ARIA Migration', () => {
    it('폼 버튼들은 적절한 ARIA 속성을 가져야 함', () => {
      render(
        h(
          Button,
          {
            type: 'submit',
            'aria-describedby': 'form-help',
            'aria-label': 'Save Settings',
            'data-testid': 'save-button',
          },
          'Save'
        )
      );

      const button = screen.getByTestId('save-button');
      expect(button).toHaveAttribute('aria-describedby', 'form-help');
      expect(button).toHaveAttribute('aria-label', 'Save Settings');
    });
  });

  describe('State Management ARIA Integration', () => {
    it('버튼 상태가 aria 속성과 일치해야 함', () => {
      // 비활성 상태 버튼
      render(
        h(
          Button,
          {
            disabled: true,
            'aria-label': 'Download All',
            'data-testid': 'disabled-download-button',
          },
          'Download'
        )
      );

      const disabledButton = screen.getByTestId('disabled-download-button');
      expect(disabledButton).toBeDisabled();
      expect(disabledButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('로딩 상태 버튼은 aria-busy를 사용해야 함', () => {
      render(
        h(
          Button,
          {
            loading: true,
            'aria-label': 'Processing Download',
            'aria-busy': 'true',
            'data-testid': 'loading-button',
          },
          'Processing...'
        )
      );

      const loadingButton = screen.getByTestId('loading-button');
      expect(loadingButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Accessibility Compliance', () => {
    it('모든 interactive 요소는 접근 가능한 이름을 가져야 함', () => {
      const buttons = [
        { label: 'Download', testId: 'download-btn' },
        { label: 'Settings', testId: 'settings-btn' },
        { label: 'Close', testId: 'close-btn' },
      ];

      buttons.forEach(({ label, testId }) => {
        render(
          h(
            Button,
            {
              'aria-label': label,
              'data-testid': testId,
            },
            label
          )
        );

        const button = screen.getByTestId(testId);
        expect(button).toHaveAccessibleName(label);
        cleanup(); // 각 버튼 렌더링 후 정리
      });
    });

    it('버튼이 tabindex를 올바르게 설정해야 함', () => {
      render(
        h(
          Button,
          {
            tabIndex: 0,
            'aria-label': 'Primary Action',
            'data-testid': 'primary-button',
          },
          'Primary'
        )
      );

      const button = screen.getByTestId('primary-button');
      expect(button).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Legacy Data Attributes Removal', () => {
    it('data-role 속성이 제거되어야 함', () => {
      render(
        h(
          Button,
          {
            'aria-label': 'Test Button',
            'data-testid': 'clean-button',
          },
          'Test'
        )
      );

      const button = screen.getByTestId('clean-button');
      expect(button).not.toHaveAttribute('data-role');
      expect(button).not.toHaveAttribute('data-state');
      expect(button).not.toHaveAttribute('data-active');
    });
  });
});
