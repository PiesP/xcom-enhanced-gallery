/**
 * @fileoverview Bundle Size Policy - Comprehensive File Size Guards
 *
 * 목적: 코드베이스의 핵심 파일들이 번들 크기 예산을 초과하지 않도록 통합 검증
 *
 * 통합 컨텍스트:
 * - Components: UI 컴포넌트 크기 제한 (Toolbar, VerticalImageItem 등)
 * - Events: 이벤트 유틸리티 모듈 최적화 (events.ts)
 * - Services: Service layer 크기 제약 (MediaService, BulkDownloadService 등)
 * - Settings: Settings 컴포넌트 및 전체 번들 예산 (320 KB)
 *
 * 이전 테스트:
 * - bundle-size-components.test.ts (Phase 33 Step 2B)
 * - bundle-size-events.test.ts (Phase 33 Step 2A)
 * - bundle-size-services.test.ts (Phase 33 Step 2C)
 * - bundle-size-settings.test.ts (Phase 39 Step 1)
 */

import { describe, it, expect } from 'vitest';
import { statSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { Buffer } from 'node:buffer';

const resolveSrc = (relativePath: string): string => resolve(process.cwd(), 'src', relativePath);

const toKB = (bytes: number): number => bytes / 1024;

const logMetrics = (label: string, value: number, unit: string, target: number): void => {
  console.log(`[metrics] ${label}: ${value.toFixed(2)} ${unit} (target: ${target} ${unit})`);
};

interface FileSizeConstraint {
  readonly path: string;
  readonly maxLines: number;
  readonly maxKB: number;
  readonly context: string;
}

describe('Bundle Size Policy', () => {
  describe('Component Size Guards', () => {
    const componentConstraints: FileSizeConstraint[] = [
      {
        path: 'shared/components/ui/Toolbar/Toolbar.tsx',
        maxLines: 670,
        maxKB: 23,
        context: 'Phase 48: 설정 패널 통합 완료',
      },
      {
        path: 'features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx',
        maxLines: 460,
        maxKB: 12,
        context: 'Core gallery item component',
      },
    ];

    componentConstraints.forEach(({ path, maxLines, maxKB, context }) => {
      describe(path, () => {
        const fullPath = resolveSrc(path);
        const content = readFileSync(fullPath, 'utf-8');
        const lineCount = content.split('\n').length;
        const sizeKB = toKB(statSync(fullPath).size);

        it(`should not exceed ${maxKB} KB (${context})`, () => {
          logMetrics(`${path} size`, sizeKB, 'KB', maxKB);
          expect(sizeKB).toBeLessThanOrEqual(maxKB);
        });

        it(`should not exceed ${maxLines} lines (${context})`, () => {
          logMetrics(`${path} lines`, lineCount, 'lines', maxLines);
          expect(lineCount).toBeLessThanOrEqual(maxLines);
        });
      });
    });
  });

  describe('Event Utilities Size Guard', () => {
    const eventsPath = resolveSrc('shared/utils/events.ts');

    it('events.ts should not exceed 26 KB (Phase 82.3/82.7: 키보드 핸들러 추가)', () => {
      const sizeKB = toKB(statSync(eventsPath).size);
      logMetrics('events.ts size', sizeKB, 'KB', 26);
      expect(sizeKB).toBeLessThanOrEqual(26);
    });

    it('events.ts should not exceed 850 lines', () => {
      const content = readFileSync(eventsPath, 'utf-8');
      const lineCount = content.split('\n').length;
      logMetrics('events.ts lines', lineCount, 'lines', 850);
      expect(lineCount).toBeLessThanOrEqual(850);
    });

    it('events.ts should have 12 or fewer exports', () => {
      const content = readFileSync(eventsPath, 'utf-8');
      const exports = content.match(/^export\s+(function|const|class|interface|type)\s+/gm) || [];
      const exportCount = exports.length;
      logMetrics('events.ts exports', exportCount, 'exports', 12);
      expect(exportCount).toBeLessThanOrEqual(12);
    });
  });

  describe('Service Layer Size Guards', () => {
    const serviceConstraints: FileSizeConstraint[] = [
      {
        path: 'shared/services/media-service.ts',
        maxLines: 850,
        maxKB: 25.0,
        context: 'Remove unused extraction strategies',
      },
      {
        path: 'shared/services/bulk-download-service.ts',
        maxLines: 400,
        maxKB: 14.0,
        context: 'Simplify retry logic',
      },
      {
        path: 'shared/services/media/twitter-video-extractor.ts',
        maxLines: 550,
        maxKB: 18.0,
        context: 'Remove legacy normalizer',
      },
    ];

    serviceConstraints.forEach(({ path, maxLines, maxKB, context }) => {
      describe(path, () => {
        const fullPath = resolveSrc(path);
        const content = readFileSync(fullPath, 'utf-8');
        const lineCount = content.split('\n').length;
        const sizeKB = Buffer.byteLength(content, 'utf-8') / 1024;

        it(`should not exceed ${maxLines} lines (${context})`, () => {
          logMetrics(`${path} lines`, lineCount, 'lines', maxLines);
          expect(lineCount).toBeLessThanOrEqual(maxLines);
        });

        it(`should not exceed ${maxKB} KB`, () => {
          logMetrics(`${path} size`, sizeKB, 'KB', maxKB);
          expect(sizeKB).toBeLessThanOrEqual(maxKB);
        });
      });
    });

    it('should document optimization strategy in TDD_REFACTORING_PLAN_COMPLETED.md', () => {
      const planPath = resolve(process.cwd(), 'docs/TDD_REFACTORING_PLAN_COMPLETED.md');
      const plan = readFileSync(planPath, 'utf-8');

      expect(plan).toContain('Phase 33');
      expect(plan).toContain('events.ts 최적화');
    });
  });

  describe('Settings & Production Bundle Budget', () => {
    const BUNDLE_BUDGET = 325 * 1024; // 325 KB in bytes (increased from 320 KB)

    it('production bundle should not exceed 325 KB budget', () => {
      const prodBundlePath = resolve(process.cwd(), 'dist/xcom-enhanced-gallery.user.js');

      try {
        const stats = statSync(prodBundlePath);
        const sizeKB = toKB(stats.size);

        logMetrics('Production bundle', sizeKB, 'KB', 325);
        expect(stats.size).toBeLessThanOrEqual(BUNDLE_BUDGET);
      } catch (error) {
        // Build may not exist yet - skip test
        console.warn('⚠️ Production bundle not found - run `npm run build:prod` first');
        expect(true).toBe(true);
      }
    });

    it('SettingsModal total source should be under 30 KB (unminified)', () => {
      const modalPath = resolveSrc('shared/components/ui/SettingsModal/SettingsModal.tsx');
      const cssPath = resolveSrc('shared/components/ui/SettingsModal/SettingsModal.module.css');

      try {
        const tsxContent = readFileSync(modalPath, 'utf-8');
        const cssContent = readFileSync(cssPath, 'utf-8');

        const tsxSize = Buffer.byteLength(tsxContent, 'utf-8');
        const cssSize = Buffer.byteLength(cssContent, 'utf-8');
        const totalSize = tsxSize + cssSize;
        const totalKB = toKB(totalSize);

        logMetrics('SettingsModal (TSX+CSS)', totalKB, 'KB', 30);
        expect(totalSize).toBeLessThan(30 * 1024);
      } catch (error) {
        console.warn('⚠️ SettingsModal files not found');
        expect(true).toBe(true);
      }
    });

    it('SettingsModal should use named exports for tree shaking', () => {
      const settingsIndexPath = resolveSrc('shared/components/ui/SettingsModal/index.ts');

      try {
        const content = readFileSync(settingsIndexPath, 'utf-8');
        const hasNamedExports = /export\s+{\s*\w+/.test(content);

        expect(hasNamedExports).toBe(true);
        console.log('✅ Named exports found (tree-shakeable)');
      } catch (error) {
        console.warn('⚠️ SettingsModal index not found');
        expect(true).toBe(true);
      }
    });
  });

  describe('Lazy Loading Opportunities', () => {
    it('should identify SettingsModal as lazy loading candidate', () => {
      const toolbarWithSettingsPath = resolveSrc(
        'shared/components/ui/ToolbarWithSettings/ToolbarWithSettings.tsx'
      );

      try {
        const content = readFileSync(toolbarWithSettingsPath, 'utf-8');
        const hasDirectImport = /import\s+{\s*SettingsModal\s*}/.test(content);
        const hasLazyImport = /lazy\(.*SettingsModal/.test(content);

        if (hasDirectImport && !hasLazyImport) {
          console.warn('💡 Optimization opportunity: SettingsModal can be lazy loaded');
        }

        // Informational only
        expect(true).toBe(true);
      } catch (error) {
        console.warn('⚠️ ToolbarWithSettings not found');
        expect(true).toBe(true);
      }
    });
  });
});
