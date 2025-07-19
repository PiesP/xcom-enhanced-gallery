/**
 * @fileoverview 통합 생명주기 관리 인터페이스
 * @version 1.0.0
 *
 * 모든 클래스의 정리 패턴을 일관성 있게 만들기 위한 인터페이스들
 */

/**
 * 동기적 정리 인터페이스
 */
export interface Cleanupable {
  /**
   * 동기적 정리 (메모리, 타이머, 이벤트 리스너 등)
   */
  cleanup(): void;
}

/**
 * 비동기적 정리 인터페이스
 */
export interface Disposable {
  /**
   * 비동기적 정리 (파일, 네트워크, 스트림 등)
   */
  dispose(): Promise<void>;
}

/**
 * 완전한 소멸 인터페이스
 */
export interface Destroyable {
  /**
   * 완전한 소멸 (상태 초기화 포함)
   */
  destroy(): void;
}

/**
 * 통합 생명주기 인터페이스
 */
export interface Lifecycle extends Cleanupable, Disposable, Destroyable {
  /**
   * 리소스 상태 확인
   */
  isActive(): boolean;
}

/**
 * 생명주기 인터페이스 (cleanup + destroy)
 */
export interface SyncLifecycle extends Cleanupable, Destroyable {
  isActive(): boolean;
}

/**
 * 비동기 생명주기 인터페이스 (dispose + destroy)
 */
export interface AsyncLifecycle extends Disposable, Destroyable {
  isActive(): boolean;
}

/**
 * 생명주기 상태
 */
export type LifecycleState = 'idle' | 'active' | 'disposing' | 'destroyed';

/**
 * 생명주기 관리 추상 클래스
 */
export abstract class LifecycleManager implements SyncLifecycle {
  protected state: LifecycleState = 'idle';

  public isActive(): boolean {
    return this.state === 'active';
  }

  public getState(): LifecycleState {
    return this.state;
  }

  abstract cleanup(): void;
  abstract destroy(): void;

  protected setState(newState: LifecycleState): void {
    this.state = newState;
  }
}
