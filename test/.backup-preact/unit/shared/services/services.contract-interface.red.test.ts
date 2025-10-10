/**
 * Phase 6 (GREEN) – Service Contract Interface Extraction
 * 핵심 검증:
 * 1. 허용되지 않은 경로에서 서비스 직접 인스턴스화(new MediaService / new BulkDownloadService / new SettingsService) 금지
 * 2. factory 모듈이 존재(getMediaService, getBulkDownloadService, getSettingsService)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
/* eslint-env node */
// Node 전역 API 사용 (vitest 환경).

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      collectSourceFiles(full, acc);
    } else if (/(\.ts|\.tsx)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

describe('Service Contract – direct instantiation forbidden (GREEN)', () => {
  // vitest 환경에서 process 전역이 제공되지만 lint 가드를 위해 globalThis 참조 사용
  const cwd = (globalThis as unknown as { process?: { cwd(): string } }).process?.cwd() || '';
  const SRC_ROOT = join(cwd, 'src');
  const ALLOWED_FILES = new Set([
    // 서비스 자신의 정의 파일은 허용 (클래스 정의 내부 new, 싱글톤 등)
    join(cwd, 'src', 'shared', 'services', 'MediaService.ts').replace(/\\/g, '/'),
    join(cwd, 'src', 'shared', 'services', 'BulkDownloadService.ts').replace(/\\/g, '/'),
    join(cwd, 'src', 'features', 'settings', 'services', 'SettingsService.ts').replace(/\\/g, '/'),
    // factory 내부 new 허용 (지연 생성 구현 세부)
    join(cwd, 'src', 'features', 'settings', 'services', 'settings-factory.ts').replace(/\\/g, '/'),
  ]);

  const FORBIDDEN_PATTERNS = [
    /new\s+MediaService\s*\(/g,
    /new\s+BulkDownloadService\s*\(/g,
    /new\s+SettingsService\s*\(/g,
  ];

  it('disallows direct instantiation outside allowed files and ensures factories exist', async () => {
    const files = collectSourceFiles(SRC_ROOT);
    const violations: Array<{ file: string; line: number; lineText: string; pattern: string }> = [];

    for (const file of files) {
      const norm = file.replace(/\\/g, '/');
      const content = readFileSync(file, 'utf8');
      // 패턴별 검사
      for (const pattern of FORBIDDEN_PATTERNS) {
        // lastIndex 초기화 보장
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(content))) {
          if (!ALLOWED_FILES.has(norm)) {
            // 라인 번호 계산
            const before = content.slice(0, match.index);
            const line = before.split(/\r?\n/).length;
            const lineText = content.split(/\r?\n/)[line - 1].trim();
            violations.push({ file: norm, line, lineText, pattern: pattern.source });
          }
        }
      }
    }

    // GREEN: 위반 없어야 한다
    if (violations.length > 0) {
      const report = violations
        .map(v => `- ${v.file}:${v.line} [${v.pattern}] ${v.lineText}`)
        .join('\n');
      throw new Error('\n[Service Contract Violations]\n' + report + '\n');
    }

    // Factory 모듈이 실제로 export 하는지 동적 확인
    const factories = await import('@shared/services/service-factories');
    expect(typeof factories.getMediaService).toBe('function');
    expect(typeof factories.getBulkDownloadService).toBe('function');
    expect(typeof factories.getSettingsService).toBe('function');
  });
});
