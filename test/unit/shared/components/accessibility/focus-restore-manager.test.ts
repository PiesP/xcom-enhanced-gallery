import { describe, it, expect, beforeEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import { beginFocusScope } from '@/shared/utils/accessibility/focus-restore-manager';

function createButton(id: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.id = id;
  btn.textContent = id;
  document.body.appendChild(btn);
  return btn;
}

describe('[a11y] FocusRestoreManager – 포커스 복원', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('스코프 해제 시 원래 포커스가 복원된다', () => {
    const origin = createButton('origin');
    origin.focus();
    expect(document.activeElement).toBe(origin);

    const restore = beginFocusScope();

    const inner = createButton('inner');
    inner.focus();
    expect(document.activeElement).toBe(inner);

    restore();
    expect(document.activeElement).toBe(origin);
  });

  it('원래 포커스 요소 제거 후 복원 시 안전하게 body/html로 fallback', () => {
    const origin = createButton('origin');
    origin.focus();
    const restore = beginFocusScope();
    const inner = createButton('inner');
    inner.focus();
    origin.remove();
    restore();
    expect([document.body, document.documentElement]).toContain(document.activeElement);
  });
});
