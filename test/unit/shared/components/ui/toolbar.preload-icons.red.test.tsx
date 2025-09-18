import { describe, it, expect } from 'vitest';
import { getPreact } from '@shared/external/vendors';
import { IconButton } from '@shared/components/ui';
import { preloadCommonIcons, resetIconRegistry } from '@shared/services/iconRegistry';

// [ICN-R3][GREEN] hybrid preload: preloadCommonIcons 실행 후 첫 렌더에서 placeholder 없이 즉시 아이콘이 나타나야 한다.
// LazyIcon이 registry.getLoadedIconSync를 통해 즉시 컴포넌트를 획득할 수 있어야 한다.

describe('[ICN-R3] hybrid preload immediate render', () => {
  it('preloadCommonIcons 이후 첫 IconButton(iconName) 렌더는 placeholder 없이 실제 아이콘이어야 한다', async () => {
    resetIconRegistry();
    await preloadCommonIcons();
    const { h, render } = getPreact();
    const doc = (globalThis as any).document as any;
    const host = doc.createElement('div');
    doc.body.appendChild(host);

    render(h(IconButton as any, { iconName: 'ChevronLeft', 'aria-label': '이전' }), host);

    // 성공 조건: data-xeg-icon-loading placeholder가 존재하지 않아야 함
    const placeholder = host.querySelector('[data-xeg-icon-loading="true"]');
    expect(placeholder).toBeNull();
  });
});
