import { cleanup, render, screen, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LazyIcon, { useIconPreload, useCommonIconPreload } from '@shared/components/ui/Icon/lazy-icon';
import { getIconRegistry, resetIconRegistry } from '@shared/components/ui/Icon/icon-registry';
import { getSolid } from '@/shared/external/vendors';

// Keep tests scoped and deterministic
describe('LazyIcon and icon preload helpers', () => {
  beforeEach(() => {
    // Reset registry to ensure a clean environment
    resetIconRegistry();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('passes stroke and color through to icon component props', async () => {
    const registry = getIconRegistry();
    const fakeIcon = vi.fn((props: any) => {
      return <div data-testid="icon" data-props={JSON.stringify(props)} /> as any;
    });

    // Spy on loadIcon and resolve with our fake icon component
    vi.spyOn(registry, 'loadIcon').mockResolvedValue(fakeIcon as any);

    render(() => (
      <LazyIcon name="Download" stroke={3} color="red" size={24} className="ic" />
    ));

    // Wait for the icon to be rendered and validate the props
    await waitFor(() => expect(screen.getByTestId('icon')).toBeTruthy());
    const el = screen.getByTestId('icon');
    const props = JSON.parse(el.getAttribute('data-props') || '{}');

    expect(props['stroke-width']).toBe(3);
    expect(props.stroke).toBe('red');
    expect(props.size).toBe(24);
    expect(props.className).toBe('ic');
  });

  it('preloads icons via registry.loadIcon when using useIconPreload', async () => {
    const registry = getIconRegistry();
    const loadSpy = vi.spyOn(registry, 'loadIcon').mockResolvedValue(() => <div /> as any);

    const solid = getSolid();
    solid.createRoot(() => {
      useIconPreload(['Download', 'Settings']);
    });

    // loadIcon should have been called for both names
    await waitFor(() => expect(loadSpy).toHaveBeenCalledTimes(2));
    expect(loadSpy).toHaveBeenCalledWith('Download');
    expect(loadSpy).toHaveBeenCalledWith('Settings');
  });

  it('calls preloadCommonIcons via useCommonIconPreload', async () => {
    const preloadSpy = vi.spyOn(
      await import('@shared/components/ui/Icon/icon-registry'),
      'preloadCommonIcons',
    );

    const solid = getSolid();
    solid.createRoot(() => {
      useCommonIconPreload();
    });

    await waitFor(() => expect(preloadSpy).toHaveBeenCalled());
  });
});
