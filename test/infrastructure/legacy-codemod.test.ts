import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Project } from 'ts-morph';
import { transformLegacyPatterns } from '../../scripts/legacy-codemod';

/**
 * Legacy Codemod 테스트
 *
 * 목적: TypeScript AST 기반 레거시 패턴 자동 변환 검증
 * 범위:
 * - .value 읽기 → 함수 호출 변환
 * - False positive 필터링 (DOM .value, Iterator .next().value, Map/Set .values())
 * - Dry-run 모드 지원
 */

describe('Legacy Codemod - AST 변환', () => {
  let project: Project;

  beforeEach(() => {
    project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: 99, // ESNext
        module: 99, // ESNext
      },
    });
  });

  afterEach(() => {
    // Cleanup
    project = null as unknown as Project;
  });

  describe('.value 읽기 패턴 변환', () => {
    it('signal.value() → signal() 변환', async () => {
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
const [count, setCount] = createSignal(0);
const currentValue = count.value;
console.log(count.value);
`
      );

      const results = await transformLegacyPatterns(project, { dryRun: false });

      expect(results).toHaveLength(1);
      expect(results[0].hasChanges).toBe(true);
      expect(results[0].changeCount).toBe(2);
      expect(results[0].transformed).toContain('count()');
      expect(results[0].transformed).not.toContain('count.value');
    });

    it('중첩된 .value 읽기 변환', async () => {
      project.createSourceFile(
        'nested.ts',
        `
const [outer, setOuter] = createSignal({ inner: createSignal(42) });
const value = outer.value.inner.value;
`
      );

      const results = await transformLegacyPatterns(project);

      expect(results[0].transformed).toContain('outer().inner()');
      expect(results[0].transformed).not.toContain('.value');
    });

    it('메서드 체이닝 내부 .value 읽기 변환', async () => {
      project.createSourceFile(
        'chaining.ts',
        `
const [items, setItems] = createSignal([1, 2, 3]);
const doubled = items.value.map(x => x * 2);
`
      );

      const results = await transformLegacyPatterns(project);

      expect(results[0].transformed).toContain('items().map');
      expect(results[0].transformed).not.toContain('items.value');
    });
  });

  describe('False Positive 필터링', () => {
    it('DOM 요소 .value 보존 (HTMLInputElement)', async () => {
      project.createSourceFile(
        'dom.ts',
        `
const input = document.querySelector('input') as HTMLInputElement;
const value = input.value;
input.value = 'new value';
`
      );

      const results = await transformLegacyPatterns(project);

      expect(results[0].hasChanges).toBe(false);
      expect(results[0].transformed).toContain('input.value');
    });

    it('Iterator .next().value 보존', async () => {
      project.createSourceFile(
        'iterator.ts',
        `
const iterator = [1, 2, 3][Symbol.iterator]();
const first = iterator.next().value;
`
      );

      const results = await transformLegacyPatterns(project);

      expect(results[0].hasChanges).toBe(false);
      expect(results[0].transformed).toContain('.next().value');
    });

    it('Map.values() 메서드 보존', async () => {
      project.createSourceFile(
        'map-values.ts',
        `
const map = new Map([['a', 1], ['b', 2]]);
const values = Array.from(map.values());
`
      );

      const results = await transformLegacyPatterns(project);

      expect(results[0].hasChanges).toBe(false);
      expect(results[0].transformed).toContain('map.values()');
    });

    it('Set.values() 메서드 보존', async () => {
      project.createSourceFile(
        'set-values.ts',
        `
const set = new Set([1, 2, 3]);
const values = Array.from(set.values());
`
      );

      const results = await transformLegacyPatterns(project);

      expect(results[0].hasChanges).toBe(false);
      expect(results[0].transformed).toContain('set.values()');
    });

    it('레거시 호환성 테스트 코드 보존 (의도적 .value 사용)', async () => {
      project.createSourceFile(
        'legacy-compat-test.ts',
        `
// @legacy-compat-test
import { describe, it, expect } from 'vitest';
describe('createGlobalSignal compatibility', () => {
  it('should support .value access', () => {
    const [signal] = createGlobalSignal(42);
    expect(signal.value).toBe(42); // 의도적 레거시 사용
  });
});
`
      );

      const results = await transformLegacyPatterns(project);

      expect(results[0].hasChanges).toBe(false);
      expect(results[0].transformed).toContain('signal.value');
    });
  });

  describe('Dry-run 모드', () => {
    it('dryRun=true 시 원본 파일 변경 없음', async () => {
      const originalContent = `
const [count, setCount] = createSignal(0);
const value = count.value;
`;
      const sourceFile = project.createSourceFile('dry-run.ts', originalContent);

      const results = await transformLegacyPatterns(project, { dryRun: true });

      expect(results[0].hasChanges).toBe(true);
      expect(results[0].original).toBe(originalContent);
      expect(results[0].transformed).not.toBe(originalContent);
      // 실제 파일은 변경되지 않음
      expect(sourceFile.getFullText()).toBe(originalContent);
    });

    it('dryRun=false 시 실제 파일 변경', async () => {
      const originalContent = `
const [count, setCount] = createSignal(0);
const value = count.value;
`;
      const sourceFile = project.createSourceFile('real-run.ts', originalContent);

      const results = await transformLegacyPatterns(project, { dryRun: false });

      expect(results[0].hasChanges).toBe(true);
      expect(sourceFile.getFullText()).not.toBe(originalContent);
      expect(sourceFile.getFullText()).toContain('count()');
    });
  });

  describe('변환 통계 리포트', () => {
    it('변환된 패턴 개수 정확히 카운트', async () => {
      project.createSourceFile(
        'count-test.ts',
        `
const [a, setA] = createSignal(1);
const [b, setB] = createSignal(2);
const [c, setC] = createSignal(3);
const sum = a.value + b.value + c.value;
`
      );

      const results = await transformLegacyPatterns(project);

      expect(results[0].changeCount).toBe(3);
    });

    it('변경 없는 파일은 hasChanges=false', async () => {
      project.createSourceFile(
        'no-changes.ts',
        `
const input = document.querySelector('input') as HTMLInputElement;
const value = input.value;
`
      );

      const results = await transformLegacyPatterns(project);

      expect(results[0].hasChanges).toBe(false);
      expect(results[0].changeCount).toBe(0);
    });
  });
});
