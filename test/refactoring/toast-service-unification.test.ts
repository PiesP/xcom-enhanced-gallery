/**
 * @fileoverview Toast Service 통합 완료 테스트
 * @description ToastController 제거 후 ToastService 단독 동작 검증 (TDD GREEN Phase)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Toast Service 통합 완료 테스트 (Phase 1 GREEN)', () => {
  let toastService: any;
  let ToastService: any;

  beforeEach(async () => {
    // Dynamic import를 사용하여 ToastService를 가져옴
    const module = await import('@shared/services');
    ToastService = module.ToastService;
    toastService = new ToastService();
  });

  afterEach(async () => {
    // 정리
    toastService.clear();
  });

  describe('기본 토스트 기능 검증', () => {
    it('ToastService가 토스트 표시 기능을 제공해야 한다', () => {
      const toastId = toastService.show({
        title: '테스트 제목',
        message: '테스트 메시지',
        type: 'info',
      });

      expect(toastId).toBeDefined();
      expect(typeof toastId).toBe('string');
    });

    it('ToastService가 success 토스트를 제공해야 한다', () => {
      const serviceId = toastService.success('성공', '작업 완료');
      expect(serviceId).toBeDefined();
    });

    it('ToastService가 error 토스트를 제공해야 한다', () => {
      const serviceId = toastService.error('오류', '문제 발생');
      expect(serviceId).toBeDefined();
    });

    it('ToastService가 warning 토스트를 제공해야 한다', () => {
      const serviceId = toastService.warning('경고', '주의 필요');
      expect(serviceId).toBeDefined();
    });

    it('ToastService가 info 토스트를 제공해야 한다', () => {
      const serviceId = toastService.info('정보', '알림');
      expect(serviceId).toBeDefined();
    });

    it('ToastService가 토스트 제거 기능을 제공해야 한다', () => {
      const serviceId = toastService.show({
        title: '제거 테스트',
        message: '제거될 토스트',
      });

      expect(toastService.dismiss(serviceId)).toBe(true);
    });

    it('ToastService가 모든 토스트 정리 기능을 제공해야 한다', () => {
      // 여러 토스트 추가
      toastService.info('정보1', '메시지1');
      toastService.info('정보2', '메시지2');
      toastService.info('정보3', '메시지3');

      // 정리 전 확인
      expect(toastService.getActiveToasts().length).toBeGreaterThan(0);

      // 정리
      toastService.clear();

      // 정리 후 확인
      expect(toastService.getActiveToasts()).toHaveLength(0);
    });
  });

  describe('통합 완료 후 서비스 검증', () => {
    it('ToastService는 BaseService 없이도 완전히 동작해야 한다', () => {
      // 현재 ToastService는 BaseService를 상속하지 않음 (Phase 4 간소화)
      expect(toastService).toBeDefined();
      expect(typeof toastService.show).toBe('function');
      expect(typeof toastService.clear).toBe('function');
      expect(typeof toastService.dismiss).toBe('function');
    });

    it('ToastService는 모든 토스트 타입을 지원해야 한다', () => {
      const types: Array<'success' | 'error' | 'warning' | 'info'> = [
        'success',
        'error',
        'warning',
        'info',
      ];

      types.forEach(type => {
        const id = toastService[type]('제목', '메시지');
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
      });
    });

    it('ToastService는 커스텀 duration을 지원해야 한다', () => {
      const id = toastService.show({
        title: '커스텀 지속시간',
        message: '5초 표시',
        duration: 5000,
      });

      expect(id).toBeDefined();

      // 실제 토스트 확인
      const toast = toastService.getToast(id);
      expect(toast?.duration).toBe(5000);
    });

    it('ToastService는 활성 토스트 조회를 지원해야 한다', () => {
      const id1 = toastService.info('토스트1', '메시지1');
      const id2 = toastService.info('토스트2', '메시지2');

      const activeToasts = toastService.getActiveToasts();
      expect(activeToasts).toHaveLength(2);

      const ids = activeToasts.map((toast: any) => toast.id);
      expect(ids).toContain(id1);
      expect(ids).toContain(id2);
    });
  });

  describe('호환성 테스트', () => {
    it('기존 ToastController API와 호환되는 사용법이 동작해야 한다', () => {
      // ToastController의 사용법
      const options = {
        title: '호환성 테스트',
        message: '기존 코드 호환성',
        type: 'success',
        duration: 3000,
      };

      // ToastService에서 동일하게 동작해야 함
      const id = toastService.show(options);
      expect(id).toBeDefined();

      const toast = toastService.getToast(id);
      expect(toast?.title).toBe(options.title);
      expect(toast?.message).toBe(options.message);
      expect(toast?.type).toBe(options.type);
      expect(toast?.duration).toBe(options.duration);
    });

    it('편의 메서드들이 올바른 타입으로 토스트를 생성해야 한다', () => {
      const successId = toastService.success('성공', '완료됨');
      const errorId = toastService.error('오류', '실패함');
      const warningId = toastService.warning('경고', '주의');
      const infoId = toastService.info('정보', '알림');

      expect(toastService.getToast(successId)?.type).toBe('success');
      expect(toastService.getToast(errorId)?.type).toBe('error');
      expect(toastService.getToast(warningId)?.type).toBe('warning');
      expect(toastService.getToast(infoId)?.type).toBe('info');
    });
  });
});
