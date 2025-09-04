/**
 * @fileoverview OrphanFileCleanup - 안전한 orphan 파일 정리 서비스
 * @description dependency-graph.json 기반 orphan 파일 분석 및 안전한 정리
 * @version 1.0.0 - Phase 3 코드 정리 구현
 */

import { existsSync, readFileSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';
import { logger } from '@shared/logging/logger';

interface OrphanAnalysisResult {
  safeToRemove: string[];
  requiresReview: string[];
  totalOrphans: number;
  analysisDate: string;
}

interface DependencyGraphModule {
  source: string;
  dependencies: unknown[];
  dependents: unknown[];
  orphan: boolean;
  valid: boolean;
  rules?: Array<{ severity: string; name: string }>;
}

interface DependencyGraph {
  modules: DependencyGraphModule[];
}

/**
 * Orphan 파일 정리 서비스
 * dependency-graph.json을 기반으로 안전하게 파일을 분석하고 정리
 */
export class OrphanFileCleanup {
  private static readonly DEPENDENCY_GRAPH_PATH = 'docs/dependency-graph.json';
  private static readonly PROJECT_ROOT = process.cwd();

  // 항상 안전한 제거 대상 패턴
  private static readonly SAFE_REMOVAL_PATTERNS = [
    /^temp\/.*\.(cjs|js)$/,
    /^temp\/.*legacy.*$/,
    /^scripts\/deprecated.*$/,
    /\.backup$/,
    /\.tmp$/,
  ];

  // 신중하게 검토해야 하는 패턴
  private static readonly REVIEW_REQUIRED_PATTERNS = [
    /src\/.*\.tsx?$/,
    /src\/.*\.css$/,
    /src\/shared\/.*$/,
    /src\/features\/.*$/,
  ];

  /**
   * Orphan 파일 분석 수행
   */
  public static async analyzeOrphans(): Promise<OrphanAnalysisResult> {
    const dependencyGraphPath = join(this.PROJECT_ROOT, this.DEPENDENCY_GRAPH_PATH);

    if (!existsSync(dependencyGraphPath)) {
      throw new Error(`Dependency graph not found: ${dependencyGraphPath}`);
    }

    const dependencyGraphContent = readFileSync(dependencyGraphPath, 'utf-8');
    const dependencyGraph: DependencyGraph = JSON.parse(dependencyGraphContent);

    const orphanModules = dependencyGraph.modules.filter(module => module.orphan === true);

    const safeToRemove: string[] = [];
    const requiresReview: string[] = [];

    for (const orphanModule of orphanModules) {
      const filePath = orphanModule.source;
      const fullPath = join(this.PROJECT_ROOT, filePath);

      // 파일이 실제로 존재하는지 확인
      if (!existsSync(fullPath)) {
        continue;
      }

      // 안전한 제거 대상인지 확인
      if (this.isSafeToRemove(filePath)) {
        safeToRemove.push(filePath);
      } else {
        requiresReview.push(filePath);
      }
    }

    return {
      safeToRemove,
      requiresReview,
      totalOrphans: orphanModules.length,
      analysisDate: new Date().toISOString(),
    };
  }

  /**
   * 파일이 안전하게 제거 가능한지 확인
   */
  private static isSafeToRemove(filePath: string): boolean {
    // 안전한 제거 패턴 확인
    for (const pattern of this.SAFE_REMOVAL_PATTERNS) {
      if (pattern.test(filePath)) {
        return true;
      }
    }

    // 검토 필요 패턴 확인
    for (const pattern of this.REVIEW_REQUIRED_PATTERNS) {
      if (pattern.test(filePath)) {
        return false;
      }
    }

    // 기본적으로 검토 필요
    return false;
  }

  /**
   * 안전성 검증 수행
   */
  public static async validateSafety(filePaths: string[]): Promise<{
    safe: string[];
    unsafe: string[];
    reasons: Record<string, string>;
  }> {
    const safe: string[] = [];
    const unsafe: string[] = [];
    const reasons: Record<string, string> = {};

    for (const filePath of filePaths) {
      const fullPath = join(this.PROJECT_ROOT, filePath);

      try {
        // 파일 존재 확인
        if (!existsSync(fullPath)) {
          reasons[filePath] = '파일이 존재하지 않음';
          safe.push(filePath);
          continue;
        }

        // 파일 크기 확인 (너무 큰 파일은 주의)
        const stats = statSync(fullPath);
        if (stats.size > 100 * 1024) {
          // 100KB 이상
          reasons[filePath] = '파일 크기가 큼 (100KB 이상)';
          unsafe.push(filePath);
          continue;
        }

        // 파일 내용 간단 검사
        const content = readFileSync(fullPath, 'utf-8');

        // export 문이 있는 파일은 주의
        if (content.includes('export ') && !content.includes('// @deprecated')) {
          reasons[filePath] = 'export 문이 있어 다른 파일에서 사용될 가능성';
          unsafe.push(filePath);
          continue;
        }

        // 중요한 설정이나 타입 정의가 있는지 확인
        if (
          content.includes('interface ') ||
          content.includes('type ') ||
          content.includes('declare ')
        ) {
          reasons[filePath] = '타입 정의 또는 인터페이스가 포함됨';
          unsafe.push(filePath);
          continue;
        }

        // 안전한 것으로 판단
        reasons[filePath] = '안전하게 제거 가능';
        safe.push(filePath);
      } catch (error) {
        reasons[filePath] = `검증 실패: ${error instanceof Error ? error.message : String(error)}`;
        unsafe.push(filePath);
      }
    }

    return { safe, unsafe, reasons };
  }

  /**
   * 실제 파일 정리 수행 (백업 포함)
   */
  public static async cleanup(
    filePaths: string[],
    options: { createBackup?: boolean; dryRun?: boolean } = {}
  ): Promise<{
    removed: string[];
    failed: string[];
    backed_up: string[];
    errors: Record<string, string>;
  }> {
    const { createBackup = true, dryRun = false } = options;

    const removed: string[] = [];
    const failed: string[] = [];
    const backed_up: string[] = [];
    const errors: Record<string, string> = {};

    // 안전성 재검증
    const validation = await this.validateSafety(filePaths);

    for (const filePath of validation.safe) {
      const fullPath = join(this.PROJECT_ROOT, filePath);

      try {
        if (!existsSync(fullPath)) {
          continue;
        }

        // 백업 생성
        if (createBackup && !dryRun) {
          const backupPath = `${fullPath}.backup-${Date.now()}`;
          const content = readFileSync(fullPath, 'utf-8');
          require('fs').writeFileSync(backupPath, content);
          backed_up.push(backupPath);
        }

        // 실제 제거 (dryRun이 아닌 경우)
        if (!dryRun) {
          unlinkSync(fullPath);
        }

        removed.push(filePath);
      } catch (error) {
        failed.push(filePath);
        errors[filePath] = error instanceof Error ? error.message : String(error);
      }
    }

    // 안전하지 않은 파일들은 실패 목록에 추가
    for (const filePath of validation.unsafe) {
      failed.push(filePath);
      errors[filePath] = validation.reasons[filePath] || '안전성 검증 실패';
    }

    return { removed, failed, backed_up, errors };
  }

  /**
   * temp 폴더 정리 (더 적극적)
   */
  public static async cleanupTempFolder(): Promise<{
    removed: string[];
    errors: Record<string, string>;
  }> {
    const tempPath = join(this.PROJECT_ROOT, 'temp');
    const removed: string[] = [];
    const errors: Record<string, string> = {};

    if (!existsSync(tempPath)) {
      return { removed, errors };
    }

    try {
      const tempFiles = require('fs').readdirSync(tempPath);

      for (const file of tempFiles) {
        const filePath = join(tempPath, file);
        const relativePath = `temp/${file}`;

        try {
          // 중요한 파일은 보존
          if (
            file.includes('dependency-analysis.json') ||
            file.includes('single-consumer.json') ||
            file.endsWith('.md')
          ) {
            continue;
          }

          // .cjs, .js 파일들은 정리
          if (file.endsWith('.cjs') || file.endsWith('.js') || file.includes('legacy')) {
            unlinkSync(filePath);
            removed.push(relativePath);
          }
        } catch (error) {
          errors[relativePath] = error instanceof Error ? error.message : String(error);
        }
      }
    } catch (error) {
      errors['temp/'] = error instanceof Error ? error.message : String(error);
    }

    return { removed, errors };
  }

  /**
   * 정리 후 의존성 그래프 업데이트
   */
  public static async updateDependencyGraph(): Promise<void> {
    // 의존성 그래프 재생성 (실제로는 외부 도구를 호출해야 함)
    logger.info('의존성 그래프 업데이트는 별도 스크립트로 수행하세요: npm run analyze:deps');
  }
}

// 기본 내보내기
export default OrphanFileCleanup;
