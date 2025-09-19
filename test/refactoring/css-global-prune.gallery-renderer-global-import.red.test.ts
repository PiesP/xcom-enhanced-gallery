/**
 * @fileoverview CSS Global Prune P2 - GalleryRenderer에서 gallery-global.css import 금지 RED 테스트
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

describe('XEG-CSS-GLOBAL-PRUNE P2 (RED)', () => {
  it('GalleryRenderer.ts는 gallery-global.css를 import 하지 않아야 한다', () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const filePath = resolve(__dirname, '../../src/features/gallery/GalleryRenderer.ts');
    const source = readFileSync(filePath, 'utf8');

    // 다양한 공백/따옴표 변형을 포괄하는 정규식
    const importPattern = /import\s+['"]\.\/styles\/gallery-global\.css['"];?/;

    expect(importPattern.test(source)).toBe(
      false,
      'GalleryRenderer가 gallery-global.css를 직접 import 하면 안 됩니다 (중복/이중 주입 위험)'
    );
  });
});
