// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { animateGalleryEnter, animateGalleryExit } from '@shared/utils/css/css-animations';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

const styleText = `
  @keyframes xeg-fade-in { from { opacity: 0 } to { opacity: 1 } }
  @keyframes xeg-fade-out { from { opacity: 1 } to { opacity: 0 } }
  @keyframes unrelated-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
  .xeg-fade-in { animation: xeg-fade-in 40ms linear; }
  .xeg-fade-out { animation: xeg-fade-out 40ms linear; }
  .unrelated { animation: unrelated-spin 1s linear infinite; }
`;

describe('gallery CSS animation completion', () => {
  let host: HTMLDivElement;
  let style: HTMLStyleElement;

  beforeEach(() => {
    style = document.createElement('style');
    style.textContent = styleText;
    document.head.append(style);
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => {
    host.remove();
    style.remove();
  });

  it('waits for its own finite animation and ignores an infinite descendant', async () => {
    const child = document.createElement('span');
    child.className = 'unrelated';
    host.append(child);
    let settled = false;
    const finished = animateGalleryEnter(host).then(() => {
      settled = true;
    });
    expect(
      host
        .getAnimations()
        .some(
          (animation) =>
            animation instanceof CSSAnimation && animation.animationName === 'xeg-fade-in'
        )
    ).toBe(true);
    await Promise.resolve();
    expect(settled).toBe(false);
    await finished;
    expect(host.classList.contains('xeg-fade-in')).toBe(false);
    expect(child.getAnimations().some((animation) => animation.playState === 'running')).toBe(true);
  });

  it('settles cancellation without removing a newer animation class', async () => {
    const enter = animateGalleryEnter(host);
    expect(host.classList.contains('xeg-fade-in')).toBe(true);
    const exit = animateGalleryExit(host);
    await Promise.all([enter, exit]);
    expect(host.classList.contains('xeg-fade-in')).toBe(false);
    expect(host.classList.contains('xeg-fade-out')).toBe(false);
  });

  it('settles detached and no-animation elements', async () => {
    host.style.animation = 'none';
    await animateGalleryEnter(host);
    expect(host.classList.contains('xeg-fade-in')).toBe(false);
    host.style.removeProperty('animation');
    const exiting = animateGalleryExit(host);
    host.remove();
    await exiting;
    expect(host.classList.contains('xeg-fade-out')).toBe(false);
  });
});
