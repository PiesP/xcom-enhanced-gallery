import { describe, it, expect, beforeEach } from 'vitest';

import { isGalleryInternalElement, isGalleryContainer, canTriggerGallery } from '@/shared/utils';
import { galleryState } from '@/shared/state/signals/gallery.signals';

function resetDom() {
  document.body.innerHTML = '';
}

function createContainer(kind: 'class' | 'data'): HTMLElement {
  const div = document.createElement('div');
  if (kind === 'class') {
    div.className = 'xeg-gallery-container';
  } else {
    div.setAttribute('data-xeg-gallery-container', '');
  }
  document.body.appendChild(div);
  return div;
}

describe('gallery selector contracts', () => {
  beforeEach(() => {
    resetDom();
    // reset state
    galleryState.value = { ...galleryState.value, isOpen: false };
  });

  it('isGalleryContainer detects .xeg-gallery-container', () => {
    const el = createContainer('class');
    expect(isGalleryContainer(el)).toBe(true);
  });

  it('isGalleryInternalElement detects within container (class)', () => {
    const root = createContainer('class');
    const child = document.createElement('div');
    root.appendChild(child);
    expect(isGalleryInternalElement(child)).toBe(true);
  });

  it('works with [data-xeg-gallery-container]', () => {
    const root = createContainer('data');
    const child = document.createElement('button');
    root.appendChild(child);
    expect(isGalleryContainer(root as HTMLElement)).toBe(true);
    expect(isGalleryInternalElement(child as HTMLElement)).toBe(true);
  });

  it('canTriggerGallery is false when clicking inside container and state closed', () => {
    const root = createContainer('class');
    const child = document.createElement('span');
    root.appendChild(child);
    galleryState.value = { ...galleryState.value, isOpen: false };
    expect(canTriggerGallery(child)).toBe(false);
  });

  it('canTriggerGallery is false when gallery already open', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    galleryState.value = { ...galleryState.value, isOpen: true };
    expect(canTriggerGallery(el)).toBe(false);
  });
});
