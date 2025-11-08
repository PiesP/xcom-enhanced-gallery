/**
 * Vitest Browser 모드 전용 설정 파일
 *
 * 실제 브라우저 환경에서 실행되므로 JSDOM 폴리필이 불필요합니다.
 * Solid.js의 fine-grained reactivity가 완전히 작동합니다.
 */

import { beforeAll, afterEach } from 'vitest';

// 브라우저 환경에서는 실제 DOM API가 제공되므로 폴리필 불필요
beforeAll(() => {
  console.log('[setup-browser] Running in real browser environment');

  // 기본 URL 설정 (X.com 시뮬레이션)
  if (typeof window !== 'undefined' && window.location.hostname !== 'x.com') {
    console.log('[setup-browser] Note: Running on', window.location.href);
  }
});

// 각 테스트 후 DOM 정리
afterEach(() => {
  // 테스트 중 생성된 전역 요소 정리
  document.body.innerHTML = '';

  // 전역 상태 초기화 (필요 시)
  if (typeof window !== 'undefined') {
    // @ts-expect-error - 테스트 환경에서 설정된 전역 변수 정리
    delete window.__XEG_TEST__;
  }
});
