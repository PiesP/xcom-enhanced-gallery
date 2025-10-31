/**
 * Phase 294: TwitterScrollPreservation 단위 테스트
 * @description Twitter 스크롤 위치 저장/복원 로직 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TwitterScrollPreservation,
  getTwitterScrollPreservation,
  resetTwitterScrollPreservation,
} from '../../../../src/shared/utils/twitter/scroll-preservation';

describe('TwitterScrollPreservation', () => {
  let preservation: TwitterScrollPreservation;
  let mockScrollContainer: HTMLElement;

  beforeEach(() => {
    preservation = new TwitterScrollPreservation();

    // Mock Twitter 스크롤 컨테이너
    mockScrollContainer = document.createElement('div');
    mockScrollContainer.setAttribute('data-testid', 'primaryColumn');
    Object.defineProperty(mockScrollContainer, 'scrollTop', {
      writable: true,
      value: 0,
    });
    Object.defineProperty(mockScrollContainer, 'scrollHeight', {
      writable: true,
      value: 2000,
    });

    document.body.appendChild(mockScrollContainer);
  });

  afterEach(() => {
    // DOM 요소가 아직 document에 있으면 제거
    if (mockScrollContainer.parentNode) {
      document.body.removeChild(mockScrollContainer);
    }
    preservation.clear();
  });

  describe('savePosition', () => {
    it('스크롤 위치 저장 성공', () => {
      mockScrollContainer.scrollTop = 500;

      const result = preservation.savePosition();

      expect(result).toBe(true);
      expect(preservation.getSavedPosition()).toBe(500);
      expect(preservation.hasSavedPosition()).toBe(true);
    });

    it('Twitter 컨테이너 없으면 false 반환', () => {
      document.body.removeChild(mockScrollContainer);

      const result = preservation.savePosition();

      expect(result).toBe(false);
      expect(preservation.getSavedPosition()).toBeNull();
      expect(preservation.hasSavedPosition()).toBe(false);
    });

    it('0 위치도 정상 저장', () => {
      mockScrollContainer.scrollTop = 0;

      const result = preservation.savePosition();

      expect(result).toBe(true);
      expect(preservation.getSavedPosition()).toBe(0);
    });

    it('큰 스크롤 위치도 정상 저장', () => {
      mockScrollContainer.scrollTop = 9999;

      const result = preservation.savePosition();

      expect(result).toBe(true);
      expect(preservation.getSavedPosition()).toBe(9999);
    });
  });

  describe('restore', () => {
    it('위치 차이가 threshold 이상이면 복원', async () => {
      // 저장
      mockScrollContainer.scrollTop = 500;
      preservation.savePosition();

      // 위치 변경
      mockScrollContainer.scrollTop = 100;

      // 복원
      const result = await preservation.restore(100);

      expect(result).toBe(true);
      expect(mockScrollContainer.scrollTop).toBe(500);
      expect(preservation.hasSavedPosition()).toBe(false); // clear됨
    });

    it('위치 차이가 threshold 미만이면 복원 스킵', async () => {
      mockScrollContainer.scrollTop = 500;
      preservation.savePosition();

      mockScrollContainer.scrollTop = 550; // 50px 차이

      const result = await preservation.restore(100);

      expect(result).toBe(false);
      expect(mockScrollContainer.scrollTop).toBe(550); // 변경 없음
      expect(preservation.hasSavedPosition()).toBe(false); // clear됨
    });

    it('저장된 위치 없으면 false 반환', async () => {
      const result = await preservation.restore();

      expect(result).toBe(false);
    });

    it('Twitter 컨테이너 없으면 false 반환', async () => {
      mockScrollContainer.scrollTop = 500;
      preservation.savePosition();

      document.body.removeChild(mockScrollContainer);

      const result = await preservation.restore();

      expect(result).toBe(false);
      expect(preservation.hasSavedPosition()).toBe(false);
    });

    it('커스텀 threshold 적용', async () => {
      mockScrollContainer.scrollTop = 500;
      preservation.savePosition();

      mockScrollContainer.scrollTop = 400; // 100px 차이

      // threshold 150px
      const result = await preservation.restore(150);

      expect(result).toBe(false); // 150px 미만이므로 스킵
      expect(mockScrollContainer.scrollTop).toBe(400);
    });

    it('requestAnimationFrame 비동기 처리', async () => {
      mockScrollContainer.scrollTop = 500;
      preservation.savePosition();

      mockScrollContainer.scrollTop = 100;

      const promise = preservation.restore();

      // rAF 전에는 아직 복원되지 않음
      expect(mockScrollContainer.scrollTop).toBe(100);

      // Promise 완료 대기
      await promise;

      // rAF 후 복원 완료
      expect(mockScrollContainer.scrollTop).toBe(500);
    });
  });

  describe('clear', () => {
    it('저장된 정보 초기화', () => {
      mockScrollContainer.scrollTop = 500;
      preservation.savePosition();

      expect(preservation.hasSavedPosition()).toBe(true);

      preservation.clear();

      expect(preservation.hasSavedPosition()).toBe(false);
      expect(preservation.getSavedPosition()).toBeNull();
    });

    it('이미 초기화된 상태에서 clear 호출해도 에러 없음', () => {
      preservation.clear();
      preservation.clear();

      expect(preservation.hasSavedPosition()).toBe(false);
    });
  });

  describe('getSavedPosition', () => {
    it('저장된 위치 반환', () => {
      mockScrollContainer.scrollTop = 300;
      preservation.savePosition();

      expect(preservation.getSavedPosition()).toBe(300);
    });

    it('저장 전에는 null 반환', () => {
      expect(preservation.getSavedPosition()).toBeNull();
    });
  });

  describe('hasSavedPosition', () => {
    it('저장 후에는 true', () => {
      mockScrollContainer.scrollTop = 100;
      preservation.savePosition();

      expect(preservation.hasSavedPosition()).toBe(true);
    });

    it('저장 전에는 false', () => {
      expect(preservation.hasSavedPosition()).toBe(false);
    });

    it('clear 후에는 false', () => {
      mockScrollContainer.scrollTop = 100;
      preservation.savePosition();

      preservation.clear();

      expect(preservation.hasSavedPosition()).toBe(false);
    });

    it('restore 후에는 false (자동 clear)', async () => {
      mockScrollContainer.scrollTop = 500;
      preservation.savePosition();

      mockScrollContainer.scrollTop = 100;

      await preservation.restore();

      expect(preservation.hasSavedPosition()).toBe(false);
    });
  });

  describe('Global Singleton', () => {
    it('getTwitterScrollPreservation은 싱글톤 반환', () => {
      const instance1 = getTwitterScrollPreservation();
      const instance2 = getTwitterScrollPreservation();

      expect(instance1).toBe(instance2);
    });

    it('싱글톤 상태 공유', () => {
      const instance1 = getTwitterScrollPreservation();

      mockScrollContainer.scrollTop = 700;
      instance1.savePosition();

      const instance2 = getTwitterScrollPreservation();

      expect(instance2.getSavedPosition()).toBe(700);
    });

    it('resetTwitterScrollPreservation으로 싱글톤 초기화', () => {
      const instance1 = getTwitterScrollPreservation();

      mockScrollContainer.scrollTop = 800;
      instance1.savePosition();

      resetTwitterScrollPreservation();

      const instance2 = getTwitterScrollPreservation();

      expect(instance2.getSavedPosition()).toBeNull();
      expect(instance1).not.toBe(instance2); // 새 인스턴스
    });
  });
});
