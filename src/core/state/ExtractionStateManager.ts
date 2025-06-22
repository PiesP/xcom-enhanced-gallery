/**
 * @fileoverview ExtractionStateManager - 미디어 추출 상태 관리
 * @description 미디어 추출의 성공 기록과 중복 방지를 담당하는 상태 관리자
 */

import { logger } from '../../infrastructure/logging';
import { getPreactSignals } from '@infrastructure/external/vendors';

/**
 * Preact Signals 지연 초기화
 */
let preactSignals: ReturnType<typeof getPreactSignals> | null = null;
let isSignalsInitialized = false;

function ensureSignalsInitialized(): void {
  if (isSignalsInitialized && preactSignals) {
    return;
  }

  try {
    preactSignals = getPreactSignals();
    isSignalsInitialized = true;
    logger.debug('ExtractionStateManager: Preact Signals 초기화 완료');
  } catch (error) {
    logger.error('ExtractionStateManager: Preact Signals 초기화 실패:', error);
    throw new Error(
      'Preact Signals가 초기화되지 않았습니다. initializeVendors()를 먼저 호출하세요.'
    );
  }
}

/**
 * 추출 성공 기록 엔트리
 */
export interface ExtractionRecord {
  /** 트윗 ID */
  tweetId: string;
  /** 추출 성공 시간 */
  extractedAt: number;
  /** 추출된 미디어 개수 */
  mediaCount: number;
}

/**
 * Preact Signal 타입 정의
 */
interface PreactSignal<T> {
  value: T;
  peek?: () => T;
  subscribe?: (fn: (value: T) => void) => () => void;
}

interface PreactComputed<T> {
  readonly value: T;
}

/**
 * 추출 상태 관리자
 *
 * @description 미디어 추출의 성공 기록을 관리하고 중복 추출을 방지합니다.
 * Preact Signals를 사용하여 반응형 상태 관리를 제공합니다.
 */
export class ExtractionStateManager {
  private static instance: ExtractionStateManager | null = null;

  /** 성공한 추출 기록 (tweetId -> ExtractionRecord) - 지연 초기화 */
  private _successfulExtractions: PreactSignal<Map<string, ExtractionRecord>> | null = null;

  /** TTL 타이머 관리 */
  private readonly ttlTimers = new Map<string, ReturnType<typeof setTimeout>>();

  /** 기본 TTL (30초) */
  private readonly DEFAULT_TTL_MS = 30000;

  /** Computed 값들 (지연 초기화) */
  private _extractionCount: PreactComputed<number> | null = null;
  private _allExtractions: PreactComputed<ExtractionRecord[]> | null = null;

  private constructor() {
    logger.debug('ExtractionStateManager 인스턴스 생성됨');
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): ExtractionStateManager {
    ExtractionStateManager.instance ??= new ExtractionStateManager();
    return ExtractionStateManager.instance;
  }

  /**
   * Signals 지연 초기화 getter
   */
  private get successfulExtractions(): PreactSignal<Map<string, ExtractionRecord>> {
    if (!this._successfulExtractions) {
      ensureSignalsInitialized();
      if (!preactSignals) {
        throw new Error('Preact Signals 초기화 실패');
      }
      this._successfulExtractions = preactSignals.signal<Map<string, ExtractionRecord>>(new Map());
    }
    return this._successfulExtractions;
  }

  /**
   * 성공한 추출 기록 추가
   *
   * @param tweetId - 트윗 ID
   * @param mediaCount - 추출된 미디어 개수 (기본값: 1)
   * @param ttlMs - TTL 시간 (기본값: 30초)
   */
  public recordSuccessfulExtraction(
    tweetId: string,
    mediaCount: number = 1,
    ttlMs: number = this.DEFAULT_TTL_MS
  ): void {
    if (!tweetId?.trim()) {
      logger.warn('빈 tweetId로 추출 기록 시도됨');
      return;
    }

    const record: ExtractionRecord = {
      tweetId,
      extractedAt: Date.now(),
      mediaCount,
    };

    // 기존 타이머 정리
    this.clearTtlTimer(tweetId);

    // 새 기록 추가
    const currentRecords = new Map(this.successfulExtractions.value);
    currentRecords.set(tweetId, record);
    this.successfulExtractions.value = currentRecords;

    // TTL 타이머 설정
    this.setTtlTimer(tweetId, ttlMs);

    logger.debug('성공한 추출 기록됨', { tweetId, mediaCount, ttlMs });
  }

  /**
   * 특정 트윗의 추출 성공 여부 확인
   *
   * @param tweetId - 확인할 트윗 ID
   * @returns 추출 성공 여부
   */
  public hasSuccessfulExtraction(tweetId: string): boolean {
    if (!tweetId?.trim()) {
      return false;
    }

    return this.successfulExtractions.value.has(tweetId);
  }

  /**
   * 특정 트윗의 추출 기록 반환
   *
   * @param tweetId - 트윗 ID
   * @returns 추출 기록 (없으면 null)
   */
  public getExtractionRecord(tweetId: string): ExtractionRecord | null {
    if (!tweetId?.trim()) {
      return null;
    }

    return this.successfulExtractions.value.get(tweetId) ?? null;
  }

  /**
   * 특정 트윗의 추출 기록 제거
   *
   * @param tweetId - 제거할 트윗 ID
   * @returns 제거 성공 여부
   */
  public removeExtractionRecord(tweetId: string): boolean {
    if (!tweetId?.trim()) {
      return false;
    }

    this.clearTtlTimer(tweetId);

    const currentRecords = new Map(this.successfulExtractions.value);
    const removed = currentRecords.delete(tweetId);

    if (removed) {
      this.successfulExtractions.value = currentRecords;
      logger.debug('추출 기록 제거됨', { tweetId });
    }

    return removed;
  }

  /**
   * 모든 추출 기록 초기화
   *
   * @description 갤러리 닫기 시 호출하여 재클릭을 허용합니다.
   */
  public clearAllExtractions(): void {
    const previousSize = this.successfulExtractions.value.size;

    // 모든 TTL 타이머 정리
    this.ttlTimers.forEach(timerId => {
      clearTimeout(timerId);
    });
    this.ttlTimers.clear();

    // 기록 초기화
    this.successfulExtractions.value = new Map();

    if (previousSize > 0) {
      logger.debug(`모든 추출 기록 초기화됨: ${previousSize}개 트윗`);
    }
  }

  /**
   * 만료된 기록 정리
   *
   * @param maxAgeMs - 최대 보관 시간 (기본값: 5분)
   */
  public cleanupExpiredRecords(maxAgeMs: number = 5 * 60 * 1000): void {
    const now = Date.now();
    const currentRecords = new Map(this.successfulExtractions.value);
    let cleanedCount = 0;

    for (const [tweetId, record] of currentRecords.entries()) {
      if (now - record.extractedAt > maxAgeMs) {
        currentRecords.delete(tweetId);
        this.clearTtlTimer(tweetId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.successfulExtractions.value = currentRecords;
      logger.debug(`만료된 추출 기록 정리됨: ${cleanedCount}개`);
    }
  }

  /**
   * 현재 성공한 추출 개수 (읽기 전용 computed)
   */
  public get extractionCount(): PreactComputed<number> {
    if (!this._extractionCount) {
      ensureSignalsInitialized();
      if (!preactSignals) {
        throw new Error('Preact Signals 초기화 실패');
      }
      this._extractionCount = preactSignals.computed(() => this.successfulExtractions.value.size);
    }
    return this._extractionCount;
  }

  /**
   * 모든 추출 기록 목록 (읽기 전용 computed)
   */
  public get allExtractions(): PreactComputed<ExtractionRecord[]> {
    if (!this._allExtractions) {
      ensureSignalsInitialized();
      if (!preactSignals) {
        throw new Error('Preact Signals 초기화 실패');
      }
      this._allExtractions = preactSignals.computed(() =>
        Array.from(this.successfulExtractions.value.values())
      );
    }
    return this._allExtractions;
  }

  /**
   * TTL 타이머 설정
   */
  private setTtlTimer(tweetId: string, ttlMs: number): void {
    const timerId = setTimeout(() => {
      this.removeExtractionRecord(tweetId);
    }, ttlMs);

    this.ttlTimers.set(tweetId, timerId);
  }

  /**
   * TTL 타이머 정리
   */
  private clearTtlTimer(tweetId: string): void {
    const timerId = this.ttlTimers.get(tweetId);
    if (timerId) {
      clearTimeout(timerId);
      this.ttlTimers.delete(tweetId);
    }
  }

  /**
   * 디버깅용 상태 정보 반환
   */
  public getDebugInfo(): {
    totalRecords: number;
    activeTimers: number;
    records: ExtractionRecord[];
  } {
    return {
      totalRecords: this.successfulExtractions.value.size,
      activeTimers: this.ttlTimers.size,
      records: this.allExtractions.value,
    };
  }
}

/**
 * 전역 추출 상태 관리자 인스턴스 (지연 초기화)
 */
let _extractionStateManager: ExtractionStateManager | null = null;

/**
 * 전역 추출 상태 관리자 인스턴스 접근자 (지연 초기화)
 */
export function getExtractionStateManager(): ExtractionStateManager {
  _extractionStateManager ??= ExtractionStateManager.getInstance();
  return _extractionStateManager;
}

/**
 * 편의 함수들 (지연 평가)
 */

/**
 * 성공한 추출 기록
 */
export function recordSuccessfulExtraction(
  tweetId: string,
  mediaCount?: number,
  ttlMs?: number
): void {
  getExtractionStateManager().recordSuccessfulExtraction(tweetId, mediaCount, ttlMs);
}

/**
 * 추출 성공 여부 확인
 */
export function hasSuccessfulExtraction(tweetId: string): boolean {
  return getExtractionStateManager().hasSuccessfulExtraction(tweetId);
}

/**
 * 모든 추출 기록 초기화
 */
export function clearAllExtractions(): void {
  getExtractionStateManager().clearAllExtractions();
}

/**
 * 특정 추출 기록 제거
 */
export function removeExtractionRecord(tweetId: string): boolean {
  return getExtractionStateManager().removeExtractionRecord(tweetId);
}
