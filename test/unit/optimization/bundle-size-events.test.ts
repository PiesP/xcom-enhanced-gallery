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
  it('events.ts 소스 파일 크기가 24 KB 이하여야 함 (Phase 33 Step 2 목표)', () => {
    const filePath = resolve(__dirname, '../../../src/shared/utils/events.ts');
    const stats = statSync(filePath);
    const fileSizeKB = stats.size / 1024;

    console.log(`[metrics] events.ts size: ${fileSizeKB.toFixed(2)} KB (target: 24 KB)`);

    // Phase 33 Step 1: 31.65 KB -> 27.82 KB
    // Phase 33 Step 2: 24 KB 이하 (추가 3.82 KB 절감)
    expect(fileSizeKB).toBeLessThanOrEqual(24);
  });

  it('events.ts가 850줄 이하로 유지되어야 함', () => {
    const eventsPath = resolve(process.cwd(), 'src/shared/utils/events.ts');
    const content = readFileSync(eventsPath, 'utf-8');
    const lineCount = content.split('\n').length;

    console.log(`[metrics] events.ts line count: ${lineCount} lines (target: 850 lines)`);

    // Phase 33 Step 1: 1106 -> 967 lines
    // Phase 33 Step 2: 850 lines 이하
    expect(lineCount).toBeLessThanOrEqual(850);
  });

  it('events.ts export 함수가 12개 이하여야 함', () => {
    const eventsPath = resolve(process.cwd(), 'src/shared/utils/events.ts');
    const content = readFileSync(eventsPath, 'utf-8');

    // export로 시작하는 라인 카운트 (함수, 클래스, 타입 등)
    const exports = content.match(/^export\s+(function|const|class|interface|type)\s+/gm) || [];
    const exportCount = exports.length;

    console.log(`[metrics] events.ts export count: ${exportCount} (target: 12)`);

    // Phase 33 Step 1: 21 -> 14 exports
    // Phase 33 Step 2: 12 exports 이하로 정리
    expect(exportCount).toBeLessThanOrEqual(12);
  });
});
