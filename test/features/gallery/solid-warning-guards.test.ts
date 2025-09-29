/**
 * Stage E Solid warning guards
 * @description Ensures we keep Solid build/runtime free from known warning regressions.
 */

import { describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const workspaceRoot = process.cwd();

const solidEntryFiles = [
  'src/features/gallery/solid/SolidGalleryShell.solid.tsx',
  'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.solid.tsx',
  'src/features/gallery/components/KeyboardHelpOverlay/KeyboardHelpOverlay.tsx',
  'src/features/settings/solid/SolidSettingsPanel.solid.tsx',
  'src/shared/components/isolation/GalleryContainer.tsx',
  'src/shared/components/LazyIcon.tsx',
  'src/shared/components/ui/Button/Button.tsx',
  'src/shared/components/ui/Button/IconButton.tsx',
  'src/shared/components/ui/Icon/Icon.tsx',
  'src/shared/components/ui/Icon/SvgIcon.tsx',
  'src/shared/components/ui/MediaCounter/MediaCounter.tsx',
  'src/shared/components/ui/ModalShell/ModalShell.solid.tsx',
  'src/shared/components/ui/SettingsModal/SettingsModal.tsx',
  'src/shared/components/ui/Toast/SolidToast.solid.tsx',
  'src/shared/components/ui/Toast/ToastContainer.tsx',
  'src/shared/components/ui/Toolbar/Toolbar.tsx',
  'src/shared/components/ui/ToolbarButton/ToolbarButton.tsx',
  'src/shared/components/ui/ToolbarWithSettings/ToolbarWithSettings.tsx',
  'src/features/notifications/solid/SolidToastHost.solid.tsx',
];

describe('FRAME-ALT-001 Stage E — Solid warning guards', () => {
  it('Solid JSX sources omit legacy @jsxImportSource directives', async () => {
    const offenders: string[] = [];

    for (const relativePath of solidEntryFiles) {
      const filePath = resolve(workspaceRoot, relativePath);
      const content = await readFile(filePath, 'utf8');
      if (content.includes('@jsxImportSource')) {
        offenders.push(relativePath);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('renderSolidGalleryShell establishes a dedicated Solid root boundary', async () => {
    const createRootSpy = vi.fn();

    vi.doMock('@shared/external/vendors', async () => {
      const actual = await vi.importActual<typeof import('@shared/external/vendors')>(
        '@shared/external/vendors'
      );
      const core = actual.getSolidCore();
      const realCreateRoot = core.createRoot;
      const createRootWrapper: typeof core.createRoot = (
        ...args: Parameters<typeof realCreateRoot>
      ) => {
        createRootSpy(...args);
        return realCreateRoot(...args);
      };
      const wrappedCore = {
        ...core,
        createRoot: createRootWrapper,
      };

      return {
        ...actual,
        getSolidCore: () => wrappedCore,
      };
    });

    vi.doMock('@shared/components/isolation', () => {
      const mountGallery = vi.fn(() => ({ root: document.createElement('div') }));
      const unmountGallery = vi.fn();
      const GalleryContainer = () => null;
      return { mountGallery, unmountGallery, GalleryContainer };
    });

    vi.doMock('@/features/gallery/solid/createSolidKeyboardHelpOverlayController', () => ({
      createSolidKeyboardHelpOverlayController: () => ({
        open() {},
        close() {},
        dispose() {},
        isOpen: () => false,
      }),
    }));

    await vi.resetModules();

    const [{ renderSolidGalleryShell }, gallerySignals] = await Promise.all([
      import('@/features/gallery/solid/renderSolidGalleryShell'),
      import('@shared/state/signals/gallery.signals'),
    ]);

    gallerySignals.galleryState.value = {
      isOpen: true,
      mediaItems: [
        {
          id: 'warn-001',
          url: 'https://example.com/media/warn-001.jpg',
          filename: 'warn-001.jpg',
          type: 'image',
        },
      ],
      currentIndex: 0,
      isLoading: false,
      error: null,
      viewMode: 'vertical',
    };

    const container = document.createElement('div');
    document.body.appendChild(container);

    try {
      const instance = renderSolidGalleryShell({
        container,
        onClose() {},
        onPrevious() {},
        onNext() {},
        onDownloadCurrent() {},
        onDownloadAll() {},
      });

      instance.dispose();

      expect(createRootSpy).toHaveBeenCalled();
    } finally {
      container.remove();
      vi.doUnmock('@shared/external/vendors');
      vi.doUnmock('@shared/components/isolation');
      vi.doUnmock('@/features/gallery/solid/createSolidKeyboardHelpOverlayController');
    }
  });
});
