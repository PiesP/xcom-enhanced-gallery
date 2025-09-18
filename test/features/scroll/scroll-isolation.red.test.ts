/**
 * @file scroll-isolation.red.test.ts
 * RED 테스트: 갤러리 오버레이 활성 시 배경(X.com) 문서 스크롤 누수 현상 재현
 * 목표: 현재 구현이 preventDefault 누락으로 document scrollTop 변화함을 명시적으로 실패로 기록
 * 단계: GREEN 구현 후 본 파일은 .red 제거 및 기대 값 반전
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openGallery, closeGallery } from '@shared/state/signals/gallery.signals';
import { getPreact, getPreactHooks } from '@shared/external/vendors';
import { useGalleryScroll } from '@/features/gallery/hooks/useGalleryScroll';

// 테스트 헬퍼: 간단한 갤러리 컨테이너 시뮬레이션
function setupGalleryContainer(): HTMLElement {
  const el = document.createElement('div');
  el.id = 'xeg-gallery-container-test';
  el.style.width = '400px';
  el.style.height = '300px';
  el.style.overflow = 'auto';
  // 내부 스크롤 컨텐츠 추가 (경계 조건 테스트 대비 충분한 높이)
  const inner = document.createElement('div');
  inner.style.height = '2000px';
  el.appendChild(inner);
  document.body.appendChild(el);
  return el;
}

// Wheel 이벤트 디스패치 유틸
function dispatchWheel(target: EventTarget, deltaY: number) {
  const evt = new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true });
  target.dispatchEvent(evt);
  return evt;
}

// Hook 실행을 위한 래퍼 컴포넌트
function TestScrollHook({ container }: { container: HTMLElement | null }) {
  const { h } = getPreact();
  const { useEffect } = getPreactHooks();
  useGalleryScroll({ container, enabled: true, blockTwitterScroll: true });
  useEffect(() => {
    return () => {
      /* cleanup handled inside hook */
    };
  }, []);
  return h('div', {});
}

// 간단한 렌더링/언마운트 헬퍼 (벤더 getter 사용)
function mountHook(container: HTMLElement | null) {
  const { h, render } = getPreact();
  const host = document.createElement('div');
  document.body.appendChild(host);
  render(h(TestScrollHook, { container }), host);
  return () => {
    render(null, host);
    host.remove();
  };
}

describe('SCROLL-ISOLATION (RED) - wheel leakage', () => {
  let cleanupHook: (() => void) | null = null;
  let galleryEl: HTMLElement;

  beforeEach(() => {
    // 문서 스크롤 컨테이너 시뮬레이션: body 대신 wrapper 사용 (scrollTop 추적)
    document.documentElement.style.height = '4000px';
    document.body.style.height = '4000px';
    window.scrollTo({ top: 0 });

    galleryEl = setupGalleryContainer();

    // 갤러리 open 상태 세팅 (임의 mediaItems 최소 1개)
    openGallery([{ id: 'm1', type: 'image', url: 'x', width: 1, height: 1 } as any], 0);

    cleanupHook = mountHook(galleryEl);
  });

  afterEach(() => {
    closeGallery();
    if (cleanupHook) cleanupHook();
    galleryEl.remove();
    window.scrollTo({ top: 0 });
  });

  it('갤러리 open 상태에서 wheel 이벤트가 preventDefault 없이 전파되어야 한다 (RED: 실제로는 이미 차단됨 → 실패)', async () => {
    // 효과(useEffect) 커밋 후 리스너 등록이 보장되도록 microtask 대기
    await new Promise(r => setTimeout(r, 0));
    const evt = dispatchWheel(galleryEl, 120);
    // RED 기대 (의도된 신규 정책): 내부 스크롤 여유가 있으므로 기본 동작 차단 안됨
    expect(evt.defaultPrevented).toBe(false); // 실제 구현은 true → 실패해야 함
  });
});
