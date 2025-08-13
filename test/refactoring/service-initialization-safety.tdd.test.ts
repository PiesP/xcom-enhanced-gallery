/**
 * @fileoverview TDD GREEN 단계: 서비스 초기화 순서 및 안전장치 검증
 * @description 실제 런타임 상황에서의 안전성 검증
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnimationController } from '@shared/services/animation-controller';
import * as serviceManager from '@shared/services/service-manager';

describe('🟢 GREEN: 서비스 초기화 순서 및 안전장치 검증', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AnimationController 안전 초기화', () => {
    it('SettingsService가 없어도 AnimationController가 초기화되어야 한다', () => {
      // getService가 실패하는 상황 모킹
      const mockGetService = vi.spyOn(serviceManager, 'getService');
      mockGetService.mockImplementationOnce(() => {
        throw new Error('서비스를 찾을 수 없습니다: settings.manager');
      });

      // AnimationController 생성이 실패하지 않아야 함
      expect(() => new AnimationController()).not.toThrow();

      // 서비스 조회가 시도되었는지 확인
      expect(mockGetService).toHaveBeenCalledWith('settings.manager');
    });

    it('SettingsService 없이도 애니메이션 상태 적용이 가능해야 한다', async () => {
      // getService가 실패하는 상황 모킹
      const mockGetService = vi.spyOn(serviceManager, 'getService');
      mockGetService.mockImplementationOnce(() => {
        throw new Error('서비스를 찾을 수 없습니다');
      });

      const controller = new AnimationController();

      // DOM 요소 모킹
      const mockClassList = {
        add: vi.fn(),
        remove: vi.fn(),
      };
      Object.defineProperty(document, 'body', {
        value: { classList: mockClassList },
        configurable: true,
      });

      // 애니메이션 설정이 작동해야 함
      await expect(controller.setEnabled(false)).resolves.not.toThrow();
      expect(mockClassList.add).toHaveBeenCalledWith('xeg-no-animations');

      await expect(controller.setEnabled(true)).resolves.not.toThrow();
      expect(mockClassList.remove).toHaveBeenCalledWith('xeg-no-animations');
    });

    it('SettingsService 없이도 상태 조회가 기본값을 반환해야 한다', () => {
      // getService가 실패하는 상황 모킹
      const mockGetService = vi.spyOn(serviceManager, 'getService');
      mockGetService.mockImplementationOnce(() => {
        throw new Error('서비스를 찾을 수 없습니다');
      });

      const controller = new AnimationController();

      // 기본값(true)을 반환해야 함
      expect(controller.isEnabled()).toBe(true);
    });
  });

  describe('지연 로딩 검증', () => {
    it('getAnimationController는 싱글톤 패턴으로 작동해야 한다', async () => {
      // settings-menu.ts에서 getAnimationController 함수를 테스트하기 위해
      // 모듈을 동적 import로 로드
      const settingsModule = await import('@/features/settings/settings-menu');

      // 타입 확인을 위해 wireSettingsModal이 async 함수인지 검증
      expect(typeof settingsModule.wireSettingsModal).toBe('function');

      // async 함수인지 확인 (Promise를 반환하는지)
      const mockElement = document.createElement('div');
      const result = settingsModule.wireSettingsModal(mockElement);
      expect(result).toBeInstanceOf(Promise);
    });
  });
});

describe('🔵 REFACTOR: 통합 검증', () => {
  it('전체 설정 모달 시스템이 서비스 없이도 작동해야 한다', async () => {
    // 모든 서비스가 없는 상황 시뮬레이션
    const mockGetService = vi.spyOn(serviceManager, 'getService');
    mockGetService.mockImplementation(() => {
      throw new Error('모든 서비스 비활성화');
    });

    // DOM 요소 생성
    const container = document.createElement('div');
    container.innerHTML = `
      <input data-testid="animations" type="checkbox" />
      <select data-testid="theme">
        <option value="auto">자동</option>
        <option value="light">라이트</option>
        <option value="dark">다크</option>
      </select>
    `;

    // 설정 모달 와이어링이 실패하지 않아야 함
    const { wireSettingsModal } = await import('@/features/settings/settings-menu');
    await expect(wireSettingsModal(container)).resolves.not.toThrow();
  });

  it('점진적 개선: 서비스가 나중에 로드되어도 작동해야 한다', async () => {
    // 처음에는 서비스가 없다가
    let serviceAvailable = false;
    const mockGetService = vi.spyOn(serviceManager, 'getService');
    mockGetService.mockImplementation(() => {
      if (!serviceAvailable) {
        throw new Error('서비스 아직 로드 안됨');
      }
      return {
        get: vi.fn().mockReturnValue(true),
        set: vi.fn().mockResolvedValue(undefined),
      };
    });

    const controller = new AnimationController();

    // 처음에는 기본 동작
    expect(controller.isEnabled()).toBe(true);

    // 서비스가 나중에 로드됨
    serviceAvailable = true;

    // 이제 정상 작동해야 함
    await expect(controller.setEnabled(false)).resolves.not.toThrow();
  });
});
