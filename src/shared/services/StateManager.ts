/**
 * @fileoverview StateManager - 통합 상태 관리 시스템
 * @description Signal과 React 상태를 통합 관리하는 싱글톤 서비스
 * @version 2.0.0 - Phase 3 의존성 주입 및 안정성 개선
 */

import { createScopedLogger } from '../logging/logger';
import type { Signal } from '@shared/types/signals';
import type { IStateManager, ILogger } from './interfaces';

// StateManager 전용 로거
const logger = createScopedLogger('StateManager');

interface GalleryState {
  isOpen: boolean;
  currentMediaIndex: number;
  mediaCount?: number;
  currentUrl?: string | undefined;
}

type StateKey = 'gallery';
type StateValue<T extends StateKey> = T extends 'gallery' ? GalleryState : unknown;
type StateSubscriber<T> = (newValue: T, oldValue?: T) => void;

interface PerformanceMetrics {
  syncCount: number;
  lastSyncTime: number;
  averageSyncDuration: number;
  errorCount: number;
}

interface StateHistory {
  timestamp: number;
  action: string;
  state: object;
  path?: string;
}

interface DebugInfo {
  isDebugMode: boolean;
  lastError?: Error;
  syncConflicts: number;
  lastSyncConflict?: number;
}

/**
 * 통합 상태 관리 시스템
 * Signal과 React 상태를 동기화하고 통합 관리
 * Phase 3: 의존성 주입 패턴 및 안정성 개선
 */
export class StateManager implements IStateManager {
  private static instance: StateManager;
  private readonly subscribers = new Map<StateKey, Set<StateSubscriber<unknown>>>();
  private readonly injectedSignals: Map<StateKey, Record<string, Signal<unknown>>> = new Map();
  private readonly signalUnsubscribers: Map<StateKey, (() => void)[]> = new Map();

  private performanceMetrics: PerformanceMetrics = {
    syncCount: 0,
    lastSyncTime: 0,
    averageSyncDuration: 0,
    errorCount: 0,
  };
  private stateHistory: StateHistory[] = [];
  private debugInfo: DebugInfo = {
    isDebugMode: false,
    syncConflicts: 0,
  };

  private constructor(private readonly loggerService: ILogger = logger) {
    // Phase 3: 생성자에서는 초기화하지 않고 지연 초기화 사용
    this.safeInitialize();
  }

  static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  /**
   * Phase 3: 안전한 지연 초기화
   */
  private safeInitialize(): void {
    try {
      // 자동 감지 시도 (fallback)
      this.attemptAutoDiscovery();
    } catch (error) {
      this.debugInfo.lastError = error as Error;
      this.performanceMetrics.errorCount++;
      logger.warn('자동 signals 감지 실패, 수동 주입 대기 중:', error);
    }
  }

  /**
   * Phase 3: Signals 의존성 주입 메서드
   */
  public injectSignals<T extends StateKey>(key: T, signals: Record<string, Signal<unknown>>): void {
    try {
      // 기존 구독 정리
      this.cleanupSignalSubscriptions(key);

      // 새 signals 주입
      this.injectedSignals.set(key, signals);

      // 구독 설정
      this.setupSignalWatcher(key, signals);

      this.addToHistory('INJECT_SIGNALS', { key, signalCount: Object.keys(signals).length });
      logger.debug(`[StateManager] Signals 주입 완료: ${key}`);
    } catch (error) {
      this.debugInfo.lastError = error as Error;
      this.performanceMetrics.errorCount++;
      logger.error('Signals 주입 실패:', error);
    }
  }

  /**
   * Phase 3: 자동 signals 감지 시도
   */
  private attemptAutoDiscovery(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const windowWithGallery = window as unknown as {
      gallery?: { signals?: Record<string, Signal<unknown>> };
    };

    if (windowWithGallery.gallery?.signals) {
      const gallerySignals = windowWithGallery.gallery.signals as unknown as Record<
        string,
        Signal<unknown>
      >;
      this.injectSignals('gallery', gallerySignals);
      logger.debug('[StateManager] 자동 gallery signals 감지 및 주입 완료');
    }
  }

  /**
   * Phase 3: 수동 재연결 메서드
   */
  public reconnect(): void {
    try {
      this.attemptAutoDiscovery();
      this.addToHistory('RECONNECT', { timestamp: Date.now() });
    } catch (error) {
      this.debugInfo.lastError = error as Error;
      this.performanceMetrics.errorCount++;
      logger.error('재연결 실패:', error);
    }
  }

  /**
   * Phase 3: Signal 구독 정리 메서드
   */
  private cleanupSignalSubscriptions(key: StateKey): void {
    const unsubscribers = this.signalUnsubscribers.get(key);
    if (unsubscribers) {
      unsubscribers.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          logger.warn('구독 해제 실패:', error);
        }
      });
      this.signalUnsubscribers.delete(key);
    }
  }

  /**
   * Phase 3: 개선된 Signal 감시자 설정 (중복 방지)
   */
  private setupSignalWatcher(key: StateKey, signals: Record<string, Signal<unknown>>): void {
    // 기존 구독 정리
    this.cleanupSignalSubscriptions(key);

    const unsubscribers: (() => void)[] = [];

    const watchSignal = (signal: Signal<unknown>) => {
      if (signal.subscribe) {
        const unsubscribe = signal.subscribe(() => {
          const state = this.getStateFromSignals(key, signals);
          this.notifySubscribers(key, state as StateValue<typeof key>);
        });
        unsubscribers.push(unsubscribe);
      }
    };

    Object.keys(signals).forEach(signalKey => {
      if (signals[signalKey]?.subscribe) {
        watchSignal(signals[signalKey]);
      }
    });

    // 구독 해제 함수들 저장
    this.signalUnsubscribers.set(key, unsubscribers);
  }

  /**
   * Phase 3: Signal에서 상태 추출 (key별 로직 분리)
   */
  private getStateFromSignals(key: StateKey, signals: Record<string, Signal<unknown>>): unknown {
    if (key === 'gallery') {
      const isOpenSignal = signals.isOpen;
      const currentMediaIndexSignal = signals.currentMediaIndex;
      const mediaCountSignal = signals.mediaCount;
      const currentUrlSignal = signals.currentUrl;

      return {
        isOpen: isOpenSignal?.value ?? false,
        currentMediaIndex: currentMediaIndexSignal?.value ?? 0,
        mediaCount: mediaCountSignal?.value,
        currentUrl: currentUrlSignal?.value,
      };
    }

    // 다른 state key들을 위한 확장 포인트
    return {};
  }

  /**
   * 구독자 Set 확보
   */
  private ensureSubscriberSet(key: StateKey): Set<StateSubscriber<unknown>> {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    return this.subscribers.get(key)!;
  }

  /**
   * 상태 구독자 추가
   */
  subscribe<T>(key: string, subscriber: (value: T) => void): () => void {
    const subscriberSet = this.ensureSubscriberSet(key as StateKey);
    const typedSubscriber = subscriber as StateSubscriber<unknown>;
    subscriberSet.add(typedSubscriber);

    return () => {
      subscriberSet.delete(typedSubscriber);
    };
  }

  /**
   * 구독자들에게 상태 변경 알림
   */
  private notifySubscribers<T extends StateKey>(
    key: T,
    newValue: StateValue<T>,
    oldValue?: StateValue<T>
  ): void {
    const startTime = performance.now();

    try {
      const subscriberSet = this.subscribers.get(key);
      if (subscriberSet) {
        subscriberSet.forEach(subscriber => {
          try {
            subscriber(newValue as unknown, oldValue as unknown);
          } catch (error) {
            logger.error('구독자 알림 오류:', error);
            this.performanceMetrics.errorCount++;
          }
        });
      }

      // 성능 메트릭 업데이트
      const duration = performance.now() - startTime;
      this.updatePerformanceMetrics(duration);

      // 히스토리 기록
      this.addToHistory('NOTIFY_SUBSCRIBERS', { key, newValue });
    } catch (error) {
      logger.error('구독자 알림 처리 오류:', error);
      this.performanceMetrics.errorCount++;
      this.debugInfo.lastError = error as Error;
    }
  }

  /**
   * 상태 동기화
   */
  syncState<T extends StateKey>(
    key: T,
    newValue: StateValue<T>,
    source: 'signal' | 'react' = 'react'
  ): void {
    const startTime = performance.now();

    try {
      if (key === 'gallery' && typeof window !== 'undefined') {
        const gallerySignals = (
          window as unknown as { gallery?: { signals?: Record<string, Signal<unknown>> } }
        ).gallery?.signals;
        if (gallerySignals && source === 'react') {
          // React에서 Signal로 동기화
          const galleryState = newValue as GalleryState;

          if (gallerySignals.isOpen) gallerySignals.isOpen.value = galleryState.isOpen;
          if (gallerySignals.currentMediaIndex)
            gallerySignals.currentMediaIndex.value = galleryState.currentMediaIndex;
          if (gallerySignals.mediaCount && galleryState.mediaCount !== undefined) {
            gallerySignals.mediaCount.value = galleryState.mediaCount;
          }
          if (gallerySignals.currentUrl && galleryState.currentUrl !== undefined) {
            gallerySignals.currentUrl.value = galleryState.currentUrl;
          }
        }
      }

      // 성능 메트릭 업데이트
      const duration = performance.now() - startTime;
      this.updatePerformanceMetrics(duration);

      // 히스토리 기록
      this.addToHistory('SYNC_STATE', { key, newValue, source });
    } catch (error) {
      logger.error('상태 동기화 오류:', error);
      this.performanceMetrics.errorCount++;
      this.debugInfo.lastError = error as Error;
      this.debugInfo.syncConflicts++;
      this.debugInfo.lastSyncConflict = Date.now();
    }
  }

  /**
   * Phase 3: 개선된 현재 상태 가져오기 (주입된 signals 우선 사용)
   */
  getState<T>(key: string): T | undefined {
    try {
      // 1. 주입된 signals에서 먼저 확인
      const injectedSignals = this.injectedSignals.get(key as StateKey);
      if (injectedSignals) {
        return this.getStateFromSignals(key as StateKey, injectedSignals) as T;
      }

      // 2. fallback: window.gallery에서 확인 (레거시 지원)
      if (key === 'gallery' && typeof window !== 'undefined') {
        const windowWithGallery = window as unknown as {
          gallery?: { signals?: Record<string, Signal<unknown>> };
        };
        const gallerySignals = windowWithGallery.gallery?.signals;
        if (gallerySignals) {
          return this.getStateFromSignals(key as StateKey, gallerySignals) as T;
        }
      }

      // 3. 기본값 반환 (안전한 fallback)
      if (key === 'gallery') {
        return {
          isOpen: false,
          currentMediaIndex: 0,
          mediaCount: undefined,
          currentUrl: undefined,
        } as T;
      }

      return undefined;
    } catch (error) {
      logger.error('상태 조회 오류:', error);
      this.performanceMetrics.errorCount++;

      // 에러 시에도 안전한 기본값 반환
      if (key === 'gallery') {
        return {
          isOpen: false,
          currentMediaIndex: 0,
          mediaCount: undefined,
          currentUrl: undefined,
        } as T;
      }

      return undefined;
    }
  }

  /**
   * 상태 설정 (인터페이스 호환성)
   */
  setState<T>(key: string, value: T): void {
    try {
      // 주입된 signals에 상태 설정
      const injectedSignals = this.injectedSignals.get(key as StateKey);
      if (injectedSignals) {
        this.setStateToSignals(key as StateKey, injectedSignals, value);
        this.notifySubscribers(key as StateKey, value as StateValue<StateKey>);
        return;
      }

      // fallback: 내부 상태 관리 (향후 확장용)
      this.addToHistory('SET_STATE', { key, value });
    } catch (error) {
      logger.error('[StateManager] setState 실패:', error);
    }
  }

  /**
   * Signals에 상태 설정하는 헬퍼 메서드
   */
  private setStateToSignals<T extends StateKey>(
    key: T,
    signals: Record<string, Signal<unknown>>,
    value: unknown
  ): void {
    if (key === 'gallery' && typeof value === 'object' && value !== null) {
      const galleryValue = value as Partial<GalleryState>;

      // 각 gallery 상태 속성을 해당 signal에 설정
      if ('isOpen' in galleryValue && signals.isOpen) {
        signals.isOpen.value = galleryValue.isOpen;
      }
      if ('currentMediaIndex' in galleryValue && signals.currentMediaIndex) {
        signals.currentMediaIndex.value = galleryValue.currentMediaIndex;
      }
      if ('mediaCount' in galleryValue && signals.mediaCount) {
        signals.mediaCount.value = galleryValue.mediaCount;
      }
      if ('currentUrl' in galleryValue && signals.currentUrl) {
        signals.currentUrl.value = galleryValue.currentUrl;
      }
    }
  }

  /**
   * 성능 메트릭 업데이트
   */
  private updatePerformanceMetrics(duration: number): void {
    this.performanceMetrics.syncCount++;
    this.performanceMetrics.lastSyncTime = Date.now();

    // 평균 동기화 시간 계산
    const totalDuration =
      this.performanceMetrics.averageSyncDuration * (this.performanceMetrics.syncCount - 1) +
      duration;
    this.performanceMetrics.averageSyncDuration = totalDuration / this.performanceMetrics.syncCount;
  }

  /**
   * 히스토리 기록 추가
   */
  private addToHistory(action: string, state: object): void {
    if (this.debugInfo.isDebugMode) {
      this.stateHistory.push({
        timestamp: Date.now(),
        action,
        state,
      });

      // 히스토리 크기 제한 (최대 100개)
      if (this.stateHistory.length > 100) {
        this.stateHistory = this.stateHistory.slice(-100);
      }
    }
  }

  /**
   * 디버그 모드 설정
   */
  setDebugMode(enabled: boolean): void {
    this.debugInfo.isDebugMode = enabled;
    if (!enabled) {
      this.stateHistory = [];
    }
  }

  /**
   * 성능 메트릭 조회
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * 디버그 정보 조회
   */
  getDebugInfo(): DebugInfo & { history: StateHistory[] } {
    return {
      ...this.debugInfo,
      history: [...this.stateHistory],
    };
  }

  /**
   * Phase 3: 개선된 상태 초기화 (구독 정리 포함)
   */
  reset(): void {
    // 모든 signal 구독 정리
    this.signalUnsubscribers.forEach((unsubscribers, key) => {
      this.cleanupSignalSubscriptions(key);
    });

    // 내부 상태 초기화
    this.subscribers.clear();
    this.injectedSignals.clear();
    this.signalUnsubscribers.clear();
    this.stateHistory = [];

    this.performanceMetrics = {
      syncCount: 0,
      lastSyncTime: 0,
      averageSyncDuration: 0,
      errorCount: 0,
    };
    this.debugInfo = {
      isDebugMode: false,
      syncConflicts: 0,
    };

    logger.debug('[StateManager] 완전 초기화 완료');
  }
}

export default StateManager;
