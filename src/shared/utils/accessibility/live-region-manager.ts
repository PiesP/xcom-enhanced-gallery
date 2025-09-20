/**
 * Live Region Manager
 * - 단일 polite / assertive 라이브 리전 싱글톤을 보장
 * - 메시지 큐잉 및 짧은 시간창(기본 200ms) 내 동일 문자열 중복 억제
 * - 화면 리더 재공지 유도를 위한 공백 토글 방식 적용
 */

interface LiveRegionElements {
  polite?: HTMLElement;
  assertive?: HTMLElement;
}

const regions: LiveRegionElements = {};

type Channel = 'polite' | 'assertive';
const QUEUE: Record<Channel, string[]> = { polite: [], assertive: [] };
const PROCESSING: Record<Channel, boolean> = { polite: false, assertive: false };
const LAST_SEEN: Record<Channel, { msg: string; ts: number } | null> = {
  polite: null,
  assertive: null,
};

const DEDUPE_WINDOW_MS = 200;
const BETWEEN_MESSAGES_MS = 50;

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
      regions.polite.textContent = '';
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
      regions.assertive.textContent = '';
    }
  }
  return regions.assertive;
}

export function getLiveRegionElements(): LiveRegionElements {
  return { ...regions };
}

/**
 * 테스트 및 비정상 상태 복구용: 내부 큐/플래그/최근 메시지 캐시와 DOM 텍스트를 초기화
 */
export function __resetLiveRegionStateForTests__(): void {
  QUEUE.polite.length = 0;
  QUEUE.assertive.length = 0;
  PROCESSING.polite = false;
  PROCESSING.assertive = false;
  LAST_SEEN.polite = null;
  LAST_SEEN.assertive = null;
  if (regions.polite) regions.polite.textContent = '';
  if (regions.assertive) regions.assertive.textContent = '';
}

function getRegion(kind: Channel): HTMLElement {
  return kind === 'polite' ? ensurePoliteLiveRegion() : ensureAssertiveLiveRegion();
}

function shouldDedup(kind: Channel, msg: string, now = Date.now()): boolean {
  const last = LAST_SEEN[kind];
  if (!last) return false;
  // 테스트 환경(가상 타이머)과 실시간 타이머가 섞일 수 있어 시계가 되돌아간 경우가 있다.
  // now < last.ts (음수 델타)인 경우에는 중복 억제를 적용하지 않는다.
  const delta = now - last.ts;
  if (delta < 0) return false;
  return last.msg === msg && delta <= DEDUPE_WINDOW_MS;
}

function markSeen(kind: Channel, msg: string, now = Date.now()): void {
  LAST_SEEN[kind] = { msg, ts: now };
}

function processQueue(kind: Channel): void {
  if (PROCESSING[kind]) return;
  PROCESSING[kind] = true;

  const region = getRegion(kind);

  // 마이크로태스크 스케줄러: queueMicrotask 우선, 폴백은 resolved Promise
  // 참고: 텍스트 적용은 setTimeout(0)으로 스케줄하여 JSDOM + fake timers 환경에서
  // MutationObserver 콜백이 확실히 실행되도록 한다.

  const step = () => {
    const next = QUEUE[kind].shift();
    if (next == null) {
      PROCESSING[kind] = false;
      return;
    }
    // 공백으로 초기화 후 다음 틱에 텍스트 적용 → SR 재공지 유도
    region.textContent = '';
    setTimeout(() => {
      region.textContent = next;
      setTimeout(step, BETWEEN_MESSAGES_MS);
    }, 0);
  };

  step();
}

function enqueue(kind: Channel, msg: string): void {
  const now = Date.now();
  if (shouldDedup(kind, msg, now)) return;
  markSeen(kind, msg, now);
  QUEUE[kind].push(msg);
  processQueue(kind);
}

/**
 * announce API: 외부에서 안전하게 호출할 수 있는 함수
 */
export function announcePolite(message: string): void {
  enqueue('polite', message);
}

export function announceAssertive(message: string): void {
  enqueue('assertive', message);
}
