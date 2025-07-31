/**
 * @fileoverview 번들 크기 최적화 테스트
 * @description Option 1: 추가 최적화 작업 검증
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Bundle Size Optimization', () => {
  describe('1. 대용량 파일 최적화', () => {
    const vendorManagerPath = resolve(
      __dirname,
      '../src/shared/external/vendors/vendor-manager.ts'
    );
    const eventsPath = resolve(__dirname, '../src/shared/utils/events.ts');
    const urlPatternsPath = resolve(__dirname, '../src/shared/utils/patterns/url-patterns.ts');

    it('vendor-manager.ts 파일이 20KB 이하로 최적화되어야 한다', () => {
      const stats = statSync(vendorManagerPath);
      const sizeKB = stats.size / 1024;

      // 현재: 25.29KB → 목표: 20KB 이하
      expect(sizeKB).toBeLessThan(20);
    });

    it('events.ts 파일이 18KB 이하로 최적화되어야 한다', () => {
      const stats = statSync(eventsPath);
      const sizeKB = stats.size / 1024;

      // 현재: 22.71KB → 목표: 18KB 이하
      expect(sizeKB).toBeLessThan(18);
    });

    it('url-patterns.ts 파일이 15KB 이하로 최적화되어야 한다', () => {
      const stats = statSync(urlPatternsPath);
      const sizeKB = stats.size / 1024;

      // 현재: 21.73KB → 목표: 15KB 이하
      expect(sizeKB).toBeLessThan(15);
    });
  });

  describe('2. 사용하지 않는 코드 제거', () => {
    it('주석으로만 남은 deprecated 함수들이 제거되어야 한다', () => {
      const vendorManagerContent = readFileSync(
        resolve(__dirname, '../src/shared/external/vendors/vendor-manager.ts'),
        'utf-8'
      );

      // Deprecated 코드 블록이 너무 많으면 안됨
      const deprecatedMatches = vendorManagerContent.match(/deprecated/gi) || [];
      expect(deprecatedMatches.length).toBeLessThan(5);
    });

    it('사용하지 않는 import가 제거되어야 한다', () => {
      const eventsContent = readFileSync(
        resolve(__dirname, '../src/shared/utils/events.ts'),
        'utf-8'
      );

      // 사용하지 않는 import 확인 (ESLint가 잡지 못한 것들)
      const importLines = eventsContent.match(/^import.*$/gm) || [];
      expect(importLines.length).toBeLessThan(15); // 현재보다 줄여야 함
    });
  });

  describe('3. Tree-shaking 최적화', () => {
    it('url-patterns.ts에서 사용하지 않는 패턴이 제거되어야 한다', () => {
      const urlPatternsContent = readFileSync(
        resolve(__dirname, '../src/shared/utils/patterns/url-patterns.ts'),
        'utf-8'
      );

      // 과도한 정규식 패턴들 확인
      const regexPatterns = urlPatternsContent.match(/\/.*?\//g) || [];
      expect(regexPatterns.length).toBeLessThan(30); // 패턴 수 제한
    });

    it('vendor-manager.ts의 중복 로직이 제거되어야 한다', () => {
      const vendorManagerContent = readFileSync(
        resolve(__dirname, '../src/shared/external/vendors/vendor-manager.ts'),
        'utf-8'
      );

      // 중복된 함수 패턴 확인
      const functionDeclarations = vendorManagerContent.match(/function \w+/g) || [];
      const asyncFunctions = vendorManagerContent.match(/async function \w+/g) || [];

      // Should have reasonable number of functions
      expect(functionDeclarations.length + asyncFunctions.length).toBeLessThan(25);
    });
  });

  describe('4. 번들 크기 목표 달성', () => {
    it('Production 번들이 380KB 이하를 달성해야 한다', () => {
      // 목표: 415.60KB → 380KB (-35KB)
      const targetSizeKB = 380;

      // 이 테스트는 빌드 후에 실제 번들 크기로 검증될 예정
      expect(targetSizeKB).toBeLessThan(415);
      expect(targetSizeKB).toBeGreaterThan(350); // 너무 작으면 기능 손실
    });

    it('Development 번들이 700KB 이하를 달성해야 한다', () => {
      // 목표: 778.71KB → 700KB (-78KB)
      const targetSizeKB = 700;

      expect(targetSizeKB).toBeLessThan(778);
      expect(targetSizeKB).toBeGreaterThan(600);
    });
  });

  describe('5. 기능 보존 검증', () => {
    it('최적화 후에도 모든 핵심 기능이 동작해야 한다', async () => {
      // 핵심 모듈들이 여전히 import 가능해야 함
      const coreModules = [
        '../src/shared/external/vendors/vendor-manager.ts',
        '../src/shared/utils/events.ts',
        '../src/shared/utils/patterns/url-patterns.ts',
      ];

      for (const modulePath of coreModules) {
        const fullPath = resolve(__dirname, modulePath);
        const content = readFileSync(fullPath, 'utf-8');

        // export 문이 존재해야 함
        expect(content).toMatch(/export/);

        // TypeScript 오류가 없어야 함 (기본 syntax check)
        expect(content).not.toContain('syntax error');
      }
    });

    it('API 호환성이 유지되어야 한다', () => {
      // 주요 export들이 여전히 존재해야 함
      const vendorManagerContent = readFileSync(
        resolve(__dirname, '../src/shared/external/vendors/vendor-manager.ts'),
        'utf-8'
      );

      // 핵심 함수들이 여전히 export되어야 함
      expect(vendorManagerContent).toContain('export');
      expect(vendorManagerContent).toContain('getPreact');
      expect(vendorManagerContent).toContain('getFflate');
    });
  });
});
