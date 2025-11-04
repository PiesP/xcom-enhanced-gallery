/**
 * @fileoverview 이벤트 범위 관리 (Scope Manager)
 * 트위터 DOM 범위 감지 및 리스너 바인딩
 */

import { logger } from '@shared/logging';
import { globalTimerManager } from '../../timer-management';
import { findTwitterScrollContainer } from '../../core-utils';
import { addListener, removeEventListenerManaged } from '../core/listener-manager';
import type { GalleryEventOptions } from '../core/event-context';

/**
 * 범위 상태 관리
 */
interface ScopeState {
  abortController: AbortController | null;
  scopeTarget: WeakRef<HTMLElement> | null;
  refreshTimer: number | null;
  listenerIds: string[];
}

let scopeState: ScopeState = {
  abortController: null,
  scopeTarget: null,
  refreshTimer: null,
  listenerIds: [],
};

/**
 * 트위터 이벤트 범위 결정
 */
export function resolveTwitterEventScope(): HTMLElement | null {
  const candidate = findTwitterScrollContainer();
  if (!candidate) return null;
  if (candidate === document.body) return null;
  if (!(candidate instanceof HTMLElement)) return null;
  return candidate;
}

/**
 * 범위별 리스너 정리
 */
export function clearScopedListeners(): void {
  scopeState.listenerIds.forEach(id => removeEventListenerManaged(id));
  scopeState.listenerIds = [];

  if (scopeState.abortController) {
    scopeState.abortController.abort();
    scopeState.abortController = null;
  }

  scopeState.scopeTarget = null;
}

/**
 * 범위 새로고침 스케줄
 */
export function scheduleScopeRefresh(ensureScope: () => void, intervalMs: number = 1000): void {
  if (scopeState.refreshTimer !== null) return;

  scopeState.refreshTimer = globalTimerManager.setInterval(() => {
    ensureScope();
  }, intervalMs);
}

/**
 * 범위 새로고침 취소
 */
export function cancelScopeRefresh(): void {
  if (scopeState.refreshTimer !== null) {
    globalTimerManager.clearInterval(scopeState.refreshTimer);
    scopeState.refreshTimer = null;
  }
}

/**
 * 범위별 리스너 바인딩
 */
export function bindScopedListeners(
  target: HTMLElement,
  keyHandler: EventListener,
  clickHandler: EventListener,
  options: GalleryEventOptions
): void {
  clearScopedListeners();

  const controller = new AbortController();
  scopeState.abortController = controller;
  scopeState.scopeTarget = new WeakRef(target);

  const listenerOptions: AddEventListenerOptions = {
    passive: false,
    capture: true,
    signal: controller.signal,
  };

  const keyId = addListener(target, 'keydown', keyHandler, listenerOptions, options.context);
  const clickId = addListener(target, 'click', clickHandler, listenerOptions, options.context);

  scopeState.listenerIds = [keyId, clickId];

  logger.debug('[ScopeManager] Listeners bound', {
    context: options.context,
    target: target.tagName,
  });
}

/**
 * 범위 대상 보장 (자동 재감지)
 */
export function ensureScopedEventTarget(
  keyHandler: EventListener,
  clickHandler: EventListener,
  options: GalleryEventOptions
): void {
  // 기존 대상이 여전히 DOM에 연결되어 있으면 유지
  const existingTarget = scopeState.scopeTarget?.deref();
  if (existingTarget?.isConnected) {
    return;
  }

  // 새로운 범위 찾기
  const scope = resolveTwitterEventScope();
  if (!scope) {
    logger.debug('[ScopeManager] Twitter scope not found, scheduling refresh');
    scheduleScopeRefresh(() => ensureScopedEventTarget(keyHandler, clickHandler, options));
    return;
  }

  // 새로운 범위로 바인딩
  cancelScopeRefresh();
  bindScopedListeners(scope, keyHandler, clickHandler, options);
}

/**
 * 범위 상태 초기화
 */
export function clearScopeState(): void {
  clearScopedListeners();
  scopeState = {
    abortController: null,
    scopeTarget: null,
    refreshTimer: null,
    listenerIds: [],
  };
}
