/**
 * @fileoverview Tests for useToolbarAutoHide hook
 */

import { useToolbarAutoHide, type UseToolbarAutoHideResult } from '@features/gallery/components/vertical-gallery-view/hooks/useToolbarAutoHide';
import { getSetting } from '@shared/container/settings-access';
import { globalTimerManager } from '@shared/utils/time/timer-management';
import { createRoot, createSignal } from 'solid-js';

vi.mock('@shared/container/settings-access', () => ({
  getSetting: vi.fn(),
}));

vi.mock('@shared/external/vendors', async () => {
  const solid = await vi.importActual<typeof import('solid-js')>('solid-js');
  return {
    getSolid: () => solid,
  };
});

vi.mock('@shared/utils/time/timer-management', () => ({
  globalTimerManager: {
    setTimeout: vi.fn(),
    clearTimeout: vi.fn(),
  },
}));

type Mock = ReturnType<typeof vi.fn>;
const getSettingMock = getSetting as unknown as Mock;
const timerManagerMock = globalTimerManager as unknown as {
  setTimeout: Mock;
  clearTimeout: Mock;
};

const createHookInstance = (options: Parameters<typeof useToolbarAutoHide>[0]) => {
  let hookResult: UseToolbarAutoHideResult | undefined;
  let cleanup: () => void = () => {};

  createRoot(dispose => {
    cleanup = dispose;
    hookResult = useToolbarAutoHide(options);
  });

  if (!hookResult) {
    throw new Error('Failed to mount useToolbarAutoHide');
  }

  return {
    result: hookResult,
    dispose: () => cleanup(),
  };
};

describe('useToolbarAutoHide', () => {
  beforeEach(() => {
    getSettingMock.mockReturnValue(3000);
    timerManagerMock.setTimeout.mockReset();
    timerManagerMock.clearTimeout.mockReset();
    timerManagerMock.setTimeout.mockReturnValue(1);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes toolbar as visible when gallery is ready', async () => {
    const { result, dispose } = createHookInstance({
      isVisible: () => true,
      hasItems: () => true,
    });

    await Promise.resolve();

    expect(result.isInitialToolbarVisible()).toBe(true);
    expect(getSettingMock).toHaveBeenCalledWith('toolbar.autoHideDelay', 3000);
    dispose();
  });

  it('has default initial toolbar visible value set to true before effects run', () => {
    const { result, dispose } = createHookInstance({
      isVisible: () => true,
      hasItems: () => true,
    });

    // Do not await Promise.resolve(); check immediate default signal value
    expect(result.isInitialToolbarVisible()).toBe(true);
    dispose();
  });

  it('hides toolbar when gallery is not visible', async () => {
    const { result, dispose } = createHookInstance({
      isVisible: () => false,
      hasItems: () => true,
    });

    await Promise.resolve();

    expect(result.isInitialToolbarVisible()).toBe(false);
    expect(timerManagerMock.setTimeout).not.toHaveBeenCalled();
    dispose();
  });

  it('hides toolbar when there are no items', async () => {
    const { result, dispose } = createHookInstance({
      isVisible: () => true,
      hasItems: () => false,
    });

    await Promise.resolve();

    expect(result.isInitialToolbarVisible()).toBe(false);
    expect(timerManagerMock.setTimeout).not.toHaveBeenCalled();
    dispose();
  });

  it('supports manual visibility overrides', async () => {
    const { result, dispose } = createHookInstance({
      isVisible: () => true,
      hasItems: () => true,
    });

    await Promise.resolve();

    result.setIsInitialToolbarVisible(false);
    expect(result.isInitialToolbarVisible()).toBe(false);

    result.setIsInitialToolbarVisible(true);
    expect(result.isInitialToolbarVisible()).toBe(true);
    dispose();
  });

  it('auto hides after configured delay', async () => {
    const timerCallbacks: Array<() => void> = [];
    timerManagerMock.setTimeout.mockImplementation((callback, delay) => {
      expect(delay).toBe(1500);
      timerCallbacks.push(callback);
      return 42;
    });
    getSettingMock.mockReturnValueOnce(1500);

    const { result, dispose } = createHookInstance({
      isVisible: () => true,
      hasItems: () => true,
    });

    await Promise.resolve();

    expect(timerCallbacks).toHaveLength(1);
    expect(result.isInitialToolbarVisible()).toBe(true);

    timerCallbacks[0]!();
    expect(result.isInitialToolbarVisible()).toBe(false);

    dispose();
  });

  it('clears pending timers when disposed before completion', async () => {
    timerManagerMock.setTimeout.mockReturnValue(99);

    const { dispose } = createHookInstance({
      isVisible: () => true,
      hasItems: () => true,
    });

    await Promise.resolve();

    expect(timerManagerMock.setTimeout).toHaveBeenCalledTimes(1);
    expect(timerManagerMock.clearTimeout).not.toHaveBeenCalled();

    dispose();
    expect(timerManagerMock.clearTimeout).toHaveBeenCalledWith(99);
  });

  it('hides immediately when delay is zero without scheduling timers', async () => {
    getSettingMock.mockReturnValueOnce(0);

    const { result, dispose } = createHookInstance({
      isVisible: () => true,
      hasItems: () => true,
    });

    await Promise.resolve();

    expect(timerManagerMock.setTimeout).not.toHaveBeenCalled();
    expect(result.isInitialToolbarVisible()).toBe(false);
    dispose();
  });

  it('clears pending timers when items disappear mid-session', async () => {
    const timerCallbacks: Array<() => void> = [];
    timerManagerMock.setTimeout.mockImplementation(callback => {
      timerCallbacks.push(callback);
      return 77;
    });

    let result!: UseToolbarAutoHideResult;
    let setHasItems!: (value: boolean) => void;
    let disposeRoot: () => void = () => {};

    createRoot(dispose => {
      disposeRoot = dispose;
      const [hasItems, updateHasItems] = createSignal(true);
      setHasItems = updateHasItems;
      result = useToolbarAutoHide({
        isVisible: () => true,
        hasItems,
      });
    });

    await Promise.resolve();

    expect(timerCallbacks).toHaveLength(1);
    expect(result.isInitialToolbarVisible()).toBe(true);

    setHasItems(false);
    await Promise.resolve();

    expect(timerManagerMock.clearTimeout).toHaveBeenCalledWith(77);
    expect(result.isInitialToolbarVisible()).toBe(false);

    disposeRoot();
  });
});
