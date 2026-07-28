import { describe, expect, it, vi } from 'vitest';

const { getTypedSettingOr, setTimer } = vi.hoisted(() => ({
  getTypedSettingOr: vi.fn(() => 0),
  setTimer: vi.fn(),
}));

vi.mock('solid-js', async () => vi.importActual('solid-js/dist/solid.js'));
vi.mock('@shared/container/settings-registry', () => ({ getTypedSettingOr }));
vi.mock('@shared/hooks/use-timer', () => ({
  createTimeout: () => ({ set: setTimer }),
}));

import { useToolbarAutoHide } from '@features/gallery/components/vertical-gallery-view/hooks/use-toolbar-auto-hide';
import { type Accessor, createRoot } from 'solid-js';

describe('useToolbarAutoHide', () => {
  it('keeps the toolbar visible without scheduling a timer when auto-hide is disabled', async () => {
    let visible: Accessor<boolean> = () => false;
    const dispose = createRoot((rootDispose) => {
      const result = useToolbarAutoHide({ isVisible: () => true, hasItems: () => true });
      visible = result.isInitialToolbarVisible;
      return rootDispose;
    });

    await Promise.resolve();

    expect(visible()).toBe(true);
    expect(setTimer).not.toHaveBeenCalled();
    dispose();
  });
});
