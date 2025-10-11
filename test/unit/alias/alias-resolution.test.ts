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
  // TODO: 플랫폼별 절대 경로 import 테스트
  // - Windows: file:///C:/... 또는 /@fs/C:/...
  // - Unix: file:///... 또는 /@fs/...
  // - Vite dev 서버 및 빌드 환경에서 동작 확인 필요
  // - 현재는 alias 해석만으로 충분, 실제 필요 시 구현
});
