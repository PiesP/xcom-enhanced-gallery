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

  // NOTE: 플랫폼별 절대 경로 import는 현재 alias 해석만으로 충분합니다.
  // Vite의 /@fs 프리픽스는 dev 서버 전용이며, 빌드 시에는 alias로 해석됩니다.
  // 실제 필요 시 (특수한 플랫폼 종속 시나리오) 구현 검토 예정.
});
