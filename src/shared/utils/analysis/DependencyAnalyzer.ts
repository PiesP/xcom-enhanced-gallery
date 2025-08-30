/**
 * @fileoverview DependencyAnalyzer - 의존성 분석 서비스
 * @description dependency-graph.json 기반 안전한 제거 대상 분석
 * @version 1.0.0 - Phase 3 의존성 분석
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ModuleDependency {
  source: string;
  dependencies: unknown[];
  dependents: unknown[];
  orphan: boolean;
  valid: boolean;
}

interface AnalysisResult {
  safeToRemove: string[];
  requiresReview: string[];
  highRisk: string[];
  statistics: {
    totalModules: number;
    orphanCount: number;
    safeCount: number;
    reviewCount: number;
    riskCount: number;
  };
}

/**
 * 의존성 분석기
 * dependency-graph.json을 분석하여 안전한 제거 대상을 식별
 */
export class DependencyAnalyzer {
  private static readonly DEPENDENCY_GRAPH_PATH = 'docs/dependency-graph.json';
  private static readonly PROJECT_ROOT = process.cwd();

  /**
   * 전체 의존성 분석 수행
   */
  public static async analyze(): Promise<AnalysisResult> {
    const dependencyGraphPath = join(this.PROJECT_ROOT, this.DEPENDENCY_GRAPH_PATH);

    if (!existsSync(dependencyGraphPath)) {
      throw new Error(`Dependency graph not found: ${dependencyGraphPath}`);
    }

    const dependencyGraphContent = readFileSync(dependencyGraphPath, 'utf-8');
    const dependencyGraph = JSON.parse(dependencyGraphContent);

    const modules: ModuleDependency[] = dependencyGraph.modules || [];
    const orphanModules = modules.filter(module => module.orphan === true);

    const safeToRemove: string[] = [];
    const requiresReview: string[] = [];
    const highRisk: string[] = [];

    for (const module of orphanModules) {
      const risk = this.assessRisk(module);

      switch (risk) {
        case 'safe':
          safeToRemove.push(module.source);
          break;
        case 'review':
          requiresReview.push(module.source);
          break;
        case 'high':
          highRisk.push(module.source);
          break;
      }
    }

    return {
      safeToRemove,
      requiresReview,
      highRisk,
      statistics: {
        totalModules: modules.length,
        orphanCount: orphanModules.length,
        safeCount: safeToRemove.length,
        reviewCount: requiresReview.length,
        riskCount: highRisk.length,
      },
    };
  }

  /**
   * 안전하게 제거 가능한 파일 목록 반환
   */
  public static async getSafeToRemove(): Promise<string[]> {
    const analysis = await this.analyze();
    return analysis.safeToRemove;
  }

  /**
   * 모듈의 위험도 평가
   */
  private static assessRisk(module: ModuleDependency): 'safe' | 'review' | 'high' {
    const filePath = module.source;

    // temp 폴더의 .js/.cjs 파일들은 안전
    if (/^temp\/.*\.(cjs|js)$/.test(filePath)) {
      return 'safe';
    }

    // 백업 파일이나 임시 파일들은 안전
    if (/\.(backup|tmp|bak)$/.test(filePath)) {
      return 'safe';
    }

    // deprecated 표시된 파일들은 안전
    if (/deprecated|legacy|old/i.test(filePath)) {
      return 'safe';
    }

    // 핵심 기능 파일들은 위험
    if (/src\/(main|index|constants)\.ts$/.test(filePath)) {
      return 'high';
    }

    // 공유 컴포넌트나 서비스는 검토 필요
    if (/src\/shared\/(components|services)\//.test(filePath)) {
      return 'review';
    }

    // 테스트 관련 파일들은 검토 필요
    if (/\.(test|spec)\.tsx?$/.test(filePath)) {
      return 'review';
    }

    // 타입 정의 파일들은 검토 필요
    if (/\.d\.ts$/.test(filePath) || /types?\.ts$/.test(filePath)) {
      return 'review';
    }

    // 기본적으로 검토 필요
    return 'review';
  }

  /**
   * 파일 내용 기반 위험도 분석
   */
  public static async analyzeFileContent(filePath: string): Promise<{
    risk: 'safe' | 'review' | 'high';
    reasons: string[];
  }> {
    const fullPath = join(this.PROJECT_ROOT, filePath);
    const reasons: string[] = [];

    if (!existsSync(fullPath)) {
      return { risk: 'safe', reasons: ['파일이 존재하지 않음'] };
    }

    try {
      const content = readFileSync(fullPath, 'utf-8');

      // export 문 검사
      const exportMatches = content.match(
        /export\s+(default\s+)?(class|function|interface|type|const|let|var)/g
      );
      if (exportMatches && exportMatches.length > 0) {
        reasons.push(`${exportMatches.length}개의 export 발견`);
      }

      // import 문 검사
      const importMatches = content.match(/import\s+.*from\s+['"][^'"]+['"]/g);
      if (importMatches && importMatches.length > 0) {
        reasons.push(`${importMatches.length}개의 import 발견`);
      }

      // 중요한 키워드 검사
      const criticalKeywords = ['useState', 'useEffect', 'Component', 'Service', 'Manager'];
      const foundKeywords = criticalKeywords.filter(keyword => content.includes(keyword));
      if (foundKeywords.length > 0) {
        reasons.push(`중요 키워드 발견: ${foundKeywords.join(', ')}`);
      }

      // 설정 파일 검사
      if (content.includes('config') || content.includes('Config')) {
        reasons.push('설정 관련 코드 포함');
      }

      // 위험도 결정
      if (exportMatches && exportMatches.length > 5) {
        return { risk: 'high', reasons };
      }

      if (exportMatches && exportMatches.length > 0) {
        return { risk: 'review', reasons };
      }

      if (content.trim().length < 100) {
        reasons.push('파일 크기가 작음');
        return { risk: 'safe', reasons };
      }

      return { risk: 'review', reasons };
    } catch (error) {
      reasons.push(`파일 읽기 실패: ${error instanceof Error ? error.message : String(error)}`);
      return { risk: 'high', reasons };
    }
  }

  /**
   * 의존성 영향도 분석
   */
  public static async analyzeDependencyImpact(filePath: string): Promise<{
    directDependents: string[];
    indirectDependents: string[];
    impactScore: number;
  }> {
    const dependencyGraphPath = join(this.PROJECT_ROOT, this.DEPENDENCY_GRAPH_PATH);

    if (!existsSync(dependencyGraphPath)) {
      return { directDependents: [], indirectDependents: [], impactScore: 0 };
    }

    const dependencyGraphContent = readFileSync(dependencyGraphPath, 'utf-8');
    const dependencyGraph = JSON.parse(dependencyGraphContent);

    const modules: ModuleDependency[] = dependencyGraph.modules || [];
    const targetModule = modules.find(module => module.source === filePath);

    if (!targetModule) {
      return { directDependents: [], indirectDependents: [], impactScore: 0 };
    }

    const directDependents = Array.isArray(targetModule.dependents)
      ? targetModule.dependents.map(dep => String(dep))
      : [];

    // 간접 의존성은 재귀적으로 계산해야 하지만, 여기서는 단순화
    const indirectDependents: string[] = [];

    const impactScore = directDependents.length + indirectDependents.length * 0.5;

    return { directDependents, indirectDependents, impactScore };
  }
}

export default DependencyAnalyzer;
