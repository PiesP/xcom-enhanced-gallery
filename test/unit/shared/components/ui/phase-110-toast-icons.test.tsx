/**
 * @fileoverview Phase 110.2 regression: verify toast requests are delegated to Tampermonkey notifications.
 * @phase 110.2
 * @priority High
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import { ToastManager } from '@shared/services/unified-toast-manager';
import { NotificationService } from '@shared/services/notification-service';

vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Phase 110.2: Toast delegation to NotificationService', () => {
  setupGlobalTestIsolation();

  let manager: ToastManager;
  let showMock: ReturnType<typeof vi.fn>;
  let getInstanceSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    showMock = vi.fn().mockResolvedValue(undefined);
    getInstanceSpy = vi
      .spyOn(NotificationService, 'getInstance')
      .mockReturnValue({ show: showMock } as unknown as NotificationService);

    ToastManager.resetInstance();
    manager = ToastManager.getInstance();
  });

  afterEach(() => {
    getInstanceSpy.mockRestore();
    ToastManager.resetInstance();
    vi.clearAllMocks();
  });

  it('delegates toast display to NotificationService.show', () => {
    const onAction = vi.fn();

    const id = manager.show({
      title: 'Download complete',
      message: 'All files saved.',
      duration: 2500,
      onAction,
    });

    expect(id).toMatch(/^toast_\d+_\d+$/);
    expect(showMock).toHaveBeenCalledTimes(1);
    expect(showMock).toHaveBeenCalledWith({
      title: 'Download complete',
      text: 'All files saved.',
      timeout: 2500,
      onclick: onAction,
    });
  });

  it('maps helper shortcuts to NotificationService.show', () => {
    manager.success('Success', 'Finished.');
    manager.error('Error', 'Something failed.');

    expect(showMock).toHaveBeenNthCalledWith(1, {
      title: 'Success',
      text: 'Finished.',
    });
    expect(showMock).toHaveBeenNthCalledWith(2, {
      title: 'Error',
      text: 'Something failed.',
    });
  });

  it('ignores deprecated route option while delegating to NotificationService', () => {
    expect(() =>
      manager.show({
        title: 'Route test',
        message: 'Route option is ignored.',
        route: 'both',
      })
    ).not.toThrow();

    expect(showMock).toHaveBeenLastCalledWith({
      title: 'Route test',
      text: 'Route option is ignored.',
    });
  });
});
