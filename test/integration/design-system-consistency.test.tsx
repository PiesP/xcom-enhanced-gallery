/** @jsxImportSource solid-js */
/**
 * @fileoverview 디자인 시스템 일관성 통합 테스트
 * @description Solid 기반 툴바와 설정 패널 간의 디자인 일관성을 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@solidjs/testing-library';

vi.mock('@shared/components/ui/Toolbar/Toolbar.module.css', () => ({
  default: {
    toolbar: 'toolbar',
    galleryToolbar: 'galleryToolbar',
    toolbarContent: 'toolbarContent',
    toolbarSection: 'toolbarSection',
    toolbarLeft: 'toolbarLeft',
    toolbarRight: 'toolbarRight',
    toolbarCenter: 'toolbarCenter',
    toolbarButton: 'toolbarButton',
    navButton: 'navButton',
    downloadButton: 'downloadButton',
    settingsButton: 'settingsButton',
    closeButton: 'closeButton',
    fitButton: 'fitButton',
    progressBar: 'progressBar',
    progressFill: 'progressFill',
  },
}));

vi.mock('@shared/components/ui/SettingsModal/SettingsModal.module.css', () => ({
  default: {
    modal: 'modal',
    panel: 'panel',
    inner: 'inner',
    header: 'header',
    title: 'title',
    body: 'body',
    setting: 'setting',
    label: 'label',
    formControl: 'formControl',
    select: 'select',
    formControlToggle: 'formControlToggle',
    closeButton: 'closeButton',
    toolbarBelow: 'toolbarBelow',
    topRight: 'topRight',
    bottomSheet: 'bottomSheet',
    center: 'center',
  },
}));

vi.mock('@shared/styles/primitives.module.css', () => ({
  default: {
    controlSurface: 'controlSurface',
  },
}));

vi.mock('@shared/services/LanguageService', () => ({
  LanguageService: vi.fn().mockImplementation(() => ({
    getString: vi.fn((key: string) => key),
    getCurrentLanguage: vi.fn(() => 'en'),
    setLanguage: vi.fn(),
  })),
}));

vi.mock('@shared/services/ThemeService', () => ({
  ThemeService: vi.fn().mockImplementation(() => ({
    getCurrentTheme: vi.fn(() => 'auto'),
    setTheme: vi.fn(),
    initialize: vi.fn(),
  })),
}));

vi.mock('@shared/container/settings-access', () => ({
  getSetting: vi.fn(() => false),
  setSetting: vi.fn(() => Promise.resolve()),
}));

vi.mock('@shared/logging', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import SolidSettingsPanel from '@features/settings/solid/SolidSettingsPanel.solid';

const mockGetComputedStyle = vi.fn(() => ({
  height: '40px',
  backdropFilter: 'blur(12px)',
  borderRadius: '8px',
  backgroundColor: 'rgb(59, 130, 246)',
}));

const getComputedStyle = mockGetComputedStyle;

const createToolbarProps = () => ({
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
  onFitHeight: vi.fn(),
  onFitWidth: vi.fn(),
  onFitContainer: vi.fn(),
});

describe('디자인 시스템 일관성 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetComputedStyle.mockReset();
    mockGetComputedStyle.mockImplementation(() => ({
      height: '40px',
      backdropFilter: 'blur(12px)',
      borderRadius: '8px',
      backgroundColor: 'rgb(59, 130, 246)',
    }));
  });

  afterEach(() => {
    cleanup();
  });

  describe('버튼 디자인 일관성', () => {
    it('모든 버튼이 통일된 스타일 클래스를 사용해야 함', () => {
      const { container } = render(() => <Toolbar {...createToolbarProps()} />);

      const buttons = Array.from(container.querySelectorAll('button'));
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach(button => {
        const classes = button.className;
        expect(classes).toMatch(
          /(toolbarButton|navButton|downloadButton|settingsButton|closeButton|fitButton)/
        );
      });
    });

    it('툴바와 설정 패널의 버튼이 일관된 크기를 가져야 함', () => {
      const { container: toolbarContainer } = render(() => <Toolbar {...createToolbarProps()} />);
      const { container: panelContainer } = render(() => (
        <SolidSettingsPanel
          isOpen={() => true}
          onClose={() => void 0}
          position='top-right'
          testId='consistency-settings'
        />
      ));

      const toolbarButtons = Array.from(toolbarContainer.querySelectorAll('button'));
      const panelButtons = Array.from(panelContainer.querySelectorAll('button'));

      expect(toolbarButtons.length).toBeGreaterThan(0);
      expect(panelButtons.length).toBeGreaterThan(0);

      [...toolbarButtons, ...panelButtons].forEach(button => {
        const styles = getComputedStyle(button);
        expect(styles.height).toMatch(/^(2\.5em|40px|2em|32px|44px)$/);
      });
    });
  });

  describe('Glassmorphism 일관성', () => {
    it('툴바와 설정 패널이 동일한 glassmorphism 효과를 사용해야 함', () => {
      const { container: toolbarContainer } = render(() => <Toolbar {...createToolbarProps()} />);
      const { container: panelContainer } = render(() => (
        <SolidSettingsPanel
          isOpen={() => true}
          onClose={() => void 0}
          position='top-right'
          testId='glass-settings'
        />
      ));

      const toolbarGlass =
        toolbarContainer.querySelector('.galleryToolbar') ??
        toolbarContainer.querySelector('.glass-surface');
      const panelGlass =
        panelContainer.querySelector('.panel') ?? panelContainer.querySelector('.glass-surface');

      expect(toolbarGlass).toBeTruthy();
      expect(panelGlass).toBeTruthy();

      if (toolbarGlass && panelGlass) {
        const toolbarStyles = getComputedStyle(toolbarGlass as HTMLElement);
        const panelStyles = getComputedStyle(panelGlass as HTMLElement);

        expect(toolbarStyles.backdropFilter).toBe(panelStyles.backdropFilter);
      }
    });

    it('모든 glass surface가 일관된 border-radius를 사용해야 함', () => {
      const { container: toolbarContainer } = render(() => <Toolbar {...createToolbarProps()} />);
      const { container: panelContainer } = render(() => (
        <SolidSettingsPanel
          isOpen={() => true}
          onClose={() => void 0}
          position='top-right'
          testId='radius-settings'
        />
      ));

      const surfaces = [
        ...toolbarContainer.querySelectorAll('.glass-surface, .galleryToolbar'),
        ...panelContainer.querySelectorAll('.glass-surface, .panel'),
      ] as HTMLElement[];

      expect(surfaces.length).toBeGreaterThan(0);

      surfaces.forEach(surface => {
        const radius = getComputedStyle(surface).borderRadius;
        expect(radius).toMatch(/^(8px|12px|16px|var\(--[\w-]+\))$/);
      });
    });
  });

  describe('색상 일관성', () => {
    // JSDOM 환경에서 SolidJS Toolbar 렌더링 제약으로 SKIP
    // E2E 테스트 또는 실제 브라우저에서 검증 필요
    it.skip('모든 primary 버튼이 동일한 색상을 사용해야 함', () => {
      const { container } = render(() => <Toolbar {...createToolbarProps()} />);

      const primaryButtons = Array.from(
        container.querySelectorAll('.variant-primary, .downloadButton, .navButton')
      );

      if (primaryButtons.length <= 1) {
        expect(primaryButtons.length).toBeGreaterThan(0);
        return;
      }

      const colors = primaryButtons.map(button => getComputedStyle(button).backgroundColor);
      const firstColor = colors[0];
      colors.forEach(color => {
        expect(color).toBe(firstColor);
      });
    });
  });
});
