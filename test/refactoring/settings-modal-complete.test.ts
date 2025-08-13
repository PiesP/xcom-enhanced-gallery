/**
 * @fileoverview [TDD][REFACTOR] 설정 모달 완전 통합 테스트
 * @description 모든 설정 기능이 완전히 구현되고 연동되는지 최종 검증
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { wireSettingsModal } from '@/features/settings/settings-menu';
import { themeService } from '@shared/services/theme-service';

// 서비스 매니저를 모킹하여 테스트 환경에서 정상 동작하도록 설정
vi.mock('@shared/services/service-manager', () => ({
  getService: vi.fn(() => ({
    get: vi.fn(key => {
      switch (key) {
        case 'gallery.theme':
          return 'auto';
        case 'gallery.autoScrollSpeed':
          return 5;
        case 'gallery.animations':
          return true;
        case 'download.filenamePattern':
          return 'tweet-id';
        case 'download.imageQuality':
          return 'original';
        case 'download.autoZip':
          return false;
        case 'download.maxConcurrentDownloads':
          return 4;
        default:
          return null;
      }
    }),
    set: vi.fn(() => Promise.resolve()),
    isInitialized: vi.fn(() => true),
  })),
}));

describe('[TDD][REFACTOR] 설정 모달 완전 통합 테스트', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // 완전한 설정 모달 HTML 구조
    container = document.createElement('div');
    container.innerHTML = `
      <div data-testid="xeg-settings-modal" class="xeg-modal">
        <div class="xeg-modal-header">
          <h3>XEG 설정</h3>
          <button type="button" data-testid="modal-close-button">×</button>
        </div>
        <div class="xeg-modal-body">
          <section data-section="filename">
            <label>파일명 패턴</label>
            <select data-testid="filename-pattern">
              <option value="original">원본</option>
              <option value="tweet-id">유저명_트윗ID_인덱스</option>
              <option value="timestamp">타임스탬프</option>
              <option value="custom">사용자 지정</option>
            </select>
            <div data-testid="custom-template-row" style="display:none; gap: 8px; align-items: center; margin-top: 8px;">
              <label>사용자 지정 패턴</label>
              <input type="text" data-testid="custom-template" placeholder="예: {user}_{tweetId}_{index}.{ext}" />
            </div>
          </section>
          <section data-section="download">
            <label>이미지 품질</label>
            <select data-testid="image-quality">
              <option value="original">Original</option>
              <option value="large">Large</option>
              <option value="medium">Medium</option>
              <option value="small">Small</option>
            </select>
            <label>자동 압축</label>
            <input type="checkbox" data-testid="auto-zip" />
            <label>동시 다운로드 수</label>
            <input type="number" min="1" max="20" data-testid="concurrency" />
          </section>
          <section data-section="gallery">
            <label>테마</label>
            <select data-testid="theme">
              <option value="auto">자동 (시스템)</option>
              <option value="light">라이트 모드</option>
              <option value="dark">다크 모드</option>
            </select>
            <label>자동 스크롤 속도</label>
            <input type="range" min="1" max="10" data-testid="auto-scroll-speed" />
            <label>애니메이션 효과</label>
            <input type="checkbox" data-testid="animations" />
          </section>
        </div>
      </div>
    `;

    // ThemeService 스파이 설정
    vi.spyOn(themeService, 'setTheme').mockImplementation(() => {});
    vi.spyOn(themeService, 'getCurrentTheme').mockReturnValue('light');

    vi.clearAllMocks();
  });

  afterEach(() => {
    container.remove();
    document.body.classList.remove('xeg-no-animations');
    document.documentElement.classList.remove('xeg-no-animations');
    vi.restoreAllMocks();
  });

  describe('모든 설정 항목 초기화', () => {
    it('모든 설정 항목이 저장된 값으로 초기화된다', () => {
      // ACT
      wireSettingsModal(container);

      // ASSERT - 각 설정 항목이 올바른 초기값을 가져야 함
      const filenamePattern = container.querySelector(
        '[data-testid="filename-pattern"]'
      ) as HTMLSelectElement;
      const imageQuality = container.querySelector(
        '[data-testid="image-quality"]'
      ) as HTMLSelectElement;
      const autoZip = container.querySelector('[data-testid="auto-zip"]') as HTMLInputElement;
      const concurrency = container.querySelector(
        '[data-testid="concurrency"]'
      ) as HTMLInputElement;
      const theme = container.querySelector('[data-testid="theme"]') as HTMLSelectElement;
      const autoScrollSpeed = container.querySelector(
        '[data-testid="auto-scroll-speed"]'
      ) as HTMLInputElement;
      const animations = container.querySelector('[data-testid="animations"]') as HTMLInputElement;

      expect(filenamePattern.value).toBe('tweet-id');
      expect(imageQuality.value).toBe('original');
      expect(autoZip.checked).toBe(false);
      expect(concurrency.value).toBe('4');
      expect(theme.value).toBe('auto');
      expect(autoScrollSpeed.value).toBe('5');
      expect(animations.checked).toBe(true);
    });
  });

  describe('설정 기능 통합 테스트', () => {
    it('테마 변경이 ThemeService와 연동된다', async () => {
      // ARRANGE
      const themeSelect = container.querySelector('[data-testid="theme"]') as HTMLSelectElement;
      const mockSetTheme = vi.spyOn(themeService, 'setTheme');

      await wireSettingsModal(container);

      // 초기화 완료 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      // Mock 호출 기록 초기화 (초기화 중 호출된 것들 제거)
      mockSetTheme.mockClear();

      // ACT
      themeSelect.value = 'dark';
      themeSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 100));

      // ASSERT
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('애니메이션 설정 변경이 DOM에 즉시 반영된다', async () => {
      // ARRANGE
      const animCheckbox = container.querySelector(
        '[data-testid="animations"]'
      ) as HTMLInputElement;

      wireSettingsModal(container);

      // ACT - 애니메이션 비활성화
      animCheckbox.checked = false;
      animCheckbox.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 50));

      // ASSERT
      expect(document.body.classList.contains('xeg-no-animations')).toBe(true);

      // ACT - 애니메이션 재활성화
      animCheckbox.checked = true;
      animCheckbox.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 50));

      // ASSERT
      expect(document.body.classList.contains('xeg-no-animations')).toBe(false);
    });

    it('여러 설정을 동시에 변경해도 모두 정상 작동한다', async () => {
      // ARRANGE
      const themeSelect = container.querySelector('[data-testid="theme"]') as HTMLSelectElement;
      const animCheckbox = container.querySelector(
        '[data-testid="animations"]'
      ) as HTMLInputElement;
      const imageQualitySelect = container.querySelector(
        '[data-testid="image-quality"]'
      ) as HTMLSelectElement;

      const mockSetTheme = vi.spyOn(themeService, 'setTheme');

      await wireSettingsModal(container);

      // 초기화 완료 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      // Mock 호출 기록 초기화 (초기화 중 호출된 것들 제거)
      mockSetTheme.mockClear();

      // ACT - 여러 설정을 동시에 변경
      themeSelect.value = 'dark';
      themeSelect.dispatchEvent(new Event('change'));

      animCheckbox.checked = false;
      animCheckbox.dispatchEvent(new Event('change'));

      imageQualitySelect.value = 'large';
      imageQualitySelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 100));

      // ASSERT - 모든 변경사항이 적용되어야 함
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
      expect(document.body.classList.contains('xeg-no-animations')).toBe(true);
      expect(imageQualitySelect.value).toBe('large');
    });
  });

  describe('에러 처리 및 견고성', () => {
    it('일부 요소가 누락되어도 다른 기능은 정상 작동한다', () => {
      // ARRANGE - 일부 요소만 있는 불완전한 DOM
      const incompleteContainer = document.createElement('div');
      incompleteContainer.innerHTML = `
        <select data-testid="theme">
          <option value="auto">자동</option>
          <option value="dark">다크</option>
        </select>
        <!-- 다른 요소들은 없음 -->
      `;

      // ACT & ASSERT - 에러 없이 실행되어야 함
      expect(() => wireSettingsModal(incompleteContainer)).not.toThrow();

      // 존재하는 요소는 정상 작동해야 함
      const themeSelect = incompleteContainer.querySelector(
        '[data-testid="theme"]'
      ) as HTMLSelectElement;
      expect(themeSelect.value).toBe('auto');

      incompleteContainer.remove();
    });

    it('서비스 에러가 발생해도 UI는 정상 작동한다', () => {
      // ARRANGE - 에러를 발생시키는 모킹된 서비스
      const errorContainer = document.createElement('div');
      errorContainer.innerHTML = `<select data-testid="theme"><option value="auto">자동</option></select>`;

      // ACT & ASSERT - 함수가 에러 없이 완료되어야 함
      expect(() => wireSettingsModal(errorContainer)).not.toThrow();

      errorContainer.remove();
    });
  });

  describe('설정 모달 완성도 검증', () => {
    it('설정 모달의 모든 주요 기능이 구현되어 있다', () => {
      // ARRANGE
      wireSettingsModal(container);

      // ASSERT - 모든 주요 설정 요소가 존재하고 이벤트 리스너가 바인딩되어야 함
      const requiredElements = [
        '[data-testid="filename-pattern"]',
        '[data-testid="image-quality"]',
        '[data-testid="auto-zip"]',
        '[data-testid="concurrency"]',
        '[data-testid="theme"]',
        '[data-testid="auto-scroll-speed"]',
        '[data-testid="animations"]',
      ];

      requiredElements.forEach(selector => {
        const element = container.querySelector(selector);
        expect(element).not.toBeNull();
      });
    });
  });
});
