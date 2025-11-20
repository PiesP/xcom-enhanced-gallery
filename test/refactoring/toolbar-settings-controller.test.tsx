/**
 * @fileoverview Phase 75: Toolbar settings controller hook TDD (RED)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { EventManager } from '../../src/shared/services/event-manager';
import { getSolid } from '../../src/shared/external/vendors';
import type { UseToolbarSettingsControllerOptions } from '../../src/shared/hooks/toolbar/use-toolbar-settings-controller';
import { useToolbarSettingsController } from '../../src/shared/hooks/toolbar/use-toolbar-settings-controller';

interface FakeListener {
  readonly id: string;
  readonly element:
    | (globalThis.EventTarget & {
        removeEventListener: typeof window.removeEventListener;
      })
    | null;
  readonly type: string;
  readonly listener: globalThis.EventListener;
}

const solid = getSolid();

let originalRequestAnimationFrame: typeof window.requestAnimationFrame | undefined;
let originalCancelAnimationFrame: typeof window.cancelAnimationFrame | undefined;

function createFakeEventManager(): Pick<EventManager, 'addListener' | 'removeListener'> {
  const listeners = new Map<string, FakeListener>();
  return {
    addListener(element, type, listener, options) {
      const id = `${listeners.size + 1}`;
      (
        element as globalThis.EventTarget & {
          addEventListener: typeof window.addEventListener;
        }
      ).addEventListener(type, listener, options);
      listeners.set(id, {
        id,
        element: element as
          | (globalThis.EventTarget & {
              removeEventListener: typeof window.removeEventListener;
            })
          | null,
        type,
        listener,
      });
      return id;
    },
    removeListener(id) {
      const entry = listeners.get(id);
      if (!entry || !entry.element) {
        return false;
      }
      entry.element.removeEventListener(entry.type, entry.listener);
      listeners.delete(id);
      return true;
    },
  };
}

function createOptions(
  initialExpanded = true,
  overrides: Partial<UseToolbarSettingsControllerOptions> = {}
) {
  const { createSignal } = solid;
  const [expanded, setExpanded] = createSignal(initialExpanded);
  const setSettingsExpanded = vi.fn((value: boolean) => {
    setExpanded(() => value);
  });
  const toggleSettingsExpanded = vi.fn(() => {
    setExpanded(prev => !prev);
  });

  const baseOptions: UseToolbarSettingsControllerOptions = {
    isSettingsExpanded: () => expanded(),
    setSettingsExpanded,
    toggleSettingsExpanded,
    documentRef: document,
    windowRef: window,
    eventManager: createFakeEventManager(),
    focusDelayMs: 0,
    selectChangeGuardMs: 300,
    ...overrides,
  };

  return { options: baseOptions, setSettingsExpanded, toggleSettingsExpanded };
}

interface ControllerMount {
  controller: ReturnType<typeof useToolbarSettingsController>;
  toolbar: globalThis.HTMLDivElement;
  panel: globalThis.HTMLDivElement;
  button: globalThis.HTMLButtonElement;
  select: globalThis.HTMLSelectElement;
  dispose: () => void;
}

function mountController(options: UseToolbarSettingsControllerOptions): ControllerMount {
  const toolbar = document.createElement('div');
  const panel = document.createElement('div');
  const button = document.createElement('button');
  button.id = 'settings-button';
  const select = document.createElement('select');
  panel.appendChild(select);

  document.body.append(toolbar, panel, button);

  let controller: ReturnType<typeof useToolbarSettingsController> | undefined;
  const disposeRoot = solid.createRoot(innerDispose => {
    controller = useToolbarSettingsController(options);
    controller.assignToolbarRef(toolbar);
    controller.assignSettingsButtonRef(button);
    controller.assignSettingsPanelRef(panel);
    return innerDispose;
  });

  if (!controller) {
    throw new Error('Toolbar settings controller failed to initialize');
  }

  return {
    controller,
    toolbar,
    panel,
    button,
    select,
    dispose: () => {
      disposeRoot();
      toolbar.remove();
      panel.remove();
      button.remove();
    },
  };
}

describe('useToolbarSettingsController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;
    window.requestAnimationFrame = ((callback: (time: number) => void) => {
      callback(0);
      return 0;
    }) as typeof window.requestAnimationFrame;
    window.cancelAnimationFrame = (() => {}) as typeof window.cancelAnimationFrame;
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
    if (originalRequestAnimationFrame) {
      window.requestAnimationFrame = originalRequestAnimationFrame;
    } else {
      delete (window as any).requestAnimationFrame;
    }

    if (originalCancelAnimationFrame) {
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    } else {
      delete (window as any).cancelAnimationFrame;
    }

    originalRequestAnimationFrame = undefined;
    originalCancelAnimationFrame = undefined;

    vi.useRealTimers();
  });

  it('closes the settings panel on outside click', () => {
    const { options, setSettingsExpanded } = createOptions(true);
    const mount = mountController(options);

    const outsideTarget = document.createElement('div');
    document.body.appendChild(outsideTarget);
    outsideTarget.dispatchEvent(new globalThis.MouseEvent('mousedown', { bubbles: true }));

    expect(setSettingsExpanded).toHaveBeenCalledWith(false);

    mount.dispose();
  });

  it('respects the select change guard before closing', () => {
    const { options, setSettingsExpanded } = createOptions(true);
    const mount = mountController(options);

    mount.select.dispatchEvent(new globalThis.Event('change', { bubbles: true }));

    const outsideTarget = document.createElement('div');
    document.body.appendChild(outsideTarget);
    outsideTarget.dispatchEvent(new globalThis.MouseEvent('mousedown', { bubbles: true }));

    expect(setSettingsExpanded).not.toHaveBeenCalled();

    vi.advanceTimersByTime(301);
    outsideTarget.dispatchEvent(new globalThis.MouseEvent('mousedown', { bubbles: true }));
    expect(setSettingsExpanded).toHaveBeenCalledWith(false);

    mount.dispose();
  });
});
