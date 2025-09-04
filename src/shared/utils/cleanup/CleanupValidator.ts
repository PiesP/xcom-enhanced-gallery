/**
 * @fileoverview CleanupValidator - 정리 후 검증 서비스
 * @description 파일 정리 후 빌드 및 의존성 검증
 * @version 1.0.0 - Phase 3 정리 검증
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '@shared/logging/logger';

interface ValidationResult {
  buildSuccess: boolean;
  dependencyCheck: boolean;
  testResults: boolean;
  errors: string[];
  warnings: string[];
  summary: string;
}

/**
 * 정리 후 검증 서비스
 * 파일 정리 후 프로젝트 무결성 검증
 */
export class CleanupValidator {
  private static readonly PROJECT_ROOT = process.cwd();

  /**
   * 정리 후 전체 검증 수행
   */
  public static async validateAfterCleanup(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    logger.info('🔍 정리 후 검증 시작...');

    // 1. 빌드 검증
    const buildSuccess = await this.runBuildTest();
    if (!buildSuccess) {
      errors.push('빌드 실패');
    }

    // 2. 의존성 검증
    const dependencyCheck = await this.validateDependencies();
    if (!dependencyCheck) {
      warnings.push('의존성 문제 발견');
    }

    // 3. 기본 테스트 실행
    const testResults = await this.runBasicTests();
    if (!testResults) {
      warnings.push('일부 테스트 실패');
    }

    const summary = this.generateSummary(
      buildSuccess,
      dependencyCheck,
      testResults,
      errors,
      warnings
    );

    return {
      buildSuccess,
      dependencyCheck,
      testResults,
      errors,
      warnings,
      summary,
    };
  }

  /**
   * 빌드 테스트 실행
   */
  public static async runBuildTest(): Promise<boolean> {
    logger.info('🔨 빌드 테스트 실행 중...');

    try {
      // TypeScript 컴파일 확인
      const tscResult = await this.runCommand('npx', ['tsc', '--noEmit']);
      if (!tscResult.success) {
        logger.error('TypeScript 컴파일 실패:', tscResult.error);
        return false;
      }

      // 개발 빌드 테스트
      const buildResult = await this.runCommand('npm', ['run', 'prebuild']);
      if (!buildResult.success) {
        logger.error('Prebuild 실패:', buildResult.error);
        return false;
      }

      logger.info('✅ 빌드 테스트 성공');
      return true;
    } catch (error) {
      logger.error('빌드 테스트 중 오류:', error);
      return false;
    }
  }

  /**
   * 의존성 검증
   */
  public static async validateDependencies(): Promise<boolean> {
    logger.info('📦 의존성 검증 중...');

    try {
      // package.json 존재 확인
      const packageJsonPath = join(this.PROJECT_ROOT, 'package.json');
      if (!existsSync(packageJsonPath)) {
        logger.error('package.json이 존재하지 않습니다');
        return false;
      }

      // npm 의존성 확인
      const npmResult = await this.runCommand('npm', ['ls', '--depth=0']);
      if (!npmResult.success) {
        logger.warn('일부 의존성 문제 발견:', npmResult.error);
        // 의존성 문제는 경고로 처리
      }

      // 중요한 모듈들 존재 확인
      const criticalModules = [
        'src/main.ts',
        'src/constants.ts',
        'src/shared/services/StateManager.ts',
        'src/shared/services/EventManager.ts',
      ];

      for (const module of criticalModules) {
        const modulePath = join(this.PROJECT_ROOT, module);
        if (!existsSync(modulePath)) {
          logger.error(`중요한 모듈이 누락됨: ${module}`);
          return false;
        }
      }

      logger.info('✅ 의존성 검증 완료');
      return true;
    } catch (error) {
      logger.error('의존성 검증 중 오류:', error);
      return false;
    }
  }

  /**
   * 기본 테스트 실행
   */
  public static async runBasicTests(): Promise<boolean> {
    logger.info('🧪 기본 테스트 실행 중...');

    try {
      // lint 검사
      const lintResult = await this.runCommand('npm', ['run', 'lint:check']);
      if (!lintResult.success) {
        logger.warn('Lint 검사에서 문제 발견:', lintResult.error);
      }

      // 간단한 컴파일 테스트
      const compileResult = await this.runCommand('npx', ['tsc', '--noEmit', '--skipLibCheck']);
      if (!compileResult.success) {
        logger.error('컴파일 테스트 실패:', compileResult.error);
        return false;
      }

      logger.info('✅ 기본 테스트 완료');
      return true;
    } catch (error) {
      logger.error('기본 테스트 중 오류:', error);
      return false;
    }
  }

  /**
   * 명령어 실행 헬퍼
   */
  private static async runCommand(
    command: string,
    args: string[],
    timeout = 60000
  ): Promise<{ success: boolean; output: string; error: string }> {
    return new Promise(resolve => {
      const process = spawn(command, args, {
        cwd: this.PROJECT_ROOT,
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';
      let error = '';

      process.stdout?.on('data', data => {
        output += data.toString();
      });

      process.stderr?.on('data', data => {
        error += data.toString();
      });

      process.on('close', code => {
        resolve({
          success: code === 0,
          output,
          error,
        });
      });

      process.on('error', err => {
        resolve({
          success: false,
          output,
          error: err.message,
        });
      });

      // 타임아웃 설정
      setTimeout(() => {
        process.kill();
        resolve({
          success: false,
          output,
          error: 'Command timeout',
        });
      }, timeout);
    });
  }

  /**
   * 검증 결과 요약 생성
   */
  private static generateSummary(
    buildSuccess: boolean,
    dependencyCheck: boolean,
    testResults: boolean,
    errors: string[],
    warnings: string[]
  ): string {
    const parts = [];

    if (buildSuccess && dependencyCheck && testResults) {
      parts.push('✅ 모든 검증 통과');
    } else {
      parts.push('⚠️ 일부 검증 실패');
    }

    if (errors.length > 0) {
      parts.push(`오류 ${errors.length}개`);
    }

    if (warnings.length > 0) {
      parts.push(`경고 ${warnings.length}개`);
    }

    return parts.join(' - ');
  }

  /**
   * 상세 검증 리포트 생성
   */
  public static async generateDetailedReport(): Promise<{
    timestamp: string;
    projectStatus: object;
    fileSystem: object;
    buildMetrics: object;
  }> {
    const timestamp = new Date().toISOString();

    // 프로젝트 상태
    const packageJsonPath = join(this.PROJECT_ROOT, 'package.json');
    let projectStatus = {};

    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        projectStatus = {
          name: packageJson.name,
          version: packageJson.version,
          scripts: Object.keys(packageJson.scripts || {}),
          dependencies: Object.keys(packageJson.dependencies || {}),
        };
      } catch {
        projectStatus = { error: 'package.json 읽기 실패' };
      }
    }

    // 파일 시스템 상태
    const fileSystem = {
      srcExists: existsSync(join(this.PROJECT_ROOT, 'src')),
      testExists: existsSync(join(this.PROJECT_ROOT, 'test')),
      docsExists: existsSync(join(this.PROJECT_ROOT, 'docs')),
      tempExists: existsSync(join(this.PROJECT_ROOT, 'temp')),
    };

    // 빌드 메트릭 (존재하는 경우)
    let buildMetrics = {};
    const buildMetricsPath = join(this.PROJECT_ROOT, 'temp/build-metrics.json');
    if (existsSync(buildMetricsPath)) {
      try {
        buildMetrics = JSON.parse(readFileSync(buildMetricsPath, 'utf-8'));
      } catch {
        buildMetrics = { error: '빌드 메트릭 읽기 실패' };
      }
    }

    return {
      timestamp,
      projectStatus,
      fileSystem,
      buildMetrics,
    };
  }
}

export default CleanupValidator;
