/**
 * @fileoverview 설정 모달 표시 문제 간단한 진단 테스트
 * @description 기본적인 함수와 모듈 동작 확인
 */

import { describe, it, expect } from 'vitest';

// 테스트 대상 모듈들
import { openSettingsModal, applyBasicModalStyles } from '@features/settings/settings-menu';
import { getZIndex } from '@shared/styles/z-index-system';

/**
 * 🔴 RED Phase: 기본 함수들이 존재하는지 확인
 */
describe('설정 모달 기본 함수 존재 확인', () => {
  it('openSettingsModal 함수가 정의되어 있어야 한다', () => {
    expect(typeof openSettingsModal).toBe('function');
  });

  it('applyBasicModalStyles 함수가 정의되어 있어야 한다', () => {
    expect(typeof applyBasicModalStyles).toBe('function');
  });

  it('getZIndex 함수가 정의되어 있어야 한다', () => {
    expect(typeof getZIndex).toBe('function');
  });
});

/**
 * Z-index 시스템 기본 동작 확인
 */
describe('Z-index 시스템 기본 동작', () => {
  it('modal Z-index가 숫자값을 반환해야 한다', () => {
    const zIndex = getZIndex('modal');
    expect(typeof zIndex).toBe('number');
    expect(zIndex).toBeGreaterThan(0);
  });

  it('toolbar Z-index가 숫자값을 반환해야 한다', () => {
    const zIndex = getZIndex('toolbar');
    expect(typeof zIndex).toBe('number');
    expect(zIndex).toBeGreaterThan(0);
  });

  it('modal Z-index가 toolbar Z-index보다 높아야 한다', () => {
    const modalZ = getZIndex('modal');
    const toolbarZ = getZIndex('toolbar');

    expect(modalZ).toBeGreaterThan(toolbarZ);
  });
});
