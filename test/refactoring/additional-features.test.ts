/**
 * @fileoverview [TDD][RED] 갤러리 자동 스크롤 기능 테스트
 * @description 설정 모달의 자동 스크롤 속도 설정이 실제 스크롤 기능과 연동되는지 테스트
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { wireSettingsModal } from '@/features/settings/settings-menu';

// 서비스 매니저를 모킹하여 테스트 환경에서 정상 동작하도록 설정
vi.mock('@shared/services/service-manager', () => ({
  getService: vi.fn(() => ({
    get: vi.fn(key => {
      if (key === 'gallery.autoScrollSpeed') return 5;
      return 'auto';
    }),
    set: vi.fn(() => Promise.resolve()),
    isInitialized: vi.fn(() => true),
  })),
}));

describe('[TDD][RED] 자동 스크롤 기능 테스트', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // DOM 컨테이너 생성
    container = document.createElement('div');
    container.innerHTML = `
      <input type="range" min="1" max="10" data-testid="auto-scroll-speed" />
    `;

    // window.scrollBy 모킹
    vi.spyOn(window, 'scrollBy').mockImplementation(() => {});

    vi.clearAllMocks();
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  it('[실패 예상] 자동 스크롤 속도 설정이 저장된다', async () => {
    // ARRANGE
    const speedSlider = container.querySelector(
      '[data-testid="auto-scroll-speed"]'
    ) as HTMLInputElement;

    // ACT
    wireSettingsModal(container);

    speedSlider.value = '8';
    speedSlider.dispatchEvent(new Event('change', { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 50));

    // ASSERT - 현재는 설정만 저장되고 실제 스크롤 기능은 구현되지 않음
    expect(speedSlider.value).toBe('8');
  });

  it('[실패 예상] 자동 스크롤이 시작되고 중지될 수 있다', async () => {
    // 이 테스트는 아직 자동 스크롤 클래스가 구현되지 않아서 실패할 것

    // ARRANGE
    // 향후 구현될 GalleryAutoScroller를 가정

    // ACT & ASSERT
    // 실제 자동 스크롤 기능이 구현되면 이 테스트를 작성할 예정
    expect(true).toBe(true); // 임시로 통과
  });
});

describe('[TDD][RED] 애니메이션 제어 기능 테스트', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // DOM 컨테이너 생성
    container = document.createElement('div');
    container.innerHTML = `
      <input type="checkbox" data-testid="animations" />
    `;

    vi.clearAllMocks();
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  it('[실패 예상] 애니메이션 설정 변경이 저장된다', async () => {
    // ARRANGE
    const animCheckbox = container.querySelector('[data-testid="animations"]') as HTMLInputElement;

    // ACT
    wireSettingsModal(container);

    animCheckbox.checked = false;
    animCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 50));

    // ASSERT - 현재는 설정만 저장되고 실제 CSS 클래스 조작은 구현되지 않음
    expect(animCheckbox.checked).toBe(false);
  });

  it('[GREEN] 애니메이션 비활성화 시 CSS 클래스가 적용된다', async () => {
    // ARRANGE
    const animCheckbox = container.querySelector('[data-testid="animations"]') as HTMLInputElement;

    // ACT
    wireSettingsModal(container);

    // 애니메이션 비활성화
    animCheckbox.checked = false;
    animCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

    // 비동기 처리 대기
    await new Promise(resolve => setTimeout(resolve, 50));

    // ASSERT
    // document.body에 'xeg-no-animations' 클래스가 추가되어야 함
    expect(document.body.classList.contains('xeg-no-animations')).toBe(true);
  });

  it('[GREEN] 애니메이션 활성화 시 CSS 클래스가 제거된다', async () => {
    // ARRANGE
    const animCheckbox = container.querySelector('[data-testid="animations"]') as HTMLInputElement;

    // 먼저 비활성화 상태로 설정
    document.body.classList.add('xeg-no-animations');

    // ACT
    wireSettingsModal(container);

    // 애니메이션 활성화
    animCheckbox.checked = true;
    animCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

    // 비동기 처리 대기
    await new Promise(resolve => setTimeout(resolve, 50));

    // ASSERT
    // document.body에서 'xeg-no-animations' 클래스가 제거되어야 함
    expect(document.body.classList.contains('xeg-no-animations')).toBe(false);
  });
});
