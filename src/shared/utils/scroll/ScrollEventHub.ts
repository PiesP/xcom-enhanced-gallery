/**
 * @fileoverview ScrollEventHub (prototype behind flag)
 * - Centralizes scroll/wheel listeners across window/document/containers
 * - PC-only events policy compliant (no touch/pointer)
 * - Uses vendors getters and managed event utils to ensure consistency and testability
 */

import type { SchedulerHandle } from '@shared/utils/performance/schedulers';
import { FEATURE_FLAGS } from '@/constants';
import { createScopedLogger } from '@shared/logging';
import { scheduleRaf } from '@shared/utils/performance';
import { EventManager } from '@shared/services/EventManager';

const logger = createScopedLogger('ScrollEventHub');

export type ScrollEventType = 'scroll' | 'wheel';

export interface ScrollSubscriptionOptions {
  passive?: boolean; // wheel should often be passive:false when we need to preventDefault
  capture?: boolean;
  /**
   * Optional context key to group listeners in events.ts registry
   * Consumers typically pass module/component path
   */
  context?: string;
}

export interface ScrollEventTargetDescriptor {
  target: Window | Document | HTMLElement;
  type: ScrollEventType;
}

export interface ScrollSubscriptionHandle {
  id: string;
  cancel: () => void;
}

/**
 * Lightweight central hub. Idempotent per (target,type,handler,context,passive,capture).
 */
export class ScrollEventHub {
  private readonly subscriptions = new Map<string, ScrollSubscriptionHandle>();
  private readonly em = new EventManager();

  static isEnabled(): boolean {
    return FEATURE_FLAGS.SCROLL_EVENT_HUB;
  }

  subscribe(
    desc: ScrollEventTargetDescriptor,
    handler: (e: Event) => void,
    opts: ScrollSubscriptionOptions = {}
  ): ScrollSubscriptionHandle {
    const { target, type } = desc;
    const passive = opts.passive ?? (type === 'wheel' ? false : true);
    const capture = opts.capture ?? type === 'wheel';
    const context = opts.context ?? 'scroll.hub';

    const key = this.keyOf(target, type, handler, passive, capture, context);
    const existing = this.subscriptions.get(key);
    if (existing) return existing; // idempotent

    const id = this.em.addListener(
      target as EventTarget,
      type,
      handler as EventListener,
      { passive, capture },
      context
    );

    const handle: ScrollSubscriptionHandle = {
      id,
      cancel: () => {
        try {
          this.em.removeListener(id);
          this.subscriptions.delete(key);
        } catch (err) {
          logger.debug('unsubscribe failed (ignored)', { err });
        }
      },
    };

    this.subscriptions.set(key, handle);
    return handle;
  }

  /**
   * Subscribe a wheel handler with lock semantics: when handler returns true, preventDefault/stopPropagation are applied.
   * This mirrors EventManager.addWheelLock behavior to centralize wheel consumption.
   */
  subscribeWheelLock(
    target: Window | Document | HTMLElement,
    handler: (e: WheelEvent) => boolean,
    opts: ScrollSubscriptionOptions = {}
  ): ScrollSubscriptionHandle {
    const context = opts.context ?? 'scroll.hub';
    const capture = opts.capture ?? true;
    const passive = opts.passive ?? false; // must be false to allow preventDefault

    const wrapped = (evt: Event) => {
      try {
        const e = evt as WheelEvent;
        const shouldConsume = handler(e);
        if (shouldConsume) {
          // Apply consumption semantics
          try {
            e.preventDefault();
          } catch (err) {
            logger.debug('preventDefault failed (ignored)', { err });
          }
          try {
            e.stopImmediatePropagation?.();
          } catch (err) {
            logger.debug('stopImmediatePropagation failed (ignored)', { err });
          }
        }
      } catch (err) {
        logger.debug('subscribeWheelLock handler error (ignored)', { err });
      }
    };

    return this.subscribe({ target, type: 'wheel' }, wrapped, { passive, capture, context });
  }

  /** schedule a one-off read after scroll using rAF */
  scheduleAfterScroll(task: () => void): SchedulerHandle {
    return scheduleRaf(task);
  }

  private keyOf(
    target: Window | Document | HTMLElement,
    type: ScrollEventType,
    handler: unknown,
    passive: boolean,
    capture: boolean,
    context: string
  ): string {
    // avoid leaking object identity directly; use stable parts only
    const t = this.describeTarget(target);
    return `${t}|${type}|${passive}|${capture}|${context}|${this.fnId(handler)}`;
  }

  private describeTarget(target: Window | Document | HTMLElement): string {
    if (typeof Window !== 'undefined' && target instanceof Window) return 'win';
    if (typeof Document !== 'undefined' && target instanceof Document) return 'doc';
    if ((target as HTMLElement).dataset) {
      const el = target as HTMLElement;
      const role = el.getAttribute('data-xeg-role') ?? el.getAttribute('data-xeg-role-compat');
      return `el#${el.id || ''}.${el.className || ''}[role=${role || ''}]`;
    }
    return 'unknown';
  }

  private fnId(handler: unknown): string {
    const fn = handler as { name?: string };
    return fn && typeof fn.name === 'string' && fn.name ? fn.name : 'anon';
  }
}

export const scrollEventHub = new ScrollEventHub();
