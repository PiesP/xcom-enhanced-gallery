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

// 간단한 URL 구현
class SimpleURL {
  constructor(url) {
    this.href = url;

    // URL 파싱
    try {
      const urlMatch = url.match(/^(https?):\/\/([^/?]+)(\/[^?]*)?(\?.*)?$/);
      if (urlMatch) {
        this.protocol = urlMatch[1] + ':';
        this.hostname = urlMatch[2];
        this.pathname = urlMatch[3] || '/';
        this.search = urlMatch[4] || '';
      } else {
        throw new Error('Invalid URL');
      }

      // searchParams 구현
      this.searchParams = {
        get: key => {
          const queryString = this.search.slice(1); // Remove ?
          const pairs = queryString.split('&');
          for (const pair of pairs) {
            const [k, v] = pair.split('=');
            if (k === key) {
              return decodeURIComponent(v || '');
            }
          }
          return null;
        },
        set: (key, value) => {
          const queryString = this.search.slice(1);
          const pairs = queryString ? queryString.split('&') : [];
          let found = false;

          for (let i = 0; i < pairs.length; i++) {
            const [k] = pairs[i].split('=');
            if (k === key) {
              pairs[i] = `${key}=${encodeURIComponent(value)}`;
              found = true;
              break;
            }
          }

          if (!found) {
            pairs.push(`${key}=${encodeURIComponent(value)}`);
          }

          this.search = pairs.length > 0 ? '?' + pairs.join('&') : '';
          this.href = `${this.protocol}//${this.hostname}${this.pathname}${this.search}`;
        },
        has: key => {
          const queryString = this.search.slice(1);
          const pairs = queryString.split('&');
          return pairs.some(pair => pair.split('=')[0] === key);
        },
      };
    } catch {
      throw new TypeError(`Invalid URL: ${url}`);
    }
  }

  toString() {
    return this.href;
  }
}

// URL 생성자 설정 - constructor 함수로 만들기
if (!globalThis.URL || typeof globalThis.URL !== 'function') {
  // SimpleURL을 직접 globalThis.URL로 설정
  Object.defineProperty(globalThis, 'URL', {
    value: SimpleURL,
    writable: true,
    configurable: true,
  });
}

// 기본적인 브라우저 환경 설정
if (typeof globalThis !== 'undefined') {
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

/**
 * 각 테스트 전에 기본 환경 설정
 * 모든 테스트가 깨끗한 환경에서 실행되도록 보장
 */
beforeEach(async () => {
  // URL 생성자를 매번 새로 설정
  globalThis.URL = SimpleURL;

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
