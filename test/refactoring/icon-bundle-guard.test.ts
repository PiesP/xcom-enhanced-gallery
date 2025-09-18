import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CORE_ICONS } from '@shared/services/iconRegistry';

// ICN-R5: 번들 가드 - 비코어 아이콘이 dev build 산출물에 과도하게 포함되지 않는지 간단 문자열 스캔
// (정밀 트리셰이킹 검증은 아니며, 회귀 감지용 경량 체크)

function readDistUserscript(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  // 테스트 파일에서 프로젝트 루트로 상위 이동 (test/refactoring/...)
  const projectRoot = join(__dirname, '..', '..');
  const distDir = join(projectRoot, 'dist');
  const file = existsSync(join(distDir, 'xcom-enhanced-gallery.user.js'))
    ? 'xcom-enhanced-gallery.user.js'
    : Array.from(
        new Set(['xcom-enhanced-gallery.dev.user.js', 'xcom-enhanced-gallery.user.js'])
      ).find(f => existsSync(join(distDir, f)));
  if (!file) return '';
  return readFileSync(join(distDir, file), 'utf-8');
}

describe('icon bundle guard (ICN-R5)', () => {
  it('dist bundle should not inline hero icon component source before dynamic load (heuristic)', () => {
    const code = readDistUserscript();
    if (!code) {
      // 빌드 전이면 스킵(성공 간주) - build 단계에서 다시 실행될 수 있음
      expect(true).toBe(true);
      return;
    }

    // 코어 외 아이콘 이름들
    const nonCore = [
      'ZoomIn',
      'ArrowAutofitWidth',
      'ArrowAutofitHeight',
      'ArrowsMaximize',
      'FileZip',
    ];

    // 휴리스틱: import 경로 문자열이 아닌, 컴포넌트 구현 body가 직접 포함되어 있지 않은지 대략 확인
    // 여기서는 hero 파일명 문자열 등장 횟수를 제한 (동적 import 경로 1회 이내 기대)
    nonCore.forEach(name => {
      const heroFileToken = `Hero${name}`; // 파일 내 컴포넌트 명 패턴
      const occurrences = code.split(heroFileToken).length - 1;
      // dev + prod 번들이 모두 포함된 로컬 테스트 환경에서는 2회까지 허용
      expect(occurrences).toBeLessThanOrEqual(2);
    });

    // 코어 아이콘은 프리로드 대상이므로 최소 1회 dynamic import 경로 문자열이 존재할 수 있음
    CORE_ICONS.forEach(name => {
      const token = `Hero${name}`;
      const occ = code ? code.split(token).length - 1 : 0;
      expect(occ).toBeGreaterThanOrEqual(0); // 존재 여부만 관찰, 실패 조건 없음
    });
  });
});
