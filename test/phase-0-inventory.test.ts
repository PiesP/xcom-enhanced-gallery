/**
 * @fileoverview Phase 0: 인벤토리 & TDD Guards 테스트
 * 토큰 중복, Hex 직접 사용, Z-Index 충돌 감지
 */

import { describe, test, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

// CSS 파일 경로 수집 유틸리티
function getAllCSSFiles(dirPath: string) {
  const files = [];

  function traverseDir(currentPath: string) {
    const items = readdirSync(currentPath);

    for (const item of items) {
      const fullPath = join(currentPath, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverseDir(fullPath);
      } else if (item.endsWith('.css') || item.endsWith('.module.css')) {
        files.push(fullPath);
      }
    }
  }

  traverseDir(dirPath);
  return files;
}

describe('Phase 0: 토큰 중복 검사 (RED Tests)', () => {
  const srcPath = resolve(__dirname, '../src');
  const cssFiles = getAllCSSFiles(srcPath);

  test('Z-Index 토큰 중복 정의 검출 (실패해야 함)', () => {
    const zIndexTokens = {};

    cssFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const relativePath = filePath.replace(srcPath, '');

      // --xeg-z-* 토큰 찾기
      const zIndexMatches = content.match(/--xeg-z-[a-z-]+:\s*\d+/g);

      if (zIndexMatches) {
        zIndexMatches.forEach(match => {
          const tokenName = match.split(':')[0];
          if (!zIndexTokens[tokenName]) {
            zIndexTokens[tokenName] = [];
          }
          zIndexTokens[tokenName].push(relativePath);
        });
      }
    });

    // 중복 정의 찾기
    const duplicatedTokens = Object.entries(zIndexTokens).filter(([_, files]) => files.length > 1);

    if (duplicatedTokens.length > 0) {
      console.log('🔴 중복 Z-Index 토큰 발견:');
      duplicatedTokens.forEach(([token, files]) => {
        console.log(`  ${token}: ${files.join(', ')}`);
      });

      // 실패해야 함 (RED)
      expect(duplicatedTokens.length).toBe(0);
    } else {
      console.log('✅ Z-Index 토큰 중복 없음');
    }
  });

  test('직접 Hex 색상 사용 검출 (실패해야 함)', () => {
    const hexUsages = [];
    const allowedHexValues = ['#ffffff', '#000000']; // 임시 허용

    cssFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const relativePath = filePath.replace(srcPath, '');

      // Hex 색상 패턴 찾기 (#fff, #ffffff 등)
      const hexMatches = content.match(/#[0-9a-f]{3,6}/gi);

      if (hexMatches) {
        const nonAllowedHex = hexMatches.filter(
          hex => !allowedHexValues.includes(hex.toLowerCase())
        );

        if (nonAllowedHex.length > 0) {
          hexUsages.push({
            file: relativePath,
            matches: nonAllowedHex,
          });
        }
      }
    });

    if (hexUsages.length > 0) {
      console.log('🔴 직접 Hex 사용 발견:');
      hexUsages.forEach(({ file, matches }) => {
        console.log(`  ${file}: ${matches.join(', ')}`);
      });

      // 나중에 실패해야 함 (현재는 경고만)
      console.log(`총 ${hexUsages.length}개 파일에서 Hex 사용 중`);
    } else {
      console.log('✅ 직접 Hex 사용 없음');
    }
  });

  test('OKLCH 사용률 측정', () => {
    let oklchCount = 0;
    let totalColorTokens = 0;

    cssFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');

      // OKLCH 사용 카운트
      const oklchMatches = content.match(/oklch\([^)]+\)/g);
      if (oklchMatches) {
        oklchCount += oklchMatches.length;
      }

      // 총 색상 토큰 카운트 (--*-color-* 또는 color 속성)
      const colorTokenMatches = content.match(/(?:--[^:]*color[^:]*:|color\s*:)/g);
      if (colorTokenMatches) {
        totalColorTokens += colorTokenMatches.length;
      }
    });

    const oklchUsageRate = totalColorTokens > 0 ? (oklchCount / totalColorTokens) * 100 : 0;
    console.log(
      `📊 OKLCH 사용률: ${oklchUsageRate.toFixed(1)}% (${oklchCount}/${totalColorTokens})`
    );

    // 기준선 설정 (현재 상태)
    expect(oklchUsageRate).toBeGreaterThanOrEqual(0);
  });

  test('미사용 토큰 검출', () => {
    // 정의된 모든 CSS 변수 수집
    const definedTokens = new Set();
    const usedTokens = new Set();

    cssFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');

      // 토큰 정의 찾기 (--xeg-*)
      const tokenDefinitions = content.match(/--xeg-[a-z-]+(?=\s*:)/g);
      if (tokenDefinitions) {
        tokenDefinitions.forEach(token => definedTokens.add(token));
      }

      // 토큰 사용 찾기 (var(--xeg-*))
      const tokenUsages = content.match(/var\(--xeg-[^),\s]+/g);
      if (tokenUsages) {
        tokenUsages.forEach(usage => {
          const token = usage.replace('var(', '');
          usedTokens.add(token);
        });
      }
    });

    const unusedTokens = Array.from(definedTokens).filter(token => !usedTokens.has(token));

    if (unusedTokens.length > 0) {
      console.log('⚠️ 미사용 토큰 발견:');
      unusedTokens.slice(0, 10).forEach(token => console.log(`  ${token}`));
      if (unusedTokens.length > 10) {
        console.log(`  ... 그리고 ${unusedTokens.length - 10}개 더`);
      }
    }

    console.log(
      `📊 토큰 사용률: ${((usedTokens.size / definedTokens.size) * 100).toFixed(1)}% (${usedTokens.size}/${definedTokens.size})`
    );
  });
});

describe('Phase 0: Toolbar/Modal 컴포넌트 현황', () => {
  test('Deprecated 컴포넌트 존재 확인', () => {
    const srcPath = resolve(__dirname, '../src');
    const tsFiles = getAllCSSFiles(srcPath)
      .map(f => f.replace('.css', '.tsx'))
      .concat(getAllCSSFiles(srcPath).map(f => f.replace('.css', '.ts')));

    let deprecatedUsages = 0;

    tsFiles.forEach(filePath => {
      try {
        const content = readFileSync(filePath, 'utf-8');

        // EnhancedSettingsModal 사용 찾기
        if (content.includes('EnhancedSettingsModal')) {
          deprecatedUsages++;
        }
      } catch {
        // 파일이 없으면 무시
      }
    });

    console.log(`⚠️ Deprecated 컴포넌트 사용: ${deprecatedUsages}개 파일`);

    // 현재 상태 기록 (나중에 0이 되어야 함)
    expect(deprecatedUsages).toBeGreaterThanOrEqual(0);
  });
});
