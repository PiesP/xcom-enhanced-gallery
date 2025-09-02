/**
 * RED 테스트: hoverZoneElement 없이도 상단 edge(mousemove clientY<=threshold)에서 툴바 표시 복구
 * 현재 구현(useToolbarPositionBased)은 hoverZoneElement 에 의존하므로 이 테스트는 실패해야 함.
 * GREEN 목표: top-edge mousemove fallback 추가 후 통과.
 */
import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/preact';
import { getPreact, getPreactHooks } from '@shared/external/vendors';
import { render } from '@testing-library/preact';
import { useToolbarPositionBased } from '@features/gallery/hooks/useToolbarPositionBased';
import { h } from 'preact';

// Preact core 초기화
getPreact();
const { useRef, useEffect, useState } = getPreactHooks();

function Harness() {
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [toolbarEl, setToolbarEl] = useState<HTMLElement | null>(null);
  const [visibleState, setVisibleState] = useState<boolean | null>(null);
  const hideRef = useRef<() => void>(() => {});

  useEffect(() => {
    setToolbarEl(toolbarRef.current);
  }, []);

  const { isVisible, hide } = useToolbarPositionBased({
    toolbarElement: toolbarEl,
    hoverZoneElement: null, // intentionally null to simulate missing hover zone hit area
    enabled: true,
    initialAutoHideDelay: 0, // auto-hide 비활성화 (직접 hide 호출)
  });

  useEffect(() => {
    hideRef.current = hide;
    (globalThis as any).__XEG_TEST_HIDE_TOOLBAR__ = () => hideRef.current();
  }, [hide]);

  useEffect(() => {
    setVisibleState(isVisible);
  }, [isVisible]);

  return (
    <div>
      <div
        ref={toolbarRef}
        data-testid='toolbar'
        data-visible={visibleState ? '1' : '0'}
        style={{ ['--toolbar-opacity' as any]: visibleState ? '1' : '0' }}
      />
    </div>
  );
}

describe('Toolbar top-edge fallback', () => {
  it('수동 hide 후 상단 edge mousemove(clientY<=4)로 재표시되어야 한다 (GREEN)', async () => {
    const { getByTestId } = render(<Harness />);
    const toolbar = getByTestId('toolbar');

    // 초기 표시
    await waitFor(() => {
      expect(toolbar.style.getPropertyValue('--toolbar-opacity')).toBe('1');
    });

    // 수동 hide (글로벌 훅)
    (globalThis as any).__XEG_TEST_HIDE_TOOLBAR__();
    await Promise.resolve();
    await waitFor(() => {
      expect(toolbar.style.getPropertyValue('--toolbar-opacity')).toBe('0');
    });

    // top-edge fallback 트리거
    const event = new MouseEvent('mousemove', { clientY: 2 });
    window.dispatchEvent(event);
    await Promise.resolve();
    await waitFor(() => {
      expect(toolbar.style.getPropertyValue('--toolbar-opacity')).toBe('1');
    });
  });
});
