/**
 * @fileoverview Solid bootstrap parity checks for FRAME-ALT-001 Stage B.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { importMainWithMocks } from '../../utils/helpers/import-main-with-mocks';
import { resetFeatureFlagOverrides } from '@/shared/config/feature-flags';

let addEventSpy: ReturnType<typeof vi.spyOn> | undefined;
let removeEventSpy: ReturnType<typeof vi.spyOn> | undefined;

describe('main solid bootstrap integration', () => {
  afterEach(() => {
    resetFeatureFlagOverrides();
    addEventSpy?.mockRestore();
    removeEventSpy?.mockRestore();
    addEventSpy = undefined;
    removeEventSpy = undefined;
  });

  it('initializes Solid bootstrap once and disposes on cleanup', async () => {
    const {
      main,
      solidBootstrap,
      addEventSpy: addSpy,
      removeEventSpy: removeSpy,
    } = await importMainWithMocks();

    addEventSpy = addSpy;
    removeEventSpy = removeSpy;

    expect(solidBootstrap).toBeDefined();
    expect(solidBootstrap?.startMock).not.toHaveBeenCalled();

    await main.start();

    expect(solidBootstrap?.startMock).toHaveBeenCalledTimes(1);
    expect(solidBootstrap?.disposeMock).not.toHaveBeenCalled();

    await main.start();

    expect(solidBootstrap?.startMock).toHaveBeenCalledTimes(1);

    await main.cleanup();

    expect(solidBootstrap?.disposeMock).toHaveBeenCalledTimes(1);
  });
});
