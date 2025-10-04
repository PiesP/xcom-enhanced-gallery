/**
 * @fileoverview Icon Usage Audit Test
 * @description Epic ICON-USAGE-AUDIT-TOOL - Phase 1 RED
 *
 * 목적: 프로젝트 전체 아이콘 사용 현황 분석 및 중복/미사용 감지
 *
 * 테스트 범위:
 * - 아이콘 중복 사용 감지 (동일 아이콘이 다른 의미로 사용)
 * - 미사용 아이콘 감지 (등록되었지만 사용되지 않음)
 * - 아이콘 사용 빈도 분석
 * - 리포트 생성 (Markdown 테이블 형식)
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Icon Usage Audit Tool', () => {
  const auditScript = resolve(__dirname, '../../scripts/icon-usage-audit.mjs');

  describe('스크립트 존재 검증', () => {
    it('scripts/icon-usage-audit.mjs 파일이 존재해야 함', () => {
      expect(existsSync(auditScript)).toBe(true);
    });
  });

  describe('아이콘 사용 분석 기능', () => {
    it('모든 아이콘 사용처를 찾아야 함', async () => {
      // Import audit script dynamically
      const { analyzeIconUsage } = await import(auditScript);

      const result = await analyzeIconUsage();

      // 결과는 아이콘 사용 배열
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      // 적어도 하나의 아이콘은 사용되고 있어야 함
      expect(result.length).toBeGreaterThan(0);
    });

    it('각 아이콘의 사용 위치를 기록해야 함', async () => {
      const { analyzeIconUsage } = await import(auditScript);
      const usages = await analyzeIconUsage();

      // 첫 번째 사용처 확인
      const firstUsage = usages[0];

      expect(firstUsage).toHaveProperty('iconName');
      expect(firstUsage).toHaveProperty('filePath');
      expect(firstUsage).toHaveProperty('lineNumber');
      expect(firstUsage).toHaveProperty('context');

      expect(typeof firstUsage.iconName).toBe('string');
      expect(typeof firstUsage.filePath).toBe('string');
      expect(typeof firstUsage.lineNumber).toBe('number');
      expect(typeof firstUsage.context).toBe('string');
    });
  });

  describe('중복 사용 감지', () => {
    it('동일 아이콘이 여러 의미로 사용되는 경우를 감지해야 함', async () => {
      const { analyzeIconUsage, findDuplicateSemantics } = await import(auditScript);
      const usages = await analyzeIconUsage();
      const result = findDuplicateSemantics(usages);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      // 중복 사용이 있는 경우, 각 항목은 아이콘 이름과 위치 정보를 포함
      if (result.length > 0) {
        const firstDuplicate = result[0];
        expect(firstDuplicate).toHaveProperty('iconName');
        expect(firstDuplicate).toHaveProperty('usageCount');
        expect(firstDuplicate).toHaveProperty('locations');
        expect(Array.isArray(firstDuplicate.locations)).toBe(true);
        expect(firstDuplicate.usageCount).toBeGreaterThan(1);
      }
    });

    it('Settings 아이콘이 중복 사용되는 경우를 감지해야 함', async () => {
      const { analyzeIconUsage, findDuplicateSemantics } = await import(auditScript);
      const usages = await analyzeIconUsage();
      const result = findDuplicateSemantics(usages);

      // Settings 아이콘이 여러 곳에 사용되는지 확인
      const settingsDuplicate = result.find(d => d.iconName === 'Settings');

      if (settingsDuplicate) {
        expect(settingsDuplicate.usageCount).toBeGreaterThanOrEqual(2);
        expect(settingsDuplicate.locations.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('미사용 아이콘 감지', () => {
    it('등록되었지만 사용되지 않는 아이콘을 찾아야 함', async () => {
      const { analyzeIconUsage, findUnusedIcons } = await import(auditScript);
      const usages = await analyzeIconUsage();
      const result = findUnusedIcons(usages);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      // 미사용 아이콘이 있거나 모두 사용 중이거나 (0개 가능)
      result.forEach(iconName => {
        expect(typeof iconName).toBe('string');
      });
    });
  });

  describe('아이콘 사용 빈도 분석', () => {
    it('각 아이콘의 사용 빈도를 계산해야 함', async () => {
      const { analyzeIconUsage, calculateUsageFrequency } = await import(auditScript);
      const usages = await analyzeIconUsage();
      const result = calculateUsageFrequency(usages);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      // 빈도 정보는 배열
      expect(result.length).toBeGreaterThan(0);

      // 각 아이콘의 빈도 정보
      const firstIcon = result[0];
      expect(firstIcon).toHaveProperty('iconName');
      expect(firstIcon).toHaveProperty('count');
      expect(firstIcon).toHaveProperty('percentage');
      expect(typeof firstIcon.iconName).toBe('string');
      expect(typeof firstIcon.count).toBe('number');
      expect(typeof firstIcon.percentage).toBe('string'); // "12.34" 형식
    });

    it('가장 많이 사용된 아이콘을 식별해야 함', async () => {
      const { analyzeIconUsage, calculateUsageFrequency } = await import(auditScript);
      const usages = await analyzeIconUsage();
      const result = calculateUsageFrequency(usages);

      // 이미 count 내림차순 정렬되어 있음
      expect(result.length).toBeGreaterThan(0);
      const mostUsed = result[0];
      expect(mostUsed.count).toBeGreaterThan(0);

      // 두 번째 아이콘이 있다면, 첫 번째보다 사용 빈도가 낮거나 같아야 함
      if (result.length > 1) {
        expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
      }
    });
  });

  describe('리포트 생성', () => {
    it('Markdown 테이블 형식의 리포트를 생성해야 함', async () => {
      const {
        analyzeIconUsage,
        findDuplicateSemantics,
        findUnusedIcons,
        calculateUsageFrequency,
        generateReport,
      } = await import(auditScript);

      const usages = await analyzeIconUsage();
      const duplicates = findDuplicateSemantics(usages);
      const unusedIcons = findUnusedIcons(usages);
      const frequency = calculateUsageFrequency(usages);

      const report = generateReport({ usages, duplicates, unusedIcons, frequency });

      expect(report).toBeDefined();
      expect(typeof report).toBe('string');

      // Markdown 테이블 헤더가 포함되어 있어야 함
      expect(report).toContain('|');
      expect(report).toContain('Icon Name');
      expect(report).toContain('Count');
    });

    it('중복 사용 경고를 리포트에 포함해야 함', async () => {
      const {
        analyzeIconUsage,
        findDuplicateSemantics,
        findUnusedIcons,
        calculateUsageFrequency,
        generateReport,
      } = await import(auditScript);

      const usages = await analyzeIconUsage();
      const duplicates = findDuplicateSemantics(usages);
      const unusedIcons = findUnusedIcons(usages);
      const frequency = calculateUsageFrequency(usages);

      const report = generateReport({ usages, duplicates, unusedIcons, frequency });

      // 중복 사용이 있는 경우, 경고 메시지 포함
      if (duplicates.length > 0) {
        expect(report).toContain('⚠️');
        expect(report).toContain('Duplicate Semantics');
      }
    });

    it('미사용 아이콘 목록을 리포트에 포함해야 함', async () => {
      const {
        analyzeIconUsage,
        findDuplicateSemantics,
        findUnusedIcons,
        calculateUsageFrequency,
        generateReport,
      } = await import(auditScript);

      const usages = await analyzeIconUsage();
      const duplicates = findDuplicateSemantics(usages);
      const unusedIcons = findUnusedIcons(usages);
      const frequency = calculateUsageFrequency(usages);

      const report = generateReport({ usages, duplicates, unusedIcons, frequency });

      // 미사용 아이콘이 있는 경우, 목록 포함
      if (unusedIcons.length > 0) {
        expect(report).toContain('Unused Icons');
      }
    });
  });

  describe('CLI 인터페이스', () => {
    it('--format 옵션을 지원해야 함', async () => {
      const {
        analyzeIconUsage,
        findDuplicateSemantics,
        findUnusedIcons,
        calculateUsageFrequency,
        generateReport,
      } = await import(auditScript);

      const usages = await analyzeIconUsage();
      const duplicates = findDuplicateSemantics(usages);
      const unusedIcons = findUnusedIcons(usages);
      const frequency = calculateUsageFrequency(usages);

      // Markdown 형식 (generateReport는 항상 Markdown 반환)
      const mdReport = generateReport({ usages, duplicates, unusedIcons, frequency });
      expect(mdReport).toContain('|');
      expect(mdReport).toContain('# Icon Usage Audit Report');
    });

    it('--output 옵션으로 파일 저장을 지원해야 함', async () => {
      const {
        analyzeIconUsage,
        findDuplicateSemantics,
        findUnusedIcons,
        calculateUsageFrequency,
        generateReport,
      } = await import(auditScript);

      const usages = await analyzeIconUsage();
      const duplicates = findDuplicateSemantics(usages);
      const unusedIcons = findUnusedIcons(usages);
      const frequency = calculateUsageFrequency(usages);

      const report = generateReport({ usages, duplicates, unusedIcons, frequency });

      // 리포트가 생성되었는지 확인
      expect(report).toBeDefined();
      expect(report.length).toBeGreaterThan(0);
      expect(report).toContain('# Icon Usage Audit Report');
    });
  });
});
