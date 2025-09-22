import { describe, it, expect, beforeEach } from 'vitest';
import {
  globalResourceManager,
  registerResource,
  releaseResource,
  releaseAllResources,
  getResourceCount,
  getResourceCountsByType,
  getResourceCountsByContext,
  getResourceDiagnostics,
} from '@/shared/utils/memory';

function noop() {}

describe('ResourceManager diagnostics (byType/byContext)', () => {
  beforeEach(() => {
    releaseAllResources();
  });

  it('counts total/byType from id prefix when no explicit metadata', () => {
    registerResource('image:1', noop);
    registerResource('image:2', noop);
    registerResource('data:abc', noop);
    expect(getResourceCount()).toBe(3);
    expect(getResourceCountsByType()).toEqual({ image: 2, data: 1 });

    // releasing one image
    expect(releaseResource('image:1')).toBe(true);
    expect(getResourceCount()).toBe(2);
    expect(getResourceCountsByType()).toEqual({ image: 1, data: 1 });
  });

  it('counts byContext only when provided explicitly', () => {
    // Without explicit context - should not appear in byContext
    registerResource('image:x', noop);
    // With explicit context metadata (using direct manager API)
    globalResourceManager.register('image:y', noop, { context: 'gallery' });
    globalResourceManager.register('data:z', noop, { context: 'settings' });

    expect(getResourceCountsByContext()).toEqual({ gallery: 1, settings: 1 });
  });

  it('getDiagnostics returns combined snapshot', () => {
    registerResource('video:a', noop);
    globalResourceManager.register('misc:b', noop, { type: 'custom', context: 'cx' });

    const d = getResourceDiagnostics();
    expect(d.total).toBe(2);
    expect(d.byType).toMatchObject({ video: 1, custom: 1 });
    expect(d.byContext).toMatchObject({ cx: 1 });
  });
});
