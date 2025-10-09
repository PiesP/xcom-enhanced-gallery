/**
 * @file toolbar-with-settings-integration.red.test.ts
 * @description Phase 9.22 RED - ToolbarWithSettings와 ThemeService 통합 테스트
 *
 * 테스트 목표:
 * 1. 설정 모달에서 테마 변경 시 ThemeService.setTheme() 호출 확인
 * 2. 설정 모달에서 언어 변경 시 LanguageService.setLanguage() 호출 확인
 * 3. 현재 테마/언어가 설정 모달에 반영되는지 확인
 *
 * 예상 결과: 모든 테스트 FAIL (onChange 핸들러 미연결)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@solidjs/testing-library';
import { ToolbarWithSettings } from '@shared/components/ui/ToolbarWithSettings/ToolbarWithSettings';
import { themeService } from '@shared/services';
import type { ThemeSetting } from '@shared/services/ThemeService';

describe('[RED] Phase 9.22: ToolbarWithSettings - ThemeService 통합', () => {
  beforeEach(() => {
    // 각 테스트 전에 spy 초기화
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Solid.js 컴포넌트와 Portal을 올바르게 정리
    cleanup();
  });

  it('설정 모달에서 테마를 dark로 변경 시 ThemeService.setTheme("dark") 호출됨', async () => {
    const setThemeSpy = vi.spyOn(themeService, 'setTheme');

    render(() => (
      <ToolbarWithSettings
        currentIndex={0}
        totalCount={5}
        onPrevious={() => {}}
        onNext={() => {}}
        onDownloadCurrent={() => {}}
        onDownloadAll={() => {}}
        onClose={() => {}}
      />
    ));

    // 설정 버튼 클릭
    const settingsButton = screen.getByLabelText('설정 열기');
    fireEvent.click(settingsButton);

    // 테마 select 찾기
    const themeSelect = await screen.findByTestId('theme-select');
    expect(themeSelect).toBeInTheDocument();

    // 'dark' 선택
    fireEvent.change(themeSelect, { target: { value: 'dark' } });

    // ThemeService.setTheme('dark') 호출 확인
    await waitFor(
      () => {
        expect(setThemeSpy).toHaveBeenCalledWith('dark');
      },
      { timeout: 1000 }
    );
  });

  it('설정 모달에서 테마를 light로 변경 시 ThemeService.setTheme("light") 호출됨', async () => {
    const setThemeSpy = vi.spyOn(themeService, 'setTheme');

    render(() => (
      <ToolbarWithSettings
        currentIndex={0}
        totalCount={5}
        onPrevious={() => {}}
        onNext={() => {}}
        onDownloadCurrent={() => {}}
        onDownloadAll={() => {}}
        onClose={() => {}}
      />
    ));

    // 설정 버튼 클릭
    const settingsButton = screen.getByLabelText('설정 열기');
    fireEvent.click(settingsButton);

    // 테마 select 찾기
    const themeSelect = await screen.findByTestId('theme-select');

    // 'light' 선택
    fireEvent.change(themeSelect, { target: { value: 'light' } });

    // ThemeService.setTheme('light') 호출 확인
    await waitFor(() => {
      expect(setThemeSpy).toHaveBeenCalledWith('light');
    });
  });

  it('설정 모달에 현재 테마가 반영됨 (dark)', async () => {
    // ThemeService가 'dark' 반환하도록 모킹
    vi.spyOn(themeService, 'getCurrentTheme').mockReturnValue('dark' as ThemeSetting);

    render(() => (
      <ToolbarWithSettings
        currentIndex={0}
        totalCount={5}
        onPrevious={() => {}}
        onNext={() => {}}
        onDownloadCurrent={() => {}}
        onDownloadAll={() => {}}
        onClose={() => {}}
      />
    ));

    // 설정 버튼 클릭
    const settingsButton = screen.getByLabelText('설정 열기');
    fireEvent.click(settingsButton);

    // 테마 select 찾기
    const themeSelect = (await screen.findByTestId('theme-select')) as HTMLSelectElement;

    // value가 'dark'인지 확인
    expect(themeSelect.value).toBe('dark');
  });

  it('설정 모달에 현재 테마가 반영됨 (auto)', async () => {
    // ThemeService가 'auto' 반환하도록 모킹
    vi.spyOn(themeService, 'getCurrentTheme').mockReturnValue('auto' as ThemeSetting);

    render(() => (
      <ToolbarWithSettings
        currentIndex={0}
        totalCount={5}
        onPrevious={() => {}}
        onNext={() => {}}
        onDownloadCurrent={() => {}}
        onDownloadAll={() => {}}
        onClose={() => {}}
      />
    ));

    // 설정 버튼 클릭
    const settingsButton = screen.getByLabelText('설정 열기');
    fireEvent.click(settingsButton);

    // 테마 select 찾기
    const themeSelect = (await screen.findByTestId('theme-select')) as HTMLSelectElement;

    // value가 'auto'인지 확인
    expect(themeSelect.value).toBe('auto');
  });
});
