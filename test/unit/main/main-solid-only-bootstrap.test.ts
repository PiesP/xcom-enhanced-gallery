/**
 * @fileoverview Ensures Solid bootstrap is always initialized in Stage D baseline.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { importMainWithMocks } from '../../utils/helpers/import-main-with-mocks';
import { resetFeatureFlagOverrides } from '@/shared/config/feature-flags';

describe('main solid-only bootstrap', () => {
  afterEach(() => {
    resetFeatureFlagOverrides();
  });

  it('initializes and disposes Solid bootstrap regardless of feature overrides', async () => {
    const { main, solidBootstrap } = await importMainWithMocks();

    expect(solidBootstrap).toBeDefined();
    expect(solidBootstrap?.startMock).not.toHaveBeenCalled();
    expect(solidBootstrap?.disposeMock).not.toHaveBeenCalled();

    await main.start();

    expect(solidBootstrap?.startMock).toHaveBeenCalledTimes(1);
    expect(solidBootstrap?.disposeMock).not.toHaveBeenCalled();

    await main.start();

    expect(solidBootstrap?.startMock).toHaveBeenCalledTimes(1);

    await main.cleanup();

    expect(solidBootstrap?.disposeMock).toHaveBeenCalledTimes(1);
  });
});
