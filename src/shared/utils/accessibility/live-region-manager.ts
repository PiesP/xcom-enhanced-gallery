/**
 * Live Region Manager (Phase 5 Accessibility 최소 구현)
 * 단일 polite / assertive 라이브 리전을 보장하고 재사용한다.
 * 테스트 요구사항:
 *  - ensurePoliteLiveRegion(): singleton, data-xe-live-region="polite", aria-live="polite", role="status"
 *  - ensureAssertiveLiveRegion(): singleton, data-xe-live-region="assertive", aria-live="assertive", role="alert"
 *  - 두 타입 동시 사용 시 총 2개만
 */

interface LiveRegionElements {
  polite?: HTMLElement;
  assertive?: HTMLElement;
}

const regions: LiveRegionElements = {};

function createRegion(kind: 'polite' | 'assertive'): HTMLElement {
  if (typeof document === 'undefined') {
    // 비브라우저 환경 방어 – 테스트에서는 jsdom 사용
    // 최소한의 객체 모킹
    return {
      setAttribute() {},
      getAttribute() {
        return null;
      },
    } as unknown as HTMLElement;
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
