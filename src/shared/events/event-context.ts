/**
 * @fileoverview Context-based Subscription Management
 * @version 1.0.0
 *
 * Provides centralized subscription tracking with context-based grouping
 * for batch operations and statistics.
 *
 * **Design Goals**:
 * - Unique subscription IDs
 * - Context-based batch removal
 * - Statistics aggregation
 * - Memory-efficient tracking
 */

import { logger } from '@shared/logging';

// ============================================================================
// Types
// ============================================================================

/**
 * Internal subscription entry
 */
export interface Subscription {
  /** Unique subscription ID */
  readonly id: string;
  /** Subscription type */
  readonly type: 'dom' | 'app';
  /** Optional context for grouping */
  readonly context?: string | undefined;
  /** Cleanup function to remove the subscription */
  readonly cleanup: () => void;
}

/**
 * Subscription statistics
 */
export interface SubscriptionStats {
  /** Total number of subscriptions */
  readonly total: number;
  /** Number of DOM subscriptions */
  readonly dom: number;
  /** Number of application event subscriptions */
  readonly app: number;
  /** Subscriptions grouped by context */
  readonly byContext: Readonly<Record<string, number>>;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Subscription Manager
 *
 * Manages subscription lifecycle with context-based grouping support.
 */
export class SubscriptionManager {
  /** All active subscriptions indexed by ID */
  private readonly subscriptions = new Map<string, Subscription>();

  /** ID counter for unique subscription IDs */
  private idCounter = 0;

  /**
   * Add a subscription
   *
   * @param subscription - Subscription to add
   * @returns Subscription ID
   */
  public add(subscription: Subscription): string {
    this.subscriptions.set(subscription.id, subscription);
    return subscription.id;
  }

  /**
   * Remove a subscription by ID
   *
   * @param id - Subscription ID
   * @returns true if removed, false if not found
   */
  public remove(id: string): boolean {
    const subscription = this.subscriptions.get(id);
    if (!subscription) {
      return false;
    }

    subscription.cleanup();
    this.subscriptions.delete(id);
    return true;
  }

  /**
   * Remove all subscriptions matching a context
   *
   * @param context - Context string to match
   * @returns Number of removed subscriptions
   */
  public removeByContext(context: string): number {
    const toRemove: string[] = [];

    for (const [id, sub] of this.subscriptions) {
      if (sub.context === context) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.remove(id);
    }

    if (__DEV__ && toRemove.length > 0) {
      logger.debug(
        `[SubscriptionManager] Removed ${toRemove.length} subscriptions for context: ${context}`
      );
    }

    return toRemove.length;
  }

  /**
   * Remove all subscriptions
   */
  public removeAll(): void {
    const count = this.subscriptions.size;

    for (const subscription of this.subscriptions.values()) {
      subscription.cleanup();
    }

    this.subscriptions.clear();

    if (__DEV__ && count > 0) {
      logger.debug(`[SubscriptionManager] Removed all ${count} subscriptions`);
    }
  }

  /**
   * Get subscription statistics
   */
  public getStats(): SubscriptionStats {
    const stats = {
      total: this.subscriptions.size,
      dom: 0,
      app: 0,
      byContext: {} as Record<string, number>,
    };

    for (const sub of this.subscriptions.values()) {
      if (sub.type === 'dom') {
        stats.dom++;
      } else {
        stats.app++;
      }

      if (sub.context) {
        stats.byContext[sub.context] = (stats.byContext[sub.context] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * Generate unique subscription ID
   *
   * @param type - Subscription type ('dom' or 'app')
   * @param context - Optional context for namespacing
   * @returns Unique subscription ID
   */
  public generateId(type: string, context?: string): string {
    const id = `${type}:${++this.idCounter}`;
    return context ? `${context}:${id}` : id;
  }

  /**
   * Get number of active subscriptions
   */
  public get size(): number {
    return this.subscriptions.size;
  }

  /**
   * Check if a subscription exists
   */
  public has(id: string): boolean {
    return this.subscriptions.has(id);
  }

  /**
   * Clear internal state (for testing)
   * @internal
   */
  public _reset(): void {
    this.subscriptions.clear();
    this.idCounter = 0;
  }
}
