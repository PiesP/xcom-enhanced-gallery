/**
 * @fileoverview Observer Lifecycle Management Utilities
 * @description Phase 350: 공통 Observer 패턴 추상화
 *
 * IntersectionObserver, MutationObserver, ResizeObserver의 생명주기를 통합 관리합니다.
 * - 생성 (create)
 * - 관찰 시작 (observe)
 * - 정리 (cleanup/disconnect)
 *
 * @module shared/utils/hooks/observer-lifecycle
 */

import { logger } from '@shared/logging';

/**
 * Observer 타입
 */
export type ObserverType = 'intersection' | 'mutation' | 'resize';

/**
 * Managed Observer 인터페이스
 */
export interface ManagedObserver<T extends ObserverType> {
  /** Observer 인스턴스 */
  observer: T extends 'intersection'
    ? IntersectionObserver
    : T extends 'mutation'
      ? MutationObserver
      : ResizeObserver;
  /** 관찰 중인 타겟 목록 */
  targets: Set<Element>;
  /** 관찰 시작 */
  observe: (target: Element) => void;
  /** 관찰 중지 (특정 타겟) */
  unobserve: (target: Element) => void;
  /** 완전 정리 */
  disconnect: () => void;
  /** 활성 상태 여부 */
  isActive: () => boolean;
}

/**
 * IntersectionObserver 생성 옵션
 */
export interface IntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * MutationObserver 생성 옵션
 */
export interface MutationObserverOptions {
  childList?: boolean;
  subtree?: boolean;
  attributes?: boolean;
  attributeFilter?: string[];
  characterData?: boolean;
}

/**
 * ResizeObserver 생성 옵션
 */
export interface ResizeObserverOptions {
  box?: ResizeObserverBoxOptions;
}

/**
 * Managed IntersectionObserver 생성
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
 * Managed MutationObserver 생성
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
      // MutationObserver는 개별 unobserve 미지원
      // disconnect 후 다른 타겟 재등록
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
 * Managed ResizeObserver 생성
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
 * Observer 그룹 관리자
 *
 * 여러 Observer를 하나의 생명주기로 관리합니다.
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
 * // 일괄 정리
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
