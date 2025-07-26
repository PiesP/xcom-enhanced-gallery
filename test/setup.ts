/**
 * Vitest 테스트 환경 설정
 * 새로운 모듈화된 테스트 인프라 사용
 */

import '@testing-library/jest-dom';
import { beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from './utils/helpers/test-environment.js';

// ================================
// 전역 테스트 환경 설정
// ================================

// URL 생성자 폴백 - Node.js URL 직접 사용
function createURLPolyfill() {
  try {
    // Node.js의 기본 URL을 직접 사용
    const { URL: NodeURL } = require('node:url');
    console.log('Using Node.js URL constructor');
    return NodeURL;
  } catch (error) {
    console.warn('Node URL import failed, using fallback:', error);

    // fallback implementation
    function URLConstructor(url) {
      if (!(this instanceof URLConstructor)) {
        return new URLConstructor(url);
      }

      const urlRegex = /^(https?):\/\/([^/]+)(\/[^?]*)?\??(.*)$/;
      const match = url.match(urlRegex);

      if (!match) {
        throw new Error('Invalid URL');
      }

      const [, protocol, hostname, pathname = '/', search = ''] = match;

      this.protocol = `${protocol}:`;
      this.hostname = hostname;
      this.pathname = pathname;
      this.search = search ? `?${search}` : '';
      this.href = url;

      this.toString = () => this.href;

      return this;
    }

    return URLConstructor;
  }
}

// URL 폴백 설정
function setupURLPolyfill() {
  const URLPolyfill = createURLPolyfill();

  // globalThis 레벨에 설정
  globalThis.URL = URLPolyfill;

  // window 레벨에도 설정 (안전하게)
  try {
    if (typeof window !== 'undefined') {
      window.URL = URLPolyfill;
    }
  } catch {
    // 무시
  }

  // global 레벨에도 설정 (안전하게)
  try {
    if (typeof global !== 'undefined') {
      global.URL = URLPolyfill;
    }
  } catch {
    // 무시
  }
}

// URL 폴백 설정 실행
setupURLPolyfill();

// 기본적인 브라우저 환경 설정 강화
if (typeof globalThis !== 'undefined') {
  // 안전한 window 객체 설정
  if (!globalThis.window || typeof globalThis.window !== 'object') {
    globalThis.window = {};
  }

  // 안전한 document 객체 설정 - body 포함
  if (!globalThis.document || typeof globalThis.document !== 'object') {
    globalThis.document = {
      body: { innerHTML: '' },
      createElement: () => ({ innerHTML: '' }),
      querySelector: () => null,
      querySelectorAll: () => [],
    };
  } else if (!globalThis.document.body) {
    globalThis.document.body = { innerHTML: '' };
  }

  // 안전한 location 객체 설정
  if (!globalThis.location || typeof globalThis.location !== 'object') {
    globalThis.location = {
      href: 'https://x.com',
      hostname: 'x.com',
      pathname: '/',
      search: '',
    };
  }
}

/**
 * 각 테스트 전에 기본 환경 설정
 * 모든 테스트가 깨끗한 환경에서 실행되도록 보장
 */
beforeEach(async () => {
  // URL 생성자 다시 확인 및 설정
  if (!globalThis.URL || typeof globalThis.URL !== 'function') {
    const URLPolyfill = createURLPolyfill();
    globalThis.URL = URLPolyfill;
  }

  // 기본 테스트 환경 설정 (minimal)
  await setupTestEnvironment();
});

/**
 * 각 테스트 후에 환경 정리
 * 메모리 누수 방지 및 테스트 격리 보장
 */
afterEach(async () => {
  await cleanupTestEnvironment();
});

// ================================
// 환경 사용 가이드
// ================================
// 이 파일은 vitest.config.ts의 setupFiles에서 자동으로 로드됩니다
// 개별 테스트에서 특별한 환경이 필요한 경우:
// - setupComponentTestEnvironment() : DOM + 브라우저 확장 + 컴포넌트 환경
// - setupBrowserTestEnvironment() : DOM + 브라우저 확장 환경
// - setupTestEnvironment() : 모든 환경 + 샘플 데이터
// - setupMinimalEnvironment() : 기본 환경 (기본값)
