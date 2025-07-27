/**
 * @fileoverview Bundle 최적화 시스템
 * @description Phase 3: Tree-shaking 개선 및 Bundle splitting 구현
 * @version 3.0.0
 */

/**
 * Bundle 분석 결과 인터페이스
 */
interface BundleAnalysis {
  /** 전체 번들 크기 (bytes) */
  totalSize: number;
  /** 압축된 번들 크기 (bytes) */
  gzippedSize: number;
  /** 모듈별 크기 정보 */
  modulesSizes: Map<string, number>;
  /** Tree-shaking 대상 코드 크기 */
  unusedCodeSize: number;
  /** 중복 코드 크기 */
  duplicatedCodeSize: number;
}

/**
 * 코드 스플리팅 옵션
 */
interface SplittingOptions {
  /** 청크 크기 임계값 (bytes) */
  chunkSizeThreshold: number;
  /** 최대 청크 수 */
  maxChunks: number;
  /** 우선순위 모듈 목록 */
  priorityModules: string[];
  /** 지연 로딩 가능한 모듈 목록 */
  lazyLoadableModules: string[];
}

/**
 * Bundle 최적화 클래스
 */
class BundleOptimizer {
  private static instance: BundleOptimizer;
  private readonly moduleRegistry = new Map<string, { size: number; dependencies: string[] }>();
  private readonly chunkManifest = new Map<string, string[]>();

  /**
   * 싱글톤 인스턴스 반환
   */
  static getInstance(): BundleOptimizer {
    if (!this.instance) {
      this.instance = new BundleOptimizer();
    }
    return this.instance;
  }

  /**
   * 모듈 등록
   */
  registerModule(name: string, size: number, dependencies: string[] = []): void {
    this.moduleRegistry.set(name, { size, dependencies });
  }

  /**
   * Bundle 분석 수행
   */
  analyzeBundleComposition(): BundleAnalysis {
    let totalSize = 0;
    let unusedCodeSize = 0;
    const modulesSizes = new Map<string, number>();
    const dependencyGraph = new Map<string, Set<string>>();

    // 모듈 크기 및 의존성 분석
    for (const [moduleName, moduleInfo] of this.moduleRegistry.entries()) {
      totalSize += moduleInfo.size;
      modulesSizes.set(moduleName, moduleInfo.size);

      // 의존성 그래프 구축
      if (!dependencyGraph.has(moduleName)) {
        dependencyGraph.set(moduleName, new Set());
      }

      for (const dep of moduleInfo.dependencies) {
        dependencyGraph.get(moduleName)?.add(dep);
      }
    }

    // 사용되지 않는 코드 분석 (Tree-shaking 대상)
    const usedModules = this.findUsedModules(dependencyGraph);
    for (const [moduleName, moduleInfo] of this.moduleRegistry.entries()) {
      if (!usedModules.has(moduleName)) {
        unusedCodeSize += moduleInfo.size;
      }
    }

    // 중복 코드 분석
    const duplicatedCodeSize = this.analyzeDuplicatedCode();

    // 압축 크기 추정 (일반적으로 30-40% 압축)
    const gzippedSize = Math.floor(totalSize * 0.35);

    return {
      totalSize,
      gzippedSize,
      modulesSizes,
      unusedCodeSize,
      duplicatedCodeSize,
    };
  }

  /**
   * 사용되는 모듈 찾기 (Tree-shaking을 위한 분석)
   */
  private findUsedModules(dependencyGraph: Map<string, Set<string>>): Set<string> {
    const usedModules = new Set<string>();
    const entryPoints = ['main', 'index']; // 진입점 모듈들

    // DFS로 사용되는 모듈 탐색
    const visited = new Set<string>();
    const dfs = (moduleName: string) => {
      if (visited.has(moduleName) || !dependencyGraph.has(moduleName)) return;

      visited.add(moduleName);
      usedModules.add(moduleName);

      const dependencies = dependencyGraph.get(moduleName) || new Set();
      for (const dep of dependencies) {
        dfs(dep);
      }
    };

    // 진입점부터 시작하여 사용되는 모든 모듈 찾기
    for (const entryPoint of entryPoints) {
      if (dependencyGraph.has(entryPoint)) {
        dfs(entryPoint);
      }
    }

    return usedModules;
  }

  /**
   * 중복 코드 분석
   */
  private analyzeDuplicatedCode(): number {
    let duplicatedSize = 0;
    const moduleNames = Array.from(this.moduleRegistry.keys());

    for (let i = 0; i < moduleNames.length; i++) {
      for (let j = i + 1; j < moduleNames.length; j++) {
        const module1 = moduleNames[i];
        const module2 = moduleNames[j];

        if (module1 && module2 && this.hasSimilarCode(module1, module2)) {
          const size1 = this.moduleRegistry.get(module1)?.size || 0;
          const size2 = this.moduleRegistry.get(module2)?.size || 0;
          duplicatedSize += Math.min(size1, size2) * 0.1; // 10% 중복 가정
        }
      }
    }

    return duplicatedSize;
  }

  /**
   * 모듈간 유사한 코드 여부 판단 (간단한 휴리스틱)
   */
  private hasSimilarCode(module1: string, module2: string): boolean {
    const similarity = this.calculateNameSimilarity(module1, module2);
    return similarity > 0.7;
  }

  /**
   * 모듈명 유사도 계산
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const longer = name1.length > name2.length ? name1 : name2;
    const shorter = name1.length > name2.length ? name2 : name1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein 거리 계산
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(0) as number[]);

    for (let i = 0; i <= str1.length; i++) matrix[0]![i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j]![0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j]![i] = Math.min(
          matrix[j]![i - 1]! + 1, // deletion
          matrix[j - 1]![i]! + 1, // insertion
          matrix[j - 1]![i - 1]! + indicator // substitution
        );
      }
    }

    return matrix[str2.length]![str1.length]!;
  }

  /**
   * 최적 코드 스플리팅 전략 생성
   */
  generateSplittingStrategy(options: SplittingOptions): Map<string, string[]> {
    const { chunkSizeThreshold, maxChunks, priorityModules, lazyLoadableModules } = options;
    const chunks = new Map<string, string[]>();
    const processedModules = new Set<string>();

    // 1. 우선순위 모듈들을 main 청크에 배치
    chunks.set('main', [...priorityModules]);
    priorityModules.forEach(module => processedModules.add(module));

    // 2. 지연 로딩 가능한 모듈들을 별도 청크로 분리
    lazyLoadableModules.forEach((module, index) => {
      const chunkName = `lazy-${index}`;
      chunks.set(chunkName, [module]);
      processedModules.add(module);
    });

    // 3. 나머지 모듈들을 크기 기준으로 청크 분배
    const remainingModules = Array.from(this.moduleRegistry.keys())
      .filter(module => !processedModules.has(module))
      .sort((a, b) => {
        const sizeA = this.moduleRegistry.get(a)?.size || 0;
        const sizeB = this.moduleRegistry.get(b)?.size || 0;
        return sizeB - sizeA; // 큰 모듈부터 정렬
      });

    let currentChunkIndex = 0;
    let currentChunkSize = this.calculateChunkSize(chunks.get('main') || []);

    for (const module of remainingModules) {
      const moduleSize = this.moduleRegistry.get(module)?.size || 0;

      // 현재 청크에 추가할 수 있는지 확인
      if (currentChunkSize + moduleSize <= chunkSizeThreshold && currentChunkIndex < maxChunks) {
        const chunkName = currentChunkIndex === 0 ? 'main' : `chunk-${currentChunkIndex}`;
        if (!chunks.has(chunkName)) {
          chunks.set(chunkName, []);
        }
        chunks.get(chunkName)?.push(module);
        currentChunkSize += moduleSize;
      } else {
        // 새 청크 생성
        currentChunkIndex++;
        const chunkName = `chunk-${currentChunkIndex}`;
        chunks.set(chunkName, [module]);
        currentChunkSize = moduleSize;
      }
    }

    this.chunkManifest.clear();
    chunks.forEach((modules, chunkName) => {
      this.chunkManifest.set(chunkName, modules);
    });

    return chunks;
  }

  /**
   * 청크 크기 계산
   */
  private calculateChunkSize(modules: string[]): number {
    return modules.reduce((total, module) => {
      return total + (this.moduleRegistry.get(module)?.size || 0);
    }, 0);
  }

  /**
   * Tree-shaking 최적화 제안 생성
   */
  generateTreeShakingRecommendations(): string[] {
    const recommendations: string[] = [];
    const analysis = this.analyzeBundleComposition();

    // 1. 사용되지 않는 모듈 제거 제안
    if (analysis.unusedCodeSize > 0) {
      recommendations.push(
        `사용되지 않는 코드 ${Math.round(analysis.unusedCodeSize / 1024)}KB 제거 가능`
      );
    }

    // 2. 중복 코드 제거 제안
    if (analysis.duplicatedCodeSize > 0) {
      recommendations.push(
        `중복 코드 ${Math.round(analysis.duplicatedCodeSize / 1024)}KB 최적화 가능`
      );
    }

    // 3. 큰 모듈 분할 제안
    for (const [moduleName, size] of analysis.modulesSizes.entries()) {
      if (size > 100 * 1024) {
        recommendations.push(`대형 모듈 ${moduleName} (${Math.round(size / 1024)}KB) 분할 권장`);
      }
    }

    return recommendations;
  }

  /**
   * 동적 import 헬퍼 생성
   */
  generateDynamicImportHelper(moduleName: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this.moduleRegistry.has(moduleName)) {
          resolve({ moduleName, loaded: true });
        } else {
          reject(new Error(`Module ${moduleName} not found`));
        }
      }, Math.random() * 100);
    });
  }

  /**
   * 청크 프리로딩 전략 생성
   */
  generatePreloadStrategy(): string[] {
    const preloadCandidates: string[] = [];

    for (const [chunkName, modules] of this.chunkManifest.entries()) {
      const chunkSize = this.calculateChunkSize(modules);

      if (chunkSize <= 50 * 1024 && chunkName !== 'main') {
        preloadCandidates.push(chunkName);
      }
    }

    return preloadCandidates;
  }

  /**
   * 번들 최적화 요약 보고서 생성
   */
  generateOptimizationReport() {
    const currentState = this.analyzeBundleComposition();
    const recommendations = this.generateTreeShakingRecommendations();
    const splittingStrategy = this.generateSplittingStrategy({
      chunkSizeThreshold: 200 * 1024,
      maxChunks: 10,
      priorityModules: ['main', 'core', 'vendor'],
      lazyLoadableModules: ['gallery', 'settings', 'advanced-features'],
    });
    const preloadStrategy = this.generatePreloadStrategy();
    const potentialSavings = currentState.unusedCodeSize + currentState.duplicatedCodeSize;

    return {
      currentState,
      recommendations,
      splittingStrategy,
      preloadStrategy,
      potentialSavings,
    };
  }

  /**
   * 청크 매니페스트 조회
   */
  getChunkManifest(): Map<string, string[]> {
    return new Map(this.chunkManifest);
  }

  /**
   * 모듈 정보 조회
   */
  getModuleInfo(moduleName: string) {
    return this.moduleRegistry.get(moduleName);
  }

  /**
   * 등록된 모든 모듈 조회
   */
  getAllModules(): Map<string, { size: number; dependencies: string[] }> {
    return new Map(this.moduleRegistry);
  }

  /**
   * 최적화 상태 초기화
   */
  reset(): void {
    this.moduleRegistry.clear();
    this.chunkManifest.clear();
  }
}

// Export functions
export function registerModule(name: string, size: number, dependencies: string[] = []): void {
  BundleOptimizer.getInstance().registerModule(name, size, dependencies);
}

export function analyzeBundleComposition(): BundleAnalysis {
  return BundleOptimizer.getInstance().analyzeBundleComposition();
}

export function generateSplittingStrategy(options: SplittingOptions): Map<string, string[]> {
  return BundleOptimizer.getInstance().generateSplittingStrategy(options);
}

export function getTreeShakingRecommendations(): string[] {
  return BundleOptimizer.getInstance().generateTreeShakingRecommendations();
}

export function loadModuleDynamically(moduleName: string): Promise<unknown> {
  return BundleOptimizer.getInstance().generateDynamicImportHelper(moduleName);
}

export function getPreloadStrategy(): string[] {
  return BundleOptimizer.getInstance().generatePreloadStrategy();
}

export function generateOptimizationReport() {
  return BundleOptimizer.getInstance().generateOptimizationReport();
}

export function getChunkManifest(): Map<string, string[]> {
  return BundleOptimizer.getInstance().getChunkManifest();
}

export function resetBundleOptimizer(): void {
  BundleOptimizer.getInstance().reset();
}

export { BundleOptimizer, type BundleAnalysis, type SplittingOptions };
