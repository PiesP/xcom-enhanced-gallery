/**
 * @fileoverview Unified Body Scroll Manager
 * Epic: SCROLL-ISOLATION-CONSOLIDATION Phase 3
 * TDD Phase: GREEN (구현)
 *
 * 목표:
 * - 갤러리/Settings Modal 등 여러 컨텍스트의 body scroll lock을 통합 관리
 * - 우선순위 시스템으로 동시 사용 시 충돌 방지
 * - 원본 overflow 상태 안전하게 복원
 */

/**
 * Body Scroll Lock 컨텍스트
 */
interface BodyScrollLockContext {
  /** 고유 식별자 (예: 'gallery', 'settings', 'tooltip') */
  id: string;
  /** 우선순위 (높을수록 우선, 기본값: 0) */
  priority: number;
  /** Lock 시점의 타임스탬프 */
  lockedAt: number;
}

/**
 * Unified Body Scroll Manager
 *
 * 특징:
 * - 우선순위 기반 lock 관리 (갤러리: 5, Settings: 10)
 * - 중복 lock 자동 병합 (같은 id로 여러 번 lock 시 우선순위 업데이트)
 * - 마지막 lock 해제 시 원본 overflow 자동 복원
 * - 동시 여러 컨텍스트 안전 관리
 *
 * 사용 예시:
 * ```typescript
 * // Settings Modal (우선순위: 10)
 * bodyScrollManager.lock('settings', 10);
 * // ... 사용자 작업
 * bodyScrollManager.unlock('settings');
 *
 * // 갤러리 (우선순위: 5)
 * bodyScrollManager.lock('gallery', 5);
 * // ... 갤러리 표시
 * bodyScrollManager.unlock('gallery');
 * ```
 */
export class BodyScrollManager {
  private readonly locks = new Map<string, BodyScrollLockContext>();
  private originalOverflow: string = '';
  private isOriginalSaved: boolean = false;

  /**
   * Body scroll을 잠금
   *
   * @param id - 고유 식별자
   * @param priority - 우선순위 (기본값: 0, 높을수록 우선)
   */
  lock(id: string, priority: number = 0): void {
    // 첫 lock 시 원본 overflow 저장
    if (!this.isOriginalSaved) {
      this.originalOverflow = typeof document !== 'undefined' ? document.body.style.overflow : '';
      this.isOriginalSaved = true;
    }

    // Lock 등록 또는 업데이트
    this.locks.set(id, {
      id,
      priority,
      lockedAt: Date.now(),
    });

    // body overflow를 hidden으로 설정
    this.applyBodyOverflow();
  }

  /**
   * Body scroll 잠금 해제
   *
   * @param id - 고유 식별자
   */
  unlock(id: string): void {
    // Lock 제거
    this.locks.delete(id);

    // 남은 lock이 없으면 원본 overflow 복원
    if (this.locks.size === 0) {
      this.restoreOriginalOverflow();
    } else {
      // 남은 lock이 있으면 body overflow 유지
      this.applyBodyOverflow();
    }
  }

  /**
   * 특정 id 또는 전역 lock 상태 확인
   *
   * @param id - 고유 식별자 (생략 시 전역 lock 상태 확인)
   * @returns lock 여부
   */
  isLocked(id?: string): boolean {
    if (id) {
      return this.locks.has(id);
    }
    return this.locks.size > 0;
  }

  /**
   * 현재 활성화된 모든 lock id 조회
   *
   * @returns 활성화된 lock id 배열
   */
  getActiveLocks(): string[] {
    return Array.from(this.locks.keys());
  }

  /**
   * 모든 lock 강제 해제 및 원본 상태 복원
   * (테스트/정리 용도)
   */
  clear(): void {
    this.locks.clear();
    this.restoreOriginalOverflow();
  }

  /**
   * body.overflow를 'hidden'으로 설정
   * (최고 우선순위 lock이 활성화된 경우)
   */
  private applyBodyOverflow(): void {
    if (typeof document !== 'undefined' && this.locks.size > 0) {
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * 원본 overflow 상태 복원
   */
  private restoreOriginalOverflow(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = this.originalOverflow;
    }
    this.isOriginalSaved = false;
  }
}

/**
 * 싱글톤 Body Scroll Manager 인스턴스
 * (프로젝트 전역에서 단일 인스턴스 사용)
 */
export const bodyScrollManager = new BodyScrollManager();
