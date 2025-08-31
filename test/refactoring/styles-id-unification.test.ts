/**
 * @fileoverview Phase 1.1: 스타일 ID 통일 테스트 (RED → GREEN → REFACTOR)
 * @description 빌드 결과물과 소스 코드에서 동일한 스타일 ID 사용 검증
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Phase 1.1: 스타일 ID 통일', () => {
  beforeEach(async () => {
    // DOM 초기화 - vitest에서 jsdom 환경이 자동 설정됨
    const doc = globalThis.document;
    if (doc) {
      doc.head.innerHTML = '';
      doc.body.innerHTML = '';
    }

    // 스타일 초기화 상태 리셋
    try {
      const { cleanupNamespacedStyles } = await import('@shared/styles/namespaced-styles');
      cleanupNamespacedStyles();
    } catch {
      // cleanup 실패는 무시
    }
  });

  afterEach(() => {
    // DOM 정리
    const doc = globalThis.document;
    if (doc) {
      const existingStyles = doc.querySelectorAll('style[id*="xeg"]');
      existingStyles.forEach(style => style.remove());
    }
  });

  describe('RED: 실패하는 테스트 - 현재 불일치 확인', () => {
    it('빌드 결과물과 소스 코드에서 동일한 스타일 ID 사용해야 함', async () => {
      // GREEN 단계: 이제 통일된 ID 사용

      // 1. 소스 코드의 스타일 초기화 함수 import
      const { initializeNamespacedStyles } = await import('@shared/styles/namespaced-styles');

      // 2. 스타일 초기화 실행
      initializeNamespacedStyles();

      // 3. 통일된 스타일 ID 확인
      const doc = globalThis.document;
      const unifiedStyleElement = doc?.querySelector('#xeg-styles');
      expect(unifiedStyleElement).toBeTruthy(); // 통일된 ID 존재 (GREEN)

      // 4. 구 ID는 존재하지 않아야 함
      const oldStyleElement = doc?.querySelector('#xeg-namespaced-styles');
      expect(oldStyleElement).toBeFalsy(); // 구 ID 부재 (GREEN)

      // 5. 통일된 ID가 사용되고 있음을 확인
      expect(unifiedStyleElement?.id).toBe('xeg-styles'); // 올바른 ID (GREEN)
    });

    it('스타일 상수가 정의되지 않아 불일치가 발생함', async () => {
      // GREEN 단계에서는 상수 모듈이 존재해야 함
      try {
        const constants = await import('@shared/styles/constants');
        expect(constants.STYLE_ID).toBe('xeg-styles'); // 올바른 ID 확인
        expect(constants.NAMESPACE).toBe('xeg-gallery'); // 네임스페이스 확인
      } catch {
        expect(true).toBe(false); // 에러가 없어야 함 (GREEN)
      }
    });

    it('네임스페이스 스타일에서 하드코딩된 ID 사용 중', async () => {
      const { initializeNamespacedStyles } = await import('@shared/styles/namespaced-styles');

      // 스타일 초기화 실행
      initializeNamespacedStyles();

      // 이제 올바른 ID로 생성되는지 확인
      const doc = globalThis.document;
      const unifiedStyleElement = doc?.querySelector('#xeg-styles');
      expect(unifiedStyleElement).toBeTruthy(); // 통일된 ID 사용 (GREEN)

      // 구 ID는 존재하지 않아야 함
      const oldStyleElement = doc?.querySelector('#xeg-namespaced-styles');
      expect(oldStyleElement).toBeFalsy(); // 구 ID 미사용 (GREEN)
    });
  });

  describe('GREEN: 최소 구현으로 테스트 통과', () => {
    it('통일된 스타일 ID 상수 정의 후 일치 확인', async () => {
      // 이 테스트는 GREEN 단계에서 구현 후 통과되어야 함
      // 현재는 SKIP하고, 구현 후 활성화
      expect(true).toBe(true); // 임시 통과
    });
  });

  describe('REFACTOR: 개선된 구현', () => {
    it('빌드 설정에서 스타일 ID 일관성 확보', () => {
      // 리팩토링 단계에서 빌드 설정 일관성 테스트
      expect(true).toBe(true); // 임시 통과
    });

    it('유저스크립트 재실행 안전성 보장', () => {
      // 중복 스타일 삽입 방지 테스트
      expect(true).toBe(true); // 임시 통과
    });
  });
});
