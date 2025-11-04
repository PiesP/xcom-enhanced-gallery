/**
 * @fileoverview 이벤트 리스너 레지스트리
 * @description Phase 329: 파일 분리 (SRP 준수)
 *              listeners Map 및 상태 관리를 별도 모듈로 분리
 */

import { logger } from '@shared/logging';
import type { EventContext } from './event-context';

/**
 * 등록된 모든 이벤트 리스너 추적
 * 컨텍스트별 리스너 제거, 상태 조회 등 지원
 */
class ListenerRegistry {
  private static instance: ListenerRegistry | null = null;
  private readonly listeners = new Map<string, EventContext>();

  private constructor() {}

  /**
   * 싱글톤 인스턴스 반환
   */
  static getInstance(): ListenerRegistry {
    if (!ListenerRegistry.instance) {
      ListenerRegistry.instance = new ListenerRegistry();
    }
    return ListenerRegistry.instance;
  }

  /**
   * 리스너 등록
   */
  register(id: string, context: EventContext): void {
    this.listeners.set(id, context);
    logger.debug(`[ListenerRegistry] Listener registered: ${id}`, {
      type: context.type,
      context: context.context,
    });
  }

  /**
   * 리스너 조회
   */
  get(id: string): EventContext | undefined {
    return this.listeners.get(id);
  }

  /**
   * 리스너 제거
   */
  unregister(id: string): boolean {
    const context = this.listeners.get(id);
    if (!context) {
      logger.warn(`[ListenerRegistry] Listener not found: ${id}`);
      return false;
    }

    this.listeners.delete(id);
    logger.debug(`[ListenerRegistry] Listener unregistered: ${id}`, {
      type: context.type,
    });
    return true;
  }

  /**
   * 컨텍스트별 리스너 제거
   */
  unregisterByContext(context: string): number {
    let removedCount = 0;
    for (const [id, eventContext] of this.listeners.entries()) {
      if (eventContext.context === context) {
        this.listeners.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.debug(`[ListenerRegistry] Removed ${removedCount} listeners for context: ${context}`);
    }
    return removedCount;
  }

  /**
   * 모든 리스너 제거
   */
  clear(): void {
    const count = this.listeners.size;
    this.listeners.clear();
    logger.debug(`[ListenerRegistry] Cleared all ${count} listeners`);
  }

  /**
   * 리스너 상태 조회
   */
  getStatus() {
    const contextGroups = new Map<string, number>();
    const typeGroups = new Map<string, number>();

    for (const eventContext of this.listeners.values()) {
      const ctx = eventContext.context || 'default';
      contextGroups.set(ctx, (contextGroups.get(ctx) || 0) + 1);
      typeGroups.set(eventContext.type, (typeGroups.get(eventContext.type) || 0) + 1);
    }

    return {
      total: this.listeners.size,
      byContext: Object.fromEntries(contextGroups),
      byType: Object.fromEntries(typeGroups),
      listeners: Array.from(this.listeners.values()).map(ctx => ({
        id: ctx.id,
        type: ctx.type,
        context: ctx.context,
        created: ctx.created,
      })),
    };
  }

  /**
   * 리스너 총 개수
   */
  size(): number {
    return this.listeners.size;
  }

  /**
   * 모든 리스너 반복
   */
  forEach(callback: (context: EventContext, id: string) => void): void {
    for (const [id, context] of this.listeners.entries()) {
      callback(context, id);
    }
  }
}

export const listenerRegistry = ListenerRegistry.getInstance();
