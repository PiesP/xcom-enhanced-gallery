// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { GalleryFailureNotice } from '@features/gallery/components/GalleryFailureNotice';
import { closeGallery, openGallery, setError } from '@shared/state/signals/gallery.signals';
import { downloadState, setDownloadStatus } from '@shared/state/signals/gallery-download-signals';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@shared/hooks/use-translation', () => ({
  useTranslation: () => (key: string) => key,
}));

describe('persistent gallery failure notice', () => {
  let host: HTMLDivElement;
  let dispose: () => void;

  beforeEach(() => {
    host = document.createElement('div');
    host.dataset.xegGalleryContainer = '';
    host.tabIndex = -1;
    document.body.append(host);
    openGallery([{ id: 'one', url: 'https://pbs.twimg.com/media/one.jpg', type: 'image' }]);
    dispose = render(() => <GalleryFailureNotice />, host);
  });
  afterEach(() => {
    dispose();
    host.remove();
    closeGallery();
    setDownloadStatus('idle');
  });

  it('shows the cause and safe guidance, and dismissal does not cancel an operation', () => {
    setError('The preferred source is unavailable.');
    expect(host.textContent).toContain('The preferred source is unavailable.');
    expect(host.textContent).toContain('msg.gal.downloadFailureNext');
    expect(host.querySelector('[aria-live], [role="status"]')).toBeNull();
    const hiddenToolbar = document.createElement('fieldset');
    hiddenToolbar.dataset.galleryElement = 'toolbar';
    hiddenToolbar.style.visibility = 'hidden';
    hiddenToolbar.append(document.createElement('button'));
    host.append(hiddenToolbar);
    setDownloadStatus('working');
    const dismiss = host.querySelector<HTMLButtonElement>('section button');
    dismiss?.focus();
    dismiss?.click();
    expect(host.querySelector('section')).toBeNull();
    expect(downloadState.status).toBe('working');
    expect(document.activeElement).toBe(host);
  });

  it('leaves bulk errors to their owner and clears earlier session errors on reopening', () => {
    setError('ZIP failure', 'bulkDownload');
    expect(host.querySelector('section')).toBeNull();
    setError('Single failure');
    expect(host.querySelector('section')).not.toBeNull();
    closeGallery();
    openGallery([{ id: 'two', url: 'https://pbs.twimg.com/media/two.jpg', type: 'image' }]);
    expect(host.querySelector('section')).toBeNull();
  });
});
