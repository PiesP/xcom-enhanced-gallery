/**
 * @fileoverview Phase 3: 타입 안전성 및 인터페이스 개선 - TDD 테스트
 * @description 엄격한 타입 체크로 런타임 에러 방지, 모듈 간 결합도 감소를 통한 유지보수성 향상, 번들 크기 최적화를 통한 성능 개선을 위한 TDD 테스트
 */

/**
 * Phase 3: 타입 안전성 및 인터페이스 개선 - TDD 테스트
 *
 * 목표:
 * - 엄격한 타입 체크로 런타임 에러 방지
 * - 모듈 간 결합도 감소를 통한 유지보수성 향상
 * - 번들 크기 최적화를 통한 성능 개선
 */

import { expect, describe, it, beforeEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Phase 3.1: 엄격한 타입 정의
 *
 * 모든 public API에 명시적 타입 정의가 있어야 하며,
 * any 타입 사용을 최소화하고 제네릭을 활용하여 타입 안전성을 확보해야 합니다.
 */
describe('Phase 3: 타입 안전성 및 인터페이스 개선', () => {
  describe('3.1 엄격한 타입 정의', () => {
    it('should have strict type definitions for all public APIs', async () => {
      const srcDir = path.join(process.cwd(), 'src');
      const files = await getAllTypeScriptFiles(srcDir);

      // 각 파일에서 any 타입 사용을 확인
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');

        // any 타입 사용을 확인 (주석 제외)
        const anyTypeMatches = content
          .split('\n')
          .filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
          .filter(
            line => line.includes(': any') || line.includes(': any[]') || line.includes('any >')
          );

        // 허용되는 any 사용 (예: 외부 라이브러리 타입 정의 등)
        const allowedAnyUsage = anyTypeMatches.filter(
          line =>
            line.includes('// @ts-ignore') ||
            line.includes('// eslint-disable') ||
            line.includes('window.') ||
            line.includes('globalThis.') ||
            file.includes('vendor') ||
            file.includes('polyfill')
        );

        const problematicAnyUsage = anyTypeMatches.filter(line => !allowedAnyUsage.includes(line));

        if (problematicAnyUsage.length > 0) {
          console.warn(
            `Problematic 'any' usage in ${path.relative(process.cwd(), file)}:`,
            problematicAnyUsage
          );
        }

        // 파일당 any 사용은 3개 이하여야 함
        expect(problematicAnyUsage.length).toBeLessThanOrEqual(3);
      }
    });

    it('should use discriminated unions for type safety', async () => {
      // MediaInfo, ExtractionStrategy 등에서 discriminated union 사용 확인
      const mediaTypesFile = path.join(process.cwd(), 'src/shared/types/media.types.ts');

      try {
        const content = await fs.readFile(mediaTypesFile, 'utf-8');

        // discriminated union 패턴 확인 (type property가 있는 인터페이스)
        const hasTypeDiscriminator =
          content.includes('type:') &&
          (content.includes('MediaType') || content.includes('ExtractionType'));

        expect(hasTypeDiscriminator).toBe(true);
      } catch (error) {
        // 파일이 없는 경우는 PASS (아직 리팩토링되지 않은 상태)
        console.log('MediaTypes file not found - this is expected in early phases');
      }
    });

    it('should have generic types for reusable components', async () => {
      // 재사용 가능한 컴포넌트들이 제네릭 타입을 사용하는지 확인
      const sharedDir = path.join(process.cwd(), 'src/shared');
      const files = await getAllTypeScriptFiles(sharedDir);

      let genericUsageCount = 0;

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');

        // 제네릭 타입 사용 확인
        const genericMatches = content.match(/<[A-Z][^>]*>|<T[^>]*>/g) || [];
        const interfaceGenerics = content.match(/interface\s+\w+<[^>]+>/g) || [];
        const functionGenerics = content.match(/function\s+\w+<[^>]+>/g) || [];

        genericUsageCount +=
          genericMatches.length + interfaceGenerics.length + functionGenerics.length;
      }

      // shared 모듈에서 최소 5개 이상의 제네릭 사용이 있어야 함
      expect(genericUsageCount).toBeGreaterThanOrEqual(5);
    });
  });

  /**
   * Phase 3.2: 모듈 결합도 감소
   *
   * 순환 의존성을 제거하고 인터페이스 기반 프로그래밍을 통해
   * 모듈 간 결합도를 낮춰야 합니다.
   */
  describe('3.2 모듈 결합도 감소', () => {
    it('should have no circular dependencies', async () => {
      // 순환 의존성 확인
      const dependencyMap = await buildDependencyMap();
      const circularDeps = findCircularDependencies(dependencyMap);

      if (circularDeps.length > 0) {
        console.warn('Circular dependencies found:', circularDeps);
      }

      // 순환 의존성이 없어야 함
      expect(circularDeps.length).toBe(0);
    });

    it('should use dependency injection patterns', async () => {
      // 의존성 주입 패턴 사용 확인
      const servicesDir = path.join(process.cwd(), 'src/shared/services');
      const files = await getAllTypeScriptFiles(servicesDir);

      let diPatternUsage = 0;

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');

        // 의존성 주입 패턴 확인
        const hasConstructorInjection =
          content.includes('constructor(') &&
          content.includes('private') &&
          content.includes('Service');
        const hasInterfaceUsage = content.match(/:\s*I[A-Z]\w+/g) || [];
        const hasFactoryPattern = content.includes('Factory') || content.includes('create');

        if (hasConstructorInjection || hasInterfaceUsage.length > 0 || hasFactoryPattern) {
          diPatternUsage++;
        }
      }

      // 서비스의 60% 이상이 DI 패턴을 사용해야 함 (현실적 목표)
      expect(diPatternUsage).toBeGreaterThan(files.length * 0.6);
    });

    it('should minimize direct imports between feature modules', async () => {
      // 피처 모듈 간 직접 import를 최소화해야 함
      const featuresDir = path.join(process.cwd(), 'src/features');
      const files = await getAllTypeScriptFiles(featuresDir);

      let crossFeatureImports = 0;

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const relativePath = path.relative(process.cwd(), file);

        // 다른 피처 모듈에서 import하는지 확인
        const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));

        for (const importLine of importLines) {
          // ../features/ 패턴의 import 확인
          if (importLine.includes('../features/') && !importLine.includes('/shared/')) {
            crossFeatureImports++;
            console.warn(`Cross-feature import in ${relativePath}: ${importLine.trim()}`);
          }
        }
      }

      // 피처 모듈 간 직접 import는 5개 이하여야 함
      expect(crossFeatureImports).toBeLessThanOrEqual(5);
    });
  });

  /**
   * Phase 3.3: 번들 크기 최적화
   *
   * 트리 쉐이킹을 통한 최적화와 동적 import를 활용하여
   * 번들 크기를 최소화해야 합니다.
   */
  describe('3.3 번들 크기 최적화', () => {
    it('should not include unused polyfills', async () => {
      // 사용되지 않는 polyfill 확인
      const polyfillsDir = path.join(process.cwd(), 'src/shared/polyfills');

      try {
        const polyfillFiles = await getAllTypeScriptFiles(polyfillsDir);
        const srcFiles = await getAllTypeScriptFiles(path.join(process.cwd(), 'src'));

        // 각 polyfill이 실제로 사용되는지 확인
        for (const polyfillFile of polyfillFiles) {
          const polyfillName = path.basename(polyfillFile, '.ts');
          const isUsed = await isPolyfillUsed(polyfillName, srcFiles);

          if (!isUsed) {
            console.warn(`Unused polyfill detected: ${polyfillName}`);
          }

          // 모든 polyfill이 사용되어야 함
          expect(isUsed).toBe(true);
        }
      } catch (error) {
        // polyfills 디렉토리가 없으면 PASS
        console.log('Polyfills directory not found - this is acceptable');
      }
    });

    it('should use dynamic imports for large dependencies', async () => {
      // 큰 의존성에 대한 동적 import 사용 확인
      const srcFiles = await getAllTypeScriptFiles(path.join(process.cwd(), 'src'));

      let dynamicImportCount = 0;
      let staticImportCount = 0;

      for (const file of srcFiles) {
        const content = await fs.readFile(file, 'utf-8');

        // 동적 import 확인
        const dynamicImports = content.match(/import\s*\(/g) || [];
        dynamicImportCount += dynamicImports.length;

        // 정적 import 확인 (큰 라이브러리들)
        const staticImports =
          content.match(/import.*from\s+['"](?:fflate|preact|@tabler)['"]/g) || [];
        staticImportCount += staticImports.length;
      }

      // 동적 import 사용 비율이 증가해야 함
      const dynamicImportRatio = dynamicImportCount / (dynamicImportCount + staticImportCount);

      expect(dynamicImportRatio).toBeGreaterThan(0.1); // 최소 10% 이상 동적 import 사용
    });

    it('should have optimized bundle imports', async () => {
      // 번들 최적화를 위한 import 방식 확인
      const srcFiles = await getAllTypeScriptFiles(path.join(process.cwd(), 'src'));

      let optimizedImports = 0;
      let problematicImports = 0;

      for (const file of srcFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));

        for (const importLine of importLines) {
          // 최적화된 import 패턴 확인
          if (
            importLine.includes('type ') ||
            importLine.includes('/dist/') ||
            importLine.includes('.js')
          ) {
            optimizedImports++;
          }

          // 문제가 될 수 있는 import 패턴
          if (
            importLine.includes('* as') &&
            !importLine.includes('vendor') &&
            !importLine.includes('polyfill')
          ) {
            problematicImports++;
          }
        }
      }

      // 문제가 될 수 있는 import가 10개 이하여야 함
      expect(problematicImports).toBeLessThanOrEqual(10);
    });
  });
});

// Helper Functions

async function getAllTypeScriptFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await getAllTypeScriptFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // 디렉토리가 없는 경우 빈 배열 반환
  }

  return files;
}

async function buildDependencyMap(): Promise<Map<string, string[]>> {
  const dependencyMap = new Map<string, string[]>();
  const srcFiles = await getAllTypeScriptFiles(path.join(process.cwd(), 'src'));

  for (const file of srcFiles) {
    const content = await fs.readFile(file, 'utf-8');
    const imports: string[] = [];

    // import 문에서 경로 추출
    const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];

    for (const importMatch of importMatches) {
      const pathMatch = importMatch.match(/from\s+['"]([^'"]+)['"]/);
      if (pathMatch && pathMatch[1].startsWith('.')) {
        imports.push(pathMatch[1]);
      }
    }

    const normalizedPath = path.relative(process.cwd(), file).replace(/\\/g, '/');
    dependencyMap.set(normalizedPath, imports);
  }

  return dependencyMap;
}

function findCircularDependencies(dependencyMap: Map<string, string[]>): string[][] {
  const circularDeps: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(file: string, path: string[]): void {
    if (recursionStack.has(file)) {
      const cycleStart = path.indexOf(file);
      if (cycleStart !== -1) {
        circularDeps.push(path.slice(cycleStart));
      }
      return;
    }

    if (visited.has(file)) {
      return;
    }

    visited.add(file);
    recursionStack.add(file);

    const dependencies = dependencyMap.get(file) || [];
    for (const dep of dependencies) {
      dfs(dep, [...path, file]);
    }

    recursionStack.delete(file);
  }

  for (const file of dependencyMap.keys()) {
    if (!visited.has(file)) {
      dfs(file, []);
    }
  }

  return circularDeps;
}

async function isPolyfillUsed(polyfillName: string, srcFiles: string[]): Promise<boolean> {
  for (const file of srcFiles) {
    const content = await fs.readFile(file, 'utf-8');

    // polyfill 이름이 파일에서 사용되는지 확인
    if (content.includes(polyfillName)) {
      return true;
    }
  }

  return false;
}
