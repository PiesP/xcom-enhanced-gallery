/**
 * @fileoverview Ensures Solid toast host is mounted by default in Stage D baseline.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { importMainWithMocks } from '../../utils/helpers/import-main-with-mocks';
import { resetFeatureFlagOverrides } from '@/shared/config/feature-flags';

let addEventSpy: ReturnType<typeof vi.spyOn> | undefined;
let removeEventSpy: ReturnType<typeof vi.spyOn> | undefined;

describe('main toast host default path', () => {
  afterEach(() => {
    resetFeatureFlagOverrides();
    vi.unstubAllEnvs();
    addEventSpy?.mockRestore();
    removeEventSpy?.mockRestore();
    addEventSpy = undefined;
    removeEventSpy = undefined;
  });

  it('mounts the Solid toast host by default', async () => {
    const { main, addEventSpy: addSpy, removeEventSpy: removeSpy } = await importMainWithMocks();

    addEventSpy = addSpy;
    removeEventSpy = removeSpy;

    const renderSolidHostSpy = vi.fn(() => ({ dispose: vi.fn() }));
    vi.doMock('@features/notifications/solid/renderSolidToastHost', () => ({
      renderSolidToastHost: renderSolidHostSpy,
    }));

    vi.stubEnv('MODE', 'development');
    vi.stubEnv('DEV', 'true');

    const { legacyPreact } = await import('@/shared/external/vendors');
    const getPreactMock = vi.mocked(legacyPreact.getPreact);

    expect(getPreactMock).not.toHaveBeenCalled();
    expect(renderSolidHostSpy).not.toHaveBeenCalled();

    await main.start();

    expect(getPreactMock).not.toHaveBeenCalled();
    expect(renderSolidHostSpy).toHaveBeenCalledTimes(1);

    const toastContainer = document.getElementById('xeg-toast-container');
    expect(toastContainer).toBeInstanceOf(HTMLElement);

    await main.cleanup();
    const disposeMock = renderSolidHostSpy.mock.results[0]?.value?.dispose as
      | ReturnType<typeof vi.fn>
      | undefined;
    if (disposeMock) {
      expect(disposeMock).toHaveBeenCalledTimes(1);
    }
  });
});
