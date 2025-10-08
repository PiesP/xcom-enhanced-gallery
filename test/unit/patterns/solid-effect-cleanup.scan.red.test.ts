import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

/**
 * @fileoverview Solid.js createEffect 메모리 안전성 검증
 * @description onCleanup 누락 및 메모리 누수 위험 탐지
 *
 * Phase 9.7: createEffect 메모리 관리 점검
 *
 * 검증 항목:
 * 1. createEffect에서 EventListener 추가 시 onCleanup 누락
 * 2. createEffect에서 Timer 생성 시 정리 누락
 * 3. createEffect에서 IntersectionObserver/MutationObserver 정리 누락
 * 4. createEffect 내부의 DOM 조작 패턴
 */

describe('[Pattern Guard] Solid.js createEffect Cleanup', () => {
  const srcDir = join(process.cwd(), 'src');

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
   * createEffect 내부에서 addEventListener를 사용하지만 onCleanup이 없는 경우
   */
  it('CRITICAL: createEffect with addEventListener must have onCleanup', () => {
    const tsFiles = collectTsFiles(srcDir);
    const violations: Array<{ file: string; line: number; snippet: string }> = [];

    for (const file of tsFiles) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      let insideCreateEffect = false;
      let effectStartLine = 0;
      let hasAddEventListener = false;
      let hasOnCleanup = false;
      let braceDepth = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // createEffect 시작
        if (line.match(/createEffect\s*\(/)) {
          insideCreateEffect = true;
          effectStartLine = i;
          hasAddEventListener = false;
          hasOnCleanup = false;
          braceDepth = 0;
        }

        if (!insideCreateEffect) continue;

        // 괄호 깊이 추적
        braceDepth += (line.match(/\{/g) || []).length;
        braceDepth -= (line.match(/\}/g) || []).length;

        // addEventListener 발견
        if (line.match(/\.addEventListener\(/)) {
          hasAddEventListener = true;
        }

        // onCleanup 발견
        if (line.match(/onCleanup\s*\(/)) {
          hasOnCleanup = true;
        }

        // createEffect 종료 (괄호가 닫힘)
        if (braceDepth < 0 && insideCreateEffect) {
          if (hasAddEventListener && !hasOnCleanup) {
            violations.push({
              file: file.replace(process.cwd(), ''),
              line: effectStartLine + 1,
              snippet: lines.slice(effectStartLine, i + 1).join('\n'),
            });
          }

          insideCreateEffect = false;
        }
      }
    }

    if (violations.length > 0) {
      const details = violations
        .map(v => `\n  ${v.file}:${v.line}\n  Snippet:\n${v.snippet.substring(0, 200)}...`)
        .join('\n');

      expect.fail(
        `❌ Found ${violations.length} createEffect with addEventListener but no onCleanup:${details}\n\n` +
          `메모리 누수 위험: EventListener는 반드시 onCleanup에서 제거해야 합니다.\n` +
          `해결: onCleanup(() => element.removeEventListener(...));\n`
      );
    }
  });

  /**
   * createEffect 내부에서 setTimeout/setInterval 사용 시 정리 확인
   */
  it('CRITICAL: createEffect with setTimeout/setInterval must clear timers', () => {
    const tsFiles = collectTsFiles(srcDir);
    const violations: Array<{ file: string; line: number; timerType: string }> = [];

    for (const file of tsFiles) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      let insideCreateEffect = false;
      let effectStartLine = 0;
      let hasTimer = false;
      let timerType = '';
      let hasClearTimer = false;
      let braceDepth = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.match(/createEffect\s*\(/)) {
          insideCreateEffect = true;
          effectStartLine = i;
          hasTimer = false;
          timerType = '';
          hasClearTimer = false;
          braceDepth = 0;
        }

        if (!insideCreateEffect) continue;

        braceDepth += (line.match(/\{/g) || []).length;
        braceDepth -= (line.match(/\}/g) || []).length;

        // Timer 생성 발견
        const timeoutMatch = line.match(/setTimeout\(/);
        const intervalMatch = line.match(/setInterval\(/);
        if (timeoutMatch) {
          hasTimer = true;
          timerType = 'setTimeout';
        }
        if (intervalMatch) {
          hasTimer = true;
          timerType = 'setInterval';
        }

        // Timer 정리 발견
        if (line.match(/clearTimeout|clearInterval/)) {
          hasClearTimer = true;
        }

        if (braceDepth < 0 && insideCreateEffect) {
          if (hasTimer && !hasClearTimer) {
            violations.push({
              file: file.replace(process.cwd(), ''),
              line: effectStartLine + 1,
              timerType,
            });
          }

          insideCreateEffect = false;
        }
      }
    }

    if (violations.length > 0) {
      const details = violations.map(v => `\n  ${v.file}:${v.line} (${v.timerType})`).join('');

      expect.fail(
        `❌ Found ${violations.length} createEffect with uncleaned timers:${details}\n\n` +
          `메모리 누수 위험: Timer는 onCleanup에서 clear해야 합니다.\n` +
          `해결: onCleanup(() => clearTimeout(timerId));\n`
      );
    }
  });

  /**
   * createEffect 내부에서 IntersectionObserver/MutationObserver 사용 시 disconnect 확인
   */
  it('HIGH: createEffect with Observer API must disconnect', () => {
    const tsFiles = collectTsFiles(srcDir);
    const violations: Array<{ file: string; line: number; observerType: string }> = [];

    for (const file of tsFiles) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      let insideCreateEffect = false;
      let effectStartLine = 0;
      let hasObserver = false;
      let observerType = '';
      let hasDisconnect = false;
      let braceDepth = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.match(/createEffect\s*\(/)) {
          insideCreateEffect = true;
          effectStartLine = i;
          hasObserver = false;
          observerType = '';
          hasDisconnect = false;
          braceDepth = 0;
        }

        if (!insideCreateEffect) continue;

        braceDepth += (line.match(/\{/g) || []).length;
        braceDepth -= (line.match(/\}/g) || []).length;

        // Observer 생성 발견
        const intersectionMatch = line.match(/new\s+IntersectionObserver\(/);
        const mutationMatch = line.match(/new\s+MutationObserver\(/);
        const resizeMatch = line.match(/new\s+ResizeObserver\(/);

        if (intersectionMatch) {
          hasObserver = true;
          observerType = 'IntersectionObserver';
        }
        if (mutationMatch) {
          hasObserver = true;
          observerType = 'MutationObserver';
        }
        if (resizeMatch) {
          hasObserver = true;
          observerType = 'ResizeObserver';
        }

        // disconnect 발견
        if (line.match(/\.disconnect\(/)) {
          hasDisconnect = true;
        }

        if (braceDepth < 0 && insideCreateEffect) {
          if (hasObserver && !hasDisconnect) {
            violations.push({
              file: file.replace(process.cwd(), ''),
              line: effectStartLine + 1,
              observerType,
            });
          }

          insideCreateEffect = false;
        }
      }
    }

    if (violations.length > 0) {
      const details = violations.map(v => `\n  ${v.file}:${v.line} (${v.observerType})`).join('');

      expect.fail(
        `❌ Found ${violations.length} createEffect with undisconnected Observers:${details}\n\n` +
          `메모리 누수 위험: Observer는 onCleanup에서 disconnect해야 합니다.\n` +
          `해결: onCleanup(() => observer.disconnect());\n`
      );
    }
  });

  /**
   * createEffect가 없는데 onCleanup을 사용하는 경우 (잘못된 사용)
   */
  it('LOW: onCleanup should only be used inside createEffect or component', () => {
    const tsFiles = collectTsFiles(srcDir);
    const warnings: Array<{ file: string; line: number }> = [];

    for (const file of tsFiles) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      let insideComponent = false;
      let insideCreateEffect = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 컴포넌트 시작 (export const ComponentName: Component = ...)
        if (line.match(/export\s+const\s+\w+:\s*Component/)) {
          insideComponent = true;
        }

        // createEffect 시작
        if (line.match(/createEffect\s*\(/)) {
          insideCreateEffect = true;
        }

        // onCleanup 발견
        if (line.match(/onCleanup\s*\(/) && !insideComponent && !insideCreateEffect) {
          warnings.push({
            file: file.replace(process.cwd(), ''),
            line: i + 1,
          });
        }

        // createEffect 종료 (간단한 추적)
        if (line.match(/\}\);/) && insideCreateEffect) {
          insideCreateEffect = false;
        }
      }
    }

    if (warnings.length > 0) {
      const details = warnings.map(w => `\n  ${w.file}:${w.line}`).join('');
      console.warn(
        `⚠️ Found ${warnings.length} onCleanup outside createEffect/component:${details}\n` +
          `onCleanup은 createEffect 또는 컴포넌트 내부에서만 유효합니다.\n`
      );
    }

    expect(true).toBe(true);
  });
});
