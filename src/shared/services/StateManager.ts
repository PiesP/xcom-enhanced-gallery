/**
 * @fileoverview StateManager - 통합 상태 관리 시스템
 * @description Signal과 React 상태를 통합 관리하는 싱글톤 서비스
 * @version 1.0.0 - Phase 2.2 상태 통합 구현
 */

import { createScopedLogger } from '../logging/logger';

// StateManager 전용 로거
const logger = createScopedLogger('StateManager');

// Signal 타입 정의 (preact/signals 직접 import 대신)
interface Signal<T> {
  value: T;
  subscribe?: (callback: (value: T) => void) => () => void;
}

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
 */
export class StateManager {
  private static instance: StateManager;
  private readonly subscribers = new Map<StateKey, Set<StateSubscriber<unknown>>>();
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

  private constructor() {
    this.initializeSignalSync();
  }

  static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  /**
   * Signal 동기화 초기화
   */
  private initializeSignalSync(): void {
    try {
      // gallery signals 동기화 설정
      if (
        typeof window !== 'undefined' &&
        (window as unknown as { gallery?: { signals?: Record<string, Signal<unknown>> } }).gallery
          ?.signals
      ) {
        const windowWithGallery = window as unknown as {
          gallery: { signals: Record<string, Signal<unknown>> };
        };
        const gallerySignals = windowWithGallery.gallery.signals as {
          isOpen: Signal<boolean>;
          currentMediaIndex: Signal<number>;
          mediaCount: Signal<number>;
          currentUrl: Signal<string>;
        };

        // Signal 변경 감지 및 구독자 알림
        this.setupSignalWatcher('gallery', gallerySignals);
      }
    } catch (error) {
      this.debugInfo.lastError = error as Error;
      this.performanceMetrics.errorCount++;
      logger.warn('Signal 동기화 초기화 실패:', error);
    }
  }

  /**
   * Signal 감시자 설정
   */
  private setupSignalWatcher(key: StateKey, signals: Record<string, Signal<unknown>>): void {
    const watchSignal = (signal: Signal<unknown>) => {
      signal.subscribe?.(() => {
        const state = this.getStateFromSignals(signals);
        this.notifySubscribers(key, state);
      });
    };

    Object.keys(signals).forEach(signalKey => {
      if (signals[signalKey]?.subscribe) {
        watchSignal(signals[signalKey]);
      }
    });
  }

  /**
   * Signal에서 상태 추출
   */
  private getStateFromSignals(signals: Record<string, Signal<unknown>>): GalleryState {
    return {
      isOpen: (signals.isOpen as Signal<boolean>)?.value ?? false,
      currentMediaIndex: (signals.currentMediaIndex as Signal<number>)?.value ?? 0,
      mediaCount: (signals.mediaCount as Signal<number>)?.value,
      currentUrl: (signals.currentUrl as Signal<string>)?.value,
    };
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
  subscribe<T extends StateKey>(key: T, subscriber: StateSubscriber<StateValue<T>>): () => void {
    const subscriberSet = this.ensureSubscriberSet(key);
    subscriberSet.add(subscriber as StateSubscriber<unknown>);

    return () => {
      subscriberSet.delete(subscriber as StateSubscriber<unknown>);
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
            subscriber(newValue, oldValue);
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
   * 현재 상태 가져오기
   */
  getState<T extends StateKey>(key: T): StateValue<T> | undefined {
    try {
      if (key === 'gallery' && typeof window !== 'undefined') {
        const gallerySignals = (
          window as unknown as { gallery?: { signals?: Record<string, Signal<unknown>> } }
        ).gallery?.signals;
        if (gallerySignals) {
          return this.getStateFromSignals(gallerySignals) as StateValue<T>;
        }
      }
      return undefined;
    } catch (error) {
      logger.error('상태 조회 오류:', error);
      this.performanceMetrics.errorCount++;
      return undefined;
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
   * 상태 초기화
   */
  reset(): void {
    this.subscribers.clear();
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
  }
}

export default StateManager;
