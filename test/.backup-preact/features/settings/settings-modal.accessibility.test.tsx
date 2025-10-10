/**
 * Settings 모달 접근성 테스트 (포커스 관리)
 * Solid 테스트 유틸을 사용하여 ToolbarWithSettings 렌더링을 검증합니다.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, waitFor } from '../../utils/testing-library';
import { initializeVendors } from '@shared/external/vendors';
import { ToolbarWithSettings } from '@shared/components/ui/ToolbarWithSettings/ToolbarWithSettings';

const baseToolbarProps = {
  currentIndex: 0,
  totalCount: 1,
  onPrevious: () => {},
  onNext: () => {},
  onDownloadCurrent: () => {},
  onDownloadAll: () => {},
  onClose: () => {},
};

type DocumentLike = typeof globalThis extends { document: infer D } ? D | null : null;

function getDoc(): DocumentLike {
  if (typeof document !== 'undefined') {
    return document as DocumentLike;
  }

  return (globalThis as { document?: DocumentLike }).document ?? null;
}

// TODO: jsdom 환경에서 focus 관리가 안정화되면 describe.skip 제거 후 재활성화
describe.skip('SettingsModal Accessibility (focus management)', () => {
  beforeEach(() => {
    initializeVendors();
    const doc = getDoc();
    if (doc) {
      doc.body.innerHTML = '';
    }
  });

  it('설정 버튼 클릭 시 테마 select 렌더되어야 한다 (구조 검증)', async () => {
    const { container } = render(() => <ToolbarWithSettings {...baseToolbarProps} />);
    const settingsButton = container.querySelector('button[aria-label="설정 열기"]');
    expect(settingsButton).toBeTruthy();
    if (!settingsButton) return;

    fireEvent.click(settingsButton);

    await waitFor(() => expect(container.querySelector('#xeg-theme-select')).toBeTruthy());
  });

  it('Esc 누르면 패널이 닫혀야 한다 (구조 검증)', async () => {
    const { container } = render(() => <ToolbarWithSettings {...baseToolbarProps} />);
    const settingsButton = container.querySelector('button[aria-label="설정 열기"]');
    expect(settingsButton).toBeTruthy();
    if (!settingsButton) return;

    fireEvent.click(settingsButton);

    const panel = container.querySelector('[role="dialog"]');
    expect(panel).toBeTruthy();

    const doc = getDoc();
    if (doc) {
      fireEvent.keyDown(doc, { key: 'Escape' });
    }

    await waitFor(() => expect(container.querySelector('[role="dialog"]')).toBeFalsy());
  });
});
