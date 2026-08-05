// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ processable: true }));

vi.mock('@shared/utils/media/media-click-detector', () => ({
  isProcessableMedia: () => state.processable,
}));

import { installEarlyMediaClickReplay } from '@extension/content-readiness';

describe('extension content readiness', () => {
  beforeEach(() => {
    state.processable = true;
    document.body.replaceChildren();
  });

  it('holds the first eligible click until the gallery listener is ready', () => {
    const image = document.createElement('img');
    document.body.append(image);
    const downstream = vi.fn();
    document.body.addEventListener('click', downstream);
    const gate = installEarlyMediaClickReplay(document);
    const earlyClick = new MouseEvent('click', { bubbles: true, cancelable: true, composed: true });

    image.dispatchEvent(earlyClick);

    expect(earlyClick.defaultPrevented).toBe(true);
    expect(downstream).not.toHaveBeenCalled();

    gate.complete();

    expect(downstream).toHaveBeenCalledTimes(1);
    gate.dispose();
  });

  it('does not intercept ineligible clicks or replay after disposal', () => {
    state.processable = false;
    const button = document.createElement('button');
    document.body.append(button);
    const downstream = vi.fn();
    document.body.addEventListener('click', downstream);
    const gate = installEarlyMediaClickReplay(document);

    button.click();
    gate.dispose();
    gate.complete();

    expect(downstream).toHaveBeenCalledTimes(1);
  });
});
