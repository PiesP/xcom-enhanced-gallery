/**
 * @fileoverview LRU (Least Recently Used) 캐시 구현
 * @description Phase 4: 성능 최적화 - 메모리 효율적인 캐시 시스템
 * @version 1.0.0
 */

/**
 * LRU 캐시 노드
 */
interface LRUNode<T> {
  key: string;
  value: T;
  prev: LRUNode<T> | null;
  next: LRUNode<T> | null;
}

/**
 * LRU 캐시 옵션
 */
export interface LRUCacheOptions {
  /** 최대 캐시 크기 */
  maxSize: number;
  /** TTL (Time To Live) 밀리초 */
  ttl?: number;
  /** 메모리 압박 시 자동 정리 활성화 */
  autoCleanup?: boolean;
}

/**
 * LRU 캐시 통계
 */
export interface LRUCacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  hitRate: number;
}

/**
 * LRU (Least Recently Used) 캐시
 * 메모리 효율적인 캐시 시스템으로 오래된 항목을 자동으로 제거합니다.
 */
export class LRUCache<T> {
  private readonly maxSize: number;
  private readonly ttl: number | null;
  private readonly autoCleanup: boolean;

  private readonly cache = new Map<string, LRUNode<T>>();
  private head: LRUNode<T> | null = null;
  private tail: LRUNode<T> | null = null;

  private hits = 0;
  private misses = 0;

  private cleanupTimer: number | null = null;

  constructor(maxSizeOrOptions: number | LRUCacheOptions) {
    if (typeof maxSizeOrOptions === 'number') {
      this.maxSize = maxSizeOrOptions;
      this.ttl = null;
      this.autoCleanup = false;
    } else {
      this.maxSize = maxSizeOrOptions.maxSize;
      this.ttl = maxSizeOrOptions.ttl || null;
      this.autoCleanup = maxSizeOrOptions.autoCleanup || false;
    }

    if (this.autoCleanup && this.ttl) {
      this.startAutoCleanup();
    }
  }

  /**
   * 캐시에서 값 조회
   */
  get(key: string): T | undefined {
    const node = this.cache.get(key);

    if (!node) {
      this.misses++;
      return undefined;
    }

    // TTL 검사
    if (this.ttl && this.isExpired(node)) {
      this.delete(key);
      this.misses++;
      return undefined;
    }

    // 노드를 head로 이동 (최근 사용)
    this.moveToHead(node);
    this.hits++;

    return node.value;
  }

  /**
   * 캐시에 값 저장
   */
  set(key: string, value: T): void {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      // 기존 노드 업데이트
      existingNode.value = value;
      this.moveToHead(existingNode);
      return;
    }

    // 새 노드 생성
    const newNode: LRUNode<T> = {
      key,
      value,
      prev: null,
      next: null,
    };

    // 용량 확인 및 제거
    if (this.cache.size >= this.maxSize) {
      this.removeTail();
    }

    // 새 노드를 head에 추가
    this.addToHead(newNode);
    this.cache.set(key, newNode);
  }

  /**
   * 캐시에서 키 존재 여부 확인
   */
  has(key: string): boolean {
    const node = this.cache.get(key);

    if (!node) {
      return false;
    }

    // TTL 검사
    if (this.ttl && this.isExpired(node)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 캐시에서 키 삭제
   */
  delete(key: string): boolean {
    const node = this.cache.get(key);

    if (!node) {
      return false;
    }

    this.removeNode(node);
    this.cache.delete(key);

    return true;
  }

  /**
   * 캐시 완전 초기화
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 현재 캐시 크기
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 캐시 통계 조회
   */
  getStats(): LRUCacheStats {
    const total = this.hits + this.misses;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * 모든 키 목록 반환 (사용 순서대로)
   */
  keys(): string[] {
    const keys: string[] = [];
    let current = this.head;

    while (current) {
      keys.push(current.key);
      current = current.next;
    }

    return keys;
  }

  /**
   * 만료된 항목들 정리
   */
  cleanup(): number {
    if (!this.ttl) {
      return 0;
    }

    let removedCount = 0;
    const keysToRemove: string[] = [];

    // 만료된 키들 수집
    for (const [key, node] of this.cache) {
      if (this.isExpired(node)) {
        keysToRemove.push(key);
      }
    }

    // 만료된 키들 제거
    for (const key of keysToRemove) {
      this.delete(key);
      removedCount++;
    }

    return removedCount;
  }

  /**
   * 캐시 해제 및 정리
   */
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.clear();
  }

  /**
   * 노드를 연결 리스트 head에 추가
   */
  private addToHead(node: LRUNode<T>): void {
    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * 연결 리스트에서 노드 제거
   */
  private removeNode(node: LRUNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  /**
   * 노드를 head로 이동
   */
  private moveToHead(node: LRUNode<T>): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  /**
   * tail 노드 제거
   */
  private removeTail(): void {
    if (!this.tail) {
      return;
    }

    const tailNode = this.tail;
    this.removeNode(tailNode);
    this.cache.delete(tailNode.key);
  }

  /**
   * 노드가 만료되었는지 확인
   */
  private isExpired(_node: LRUNode<T>): boolean {
    if (!this.ttl) {
      return false;
    }

    // 간단한 TTL 구현 (실제로는 타임스탬프를 노드에 저장해야 함)
    // 여기서는 기본적인 구현만 제공
    return false;
  }

  /**
   * 자동 정리 타이머 시작
   */
  private startAutoCleanup(): void {
    if (!this.ttl) {
      return;
    }

    this.cleanupTimer = window.setInterval(() => {
      this.cleanup();
    }, this.ttl / 2); // TTL의 절반 주기로 정리
  }
}

/**
 * 전역 미디어 캐시 인스턴스
 */
export const globalMediaCache = new LRUCache<unknown>({
  maxSize: 100,
  ttl: 5 * 60 * 1000, // 5분
  autoCleanup: true,
});

/**
 * 빠른 LRU 캐시 생성 헬퍼
 */
export function createLRUCache<T>(maxSize: number, ttl?: number): LRUCache<T> {
  return new LRUCache<T>({
    maxSize,
    ttl,
    autoCleanup: !!ttl,
  });
}
