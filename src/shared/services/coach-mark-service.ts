/**
 * Coach Mark Service
 * 최초 사용자를 위한 기능 안내 시스템
 */

import { logger } from '@shared/logging';
import { COACH_MARK_CONSTANTS } from '../constants/magic-numbers';

export interface CoachMarkConfig {
  /** 고유 식별자 */
  id: string;
  /** 대상 요소 선택자 */
  target: string;
  /** 안내 제목 */
  title: string;
  /** 안내 텍스트 */
  content: string;
  /** 표시 위치 */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** 자동 닫기 시간 (ms, 0이면 수동 닫기만) */
  autoClose?: number;
  /** 표시 조건 함수 */
  shouldShow?: () => boolean;
}

class CoachMarkService {
  private static instance: CoachMarkService;
  private shownMarks = new Set<string>();
  private readonly storageKey = 'xeg-coach-marks-shown';

  private constructor() {
    this.loadShownMarks();
  }

  public static getInstance(): CoachMarkService {
    if (!CoachMarkService.instance) {
      CoachMarkService.instance = new CoachMarkService();
    }
    return CoachMarkService.instance;
  }

  /**
   * localStorage에서 표시된 코치 마크 목록 로드
   */
  private loadShownMarks(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const marks = JSON.parse(stored) as string[];
        this.shownMarks = new Set(marks);
      }
    } catch (error) {
      logger.warn('코치 마크 설정 로드 실패:', error);
    }
  }

  /**
   * localStorage에 표시된 코치 마크 목록 저장
   */
  private saveShownMarks(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify([...this.shownMarks]));
    } catch (error) {
      logger.warn('코치 마크 설정 저장 실패:', error);
    }
  }

  /**
   * 코치 마크 표시 여부 확인
   */
  public shouldShowCoachMark(id: string): boolean {
    return !this.shownMarks.has(id);
  }

  /**
   * 코치 마크를 표시됨으로 표시
   */
  public markAsShown(id: string): void {
    this.shownMarks.add(id);
    this.saveShownMarks();
    logger.debug(`코치 마크 표시 완료: ${id}`);
  }

  /**
   * 특정 코치 마크 리셋 (다시 표시하기 위해)
   */
  public resetCoachMark(id: string): void {
    this.shownMarks.delete(id);
    this.saveShownMarks();
    logger.debug(`코치 마크 리셋: ${id}`);
  }

  /**
   * 모든 코치 마크 리셋
   */
  public resetAllCoachMarks(): void {
    this.shownMarks.clear();
    this.saveShownMarks();
    logger.debug('모든 코치 마크 리셋');
  }

  /**
   * 핏 모드 코치 마크 표시 (갤러리 최초 실행 시)
   */
  public async showFitModeGuide(): Promise<void> {
    const coachMarkId = 'fit-mode-guide';

    if (!this.shouldShowCoachMark(coachMarkId)) {
      return;
    }

    // 갤러리가 열릴 때까지 대기
    const waitForGallery = () => {
      return new Promise<void>(resolve => {
        const checkGallery = () => {
          const galleryContainer = document.querySelector(
            '[data-gallery-element="toolbar-content"]'
          );
          if (galleryContainer) {
            resolve();
          } else {
            setTimeout(checkGallery, COACH_MARK_CONSTANTS.PROGRESS_COMPLETE);
          }
        };
        checkGallery();
      });
    };

    try {
      await waitForGallery();

      // 3초 후에 코치 마크 표시
      setTimeout(() => {
        this.showCoachMarkFor('fit-original', {
          title: '이미지 핏 모드',
          content: '이미지를 원본 크기, 가로 맞춤, 세로 맞춤, 창에 맞춤으로 볼 수 있습니다.',
          autoClose: 5000,
        });
      }, COACH_MARK_CONSTANTS.AUTO_HIDE_DELAY);

      this.markAsShown(coachMarkId);
    } catch (error) {
      logger.error('핏 모드 가이드 표시 실패:', error);
    }
  }

  /**
   * 특정 요소에 코치 마크 표시
   */
  private showCoachMarkFor(
    targetSelector: string,
    config: {
      title: string;
      content: string;
      autoClose?: number;
    }
  ): void {
    const target = document.querySelector(
      `[data-gallery-element="${targetSelector}"]`
    ) as HTMLElement;
    if (!target) {
      logger.warn(`코치 마크 대상을 찾을 수 없음: ${targetSelector}`);
      return;
    }

    // 코치 마크 요소 생성
    const coachMark = document.createElement('div');
    coachMark.className = 'xeg-coach-mark';
    coachMark.innerHTML = `
      <div class="xeg-coach-mark__content">
        <h4 class="xeg-coach-mark__title">${config.title}</h4>
        <p class="xeg-coach-mark__text">${config.content}</p>
        <button class="xeg-coach-mark__close" aria-label="안내 닫기">✕</button>
      </div>
      <div class="xeg-coach-mark__arrow"></div>
    `;

    // 위치 계산 및 설정
    this.positionCoachMark(coachMark, target);

    // 이벤트 리스너
    const closeBtn = coachMark.querySelector('.xeg-coach-mark__close');
    closeBtn?.addEventListener('click', () => {
      this.hideCoachMark(coachMark);
    });

    // DOM에 추가
    document.body.appendChild(coachMark);

    // 애니메이션으로 표시
    setTimeout(() => {
      coachMark.classList.add('xeg-coach-mark--visible');
    }, COACH_MARK_CONSTANTS.PROGRESS_COMPLETE);

    // 자동 닫기
    if (config.autoClose && config.autoClose > 0) {
      setTimeout(() => {
        this.hideCoachMark(coachMark);
      }, config.autoClose);
    }

    logger.debug(`코치 마크 표시: ${targetSelector}`);
  }

  /**
   * 코치 마크 위치 설정
   */
  private positionCoachMark(coachMark: HTMLElement, target: HTMLElement): void {
    const targetRect = target.getBoundingClientRect();

    // 화면 상단에 표시 (툴바 아래)
    coachMark.style.position = 'fixed';
    coachMark.style.top = `${targetRect.bottom + COACH_MARK_CONSTANTS.TOOLTIP_OFFSET}px`;
    coachMark.style.left = `${targetRect.left + targetRect.width / 2}px`;
    coachMark.style.transform = 'translateX(-50%)';
    coachMark.style.zIndex = '10001';
  }

  /**
   * 코치 마크 숨기기
   */
  private hideCoachMark(coachMark: HTMLElement): void {
    coachMark.classList.remove('xeg-coach-mark--visible');
    coachMark.classList.add('xeg-coach-mark--hiding');

    setTimeout(() => {
      if (coachMark.parentNode) {
        coachMark.parentNode.removeChild(coachMark);
      }
    }, COACH_MARK_CONSTANTS.FADE_DELAY);
  }

  /**
   * CSS 스타일 주입
   */
  public injectStyles(): void {
    const styleId = 'xeg-coach-mark-styles';
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .xeg-coach-mark {
        position: fixed;
        max-width: 300px;
        background: var(--xeg-color-primary, #1d9bf0);
        color: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        opacity: 0;
        transform: scale(0.9) translateY(-8px) translateX(-50%);
        transition: all 300ms ease-out;
        pointer-events: auto;
        z-index: 10001;
      }

      .xeg-coach-mark--visible {
        opacity: 1;
        transform: scale(1) translateY(0) translateX(-50%);
      }

      .xeg-coach-mark--hiding {
        opacity: 0;
        transform: scale(0.9) translateY(-8px) translateX(-50%);
      }

      .xeg-coach-mark__content {
        padding: 16px;
        position: relative;
      }

      .xeg-coach-mark__title {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        line-height: 1.3;
      }

      .xeg-coach-mark__text {
        margin: 0;
        font-size: 14px;
        line-height: 1.4;
        opacity: 0.9;
      }

      .xeg-coach-mark__close {
        position: absolute;
        top: 12px;
        right: 12px;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.8);
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 200ms ease;
      }

      .xeg-coach-mark__close:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        transform: scale(1.1);
      }

      .xeg-coach-mark__arrow {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border: 8px solid transparent;
        border-bottom-color: var(--xeg-color-primary, #1d9bf0);
      }

      @media (prefers-reduced-motion: reduce) {
        .xeg-coach-mark {
          transition: opacity 200ms ease;
          transform: translateX(-50%) !important;
        }
      }

      @media (max-width: 768px) {
        .xeg-coach-mark {
          max-width: 280px;
          margin: 0 16px;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

// 싱글톤 인스턴스 export
export const coachMarkService = CoachMarkService.getInstance();
