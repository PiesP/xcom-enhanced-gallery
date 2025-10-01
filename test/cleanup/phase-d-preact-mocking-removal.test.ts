/**
 * Phase D: 테스트 모킹 인프라 정리 - Characterization 테스트
 *
 * 목표: Preact 관련 모킹 코드 제거 및 SolidJS 전용 테스트 유틸리티 정비
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Phase D: Preact Mocking Removal - Characterization', () => {
  const testUtilsDir = path.resolve(__dirname, '../utils/mocks');

  it('should verify Preact mocking functions are removed from vendor-mocks.ts', () => {
    const vendorMocksPath = path.join(testUtilsDir, 'vendor-mocks.ts');
    const content = fs.readFileSync(vendorMocksPath, 'utf-8');

    // Preact 관련 함수 목록
    const preactFunctions = [
      'createMockPreact',
      'createMockPreactHooks',
      'createMockPreactSignals',
      'createMockPreactCompat',
      'getPreact',
      'getPreactHooks',
      'getPreactSignals',
      'getPreactCompat',
    ];

    const foundFunctions: string[] = [];
    preactFunctions.forEach(fn => {
      if (content.includes(fn)) {
        foundFunctions.push(fn);
      }
    });

    // Phase D 완료: Preact 함수가 없어야 함
    expect(foundFunctions).toHaveLength(0);
    console.log('Verified: No Preact mocking functions in vendor-mocks.ts');
  });

  it('should verify Preact mocking functions are removed from vendor-mocks-clean.ts', () => {
    const vendorMocksCleanPath = path.join(testUtilsDir, 'vendor-mocks-clean.ts');
    const content = fs.readFileSync(vendorMocksCleanPath, 'utf-8');

    const preactFunctions = [
      'createMockPreact',
      'createMockPreactHooks',
      'createMockPreactSignals',
      'createMockPreactCompat',
      'getPreact',
      'getPreactHooks',
      'getPreactSignals',
      'getPreactCompat',
    ];

    const foundFunctions: string[] = [];
    preactFunctions.forEach(fn => {
      if (content.includes(fn)) {
        foundFunctions.push(fn);
      }
    });

    // Phase D 완료: Preact 함수가 없어야 함
    expect(foundFunctions).toHaveLength(0);
    console.log('Verified: No Preact mocking functions in vendor-mocks-clean.ts');
  });

  it('should verify SolidJS mocking functions exist and are complete', () => {
    const vendorMocksPath = path.join(testUtilsDir, 'vendor-mocks.ts');
    const content = fs.readFileSync(vendorMocksPath, 'utf-8');

    // SolidJS 필수 함수 목록
    const solidFunctions = [
      'createMockSolidCore',
      'createMockSolidStore',
      'createMockSolidWeb',
      'getSolidCore',
      'getSolidStore',
      'getSolidWeb',
    ];

    const foundFunctions: string[] = [];
    solidFunctions.forEach(fn => {
      if (content.includes(fn)) {
        foundFunctions.push(fn);
      }
    });

    // SolidJS 모킹 함수는 모두 존재해야 함
    expect(foundFunctions).toHaveLength(solidFunctions.length);
    console.log('SolidJS mocking functions:', foundFunctions);
  });

  it('should verify SolidJS mocking includes essential APIs', () => {
    const vendorMocksPath = path.join(testUtilsDir, 'vendor-mocks.ts');
    const content = fs.readFileSync(vendorMocksPath, 'utf-8');

    // createMockSolidCore 함수 내용 확인
    const solidCoreAPIs = [
      'createSignal',
      'createEffect',
      'createMemo',
      'createRoot',
      'createComputed',
      'onCleanup',
      'batch',
      'untrack',
      'createContext',
      'useContext',
    ];

    const foundAPIs: string[] = [];
    solidCoreAPIs.forEach(api => {
      if (content.includes(api)) {
        foundAPIs.push(api);
      }
    });

    // 모든 필수 API가 존재해야 함
    expect(foundAPIs).toHaveLength(solidCoreAPIs.length);
    console.log('SolidJS Core APIs:', foundAPIs);
  });
});

describe('Phase D: Test Suite Analysis', () => {
  it('should identify test files using Preact mocks', async () => {
    const testDir = path.resolve(__dirname, '..');

    // Preact 관련 import 패턴
    const preactImportPatterns = [
      /getPreact\s*\(/,
      /createMockPreact/,
      /getPreactHooks/,
      /getPreactSignals/,
      /createMockPreactSignals/,
    ];

    const testFiles: string[] = [];

    function scanDirectory(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (
          entry.isFile() &&
          (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx'))
        ) {
          const content = fs.readFileSync(fullPath, 'utf-8');

          const hasPreactUsage = preactImportPatterns.some(pattern => pattern.test(content));
          if (hasPreactUsage) {
            testFiles.push(fullPath.replace(testDir, ''));
          }
        }
      }
    }

    scanDirectory(testDir);

    console.log(`Found ${testFiles.length} test files using Preact mocks:`);
    testFiles.forEach(file => console.log(`  - ${file}`));

    // 현재 상태 기록
    expect(testFiles.length).toBeGreaterThanOrEqual(0);
  });
});
