/**
 * Phase 294: TwitterScrollPreservation 단위 테스트
 * @description Twitter 스크롤 위치 저장/복원 로직 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as CoreUtils from '../../../../src/shared/utils/core-utils';
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

      // Phase 302: findTwitterScrollContainer는 body 폴백을 갖기 때문에,
      // "완전 부재" 케이스를 시뮬레이션하려면 유틸을 스텁하여 null을 반환시킨다.
      const spy = vi.spyOn(CoreUtils, 'findTwitterScrollContainer').mockReturnValue(null as any);
      const result = preservation.savePosition();
      spy.mockRestore();

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

      // Phase 302: 폴백(body)으로 인해 실제 환경에서는 컨테이너가 항상 존재할 수 있으므로
      // "부재" 케이스를 강제로 만들기 위해 finder를 스텁한다.
      const spy = vi.spyOn(CoreUtils, 'findTwitterScrollContainer').mockReturnValue(null as any);
      const result = await preservation.restore();
      spy.mockRestore();

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

    it('새로운 컨테이너 인스턴스에는 복원을 시도하지 않는다', async () => {
      mockScrollContainer.scrollTop = 640;
      preservation.savePosition();

      // 기존 컨테이너 제거 (탭 이동/페이지 전환 시나리오)
      if (mockScrollContainer.parentNode) {
        document.body.removeChild(mockScrollContainer);
      }

      // 동일 selector를 가진 새로운 컨테이너가 생성된 상황을 시뮬레이션
      const replacementContainer = document.createElement('div');
      replacementContainer.setAttribute('data-testid', 'primaryColumn');
      Object.defineProperty(replacementContainer, 'scrollTop', {
        writable: true,
        value: 120,
      });
      Object.defineProperty(replacementContainer, 'scrollHeight', {
        writable: true,
        value: 2200,
      });
      document.body.appendChild(replacementContainer);

      const result = await preservation.restore(100);

      expect(result).toBe(false);
      expect(replacementContainer.scrollTop).toBe(120);

      document.body.removeChild(replacementContainer);
    });

    it('Phase 300.1: delay 파라미터로 복원 지연 시간 제어', async () => {
      // Timer mock 활성화
      vi.useFakeTimers();

      mockScrollContainer.scrollTop = 500;
      preservation.savePosition();
      mockScrollContainer.scrollTop = 100;

      // 커스텀 delay 300ms로 복원 시작
      const promise = preservation.restore(100, 300);

      // 300ms 대기 전에는 복원되지 않음
      expect(mockScrollContainer.scrollTop).toBe(100);

      // 300ms 경과
      vi.advanceTimersByTime(300);

      // rAF 실행
      await vi.runAllTimersAsync();
      await promise;

      // 복원 완료
      expect(mockScrollContainer.scrollTop).toBe(500);

      vi.useRealTimers();
    });

    it('Phase 300.1: 기본 delay 150ms 적용 확인', async () => {
      // Timer mock 활성화
      vi.useFakeTimers();

      mockScrollContainer.scrollTop = 500;
      preservation.savePosition();
      mockScrollContainer.scrollTop = 100;

      // delay 파라미터 생략 (기본값 150ms)
      const promise = preservation.restore();

      // 100ms 대기 후에는 아직 복원되지 않음
      vi.advanceTimersByTime(100);
      expect(mockScrollContainer.scrollTop).toBe(100);

      // 150ms 경과
      vi.advanceTimersByTime(50);

      // rAF 실행
      await vi.runAllTimersAsync();
      await promise;

      // 복원 완료
      expect(mockScrollContainer.scrollTop).toBe(500);

      vi.useRealTimers();
    });
  });

  describe('Fallback selector behavior', () => {
    it("works when primaryColumn is absent but main[role='main'] exists", async () => {
      // Clean up primaryColumn container if present
      if (mockScrollContainer.parentNode) {
        document.body.removeChild(mockScrollContainer);
      }

      // Create fallback container: main[role="main"]
      const main = document.createElement('main');
      main.setAttribute('role', 'main');
      Object.defineProperty(main, 'scrollTop', {
        writable: true,
        value: 0,
      });
      Object.defineProperty(main, 'scrollHeight', {
        writable: true,
        value: 3000,
      });
      document.body.appendChild(main);

      // Save/restore using fallback
      preservation = new TwitterScrollPreservation();
      main.scrollTop = 420;
      const saved = preservation.savePosition();
      expect(saved).toBe(true);
      expect(preservation.getSavedPosition()).toBe(420);

      main.scrollTop = 50;
      const restored = await preservation.restore(100);
      expect(restored).toBe(true);
      expect(main.scrollTop).toBe(420);

      // Cleanup
      document.body.removeChild(main);
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
