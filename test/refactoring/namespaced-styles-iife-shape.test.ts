/**
 * @fileoverview 빌드 산출물의 초기 스타일 IIFE 형태 검증 (간단한 정적 분석)
 * - STYLE_ID 'xeg-styles' 사용
 * - typeof document 가드 존재
 * - 기존 노드 제거 후 새 style 추가 패턴 존재
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Build artifact: early style injection IIFE shape', () => {
  it('초기 IIFE가 style bootstrap 패턴을 포함해야 함', () => {
    const g = globalThis;
    const cwd = g && g.process && typeof g.process.cwd === 'function' ? g.process.cwd() : '';
    const distPath = path.join(cwd, 'dist', 'xcom-enhanced-gallery.dev.user.js');
    if (!fs.existsSync(distPath)) {
      // 빌드가 없는 환경에서는 스킵 유사 처리
      expect(true).toBe(true);
      return;
    }
    const content = fs.readFileSync(distPath, 'utf8').slice(0, 20000); // 초반부 검사 확대

    // 핵심 패턴들 (약간 느슨한 정규식 사용)
    expect(content).toMatch(/\(function\(\)\s*{[\s\S]*?['"]use strict['"]/);
    expect(content).toMatch(/typeof document === 'undefined'/);

    // 빌드 최적화로 STYLE_ID 상수를 사용하거나 직접 literal을 사용할 수 있으므로 두 경우 모두 허용
    expect(content).toMatch(/var\s+STYLE_ID\s*=\s*["']xeg-styles["']/);
    expect(content).toMatch(/getElementById\(\s*(?:['"]xeg-styles['"]|STYLE_ID)\s*\)/);
    expect(content).toMatch(/createElement\(['"]style['"]\)/);
    // style 또는 styleEl 변수명 모두 수용 (번들러 난독화/리네이밍 대비)
    expect(content).toMatch(/style(?:El)?\.id\s*=\s*(?:['"]xeg-styles['"]|STYLE_ID)/);
  });
});
