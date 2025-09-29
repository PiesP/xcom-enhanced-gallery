import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { waitFor } from '@test-utils/testing-library';
import { openGallery, closeGallery, setLoading } from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import { renderSolidGalleryShell } from '@/features/gallery/solid/renderSolidGalleryShell';

function createMediaFixture(id: string): MediaInfo {
  return {
    id,
    url: `https://pbs.twimg.com/media/${id}?format=jpg&name=orig`,
    filename: `${id}.jpg`,
    type: 'image',
  };
}

function getShadowContentHost(container: HTMLElement): Element {
  return container.shadowRoot?.querySelector('[data-xeg-shadow-content="true"]') ?? container;
}

function getSolidShellElement(container: HTMLElement): Element | null {
  return (
    container.shadowRoot?.querySelector('[data-xeg-solid-shell]') ??
    container.querySelector('[data-xeg-solid-shell]')
  );
}

describe('renderSolidGalleryShell', () => {
  let container: HTMLElement;
  const mediaItems = [createMediaFixture('AAA111'), createMediaFixture('BBB222')];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    closeGallery();
    container.remove();
  });

  it('reflects gallery open state via data attributes', async () => {
    const instance = renderSolidGalleryShell({
      container,
      onClose: vi.fn(),
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      onDownloadCurrent: vi.fn(),
      onDownloadAll: vi.fn(),
    });

    const getShell = () => getSolidShellElement(container);

    expect(getShell()).toBeTruthy();
    expect(getShell()?.getAttribute('data-open')).toBe('false');

    openGallery(mediaItems, 1);

    await waitFor(() => {
      expect(getShell()?.getAttribute('data-open')).toBe('true');
      const counter = getShadowContentHost(container).querySelector(
        '[data-gallery-element="counter"]'
      )?.textContent;
      expect(counter?.replace(/\s+/g, '')).toBe('2/2');
    });

    closeGallery();

    await waitFor(() => {
      expect(getShell()?.getAttribute('data-open')).toBe('false');
    });

    instance.dispose();
  });

  it('propagates toolbar events to provided callbacks', async () => {
    const onClose = vi.fn();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onDownloadCurrent = vi.fn();
    const onDownloadAll = vi.fn();

    const instance = renderSolidGalleryShell({
      container,
      onClose,
      onPrevious,
      onNext,
      onDownloadCurrent,
      onDownloadAll,
    });

    const click = (selector: string) => {
      const host = getShadowContentHost(container);
      const target = host.querySelector(selector);
      if (!target) {
        throw new Error(`expected element ${selector}`);
      }
      target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    };

    openGallery(mediaItems, 0);

    await waitFor(() => {
      expect(getSolidShellElement(container)?.getAttribute('data-open')).toBe('true');
    });

    click('[data-gallery-element="nav-next"]');
    click('[data-gallery-element="nav-previous"]');
    click('[data-gallery-element="download-current"]');
    click('[data-gallery-element="download-all"]');
    click('[data-gallery-element="close"]');

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onDownloadCurrent).toHaveBeenCalledTimes(1);
    expect(onDownloadAll).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    instance.dispose();
  });

  it('disables download actions while gallery loading flag is active', async () => {
    const onDownloadCurrent = vi.fn();
    const onDownloadAll = vi.fn();

    const instance = renderSolidGalleryShell({
      container,
      onClose: vi.fn(),
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      onDownloadCurrent,
      onDownloadAll,
    });

    openGallery(mediaItems, 0);

    const getDownloadButtons = () => {
      const host = getShadowContentHost(container);
      const current = host.querySelector('[data-gallery-element="download-current"]');
      const all = host.querySelector('[data-gallery-element="download-all"]');
      if (!(current instanceof HTMLElement) || !(all instanceof HTMLElement)) {
        throw new Error('download buttons not found');
      }
      return { current, all } as const;
    };

    await waitFor(() => {
      const { current, all } = getDownloadButtons();
      expect(current.hasAttribute('disabled')).toBe(false);
      expect(all.hasAttribute('disabled')).toBe(false);
    });

    setLoading(true);

    await waitFor(() => {
      const { current, all } = getDownloadButtons();
      expect(current.getAttribute('disabled')).not.toBeNull();
      expect(all.getAttribute('disabled')).not.toBeNull();
      const toolbarState = getShadowContentHost(container).querySelector(
        '[data-gallery-element="toolbar"]'
      );
      expect(toolbarState?.getAttribute('data-state')).toBe('loading');
    });

    expect(onDownloadCurrent).not.toHaveBeenCalled();
    expect(onDownloadAll).not.toHaveBeenCalled();

    setLoading(false);

    await waitFor(() => {
      const { current, all } = getDownloadButtons();
      expect(current.hasAttribute('disabled')).toBe(false);
      expect(all.hasAttribute('disabled')).toBe(false);
    });

    const { current: enabledCurrent, all: enabledAll } = getDownloadButtons();
    enabledCurrent.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    enabledAll.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onDownloadCurrent).toHaveBeenCalledTimes(1);
    expect(onDownloadAll).toHaveBeenCalledTimes(1);

    instance.dispose();
  });

  it('invokes onClose when Escape key is pressed while open', async () => {
    const onClose = vi.fn();

    const instance = renderSolidGalleryShell({
      container,
      onClose,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      onDownloadCurrent: vi.fn(),
      onDownloadAll: vi.fn(),
    });

    openGallery(mediaItems, 0);

    await waitFor(() => {
      expect(getSolidShellElement(container)?.getAttribute('data-open')).toBe('true');
    });

    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });

    window.dispatchEvent(escapeEvent);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    instance.dispose();
  });

  it('invokes navigation callbacks when arrow keys are pressed', async () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();

    const instance = renderSolidGalleryShell({
      container,
      onClose: vi.fn(),
      onPrevious,
      onNext,
      onDownloadCurrent: vi.fn(),
      onDownloadAll: vi.fn(),
    });

    openGallery(mediaItems, 0);

    await waitFor(() => {
      expect(getSolidShellElement(container)?.getAttribute('data-open')).toBe('true');
    });

    const arrowRight = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
    });

    window.dispatchEvent(arrowRight);

    await waitFor(() => {
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    const arrowLeft = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      bubbles: true,
    });

    window.dispatchEvent(arrowLeft);

    await waitFor(() => {
      expect(onPrevious).toHaveBeenCalledTimes(1);
    });

    instance.dispose();
  });
});
