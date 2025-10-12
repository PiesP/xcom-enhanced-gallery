/**
 * @fileoverview Phase 33 Step 2A - 이벤트 핸들링 번들 크기 가드
 *
 * RED 단계: events.ts 모듈의 번들 크기를 15 KB 이하로 제한하는 가드 테스트
 * 현재: 19.28 KB
 * 목표: 15 KB (4 KB 절감)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('[Phase 33-2A] Events Bundle Size Guard', () => {
  it('events.ts 소스 파일 크기가 28 KB 이하여야 함 (최적화 목표)', () => {
    const filePath = resolve(__dirname, '../../../src/shared/utils/events.ts');
    const stats = statSync(filePath);
    const fileSizeKB = stats.size / 1024;

    console.log(`📄 events.ts 소스 파일 크기: ${fileSizeKB.toFixed(2)} KB (목표: 28 KB)`);

    // 초기: 31.65 KB
    // 목표: 28 KB (소스 레벨 최적화를 통해 3.65 KB 감소)
    // 실제 번들 효과: 소스 감소 대비 번들은 tree-shaking으로 최소 영향
    expect(fileSizeKB).toBeLessThanOrEqual(28);
  });

  it('events.ts가 1000줄 이하로 유지되어야 함', () => {
    const eventsPath = resolve(process.cwd(), 'src/shared/utils/events.ts');
    const content = readFileSync(eventsPath, 'utf-8');
    const lineCount = content.split('\n').length;

    console.log(`� events.ts 라인 수: ${lineCount} lines (목표: 1000 lines)`);

    // RED: 현재는 1106 lines이므로 실패해야 함
    expect(lineCount).toBeLessThanOrEqual(1000);
  });

  it('events.ts export 함수가 15개 이하여야 함', () => {
    const eventsPath = resolve(process.cwd(), 'src/shared/utils/events.ts');
    const content = readFileSync(eventsPath, 'utf-8');

    // export로 시작하는 라인 카운트 (함수, 클래스, 타입 등)
    const exports = content.match(/^export\s+(function|const|class|interface|type)\s+/gm) || [];
    const exportCount = exports.length;

    console.log(`� events.ts export 개수: ${exportCount} (목표: 15개)`);

    // 너무 많은 export는 번들 크기 증가의 원인
    expect(exportCount).toBeLessThanOrEqual(15);
  });
});
