/**
 * @fileoverview TDD DOM Legacy 제거 테스트
 * @description unified-dom-service를 새로운 DOMService로 완전 교체하는 REFACTOR 단계
 */

import { describe, test, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('TDD DOM Legacy 제거 - REFACTOR 단계', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const srcDir = path.join(projectRoot, 'src');

  describe('unified-dom-service 제거 확인', () => {
    test('unified-dom-service.ts 파일이 제거되어야 함', () => {
      const unifiedDomServicePath = path.join(srcDir, 'shared/services/unified-dom-service.ts');
      const exists = fs.existsSync(unifiedDomServicePath);

      if (exists) {
        // 아직 제거되지 않았다면, 파일 내용 확인
        const content = fs.readFileSync(unifiedDomServicePath, 'utf-8');
        expect(content).toContain('@deprecated'); // 최소한 deprecated 마킹은 되어있어야 함
      }

      // 최종 목표: 파일이 존재하지 않아야 함 (아직 FAILING 상태)
      expect(exists).toBe(false);
    });

    test('unified-dom-service import가 모두 제거되어야 함', () => {
      const serviceIndexPath = path.join(srcDir, 'shared/services/index.ts');
      const content = fs.readFileSync(serviceIndexPath, 'utf-8');

      // unified-dom-service import나 export가 없어야 함
      expect(content).not.toContain('unified-dom-service');
    });

    test('unified-services-cleanup에서 unified-dom-service 참조가 제거되어야 함', () => {
      const cleanupPath = path.join(srcDir, 'shared/services/unified-services-cleanup.ts');
      if (fs.existsSync(cleanupPath)) {
        const content = fs.readFileSync(cleanupPath, 'utf-8');

        // unified-dom-service 참조가 없어야 함
        expect(content).not.toContain('unified-dom-service');
      }
    });
  });

  describe('DOMService로의 완전 이전 확인', () => {
    test('모든 DOM 관련 import가 @shared/dom을 사용해야 함', () => {
      const findTsFiles = (dir: string): string[] => {
        const files: string[] = [];
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            files.push(...findTsFiles(fullPath));
          } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
            files.push(fullPath);
          }
        }

        return files;
      };

      const tsFiles = findTsFiles(srcDir);
      const problematicFiles: string[] = [];

      for (const file of tsFiles) {
        const content = fs.readFileSync(file, 'utf-8');

        // 레거시 DOM import 패턴 검색
        if (content.includes('unified-dom-service') || content.includes('UnifiedDOMService')) {
          problematicFiles.push(path.relative(srcDir, file));
        }
      }

      if (problematicFiles.length > 0) {
        console.log('🔍 Legacy DOM service를 사용하는 파일들:', problematicFiles);
      }

      // 최종적으로는 레거시 사용이 없어야 함
      expect(problematicFiles).toHaveLength(0);
    });

    test('새로운 DOMService API 사용 확인', () => {
      // 주요 파일들이 새로운 DOMService를 사용하는지 확인
      const mainFiles = [
        'main.ts',
        'features/gallery/GalleryApp.ts',
        'shared/services/core-services.ts',
      ];

      for (const file of mainFiles) {
        const filePath = path.join(srcDir, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');

          // DOM 관련 import가 있다면 @shared/dom을 사용해야 함
          if (content.includes('querySelector') || content.includes('createElement')) {
            expect(content).toMatch(/@shared\/dom|DOMService/);
          }
        }
      }
    });
  });

  describe('API 호환성 유지 확인', () => {
    test('기존 API가 새로운 DOMService에서 사용 가능해야 함', async () => {
      // 새로운 DOMService에서 기존 API들이 호환되는지 확인
      const {
        querySelector,
        createElement,
        addEventListener,
        addClass,
        removeClass,
        setStyle,
        removeElement,
      } = await import('@shared/dom');

      // 모든 주요 API가 함수여야 함
      expect(typeof querySelector).toBe('function');
      expect(typeof createElement).toBe('function');
      expect(typeof addEventListener).toBe('function');
      expect(typeof addClass).toBe('function');
      expect(typeof removeClass).toBe('function');
      expect(typeof setStyle).toBe('function');
      expect(typeof removeElement).toBe('function');
    });

    test('DOMService 인스턴스가 올바르게 동작해야 함', async () => {
      const { DOMService } = await import('@shared/dom');

      expect(DOMService).toBeDefined();
      expect(typeof DOMService.getInstance).toBe('function');

      const instance = DOMService.getInstance();
      expect(instance).toBeDefined();
      expect(typeof instance.querySelector).toBe('function');
      expect(typeof instance.createElement).toBe('function');
    });
  });
});
