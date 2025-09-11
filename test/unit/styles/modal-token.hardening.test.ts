import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Hardening test (정적): 다크 모드 모달 토큰이 semantic 계층에 존재하고
 * layered(design-tokens.css) 파일에서 component modal 토큰 재정의가 제거되었음을 검증.
 */

// Windows 환경에서 import.meta.url pathname 은 /C:/ 형태가 되어 path.resolve 시 이중 드라이브 문자가 생길 수 있음.
// 테스트에서는 워크스페이스 루트(process.cwd()) 기준으로 경로를 산정하여 안정성 확보.
// Vitest ESM 환경에서 타입 가드를 위해 globalThis.process 사용
const cwd = (globalThis as any).process?.cwd?.() ?? '';
const STYLES_ROOT = path.join(cwd, 'src', 'shared', 'styles');
const semantic = fs.readFileSync(path.join(STYLES_ROOT, 'design-tokens.semantic.css'), 'utf-8');
const layered = fs.readFileSync(path.join(STYLES_ROOT, 'design-tokens.css'), 'utf-8');

describe('modal-token.hardening (static)', () => {
  it('semantic file defines dark modal background & border tokens', () => {
    expect(semantic).toMatch(/--xeg-modal-bg-dark:/);
    expect(semantic).toMatch(/--xeg-modal-border-dark:/);
    // Dark theme override usage
    expect(semantic).toMatch(/\[data-theme='dark'\][^{]*{[^}]*--xeg-modal-bg:/);
  });

  it('layered tokens file does not redeclare component modal tokens', () => {
    expect(layered).not.toMatch(/--xeg-comp-modal-bg:/);
    expect(layered).not.toMatch(/--xeg-comp-modal-border:/);
  });
});
