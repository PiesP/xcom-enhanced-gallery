/**
 * @file SOLID-NATIVE-001 Phase G-1: createGlobalSignal 사용처 인벤토리 테스트
 * @description SolidJS 네이티브 패턴으로 전환하기 위한 레거시 패턴 사용처 식별
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

/**
 * 재귀적으로 파일 목록을 가져오는 헬퍼
 */
function getFilesRecursively(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
      files.push(...getFilesRecursively(fullPath, extensions));
    } else if (stat.isFile() && extensions.some(ext => entry.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 파일에서 패턴 매칭하여 라인 번호와 함께 반환
 */
function findPatternInFile(
  filePath: string,
  pattern: RegExp
): Array<{ line: number; content: string }> {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const matches: Array<{ line: number; content: string }> = [];

    lines.forEach((lineContent, index) => {
      if (pattern.test(lineContent)) {
        matches.push({
          line: index + 1,
          content: lineContent.trim(),
        });
      }
    });

    return matches;
  } catch {
    return [];
  }
}

interface InventoryResult {
  createGlobalSignalImports: Map<string, Array<{ line: number; content: string }>>;
  createGlobalSignalCalls: Map<string, Array<{ line: number; content: string }>>;
  valuePropertyAccess: Map<string, Array<{ line: number; content: string }>>;
  subscribeMethodCalls: Map<string, Array<{ line: number; content: string }>>;
}

/**
 * src 디렉터리 전체를 스캔하여 레거시 패턴 사용처를 수집
 */
function scanLegacyPatterns(): InventoryResult {
  const srcDir = join(process.cwd(), 'src');
  const files = getFilesRecursively(srcDir, ['.ts', '.tsx']);

  const result: InventoryResult = {
    createGlobalSignalImports: new Map(),
    createGlobalSignalCalls: new Map(),
    valuePropertyAccess: new Map(),
    subscribeMethodCalls: new Map(),
  };

  // 패턴 정의
  const patterns = {
    // import { createGlobalSignal } from ...
    import: /import\s*\{[^}]*createGlobalSignal[^}]*\}\s*from/,
    // createGlobalSignal<...>(...)
    call: /createGlobalSignal\s*<[^>]*>\s*\(/,
    // .value = ... 또는 .value.
    valueAccess: /\.value\s*[=.]/,
    // .subscribe(
    subscribe: /\.subscribe\s*\(/,
  };

  for (const file of files) {
    const relativePath = file.replace(process.cwd(), '').replace(/\\/g, '/');

    // Import 스캔
    const imports = findPatternInFile(file, patterns.import);
    if (imports.length > 0) {
      result.createGlobalSignalImports.set(relativePath, imports);
    }

    // Call 스캔
    const calls = findPatternInFile(file, patterns.call);
    if (calls.length > 0) {
      result.createGlobalSignalCalls.set(relativePath, calls);
    }

    // .value 속성 접근 스캔
    const valueAccess = findPatternInFile(file, patterns.valueAccess);
    if (valueAccess.length > 0) {
      result.valuePropertyAccess.set(relativePath, valueAccess);
    }

    // .subscribe() 메서드 호출 스캔
    const subscribeCalls = findPatternInFile(file, patterns.subscribe);
    if (subscribeCalls.length > 0) {
      result.subscribeMethodCalls.set(relativePath, subscribeCalls);
    }
  }

  return result;
}

describe('SOLID-NATIVE-001 Phase G-1: createGlobalSignal 인벤토리', () => {
  const inventory = scanLegacyPatterns();

  describe('1. createGlobalSignal import 사용처 식별', () => {
    it('createGlobalSignal을 import하는 파일 목록을 수집해야 함', () => {
      expect(inventory.createGlobalSignalImports.size).toBeGreaterThan(0);

      // 예상 파일들이 포함되어 있는지 검증
      const importFiles = Array.from(inventory.createGlobalSignalImports.keys());
      // Note: toolbar.signals.ts는 Phase G-3-1에서 네이티브 패턴으로 변환됨 (2025-01)
      // Note: download.signals.ts는 Phase G-3-2에서 네이티브 패턴으로 변환됨 (2025-09)
      const expectedFiles = ['/src/shared/state/signals/gallery.signals.ts'];

      for (const expectedFile of expectedFiles) {
        expect(
          importFiles.some(f => f.includes(expectedFile)),
          `Expected file ${expectedFile} to be found in imports`
        ).toBe(true);
      }

      // 상세 로그 출력
      console.log('\n📦 createGlobalSignal Import 사용처:');
      inventory.createGlobalSignalImports.forEach((matches, file) => {
        console.log(`\n  ${file}`);
        matches.forEach(match => {
          console.log(`    Line ${match.line}: ${match.content}`);
        });
      });
    });

    it('각 import 위치의 라인 번호를 기록해야 함', () => {
      inventory.createGlobalSignalImports.forEach((matches, file) => {
        expect(matches.length).toBeGreaterThan(0);
        matches.forEach(match => {
          expect(match.line).toBeGreaterThan(0);
          expect(match.content).toContain('createGlobalSignal');
        });
      });
    });
  });

  describe('2. createGlobalSignal 호출 사용처 식별', () => {
    it('createGlobalSignal()을 호출하는 파일 목록을 수집해야 함', () => {
      expect(inventory.createGlobalSignalCalls.size).toBeGreaterThan(0);

      // 상세 로그 출력
      console.log('\n🔧 createGlobalSignal 호출 사용처:');
      inventory.createGlobalSignalCalls.forEach((matches, file) => {
        console.log(`\n  ${file}`);
        matches.forEach(match => {
          console.log(`    Line ${match.line}: ${match.content}`);
        });
      });
    });

    it('각 호출의 타입 파라미터를 기록해야 함', () => {
      inventory.createGlobalSignalCalls.forEach((matches, file) => {
        matches.forEach(match => {
          // createGlobalSignal<Type>(...) 형태 검증
          expect(match.content).toMatch(/createGlobalSignal\s*<[^>]+>/);
        });
      });
    });
  });

  describe('3. .value 속성 접근 패턴 식별', () => {
    it('.value 속성에 접근하는 파일 목록을 수집해야 함', () => {
      expect(inventory.valuePropertyAccess.size).toBeGreaterThan(0);

      // 상세 로그 출력
      console.log('\n💎 .value 속성 접근 사용처:');
      inventory.valuePropertyAccess.forEach((matches, file) => {
        console.log(`\n  ${file} (${matches.length} occurrences)`);
        // 샘플만 출력 (너무 많을 수 있음)
        matches.slice(0, 5).forEach(match => {
          console.log(`    Line ${match.line}: ${match.content}`);
        });
        if (matches.length > 5) {
          console.log(`    ... and ${matches.length - 5} more`);
        }
      });
    });

    it('setter와 getter 패턴을 구분해야 함', () => {
      const setterPattern = /\.value\s*=/;
      const getterPattern = /\.value\./;

      let setterCount = 0;
      let getterCount = 0;

      inventory.valuePropertyAccess.forEach(matches => {
        matches.forEach(match => {
          if (setterPattern.test(match.content)) {
            setterCount++;
          } else if (getterPattern.test(match.content)) {
            getterCount++;
          }
        });
      });

      console.log(`\n  Setter (.value =): ${setterCount}`);
      console.log(`  Getter (.value.): ${getterCount}`);

      expect(setterCount + getterCount).toBeGreaterThan(0);
    });
  });

  describe('4. .subscribe() 메서드 호출 식별', () => {
    it('.subscribe()를 호출하는 파일 목록을 수집해야 함', () => {
      expect(inventory.subscribeMethodCalls.size).toBeGreaterThan(0);

      // 상세 로그 출력
      console.log('\n📡 .subscribe() 메서드 호출 사용처:');
      inventory.subscribeMethodCalls.forEach((matches, file) => {
        console.log(`\n  ${file}`);
        matches.forEach(match => {
          console.log(`    Line ${match.line}: ${match.content}`);
        });
      });
    });

    it('구독 패턴의 복잡도를 평가해야 함', () => {
      // 간단한 구독: signal.subscribe(...)
      // 복잡한 구독: nested, conditional 등
      inventory.subscribeMethodCalls.forEach((matches, file) => {
        matches.forEach(match => {
          expect(match.content).toContain('.subscribe');
        });
      });
    });
  });

  describe('5. 전환 우선순위 평가', () => {
    it('파일별 영향도를 계산해야 함', () => {
      interface FileImpact {
        file: string;
        imports: number;
        calls: number;
        valueAccess: number;
        subscribes: number;
        totalScore: number;
      }

      const impacts: FileImpact[] = [];

      // 모든 관련 파일 수집
      const allFiles = new Set([
        ...inventory.createGlobalSignalImports.keys(),
        ...inventory.createGlobalSignalCalls.keys(),
        ...inventory.valuePropertyAccess.keys(),
        ...inventory.subscribeMethodCalls.keys(),
      ]);

      allFiles.forEach(file => {
        const imports = inventory.createGlobalSignalImports.get(file)?.length ?? 0;
        const calls = inventory.createGlobalSignalCalls.get(file)?.length ?? 0;
        const valueAccess = inventory.valuePropertyAccess.get(file)?.length ?? 0;
        const subscribes = inventory.subscribeMethodCalls.get(file)?.length ?? 0;

        // 영향도 점수 계산 (가중치 적용)
        // import: 1점, call: 5점, valueAccess: 2점, subscribe: 3점
        const totalScore = imports * 1 + calls * 5 + valueAccess * 2 + subscribes * 3;

        impacts.push({
          file,
          imports,
          calls,
          valueAccess,
          subscribes,
          totalScore,
        });
      });

      // 영향도 순으로 정렬
      impacts.sort((a, b) => b.totalScore - a.totalScore);

      console.log('\n📊 파일별 영향도 (상위 15개):');
      console.log('\nFile | Imports | Calls | .value | .subscribe() | Score');
      console.log(''.padEnd(80, '-'));

      impacts.slice(0, 15).forEach(impact => {
        const shortPath = impact.file.replace('/src/', '');
        console.log(
          `${shortPath.padEnd(45)} | ${String(impact.imports).padStart(7)} | ${String(impact.calls).padStart(5)} | ${String(impact.valueAccess).padStart(6)} | ${String(impact.subscribes).padStart(12)} | ${String(impact.totalScore).padStart(5)}`
        );
      });

      expect(impacts.length).toBeGreaterThan(0);
    });

    it('전환 로드맵 권장사항을 제시해야 함', () => {
      // 낮은 리스크: 독립적 파일, 사용처 적음
      // 중간 리스크: 서비스 레이어와 연결
      // 높은 리스크: 핵심 상태, 의존성 많음

      interface RiskCategory {
        level: 'Low' | 'Medium' | 'High';
        files: string[];
        reason: string;
      }

      const riskCategories: RiskCategory[] = [
        {
          level: 'Low',
          files: ['/src/shared/state/signals/toolbar.signals.ts'],
          reason: '독립적, 사용처 적음 - ✅ Phase G-3-1 완료',
        },
        {
          level: 'Medium',
          files: ['/src/shared/state/signals/download.signals.ts'],
          reason: '서비스 레이어와 밀접 - ✅ Phase G-3-2 완료',
        },
        {
          level: 'High',
          files: ['/src/shared/state/signals/gallery.signals.ts'],
          reason: '핵심 상태, 의존성 많음 - 🔄 Phase G-3-3 진행 예정',
        },
      ];

      console.log('\n🎯 전환 우선순위 권장사항:');
      riskCategories.forEach(category => {
        console.log(`\n  ${category.level} Risk: ${category.reason}`);
        category.files.forEach(file => {
          const shortPath = file.replace('/src/', '');
          console.log(`    - ${shortPath}`);
        });
      });

      expect(riskCategories.length).toBe(3);
    });
  });

  describe('6. 종합 통계', () => {
    it('전체 마이그레이션 범위를 요약해야 함', () => {
      const totalImports = inventory.createGlobalSignalImports.size;
      const totalCalls = Array.from(inventory.createGlobalSignalCalls.values()).reduce(
        (sum, arr) => sum + arr.length,
        0
      );
      const totalValueAccess = Array.from(inventory.valuePropertyAccess.values()).reduce(
        (sum, arr) => sum + arr.length,
        0
      );
      const totalSubscribes = Array.from(inventory.subscribeMethodCalls.values()).reduce(
        (sum, arr) => sum + arr.length,
        0
      );

      console.log('\n📈 SOLID-NATIVE-001 Phase G-1 종합 통계:');
      console.log('─'.repeat(50));
      console.log(`  createGlobalSignal imports: ${totalImports} files`);
      console.log(`  createGlobalSignal calls: ${totalCalls} occurrences`);
      console.log(`  .value property access: ${totalValueAccess} occurrences`);
      console.log(`  .subscribe() method calls: ${totalSubscribes} occurrences`);
      console.log('─'.repeat(50));
      console.log(
        `  총 영향받는 파일: ${new Set([...inventory.createGlobalSignalImports.keys(), ...inventory.valuePropertyAccess.keys()]).size} files`
      );
      console.log('─'.repeat(50));

      // 검증: 최소 기대치 (Phase G-3-1, G-3-2 완료 후)
      expect(totalImports).toBeGreaterThanOrEqual(1); // gallery signals만 남음
      expect(totalCalls).toBeGreaterThanOrEqual(1);
      expect(totalValueAccess).toBeGreaterThanOrEqual(20);
      expect(totalSubscribes).toBeGreaterThanOrEqual(5);
    });
  });
});
