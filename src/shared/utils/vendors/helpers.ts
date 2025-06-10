/**
 * Vendor 사용을 위한 헬퍼 유틸리티들
 * 가이드라인에 맞춘 일관된 vendor 접근 패턴 제공
 */
import { logger } from '@infrastructure/logging/logger';
import type { PreactAPI, PreactHooksAPI, PreactSignalsAPI } from './index';

/**
 * Vendor 컨텍스트 생성 헬퍼
 * 컴포넌트에서 일관된 vendor 접근 패턴을 제공
 */
export function createVendorContext() {
  let preact: PreactAPI | null = null;
  let hooks: PreactHooksAPI | null = null;
  let signals: PreactSignalsAPI | null = null;

  return {
    getPreact(): PreactAPI {
      if (!preact) {
        const { getPreact } = require('./index');
        preact = getPreact();
      }
      if (!preact) {
        throw new Error('Preact API를 로드할 수 없습니다.');
      }
      return preact;
    },

    getHooks(): PreactHooksAPI {
      if (!hooks) {
        const { getPreactHooks } = require('./index');
        hooks = getPreactHooks();
      }
      if (!hooks) {
        throw new Error('Preact Hooks API를 로드할 수 없습니다.');
      }
      return hooks;
    },

    getSignals(): PreactSignalsAPI {
      if (!signals) {
        const { getPreactSignals } = require('./index');
        signals = getPreactSignals();
      }
      if (!signals) {
        throw new Error('Preact Signals API를 로드할 수 없습니다.');
      }
      return signals;
    },

    // 자주 사용되는 패턴들을 위한 편의 메서드
    get h() {
      return this.getPreact().h;
    },
    get render() {
      return this.getPreact().render;
    },
    get Fragment() {
      return this.getPreact().Fragment;
    },
    get useState() {
      return this.getHooks().useState;
    },
    get useEffect() {
      return this.getHooks().useEffect;
    },
    get useRef() {
      return this.getHooks().useRef;
    },
    get useMemo() {
      return this.getHooks().useMemo;
    },
    get useCallback() {
      return this.getHooks().useCallback;
    },
    get signal() {
      return this.getSignals().signal;
    },
    get computed() {
      return this.getSignals().computed;
    },
    get effect() {
      return this.getSignals().effect;
    },
  };
}

/**
 * Vendor 호출 시 에러 처리를 위한 HOF
 */
export function withVendorErrorHandling<T extends (...args: never[]) => unknown>(
  vendorFn: T,
  fallbackValue?: ReturnType<T>
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    try {
      return vendorFn(...args) as ReturnType<T>;
    } catch (error) {
      logger.error('Vendor function call failed:', error);
      if (fallbackValue !== undefined) {
        return fallbackValue;
      }
      throw error;
    }
  }) as T;
}

/**
 * Vendor 라이브러리 사전 로딩
 * 성능 최적화를 위한 preload 패턴
 */
export async function preloadVendors(): Promise<void> {
  try {
    const promises = [
      import('./index').then(module => {
        // Preact 관련 vendor들 미리 로딩
        module.getPreact();
        module.getPreactHooks();
        module.getPreactSignals();
      }),
      import('./index').then(module => {
        // fflate 미리 로딩 (선택적)
        return module.getFflate();
      }),
    ];

    await Promise.allSettled(promises);
    logger.debug('Vendor libraries preloaded successfully');
  } catch (error) {
    logger.warn('Vendor preloading failed:', error);
  }
}
