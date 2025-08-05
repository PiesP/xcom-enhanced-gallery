/**
 * @fileoverview TDD Phase 2 (Green): 중복 테스트 분석 및 통합 도구
 * @description 테스트 중복도 분석 및 통합 계획 수립을 위한 최소 구현
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * 테스트 중복 분석기 (🟢 GREEN Phase 구현)
 */
export class TestDuplicateAnalyzer {
  /**
   * 중복 테스트 찾기
   */
  findDuplicates(files: string[]): DuplicateTestResult[] {
    const duplicates: DuplicateTestResult[] = [];

    // 간단한 키워드 기반 중복 분석
    const keywords = ['media', 'extraction', 'click', 'keyboard', 'gallery'];

    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const file1 = files[i];
        const file2 = files[j];

        try {
          const content1 = readFileSync(file1, 'utf-8');
          const content2 = readFileSync(file2, 'utf-8');

          // 공통 키워드 수 기반 유사도 계산
          const commonKeywords = keywords.filter(
            keyword => content1.includes(keyword) && content2.includes(keyword)
          );

          const similarity = commonKeywords.length / keywords.length;

          if (similarity > 0.5) {
            duplicates.push({
              files: [file1, file2],
              similarity_score: similarity,
              merge_strategy: similarity > 0.8 ? 'consolidate' : 'refactor',
              common_patterns: commonKeywords,
            });
          }
        } catch {
          // 파일 읽기 실패 시 무시
          console.warn(`파일 읽기 실패: ${file1} 또는 ${file2}`);
        }
      }
    }

    return duplicates;
  }

  /**
   * 테스트 스위트 분석
   */
  analyzeTestSuite(files: string[]): TestSuiteAnalysis {
    let totalTests = 0;
    let duplicatePatterns = 0;

    const analysisResults = files.map(file => {
      try {
        const content = readFileSync(file, 'utf-8');

        // 테스트 수 계산 (it() 또는 test() 패턴)
        const testMatches = content.match(/\b(it|test)\s*\(/g);
        const fileTestCount = testMatches ? testMatches.length : 0;
        totalTests += fileTestCount;

        // 중복 패턴 감지 (describe, beforeEach 등)
        const patterns = [
          /describe\s*\(/g,
          /beforeEach\s*\(/g,
          /expect\s*\(/g,
          /MediaExtractor/g,
          /GalleryService/g,
        ];

        const patternCounts = patterns.map(pattern => (content.match(pattern) || []).length);

        // 유사한 패턴이 많으면 중복 가능성 높음
        if (patternCounts.some(count => count > 5)) {
          duplicatePatterns++;
        }

        return {
          file,
          testCount: fileTestCount,
          patterns: patternCounts,
        };
      } catch (error) {
        console.warn(`파일 분석 실패: ${file}`, error);
        return { file, testCount: 0, patterns: [] };
      }
    });

    const duplicatePercentage = Math.round((duplicatePatterns / files.length) * 100);

    return {
      total_tests: totalTests,
      execution_time_ms: 0, // 실행 시간은 별도 측정 필요
      code_coverage: 0, // 커버리지는 별도 도구 필요
      duplicate_percentage: duplicatePercentage,
      file_analysis: analysisResults,
    };
  }
}

/**
 * 테스트 통합 계획 수립기 (🟢 GREEN Phase 구현)
 */
export class TestIntegrationPlan {
  /**
   * 통합 준비 상태 확인
   */
  checkReadiness(): IntegrationReadiness {
    const testDir = join(process.cwd(), 'test');
    const samplePagesDir = join(process.cwd(), 'sample_pages');

    try {
      // 필요한 디렉토리 존재 확인
      const samplePagesDirExists = this.directoryExists(samplePagesDir);

      // 샘플 페이지 파일들 확인
      const sampleFiles = samplePagesDirExists
        ? readdirSync(samplePagesDir).filter(f => f.endsWith('.html'))
        : [];

      // 테스트 헬퍼 확인
      const pageTestEnvExists = this.fileExists(
        join(testDir, 'utils', 'helpers', 'page-test-environment.ts')
      );

      return {
        samplePageLoader: sampleFiles.length > 0,
        mediaExtractorIntegration: pageTestEnvExists,
        performanceTracking: typeof global.performance !== 'undefined',
        memoryLeakDetection: typeof process.memoryUsage !== 'undefined',
        readiness_score: this.calculateReadinessScore({
          samplePageLoader: sampleFiles.length > 0,
          mediaExtractorIntegration: pageTestEnvExists,
          performanceTracking: true,
          memoryLeakDetection: true,
        }),
        missing_components: this.getMissingComponents({
          samplePageLoader: sampleFiles.length > 0,
          mediaExtractorIntegration: pageTestEnvExists,
          performanceTracking: true,
          memoryLeakDetection: true,
        }),
      };
    } catch (error) {
      console.warn('준비 상태 확인 실패:', error);
      return {
        samplePageLoader: false,
        mediaExtractorIntegration: false,
        performanceTracking: false,
        memoryLeakDetection: false,
        readiness_score: 0,
        missing_components: ['모든 컴포넌트'],
      };
    }
  }

  private directoryExists(path: string): boolean {
    try {
      const fs = require('fs');
      return fs.existsSync(path) && fs.lstatSync(path).isDirectory();
    } catch {
      return false;
    }
  }

  private fileExists(path: string): boolean {
    try {
      const fs = require('fs');
      return fs.existsSync(path) && fs.lstatSync(path).isFile();
    } catch {
      return false;
    }
  }

  private calculateReadinessScore(readiness: Partial<IntegrationReadiness>): number {
    const components = Object.values(readiness).filter(Boolean);
    return Math.round((components.length / 4) * 100);
  }

  private getMissingComponents(readiness: Partial<IntegrationReadiness>): string[] {
    const missing: string[] = [];

    if (!readiness.samplePageLoader) missing.push('샘플 페이지 로더');
    if (!readiness.mediaExtractorIntegration) missing.push('미디어 추출기 통합');
    if (!readiness.performanceTracking) missing.push('성능 추적');
    if (!readiness.memoryLeakDetection) missing.push('메모리 누수 감지');

    return missing;
  }
}

/**
 * 타입 정의
 */
export interface DuplicateTestResult {
  readonly files: string[];
  readonly similarity_score: number;
  readonly merge_strategy: 'consolidate' | 'remove' | 'refactor';
  readonly common_patterns: string[];
}

export interface TestSuiteAnalysis {
  readonly total_tests: number;
  readonly execution_time_ms: number;
  readonly code_coverage: number;
  readonly duplicate_percentage: number;
  readonly file_analysis: Array<{
    file: string;
    testCount: number;
    patterns: number[];
  }>;
}

export interface IntegrationReadiness {
  readonly samplePageLoader: boolean;
  readonly mediaExtractorIntegration: boolean;
  readonly performanceTracking: boolean;
  readonly memoryLeakDetection: boolean;
  readonly readiness_score?: number;
  readonly missing_components?: string[];
}
