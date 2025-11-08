/**
 * @fileoverview Phase 110.2: Toast 아이콘 개선 테스트
 * @phase 110.2
 * @priority 높음
 *
 * Toast 컴포넌트가 모든 타입에 동일한 이모지(🔔)를 사용하여
 * WCAG 2.1 "색상만으로 정보 전달 금지" 원칙 위반 가능
 *
 * 목표: 타입별 구별 가능한 아이콘으로 변경하여 색맹 사용자도 Toast 타입 구분 가능
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Phase 110.2: Toast 아이콘 개선', () => {
  const toastTsxPath = resolve(
    __dirname,
    '../../../../../src/shared/components/ui/Toast/Toast.tsx'
  );
  const toastTsx = readFileSync(toastTsxPath, 'utf-8');

  it('getToastIcon 함수가 toast.type 파라미터를 사용해야 함', () => {
    // getToastIcon 함수 정의를 찾음
    const getToastIconDef = /const\s+getToastIcon\s*=\s*\([^)]*\)\s*:\s*string\s*=>/;

    expect(toastTsx).toMatch(getToastIconDef);

    // 함수가 toast.type을 참조해야 함
    const usesToastType = /toast\.type/;

    expect(toastTsx).toMatch(usesToastType);
  });

  it('info 타입에 대한 아이콘이 정의되어야 함', () => {
    // 'info' 케이스 처리
    const hasInfoCase = /case\s+['"]info['"]/;

    expect(toastTsx).toMatch(hasInfoCase);

    // info 아이콘: ℹ️ 또는 ℹ
    const hasInfoIcon = /[ℹ]/;

    expect(toastTsx).toMatch(hasInfoIcon);
  });

  it('success 타입에 대한 아이콘이 정의되어야 함', () => {
    // 'success' 케이스 처리
    const hasSuccessCase = /case\s+['"]success['"]/;

    expect(toastTsx).toMatch(hasSuccessCase);

    // success 아이콘: ✅ (U+2705)
    const hasSuccessIcon = /✅/;

    expect(toastTsx).toMatch(hasSuccessIcon);
  });

  it('warning 타입에 대한 아이콘이 정의되어야 함', () => {
    // 'warning' 케이스 처리
    const hasWarningCase = /case\s+['"]warning['"]/;

    expect(toastTsx).toMatch(hasWarningCase);

    // warning 아이콘: ⚠️ 또는 ⚠
    const hasWarningIcon = /[⚠]/;

    expect(toastTsx).toMatch(hasWarningIcon);
  });

  it('error 타입에 대한 아이콘이 정의되어야 함', () => {
    // 'error' 케이스 처리
    const hasErrorCase = /case\s+['"]error['"]/;

    expect(toastTsx).toMatch(hasErrorCase);

    // error 아이콘: ❌ (U+274C)
    const hasErrorIcon = /❌/;

    expect(toastTsx).toMatch(hasErrorIcon);
  });

  it('기본 케이스(default)가 정의되어야 함', () => {
    // default 케이스 처리
    const hasDefaultCase = /default:/;

    expect(toastTsx).toMatch(hasDefaultCase);

    // 기본 아이콘: 🔔
    const hasDefaultIcon = /🔔/;

    expect(toastTsx).toMatch(hasDefaultIcon);
  });

  it('getToastIcon이 switch 문을 사용해야 함', () => {
    // switch (toast.type) 패턴
    const hasSwitchStatement = /switch\s*\(\s*toast\.type\s*\)/;

    expect(toastTsx).toMatch(hasSwitchStatement);
  });
});
