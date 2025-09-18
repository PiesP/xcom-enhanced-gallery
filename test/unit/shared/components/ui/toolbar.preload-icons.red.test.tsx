import { describe, it, expect } from 'vitest';
import { getPreact } from '@shared/external/vendors';
import { IconButton } from '@shared/components/ui';
import { preloadCommonIcons, resetIconRegistry } from '@shared/services/iconRegistry';

// [ICN-R3][RED] Preload 호출 후 첫 렌더에서 placeholder 없이 바로 아이콘 컴포넌트가 나와야 한다.
// 현재 LazyIcon은 동적 로딩 구현이 없어 placeholder만 반환 -> 이 테스트는 실패해야 함.

describe('[ICN-R3][RED] hybrid preload immediate render', () => {
  it('preloadCommonIcons 수행 후 첫 IconButton(iconName) 렌더 시 placeholder가 아닌 실제 아이콘이어야 한다', async () => {
    resetIconRegistry();
    await preloadCommonIcons();
    const { h, render } = getPreact();
    const doc = (globalThis as any).document as any;
    const host = doc.createElement('div');
    doc.body.appendChild(host);

    render(h(IconButton as any, { iconName: 'ChevronLeft', 'aria-label': '이전' }), host);

    // 현재 구현: LazyIcon은 항상 placeholder div를 반환 → 아래 쿼리가 요소를 찾음
    // 기대(GREEN 시점): preload 된 아이콘은 즉시 실제 SVG 컴포넌트이므로 data-xeg-icon-loading 요소가 없어야 함
    const placeholder = host.querySelector('[data-xeg-icon-loading="true"]');
    expect(placeholder).toBeNull(); // RED: 지금은 placeholder가 존재하므로 실패해야 한다
  });
});
