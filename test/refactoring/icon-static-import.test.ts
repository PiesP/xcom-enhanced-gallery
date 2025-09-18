import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

// [ICN-R4] 소비 컴포넌트에서 '../Icon' 배럴을 통한 직접 아이콘 컴포넌트 import 금지
// Toolbar / SettingsModal 계열은 LazyIcon/IconButton.iconName 사용으로 치환되어야 한다.

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function readSource(rel: string): string {
  // __dirname: test/refactoring
  const projectRoot = join(__dirname, '..', '..');
  return readFileSync(join(projectRoot, rel), 'utf-8');
}

describe('[ICN-R4] direct hero icon imports 제거', () => {
  it('Toolbar 가 ../Icon 배럴을 직접 import 하지 않아야 한다', () => {
    const src = readSource('src/shared/components/ui/Toolbar/Toolbar.tsx');
    // 실패 조건: from '../Icon' 패턴 존재
    expect(src).not.toMatch(/from '\.\.\/Icon'/);
  });

  it('SettingsModal 가 ../Icon 배럴을 직접 import 하지 않아야 한다', () => {
    const src = readSource('src/shared/components/ui/SettingsModal/SettingsModal.tsx');
    expect(src).not.toMatch(/from '\.\.\/Icon'/);
  });

  it('RefactoredSettingsModal 가 ../Icon 배럴을 직접 import 하지 않아야 한다', () => {
    const src = readSource('src/shared/components/ui/SettingsModal/RefactoredSettingsModal.tsx');
    expect(src).not.toMatch(/from '\.\.\/Icon'/);
  });
});
