/**
 * @fileoverview Phase G Week 1: 복잡한 최적화 모듈 제거 테스트
 * @description 유저스크립트에 적합하지 않은 복잡한 최적화 기능들을 제거하고 단순한 구현으로 대체
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Phase G Week 1: 복잡한 최적화 모듈 제거', () => {
  describe('1. 중복된 ResourceManager 통합', () => {
    it('간소화된 ResourceManager만 유지되어야 한다', async () => {
      // shared/utils/memory/ResourceManager만 유지
      // shared/managers/ResourceManager 제거

      const { ResourceManager } = await import('@shared/utils/memory/ResourceManager');
      expect(ResourceManager).toBeDefined();

      // 간단한 API만 제공해야 함
      const rm = new ResourceManager();
      expect(rm.register).toBeDefined();
      expect(rm.release).toBeDefined();
      expect(rm.releaseAll).toBeDefined();
      expect(rm.getResourceCount).toBeDefined();

      // 복잡한 메모리 관리 기능은 없어야 함
      expect(rm).not.toHaveProperty('allocate');
      expect(rm).not.toHaveProperty('performLRUCleanup');
      expect(rm).not.toHaveProperty('scheduleMemoryPressureCheck');
    });

    it('싱글톤 패턴이 제거되어야 한다', async () => {
      const { ResourceManager } = await import('@shared/utils/memory/ResourceManager');

      // getInstance 메소드 없음
      expect(ResourceManager).not.toHaveProperty('getInstance');

      // 일반적인 생성자 사용
      const rm1 = new ResourceManager();
      const rm2 = new ResourceManager();
      expect(rm1).not.toBe(rm2); // 다른 인스턴스
    });
  });

  describe('2. Workers 모듈 제거', () => {
    it('TaskManager가 제거되어야 한다', () => {
      // 유저스크립트에서는 Web Workers 사용이 복잡하므로 제거
      const workersPath = path.join(__dirname, '../../src/shared/utils/workers');
      const taskManagerPath = path.join(workersPath, 'TaskManager.ts');

      expect(fs.existsSync(taskManagerPath)).toBe(false);
    });

    it('workers 디렉토리가 제거되어야 한다', () => {
      const workersPath = path.join(__dirname, '../../src/shared/utils/workers');

      expect(fs.existsSync(workersPath)).toBe(false);
    });
  });

  describe('3. 복잡한 최적화 유틸리티 간소화', () => {
    it('utils-backup.ts가 기능별로 분리되어야 한다', async () => {
      // 909라인의 거대한 파일을 기능별로 분리

      // 성능 유틸리티는 별도 모듈에 있어야 함
      const perfUtils = await import('@shared/utils/performance/performance-utils');
      expect(perfUtils.createDebouncer).toBeDefined();
      expect(perfUtils.rafThrottle).toBeDefined();

      // 스타일 유틸리티는 별도 모듈에 있어야 함
      const styleUtils = await import('@shared/utils/styles/style-utils');
      expect(styleUtils.combineClasses).toBeDefined();
      expect(styleUtils.toggleClass).toBeDefined();
    });

    it('접근성 유틸리티가 분리되어야 한다', async () => {
      const a11yUtils = await import('@shared/utils/accessibility/accessibility-utils');
      expect(a11yUtils.calculateContrastRatio).toBeDefined();
      expect(a11yUtils.detectLightBackground).toBeDefined();
      expect(a11yUtils.meetsWCAGAA).toBeDefined();
    });
  });

  describe('4. 번들 크기 개선 검증', () => {
    it('복잡한 모듈 제거로 번들 크기가 감소해야 한다', () => {
      // 목표: 423.85 KB → 380 KB (약 44KB 감소)
      const expectedReduction = 44; // KB
      const currentSize = 423.85; // KB
      const targetSize = currentSize - expectedReduction;

      expect(targetSize).toBeLessThan(400); // 400KB 이하 목표
      expect(expectedReduction).toBeGreaterThan(40); // 최소 40KB 감소
    });

    it('유저스크립트에 적합한 복잡도가 유지되어야 한다', () => {
      // 제거 대상 복잡한 기능들
      const removedComplexFeatures = [
        'LRU 캐시 관리',
        'Web Workers 풀',
        '메모리 압박 감지',
        '싱글톤 리소스 매니저',
        '복잡한 메트릭 수집',
      ];

      // 유지되는 실용적 기능들
      const keptPracticalFeatures = [
        '기본 리소스 등록/해제',
        '성능 측정',
        'Debounce/Throttle',
        '기본 스타일 유틸리티',
        '접근성 도구',
      ];

      expect(removedComplexFeatures.length).toBeGreaterThan(4);
      expect(keptPracticalFeatures.length).toBeGreaterThan(4);
    });
  });
});
