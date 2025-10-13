import { expect, test } from '@playwright/test';
import { ensureHarness } from './utils';

test.describe('KeyboardHelpOverlay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank');
    await ensureHarness(page);
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) return;
      try {
        await harness.disposeKeyboardOverlay();
      } catch {
        /* ignore */
      }
    });
  });

  test('mounts and displays keyboard overlay', async ({ page }) => {
    // 첫 번째 마운트
    const containerId = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      const result = await harness.mountKeyboardOverlay();
      return result.containerId;
    });

    const dialog = page.locator(`#${containerId}`).getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 접근성 속성 확인
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('aria-labelledby', 'xeg-kho-title');
    await expect(dialog).toHaveAttribute('aria-describedby', 'xeg-kho-desc');

    // 닫기 버튼 존재 확인
    const closeButton = page.locator(`#${containerId}`).getByTestId('kho-close-button');
    await expect(closeButton).toBeVisible();

    // Dispose로 제거
    await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      await harness.disposeKeyboardOverlay();
    });

    // 컨테이너 자체가 제거되었는지 확인
    const containerExists = await page.locator(`#${containerId}`).count();
    expect(containerExists).toBe(0);

    // 다시 마운트 가능한지 확인
    const containerId2 = await page.evaluate(async () => {
      const harness = window.__XEG_HARNESS__;
      if (!harness) throw new Error('Harness not available');
      const result = await harness.mountKeyboardOverlay();
      return result.containerId;
    });

    const dialog2 = page.locator(`#${containerId2}`).getByRole('dialog');
    await expect(dialog2).toBeVisible();
  });
});

// TODO Phase 49: Restore SettingsModal E2E tests with Toolbar expandable panel harness
// test.describe('SettingsModal', () => {
//   test.beforeEach(async ({ page }) => {
//     await page.goto('about:blank');
//     await ensureHarness(page);
//   });
//
//   test.afterEach(async ({ page }) => {
//     await page.evaluate(async () => {
//       const harness = window.__XEG_HARNESS__;
//       if (!harness) return;
//       try {
//         await harness.disposeSettingsModal();
//       } catch {
//         /* ignore */
//       }
//     });
//   });
//
//   test('focus management and close handlers', async ({ page }) => {
//     const containerId = await page.evaluate(async () => {
//       const harness = window.__XEG_HARNESS__;
//       if (!harness) throw new Error('Harness not available');
//       const result = await harness.mountSettingsModal(true);
//       return result.containerId;
//     });
//
//     const closeButton = page.locator(`#${containerId}`).getByLabel('Close');
//     await expect(closeButton).toBeVisible();
//     await expect(closeButton).toBeFocused();
//
//     const dialog = page.locator(`#${containerId}`).getByRole('document');
//     await dialog.press('Escape');
//
//     const stateAfterEsc = await page.evaluate(async () => {
//       const harness = window.__XEG_HARNESS__;
//       if (!harness) throw new Error('Harness not available');
//       return harness.getSettingsModalState();
//     });
//
//     expect(stateAfterEsc.closeCalls).toBeGreaterThanOrEqual(1);
//
//     await page.evaluate(async () => {
//       const harness = window.__XEG_HARNESS__;
//       if (!harness) throw new Error('Harness not available');
//       await harness.setSettingsModalOpen(true);
//     });
//
//     await expect(closeButton).toBeFocused();
//
//     const backdrop = page.locator(`#${containerId}`).getByRole('dialog');
//     await backdrop.click();
//
//     const stateAfterBackdrop = await page.evaluate(async () => {
//       const harness = window.__XEG_HARNESS__;
//       if (!harness) throw new Error('Harness not available');
//       return harness.getSettingsModalState();
//     });
//
//     expect(stateAfterBackdrop.closeCalls).toBeGreaterThanOrEqual(2);
//   });
// });
