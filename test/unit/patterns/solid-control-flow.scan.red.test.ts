import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

/**
 * @fileoverview Solid.js 제어 흐름 컴포넌트 패턴 검증
 * @description Show/Portal 상호작용 안티패턴 탐지
 *
 * Phase 9.7: Solid.js 패턴 일관성 점검
 *
 * 검증 항목:
 * 1. Show가 Portal을 직접 감싸는 안티패턴 (Phase 9.6에서 발견된 문제)
 * 2. Switch/Match와 Portal의 위험한 조합
 * 3. 조건부 렌더링 컴포넌트의 중첩 깊이
 */

describe('[Pattern Guard] Solid.js Control Flow Components', () => {
  const srcDir = join(process.cwd(), 'src');

  /**
   * TypeScript/TSX 파일 재귀 수집
   */
  function collectTsFiles(dir: string, files: string[] = []): string[] {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        collectTsFiles(fullPath, files);
      } else if (['.ts', '.tsx'].includes(extname(fullPath))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Show/Switch/Match가 Portal을 감싸는 패턴 검색
   * 안티패턴 예시:
   * ```tsx
   * <Show when={isOpen}>
   *   <Portal>...</Portal>
   * </Show>
   * ```
   */
  it('CRITICAL: Show/Switch/Match should NOT wrap Portal directly', () => {
    const tsxFiles = collectTsFiles(srcDir).filter(f => f.endsWith('.tsx'));
    const violations: Array<{ file: string; line: number; snippet: string }> = [];

    for (const file of tsxFiles) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      // 패턴: <Show when={...}> 다음에 <Portal> 또는 <Portal mount={...}>
      for (let i = 0; i < lines.length - 2; i++) {
        const showMatch = lines[i].match(/<Show\s+when=\{/);
        if (!showMatch) continue;

        // Show 시작 후 5줄 이내에 Portal 검색 (중첩 허용)
        for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
          const portalMatch = lines[j].match(/<Portal(\s|>)/);
          if (portalMatch) {
            violations.push({
              file: file.replace(process.cwd(), ''),
              line: i + 1,
              snippet: lines.slice(i, j + 1).join('\n'),
            });
            break;
          }
        }
      }

      // Switch/Match 패턴도 검사
      for (let i = 0; i < lines.length - 2; i++) {
        const switchMatch = lines[i].match(/<(Switch|Match)\s+/);
        if (!switchMatch) continue;

        for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
          const portalMatch = lines[j].match(/<Portal(\s|>)/);
          if (portalMatch) {
            violations.push({
              file: file.replace(process.cwd(), ''),
              line: i + 1,
              snippet: lines.slice(i, j + 1).join('\n'),
            });
            break;
          }
        }
      }
    }

    if (violations.length > 0) {
      const details = violations
        .map(v => `\n  ${v.file}:${v.line}\n  ${v.snippet.replace(/\n/g, '\n  ')}`)
        .join('\n');

      expect.fail(
        `❌ Found ${violations.length} Show/Switch/Match wrapping Portal (anti-pattern):${details}\n\n` +
          `Phase 9.6 교훈: Show가 Portal을 감싸면 DOM 렌더링이 차단됩니다.\n` +
          `해결 방법: Portal은 항상 렌더링하고, CSS로 가시성 제어하세요.\n`
      );
    }
  });

  /**
   * 과도한 Show 중첩 검사 (3단계 이상)
   * 중첩이 깊으면 반응성 추적이 복잡해지고 성능 저하
   */
  it('HIGH: Show components should not nest deeper than 2 levels', () => {
    const tsxFiles = collectTsFiles(srcDir).filter(f => f.endsWith('.tsx'));
    const violations: Array<{ file: string; line: number; depth: number }> = [];

    for (const file of tsxFiles) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      let depth = 0;
      let maxDepth = 0;
      let maxDepthLine = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Show 시작
        if (line.match(/<Show\s+when=/)) {
          depth++;
          if (depth > maxDepth) {
            maxDepth = depth;
            maxDepthLine = i + 1;
          }
        }

        // Show 종료 (</Show> 또는 자기 닫기 />)
        if (line.match(/<\/Show>/) || (depth > 0 && line.match(/\/>/))) {
          depth--;
        }
      }

      if (maxDepth > 2) {
        violations.push({
          file: file.replace(process.cwd(), ''),
          line: maxDepthLine,
          depth: maxDepth,
        });
      }
    }

    if (violations.length > 0) {
      const details = violations.map(v => `\n  ${v.file}:${v.line} (depth: ${v.depth})`).join('');

      expect.fail(
        `❌ Found ${violations.length} files with Show nesting deeper than 2 levels:${details}\n\n` +
          `권장: Show 중첩은 최대 2단계까지. 더 깊은 중첩이 필요하면 컴포넌트 분리를 고려하세요.\n`
      );
    }
  });

  /**
   * Show의 fallback과 children 동시 사용 검증
   * fallback이 있으면 children은 조건부 렌더링되므로 명확한 의도 필요
   */
  it('MEDIUM: Show with fallback should have clear intent', () => {
    const tsxFiles = collectTsFiles(srcDir).filter(f => f.endsWith('.tsx'));
    const warnings: Array<{ file: string; line: number }> = [];

    for (const file of tsxFiles) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Show with fallback but no clear when condition
        const showMatch = line.match(/<Show\s+when=\{([^}]+)\}.*fallback=/);
        if (showMatch) {
          const condition = showMatch[1].trim();
          // 단순 boolean이 아닌 복잡한 조건은 경고 (예: a && b || c)
          if (condition.includes('&&') || condition.includes('||')) {
            warnings.push({
              file: file.replace(process.cwd(), ''),
              line: i + 1,
            });
          }
        }
      }
    }

    // 이건 경고만 출력 (테스트 실패 아님)
    if (warnings.length > 0) {
      const details = warnings.map(w => `\n  ${w.file}:${w.line}`).join('');
      console.warn(
        `⚠️ Found ${warnings.length} Show components with complex conditions and fallback:${details}\n` +
          `권장: 복잡한 조건은 createMemo로 명확하게 표현하세요.\n`
      );
    }

    // 경고는 실패 아님
    expect(true).toBe(true);
  });
});
