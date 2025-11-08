/**
 * Toast UI 제거 검증 테스트
 * @description Tampermonkey NotificationService 전환에 따라 Toast CSS가 비워졌는지 확인한다.
 */
import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { readFileSync } from 'node:fs';

const TOAST_CSS_PATH = 'src/shared/components/ui/Toast/Toast.module.css';
const TOAST_CONTAINER_CSS_PATH = 'src/shared/components/ui/Toast/ToastContainer.module.css';

describe('Toast Notification Migration', () => {
  setupGlobalTestIsolation();

  function read(path: string): string {
    return readFileSync(path, 'utf-8').trim();
  }

  it('Toast.module.css가 호환성 주석만 포함하고 있어야 함', () => {
    const toastCSS = read(TOAST_CSS_PATH);
    expect(toastCSS.startsWith('/* Phase 420: Toast UI removed')).toBe(true);
    expect(toastCSS.includes('@keyframes')).toBe(false);
  });

  it('ToastContainer.module.css도 주석만 포함해야 함', () => {
    const containerCSS = read(TOAST_CONTAINER_CSS_PATH);
    expect(containerCSS.startsWith('/* Phase 420: Toast container removed')).toBe(true);
    expect(containerCSS.includes('@keyframes')).toBe(false);
  });
});
