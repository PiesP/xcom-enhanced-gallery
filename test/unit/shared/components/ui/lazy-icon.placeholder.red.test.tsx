import { describe, it, expect } from 'vitest';
import { LazyIcon } from '@shared/components/LazyIcon';

// [ICN-R2][RED] LazyIcon은 기본 placeholder에 표준 data 속성과 aria-label을 제공해야 한다.
// 현재 구현은 data-xeg-icon-loading, role, aria-busy 등을 제공하지 않으므로 RED.

describe('[ICN-R2][RED] LazyIcon placeholder semantics', () => {
  it('기본 fallback 없음일 때 표준 placeholder data 속성/접근성 속성을 제공해야 한다', () => {
    const vnode = LazyIcon({ name: 'ChevronLeft' });
    // LazyIcon은 placeholder div VNode를 직접 반환해야 한다.
    const props: any = (vnode as any).props || {};
    // 기대: data-xeg-icon-loading="true"
    expect(props['data-xeg-icon-loading']).toBe('true');
    expect(props['data-testid']).toBe('lazy-icon-loading');
    expect(props['aria-label']).toMatch(/로딩/);
    // 추가: role=img 또는 progress semantics (우린 role=img 채택 예정)
    expect(props['role']).toBe('img');
    // busy 표시
    expect(props['aria-busy']).toBe('true');
  });
});
