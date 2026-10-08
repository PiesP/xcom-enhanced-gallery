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

  it('does not retain or consume a page-synthetic eligible click during startup', async () => {
    const image = document.createElement('img');
    document.body.append(image);
    const downstream = vi.fn();
    document.body.addEventListener('click', downstream);
    const gate = installEarlyMediaClickReplay(document);
    const resume = vi.fn(async () => undefined);
    const earlyClick = new MouseEvent('click', { bubbles: true, cancelable: true, composed: true });

    image.dispatchEvent(earlyClick);

    expect(earlyClick.defaultPrevented).toBe(false);
    expect(downstream).toHaveBeenCalledOnce();

    await gate.complete(resume);

    expect(downstream).toHaveBeenCalledTimes(1);
    expect(resume).not.toHaveBeenCalled();
    gate.dispose();
  });

  it('does not intercept ineligible clicks or resume after disposal', async () => {
    state.processable = false;
    const button = document.createElement('button');
    document.body.append(button);
    const downstream = vi.fn();
    document.body.addEventListener('click', downstream);
    const gate = installEarlyMediaClickReplay(document);

    button.click();
    gate.dispose();
    const resume = vi.fn(async () => undefined);
    await gate.complete(resume);

    expect(downstream).toHaveBeenCalledTimes(1);
    expect(resume).not.toHaveBeenCalled();
  });
});
