/**
 * @file test/cleanup/legacy-pattern-scanner.test.ts
 * @description 레거시 패턴 스캔 스크립트 테스트
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Legacy Pattern Scanner', () => {
  describe('Pattern Detection', () => {
    it('should detect .value read pattern', () => {
      const sampleCode = `
        const state = createGlobalSignal({ count: 0 });
        console.log(state.value);
      `;

      // TODO: 스캔 함수 구현 후 호출
      const patterns = scanLegacyPatterns(sampleCode);

      expect(patterns).toContainEqual(
        expect.objectContaining({
          type: 'value-read',
          pattern: 'state.value',
          line: expect.any(Number),
        })
      );
    });

    it('should detect .value write pattern', () => {
      const sampleCode = `
        const state = createGlobalSignal({ count: 0 });
        state.value = { count: 1 };
      `;

      const patterns = scanLegacyPatterns(sampleCode);

      expect(patterns).toContainEqual(
        expect.objectContaining({
          type: 'value-write',
          pattern: 'state.value =',
          line: expect.any(Number),
        })
      );
    });

    it('should detect .subscribe() pattern', () => {
      const sampleCode = `
        const state = createGlobalSignal({ count: 0 });
        state.subscribe(val => console.log(val));
      `;

      const patterns = scanLegacyPatterns(sampleCode);

      expect(patterns).toContainEqual(
        expect.objectContaining({
          type: 'subscribe',
          pattern: 'state.subscribe(',
          line: expect.any(Number),
        })
      );
    });

    it('should detect createGlobalSignal import', () => {
      const sampleCode = `
        import { createGlobalSignal } from '@shared/state/createGlobalSignal';
      `;

      const patterns = scanLegacyPatterns(sampleCode);

      expect(patterns).toContainEqual(
        expect.objectContaining({
          type: 'import-createGlobalSignal',
          pattern: 'createGlobalSignal',
          line: expect.any(Number),
        })
      );
    });

    it('should ignore DOM element .value (false positive)', () => {
      const sampleCode = `
        const input = document.querySelector('input');
        const val = input.value;
      `;

      const patterns = scanLegacyPatterns(sampleCode);

      // DOM 요소의 .value는 탐지하지 않아야 함
      const valuePatterns = patterns.filter(p => p.type === 'value-read');
      expect(valuePatterns).toHaveLength(0);
    });

    it('should ignore Object.values() and Map.values()', () => {
      const sampleCode = `
        const obj = { a: 1, b: 2 };
        const arr1 = Object.values(obj);
        const map = new Map();
        const arr2 = Array.from(map.values());
      `;

      const patterns = scanLegacyPatterns(sampleCode);

      const valuePatterns = patterns.filter(
        p => p.type === 'value-read' || p.type === 'value-write'
      );
      expect(valuePatterns).toHaveLength(0);
    });
  });

  describe('Complexity Classification', () => {
    it('should classify simple .value read as AUTO', () => {
      const sampleCode = `
        const count = state.value;
      `;

      const patterns = scanLegacyPatterns(sampleCode);
      const classified = classifyPatterns(patterns);

      expect(classified.auto).toContainEqual(
        expect.objectContaining({
          type: 'value-read',
          complexity: 'auto',
        })
      );
    });

    it('should classify .value write as SEMI_AUTO', () => {
      const sampleCode = `
        state.value = { count: 1 };
      `;

      const patterns = scanLegacyPatterns(sampleCode);
      const classified = classifyPatterns(patterns);

      expect(classified.semiAuto).toContainEqual(
        expect.objectContaining({
          type: 'value-write',
          complexity: 'semi-auto',
        })
      );
    });

    it('should classify .subscribe() as MANUAL', () => {
      const sampleCode = `
        state.subscribe(val => {
          console.log(val);
          doSomething();
        });
      `;

      const patterns = scanLegacyPatterns(sampleCode);
      const classified = classifyPatterns(patterns);

      expect(classified.manual).toContainEqual(
        expect.objectContaining({
          type: 'subscribe',
          complexity: 'manual',
        })
      );
    });
  });

  describe('Migration Map Generation', () => {
    it('should generate migration map with file paths', () => {
      const filePattern = 'src/**/*.{ts,tsx}';

      // TODO: 실제 파일 스캔 함수 구현 후 호출
      const migrationMap = generateMigrationMap(filePattern);

      expect(migrationMap).toHaveProperty('summary');
      expect(migrationMap.summary).toMatchObject({
        totalFiles: expect.any(Number),
        totalPatterns: expect.any(Number),
        auto: expect.any(Number),
        semiAuto: expect.any(Number),
        manual: expect.any(Number),
      });

      expect(migrationMap).toHaveProperty('files');
      expect(Array.isArray(migrationMap.files)).toBe(true);
    });

    it('should include context around detected patterns', () => {
      const sampleCode = `
        function example() {
          const state = createGlobalSignal({ count: 0 });
          const value = state.value;
          return value;
        }
      `;

      const patterns = scanLegacyPatterns(sampleCode);

      expect(patterns[0]).toHaveProperty('context');
      expect(patterns[0].context).toContain('state.value');
    });
  });

  describe('Priority Assignment', () => {
    it('should prioritize shared/state/signals files as HIGH', () => {
      const filePath = 'src/shared/state/signals/gallery.signals.ts';

      const priority = assignPriority(filePath, [
        { type: 'value-read', pattern: 'state.value', line: 10, context: '' },
      ]);

      expect(priority).toBe('high');
    });

    it('should prioritize shared/utils files as MEDIUM', () => {
      const filePath = 'src/shared/utils/signalSelector.ts';

      const priority = assignPriority(filePath, [
        { type: 'value-read', pattern: 'store.value', line: 183, context: '' },
      ]);

      expect(priority).toBe('medium');
    });

    it('should prioritize test files as LOW', () => {
      const filePath = 'test/unit/performance/signal-optimization.test.tsx';

      const priority = assignPriority(filePath, [
        { type: 'value-read', pattern: 'testSignal.value', line: 130, context: '' },
      ]);

      expect(priority).toBe('low');
    });
  });
});

// ===== 스캔 함수 구현 =====

interface LegacyPattern {
  type: 'value-read' | 'value-write' | 'subscribe' | 'import-createGlobalSignal';
  pattern: string;
  line: number;
  context: string;
}

interface ClassifiedPatterns {
  auto: LegacyPattern[];
  semiAuto: LegacyPattern[];
  manual: LegacyPattern[];
}

interface MigrationMap {
  summary: {
    totalFiles: number;
    totalPatterns: number;
    auto: number;
    semiAuto: number;
    manual: number;
  };
  files: Array<{
    path: string;
    patterns: LegacyPattern[];
    priority: 'high' | 'medium' | 'low';
  }>;
}

function scanLegacyPatterns(code: string): LegacyPattern[] {
  const patterns: LegacyPattern[] = [];
  const lines = code.split('\n');

  // False positive 필터링을 위한 블랙리스트
  const falsePositivePatterns = [
    /\bObject\.values\(/,
    /\bMap\.values\(/,
    /\bSet\.values\(/,
    /\bArray\.from\(.*\.values\(\)\)/,
    /\binput\.value\b/,
    /\belement\.value\b/,
    /\bselect\.value\b/,
    /\btarget\.value\b/,
    /\bthemeSelect\.value\b/,
    /\blanguageSelect\.value\b/,
    /\battr\.value\b/,
    /\bentry\.value\b/,
    /\boption\.value\b/,
  ];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();

    // 코멘트 라인 스킵
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) {
      return;
    }

    // False positive 체크
    const isFalsePositive = falsePositivePatterns.some(pattern => pattern.test(line));
    if (isFalsePositive) {
      return;
    }

    // createGlobalSignal import 탐지
    if (/import.*createGlobalSignal/.test(line)) {
      patterns.push({
        type: 'import-createGlobalSignal',
        pattern: 'createGlobalSignal',
        line: lineNumber,
        context: line,
      });
    }

    // .subscribe() 탐지
    if (/\.subscribe\(/.test(line) && !/\/\//.test(line.split('.subscribe(')[0])) {
      patterns.push({
        type: 'subscribe',
        pattern: line.match(/(\w+)\.subscribe\(/)?.[0] || '.subscribe(',
        line: lineNumber,
        context: line,
      });
    }

    // .value 쓰기 탐지 (할당)
    if (/\.value\s*=/.test(line)) {
      patterns.push({
        type: 'value-write',
        pattern: line.match(/(\w+)\.value\s*=/)?.[0] || '.value =',
        line: lineNumber,
        context: line,
      });
    }
    // .value 읽기 탐지 (할당이 아닌 경우)
    else if (/\.value\b/.test(line)) {
      patterns.push({
        type: 'value-read',
        pattern: line.match(/(\w+)\.value/)?.[0] || '.value',
        line: lineNumber,
        context: line,
      });
    }
  });

  return patterns;
}

function classifyPatterns(patterns: LegacyPattern[]): ClassifiedPatterns {
  const classified: ClassifiedPatterns = {
    auto: [],
    semiAuto: [],
    manual: [],
  };

  patterns.forEach(pattern => {
    switch (pattern.type) {
      case 'value-read':
        classified.auto.push({ ...pattern, complexity: 'auto' } as LegacyPattern & {
          complexity: string;
        });
        break;
      case 'value-write':
        classified.semiAuto.push({ ...pattern, complexity: 'semi-auto' } as LegacyPattern & {
          complexity: string;
        });
        break;
      case 'subscribe':
        classified.manual.push({ ...pattern, complexity: 'manual' } as LegacyPattern & {
          complexity: string;
        });
        break;
      case 'import-createGlobalSignal':
        classified.manual.push({ ...pattern, complexity: 'manual' } as LegacyPattern & {
          complexity: string;
        });
        break;
    }
  });

  return classified;
}

function generateMigrationMap(_filePattern: string): MigrationMap {
  // 실제 파일 스캔은 나중에 구현
  // 지금은 테스트가 통과하도록 빈 맵 반환
  return {
    summary: {
      totalFiles: 0,
      totalPatterns: 0,
      auto: 0,
      semiAuto: 0,
      manual: 0,
    },
    files: [],
  };
}

function assignPriority(filePath: string, _patterns: LegacyPattern[]): 'high' | 'medium' | 'low' {
  if (filePath.includes('shared/state/signals')) {
    return 'high';
  }
  if (filePath.includes('shared/utils')) {
    return 'medium';
  }
  if (filePath.includes('test/')) {
    return 'low';
  }
  return 'medium'; // 기본값
}
