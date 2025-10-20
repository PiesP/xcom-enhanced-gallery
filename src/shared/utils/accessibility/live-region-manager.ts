/**
 * Live Region Manager (Phase 5 Accessibility 최소 구현)
 * 단일 polite / assertive 라이브 리전을 보장하고 재사용한다.
 * 테스트 요구사항:
 *  - ensurePoliteLiveRegion(): singleton, data-xe-live-region="polite", aria-live="polite", role="status"
 *  - ensureAssertiveLiveRegion(): singleton, data-xe-live-region="assertive", aria-live="assertive", role="alert"
 *  - 두 타입 동시 사용 시 총 2개만
 */
import { globalTimerManager } from '../timer-management';

interface LiveRegionElements {
  polite?: HTMLElement;
  assertive?: HTMLElement;
}

const regions: LiveRegionElements = {};
let initialized = false;
// beforeunload 청소를 위한 핸들러 참조(순환 의존 방지를 위해 EventManager 미사용)
let unloadHandler: ((this: Window, ev: BeforeUnloadEvent) => unknown) | null = null;

function initLifecycleOnce(): void {
  if (initialized) return;
  initialized = true;
  try {
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      unloadHandler = () => {
        try {
          cleanupLiveRegions();
        } catch {
          /* no-op */
        }
      };
      window.addEventListener('beforeunload', unloadHandler, { capture: false });
    }
  } catch {
    // 비브라우저/테스트 환경 폴백은 무시(정리는 각 테스트에서 body reset으로 처리)
  }
}

function createRegion(kind: 'polite' | 'assertive'): HTMLElement {
  if (typeof document === 'undefined') {
    // Phase 137: 비브라우저 환경 방어 - 테스트에서는 jsdom 사용
    // 최소한의 객체 모킹
    const mock = {
      setAttribute() {},
      getAttribute() {
        return null;
      },
    };
    return mock as unknown as HTMLElement;
  }

  const el = document.createElement('div');
  el.setAttribute('data-xe-live-region', kind);
  el.setAttribute('aria-live', kind);
  el.setAttribute('role', kind === 'polite' ? 'status' : 'alert');
  // 화면 비가시화 (단순 최소 스타일 – 실제 CSS 유틸로 대체 가능)
  el.style.position = 'absolute';
  el.style.width = '1px';
  el.style.height = '1px';
  el.style.margin = '-1px';
  el.style.padding = '0';
  el.style.border = '0';
  el.style.clip = 'rect(0 0 0 0)';
  el.style.overflow = 'hidden';
  document.body.appendChild(el);
  return el;
}

export function ensurePoliteLiveRegion(): HTMLElement {
  initLifecycleOnce();
  if (!regions.polite) {
    regions.polite = createRegion('polite');
  } else if (!regions.polite.isConnected) {
    // DOM에서 제거되었으면 재부착
    if (typeof document !== 'undefined') {
      document.body.appendChild(regions.polite);
    }
  }
  return regions.polite;
}

export function ensureAssertiveLiveRegion(): HTMLElement {
  initLifecycleOnce();
  if (!regions.assertive) {
    regions.assertive = createRegion('assertive');
  } else if (!regions.assertive.isConnected) {
    if (typeof document !== 'undefined') {
      document.body.appendChild(regions.assertive);
    }
  }
  return regions.assertive;
}

export function getLiveRegionElements(): LiveRegionElements {
  return { ...regions };
}

export function cleanupLiveRegions(): void {
  try {
    if (regions.polite?.isConnected) {
      regions.polite.remove();
    }
    if (regions.assertive?.isConnected) {
      regions.assertive.remove();
    }
  } catch {
    /* no-op */
  } finally {
    delete (regions as Record<string, unknown>).polite;
    delete (regions as Record<string, unknown>).assertive;
    if (
      unloadHandler &&
      typeof window !== 'undefined' &&
      typeof window.removeEventListener === 'function'
    ) {
      try {
        window.removeEventListener('beforeunload', unloadHandler, false);
      } catch {
        /* ignore */
      }
      unloadHandler = null;
    }
    initialized = false;
  }
}

export function announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
  if (!message) return;
  const region = politeness === 'polite' ? ensurePoliteLiveRegion() : ensureAssertiveLiveRegion();
  try {
    // SR이 동일 텍스트를 감지하도록 약간의 reset 후 설정
    region.textContent = '';
    globalTimerManager.setTimeout(() => {
      region.textContent = message;
    }, 0);
  } catch {
    /* no-op */
  }
}
