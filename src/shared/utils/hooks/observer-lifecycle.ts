/**
 * @fileoverview Observer Lifecycle Management Utilities
 * @description Phase 350: Common observer pattern abstraction
 *
 * Manages lifecycle of IntersectionObserver, MutationObserver, ResizeObserver.
 * - Creation (create)
 * - Start observation (observe)
 * - Cleanup (cleanup/disconnect)
 *
 * @module shared/utils/hooks/observer-lifecycle
 */

import { logger } from '@shared/logging';

/**
 * Observer type
 */
export type ObserverType = 'intersection' | 'mutation' | 'resize';

/**
 * Managed Observer interface
 */
export interface ManagedObserver<T extends ObserverType> {
  /** Observer instance */
  observer: T extends 'intersection'
    ? IntersectionObserver
    : T extends 'mutation'
      ? MutationObserver
      : ResizeObserver;
  /** List of targets being observed */
  targets: Set<Element>;
  /** Start observation */
  observe: (target: Element) => void;
  /** Stop observation (specific target) */
  unobserve: (target: Element) => void;
  /** Complete cleanup */
  disconnect: () => void;
  /** Check if active */
  isActive: () => boolean;
}

/**
 * IntersectionObserver creation options
 */
export interface IntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * MutationObserver creation options
 */
export interface MutationObserverOptions {
  childList?: boolean;
  subtree?: boolean;
  attributes?: boolean;
  attributeFilter?: string[];
  characterData?: boolean;
}

/**
 * ResizeObserver creation options
 */
export interface ResizeObserverOptions {
  box?: ResizeObserverBoxOptions;
}

/**
 * Create managed IntersectionObserver
 *
 * @example
 * ```typescript
 * const observer = createManagedIntersectionObserver(
 *   (entries) => {
 *     entries.forEach(entry => {
 *       console.log('Intersection:', entry.isIntersecting);
 *     });
 *   },
 *   { threshold: [0.25, 0.5, 0.75] }
 * );
 *
 * observer.observe(element);
 * // cleanup
 * observer.disconnect();
 * ```
 */
export function createManagedIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverOptions
): ManagedObserver<'intersection'> {
  const targets = new Set<Element>();

  const observer = new IntersectionObserver(callback, options);

  return {
    observer,
    targets,
    observe: (target: Element) => {
      if (targets.has(target)) {
        logger.debug('[Observer] Target already observed (IntersectionObserver)');
        return;
      }
      observer.observe(target);
      targets.add(target);
    },
    unobserve: (target: Element) => {
      if (!targets.has(target)) {
        return;
      }
      observer.unobserve(target);
      targets.delete(target);
    },
    disconnect: () => {
      observer.disconnect();
      targets.clear();
    },
    isActive: () => targets.size > 0,
  };
}

/**
 * Create managed MutationObserver
 *
 * @example
 * ```typescript
 * const observer = createManagedMutationObserver(
 *   (mutations) => {
 *     mutations.forEach(mutation => {
 *       console.log('Mutation:', mutation.type);
 *     });
 *   },
 *   { childList: true, subtree: true }
 * );
 *
 * observer.observe(container);
 * // cleanup
 * observer.disconnect();
 * ```
 */
export function createManagedMutationObserver(
  callback: MutationCallback,
  options: MutationObserverOptions = { childList: true, subtree: true }
): ManagedObserver<'mutation'> {
  const targets = new Set<Element>();

  const observer = new MutationObserver(callback);

  return {
    observer,
    targets,
    observe: (target: Element) => {
      if (targets.has(target)) {
        logger.debug('[Observer] Target already observed (MutationObserver)');
        return;
      }
      observer.observe(target, options);
      targets.add(target);
    },
    unobserve: (target: Element) => {
      // MutationObserver does not support individual unobserve
      // Disconnect and re-register other targets
      if (!targets.has(target)) {
        return;
      }
      targets.delete(target);
      observer.disconnect();
      targets.forEach(t => observer.observe(t, options));
    },
    disconnect: () => {
      observer.disconnect();
      targets.clear();
    },
    isActive: () => targets.size > 0,
  };
}

/**
 * Create managed ResizeObserver
 *
 * @example
 * ```typescript
 * const observer = createManagedResizeObserver(
 *   (entries) => {
 *     entries.forEach(entry => {
 *       console.log('Resize:', entry.contentRect);
 *     });
 *   }
 * );
 *
 * observer.observe(element);
 * // cleanup
 * observer.disconnect();
 * ```
 */
export function createManagedResizeObserver(
  callback: ResizeObserverCallback,
  options?: ResizeObserverOptions
): ManagedObserver<'resize'> {
  const targets = new Set<Element>();

  const observer = new ResizeObserver(callback);

  return {
    observer,
    targets,
    observe: (target: Element) => {
      if (targets.has(target)) {
        logger.debug('[Observer] Target already observed (ResizeObserver)');
        return;
      }
      observer.observe(target, options);
      targets.add(target);
    },
    unobserve: (target: Element) => {
      if (!targets.has(target)) {
        return;
      }
      observer.unobserve(target);
      targets.delete(target);
    },
    disconnect: () => {
      observer.disconnect();
      targets.clear();
    },
    isActive: () => targets.size > 0,
  };
}

/**
 * Observer group manager
 *
 * Manages multiple observers with one lifecycle.
 *
 * @example
 * ```typescript
 * const group = createObserverGroup();
 *
 * const intersectionObs = createManagedIntersectionObserver(/*...* /);
 * const mutationObs = createManagedMutationObserver(/*...* /);
 *
 * group.add(intersectionObs);
 * group.add(mutationObs);
 *
 * // Bulk cleanup
 * group.disconnectAll();
 * ```
 */
export function createObserverGroup() {
  const observers: Array<ManagedObserver<ObserverType>> = [];

  return {
    add: <T extends ObserverType>(observer: ManagedObserver<T>) => {
      observers.push(observer as ManagedObserver<ObserverType>);
    },
    disconnectAll: () => {
      observers.forEach(obs => obs.disconnect());
      observers.length = 0;
    },
    getActiveCount: () => {
      return observers.filter(obs => obs.isActive()).length;
    },
  };
}
