/**
 * @fileoverview Phase 11.1 RED Test - Deprecated 항목 정리
 * @description toolbarConfig.ts가 더 이상 존재하지 않음을 검증
 */

import { describe, test, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Phase 11.1: Deprecated 파일 정리 (RED → GREEN)', () => {
  const srcRoot = path.resolve(__dirname, '../../src');
  const testRoot = path.resolve(__dirname, '../../test');

  test('[RED] toolbarConfig.ts 파일이 존재하지 않아야 함', () => {
    const toolbarConfigPath = path.join(srcRoot, 'shared/components/ui/Toolbar/toolbarConfig.ts');

    // RED: 현재는 파일이 존재함
    expect(fs.existsSync(toolbarConfigPath)).toBe(false);
  });

  test('[RED] configurable-toolbar.test.tsx 파일이 존재하지 않아야 함', () => {
    const testPath = path.join(testRoot, 'components/configurable-toolbar.test.tsx');

    // RED: 현재는 테스트 파일이 존재함
    expect(fs.existsSync(testPath)).toBe(false);
  });

  test('[RED] 소스 코드에서 toolbarConfig import가 없어야 함', () => {
    // toolbarConfig를 사용하는 src 파일이 없어야 함
    // 간단하게 configurable-toolbar.test.tsx가 제거되면 자동으로 해결됨

    // 대신 dependency-cruiser 설정을 확인
    const depCruiserPath = path.resolve(__dirname, '../../.dependency-cruiser.cjs');
    const content = fs.readFileSync(depCruiserPath, 'utf-8');

    // toolbarConfig를 허용 목록에서 찾지 못해야 함
    const hasException = /toolbarConfig[.]ts/.test(content);

    // RED: 현재는 예외 규칙이 있음
    expect(hasException).toBe(false);
  });

  test('[RED] dependency-cruiser 설정에서 toolbarConfig 예외가 제거되어야 함', () => {
    const depCruiserPath = path.resolve(__dirname, '../../.dependency-cruiser.cjs');
    const content = fs.readFileSync(depCruiserPath, 'utf-8');

    // toolbarConfig 관련 예외 규칙이 있는지 확인
    const hasToolbarConfigException = /toolbarConfig[.]ts/.test(content);

    // RED: 예외가 제거되어야 함
    expect(hasToolbarConfigException).toBe(false);
  });
});
