/**
 * @file VerticalImageItem 인라인 스타일 금지 정책 테스트 (RED)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../../../../..');

describe('VerticalImageItem – inline style policy', () => {
  it('should not use inline style on <img> or <video> elements for opacity/transition', () => {
    const filePath = join(
      PROJECT_ROOT,
      'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx'
    );
    const content = readFileSync(filePath, 'utf-8');

    // 금지: <img ... style={{ opacity: ..., transition: ... }} /> 또는 동일한 패턴의 <video>
    const imgInline = /<img[\s\S]*?style=\{\{[\s\S]*?opacity[\s\S]*?\}[\s\S]*?\}/m.test(content);
    const videoInline = /<video[\s\S]*?style=\{\{[\s\S]*?opacity[\s\S]*?\}[\s\S]*?\}/m.test(
      content
    );
    expect(imgInline || videoInline).toBe(false);
  });
});
