/**
 * @fileoverview Toolbar container integration tests
 * @description Ensures Toolbar propagates reactive props down to ToolbarView
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@test/utils/testing-library';
import { getSolid } from '@shared/external/vendors';
import { Toolbar } from '@shared/components/ui/Toolbar';
import type { ToolbarViewProps } from '@shared/components/ui/Toolbar/ToolbarView';

let capturedProps: ToolbarViewProps | null = null;
let capturedIsDownloadingProp: unknown = null;

vi.mock('@shared/components/ui/Toolbar/ToolbarView', () => {
  const solidRuntime = getSolid();
  return {
    ToolbarView: (props: ToolbarViewProps) => {
      capturedProps = props;
      capturedIsDownloadingProp = props.isDownloading;
      return solidRuntime.h('div', {});
    },
  };
});

const noop = () => {};

describe('Toolbar container reactivity', () => {
  beforeEach(() => {
    capturedProps = null;
    capturedIsDownloadingProp = null;
  });

  it('updates download state when isDownloading prop changes', async () => {
    const { createSignal, createComponent } = getSolid();
    const [downloading, setDownloading] = createSignal(false);

    render(() =>
      createComponent(Toolbar, {
        currentIndex: 1,
        focusedIndex: () => null,
        totalCount: 3,
        isDownloading: downloading(),
        onPrevious: noop,
        onNext: noop,
        onDownloadCurrent: noop,
        onDownloadAll: noop,
        onClose: noop,
        onFitOriginal: noop,
        onFitWidth: noop,
        onFitHeight: noop,
        onFitContainer: noop,
        currentFitMode: 'fitContainer',
        onOpenSettings: noop,
      })
    );

    expect(capturedProps).not.toBeNull();
    expect(typeof capturedIsDownloadingProp).toBe('function');

    const isDownloadingAccessor = capturedIsDownloadingProp as () => boolean | undefined;
    expect(isDownloadingAccessor()).toBe(false);

    setDownloading(true);

    await waitFor(() => {
      expect(isDownloadingAccessor()).toBe(true);
    });
  });
});
