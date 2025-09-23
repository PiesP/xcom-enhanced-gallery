/**
 * @fileoverview Userscript GM_* 직접 사용 금지 정적 스캔
 * 정책: 애플리케이션 코드는 반드시 getUserscript() 어댑터 경유로만 GM_* API를 사용해야 한다.
 * 제외: src/shared/external/userscript/**, *.d.ts 타입 선언 파일
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, sep } from 'node:path';

const SRC_ROOT = 'src';
const INCLUDED_EXT = new Set(['.ts', '.tsx']);
const EXCLUDE_DIRS = [
  `${sep}shared${sep}external${sep}userscript${sep}`,
  `${sep}shared${sep}types${sep}core${sep}`, // userscript.d.ts 등 타입 선언
];

// 파일 단위 제외(어댑터 내부는 GM_* 접근 허용, 로거는 환경 감지용 참조 허용)
const EXCLUDE_FILES = new Set([
  ['src', 'shared', 'external', 'userscript', 'adapter.ts'].join(sep),
  ['src', 'shared', 'logging', 'logger.ts'].join(sep),
]);

function isExcludedPath(p: string): boolean {
  const norm = p.split('/').join(sep);
  // 디렉터리 제외 패턴은 후행 구분자 유무 모두 허용
  for (const base of EXCLUDE_DIRS) {
    const bNoSep = base.endsWith(sep) ? base.slice(0, -1) : base;
    if (norm.includes(base) || norm.includes(bNoSep)) return true;
  }
  // 파일 정확 매치 제외
  return EXCLUDE_FILES.has(norm);
}

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop()!;
    const entries = readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const p = join(cur, e.name);
      if (e.isDirectory()) {
        if (isExcludedPath(p)) continue;
        stack.push(p);
      } else {
        const ext = extname(p);
        if (INCLUDED_EXT.has(ext) && !isExcludedPath(p)) out.push(p);
      }
    }
  }
  return out;
}

function scanFile(file: string) {
  const offenders: { file: string; line: number; snippet: string }[] = [];
  const content = readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  let inBlockComment = false;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();
    // 블록 코멘트 상태 갱신
    if (!inBlockComment) {
      if (trimmed.startsWith('/*')) {
        inBlockComment = !trimmed.includes('*/');
        continue;
      }
    } else {
      if (trimmed.includes('*/')) inBlockComment = false;
      continue;
    }
    // 라인 코멘트 무시
    if (trimmed.startsWith('//')) continue;

    // 문자열 내부의 GM_를 완벽히 배제하긴 어렵지만, 간단한 휴리스틱으로 줄인다:
    // - 따옴표 직후 바로 GM_가 나오면 문자열로 간주하고 스킵
    // - 그 외에는 \bGM_ 토큰을 탐지
    const stringLike = /['"`]\s*GM_[A-Za-z0-9_]+/.test(line);
    if (stringLike) continue;

    const gmToken = /\bGM_[A-Za-z0-9_]+/.test(line);
    if (gmToken) {
      offenders.push({ file, line: i + 1, snippet: line.slice(0, 200) });
    }
  }
  return offenders;
}

describe('Userscript GM_* 직접 사용 금지(어댑터 경유 강제) – 소스 스캔', () => {
  it('src/ 하위 .ts/.tsx에서 GM_* 직접 사용이 없어야 한다(어댑터/타입 선언 제외)', () => {
    const files = listSourceFiles(SRC_ROOT);
    const offenders = files.flatMap(scanFile);
    expect(
      offenders.map(o => `${o.file}:${o.line} -> ${o.snippet}`),
      `GM_* 직접 사용이 발견되었습니다. getUserscript() 어댑터를 사용하세요.\n` +
        offenders.map(o => `${o.file}:${o.line}`).join('\n')
    ).toEqual([]);
  });
});
