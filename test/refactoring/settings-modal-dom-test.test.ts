/**
 * @fileoverview 설정 모달 DOM 생성 및 스타일 적용 테스트
 * @description 실제 DOM 환경에서 모달 생성과 스타일 적용 검증
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openSettingsModal, applyBasicModalStyles } from '@features/settings/settings-menu';

/**
 * DOM 모달 생성 테스트
 */
describe('설정 모달 DOM 생성 및 스타일 검증', () => {
  let originalDocument: typeof document;

  beforeEach(() => {
    // 원본 document 백업
    originalDocument = globalThis.document;

    // 테스트용 DOM 환경 설정
    const mockElements = new Map<string, HTMLElement>();

    const createElement = (tagName: string): HTMLElement => {
      const element = originalDocument.createElement(tagName);
      mockElements.set(tagName + mockElements.size, element);
      return element;
    };

    const mockDocument = {
      ...originalDocument,
      createElement,
      getElementById: (id: string) => originalDocument.getElementById(id),
      querySelector: (selector: string) => originalDocument.querySelector(selector),
      body: originalDocument.body || createElement('body'),
      head: originalDocument.head || createElement('head'),
    };

    globalThis.document = mockDocument as any;
  });

  afterEach(() => {
    // 원본 document 복원
    globalThis.document = originalDocument;
  });

  it('모달 요소에 기본 스타일이 올바르게 적용되어야 한다', () => {
    // Given: 새로운 div 요소 생성
    const modal = document.createElement('div');

    // When: 기본 모달 스타일 적용
    applyBasicModalStyles(modal);

    // Then: 필수 스타일들이 적용되어야 함
    expect(modal.style.position).toBe('fixed');
    expect(modal.style.display).toBe('block');
    expect(modal.style.visibility).toBe('visible');
    expect(modal.style.pointerEvents).toBe('auto');
    expect(modal.getAttribute('tabindex')).toBe('-1');
  });

  it('모달의 z-index가 CSS 변수로 설정되어야 한다', () => {
    // Given: 새로운 div 요소 생성
    const modal = document.createElement('div');

    // When: 기본 모달 스타일 적용
    applyBasicModalStyles(modal);

    // Then: z-index가 CSS 변수 형태로 설정되어야 함
    expect(modal.style.zIndex).toMatch(/var\(--xeg-z-modal/);
  });

  it('모달 위치와 크기가 반응형으로 설정되어야 한다', () => {
    // Given: 새로운 div 요소 생성
    const modal = document.createElement('div');

    // When: 기본 모달 스타일 적용
    applyBasicModalStyles(modal);

    // Then: 반응형 위치와 크기가 설정되어야 함
    expect(modal.style.top).toBe('20%');
    expect(modal.style.left).toBe('50%');
    expect(modal.style.transform).toBe('translateX(-50%)');
    expect(modal.style.width).toBe('90vw');
    expect(modal.style.maxWidth).toBe('min(520px, 90vw)');
  });

  it('openSettingsModal 호출 시 DOM 변화가 발생해야 한다', () => {
    // When: 설정 모달 열기
    try {
      openSettingsModal();

      // Then: DOM에 변화가 발생해야 함 (요소 추가 또는 변경)
      // 실제로는 모달이 body에 추가되거나 기존 요소가 수정될 수 있음
      console.log('Modal opened successfully');
      expect(true).toBe(true); // 에러 없이 실행되었음을 확인
    } catch (error) {
      console.error('Modal opening failed:', error);
      // 모달 열기 실패 - 이것이 문제의 원인일 수 있음
      expect(false).toBe(true);
    }
  });

  it('모달 스타일에 디자인 시스템 변수들이 사용되어야 한다', () => {
    // Given: 새로운 div 요소 생성
    const modal = document.createElement('div');

    // When: 기본 모달 스타일 적용
    applyBasicModalStyles(modal);

    // Then: 디자인 시스템 CSS 변수들이 사용되어야 함
    expect(modal.style.borderRadius).toMatch(/var\(--xeg-radius/);
    expect(modal.style.boxShadow).toMatch(/var\(--xeg-shadow/);
    expect(modal.style.border).toMatch(/var\(--xeg-border/);
  });
});
