/**
 * @fileoverview Simplified Event Manager
 * @description Provides unified event management with context-based cleanup.
 *              Wraps listener-manager for consistent singleton access pattern.
 * @version 2.0.0 - Composition-based lifecycle
 */

import { logger } from '@shared/logging';
import type { Lifecycle } from '@shared/services/lifecycle';
import { createLifecycle } from '@shared/services/lifecycle';
import {
  getEventListenerStatus,
  addListener as registerManagedListener,
  removeEventListenerManaged,
  removeEventListenersByContext,
} from '@shared/utils/events/core/listener-manager';
import { createSingleton } from '@shared/utils/types/singleton';

/**
 * Simplified Event Manager
 * Provides managed event listener registration with context-based grouping.
 *
 * **Design Pattern**: Singleton
 * **Key Features**:
 * - Context-based listener grouping for batch cleanup
 * - ID-based individual listener removal
 * - Lifecycle integration via composition
 */
export class EventManager {
  private readonly lifecycle: Lifecycle;
  private static readonly singleton = createSingleton(() => new EventManager());
  private isDestroyed = false;

  private constructor() {
    this.lifecycle = createLifecycle('EventManager', {
      onInitialize: () => this.onInitialize(),
      onDestroy: () => this.onDestroy(),
    });
  }

  /** Get singleton instance */
  public static getInstance(): EventManager {
    return EventManager.singleton.get();
  }

  /** @internal Test helper */
  public static resetForTests(): void {
    EventManager.singleton.reset();
  }

  /** Initialize service (idempotent, fail-fast on error) */
  public async initialize(): Promise<void> {
    return this.lifecycle.initialize();
  }

  /** Destroy service (idempotent, graceful on error) */
  public destroy(): void {
    this.lifecycle.destroy();
  }

  /** Check if service is initialized */
  public isInitialized(): boolean {
    return this.lifecycle.isInitialized();
  }

  /** Lifecycle: Initialization */
  private async onInitialize(): Promise<void> {
    logger.debug('EventManager initialized');
  }

  /** Lifecycle: Cleanup */
  private onDestroy(): void {
    this.cleanup();
  }

  /**
   * Add event listener with tracking
   *
   * @param element - Target element
   * @param type - Event type
   * @param listener - Event handler
   * @param options - Listener options
   * @param context - Context for grouping (e.g., 'gallery-keyboard')
   * @returns Listener ID for removal
   */
  public addListener(
    element: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
    context?: string
  ): string {
    if (this.isDestroyed) {
      logger.warn('EventManager: addListener called on destroyed instance');
      return '';
    }

    return registerManagedListener(element, type, listener, options, context);
  }

  /**
   * Remove event listener by ID
   */
  public removeListener(id: string): boolean {
    return removeEventListenerManaged(id);
  }

  /**
   * Remove all listeners matching a context
   */
  public removeByContext(context: string): number {
    return removeEventListenersByContext(context);
  }

  /** Check if destroyed */
  public getIsDestroyed(): boolean {
    return this.isDestroyed;
  }

  /** Get listener statistics */
  public getListenerStatus() {
    return getEventListenerStatus();
  }

  /** Clean up and mark as destroyed */
  public cleanup(): void {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;
    logger.debug('EventManager cleanup completed');
  }
}
