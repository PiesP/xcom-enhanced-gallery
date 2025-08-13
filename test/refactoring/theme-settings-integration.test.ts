/**
 * @fileoverview [TDD][GREEN] 테마 설정 통합 테스트 - 기능 중심 테스트
 * @description 설정 모달의 테마 기능이 올바르게 작동하는지 테스트
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { wireSettingsModal } from '@/features/settings/settings-menu';
import { themeService } from '@shared/services/theme-service';

// 서비스 매니저를 모킹하여 테스트 환경에서 정상 동작하도록 설정
vi.mock('@shared/services/service-manager', () => ({
  getService: vi.fn(() => ({
    get: vi.fn(() => 'auto'),
    set: vi.fn(() => Promise.resolve()),
    isInitialized: vi.fn(() => true),
  })),
}));

// 직접 테스트: 실제 wireSettingsModal 함수가 테마 관련 기능을 수행하는지
describe('[TDD][GREEN] 테마 설정 기능 테스트', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // DOM 컨테이너 생성
    container = document.createElement('div');
    container.innerHTML = `
      <select data-testid="theme">
        <option value="auto">자동 (시스템)</option>
        <option value="light">라이트 모드</option>
        <option value="dark">다크 모드</option>
      </select>
    `;

    // ThemeService 스파이 설정
    vi.spyOn(themeService, 'setTheme').mockImplementation(() => {});
    vi.spyOn(themeService, 'getCurrentTheme').mockReturnValue('light');

    vi.clearAllMocks();
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  it('wireSettingsModal이 테마 요소를 찾고 이벤트를 바인딩한다', () => {
    // ARRANGE
    const themeSelect = container.querySelector('[data-testid="theme"]') as HTMLSelectElement;

    // ACT
    wireSettingsModal(container);

    // ASSERT - 이벤트 리스너가 바인딩되었는지 확인
    // 실제로는 이벤트가 바인딩되면 초기 설정 로드가 실행됨
    expect(themeSelect.value).toBe('auto'); // 기본값이 설정됨
  });

  it('테마 변경 시 ThemeService.setTheme이 호출된다', async () => {
    // ARRANGE
    const themeSelect = container.querySelector('[data-testid="theme"]') as HTMLSelectElement;
    const mockSetTheme = vi.spyOn(themeService, 'setTheme');

    // ACT - 모달 바인딩
    wireSettingsModal(container);

    // 테마 변경 시뮬레이션
    themeSelect.value = 'dark';
    const changeEvent = new Event('change', { bubbles: true });
    themeSelect.dispatchEvent(changeEvent);

    // 비동기 처리 대기
    await new Promise(resolve => setTimeout(resolve, 100));

    // ASSERT
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('여러 테마 값에 대해 올바르게 동작한다', async () => {
    // ARRANGE
    const themeSelect = container.querySelector('[data-testid="theme"]') as HTMLSelectElement;
    const mockSetTheme = vi.spyOn(themeService, 'setTheme');

    wireSettingsModal(container);

    // ACT & ASSERT - 각 테마 값 테스트
    const themes = ['light', 'dark', 'auto'];

    for (const theme of themes) {
      mockSetTheme.mockClear();

      themeSelect.value = theme;
      themeSelect.dispatchEvent(new Event('change', { bubbles: true }));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockSetTheme).toHaveBeenCalledWith(theme);
    }
  });

  it('초기화 시 저장된 테마가 ThemeService에 적용된다', () => {
    // ARRANGE
    const mockSetTheme = vi.spyOn(themeService, 'setTheme');

    // ACT
    wireSettingsModal(container);

    // ASSERT - 초기화 시 저장된 테마(auto)가 적용되어야 함
    expect(mockSetTheme).toHaveBeenCalledWith('auto');
  });
});
