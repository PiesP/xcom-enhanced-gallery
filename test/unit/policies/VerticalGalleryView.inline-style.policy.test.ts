/**
 * @file VerticalGalleryView 인라인 스타일 금지 정책 테스트 (RED)
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../../../');

describe('VerticalGalleryView – inline style policy', () => {
  setupGlobalTestIsolation();

  it('should not use inline style on items container (use CSS classes instead)', () => {
    const filePath = join(
      PROJECT_ROOT,
      'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx'
    );
    const content = readFileSync(filePath, 'utf-8');

    // 금지: itemsContainer 영역에 style 속성 사용
    // 근처에 className={styles.itemsContainer}와 style={{ 가 함께 나오면 실패
    const hasInlineOnItems = /className=\{styles\.itemsContainer\}[\s\S]*?style=\{\{/m.test(
      content
    );
    expect(hasInlineOnItems).toBe(false);

    // 일반적으로 컴포넌트 파일 내의 인라인 style 사용 최소화 (허용 예외가 없다면 전면 금지)
    // 기존 코드에는 itemsContainer 외 사용처가 없음 → 전체 금지도 함께 검증
    const anyInlineStyle = /style=\{\{/.test(content);
    expect(anyInlineStyle).toBe(false);
  });
});
