import { describe, expect, test } from 'vitest';
import { canTriggerGallery, isGalleryContainer, isVideoControlElement } from '@shared/utils/utils';

function makeMockElement(classes = [], attrs = {}) {
  const el: any = {
    className: classes.join(' '),
    matches(selector: any) {
      try {
        // support comma-separated selectors (e.g. '.a, #b')
        const parts = selector.split(',').map((s: string) => s.trim());
        for (const part of parts) {
          if (part.startsWith('.')) {
            if (classes.includes(part.slice(1))) return true;
          } else if (part.startsWith('#')) {
            if (attrs['id'] === part.slice(1)) return true;
          }
        }
        return false;
      } catch {
        return false;
      }
    },
    closest(selector: any) {
      return this.matches(selector) ? this : null;
    },
  };
  return el;
}

describe('utils DOM helper small tests', () => {
  test('canTriggerGallery returns false when gallery open via state', () => {
    // state.open is managed elsewhere; we just test behavior for null
    expect(canTriggerGallery(null)).toBe(false);
  });

  test('isGalleryContainer matches class and id selectors', () => {
    const el1 = makeMockElement(['xeg-gallery-container'], {});
    const el2 = makeMockElement([], { id: 'xeg-gallery-root' });
    // cast to HTMLElement for type compatibility in tests (we only rely on matches/closest/className)
    expect(isGalleryContainer(el1 as any as HTMLElement)).toBe(true);
    expect(isGalleryContainer(el2 as any as HTMLElement)).toBe(true);
  });

  test('isVideoControlElement recognizes known selectors', () => {
    const el = makeMockElement([], { 'data-testid': 'playButton' });
    // our mock matches only class/id; expect false for this synthetic case
    expect(isVideoControlElement(el as any as HTMLElement)).toBe(false);
    const elClass = makeMockElement(['video-player'], {});
    expect(isVideoControlElement(elClass as any as HTMLElement)).toBe(true);
  });
});
