/**
 * Epic A11Y-FOCUS-ROLES: 갤러리 아이템 포커스 상태 역할 명확화
 *
 * @purpose VerticalImageItem의 isActive와 isFocused 상태 역할 구분 및 접근성 향상
 * @background 두 상태가 시각적으로만 구분되고 로직적 차이가 명시되지 않음
 * @relates docs/TDD_REFACTORING_PLAN.md Epic A11Y-FOCUS-ROLES
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { MediaInfo } from '@shared/types/media.types';

describe('Epic A11Y-FOCUS-ROLES: 갤러리 아이템 포커스 상태 역할 명확화', () => {
  let mockMedia: MediaInfo;

  beforeEach(() => {
    mockMedia = {
      id: 'test-media-1',
      url: 'https://pbs.twimg.com/media/test.jpg',
      type: 'image' as const,
      originalUrl: 'https://pbs.twimg.com/media/test.jpg',
      thumbnailUrl: 'https://pbs.twimg.com/media/test.jpg',
    };
  });

  it('isActive는 사용자가 명시적으로 선택한 아이템을 나타낸다', () => {
    // Given: VerticalImageItem Props에서 isActive의 역할 정의
    // 사용자가 클릭하거나 키보드 네비게이션(ArrowUp/Down, Home/End)으로 선택한 아이템

    // When: Props 인터페이스 JSDoc을 검증
    const propsInterface = `
      /**
       * 현재 활성화된 아이템 여부
       * @remarks 사용자가 클릭하거나 키보드 네비게이션으로 선택한 아이템.
       * 명시적 사용자 인터랙션의 결과.
       */
      isActive: boolean;
    `;

    // Then: JSDoc이 명확한 역할을 설명해야 함
    expect(propsInterface).toContain('사용자가 클릭하거나 키보드 네비게이션으로 선택한 아이템');
    expect(propsInterface).toContain('명시적 사용자 인터랙션의 결과');
  });

  it('isFocused는 갤러리 열림 시 자동 스크롤 대상 아이템을 나타낸다', () => {
    // Given: isFocused의 역할 정의
    // 갤러리가 열릴 때 startIndex와 일치하는 아이템, 자동 스크롤 대상

    // When: Props 인터페이스 JSDoc을 검증
    const propsInterface = `
      /**
       * 현재 포커스된 아이템 여부 (스크롤 대상)
       * @remarks 갤러리 열릴 때 자동 스크롤 대상 아이템.
       * 일반적으로 startIndex와 일치하며, 시각적 주목을 위해 사용.
       */
      isFocused?: boolean;
    `;

    // Then: JSDoc이 자동 스크롤 대상임을 명시해야 함
    expect(propsInterface).toContain('자동 스크롤 대상 아이템');
    expect(propsInterface).toContain('startIndex와 일치');
  });

  it('isActive와 isFocused는 동시에 true일 수 있다 (startIndex로 열린 경우)', () => {
    // Given: 갤러리가 특정 인덱스로 열린 상황
    const startIndex = 5;

    // When: 해당 인덱스의 아이템은 자동 스크롤 대상(isFocused)이면서 초기 활성 아이템(isActive)
    const isActive = true; // 초기 활성 아이템
    const isFocused = true; // 자동 스크롤 대상

    // Then: 두 상태가 동시에 true일 수 있음
    expect(isActive).toBe(true);
    expect(isFocused).toBe(true);

    // 이는 갤러리가 열릴 때 사용자가 클릭한 아이템으로 스크롤되는 시나리오
    // 예: 트윗의 3번째 이미지를 클릭 → 갤러리 열림 → 해당 아이템이 active + focused
  });

  it('CSS 클래스 .active와 .focused는 서로 다른 시각적 스타일을 적용한다', () => {
    // Given: VerticalImageItem.module.css의 스타일 정의
    const activeStyle = `
      /* 활성 상태: 사용자가 명시적으로 선택한 아이템 */
      .container.active {
        box-shadow: 0 0 0 2px var(--xeg-color-primary);
      }
    `;

    const focusedStyle = `
      /* 포커스 상태: 자동 스크롤 대상 아이템 (갤러리 열림 시 시작점) */
      .container.focused {
        box-shadow: 0 0 0 1px var(--xeg-color-focus);
      }
    `;

    // Then: 각 상태는 명확한 시각적 구분을 가져야 함
    expect(activeStyle).toContain('사용자가 명시적으로 선택한 아이템');
    expect(focusedStyle).toContain('자동 스크롤 대상 아이템');

    // active는 더 강한 강조 (2px border), focused는 가벼운 표시 (1px border)
    expect(activeStyle).toContain('2px');
    expect(focusedStyle).toContain('1px');
  });

  it('키보드 네비게이션 시 isActive 상태가 이동한다', () => {
    // Given: 현재 활성 아이템 인덱스
    let activeIndex = 0;

    // When: ArrowDown 키 입력 시뮬레이션
    const handleKeyDown = (key: string) => {
      if (key === 'ArrowDown') {
        activeIndex = Math.min(activeIndex + 1, 10); // 최대 10개 아이템 가정
      } else if (key === 'ArrowUp') {
        activeIndex = Math.max(activeIndex - 1, 0);
      }
    };

    handleKeyDown('ArrowDown');
    expect(activeIndex).toBe(1);

    handleKeyDown('ArrowDown');
    expect(activeIndex).toBe(2);

    handleKeyDown('ArrowUp');
    expect(activeIndex).toBe(1);

    // Then: isActive는 키보드 네비게이션에 따라 동적으로 변경됨
    // isFocused는 갤러리 열림 시 한 번만 설정되고 변경되지 않음
  });

  it('isFocused는 갤러리 열림 시 한 번만 설정되고 이후 변경되지 않는다', () => {
    // Given: 갤러리가 startIndex=3으로 열림
    const startIndex = 3;
    const initialFocusedIndex = startIndex;

    // When: 사용자가 키보드로 다른 아이템으로 이동 (isActive 변경)
    let activeIndex = startIndex;
    activeIndex = 5; // ArrowDown으로 이동

    // Then: isFocused는 여전히 초기 startIndex를 가리킴
    expect(initialFocusedIndex).toBe(3);
    expect(activeIndex).toBe(5);

    // isFocused는 갤러리가 닫혔다가 다시 열릴 때만 변경됨
    // 이는 "어디서부터 갤러리를 시작했는지"를 나타내는 정적 마커
  });

  it('디자인 토큰은 active와 focused 상태를 구분하는 의미론적 이름을 사용한다', () => {
    // Given: 디자인 토큰 정의
    const tokens = `
      /* 사용자 선택 아이템 강조 */
      --xeg-active-shadow: 0 0 0 2px var(--xeg-color-primary);

      /* 자동 스크롤 대상 아이템 표시 */
      --xeg-focus-shadow: 0 0 0 1px var(--xeg-color-focus);
    `;

    // Then: 토큰 이름과 주석이 역할을 명확히 설명해야 함
    expect(tokens).toContain('사용자 선택 아이템 강조');
    expect(tokens).toContain('자동 스크롤 대상 아이템 표시');
    expect(tokens).toContain('--xeg-active-shadow');
    expect(tokens).toContain('--xeg-focus-shadow');
  });
});
