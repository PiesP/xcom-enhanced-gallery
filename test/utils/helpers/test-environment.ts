/**
 * 테스트 환경 설정 헬퍼
 * 다양한 시나리오에 맞는 환경을 쉽게 설정할 수 있도록 도와주는 유틸리티
 */

import { setupUserscriptAPIMocks, clearMockStorage } from '../../__mocks__/userscript-api.mock.js';

import { setupTwitterDOM, clearTwitterDOM } from '../../__mocks__/twitter-dom.mock.js';

import {
  setupBrowserEnvironment,
  clearBrowserEnvironment,
} from '../../__mocks__/browser-environment.mock.js';

// ================================
// Environment Setup Functions
// ================================

/**
 * 최소한의 테스트 환경 설정
 * - 기본 DOM만 설정
 */
export async function setupMinimalEnvironment() {
  const doc = globalThis.document;
  if (doc && doc.body) {
    doc.body.innerHTML = '<div id="test-root"></div>';
  }
}

/**
 * 브라우저 환경 설정
 * - DOM + 유저스크립트 API + 브라우저 API
 */
export async function setupBrowserTestEnvironment() {
  await setupMinimalEnvironment();
  setupUserscriptAPIMocks();
  setupBrowserEnvironment();
}

/**
 * 컴포넌트 테스트 환경 설정
 * - DOM + Twitter 구조 + 모킹된 API
 */
export async function setupComponentEnvironment() {
  await setupBrowserTestEnvironment();
  setupTwitterDOM();
}

/**
 * 통합 테스트를 위한 완전한 환경 설정
 * - 모든 기능이 포함된 완전한 환경
 */
export async function setupFullEnvironment() {
  await setupComponentEnvironment();
  // 추가적인 설정이 필요한 경우 여기에
}

// ================================
// Main Environment Setup
// ================================

/**
 * 통합 환경 설정 함수
 * @param type - 환경 타입 ('minimal' | 'browser' | 'component' | 'full')
 */
export async function setupTestEnvironment(type = 'minimal') {
  switch (type) {
    case 'minimal':
      return await setupMinimalEnvironment();
    case 'browser':
      return await setupBrowserTestEnvironment();
    case 'component':
      return await setupComponentEnvironment();
    case 'full':
      return await setupFullEnvironment();
    default:
      throw new Error(`알 수 없는 환경 타입: ${type}`);
  }
}

/**
 * 테스트 환경 정리
 */
export async function cleanupTestEnvironment() {
  clearTwitterDOM();
  clearMockStorage();
  clearBrowserEnvironment();

  // DOM 완전 정리
  const doc = globalThis.document;
  if (doc && doc.body) {
    doc.body.innerHTML = '';
  }

  // 이벤트 리스너 정리 (필요한 경우만)
  if (doc && doc.body && doc.body.parentNode) {
    const newBody = doc.createElement('body');
    doc.body.parentNode.replaceChild(newBody, doc.body);
  }
}
