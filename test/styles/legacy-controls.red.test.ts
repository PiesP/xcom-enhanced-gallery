import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// P5 RED: legacy .controls 클래스가 아직 존재하므로 이 테스트는 실패해야 한다.
// GREEN 조건: .controls 정의와 사용이 제거된 후 본 테스트가 수정/rename 되어 통과.

describe('P5 RED: legacy .controls class must be removed', () => {
  it('Gallery.module.css still contains .controls class (expect removal in P5)', () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
    const cssPath = path.join(root, 'src', 'features', 'gallery', 'styles', 'Gallery.module.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    const hasControls = css.includes('.controls');
    // FAIL intentionally while legacy remains
    expect(hasControls).toBe(false);
  });
});
