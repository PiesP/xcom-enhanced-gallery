// Safe document accessor (jsdom or browser)
function getDoc(): Document | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof document !== 'undefined') return document;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any)?.document || null;
}
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/preact';
import { getPreact, initializeVendors } from '@shared/external/vendors';
import { ToolbarWithSettings } from '../../../src/shared/components/ui/ToolbarWithSettings/ToolbarWithSettings';

const baseToolbarProps = {
  currentIndex: 0,
  totalCount: 1,
  onPrevious: () => {},
  onNext: () => {},
  onDownloadCurrent: () => {},
  onDownloadAll: () => {},
  onClose: () => {},
};

// TODO: jsdom 환경에서 focus 관리가 안정화되면 describe.skip 제거 후 재활성화
describe.skip('SettingsModal Accessibility (focus management)', () => {
  beforeEach(() => {
    initializeVendors();
    const d = getDoc();
    if (d) d.body.innerHTML = '';
  });

  it('설정 버튼 클릭 시 테마 select 렌더되어야 한다 (구조 검증)', async () => {
    const { container } = render(getPreact().h(ToolbarWithSettings, { ...baseToolbarProps }));
    const settingsButton = container.querySelector('button[aria-label="설정 열기"]');
    expect(settingsButton).toBeTruthy();
    if (!settingsButton) return;
    fireEvent.click(settingsButton);
    await waitFor(() => expect(container.querySelector('#xeg-theme-select')).toBeTruthy());
  });

  it('Esc 누르면 패널이 닫혀야 한다 (구조 검증)', async () => {
    const { container } = render(getPreact().h(ToolbarWithSettings, { ...baseToolbarProps }));
    const settingsButton = container.querySelector('button[aria-label="설정 열기"]');
    expect(settingsButton).toBeTruthy();
    if (!settingsButton) return;
    fireEvent.click(settingsButton);
    const panel = container.querySelector('[role="dialog"]');
    expect(panel).toBeTruthy();
    const d = getDoc();
    if (d) fireEvent.keyDown(d, { key: 'Escape' });
    await waitFor(() => expect(container.querySelector('[role="dialog"]')).toBeFalsy());
  });
});
