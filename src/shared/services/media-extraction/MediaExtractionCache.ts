/**
 * 간단한 LRU + TTL 캐시 (tweetId -> MediaExtractionResult)
 */
import type { MediaExtractionResult } from '@shared/types/media.types';

interface CacheEntry {
  value: MediaExtractionResult;
  expiresAt: number;
}

export interface MediaExtractionCacheOptions {
  maxEntries?: number;
  ttlMs?: number;
  /** 주기적 purge 간격(ms) - 0 또는 음수면 비활성화, 미지정시 ttlMs/2 최소 5s */
  purgeIntervalMs?: number;
}

export class MediaExtractionCache {
  private readonly map = new Map<string, CacheEntry>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;
  // 메트릭
  private hitCount = 0;
  private missCount = 0; // 존재하지 않거나 만료된 조회 시에만 증가 (set 시 증가 X)
  private lruEvictions = 0; // 용량 초과로 제거된 수
  private ttlEvictions = 0; // 만료로 제거된 수 (get|getStatus 시 발견)
  private purgeCount = 0; // 주기적 스캔으로 제거된 만료 항목 수
  private purgeIntervalId: number | ReturnType<typeof setInterval> | null = null;

  constructor(opts: MediaExtractionCacheOptions = {}) {
    this.maxEntries = opts.maxEntries ?? 100;
    this.ttlMs = opts.ttlMs ?? 2 * 60 * 1000; // 2분 기본 TTL
    const configured = opts.purgeIntervalMs;
    if (configured !== undefined && configured > 0) {
      this.startPurgeTimer(configured);
    } else if (configured === undefined) {
      // 기본 정책: TTL/2 (최소 5s) (TTL 매우 작을 때 과도한 타이머 방지)
      const interval = Math.max(5000, Math.floor(this.ttlMs / 2));
      this.startPurgeTimer(interval);
    }
  }

  private startPurgeTimer(interval: number) {
    if (interval <= 0) return;
    if (typeof window !== 'undefined' && typeof window.setInterval === 'function') {
      this.purgeIntervalId = (window.setInterval as unknown as typeof setInterval)(
        () => this.purgeStale('interval'),
        interval
      ) as unknown as number;
    } else if (typeof setInterval === 'function') {
      this.purgeIntervalId = setInterval(() => this.purgeStale('interval'), interval);
    }
  }

  /** purge 타이머 중지 (내부 타이머만 정리) */
  private stopPurgeTimer(): void {
    if (this.purgeIntervalId !== null) {
      if (typeof clearInterval === 'function') {
        clearInterval(this.purgeIntervalId as unknown as number);
      } else if (typeof window !== 'undefined' && typeof window.clearInterval === 'function') {
        window.clearInterval(this.purgeIntervalId as unknown as number);
      }
      this.purgeIntervalId = null;
    }
  }

  /** 동적 재설정: ms>0 이면 새 타이머 시작, 0/음수면 중지 */
  setPurgeInterval(ms: number): void {
    this.stopPurgeTimer();
    if (typeof ms === 'number' && ms > 0) {
      this.startPurgeTimer(ms);
    }
  }

  /** purge 타이머 중지 (외부 API) */
  stopPurgeInterval(): void {
    this.stopPurgeTimer();
  }

  get(key: string): MediaExtractionResult | undefined {
    const entry = this.map.get(key);
    if (!entry) {
      this.missCount++;
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      this.ttlEvictions++;
      this.missCount++;
      return undefined;
    }
    // LRU 갱신: 재삽입
    this.map.delete(key);
    this.map.set(key, entry);
    this.hitCount++;
    return entry.value;
  }

  /**
   * 상태 포함 조회
   * - hit: 유효한 캐시 존재
   * - expired: 만료되어 삭제됨 (stale eviction 관측용)
   * - value: hit 인 경우 결과
   */
  getStatus(key: string): { hit: boolean; expired: boolean; value?: MediaExtractionResult } {
    const entry = this.map.get(key);
    if (!entry) {
      this.missCount++;
      return { hit: false, expired: false };
    }
    if (Date.now() > entry.expiresAt) {
      // 만료: stale 관측 위해 expired=true 반환 (항목 제거)
      this.map.delete(key);
      this.ttlEvictions++;
      this.missCount++;
      return { hit: false, expired: true };
    }
    // LRU 갱신
    this.map.delete(key);
    this.map.set(key, entry);
    this.hitCount++;
    return { hit: true, expired: false, value: entry.value };
  }

  set(key: string, value: MediaExtractionResult): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    if (this.map.size > this.maxEntries) {
      // 가장 오래된 키 제거 (Map의 첫 번째 항목)
      const oldest = this.map.keys().next().value;
      if (oldest) this.map.delete(oldest);
      this.lruEvictions++;
    }
  }

  clear(): void {
    this.map.clear();
  }

  /** 주기적 또는 수동 호출로 만료된 항목 스캔 제거 */
  purgeStale(_reason: 'interval' | 'manual' = 'manual'): number {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.map.entries()) {
      if (now > entry.expiresAt) {
        this.map.delete(key);
        this.ttlEvictions++;
        removed++;
      }
    }
    if (removed > 0) this.purgeCount += removed;
    return removed;
  }

  /** 자원 정리 (테스트/종료 시) */
  dispose(): void {
    this.stopPurgeTimer();
  }

  /** 메트릭 노출 (RED → GREEN) */
  getMetrics() {
    const totalLookups = this.hitCount + this.missCount || 1;
    const evictionCount = this.lruEvictions + this.ttlEvictions; // backward compat
    return {
      hitCount: this.hitCount,
      missCount: this.missCount,
      evictionCount,
      lruEvictions: this.lruEvictions,
      ttlEvictions: this.ttlEvictions,
      size: this.map.size,
      hitRatio: this.hitCount / totalLookups,
      ttlMs: this.ttlMs,
      maxEntries: this.maxEntries,
      purgeCount: this.purgeCount,
      purgeIntervalActive: this.purgeIntervalId !== null,
    };
  }
}
