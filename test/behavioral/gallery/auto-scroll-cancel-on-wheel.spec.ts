import { describe, it, expect, vi } from 'vitest';
import { markUserScroll } from '@shared/state/signals/navigation-intent.signals';
import { useGalleryItemScroll } from '@/features/gallery/hooks/useGalleryItemScroll';
import { getPreactHooks } from '@shared/external/vendors';
import { h } from 'preact';
import { render } from 'preact';

// RED: smooth auto-scroll 진행 중 user-scroll intent(markUserScroll) 발생 시 onAutoScrollCancelled 호출 기대

// NOTE: smooth 경로(jsdom scrollIntoView + smooth + signals effect) 테스트가
// 메모리 급증(OOM)을 유발하여 환경 한계로 인해 v2 DoD 범위에서 제외.
// mid-animation 취소 로직 자체는 훅에 존재하나 안정적 재현을 위한 대체 harness 필요.
// Backlog: jsdom 환경에서 smooth 모킹 or requestAnimationFrame 기반 fake progression.
describe.skip('auto-scroll cancellation (smooth path – skipped due to env OOM)', () => {
  it('smooth auto-scroll 중 user-scroll intent 발생 시 onAutoScrollCancelled 호출', async () => {
    const { useEffect } = getPreactHooks();
    const doc: Document | undefined = (globalThis as any).document;
    if (!doc) return; // jsdom 환경 보장
    const container: HTMLElement = doc.createElement('div');
    container.style.height = '400px';
    container.style.overflow = 'auto';
    for (let i = 0; i < 5; i++) {
      const child = doc.createElement('div');
      child.textContent = `item-${i}`;
      child.style.height = '200px';
      container.appendChild(child);
    }
    doc.body.appendChild(container);

    const cancelSpy = vi.fn();
    const startSpy = vi.fn();

    function TestComp() {
      const containerRef = { current: container };
      const hook = useGalleryItemScroll(containerRef, 0, 5, {
        behavior: 'smooth',
        enabled: true,
        onAutoScrollStart: startSpy,
        onAutoScrollCancelled: cancelSpy,
      });
      useEffect(() => {
        hook.scrollToItem(4); // trigger smooth scroll
        (globalThis as any).setTimeout(() => {
          markUserScroll(); // simulate user wheel
        }, 10);
      }, []);
      return null as any;
    }

    render(h(TestComp, {}), container);

    await new Promise(r => (globalThis as any).setTimeout(r, 50));

    // 기대: GREEN 단계에서 cancelSpy 가 호출되어야 함
    expect(cancelSpy).toHaveBeenCalled();
    // startSpy 는 항상 호출 (scroll 시도) → 회귀 보호
    expect(startSpy).toHaveBeenCalled();
  });
});
