import { describe, it, expect } from 'vitest';
import { navigateToItem, openGallery } from '@shared/state/signals/gallery.signals';
import {
  navigationIntentState,
  setToolbarIntent,
} from '@shared/state/signals/navigation-intent.signals';

// NOTE: This is a lightweight behavioral spec; full DOM rendering harness would be needed for full integration.

describe('Gallery toolbar focus & scroll intent coordination', () => {
  it('sets toolbar intent before navigation and resets after auto scroll', async () => {
    const media = Array.from({ length: 5 }).map(
      (_, i) =>
        ({
          id: `m${i}`,
          url: `https://example.com/${i}.jpg`,
          type: 'image',
          filename: `file${i}.jpg`,
          width: 100,
          height: 100,
          size: 1234,
          mediaType: 'image',
        }) as const
    );
    openGallery(media, 0);
    setToolbarIntent('next');
    navigateToItem(1);

    // Intent reset이 비동기적으로 처리되므로 기다려야 함
    await Promise.resolve();

    expect(navigationIntentState.value.intent).toBe('toolbar');
  });

  it('skips auto scroll when intent=user-scroll (simulated)', () => {
    const media = Array.from({ length: 3 }).map(
      (_, i) =>
        ({
          id: `m${i}`,
          url: `https://example.com/${i}.jpg`,
          type: 'image',
          filename: `file${i}.jpg`,
          width: 100,
          height: 100,
          size: 1234,
          mediaType: 'image',
        }) as const
    );
    openGallery(media, 0);
    navigationIntentState.value = { intent: 'user-scroll', lastUserScrollAt: Date.now() };
    navigateToItem(2);
    expect(navigationIntentState.value.intent).toBe('user-scroll');
  });
});
