/* eslint-env browser */
/* globals document, setTimeout, clearTimeout */
/* Test file uses jsdom globals (document/window) intentionally */
/**
 * @fileoverview Minimal Integration Test for Body Scroll Lock
 * 검증 목표: useBodyScrollLock 훅이 (조건부) 활성화 시 body overflow를 hidden으로 설정하고
 * cleanup 시 복원한다. 실제 VerticalGalleryView 전체 렌더를 피하고, wrapper 컴포넌트에
 * 동일한 호출 패턴(useBodyScrollLock)만 구성하여 환경 의존을 줄인다.
 */
import { describe, it, expect } from 'vitest';
import { getPreact, getPreactHooks } from '@shared/external/vendors';
import { useBodyScrollLock } from '@shared/hooks/useBodyScrollLock';
import { FEATURE_BODY_SCROLL_LOCK } from '@/constants';

// 간단 렌더 유틸 (testing-library 없이)
function mount(component) {
  const { render, h } = getPreact();
  const host = document.createElement('div');
  document.body.appendChild(host);
  render(component, host);
  return () => {
    // unmount: 동일 컨테이너에 null 렌더
    render(
      h(() => null, {}),
      host
    );
    host.remove();
  };
}

function Wrapper(props) {
  const enabled = props.enabled;
  const { useState, useEffect } = getPreactHooks();
  const [active, setActive] = useState(true);
  // 실제 VerticalGalleryView가 조건 충족 시 훅을 호출하는 패턴을 단순화
  useBodyScrollLock({ enabled });
  // 비활성화 테스트용 자동 cleanup 트리거
  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => setActive(false), 0);
    return () => clearTimeout(t);
  }, [enabled]);
  return active ? null : null;
}

describe('Integration (Minimal): Body Scroll Lock', () => {
  it('활성 상태에서 body overflow hidden 적용', async () => {
    if (!FEATURE_BODY_SCROLL_LOCK) {
      expect(true).toBe(true);
      return;
    }
    const { h } = getPreact();
    const unmount = mount(h(Wrapper, { enabled: true }));
    await Promise.resolve(); // microtask flush
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
  });

  it('cleanup 이후 body overflow 복원', async () => {
    if (!FEATURE_BODY_SCROLL_LOCK) {
      expect(true).toBe(true);
      return;
    }
    const before = document.body.style.overflow || '';
    const { h } = getPreact();
    const unmount = mount(h(Wrapper, { enabled: true }));
    await Promise.resolve();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    await Promise.resolve();
    expect(document.body.style.overflow === 'hidden').toBe(false);
    expect(document.body.style.overflow).toBe(before);
  });

  it('disabled 시 body overflow 변경 없음', async () => {
    const baseline = document.body.style.overflow || '';
    const { h } = getPreact();
    const unmount = mount(h(Wrapper, { enabled: false }));
    await Promise.resolve();
    expect(document.body.style.overflow).toBe(baseline);
    unmount();
  });
});
