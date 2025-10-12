import { describe, it, expect, vi } from 'vitest';

import {
  KeyboardNavigator,
  keyboardNavigator,
} from '../../../../src/shared/services/input/keyboard-navigator';

// Basic contract tests for KeyboardNavigator service

describe('KeyboardNavigator service', () => {
  it('invokes onEscape for Escape key and ignores editable targets', () => {
    const onEscape = vi.fn();

    const unsubscribe = keyboardNavigator.subscribe({ onEscape });

    const target = document.createElement('div');
    document.body.appendChild(target);
    const EvtCtor: any = (window as any).KeyboardEvent || (globalThis as any).KeyboardEvent;
    const evt = new EvtCtor('keydown', { key: 'Escape', bubbles: true });
    target.dispatchEvent(evt);

    expect(onEscape).toHaveBeenCalledTimes(1);

    // Editable should be ignored
    const input = document.createElement('input');
    document.body.appendChild(input);
    const evt2 = new EvtCtor('keydown', { key: 'Escape', bubbles: true });
    input.dispatchEvent(evt2);
    expect(onEscape).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('invokes onHelp for Shift+/? variants', () => {
    const onHelp = vi.fn();
    const unsubscribe = KeyboardNavigator.getInstance().subscribe({ onHelp });

    const EvtCtor: any = (window as any).KeyboardEvent || (globalThis as any).KeyboardEvent;
    const e1 = new EvtCtor('keydown', { key: '?', bubbles: true });
    document.dispatchEvent(e1);

    const e2 = new EvtCtor('keydown', { key: '/', shiftKey: true, bubbles: true });
    document.dispatchEvent(e2);

    expect(onHelp).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});
