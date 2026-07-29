// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { useGalleryNavigationHandlers } from '@features/gallery/components/vertical-gallery-view/hooks/use-gallery-navigation-handlers';

function setupBackgroundClickFixture(): {
  readonly backdrop: HTMLDivElement;
  readonly items: HTMLUListElement;
  readonly itemButton: HTMLButtonElement;
  readonly toolbarButton: HTMLButtonElement;
  readonly onClose: ReturnType<typeof vi.fn>;
} {
  const backdrop = document.createElement('div');
  const items = document.createElement('ul');
  const item = document.createElement('li');
  const itemButton = document.createElement('button');
  const toolbar = document.createElement('fieldset');
  const toolbarButton = document.createElement('button');

  items.dataset.galleryElement = 'items';
  item.dataset.galleryElement = 'item';
  toolbar.dataset.galleryElement = 'toolbar';

  item.append(itemButton);
  items.append(item);
  toolbar.append(toolbarButton);
  backdrop.append(items, toolbar);
  document.body.append(backdrop);

  const onClose = vi.fn();
  const { handleBackgroundClick } = useGalleryNavigationHandlers({
    currentIndex: () => 0,
    mediaItems: () => [],
    onClose,
  });
  backdrop.addEventListener('click', handleBackgroundClick as EventListener);

  return { backdrop, items, itemButton, toolbarButton, onClose };
}

describe('useGalleryNavigationHandlers background dismissal', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('closes when the scroll surface outside a media item is clicked', () => {
    const { items, onClose } = setupBackgroundClickFixture();

    items.click();

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('keeps the gallery open when media or toolbar controls are clicked', () => {
    const { itemButton, toolbarButton, onClose } = setupBackgroundClickFixture();

    itemButton.click();
    toolbarButton.click();

    expect(onClose).not.toHaveBeenCalled();
  });
});
