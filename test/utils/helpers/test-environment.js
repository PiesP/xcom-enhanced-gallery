/**
 * 테스트 환경 설정 헬퍼
 * 다양한 시나리오에 맞는 환경을 쉽게 설정할 수 있도록 도와주는 유틸리티
 */

import { clearMockStorage } from '../../__mocks__/userscript-api.mock.js';
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
 * - 브라우저 API mocking
 * - window, document 객체 설정
 */
export async function setupBrowserTestEnvironment() {
  await setupMinimalEnvironment();
  setupBrowserEnvironment();
}

/**
 * 컴포넌트 테스트 환경 설정
 * - 브라우저 환경 + DOM 조작 API
 */
export async function setupComponentTestEnvironment() {
  await setupBrowserTestEnvironment();
  // 추가 컴포넌트 테스트 설정이 필요하면 여기에
}

/**
 * 완전한 테스트 환경 설정
 * - 모든 Mock과 환경 설정
 * - X.com DOM 구조 포함
 */
export async function setupTestEnvironment() {
  await setupComponentTestEnvironment();
  // setupUserscriptAPIMocks(); // 이미 setup.ts에서 처리됨
  setupTwitterDOM();
}

// ================================
// Environment Cleanup Functions
// ================================

/**
 * 최소한의 환경 정리
 */
export async function cleanupMinimalEnvironment() {
  const doc = globalThis.document;
  if (doc && doc.body) {
    doc.body.innerHTML = '';
  }
}

/**
 * 브라우저 환경 정리
 */
export async function cleanupBrowserTestEnvironment() {
  await cleanupMinimalEnvironment();
  clearBrowserEnvironment();
}

/**
 * 컴포넌트 테스트 환경 정리
 */
export async function cleanupComponentTestEnvironment() {
  await cleanupBrowserTestEnvironment();
}

/**
 * 완전한 환경 정리
 */
export async function cleanupTestEnvironment() {
  await cleanupComponentTestEnvironment();
  clearMockStorage();
  clearTwitterDOM();
}

// ================================
// Environment Type Helpers
// ================================

/**
 * 현재 환경이 테스트 환경인지 확인
 */
export function isTestEnvironment() {
  return (
    typeof globalThis !== 'undefined' &&
    globalThis.process &&
    globalThis.process.env &&
    globalThis.process.env.NODE_ENV === 'test'
  );
}

/**
 * 현재 환경이 JSDOM인지 확인
 */
export function isJSDOMEnvironment() {
  return (
    typeof globalThis !== 'undefined' &&
    globalThis.window &&
    globalThis.window.navigator &&
    globalThis.window.navigator.userAgent &&
    globalThis.window.navigator.userAgent.includes('jsdom')
  );
}

/**
 * 안전한 환경 설정 헬퍼
 * 기존 전역 객체가 있는지 확인하고 설정
 */
export function safelySetupGlobalEnvironment() {
  // 기본 브라우저 객체들이 없으면 최소한 빈 객체로 설정
  if (!globalThis.window) {
    globalThis.window = {};
  }

  if (!globalThis.document) {
    globalThis.document = { body: { innerHTML: '' } };
  }

  if (!globalThis.location) {
    globalThis.location = {
      href: 'https://x.com',
      hostname: 'x.com',
      pathname: '/',
      search: '',
    };
  }
}
