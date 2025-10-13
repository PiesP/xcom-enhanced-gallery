/**
 * @fileoverview Toolbar 설정 패널 내부 select 드롭다운 클릭 테스트 (Phase 48.6)
 * @description select 요소의 드롭다운 옵션 클릭 시에도 패널이 유지되어야 함
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@test/utils/testing-library';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import { setSettingsExpanded } from '@shared/state/signals/toolbar.signals';

describe('Toolbar - 설정 패널 select 드롭다운 클릭 안정성 (Phase 48.6)', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    // 기본 상태로 초기화
    setSettingsExpanded(false);
  });

  afterEach(() => {
    cleanup();
  });

  const mockProps = {
    currentIndex: 0,
    totalCount: 5,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onClose: vi.fn(),
    onDownloadCurrent: vi.fn(),
    onDownloadAll: vi.fn(),
    onOpenSettings: vi.fn(), // 설정 버튼 렌더링을 위해 필요
  };

  test('설정 패널이 열린 상태에서 theme select를 클릭해도 패널이 유지되어야 함', () => {
    render(() => <Toolbar {...mockProps} />);

    // 1. 설정 버튼 클릭하여 패널 열기
    const settingsButton = screen.getByRole('button', { name: /설정/i });
    fireEvent.click(settingsButton);

    // 2. 패널이 열렸는지 확인
    const themeSelect = screen.getByTestId('settings-controls-theme');
    expect(themeSelect).toBeInTheDocument();

    // 3. theme select 요소를 클릭 (실제 사용자는 드롭다운을 열기 위해 select를 클릭)
    fireEvent.mouseDown(themeSelect);

    // 4. 패널이 여전히 열려있어야 함
    expect(themeSelect).toBeInTheDocument();
  });

  test('설정 패널이 열린 상태에서 language select를 클릭해도 패널이 유지되어야 함', () => {
    render(() => <Toolbar {...mockProps} />);

    // 1. 설정 버튼 클릭하여 패널 열기
    const settingsButton = screen.getByRole('button', { name: /설정/i });
    fireEvent.click(settingsButton);

    // 2. 패널이 열렸는지 확인
    const languageSelect = screen.getByTestId('settings-controls-language');
    expect(languageSelect).toBeInTheDocument();

    // 3. language select 요소를 클릭
    fireEvent.mouseDown(languageSelect);

    // 4. 패널이 여전히 열려있어야 함
    expect(languageSelect).toBeInTheDocument();
  });

  test('설정 패널이 열린 상태에서 select option을 선택해도 패널이 유지되어야 함', () => {
    render(() => <Toolbar {...mockProps} />);

    // 1. 설정 버튼 클릭하여 패널 열기
    const settingsButton = screen.getByRole('button', { name: /설정/i });
    fireEvent.click(settingsButton);

    // 2. 패널이 열렸는지 확인
    const themeSelect = screen.getByTestId('settings-controls-theme');
    expect(themeSelect).toBeInTheDocument();

    // 3. select 값 변경 (사용자가 옵션을 선택)
    fireEvent.change(themeSelect, { target: { value: 'dark' } });

    // 4. 패널이 여전히 열려있어야 함
    expect(themeSelect).toBeInTheDocument();
  });

  test('설정 패널이 열린 상태에서 select의 label을 클릭해도 패널이 유지되어야 함', () => {
    render(() => <Toolbar {...mockProps} />);

    // 1. 설정 버튼 클릭하여 패널 열기
    const settingsButton = screen.getByRole('button', { name: /설정/i });
    fireEvent.click(settingsButton);

    // 2. 패널이 열렸는지 확인
    const settingsPanel = screen.getByTestId('settings-controls');
    expect(settingsPanel).toBeInTheDocument();

    // 3. label을 클릭 (compact 모드가 아닐 때)
    // compact 모드에서는 label이 없으므로, settingsPanel 내부의 다른 요소를 클릭
    const settingDiv = settingsPanel.querySelector('.xeg-setting');
    if (settingDiv) {
      fireEvent.mouseDown(settingDiv);
    }

    // 4. 패널이 여전히 열려있어야 함
    expect(settingsPanel).toBeInTheDocument();
  });

  test('설정 패널 외부를 클릭하면 패널이 닫혀야 함 (기존 기능 유지)', () => {
    render(() => <Toolbar {...mockProps} />);

    // 1. 설정 버튼 클릭하여 패널 열기
    const settingsButton = screen.getByRole('button', { name: /설정/i });
    fireEvent.click(settingsButton);

    // 2. 패널이 열렸는지 확인
    const themeSelect = screen.getByTestId('settings-controls-theme');
    expect(themeSelect).toBeInTheDocument();

    // 3. 외부 (document.body) 클릭
    fireEvent.mouseDown(document.body);

    // 4. 패널이 닫혀야 함
    expect(screen.queryByTestId('settings-controls-theme')).not.toBeInTheDocument();
  });
});
