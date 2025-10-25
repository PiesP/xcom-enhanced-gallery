/**
 * @fileoverview Phase 133: Toast 서비스 API 표준화
 * @description 다중 export 별칭을 정리하고 공식 API 1개로 표준화
 *
 * RED: 표준화 요구사항 테스트
 * GREEN: 별칭 제거 및 정리
 * REFACTOR: 마이그레이션 가이드 추가
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Phase 133: Toast 서비스 API 표준화', () => {
  const repoRoot = resolve(process.cwd());
  const toastManagerPath = resolve(repoRoot, 'src/shared/services/unified-toast-manager.ts');

  describe.skip('RED: 표준화 요구사항 검증 (현재 상태)', () => {
    it('공식 export는 toastManager 1개만 존재해야 한다', () => {
      const content = readFileSync(toastManagerPath, 'utf-8');

      // 주요 export는 toastManager만
      expect(content).toContain('export const toastManager = ToastManager.getInstance();');

      // 별칭 제거 예상 (현재는 존재함 → RED 상태)
      // 이를 제거하면 GREEN이 됨
      expect(content).toContain('export const ToastService = toastManager;');
      expect(content).toContain('export const toastService = toastManager;');
      expect(content).toContain('export const toastController = toastManager;');
    });

    it('deprecated export는 제거되어야 한다', () => {
      const content = readFileSync(toastManagerPath, 'utf-8');

      // 제거 대상 (현재는 존재함)
      expect(content).toContain('@deprecated');
      expect(content).toContain('export const UnifiedToastManager = ToastManager;');
    });

    it('편의 함수는 제거되어야 한다 (직접 메서드 사용 권장)', () => {
      const content = readFileSync(toastManagerPath, 'utf-8');

      // 제거 대상 (현재는 존재함)
      expect(content).toContain('export function addToast');
      expect(content).toContain('export function removeToast');
      expect(content).toContain('export function clearAllToasts');
    });

    it('toasts 객체는 시그널 getter로 단순화되어야 한다', () => {
      const content = readFileSync(toastManagerPath, 'utf-8');

      // 현재 상태: 복잡한 객체
      expect(content).toContain('export const toasts = {');
    });
  });

  describe('GREEN: 표준화 후 검증', () => {
    it('공식 export는 toastManager만 존재해야 한다', () => {
      const content = readFileSync(toastManagerPath, 'utf-8');

      // 주요 export
      expect(content).toContain('export const toastManager = ToastManager.getInstance();');

      // 별칭 제거됨
      expect(content).not.toContain('export const ToastService');
      expect(content).not.toContain('export const toastService');
      expect(content).not.toContain('export const toastController');
    });

    it('deprecated export는 제거되어야 한다', () => {
      const content = readFileSync(toastManagerPath, 'utf-8');

      // 제거됨
      expect(content).not.toContain('export const UnifiedToastManager');
    });

    it('편의 함수는 제거되어야 한다', () => {
      const content = readFileSync(toastManagerPath, 'utf-8');

      // 제거됨
      expect(content).not.toContain('export function addToast');
      expect(content).not.toContain('export function removeToast');
      expect(content).not.toContain('export function clearAllToasts');
    });

    it('ToastManager 클래스가 메인 export여야 한다', () => {
      const content = readFileSync(toastManagerPath, 'utf-8');

      expect(content).toContain('export class ToastManager');
    });

    it('서비스 인터페이스가 명확해야 한다', () => {
      const content = readFileSync(toastManagerPath, 'utf-8');

      // 핵심 메서드들
      expect(content).toContain('public show(');
      expect(content).toContain('public success(');
      expect(content).toContain('public info(');
      expect(content).toContain('public warning(');
      expect(content).toContain('public error(');
      expect(content).toContain('public remove(');
      expect(content).toContain('public clear(');
      expect(content).toContain('public getToasts(');
      expect(content).toContain('public subscribe(');
    });
  });

  describe('REFACTOR: 마이그레이션 가이드 포함', () => {
    it('마이그레이션 가이드가 문서화되어야 한다', () => {
      const content = readFileSync(toastManagerPath, 'utf-8');

      // 마이그레이션 가이드 주석 존재
      expect(content).toContain('마이그레이션');
    });

    it('공식 export만 노출되어야 한다', () => {
      const content = readFileSync(toastManagerPath, 'utf-8');

      // 배럴이 명확해야 함
      const exportLines = content.split('\n').filter(line => line.startsWith('export '));

      // 제거 후 export 수가 줄어들어야 함 (정확한 수는 구현 후 확인)
      expect(exportLines.length).toBeLessThan(15);
    });
  });
});
