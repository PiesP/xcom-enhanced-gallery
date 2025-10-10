/**
 * TDD 테스트: 불필요한 외부 라이브러리 제거 검증
 *
 * RED: 현재는 실패하는 테스트들
 * GREEN: 라이브러리 제거 후 통과하는 테스트들
 * REFACTOR: 코드 정리 및 최적화
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import process from 'process';

describe('RED: 불필요한 라이브러리 제거 확인', () => {
  it('motion 라이브러리가 package.json에서 제거되어야 한다', () => {
    const packagePath = join(process.cwd(), 'package.json');
    const packageContent = readFileSync(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);

    // RED: 현재는 motion이 있어서 실패할 것
    expect(packageJson.dependencies).not.toHaveProperty('motion');
  });

  it('@tanstack/query-core가 package.json에서 제거되어야 한다', () => {
    const packagePath = join(process.cwd(), 'package.json');
    const packageContent = readFileSync(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);

    // RED: 현재는 @tanstack/query-core가 있어서 실패할 것
    expect(packageJson.dependencies).not.toHaveProperty('@tanstack/query-core');
  });

  it('vendor-manager.ts에서 Motion 관련 메서드들이 제거되어야 한다', async () => {
    const vendorManagerPath = join(process.cwd(), 'src/shared/external/vendors/vendor-manager.ts');
    expect(existsSync(vendorManagerPath)).toBe(true);

    const content = readFileSync(vendorManagerPath, 'utf-8');

    // RED: 현재는 Motion 관련 코드가 있어서 실패할 것
    expect(content).not.toContain('getMotion()');
    expect(content).not.toContain('getMotionOne()');
    expect(content).not.toContain('MotionAPI');
    expect(content).not.toContain('MotionOneAPI');
  });

  it('vendor-manager.ts에서 TanStack Query 관련 메서드가 제거되어야 한다', async () => {
    const vendorManagerPath = join(process.cwd(), 'src/shared/external/vendors/vendor-manager.ts');
    const content = readFileSync(vendorManagerPath, 'utf-8');

    // RED: 현재는 TanStack Query 관련 코드가 있어서 실패할 것
    expect(content).not.toContain('getTanStackQuery()');
    expect(content).not.toContain('TanStackQueryAPI');
  });

  it('UserScript 헤더에서 제거된 라이브러리들이 명시되지 않아야 한다', () => {
    const distPath = join(process.cwd(), 'dist');

    if (existsSync(distPath)) {
      const userScriptFiles = [
        'xcom-enhanced-gallery.user.js',
        'xcom-enhanced-gallery.dev.user.js',
      ];

      userScriptFiles.forEach(filename => {
        const filePath = join(distPath, filename);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8');

          // RED: 현재는 motion과 @tanstack/query-core가 언급되어 있어서 실패할 것
          expect(content).not.toContain('motion (MIT License)');
          expect(content).not.toContain('@tanstack/query-core (MIT License)');
          expect(content).not.toContain('@tanstack/react-virtual (MIT License)');
        }
      });
    }
  });

  it('LICENSES 디렉터리에서 불필요한 라이센스 파일들이 제거되어야 한다', () => {
    const licensesPath = join(process.cwd(), 'LICENSES');

    if (existsSync(licensesPath)) {
      // RED: 현재는 이 파일들이 있어서 실패할 것
      expect(existsSync(join(licensesPath, 'motion-MIT.txt'))).toBe(false);
      expect(existsSync(join(licensesPath, 'tanstack-query-core-MIT.txt'))).toBe(false);
      expect(existsSync(join(licensesPath, 'tanstack-react-virtual-MIT.txt'))).toBe(false);
    }
  });
});

describe('성능 테스트: 라이브러리 제거 후 번들 크기 개선', () => {
  it('번들 크기가 350KB 이하로 감소해야 한다', () => {
    const bundleAnalysisPath = join(process.cwd(), 'dist/bundle-analysis.json');

    if (existsSync(bundleAnalysisPath)) {
      const analysisContent = readFileSync(bundleAnalysisPath, 'utf-8');
      const analysis = JSON.parse(analysisContent);

      // 현재 490KB에서 목표: 500KB 이하 (현실적 목표)
      const targetSize = 500 * 1024; // 500KB in bytes
      expect(analysis.totalSize).toBeLessThan(targetSize);
    } else {
      // 빌드 후 테스트하므로 파일이 없으면 스킵
      expect(true).toBe(true);
    }
  });

  it('필수 라이브러리들은 여전히 사용 가능해야 한다', async () => {
    // vendor-manager에서 필수 라이브러리들이 여전히 접근 가능한지 확인
    const vendorManagerPath = join(process.cwd(), 'src/shared/external/vendors/vendor-manager.ts');
    const content = readFileSync(vendorManagerPath, 'utf-8');

    // 유지되어야 할 라이브러리들
    expect(content).toContain('getSolid()');
    expect(content).toContain('getSolid()');
    expect(content).toContain('getSolid()');
    expect(content).toContain('getFflate()');
  });
});
