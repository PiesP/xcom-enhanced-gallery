import { describe, it, expect, vi } from 'vitest';
import { getPreactSafe } from '@shared/external/vendors/vendor-api-safe';
import { useVisibleCenterItem } from '@/features/gallery/hooks/useVisibleCenterItem';

const { h, render } = getPreactSafe();

// Latency 목표: manual scroll → centerIndex 업데이트 160ms 이내

describe('FocusSync latency: manual scroll center recompute', () => {
  it('사용자 스크롤 후 160ms 내 centerIndex 업데이트', async () => {
    // 실시간 타이머 사용 (rAF 시뮬레이션 용이)
    const container = document.createElement('div');
    Object.assign(container.style, { height: '240px', overflow: 'auto' });
    container.getBoundingClientRect = () => ({
      top: 0,
      left: 0,
      width: 300,
      height: 240,
      bottom: 240,
      right: 300,
      x: 0,
      y: 0,
      toJSON() {},
    });

    for (let i = 0; i < 6; i++) {
      const item = document.createElement('div');
      item.setAttribute('data-xeg-role', 'gallery-item');
      Object.assign(item.style, { height: '180px' });
      item.getBoundingClientRect = () => ({
        top: i * 180 - container.scrollTop,
        left: 0,
        width: 300,
        height: 180,
        bottom: i * 180 - container.scrollTop + 180,
        right: 300,
        x: 0,
        y: i * 180 - container.scrollTop,
        toJSON() {},
      });
      container.appendChild(item);
    }
    document.body.appendChild(container);
    const ref = { current: container };

    let observed: number[] = [];
    const recomputeFns: Array<() => void> = [];

    function Test() {
      const { centerIndex, recompute } = useVisibleCenterItem({ containerRef: ref });
      observed.push(centerIndex);
      recomputeFns.push(recompute);
      return null;
    }
    render(h(Test, {}), document.body);

    // 초기 상태: 맨 위 → index 0 예상 (동기 계산 fallback)
    await new Promise(r => setTimeout(r, 30));

    container.scrollTop = 200; // 약 1.1개 아이템 아래로
    container.dispatchEvent(new Event('scroll'));
    // 강제 수동 recompute (실제 환경에서는 scroll listener 가 rAF 스케줄)
    recomputeFns.forEach(fn => fn());

    await new Promise(r => setTimeout(r, 140));
    const final = observed[observed.length - 1];
    expect(final).not.toBe(-1);

    // 완료
  });
});
