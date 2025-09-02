import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * RED: 스크롤 후 상단 hover 영역(mouseenter)으로 툴바가 다시 나타나야 한다.
 * 현재 구현( transform: translateZ(0) on container )으로 인해 position:fixed hover zone이
 * 실제 뷰포트 최상단과 어긋나 hover 이벤트 미감지될 수 있음을 검출.
 */

describe('Toolbar hover restoration (GREEN)', () => {
  test('VerticalGalleryView.module.css .container block excludes translateZ(0) while other elements may retain it', () => {
    const cssPath = path.resolve(
      'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
    );
    const content = fs.readFileSync(cssPath, 'utf-8');
    const match = content.match(/\.container\s*{[\s\S]*?}\n/);
    expect(match).toBeTruthy();
    const containerBlock = match ? match[0] : '';
    expect(containerBlock.includes('transform: translateZ(0);')).toBe(false);
  });
});
