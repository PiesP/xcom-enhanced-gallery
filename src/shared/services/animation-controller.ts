/**
 * @fileoverview 애니메이션 제어 서비스
 * @description 사용자 설정에 따라 애니메이션을 활성화/비활성화하는 서비스
 */

import { logger } from '@shared/logging';
import { getService } from '@shared/services/service-manager';
import { SERVICE_KEYS } from '@/constants';
import type { SettingsService } from '@/features/settings/services/settings-service';

/**
 * 애니메이션 제어 서비스
 *
 * 기능:
 * - 설정에 따른 애니메이션 활성화/비활성화
 * - CSS 클래스 기반 애니메이션 제어
 * - 접근성 고려 (prefers-reduced-motion 감지)
 */
export class AnimationController {
  private readonly settingsService: SettingsService | null;
  private initialized = false;

  /** 애니메이션 비활성화 CSS 클래스 */
  private static readonly DISABLED_CLASS = 'xeg-no-animations';

  constructor() {
    try {
      this.settingsService = getService<SettingsService>(SERVICE_KEYS.SETTINGS_MANAGER);
      this.initialize();
    } catch (error) {
      logger.warn('[AnimationController] 초기화 실패, 설정 서비스 없음:', error);
      // 설정 서비스가 없어도 기본 동작은 가능하도록
      this.settingsService = null;
    }
  }

  /**
   * 초기화
   */
  private initialize(): void {
    try {
      if (!this.settingsService) {
        logger.warn('[AnimationController] 설정 서비스 없이 기본 동작으로 초기화');
        this.applyAnimationState(true); // 기본값: 애니메이션 활성화
        return;
      }

      // 현재 설정에 따라 애니메이션 상태 적용
      const enabled: boolean = this.settingsService.get('gallery.animations') ?? true;
      this.applyAnimationState(enabled);

      // 시스템 설정 감지 (prefers-reduced-motion)
      this.detectReducedMotionPreference();

      this.initialized = true;
      logger.debug('AnimationController 초기화 완료');
    } catch (error) {
      logger.error('AnimationController 초기화 중 오류:', error);
    }
  }

  /**
   * 애니메이션 활성화/비활성화 설정
   *
   * @param enabled 애니메이션 활성화 여부
   */
  async setEnabled(enabled: boolean): Promise<void> {
    try {
      // 설정 저장 (서비스가 있을 때만)
      if (this.settingsService) {
        await this.settingsService.set('gallery.animations', enabled);
      }

      // 즉시 상태 적용
      this.applyAnimationState(enabled);

      logger.debug(`애니메이션 ${enabled ? '활성화' : '비활성화'} 완료`);
    } catch (error) {
      logger.error('애니메이션 설정 변경 실패:', error);
      throw error;
    }
  }

  /**
   * 현재 애니메이션 활성화 상태 조회
   *
   * @returns 애니메이션 활성화 여부
   */
  isEnabled(): boolean {
    try {
      if (!this.settingsService) {
        logger.debug('설정 서비스 없음, 기본값 반환: true');
        return true;
      }
      return this.settingsService.get('gallery.animations') ?? true;
    } catch (error) {
      logger.warn('애니메이션 상태 조회 실패, 기본값 사용:', error);
      return true;
    }
  }

  /**
   * 애니메이션 상태를 DOM에 적용
   *
   * @param enabled 애니메이션 활성화 여부
   */
  private applyAnimationState(enabled: boolean): void {
    try {
      if (enabled) {
        document.body.classList.remove(AnimationController.DISABLED_CLASS);
        document.documentElement.classList.remove(AnimationController.DISABLED_CLASS);
      } else {
        document.body.classList.add(AnimationController.DISABLED_CLASS);
        document.documentElement.classList.add(AnimationController.DISABLED_CLASS);
      }

      logger.debug(`애니메이션 CSS 클래스 ${enabled ? '제거' : '추가'} 완료`);
    } catch (error) {
      logger.error('애니메이션 DOM 적용 실패:', error);
    }
  }

  /**
   * 시스템의 reduced motion 설정 감지
   */
  private detectReducedMotionPreference(): void {
    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        const handleChange = (e: MediaQueryListEvent) => {
          if (e.matches) {
            // 사용자가 모션 감소를 선호하는 경우 자동으로 애니메이션 비활성화
            logger.info('시스템에서 reduced motion 감지, 애니메이션 자동 비활성화');
            void this.setEnabled(false);
          }
        };

        mediaQuery.addEventListener('change', handleChange);

        // 초기 상태 확인
        if (mediaQuery.matches) {
          logger.info('시스템 reduced motion 설정 감지됨');
          void this.setEnabled(false);
        }
      }
    } catch (error) {
      logger.warn('Reduced motion 감지 설정 실패:', error);
    }
  }

  /**
   * 초기화 상태 확인
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * 전역 AnimationController 인스턴스
 */
export const animationController = new AnimationController();
