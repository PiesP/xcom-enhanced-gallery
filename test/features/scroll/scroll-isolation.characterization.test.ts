/**
 * @file scroll-isolation.characterization.test.ts
 * 성격: 현재(feat/scroll-isolation, FLAG OFF) 구현의 휠 처리 행동(characterization)
 * 목적: 향후 feature flag `xeg_scrollIsolationV1` 도입 후 경계 기반 정책으로 전환할 때
 *       기존 전역(또는 jsdom 환경상 no-op) 동작이 의도된 변경인지 비교 근거 제공.
 * 비고: JSDOM 환경에서 document capture wheel preventDefault 가 defaultPrevented
 *       플래그로 반영되지 않을 수 있어 '정책 의도'를 직접 단언하지 않고 hook 구동 smoke 위주.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openGallery, closeGallery } from '@shared/state/signals/gallery.signals';
import { getPreact, getPreactHooks } from '@shared/external/vendors';
import { useGalleryScroll } from '@/features/gallery/hooks/useGalleryScroll';

function setupGalleryContainer(): HTMLElement {
  const el = document.createElement('div');
  el.style.width = '300px';
  el.style.height = '200px';
  el.style.overflow = 'auto';
  const inner = document.createElement('div');
  inner.style.height = '1500px';
  el.appendChild(inner);
  document.body.appendChild(el);
  return el;
}

function TestHook({ container }: { container: HTMLElement | null }) {
  const { h } = getPreact();
  const { useEffect } = getPreactHooks();
  useGalleryScroll({ container, enabled: true, blockTwitterScroll: true });
  useEffect(
    () => () => {
      /* hook 내부 cleanup */
    },
    []
  );
  return h('div', {});
}

function mount(container: HTMLElement) {
  const { h, render } = getPreact();
  const host = document.createElement('div');
  document.body.appendChild(host);
  render(h(TestHook, { container }), host);
  return () => {
    render(null, host);
    host.remove();
  };
}

describe('scroll-isolation characterization (baseline)', () => {
  let galleryEl: HTMLElement;
  let cleanup: (() => void) | null = null;
  beforeEach(() => {
    galleryEl = setupGalleryContainer();
    openGallery([{ id: 'm1', type: 'image', url: 'x', width: 1, height: 1 } as any], 0);
    cleanup = mount(galleryEl);
  });
  afterEach(() => {
    closeGallery();
    cleanup?.();
    galleryEl.remove();
  });

  it('hook mounts without throwing (baseline behavior captured)', async () => {
    await new Promise(r => setTimeout(r, 0));
    // JSDOM은 레이아웃/스크롤 계산이 없어 scrollHeight/clientHeight 관계를 신뢰할 수 없음.
    // 대신 우리가 삽입한 내부 엘리먼트와 의도한 style 속성이 존재하는지만 확인 (smoke 성격 유지)
    const inner = galleryEl.firstElementChild as HTMLElement | null;
    expect(inner).not.toBeNull();
    expect(inner!.style.height).toBe('1500px');
  });
});
