import { describe, it, expect } from 'vitest';
const SPEC_GALLERY_ALIAS = '@features/gallery/index';
const SPEC_TOOLBAR_ALIAS = '@shared/components/ui/Toolbar/Toolbar';

describe('Path alias resolution', () => {
  it('resolves @features alias to gallery index', async () => {
    const mod = await import(SPEC_GALLERY_ALIAS as string);
    expect(mod).toBeTruthy();
  });

  it('resolves @shared alias to ui Toolbar', async () => {
    const mod = await import(SPEC_TOOLBAR_ALIAS as string);
    expect(mod).toBeTruthy();
  });

  it.todo('can import via /@fs absolute path (platform-specific)');
});
