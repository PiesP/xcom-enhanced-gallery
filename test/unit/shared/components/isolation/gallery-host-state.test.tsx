import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '@shared/components/ui/ErrorBoundary/ErrorBoundary';
import {
  GalleryContainer,
  mountGallery,
  unmountGallery,
} from '@shared/components/isolation/GalleryContainer';
import { restoreActiveGalleryHostState } from '@shared/components/isolation/gallery-host-state';
import { createEffect, createSignal, type JSXElement } from 'solid-js';

vi.mock('@platform/index', () => ({
  getNotificationAdapter: () => ({ notify: vi.fn(async () => undefined) }),
  notifySafely: vi.fn(),
}));

vi.mock('@shared/hooks/use-translation', () => ({
  useTranslation: () => (key: string) => key,
}));

describe('gallery host-state recovery', () => {
  afterEach(() => {
    restoreActiveGalleryHostState();
    document.body.replaceChildren();
    document.body.removeAttribute('style');
    vi.restoreAllMocks();
  });

  it('restores the exact host snapshot after a child render error and remains idempotent', async () => {
    document.body.style.overflow = 'clip';
    document.body.style.position = 'relative';
    document.body.style.top = '7px';
    document.body.style.left = '8px';
    document.body.style.right = '9px';
    window.history.scrollRestoration = 'manual';
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(321);
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    const outside = document.createElement('button');
    outside.setAttribute('aria-hidden', 'false');
    outside.textContent = 'Outside';
    document.body.append(outside);
    outside.focus();

    const host = document.createElement('div');
    document.body.append(host);
    let triggerError = (): void => undefined;

    function ThrowAfterMount(): JSXElement {
      const [shouldThrow, setShouldThrow] = createSignal(false);
      triggerError = () => setShouldThrow(true);
      createEffect(() => {
        if (shouldThrow()) throw new Error('Injected render failure');
      });
      return <button type="button">Inside</button>;
    }

    mountGallery(host, () => (
      <ErrorBoundary onError={restoreActiveGalleryHostState}>
        <GalleryContainer>
          <ThrowAfterMount />
        </GalleryContainer>
      </ErrorBoundary>
    ));

    expect(document.body.style.position).toBe('fixed');
    expect(outside.hasAttribute('inert')).toBe(true);
    triggerError();
    await Promise.resolve();

    expect(document.body.style).toMatchObject({
      overflow: 'clip',
      position: 'relative',
      top: '7px',
      left: '8px',
      right: '9px',
    });
    expect(window.history.scrollRestoration).toBe('manual');
    expect(outside.getAttribute('aria-hidden')).toBe('false');
    expect(outside.hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(outside);
    expect(scrollTo).toHaveBeenCalledWith(0, 321);

    restoreActiveGalleryHostState();
    expect(document.body.style.position).toBe('relative');
    expect(scrollTo).toHaveBeenCalledTimes(1);
    unmountGallery(host);
  });
});
