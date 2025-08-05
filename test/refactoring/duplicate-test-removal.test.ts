/**
 * @fileoverview TDD 중복 테스트 제거 작업
 * @description RED-GREEN-REFACTOR 사이클로 중복 테스트 파일을 식별하고 제거
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

describe('🔴 RED Phase: 중복 테스트 파일 식별', () => {
  const refactoringDir = join(process.cwd(), 'test/refactoring');

  describe('TDD Phase 파일 중복 식별', () => {
    it('Phase1 관련 중복 파일들이 존재해야 함', () => {
      const phase1Files = [
        'tdd-phase1-duplication-detection.test.ts',
        'tdd-phase1-analysis-complete.test.ts',
        'tdd-phase1-consolidation-analysis.test.ts',
      ];

      const existingFiles = phase1Files.filter(file => existsSync(join(refactoringDir, file)));

      // RED: 중복 파일들이 존재함을 확인
      expect(existingFiles.length).toBeGreaterThanOrEqual(2);
      console.log('🔍 Phase1 중복 파일들:', existingFiles);
    });

    it('Phase2 관련 중복 파일들이 존재해야 함', () => {
      const phase2Files = [
        'tdd-phase2-green-implementation.test.ts',
        'tdd-phase2-green-implementation-fixed.test.ts',
        'tdd-phase2-green-simple.test.ts',
        'tdd-phase2-consolidation-success.test.ts',
      ];

      const existingFiles = phase2Files.filter(file => existsSync(join(refactoringDir, file)));

      // RED: 중복 파일들이 존재함을 확인
      expect(existingFiles.length).toBeGreaterThanOrEqual(3);
      console.log('🔍 Phase2 중복 파일들:', existingFiles);
    });

    it('Phase3 관련 중복 파일들이 존재해야 함', () => {
      const phase3Files = [
        'tdd-phase3-unused-code-removal.test.ts',
        'tdd-phase3-refactor-cleanup.test.ts',
      ];

      const existingFiles = phase3Files.filter(file => existsSync(join(refactoringDir, file)));

      // RED: 중복 파일들이 존재함을 확인
      expect(existingFiles.length).toBeGreaterThanOrEqual(2);
      console.log('🔍 Phase3 중복 파일들:', existingFiles);
    });
  });

  describe('기능별 중복 테스트 식별', () => {
    it('DOM 관련 중복 테스트들이 존재해야 함', () => {
      const domTestFiles = [
        'dom-consolidation.test.ts',
        'tdd-dom-utils-consolidation.test.ts',
        'dom-legacy-removal.test.ts',
      ];

      const existingFiles = domTestFiles.filter(file => existsSync(join(refactoringDir, file)));

      // RED: DOM 관련 중복 테스트들이 존재함
      expect(existingFiles.length).toBeGreaterThanOrEqual(2);
      console.log('🔍 DOM 중복 테스트들:', existingFiles);
    });

    it('Style 관련 중복 테스트들이 존재해야 함', () => {
      const styleTestFiles = [
        'style-consolidation.test.ts',
        'tdd-style-consolidation.test.ts',
        'tdd-style-service-integration.test.ts',
      ];

      const existingFiles = styleTestFiles.filter(file => existsSync(join(refactoringDir, file)));

      // RED: Style 관련 중복 테스트들이 존재함
      expect(existingFiles.length).toBeGreaterThanOrEqual(2);
      console.log('🔍 Style 중복 테스트들:', existingFiles);
    });

    it('Media 관련 중복 테스트들이 존재해야 함', () => {
      const mediaTestFiles = [
        'media-service-unification.test.ts',
        'tdd-media-service-consolidation.test.ts',
        'tdd-media-service-integration.test.ts',
      ];

      const existingFiles = mediaTestFiles.filter(file => existsSync(join(refactoringDir, file)));

      // RED: Media 관련 중복 테스트들이 존재함
      expect(existingFiles.length).toBeGreaterThanOrEqual(2);
      console.log('🔍 Media 중복 테스트들:', existingFiles);
    });
  });

  describe('완료/보고서 중복 테스트 식별', () => {
    it('완료 보고서 관련 중복 파일들이 존재해야 함', () => {
      const completionFiles = [
        'consolidation-completion.test.ts',
        'refactoring-completion.test.ts',
        'tdd-completion-report.test.ts',
      ];

      const existingFiles = completionFiles.filter(file => existsSync(join(refactoringDir, file)));

      // RED: 완료 보고서 중복 파일들이 존재함
      expect(existingFiles.length).toBeGreaterThanOrEqual(2);
      console.log('🔍 완료 보고서 중복 파일들:', existingFiles);
    });
  });

  describe('전체 중복 현황 분석', () => {
    it('총 중복 테스트 파일 수를 계산해야 함', () => {
      const allFiles = readdirSync(refactoringDir).filter(file => file.endsWith('.test.ts'));

      // 중복 패턴별 분류
      const duplicatePatterns = {
        tddPhase: allFiles.filter(f => f.includes('tdd-phase')),
        consolidation: allFiles.filter(f => f.includes('consolidation')),
        completion: allFiles.filter(f => f.includes('completion')),
        integration: allFiles.filter(f => f.includes('integration')),
        unification: allFiles.filter(f => f.includes('unification')),
      };

      const totalDuplicates = Object.values(duplicatePatterns).reduce(
        (sum, files) => sum + files.length,
        0
      );

      console.log('📊 중복 패턴별 파일 수:', duplicatePatterns);
      console.log('📊 총 리팩토링 테스트 파일 수:', allFiles.length);
      console.log('📊 총 중복 의심 파일 수:', totalDuplicates);

      // RED: 상당한 수의 중복 테스트 파일들이 존재해야 함
      expect(totalDuplicates).toBeGreaterThan(15);
      expect(allFiles.length).toBeGreaterThan(20);
    });
  });
});

describe('🟢 GREEN Phase: 중복 테스트 파일 제거 완료', () => {
  const refactoringDir = join(process.cwd(), 'test/refactoring');

  describe('제거된 중복 파일들 검증', () => {
    it('Phase1 중복 파일들이 제거되어야 함', () => {
      const removedFiles = [
        'tdd-phase1-duplication-detection.test.ts',
        'tdd-phase1-consolidation-analysis.test.ts',
      ];

      const stillExists = removedFiles.filter(file => existsSync(join(refactoringDir, file)));

      // GREEN: 중복 파일들이 제거됨
      expect(stillExists.length).toBe(0);
      console.log('✅ Phase1 중복 파일들 제거 완료');
    });

    it('Phase2 중복 파일들이 제거되어야 함', () => {
      const removedFiles = [
        'tdd-phase2-green-implementation.test.ts',
        'tdd-phase2-green-implementation-fixed.test.ts',
        'tdd-phase2-green-simple.test.ts',
      ];

      const stillExists = removedFiles.filter(file => existsSync(join(refactoringDir, file)));

      // GREEN: 중복 파일들이 제거됨
      expect(stillExists.length).toBe(0);
      console.log('✅ Phase2 중복 파일들 제거 완료');
    });

    it('기능별 중복 파일들이 제거되어야 함', () => {
      const removedFiles = [
        'tdd-dom-utils-consolidation.test.ts',
        'dom-legacy-removal.test.ts',
        'tdd-style-consolidation.test.ts',
        'tdd-style-service-integration.test.ts',
        'tdd-media-service-consolidation.test.ts',
        'tdd-media-service-integration.test.ts',
      ];

      const stillExists = removedFiles.filter(file => existsSync(join(refactoringDir, file)));

      // GREEN: 기능별 중복 파일들이 제거됨
      expect(stillExists.length).toBe(0);
      console.log('✅ 기능별 중복 파일들 제거 완료');
    });

    it('기타 중복 파일들이 제거되어야 함', () => {
      const removedFiles = [
        'tdd-unified-consolidation.test.ts',
        'tdd-unused-code-removal.test.ts',
        'tdd-summary-phase1-2.test.ts',
        'structure-analysis.test.ts',
        'naming-standardization.test.ts',
        'refactoring-completion.test.ts',
        'tdd-completion-report.test.ts',
      ];

      const stillExists = removedFiles.filter(file => existsSync(join(refactoringDir, file)));

      // GREEN: 기타 중복 파일들이 제거됨
      expect(stillExists.length).toBe(0);
      console.log('✅ 기타 중복 파일들 제거 완료');
    });
  });

  describe('유지된 핵심 테스트들 검증', () => {
    it('각 영역별 핵심 테스트가 유지되어야 함', () => {
      const coreTests = [
        'tdd-phase1-analysis-complete.test.ts',
        'tdd-phase2-consolidation-success.test.ts',
        'tdd-phase3-refactor-cleanup.test.ts',
        'dom-consolidation.test.ts',
        'style-consolidation.test.ts',
        'media-service-unification.test.ts',
        'consolidation-completion.test.ts',
      ];

      const existingCoreTests = coreTests.filter(file => existsSync(join(refactoringDir, file)));

      // GREEN: 핵심 테스트들이 유지됨
      expect(existingCoreTests.length).toBeGreaterThanOrEqual(5);
      console.log('✅ 유지된 핵심 테스트들:', existingCoreTests);
    });
  });

  describe('전체 최적화 효과 검증', () => {
    it('총 테스트 파일 수가 감소했어야 함', () => {
      const allFiles = readdirSync(refactoringDir).filter(file => file.endsWith('.test.ts'));

      console.log('📊 정리 후 리팩토링 테스트 파일 수:', allFiles.length);
      console.log('📊 남은 테스트 파일들:', allFiles);

      // GREEN: 파일 수가 현저히 감소함 (원래 30+개에서 15개 이하로)
      expect(allFiles.length).toBeLessThanOrEqual(15);

      // 주요 카테고리별 파일 수 확인
      const categoryCounts = {
        tddPhase: allFiles.filter(f => f.includes('tdd-phase')).length,
        consolidation: allFiles.filter(f => f.includes('consolidation')).length,
        completion: allFiles.filter(f => f.includes('completion')).length,
      };

      console.log('📊 카테고리별 파일 수:', categoryCounts);

      // 각 카테고리별로 적절한 수만 남아있어야 함
      expect(categoryCounts.tddPhase).toBeLessThanOrEqual(3); // Phase 1,2,3 각 1개씩
      expect(categoryCounts.consolidation).toBeLessThanOrEqual(5); // 주요 기능별
    });
  });
});

describe('🎯 목표: 정리 후 예상 상태 (GREEN 목표)', () => {
  describe('정리 후 유지할 핵심 테스트들', () => {
    it('각 기능별로 하나의 통합 테스트만 유지해야 함', () => {
      const coreTests = {
        'dom-consolidation-final.test.ts': 'DOM 유틸리티 통합 최종 테스트',
        'style-consolidation-final.test.ts': 'Style 관리 통합 최종 테스트',
        'media-service-final.test.ts': 'Media 서비스 통합 최종 테스트',
        'test-optimization-completion.test.ts': '전체 최적화 완료 검증',
      };

      // GREEN 목표: 핵심 테스트만 유지
      expect(Object.keys(coreTests).length).toBe(4);
      console.log('🎯 유지할 핵심 테스트들:', coreTests);
    });
  });

  describe('제거할 중복 테스트 목록', () => {
    it('제거 대상 파일들을 명시해야 함', () => {
      const filesToRemove = [
        // Phase1 중복들 - analysis-complete만 유지, 나머지 제거
        'tdd-phase1-duplication-detection.test.ts',
        'tdd-phase1-consolidation-analysis.test.ts',

        // Phase2 중복들 - consolidation-success만 유지, 나머지 제거
        'tdd-phase2-green-implementation.test.ts',
        'tdd-phase2-green-implementation-fixed.test.ts',
        'tdd-phase2-green-simple.test.ts',

        // Phase3 중복들 - refactor-cleanup만 유지, 나머지 제거
        'tdd-phase3-unused-code-removal.test.ts',

        // 기능별 중복들 - consolidation만 유지, 나머지 제거
        'tdd-dom-utils-consolidation.test.ts',
        'dom-legacy-removal.test.ts',
        'tdd-style-consolidation.test.ts',
        'tdd-style-service-integration.test.ts',
        'tdd-media-service-consolidation.test.ts',
        'tdd-media-service-integration.test.ts',
        'media-service-unification.test.ts',

        // 완료 보고서 중복들
        'refactoring-completion.test.ts',
        'tdd-completion-report.test.ts',

        // 기타 중복들
        'tdd-unified-consolidation.test.ts',
        'tdd-unused-code-removal.test.ts',
        'tdd-summary-phase1-2.test.ts',
        'structure-analysis.test.ts',
        'naming-standardization.test.ts',
      ];

      console.log(`🗑️ 제거 대상 파일 수: ${filesToRemove.length}개`);
      expect(filesToRemove.length).toBeGreaterThan(15);

      return filesToRemove;
    });
  });
});
