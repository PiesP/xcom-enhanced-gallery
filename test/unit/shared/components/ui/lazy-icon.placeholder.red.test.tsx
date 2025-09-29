import { describe, it, expect, beforeEach } from 'vitest';
import { render, cleanup } from '@solidjs/testing-library';
import { LazyIcon } from '@shared/components/LazyIcon';
import { resetIconRegistry } from '@shared/services/iconRegistry';

// [ICN-R2] LazyIcon placeholder는 표준 data/ARIA 속성을 제공해야 한다.

describe('[ICN-R2] LazyIcon placeholder semantics', () => {
  beforeEach(() => {
    cleanup();
    resetIconRegistry();
  });

  it('기본 fallback 없음일 때 표준 placeholder data 속성/접근성 속성을 제공해야 한다', () => {
    const { container } = render(() => <LazyIcon name='ChevronLeft' />);
    const placeholder = container.querySelector('[data-xeg-icon-loading="true"]');

    expect(placeholder).toBeTruthy();
    expect(placeholder?.getAttribute('data-testid')).toBe('lazy-icon-loading');
    expect(placeholder?.getAttribute('role')).toBe('img');
    expect(placeholder?.getAttribute('aria-busy')).toBe('true');
    expect(placeholder?.getAttribute('aria-label')).toMatch(/로딩/);
  });
});
